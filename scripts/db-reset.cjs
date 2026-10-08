const { execSync } = require("child_process");
const { Client } = require("pg");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.resolve(__dirname, "../apps/web/.env.local") });
dotenv.config();

const dbUrl =
  process.env.DATABASE_URL_DIRECT ||
  process.env.DATABASE_URL ||
  "postgresql://postgres:postgres@localhost:5432/quick2learn";

console.log("[db:reset] Target database URL:", dbUrl.replace(/:[^:@]*@/, ":****@"));

// Safeguard: refuse to run unless DATABASE_URL points at localhost
const parsedUrl = new URL(dbUrl);
const hostname = parsedUrl.hostname;
if (hostname !== "localhost" && hostname !== "127.0.0.1" && hostname !== "::1") {
  console.error(`[db:reset] REFUSED: DATABASE_URL points to '${hostname}'. db:reset is only permitted on localhost.`);
  process.exit(1);
}

async function reset() {
  console.log("[db:reset] Dropping and recreating public and drizzle schemas on localhost...");
  const client = new Client({ connectionString: dbUrl });
  await client.connect();
  try {
    await client.query("DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public; DROP SCHEMA IF EXISTS drizzle CASCADE;");
    console.log("  ✓ Public and drizzle schemas reset.");
  } finally {
    await client.end();
  }

  console.log("[db:reset] Applying Drizzle migrations...");
  execSync("pnpm --filter @quick2learn/db exec drizzle-kit migrate", {
    cwd: path.resolve(__dirname, ".."),
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: dbUrl },
  });

  console.log("[db:reset] Running database seed...");
  execSync("pnpm --filter @quick2learn/db exec tsx src/seed.ts", {
    cwd: path.resolve(__dirname, ".."),
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: dbUrl },
  });

  console.log("🎉 [db:reset] Database reset, migrated, and seeded successfully!");
}

reset().catch((err) => {
  console.error("[db:reset] Error during reset:", err);
  process.exit(1);
});
