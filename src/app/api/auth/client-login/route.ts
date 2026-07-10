import { NextResponse } from "next/server";
import {
  passwordMatches,
  signSession,
  cookieOptions,
  CLIENT_COOKIE,
} from "@/lib/auth";

export async function POST(req: Request) {
  let password = "";
  try {
    const body = await req.json();
    password = typeof body?.password === "string" ? body.password : "";
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const ok = await passwordMatches(password, process.env.CLIENT_PASSWORD);
  if (!ok) {
    return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
  }

  const token = await signSession("client");
  const res = NextResponse.json({ ok: true });
  res.cookies.set(CLIENT_COOKIE, token, cookieOptions);
  return res;
}
