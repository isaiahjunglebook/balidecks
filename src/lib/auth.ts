import { SignJWT, jwtVerify } from "jose";

// Two-tier auth. Passwords are compared against env vars (no user table).
// Sessions are signed JWTs stored in httpOnly cookies. Everything here is
// edge-runtime safe (jose + Web Crypto only) so it can be used in middleware.

export type Role = "client" | "admin";

export const CLIENT_COOKIE = "bali_client";
export const ADMIN_COOKIE = "bali_admin";

const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

function getSecret(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error("SESSION_SECRET is not set or too short");
  }
  return new TextEncoder().encode(secret);
}

export async function signSession(role: Role): Promise<string> {
  return new SignJWT({ role })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(getSecret());
}

export async function verifySession(
  token: string | undefined,
  expectedRole: Role,
): Promise<boolean> {
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload.role === expectedRole;
  } catch {
    return false;
  }
}

/**
 * Constant-time-ish password comparison. We hash both sides with SHA-256 and
 * compare the digests, so the comparison time does not leak the password
 * length or content. Works on the edge runtime via Web Crypto.
 */
export async function passwordMatches(
  submitted: string,
  expected: string | undefined,
): Promise<boolean> {
  if (!expected) return false;
  const enc = new TextEncoder();
  const [a, b] = await Promise.all([
    crypto.subtle.digest("SHA-256", enc.encode(submitted)),
    crypto.subtle.digest("SHA-256", enc.encode(expected)),
  ]);
  const av = new Uint8Array(a);
  const bv = new Uint8Array(b);
  if (av.length !== bv.length) return false;
  let diff = 0;
  for (let i = 0; i < av.length; i++) {
    diff |= av[i] ^ bv[i];
  }
  return diff === 0;
}

export const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: SESSION_TTL_SECONDS,
};
