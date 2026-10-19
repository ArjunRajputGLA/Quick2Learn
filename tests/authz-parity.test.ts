import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";

vi.mock("server-only", () => ({}));
import { Pool, type PoolClient } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "../packages/db/src/schema";
import { seed } from "../packages/db/src/seed";
import {
  getResources,
  getResourceById,
  createResource,
} from "../apps/web/src/server/data/resources";
import {
  getPayments,
  getFeeDues,
  recordPayment,
} from "../apps/web/src/server/data/payments";
import {
  getEnrollments,
  createEnrollment,
} from "../apps/web/src/server/data/enrollments";
import {
  getAllProfiles,
  getProfile,
  updateProfile,
} from "../apps/web/src/server/data/catalog";
import { createBatch, getBatchBySlug } from "../apps/web/src/server/data/batches";
import {
  ForbiddenError,
  UnauthorizedError,
  type AuthUser,
} from "../apps/web/src/server/authz";

const testDbUrl =
  process.env.DATABASE_URL_TEST ||
  "postgresql://postgres:postgres@localhost:5432/quick2learn_test";

const testPool = new Pool({
  connectionString: testDbUrl,
});

// Identities matching old RLS test suite
const adminId = "11111111-1111-1111-1111-111111111111";
const teacherId = "22222222-2222-2222-2222-222222222222";
const student1Id = "33333333-3333-3333-3333-333333333333";
const student2Id = "44444444-4444-4444-4444-444444444444";

const adminUser: AuthUser = { id: adminId, role: "admin", email: "authz-admin@quick2learn.in" };
const teacherUser: AuthUser = { id: teacherId, role: "teacher", email: "authz-teacher@quick2learn.in" };
const student1User: AuthUser = { id: student1Id, role: "student", email: "authz-student1@quick2learn.in" };
const student2User: AuthUser = { id: student2Id, role: "student", email: "authz-student2@quick2learn.in" };

