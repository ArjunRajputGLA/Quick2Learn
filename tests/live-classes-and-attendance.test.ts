import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq, and } from "drizzle-orm";
import * as schema from "../packages/db/src/schema";
import { seed } from "../packages/db/src/seed";
import {
  createLiveSession,
  startLiveSession,
  endLiveSession,
  getBatchLiveSessions,
  joinLiveSession,
  generateSessionsFromTimetableCron,
} from "../apps/web/src/server/data/live-sessions";
import {
  getStudentAttendance,
  getStudentAttendanceSummary,
  saveBatchAttendance,
} from "../apps/web/src/server/data/attendance";
import { ForbiddenError, NotFoundError } from "../apps/web/src/server/authz";

const testDbUrl =
  process.env.DATABASE_URL_TEST ||
  "postgresql://postgres:postgres@localhost:5432/quick2learn_test";

const testPool = new Pool({
  connectionString: testDbUrl,
});

const testDb = drizzle(testPool, { schema });

describe("Live Classes & Attendance Integration Test Suite", () => {
  const teacherUserId = "teacher-user-uuid";
  const student1Id = "student-1-uuid";
  const student2Id = "student-2-uuid";
  const unenrolledStudentId = "unenrolled-user-uuid";
  const parentUserId = "parent-user-uuid";

  let testBatchId: string;
  let testSubjectId: string;
  let testFacultyId: string;
  let scheduledSessionId: string;

  beforeAll(async () => {
    process.env.DATABASE_URL = testDbUrl;
    await seed(testDbUrl);

    // 1. Create test users in user table
    const testUsers = [
      { id: teacherUserId, name: "Dinesh Sir", email: "teacher@quick2learn.in" },
      { id: student1Id, name: "Aarav Sharma", email: "aarav@quick2learn.in" },
      { id: student2Id, name: "Diya Patel", email: "diya@quick2learn.in" },
      { id: unenrolledStudentId, name: "Karan Verma", email: "karan@quick2learn.in" },
      { id: parentUserId, name: "Rajesh Sharma", email: "parent.rajesh@quick2learn.in" },
    ];

    for (const u of testUsers) {
      await testDb
        .insert(schema.user)
        .values({
          id: u.id,
          name: u.name,
          email: u.email,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .onConflictDoNothing();
    }

    // Profiles
    await testDb
      .insert(schema.profiles)
      .values([
        {
          userId: teacherUserId,
          fullName: "Dinesh Sir",
          role: "teacher",
          phone: "9876543210",
        },
        {
          userId: student1Id,
          fullName: "Aarav Sharma",
          role: "student",
          phone: "9876543211",
          parentName: "Rajesh Sharma",
          parentPhone: "9876543299",
        },
        {
          userId: student2Id,
          fullName: "Diya Patel",
          role: "student",
          phone: "9876543212",
          parentName: "Mahesh Patel",
          parentPhone: "9876543288",
        },
        {
          userId: unenrolledStudentId,
          fullName: "Karan Verma",
          role: "student",
          phone: "9876543213",
        },
        {
          userId: parentUserId,
          fullName: "Rajesh Sharma",
          role: "parent",
          phone: "9876543299", // matches Aarav's parentPhone
        },
      ])
      .onConflictDoNothing();

    // Link parent to student1 in parentLinks table
    await testDb
      .insert(schema.parentLinks)
      .values({
        parentUserId,
        studentUserId: student1Id,
        relation: "father",
      })
      .onConflictDoNothing();

    // Subject
    const existingSubject = await testDb.query.subjects.findFirst();
    testSubjectId = existingSubject!.id;

    // Faculty
    const existingFaculty = await testDb.query.faculty.findFirst();
    testFacultyId = existingFaculty!.id;

    // Batch
    const batchRes = await testDb
      .insert(schema.batches)
      .values({
        slug: `test-live-batch-${Date.now()}`,
        title: "Class 10 Live Maths Champions",
        description: "Live interactive sessions with instant join",
        classLevel: 10,
        board: "cbse",
        subjectId: testSubjectId,
        facultyId: testFacultyId,
        mode: "online",
        scheduleText: "Mon, Wed, Fri at 5 PM",
        startDate: new Date(),
        status: "open",
        joinCode: `L${Math.floor(10000 + Math.random() * 90000)}`,
      })
      .returning();
    testBatchId = batchRes[0].id;

    // Enroll student1 and student2
    await testDb.insert(schema.enrollments).values([
      {
        batchId: testBatchId,
        studentId: student1Id,
        status: "active",
      },
      {
        batchId: testBatchId,
        studentId: student2Id,
        status: "active",
      },
    ]);

    // Timetable slot for Monday 17:00 - 18:30
    await testDb.insert(schema.batchTimetableSlots).values({
      batchId: testBatchId,
      weekday: 1, // Monday
      startTime: "17:00",
      endTime: "18:30",
      subjectId: testSubjectId,
      teacherId: testFacultyId,
    });
  });

  afterAll(async () => {
    await testPool.end();
  });

  describe("1. Live Session Creation, Start, & Push Notification", () => {
    it("creates a scheduled live session with Zoom provider", async () => {
      const now = new Date();
      const startsAt = new Date(now.getTime() + 60 * 60 * 1000).toISOString();
      const endsAt = new Date(now.getTime() + 120 * 60 * 1000).toISOString();

      const session = await createLiveSession({
        batchId: testBatchId,
        subjectId: testSubjectId,
        teacherId: testFacultyId,
        title: "Quadratic Equations - Class 1",
        startsAt,
        endsAt,
        provider: "zoom",
        joinUrl: "https://zoom.us/j/1234567890",
        passcode: "123456",
        createdBy: teacherUserId,
      });

      expect(session).toBeDefined();
      expect(session.id).toBeDefined();
      expect(session.status).toBe("scheduled");
      expect(session.provider).toBe("zoom");
      expect(session.joinUrl).toBe("https://zoom.us/j/1234567890");

      scheduledSessionId = session.id;
    });

    it("retrieves batch live sessions including upcoming and live status", async () => {
      const res = await getBatchLiveSessions(student1Id, testBatchId);

      expect(res.batchId).toBe(testBatchId);
      expect(res.allUpcoming.length).toBeGreaterThan(0);
      expect(res.allUpcoming.some((s) => s.id === scheduledSessionId)).toBe(true);
      expect(res.liveNow).toBeNull();
    });

    it("teacher presses Start -> session status changes to 'live'", async () => {
      const updated = await startLiveSession(scheduledSessionId, teacherUserId);

      expect(updated.status).toBe("live");

      // Verify batch now shows this session under liveNow
      const res = await getBatchLiveSessions(student1Id, testBatchId);
      expect(res.liveNow).not.toBeNull();
      expect(res.liveNow?.id).toBe(scheduledSessionId);
      expect(res.liveNow?.isLive).toBe(true);
    });
  });

  describe("2. One-Tap Join & Automatic Attendance Marking", () => {
    it("student joins on time (<= 10 mins) -> marked present with joined_online source", async () => {
      const joinRes = await joinLiveSession(student1Id, scheduledSessionId);

      expect(joinRes.sessionId).toBe(scheduledSessionId);
      expect(joinRes.joinUrl).toBe("https://zoom.us/j/1234567890");
      expect(joinRes.passcode).toBe("123456");
      expect(joinRes.attendanceStatus).toBe("present");

      // Check attendance_records in database
      const record = await testDb.query.attendanceRecords.findFirst({
        where: and(
          eq(schema.attendanceRecords.studentId, student1Id),
          eq(schema.attendanceRecords.sessionId, scheduledSessionId)
        ),
      });

      expect(record).toBeDefined();
      expect(record?.status).toBe("present");
      expect(record?.source).toBe("joined_online");
    });

    it("student joins late (> 10 mins after scheduled start) -> marked late", async () => {
      // Create a session scheduled 25 minutes ago
      const pastStart = new Date(Date.now() - 25 * 60 * 1000);
      const pastEnd = new Date(Date.now() + 35 * 60 * 1000);

      const lateSession = await createLiveSession({
        batchId: testBatchId,
        subjectId: testSubjectId,
        title: "Late Join Test Session",
        startsAt: pastStart.toISOString(),
        endsAt: pastEnd.toISOString(),
        provider: "google_meet",
        joinUrl: "https://meet.google.com/abc-defg-hij",
      });

      await startLiveSession(lateSession.id, teacherUserId);

      const joinRes = await joinLiveSession(student2Id, lateSession.id);

      expect(joinRes.attendanceStatus).toBe("late");

      const record = await testDb.query.attendanceRecords.findFirst({
        where: and(
          eq(schema.attendanceRecords.studentId, student2Id),
          eq(schema.attendanceRecords.sessionId, lateSession.id)
        ),
      });

      expect(record).toBeDefined();
      expect(record?.status).toBe("late");
      expect(record?.source).toBe("joined_online");
    });

    it("unenrolled student cannot join the live session", async () => {
      await expect(
        joinLiveSession(unenrolledStudentId, scheduledSessionId)
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe("3. Ending Session & Attaching Recording", () => {
    it("teacher ends live session and attaches YouTube recording ID", async () => {
      const youtubeVideoId = "dQw4w9WgXcQ";
      const ended = await endLiveSession(scheduledSessionId, youtubeVideoId, teacherUserId);

      expect(ended.status).toBe("ended");
      expect(ended.recordingYoutubeId).toBe(youtubeVideoId);

      // Verify it now appears under recentRecordings with Watch Recording capability
      const res = await getBatchLiveSessions(student1Id, testBatchId);
      expect(res.liveNow?.id).not.toBe(scheduledSessionId);
      expect(res.recentRecordings.some((r) => r.id === scheduledSessionId)).toBe(true);
      expect(res.recentRecordings.find((r) => r.id === scheduledSessionId)?.recordingYoutubeId).toBe(
        youtubeVideoId
      );
    });
  });

  describe("4. Attendance Calendar & Month Summary (Student & Parent Visibility)", () => {
    it("student views their own attendance calendar", async () => {
      const res = await getStudentAttendance(student1Id, student1Id, testBatchId);

      expect(res.studentId).toBe(student1Id);
      expect(res.records.length).toBeGreaterThan(0);
      expect(res.stats.presentDays).toBeGreaterThanOrEqual(1);
      expect(res.stats.monthPercentage).toBeGreaterThan(0);
    });

    it("linked parent views their child's attendance calendar", async () => {
      const res = await getStudentAttendance(parentUserId, student1Id, testBatchId);

      expect(res.studentId).toBe(student1Id);
      expect(res.records.length).toBeGreaterThan(0);
      expect(res.stats.monthPercentage).toBeGreaterThanOrEqual(0);
    });

    it("unrelated user cannot view attendance calendar", async () => {
      await expect(
        getStudentAttendance(unenrolledStudentId, student1Id, testBatchId)
      ).rejects.toThrow(ForbiddenError);
    });

    it("retrieves attendance summary with turnout percentages", async () => {
      const summary = await getStudentAttendanceSummary(student1Id, student1Id, testBatchId);

      expect(summary.studentId).toBe(student1Id);
      expect(summary.totalClasses).toBeGreaterThanOrEqual(1);
      expect(summary.attendedClasses).toBeGreaterThanOrEqual(1);
      expect(summary.monthPercentage).toBeGreaterThan(0);
    });
  });

  describe("5. Manual Teacher Attendance Sheet & Parent Absence Notification", () => {
    it("teacher marks attendance on website admin sheet and saves instantly", async () => {
      const dateStr = "2026-10-18";

      const res = await saveBatchAttendance(
        teacherUserId,
        testBatchId,
        dateStr,
        [
          { studentId: student1Id, status: "absent", note: "Not feeling well" },
          { studentId: student2Id, status: "present", note: "Present in class" },
        ]
      );

      expect(res.success).toBe(true);
      expect(res.count).toBe(2);
      expect(res.absencesNotified).toBeGreaterThanOrEqual(1);

      // Verify student1's record is marked absent
      const student1Record = await testDb.query.attendanceRecords.findFirst({
        where: and(
          eq(schema.attendanceRecords.studentId, student1Id),
          eq(schema.attendanceRecords.batchId, testBatchId),
          eq(schema.attendanceRecords.date, dateStr)
        ),
      });

      expect(student1Record?.status).toBe("absent");
      expect(student1Record?.source).toBe("marked");
      expect(student1Record?.note).toBe("Not feeling well");

      // Verify student's and parent's attendance screen now shows this absence
      const studentAttendance = await getStudentAttendance(student1Id, student1Id, testBatchId);
      expect(studentAttendance.absences.some((a) => a.date === dateStr)).toBe(true);

      const parentAttendance = await getStudentAttendance(parentUserId, student1Id, testBatchId);
      expect(parentAttendance.absences.some((a) => a.date === dateStr)).toBe(true);
    });
  });

  describe("6. Daily Cron Generation from Timetable Slots", () => {
    it("generates next 14 days of sessions from batch timetable slots", async () => {
      const res = await generateSessionsFromTimetableCron(14, testBatchId);

      expect(res.batchesProcessed).toBe(1);
      expect(res.generatedCount).toBeGreaterThan(0);

      // Running a second time should be idempotent (no duplicate sessions on same startsAt)
      const res2 = await generateSessionsFromTimetableCron(14, testBatchId);
      expect(res2.generatedCount).toBe(0);
    });
  });
});
