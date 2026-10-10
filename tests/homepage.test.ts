import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";

vi.mock("server-only", () => ({}));



import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq } from "drizzle-orm";
import * as schema from "../packages/db/src/schema";
import { seed } from "../packages/db/src/seed";
import { submitEnquiryAction } from "../apps/web/src/server/enquiry-actions";
import {
  getCachedSiteSettings,
  getCachedLatestVideo,
  getCachedPopularVideos,
  getCachedOpenBatches,
  getCachedPickYourClassData,
  getCachedFacultyList,
  getCachedResults,
  getCachedTestimonials,
} from "../apps/web/src/server/data/cached-home";

const testDbUrl =
  process.env.DATABASE_URL_TEST ||
  "postgresql://postgres:postgres@localhost:5432/quick2learn_test";

const testPool = new Pool({
  connectionString: testDbUrl,
});

const testDb = drizzle(testPool, { schema });


describe("Marketing Homepage & Enquiry Server Action Suite", () => {
  beforeAll(async () => {
    process.env.DATABASE_URL = testDbUrl;
    await seed(testDbUrl);
  });

  afterAll(async () => {
    await testPool.end();
  });

  it("Test 1: Cached site_settings returns all required homepage configurations", async () => {
    const settings = await getCachedSiteSettings();

    expect(settings).toBeDefined();
    expect(settings.hero).toBeDefined();
    expect((settings.hero as any).headline).toContain("Maths made quick and easy");
    expect((settings.hero as any).primary_cta_text).toContain("Join for Free");

    expect(settings.hero_tiles).toBeDefined();
    expect((settings.hero_tiles as any).badge_new_lecture).toBeDefined();

    expect(Array.isArray(settings.achievements)).toBe(true);
    expect((settings.achievements as any[]).length).toBeGreaterThanOrEqual(4);

    expect(Array.isArray(settings.popular_topics)).toBe(true);
    expect((settings.popular_topics as any[]).length).toBeGreaterThanOrEqual(4);

    expect(Array.isArray(settings.what_brings_you_here)).toBe(true);
    expect((settings.what_brings_you_here as any[]).length).toBe(4);

    expect(settings.headline_result).toBeDefined();
    expect((settings.headline_result as any).value).toBe("98.4%");

    expect(Array.isArray(settings.faqs)).toBe(true);
    expect((settings.faqs as any[]).length).toBeGreaterThanOrEqual(4);

    expect(settings.closing_band).toBeDefined();
  });

  it("Test 2: Cached videos return latest lecture, most watched, and board exam prep", async () => {
    const latest = await getCachedLatestVideo();
    expect(latest).toBeDefined();
    expect(latest?.id).toBeDefined();
    expect(latest?.title).toBeDefined();
    expect(latest?.thumbnailUrl).toBeDefined();
    expect(latest?.duration).toMatch(/\d+m/);

    const popularLatest = await getCachedPopularVideos("latest", 6);
    expect(popularLatest.length).toBeGreaterThanOrEqual(3);

    const mostWatched = await getCachedPopularVideos("most_watched", 6);
    expect(mostWatched.length).toBeGreaterThanOrEqual(3);

    const boardPrep = await getCachedPopularVideos("board_exam", 6);
    expect(boardPrep.length).toBeGreaterThanOrEqual(3);
  });

  it("Test 3: Cached open batches returns only status=open batches with INR pricing", async () => {
    const openBatches = await getCachedOpenBatches();
    expect(openBatches.length).toBeGreaterThanOrEqual(3);

    for (const b of openBatches) {
      expect(b.admissionsOpen).toBe(true);
      expect(b.pricePaise).toBeGreaterThan(0);
      expect(b.facultyName).toBeDefined();
      expect(b.schedule).toBeDefined();
      expect(b.slug).toBeDefined();
    }
  });

  it("Test 4: Pick your class returns structured subjects for Classes IX–XII across CBSE and ICSE", async () => {
    const classData = await getCachedPickYourClassData();

    expect(classData.IX).toBeDefined();
    expect(classData.X).toBeDefined();
    expect(classData.XI).toBeDefined();
    expect(classData.XII).toBeDefined();

    expect(classData.XII.cbse.length).toBeGreaterThanOrEqual(2);
    expect(classData.X.icse.length).toBeGreaterThanOrEqual(2);

    for (const sub of classData.XII.cbse) {
      expect(sub.name).toBeDefined();
      expect(sub.facultyName).toBeDefined();
      expect(sub.lectureCount).toBeGreaterThanOrEqual(1);
      expect(sub.href).toMatch(/^\/learn\/xii\//);
    }
  });

  it("Test 5: Faculty, Results, and Testimonials fetch successfully", async () => {
    const faculty = await getCachedFacultyList();
    expect(faculty.length).toBeGreaterThanOrEqual(2);
    expect(faculty.some((f) => f.slug === "dinesh-singh-rajput")).toBe(true);
    expect(faculty.some((f) => f.slug === "namita-singh-rajput")).toBe(true);

    const res = await getCachedResults();
    expect(res.length).toBeGreaterThanOrEqual(4);
    expect(res.some((r) => r.isFeatured)).toBe(true);

    const testimonials = await getCachedTestimonials();
    expect(testimonials.length).toBeGreaterThanOrEqual(3);
  });

  it("Test 6: submitEnquiryAction validates phone and creates an enquiry row in database", async () => {
    const formData = new FormData();
    formData.append("name", "Vikas Agrawal");
    formData.append("phone", "9897123456");
    formData.append("classLevel", "12");
    formData.append("board", "cbse");
    formData.append("message", "Looking for Class 12 CBSE Maths evening batch");

    const result = await submitEnquiryAction(null, formData);

    expect(result.success).toBe(true);
    expect(result.message).toContain("submitted");

    // Verify written to database
    const [enquiry] = await testDb
      .select()
      .from(schema.enquiries)
      .where(eq(schema.enquiries.phone, "9897123456"));

    expect(enquiry).toBeDefined();
    expect(enquiry.name).toBe("Vikas Agrawal");
    expect(enquiry.classLevel).toBe(12);
    expect(enquiry.board).toBe("cbse");
    expect(enquiry.status).toBe("new");
  });

  it("Test 7: submitEnquiryAction honeypot drops spam submissions silently without DB write", async () => {
    const honeypotPhone = "9897999888";
    const formData = new FormData();
    formData.append("name", "Spam Bot");
    formData.append("phone", honeypotPhone);
    formData.append("website_hp", "http://spam-link.example.com"); // Honeypot filled by bot!

    const result = await submitEnquiryAction(null, formData);

    // Returns success so bot thinks it succeeded
    expect(result.success).toBe(true);

    // Must NOT be inserted into database
    const rows = await testDb
      .select()
      .from(schema.enquiries)
      .where(eq(schema.enquiries.phone, honeypotPhone));


    expect(rows).toHaveLength(0);
  });

  it("Test 8: submitEnquiryAction returns validation errors for invalid inputs", async () => {
    const formData = new FormData();
    formData.append("name", "A"); // Too short
    formData.append("phone", "12345"); // Invalid phone

    const result = await submitEnquiryAction(null, formData);

    expect(result.success).toBe(false);
    expect(result.fieldErrors?.name).toBeDefined();
    expect(result.fieldErrors?.phone).toBeDefined();
  });
});
