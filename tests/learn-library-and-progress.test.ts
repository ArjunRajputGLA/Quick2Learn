import { describe, it, expect, beforeAll, vi } from "vitest";

vi.mock("server-only", () => ({}));
import { db, schema, eq } from "@quick2learn/db";
import { auth } from "../apps/web/src/server/auth/auth";
import { GET as getLearnClasses } from "../apps/web/src/app/api/v1/learn/classes/route";
import { GET as getLearnChapters } from "../apps/web/src/app/api/v1/learn/chapters/route";
import { GET as getChapterDetail } from "../apps/web/src/app/api/v1/learn/chapters/[id]/route";
import { GET as getLectureDetail } from "../apps/web/src/app/api/v1/lectures/[id]/route";
import { POST as postProgress } from "../apps/web/src/app/api/v1/progress/route";
import { GET as searchLibrary } from "../apps/web/src/app/api/v1/search/route";
import { GET as getFreeResources } from "../apps/web/src/app/api/v1/resources/free/route";
import {
  learnClassesResponseSchema,
  learnChaptersResponseSchema,
  chapterDetailResponseSchema,
  lectureDetailResponseSchema,
  progressBatchResponseSchema,
  freeResourcesResponseSchema,
  librarySearchResponseSchema,
} from "@quick2learn/shared";

