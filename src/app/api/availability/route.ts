import { NextResponse } from "next/server";
import { getBlockedRanges } from "@/lib/availability";
import { hasDatabase } from "@/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  // No database attached yet — show an open calendar instead of erroring.
  if (!hasDatabase()) {
    return NextResponse.json({ ranges: [], degraded: true });
  }
  try {
    const ranges = await getBlockedRanges();
    return NextResponse.json({ ranges });
  } catch (err) {
    console.error("availability error", err);
    return NextResponse.json(
      { error: "Could not load availability" },
      { status: 500 },
    );
  }
}
