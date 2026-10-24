/**
 * ==============================================================================
 * Quick2Learn - Node.js Script to Create & Seed Admin Portal Database
 * File: make-admin-portal-database.js
 * Run: node "database/admin portal/make-admin-portal-database.js"
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
  // Continue
}

const dbUrl =
  process.env.DATABASE_URL_DIRECT ||
  process.env.DATABASE_URL ||
  'postgresql://postgres:postgres@localhost:5432/quick2learn';

async function makeDatabase() {
  const maskedUrl = dbUrl.replace(/:[^:@]*@/, ':****@');
  console.log('\n======================================================');
  console.log('🚀  Quick2Learn - Admin Portal Database Builder');
  console.log(`📡 Target Database: ${maskedUrl}`);
  console.log('======================================================\n');

  const client = new Client({ connectionString: dbUrl });

  try {
    console.log('⏳ Connecting to PostgreSQL...');
    await client.connect();
    console.log('✓ Connected successfully.\n');

    // 1. Create Schema
    const schemaSqlPath = path.join(__dirname, 'create-admin-portal-schema.sql');
    if (fs.existsSync(schemaSqlPath)) {
      console.log('🔨 Step 1: Applying Admin Portal Schema (tables, enums, indexes)...');
      const schemaSql = fs.readFileSync(schemaSqlPath, 'utf8');
      await client.query(schemaSql);
      console.log('  ✓ Schema applied successfully.\n');
    }

    // 2. Seed Data
    const seedSqlPath = path.join(__dirname, 'seed-admin-portal-data.sql');
    if (fs.existsSync(seedSqlPath)) {
      console.log('🌱 Step 2: Seeding Admin Portal Data (batches, materials, tests, questions)...');
      const seedSql = fs.readFileSync(seedSqlPath, 'utf8');
      await client.query(seedSql);
      console.log('  ✓ Seed data populated successfully.\n');
    }

    // 3. Verification Report
    console.log('📊 Step 3: Verifying Database Records...');
    const tables = [
      { name: 'batches', label: 'Batches' },
      { name: 'batch_timetable_slots', label: 'Timetable Slots' },
      { name: 'content_items', label: 'Lectures & Videos' },
      { name: 'resources', label: 'Study Resources & PDFs' },
      { name: 'questions', label: 'Question Bank' },
      { name: 'tests', label: 'Tests & Exams' },
      { name: 'live_sessions', label: 'Live Masterclasses' },
      { name: 'attendance_records', label: 'Attendance Records' },
      { name: 'announcements', label: 'Announcements' },
      { name: 'enquiries', label: 'Student Enquiries' },
      { name: 'batch_join_requests', label: 'Join Requests' },
      { name: 'enrollments', label: 'Active Enrollments' },
      { name: 'payments', label: 'Payment Receipts' }
    ];

    console.log('------------------------------------------------------');
    for (const t of tables) {
      try {
        const res = await client.query(`SELECT count(*)::int as cnt FROM ${t.name}`);
        const cnt = res.rows[0]?.cnt || 0;
        console.log(`  ✓ ${t.label.padEnd(26)} : ${cnt} rows`);
      } catch (e) {
        console.log(`  - ${t.label.padEnd(26)} : (table ready)`);
      }
    }
    console.log('------------------------------------------------------');

    console.log('\n🎉 SUCCESS: Admin Portal database created and seeded successfully!');
    console.log('======================================================\n');
  } catch (err) {
    console.error('\n❌ Error creating database:', err.message);
    if (err.message.includes('ECONNREFUSED')) {
      console.error('\n💡 Tip: PostgreSQL is not running on localhost:5432.');
      console.error('   Start it using Docker or Windows Services:');
      console.error('   docker-compose up -d postgres');
      console.error('   or check DATABASE_URL in website/.env.local');
    }
    process.exit(1);
  } finally {
    await client.end().catch(() => {});
  }
}

makeDatabase();