describe("Learn Library & Progress Sync API Suite", () => {
  const studentUserId = `student-learn-${Date.now()}`;
  const studentSessionToken = `token-learn-${Date.now()}`;
  let studentCookie: string;

  let testChapterId: string;
  let testLectureId: string;

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
      "quick2learn_dev_secret_key_at_least_32_characters_long";
    studentCookie = await signCookie(studentSessionToken, secret);

    // Create student user
    await db.insert(schema.user).values({
      id: studentUserId,
      name: "Rohit Verma",
      email: `${studentUserId}@quick2learn.invalid`,
      role: "student",
      emailVerified: true,
    });

    await db.insert(schema.profiles).values({
      userId: studentUserId,
      fullName: "Rohit Verma",
      classLevel: 10,
      board: "cbse",
      onboardedAt: new Date(),
    });

    // Create session
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await db.insert(schema.session).values({
      id: `session-${Date.now()}`,
      userId: studentUserId,
      token: studentSessionToken,
      expiresAt,
    });

    // Fetch existing subject or create
    let [subject] = await db
      .select()
      .from(schema.subjects)
      .where(eq(schema.subjects.slug, "mathematics"))
      .limit(1);

    if (!subject) {
      const [newSub] = await db
        .insert(schema.subjects)
        .values({
          id: crypto.randomUUID(),
          name: "Mathematics",
          slug: "mathematics",
          classLevel: 10,
        })
        .returning();
      subject = newSub!;
    }

    // Create a test chapter
    const [chapter] = await db
      .insert(schema.chapters)
      .values({
        id: crypto.randomUUID(),
        subjectId: subject.id,
        classLevel: 10,
        number: 1,
        title: "Real Numbers & Polynomials",
        slug: `real-numbers-${Date.now()}`,
        description: "Foundational algebra and number theory",
      })
      .returning();
    testChapterId = chapter!.id;

    // Create two test youtube videos for this chapter
    const [video1] = await db
      .insert(schema.youtubeVideos)
      .values({
        id: `vid-yt-1-${Date.now()}`,
        title: "Introduction to Euclid's Lemma",
        description:
          "Lecture 1 on Euclid Division Lemma\n00:00 Introduction\n04:30 Fundamental Theorem of Arithmetic\n12:45 Proof of Irrationality",
        durationSeconds: 1200,
        classLevel: 10,
        chapterId: testChapterId,
        subjectId: subject.id,
        isPublished: true,
      })
      .returning();
    testLectureId = video1!.id;

    await db.insert(schema.youtubeVideos).values({
      id: `vid-yt-2-${Date.now()}`,
      title: "Polynomial Roots and Factors",
      description: "Lecture 2 on zero of polynomials",
      durationSeconds: 1500,
      classLevel: 10,
      chapterId: testChapterId,
      subjectId: subject.id,
      isPublished: true,
    });

    // Create a public test note
    await db.insert(schema.resources).values({
      id: crypto.randomUUID(),
      chapterId: testChapterId,
      title: "Real Numbers Formula Sheet & NCERT Solutions",
      type: "notes",
      storageKey: "notes/class-10-real-numbers.pdf",
      storageBucket: "public",
      visibility: "public",
    });
  });

  it("1. GET /api/v1/learn/classes returns classes and subjects with lecture counts", async () => {
    const req = new Request("https://quick2learn.in/api/v1/learn/classes");
    const res = await getLearnClasses(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    const parsed = learnClassesResponseSchema.safeParse(json);
    expect(parsed.success).toBe(true);
    expect(parsed.data?.classes.length).toBeGreaterThanOrEqual(1);

    const class10 = parsed.data?.classes.find((c) => c.classLevel === 10);
    expect(class10).toBeDefined();
    expect(class10?.subjects.length).toBeGreaterThanOrEqual(1);
  });

  it("2. GET /api/v1/learn/chapters returns chapters, lecture counts and progress", async () => {
    const req = new Request(
      "https://quick2learn.in/api/v1/learn/chapters?class=10&subject=mathematics",
      {
        headers: {
          Cookie: `better-auth.session_token=${studentCookie}`,
        },
      }
    );
    const res = await getLearnChapters(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    const parsed = learnChaptersResponseSchema.safeParse(json);
    expect(parsed.success).toBe(true);

    const chapter = parsed.data?.chapters.find((c) => c.id === testChapterId);
    expect(chapter).toBeDefined();
    expect(chapter?.lectureCount).toBeGreaterThanOrEqual(2);
    expect(chapter?.totalDurationFormatted).toBeDefined();
    expect(chapter?.progressPercentage).toBe(0);
  });

  it("3. GET /api/v1/learn/chapters/:id returns lectures, notes and continueLectureId", async () => {
    const req = new Request(
      `https://quick2learn.in/api/v1/learn/chapters/${testChapterId}`,
      {
        headers: {
          Cookie: `better-auth.session_token=${studentCookie}`,
        },
      }
    );
    const res = await getChapterDetail(req, {
      params: Promise.resolve({ id: testChapterId }),
    });
    expect(res.status).toBe(200);

    const json = await res.json();
    const parsed = chapterDetailResponseSchema.safeParse(json);
    expect(parsed.success).toBe(true);

    expect(parsed.data?.id).toBe(testChapterId);
    expect(parsed.data?.lectures.length).toBeGreaterThanOrEqual(2);
    expect(parsed.data?.notes.length).toBeGreaterThanOrEqual(1);
    expect(parsed.data?.continueLectureId).toBe(testLectureId);
  });

  it("4. GET /api/v1/lectures/:id returns timestamps, metadata and initial 0 progress", async () => {
    const req = new Request(`https://quick2learn.in/api/v1/lectures/${testLectureId}`, {
      headers: {
        Cookie: `better-auth.session_token=${studentCookie}`,
      },
    });
    const res = await getLectureDetail(req, {
      params: Promise.resolve({ id: testLectureId }),
    });
    expect(res.status).toBe(200);

    const json = await res.json();
    const parsed = lectureDetailResponseSchema.safeParse(json);
    expect(parsed.success).toBe(true);

    expect(parsed.data?.id).toBe(testLectureId);
    expect(parsed.data?.positionSeconds).toBe(0);
    expect(parsed.data?.isCompleted).toBe(false);
    expect(parsed.data?.timestamps.length).toBe(3);
    expect(parsed.data?.timestamps[1]?.timeStr).toBe("04:30");
  });

  it("5. POST /api/v1/progress rejects unauthenticated requests with 401", async () => {
    const req = new Request("https://quick2learn.in/api/v1/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        updates: [
          {
            itemType: "youtube_video",
            itemId: testLectureId,
            positionSeconds: 300,
            durationSeconds: 1200,
          },
        ],
      }),
    });
    const res = await postProgress(req);
    expect(res.status).toBe(401);
  });

  it("6. POST /api/v1/progress saves intermediate position (< 90%) without marking complete", async () => {
    const req = new Request("https://quick2learn.in/api/v1/progress", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `better-auth.session_token=${studentCookie}`,
      },
      body: JSON.stringify({
        updates: [
          {
            itemType: "youtube_video",
            itemId: testLectureId,
            positionSeconds: 600,
            durationSeconds: 1200,
          },
        ],
      }),
    });
    const res = await postProgress(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    const parsed = progressBatchResponseSchema.safeParse(json);
    expect(parsed.success).toBe(true);
    expect(parsed.data?.syncedCount).toBe(1);
    expect(parsed.data?.completedCount).toBe(0);

    // Verify progress persists on GET /lectures/:id
    const verifyReq = new Request(
      `https://quick2learn.in/api/v1/lectures/${testLectureId}`,
      {
        headers: {
          Cookie: `better-auth.session_token=${studentCookie}`,
        },
      }
    );
    const verifyRes = await getLectureDetail(verifyReq, {
      params: Promise.resolve({ id: testLectureId }),
    });
    const verifyJson = await verifyRes.json();
    expect(verifyJson.positionSeconds).toBe(600);
    expect(verifyJson.progressPercent).toBe(50);
    expect(verifyJson.isCompleted).toBe(false);
  });

  it("7. POST /api/v1/progress marks lecture complete when watched >= 90%", async () => {
    // 1200 * 0.9 = 1080s. Sending 1100s.
    const req = new Request("https://quick2learn.in/api/v1/progress", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `better-auth.session_token=${studentCookie}`,
      },
      body: JSON.stringify({
        updates: [
          {
            itemType: "youtube_video",
            itemId: testLectureId,
            positionSeconds: 1100,
            durationSeconds: 1200,
          },
        ],
      }),
    });
    const res = await postProgress(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.completedCount).toBe(1);

    // Verify GET /lectures/:id returns isCompleted = true
    const verifyReq = new Request(
      `https://quick2learn.in/api/v1/lectures/${testLectureId}`,
      {
        headers: {
          Cookie: `better-auth.session_token=${studentCookie}`,
        },
      }
    );
    const verifyRes = await getLectureDetail(verifyReq, {
      params: Promise.resolve({ id: testLectureId }),
    });
    const verifyJson = await verifyRes.json();
    expect(verifyJson.isCompleted).toBe(true);
    expect(verifyJson.progressPercent).toBe(92);

    // Verify chapter progress shows 1 completed lecture and updated progress percentage
    const chapReq = new Request(
      "https://quick2learn.in/api/v1/learn/chapters?class=10&subject=mathematics",
      {
        headers: {
          Cookie: `better-auth.session_token=${studentCookie}`,
        },
      }
    );
    const chapRes = await getLearnChapters(chapReq);
    const chapJson = await chapRes.json();
    const updatedChap = chapJson.chapters.find(
      (c: any) => c.id === testChapterId
    );
    expect(updatedChap.completedLecturesCount).toBe(1);
    expect(updatedChap.progressPercentage).toBeGreaterThan(0);
  });

  it("8. GET /api/v1/search finds lectures, chapters and notes", async () => {
    const req = new Request(
      "https://quick2learn.in/api/v1/search?q=Numbers&class=10",
      {
        headers: {
          Cookie: `better-auth.session_token=${studentCookie}`,
        },
      }
    );
    const res = await searchLibrary(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    const parsed = librarySearchResponseSchema.safeParse(json);
    expect(parsed.success).toBe(true);

    expect(parsed.data?.query).toBe("Numbers");
    expect(parsed.data?.total).toBeGreaterThanOrEqual(1);
    expect(
      parsed.data?.chapters.some((c) => c.title.includes("Real Numbers"))
    ).toBe(true);
  });

  it("9. GET /api/v1/resources/free returns downloadable free resources", async () => {
    const req = new Request("https://quick2learn.in/api/v1/resources/free?class=10");
    const res = await getFreeResources(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    const parsed = freeResourcesResponseSchema.safeParse(json);
    expect(parsed.success).toBe(true);
    expect(parsed.data?.resources.length).toBeGreaterThanOrEqual(1);
    expect(parsed.data?.resources[0]?.fileUrl).toBeDefined();
  });
});
