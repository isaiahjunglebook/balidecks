import { NextResponse } from "next/server";
import { getBlockedRanges } from "@/lib/availability";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
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
