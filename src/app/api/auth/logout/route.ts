import { NextResponse } from "next/server";
import { CLIENT_COOKIE, ADMIN_COOKIE } from "@/lib/auth";

export async function POST(req: Request) {
  const { searchParams } = new URL(req.url);
  const scope = searchParams.get("scope"); // "admin" | "client" | null (both)

  const res = NextResponse.json({ ok: true });
  if (scope !== "admin") res.cookies.delete(CLIENT_COOKIE);
  if (scope !== "client") res.cookies.delete(ADMIN_COOKIE);
  return res;
}
