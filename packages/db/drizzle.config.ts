import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

dotenv.config({ path: "../../apps/web/.env.local" });
dotenv.config();

export default defineConfig({
  schema: "./src/schema/index.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url:
      process.env.DATABASE_URL_DIRECT ||
      process.env.DATABASE_URL ||
      "postgresql://postgres:postgres@localhost:5432/quick2learn",
  },
});
