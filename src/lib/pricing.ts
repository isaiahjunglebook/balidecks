// Pure pricing logic. Safe to import on both client and server (no Node/DB deps).
// All money is in integer cents to avoid floating-point drift.
//
// FLAT PRICING — one nightly rate, every night of the year, plus duration
// packages that replace the per-night math for longer stays:
//
//   Nightly            → $350
//   Weekly  (7 nights) → $1,500
//   Monthly (30 nights)→ $4,000
//
// A stay is never charged more than a longer package that fully covers it
// (e.g. 29 nights bill as 1 month, not 4 weeks + a night). The estimate is
// advisory — the owner confirms the final price offline.
//
// THE RATCHET (manual, by design): every 5 completed bookings raise
// `baseNightlyCents` by +20%. Say the new price out loud first — if it comes
// out smooth, it's still too low. Stop raising only when a raise visibly
// kills the booking rate.

export const PRICING = {
  currency: "USD" as const,
  baseNightlyCents: 350_00, // [RATCHETS] — see note above
  weeklyCents: 1_500_00, // 7 nights, prepaid, single location
  monthlyCents: 4_000_00, // 30 nights, prepaid, single location
  depositCents: 2_500_00, // refundable damage deposit (~25% of replacement)
} as const;

export const DEPOSIT_CENTS = PRICING.depositCents;

export type PricingTier = "day" | "week" | "month"; // DB label for a booking

export type LineUnit = "month" | "week" | "night";

export interface PriceBreakdownLine {
  unit: LineUnit;
  count: number;
  rateCents: number;
  subtotalCents: number;
}

export interface PriceEstimate {
  days: number; // inclusive day count
  priceCents: number;
  breakdown: PriceBreakdownLine[];
  depositCents: number;
}

export const LINE_LABELS: Record<LineUnit, string> = {
  month: "month (30 nights)",
  week: "week (7 nights)",
  night: "night",
};

// ---------------------------------------------------------------------------
// Date helpers
// ---------------------------------------------------------------------------

function parseUtc(input: string): Date {
  const [y, m, d] = input.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
}

/**
 * Inclusive number of calendar days between two `yyyy-MM-dd` strings.
 * e.g. 2026-06-01 .. 2026-06-07 => 7.
 */
export function inclusiveDays(start: string, end: string): number {
  const a = parseUtc(start).getTime();
  const b = parseUtc(end).getTime();
  return Math.round((b - a) / 86_400_000) + 1;
}

// ---------------------------------------------------------------------------
// Quote engine
// ---------------------------------------------------------------------------

function line(
  unit: LineUnit,
  count: number,
  rateCents: number,
): PriceBreakdownLine {
  return { unit, count, rateCents, subtotalCents: count * rateCents };
}

function sum(lines: PriceBreakdownLine[]): number {
  return lines.reduce((acc, l) => acc + l.subtotalCents, 0);
}

function cheapest(candidates: PriceBreakdownLine[][]): PriceBreakdownLine[] {
  return candidates.reduce((best, c) => (sum(c) < sum(best) ? c : best));
}

/**
 * Decompose a night count into the cheapest breakdown: nightly under 7,
 * weekly/monthly packages beyond, rounding up to a longer package whenever
 * that is cheaper.
 */
function decompose(days: number): PriceBreakdownLine[] {
  if (days <= 0) return [];

  if (days < 7) {
    return [line("night", days, PRICING.baseNightlyCents)];
  }

  if (days < 30) {
    const floorWeeks = Math.floor(days / 7);
    const candidates: PriceBreakdownLine[][] = [
      // floor weeks + remainder priced on its own
      [
        line("week", floorWeeks, PRICING.weeklyCents),
        ...decompose(days - floorWeeks * 7),
      ],
      // round up to whole weeks covering everything
      [line("week", Math.ceil(days / 7), PRICING.weeklyCents)],
      // a single month covers up to 30 nights
      [line("month", 1, PRICING.monthlyCents)],
    ];
    return cheapest(candidates);
  }

  const floorMonths = Math.floor(days / 30);
  const candidates: PriceBreakdownLine[][] = [
    [
      line("month", floorMonths, PRICING.monthlyCents),
      ...decompose(days - floorMonths * 30),
    ],
    [line("month", Math.ceil(days / 30), PRICING.monthlyCents)],
  ];
  return cheapest(candidates);
}

export function priceForDays(days: number): PriceEstimate {
  const breakdown = decompose(days);
  return {
    days: Math.max(0, days),
    priceCents: sum(breakdown),
    breakdown,
    depositCents: PRICING.depositCents,
  };
}

/** Estimate the price for an inclusive `yyyy-MM-dd` date range. */
export function estimatePrice(start: string, end: string): PriceEstimate {
  return priceForDays(inclusiveDays(start, end));
}

/** The dominant tier for a range — used to label the booking record. */
export function dominantTier(days: number): PricingTier {
  if (days >= 30) return "month";
  if (days >= 7) return "week";
  return "day";
}

export function formatUsd(cents: number): string {
  const whole = cents % 100 === 0;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: whole ? 0 : 2,
  }).format(cents / 100);
}
