const { Pool } = require("pg");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.resolve(__dirname, "../.env") });
dotenv.config({ path: path.resolve(__dirname, "../apps/web/.env.local") });

const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://postgres:postgres@localhost:5432/quick2learn";

async function main() {
  const pool = new Pool({ connectionString });
  try {
    const res = await pool.query(
      "SELECT key, value FROM site_settings WHERE key = 'contact'"
    );
    console.log("Current contact setting in DB:", res.rows[0]?.value);

    const updatedValue = {
      phone: "+91 76688 75809",
      whatsapp: "+91 76688 75809",
      email: "quick2learn23203@gmail.com",
      support_hours: res.rows[0]?.value?.support_hours || "Mon–Sat 9:00 AM – 7:00 PM IST",
    };

    await pool.query(
      `INSERT INTO site_settings (key, value)
       VALUES ('contact', $1)
       ON CONFLICT (key) DO UPDATE SET value = $1, updated_at = NOW()`,
      [JSON.stringify(updatedValue)]
    );

    const check = await pool.query(
      "SELECT key, value FROM site_settings WHERE key = 'contact'"
    );
    console.log("Updated contact setting in DB:", check.rows[0]?.value);
  } catch (err) {
    console.error("Error updating contact setting:", err);
  } finally {
    await pool.end();
  }
}

main();
