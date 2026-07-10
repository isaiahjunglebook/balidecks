import type { Config } from "drizzle-kit";

// Migrations use the direct (unpooled) connection when available — DDL and the
// btree_gist exclusion constraint need a direct connection, not the pooler.
const migrationUrl =
  process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL ?? "";

export default {
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: migrationUrl,
  },
} satisfies Config;
