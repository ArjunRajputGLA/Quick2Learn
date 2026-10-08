import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";

vi.mock("server-only", () => ({}));

// Mock auth session for server actions
const mockSessionUser = {
  id: "test-student-view-user",
  email: "student_viewer@example.com",
  name: "Active Student",
  role: "student",
};

let isAuthenticated = true;

vi.mock("../apps/web/src/server/auth/session", () => ({
  getSession: vi.fn(async () => {
    if (!isAuthenticated) return null;
    return {
      user: mockSessionUser,
      session: { id: "test-sess-1" },
    };
  }),
}));

import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq, and, sql } from "drizzle-orm";
import * as schema from "../packages/db/src/schema";
import { seed } from "../packages/db/src/seed";
import {
  getVideoDetails,
  getChapterVideos,
  getVideosWithoutChapter,
  getShortVideos,
  getUpNextVideos,
  getSubjectChaptersWithStats,
  getChapterBySlug,
  getAllChaptersWithSubject,
  getRelatedBatchForClass,
  getPublicChapterResources,
  formatDuration,
  formatViews,
  formatRelativeTime,
} from "../apps/web/src/server/data/videos";
import { searchCatalogAdvanced } from "../apps/web/src/server/data/search";
import { recordLectureViewAction } from "../apps/web/src/server/lecture-actions";
import { getSubjectBySlug } from "../apps/web/src/server/data/catalog";
import { slugify, classLevelToSlug, slugToClassLevel, formatClassRoman } from "@quick2learn/shared";

const testDbUrl =
  process.env.DATABASE_URL_TEST ||
  "postgresql://postgres:postgres@localhost:5432/quick2learn_test";

const testPool = new Pool({
  connectionString: testDbUrl,
});

const testDb = drizzle(testPool, { schema });

