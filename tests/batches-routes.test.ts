import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq, and } from "drizzle-orm";
import * as schema from "../packages/db/src/schema";
import { seed } from "../packages/db/src/seed";
import {
  getBatchesWithFilters,
  getBatchDetailBySlug,
  getBatches,
} from "../apps/web/src/server/data/batches";
import type { AuthUser } from "../apps/web/src/server/authz";

const testDbUrl =
  process.env.DATABASE_URL_TEST ||
  "postgresql://postgres:postgres@localhost:5432/quick2learn_test";

const testPool = new Pool({
  connectionString: testDbUrl,
});

const testDb = drizzle(testPool, { schema });

describe("Batch Listing & Coursera-Modelled Batch Detail Page Suite", () => {
  const staffUser: AuthUser = {
    id: "staff-admin-id",
    email: "admin@quick2learn.in",
    name: "Admin Mentor",
    role: "admin",
  };

  const studentUser: AuthUser = {
    id: "student-user-id",
    email: "student@example.com",
    name: "Rahul Verma",
    role: "student",
  };

  beforeAll(async () => {
    process.env.DATABASE_URL = testDbUrl;
    await seed(testDbUrl);
  });

  afterAll(async () => {
    await testPool.end();
  });

  describe("/batches: Grid and Filter Chips", () => {
    it("Test 1: Draft batches never appear in the public batch listing", async () => {
      const publicBatches = await getBatchesWithFilters(undefined, null);

      expect(publicBatches.length).toBeGreaterThanOrEqual(2);
      const hasDraft = publicBatches.some((b) => b.status === "draft");
      expect(hasDraft).toBe(false);

      const draftBatch = publicBatches.find(
        (b) => b.slug === "class-12-calculus-crash-course-draft",
      );
      expect(draftBatch).toBeUndefined();
    });

    it("Test 2: Batches are ordered with Open batches first", async () => {
      const batches = await getBatchesWithFilters(undefined, null);
      expect(batches.length).toBeGreaterThanOrEqual(2);

      // Verify open batches appear before closed ones
      const openIdx = batches.findIndex((b) => b.status === "open");
      const closedIdx = batches.findIndex((b) => b.status === "closed");

      if (openIdx !== -1 && closedIdx !== -1) {
        expect(openIdx).toBeLessThan(closedIdx);
      }
    });

    it("Test 3: Filters by ClassLevel correctly", async () => {
      const class12Batches = await getBatchesWithFilters({ classLevel: 12 }, null);
      expect(class12Batches.length).toBeGreaterThanOrEqual(1);
      expect(class12Batches.every((b) => b.grade === "Class XII")).toBe(true);

      const class11Batches = await getBatchesWithFilters({ classLevel: 11 }, null);
      expect(class11Batches.length).toBeGreaterThanOrEqual(1);
      expect(class11Batches.every((b) => b.grade === "Class XI")).toBe(true);
    });

    it("Test 4: Filters by Board (CBSE vs ICSE)", async () => {
      const cbseBatches = await getBatchesWithFilters({ board: "cbse" }, null);
      expect(cbseBatches.length).toBeGreaterThanOrEqual(1);
      expect(cbseBatches.every((b) => b.board === "CBSE")).toBe(true);

      const icseBatches = await getBatchesWithFilters({ board: "icse" }, null);
      expect(icseBatches.length).toBeGreaterThanOrEqual(1);
      expect(icseBatches.every((b) => b.board === "ICSE")).toBe(true);
    });

    it("Test 5: Filters by Mode (offline vs hybrid vs online)", async () => {
      const offlineBatches = await getBatchesWithFilters({ mode: "offline" }, null);
      expect(offlineBatches.length).toBeGreaterThanOrEqual(1);
      expect(offlineBatches.every((b) => b.mode === "offline")).toBe(true);

      const hybridBatches = await getBatchesWithFilters({ mode: "hybrid" }, null);
      expect(hybridBatches.length).toBeGreaterThanOrEqual(1);
      expect(hybridBatches.every((b) => b.mode === "hybrid")).toBe(true);
    });

    it("Test 6: Filters by Status (open vs closed)", async () => {
      const openBatches = await getBatchesWithFilters({ status: "open" }, null);
      expect(openBatches.length).toBeGreaterThanOrEqual(2);
      expect(openBatches.every((b) => b.status === "open")).toBe(true);
    });
  });

  describe("/batches/[slug]: Detailed Coursera-Modelled Page Data", () => {
    it("Test 7: Seeded Class 12 CBSE Masterclass batch loads with complete details", async () => {
      const data = await getBatchDetailBySlug(
        "class-12-cbse-mathematics-masterclass-2026",
        { user: null },
      );

      expect(data).toBeDefined();
      expect(data?.batch.slug).toBe("class-12-cbse-mathematics-masterclass-2026");
      expect(data?.batch.title).toContain("Class XII CBSE Mathematics");
      expect(data?.batch.classLevel).toBe(12);
      expect(data?.batch.board).toBe("cbse");
      expect(data?.batch.status).toBe("open");

      // Teacher details
      expect(data?.faculty).toBeDefined();
      expect(data?.faculty?.name).toBe("Mr. Dinesh Singh Rajput");
      expect(data?.faculty?.designation).toContain("Senior Mathematics");

      // Fee Plans
      expect(data?.feePlans.length).toBeGreaterThanOrEqual(2);
      expect(data?.primaryFeePlan).toBeDefined();
      expect(data?.primaryFeePlan?.totalPaise).toBe(1800000); // ₹18,000

      // Outcomes checklist
      expect(data?.batch.outcomes.length).toBeGreaterThanOrEqual(2);

      // Syllabus enriched with modules & free previews
      expect(data?.enrichedSyllabus.length).toBeGreaterThanOrEqual(1);
    });

    it("Test 8: Seeded Class 11 CBSE Foundation batch loads correctly", async () => {
      const data = await getBatchDetailBySlug(
        "class-11-cbse-mathematics-foundation-2026",
        { user: null },
      );

      expect(data).toBeDefined();
      expect(data?.batch.classLevel).toBe(11);
      expect(data?.batch.status).toBe("open");
      expect(data?.faculty?.name).toBe("Mr. Dinesh Singh Rajput");
      expect(data?.primaryFeePlan?.totalPaise).toBe(1500000); // ₹15,000
    });

    it("Test 9: Fee plan instalment breakdown contains amounts and due dates", async () => {
      const data = await getBatchDetailBySlug(
        "class-12-cbse-mathematics-masterclass-2026",
        { user: null },
      );

      const instalmentPlan = data?.feePlans.find(
        (p) => p.name === "Two-Instalment Plan",
      );
      expect(instalmentPlan).toBeDefined();
      expect(Array.isArray(instalmentPlan?.instalments)).toBe(true);

      const instalments = instalmentPlan?.instalments as Array<{
        label: string;
        amount_paise: number;
        due_date: string;
      }>;
      expect(instalments.length).toBe(2);
      expect(instalments[0].amount_paise).toBe(1000000);
      expect(instalments[0].due_date).toBe("2026-04-15");
      expect(instalments[1].amount_paise).toBe(1000000);
      expect(instalments[1].due_date).toBe("2026-09-15");
    });
  });

  describe("Security, Privacy, and Status Logic", () => {
    it("Test 10: Draft batch returns null (404) to public and students", async () => {
      // Public anonymous user
      const publicData = await getBatchDetailBySlug(
        "class-12-calculus-crash-course-draft",
        { user: null },
      );
      expect(publicData).toBeNull();

      // Student user without preview
      const studentData = await getBatchDetailBySlug(
        "class-12-calculus-crash-course-draft",
        { user: studentUser },
      );
      expect(studentData).toBeNull();

      // Student user even with preview=true is blocked
      const studentWithPreview = await getBatchDetailBySlug(
        "class-12-calculus-crash-course-draft",
        { preview: true, user: studentUser },
      );
      expect(studentWithPreview).toBeNull();
    });

    it("Test 11: Draft batch is accessible to staff with ?preview=1", async () => {
      const staffData = await getBatchDetailBySlug(
        "class-12-calculus-crash-course-draft",
        { preview: true, user: staffUser },
      );

      expect(staffData).toBeDefined();
      expect(staffData?.batch.status).toBe("draft");
      expect(staffData?.isStaffPreview).toBe(true);
    });

    it("Test 12: Closed batch reflects 'closed' status for waitlist behavior", async () => {
      const data = await getBatchDetailBySlug(
        "class-12-cbse-maths-early-bird-closed",
        { user: null },
      );

      expect(data).toBeDefined();
      expect(data?.batch.status).toBe("closed");
      // Admissions closed triggers waitlist CTA
      expect(data?.batch.status !== "open").toBe(true);
    });

    it("Test 13: Enrolled count is calculated and reflects active enrollments", async () => {
      const data = await getBatchDetailBySlug(
        "class-12-cbse-mathematics-masterclass-2026",
        { user: null },
      );

      expect(data).toBeDefined();
      expect(typeof data?.enrolledCount).toBe("number");
      expect(typeof data?.seatsRemaining).toBe("number");
      expect(data?.seatsRemaining).toBeLessThanOrEqual(data?.batch.seatsTotal || 40);
    });
  });
});
