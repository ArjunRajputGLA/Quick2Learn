const { execSync } = require("child_process");

console.log("[db:down] Stopping local services...");
try {
  execSync("docker compose down", { stdio: "inherit" });
} catch {
  console.log("[db:down] Docker not available or no compose containers running.");
}
