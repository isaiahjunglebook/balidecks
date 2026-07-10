// Pure pricing logic. Safe to import on both client and server (no Node/DB deps).
// All money is in integer cents to avoid floating-point drift.
//
// Model: PACKAGE TIERS (owner's stated rates are honored).
//   1–6 days   -> billed per day    ($100/day)
//   7–29 days  -> billed per week    ($1,000/week, rounded up to whole weeks)
//   30+ days   -> billed per month   ($3,000/month) + remainder priced by the
//                 same rules.
// A stay is never charged more than a single longer package that fully covers
// it (e.g. 29 days bills as 1 month = $3,000, not 5 weeks = $5,000). The
// estimate is advisory — the owner confirms the final price offline.

export const RATES = {
  DAY: 100_00, // $100 / day
  WEEK: 1_000_00, // $1,000 / week
  MONTH: 3_000_00, // $3,000 / month
} as const;

export const DEPOSIT_CENTS = 1_500_00; // $1,500 refundable deposit

export type PricingTier = "day" | "week" | "month";

export interface PriceBreakdownLine {
  unit: PricingTier;
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

function parseDay(input: string): Date {
  const [y, m, d] = input.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
}

/**
 * Inclusive number of calendar days between two `yyyy-MM-dd` strings.
 * e.g. 2026-06-01 .. 2026-06-07 => 7.
 */
export function inclusiveDays(start: string, end: string): number {
  const a = parseDay(start).getTime();
  const b = parseDay(end).getTime();
  const diff = Math.round((b - a) / 86_400_000);
  return diff + 1;
}

function line(
  unit: PricingTier,
  count: number,
  rateCents: number,
): PriceBreakdownLine {
  return { unit, count, rateCents, subtotalCents: count * rateCents };
}

function sum(lines: PriceBreakdownLine[]): number {
  return lines.reduce((acc, l) => acc + l.subtotalCents, 0);
}

/** Decompose a day count into the cheapest whole-unit package breakdown. */
function decompose(days: number): PriceBreakdownLine[] {
  if (days <= 0) return [];

  if (days <= 6) {
    return [line("day", days, RATES.DAY)];
  }

  if (days < 30) {
    const weeks = Math.ceil(days / 7);
    const weeklyLines = [line("week", weeks, RATES.WEEK)];
    // A single month covers up to 30 days — use it if strictly cheaper.
    if (RATES.MONTH < sum(weeklyLines)) {
      return [line("month", 1, RATES.MONTH)];
    }
    return weeklyLines;
  }

  // days >= 30. Compare a whole-month round-up against months + priced remainder.
  const wholeMonths = Math.ceil(days / 30);
  const roundUpLines = [line("month", wholeMonths, RATES.MONTH)];

  const fullMonths = Math.floor(days / 30);
  const remainder = days - fullMonths * 30;
  const decomposedLines = [
    line("month", fullMonths, RATES.MONTH),
    ...decompose(remainder),
  ];

  // Prefer the cleaner whole-month label on ties.
  return sum(roundUpLines) <= sum(decomposedLines)
    ? roundUpLines
    : decomposedLines;
}

export function priceForDays(days: number): PriceEstimate {
  const breakdown = decompose(days);
  return {
    days: Math.max(0, days),
    priceCents: sum(breakdown),
    breakdown,
    depositCents: DEPOSIT_CENTS,
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
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}
