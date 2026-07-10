// Applies SQL migrations in ./drizzle in filename order, tracked in a
// __migrations table so each file runs exactly once. Uses the standard `pg`
// driver against the direct (unpooled) connection — reliable for DDL such as
// CREATE EXTENSION and the btree_gist exclusion constraint.
//
// If no database URL is configured (e.g. the very first Vercel deploy, before
// the Neon integration is attached), it logs and exits 0 so the build still
// succeeds. Once the DB is attached and the project is redeployed, migrations
// apply automatically.

import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import pg from "pg";

const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;

if (!url) {
  console.warn(
    "[migrate] No DATABASE_URL(_UNPOOLED) set — skipping migrations.",
  );
  process.exit(0);
}

const here = dirname(fileURLToPath(import.meta.url));
const migrationsDir = join(here, "..", "drizzle");

const files = readdirSync(migrationsDir)
  .filter((f) => f.endsWith(".sql"))
  .sort();

const client = new pg.Client({
  connectionString: url,
  ssl: url.includes("sslmode=disable") ? false : { rejectUnauthorized: false },
});

async function main() {
  await client.connect();
  await client.query(
    `CREATE TABLE IF NOT EXISTS __migrations (
       name text PRIMARY KEY,
       applied_at timestamptz NOT NULL DEFAULT now()
     )`,
  );

  const { rows } = await client.query("SELECT name FROM __migrations");
  const applied = new Set(rows.map((r) => r.name));

  for (const file of files) {
    if (applied.has(file)) {
      console.log(`[migrate] already applied: ${file}`);
      continue;
    }
    const sql = readFileSync(join(migrationsDir, file), "utf8").replace(
      /-->\s*statement-breakpoint/g,
      "",
    );
    console.log(`[migrate] applying: ${file}`);
    await client.query("BEGIN");
    try {
      await client.query(sql);
      await client.query("INSERT INTO __migrations (name) VALUES ($1)", [file]);
      await client.query("COMMIT");
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    }
  }
  console.log("[migrate] done.");
}

main()
  .then(() => client.end())
  .catch(async (err) => {
    console.error("[migrate] failed:", err.message);
    await client.end().catch(() => {});
    process.exit(1);
  });
