import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import fs from "node:fs";
import path from "node:path";

vi.mock("server-only", () => ({}));

// Mock next/headers
let mockClientIp = "192.168.1.100";
vi.mock("next/headers", () => ({
  headers: vi.fn(async () => ({
    get: (key: string) => {
      if (key === "x-forwarded-for") return mockClientIp;
      if (key === "x-real-ip") return mockClientIp;
      return null;
    },
  })),
}));

// Mock next/navigation
vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
}));

import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "../packages/db/src/schema";
import { eq, desc } from "drizzle-orm";
import { seed } from "../packages/db/src/seed";
import {
  getAboutPageData,
  getFacultyProfileWithBatchesAndLectures,
  getGroupedFaqs,
  getContactPageData,
} from "../apps/web/src/server/data/catalog";
import { submitContactEnquiryAction } from "../apps/web/src/server/contact-actions";
import { getAdminEnquiriesList } from "../apps/web/src/server/data/admin";
import sitemap from "../apps/web/src/app/sitemap";

const TEST_DB_URL =
  process.env.DATABASE_URL ||
  "postgresql://postgres:postgres@localhost:5432/quick2learn_test";

describe("Trust & Policy Pages Suite", () => {
  let pool: Pool;
  let db: ReturnType<typeof drizzle>;

  beforeAll(async () => {
    pool = new Pool({ connectionString: TEST_DB_URL });
    db = drizzle(pool, { schema });
    await seed(TEST_DB_URL);
  });

  afterAll(async () => {
    await pool.end();
  });

  beforeEach(() => {
    mockClientIp = `192.168.1.${Math.floor(Math.random() * 200) + 10}`;
  });

  it("Test 1: /about data query returns Dinesh Sir's story, national awards, and faculty grid", async () => {
    const data = await getAboutPageData();

    expect(data.story).toBeDefined();
    expect(data.story.title).toContain("Story");
    expect(data.story.story).toContain("Dinesh Singh Rajput");
    expect(data.story.story).toContain("25 years");

    expect(data.channelStats).toBeDefined();
    expect(data.channelStats.handle).toBe("@Quick2Learn");
    expect(data.channelStats.youtube_url).toContain("youtube.com");

    expect(data.facultyList.length).toBeGreaterThanOrEqual(2);
    expect(data.dineshProfile).toBeDefined();
    expect(data.dineshProfile?.name).toContain("Dinesh Singh Rajput");

    // Check Dinesh Sir's achievements contain the four mandatory recognitions
    const achs = data.dineshProfile?.achievements as Array<{ title: string; description: string }>;
    const achTitles = achs.map((a) => a.title);

    expect(achTitles.some((t) => t.includes("25+ Years"))).toBe(true);
    expect(achTitles.some((t) => t.includes("Best Teacher Award 2015"))).toBe(true);
    expect(achTitles.some((t) => t.includes("Teacher Innovation Award 2019"))).toBe(true);
    expect(achTitles.some((t) => t.includes("HRD Minister"))).toBe(true);
  });

  it("Test 2: /faculty/[slug] data query retrieves profile, assigned batches, and latest lectures", async () => {
    const profile = await getFacultyProfileWithBatchesAndLectures("dinesh-singh-rajput");

    expect(profile).not.toBeNull();
    expect(profile!.faculty.name).toContain("Dinesh Singh Rajput");
    expect(profile!.faculty.designation).toBeDefined();
    expect(profile!.faculty.bio).toBeDefined();

    // Check batches mentored by Dinesh Sir
    expect(Array.isArray(profile!.batches)).toBe(true);
    expect(profile!.batches.length).toBeGreaterThanOrEqual(1);
    expect(profile!.batches[0]?.href).toContain("/batches/");

    // Check latest lectures
    expect(Array.isArray(profile!.lectures)).toBe(true);
    expect(profile!.lectures.length).toBeGreaterThanOrEqual(1);
    expect(profile!.lectures[0]?.href).toContain("/lecture/");
  });

  it("Test 3: /faq data query groups questions into Admissions, Fees, Classes, and Online access", async () => {
    const grouped = await getGroupedFaqs();

    expect(grouped["Admissions"]).toBeDefined();
    expect(grouped["Admissions"].length).toBeGreaterThanOrEqual(2);

    expect(grouped["Fees"]).toBeDefined();
    expect(grouped["Fees"].length).toBeGreaterThanOrEqual(2);

    expect(grouped["Classes"]).toBeDefined();
    expect(grouped["Classes"].length).toBeGreaterThanOrEqual(2);

    expect(grouped["Online access"]).toBeDefined();
    expect(grouped["Online access"].length).toBeGreaterThanOrEqual(2);
  });

  it("Test 4: /contact data query provides phone, WhatsApp, email, office hours, and map URL", async () => {
    const contact = await getContactPageData();

    expect(contact.phone).toBeDefined();
    expect(contact.whatsapp).toBeDefined();
    expect(contact.cleanWhatsApp).toMatch(/^\d+$/);
    expect(contact.email).toContain("@");
    expect(contact.supportHours).toBeDefined();
    expect(contact.addressLine).toBeDefined();
    expect(contact.cityState).toContain("Mathura");
    expect(contact.mapEmbedUrl).toContain("google.com/maps");
  });

  it("Test 5: Contact form submission with zod validation stores enquiry in database and appears in admin enquiries", async () => {
    const testPhone = `9897${Math.floor(Math.random() * 900000) + 100000}`;
    const testName = "Admissions Prospect Student";

    const res = await submitContactEnquiryAction({
      name: testName,
      phone: testPhone,
      classLevel: 12,
      board: "cbse",
      message: "Inquiring about Class 12 CBSE Mathematics batch timings.",
    });

    expect(res.success).toBe(true);
    expect(res.message).toContain("received");

    // Verify stored in PostgreSQL database
    const [saved] = await db
      .select()
      .from(schema.enquiries)
      .where(eq(schema.enquiries.phone, testPhone))
      .orderBy(desc(schema.enquiries.createdAt));

    expect(saved).toBeDefined();
    expect(saved.name).toBe(testName);
    expect(saved.classLevel).toBe(12);
    expect(saved.board).toBe("cbse");
    expect(saved.status).toBe("new");
    expect(saved.sourcePath).toBe("/contact");

    // Verify appears in admin list
    const adminUser = {
      id: "admin-test-id",
      email: "admin@quick2learn.in",
      name: "Admin",
      role: "admin" as const,
    };
    const adminList = await getAdminEnquiriesList(adminUser);
    expect(adminList.some((e) => e.phone === testPhone)).toBe(true);
  });

  it("Test 6: Contact form honeypot blocks automated spam submissions from reaching the database", async () => {
    const spambotPhone = `9111${Math.floor(Math.random() * 900000) + 100000}`;

    const res = await submitContactEnquiryAction({
      name: "Spam Bot",
      phone: spambotPhone,
      classLevel: 10,
      board: "cbse",
      message: "Automated SEO spam submission",
      website_hp: "I am a spam bot filling hidden inputs",
    });

    // Honeypot returns fake success to bot
    expect(res.success).toBe(true);

    // But verifies NO row was created in database
    const rows = await db
      .select()
      .from(schema.enquiries)
      .where(eq(schema.enquiries.phone, spambotPhone));

    expect(rows.length).toBe(0);
  });

  it("Test 7: Server-side rate limiting blocks rapid repeated submissions per IP and per phone", async () => {
    // Part A: Phone rate limit (max 2 per 10m)
    const phoneLimitPhone = `9998${Math.floor(Math.random() * 900000) + 100000}`;
    const phoneLimitIp = `10.0.1.${Math.floor(Math.random() * 200) + 1}`;

    // 1st request succeeds
    const res1 = await submitContactEnquiryAction(
      {
        name: "Rapid Submitter 1",
        phone: phoneLimitPhone,
        classLevel: 11,
        board: "cbse",
        message: "First enquiry",
      },
      { clientIp: phoneLimitIp }
    );
    expect(res1.success).toBe(true);

    // 2nd request succeeds (phone limit is 2)
    const res2 = await submitContactEnquiryAction(
      {
        name: "Rapid Submitter 2",
        phone: phoneLimitPhone,
        classLevel: 11,
        board: "cbse",
        message: "Second enquiry",
      },
      { clientIp: phoneLimitIp }
    );
    expect(res2.success).toBe(true);

    // 3rd request with SAME phone exceeds phone limit (2 requests per 10m)
    const res3 = await submitContactEnquiryAction(
      {
        name: "Rapid Submitter 3",
        phone: phoneLimitPhone,
        classLevel: 11,
        board: "cbse",
        message: "Third enquiry should fail due to phone rate limit",
      },
      { clientIp: phoneLimitIp }
    );
    expect(res3.success).toBe(false);
    expect(res3.error).toContain("Too many enquiries submitted for this phone number");

    // Part B: IP rate limit (max 3 per 10m) with different phones
    const dedicatedIp = `10.0.2.${Math.floor(Math.random() * 200) + 1}`;

    // IP request 1
    const ipRes1 = await submitContactEnquiryAction(
      {
        name: "IP Test 1",
        phone: `9111${Math.floor(Math.random() * 900000) + 100000}`,
        classLevel: 10,
        board: "cbse",
        message: "First enquiry for this IP",
      },
      { clientIp: dedicatedIp }
    );
    expect(ipRes1.success).toBe(true);

    // IP request 2
    const ipRes2 = await submitContactEnquiryAction(
      {
        name: "IP Test 2",
        phone: `9222${Math.floor(Math.random() * 900000) + 100000}`,
        classLevel: 10,
        board: "cbse",
        message: "Second enquiry for this IP",
      },
      { clientIp: dedicatedIp }
    );
    expect(ipRes2.success).toBe(true);

    // IP request 3
    const ipRes3 = await submitContactEnquiryAction(
      {
        name: "IP Test 3",
        phone: `9333${Math.floor(Math.random() * 900000) + 100000}`,
        classLevel: 10,
        board: "cbse",
        message: "Third enquiry for this IP",
      },
      { clientIp: dedicatedIp }
    );
    expect(ipRes3.success).toBe(true);

    // IP request 4 exceeds IP limit (max 3 per 10m)
    const ipRes4 = await submitContactEnquiryAction(
      {
        name: "IP Test 4",
        phone: `9444${Math.floor(Math.random() * 900000) + 100000}`,
        classLevel: 10,
        board: "cbse",
        message: "Fourth enquiry for this IP should fail",
      },
      { clientIp: dedicatedIp }
    );
    expect(ipRes4.success).toBe(false);
    expect(ipRes4.error).toContain("Too many enquiries submitted from this network");
  });

  it("Test 8: Legal policy pages contain complete real business details, last updated date, and zero placeholders", () => {
    const webRoot = path.resolve(__dirname, "../apps/web/src/app/(marketing)");
    const legalPages = [
      { file: "privacy/page.tsx", name: "Privacy Policy" },
      { file: "terms/page.tsx", name: "Terms of Service" },
      { file: "refund-policy/page.tsx", name: "Refund Policy" },
    ];

    for (const page of legalPages) {
      const fullPath = path.join(webRoot, page.file);
      expect(fs.existsSync(fullPath)).toBe(true);

      const content = fs.readFileSync(fullPath, "utf-8");

      // Verify NO draft placeholders remain
      expect(content).not.toContain("[BUSINESS NAME]");
      expect(content).not.toContain("[ADDRESS]");
      expect(content).not.toContain("[EMAIL]");
      expect(content).not.toContain("[PHONE]");
      expect(content).not.toContain("[PLACEHOLDER]");

      // Verify real business details
      expect(content).toContain("Quick2Learn");
      expect(content).toContain("Mathura");
      expect(content).toContain("quick2learn23203@gmail.com");
      expect(content).toContain("+91 76688 75809");

      // Verify Last updated date
      expect(content).toContain("Last updated: October 2026");
    }
  });

  it("Test 9: Sitemap includes all marketing, trust, and policy routes plus dynamic pages", async () => {
    const entries = await sitemap();
    const urls = entries.map((e) => e.url);

    // Verify static routes
    expect(urls.some((u) => u.endsWith("/about"))).toBe(true);
    expect(urls.some((u) => u.endsWith("/results"))).toBe(true);
    expect(urls.some((u) => u.endsWith("/contact"))).toBe(true);
    expect(urls.some((u) => u.endsWith("/faq"))).toBe(true);
    expect(urls.some((u) => u.endsWith("/privacy"))).toBe(true);
    expect(urls.some((u) => u.endsWith("/terms"))).toBe(true);
    expect(urls.some((u) => u.endsWith("/refund-policy"))).toBe(true);
    expect(urls.some((u) => u.endsWith("/delivery-policy"))).toBe(false);

    // Verify dynamic faculty routes
    expect(urls.some((u) => u.includes("/faculty/dinesh-singh-rajput"))).toBe(true);
    expect(urls.some((u) => u.includes("/faculty/namita-singh-rajput"))).toBe(true);

    // Verify dynamic batch routes
    expect(urls.some((u) => u.includes("/batches/"))).toBe(true);
  });
});
