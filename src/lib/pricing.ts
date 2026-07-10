// Pure pricing logic. Safe to import on both client and server (no Node/DB deps).
// All money is in integer-ish cents (prime nights are exact halves of a dollar,
// which still sum to whole cents) to avoid floating-point drift.
//
// Implements the DECKS PRICING FRAMEWORK:
//
//   NIGHTLY QUOTE (USD) = base × date_multiplier, per night
//     PRIME    (1.75×) — Fri & Sat nights in high season, NYE / Jan 1
//     STANDARD (1.0×)  — high-season weekdays, shoulder-season weekends
//     OFF-PEAK (0.8×)  — low-season weekdays
//
//   DURATION PACKAGES replace the per-night math for longer stays:
//     Weekly  (7 nights)  → $1,250
//     Monthly (30 nights) → $3,500
//
//   THE GUARDRAIL — never give away a prime Saturday inside a flat package:
//   prime nights covered by a weekly/monthly block add the prime premium
//   (base × 0.75) on top of the package price.
//
//   A stay is never charged more than a longer package that fully covers it
//   (e.g. 29 low-season nights bill as 1 month, not 5 weeks). The estimate is
//   advisory — the owner confirms the final price offline.
//
// THE RATCHET (manual, by design): every 5 completed bookings raise
// `baseNightlyCents` by +20% (250 → 300 → 360 → 432 → 520…). Say the new price
// out loud first — if it comes out smooth, it's still too low. Stop raising
// only when a raise visibly kills the booking rate.

export const PRICING = {
  currency: "USD" as const,
  baseNightlyCents: 250_00, // [RATCHETS] — see note above
  multipliers: {
    prime: 1.75,
    standard: 1.0,
    offpeak: 0.8,
  },
  // Jun–Sep + Dec–Jan (Bali high season).
  highSeasonMonths: [6, 7, 8, 9, 12, 1],
  weeklyCents: 1_250_00, // 7 nights, prepaid, single location
  monthlyCents: 3_500_00, // 30 nights, prepaid, single location
  depositCents: 1_500_00, // refundable damage deposit
} as const;

export const DEPOSIT_CENTS = PRICING.depositCents;

export type NightTier = "prime" | "standard" | "offpeak";
export type PricingTier = "day" | "week" | "month"; // DB label for a booking

export type LineUnit =
  | "month"
  | "week"
  | "night-prime"
  | "night-standard"
  | "night-offpeak"
  | "prime-premium";

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
  primeNights: number;
}

export const LINE_LABELS: Record<LineUnit, string> = {
  month: "month (30 nights)",
  week: "week (7 nights)",
  "night-prime": "prime night",
  "night-standard": "night",
  "night-offpeak": "off-peak night",
  "prime-premium": "prime-night premium",
};

// ---------------------------------------------------------------------------
// Night classification
// ---------------------------------------------------------------------------

function parseUtc(input: string): Date {
  const [y, m, d] = input.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
}

function isHighSeason(month: number): boolean {
  return (PRICING.highSeasonMonths as readonly number[]).includes(month);
}

/** NYE and New Year's Day are always prime, regardless of weekday. */
function isMarqueeDate(month: number, day: number): boolean {
  return (month === 12 && day === 31) || (month === 1 && day === 1);
}

/** Classify one calendar date (a night) into its pricing tier. */
export function classifyNight(dateStr: string): NightTier {
  const dt = parseUtc(dateStr);
  const month = dt.getUTCMonth() + 1;
  const day = dt.getUTCDate();
  const dow = dt.getUTCDay(); // 0 Sun … 5 Fri, 6 Sat
  const weekend = dow === 5 || dow === 6;
  const high = isHighSeason(month);

  if (isMarqueeDate(month, day)) return "prime";
  if (high && weekend) return "prime";
  if (high || weekend) return "standard";
  return "offpeak";
}

export function nightRateCents(tier: NightTier): number {
  return Math.round(PRICING.baseNightlyCents * PRICING.multipliers[tier]);
}

/** Extra charged for a prime night inside a weekly/monthly package. */
export function primePremiumCents(): number {
  return nightRateCents("prime") - PRICING.baseNightlyCents;
}

// ---------------------------------------------------------------------------
// Date helpers
// ---------------------------------------------------------------------------

