import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";

vi.mock("server-only", () => ({}));

// Mock next/cache and cached-home
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

vi.mock("@/server/data/cached-home", () => ({
  revalidateDataTag: vi.fn(),
  safeRevalidatePath: vi.fn(),
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
import { eq, and, sql, desc, inArray } from "drizzle-orm";
import { seed } from "../packages/db/src/seed";
import type { AuthUser } from "../apps/web/src/server/authz";
import {
  getAdminDashboardKPIs,
  getAdminStudentsList,
  getAdminStudentDetails,
  getAdminPaymentsList,
  getAdminContentData,
  manualEnrollStudent,
  waiveFeeDue,
  addStudentNote,
  bulkUpdateVideos,
  mapPlaylistToChapter,
  convertEnquiryToStudent,
  saveBatchWithPlans,
  deleteResource,
  deleteAnnouncement,
} from "../apps/web/src/server/data/admin";
import {
  searchAdminGlobalAction,
  syncYouTubeNowAction,
  getPresignedUploadUrlAction,
  manualEnrollStudentAction,
  recordOfflinePaymentAction,
  waiveFeeDueAction,
  addStudentNoteAction,
  saveBatchAction,
  bulkUpdateVideosAction,
  mapPlaylistAction,
  createResourceAction,
  deleteResourceAction,
  createAnnouncementAction,
  deleteAnnouncementAction,
  updateEnquiryStatusAction,
  convertEnquiryToStudentAction,
  saveSiteSettingAction,
  saveFacultyMemberAction,
} from "../apps/web/src/server/admin-actions";
import { getBatchesWithFilters } from "../apps/web/src/server/data/batches";

const testDbUrl =
  process.env.DATABASE_URL_TEST ||
  "postgresql://postgres:postgres@localhost:5432/quick2learn_test";

const testPool = new Pool({
  connectionString: testDbUrl,
});

const testDb = drizzle(testPool, { schema });

// Users
const adminUser: AuthUser = {
  id: "admin-user-0000-0000-0000-000000000001",
  email: "admin@test.quick2learn.in",
  name: "Dinesh Sir (Admin)",
  role: "admin",
};

const teacherUser: AuthUser = {
  id: "teacher-user-0000-0000-0000-000000000002",
  email: "teacher@test.quick2learn.in",
  name: "Neha Ma'am (Teacher)",
  role: "teacher",
};

const studentUser: AuthUser = {
  id: "student-user-0000-0000-0000-000000000003",
  email: "student@test.quick2learn.in",
  name: "Aryan Kumar (Student)",
  role: "student",
};

// Global session mock state
let currentSessionUser: {
  user: {
    id: string;
    email: string;
    name: string;
    image?: string | null;
    emailVerified: boolean;
    createdAt: Date;
    updatedAt: Date;
  };
  profile: unknown;
  role: "admin" | "teacher" | "student";
} | null = null;

function setMockSession(user: AuthUser | null) {
  if (!user) {
    currentSessionUser = null;
    return;
  }
  currentSessionUser = {
    user: {
      id: user.id,
      email: user.email || "user@test.in",
      name: user.name || "Test User",
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    profile: {
      userId: user.id,
      role: user.role,
      fullName: user.name,
    },
    role: user.role,
  };
}

vi.mock("@/server/auth/session", () => ({
  getCurrentUser: vi.fn(async () => currentSessionUser),
  requireUser: vi.fn(async () => {
    if (!currentSessionUser) throw new Error("NEXT_REDIRECT:/login");
    return currentSessionUser;
  }),
  requireRole: vi.fn(async (allowedRoles: string | string[]) => {
    if (!currentSessionUser) throw new Error("NEXT_REDIRECT:/login");
    const allowed = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
    if (!allowed.includes(currentSessionUser.role)) {
      throw new Error("NEXT_NOT_FOUND");
    }
    return currentSessionUser;
  }),
}));

describe("Quick2Learn Admin Control Panel Comprehensive Integration Suite (/admin)", () => {
  beforeAll(async () => {
    process.env.DATABASE_URL = testDbUrl;
    await seed(testDbUrl);

    // Ensure test users exist in database
    for (const u of [adminUser, teacherUser, studentUser]) {
      await testDb
        .insert(schema.user)
        .values({
          id: u.id,
          name: u.name,
          email: u.email!,
          emailVerified: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .onConflictDoNothing();

      await testDb
        .insert(schema.profiles)
        .values({
          userId: u.id,
          fullName: u.name,
          phone: "9876543210",
          role: u.role,
          classLevel: 12,
          board: "cbse",
          onboardedAt: new Date(),
        })
        .onConflictDoNothing();
    }
  });

  afterAll(async () => {
    await testPool.end();
  });

  beforeEach(() => {
    // Default to admin user for each test
    setMockSession(adminUser);
  });

  // =========================================================================
  // 1. DASHBOARD & KPIS
  // =========================================================================
  describe("Module 1: Dashboard KPIs and Overview", () => {
    it("computes all 5 KPI cards accurately for administrators", async () => {
      const kpis = await getAdminDashboardKPIs(adminUser);

      expect(kpis).toHaveProperty("activeStudentsCount");
      expect(typeof kpis.activeStudentsCount).toBe("number");
      expect(kpis).toHaveProperty("enrolmentsThisMonth");
      expect(typeof kpis.enrolmentsThisMonth).toBe("number");
      expect(kpis).toHaveProperty("collectionsThisMonthPaise");
      expect(typeof kpis.collectionsThisMonthPaise).toBe("number");
      expect(kpis).toHaveProperty("overdueDuesCount");
      expect(typeof kpis.overdueDuesCount).toBe("number");
      expect(kpis).toHaveProperty("overdueDuesPaise");
      expect(typeof kpis.overdueDuesPaise).toBe("number");
      expect(kpis).toHaveProperty("newEnquiriesCount");
      expect(typeof kpis.newEnquiriesCount).toBe("number");
      expect(Array.isArray(kpis.recentPayments)).toBe(true);
      expect(Array.isArray(kpis.recentEnquiries)).toBe(true);
    });

    it("restricts dashboard KPIs from non-admin staff and students", async () => {
      await expect(getAdminDashboardKPIs(teacherUser)).rejects.toThrow(
        "Only administrators can view KPI dashboard.",
      );
      await expect(getAdminDashboardKPIs(studentUser)).rejects.toThrow(
        "Only administrators can view KPI dashboard.",
      );
    });

    it("syncYouTubeNowAction triggers YouTube channel sync for admins", async () => {
      setMockSession(adminUser);
      const res = await syncYouTubeNowAction();
      expect(res.success).toBe(true);
      expect(res.data).toBeDefined();

      // Check sync_runs table recorded an entry
      const [lastRun] = await testDb
        .select()
        .from(schema.syncRuns)
        .orderBy(desc(schema.syncRuns.startedAt))
        .limit(1);
      expect(lastRun).toBeDefined();
      expect(lastRun.kind).toBe("youtube_sync");
    });

    it("syncYouTubeNowAction is blocked for teachers and students", async () => {
      setMockSession(teacherUser);
      await expect(syncYouTubeNowAction()).rejects.toThrow("NEXT_NOT_FOUND");

      setMockSession(studentUser);
      await expect(syncYouTubeNowAction()).rejects.toThrow("NEXT_NOT_FOUND");
    });
  });

  // =========================================================================
  // 2. STUDENTS: DIRECTORY, MANUAL ENROLLMENT, OFFLINE PAYMENT, WAIVERS, NOTES
  // =========================================================================
  describe("Module 2: Student Directory & Financial Operations", () => {
    let testBatchId: string;
    let testFeePlanId: string;
    let enrolledStudentId: string;
    let feeDueId: string;

    beforeAll(async () => {
      // Find an existing open batch or create one
      const [batch] = await testDb
        .select()
        .from(schema.batches)
        .where(eq(schema.batches.status, "open"))
        .limit(1);
      testBatchId = batch.id;

      // Find or insert fee plan
      let [plan] = await testDb
        .select()
        .from(schema.batchFeePlans)
        .where(eq(schema.batchFeePlans.batchId, testBatchId))
        .limit(1);

      if (!plan) {
        const [insertedPlan] = await testDb
          .insert(schema.batchFeePlans)
          .values({
            batchId: testBatchId,
            name: "Full Payment Plan",
            type: "lump_sum",
            totalPaise: 2500000,
          })
          .returning();
        plan = insertedPlan;
      }
      testFeePlanId = plan.id;

      enrolledStudentId = studentUser.id;
    });

    it("allows admin to search and filter the student directory", async () => {
      const list = await getAdminStudentsList(adminUser, {
        limit: 10,
        search: "Aryan",
      });
      expect(list.total).toBeGreaterThanOrEqual(1);
      const found = list.students.find((s) => s.userId === enrolledStudentId);
      expect(found).toBeDefined();
      expect(found?.email).toBe(studentUser.email);
    });

    it("allows admin to manually enroll a student into a batch and generates fee dues", async () => {
      setMockSession(adminUser);

      // Clean any existing enrollment for clean test
      await testDb
        .delete(schema.enrollments)
        .where(
          and(
            eq(schema.enrollments.studentId, enrolledStudentId),
            eq(schema.enrollments.batchId, testBatchId),
          ),
        );

      const enrollRes = await manualEnrollStudentAction({
        studentId: enrolledStudentId,
        batchId: testBatchId,
        feePlanId: testFeePlanId,
      });

      expect(enrollRes.success).toBe(true);

      // Verify enrollment created in database
      const [enrollment] = await testDb
        .select()
        .from(schema.enrollments)
        .where(
          and(
            eq(schema.enrollments.studentId, enrolledStudentId),
            eq(schema.enrollments.batchId, testBatchId),
          ),
        );
      expect(enrollment).toBeDefined();
      expect(enrollment.status).toBe("active");
      expect(enrollment.source).toBe("admin");

      // Verify fee dues were generated
      const dues = await testDb
        .select()
        .from(schema.feeDues)
        .where(eq(schema.feeDues.enrollmentId, enrollment.id));
      expect(dues.length).toBeGreaterThanOrEqual(1);
      feeDueId = dues[0].id;
      expect(dues[0].status).toBe("due");
      expect(dues[0].amountPaise).toBeGreaterThan(0);

      // Verify audit log recorded
      const [audit] = await testDb
        .select()
        .from(schema.auditLog)
        .where(
          and(
            eq(schema.auditLog.action, "manual_enrollment"),
            eq(schema.auditLog.entityId, enrolledStudentId),
          ),
        );
      expect(audit).toBeDefined();
      expect(audit.actorId).toBe(adminUser.id);
    });

    it("allows admin to record an offline payment for a fee due and marks it paid", async () => {
      setMockSession(adminUser);

      // Fetch current fee due
      const [due] = await testDb
        .select()
        .from(schema.feeDues)
        .where(eq(schema.feeDues.id, feeDueId));
      expect(due).toBeDefined();
      expect(due.status).toBe("due");

      const payRes = await recordOfflinePaymentAction({
        studentId: enrolledStudentId,
        dueId: feeDueId,
        method: "cash",
        amountPaise: due.amountPaise,
        note: "Paid in cash at Mathura centre desk to Dinesh Sir",
      });

      expect(payRes.success).toBe(true);

      // Verify fee due status updated to 'paid'
      const [updatedDue] = await testDb
        .select()
        .from(schema.feeDues)
        .where(eq(schema.feeDues.id, feeDueId));
      expect(updatedDue.status).toBe("paid");

      // Verify payment row was created
      const [payment] = await testDb
        .select()
        .from(schema.payments)
        .where(
          and(
            eq(schema.payments.studentId, enrolledStudentId),
            eq(schema.payments.feeDueId, feeDueId),
          ),
        );
      expect(payment).toBeDefined();
      expect(payment.status).toBe("paid");
      expect(payment.method).toBe("cash");
      expect(payment.receiptNo).toBeDefined();
      expect(payment.receiptNo).toMatch(/^Q2L-/);
    });

    it("allows admin to waive a fee due with a mandatory reason", async () => {
      setMockSession(adminUser);

      // Create a second pending due for the student
      const [enrollment] = await testDb
        .select()
        .from(schema.enrollments)
        .where(
          and(
            eq(schema.enrollments.studentId, enrolledStudentId),
            eq(schema.enrollments.batchId, testBatchId),
          ),
        );

      const [extraDue] = await testDb
        .insert(schema.feeDues)
        .values({
          studentId: enrolledStudentId,
          enrollmentId: enrollment.id,
          label: "Term 2 Instalment",
          amountPaise: 500000,
          dueDate: "2026-11-15",
          status: "due",
        })
        .returning();

      const waiveRes = await waiveFeeDueAction({
        dueId: extraDue.id,
        studentId: enrolledStudentId,
        reason: "Merit scholarship waiver approved by Dinesh Sir (Score 99% in term test)",
      });

      expect(waiveRes.success).toBe(true);

      const [waivedDue] = await testDb
        .select()
        .from(schema.feeDues)
        .where(eq(schema.feeDues.id, extraDue.id));
      expect(waivedDue.status).toBe("waived");

      // Verify audit log
      const [audit] = await testDb
        .select()
        .from(schema.auditLog)
        .where(
          and(
            eq(schema.auditLog.action, "waive_fee_due"),
            eq(schema.auditLog.entityId, enrolledStudentId),
          ),
        );
      expect(audit).toBeDefined();
      expect((audit.diff as { reason?: string })?.reason).toContain("Merit scholarship waiver");
    });

    it("allows staff to append internal notes to student profile timeline", async () => {
      setMockSession(adminUser);

      const noteRes = await addStudentNoteAction({
        studentId: enrolledStudentId,
        note: "Parent called regarding revision schedule. Informed about Sunday mock exam.",
      });

      expect(noteRes.success).toBe(true);

      // Verify note in student profile query
      const profile = await getAdminStudentDetails(adminUser, enrolledStudentId);
      const matchedNote = profile?.notes.find((n) =>
        (n.diff as { note?: string })?.note?.includes("Parent called regarding revision schedule"),
      );
      expect(matchedNote).toBeDefined();
    });

    it("blocks teachers and students from recording offline payments or waiving dues", async () => {
      setMockSession(teacherUser);
      await expect(
        recordOfflinePaymentAction({
          studentId: enrolledStudentId,
          dueId: feeDueId,
          method: "cash",
          amountPaise: 1000,
        }),
      ).rejects.toThrow("NEXT_NOT_FOUND");

      await expect(
        waiveFeeDueAction({
          dueId: feeDueId,
          studentId: enrolledStudentId,
          reason: "Unauthorized attempt",
        }),
      ).rejects.toThrow("NEXT_NOT_FOUND");

      setMockSession(studentUser);
      await expect(
        manualEnrollStudentAction({
          studentId: enrolledStudentId,
          batchId: testBatchId,
        }),
      ).rejects.toThrow("NEXT_NOT_FOUND");
    });
  });

  // =========================================================================
  // 3. BATCHES: CREATE/EDIT WITH TWO FEE PLANS, SYLLABUS BUILDER, PUBLISH
  // =========================================================================
  describe("Module 3: Batch Creation with 2 Fee Plans & Modules", () => {
    const newBatchSlug = `cbse-12-maths-super-batch-${Date.now()}`;
    let createdBatchId: string;

    it("creates a new batch with two fee plans, syllabus modules, outcomes, and publishes it", async () => {
      setMockSession(adminUser);

      const batchData = {
        title: "Class 12 CBSE Mathematics Super Batch 2026-27",
        slug: newBatchSlug,
        subtitle: "Comprehensive 100/100 Board Target Batch",
        classLevel: 12,
        board: "cbse" as const,
        subjectId: "a0000000-0000-0000-0000-000000000001", // Mathematics
        facultyId: "f0000000-0000-0000-0000-000000000001", // Dinesh Sir
        mode: "offline" as const,
        scheduleText: "Mon, Wed, Fri 4:30 PM – 6:30 PM",
        locationText: "Mathura Centre, Main Hall",
        startDate: "2026-04-01",
        endDate: "2027-02-28",
        seatsTotal: 40,
        status: "open" as const,
        isFeatured: true,
        whatsappGroupUrl: "https://chat.whatsapp.com/test-super-batch",
        description: "# Complete CBSE Class XII Mathematics\n\nFull syllabus coverage with $\\int f(x) dx$ calculus deep dives.",
        outcomes: [
          "Master calculus, vectors, and 3D geometry",
          "Solve 10 years of CBSE board PYQs",
          "Weekly offline test series with Dinesh Sir's feedback",
        ],
        syllabus: [
          {
            title: "Module 1: Calculus Mastery",
            chapters: [
              {
                chapterId: "class-12-maths-ch-1-relations-and-functions",
                title: "Relations and Functions",
                isFreePreview: true,
              },
            ],
          },
          {
            title: "Module 2: Algebra & Matrices",
            chapters: [
              {
                chapterId: "class-12-maths-ch-3-matrices",
                title: "Matrices & Determinants",
                isFreePreview: false,
              },
            ],
          },
        ],
        faqs: [
          {
            question: "Will study notes and formula sheets be provided?",
            answer: "Yes, exhaustive printed notes and chapter formula sheets are provided.",
          },
        ],
        feePlans: [
          {
            name: "Lump Sum One-Time Payment",
            totalPaise: 3500000, // ₹35,000
            instalments: [
              { name: "Full Payment", amountPaise: 3500000, dueDateOffsetDays: 0 },
            ],
          },
          {
            name: "3-Part Instalment Plan",
            totalPaise: 3900000, // ₹39,000 (3 x ₹13,000)
            instalments: [
              { name: "Instalment 1", amountPaise: 1300000, dueDateOffsetDays: 0 },
              { name: "Instalment 2", amountPaise: 1300000, dueDateOffsetDays: 60 },
              { name: "Instalment 3", amountPaise: 1300000, dueDateOffsetDays: 120 },
            ],
          },
        ],
      };

      const res = await saveBatchAction(batchData);
      expect(res.success).toBe(true);
      expect(res.data).toBeDefined();

      const created = res.data as { batchId: string; slug: string };
      createdBatchId = created.batchId;
      expect(created.slug).toBe(newBatchSlug);

      // Verify batch in DB
      const [batchInDb] = await testDb
        .select()
        .from(schema.batches)
        .where(eq(schema.batches.id, createdBatchId));
      expect(batchInDb).toBeDefined();
      expect(batchInDb.status).toBe("open");
      expect(batchInDb.seatsTotal).toBe(40);
      expect(Array.isArray(batchInDb.outcomes)).toBe(true);
      expect((batchInDb.outcomes as string[]).length).toBe(3);

      // Verify two fee plans were created in batch_fee_plans table
      const plans = await testDb
        .select()
        .from(schema.batchFeePlans)
        .where(eq(schema.batchFeePlans.batchId, createdBatchId));
      expect(plans.length).toBe(2);
      const lumpSum = plans.find((p) => p.name.includes("Lump Sum"));
      const instalments = plans.find((p) => p.name.includes("Instalment"));
      expect(lumpSum).toBeDefined();
      expect(lumpSum?.totalPaise).toBe(3500000);
      expect(instalments).toBeDefined();
      expect(instalments?.totalPaise).toBe(3900000);

      // Verify audit log
      const [audit] = await testDb
        .select()
        .from(schema.auditLog)
        .where(
          and(
            eq(schema.auditLog.action, "create_batch"),
            eq(schema.auditLog.entityId, createdBatchId),
          ),
        );
      expect(audit).toBeDefined();

      // Verify batch reflects in public site query
      const publicBatches = await getBatchesWithFilters({
        classLevel: 12,
        board: "cbse",
      });
      const foundInPublic = publicBatches.find((b) => b.id === createdBatchId);
      expect(foundInPublic).toBeDefined();
      expect(foundInPublic?.title).toContain("Super Batch");
    });

    it("denies teachers from creating or modifying batches", async () => {
      setMockSession(teacherUser);
      await expect(
        saveBatchAction({
          title: "Teacher Batch",
          slug: "teacher-batch",
          classLevel: 10,
          board: "cbse",
          subjectId: "a0000000-0000-0000-0000-000000000001",
          mode: "online",
          scheduleText: "Daily 5PM",
          startDate: "2026-05-01",
          seatsTotal: 20,
          feePlans: [],
        }),
      ).rejects.toThrow("NEXT_NOT_FOUND");
    });
  });

  // =========================================================================
  // 4. LECTURES: BULK VIDEO OPERATIONS & PLAYLIST MAPPING
  // =========================================================================
  describe("Module 4: Bulk Video Updates and Playlist Mapping", () => {
    const videoIds: string[] = [];

    beforeAll(async () => {
      // Create 20 mock unmapped videos
      for (let i = 1; i <= 20; i++) {
        const vidId = `test-bulk-vid-${Date.now()}-${i}`;
        videoIds.push(vidId);
        await testDb
          .insert(schema.youtubeVideos)
          .values({
            id: vidId,
            title: `Bulk Test Lecture #${i} - Matrices Operations`,
            description: `Mock lecture description for bulk test video ${i}`,
            publishedAt: new Date(),
            durationSeconds: 1200,
            viewCount: 150,
            likeCount: 20,
            isShort: false,
            isPublished: false,
            needsReview: true,
            classLevel: null,
            subjectId: null,
            chapterId: null,
          })
          .onConflictDoNothing();
      }
    });

    it("maps 20 videos to a chapter and publishes them in one bulk action", async () => {
      setMockSession(adminUser);

      // Chapter: Matrices (Class 12)
      const [chapter] = await testDb
        .select()
        .from(schema.chapters)
        .where(eq(schema.chapters.classLevel, 12))
        .limit(1);

      const bulkRes = await bulkUpdateVideosAction({
        videoIds,
        classLevel: 12,
        subjectId: chapter.subjectId,
        chapterId: chapter.id,
        isPublished: true,
        isShort: false,
        needsReview: false,
      });

      expect(bulkRes.success).toBe(true);

      // Verify all 20 videos updated in DB
      const updatedVideos = await testDb
        .select()
        .from(schema.youtubeVideos)
        .where(inArray(schema.youtubeVideos.id, videoIds));

      expect(updatedVideos.length).toBe(20);
      for (const v of updatedVideos) {
        expect(v.classLevel).toBe(12);
        expect(v.subjectId).toBe(chapter.subjectId);
        expect(v.chapterId).toBe(chapter.id);
        expect(v.isPublished).toBe(true);
        expect(v.needsReview).toBe(false);
      }

      // Verify audit log
      const [audit] = await testDb
        .select()
        .from(schema.auditLog)
        .where(eq(schema.auditLog.action, "bulk_update_videos"))
        .orderBy(desc(schema.auditLog.createdAt))
        .limit(1);
      expect(audit).toBeDefined();
      expect((audit.diff as { count?: number })?.count).toBe(20);
    });

    it("maps a playlist to class/subject/chapter and updates all constituent videos", async () => {
      setMockSession(adminUser);

      // Find an existing playlist or create one
      const playlistId = `PL_TEST_${Date.now()}`;
      await testDb
        .insert(schema.youtubePlaylists)
        .values({
          id: playlistId,
          title: "Complete Calculus Playlist",
          itemCount: 2,
        })
        .onConflictDoNothing();

      // Link two videos to playlist
      const [pVid1, pVid2] = videoIds.slice(0, 2);
      await testDb
        .update(schema.youtubeVideos)
        .set({ playlistIds: [playlistId] })
        .where(inArray(schema.youtubeVideos.id, [pVid1, pVid2]));

      const [chapter] = await testDb
        .select()
        .from(schema.chapters)
        .where(eq(schema.chapters.classLevel, 12))
        .limit(1);

      const mapRes = await mapPlaylistAction({
        playlistId,
        classLevel: 12,
        subjectId: chapter.subjectId,
        chapterId: chapter.id,
      });

      expect(mapRes.success).toBe(true);
      expect(mapRes.data?.updatedVideosCount).toBe(2);

      // Check playlist record updated
      const [updatedPl] = await testDb
        .select()
        .from(schema.youtubePlaylists)
        .where(eq(schema.youtubePlaylists.id, playlistId));
      expect(updatedPl.chapterId).toBe(chapter.id);
      expect(updatedPl.subjectId).toBe(chapter.subjectId);
    });
  });

  // =========================================================================
  // 5. RESOURCES: PRESIGNED S3 UPLOAD, VALIDATION, RETRIEVAL, DELETION
  // =========================================================================
  describe("Module 5: Resources & Notes Management", () => {
    let createdResourceId: string;

    it("generates presigned upload URL for PDF notes up to 25MB", async () => {
      setMockSession(adminUser);

      const res = await getPresignedUploadUrlAction({
        filename: "Class12_Calculus_Formula_Sheet.pdf",
        contentType: "application/pdf",
        sizeBytes: 15 * 1024 * 1024, // 15 MB
        folder: "resources/public",
      });

      expect(res.success).toBe(true);
      expect(res.data?.uploadUrl).toBeDefined();
      expect(res.data?.key).toContain("resources/public/");
      expect(res.data?.key).toContain("class12_calculus_formula_sheet.pdf");
    });

    it("rejects non-PDF files for study resources with user-friendly error", async () => {
      setMockSession(adminUser);

      const res = await getPresignedUploadUrlAction({
        filename: "malicious_script.exe",
        contentType: "application/octet-stream",
        sizeBytes: 1024,
        folder: "resources/public",
      });

      expect(res.success).toBe(false);
      expect(res.error).toContain("Only PDF documents can be uploaded");
    });

    it("rejects files exceeding 25 MB limit", async () => {
      setMockSession(adminUser);

      const res = await getPresignedUploadUrlAction({
        filename: "huge_book.pdf",
        contentType: "application/pdf",
        sizeBytes: 28 * 1024 * 1024, // 28 MB > 25 MB limit
        folder: "resources/private",
      });

      expect(res.success).toBe(false);
      expect(res.error).toContain("exceeds maximum size of 25 MB");
    });

    it("creates study resource attached to chapter and batch with audit log", async () => {
      setMockSession(adminUser);

      const [chapter] = await testDb
        .select()
        .from(schema.chapters)
        .where(eq(schema.chapters.classLevel, 12))
        .limit(1);

      const [batch] = await testDb
        .select()
        .from(schema.batches)
        .where(eq(schema.batches.status, "open"))
        .limit(1);

      const createRes = await createResourceAction({
        title: "CBSE Class 12 Relations and Functions Revision Notes",
        type: "notes",
        storageKey: "resources/private/test-notes-rel-func.pdf",
        storageBucket: "private",
        visibility: "enrolled",
        chapterId: chapter.id,
        batchId: batch.id,
      });

      expect(createRes.success).toBe(true);
      const resData = createRes.data as { id: string; title: string };
      createdResourceId = resData.id;

      // Verify in DB
      const [resInDb] = await testDb
        .select()
        .from(schema.resources)
        .where(eq(schema.resources.id, createdResourceId));
      expect(resInDb).toBeDefined();
      expect(resInDb.visibility).toBe("enrolled");
      expect(resInDb.storageBucket).toBe("private");

      // Verify audit log
      const [audit] = await testDb
        .select()
        .from(schema.auditLog)
        .where(
          and(
            eq(schema.auditLog.action, "create_resource"),
            eq(schema.auditLog.entityId, createdResourceId),
          ),
        );
      expect(audit).toBeDefined();
    });

    it("allows deleting resource with audit log", async () => {
      setMockSession(adminUser);

      const delRes = await deleteResourceAction(createdResourceId);
      expect(delRes.success).toBe(true);

      const [resInDb] = await testDb
        .select()
        .from(schema.resources)
        .where(eq(schema.resources.id, createdResourceId));
      expect(resInDb).toBeUndefined();

      // Verify delete audit log
      const [audit] = await testDb
        .select()
        .from(schema.auditLog)
        .where(
          and(
            eq(schema.auditLog.action, "delete_resource"),
            eq(schema.auditLog.entityId, createdResourceId),
          ),
        );
      expect(audit).toBeDefined();
    });
  });

  // =========================================================================
  // 6. ANNOUNCEMENTS: BATCH & PUBLIC, LIVE PREVIEW, PINNING, DELETION
  // =========================================================================
  describe("Module 6: Announcements", () => {
    let createdAnnouncementId: string;

    it("creates a pinned batch announcement with markdown and MathText", async () => {
      setMockSession(adminUser);

      const [batch] = await testDb
        .select()
        .from(schema.batches)
        .where(eq(schema.batches.status, "open"))
        .limit(1);

      const annRes = await createAnnouncementAction({
        title: "Mock Test 3 Rescheduled to Sunday 10:00 AM",
        body: "Please note that Mock Test 3 on $\\int_0^1 x^2 dx$ calculus will now be held at the Mathura offline centre on Sunday.",
        audience: "batch",
        batchId: batch.id,
        isPinned: true,
      });

      expect(annRes.success).toBe(true);
      const annData = annRes.data as { id: string; title: string };
      createdAnnouncementId = annData.id;

      // Verify in DB
      const [annInDb] = await testDb
        .select()
        .from(schema.announcements)
        .where(eq(schema.announcements.id, createdAnnouncementId));
      expect(annInDb).toBeDefined();
      expect(annInDb.audience).toBe("batch");
      expect(annInDb.isPinned).toBe(true);
      expect(annInDb.batchId).toBe(batch.id);

      // Verify audit log
      const [audit] = await testDb
        .select()
        .from(schema.auditLog)
        .where(
          and(
            eq(schema.auditLog.action, "create_announcement"),
            eq(schema.auditLog.entityId, createdAnnouncementId),
          ),
        );
      expect(audit).toBeDefined();
    });

    it("allows deleting an announcement with audit log", async () => {
      setMockSession(adminUser);

      const delRes = await deleteAnnouncementAction(createdAnnouncementId);
      expect(delRes.success).toBe(true);

      const [annInDb] = await testDb
        .select()
        .from(schema.announcements)
        .where(eq(schema.announcements.id, createdAnnouncementId));
      expect(annInDb).toBeUndefined();
    });
  });

  // =========================================================================
  // 7. ENQUIRIES: STATUS UPDATE & CONVERSION TO STUDENT ACCOUNT
  // =========================================================================
  describe("Module 7: Prospective Student Enquiries & Conversion", () => {
    let enquiryId: string;

    beforeAll(async () => {
      const [enq] = await testDb
        .insert(schema.enquiries)
        .values({
          name: "Rohan Gupta",
          phone: "+91-9897123456",
          classLevel: 12,
          board: "cbse",
          message: "Interested in Class XII offline mathematics batch admissions.",
          status: "new",
        })
        .returning();
      enquiryId = enq.id;
    });

    it("updates enquiry status to contacted with follow-up notes", async () => {
      setMockSession(adminUser);

      const res = await updateEnquiryStatusAction(
        enquiryId,
        "contacted",
        "Spoke with father Mr. Gupta. Visiting Mathura centre on Saturday for demo class.",
      );

      expect(res.success).toBe(true);

      const [enqInDb] = await testDb
        .select()
        .from(schema.enquiries)
        .where(eq(schema.enquiries.id, enquiryId));
      expect(enqInDb.status).toBe("contacted");
      expect(enqInDb.notes).toContain("Visiting Mathura centre");
    });

    it("converts enquiry into registered student account and sets status to enrolled", async () => {
      setMockSession(adminUser);

      const convertRes = await convertEnquiryToStudentAction(enquiryId);
      expect(convertRes.success).toBe(true);
      expect(convertRes.data?.studentUserId).toBeDefined();

      const newStudentUserId = convertRes.data!.studentUserId;

      // Verify user and profile exist
      const [userRow] = await testDb
        .select()
        .from(schema.user)
        .where(eq(schema.user.id, newStudentUserId));
      expect(userRow).toBeDefined();
      expect(userRow.name).toBe("Rohan Gupta");

      const [profileRow] = await testDb
        .select()
        .from(schema.profiles)
        .where(eq(schema.profiles.userId, newStudentUserId));
      expect(profileRow).toBeDefined();
      expect(profileRow.role).toBe("student");
      expect(profileRow.classLevel).toBe(12);

      // Verify enquiry status is now 'enrolled'
      const [enqInDb] = await testDb
        .select()
        .from(schema.enquiries)
        .where(eq(schema.enquiries.id, enquiryId));
      expect(enqInDb.status).toBe("enrolled");

      // Verify audit log
      const [audit] = await testDb
        .select()
        .from(schema.auditLog)
        .where(
          and(
            eq(schema.auditLog.action, "convert_enquiry_to_student"),
            eq(schema.auditLog.entityId, enquiryId),
          ),
        );
      expect(audit).toBeDefined();
    });
  });

  // =========================================================================
  // 8. PAYMENTS: LEDGER & ACCESS CONTROL
  // =========================================================================
  describe("Module 8: Payments Ledger", () => {
    it("allows admin to query payments with method and status filters", async () => {
      const list = await getAdminPaymentsList(adminUser, {
        status: "paid",
      });
      expect(Array.isArray(list)).toBe(true);
      expect(list.length).toBeGreaterThanOrEqual(1);

      const first = list[0];
      expect(first.payment.status).toBe("paid");
      expect(typeof first.payment.amountPaise).toBe("number");
      expect(first.studentName).toBeDefined();
    });

    it("denies teachers from accessing payments ledger", async () => {
      await expect(getAdminPaymentsList(teacherUser)).rejects.toThrow(
        "Only administrators can view payment records.",
      );
    });
  });

  // =========================================================================
  // 9. CONTENT MANAGEMENT & SITE SETTINGS
  // =========================================================================
  describe("Module 9: Content & Site Settings", () => {
    it("allows admin to update site settings", async () => {
      setMockSession(adminUser);

      const newBarSetting = {
        enabled: true,
        text: "Admissions Open for Class XII CBSE 2026-27 | Call 9897000000",
        link_text: "Register Now",
        link_url: "/#inquire",
      };

      const res = await saveSiteSettingAction("announcement_bar", newBarSetting);
      expect(res.success).toBe(true);

      const content = await getAdminContentData(adminUser);
      expect(content.settings.announcement_bar).toEqual(newBarSetting);
    });

    it("denies teachers and students from modifying site settings", async () => {
      setMockSession(teacherUser);
      await expect(
        saveSiteSettingAction("announcement_bar", { enabled: false }),
      ).rejects.toThrow("NEXT_NOT_FOUND");

      setMockSession(studentUser);
      await expect(
        saveSiteSettingAction("announcement_bar", { enabled: false }),
      ).rejects.toThrow("NEXT_NOT_FOUND");
    });
  });

  // =========================================================================
  // 10. GLOBAL SEARCH & ROLE ISOLATION
  // =========================================================================
  describe("Global Top Bar Search & Role Isolation", () => {
    it("returns students, batches, and lectures for administrators", async () => {
      setMockSession(adminUser);

      const res = await searchAdminGlobalAction("Class");
      expect(res.success).toBe(true);
      expect(res.data).toBeDefined();
      expect(Array.isArray(res.data?.batches)).toBe(true);
      expect(Array.isArray(res.data?.videos)).toBe(true);
    });

    it("hides students completely from global search results for teachers", async () => {
      setMockSession(teacherUser);

      const res = await searchAdminGlobalAction("Aryan");
      expect(res.success).toBe(true);
      // Teachers should see empty students array even if student 'Aryan' exists
      expect(res.data?.students).toEqual([]);
    });

    it("blocks students from accessing admin global search", async () => {
      setMockSession(studentUser);
      await expect(searchAdminGlobalAction("Maths")).rejects.toThrow("NEXT_NOT_FOUND");
    });
  });
});
