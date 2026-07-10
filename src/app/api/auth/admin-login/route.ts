import { NextResponse } from "next/server";
import {
  passwordMatches,
  signSession,
  cookieOptions,
  ADMIN_COOKIE,
} from "@/lib/auth";

export async function POST(req: Request) {
  let password = "";
  try {
    const body = await req.json();
    password = typeof body?.password === "string" ? body.password : "";
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const ok = await passwordMatches(password, process.env.ADMIN_PASSWORD);
  if (!ok) {
    return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
  }

  const token = await signSession("admin");
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, token, cookieOptions);
  return res;
}