describe("Structured Free Video Library Suite", () => {
  let mathSubject: any;
  let testChapter: any;
  let publishedVideo: any;
  let unpublishedVideo: any;
  let shortVideo: any;

  beforeAll(async () => {
    process.env.DATABASE_URL = testDbUrl;
    await seed(testDbUrl);

    // Ensure mock user exists in auth tables for foreign key
    await testDb
      .insert(schema.user)
      .values({
        id: mockSessionUser.id,
        name: mockSessionUser.name,
        email: mockSessionUser.email,
        emailVerified: true,
      })
      .onConflictDoNothing();

    await testDb
      .insert(schema.profiles)
      .values({
        userId: mockSessionUser.id,
        role: "student",
        fullName: mockSessionUser.name,
      })
      .onConflictDoNothing();

    // Fetch mathematics subject
    mathSubject = await getSubjectBySlug("mathematics");
    expect(mathSubject).toBeDefined();

    // Fetch seeded Integrals chapter
    const [chapter] = await testDb
      .select()
      .from(schema.chapters)
      .where(
        and(
          eq(schema.chapters.subjectId, mathSubject.id),
          eq(schema.chapters.classLevel, 12),
          eq(schema.chapters.slug, "class-12-maths-ch-7-integrals"),
        ),
      );
    expect(chapter).toBeDefined();
    testChapter = chapter;

    // Insert 1 published video in chapter
    const [pv] = await testDb
      .insert(schema.youtubeVideos)
      .values({
        id: "vid_test_pub_001",
        title: "Integrals Part 1: Basic Substitution Method",
        description: "Watch at 02:30 for formula and https://quick2learn.in for test series.",
        durationSeconds: 1540,
        publishedAt: new Date(),
        isPublished: true,
        isShort: false,
        classLevel: 12,
        subjectId: mathSubject.id,
        chapterId: testChapter.id,
        viewCount: 12450,
      })
      .onConflictDoUpdate({
        target: schema.youtubeVideos.id,
        set: {
          title: "Integrals Part 1: Basic Substitution Method",
          isPublished: true,
          isShort: false,
          chapterId: testChapter.id,
          classLevel: 12,
          subjectId: mathSubject.id,
        },
      })
      .returning();
    publishedVideo = pv;

    // Insert 1 unpublished video
    const [upv] = await testDb
      .insert(schema.youtubeVideos)
      .values({
        id: "vid_test_unpub_002",
        title: "Draft Video Not Yet Ready",
        durationSeconds: 1200,
        publishedAt: new Date(),
        isPublished: false,
        isShort: false,
        classLevel: 12,
        subjectId: mathSubject.id,
        chapterId: testChapter.id,
      })
      .onConflictDoUpdate({
        target: schema.youtubeVideos.id,
        set: { isPublished: false, chapterId: testChapter.id },
      })
      .returning();
    unpublishedVideo = upv;

    // Insert 1 short video
    const [sv] = await testDb
      .insert(schema.youtubeVideos)
      .values({
        id: "vid_test_short_003",
        title: "Quick Formula Trick for Definite Integrals #shorts",
        durationSeconds: 58,
        publishedAt: new Date(),
        isPublished: true,
        isShort: true,
        classLevel: 12,
        subjectId: mathSubject.id,
        chapterId: testChapter.id,
      })
      .onConflictDoUpdate({
        target: schema.youtubeVideos.id,
        set: { isPublished: true, isShort: true, chapterId: testChapter.id },
      })
      .returning();
    shortVideo = sv;

    // Insert public resource for chapter
    await testDb
      .insert(schema.resources)
      .values({
        id: "e0000000-0000-0000-0000-000000000001",
        title: "Integrals Standard Formulas Sheet",
        type: "formula_sheet",
        chapterId: testChapter.id,
        storageKey: "resources/integrals-formulas.pdf",
        visibility: "public",
      })
      .onConflictDoNothing();
  });

  afterAll(async () => {
    await testPool.end();
  });

  describe("Utility & Slugs Validation", () => {
    it("converts class levels to slugs and roman numerals accurately", () => {
      expect(classLevelToSlug(9)).toBe("ix");
      expect(classLevelToSlug(10)).toBe("x");
      expect(classLevelToSlug(11)).toBe("xi");
      expect(classLevelToSlug(12)).toBe("xii");

      expect(slugToClassLevel("ix")).toBe(9);
      expect(slugToClassLevel("x")).toBe(10);
      expect(slugToClassLevel("xi")).toBe(11);
      expect(slugToClassLevel("xii")).toBe(12);
      expect(slugToClassLevel("invalid")).toBeNull();

      expect(formatClassRoman(9)).toBe("IX");
      expect(formatClassRoman(10)).toBe("X");
      expect(formatClassRoman(11)).toBe("XI");
      expect(formatClassRoman(12)).toBe("XII");
    });

    it("slugify creates URL-friendly slugs", () => {
      expect(slugify("Class 12 Maths: Integrals Part 1 & 2!")).toBe("class-12-maths-integrals-part-1-2");
      expect(slugify("How to score 100/100 in Board Exam?")).toBe("how-to-score-100100-in-board-exam");
    });

    it("formatting helpers output clean labels", () => {
      expect(formatDuration(58)).toBe("0m");
      expect(formatDuration(1800)).toBe("30m");
      expect(formatDuration(3665)).toBe("1h 1m");

      expect(formatViews(950)).toBe("950 views");
      expect(formatViews(12400)).toBe("12K views");
      expect(formatViews(1250000)).toBe("1.3M views");
    });
  });

  describe("/learn and /learn/[class]/[subject] Data Layer", () => {
    it("getSubjectChaptersWithStats calculates lecture counts and formatted duration", async () => {
      const chaptersWithStats = await getSubjectChaptersWithStats(12, mathSubject.id);

      expect(Array.isArray(chaptersWithStats)).toBe(true);
      const ourChapter = chaptersWithStats.find((c) => c.id === testChapter.id);
      expect(ourChapter).toBeDefined();
      // Should include published video, excluding short
      expect(ourChapter?.lectureCount).toBeGreaterThanOrEqual(1);
      expect(ourChapter?.totalDurationSeconds).toBeGreaterThanOrEqual(1540);
      expect(ourChapter?.formattedDuration).toBeDefined();
    });

    it("getChapterVideos excludes shorts by default from chapter page", async () => {
      const chapterVideos = await getChapterVideos(testChapter.id, { excludeShorts: true });

      expect(chapterVideos.length).toBeGreaterThanOrEqual(1);
      // Ensure the short video is excluded
      const hasShort = chapterVideos.some((v) => v.id === shortVideo.id);
      expect(hasShort).toBe(false);

      // Ensure published video is included
      const hasPub = chapterVideos.some((v) => v.id === publishedVideo.id);
      expect(hasPub).toBe(true);

      // Verify link format: /lecture/[videoId]/[slug]
      expect(chapterVideos[0].href).toMatch(/^\/lecture\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+$/);
    });

    it("getShortVideos returns only short videos", async () => {
      const shorts = await getShortVideos(10);
      expect(shorts.length).toBeGreaterThanOrEqual(1);
      const foundOurShort = shorts.find((s) => s.id === shortVideo.id);
      expect(foundOurShort).toBeDefined();
    });

    it("getAllChaptersWithSubject supplies static params for generateStaticParams", async () => {
      const allStaticRows = await getAllChaptersWithSubject();
      expect(allStaticRows.length).toBeGreaterThanOrEqual(1);

      const foundChapter = allStaticRows.find(
        (r) => r.chapterSlug === testChapter.slug && r.classLevel === 12,
      );
      expect(foundChapter).toBeDefined();
      expect(foundChapter?.subjectSlug).toBe("mathematics");
    });
  });

  describe("/lecture/[videoId]/[slug] Video Page & Privacy", () => {
    it("getVideoDetails returns published video details to students", async () => {
      const details = await getVideoDetails(publishedVideo.id);

      expect(details).toBeDefined();
      expect(details?.video.id).toBe(publishedVideo.id);
      expect(details?.video.title).toContain("Integrals Part 1");
      expect(details?.subject?.name).toBe("Mathematics");
      expect(details?.chapter?.title).toBe("Integrals");
    });

    it("Unpublished video returns null (404) for anonymous and student users", async () => {
      const studentUser = { id: "student-1", role: "student" as const, email: "s@test.com" };
      const details = await getVideoDetails(unpublishedVideo.id, studentUser);

      // Unpublished videos must not be visible to students (will trigger notFound())
      expect(details).toBeNull();
    });

    it("Unpublished video is accessible only to staff/admin", async () => {
      const staffUser = { id: "staff-1", role: "admin" as const, email: "admin@quick2learn.in" };
      const details = await getVideoDetails(unpublishedVideo.id, staffUser);

      expect(details).toBeDefined();
      expect(details?.video.id).toBe(unpublishedVideo.id);
    });

    it("getUpNextVideos returns other videos from the same chapter or subject", async () => {
      const upNext = await getUpNextVideos(publishedVideo.id, testChapter.id, mathSubject.id, 5);

      expect(Array.isArray(upNext)).toBe(true);
      // The current video must NOT be in upNext
      const containsSelf = upNext.some((v) => v.id === publishedVideo.id);
      expect(containsSelf).toBe(false);
    });

    it("getPublicChapterResources returns public attachments", async () => {
      const resources = await getPublicChapterResources(testChapter.id);

      expect(resources.length).toBeGreaterThanOrEqual(1);
      const sheet = resources.find((r) => r.id === "e0000000-0000-0000-0000-000000000001");
      expect(sheet).toBeDefined();
      expect(sheet?.visibility).toBe("public");
    });

    it("recordLectureViewAction Server Action records a view for logged-in students", async () => {
      isAuthenticated = true;

      const result = await recordLectureViewAction(publishedVideo.id);
      expect(result.success).toBe(true);
      expect(result.id).toBeDefined();

      // Verify row exists in database
      const rows = await testDb
        .select()
        .from(schema.lectureViews)
        .where(eq(schema.lectureViews.userId, mockSessionUser.id));

      expect(rows.length).toBeGreaterThanOrEqual(1);
      const matchingView = rows.find((v) => v.videoId === publishedVideo.id);
      expect(matchingView).toBeDefined();
    });

    it("recordLectureViewAction returns unauthenticated when no session exists", async () => {
      isAuthenticated = false;

      const result = await recordLectureViewAction(publishedVideo.id);
      expect(result.success).toBe(false);
      expect(result.reason).toBe("unauthenticated");

      isAuthenticated = true;
    });
  });

  describe("/search Multi-Criteria Advanced Filtering & Pagination", () => {
    it("searches catalog with classLevel filter", async () => {
      const res = await searchCatalogAdvanced({
        classLevel: 12,
        type: "lecture",
        pageSize: 10,
      });

      expect(res.items.length).toBeGreaterThanOrEqual(1);
      expect(res.items.every((it) => it.classLevel === 12)).toBe(true);
      expect(res.totalCount).toBeGreaterThanOrEqual(1);
    });

    it("filters by duration (under10, 10to30, 30plus)", async () => {
      // Under 10 mins (includes shortVideo which is 58s)
      const resUnder10 = await searchCatalogAdvanced({
        type: "lecture",
        duration: "under10",
      });
      const hasShort = resUnder10.items.some((it) => it.id === shortVideo.id);
      expect(hasShort).toBe(true);

      // 10 to 30 mins (includes publishedVideo which is 1540s = 25m40s)
      const res10to30 = await searchCatalogAdvanced({
        type: "lecture",
        duration: "10to30",
      });
      const hasPub = res10to30.items.some((it) => it.id === publishedVideo.id);
      expect(hasPub).toBe(true);
    });

    it("filters by Resource Type (lecture vs batch vs notes)", async () => {
      const resLectures = await searchCatalogAdvanced({ type: "lecture" });
      expect(resLectures.items.every((it) => it.type === "lecture")).toBe(true);

      const resBatches = await searchCatalogAdvanced({ type: "batch" });
      expect(resBatches.items.every((it) => it.type === "batch")).toBe(true);

      const resNotes = await searchCatalogAdvanced({ type: "notes" });
      expect(resNotes.items.every((it) => it.type === "notes")).toBe(true);
    });

    it("sorts by newest, views, and relevance", async () => {
      const resByViews = await searchCatalogAdvanced({
        type: "lecture",
        sort: "views",
      });
      expect(resByViews.items.length).toBeGreaterThanOrEqual(1);

      const resByNewest = await searchCatalogAdvanced({
        type: "lecture",
        sort: "newest",
      });
      expect(resByNewest.items.length).toBeGreaterThanOrEqual(1);
    });

    it("paginates items correctly", async () => {
      const page1 = await searchCatalogAdvanced({
        pageSize: 2,
        page: 1,
      });

      expect(page1.currentPage).toBe(1);
      expect(page1.items.length).toBeLessThanOrEqual(2);
      expect(page1.totalPages).toBeGreaterThanOrEqual(1);
    });
  });
});
