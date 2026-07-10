// Plain calendar-date helpers. We keep dates as `yyyy-MM-dd` strings everywhere
// in the domain to avoid timezone/UTC off-by-one bugs. Only convert to a `Date`
// at the UI boundary (react-day-picker), and format straight back to a string.

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isValidDateString(value: string): boolean {
  if (!DATE_RE.test(value)) return false;
  const [y, m, d] = value.split("-").map(Number);
  if (m < 1 || m > 12) return false;
  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return d >= 1 && d <= daysInMonth;
}

/** Format a Date (local calendar day) as `yyyy-MM-dd`. */
export function toDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Parse a `yyyy-MM-dd` string into a local Date at midnight (for the calendar). */
export function fromDateString(value: string): Date {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** Today's calendar date as `yyyy-MM-dd` (server or client local time). */
export function todayString(): string {
  return toDateString(new Date());
}

/** True if the inclusive range [aStart,aEnd] overlaps [bStart,bEnd]. */
export function rangesOverlap(
  aStart: string,
  aEnd: string,
  bStart: string,
  bEnd: string,
): boolean {
  return aStart <= bEnd && aEnd >= bStart;
}

/** Compare two date strings; -1, 0, or 1. Lexicographic works for `yyyy-MM-dd`. */
export function compareDates(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}
