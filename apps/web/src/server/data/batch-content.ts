import {
  db,
  schema,
  eq,
  and,
  desc,
  asc,
  inArray,
  sql,
  type DatabaseExecutor,
} from "@quick2learn/db";
import {
  assert,
  isStaff,
  ForbiddenError,
  NotFoundError,
  type AuthUser,
} from "../authz";
import { presignedGet, deleteObject } from "../storage";
import type {
  BatchContentResponse,
  BatchChapterContentResponse,
  BatchContentItem,
  BatchContentChapter,
  BatchContentSubject,
  BatchChapterContentSection,
  ContentFileUrlResponse,
} from "@quick2learn/shared";

/**
 * Format raw bytes into human-readable MB / KB string
 */
export function formatFileSize(bytes?: number | null): string | undefined {
  if (!bytes || bytes <= 0) return undefined;
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Clean filenames into readable study material titles:
 * e.g. "EX 4(A).pdf" -> "Exercise 4(A)"
 *      "WS 2.pdf" -> "Worksheet 2"
 *      "Ch-3 Formulae.pdf" -> "Chapter 3 Formulae"
 */
export function cleanFilenameTitle(filename: string): string {
  // Strip extension
  let name = filename.replace(/\.[a-zA-Z0-9]+$/, "").trim();

  // Replace hyphens and underscores with spaces first so word boundaries work
  name = name.replace(/[-_]+/g, " ");

  // "EX 4(A)" or "Ex 4A" -> "Exercise 4(A)"
  name = name.replace(/\b(?:ex|exercise)\.?\s*(\d+(?:\.\d+)?)\s*(?:\(([a-zA-Z])\)|\b([a-zA-Z])\b(?!\w))/i, (_, ch, sec1, sec2) => {
    const sec = (sec1 || sec2).toUpperCase();
    return `Exercise ${ch}(${sec})`;
  });

  // "EX 4" or "ex 10.2" -> "Exercise 10.2"
  name = name.replace(/\b(?:ex|exercise)\.?\s*(\d+(?:\.\d+)?)\b/i, "Exercise $1");

  // "WS 2" or "Worksheet 2" -> "Worksheet 2"
  name = name.replace(/\b(?:ws|worksheet)\.?\s*(\d+(?:\.\d+)?)\b/i, "Worksheet $1");

  // "Ch 04" or "Chapter 04" -> "Ch 4" / "Chapter 4"
  name = name.replace(/\b(?:ch|chap)\.?\s*(\d+)\b/i, (_, num) => `Ch ${parseInt(num, 10)}`);
  name = name.replace(/\bchapter\.?\s*(\d+)\b/i, (_, num) => `Chapter ${parseInt(num, 10)}`);

  // "PYQ 2024" -> "Previous Year Questions 2024"
  name = name.replace(/\bpyq\b/i, "Previous Year Questions");

  // Title case words, preserving segments like "4(A)"
  name = name
    .split(" ")
    .filter(Boolean)
    .map((word) => {
      if (/^[0-9()]+$/.test(word)) return word;
      if (/^[0-9]+(?:\.[0-9]+)?\([A-Z]\)$/i.test(word)) return word.toUpperCase();
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");

  // Collapse multiple spaces
  name = name.replace(/\s+/g, " ").trim();

  return name || filename;
}

/**
 * GET /batches/:id/content
 * Returns batch subjects -> chapters with lecture/notes counts and student progress
 */
export async function getBatchContent(
  userId: string | null,
  batchIdOrSlug: string,
  tx?: DatabaseExecutor
): Promise<BatchContentResponse> {
  const d = tx || db;

  // 1. Resolve batch
  const isUuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(batchIdOrSlug);
  const [batch] = await d
    .select()
    .from(schema.batches)
    .where(isUuid ? eq(schema.batches.id, batchIdOrSlug) : eq(schema.batches.slug, batchIdOrSlug))
    .limit(1);

  if (!batch) {
    throw new NotFoundError("Batch not found");
  }

  // 2. Resolve subjects relevant to this batch:
  // - Batch primary subject
  // - Subjects linked through batch_faculty or timetable
  // - Or all subjects for batch's class level
  const allSubjects = await d.select().from(schema.subjects).orderBy(asc(schema.subjects.name));
  let relevantSubjects = batch.subjectId ? allSubjects.filter((s) => s.id === batch.subjectId) : allSubjects;

  if (relevantSubjects.length === 0) {
    relevantSubjects = allSubjects;
  }

  // 3. Resolve chapters linked to this batch:
  // - Via batch_chapter_links table
  const chapterLinks = await d
    .select()
    .from(schema.batchChapterLinks)
    .where(eq(schema.batchChapterLinks.batchId, batch.id));
  const linkedChapterIds = new Set(chapterLinks.map((l) => l.chapterId));

  // - Via content_items directly uploaded to this batch
  const batchItems = await d
    .select({
      id: schema.contentItems.id,
      chapterId: schema.contentItems.chapterId,
      subjectId: schema.contentItems.subjectId,
      kind: schema.contentItems.kind,
      youtubeVideoId: schema.contentItems.youtubeVideoId,
    })
    .from(schema.contentItems)
    .where(
      and(
        eq(schema.contentItems.batchId, batch.id),
        eq(schema.contentItems.isPublished, true)
      )
    );

  for (const item of batchItems) {
    linkedChapterIds.add(item.chapterId);
  }

  // Query all chapters for relevant subjects
  const subjectIds = relevantSubjects.map((s) => s.id);
  const chaptersQuery = await d
    .select()
    .from(schema.chapters)
    .where(
      and(
        inArray(schema.chapters.subjectId, subjectIds),
        batch.classLevel ? eq(schema.chapters.classLevel, batch.classLevel) : sql`1=1`
      )
    )
    .orderBy(asc(schema.chapters.number), asc(schema.chapters.title));

  // Filter chapters to those either explicitly linked or part of the curriculum
  const chapters = chaptersQuery.filter(
    (c) => linkedChapterIds.has(c.id) || linkedChapterIds.size === 0 || c.subjectId === batch.subjectId
  );

  // 4. Also fetch YouTube library videos for these chapters to account for public linked videos
  const chapterIds = chapters.map((c) => c.id);
  let publicVideos: Array<{ id: string; chapterId: string }> = [];
  if (chapterIds.length > 0) {
    const rawPub = await d
      .select({
        id: schema.youtubeVideos.id,
        chapterId: schema.youtubeVideos.chapterId,
      })
      .from(schema.youtubeVideos)
      .where(
        and(
          inArray(schema.youtubeVideos.chapterId, chapterIds),
          eq(schema.youtubeVideos.isPublished, true)
        )
      );

    publicVideos = rawPub.filter((v): v is { id: string; chapterId: string } => Boolean(v.chapterId));
  }

  // 5. Progress query for the user
  const userProgressMap = new Map<string, boolean>();
  if (userId) {
    const progressRows = await d
      .select()
      .from(schema.contentProgress)
      .where(eq(schema.contentProgress.userId, userId));

    for (const pr of progressRows) {
      const isComplete =
        Boolean(pr.completedAt) ||
        (pr.durationSeconds > 0 && pr.positionSeconds / pr.durationSeconds >= 0.9);
      if (isComplete) {
        userProgressMap.set(pr.itemId, true);
      }
    }
  }

  // 6. Build subject -> chapter hierarchy with counts & progress
  const subjectsOutput: BatchContentSubject[] = [];

  for (const sub of relevantSubjects) {
    const subChapters = chapters.filter((c) => c.subjectId === sub.id);
    if (subChapters.length === 0) continue;

    const chapterList: BatchContentChapter[] = subChapters.map((ch) => {
      // Direct items for this chapter
      const chapterContentItems = batchItems.filter((i) => i.chapterId === ch.id);
      const directLectures = chapterContentItems.filter(
        (i) => i.kind === "youtube" || i.kind === "video_hosted"
      );
      const directNotes = chapterContentItems.filter(
        (i) => i.kind === "pdf" || i.kind === "link"
      );

      // Public synced youtube lectures for this chapter
      const chPublicVideos = publicVideos.filter((v) => v.chapterId === ch.id);
      // Avoid duplicate counting if content_items already references the youtube_video_id
      const directYoutubeIds = new Set(
        directLectures.map((l) => l.youtubeVideoId).filter(Boolean)
      );
      const additionalPublicVideos = chPublicVideos.filter(
        (v) => !directYoutubeIds.has(v.id)
      );

      const lecturesCount = directLectures.length + additionalPublicVideos.length;
      const notesCount = directNotes.length;
      const totalItems = lecturesCount + notesCount;

      // Count completed items
      let completedCount = 0;
      for (const item of chapterContentItems) {
        if (
          userProgressMap.get(item.id) ||
          (item.youtubeVideoId && userProgressMap.get(item.youtubeVideoId))
        ) {
          completedCount++;
        }
      }
      for (const vid of additionalPublicVideos) {
        if (userProgressMap.get(vid.id)) {
          completedCount++;
        }
      }

      const progress = totalItems > 0 ? Math.round((completedCount / totalItems) * 100) : 0;
      const completed = totalItems > 0 && completedCount >= totalItems;

      return {
        id: ch.id,
        title: ch.title,
        slug: ch.slug,
        chapterNumber: ch.number || undefined,
        lecturesCount,
        notesCount,
        progress: Math.min(100, Math.max(0, progress)),
        completed,
      };
    });

    subjectsOutput.push({
      id: sub.id,
      name: sub.name,
      slug: sub.slug,
      chapters: chapterList,
    });
  }

  return {
    batchId: batch.id,
    batchTitle: batch.title,
    subjects: subjectsOutput,
  };
}

/**
 * GET /batches/:id/chapters/:chapterId
 * Returns lectures and PDFs grouped by section, with progress and published dates
 */
export async function getBatchChapterContent(
  userId: string | null,
  batchIdOrSlug: string,
  chapterIdOrSlug: string,
  tx?: DatabaseExecutor
): Promise<BatchChapterContentResponse> {
  const d = tx || db;

  // 1. Resolve batch
  const isBatchUuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(batchIdOrSlug);
  const [batch] = await d
    .select()
    .from(schema.batches)
    .where(isBatchUuid ? eq(schema.batches.id, batchIdOrSlug) : eq(schema.batches.slug, batchIdOrSlug))
    .limit(1);

  if (!batch) {
    throw new NotFoundError("Batch not found");
  }

  // 2. Resolve chapter
  const isChapterUuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(chapterIdOrSlug);
  const [chapter] = await d
    .select()
    .from(schema.chapters)
    .where(
      isChapterUuid ? eq(schema.chapters.id, chapterIdOrSlug) : eq(schema.chapters.slug, chapterIdOrSlug)
    )
    .limit(1);

  if (!chapter) {
    throw new NotFoundError("Chapter not found");
  }

  // Subject
  const [subject] = await d
    .select()
    .from(schema.subjects)
    .where(eq(schema.subjects.id, chapter.subjectId))
    .limit(1);

  // 3. Load batch content items for this chapter
  const rawItems = await d
    .select()
    .from(schema.contentItems)
    .where(
      and(
        eq(schema.contentItems.batchId, batch.id),
        eq(schema.contentItems.chapterId, chapter.id),
        eq(schema.contentItems.isPublished, true)
      )
    )
    .orderBy(asc(schema.contentItems.sortOrder), asc(schema.contentItems.publishedAt));

  // 4. Also check if chapter has public library videos that should be merged
  const publicVideos = await d
    .select()
    .from(schema.youtubeVideos)
    .where(
      and(
        eq(schema.youtubeVideos.chapterId, chapter.id),
        eq(schema.youtubeVideos.isPublished, true)
      )
    )
    .orderBy(desc(schema.youtubeVideos.publishedAt));

  // 5. Query user progress
  const userProgressMap = new Map<string, { completed: boolean; watched: boolean }>();
  if (userId) {
    const progressRows = await d
      .select()
      .from(schema.contentProgress)
      .where(eq(schema.contentProgress.userId, userId));

    for (const pr of progressRows) {
      const isComplete =
        Boolean(pr.completedAt) ||
        (pr.durationSeconds > 0 && pr.positionSeconds / pr.durationSeconds >= 0.9);
      const isWatched = isComplete || pr.positionSeconds > 10;
      userProgressMap.set(pr.itemId, { completed: isComplete, watched: isWatched });
    }
  }

  const now = Date.now();
  const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

  // Format content items
  const lectures: BatchContentItem[] = [];
  const notes: BatchContentItem[] = [];
  const existingYoutubeIds = new Set<string>();

  for (const item of rawItems) {
    const publishedTimestamp = item.publishedAt ? new Date(item.publishedAt).getTime() : now;
    const isNew = now - publishedTimestamp < SEVEN_DAYS_MS;
    const prog =
      userProgressMap.get(item.id) ||
      (item.youtubeVideoId ? userProgressMap.get(item.youtubeVideoId) : undefined);

    const dto: BatchContentItem = {
      id: item.id,
      batchId: item.batchId,
      subjectId: item.subjectId,
      chapterId: item.chapterId,
      section: item.section || (item.kind === "pdf" ? "Class Notes" : "Lectures"),
      title: item.title,
      kind: item.kind as any,
      youtubeVideoId: item.youtubeVideoId,
      storageKey: item.storageKey,
      url: item.url,
      sizeBytes: item.sizeBytes,
      sizeFormatted: formatFileSize(item.sizeBytes),
      pageCount: item.pageCount,
      sortOrder: item.sortOrder,
      isPublished: item.isPublished,
      publishedAt: item.publishedAt.toISOString(),
      publishedAtFormatted: new Date(item.publishedAt).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
      isWatched: prog?.watched || false,
      isCompleted: prog?.completed || false,
      isNew,
    };

    if (item.kind === "youtube" || item.kind === "video_hosted") {
      lectures.push(dto);
      if (item.youtubeVideoId) {
        existingYoutubeIds.add(item.youtubeVideoId);
      }
    } else {
      notes.push(dto);
    }
  }

  // Include public YouTube videos if not already added to batch content items
  for (const vid of publicVideos) {
    if (existingYoutubeIds.has(vid.id)) continue;

    const publishedTimestamp = vid.publishedAt ? new Date(vid.publishedAt).getTime() : now;
    const isNew = now - publishedTimestamp < SEVEN_DAYS_MS;
    const prog = userProgressMap.get(vid.id);

    const pubDate = vid.publishedAt ? new Date(vid.publishedAt) : new Date();

    lectures.push({
      id: `yt-${vid.id}`,
      batchId: batch.id,
      subjectId: chapter.subjectId,
      chapterId: chapter.id,
      section: "Lectures",
      title: vid.title,
      kind: "youtube",
      youtubeVideoId: vid.id,
      storageKey: null,
      url: `https://www.youtube.com/watch?v=${vid.id}`,
      sizeBytes: null,
      sizeFormatted: undefined,
      pageCount: null,
      sortOrder: lectures.length,
      isPublished: vid.isPublished,
      publishedAt: pubDate.toISOString(),
      publishedAtFormatted: pubDate.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
      isWatched: prog?.watched || false,
      isCompleted: prog?.completed || false,
      isNew,
    });
  }

  // Group notes by section (e.g. "Selina Solutions", "Class notes", "Formula Sheet")
  const sectionMap = new Map<string, BatchContentItem[]>();
  for (const note of notes) {
    const secName = note.section || "Class Notes";
    if (!sectionMap.has(secName)) {
      sectionMap.set(secName, []);
    }
    sectionMap.get(secName)!.push(note);
  }

  const sections: BatchChapterContentSection[] = Array.from(sectionMap.entries()).map(
    ([section, items]) => ({
      section,
      items,
    })
  );

  return {
    batchId: batch.id,
    batchTitle: batch.title,
    subjectId: subject?.id || chapter.subjectId,
    subjectName: subject?.name || "Subject",
    chapterId: chapter.id,
    chapterTitle: chapter.title,
    lectures,
    notes,
    sections,
  };
}

/**
 * GET /content/:id/file
 * Generates a 15-minute presigned URL for a PDF, only after confirming active enrollment.
 * Non-enrolled students receive a 403 Forbidden.
 */
export async function getContentPresignedFileUrl(
  user: AuthUser,
  contentItemId: string,
  tx?: DatabaseExecutor
): Promise<ContentFileUrlResponse> {
  const d = tx || db;

  // 1. Fetch content item
  const [item] = await d
    .select()
    .from(schema.contentItems)
    .where(eq(schema.contentItems.id, contentItemId))
    .limit(1);

  if (!item) {
    throw new NotFoundError("Study material item not found");
  }

  if (!item.storageKey) {
    throw new NotFoundError("File not available for this content item");
  }

  // 2. Data Layer Authorization:
  // - Admin & Teacher: Full access
  // - Student: Must be actively enrolled in the batch
  if (!isStaff(user)) {
    const [enrollment] = await d
      .select()
      .from(schema.enrollments)
      .where(
        and(
          eq(schema.enrollments.studentId, user.id),
          eq(schema.enrollments.batchId, item.batchId),
          eq(schema.enrollments.status, "active")
        )
      )
      .limit(1);

    if (!enrollment) {
      throw new ForbiddenError(
        "Active enrollment required to access batch study materials and offline PDFs."
      );
    }
  }

  // 3. Generate 15-minute (900 seconds) presigned GET URL
  const url = await presignedGet(item.storageKey, 900);

  return {
    id: item.id,
    title: item.title,
    url,
    expiresInSeconds: 900,
  };
}

/**
 * ADMIN: Link a public curriculum chapter to a batch
 */
export async function linkChapterToBatch(
  user: AuthUser,
  batchId: string,
  chapterId: string,
  tx?: DatabaseExecutor
) {
  assert(isStaff(user), "Only institute staff can link batch chapters.");
  const d = tx || db;

  await d
    .insert(schema.batchChapterLinks)
    .values({
      batchId,
      chapterId,
    })
    .onConflictDoNothing();

  return { success: true };
}

/**
 * ADMIN: Unlink a chapter from a batch
 */
export async function unlinkChapterFromBatch(
  user: AuthUser,
  batchId: string,
  chapterId: string,
  tx?: DatabaseExecutor
) {
  assert(isStaff(user), "Only institute staff can unlink batch chapters.");
  const d = tx || db;

  await d
    .delete(schema.batchChapterLinks)
    .where(
      and(
        eq(schema.batchChapterLinks.batchId, batchId),
        eq(schema.batchChapterLinks.chapterId, chapterId)
      )
    );

  return { success: true };
}

/**
 * ADMIN: Create single content item (lecture, PDF, or link)
 */
export async function createBatchContentItem(
  user: AuthUser,
  data: {
    batchId: string;
    subjectId: string;
    chapterId: string;
    section?: string | null;
    title: string;
    kind: "youtube" | "pdf" | "link" | "video_hosted";
    youtubeVideoId?: string | null;
    storageKey?: string | null;
    url?: string | null;
    sizeBytes?: number | null;
    pageCount?: number | null;
    sortOrder?: number;
    isPublished?: boolean;
    notifyBatch?: boolean;
  },
  tx?: DatabaseExecutor
) {
  assert(isStaff(user), "Only institute staff can add batch content.");
  const d = tx || db;

  const [created] = await d
    .insert(schema.contentItems)
    .values({
      batchId: data.batchId,
      subjectId: data.subjectId,
      chapterId: data.chapterId,
      section: data.section || (data.kind === "pdf" ? "Class Notes" : "Lectures"),
      title: data.title,
      kind: data.kind,
      youtubeVideoId: data.youtubeVideoId || null,
      storageKey: data.storageKey || null,
      url: data.url || null,
      sizeBytes: data.sizeBytes || null,
      pageCount: data.pageCount || null,
      sortOrder: data.sortOrder || 0,
      isPublished: data.isPublished ?? true,
      createdBy: user.id,
    })
    .returning();

  // If notifyBatch is enabled, create batch announcement
  if (data.notifyBatch && created) {
    try {
      const [chapter] = await d
        .select()
        .from(schema.chapters)
        .where(eq(schema.chapters.id, data.chapterId))
        .limit(1);

      const chapterName = chapter?.title || "Curriculum";
      const announcementTitle =
        data.kind === "pdf"
          ? `New notes: ${data.title} — ${chapterName}`
          : `New lecture: ${data.title} — ${chapterName}`;

      await d.insert(schema.announcements).values({
        title: announcementTitle,
        body: `Study material has been added for ${chapterName}. Open your batch content to view or download.`,
        audience: "batch",
        batchId: data.batchId,
        createdBy: user.id,
        notifyParents: false,
      });
    } catch (e) {
      console.warn("[createBatchContentItem] Non-fatal notification error:", e);
    }
  }

  return created;
}

/**
 * ADMIN: Bulk Upload PDFs with automatic clean titles and optional batch notification
 */
export async function bulkUploadBatchPdfs(
  user: AuthUser,
  params: {
    batchId: string;
    subjectId: string;
    chapterId: string;
    section: string;
    files: Array<{
      name: string;
      storageKey: string;
      sizeBytes?: number | null;
      pageCount?: number | null;
    }>;
    notifyBatch?: boolean;
  },
  tx?: DatabaseExecutor
) {
  assert(isStaff(user), "Only institute staff can upload batch materials.");
  const d = tx || db;

  const createdItems = [];

  for (let i = 0; i < params.files.length; i++) {
    const file = params.files[i]!;
    const cleanTitle = cleanFilenameTitle(file.name);

    const [item] = await d
      .insert(schema.contentItems)
      .values({
        batchId: params.batchId,
        subjectId: params.subjectId,
        chapterId: params.chapterId,
        section: params.section || "Class Notes",
        title: cleanTitle,
        kind: "pdf",
        storageKey: file.storageKey,
        sizeBytes: file.sizeBytes || null,
        pageCount: file.pageCount || null,
        sortOrder: i,
        isPublished: true,
        createdBy: user.id,
      })
      .returning();

    if (item) createdItems.push(item);
  }

  // Push notification / announcement if requested
  if (params.notifyBatch && createdItems.length > 0) {
    try {
      const [chapter] = await d
        .select()
        .from(schema.chapters)
        .where(eq(schema.chapters.id, params.chapterId))
        .limit(1);

      const chapterName = chapter?.title || "Curriculum";
      const firstTitle = createdItems[0]?.title || "Study Material";
      const announcementTitle =
        createdItems.length > 1
          ? `New notes: ${firstTitle} and ${createdItems.length - 1} more — ${chapterName}`
          : `New notes: ${firstTitle} — ${chapterName}`;

      await d.insert(schema.announcements).values({
        title: announcementTitle,
        body: `New study material has been added to ${chapterName}. Open your batch to download.`,
        audience: "batch",
        batchId: params.batchId,
        createdBy: user.id,
        notifyParents: false,
      });
    } catch (e) {
      console.warn("[bulkUploadBatchPdfs] Non-fatal notification error:", e);
    }
  }

  return createdItems;
}

/**
 * ADMIN: Import entire material hierarchy from old app's ZIP:
 * Subject / Chapter / Section / file.pdf
 */
export async function importBatchMaterialFromZipTree(
  user: AuthUser,
  batchId: string,
  entries: Array<{
    subjectName: string;
    chapterTitle: string;
    sectionName: string;
    fileName: string;
    storageKey: string;
    sizeBytes?: number | null;
    pageCount?: number | null;
  }>,
  tx?: DatabaseExecutor
) {
  assert(isStaff(user), "Only institute staff can import ZIP material.");
  const d = tx || db;

  const [batch] = await d.select().from(schema.batches).where(eq(schema.batches.id, batchId)).limit(1);
  if (!batch) {
    throw new NotFoundError("Batch not found");
  }

  // Cache subjects and chapters to avoid duplicate lookups
  const subjectMap = new Map<string, string>();
  const chapterMap = new Map<string, string>();

  // Pre-load all existing subjects
  const existingSubjects = await d.select().from(schema.subjects);
  for (const s of existingSubjects) {
    subjectMap.set(s.name.toLowerCase().trim(), s.id);
  }

  // Pre-load existing chapters
  const existingChapters = await d.select().from(schema.chapters);
  for (const c of existingChapters) {
    chapterMap.set(`${c.subjectId}:${c.title.toLowerCase().trim()}`, c.id);
  }

  const createdItems = [];

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i]!;
    const cleanSubj = entry.subjectName.trim();
    const cleanChap = entry.chapterTitle.trim();
    const cleanSec = entry.sectionName.trim() || "Study Notes";

    // 1. Resolve or create subject
    let subjectId = subjectMap.get(cleanSubj.toLowerCase());
    if (!subjectId) {
      const slug = cleanSubj.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      const [newSub] = await d
        .insert(schema.subjects)
        .values({
          name: cleanSubj,
          slug: `${slug}-${Date.now().toString(36)}`,
        })
        .returning();
      if (newSub) {
        subjectId = newSub.id;
        subjectMap.set(cleanSubj.toLowerCase(), newSub.id);
      }
    }

    if (!subjectId) continue;

    // 2. Resolve or create chapter
    const chapKey = `${subjectId}:${cleanChap.toLowerCase()}`;
    let chapterId = chapterMap.get(chapKey);
    if (!chapterId) {
      const slug = cleanChap.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      const [newChap] = await d
        .insert(schema.chapters)
        .values({
          subjectId,
          title: cleanChap,
          slug: `${slug}-${Date.now().toString(36)}`,
          classLevel: batch.classLevel || 10,
          board: (batch.board as any) || "icse",
          number: i + 1,
        })
        .returning();
      if (newChap) {
        chapterId = newChap.id;
        chapterMap.set(chapKey, newChap.id);
      }
    }

    if (!chapterId) continue;

    // Link chapter to batch if not already linked
    await d
      .insert(schema.batchChapterLinks)
      .values({
        batchId: batch.id,
        chapterId,
      })
      .onConflictDoNothing();

    // 3. Create content_item
    const cleanTitle = cleanFilenameTitle(entry.fileName);

    const [item] = await d
      .insert(schema.contentItems)
      .values({
        batchId: batch.id,
        subjectId,
        chapterId,
        section: cleanSec,
        title: cleanTitle,
        kind: "pdf",
        storageKey: entry.storageKey,
        sizeBytes: entry.sizeBytes || null,
        pageCount: entry.pageCount || null,
        sortOrder: i,
        isPublished: true,
        createdBy: user.id,
      })
      .returning();

    if (item) createdItems.push(item);
  }

  return {
    success: true,
    importedCount: createdItems.length,
    items: createdItems,
  };
}

/**
 * ADMIN: Delete content item
 */
export async function deleteBatchContentItem(
  user: AuthUser,
  contentItemId: string,
  tx?: DatabaseExecutor
) {
  assert(isStaff(user), "Only institute staff can delete batch content.");
  const d = tx || db;

  const [deleted] = await d
    .delete(schema.contentItems)
    .where(eq(schema.contentItems.id, contentItemId))
    .returning();

  if (deleted && deleted.storageKey) {
    try {
      await deleteObject(deleted.storageKey);
    } catch (e) {
      console.warn("[deleteBatchContentItem] Non-fatal S3 delete error:", e);
    }
  }

  return { success: true, deleted };
}

/**
 * ADMIN: Reorder content items
 */
export async function reorderBatchContentItems(
  user: AuthUser,
  batchId: string,
  itemIds: string[],
  tx?: DatabaseExecutor
) {
  assert(isStaff(user), "Only institute staff can reorder batch content.");
  const d = tx || db;

  for (let i = 0; i < itemIds.length; i++) {
    const id = itemIds[i]!;
    await d
      .update(schema.contentItems)
      .set({ sortOrder: i })
      .where(
        and(eq(schema.contentItems.id, id), eq(schema.contentItems.batchId, batchId))
      );
  }

  return { success: true };
}