/**
 * Inclusive number of calendar days between two `yyyy-MM-dd` strings.
 * e.g. 2026-06-01 .. 2026-06-07 => 7.
 */
export function inclusiveDays(start: string, end: string): number {
  const a = parseUtc(start).getTime();
  const b = parseUtc(end).getTime();
  return Math.round((b - a) / 86_400_000) + 1;
}

/** Every date in the inclusive range as `yyyy-MM-dd` strings. */
export function listDates(start: string, end: string): string[] {
  const out: string[] = [];
  const cursor = parseUtc(start);
  const endTime = parseUtc(end).getTime();
  while (cursor.getTime() <= endTime) {
    const y = cursor.getUTCFullYear();
    const m = String(cursor.getUTCMonth() + 1).padStart(2, "0");
    const d = String(cursor.getUTCDate()).padStart(2, "0");
    out.push(`${y}-${m}-${d}`);
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return out;
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

function countPrime(dates: string[]): number {
  return dates.filter((d) => classifyNight(d) === "prime").length;
}

/** Pure per-night lines, grouped by tier (prime, standard, off-peak). */
function nightLines(dates: string[]): PriceBreakdownLine[] {
  const order: NightTier[] = ["prime", "standard", "offpeak"];
  const counts: Record<NightTier, number> = {
    prime: 0,
    standard: 0,
    offpeak: 0,
  };
  for (const d of dates) counts[classifyNight(d)]++;
  return order
    .filter((t) => counts[t] > 0)
    .map((t) => line(`night-${t}` as LineUnit, counts[t], nightRateCents(t)));
}

/** Prime-premium line for prime nights covered by package blocks (guardrail). */
function premiumLines(coveredDates: string[]): PriceBreakdownLine[] {
  const primes = countPrime(coveredDates);
  return primes > 0
    ? [line("prime-premium", primes, primePremiumCents())]
    : [];
}

function cheapest(candidates: PriceBreakdownLine[][]): PriceBreakdownLine[] {
  return candidates.reduce((best, c) => (sum(c) < sum(best) ? c : best));
}

/**
 * Decompose an ordered list of night dates into the cheapest breakdown that
 * respects the framework: nightly under 7, weekly/monthly packages beyond,
 * prime premiums on package-covered prime nights, and round-up-to-a-longer-
 * package whenever that is cheaper.
 */
function decompose(dates: string[]): PriceBreakdownLine[] {
  const d = dates.length;
  if (d === 0) return [];

  if (d < 7) return nightLines(dates);

  if (d < 30) {
    const floorWeeks = Math.floor(d / 7);
    const covered = dates.slice(0, floorWeeks * 7);
    const remainder = dates.slice(floorWeeks * 7);

    const candidates: PriceBreakdownLine[][] = [
      // floor weeks + remainder priced on its own
      [
        line("week", floorWeeks, PRICING.weeklyCents),
        ...premiumLines(covered),
        ...decompose(remainder),
      ],
      // round up to whole weeks covering everything
      [
        line("week", Math.ceil(d / 7), PRICING.weeklyCents),
        ...premiumLines(dates),
      ],
      // a single month covers up to 30 nights
      [line("month", 1, PRICING.monthlyCents), ...premiumLines(dates)],
    ];
    return cheapest(candidates);
  }

  const floorMonths = Math.floor(d / 30);
  const covered = dates.slice(0, floorMonths * 30);
  const remainder = dates.slice(floorMonths * 30);

  const candidates: PriceBreakdownLine[][] = [
    [
      line("month", floorMonths, PRICING.monthlyCents),
      ...premiumLines(covered),
      ...decompose(remainder),
    ],
    [
      line("month", Math.ceil(d / 30), PRICING.monthlyCents),
      ...premiumLines(dates),
    ],
  ];
  return cheapest(candidates);
}

/** Estimate the price for an inclusive `yyyy-MM-dd` date range. */
export function estimatePrice(start: string, end: string): PriceEstimate {
  const dates = listDates(start, end);
  const breakdown = decompose(dates);
  return {
    days: dates.length,
    priceCents: sum(breakdown),
    breakdown,
    depositCents: PRICING.depositCents,
    primeNights: countPrime(dates),
  };
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
