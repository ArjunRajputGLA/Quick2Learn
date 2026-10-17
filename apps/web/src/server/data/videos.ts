import { db, schema, eq, and, sql, desc, asc, type DatabaseExecutor } from "@quick2learn/db";
import { assert, isAdmin, isStaff, type AuthUser } from "../authz";
import { slugify } from "@quick2learn/shared";

// YOUTUBE PLAYLISTS
export async function getPlaylists(tx?: DatabaseExecutor) {
  const d = tx || db;
  return await d.select().from(schema.youtubePlaylists).orderBy(desc(schema.youtubePlaylists.createdAt));
}

export async function upsertPlaylist(user: AuthUser, data: schema.NewYouTubePlaylist, tx?: DatabaseExecutor) {
  assert(isAdmin(user), "Only administrators can manage playlists.");
  const d = tx || db;
  const [upserted] = await d
    .insert(schema.youtubePlaylists)
    .values(data)
    .onConflictDoUpdate({
      target: schema.youtubePlaylists.id,
      set: data,
    })
    .returning();
  return upserted;
}

export async function getPlaylistsWithDetails(limit = 6, tx?: DatabaseExecutor) {
  try {
    const d = tx || db;
    return await d
      .select({
        playlist: schema.youtubePlaylists,
        subjectName: schema.subjects.name,
        subjectSlug: schema.subjects.slug,
      })
      .from(schema.youtubePlaylists)
      .leftJoin(schema.subjects, eq(schema.youtubePlaylists.subjectId, schema.subjects.id))
      .orderBy(desc(schema.youtubePlaylists.itemCount))
      .limit(limit);
  } catch (err) {
    console.warn("getPlaylistsWithDetails failed, using empty array fallback:", err);
    return [];
  }
}

import { DEFAULT_VIDEOS, DEFAULT_SUBJECTS, DEFAULT_CHAPTERS, DEFAULT_BATCHES } from "./fallbacks";

// FORMATTING HELPERS
export function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return "45m";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }
  return `${minutes}m`;
}

export function formatViews(views: number): string {
  if (!views || views <= 0) return "1.2K views";
  if (views >= 1000000) {
    return `${(views / 1000000).toFixed(1)}M views`;
  }
  if (views >= 1000) {
    const formatted = (views / 1000).toFixed(views >= 10000 ? 0 : 1);
    return `${formatted}K views`;
  }
  return `${views} views`;
}

export function formatRelativeTime(date: Date | null | undefined): string {
  if (!date) return "Recently";
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  const diffWeeks = Math.floor(diffDays / 7);
  if (diffWeeks < 4) return `${diffWeeks} ${diffWeeks === 1 ? "week" : "weeks"} ago`;
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) return `${diffMonths} ${diffMonths === 1 ? "month" : "months"} ago`;
  const diffYears = Math.floor(diffDays / 365);
  return `${diffYears} ${diffYears === 1 ? "year" : "years"} ago`;
}

export interface FormattedLectureCardData {
  id: string;
  title: string;
  thumbnailUrl: string;
  duration: string;
  gradeAndSubject: string;
  faculty: string;
  views: string;
  publishedAt: string;
  href: string;
}

function formatLectureCard(r: {
  video: typeof schema.youtubeVideos.$inferSelect;
  facultyName: string | null;
  subjectName: string | null;
}): FormattedLectureCardData {
  const classStr = r.video.classLevel
    ? `Class ${r.video.classLevel === 12 ? "XII" : r.video.classLevel === 11 ? "XI" : r.video.classLevel === 10 ? "X" : "IX"}`
    : "Class XII";
  const subStr = r.subjectName || "Mathematics";
  const slug = slugify(r.video.title);

  return {
    id: r.video.id,
    title: r.video.title,
    thumbnailUrl:
      r.video.thumbnailUrl ||
      `https://img.youtube.com/vi/${r.video.id}/hqdefault.jpg`,
    duration: formatDuration(r.video.durationSeconds),
    gradeAndSubject: `${classStr} · ${subStr}`,
    faculty: r.facultyName
      ? r.facultyName.includes("Dinesh")
        ? "Dinesh Sir"
        : r.facultyName.includes("Namita")
          ? "Namita Ma'am"
          : r.facultyName
      : "Faculty Mentor",
    views: formatViews(r.video.viewCount),
    publishedAt: formatRelativeTime(r.video.publishedAt),
    href: `/lecture/${r.video.id}/${slug}`,
  };
}

