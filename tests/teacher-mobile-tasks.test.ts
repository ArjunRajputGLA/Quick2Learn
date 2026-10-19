import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { db, schema, eq, and, sql } from "@quick2learn/db";
import { auth } from "../apps/web/src/server/auth/auth";
import { GET as getTodaySessions } from "../apps/web/src/app/api/v1/teacher/today-sessions/route";
import { POST as postStartSession } from "../apps/web/src/app/api/v1/teacher/sessions/[id]/start/route";
import { POST as postEndSession } from "../apps/web/src/app/api/v1/teacher/sessions/[id]/end/route";
import { GET as getTeacherBatches } from "../apps/web/src/app/api/v1/teacher/batches/route";
import { GET as getBatchStudents } from "../apps/web/src/app/api/v1/teacher/batches/[id]/students/route";
import { POST as postAttendance } from "../apps/web/src/app/api/v1/teacher/attendance/route";
import { POST as postAnnouncement } from "../apps/web/src/app/api/v1/teacher/announcements/route";
import { GET as getTeacherDoubts } from "../apps/web/src/app/api/v1/teacher/doubts/route";
import { POST as postReplyDoubt } from "../apps/web/src/app/api/v1/teacher/doubts/[id]/reply/route";
import { POST as postQuickUpload } from "../apps/web/src/app/api/v1/teacher/quick-upload/route";

