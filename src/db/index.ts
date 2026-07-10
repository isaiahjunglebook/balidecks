import { neon } from "@neondatabase/serverless";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-http";
import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

// Driver selection by connection string:
//   * Neon (production on Vercel) → serverless HTTP driver (no TCP pool to
//     exhaust across cold serverless invocations).
//   * Any other Postgres (local dev / self-hosted) → node-postgres pool.
// Lazy singleton so importing this module never throws at build time.
type Db = ReturnType<typeof drizzleNeon<typeof schema>>;

let _db: Db | null = null;

function isNeon(url: string): boolean {
  return url.includes("neon.tech") || url.includes("neon.build");
}

/** Whether a database is configured. Callers can degrade gracefully if not. */
export function hasDatabase(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

function getDb(): Db {
  if (_db) return _db;
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }
  if (isNeon(connectionString)) {
    const sql = neon(connectionString);
    _db = drizzleNeon(sql, { schema });
  } else {
    const pool = new Pool({ connectionString });
    // node-postgres drizzle type is structurally compatible for our queries.
    _db = drizzlePg(pool, { schema }) as unknown as Db;
  }
  return _db;
}

// Proxy forwards to the real drizzle instance on first property access.
export const db = new Proxy({} as Db, {
  get(_target, prop, receiver) {
    const instance = getDb();
    const value = Reflect.get(instance, prop, receiver);
    return typeof value === "function" ? value.bind(instance) : value;
  },
});

export { schema };
