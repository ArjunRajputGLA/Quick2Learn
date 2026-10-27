import { Pool } from "pg";
import * as dotenv from "dotenv";
dotenv.config();

const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://postgres:postgres@localhost:5432/quick2learn";

const pool = new Pool({ connectionString });

async function main() {
  const tables = [
    "batches",
    "enrollments",
    "batch_fee_plans",
    "fee_dues",
    "payments",
    "announcements",
    "enquiries",
    "batch_join_requests",
    "doubts",
    "doubt_messages",
    "doubt_canned_replies",
    "content_items",
    "content_progress",
    "resources",
    "youtube_playlists",
    "youtube_videos",
    "testimonials",
    "results",
    "lecture_views",
    "notifications",
    "profiles",
    "user",
  ];

  console.log("=== CURRENT DATABASE RECORD COUNTS ===");
  for (const t of tables) {
    try {
      const res = await pool.query(`SELECT count(*) FROM "${t}"`);
      console.log(`${t}: ${res.rows[0].count}`);
    } catch (e: any) {
      console.log(`${t}: (not found / error: ${e.message})`);
    }
  }
  await pool.end();
}

main().catch(console.error);
