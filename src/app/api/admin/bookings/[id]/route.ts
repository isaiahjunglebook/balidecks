import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { bookings } from "@/db/schema";
import { isAdmin } from "@/lib/guard";
import { adminDecisionSchema } from "@/lib/validation";
import { findOverlapping, BLOCKING_STATUSES } from "@/lib/availability";

export const runtime = "nodejs";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const parsed = adminDecisionSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const { action, adminNote } = parsed.data;

  const [booking] = await db
    .select()
    .from(bookings)
    .where(eq(bookings.id, id));

  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  const nextStatus =
    action === "confirm"
      ? "confirmed"
      : action === "decline"
        ? "declined"
        : "cancelled";

  // On approval, re-check there is no confirmed overlap (guards two overlapping
  // pending requests both being approved). The DB exclusion constraint is the
  // final backstop.
  if (action === "confirm") {
    const conflicts = await findOverlapping(
      booking.startDate,
      booking.endDate,
      BLOCKING_STATUSES,
      booking.id,
    );
    if (conflicts.length > 0) {
      return NextResponse.json(
        {
          error:
            "Cannot confirm — another confirmed booking already overlaps these dates.",
        },
        { status: 409 },
      );
    }
  }

  try {
    const [updated] = await db
      .update(bookings)
      .set({
        status: nextStatus,
        adminNote: adminNote ? adminNote : booking.adminNote,
        decidedAt: new Date(),
      })
      .where(eq(bookings.id, id))
      .returning();

    return NextResponse.json({ ok: true, booking: updated });
  } catch (err) {
    console.error("admin decision error", err);
    // Likely the exclusion constraint rejected an overlapping confirm.
    return NextResponse.json(
      { error: "Update failed — the dates may now conflict." },
      { status: 409 },
    );
  }
}
