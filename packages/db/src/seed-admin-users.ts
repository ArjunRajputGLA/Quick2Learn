import { Pool } from "pg";
import * as dotenv from "dotenv";
dotenv.config();

const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    "postgresql://postgres:postgres@localhost:5432/quick2learn",
});

async function main() {
  console.log("Seeding admin and teacher users...");

  // 1. Admin: Dinesh Singh Rajput
  await pool.query(`
    INSERT INTO "user" (id, name, email, email_verified, created_at, updated_at)
    VALUES ('usr-admin-dinesh', 'Dinesh Singh Rajput', 'admin@quick2learn.in', true, now(), now())
    ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, name = EXCLUDED.name;
  `);

  await pool.query(`
    INSERT INTO "profiles" (id, user_id, full_name, role, class_level, board, school, city, created_at, updated_at)
    VALUES (
      'a0000000-0000-0000-0000-000000000099',
      'usr-admin-dinesh',
      'Dinesh Singh Rajput',
      'admin',
      12,
      'cbse',
      'Quick2Learn Mathura',
      'Mathura',
      now(),
      now()
    )
    ON CONFLICT (user_id) DO UPDATE SET role = 'admin', full_name = EXCLUDED.full_name;
  `);

  // 2. Teacher: Mrs. Namita Singh Rajput
  await pool.query(`
    INSERT INTO "user" (id, name, email, email_verified, created_at, updated_at)
    VALUES ('usr-teacher-namita', 'Mrs. Namita Singh Rajput', 'teacher@quick2learn.in', true, now(), now())
    ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, name = EXCLUDED.name;
  `);

  await pool.query(`
    INSERT INTO "profiles" (id, user_id, full_name, role, class_level, board, school, city, created_at, updated_at)
    VALUES (
      'a0000000-0000-0000-0000-000000000098',
      'usr-teacher-namita',
      'Mrs. Namita Singh Rajput',
      'teacher',
      10,
      'cbse',
      'Quick2Learn Mathura',
      'Mathura',
      now(),
      now()
    )
    ON CONFLICT (user_id) DO UPDATE SET role = 'teacher', full_name = EXCLUDED.full_name;
  `);

  console.log("Admin and teacher users seeded successfully!");
  await pool.end();
}

main().catch(console.error);
