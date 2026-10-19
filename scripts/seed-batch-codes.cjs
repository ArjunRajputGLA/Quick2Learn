const { Client } = require('pg');

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function genCode() {
  let s = '';
  for (let i = 0; i < 6; i++) {
    s += CHARS.charAt(Math.floor(Math.random() * CHARS.length));
  }
  return s;
}

async function run() {
  for (const dbName of ['quick2learn', 'quick2learn_test']) {
    const client = new Client({ connectionString: 'postgresql://postgres:postgres@localhost:5432/' + dbName });
    await client.connect();
    const { rows } = await client.query('SELECT id, slug, join_code FROM batches');
    for (const b of rows) {
      if (!b.join_code) {
        const code = genCode();
        await client.query('UPDATE batches SET join_code = $1, academic_year = $2 WHERE id = $3', [code, '2026-27', b.id]);
        console.log(`[${dbName}] Assigned join_code=${code} to batch=${b.slug}`);
      }
    }
    await client.end();
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
