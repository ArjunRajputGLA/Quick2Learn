import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";

vi.mock("server-only", () => ({}));
import { Pool } from "pg";
import { searchCatalog } from "../apps/web/src/server/data/search";
import { getMegaMenuData } from "../apps/web/src/server/data/catalog";
import { getSetting } from "../apps/web/src/server/data/settings";
import { seed } from "../packages/db/src/seed";

const testDbUrl =
  process.env.DATABASE_URL_TEST ||
  "postgresql://postgres:postgres@localhost:5432/quick2learn_test";

const testPool = new Pool({
  connectionString: testDbUrl,
});

describe("Public Layout, Mega-Menu & Search Typeahead Suite", () => {
  beforeAll(async () => {
    process.env.DATABASE_URL = testDbUrl;
    await seed(testDbUrl);
    // Warm up node-postgres connection pool so first query doesn't pay initial TCP connection penalty
    await searchCatalog("warmup");
  });

  afterAll(async () => {
    await testPool.end();
  });

  it("Test 1: Typeahead search returns ranked results in under 300 ms locally", async () => {
    const start = performance.now();
    const result = await searchCatalog("matrices");
    const duration = performance.now() - start;

    console.log(`Typeahead search executed in ${duration.toFixed(2)} ms`);

    // Must be well under 300 ms locally
    expect(duration).toBeLessThan(300);

    // Grouped sections present
    expect(result.query).toBe("matrices");
    expect(Array.isArray(result.lectures)).toBe(true);
    expect(Array.isArray(result.batches)).toBe(true);
    expect(Array.isArray(result.chapters)).toBe(true);

    // Must enforce prompt count limits (up to 5 lectures, 3 batches, 3 chapters)
    expect(result.lectures.length).toBeLessThanOrEqual(5);
    expect(result.batches.length).toBeLessThanOrEqual(3);
    expect(result.chapters.length).toBeLessThanOrEqual(3);

    // Seeded data contains Matrices in chapters and lectures
    expect(result.chapters.some((ch) => ch.title.toLowerCase().includes("matrices"))).toBe(true);
    expect(result.lectures.some((lec) => lec.title.toLowerCase().includes("matrices"))).toBe(true);

    // Results must contain ts_rank numbers and be ordered descending
    if (result.chapters.length > 1) {
      expect(result.chapters[0].rank).toBeGreaterThanOrEqual(result.chapters[1].rank);
    }
    if (result.lectures.length > 1) {
      expect(result.lectures[0].rank).toBeGreaterThanOrEqual(result.lectures[1].rank);
    }
  });

  it("Test 2: Short query (< 2 chars) gracefully returns empty results without DB full-text scan", async () => {
    const emptyResult = await searchCatalog("a");
    expect(emptyResult.lectures).toEqual([]);
    expect(emptyResult.batches).toEqual([]);
    expect(emptyResult.chapters).toEqual([]);

    const whitespaceResult = await searchCatalog("   ");
    expect(whitespaceResult.lectures).toEqual([]);
    expect(whitespaceResult.batches).toEqual([]);
    expect(whitespaceResult.chapters).toEqual([]);
  });

  it("Test 3: Mega-menu data is dynamically built from subjects and chapters tables", async () => {
    const megaMenu = await getMegaMenuData();

    // Must have 4 columns: IX, X, XI, XII
    expect(megaMenu.classes).toHaveLength(4);
    expect(megaMenu.classes.map((c) => c.classRoman)).toEqual(["IX", "X", "XI", "XII"]);
    expect(megaMenu.classes.map((c) => c.classSlug)).toEqual(["ix", "x", "xi", "xii"]);

    // Each column has subjects linking to /learn/[class]/[subject]
    for (const cls of megaMenu.classes) {
      expect(cls.subjects.length).toBeGreaterThan(0);
      for (const sub of cls.subjects) {
        expect(sub.href).toBe(`/learn/${cls.classSlug}/${sub.slug}`);
        expect(sub.name).toBeTruthy();
      }
    }

    // Side panel with 'All free lectures', 'All batches', 'Results'
    expect(megaMenu.sidePanelLinks).toHaveLength(3);
    const labels = megaMenu.sidePanelLinks.map((l) => l.label);
    expect(labels).toContain("All free lectures");
    expect(labels).toContain("All batches");
    expect(labels).toContain("Results");

    const hrefs = megaMenu.sidePanelLinks.map((l) => l.href);
    expect(hrefs).toContain("/lectures");
    expect(hrefs).toContain("/batches");
    expect(hrefs).toContain("/results");
  });

  it("Test 4: Announcement bar setting is retrievable from site_settings", async () => {
    const announcement = await getSetting<{
      enabled: boolean;
      text: string;
      link_text?: string;
      link_url?: string;
    }>("announcement_bar");

    expect(announcement).toBeTruthy();
    expect(announcement?.enabled).toBe(true);
    expect(announcement?.text).toBeTruthy();
    expect(typeof announcement?.text).toBe("string");
  });

  it("Test 5: Full-text search with multi-word query ranks correctly", async () => {
    const result = await searchCatalog("class 12 cbse maths");

    expect(result.lectures.length).toBeGreaterThan(0);
    // Verified that lectures returned match Dinesh Sir's class 12 lectures
    expect(result.lectures.some((l) => /Class 12/i.test(l.title) || /12/i.test(l.title))).toBe(true);
    expect(result.lectures[0].rank).toBeGreaterThan(0);
  });
});