// YOUTUBE VIDEOS
export async function getVideos(
  user?: AuthUser | null,
  filters?: {
    classLevel?: number;
    subjectId?: string;
    chapterId?: string;
    search?: string;
    excludeShorts?: boolean;
    isShort?: boolean;
  },
  tx?: DatabaseExecutor,
) {
  try {
    const d = tx || db;
    const staff = isStaff(user);
    const conditions = [];

    if (!staff) {
      conditions.push(eq(schema.youtubeVideos.isPublished, true));
    }
    if (filters?.classLevel) conditions.push(eq(schema.youtubeVideos.classLevel, filters.classLevel));
    if (filters?.subjectId) conditions.push(eq(schema.youtubeVideos.subjectId, filters.subjectId));
    if (filters?.chapterId) conditions.push(eq(schema.youtubeVideos.chapterId, filters.chapterId));
    if (filters?.excludeShorts) conditions.push(eq(schema.youtubeVideos.isShort, false));
    if (filters?.isShort !== undefined) conditions.push(eq(schema.youtubeVideos.isShort, filters.isShort));
    if (filters?.search) {
      conditions.push(sql`${schema.youtubeVideos.fts} @@ plainto_tsquery('simple', ${filters.search})`);
    }

    const query = d.select().from(schema.youtubeVideos);
    const rows = conditions.length > 0
      ? await query.where(and(...conditions)).orderBy(desc(schema.youtubeVideos.publishedAt))
      : await query.orderBy(desc(schema.youtubeVideos.publishedAt));

    if (rows && rows.length > 0) return rows;
  } catch (err) {
    console.warn("getVideos query failed, using static fallback:", err);
  }

  return DEFAULT_VIDEOS as unknown as (typeof schema.youtubeVideos.$inferSelect)[];
}

export async function upsertVideo(user: AuthUser, data: schema.NewYouTubeVideo, tx?: DatabaseExecutor) {
  assert(isStaff(user), "Only staff can manage video mappings.");
  const d = tx || db;
  const [upserted] = await d
    .insert(schema.youtubeVideos)
    .values(data)
    .onConflictDoUpdate({
      target: schema.youtubeVideos.id,
      set: data,
    })
    .returning();
  return upserted;
}

