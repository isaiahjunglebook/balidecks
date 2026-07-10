import { NextResponse, type NextRequest } from "next/server";
import {
  verifySession,
  CLIENT_COOKIE,
  ADMIN_COOKIE,
} from "@/lib/auth";

// Edge-runtime middleware. Verifies signed cookies ONLY (jose / Web Crypto).
// It must not import the DB or any Node-only module.

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Admin area + admin APIs (except the admin login) require the admin cookie.
  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    const ok = await verifySession(
      req.cookies.get(ADMIN_COOKIE)?.value,
      "admin",
    );
    if (!ok) {
      const url = new URL("/admin/login", req.url);
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // Everything else matched below requires the client cookie.
  const ok = await verifySession(
    req.cookies.get(CLIENT_COOKIE)?.value,
    "client",
  );
  if (!ok) {
    const url = new URL("/login", req.url);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  // Gate everything except static assets, the two login pages, and auth APIs.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|login|admin/login|api/auth|.*\\.(?:png|jpg|jpeg|svg|ico|webp|gif)$).*)",
  ],
};
