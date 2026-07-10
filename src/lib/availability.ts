import { and, lte, gte, inArray, ne } from "drizzle-orm";
import { db } from "@/db";
import { bookings, type Booking } from "@/db/schema";

// Only these statuses occupy the calendar.
export const BLOCKING_STATUSES = ["confirmed"] as const;
// On submit we also soft-hold overlapping pending requests so two clients
// don't race for the same dates.
export const SOFT_HOLD_STATUSES = ["confirmed", "pending"] as const;

export interface BlockedRange {
  start: string;
  end: string;
  status: Booking["status"];
}

/** Ranges the public calendar should disable (confirmed bookings). */
export async function getBlockedRanges(): Promise<BlockedRange[]> {
  const rows = await db
    .select({
      start: bookings.startDate,
      end: bookings.endDate,
      status: bookings.status,
    })
    .from(bookings)
    .where(inArray(bookings.status, [...BLOCKING_STATUSES]));

  return rows.map((r) => ({ start: r.start, end: r.end, status: r.status }));
}

/**
 * Returns bookings (in the given statuses) that overlap the inclusive range.
 * Overlap: existing.start <= reqEnd AND existing.end >= reqStart.
 * `excludeId` skips a specific booking (e.g. the one being approved).
 */
export async function findOverlapping(
  start: string,
  end: string,
  statuses: readonly Booking["status"][],
  excludeId?: string,
): Promise<Booking[]> {
  const overlap = and(
    inArray(bookings.status, [...statuses]),
    lte(bookings.startDate, end),
    gte(bookings.endDate, start),
  );
  const where = excludeId
    ? and(overlap, ne(bookings.id, excludeId))
    : overlap;

  return db.select().from(bookings).where(where);
}
