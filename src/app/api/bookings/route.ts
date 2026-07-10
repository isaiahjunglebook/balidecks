import { NextResponse } from "next/server";
import { db } from "@/db";
import { bookings } from "@/db/schema";
import { bookingInputSchema } from "@/lib/validation";
import { findOverlapping, SOFT_HOLD_STATUSES } from "@/lib/availability";
import { estimatePrice, dominantTier, DEPOSIT_CENTS } from "@/lib/pricing";
import { todayString } from "@/lib/dates";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const parsed = bookingInputSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }
  const input = parsed.data;

  // Reject past start dates.
  if (input.startDate < todayString()) {
    return NextResponse.json(
      { error: "Start date cannot be in the past." },
      { status: 400 },
    );
  }

  // Authoritative availability check — soft-hold against confirmed AND pending.
  const conflicts = await findOverlapping(
    input.startDate,
    input.endDate,
    SOFT_HOLD_STATUSES,
  );
  if (conflicts.length > 0) {
    return NextResponse.json(
      {
        error:
          "Sorry — those dates overlap an existing booking or a request under review. Please choose another range.",
      },
      { status: 409 },
    );
  }

  // Recompute price server-side; never trust anything from the client.
  const estimate = estimatePrice(input.startDate, input.endDate);
  const tier = dominantTier(estimate.days);

  try {
    const [row] = await db
      .insert(bookings)
      .values({
        customerName: input.customerName,
        customerEmail: input.customerEmail,
        customerPhone: input.customerPhone,
        deliveryAddress: input.deliveryAddress,
        startDate: input.startDate,
        endDate: input.endDate,
        tier,
        estimatedPriceCents: estimate.priceCents,
        depositCents: DEPOSIT_CENTS,
        status: "pending",
        notes: input.notes ? input.notes : null,
      })
      .returning({ id: bookings.id });

    return NextResponse.json({ ok: true, id: row.id }, { status: 201 });
  } catch (err) {
    console.error("booking insert error", err);
    return NextResponse.json(
      { error: "Could not save your request. Please try again." },
      { status: 500 },
    );
  }
}
