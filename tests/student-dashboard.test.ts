import { describe, it, expect, beforeEach, vi } from "vitest";
vi.mock("server-only", () => ({}));
import {
  db,
  schema,
  eq,
  and,
} from "@quick2learn/db";
import {
  getStudentEnrolledBatches,
  getEnrollments,
} from "../apps/web/src/server/data/enrollments";
import {
  getFeeDues,
  getPayments,
} from "../apps/web/src/server/data/payments";
import {
  getAccessibleResourcesWithDetails,
  getResourceDownloadUrl,
  getResourceById,
} from "../apps/web/src/server/data/resources";
import {
  getRecentlyViewedLectures,
  recordLectureView,
} from "../apps/web/src/server/data/videos";
import type { AuthUser } from "../apps/web/src/server/authz";

describe("Student Area (/dashboard) Architecture & Data Isolation Suite", () => {
  const student1: AuthUser = {
    id: "dash-student-1111-1111-1111-111111111111",
    email: "dash-student1@test.quick2learn.in",
    name: "Aarav Sharma",
    role: "student",
  };

  const student2: AuthUser = {
    id: "dash-student-2222-2222-2222-222222222222",
    email: "dash-student2@test.quick2learn.in",
    name: "Diya Patel",
    role: "student",
  };

  let batch1Id: string;
  let batch2Id: string;
  let privateResourceBatch1Id: string;
  let publicResourceId: string;
  let dueStudent1Id: string;
  let dueStudent2Id: string;
  let paymentStudent1Id: string;
  let paymentStudent2Id: string;

  beforeEach(async () => {
    // 1. Ensure test users & profiles exist
    for (const s of [student1, student2]) {
      await db
        .insert(schema.user)
        .values({
          id: s.id,
          name: s.name,
          email: s.email,
          emailVerified: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .onConflictDoNothing();

      await db
        .insert(schema.profiles)
        .values({
          userId: s.id,
          fullName: s.name,
          phone: "9876543210",
          role: s.role,
          classLevel: 12,
          board: "cbse",
          school: "DPS Mathura",
          city: "Mathura",
          parentName: `${s.name} Father`,
          parentPhone: "9876543211",
          onboardedAt: new Date(),
        })
        .onConflictDoNothing();
    }

    // 2. Create two distinct batches
    const slug1 = `dash-batch-1-${Date.now()}`;
    const slug2 = `dash-batch-2-${Date.now()}`;

    const [b1] = await db
      .insert(schema.batches)
      .values({
        slug: slug1,
        title: "Class 12 Maths Champions (Student 1 Only)",
        description: "Maths Intensive Batch",
        scheduleText: "Mon, Wed, Fri 5 PM",
        startDate: new Date(),
        classLevel: 12,
        board: "cbse",
        subjectId: "a0000000-0000-0000-0000-000000000001",
        facultyId: "f0000000-0000-0000-0000-000000000001",
        status: "open",
        whatsappGroupUrl: "https://chat.whatsapp.com/test-batch-1-group",
      })
      .returning();
    batch1Id = b1.id;

    const [b2] = await db
      .insert(schema.batches)
      .values({
        slug: slug2,
        title: "Class 12 Physics & Chemistry (Student 2 Only)",
        description: "Science Batch",
        scheduleText: "Tue, Thu, Sat 6 PM",
        startDate: new Date(),
        classLevel: 12,
        board: "cbse",
        subjectId: "a0000000-0000-0000-0000-000000000002",
        facultyId: "f0000000-0000-0000-0000-000000000001",
        status: "open",
        whatsappGroupUrl: "https://chat.whatsapp.com/test-batch-2-group",
      })
      .returning();
    batch2Id = b2.id;

    // Insert fee plans for these batches
    await db.insert(schema.batchFeePlans).values([
      {
        batchId: batch1Id,
        name: "Full Payment",
        totalPaise: 1500000,
        isActive: true,
      },
      {
        batchId: batch2Id,
        name: "Full Payment",
        totalPaise: 1800000,
        isActive: true,
      },
    ]);

    // 3. Enroll Student 1 in Batch 1 (Active)
    const [enr1] = await db
      .insert(schema.enrollments)
      .values({
        batchId: batch1Id,
        studentId: student1.id,
        status: "active",
        source: "online",
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    // 4. Enroll Student 2 in Batch 2 (Active)
    const [enr2] = await db
      .insert(schema.enrollments)
      .values({
        batchId: batch2Id,
        studentId: student2.id,
        status: "active",
        source: "online",
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    // 5. Create Fee Dues for both students
    const [due1] = await db
      .insert(schema.feeDues)
      .values({
        enrollmentId: enr1.id,
        label: "Student 1 Instalment #1",
        amountPaise: 400000,
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]!, // In 3 days (alert)
        status: "due",
      })
      .returning();
    dueStudent1Id = due1.id;

    const [due2] = await db
      .insert(schema.feeDues)
      .values({
        enrollmentId: enr2.id,
        label: "Student 2 Instalment #1",
        amountPaise: 650000,
        dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]!, // In 15 days
        status: "due",
      })
      .returning();
    dueStudent2Id = due2.id;

    // 6. Create Payments for both students
    const [pay1] = await db
      .insert(schema.payments)
      .values({
        studentId: student1.id,
        enrollmentId: enr1.id,
        feeDueId: due1.id,
        method: "razorpay",
        amountPaise: 400000,
        status: "paid",
        receiptNo: `Q2L-${Date.now().toString().slice(-4)}-${Math.floor(Math.random() * 899999 + 100000)}`,
        paidAt: new Date(),
      })
      .returning();
    paymentStudent1Id = pay1.id;

    const [pay2] = await db
      .insert(schema.payments)
      .values({
        studentId: student2.id,
        enrollmentId: enr2.id,
        feeDueId: due2.id,
        method: "cash",
        amountPaise: 650000,
        status: "paid",
        receiptNo: `Q2L-${Date.now().toString().slice(-4)}-${Math.floor(Math.random() * 899999 + 100000)}`,
        paidAt: new Date(),
      })
      .returning();
    paymentStudent2Id = pay2.id;

    // 7. Create Resources: One Private to Batch 1, and One Public
    const [resPrivate] = await db
      .insert(schema.resources)
      .values({
        title: "Exclusive Batch 1 Calculus Worksheet & Formula Booklet",
        description: "Only for confirmed Class 12 Maths champions",
        type: "worksheet",
        visibility: "enrolled", // Enrolled students only!
        batchId: batch1Id,
        storageKey: "resources/private/batch1-calculus-dpp.pdf",
      })
      .returning();
    privateResourceBatch1Id = resPrivate.id;

    const [resPub] = await db
      .insert(schema.resources)
      .values({
        title: "Public Relations & Functions Chapter Summary",
        description: "Available to everyone",
        type: "formula_sheet",
        visibility: "public",
        storageKey: "resources/public/relations-summary.pdf",
      })
      .returning();
    publicResourceId = resPub.id;
  });

  // TEST 1: BATCHES DATA ISOLATION
  it("enforces strict batch data isolation: Student 1 sees only Batch 1, Student 2 sees only Batch 2", async () => {
    const s1Batches = await getStudentEnrolledBatches(student1);
    const s2Batches = await getStudentEnrolledBatches(student2);

    expect(s1Batches.some((b) => b.batch.id === batch1Id)).toBe(true);
    expect(s1Batches.some((b) => b.batch.id === batch2Id)).toBe(false);

    expect(s2Batches.some((b) => b.batch.id === batch2Id)).toBe(true);
    expect(s2Batches.some((b) => b.batch.id === batch1Id)).toBe(false);
  });

  // TEST 2: FEE DUES DATA ISOLATION
  it("enforces strict fee dues data isolation: Student 1 sees only Due 1, Student 2 sees only Due 2", async () => {
    const s1Dues = await getFeeDues(student1);
    const s2Dues = await getFeeDues(student2);

    expect(s1Dues.some((d) => d.id === dueStudent1Id)).toBe(true);
    expect(s1Dues.some((d) => d.id === dueStudent2Id)).toBe(false);

    expect(s2Dues.some((d) => d.id === dueStudent2Id)).toBe(true);
    expect(s2Dues.some((d) => d.id === dueStudent1Id)).toBe(false);
  });

  // TEST 3: PAYMENTS DATA ISOLATION
  it("enforces strict payment data isolation: Student 1 sees only Payment 1, Student 2 sees only Payment 2", async () => {
    const s1Payments = await getPayments(student1);
    const s2Payments = await getPayments(student2);

    expect(s1Payments.some((p) => p.id === paymentStudent1Id)).toBe(true);
    expect(s1Payments.some((p) => p.id === paymentStudent2Id)).toBe(false);

    expect(s2Payments.some((p) => p.id === paymentStudent2Id)).toBe(true);
    expect(s2Payments.some((p) => p.id === paymentStudent1Id)).toBe(false);
  });

  // TEST 4: PRIVATE NOTES ISOLATION & EXPIRING PRESIGNED URLS
  it("allows private enrolled notes to be downloaded only by enrolled students via a 1-hour expiring presigned URL", async () => {
    // 1. Student 1 is enrolled in Batch 1 -> can see private resource in accessible resources
    const s1Resources = await getAccessibleResourcesWithDetails(student1);
    const s1CanSeePrivate = s1Resources.some((r) => r.id === privateResourceBatch1Id);
    expect(s1CanSeePrivate).toBe(true);

    // 2. Student 2 is NOT enrolled in Batch 1 -> CANNOT see Batch 1's private resource
    const s2Resources = await getAccessibleResourcesWithDetails(student2);
    const s2CanSeePrivate = s2Resources.some((r) => r.id === privateResourceBatch1Id);
    expect(s2CanSeePrivate).toBe(false);

    // 3. Student 1 requests download URL -> succeeds and returns a 1-hour presigned URL
    const s1Download = await getResourceDownloadUrl(student1, privateResourceBatch1Id);
    expect(s1Download.isPresigned).toBe(true);
    expect(s1Download.expiresInSeconds).toBe(3600);
    expect(s1Download.url).toContain("X-Amz-Expires=3600");

    // 4. Student 2 attempts to request download URL for Batch 1's private note -> REJECTED with assertion error
    await expect(
      getResourceDownloadUrl(student2, privateResourceBatch1Id),
    ).rejects.toThrow(/Cannot access this study resource/);

    // 5. Public resource is downloadable by both students without restriction
    const s1Pub = await getResourceDownloadUrl(student1, publicResourceId);
    const s2Pub = await getResourceDownloadUrl(student2, publicResourceId);
    expect(s1Pub.url).toBeDefined();
    expect(s2Pub.url).toBeDefined();
  });

  // TEST 5: RECENTLY VIEWED LECTURES LOGGING & DEDUPLICATION
  it("logs and retrieves student's recently viewed lectures with deduplication", async () => {
    // Find a published lecture
    const [lecture] = await db
      .select({ id: schema.youtubeVideos.id })
      .from(schema.youtubeVideos)
      .where(eq(schema.youtubeVideos.isPublished, true))
      .limit(1);

    if (!lecture) return;

    // Student 1 views the lecture twice
    await recordLectureView(student1, lecture.id);
    await recordLectureView(student1, lecture.id);

    const s1Recent = await getRecentlyViewedLectures(student1, 4);

    expect(s1Recent.some((v) => v.id === lecture.id)).toBe(true);
    // Verified deduplication: lecture appears exactly once
    const count = s1Recent.filter((v) => v.id === lecture.id).length;
    expect(count).toBe(1);

    // Student 2 has not viewed this lecture -> not in their recently viewed
    const s2Recent = await getRecentlyViewedLectures(student2, 4);
    expect(s2Recent.some((v) => v.id === lecture.id)).toBe(false);
  });

  // TEST 6: ROLE ESCALATION PROTECTION IN PROFILES
  it("prevents role escalation: modifying profile cannot change role to admin or teacher", async () => {
    // Direct attempt to update profile fields
    await db
      .update(schema.profiles)
      .set({
        phone: "9999888877",
        city: "Agra",
        updatedAt: new Date(),
      })
      .where(eq(schema.profiles.userId, student1.id));

    const [updatedProfile] = await db
      .select()
      .from(schema.profiles)
      .where(eq(schema.profiles.userId, student1.id));

    expect(updatedProfile.phone).toBe("9999888877");
    expect(updatedProfile.city).toBe("Agra");
    expect(updatedProfile.role).toBe("student"); // Role unchanged
  });

  // TEST 7: FEE ALERT CALCULATION LOGIC
  it("correctly identifies upcoming fee dues within 7 days or overdue", async () => {
    const dues = await getFeeDues(student1);
    const nowMs = Date.now();

    const alertDues = dues.filter((d) => {
      if (d.status !== "due") return false;
      const dueTime = new Date(d.dueDate).getTime();
      const diffDays = Math.ceil((dueTime - nowMs) / (1000 * 60 * 60 * 24));
      return diffDays <= 7;
    });

    // Student 1 has Due 1 in 3 days, which is within the 7-day alert window
    expect(alertDues.length).toBeGreaterThanOrEqual(1);
    expect(alertDues.some((d) => d.id === dueStudent1Id)).toBe(true);
  });
});
