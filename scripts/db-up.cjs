const { execSync } = require("child_process");

console.log("[db:up] Starting local infrastructure services...");

let dockerRan = false;
try {
  execSync("docker compose up -d", { stdio: "inherit" });
  dockerRan = true;
  console.log("[db:up] Docker compose services started successfully.");
} catch {
  console.log("[db:up] Notice: Docker command not available or failed. Checking local PostgreSQL host...");
}

if (!dockerRan) {
  // Check if native PostgreSQL is accessible
  try {
    const { Client } = require("pg");
    const client = new Client({
      connectionString: process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/quick2learn",
    });
    client.connect()
      .then(async () => {
        console.log("  ✓ Local PostgreSQL is running and responsive.");
        await client.end();
      })
      .catch((err) => {
        console.warn("  ! Local PostgreSQL connection warning:", err.message);
      });
  } catch {
    // pg not directly required here
  }
}