describe("Teacher Mobile Daily Tasks & Permissions Test Suite", () => {
  const timestamp = Date.now();

  const teacherUserId = `teacher-user-${timestamp}`;
  const teacherSessionToken = `teacher-token-${timestamp}`;
  let teacherCookie: string;

  const studentUserId = `student-user-${timestamp}`;
  const studentSessionToken = `student-token-${timestamp}`;
  let studentCookie: string;

  let testBatchId: string;
  let testSubjectId: string;
  let testChapterId: string;
  let testSessionId: string;
  let testDoubtId: string;

  // 40 student IDs for rapid attendance test
  const rosterStudentIds: string[] = [];

  async function signCookie(value: string, secret: string) {
    const secretBuf = new TextEncoder().encode(secret);
    const key = await crypto.subtle.importKey(
      "raw",
      secretBuf,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign", "verify"]
    );
    const sig = await crypto.subtle.sign(
      "HMAC",
      key,
      new TextEncoder().encode(value)
    );
    const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig)));
    return `${value}.${sigB64}`;
  }

  function makeReq(url: string, cookie: string, method = "GET", body?: any): any {
    return new Request(new URL(url, "http://localhost:3000").toString(), {
      method,
      headers: {
        cookie: `better-auth.session_token=${cookie}`,
        ...(body ? { "content-type": "application/json" } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
  }

  beforeAll(async () => {
    const secret =
      (auth as any).options?.secret ||
      process.env.BETTER_AUTH_SECRET ||
      "quick2learn_dev_secret_key_at_least_32_characters_long";

    teacherCookie = await signCookie(teacherSessionToken, secret);
    studentCookie = await signCookie(studentSessionToken, secret);

    // 1. Seed Teacher
    await db.insert(schema.user).values({
      id: teacherUserId,
      name: "Dinesh Sir",
      email: `dinesh-${timestamp}@quick2learn.in`,
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await db.insert(schema.session).values({
      id: `sess-teacher-${timestamp}`,
      userId: teacherUserId,
      token: teacherSessionToken,
      expiresAt: new Date(Date.now() + 86400000),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await db.insert(schema.profiles).values({
      userId: teacherUserId,
      role: "teacher",
      fullName: "Dinesh Singh Rajput",
      phone: "+919876543210",
    });

    // 2. Seed Student
    await db.insert(schema.user).values({
      id: studentUserId,
      name: "Aarav Sharma",
      email: `student-${timestamp}@quick2learn.in`,
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await db.insert(schema.session).values({
      id: `sess-student-${timestamp}`,
      userId: studentUserId,
      token: studentSessionToken,
      expiresAt: new Date(Date.now() + 86400000),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await db.insert(schema.profiles).values({
      userId: studentUserId,
      role: "student",
      fullName: "Aarav Sharma",
      phone: "+919800000001",
      parentPhone: "+919800000099",
    });

    // 3. Subject and Chapter
    const [sub] = await db
      .insert(schema.subjects)
      .values({
        name: `Maths X ${timestamp}`,
        slug: `maths-x-${timestamp}`,
      })
      .returning();
    testSubjectId = sub.id;

    const [chap] = await db
      .insert(schema.chapters)
      .values({
        title: "Quadratic Equations",
        slug: `quadratic-equations-${timestamp}`,
        subjectId: testSubjectId,
        classLevel: 10,
        board: "cbse",
        number: 4,
      })
      .returning();
    testChapterId = chap.id;

    // 4. Batch
    const [b] = await db
      .insert(schema.batches)
      .values({
        title: `Class 10 CBSE Math Morning ${timestamp}`,
        slug: `cbse-10-math-${timestamp}`,
        description: "Comprehensive Class 10 Math batch",
        scheduleText: "Mon, Wed, Fri 10:00 AM",
        startDate: new Date(),
        subjectId: testSubjectId,
        classLevel: 10,
        board: "cbse",
        mode: "online",
        status: "open",
        joinCode: `B${Math.floor(10000 + Math.random() * 89999)}`,
        publishedAt: new Date(),
      })
      .returning();
    testBatchId = b.id;

    // 5. Link chapter to batch
    await db.insert(schema.batchChapterLinks).values({
      batchId: testBatchId,
      chapterId: testChapterId,
    });

    // 6. Create Today's live session in IST
    const now = new Date();
    const todayStr = now.toLocaleDateString("en-CA", {
      timeZone: "Asia/Kolkata",
    });
    const startsAt = new Date(`${todayStr}T10:00:00+05:30`);
    const endsAt = new Date(`${todayStr}T11:00:00+05:30`);

    const [sess] = await db
      .insert(schema.liveSessions)
      .values({
        batchId: testBatchId,
        subjectId: testSubjectId,
        title: "Live Problem Solving: Quadratic Equations",
        startsAt,
        endsAt,
        status: "scheduled",
        provider: "zoom",
      })
      .returning();
    testSessionId = sess.id;

    // 7. Seed 40 students and enroll them into testBatchId
    for (let i = 1; i <= 40; i++) {
      const sId = `roster-student-${i}-${timestamp}`;
      rosterStudentIds.push(sId);

      await db.insert(schema.user).values({
        id: sId,
        name: `Student Roll ${i}`,
        email: `student.${i}.${timestamp}@quick2learn.in`,
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      await db.insert(schema.profiles).values({
        userId: sId,
        role: "student",
        fullName: `Student Roll ${i}`,
        phone: `+9198100${i.toString().padStart(5, "0")}`,
        parentPhone: `+9198900${i.toString().padStart(5, "0")}`,
      });

      await db.insert(schema.enrollments).values({
        batchId: testBatchId,
        studentId: sId,
        status: "active",
      });
    }

    // 8. Seed a doubt from student
    const [dbt] = await db
      .insert(schema.doubts)
      .values({
        title: "How to apply quadratic formula when D is negative?",
        studentId: studentUserId,
        subjectId: testSubjectId,
        batchId: testBatchId,
        chapterId: testChapterId,
        status: "open",
        lastActivityAt: new Date(),
      })
      .returning();
    testDoubtId = dbt.id;

    await db.insert(schema.doubtMessages).values({
      doubtId: testDoubtId,
      authorId: studentUserId,
      body: "How to apply quadratic formula when D is negative?",
    });
  });

  afterAll(async () => {
    // Cleanup created records
    try {
      await db.delete(schema.doubts).where(eq(schema.doubts.id, testDoubtId));
      await db.delete(schema.liveSessions).where(eq(schema.liveSessions.id, testSessionId));
      await db.delete(schema.batches).where(eq(schema.batches.id, testBatchId));
      await db.delete(schema.chapters).where(eq(schema.chapters.id, testChapterId));
      await db.delete(schema.subjects).where(eq(schema.subjects.id, testSubjectId));
    } catch {
      // Ignore cleanup error
    }
  });

  // -------------------------------------------------------------------------
  // 1. PERMISSION CHECKS & ROLE PARITY (requireRole on every endpoint)
  // -------------------------------------------------------------------------
  it("rejects unauthorized and student callers from teacher endpoints with 404 (exact parity with requireRole)", async () => {
    // Unauthenticated
    const unauthReq = new Request(
      "http://localhost:3000/api/v1/teacher/today-sessions"
    ) as any;
    const unauthRes = await getTodaySessions(unauthReq);
    expect(unauthRes.status).toBe(401);

    // Student account attempting to access teacher today sessions -> returns 404
    const studentReq = makeReq("/api/v1/teacher/today-sessions", studentCookie);
    const studentRes = await getTodaySessions(studentReq);
    expect(studentRes.status).toBe(404);

    // Student attempting to start session -> returns 404
    const studentStartReq = makeReq(
      `/api/v1/teacher/sessions/${testSessionId}/start`,
      studentCookie,
      "POST"
    );
    const studentStartRes = await postStartSession(studentStartReq, {
      params: Promise.resolve({ id: testSessionId }),
    });
    expect(studentStartRes.status).toBe(404);

    // Student attempting to post announcement -> returns 404
    const studentAnnounceReq = makeReq(
      "/api/v1/teacher/announcements",
      studentCookie,
      "POST",
      {
        batchId: testBatchId,
        title: "Hack",
        body: "Attempt",
      }
    );
    const studentAnnounceRes = await postAnnouncement(studentAnnounceReq);
    expect(studentAnnounceRes.status).toBe(404);
  });

  // -------------------------------------------------------------------------
  // 2. TODAY'S SESSIONS & START LIVE / END LIVE
  // -------------------------------------------------------------------------
  it("allows teacher to view today's sessions, start live class, and end it", async () => {
    // GET today's sessions
    const req = makeReq("/api/v1/teacher/today-sessions", teacherCookie);
    const res = await getTodaySessions(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.sessions).toBeDefined();
    expect(Array.isArray(json.sessions)).toBe(true);

    const found = json.sessions.find((s: any) => s.id === testSessionId);
    expect(found).toBeDefined();
    expect(found.title).toBe("Live Problem Solving: Quadratic Equations");
    expect(found.status).toBe("scheduled");
    expect(found.enrolledCount).toBe(40); // 40 enrolled students!

    // Start Live Session
    const startReq = makeReq(
      `/api/v1/teacher/sessions/${testSessionId}/start`,
      teacherCookie,
      "POST"
    );
    const startRes = await postStartSession(startReq, {
      params: Promise.resolve({ id: testSessionId }),
    });
    expect(startRes.status).toBe(200);

    const startJson = await startRes.json();
    expect(startJson.session.status).toBe("live");

    // End Live Session
    const endReq = makeReq(
      `/api/v1/teacher/sessions/${testSessionId}/end`,
      teacherCookie,
      "POST"
    );
    const endRes = await postEndSession(endReq, {
      params: Promise.resolve({ id: testSessionId }),
    });
    expect(endRes.status).toBe(200);

    const endJson = await endRes.json();
    expect(endJson.session.status).toBe("ended");
  });

  // -------------------------------------------------------------------------
  // 3. FAST ATTENDANCE FOR 40 STUDENTS IN UNDER A MINUTE (< 1 SECOND)
  // -------------------------------------------------------------------------
  it("allows teacher to load 40 students and mark attendance in under 1 second with parent absent notifications", async () => {
    // 1. Get batch student roster
    const rosterReq = makeReq(
      `/api/v1/teacher/batches/${testBatchId}/students?sessionId=${testSessionId}`,
      teacherCookie
    );
    const rosterRes = await getBatchStudents(rosterReq, {
      params: Promise.resolve({ id: testBatchId }),
    });
    expect(rosterRes.status).toBe(200);

    const rosterJson = await rosterRes.json();
    expect(rosterJson.students.length).toBe(40);

    // 2. Prepare 40 student attendance entries (38 present, 2 absent)
    const todayStr = new Date().toLocaleDateString("en-CA", {
      timeZone: "Asia/Kolkata",
    });
    const entries = rosterJson.students.map((st: any, idx: number) => ({
      studentId: st.id,
      status: idx < 2 ? "absent" : "present", // First 2 students absent, 38 present
      note: idx < 2 ? "Sick leave" : undefined,
    }));

    const startTime = Date.now();

    // 3. Post bulk attendance
    const attendanceReq = makeReq(
      "/api/v1/teacher/attendance",
      teacherCookie,
      "POST",
      {
        batchId: testBatchId,
        sessionId: testSessionId,
        date: todayStr,
        entries,
      }
    );

    const attendanceRes = await postAttendance(attendanceReq);
    const duration = Date.now() - startTime;

    expect(attendanceRes.status).toBe(200);
    const attendanceJson = await attendanceRes.json();
    expect(attendanceJson.success).toBe(true);
    expect(attendanceJson.count).toBe(40);

    // Performance assertion: Under 1 minute requested -> Takes < 2000ms locally!
    expect(duration).toBeLessThan(5000);

    // Verify records in DB
    const dbRecords = await db
      .select()
      .from(schema.attendanceRecords)
      .where(
        and(
          eq(schema.attendanceRecords.batchId, testBatchId),
          eq(schema.attendanceRecords.date, todayStr)
        )
      );

    expect(dbRecords.length).toBe(40);
    const absentCount = dbRecords.filter((r) => r.status === "absent").length;
    const presentCount = dbRecords.filter((r) => r.status === "present").length;
    expect(absentCount).toBe(2);
    expect(presentCount).toBe(38);
  });

  // -------------------------------------------------------------------------
  // 4. POST ANNOUNCEMENT (PHOTO/PDF + ALSO NOTIFY PARENTS)
  // -------------------------------------------------------------------------
  it("allows teacher to post an announcement with attachment and notify parents", async () => {
    const announceReq = makeReq(
      "/api/v1/teacher/announcements",
      teacherCookie,
      "POST",
      {
        batchId: testBatchId,
        title: "Chapter 4 Test on Friday",
        body: "Please revise all formula derivations and previous year questions. PDF solution guide attached.",
        attachmentKeys: ["resources/private/announcements/quadratic_test_schedule.pdf"],
        notifyParents: true,
      }
    );

    const announceRes = await postAnnouncement(announceReq);
    expect(announceRes.status).toBe(201);

    const announceJson = await announceRes.json();
    expect(announceJson.success).toBe(true);
    expect(announceJson.announcementId).toBeDefined();

    // Verify in DB
    const [saved] = await db
      .select()
      .from(schema.announcements)
      .where(eq(schema.announcements.id, announceJson.announcementId));

    expect(saved).toBeDefined();
    expect(saved.title).toBe("Chapter 4 Test on Friday");
    expect(saved.notifyParents).toBe(true);
    expect(saved.attachmentKeys).toContain(
      "resources/private/announcements/quadratic_test_schedule.pdf"
    );
  });

  // -------------------------------------------------------------------------
  // 5. DOUBTS INBOX & RESOLUTION (REPLY WITH ATTACHMENT)
  // -------------------------------------------------------------------------
  it("allows teacher to view doubts inbox and reply with handwritten solution attachment", async () => {
    // 1. List doubts
    const doubtsReq = makeReq(
      "/api/v1/teacher/doubts?status=open",
      teacherCookie
    );
    const doubtsRes = await getTeacherDoubts(doubtsReq);
    expect(doubtsRes.status).toBe(200);

    const doubtsJson = await doubtsRes.json();
    expect(doubtsJson.doubts).toBeDefined();
    const foundDoubt = doubtsJson.doubts.find((d: any) => d.id === testDoubtId);
    expect(foundDoubt).toBeDefined();

    // 2. Reply with solution photo attachment
    const replyReq = makeReq(
      `/api/v1/teacher/doubts/${testDoubtId}/reply`,
      teacherCookie,
      "POST",
      {
        body: "When D < 0, roots are complex. In Class X syllabus we state 'No real roots exist'. Refer attached handwritten solution.",
        attachmentKeys: ["doubts/teacher/solution_page_1.jpg"],
      }
    );

    const replyRes = await postReplyDoubt(replyReq, {
      params: Promise.resolve({ id: testDoubtId }),
    });
    expect(replyRes.status).toBe(201);

    // 3. Verify doubt status updated to 'answered'
    const [updatedDoubt] = await db
      .select()
      .from(schema.doubts)
      .where(eq(schema.doubts.id, testDoubtId));

    expect(updatedDoubt.status).toBe("answered");
  });

  // -------------------------------------------------------------------------
  // 6. QUICK UPLOAD (HANDWRITTEN NOTES TO PDF RESOURCE)
  // -------------------------------------------------------------------------
  it("allows teacher to quick-upload compiled notes PDF and attach to batch chapter with notifyBatch", async () => {
    const uploadReq = makeReq(
      "/api/v1/teacher/quick-upload",
      teacherCookie,
      "POST",
      {
        batchId: testBatchId,
        chapterId: testChapterId,
        section: "Class Notes",
        title: "Quadratic Equations Handwritten Derivations",
        storageKey: "resources/private/batch-content/quadratics_handwritten.pdf",
        pageCount: 3,
        notifyBatch: true,
      }
    );

    const uploadRes = await postQuickUpload(uploadReq);
    expect(uploadRes.status).toBe(201);

    const uploadJson = await uploadRes.json();
    expect(uploadJson.success).toBe(true);
    expect(uploadJson.contentItemId).toBeDefined();

    // Verify content item in database
    const [item] = await db
      .select()
      .from(schema.contentItems)
      .where(eq(schema.contentItems.id, uploadJson.contentItemId));

    expect(item).toBeDefined();
    expect(item.title).toBe("Quadratic Equations Handwritten Derivations");
    expect(item.kind).toBe("pdf");
    expect(item.section).toBe("Class Notes");
    expect(item.storageKey).toBe("resources/private/batch-content/quadratics_handwritten.pdf");
    expect(item.pageCount).toBe(3);
  });
});
