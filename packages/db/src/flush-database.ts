import { Pool } from "pg";
import * as dotenv from "dotenv";
dotenv.config();

const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://postgres:postgres@localhost:5432/quick2learn";

const pool = new Pool({ connectionString });

export async function flushDatabase(options: { flushCoursesAndVideos?: boolean } = {}) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    console.log("Flushing academic, batch, student, chat, enquiry, and fee data...");

    // 1. Truncate operational data
    await client.query(`
      TRUNCATE TABLE 
        doubt_messages,
        doubts,
        doubt_canned_replies,
        fee_dues,
        payments,
        enrollments,
        batch_join_requests,
        batch_timetable_slots,
        batch_chapter_links,
        batch_fee_plans,
        batches,
        announcements,
        enquiries,
        content_progress,
        content_items,
        lecture_views,
        notifications,
        parent_links,
        parent_invite_codes
      CASCADE;
    `);

    // 2. Remove student profiles and users (preserve admin and faculty)
    await client.query(`
      DELETE FROM profiles WHERE role = 'student';
    `);

    await client.query(`
      DELETE FROM "user" 
      WHERE id NOT IN (
        SELECT user_id FROM profiles WHERE role IN ('admin', 'teacher')
      ) AND email NOT IN ('admin@quick2learn.in', 'teacher@quick2learn.in', 'quick2learn23203@gmail.com');
    `);


    // 3. Optionally flush YouTube courses and videos if requested
    if (options.flushCoursesAndVideos) {
      await client.query(`
        TRUNCATE TABLE
          youtube_videos,
          youtube_playlists,
          resources,
          testimonials,
          results
        CASCADE;
      `);
      console.log("Flushed YouTube playlists, videos, resources, testimonials, and results.");
    }

    await client.query("COMMIT");
    console.log("Database flush completed successfully!");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Flush failed, transaction rolled back:", error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

if (require.main === module) {
  flushDatabase({ flushCoursesAndVideos: process.argv.includes("--all") })
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
