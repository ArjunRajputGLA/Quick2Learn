import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({
  headers: async () => ({
    get: (key: string) => {
      if (key === "x-forwarded-for") return "127.0.0.1";
      if (key === "x-real-ip") return "127.0.0.1";
      return null;
    },
  }),
}));

import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq, desc, sql } from "drizzle-orm";
import * as schema from "../packages/db/src/schema";
import { submitEnquiryAction } from "../apps/web/src/server/enquiry-actions";
import { submitContactEnquiryAction } from "../apps/web/src/server/contact-actions";
import { createEnquiry } from "../apps/web/src/server/data/enquiries";

const testDbUrl =
  process.env.DATABASE_URL_TEST ||
  "postgresql://postgres:postgres@localhost:5432/quick2learn_test";

const testPool = new Pool({
  connectionString: testDbUrl,
});

const testDb = drizzle(testPool, { schema });

describe("Admissions Enquiry Submission Suite", () => {
  beforeAll(async () => {
    process.env.DATABASE_URL = testDbUrl;
  });

  beforeEach(async () => {
    await testDb.execute(
      sql`DELETE FROM "rate_limit" WHERE "key" LIKE 'enquiry:%' OR "key" LIKE 'contact:%'`,
    );
  });

  afterAll(async () => {
    await testPool.end();
  });

  describe("1. Modal Enquiry Action (submitEnquiryAction)", () => {
    it("submits a valid CBSE enquiry successfully", async () => {
      const formData = new FormData();
      formData.append("name", "Vikas Malhotra");
      formData.append("phone", "9876500001");
      formData.append("classLevel", "12");
      formData.append("board", "cbse");
      formData.append("message", "Looking for Class 12 PCM offline batch.");
      formData.append("sourcePath", "/batches/class-12-pcm");

      const result = await submitEnquiryAction(null, formData);

      expect(result.success).toBe(true);
      expect(result.message).toContain("submitted");
      expect(result.fieldErrors).toBeUndefined();

      // Verify stored in DB
      const [stored] = await testDb
        .select()
        .from(schema.enquiries)
        .where(eq(schema.enquiries.phone, "9876500001"))
        .orderBy(desc(schema.enquiries.createdAt));

      expect(stored).toBeDefined();
      expect(stored.name).toBe("Vikas Malhotra");
      expect(stored.board).toBe("cbse");
      expect(stored.classLevel).toBe(12);
      expect(stored.sourcePath).toBe("/batches/class-12-pcm");
    });

    it("submits a valid UP Board enquiry without PostgreSQL enum errors", async () => {
      const formData = new FormData();
      formData.append("name", "Shashank Verma");
      formData.append("phone", "9876500002");
      formData.append("classLevel", "11");
      formData.append("board", "up_board");
      formData.append("message", "Hindi medium batch details");

      const result = await submitEnquiryAction(null, formData);

      expect(result.success).toBe(true);
      expect(result.message).toContain("submitted");

      // Verify stored with mappedBoard = null and notes = 'Board: UP Board'
      const [stored] = await testDb
        .select()
        .from(schema.enquiries)
        .where(eq(schema.enquiries.phone, "9876500002"))
        .orderBy(desc(schema.enquiries.createdAt));

      expect(stored).toBeDefined();
      expect(stored.board).toBeNull();
      expect(stored.notes).toContain("UP Board");
    });

    it("rejects invalid phone numbers with clear field validation errors", async () => {
      const formData = new FormData();
      formData.append("name", "Pooja");
      formData.append("phone", "12345"); // Invalid phone

      const result = await submitEnquiryAction(null, formData);

      expect(result.success).toBe(false);
      expect(result.message).toContain("Please correct the highlighted errors");
      expect(result.fieldErrors?.phone).toBeDefined();
    });

    it("silently succeeds for bot submissions filling the honeypot", async () => {
      const formData = new FormData();
      formData.append("name", "Spam Bot");
      formData.append("phone", "9876500003");
      formData.append("website_hp", "I am a spam bot");

      const result = await submitEnquiryAction(null, formData);

      expect(result.success).toBe(true);

      // Verify bot submission was NOT stored in database
      const [stored] = await testDb
        .select()
        .from(schema.enquiries)
        .where(eq(schema.enquiries.phone, "9876500003"));

      expect(stored).toBeUndefined();
    });

    it("safely handles null/empty formData without throwing uncaught exceptions", async () => {
      // @ts-expect-error Testing invalid input safety
      const result = await submitEnquiryAction(null, null);

      expect(result.success).toBe(false);
      expect(result.message).toContain("Invalid form submission");
    });
  });

  describe("2. Contact Page Enquiry Action (submitContactEnquiryAction)", () => {
    it("submits contact enquiry with up_board safely", async () => {
      const result = await submitContactEnquiryAction(
        {
          name: "Deepak Saini",
          phone: "9876500004",
          classLevel: 10,
          board: "up_board",
          message: "Need 10th board prep batch",
        },
        { clientIp: "10.10.10.1" },
      );

      expect(result.success).toBe(true);
      expect(result.message).toContain("enquiry has been received");

      const [stored] = await testDb
        .select()
        .from(schema.enquiries)
        .where(eq(schema.enquiries.phone, "9876500004"))
        .orderBy(desc(schema.enquiries.createdAt));

      expect(stored).toBeDefined();
      expect(stored.name).toBe("Deepak Saini");
      expect(stored.board).toBeNull();
      expect(stored.notes).toContain("UP Board");
    });

    it("submits contact enquiry with ICSE / ISC board safely", async () => {
      const result = await submitContactEnquiryAction(
        {
          name: "Ritika Sen",
          phone: "9876500005",
          classLevel: 12,
          board: "isc",
          message: "ISC Chemistry doubts",
        },
        { clientIp: "10.10.10.2" },
      );

      expect(result.success).toBe(true);

      const [stored] = await testDb
        .select()
        .from(schema.enquiries)
        .where(eq(schema.enquiries.phone, "9876500005"))
        .orderBy(desc(schema.enquiries.createdAt));

      expect(stored).toBeDefined();
      expect(stored.board).toBe("isc");
    });

    it("returns validation error for missing name", async () => {
      const result = await submitContactEnquiryAction({
        name: "A",
        phone: "9876500006",
      });

      expect(result.success).toBe(false);
      expect(result.fieldErrors?.name).toBeDefined();
    });
  });
});
