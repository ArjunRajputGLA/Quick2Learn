import "server-only";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const rawConnectionString =
  process.env.DATABASE_URL ||
  "postgresql://postgres:postgres@localhost:5432/quick2learn";

const isLocal =
  rawConnectionString.includes("localhost") ||
  rawConnectionString.includes("127.0.0.1") ||
  rawConnectionString.includes("host.docker.internal");

const shouldEnableSsl =
  !isLocal ||
  rawConnectionString.includes("sslmode=require") ||
  rawConnectionString.includes("neon.tech") ||
  rawConnectionString.includes("supabase.co") ||
  rawConnectionString.includes("pooler.supabase.com");

export const pool = new Pool({
  connectionString: rawConnectionString,
  max: process.env.NODE_ENV === "production" ? 5 : 10,
  ssl: shouldEnableSsl ? { rejectUnauthorized: false } : undefined,
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 10000,
});

export const db = drizzle(pool, { schema });

export function isDatabaseConfigured(): boolean {
  if (!process.env.DATABASE_URL) {
    return process.env.NODE_ENV !== "production";
  }
  if (
    process.env.NODE_ENV === "production" &&
    (process.env.DATABASE_URL.includes("localhost") ||
      process.env.DATABASE_URL.includes("127.0.0.1"))
  ) {
    return false;
  }
  return true;
}

export type Database = typeof db;
export type DatabaseTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];
export type DatabaseExecutor = Database | DatabaseTransaction;