describe("Authorization and Data-Access Layer Parity Test Suite", () => {
  beforeAll(async () => {
    // Ensure base seed data exists on quick2learn_test
    process.env.DATABASE_URL = testDbUrl;
    await seed(testDbUrl);
  });

  afterAll(async () => {
    await testPool.end();
  });

  async function runInTestTx<T>(
    testFn: (tx: ReturnType<typeof drizzle>, client: PoolClient) => Promise<T>,
  ): Promise<T> {
    const client = await testPool.connect();
    await client.query("BEGIN;");
    const tx = drizzle(client, { schema });
    try {
      // Seed the 4 test users and profiles in this transaction
      const usersData = [
        { id: adminId, name: "Admin", email: "authz-admin@quick2learn.in", role: "admin" },
        { id: teacherId, name: "Teacher", email: "authz-teacher@quick2learn.in", role: "teacher" },
        { id: student1Id, name: "Student 1", email: "authz-student1@quick2learn.in", role: "student" },
        { id: student2Id, name: "Student 2", email: "authz-student2@quick2learn.in", role: "student" },
      ];

      for (const u of usersData) {
        await tx
          .insert(schema.user)
          .values({
            id: u.id,
            name: u.name,
            email: u.email,
          })
          .onConflictDoNothing();

        await tx
          .insert(schema.profiles)
          .values({
            userId: u.id,
            fullName: u.name,
            role: u.role as schema.UserRole,
          })
          .onConflictDoNothing();
      }

      // Seed test batch, resources, enrollments, dues, payments
      const batchId = "b0000000-0000-0000-0000-000000000001";
      const publicResId = "90000000-0000-0000-0000-000000000001";
      const privateResId = "90000000-0000-0000-0000-000000000002";
      const s1EnrollmentId = "e0000000-0000-0000-0000-000000000001";
      const s2EnrollmentId = "e0000000-0000-0000-0000-000000000002";

      await tx
        .insert(schema.resources)
        .values([
          {
            id: publicResId,
            title: "Public Syllabus Guide",
            type: "notes",
            storageKey: "resources/public/syllabus.pdf",
            storageBucket: "public",
            visibility: "public",
            batchId,
          },
          {
            id: privateResId,
            title: "Enrolled Question Bank",
            type: "worksheet",
            storageKey: "resources/private/worksheet.pdf",
            storageBucket: "private",
            visibility: "enrolled",
            batchId,
          },
        ])
        .onConflictDoNothing();

      await tx
        .insert(schema.enrollments)
        .values([
          {
            id: s1EnrollmentId,
            batchId,
            studentId: student1Id,
            status: "active",
            source: "online",
          },
          {
            id: s2EnrollmentId,
            batchId,
            studentId: student2Id,
            status: "active",
            source: "online",
          },
        ])
        .onConflictDoNothing();

      const s1DueId = "d0000000-0000-0000-0000-000000000001";
      const s2DueId = "d0000000-0000-0000-0000-000000000002";

      await tx
        .insert(schema.feeDues)
        .values([
          {
            id: s1DueId,
            enrollmentId: s1EnrollmentId,
            label: "Term 1 Fee",
            amountPaise: 1000000,
            dueDate: "2026-05-01",
            status: "due",
          },
          {
            id: s2DueId,
            enrollmentId: s2EnrollmentId,
            label: "Term 1 Fee",
            amountPaise: 1000000,
            dueDate: "2026-05-01",
            status: "due",
          },
        ])
        .onConflictDoNothing();

      await tx
        .insert(schema.payments)
        .values([
          {
            id: "c0000000-0000-0000-0000-000000000001",
            studentId: student1Id,
            enrollmentId: s1EnrollmentId,
            feeDueId: s1DueId,
            method: "razorpay",
            amountPaise: 1000000,
            status: "paid",
            receiptNo: "Q2L-2026-TEST01",
          },
          {
            id: "c0000000-0000-0000-0000-000000000002",
            studentId: student2Id,
            enrollmentId: s2EnrollmentId,
            feeDueId: s2DueId,
            method: "razorpay",
            amountPaise: 1000000,
            status: "paid",
            receiptNo: "Q2L-2026-TEST02",
          },
        ])
        .onConflictDoNothing();

      return await testFn(tx, client);
    } finally {
      await client.query("ROLLBACK;");
      client.release();
    }
  }

  // TEST 1: Anon cannot read private resources or payments
  it("Test 1: Unauthenticated (anon) cannot read private resources or payments", async () => {
    await runInTestTx(async (tx) => {
      // 1. Anon reading resources
      const publicResources = await getResources(null, undefined, tx);
      expect(publicResources.length).toBeGreaterThanOrEqual(1);
      expect(publicResources.every((r) => r.visibility === "public")).toBe(true);

      // Anon cannot access private resource directly
      const privateResId = "90000000-0000-0000-0000-000000000002";
      await expect(getResourceById(null, privateResId, tx)).rejects.toThrow(
        ForbiddenError,
      );

      // Anon cannot read payments
      await expect(getPayments(null as unknown as AuthUser, tx)).rejects.toThrow(
        UnauthorizedError,
      );
    });
  });

  // TEST 2: Student sees only their own enrollments, dues and payments
  it("Test 2: Student data isolation (enrollments, dues, payments)", async () => {
    await runInTestTx(async (tx) => {
      // Student 1 sees only their own enrollment
      const s1Enrollments = await getEnrollments(student1User, tx);
      expect(s1Enrollments.length).toBe(1);
      expect(s1Enrollments[0].studentId).toBe(student1Id);

      // Student 1 sees only their own fee dues
      const s1Dues = await getFeeDues(student1User, undefined, tx);
      expect(s1Dues.length).toBe(1);
      expect(s1Dues[0].enrollmentId).toBe("e0000000-0000-0000-0000-000000000001");

      // Student 1 sees only their own payments
      const s1Payments = await getPayments(student1User, tx);
      expect(s1Payments.length).toBe(1);
      expect(s1Payments[0].studentId).toBe(student1Id);

      // Enrolled student 1 can read resources for their enrolled batch
      const s1Resources = await getResources(student1User, undefined, tx);
      expect(s1Resources.some((r) => r.visibility === "enrolled")).toBe(true);

      const privateResId = "90000000-0000-0000-0000-000000000002";
      const s1Res = await getResourceById(student1User, privateResId, tx);
      expect(s1Res).not.toBeNull();
      expect(s1Res?.id).toBe(privateResId);

      // Switch to Student 2
      const s2Enrollments = await getEnrollments(student2User, tx);
      expect(s2Enrollments.length).toBe(1);
      expect(s2Enrollments[0].studentId).toBe(student2Id);

      const s2Payments = await getPayments(student2User, tx);
      expect(s2Payments.length).toBe(1);
      expect(s2Payments[0].studentId).toBe(student2Id);
    });
  });

  // TEST 3: Student cannot change their own role
  it("Test 3: Role escalation prevention", async () => {
    await runInTestTx(async (tx) => {
      // Student 1 attempts to promote themselves to admin
      await expect(
        updateProfile(student1User, student1Id, { role: "admin" }, tx),
      ).rejects.toThrow("Only administrators can modify user roles.");

      // Verify student role remains strictly 'student'
      const s1Profile = await getProfile(student1User, student1Id, tx);
      expect(s1Profile?.role).toBe("student");
    });
  });

  // TEST 4: Admin can read and write everything
  it("Test 4: Administrator full access", async () => {
    await runInTestTx(async (tx) => {
      // Admin reads all profiles
      const allProfiles = await getAllProfiles(adminUser, tx);
      expect(allProfiles.length).toBeGreaterThanOrEqual(4);

      // Admin reads all enrollments
      const allEnrollments = await getEnrollments(adminUser, tx);
      expect(allEnrollments.length).toBeGreaterThanOrEqual(2);

      // Admin reads all payments
      const allPayments = await getPayments(adminUser, tx);
      expect(allPayments.length).toBeGreaterThanOrEqual(2);

      // Admin can modify user roles
      const promoted = await updateProfile(
        adminUser,
        student2Id,
        { role: "teacher" },
        tx,
      );
      expect(promoted?.role).toBe("teacher");

      const s2Check = await getProfile(adminUser, student2Id, tx);
      expect(s2Check?.role).toBe("teacher");

      // Admin can create batches
      const newBatch = await createBatch(
        adminUser,
        {
          slug: "admin-test-batch",
          title: "Admin Test Batch",
          description: "Batch created by admin test",
          classLevel: 12,
          board: "cbse",
          subjectId: "a0000000-0000-0000-0000-000000000001",
          scheduleText: "Daily 5 PM",
          startDate: new Date(),
          status: "open",
        },
        tx,
      );
      expect(newBatch.slug).toBe("admin-test-batch");

      const fetchedBatch = await getBatchBySlug("admin-test-batch", adminUser, tx);
      expect(fetchedBatch?.title).toBe("Admin Test Batch");
    });
  });
});
