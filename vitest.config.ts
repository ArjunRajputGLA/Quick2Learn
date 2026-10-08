import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    include: ["tests/**/*.test.ts"],
    exclude: ["**/node_modules/**", "**/dist/**", "e2e/**"],
    env: {
      DATABASE_URL: "postgresql://postgres:postgres@localhost:5432/quick2learn_test",
      DATABASE_URL_TEST: "postgresql://postgres:postgres@localhost:5432/quick2learn_test",
      BETTER_AUTH_URL: "http://localhost:3000",
      NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
      BETTER_AUTH_SECRET: "quick2learn_dev_secret_key_at_least_32_characters_long",
    },
    fileParallelism: false,
    alias: {
      "server-only": path.resolve(__dirname, "node_modules/server-only/empty.js"),
      "@": path.resolve(__dirname, "apps/web/src"),
      "@quick2learn/db": path.resolve(__dirname, "packages/db/src"),
      "@quick2learn/shared": path.resolve(__dirname, "packages/shared/src"),
    },
  },
});

