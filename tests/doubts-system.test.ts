import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { Pool } from "pg";
import { db, schema, eq, and, sql } from "@quick2learn/db";
import {
  createDoubt,
  listStudentDoubts,
  getDoubtThread,
  addDoubtMessage,
  closeDoubt,
  markDoubtHelpful,
  listAdminDoubts,
  listCannedReplies,
  createCannedReply,
  sendDailyDoubtsDigest,
  generateDoubtPresignedPutUrls,
  ValidationError,
} from "../apps/web/src/server/data/doubts";
import { ForbiddenError, NotFoundError } from "../apps/web/src/server/authz";

const testDbUrl =
  process.env.DATABASE_URL_TEST ||
  "postgresql://postgres:postgres@localhost:5432/quick2learn_test";

const testPool = new Pool({
  connectionString: testDbUrl,
});

describe("Doubts System (Prompt 11) Integration Suite", () => {
  const teacherId = `teacher-d11-${Date.now()}`;
  const studentAId = `studentA-d11-${Date.now()}`;
  const studentBId = `studentB-d11-${Date.now()}`;
  let subjectId: string;
  let chapterId: string;
  let batchId: string;
  let lectureVideoId: string;

  const teacherUser = {
    id: teacherId,
    name: "Dinesh Singh Rajput",
    email: `${teacherId}@quick2learn.test`,
    role: "teacher" as const,
  };

  const studentAUser = {
    id: studentAId,
    name: "Aman Gupta",
    email: `${studentAId}@quick2learn.test`,
    role: "student" as const,
  };

  const studentBUser = {
    id: studentBId,
    name: "Pooja Verma",
    email: `${studentBId}@quick2learn.test`,
    role: "student" as const,
  };

  beforeAll(async () => {
    // 1. Seed Teacher
    await db.insert(schema.user).values({
      id: teacherId,
      name: teacherUser.name,
      email: teacherUser.email,
      role: teacherUser.role,
    });
    await db.insert(schema.profiles).values({
      userId: teacherId,
      role: "teacher",
      fullName: teacherUser.name,
    });

    // 2. Seed Students A and B
    await db.insert(schema.user).values([
      {
        id: studentAId,
        name: studentAUser.name,
        email: studentAUser.email,
        role: "student",
      },
      {
        id: studentBId,
        name: studentBUser.name,
        email: studentBUser.email,
        role: "student",
      },
    ]);
    await db.insert(schema.profiles).values([
      {
        userId: studentAId,
        role: "student",
        fullName: studentAUser.name,
        phone: "9876543210",
      },
      {
        userId: studentBId,
        role: "student",
        fullName: studentBUser.name,
        phone: "9876543211",
      },
    ]);

    // 3. Seed Subject & Chapter
    const [sub] = await db
      .insert(schema.subjects)
      .values({
        name: "Class 10 Mathematics",
        slug: `class-10-maths-d11-${Date.now()}`,
        classLevel: 10,
        board: "cbse",
      })
      .returning();
    subjectId = sub!.id;

    const [chap] = await db
      .insert(schema.chapters)
      .values({
        subjectId,
        number: 1,
        title: "Quadratic Equations",
        slug: `quadratics-d11-${Date.now()}`,
        classLevel: 10,
      })
      .returning();
    chapterId = chap!.id;

    // 4. Seed Batch
    const [b] = await db
      .insert(schema.batches)
      .values({
        slug: `batch-d11-${Date.now()}`,
        title: "Class 10 Board Champions 2026",
        description: "Comprehensive CBSE Mathematics Coaching",
        classLevel: 10,
        board: "cbse",
        subjectId,
        mode: "offline",
        scheduleText: "Mon, Wed, Fri 5:00 PM",
        startDate: new Date(),
        status: "open",
      })
      .returning();
    batchId = b!.id;

    // 5. Seed Lecture Video for timestamp doubt testing
    lectureVideoId = `vid-d11-${Date.now()}`;
    await db.insert(schema.youtubeVideos).values({
      id: lectureVideoId,
      title: "Derivation of Quadratic Formula by Completing Square",
      durationSeconds: 1800,
      classLevel: 10,
      subjectId,
      chapterId,
      isPublished: true,
      needsReview: false,
    });
  });

  afterAll(async () => {
    // Cleanup seeded records
    try {
      await db.delete(schema.doubts).where(eq(schema.doubts.studentId, studentAId));
      await db.delete(schema.doubts).where(eq(schema.doubts.studentId, studentBId));
      await db.delete(schema.youtubeVideos).where(eq(schema.youtubeVideos.id, lectureVideoId));
      await db.delete(schema.chapters).where(eq(schema.chapters.id, chapterId));
      await db.delete(schema.batches).where(eq(schema.batches.id, batchId));
      await db.delete(schema.subjects).where(eq(schema.subjects.id, subjectId));
      await db.delete(schema.profiles).where(eq(schema.profiles.userId, studentAId));
      await db.delete(schema.profiles).where(eq(schema.profiles.userId, studentBId));
      await db.delete(schema.profiles).where(eq(schema.profiles.userId, teacherId));
      await db.delete(schema.user).where(eq(schema.user.id, studentAId));
      await db.delete(schema.user).where(eq(schema.user.id, studentBId));
      await db.delete(schema.user).where(eq(schema.user.id, teacherId));
    } catch (e) {
      console.warn("Cleanup warning:", e);
    }
    await testPool.end();
  });

  // -------------------------------------------------------------------------
  // 1. PRESIGNED IMAGE UPLOADS
  // -------------------------------------------------------------------------
  it("generates presigned PUT URLs for up to 3 doubt image attachments", async () => {
    const files = [
      { filename: "question-step1.jpg", contentType: "image/jpeg", sizeBytes: 1024 * 1024 },
      { filename: "question-step2.png", contentType: "image/png", sizeBytes: 1024 * 1024 },
    ];

    const uploads = await generateDoubtPresignedPutUrls(studentAUser, files);
    expect(uploads).toHaveLength(2);
    expect(uploads[0]!.uploadUrl).toContain("http");
    expect(uploads[0]!.key).toContain(`doubts/${studentAId}/`);
    expect(uploads[1]!.key).toContain("question-step2");

    // Enforces at most 3 photos
    await expect(
      generateDoubtPresignedPutUrls(studentAUser, [
        { filename: "1.jpg", contentType: "image/jpeg" },
        { filename: "2.jpg", contentType: "image/jpeg" },
        { filename: "3.jpg", contentType: "image/jpeg" },
        { filename: "4.jpg", contentType: "image/jpeg" },
      ])
    ).rejects.toThrow(ValidationError);
  });

  // -------------------------------------------------------------------------
  // 2. CREATE DOUBT & MAX 5 OPEN DOUBTS CONSTRAINT
  // -------------------------------------------------------------------------
  it("enforces maximum 5 open doubts at once per student", async () => {
    const createdDoubtIds: string[] = [];

    // Create 5 open doubts for Student A
    for (let i = 1; i <= 5; i++) {
      const doubt = await createDoubt(studentAUser, {
        subjectId,
        chapterId,
        batchId,
        title: `Aman Doubt #${i}: Quadratic Formula Discriminant`,
        body: `Sir, why is D = b^2 - 4ac strictly positive for distinct real roots in test case ${i}?`,
        attachmentKeys: [`doubts/${studentAId}/photo-${i}.jpg`],
      });

      expect(doubt.id).toBeDefined();
      expect(doubt.status).toBe("open");
      expect(doubt.messagesCount).toBe(1);
      createdDoubtIds.push(doubt.id);
    }

    // Attempting to create the 6th open doubt MUST throw ValidationError
    await expect(
      createDoubt(studentAUser, {
        subjectId,
        chapterId,
        title: "Aman Doubt #6: This should be rejected",
        body: "Trying to exceed the 5 open doubts quota.",
      })
    ).rejects.toThrow(/at most 5 open doubts/i);

    // Verify student's open count is 5
    const studentList = await listStudentDoubts(studentAUser);
    expect(studentList.doubts).toHaveLength(5);
    expect(studentList.openCount).toBe(5);

    // Once one doubt is closed or answered, student CAN ask another
    await closeDoubt(studentAUser, createdDoubtIds[0]!);

    const listAfterClose = await listStudentDoubts(studentAUser);
    expect(listAfterClose.openCount).toBe(4);

    // Now 6th doubt can be created successfully!
    const newDoubt = await createDoubt(studentAUser, {
      subjectId,
      chapterId,
      title: "Aman Doubt #7: Allowed after closing previous",
      body: "Now we have 4 open doubts, so this 5th open doubt succeeds.",
    });
    expect(newDoubt.id).toBeDefined();
    expect(newDoubt.status).toBe("open");

    // Close remaining doubts from this test so Student A has quota for subsequent tests
    for (const id of [...createdDoubtIds, newDoubt.id]) {
      await closeDoubt(studentAUser, id).catch(() => {});
    }
  });

  // -------------------------------------------------------------------------
  // 3. STRICT PRIVACY ISOLATION (Done When: Students can't see each other's doubts)
  // -------------------------------------------------------------------------
  it("strictly enforces privacy: Student B CANNOT see or access Student A's doubt", async () => {
    // Student A creates a private doubt with a photo
    const doubtA = await createDoubt(studentAUser, {
      subjectId,
      chapterId,
      title: "Confidential Doubt regarding Question 4",
      body: "I am having trouble with negative roots.",
      attachmentKeys: [`doubts/${studentAId}/secret-diagram.jpg`],
    });

    // 1. Student A can access their own thread
    const threadA = await getDoubtThread(studentAUser, doubtA.id);
    expect(threadA.doubt.id).toBe(doubtA.id);
    expect(threadA.doubt.title).toBe("Confidential Doubt regarding Question 4");
    expect(threadA.messages).toHaveLength(1);

    // 2. Student B listing their own doubts DOES NOT see Student A's doubt
    const listB = await listStudentDoubts(studentBUser);
    const foundInB = listB.doubts.some((d) => d.id === doubtA.id);
    expect(foundInB).toBe(false);

    // 3. Student B attempting direct thread access throws ForbiddenError (403)
    await expect(getDoubtThread(studentBUser, doubtA.id)).rejects.toThrow(ForbiddenError);

    // 4. Student B attempting to reply to Student A's doubt throws ForbiddenError (403)
    await expect(
      addDoubtMessage(studentBUser, doubtA.id, {
        body: "I am intruding into your doubt thread.",
      })
    ).rejects.toThrow(ForbiddenError);

    // 5. Student B attempting to close Student A's doubt throws ForbiddenError (403)
    await expect(closeDoubt(studentBUser, doubtA.id)).rejects.toThrow(ForbiddenError);

    // 6. Student B attempting to mark Student A's doubt helpful throws ForbiddenError (403)
    await expect(markDoubtHelpful(studentBUser, doubtA.id)).rejects.toThrow(ForbiddenError);
  });

  // -------------------------------------------------------------------------
  // 4. WEBSITE ADMIN INBOX & OLDEST FIRST ORDERING
  // -------------------------------------------------------------------------
  it("admin inbox orders unanswered doubts OLDEST FIRST and filters by subject/batch", async () => {
    // Fetch unanswered doubts in admin inbox
    const inbox = await listAdminDoubts(teacherUser, {
      status: "unanswered",
      subjectId,
      page: 1,
      limit: 50,
    });

    expect(inbox.doubts.length).toBeGreaterThan(0);

    // Verify oldest first ordering: each doubt's activity timestamp is >= previous
    for (let i = 1; i < inbox.doubts.length; i++) {
      const prev = new Date(inbox.doubts[i - 1]!.lastActivityAt).getTime();
      const curr = new Date(inbox.doubts[i]!.lastActivityAt).getTime();
      expect(curr).toBeGreaterThanOrEqual(prev);
    }

    // Teacher has access to student's thread
    const thread = await getDoubtThread(teacherUser, inbox.doubts[0]!.id);
    expect(thread.doubt).toBeDefined();
    expect(thread.messages).toHaveLength(1);
    expect(thread.messages[0]!.authorRole).toBe("student");
  });

  // -------------------------------------------------------------------------
  // 5. TEACHER REPLY & PUSH NOTIFICATION (Done When 1)
  // -------------------------------------------------------------------------
  it("teacher replies with text and lecture timestamp link; doubt transitions to answered", async () => {
    // Create a specific doubt linked to a lecture timestamp
    const doubtWithLecture = await createDoubt(studentAUser, {
      subjectId,
      chapterId,
      sourceType: "lecture",
      sourceId: lectureVideoId,
      timestampSeconds: 154, // 02:34
      title: "Step 2 of completing the square confusion",
      body: "At 02:34 in the lecture, why do we add (b/2a)^2 to both sides?",
      attachmentKeys: [`doubts/${studentAId}/photo-completing-square.jpg`],
    });

    // Check thread source context
    const threadBefore = await getDoubtThread(studentAUser, doubtWithLecture.id);
    expect(threadBefore.sourceContext).toBeDefined();
    expect(threadBefore.sourceContext?.lectureId).toBe(lectureVideoId);
    expect(threadBefore.sourceContext?.timestampFormatted).toBe("2:34");

    // Teacher replies with explanation and lecture timestamp link
    const replyRes = await addDoubtMessage(teacherUser, doubtWithLecture.id, {
      body: "Adding (b/2a)^2 completes the perfect square trinomial (x + b/2a)^2. Notice how expanding this gives back the middle term bx/a.",
      lectureLink: {
        lectureId: lectureVideoId,
        timestampSeconds: 165,
        title: "Completing Square Derivation",
      },
    });

    expect(replyRes.message.authorRole).toBe("teacher");
    expect(replyRes.message.body).toContain("/lecture/");
    expect(replyRes.message.body).toContain("?t=165");
    expect(replyRes.doubt.status).toBe("answered");
    expect(replyRes.doubt.assignedTeacherId).toBe(teacherId);

    // Verify student sees updated thread with teacher's answer
    const threadAfter = await getDoubtThread(studentAUser, doubtWithLecture.id);
    expect(threadAfter.doubt.status).toBe("answered");
    expect(threadAfter.messages).toHaveLength(2);
    expect(threadAfter.messages[1]!.authorName).toBe(teacherUser.name);

    // Check notifications table for student's push notification
    const notifications = await db
      .select()
      .from(schema.notifications)
      .where(
        and(
          eq(schema.notifications.userId, studentAId),
          eq(schema.notifications.type, "doubt_reply")
        )
      );

    expect(notifications.length).toBeGreaterThan(0);
    const latestNotif = notifications[notifications.length - 1]!;
    expect(latestNotif.title).toContain("Doubt Answered");
    expect(latestNotif.data).toHaveProperty("route", `/doubt/${doubtWithLecture.id}`);
  });

  // -------------------------------------------------------------------------
  // 6. "THIS SOLVED IT" CLOSES DOUBT & SENDS TEACHER RATING
  // -------------------------------------------------------------------------
  it("student taps 'This solved it' to mark helpful and close the doubt", async () => {
    // Create doubt & have teacher reply
    const d = await createDoubt(studentAUser, {
      subjectId,
      chapterId,
      title: "Factorization of 2x^2 + 7x + 3",
      body: "How do we split the middle term?",
    });

    await addDoubtMessage(teacherUser, d.id, {
      body: "Find two numbers whose product is 2*3=6 and sum is 7. Those numbers are 6 and 1! So 2x^2 + 6x + x + 3 = 2x(x+3) + 1(x+3) = (2x+1)(x+3).",
    });

    // Student marks it helpful
    const solved = await markDoubtHelpful(studentAUser, d.id);
    expect(solved.status).toBe("closed");
    expect(solved.isHelpful).toBe(true);

    const thread = await getDoubtThread(studentAUser, d.id);
    expect(thread.doubt.status).toBe("closed");
    expect(thread.doubt.isHelpful).toBe(true);
  });

  // -------------------------------------------------------------------------
  // 7. CANNED REPLIES & DAILY TEACHER DIGEST
  // -------------------------------------------------------------------------
  it("lists canned replies and sends daily doubts digest push to teachers", async () => {
    // Canned replies
    const canned = await listCannedReplies(teacherUser);
    expect(canned.length).toBeGreaterThan(0);

    const newCanned = await createCannedReply(teacherUser, {
      title: "Sign Check In Trigonometry",
      body: "Remember CAST rule: Cosine in 4th, All in 1st, Sine in 2nd, Tangent in 3rd quadrant.",
      category: "Math",
    });
    expect(newCanned.id).toBeDefined();

    // Daily digest
    const digest = await sendDailyDoubtsDigest();
    expect(digest.openCount).toBeGreaterThan(0);
    expect(digest.notified).toBe(true);

    // Verify teacher received digest notification
    const teacherNotifs = await db
      .select()
      .from(schema.notifications)
      .where(
        and(
          eq(schema.notifications.userId, teacherId),
          eq(schema.notifications.type, "doubts_digest")
        )
      );

    expect(teacherNotifs.length).toBeGreaterThan(0);
    expect(teacherNotifs[0]!.title).toContain("Daily Doubts Digest");
  });
});
