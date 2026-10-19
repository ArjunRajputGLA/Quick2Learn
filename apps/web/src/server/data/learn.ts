import {
  db,
  schema,
  eq,
  and,
  or,
  inArray,
  desc,
  asc,
  sql,
  type DatabaseExecutor,
} from "@quick2learn/db";
import { formatDuration } from "./videos";
import { publicUrl } from "../storage";
import { searchCatalog } from "./search";
import type {
  LearnClassesResponse,
  LearnChaptersResponse,
  ChapterDetailResponse,
  LectureDetailResponse,
  ProgressUpdateItem,
  ProgressBatchResponse,
  FreeResourcesResponse,
  LibrarySearchResponse,
  LectureTimestamp,
} from "@quick2learn/shared";

/**
 * Extracts interactive milestones/timestamps from YouTube description.
 * Matches patterns like "00:00 Intro", "12:34 Quadratic Formula", etc.
 */
export function parseTimestampsFromDescription(
  description?: string | null
): LectureTimestamp[] {
  if (!description) return [];

  const results: LectureTimestamp[] = [];
  const lines = description.split(/\r?\n/);
  const regex = /(?:(\d{1,2}):)?(\d{1,2}):(\d{2})\s+[-–—]?\s*(.+)/;

  for (const line of lines) {
    const match = line.trim().match(regex);
    if (match) {
      const hours = match[1] ? parseInt(match[1], 10) : 0;
      const minutes = parseInt(match[2] || "0", 10);
      const seconds = parseInt(match[3] || "0", 10);
      const label = (match[4] || "").trim();

      const totalSeconds = hours * 3600 + minutes * 60 + seconds;
      const timeStr = `${hours > 0 ? `${hours}:` : ""}${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

      if (label && !isNaN(totalSeconds)) {
        results.push({
          seconds: totalSeconds,
          timeStr,
          label,
        });
      }
    }
  }

  // If no explicit timestamps found in description, generate clean conceptual checkpoints
  if (results.length === 0) {
    results.push(
      { seconds: 0, timeStr: "00:00", label: "Overview & Chapter Context" },
      { seconds: 300, timeStr: "05:00", label: "Core Concept Derivation" },
      { seconds: 900, timeStr: "15:00", label: "Step-by-Step Solved Examples" },
      { seconds: 1800, timeStr: "30:00", label: "Board Exam PYQs & Summary" }
    );
  }

  return results.sort((a, b) => a.seconds - b.seconds);
}

/**
 * GET /learn/classes
 * Returns class levels (IX–XII) with associated subjects and lecture counts.
 */
export async function getLearnClasses(
  tx?: DatabaseExecutor
): Promise<LearnClassesResponse> {
  const d = tx || db;

  const supportedClasses = [9, 10, 11, 12];

  // Fetch subjects
  const allSubjects = await d
    .select({
      id: schema.subjects.id,
      name: schema.subjects.name,
      slug: schema.subjects.slug,
      sortOrder: schema.subjects.sortOrder,
    })
    .from(schema.subjects)
    .orderBy(asc(schema.subjects.sortOrder));

  // Count published lectures per class and subject
  const counts = await d
    .select({
      classLevel: schema.youtubeVideos.classLevel,
      subjectId: schema.youtubeVideos.subjectId,
      count: sql<number>`count(*)::int`,
    })
    .from(schema.youtubeVideos)
    .where(eq(schema.youtubeVideos.isPublished, true))
    .groupBy(schema.youtubeVideos.classLevel, schema.youtubeVideos.subjectId);

  const classes = supportedClasses.map((lvl) => {
    let totalLec = 0;
    const subjects = allSubjects.map((sub) => {
      const match = counts.find(
        (c) => c.classLevel === lvl && c.subjectId === sub.id
      );
      const count = match ? Number(match.count) : 0;
      totalLec += count;
      return {
        id: sub.id,
        name: sub.name,
        slug: sub.slug,
        lectureCount: count,
      };
    });

    return {
      classLevel: lvl,
      label: `Class ${lvl}`,
      slug: String(lvl),
      totalLectures: totalLec,
      subjects,
    };
  });

  return { classes };
}

/**
 * GET /learn/chapters?class=&subject=
 * Returns chapter list for a given class & subject, with total duration and student watch progress.
 */
export async function getLearnChapters(
  classLevel: number,
  subjectSlugOrId?: string,
  userId?: string,
  tx?: DatabaseExecutor
): Promise<LearnChaptersResponse> {
  const d = tx || db;

  // 1. Resolve subject
  let targetSubject = null;
  if (subjectSlugOrId) {
    [targetSubject] = await d
      .select()
      .from(schema.subjects)
      .where(
        subjectSlugOrId.length === 36
          ? eq(schema.subjects.id, subjectSlugOrId)
          : eq(schema.subjects.slug, subjectSlugOrId.toLowerCase())
      )
      .limit(1);
  }

  if (!targetSubject) {
    [targetSubject] = await d
      .select()
      .from(schema.subjects)
      .where(eq(schema.subjects.slug, "mathematics"))
      .limit(1);
  }

  const subjectId = targetSubject ? targetSubject.id : "a0000000-0000-0000-0000-000000000001";
  const subjectName = targetSubject ? targetSubject.name : "Mathematics";
  const subjectSlug = targetSubject ? targetSubject.slug : "mathematics";

  // 2. Fetch chapters for this class and subject
  const chaptersList = await d
    .select({
      id: schema.chapters.id,
      number: schema.chapters.number,
      title: schema.chapters.title,
      slug: schema.chapters.slug,
      sortOrder: schema.chapters.sortOrder,
    })
    .from(schema.chapters)
    .where(
      and(
        eq(schema.chapters.classLevel, classLevel),
        eq(schema.chapters.subjectId, subjectId)
      )
    )
    .orderBy(asc(schema.chapters.sortOrder), asc(schema.chapters.number));

  const chapterIds = chaptersList.map((ch) => ch.id);

  // 3. Fetch lectures belonging to these chapters
  const lectures = chapterIds.length > 0
    ? await d
        .select({
          id: schema.youtubeVideos.id,
          chapterId: schema.youtubeVideos.chapterId,
          durationSeconds: schema.youtubeVideos.durationSeconds,
        })
        .from(schema.youtubeVideos)
        .where(
          and(
            eq(schema.youtubeVideos.isPublished, true),
            inArray(schema.youtubeVideos.chapterId, chapterIds)
          )
        )
    : [];

  // 4. Fetch user progress if authenticated
  let userProgressList: { itemId: string; completedAt: Date | null }[] = [];
  if (userId && lectures.length > 0) {
    const videoIds = lectures.map((l) => l.id);
    userProgressList = await d
      .select({
        itemId: schema.contentProgress.itemId,
        completedAt: schema.contentProgress.completedAt,
      })
      .from(schema.contentProgress)
      .where(
        and(
          eq(schema.contentProgress.userId, userId),
          eq(schema.contentProgress.itemType, "youtube_video"),
          inArray(schema.contentProgress.itemId, videoIds)
        )
      );
  }

  const completedSet = new Set(
    userProgressList.filter((p) => p.completedAt !== null).map((p) => p.itemId)
  );

  // 5. Map chapters with lecture counts, duration, and progress
  const formattedChapters = chaptersList.map((ch) => {
    const chapterLecs = lectures.filter((l) => l.chapterId === ch.id);
    const lectureCount = chapterLecs.length;
    const totalDurationSeconds = chapterLecs.reduce(
      (sum, l) => sum + (l.durationSeconds || 0),
      0
    );

    let completedLecturesCount = 0;
    for (const l of chapterLecs) {
      if (completedSet.has(l.id)) {
        completedLecturesCount++;
      }
    }

    const progressPercentage =
      lectureCount > 0
        ? Math.min(100, Math.round((completedLecturesCount / lectureCount) * 100))
        : 0;

    return {
      id: ch.id,
      number: ch.number,
      title: ch.title,
      slug: ch.slug,
      lectureCount,
      totalDurationSeconds,
      totalDurationFormatted: formatDuration(totalDurationSeconds),
      completedLecturesCount,
      progressPercentage,
    };
  });

  return {
    classLevel,
    subject: {
      id: subjectId,
      name: subjectName,
      slug: subjectSlug,
    },
    chapters: formattedChapters,
  };
}

/**
 * GET /learn/chapters/:id
 * Returns chapter metadata, ordered lectures with progress, and public PDF notes.
 */
export async function getChapterDetail(
  chapterId: string,
  userId?: string,
  tx?: DatabaseExecutor
): Promise<ChapterDetailResponse> {
  const d = tx || db;

  // 1. Fetch chapter
  const [chapter] = await d
    .select({
      id: schema.chapters.id,
      number: schema.chapters.number,
      title: schema.chapters.title,
      slug: schema.chapters.slug,
      classLevel: schema.chapters.classLevel,
      subjectName: schema.subjects.name,
    })
    .from(schema.chapters)
    .leftJoin(schema.subjects, eq(schema.chapters.subjectId, schema.subjects.id))
    .where(
      chapterId.length === 36
        ? eq(schema.chapters.id, chapterId)
        : eq(schema.chapters.slug, chapterId)
    )
    .limit(1);

  if (!chapter) {
    throw new Error("Chapter not found");
  }

  // 2. Fetch lectures
  const rawLectures = await d
    .select({
      id: schema.youtubeVideos.id,
      title: schema.youtubeVideos.title,
      durationSeconds: schema.youtubeVideos.durationSeconds,
      thumbnailUrl: schema.youtubeVideos.thumbnailUrl,
      publishedAt: schema.youtubeVideos.publishedAt,
      createdAt: schema.youtubeVideos.createdAt,
    })
    .from(schema.youtubeVideos)
    .where(
      and(
        eq(schema.youtubeVideos.chapterId, chapter.id),
        eq(schema.youtubeVideos.isPublished, true)
      )
    )
    .orderBy(asc(schema.youtubeVideos.publishedAt), asc(schema.youtubeVideos.createdAt));

  // 3. User progress on lectures
  let progressMap = new Map<string, { position: number; duration: number; isCompleted: boolean }>();
  if (userId && rawLectures.length > 0) {
    const videoIds = rawLectures.map((l) => l.id);
    const progressRows = await d
      .select({
        itemId: schema.contentProgress.itemId,
        positionSeconds: schema.contentProgress.positionSeconds,
        durationSeconds: schema.contentProgress.durationSeconds,
        completedAt: schema.contentProgress.completedAt,
      })
      .from(schema.contentProgress)
      .where(
        and(
          eq(schema.contentProgress.userId, userId),
          eq(schema.contentProgress.itemType, "youtube_video"),
          inArray(schema.contentProgress.itemId, videoIds)
        )
      );

    for (const row of progressRows) {
      const isCompleted = row.completedAt !== null || (row.durationSeconds > 0 && row.positionSeconds / row.durationSeconds >= 0.9);
      progressMap.set(row.itemId, {
        position: row.positionSeconds,
        duration: row.durationSeconds,
        isCompleted,
      });
    }
  }

  let continueLectureId: string | null = null;
  const lectures = rawLectures.map((lec) => {
    const prog = progressMap.get(lec.id);
    const positionSeconds = prog?.position ?? 0;
    const isCompleted = prog?.isCompleted ?? false;
    const progressPercent =
      lec.durationSeconds > 0
        ? Math.min(100, Math.round((positionSeconds / lec.durationSeconds) * 100))
        : 0;

    if (!continueLectureId && !isCompleted) {
      continueLectureId = lec.id;
    }

    return {
      id: lec.id,
      title: lec.title,
      durationSeconds: lec.durationSeconds,
      durationFormatted: formatDuration(lec.durationSeconds),
      thumbnailUrl: lec.thumbnailUrl,
      publishedAt: lec.publishedAt ? lec.publishedAt.toISOString() : null,
      positionSeconds,
      progressPercent,
      isCompleted,
      route: `/lecture/${lec.id}`,
    };
  });

  // Default to first lecture if all completed or none completed
  if (!continueLectureId && lectures.length > 0) {
    continueLectureId = lectures[0]!.id;
  }

  // 4. Free public notes & resources for this chapter
  const rawNotes = await d
    .select({
      id: schema.resources.id,
      title: schema.resources.title,
      type: schema.resources.type,
      storageKey: schema.resources.storageKey,
      storageBucket: schema.resources.storageBucket,
    })
    .from(schema.resources)
    .where(
      and(
        eq(schema.resources.chapterId, chapter.id),
        eq(schema.resources.visibility, "public")
      )
    )
    .orderBy(desc(schema.resources.createdAt));

  const notes = rawNotes.map((n) => ({
    id: n.id,
    title: n.title,
    type: n.type,
    storageKey: n.storageKey,
    fileUrl: publicUrl(n.storageKey),
    fileSize: "PDF • 2.4 MB",
  }));

  return {
    id: chapter.id,
    number: chapter.number,
    title: chapter.title,
    slug: chapter.slug,
    classLevel: chapter.classLevel,
    subjectName: chapter.subjectName || "Mathematics",
    continueLectureId,
    lectures,
    notes,
  };
}

/**
 * GET /lectures/:id
 * Returns lecture metadata, watch progress, parsed timestamps, up-next recommendations, and notes.
 */
export async function getLectureDetail(
  lectureId: string,
  userId?: string,
  tx?: DatabaseExecutor
): Promise<LectureDetailResponse> {
  const d = tx || db;

  // 1. Fetch video details
  const [video] = await d
    .select({
      id: schema.youtubeVideos.id,
      title: schema.youtubeVideos.title,
      description: schema.youtubeVideos.description,
      durationSeconds: schema.youtubeVideos.durationSeconds,
      thumbnailUrl: schema.youtubeVideos.thumbnailUrl,
      publishedAt: schema.youtubeVideos.publishedAt,
      classLevel: schema.youtubeVideos.classLevel,
      chapterId: schema.youtubeVideos.chapterId,
      chapterTitle: schema.chapters.title,
      subjectName: schema.subjects.name,
      facultyName: schema.faculty.name,
    })
    .from(schema.youtubeVideos)
    .leftJoin(schema.chapters, eq(schema.youtubeVideos.chapterId, schema.chapters.id))
    .leftJoin(schema.subjects, eq(schema.youtubeVideos.subjectId, schema.subjects.id))
    .leftJoin(schema.faculty, eq(schema.youtubeVideos.facultyId, schema.faculty.id))
    .where(eq(schema.youtubeVideos.id, lectureId))
    .limit(1);

  if (!video) {
    throw new Error("Lecture not found");
  }

  // 2. User watch progress
  let positionSeconds = 0;
  let isCompleted = false;
  if (userId) {
    const [progress] = await d
      .select({
        positionSeconds: schema.contentProgress.positionSeconds,
        durationSeconds: schema.contentProgress.durationSeconds,
        completedAt: schema.contentProgress.completedAt,
      })
      .from(schema.contentProgress)
      .where(
        and(
          eq(schema.contentProgress.userId, userId),
          eq(schema.contentProgress.itemType, "youtube_video"),
          eq(schema.contentProgress.itemId, lectureId)
        )
      )
      .limit(1);

    if (progress) {
      positionSeconds = progress.positionSeconds;
      isCompleted =
        progress.completedAt !== null ||
        (progress.durationSeconds > 0 &&
          progress.positionSeconds / progress.durationSeconds >= 0.9);
    }
  }

  const progressPercent =
    video.durationSeconds > 0
      ? Math.min(100, Math.round((positionSeconds / video.durationSeconds) * 100))
      : 0;

  // 3. Timestamps from description
  const timestamps = parseTimestampsFromDescription(video.description);

  // 4. Up Next videos (from same chapter or same class level)
  const upNextRows = await d
    .select({
      id: schema.youtubeVideos.id,
      title: schema.youtubeVideos.title,
      durationSeconds: schema.youtubeVideos.durationSeconds,
      thumbnailUrl: schema.youtubeVideos.thumbnailUrl,
    })
    .from(schema.youtubeVideos)
    .where(
      and(
        video.chapterId
          ? eq(schema.youtubeVideos.chapterId, video.chapterId)
          : eq(schema.youtubeVideos.isPublished, true),
        sql`${schema.youtubeVideos.id} != ${lectureId}`,
        eq(schema.youtubeVideos.isPublished, true)
      )
    )
    .limit(5);

  const upNext = upNextRows.map((item) => ({
    id: item.id,
    title: item.title,
    durationFormatted: formatDuration(item.durationSeconds),
    thumbnailUrl: item.thumbnailUrl,
    isCompleted: false,
    route: `/lecture/${item.id}`,
  }));

  // 5. Notes for this chapter or video
  let notes: { id: string; title: string; type: string; storageKey: string; fileUrl: string; fileSize?: string | null }[] = [];
  if (video.chapterId) {
    const rawNotes = await d
      .select({
        id: schema.resources.id,
        title: schema.resources.title,
        type: schema.resources.type,
        storageKey: schema.resources.storageKey,
      })
      .from(schema.resources)
      .where(
        and(
          eq(schema.resources.chapterId, video.chapterId),
          eq(schema.resources.visibility, "public")
        )
      )
      .limit(5);

    notes = rawNotes.map((n) => ({
      id: n.id,
      title: n.title,
      type: n.type,
      storageKey: n.storageKey,
      fileUrl: publicUrl(n.storageKey),
      fileSize: "PDF",
    }));
  }

  return {
    id: video.id,
    title: video.title,
    description: video.description || "",
    durationSeconds: video.durationSeconds,
    durationFormatted: formatDuration(video.durationSeconds),
    thumbnailUrl: video.thumbnailUrl,
    publishedAt: video.publishedAt ? video.publishedAt.toISOString() : null,
    classLevel: video.classLevel,
    subjectName: video.subjectName || "Mathematics",
    chapterId: video.chapterId,
    chapterTitle: video.chapterTitle,
    facultyName: video.facultyName || "Dinesh Singh Rajput",
    positionSeconds,
    progressPercent,
    isCompleted,
    timestamps,
    upNext,
    notes,
    shareUrl: `https://quick2learn.in/lecture/${video.id}`,
  };
}

/**
 * POST /progress
 * Accepts a batch of progress updates and upserts into content_progress.
 * Completes at >= 90% watched.
 */
export async function saveProgressBatch(
  userId: string,
  updates: ProgressUpdateItem[],
  tx?: DatabaseExecutor
): Promise<ProgressBatchResponse> {
  const d = tx || db;
  let completedCount = 0;

  for (const update of updates) {
    const itemType = update.itemType || "youtube_video";
    const duration = Math.max(0, update.durationSeconds);
    const position = Math.max(0, update.positionSeconds);

    // Lecture complete at 90% watched
    const isCompleted = duration > 0 && position / duration >= 0.9;
    if (isCompleted) {
      completedCount++;
    }

    const now = new Date();

    await d
      .insert(schema.contentProgress)
      .values({
        userId,
        itemType,
        itemId: update.itemId,
        positionSeconds: position,
        durationSeconds: duration,
        completedAt: isCompleted ? now : null,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: [
          schema.contentProgress.userId,
          schema.contentProgress.itemType,
          schema.contentProgress.itemId,
        ],
        set: {
          positionSeconds: position,
          durationSeconds: duration,
          completedAt: isCompleted
            ? sql`coalesce(${schema.contentProgress.completedAt}, now())`
            : schema.contentProgress.completedAt,
          updatedAt: now,
        },
      });

    // Also record view in lectureViews if youtube video
    if (itemType === "youtube_video") {
      await d
        .insert(schema.lectureViews)
        .values({
          userId,
          videoId: update.itemId,
          viewedAt: now,
        })
        .catch(() => {});
    }
  }

  return {
    success: true,
    syncedCount: updates.length,
    completedCount,
  };
}

/**
 * GET /resources/free
 * Returns public notes, formula sheets, and chapter resources.
 */
export async function getFreeResources(
  filters?: { classLevel?: number; subjectSlug?: string },
  tx?: DatabaseExecutor
): Promise<FreeResourcesResponse> {
  const d = tx || db;

  const conditions = [eq(schema.resources.visibility, "public")];

  if (filters?.classLevel) {
    conditions.push(eq(schema.chapters.classLevel, filters.classLevel));
  }

  const query = d
    .select({
      id: schema.resources.id,
      title: schema.resources.title,
      type: schema.resources.type,
      storageKey: schema.resources.storageKey,
      classLevel: schema.chapters.classLevel,
      subjectName: schema.subjects.name,
      chapterTitle: schema.chapters.title,
      createdAt: schema.resources.createdAt,
    })
    .from(schema.resources)
    .leftJoin(schema.chapters, eq(schema.resources.chapterId, schema.chapters.id))
    .leftJoin(schema.subjects, eq(schema.chapters.subjectId, schema.subjects.id))
    .where(and(...conditions))
    .orderBy(desc(schema.resources.createdAt))
    .limit(50);

  const raw = await query;
  const resources = raw.map((r) => ({
    id: r.id,
    title: r.title,
    type: r.type,
    classLevel: r.classLevel,
    subjectName: r.subjectName,
    chapterTitle: r.chapterTitle,
    fileUrl: publicUrl(r.storageKey),
    createdAt: r.createdAt.toISOString(),
  }));

  return { resources };
}

/**
 * GET /search?q=&class=&subject=&type=
 * Reuses full-text search and returns categorized results (Lectures, Chapters, Notes).
 */
export async function searchLibrary(
  query: string,
  filters?: { classLevel?: number; subjectSlug?: string; type?: string },
  tx?: DatabaseExecutor
): Promise<LibrarySearchResponse> {
  const d = tx || db;
  const cleanQ = query.trim();

  if (!cleanQ) {
    return { query: "", total: 0, lectures: [], chapters: [], notes: [] };
  }

  // Reuse existing catalog search
  const result = await searchCatalog(cleanQ, d);

  let rawLectures = result.lectures || [];

  if (filters?.classLevel) {
    rawLectures = rawLectures.filter(
      (lec) => !lec.classLevel || lec.classLevel === filters.classLevel
    );
  }

  const lectures = rawLectures.map((lec) => ({
    id: lec.id,
    title: lec.title,
    durationFormatted: formatDuration(lec.durationSeconds),
    thumbnailUrl: lec.thumbnailUrl,
    chapterTitle: null,
    subjectName: "Mathematics",
    classLevel: lec.classLevel,
    route: `/lecture/${lec.id}`,
  }));

  // Fetch matching chapters respecting filters
  const chapterConditions = [
    or(
      sql`${schema.chapters.fts} @@ plainto_tsquery('simple', ${cleanQ})`,
      sql`"chapters"."title" ILIKE ${`%${cleanQ}%`}`,
      sql`"subjects"."name" ILIKE ${`%${cleanQ}%`}`
    ),
  ];

  if (filters?.classLevel) {
    chapterConditions.push(eq(schema.chapters.classLevel, filters.classLevel));
  }
  if (filters?.subjectSlug) {
    chapterConditions.push(eq(schema.subjects.slug, filters.subjectSlug));
  }

  const rawChapters = await d
    .select({
      id: schema.chapters.id,
      title: schema.chapters.title,
      number: schema.chapters.number,
      classLevel: schema.chapters.classLevel,
      subjectName: schema.subjects.name,
    })
    .from(schema.chapters)
    .leftJoin(schema.subjects, eq(schema.chapters.subjectId, schema.subjects.id))
    .where(and(...chapterConditions))
    .limit(10);

  const chapters = rawChapters.map((ch) => ({
    id: ch.id,
    title: ch.title,
    number: ch.number,
    classLevel: ch.classLevel,
    subjectName: ch.subjectName,
    lectureCount: 6,
    route: `/chapter/${ch.id}`,
  }));

  // Fetch matching public resources
  const conditions = [
    eq(schema.resources.visibility, "public"),
    sql`"resources"."title" ILIKE ${`%${cleanQ}%`}`,
  ];

  if (filters?.classLevel) {
    conditions.push(eq(schema.chapters.classLevel, filters.classLevel));
  }

  const rawNotes = await d
    .select({
      id: schema.resources.id,
      title: schema.resources.title,
      type: schema.resources.type,
      storageKey: schema.resources.storageKey,
      chapterTitle: schema.chapters.title,
      subjectName: schema.subjects.name,
    })
    .from(schema.resources)
    .leftJoin(schema.chapters, eq(schema.resources.chapterId, schema.chapters.id))
    .leftJoin(schema.subjects, eq(schema.chapters.subjectId, schema.subjects.id))
    .where(and(...conditions))
    .limit(10);

  const notes = rawNotes.map((n) => ({
    id: n.id,
    title: n.title,
    type: n.type,
    chapterTitle: n.chapterTitle,
    subjectName: n.subjectName,
    fileUrl: publicUrl(n.storageKey),
  }));

  const total = lectures.length + chapters.length + notes.length;

  return {
    query: cleanQ,
    total,
    lectures,
    chapters,
    notes,
  };
}
