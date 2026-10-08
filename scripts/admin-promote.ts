import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { Pool } from "pg";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../apps/web/.env.local") });
dotenv.config();

const email = process.argv[2]?.trim().toLowerCase();

if (!email) {
  console.error("Usage: pnpm admin:promote <email>");
  console.error("Example: pnpm admin:promote dinesh@quick2learn.in");
  process.exit(1);
}

const connectionString =
  process.env.DATABASE_URL_DIRECT ||
  process.env.DATABASE_URL ||
  "postgresql://postgres:postgres@localhost:5432/quick2learn";

async function promote() {
  const pool = new Pool({ connectionString });
  const client = await pool.connect();

  try {
    console.log(`[admin:promote] Looking up user by email: ${email}...`);

    // 1. Find user in Better Auth "user" table
    const userRes = await client.query('SELECT id, name, email FROM "user" WHERE LOWER(email) = $1', [email]);
    let userId: string;
    let userName: string;

    if (userRes.rows.length === 0) {
      console.log(`[admin:promote] User "${email}" not found in database. Provisioning account for first admin...`);
      userId = `admin_${Date.now()}`;
      userName = email.split("@")[0];
      await client.query(
        'INSERT INTO "user" (id, name, email, email_verified, created_at, updated_at) VALUES ($1, $2, $3, true, NOW(), NOW())',
        [userId, userName, email]
      );
    } else {
      userId = userRes.rows[0].id;
      userName = userRes.rows[0].name || email.split("@")[0];
    }

    await client.query("BEGIN");

    // 2. Upsert profile with admin role
    const profileRes = await client.query(
      `INSERT INTO profiles (user_id, full_name, role, onboarded_at, created_at, updated_at)
       VALUES ($1, $2, 'admin', NOW(), NOW(), NOW())
       ON CONFLICT (user_id)
       DO UPDATE SET role = 'admin', updated_at = NOW()
       RETURNING role`,
      [userId, userName || "Administrator"]
    );

    // 3. Insert audit log record
    await client.query(
      `INSERT INTO audit_log (actor_id, action, entity, entity_id, diff, created_at, updated_at)
       VALUES ($1, 'promote_admin_cli', 'profile', $2, $3, NOW(), NOW())`,
      [
        userId,
        userId,
        JSON.stringify({
          email,
          previousRole: "student",
          newRole: "admin",
          promotedVia: "cli_script",
        }),
      ]
    );

    await client.query("COMMIT");

    console.log(`🎉 [admin:promote] Successfully promoted "${email}" (ID: ${userId}) to admin!`);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("[admin:promote] Promotion failed:", err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

promote();
