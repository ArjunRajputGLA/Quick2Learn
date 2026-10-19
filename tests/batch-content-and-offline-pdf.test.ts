import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq } from "drizzle-orm";
import * as schema from "../packages/db/src/schema";
import { seed } from "../packages/db/src/seed";
import {
  cleanFilenameTitle,
  getBatchContent,
  getBatchChapterContent,
  getContentPresignedFileUrl,
  createBatchContentItem,
  importBatchMaterialFromZipTree,
} from "../apps/web/src/server/data/batch-content";
import { ForbiddenError, type AuthUser } from "../apps/web/src/server/authz";

const testDbUrl =
  process.env.DATABASE_URL_TEST ||
  "postgresql://postgres:postgres@localhost:5432/quick2learn_test";

const testPool = new Pool({
  connectionString: testDbUrl,
});

const testDb = drizzle(testPool, { schema });

describe("Batch Content, Study Material & Offline PDF Security Suite", () => {
  const adminUser: AuthUser = {
    id: "admin-user-id",
    email: "admin@quick2learn.in",
    name: "Admin Teacher",
    role: "admin",
  };

  const enrolledStudent: AuthUser = {
    id: "enrolled-student-uuid",
    email: "enrolled@quick2learn.in",
    name: "Enrolled Student",
    role: "student",
  };

  const unenrolledStudent: AuthUser = {
    id: "unenrolled-student-uuid",
    email: "unenrolled@quick2learn.in",
    name: "Unenrolled Student",
    role: "student",
  };

  let testBatchId: string;
  let testSubjectId: string;
  let testChapterId: string;
  let testPdfContentItemId: string;

  beforeAll(async () => {
    process.env.DATABASE_URL = testDbUrl;
    await seed(testDbUrl);

    // Ensure test users exist in user table
    await testDb
      .insert(schema.user)
      .values([
        {
          id: enrolledStudent.id,
          name: enrolledStudent.name,
          email: enrolledStudent.email,
          role: "student",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: unenrolledStudent.id,
          name: unenrolledStudent.name,
          email: unenrolledStudent.email,
          role: "student",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ])
      .onConflictDoNothing();

    // Create a subject
    const [subj] = await testDb
      .insert(schema.subjects)
      .values({
        name: "ICSE Mathematics",
        slug: `icse-math-${Date.now()}`,
      })
      .returning();
    testSubjectId = subj.id;

    // Create a chapter
    const [chap] = await testDb
      .insert(schema.chapters)
      .values({
        subjectId: testSubjectId,
        title: "Expansions",
        slug: `expansions-${Date.now()}`,
        classLevel: 9,
        board: "icse",
        number: 4,
      })
      .returning();
    testChapterId = chap.id;

    // Create a batch
    const [batch] = await testDb
      .insert(schema.batches)
      .values({
        title: "Class 9 ICSE Pinnacle Batch",
        slug: `class-9-icse-pinnacle-${Date.now()}`,
        description: "Comprehensive batch for ICSE 9th Class",
        scheduleText: "Mon, Wed, Fri 4:00 PM",
        startDate: new Date(),
        classLevel: 9,
        board: "icse",
        mode: "offline",
        status: "open",
        subjectId: testSubjectId,
        joinCode: `C${Math.floor(10000 + Math.random() * 89999)}`,
      })
      .returning();
    testBatchId = batch.id;

    // Enroll only `enrolledStudent` with status 'active'
    await testDb.insert(schema.enrollments).values({
      batchId: testBatchId,
      studentId: enrolledStudent.id,
      status: "active",
      enrolledAt: new Date(),
    });

    // Create a PDF content item under the batch
    const createdItem = await createBatchContentItem(adminUser, {
      batchId: testBatchId,
      subjectId: testSubjectId,
      chapterId: testChapterId,
      section: "Selina Solutions",
      title: "Exercise 4(A) Solutions",
      kind: "pdf",
      storageKey: `batches/${testBatchId}/materials/ex_4a_solutions.pdf`,
      sizeBytes: 1024 * 1024 * 2, // 2MB
      pageCount: 14,
      isPublished: true,
    });
    testPdfContentItemId = createdItem.id;
  });

  afterAll(async () => {
    await testPool.end();
  });

  describe("1. Title Normalization & Filename Cleaning", () => {
    it("cleans filenames into natural Indian textbook titles", () => {
      expect(cleanFilenameTitle("EX 4(A).pdf")).toBe("Exercise 4(A)");
      expect(cleanFilenameTitle("ex-10.2-solutions.pdf")).toBe("Exercise 10.2 Solutions");
      expect(cleanFilenameTitle("ch_04_class_notes.pdf")).toBe("Ch 4 Class Notes");
      expect(cleanFilenameTitle("selina_solutions_chapter_4.pdf")).toBe("Selina Solutions Chapter 4");
      expect(cleanFilenameTitle("Formula_Sheet_Final.pdf")).toBe("Formula Sheet Final");
    });
  });

  describe("2. PDF File Access Control (Enrolled vs Unenrolled Student)", () => {
    it("CRITICAL: Returns 403 Forbidden when an unenrolled student requests the PDF file", async () => {
      // Must throw ForbiddenError
      await expect(
        getContentPresignedFileUrl(unenrolledStudent, testPdfContentItemId, testDb)
      ).rejects.toThrow(ForbiddenError);
    });

    it("Generates a valid 15-minute presigned URL when an actively enrolled student requests the PDF", async () => {
      const res = await getContentPresignedFileUrl(enrolledStudent, testPdfContentItemId, testDb);

      expect(res).toBeDefined();
      expect(res.id).toBe(testPdfContentItemId);
      expect(res.title).toBe("Exercise 4(A) Solutions");
      expect(res.url).toMatch(/^https?:\/\//);
      expect(res.expiresInSeconds).toBe(900); // 15 minutes
    });

    it("Permits staff (admin/faculty) to retrieve the presigned URL even without a student enrollment", async () => {
      const res = await getContentPresignedFileUrl(adminUser, testPdfContentItemId, testDb);

      expect(res).toBeDefined();
      expect(res.url).toMatch(/^https?:\/\//);
    });
  });

  describe("3. GET /batches/:id/content (Subjects & Chapters with Progress)", () => {
    it("returns batch curriculum with subjects, chapters, lecture counts, and notes counts", async () => {
      const content = await getBatchContent(enrolledStudent.id, testBatchId, testDb);

      expect(content).toBeDefined();
      expect(content.batchId).toBe(testBatchId);
      expect(content.subjects.length).toBeGreaterThanOrEqual(1);

      const mathSubject = content.subjects.find((s) => s.id === testSubjectId);
      expect(mathSubject).toBeDefined();
      expect(mathSubject!.chapters.length).toBeGreaterThanOrEqual(1);

      const expansionChapter = mathSubject!.chapters.find((c) => c.id === testChapterId);
      expect(expansionChapter).toBeDefined();
      expect(expansionChapter!.title).toBe("Expansions");
      expect(expansionChapter!.notesCount).toBeGreaterThanOrEqual(1);
    });
  });

  describe("4. GET /batches/:id/chapters/:chapterId (Lectures & Notes Grouped by Section)", () => {
    it("returns lectures and notes grouped by section with publication date and isNew flag", async () => {
      const chapterContent = await getBatchChapterContent(
        enrolledStudent.id,
        testBatchId,
        testChapterId,
        testDb
      );

      expect(chapterContent).toBeDefined();
      expect(chapterContent.chapterId).toBe(testChapterId);
      expect(chapterContent.notes.length).toBeGreaterThanOrEqual(1);

      // Verify sections grouping (e.g. "Selina Solutions")
      expect(chapterContent.sections.length).toBeGreaterThanOrEqual(1);
      const selinaSection = chapterContent.sections.find((s) => s.section === "Selina Solutions");
      expect(selinaSection).toBeDefined();
      expect(selinaSection!.items.some((i) => i.id === testPdfContentItemId)).toBe(true);

      const item = selinaSection!.items.find((i) => i.id === testPdfContentItemId)!;
      expect(item.title).toBe("Exercise 4(A) Solutions");
      expect(item.isNew).toBe(true); // Published today (< 7 days)
    });
  });

  describe("5. ZIP Material Import Tree Structure (Subject / Chapter / Section / file.pdf)", () => {
    it("imports old IX ICSE material tree creating subjects, chapters, sections, and items", async () => {
      const zipEntries = [
        {
          subjectName: "Physics ICSE IX",
          chapterTitle: "Measurements and Experimentation",
          sectionName: "Concise Physics Notes",
          fileName: "EX 1(A).pdf",
          storageKey: `batches/${testBatchId}/imported/ex_1a.pdf`,
          sizeBytes: 1024 * 500,
          pageCount: 6,
        },
        {
          subjectName: "Physics ICSE IX",
          chapterTitle: "Measurements and Experimentation",
          sectionName: "Concise Physics Notes",
          fileName: "EX 1(B).pdf",
          storageKey: `batches/${testBatchId}/imported/ex_1b.pdf`,
          sizeBytes: 1024 * 650,
          pageCount: 8,
        },
      ];

      const res = await importBatchMaterialFromZipTree(adminUser, testBatchId, zipEntries, testDb);

      expect(res.importedCount).toBe(2);

      // Verify created items under the batch
      const items = await testDb
        .select()
        .from(schema.contentItems)
        .where(eq(schema.contentItems.batchId, testBatchId));

      const imported1 = items.find((i) => i.title === "Exercise 1(A)");
      const imported2 = items.find((i) => i.title === "Exercise 1(B)");

      expect(imported1).toBeDefined();
      expect(imported2).toBeDefined();
      expect(imported1!.section).toBe("Concise Physics Notes");
    });
  });
});
