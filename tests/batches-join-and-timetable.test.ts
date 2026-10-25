import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq, and } from "drizzle-orm";
import * as schema from "../packages/db/src/schema";
import { seed } from "../packages/db/src/seed";
import {
  requestJoinBatch,
  getStudentBatches,
  getBatchDetailForStudent,
  getBatchTimetable,
  approveJoinRequest,
  rejectJoinRequest,
  getBatchJoinRequests,
  saveBatchTimetable,
  regenerateBatchJoinCode,
} from "../apps/web/src/server/data/batches";
import type { AuthUser } from "../apps/web/src/server/authz";

const testDbUrl =
  process.env.DATABASE_URL_TEST ||
  "postgresql://postgres:postgres@localhost:5432/quick2learn_test";

const testPool = new Pool({
  connectionString: testDbUrl,
});

const testDb = drizzle(testPool, { schema });

describe("Batches: Join Requests, Timetable & 4-Section Flow Suite", () => {
  const adminUser = {
    id: "admin-user-id",
    email: "admin@quick2learn.in",
    name: "Admin Dinesh",
    role: "admin",
  } as const satisfies AuthUser;

  const studentUser = {
    id: "student-flow-id",
    email: "student.batch@test.com",
    name: "Aman Sharma",
    role: "student",
  } as const satisfies AuthUser;

  let offlineBatchId: string;
  let offlineJoinCode: string;
  let onlineBatchId: string;
  let onlineJoinCode: string;

  beforeAll(async () => {
    process.env.DATABASE_URL = testDbUrl;
    await seed(testDbUrl);

    // Create admin user and student user in the test database if not exists
    await testDb
      .insert(schema.user)
      .values({
        id: adminUser.id,
        name: adminUser.name,
        email: adminUser.email,
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .onConflictDoNothing();

    await testDb
      .insert(schema.profiles)
      .values({
        userId: adminUser.id,
        fullName: adminUser.name,
        role: "admin",
      })
      .onConflictDoNothing();

    await testDb
      .insert(schema.user)
      .values({
        id: studentUser.id,
        name: studentUser.name,
        email: studentUser.email,
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .onConflictDoNothing();

    await testDb
      .insert(schema.profiles)
      .values({
        userId: studentUser.id,
        fullName: studentUser.name,
        role: "student",
        classLevel: 12,
        board: "cbse",
        phone: "+919876543210",
      })
      .onConflictDoNothing();

    // Fetch an offline batch
    const [offBatch] = await testDb
      .select()
      .from(schema.batches)
      .where(eq(schema.batches.mode, "offline"))
      .limit(1);

    expect(offBatch).toBeDefined();
    if (!offBatch) throw new Error("Offline batch not found");
    offlineBatchId = offBatch.id;
    offlineJoinCode = offBatch.joinCode || "Q2L101";

    // Ensure it has a joinCode
    if (!offBatch.joinCode) {
      await testDb
        .update(schema.batches)
        .set({ joinCode: "OFF101" })
        .where(eq(schema.batches.id, offlineBatchId));
      offlineJoinCode = "OFF101";
    }

    // Fetch an online batch with fee plan
    const [onBatch] = await testDb
      .select()
      .from(schema.batches)
      .where(eq(schema.batches.mode, "online"))
      .limit(1);

    expect(onBatch).toBeDefined();
    if (!onBatch) throw new Error("Online batch not found");
    onlineBatchId = onBatch.id;
    onlineJoinCode = onBatch.joinCode || "ONL101";

    if (!onBatch.joinCode) {
      await testDb
        .update(schema.batches)
        .set({ joinCode: "ONL101" })
        .where(eq(schema.batches.id, onlineBatchId));
      onlineJoinCode = "ONL101";
    }

    // Ensure online batch has an active fee plan
    const [existingPlan] = await testDb
      .select({ id: schema.batchFeePlans.id })
      .from(schema.batchFeePlans)
      .where(
        and(
          eq(schema.batchFeePlans.batchId, onlineBatchId),
          eq(schema.batchFeePlans.isActive, true)
        )
      )
      .limit(1);

    if (!existingPlan) {
      await testDb.insert(schema.batchFeePlans).values({
        batchId: onlineBatchId,
        name: "Test Online Fee",
        totalPaise: 500000,
        originalPaise: 600000,
        instalments: [{ label: "Full Fee", amount_paise: 500000, due_date: "2026-04-15" }],
        isActive: true,
      });
    }

    // Clean up any existing join requests or enrollments for this test student
    await testDb
      .delete(schema.batchJoinRequests)
      .where(eq(schema.batchJoinRequests.studentId, studentUser.id));
    await testDb
      .delete(schema.enrollments)
      .where(eq(schema.enrollments.studentId, studentUser.id));
  });

  afterAll(async () => {
    await testPool.end();
  });

  it("1. Student joins a paid online batch -> returns enrol_online with checkout URL", async () => {
    const res = await requestJoinBatch(studentUser.id, onlineJoinCode, testDb);
    expect(res.status).toBe("enrol_online");
    expect(res.message).toContain("Please enrol on the website");
    expect(res.checkoutUrl).toBeDefined();
  });

  it("2. Student enters valid offline code -> creates pending join request", async () => {
    const res = await requestJoinBatch(studentUser.id, offlineJoinCode, testDb);
    expect(res.status).toBe("request_created");
    expect(res.message).toContain("Join request submitted");
    expect(res.requestId).toBeDefined();

    // Verify it appears in getStudentBatches under pendingRequests
    const studentBatches = await getStudentBatches(studentUser.id, testDb);
    expect(studentBatches.pendingRequests.length).toBeGreaterThanOrEqual(1);
    const foundPending = studentBatches.pendingRequests.find(
      (p) => p.batchId === offlineBatchId
    );
    expect(foundPending).toBeDefined();
    expect(foundPending?.status).toBe("pending");
  });

  it("3. Repeating request returns already_requested status", async () => {
    const res = await requestJoinBatch(studentUser.id, offlineJoinCode, testDb);
    expect(res.status).toBe("already_requested");
    expect(res.message).toContain("already have a pending join request");
  });

  it("4. Admin views join requests inbox", async () => {
    const allRequests = await getBatchJoinRequests(adminUser, undefined, testDb);
    expect(allRequests.length).toBeGreaterThanOrEqual(1);
    const studentReq = allRequests.find(
      (r) => r.studentId === studentUser.id && r.batchId === offlineBatchId
    );
    expect(studentReq).toBeDefined();
    expect(studentReq?.status).toBe("pending");
    expect(studentReq?.studentName).toBe("Aman Sharma");
  });

  it("5. Admin approves join request -> student gets active enrollment with source admin", async () => {
    const studentRequests = await getBatchJoinRequests(
      adminUser,
      offlineBatchId,
      testDb
    );
    const req = studentRequests.find((r) => r.studentId === studentUser.id);
    expect(req).toBeDefined();

    const approveRes = await approveJoinRequest(adminUser, req!.id, undefined, testDb);
    expect(approveRes.success).toBe(true);

    // Verify student is now enrolled
    const studentBatches = await getStudentBatches(studentUser.id, testDb);
    const enrolled = studentBatches.enrolled.find((b) => b.id === offlineBatchId);
    expect(enrolled).toBeDefined();
    expect(enrolled?.progressPercentage).toBeGreaterThanOrEqual(0);

    // Pending list should now be empty for this batch
    const pending = studentBatches.pendingRequests.find(
      (p) => p.batchId === offlineBatchId
    );
    expect(pending).toBeUndefined();
  });

  it("6. Student enters join code for an already enrolled batch -> returns already_enrolled", async () => {
    const res = await requestJoinBatch(studentUser.id, offlineJoinCode, testDb);
    expect(res.status).toBe("already_enrolled");
    expect(res.message).toContain("already actively enrolled");
  });

  it("7. Weekly timetable editor saves and retrieves weekday slots (1-7)", async () => {
    const sampleSlots = [
      {
        weekday: 1, // Monday
        startTime: "16:00",
        endTime: "17:30",
        mode: "offline",
        roomOrLinkNote: "Room 101",
      },
      {
        weekday: 3, // Wednesday
        startTime: "16:00",
        endTime: "17:30",
        mode: "offline",
        roomOrLinkNote: "Room 101",
      },
      {
        weekday: 5, // Friday
        startTime: "16:00",
        endTime: "17:30",
        mode: "offline",
        roomOrLinkNote: "Room 101",
      },
    ];

    const saveRes = await saveBatchTimetable(adminUser, offlineBatchId, sampleSlots, testDb);
    expect(saveRes.success).toBe(true);
    expect(saveRes.count).toBe(3);

    const timetable = await getBatchTimetable(offlineBatchId, testDb);
    expect(timetable.batchId).toBe(offlineBatchId);
    expect(timetable.slots.length).toBe(3);
    expect(timetable.slots[0]?.weekday).toBe(1);
    expect(timetable.slots[0]?.startTime).toBe("16:00");
  });

  it("8. Batch detail returns overview, teachers, subjects, nextClass, and announcements", async () => {
    const detail = await getBatchDetailForStudent(offlineBatchId, studentUser.id, testDb);
    expect(detail).toBeDefined();
    expect(detail?.id).toBe(offlineBatchId);
    expect(detail?.teachers.length).toBeGreaterThanOrEqual(1);
    expect(detail?.subjects.length).toBeGreaterThanOrEqual(1);
    expect(detail?.enrollment).toBeDefined();
    expect(detail?.enrollment?.status).toBe("active");
    expect(detail?.nextClass).toBeDefined();
    expect(detail?.latestAnnouncements).toBeDefined();
  });

  it("9. Admin regenerates batch join code -> produces new unique 6-character code", async () => {
    const updated = await regenerateBatchJoinCode(adminUser, offlineBatchId, testDb);
    expect(updated).toBeDefined();
    expect(updated?.joinCode).toBeDefined();
    expect(updated?.joinCode?.length).toBe(6);
    expect(updated?.joinCode).not.toBe(offlineJoinCode);
  });

  it("10. Rejecting a request updates status to rejected with admin note", async () => {
    // Create another join request
    const secondStudentId = "second-student-id";
    await testDb
      .insert(schema.user)
      .values({
        id: secondStudentId,
        name: "Pooja Gupta",
        email: "pooja@test.com",
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .onConflictDoNothing();

    await testDb
      .delete(schema.batchJoinRequests)
      .where(eq(schema.batchJoinRequests.studentId, secondStudentId));

    // Use current join code of offline batch
    const [currentBatch] = await testDb
      .select()
      .from(schema.batches)
      .where(eq(schema.batches.id, offlineBatchId));
    if (!currentBatch) throw new Error("Current batch not found");

    const joinRes = await requestJoinBatch(
      secondStudentId,
      currentBatch.joinCode!,
      testDb
    );
    expect(joinRes.status).toBe("request_created");
    expect(joinRes.requestId).toBeDefined();

    const rejectRes = await rejectJoinRequest(
      adminUser,
      joinRes.requestId!,
      "Class capacity reached for offline mode",
      testDb
    );
    expect(rejectRes.success).toBe(true);

    const [updatedReq] = await testDb
      .select()
      .from(schema.batchJoinRequests)
      .where(eq(schema.batchJoinRequests.id, joinRes.requestId!));
    if (!updatedReq) throw new Error("Updated request not found");
    expect(updatedReq.status).toBe("rejected");
    expect(updatedReq.note).toBe("Class capacity reached for offline mode");
    expect(updatedReq.decidedBy).toBe(adminUser.id);
  });
});
