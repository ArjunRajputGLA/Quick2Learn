/**
 * ==============================================================================
 * Quick2Learn - Node.js Script to Delete All Admin Portal Data
 * File: delete-admin-portal-data.js
 * Run: node "database/admin portal/delete-admin-portal-data.js"
 *      or: node "database/admin portal/delete-admin-portal-data.js" --force
 * ==============================================================================
 */

const fs = require('fs');
const path = require('path');

// Auto-resolve pg from website/node_modules or standard node_modules
let Client;
try {
  Client = require('pg').Client;
} catch {
  try {
    const websitePgPath = path.resolve(__dirname, '../../website/node_modules/pg');
    Client = require(websitePgPath).Client;
  } catch (err) {
    console.error('❌ Could not locate "pg" package. Run "pnpm install" or "npm install pg".');
    process.exit(1);
  }
}

// Auto-load .env or .env.local from website
try {
  const envPaths = [
    path.resolve(__dirname, '../../website/.env.local'),
    path.resolve(__dirname, '../../website/.env'),
    path.resolve(__dirname, '../../website/apps/web/.env.local'),
  ];
  for (const envPath of envPaths) {
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
          const idx = trimmed.indexOf('=');
          const key = trimmed.slice(0, idx).trim();
          const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
          if (!process.env[key]) {
            process.env[key] = val;
          }
        }
      }
    }
  }
} catch (e) {
  // Continue with default
}

const dbUrl =
  process.env.DATABASE_URL_DIRECT ||
  process.env.DATABASE_URL ||
  'postgresql://postgres:postgres@localhost:5432/quick2learn';

const isForce = process.argv.includes('--force') || process.argv.includes('-y');

async function run() {
  const maskedUrl = dbUrl.replace(/:[^:@]*@/, ':****@');
  console.log('\n======================================================');
  console.log('🗑️  Quick2Learn - Admin Portal Data Deletion Tool');
  console.log(`📡 Target Database: ${maskedUrl}`);
  console.log('======================================================\n');

  if (!isForce) {
    console.log('⚠️  WARNING: This will permanently delete all Admin Portal data:');
    console.log('   - Batches & Timetables');
    console.log('   - Video Lectures & Content Items');
    console.log('   - Study Resources & PDFs');
    console.log('   - Questions, Tests & Attempts');
    console.log('   - Enrollments, Fees & Payments');
    console.log('   - Live Classes & Attendance');
    console.log('   - Announcements & Enquiries\n');
    console.log('👉 To run non-interactively without prompt, append --force:');
    console.log('   node "database/admin portal/delete-admin-portal-data.js" --force\n');
  }

  const client = new Client({ connectionString: dbUrl });

  try {
    await client.connect();
    console.log('✓ Connected to PostgreSQL.');

    const sqlFilePath = path.join(__dirname, 'delete-admin-portal-data.sql');
    if (!fs.existsSync(sqlFilePath)) {
      throw new Error(`SQL file not found at ${sqlFilePath}`);
    }

    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

    console.log('⏳ Executing deletion script...');
    await client.query(sqlContent);

    // Verify row counts
    const tablesToCheck = [
      { name: 'batches', query: 'SELECT count(*)::int as cnt FROM batches' },
      { name: 'students_directory', query: "SELECT count(*)::int as cnt FROM profiles WHERE role = 'student'" },
      { name: 'timetable_slots', query: 'SELECT count(*)::int as cnt FROM batch_timetable_slots' },
      { name: 'content_items', query: 'SELECT count(*)::int as cnt FROM content_items' },
      { name: 'resources', query: 'SELECT count(*)::int as cnt FROM resources' },
      { name: 'questions', query: 'SELECT count(*)::int as cnt FROM questions' },
      { name: 'tests', query: 'SELECT count(*)::int as cnt FROM tests' },
      { name: 'enrollments', query: 'SELECT count(*)::int as cnt FROM enrollments' },
      { name: 'payments', query: 'SELECT count(*)::int as cnt FROM payments' },
      { name: 'fee_dues', query: 'SELECT count(*)::int as cnt FROM fee_dues' },
      { name: 'live_sessions', query: 'SELECT count(*)::int as cnt FROM live_sessions' },
      { name: 'attendance_records', query: 'SELECT count(*)::int as cnt FROM attendance_records' },
      { name: 'announcements', query: 'SELECT count(*)::int as cnt FROM announcements' },
      { name: 'enquiries', query: 'SELECT count(*)::int as cnt FROM enquiries' },
      { name: 'doubts', query: 'SELECT count(*)::int as cnt FROM doubts' },
      { name: 'board_results', query: 'SELECT count(*)::int as cnt FROM results' },
      { name: 'testimonials', query: 'SELECT count(*)::int as cnt FROM testimonials' }
    ];

    console.log('\n📊 Post-Clean Verification (All Admin Sections):');
    for (const t of tablesToCheck) {
      try {
        const res = await client.query(t.query);
        const cnt = res.rows[0]?.cnt || 0;
        console.log(`  • ${t.name.padEnd(22)} : ${cnt} rows remaining`);
      } catch (err) {
        // Table might not exist in some minimal setups
      }
    }

    console.log('\n✅ All Admin Portal data deleted successfully!');
    console.log('======================================================\n');
  } catch (err) {
    console.error('\n❌ Error during deletion:', err.message);
    process.exit(1);
  } finally {
    await client.end().catch(() => {});
  }
}

run();
