import { cookies } from "next/headers";
import { verifySession, ADMIN_COOKIE } from "@/lib/auth";

/**
 * Defense-in-depth admin check for route handlers and server components.
 * Middleware already gates these paths, but we re-verify at the data layer.
 */
export async function isAdmin(): Promise<boolean> {
  const store = await cookies();
  return verifySession(store.get(ADMIN_COOKIE)?.value, "admin");
}
