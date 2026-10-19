import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { db, schema, eq, and, sql } from "@quick2learn/db";
import { auth } from "../apps/web/src/server/auth/auth";
import {
  getParentHomeData,
  adminLinkParentToStudent,
  adminUnlinkParentFromStudent,
  notifyFeeDuesToParents,
} from "../apps/web/src/server/data/parent";
import { getAdminStudentDetails } from "../apps/web/src/server/data/admin";
import { getAvailableTests } from "../apps/web/src/server/data/tests";
import { POST as postTestAttempt } from "../apps/web/src/app/api/v1/tests/[id]/attempts/route";
import { POST as postDoubt } from "../apps/web/src/app/api/v1/doubts/route";
import { GET as getParentHome } from "../apps/web/src/app/api/v1/parent/home/route";
import {
  POST as postAdminLinkParent,
  DELETE as deleteAdminUnlinkParent,
} from "../apps/web/src/app/api/v1/admin/students/[id]/parents/route";

describe("Parent Experience, Permissions & Child Switching Test Suite", () => {
  const timestamp = Date.now();
  const parentUserId = `parent-user-${timestamp}`;
  const parentSessionToken = `parent-token-${timestamp}`;
  let parentCookie: string;

  const child1UserId = `child-1-${timestamp}`;
  const child2UserId = `child-2-${timestamp}`;
  const strangerStudentId = `stranger-student-${timestamp}`;

  const adminUserId = `admin-user-${timestamp}`;
  const adminSessionToken = `admin-token-${timestamp}`;
  let adminCookie: string;

  let batch1Id: string;
  let batch2Id: string;
  let test1Id: string;
  let test2Id: string;
  let attempt1Id: string;
  let attempt2Id: string;
  let feeDue1Id: string;

  async function signCookie(value: string, secret: string) {
    const secretBuf = new TextEncoder().encode(secret);
    const key = await crypto.subtle.importKey(
      "raw",
      secretBuf,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign", "verify"]
    );
    const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
    const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig)));
    return `${value}.${sigB64}`;
  }

  beforeAll(async () => {
    const secret =
      (auth as any).options?.secret ||
      process.env.BETTER_AUTH_SECRET ||
      "quick2learn_dev_secret_key_at_least_32_characters_long";
    parentCookie = await signCookie(parentSessionToken, secret);
    adminCookie = await signCookie(adminSessionToken, secret);

    // 1. Seed Parent User & Session
    await db.insert(schema.user).values({
      id: parentUserId,
      name: "Sunil Verma",
      email: `sunil.${timestamp}@parent.test`,
      phoneNumber: `98${Math.floor(10000000 + Math.random() * 90000000)}`,
      emailVerified: true,
      role: "parent",
    });

    await db.insert(schema.profiles).values({
      userId: parentUserId,
      fullName: "Sunil Verma",
      role: "parent",
    });

    await db.insert(schema.session).values({
      id: `sess-${parentUserId}`,
      token: parentSessionToken,
      userId: parentUserId,
      expiresAt: new Date(Date.now() + 86400000),
    });

    // 2. Seed Admin User & Session
    await db.insert(schema.user).values({
      id: adminUserId,
      name: "Admin Officer",
      email: `admin.${timestamp}@quick2learn.test`,
      emailVerified: true,
      role: "admin",
    });

    await db.insert(schema.profiles).values({
      userId: adminUserId,
      fullName: "Admin Officer",
      role: "admin",
    });

    await db.insert(schema.session).values({
      id: `sess-${adminUserId}`,
      token: adminSessionToken,
      userId: adminUserId,
      expiresAt: new Date(Date.now() + 86400000),
    });

    // 3. Seed Child 1 (Class 10 CBSE)
    await db.insert(schema.user).values({
      id: child1UserId,
      name: "Rohan Verma",
      email: `rohan.${timestamp}@student.test`,
      emailVerified: true,
      role: "student",
    });

    await db.insert(schema.profiles).values({
      userId: child1UserId,
      fullName: "Rohan Verma",
      role: "student",
      classLevel: 10,
      board: "cbse",
      school: "DPS Mathura",
      parentName: "Sunil Verma",
      city: "Mathura",
    });

    // 4. Seed Child 2 (Class 12 CBSE)
    await db.insert(schema.user).values({
      id: child2UserId,
      name: "Ananya Verma",
      email: `ananya.${timestamp}@student.test`,
      emailVerified: true,
      role: "student",
    });

    await db.insert(schema.profiles).values({
      userId: child2UserId,
      fullName: "Ananya Verma",
      role: "student",
      classLevel: 12,
      board: "cbse",
      school: "DPS Mathura",
      parentName: "Sunil Verma",
      city: "Mathura",
    });

    // 5. Seed Unlinked Stranger Student
    await db.insert(schema.user).values({
      id: strangerStudentId,
      name: "Stranger Student",
      email: `stranger.${timestamp}@student.test`,
      emailVerified: true,
      role: "student",
    });

    await db.insert(schema.profiles).values({
      userId: strangerStudentId,
      fullName: "Stranger Student",
      role: "student",
      classLevel: 11,
      board: "cbse",
    });

    // 6. Link Parent to Child 1 and Child 2
    await db.insert(schema.parentLinks).values([
      {
        parentUserId,
        studentUserId: child1UserId,
        relation: "Father",
      },
      {
        parentUserId,
        studentUserId: child2UserId,
        relation: "Father",
      },
    ]);

    // 7. Seed Subjects, Batches and Enrollments
    const [subject1] = await db
      .insert(schema.subjects)
      .values({
        name: `Class 10 Maths ${timestamp}`,
        slug: `class-10-maths-${timestamp}`,
        classLevel: 10,
        board: "cbse",
        orderIndex: 1,
      })
      .returning();

    const [subject2] = await db
      .insert(schema.subjects)
      .values({
        name: `Class 12 Maths ${timestamp}`,
        slug: `class-12-maths-${timestamp}`,
        classLevel: 12,
        board: "cbse",
        orderIndex: 2,
      })
      .returning();

    const [faculty] = await db
      .select({ id: schema.faculty.id })
      .from(schema.faculty)
      .limit(1);
    const facultyId = faculty?.id;

    const [batch1] = await db
      .insert(schema.batches)
      .values({
        title: `Class X Maths Excellence ${timestamp}`,
        slug: `class-x-maths-${timestamp}`,
        description: "Class 10 CBSE Maths Excellence with Dinesh Sir",
        classLevel: 10,
        board: "cbse",
        subjectId: subject1.id,
        startDate: new Date("2026-04-01"),
        scheduleText: "Mon, Wed, Fri • 5:00 PM",
        facultyId,
        status: "open",
      })
      .returning();
    batch1Id = batch1.id;

    const [batch2] = await db
      .insert(schema.batches)
      .values({
        title: `Class XII Calculus Elite ${timestamp}`,
        slug: `class-xii-calculus-${timestamp}`,
        description: "Class 12 CBSE Calculus with Dinesh Sir",
        classLevel: 12,
        board: "cbse",
        subjectId: subject2.id,
        startDate: new Date("2026-04-01"),
        scheduleText: "Tue, Thu, Sat • 6:00 PM",
        facultyId,
        status: "open",
      })
      .returning();
    batch2Id = batch2.id;

    // Enroll Child 1 in Batch 1
    const [enroll1] = await db
      .insert(schema.enrollments)
      .values({
        studentId: child1UserId,
        batchId: batch1Id,
        status: "active",
      })
      .returning();

    // Enroll Child 2 in Batch 2
    const [enroll2] = await db
      .insert(schema.enrollments)
      .values({
        studentId: child2UserId,
        batchId: batch2Id,
        status: "active",
      })
      .returning();

    // 8. Seed Fee Due for Child 1 (Due in 2 days)
    const dueDate2Days = new Date(Date.now() + 2 * 86400000).toISOString().split("T")[0]!;
    const [due1] = await db
      .insert(schema.feeDues)
      .values({
        enrollmentId: enroll1.id,
        label: "Term 1 Instalment",
        amountPaise: 450000,
        dueDate: dueDate2Days,
        status: "due",
      })
      .returning();
    feeDue1Id = due1.id;

    // 9. Seed Attendance for Child 1 & Child 2
    const todayStr = new Date().toISOString().split("T")[0]!;
    await db.insert(schema.attendanceRecords).values([
      {
        studentId: child1UserId,
        batchId: batch1Id,
        date: todayStr,
        status: "present",
        source: "marked",
      },
      {
        studentId: child2UserId,
        batchId: batch2Id,
        date: todayStr,
        status: "absent",
        source: "marked",
      },
    ]);

    // 10. Seed Tests and Attempts for Child 1
    const [test1] = await db
      .insert(schema.tests)
      .values({
        batchId: batch1Id,
        subjectId: subject1.id,
        title: `Quadratic Equations Test ${timestamp}`,
        durationMinutes: 45,
        totalMarks: "50.00",
        status: "live",
      })
      .returning();
    test1Id = test1.id;

    const [att1] = await db
      .insert(schema.testAttempts)
      .values({
        testId: test1Id,
        studentId: child1UserId,
        status: "submitted",
        score: "42.00",
        startedAt: new Date(Date.now() - 3600000),
        deadlineAt: new Date(Date.now() + 3600000),
        submittedAt: new Date(Date.now() - 1800000),
        rank: 1,
      })
      .returning();
    attempt1Id = att1.id;

    // Seed Tests and Attempts for Child 2
    const [test2] = await db
      .insert(schema.tests)
      .values({
        batchId: batch2Id,
        subjectId: subject2.id,
        title: `Integrals & Differential Equations ${timestamp}`,
        durationMinutes: 60,
        totalMarks: "100.00",
        status: "live",
      })
      .returning();
    test2Id = test2.id;

    const [att2] = await db
      .insert(schema.testAttempts)
      .values({
        testId: test2Id,
        studentId: child2UserId,
        status: "submitted",
        score: "88.00",
        startedAt: new Date(Date.now() - 3600000),
        deadlineAt: new Date(Date.now() + 3600000),
        submittedAt: new Date(Date.now() - 1800000),
        rank: 2,
      })
      .returning();
    attempt2Id = att2.id;

    // 11. Seed Batch Announcement
    await db.insert(schema.announcements).values({
      batchId: batch1Id,
      title: "Science & Maths Exhibition Next Week",
      body: "All students are requested to prepare their working models.",
      publishedAt: new Date(),
      notifyParents: true,
    });
  });

  afterAll(async () => {
    // Clean up test data
    try {
      if (batch1Id) {
        await db.delete(schema.announcements).where(eq(schema.announcements.batchId, batch1Id));
      }
      await db.delete(schema.attendanceRecords).where(eq(schema.attendanceRecords.studentId, child1UserId));
      await db.delete(schema.attendanceRecords).where(eq(schema.attendanceRecords.studentId, child2UserId));
      if (feeDue1Id) {
        await db.delete(schema.feeDues).where(eq(schema.feeDues.id, feeDue1Id));
      }
      if (attempt1Id) {
        await db.delete(schema.testAttempts).where(eq(schema.testAttempts.id, attempt1Id));
      }
      if (attempt2Id) {
        await db.delete(schema.testAttempts).where(eq(schema.testAttempts.id, attempt2Id));
      }
      if (test1Id) {
        await db.delete(schema.tests).where(eq(schema.tests.id, test1Id));
      }
      if (test2Id) {
        await db.delete(schema.tests).where(eq(schema.tests.id, test2Id));
      }
      await db.delete(schema.enrollments).where(eq(schema.enrollments.studentId, child1UserId));
      await db.delete(schema.enrollments).where(eq(schema.enrollments.studentId, child2UserId));
      if (batch1Id) {
        await db.delete(schema.batches).where(eq(schema.batches.id, batch1Id));
      }
      if (batch2Id) {
        await db.delete(schema.batches).where(eq(schema.batches.id, batch2Id));
      }
      await db.delete(schema.parentLinks).where(eq(schema.parentLinks.parentUserId, parentUserId));
      await db.delete(schema.session).where(eq(schema.session.userId, parentUserId));
      await db.delete(schema.session).where(eq(schema.session.userId, adminUserId));
      await db.delete(schema.profiles).where(eq(schema.profiles.userId, child1UserId));
      await db.delete(schema.profiles).where(eq(schema.profiles.userId, child2UserId));
      await db.delete(schema.profiles).where(eq(schema.profiles.userId, strangerStudentId));
      await db.delete(schema.profiles).where(eq(schema.profiles.userId, parentUserId));
      await db.delete(schema.profiles).where(eq(schema.profiles.userId, adminUserId));
      await db.delete(schema.user).where(eq(schema.user.id, child1UserId));
      await db.delete(schema.user).where(eq(schema.user.id, child2UserId));
      await db.delete(schema.user).where(eq(schema.user.id, strangerStudentId));
      await db.delete(schema.user).where(eq(schema.user.id, parentUserId));
      await db.delete(schema.user).where(eq(schema.user.id, adminUserId));
    } catch (err) {
      console.warn("Cleanup warning:", err);
    }
  });

  it("Test 1: Parent with two children switches between them and gets child-specific data", async () => {
    const parentUserObj = {
      id: parentUserId,
      email: `sunil.${timestamp}@parent.test`,
      role: "parent" as const,
    };

    // Child 1 Data
    const child1Home = await getParentHomeData(parentUserObj, child1UserId);
    expect(child1Home.child.id).toBe(child1UserId);
    expect(child1Home.child.fullName).toBe("Rohan Verma");
    expect(child1Home.child.classLevel).toBe(10);
    expect(child1Home.attendanceThisWeek.presentDays).toBeGreaterThanOrEqual(1);
    expect(child1Home.latestTestScore?.score).toBe(42);
    expect(child1Home.feeAlert.status).toBe("due_soon");
    expect(child1Home.feeAlert.amountPaise).toBe(450000);
    expect(child1Home.instituteWhatsApp.url).toContain(encodeURIComponent("Rohan Verma"));

    // Child 2 Data
    const child2Home = await getParentHomeData(parentUserObj, child2UserId);
    expect(child2Home.child.id).toBe(child2UserId);
    expect(child2Home.child.fullName).toBe("Ananya Verma");
    expect(child2Home.child.classLevel).toBe(12);
    expect(child2Home.attendanceThisWeek.absentDays).toBeGreaterThanOrEqual(1);
    expect(child2Home.latestTestScore?.score).toBe(88);
    expect(child2Home.instituteWhatsApp.url).toContain(encodeURIComponent("Ananya Verma"));

    // Both children are distinct in all modules
    expect(child1Home.child.id).not.toBe(child2Home.child.id);
    expect(child1Home.latestTestScore?.testTitle).not.toBe(child2Home.latestTestScore?.testTitle);
  });

  it("Test 2: Parent cannot access an unlinked student's data (403 Forbidden)", async () => {
    const parentUserObj = {
      id: parentUserId,
      email: `sunil.${timestamp}@parent.test`,
      role: "parent" as const,
    };

    await expect(
      getParentHomeData(parentUserObj, strangerStudentId)
    ).rejects.toThrow(/not authorized/i);

    await expect(
      getAvailableTests(parentUserId, "parent", { studentId: strangerStudentId })
    ).rejects.toThrow(/not authorized/i);
  });

  it("Test 3: Parent cannot start or attempt tests (403 Forbidden)", async () => {
    const req = new Request(`http://localhost:3000/api/v1/tests/${test1Id}/attempts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `better-auth.session_token=${parentCookie}`,
      },
    });

    const res = await postTestAttempt(req, {
      params: Promise.resolve({ id: test1Id }),
    });

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error?.message || body.error).toMatch(/Parents cannot start or attempt tests/i);
  });

  it("Test 4: Parent cannot post doubts (403 Forbidden)", async () => {
    const formData = new FormData();
    formData.append("title", "Why is gravity 9.8 m/s^2?");
    formData.append("body", "Please explain the derivation.");
    formData.append("batchId", batch1Id);

    const req = new Request("http://localhost:3000/api/v1/doubts", {
      method: "POST",
      headers: {
        Cookie: `better-auth.session_token=${parentCookie}`,
      },
      body: formData,
    });

    const res = await postDoubt(req);
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error?.message || body.error).toMatch(/Parents cannot ask or post doubts/i);
  });

  it("Test 5: Parent Home API route GET /api/v1/parent/home supports child switching", async () => {
    const reqChild1 = new Request(
      `http://localhost:3000/api/v1/parent/home?studentId=${child1UserId}`,
      {
        method: "GET",
        headers: {
          Cookie: `better-auth.session_token=${parentCookie}`,
        },
      }
    );

    const res1 = await getParentHome(reqChild1);
    expect(res1.status).toBe(200);
    const data1 = await res1.json();
    expect(data1.child.id).toBe(child1UserId);
    expect(data1.child.fullName).toBe("Rohan Verma");

    const reqChild2 = new Request(
      `http://localhost:3000/api/v1/parent/home?studentId=${child2UserId}`,
      {
        method: "GET",
        headers: {
          Cookie: `better-auth.session_token=${parentCookie}`,
        },
      }
    );

    const res2 = await getParentHome(reqChild2);
    expect(res2.status).toBe(200);
    const data2 = await res2.json();
    expect(data2.child.id).toBe(child2UserId);
    expect(data2.child.fullName).toBe("Ananya Verma");
  });

  it("Test 6: Parent fee due alert notification dispatches for dues due in <= 3 days", async () => {
    const result = await notifyFeeDuesToParents();
    expect(result.notifiedCount).toBeGreaterThanOrEqual(1);

    // Verify notification was delivered to parent's inbox
    const notifications = await db
      .select()
      .from(schema.notifications)
      .where(
        and(
          eq(schema.notifications.userId, parentUserId),
          eq(schema.notifications.type, "fee_due_alert")
        )
      );

    expect(notifications.length).toBeGreaterThanOrEqual(1);
    expect(notifications[0]?.body).toContain("Installment of ₹4,500");
  });

  it("Test 7: Admin can view linked parents on student's page, and manually link and unlink by hand", async () => {
    const adminUserObj = {
      id: adminUserId,
      email: `admin.${timestamp}@quick2learn.test`,
      role: "admin" as const,
    };

    // 1. Admin views student details
    const adminDetails = await getAdminStudentDetails(adminUserObj, child1UserId);
    expect(adminDetails).not.toBeNull();
    expect(adminDetails!.user.id).toBe(child1UserId);
    expect(adminDetails!.linkedParents.length).toBeGreaterThanOrEqual(1);
    expect(adminDetails!.linkedParents.some((p) => p.parentUserId === parentUserId)).toBe(true);

    // 2. Admin manually links a second parent (e.g., mother) by email
    const newParentEmail = `mother.${timestamp}@parent.test`;
    const linkResult = await adminLinkParentToStudent(
      adminUserObj,
      child1UserId,
      newParentEmail,
      "Mother"
    );
    expect(linkResult.success).toBe(true);
    expect(linkResult.link.relation).toBe("Mother");

    // Check that student now has 2 linked parents
    const updatedDetails = await getAdminStudentDetails(adminUserObj, child1UserId);
    expect(updatedDetails!.linkedParents.length).toBe(2);

    // 3. Admin manually unlinks the newly linked parent
    const unlinkResult = await adminUnlinkParentFromStudent(
      adminUserObj,
      linkResult.link.id
    );
    expect(unlinkResult.success).toBe(true);

    // Check that link is removed
    const finalDetails = await getAdminStudentDetails(adminUserObj, child1UserId);
    expect(finalDetails!.linkedParents.length).toBe(1);
    expect(finalDetails!.linkedParents.some((p) => p.id === linkResult.link.id)).toBe(false);
  });

  it("Test 8: Admin parent linking and unlinking HTTP API routes", async () => {
    const thirdParentEmail = `guardian.${timestamp}@parent.test`;

    // POST /api/v1/admin/students/[id]/parents
    const postReq = new Request(
      `http://localhost:3000/api/v1/admin/students/${child2UserId}/parents`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `better-auth.session_token=${adminCookie}`,
        },
        body: JSON.stringify({
          parentIdentifier: thirdParentEmail,
          relation: "Guardian",
        }),
      }
    );

    const postRes = await postAdminLinkParent(postReq, {
      params: Promise.resolve({ id: child2UserId }),
    });
    expect([200, 201]).toContain(postRes.status);
    const postData = await postRes.json();
    expect(postData.link.relation).toBe("Guardian");

    // DELETE /api/v1/admin/students/[id]/parents
    const deleteReq = new Request(
      `http://localhost:3000/api/v1/admin/students/${child2UserId}/parents`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Cookie: `better-auth.session_token=${adminCookie}`,
        },
        body: JSON.stringify({
          linkId: postData.link.id,
        }),
      }
    );

    const deleteRes = await deleteAdminUnlinkParent(deleteReq, {
      params: Promise.resolve({ id: child2UserId }),
    });
    expect(deleteRes.status).toBe(200);
    const deleteData = await deleteRes.json();
    expect(deleteData.success).toBe(true);
  });
});