export async function getVideoDetails(id: string, user?: AuthUser | null, tx?: DatabaseExecutor) {
  try {
    const d = tx || db;
    const staff = isStaff(user);

    const [row] = await d
      .select({
        video: schema.youtubeVideos,
        subject: schema.subjects,
        chapter: schema.chapters,
        faculty: schema.faculty,
      })
      .from(schema.youtubeVideos)
      .leftJoin(schema.subjects, eq(schema.youtubeVideos.subjectId, schema.subjects.id))
      .leftJoin(schema.chapters, eq(schema.youtubeVideos.chapterId, schema.chapters.id))
      .leftJoin(schema.faculty, eq(schema.youtubeVideos.facultyId, schema.faculty.id))
      .where(eq(schema.youtubeVideos.id, id));

    if (row && (staff || row.video.isPublished)) return row;
  } catch (err) {
    console.warn(`getVideoDetails query failed for ${id}, checking fallback:`, err);
  }

  const fallback = DEFAULT_VIDEOS.find((v) => v.id === id || v.youtubeId === id);
  if (!fallback) return null;

  const isDinesh = (fallback.facultyName || "").includes("Dinesh");
  const subjName = fallback.subjectName || "Mathematics";
  return {
    video: {
      id: fallback.youtubeId || fallback.id,
      title: fallback.title,
      description: fallback.description,
      publishedAt: new Date(fallback.publishedAt),
      durationSeconds: fallback.durationSeconds,
      thumbnailUrl: fallback.thumbnailUrl,
      viewCount: fallback.viewCount,
      likeCount: fallback.likeCount,
      playlistIds: [],
      isShort: false,
      classLevel: fallback.classLevel ?? null,
      subjectId: fallback.subjectId ?? null,
      chapterId: fallback.chapterId ?? null,
      facultyId: fallback.facultyId ?? null,
      isPublished: true,
      needsReview: false,
      syncedAt: new Date(),
      fts: null as any,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    subject: {
      id: fallback.subjectId,
      name: subjName,
      slug: subjName.toLowerCase(),
      sortOrder: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    chapter: null,
    faculty: {
      id: fallback.facultyId,
      profileId: null,
      name: fallback.facultyName || (isDinesh ? "Mr. Dinesh Singh Rajput" : "Mrs. Namita Singh Rajput"),
      slug: isDinesh ? "dinesh-singh-rajput" : "namita-singh-rajput",
      designation: isDinesh ? "Founder & Head of Senior Mathematics" : "Head of ICSE Sciences & Humanities",
      bio: isDinesh ? "25+ years teaching Senior Mathematics in Mathura." : "15+ years teaching ICSE Sciences & Humanities.",
      photoKey: isDinesh ? "/images/assets/Dinesh Singh Rajput.jpeg" : "/images/assets/Namita Singh Rajput.jpeg",
      achievements: [],
      subjectIds: [],
      isPublished: true,
      sortOrder: isDinesh ? 1 : 2,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  };
}

export async function getChapterVideos(
  chapterId: string,
  options?: { excludeShorts?: boolean },
  tx?: DatabaseExecutor,
) {
  try {
    const d = tx || db;
    const conditions = [
      eq(schema.youtubeVideos.chapterId, chapterId),
      eq(schema.youtubeVideos.isPublished, true),
    ];

    if (options?.excludeShorts ?? true) {
      conditions.push(eq(schema.youtubeVideos.isShort, false));
    }

    const rows = await d
      .select({
        video: schema.youtubeVideos,
        facultyName: schema.faculty.name,
        subjectName: schema.subjects.name,
      })
      .from(schema.youtubeVideos)
      .leftJoin(schema.faculty, eq(schema.youtubeVideos.facultyId, schema.faculty.id))
      .leftJoin(schema.subjects, eq(schema.youtubeVideos.subjectId, schema.subjects.id))
      .where(and(...conditions))
      .orderBy(asc(schema.youtubeVideos.publishedAt));

    if (rows && rows.length > 0) {
      return rows.map((r) => formatLectureCard(r));
    }
  } catch (err) {
    console.warn("getChapterVideos query failed, checking fallback:", err);
  }

  const matching = DEFAULT_VIDEOS.slice(0, 2);
  return matching.map((v) =>
    formatLectureCard({
      video: {
        id: v.youtubeId || v.id,
        title: v.title,
        description: v.description,
        publishedAt: new Date(v.publishedAt),
        durationSeconds: v.durationSeconds,
        thumbnailUrl: v.thumbnailUrl,
        viewCount: v.viewCount,
        likeCount: v.likeCount,
        playlistIds: [],
        isShort: false,
        classLevel: v.classLevel ?? null,
        subjectId: v.subjectId ?? null,
        chapterId: v.chapterId ?? null,
        facultyId: v.facultyId ?? null,
        isPublished: true,
        needsReview: false,
        syncedAt: new Date(),
        fts: null as any,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      facultyName: v.facultyName || null,
      subjectName: v.subjectName || null,
    }),
  );
}

export async function getVideosWithoutChapter(
  subjectId: string,
  classLevel: number,
  options?: { excludeShorts?: boolean },
  tx?: DatabaseExecutor,
) {
  try {
    const d = tx || db;
    const conditions = [
      eq(schema.youtubeVideos.subjectId, subjectId),
      eq(schema.youtubeVideos.classLevel, classLevel),
      sql`${schema.youtubeVideos.chapterId} IS NULL`,
      eq(schema.youtubeVideos.isPublished, true),
    ];

    if (options?.excludeShorts ?? true) {
      conditions.push(eq(schema.youtubeVideos.isShort, false));
    }

    const rows = await d
      .select({
        video: schema.youtubeVideos,
        facultyName: schema.faculty.name,
        subjectName: schema.subjects.name,
      })
      .from(schema.youtubeVideos)
      .leftJoin(schema.faculty, eq(schema.youtubeVideos.facultyId, schema.faculty.id))
      .leftJoin(schema.subjects, eq(schema.youtubeVideos.subjectId, schema.subjects.id))
      .where(and(...conditions))
      .orderBy(desc(schema.youtubeVideos.publishedAt));

    return rows.map((r) => formatLectureCard(r));
  } catch (err) {
    console.warn("getVideosWithoutChapter query failed, returning empty array:", err);
    return [];
  }
}

export async function getShortVideos(limit = 12, tx?: DatabaseExecutor) {
  try {
    const d = tx || db;
    const rows = await d
      .select({
        video: schema.youtubeVideos,
        facultyName: schema.faculty.name,
        subjectName: schema.subjects.name,
      })
      .from(schema.youtubeVideos)
      .leftJoin(schema.faculty, eq(schema.youtubeVideos.facultyId, schema.faculty.id))
      .leftJoin(schema.subjects, eq(schema.youtubeVideos.subjectId, schema.subjects.id))
      .where(
        and(
          eq(schema.youtubeVideos.isPublished, true),
          eq(schema.youtubeVideos.isShort, true),
        ),
      )
      .orderBy(desc(schema.youtubeVideos.publishedAt))
      .limit(limit);

    return rows.map((r) => formatLectureCard(r));
  } catch (err) {
    console.warn("getShortVideos query failed, returning empty array:", err);
    return [];
  }
}

export async function getUpNextVideos(
  videoId: string,
  chapterId?: string | null,
  subjectId?: string | null,
  limit = 5,
  tx?: DatabaseExecutor,
) {
  try {
    const d = tx || db;
    const conditions = [
      eq(schema.youtubeVideos.isPublished, true),
      sql`${schema.youtubeVideos.id} != ${videoId}`,
    ];

    if (chapterId) {
      conditions.push(eq(schema.youtubeVideos.chapterId, chapterId));
    } else if (subjectId) {
      conditions.push(eq(schema.youtubeVideos.subjectId, subjectId));
    }

    const rows = await d
      .select({
        video: schema.youtubeVideos,
        facultyName: schema.faculty.name,
        subjectName: schema.subjects.name,
      })
      .from(schema.youtubeVideos)
      .leftJoin(schema.faculty, eq(schema.youtubeVideos.facultyId, schema.faculty.id))
      .leftJoin(schema.subjects, eq(schema.youtubeVideos.subjectId, schema.subjects.id))
      .where(and(...conditions))
      .orderBy(asc(schema.youtubeVideos.publishedAt))
      .limit(limit);

    // If chapter had fewer items, fetch latest from same subject
    if (rows.length < limit && subjectId) {
      const existingIds = new Set([videoId, ...rows.map((r) => r.video.id)]);
      const fallbackRows = await d
        .select({
          video: schema.youtubeVideos,
          facultyName: schema.faculty.name,
          subjectName: schema.subjects.name,
        })
        .from(schema.youtubeVideos)
        .leftJoin(schema.faculty, eq(schema.youtubeVideos.facultyId, schema.faculty.id))
        .leftJoin(schema.subjects, eq(schema.youtubeVideos.subjectId, schema.subjects.id))
        .where(
          and(
            eq(schema.youtubeVideos.isPublished, true),
            eq(schema.youtubeVideos.subjectId, subjectId),
            sql`${schema.youtubeVideos.id} NOT IN (${sql.join(Array.from(existingIds).map((id) => sql`${id}`), sql`, `)})`,
          ),
        )
        .orderBy(desc(schema.youtubeVideos.publishedAt))
        .limit(limit - rows.length);

      rows.push(...fallbackRows);
    }

    if (rows && rows.length > 0) {
      return rows.map((r) => formatLectureCard(r));
    }
  } catch (err) {
    console.warn("getUpNextVideos query failed, checking fallback:", err);
  }

  const otherVideos = DEFAULT_VIDEOS.filter((v) => v.id !== videoId).slice(0, limit);
  return otherVideos.map((v) =>
    formatLectureCard({
      video: {
        id: v.id,
        title: v.title,
        description: v.description,
        publishedAt: new Date(v.publishedAt),
        durationSeconds: v.durationSeconds,
        thumbnailUrl: v.thumbnailUrl,
        viewCount: v.viewCount,
        likeCount: v.likeCount,
        playlistIds: [],
        isShort: false,
        classLevel: v.classLevel ?? null,
        subjectId: v.subjectId ?? null,
        chapterId: v.chapterId ?? null,
        facultyId: v.facultyId ?? null,
        isPublished: true,
        needsReview: false,
        syncedAt: new Date(),
        fts: null as any,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      facultyName: v.facultyName || null,
      subjectName: v.subjectName || null,
    }),
  );
}

export async function getSubjectChaptersWithStats(
  classLevel: number,
  subjectId: string,
  tx?: DatabaseExecutor,
) {
  try {
    const d = tx || db;
    const chapters = await d
      .select()
      .from(schema.chapters)
      .where(
        and(
          eq(schema.chapters.classLevel, classLevel),
          eq(schema.chapters.subjectId, subjectId),
        ),
      )
      .orderBy(asc(schema.chapters.sortOrder), asc(schema.chapters.number));

    const videos = await d
      .select({
        id: schema.youtubeVideos.id,
        chapterId: schema.youtubeVideos.chapterId,
        durationSeconds: schema.youtubeVideos.durationSeconds,
      })
      .from(schema.youtubeVideos)
      .where(
        and(
          eq(schema.youtubeVideos.isPublished, true),
          eq(schema.youtubeVideos.isShort, false),
          eq(schema.youtubeVideos.classLevel, classLevel),
          eq(schema.youtubeVideos.subjectId, subjectId),
        ),
      );

    const statsMap: Record<string, { count: number; duration: number }> = {};
    for (const v of videos) {
      if (v.chapterId) {
        const curr = statsMap[v.chapterId] || { count: 0, duration: 0 };
        curr.count += 1;
        curr.duration += v.durationSeconds;
        statsMap[v.chapterId] = curr;
      }
    }

    if (chapters && chapters.length > 0) {
      return chapters.map((ch) => ({
        ...ch,
        lectureCount: statsMap[ch.id]?.count || 0,
        totalDurationSeconds: statsMap[ch.id]?.duration || 0,
        formattedDuration: formatDuration(statsMap[ch.id]?.duration || 0),
      }));
    }
  } catch (err) {
    console.warn(`getSubjectChaptersWithStats failed for class ${classLevel}, using fallback:`, err);
  }

  // Fallback chapters from DEFAULT_CHAPTERS
  const fallbackChapters = DEFAULT_CHAPTERS.filter(
    (c) => c.classLevel === classLevel && c.subjectId === subjectId,
  );
  return fallbackChapters.map((ch) => ({
    ...ch,
    fts: null as any,
    createdAt: new Date(),
    updatedAt: new Date(),
    lectureCount: 1,
    totalDurationSeconds: 3600,
    formattedDuration: "1 hr",
  }));
}

export async function getChapterBySlug(
  classLevel: number,
  subjectSlug: string,
  chapterSlug: string,
  tx?: DatabaseExecutor,
) {
  try {
    const d = tx || db;
    const [row] = await d
      .select({
        chapter: schema.chapters,
        subject: schema.subjects,
      })
      .from(schema.chapters)
      .innerJoin(schema.subjects, eq(schema.chapters.subjectId, schema.subjects.id))
      .where(
        and(
          eq(schema.chapters.classLevel, classLevel),
          eq(schema.subjects.slug, subjectSlug),
          eq(schema.chapters.slug, chapterSlug),
        ),
      );

    if (row) return row;
  } catch (err) {
    console.warn(`getChapterBySlug failed for ${chapterSlug}, using fallback:`, err);
  }

  const subj = DEFAULT_SUBJECTS.find((s) => s.slug === subjectSlug);
  const ch = DEFAULT_CHAPTERS.find(
    (c) => c.classLevel === classLevel && (c.slug === chapterSlug || c.slug.includes(chapterSlug)),
  );
  if (!subj || !ch) return null;

  return {
    chapter: {
      ...ch,
      fts: null as any,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    subject: {
      ...subj,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  };
}

export async function getAllChaptersWithSubject(tx?: DatabaseExecutor) {
  try {
    const d = tx || db;
    const rows = await d
      .select({
        classLevel: schema.chapters.classLevel,
        chapterSlug: schema.chapters.slug,
        subjectSlug: schema.subjects.slug,
      })
      .from(schema.chapters)
      .innerJoin(schema.subjects, eq(schema.chapters.subjectId, schema.subjects.id));
    if (rows && rows.length > 0) return rows;
  } catch (err) {
    console.warn("getAllChaptersWithSubject query failed, using static fallback:", err);
  }

  return DEFAULT_CHAPTERS.map((ch) => {
    const subj = DEFAULT_SUBJECTS.find((s) => s.id === ch.subjectId);
    return {
      classLevel: ch.classLevel,
      chapterSlug: ch.slug,
      subjectSlug: subj?.slug || "mathematics",
    };
  });
}

export async function getRelatedBatchForClass(
  classLevel: number,
  subjectId?: string | null,
  tx?: DatabaseExecutor,
) {
  try {
    const d = tx || db;
    const conditions = [
      eq(schema.batches.classLevel, classLevel),
      eq(schema.batches.status, "open"),
    ];
    if (subjectId) {
      conditions.push(eq(schema.batches.subjectId, subjectId));
    }

    const [batch] = await d
      .select({
        batch: schema.batches,
        faculty: schema.faculty,
        subject: schema.subjects,
      })
      .from(schema.batches)
      .leftJoin(schema.faculty, eq(schema.batches.facultyId, schema.faculty.id))
      .leftJoin(schema.subjects, eq(schema.batches.subjectId, schema.subjects.id))
      .where(and(...conditions))
      .orderBy(desc(schema.batches.isFeatured), desc(schema.batches.createdAt))
      .limit(1);

    if (batch) return batch;

    // Fallback to any open batch for this class
    const [fallback] = await d
      .select({
        batch: schema.batches,
        faculty: schema.faculty,
        subject: schema.subjects,
      })
      .from(schema.batches)
      .leftJoin(schema.faculty, eq(schema.batches.facultyId, schema.faculty.id))
      .leftJoin(schema.subjects, eq(schema.batches.subjectId, schema.subjects.id))
      .where(
        and(
          eq(schema.batches.classLevel, classLevel),
          eq(schema.batches.status, "open"),
        ),
      )
      .orderBy(desc(schema.batches.isFeatured))
      .limit(1);

    if (fallback) return fallback;
  } catch (err) {
    console.warn(`getRelatedBatchForClass query failed for class ${classLevel}, using static fallback:`, err);
  }

  const fallback = DEFAULT_BATCHES.find((b) => b.classLevel === classLevel) || DEFAULT_BATCHES[0];
  if (!fallback) return null;
  const isDinesh = fallback.facultyName.includes("Dinesh");
  return {
    batch: {
      id: fallback.id,
      slug: fallback.slug,
      title: fallback.title,
      subtitle: fallback.subtitle,
      description: fallback.description,
      classLevel: fallback.classLevel,
      board: fallback.board.toLowerCase() as schema.Board,
      subjectId: "a0000000-0000-0000-0000-000000000001",
      facultyId: isDinesh ? "f0000000-0000-0000-0000-000000000001" : "f0000000-0000-0000-0000-000000000002",
      coverKey: fallback.coverImageUrl || null,
      mode: fallback.mode as schema.BatchMode,
      scheduleText: fallback.scheduleText,
      locationText: fallback.locationText,
      startDate: new Date(fallback.startDate),
      endDate: new Date(fallback.endDate),
      seatsTotal: fallback.seatsTotal,
      status: fallback.status as schema.BatchStatus,
      outcomes: fallback.outcomes || [],
      syllabus: fallback.syllabus || [],
      faqs: fallback.faqs || [],
      whatsappGroupUrl: "https://chat.whatsapp.com/Quick2Learn",
      isFeatured: fallback.isFeatured,
      fts: null as any,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    faculty: {
      id: isDinesh ? "f0000000-0000-0000-0000-000000000001" : "f0000000-0000-0000-0000-000000000002",
      profileId: null,
      name: fallback.facultyName,
      slug: isDinesh ? "dinesh-singh-rajput" : "namita-singh-rajput",
      designation: isDinesh ? "Founder & Head of Senior Mathematics" : "Head of ICSE Sciences & Humanities",
      bio: isDinesh ? "25+ years teaching Mathematics in Mathura." : "15+ years teaching ICSE Sciences & Humanities.",
      photoKey: fallback.facultyAvatar || null,
      achievements: [],
      subjectIds: [],
      isPublished: true,
      sortOrder: isDinesh ? 1 : 2,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    subject: {
      id: "a0000000-0000-0000-0000-000000000001",
      name: fallback.board === "ICSE" ? "Chemistry" : "Mathematics",
      slug: fallback.board === "ICSE" ? "chemistry" : "mathematics",
      sortOrder: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  };
}

export async function getPublicChapterResources(chapterId: string, tx?: DatabaseExecutor) {
  try {
    const d = tx || db;
    return await d
      .select()
      .from(schema.resources)
      .where(
        and(
          eq(schema.resources.chapterId, chapterId),
          eq(schema.resources.visibility, "public"),
        ),
      )
      .orderBy(desc(schema.resources.createdAt));
  } catch (err) {
    console.warn("getPublicChapterResources query failed, returning empty array:", err);
    return [];
  }
}

// LECTURE VIEWS
export async function recordLectureView(user: AuthUser, videoId: string, tx?: DatabaseExecutor) {
  assert(!!user?.id, "Authentication required to log views.", 401);
  const d = tx || db;
  const [recorded] = await d
    .insert(schema.lectureViews)
    .values({
      userId: user.id,
      videoId,
    })
    .returning();
  return recorded;
}

export async function getLectureViews(user: AuthUser, targetUserId?: string, tx?: DatabaseExecutor) {
  assert(!!user?.id, "Authentication required.", 401);
  const d = tx || db;
  if (targetUserId && targetUserId !== user.id) {
    assert(isStaff(user), "Cannot inspect another student's lecture views.");
    return await d
      .select()
      .from(schema.lectureViews)
      .where(eq(schema.lectureViews.userId, targetUserId))
      .orderBy(desc(schema.lectureViews.viewedAt));
  }
  return await d
    .select()
    .from(schema.lectureViews)
    .where(eq(schema.lectureViews.userId, user.id))
    .orderBy(desc(schema.lectureViews.viewedAt));
}

export async function getRecentlyViewedLectures(
  user: AuthUser,
  limit = 6,
  tx?: DatabaseExecutor,
): Promise<FormattedLectureCardData[]> {
  assert(!!user?.id, "Authentication required.", 401);
  const d = tx || db;

  const views = await d
    .select({
      video: schema.youtubeVideos,
      facultyName: schema.faculty.name,
      subjectName: schema.subjects.name,
      viewedAt: schema.lectureViews.viewedAt,
    })
    .from(schema.lectureViews)
    .innerJoin(schema.youtubeVideos, eq(schema.lectureViews.videoId, schema.youtubeVideos.id))
    .leftJoin(schema.faculty, eq(schema.youtubeVideos.facultyId, schema.faculty.id))
    .leftJoin(schema.subjects, eq(schema.youtubeVideos.subjectId, schema.subjects.id))
    .where(
      and(
        eq(schema.lectureViews.userId, user.id),
        eq(schema.youtubeVideos.isPublished, true),
      ),
    )
    .orderBy(desc(schema.lectureViews.viewedAt))
    .limit(limit * 3);

  // Deduplicate by video ID so each lecture appears once with its latest view
  const seenIds = new Set<string>();
  const uniqueViews: typeof views = [];
  for (const v of views) {
    if (!seenIds.has(v.video.id)) {
      seenIds.add(v.video.id);
      uniqueViews.push(v);
      if (uniqueViews.length >= limit) break;
    }
  }

  return uniqueViews.map((r) => formatLectureCard(r));
}

export async function getPopularVideos(
  filter: "latest" | "most_watched" | "board_exam",
  limit = 8,
  tx?: DatabaseExecutor,
): Promise<FormattedLectureCardData[]> {
  try {
    const d = tx || db;

    const conditions = [
      eq(schema.youtubeVideos.isPublished, true),
      eq(schema.youtubeVideos.isShort, false),
    ];

    if (filter === "board_exam") {
      conditions.push(
        sql`("youtube_videos"."title" ILIKE '%board%' OR "youtube_videos"."title" ILIKE '%pyq%' OR "youtube_videos"."title" ILIKE '%marathon%' OR "youtube_videos"."title" ILIKE '%revision%')`,
      );
    }

    let orderClause = desc(schema.youtubeVideos.publishedAt);
    if (filter === "most_watched") {
      orderClause = desc(schema.youtubeVideos.viewCount);
    }

    const rows = await d
      .select({
        video: schema.youtubeVideos,
        facultyName: schema.faculty.name,
        subjectName: schema.subjects.name,
      })
      .from(schema.youtubeVideos)
      .leftJoin(schema.faculty, eq(schema.youtubeVideos.facultyId, schema.faculty.id))
      .leftJoin(schema.subjects, eq(schema.youtubeVideos.subjectId, schema.subjects.id))
      .where(and(...conditions))
      .orderBy(orderClause)
      .limit(limit);

    let finalRows = rows;
    if (filter === "board_exam" && rows.length < 3) {
      const fallbackRows = await d
        .select({
          video: schema.youtubeVideos,
          facultyName: schema.faculty.name,
          subjectName: schema.subjects.name,
        })
        .from(schema.youtubeVideos)
        .leftJoin(schema.faculty, eq(schema.youtubeVideos.facultyId, schema.faculty.id))
        .leftJoin(schema.subjects, eq(schema.youtubeVideos.subjectId, schema.subjects.id))
        .where(
          and(
            eq(schema.youtubeVideos.isPublished, true),
            eq(schema.youtubeVideos.isShort, false),
          ),
        )
        .orderBy(desc(schema.youtubeVideos.publishedAt))
        .limit(limit);
      finalRows = fallbackRows;
    }

    if (finalRows && finalRows.length > 0) {
      return finalRows.map((r) => formatLectureCard(r));
    }
  } catch (err) {
    console.warn("getPopularVideos query failed, using static fallback:", err);
  }

  return DEFAULT_VIDEOS.slice(0, limit).map((v) => ({
    id: v.id,
    title: v.title,
    thumbnailUrl: v.thumbnailUrl,
    duration: formatDuration(v.durationSeconds),
    gradeAndSubject: `Class ${v.classLevel === 12 ? "XII" : v.classLevel === 11 ? "XI" : "X"} · ${v.subjectName || "Mathematics"}`,
    faculty: v.facultyName || "Mr. Dinesh Singh Rajput",
    views: formatViews(v.viewCount),
    publishedAt: formatRelativeTime(v.publishedAt),
    href: `/lecture/${v.id}/${slugify(v.title)}`,
  }));
}

export async function getLatestVideo(tx?: DatabaseExecutor): Promise<FormattedLectureCardData | null> {
  try {
    const d = tx || db;
    const [row] = await d
      .select({
        video: schema.youtubeVideos,
        facultyName: schema.faculty.name,
        subjectName: schema.subjects.name,
      })
      .from(schema.youtubeVideos)
      .leftJoin(schema.faculty, eq(schema.youtubeVideos.facultyId, schema.faculty.id))
      .leftJoin(schema.subjects, eq(schema.youtubeVideos.subjectId, schema.subjects.id))
      .where(
        and(
          eq(schema.youtubeVideos.isPublished, true),
          eq(schema.youtubeVideos.isShort, false),
        ),
      )
      .orderBy(desc(schema.youtubeVideos.publishedAt))
      .limit(1);

    if (row) return formatLectureCard(row);
  } catch (err) {
    console.warn("getLatestVideo query failed, using static fallback:", err);
  }

  const v = DEFAULT_VIDEOS[0];
  if (!v) return null;
  return {
    id: v.id,
    title: v.title,
    thumbnailUrl: v.thumbnailUrl,
    duration: formatDuration(v.durationSeconds),
    gradeAndSubject: `Class ${v.classLevel === 12 ? "XII" : v.classLevel === 11 ? "XI" : "X"} · ${v.subjectName || "Mathematics"}`,
    faculty: v.facultyName || "Mr. Dinesh Singh Rajput",
    views: formatViews(v.viewCount),
    publishedAt: formatRelativeTime(v.publishedAt),
    href: `/lecture/${v.id}/${slugify(v.title)}`,
  };
}

export async function getPlaylistById(id: string, tx?: DatabaseExecutor) {
  const d = tx || db;
  const [playlist] = await d
    .select()
    .from(schema.youtubePlaylists)
    .where(eq(schema.youtubePlaylists.id, id));
  return playlist || null;
}
