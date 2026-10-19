import {
  db,
  schema,
  eq,
  and,
  or,
  inArray,
  sql,
  desc,
  asc,
  ne,
  type DatabaseExecutor,
} from "@quick2learn/db";
import { assert, isAdmin, isStaff, type AuthUser } from "../authz";
import { formatClassRoman, classLevelToSlug } from "@quick2learn/shared";
import { publicUrl } from "../storage";
import { notify } from "../notify";
import type {
  BatchesMineResponse,
  BatchDetailResponse,
  BatchTimetableResponse,
  BatchAnnouncementsResponse,
  BatchJoinResponse,
} from "@quick2learn/shared";

export interface BatchFilterOptions {
  classLevel?: number;
  board?: string;
  subjectSlug?: string;
  mode?: string;
  status?: string;
}

export interface FormattedBatchCardData {
  id: string;
  slug: string;
  title: string;
  subtitle?: string | null;
  grade: string;
  board: string;
  facultyName: string;
  facultyAvatar?: string | null;
  schedule: string;
  pricePaise: number;
  originalPricePaise?: number;
  admissionsOpen: boolean;
  mode: string;
  status: string;
  coverImageUrl?: string;
  href: string;
}

export interface EnrichedModuleChapter {
  title: string;
  slug?: string;
  hasFreePreview: boolean;
  previewUrl?: string;
  lectureCount?: number;
}

export interface EnrichedSyllabusModule {
  module: string;
  notes?: string;
  chapters: EnrichedModuleChapter[];
}

export type BatchFeePlanItem = typeof schema.batchFeePlans.$inferSelect;

export interface BatchDetailResult {
  batch: typeof schema.batches.$inferSelect;
  faculty: typeof schema.faculty.$inferSelect | null;
  subject: typeof schema.subjects.$inferSelect | null;
  feePlans: BatchFeePlanItem[];
  primaryFeePlan: BatchFeePlanItem | null;
  enrolledCount: number;
  seatsRemaining: number;
  testimonials: (typeof schema.testimonials.$inferSelect)[];
  enrichedSyllabus: EnrichedSyllabusModule[];
  isStaffPreview: boolean;
}

import { DEFAULT_BATCHES } from "./fallbacks";

// BATCH LISTING WITH FILTER CHIPS (OPEN FIRST, DRAFT EXCLUDED)
export async function getBatchesWithFilters(
  filters?: BatchFilterOptions,
  user?: AuthUser | null,
  tx?: DatabaseExecutor,
): Promise<FormattedBatchCardData[]> {
  try {
    const d = tx || db;
    const staff = isStaff(user);

    const conditions = [];

    // Draft batches never appear to the public
    if (!staff) {
      conditions.push(ne(schema.batches.status, "draft"));
    }

    if (filters?.classLevel) {
      conditions.push(eq(schema.batches.classLevel, filters.classLevel));
    }

    if (filters?.board && filters.board !== "all") {
      conditions.push(
        eq(schema.batches.board, filters.board as schema.Board),
      );
    }

    if (filters?.mode && filters.mode !== "all") {
      conditions.push(
        eq(schema.batches.mode, filters.mode as schema.BatchMode),
      );
    }

    if (filters?.status && filters.status !== "all") {
      conditions.push(
        eq(schema.batches.status, filters.status as schema.BatchStatus),
      );
    }

    if (filters?.subjectSlug && filters.subjectSlug !== "all") {
      conditions.push(eq(schema.subjects.slug, filters.subjectSlug));
    }

    const rows = await d
      .select({
        batch: schema.batches,
        facultyName: schema.faculty.name,
        facultyPhoto: schema.faculty.photoKey,
        facultySlug: schema.faculty.slug,
        subjectName: schema.subjects.name,
        subjectSlug: schema.subjects.slug,
      })
      .from(schema.batches)
      .leftJoin(schema.faculty, eq(schema.batches.facultyId, schema.faculty.id))
      .leftJoin(schema.subjects, eq(schema.batches.subjectId, schema.subjects.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(
        // Open first
        sql`CASE WHEN "batches"."status" = 'open' THEN 0 ELSE 1 END`,
        desc(schema.batches.isFeatured),
        asc(schema.batches.startDate),
      );

    const allPlans = await d
      .select()
      .from(schema.batchFeePlans)
      .where(eq(schema.batchFeePlans.isActive, true));

    if (rows && rows.length > 0) {
      return rows.map((r) => {
        const plans = allPlans.filter((p) => p.batchId === r.batch.id);
        plans.sort((a, b) => a.totalPaise - b.totalPaise);
        const primaryPlan = plans[0];
        const gradeRoman = `Class ${formatClassRoman(r.batch.classLevel)}`;
        const boardUpper = r.batch.board.toUpperCase();

        const isDinesh = r.facultySlug?.includes("dinesh");
        const avatarUrl = isDinesh
          ? "https://images.unsplash.com/photo-1544717305-2782549b5136?w=200&auto=format&fit=crop&q=80"
          : "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80";

        return {
          id: r.batch.id,
          slug: r.batch.slug,
          title: r.batch.title,
          subtitle: r.batch.subtitle,
          grade: gradeRoman,
          board: boardUpper,
          facultyName: r.facultyName || "Mr. Dinesh Singh Rajput",
          facultyAvatar: avatarUrl,
          schedule: r.batch.scheduleText,
          pricePaise: primaryPlan?.totalPaise ?? 1800000,
          originalPricePaise: primaryPlan?.originalPaise ?? undefined,
          admissionsOpen: r.batch.status === "open",
          mode: r.batch.mode,
          status: r.batch.status,
          href: `/batches/${r.batch.slug}`,
        };
      });
    }
  } catch (err) {
    console.warn("getBatchesWithFilters query failed, using static fallback:", err);
  }

  // Filter static default batches
  let filtered = [...DEFAULT_BATCHES];
  if (filters?.classLevel) {
    filtered = filtered.filter((b) => b.classLevel === filters.classLevel);
  }
  if (filters?.board && filters.board !== "all") {
    filtered = filtered.filter((b) => b.board.toLowerCase() === filters.board?.toLowerCase());
  }
  if (filters?.mode && filters.mode !== "all") {
    filtered = filtered.filter((b) => b.mode.toLowerCase() === filters.mode?.toLowerCase());
  }
  if (filters?.status && filters.status !== "all") {
    filtered = filtered.filter((b) => b.status.toLowerCase() === filters.status?.toLowerCase());
  }

  return filtered.map((b) => ({
    id: b.id,
    slug: b.slug,
    title: b.title,
    subtitle: b.subtitle,
    grade: b.grade,
    board: b.board,
    facultyName: b.facultyName,
    facultyAvatar: b.facultyAvatar,
    schedule: b.schedule,
    pricePaise: b.pricePaise,
    originalPricePaise: b.originalPricePaise,
    admissionsOpen: b.admissionsOpen,
    mode: b.mode,
    status: b.status,
    href: b.href,
  }));
}

// BATCH DETAIL BY SLUG (WITH DRAFT / PREVIEW RESTRICTION & ENRICHMENTS)
export async function getBatchDetailBySlug(
  slug: string,
  options?: {
    preview?: boolean;
    user?: AuthUser | null;
  },
  tx?: DatabaseExecutor,
): Promise<BatchDetailResult | null> {
  const staff = isStaff(options?.user);
  const isPreviewRequested = Boolean(options?.preview);

  let row: {
    batch: typeof schema.batches.$inferSelect;
    faculty: typeof schema.faculty.$inferSelect | null;
    subject: typeof schema.subjects.$inferSelect | null;
  } | undefined;

  try {
    const d = tx || db;
    const [found] = await d
      .select({
        batch: schema.batches,
        faculty: schema.faculty,
        subject: schema.subjects,
      })
      .from(schema.batches)
      .leftJoin(schema.faculty, eq(schema.batches.facultyId, schema.faculty.id))
      .leftJoin(schema.subjects, eq(schema.batches.subjectId, schema.subjects.id))
      .where(eq(schema.batches.slug, slug));
    row = found;
  } catch (err) {
    console.warn(`getBatchDetailBySlug query for ${slug} failed, checking static fallback:`, err);
  }

  if (!row) {
    const fallback = DEFAULT_BATCHES.find((b) => b.slug === slug);
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
        joinCode: "Q2L101",
        academicYear: "2026-27",
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
      feePlans: [
        {
          id: `fp-${fallback.id}`,
          batchId: fallback.id,
          name: "Full Annual Course",
          totalPaise: fallback.pricePaise,
          originalPaise: fallback.originalPricePaise || fallback.pricePaise,
          instalments: [{ label: "One-Time", amount_paise: fallback.pricePaise, due_date: fallback.startDate }],
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      primaryFeePlan: {
        id: `fp-${fallback.id}`,
        batchId: fallback.id,
        name: "Full Annual Course",
        totalPaise: fallback.pricePaise,
        originalPaise: fallback.originalPricePaise || fallback.pricePaise,
        instalments: [{ label: "One-Time", amount_paise: fallback.pricePaise, due_date: fallback.startDate }],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      enrolledCount: fallback.seatsTaken || 25,
      seatsRemaining: Math.max(0, fallback.seatsTotal - (fallback.seatsTaken || 25)),
      testimonials: [],
      enrichedSyllabus: (fallback.syllabus as unknown as EnrichedSyllabusModule[]) || [],
      isStaffPreview: false,
    };
  }

  const d = tx || db;

  // Draft batches return 404 to the public; staff can preview them with ?preview=1
  if (row.batch.status === "draft") {
    if (!staff || !isPreviewRequested) {
      return null;
    }
  }

  // Fetch active fee plans
  const feePlans = await d
    .select()
    .from(schema.batchFeePlans)
    .where(
      and(
        eq(schema.batchFeePlans.batchId, row.batch.id),
        eq(schema.batchFeePlans.isActive, true),
      ),
    )
    .orderBy(asc(schema.batchFeePlans.totalPaise));

  const primaryFeePlan = feePlans[0] || null;

  // Fetch active enrollments count
  const [enrollmentCountRow] = await d
    .select({
      count: sql<number>`count(${schema.enrollments.id})::int`,
    })
    .from(schema.enrollments)
    .where(
      and(
        eq(schema.enrollments.batchId, row.batch.id),
        ne(schema.enrollments.status, "cancelled"),
      ),
    );

  const enrolledCount = enrollmentCountRow?.count || 0;
  const seatsRemaining = Math.max(0, row.batch.seatsTotal - enrolledCount);

  // Fetch testimonials for this class level
  const testimonials = await d
    .select()
    .from(schema.testimonials)
    .where(
      and(
        eq(schema.testimonials.classLevel, row.batch.classLevel),
        eq(schema.testimonials.isPublished, true),
      ),
    )
    .orderBy(asc(schema.testimonials.sortOrder))
    .limit(4);

  // Fetch curriculum chapters for this batch's class and subject to cross-reference with syllabus
  const curriculumChapters = await d
    .select({
      id: schema.chapters.id,
      title: schema.chapters.title,
      slug: schema.chapters.slug,
      number: schema.chapters.number,
      subjectSlug: schema.subjects.slug,
    })
    .from(schema.chapters)
    .innerJoin(schema.subjects, eq(schema.chapters.subjectId, schema.subjects.id))
    .where(
      and(
        eq(schema.chapters.classLevel, row.batch.classLevel),
        eq(schema.chapters.subjectId, row.batch.subjectId),
      ),
    )
    .orderBy(asc(schema.chapters.number));

  // Fetch video lecture counts per chapter to determine "Free preview"
  const videoCounts = await d
    .select({
      chapterId: schema.youtubeVideos.chapterId,
      count: sql<number>`count(${schema.youtubeVideos.id})::int`,
    })
    .from(schema.youtubeVideos)
    .where(
      and(
        eq(schema.youtubeVideos.isPublished, true),
        eq(schema.youtubeVideos.isShort, false),
      ),
    )
    .groupBy(schema.youtubeVideos.chapterId);

  const videoCountMap: Record<string, number> = {};
  for (const vc of videoCounts) {
    if (vc.chapterId) {
      videoCountMap[vc.chapterId] = vc.count;
    }
  }

  const classSlug = classLevelToSlug(row.batch.classLevel) || "xii";
  const subSlug = row.subject?.slug || "mathematics";

  // Parse and enrich syllabus modules
  const rawSyllabus = Array.isArray(row.batch.syllabus)
    ? (row.batch.syllabus as Array<{ module?: string; notes?: string; chapters?: Array<string | { title: string; slug?: string }> }>)
    : [];

  const enrichedSyllabus: EnrichedSyllabusModule[] = [];

  if (rawSyllabus.length > 0) {
    for (const mod of rawSyllabus) {
      const moduleName = mod.module || "Core Curriculum Module";
      const moduleNotes = mod.notes || "";
      const enrichedChapters: EnrichedModuleChapter[] = [];

      // Check if module explicitly specifies chapters
      if (mod.chapters && Array.isArray(mod.chapters) && mod.chapters.length > 0) {
        for (const chItem of mod.chapters) {
          const chTitle = typeof chItem === "string" ? chItem : chItem.title;
          const matchedDbChapter = curriculumChapters.find(
            (c) =>
              c.title.toLowerCase().includes(chTitle.toLowerCase()) ||
              chTitle.toLowerCase().includes(c.title.toLowerCase()),
          );

          const chSlug = matchedDbChapter?.slug || (typeof chItem !== "string" ? chItem.slug : undefined);
          const lectureCount = matchedDbChapter ? videoCountMap[matchedDbChapter.id] || 0 : 0;
          const hasFreePreview = lectureCount > 0 && !!chSlug;

          enrichedChapters.push({
            title: chTitle,
            slug: chSlug,
            hasFreePreview,
            previewUrl: hasFreePreview ? `/learn/${classSlug}/${subSlug}/${chSlug}` : undefined,
            lectureCount,
          });
        }
      } else {
        // Find matching chapters from curriculum using keywords in module name or notes
        const matched = curriculumChapters.filter((c) => {
          const titleLower = c.title.toLowerCase();
          const notesLower = moduleNotes.toLowerCase();
          const modLower = moduleName.toLowerCase();

          // Match terms
          return (
            notesLower.includes(titleLower) ||
            modLower.includes(titleLower) ||
            titleLower.split(" ").some((w) => w.length > 4 && notesLower.includes(w))
          );
        });

        if (matched.length > 0) {
          for (const m of matched) {
            const lectureCount = videoCountMap[m.id] || 0;
            const hasFreePreview = lectureCount > 0;
            enrichedChapters.push({
              title: m.title,
              slug: m.slug,
              hasFreePreview,
              previewUrl: hasFreePreview ? `/learn/${classSlug}/${subSlug}/${m.slug}` : undefined,
              lectureCount,
            });
          }
        } else {
          // If no specific match, split comma-separated notes into chapter items
          const items = moduleNotes
            ? moduleNotes.split(",").map((s) => s.trim()).filter(Boolean)
            : ["Concept Walkthrough", "Exercise Problem Solving", "Mock Board Test"];

          for (const item of items) {
            const matchedDb = curriculumChapters.find((c) =>
              c.title.toLowerCase().includes(item.toLowerCase()),
            );
            const lectureCount = matchedDb ? videoCountMap[matchedDb.id] || 0 : 0;
            const hasFreePreview = lectureCount > 0 && !!matchedDb?.slug;

            enrichedChapters.push({
              title: item,
              slug: matchedDb?.slug,
              hasFreePreview,
              previewUrl: hasFreePreview ? `/learn/${classSlug}/${subSlug}/${matchedDb?.slug}` : undefined,
              lectureCount,
            });
          }
        }
      }

      enrichedSyllabus.push({
        module: moduleName,
        notes: moduleNotes,
        chapters: enrichedChapters,
      });
    }
  } else {
    // Default fallback module from curriculum
    const enrichedChapters = curriculumChapters.map((c) => {
      const lectureCount = videoCountMap[c.id] || 0;
      const hasFreePreview = lectureCount > 0;
      return {
        title: c.title,
        slug: c.slug,
        hasFreePreview,
        previewUrl: hasFreePreview ? `/learn/${classSlug}/${subSlug}/${c.slug}` : undefined,
        lectureCount,
      };
    });

    enrichedSyllabus.push({
      module: `${row.subject?.name || "Curriculum"} Complete Syllabus`,
      notes: "Full syllabus coverage with board questions and formula sheets.",
      chapters: enrichedChapters,
    });
  }

  return {
    batch: row.batch,
    faculty: row.faculty,
    subject: row.subject,
    feePlans,
    primaryFeePlan,
    enrolledCount,
    seatsRemaining,
    testimonials,
    enrichedSyllabus,
    isStaffPreview: row.batch.status === "draft" && staff && isPreviewRequested,
  };
}

// BACKWARD-COMPATIBLE HELPERS
export async function getBatches(
  user?: AuthUser | null,
  filters?: {
    classLevel?: number;
    board?: schema.Board;
    search?: string;
  },
  tx?: DatabaseExecutor,
) {
  const d = tx || db;
  const staff = isStaff(user);
  const conditions = [];

  if (!staff) {
    conditions.push(ne(schema.batches.status, "draft"));
  }
  if (filters?.classLevel) conditions.push(eq(schema.batches.classLevel, filters.classLevel));
  if (filters?.board) conditions.push(eq(schema.batches.board, filters.board));
  if (filters?.search) {
    conditions.push(sql`${schema.batches.fts} @@ plainto_tsquery('simple', ${filters.search})`);
  }

  const query = d.select().from(schema.batches);
  if (conditions.length > 0) {
    return await query
      .where(and(...conditions))
      .orderBy(
        sql`CASE WHEN "batches"."status" = 'open' THEN 0 ELSE 1 END`,
        desc(schema.batches.startDate),
      );
  }
  return await query.orderBy(
    sql`CASE WHEN "batches"."status" = 'open' THEN 0 ELSE 1 END`,
    desc(schema.batches.startDate),
  );
}

export async function getBatchBySlug(slug: string, user?: AuthUser | null, tx?: DatabaseExecutor) {
  const d = tx || db;
  const staff = isStaff(user);
  const [batch] = await d.select().from(schema.batches).where(eq(schema.batches.slug, slug));
  if (!batch) return null;
  if (batch.status === "draft" && !staff) {
    return null;
  }
  return batch;
}

export async function getBatchFeePlans(batchId: string, user?: AuthUser | null, tx?: DatabaseExecutor) {
  const d = tx || db;
  const staff = isStaff(user);
  const [batch] = await d.select().from(schema.batches).where(eq(schema.batches.id, batchId));
  if (!batch) return [];
  if (batch.status === "draft" && !staff) {
    return [];
  }

  if (staff) {
    return await d.select().from(schema.batchFeePlans).where(eq(schema.batchFeePlans.batchId, batchId));
  }
  return await d
    .select()
    .from(schema.batchFeePlans)
    .where(and(eq(schema.batchFeePlans.batchId, batchId), eq(schema.batchFeePlans.isActive, true)));
}

export async function createBatch(user: AuthUser, data: schema.NewBatch, tx?: DatabaseExecutor) {
  assert(isAdmin(user), "Only administrators can create batches.");
  const d = tx || db;
  const [created] = await d.insert(schema.batches).values(data).returning();
  return created;
}

export async function updateBatch(
  user: AuthUser,
  id: string,
  data: Partial<schema.NewBatch>,
  tx?: DatabaseExecutor,
) {
  assert(isAdmin(user), "Only administrators can modify batches.");
  const d = tx || db;
  const [updated] = await d.update(schema.batches).set(data).where(eq(schema.batches.id, id)).returning();
  return updated;
}

export async function createBatchFeePlan(user: AuthUser, data: schema.NewBatchFeePlan, tx?: DatabaseExecutor) {
  assert(isAdmin(user), "Only administrators can configure fee plans.");
  const d = tx || db;
  const [created] = await d.insert(schema.batchFeePlans).values(data).returning();
  return created;
}

export async function getOpenBatchesWithDetails(tx?: DatabaseExecutor): Promise<FormattedBatchCardData[]> {
  return await getBatchesWithFilters({ status: "open" }, null, tx);
}

// ==========================================
// BATCH JOIN & TIMETABLE LOGIC (App Prompt 6)
// ==========================================

const WEEKDAY_NAMES: Record<number, string> = {
  1: "Mon",
  2: "Tue",
  3: "Wed",
  4: "Thu",
  5: "Fri",
  6: "Sat",
  7: "Sun",
};

function getNowKolkata() {
  const now = new Date();
  const kolkataStr = now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
  const kolkataDate = new Date(kolkataStr);
  const jsDay = kolkataDate.getDay();
  const weekday = jsDay === 0 ? 7 : jsDay; // 1 = Mon to 7 = Sun
  const hours = String(kolkataDate.getHours()).padStart(2, "0");
  const minutes = String(kolkataDate.getMinutes()).padStart(2, "0");
  const timeFormatted = `${hours}:${minutes}`;
  return {
    weekday,
    timeFormatted,
    totalMinutes: kolkataDate.getHours() * 60 + kolkataDate.getMinutes(),
  };
}

function formatTime12(hhmm: string): string {
  const [hStr = "0", mStr = "0"] = hhmm.split(":");
  let h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${String(m).padStart(2, "0")} ${ampm}`;
}

function computeNextClass(
  slots: Array<{
    weekday: number;
    startTime: string;
    endTime: string;
    subjectName?: string | null;
    teacherName?: string | null;
    roomOrLinkNote?: string | null;
  }>
) {
  if (!slots.length) return null;

  const { weekday: currentDay, totalMinutes: currentMins } = getNowKolkata();

  const parsedSlots = slots.map((s) => {
    const [sh = "0", sm = "0"] = s.startTime.split(":");
    const [eh = "0", em = "0"] = s.endTime.split(":");
    const startMins = parseInt(sh, 10) * 60 + parseInt(sm, 10);
    const endMins = parseInt(eh, 10) * 60 + parseInt(em, 10);
    return { ...s, startMins, endMins };
  });

  // 1. Live right now
  const liveSlot = parsedSlots.find(
    (s) =>
      s.weekday === currentDay &&
      currentMins >= s.startMins &&
      currentMins <= s.endMins
  );
  if (liveSlot) {
    return {
      title: liveSlot.subjectName || "Live Class",
      timeFormatted: `${formatTime12(liveSlot.startTime)} – ${formatTime12(liveSlot.endTime)}`,
      weekday: liveSlot.weekday,
      roomOrLinkNote: liveSlot.roomOrLinkNote || null,
      isToday: true,
      isLive: true,
      startsInMinutes: 0,
    };
  }

  // 2. Upcoming today
  const todayUpcoming = parsedSlots
    .filter((s) => s.weekday === currentDay && s.startMins > currentMins)
    .sort((a, b) => a.startMins - b.startMins)[0];

  if (todayUpcoming) {
    return {
      title: todayUpcoming.subjectName || "Class Today",
      timeFormatted: `${formatTime12(todayUpcoming.startTime)} – ${formatTime12(todayUpcoming.endTime)}`,
      weekday: todayUpcoming.weekday,
      roomOrLinkNote: todayUpcoming.roomOrLinkNote || null,
      isToday: true,
      isLive: false,
      startsInMinutes: todayUpcoming.startMins - currentMins,
    };
  }

  // 3. Next upcoming day this or next week
  const futureSlots = parsedSlots
    .map((s) => {
      let dayDiff = s.weekday - currentDay;
      if (dayDiff <= 0) dayDiff += 7;
      const totalOffsetMins = dayDiff * 24 * 60 + (s.startMins - currentMins);
      return { ...s, totalOffsetMins };
    })
    .sort((a, b) => a.totalOffsetMins - b.totalOffsetMins)[0];

  if (futureSlots) {
    const weekdayName = WEEKDAY_NAMES[futureSlots.weekday] || "Upcoming";
    return {
      title: futureSlots.subjectName || "Upcoming Class",
      timeFormatted: `${weekdayName}, ${formatTime12(futureSlots.startTime)}`,
      weekday: futureSlots.weekday,
      roomOrLinkNote: futureSlots.roomOrLinkNote || null,
      isToday: false,
      isLive: false,
      startsInMinutes: futureSlots.totalOffsetMins,
    };
  }

  return null;
}

export async function generateBatchJoinCode(tx?: DatabaseExecutor): Promise<string> {
  const d = tx || db;
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  for (let attempt = 0; attempt < 20; attempt++) {
    let code = "";
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const [existing] = await d
      .select({ id: schema.batches.id })
      .from(schema.batches)
      .where(eq(schema.batches.joinCode, code))
      .limit(1);
    if (!existing) return code;
  }
  return `Q2L${Math.floor(100 + Math.random() * 900)}`;
}

export async function regenerateBatchJoinCode(
  user: AuthUser,
  batchId: string,
  tx?: DatabaseExecutor
) {
  assert(isAdmin(user), "Only administrators can regenerate batch join codes.");
  const d = tx || db;
  const newCode = await generateBatchJoinCode(d);
  const [updated] = await d
    .update(schema.batches)
    .set({ joinCode: newCode, updatedAt: new Date() })
    .where(eq(schema.batches.id, batchId))
    .returning();
  return updated;
}

export async function getStudentBatches(
  userId: string,
  tx?: DatabaseExecutor
): Promise<BatchesMineResponse> {
  const d = tx || db;

  // 1. Enrolled active batches
  const enrolledRows = await d
    .select({
      enrollment: schema.enrollments,
      batch: schema.batches,
      subject: schema.subjects,
      faculty: schema.faculty,
    })
    .from(schema.enrollments)
    .innerJoin(schema.batches, eq(schema.enrollments.batchId, schema.batches.id))
    .leftJoin(schema.subjects, eq(schema.batches.subjectId, schema.subjects.id))
    .leftJoin(schema.faculty, eq(schema.batches.facultyId, schema.faculty.id))
    .where(
      and(
        eq(schema.enrollments.studentId, userId),
        eq(schema.enrollments.status, "active")
      )
    )
    .orderBy(desc(schema.enrollments.enrolledAt));

  const enrolledBatchIds = enrolledRows.map((r) => r.batch.id);
  const timetableSlots =
    enrolledBatchIds.length > 0
      ? await d
          .select({
            slot: schema.batchTimetableSlots,
            subjectName: schema.subjects.name,
            teacherName: schema.faculty.name,
          })
          .from(schema.batchTimetableSlots)
          .leftJoin(
            schema.subjects,
            eq(schema.batchTimetableSlots.subjectId, schema.subjects.id)
          )
          .leftJoin(
            schema.faculty,
            eq(schema.batchTimetableSlots.teacherId, schema.faculty.id)
          )
          .where(inArray(schema.batchTimetableSlots.batchId, enrolledBatchIds))
      : [];

  const slotsByBatch = new Map<string, any[]>();
  for (const s of timetableSlots) {
    const list = slotsByBatch.get(s.slot.batchId) || [];
    list.push({
      ...s.slot,
      subjectName: s.subjectName,
      teacherName: s.teacherName,
    });
    slotsByBatch.set(s.slot.batchId, list);
  }

  const enrolled = enrolledRows.map((r) => {
    const slots = slotsByBatch.get(r.batch.id) || [];
    const nextClass = computeNextClass(slots);

    return {
      id: r.batch.id,
      slug: r.batch.slug,
      title: r.batch.title,
      subtitle: r.batch.subtitle,
      classLevel: r.batch.classLevel,
      board: r.batch.board,
      mode: r.batch.mode,
      teacherName: r.faculty?.name || "Dinesh Singh Rajput",
      teacherAvatarUrl: r.faculty?.photoKey
        ? publicUrl(r.faculty.photoKey)
        : null,
      subjectName: r.subject?.name || "Mathematics",
      progressPercentage: 45,
      nextClass,
      enrolledAt: r.enrollment.enrolledAt.toISOString(),
    };
  });

  // 2. Pending requests
  const pendingRows = await d
    .select({
      req: schema.batchJoinRequests,
      batch: schema.batches,
    })
    .from(schema.batchJoinRequests)
    .innerJoin(
      schema.batches,
      eq(schema.batchJoinRequests.batchId, schema.batches.id)
    )
    .where(
      and(
        eq(schema.batchJoinRequests.studentId, userId),
        ne(schema.batchJoinRequests.status, "approved")
      )
    )
    .orderBy(desc(schema.batchJoinRequests.createdAt));

  const pendingRequests = pendingRows.map((r) => ({
    id: r.req.id,
    batchId: r.batch.id,
    batchTitle: r.batch.title,
    batchMode: r.batch.mode,
    classLevel: r.batch.classLevel,
    status: r.req.status,
    note: r.req.note,
    requestedAt: r.req.createdAt.toISOString(),
  }));

  return {
    enrolled,
    pendingRequests,
  };
}

export async function getBatchDetailForStudent(
  batchIdOrSlug: string,
  userId?: string,
  tx?: DatabaseExecutor
): Promise<BatchDetailResponse> {
  const d = tx || db;
  const isUuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      batchIdOrSlug
    );

  const [row] = await d
    .select({
      batch: schema.batches,
      subject: schema.subjects,
      faculty: schema.faculty,
    })
    .from(schema.batches)
    .leftJoin(schema.subjects, eq(schema.batches.subjectId, schema.subjects.id))
    .leftJoin(schema.faculty, eq(schema.batches.facultyId, schema.faculty.id))
    .where(
      isUuid
        ? eq(schema.batches.id, batchIdOrSlug)
        : eq(schema.batches.slug, batchIdOrSlug)
    )
    .limit(1);

  if (!row) {
    throw new Error("Batch not found");
  }

  const { batch, subject, faculty } = row;

  let enrollment = null;
  if (userId) {
    const [enr] = await d
      .select()
      .from(schema.enrollments)
      .where(
        and(
          eq(schema.enrollments.batchId, batch.id),
          eq(schema.enrollments.studentId, userId)
        )
      )
      .limit(1);

    if (enr) {
      enrollment = {
        status: enr.status,
        enrolledAt: enr.enrolledAt.toISOString(),
        source: enr.source,
      };
    }
  }

  const slots = await d
    .select({
      slot: schema.batchTimetableSlots,
      subjectName: schema.subjects.name,
      teacherName: schema.faculty.name,
    })
    .from(schema.batchTimetableSlots)
    .leftJoin(
      schema.subjects,
      eq(schema.batchTimetableSlots.subjectId, schema.subjects.id)
    )
    .leftJoin(
      schema.faculty,
      eq(schema.batchTimetableSlots.teacherId, schema.faculty.id)
    )
    .where(eq(schema.batchTimetableSlots.batchId, batch.id));

  const nextClass = computeNextClass(
    slots.map((s) => ({
      ...s.slot,
      subjectName: s.subjectName,
      teacherName: s.teacherName,
    }))
  );

  const latestAnnouncementsRows = await d
    .select()
    .from(schema.announcements)
    .where(eq(schema.announcements.batchId, batch.id))
    .orderBy(
      desc(schema.announcements.isPinned),
      desc(schema.announcements.publishedAt)
    )
    .limit(3);

  const latestAnnouncements = latestAnnouncementsRows.map((a) => ({
    id: a.id,
    title: a.title,
    body: a.body,
    publishedAt: a.publishedAt.toISOString(),
    isPinned: a.isPinned,
    attachmentKeys: a.attachmentKeys || [],
  }));

  const teachers = [
    {
      id: faculty?.id || "f1",
      name: faculty?.name || "Dinesh Singh Rajput",
      role: faculty?.designation || "Head of Mathematics",
      avatarUrl: faculty?.photoKey
        ? publicUrl(faculty.photoKey)
        : "/images/assets/Dinesh Singh Rajput.jpeg",
    },
  ];

  const subjects = [
    {
      id: subject?.id || "s1",
      name: subject?.name || "Mathematics",
      slug: subject?.slug || "mathematics",
    },
  ];

  return {
    id: batch.id,
    slug: batch.slug,
    title: batch.title,
    subtitle: batch.subtitle,
    description: batch.description,
    classLevel: batch.classLevel,
    board: batch.board,
    mode: batch.mode,
    academicYear: batch.academicYear,
    joinCode: batch.joinCode,
    whatsappGroupUrl: batch.whatsappGroupUrl,
    startDate: batch.startDate.toISOString(),
    scheduleText: batch.scheduleText,
    locationText: batch.locationText,
    teachers,
    subjects,
    enrollment,
    nextClass,
    latestAnnouncements,
  };
}

export async function getBatchTimetable(
  batchId: string,
  tx?: DatabaseExecutor
): Promise<BatchTimetableResponse> {
  const d = tx || db;

  const rows = await d
    .select({
      slot: schema.batchTimetableSlots,
      subjectName: schema.subjects.name,
      teacherName: schema.faculty.name,
    })
    .from(schema.batchTimetableSlots)
    .leftJoin(
      schema.subjects,
      eq(schema.batchTimetableSlots.subjectId, schema.subjects.id)
    )
    .leftJoin(
      schema.faculty,
      eq(schema.batchTimetableSlots.teacherId, schema.faculty.id)
    )
    .where(eq(schema.batchTimetableSlots.batchId, batchId))
    .orderBy(
      asc(schema.batchTimetableSlots.weekday),
      asc(schema.batchTimetableSlots.startTime)
    );

  const slots = rows.map((r) => ({
    id: r.slot.id,
    weekday: r.slot.weekday,
    weekdayName: WEEKDAY_NAMES[r.slot.weekday] || "Day",
    startTime: r.slot.startTime,
    endTime: r.slot.endTime,
    subjectName: r.subjectName || "Subject",
    teacherName: r.teacherName || "Dinesh Sir",
    mode: r.slot.mode,
    roomOrLinkNote: r.slot.roomOrLinkNote,
  }));

  return {
    batchId,
    slots,
  };
}

export async function getBatchAnnouncements(
  batchId: string,
  tx?: DatabaseExecutor
): Promise<BatchAnnouncementsResponse> {
  const d = tx || db;

  const rows = await d
    .select()
    .from(schema.announcements)
    .where(
      or(
        eq(schema.announcements.batchId, batchId),
        eq(schema.announcements.audience, "all_students")
      )
    )
    .orderBy(
      desc(schema.announcements.isPinned),
      desc(schema.announcements.publishedAt)
    );

  const announcements = rows.map((a) => {
    const publishedAtKolkata = new Date(a.publishedAt).toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "numeric",
      month: "short",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

    const attachments = (a.attachmentKeys || []).map((key, i) => {
      const lower = key.toLowerCase();
      const isImg =
        lower.endsWith(".png") ||
        lower.endsWith(".jpg") ||
        lower.endsWith(".jpeg") ||
        lower.endsWith(".webp");
      const isPdf = lower.endsWith(".pdf");
      const fileName = key.split("/").pop() || `Attachment ${i + 1}`;
      return {
        id: `att-${i}-${key}`,
        type: (isImg ? "image" : isPdf ? "pdf" : "document") as
          | "image"
          | "pdf"
          | "document",
        storageKey: key,
        fileUrl: publicUrl(key),
        fileName,
      };
    });

    return {
      id: a.id,
      title: a.title,
      body: a.body,
      publishedAt: a.publishedAt.toISOString(),
      publishedAtFormatted: publishedAtKolkata,
      isPinned: a.isPinned,
      notifyParents: a.notifyParents,
      attachments,
    };
  });

  return {
    batchId,
    announcements,
  };
}

export async function requestJoinBatch(
  userId: string,
  code: string,
  tx?: DatabaseExecutor
): Promise<BatchJoinResponse> {
  const d = tx || db;
  const cleanCode = code.trim().toUpperCase();

  const [batch] = await d
    .select()
    .from(schema.batches)
    .where(sql`UPPER(${schema.batches.joinCode}) = ${cleanCode}`)
    .limit(1);

  if (!batch) {
    throw new Error(
      "Invalid join code. Please check with your teacher or institute office."
    );
  }

  // 1. Check if user is already enrolled
  const [existingEnr] = await d
    .select()
    .from(schema.enrollments)
    .where(
      and(
        eq(schema.enrollments.batchId, batch.id),
        eq(schema.enrollments.studentId, userId),
        eq(schema.enrollments.status, "active")
      )
    )
    .limit(1);

  if (existingEnr) {
    return {
      status: "already_enrolled",
      message: `You are already actively enrolled in ${batch.title}.`,
      batchTitle: batch.title,
      batchSlug: batch.slug,
    };
  }

  // 2. Check if this is a paid online batch with fee plans
  if (batch.mode === "online") {
    const feePlans = await d
      .select({ id: schema.batchFeePlans.id })
      .from(schema.batchFeePlans)
      .where(
        and(
          eq(schema.batchFeePlans.batchId, batch.id),
          eq(schema.batchFeePlans.isActive, true)
        )
      )
      .limit(1);

    if (feePlans.length > 0) {
      return {
        status: "enrol_online",
        message: "This is a paid online batch. Please enrol on the website.",
        batchTitle: batch.title,
        batchSlug: batch.slug,
        checkoutUrl: `https://quick2learn.in/checkout/${batch.slug}`,
      };
    }
  }

  // 3. Check for existing pending request
  const [existingPending] = await d
    .select()
    .from(schema.batchJoinRequests)
    .where(
      and(
        eq(schema.batchJoinRequests.batchId, batch.id),
        eq(schema.batchJoinRequests.studentId, userId),
        eq(schema.batchJoinRequests.status, "pending")
      )
    )
    .limit(1);

  if (existingPending) {
    return {
      status: "already_requested",
      message: `You already have a pending join request for ${batch.title}. An admin will review it shortly.`,
      batchTitle: batch.title,
      batchSlug: batch.slug,
      requestId: existingPending.id,
    };
  }

  // 4. Create new pending join request
  const [created] = await d
    .insert(schema.batchJoinRequests)
    .values({
      batchId: batch.id,
      studentId: userId,
      status: "pending",
    })
    .returning();

  return {
    status: "request_created",
    message: `Join request submitted for ${batch.title}! Your teacher or admin will review and approve it shortly.`,
    batchTitle: batch.title,
    batchSlug: batch.slug,
    requestId: created!.id,
  };
}

export async function approveJoinRequest(
  user: AuthUser,
  requestId: string,
  feePlanId?: string,
  tx?: DatabaseExecutor
) {
  assert(
    isAdmin(user) || isStaff(user),
    "Only staff or administrators can approve batch join requests."
  );
  const d = tx || db;

  const [req] = await d
    .select()
    .from(schema.batchJoinRequests)
    .where(eq(schema.batchJoinRequests.id, requestId))
    .limit(1);

  if (!req) {
    throw new Error("Join request not found");
  }

  const [batch] = await d
    .select()
    .from(schema.batches)
    .where(eq(schema.batches.id, req.batchId))
    .limit(1);

  if (!batch) {
    throw new Error("Batch not found");
  }

  const now = new Date();
  await d
    .update(schema.batchJoinRequests)
    .set({
      status: "approved",
      decidedBy: user.id,
      decidedAt: now,
      updatedAt: now,
    })
    .where(eq(schema.batchJoinRequests.id, requestId));

  await d
    .insert(schema.enrollments)
    .values({
      batchId: req.batchId,
      studentId: req.studentId,
      status: "active",
      source: "admin",
      feePlanId: feePlanId || null,
      enrolledAt: now,
    })
    .onConflictDoUpdate({
      target: [schema.enrollments.batchId, schema.enrollments.studentId],
      set: {
        status: "active",
        source: "admin",
        feePlanId: feePlanId || null,
        updatedAt: now,
      },
    });

  notify(
    { userIds: [req.studentId] },
    {
      type: "batch_enrolled",
      title: "Batch Request Approved! 🎉",
      body: `You are now enrolled in ${batch.title}! Open the app to view your classes and timetable.`,
      data: { route: `/batch/${batch.id}` },
    }
  ).catch((err) => {
    console.warn("Failed to push batch approval notification:", err);
  });

  return { success: true, batchId: batch.id, studentId: req.studentId };
}

export async function rejectJoinRequest(
  user: AuthUser,
  requestId: string,
  note?: string,
  tx?: DatabaseExecutor
) {
  assert(
    isAdmin(user) || isStaff(user),
    "Only staff or administrators can reject batch join requests."
  );
  const d = tx || db;

  const [req] = await d
    .select()
    .from(schema.batchJoinRequests)
    .where(eq(schema.batchJoinRequests.id, requestId))
    .limit(1);

  if (!req) {
    throw new Error("Join request not found");
  }

  const [batch] = await d
    .select()
    .from(schema.batches)
    .where(eq(schema.batches.id, req.batchId))
    .limit(1);

  const now = new Date();
  await d
    .update(schema.batchJoinRequests)
    .set({
      status: "rejected",
      note: note || null,
      decidedBy: user.id,
      decidedAt: now,
      updatedAt: now,
    })
    .where(eq(schema.batchJoinRequests.id, requestId));

  if (batch) {
    notify(
      { userIds: [req.studentId] },
      {
        type: "batch_rejected",
        title: "Batch Request Update",
        body: `Your request to join ${batch.title} could not be approved.${note ? ` Reason: ${note}` : ""}`,
      }
    ).catch(() => {});
  }

  return { success: true };
}

export async function getBatchJoinRequests(
  user: AuthUser,
  batchId?: string,
  tx?: DatabaseExecutor
) {
  assert(isAdmin(user) || isStaff(user), "Only staff can view join requests.");
  const d = tx || db;

  const conditions = [];
  if (batchId) {
    conditions.push(eq(schema.batchJoinRequests.batchId, batchId));
  }

  const rows = await d
    .select({
      request: schema.batchJoinRequests,
      batchTitle: schema.batches.title,
      batchMode: schema.batches.mode,
      classLevel: schema.batches.classLevel,
      studentName: schema.user.name,
      studentEmail: schema.user.email,
      studentPhone: schema.profiles.phone,
    })
    .from(schema.batchJoinRequests)
    .innerJoin(
      schema.batches,
      eq(schema.batchJoinRequests.batchId, schema.batches.id)
    )
    .innerJoin(schema.user, eq(schema.batchJoinRequests.studentId, schema.user.id))
    .leftJoin(
      schema.profiles,
      eq(schema.batchJoinRequests.studentId, schema.profiles.userId)
    )
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(schema.batchJoinRequests.createdAt));

  return rows.map((r) => ({
    id: r.request.id,
    batchId: r.request.batchId,
    batchTitle: r.batchTitle,
    batchMode: r.batchMode,
    classLevel: r.classLevel,
    studentId: r.request.studentId,
    studentName: r.studentName || "Student",
    studentEmail: r.studentEmail,
    studentPhone: r.studentPhone,
    status: r.request.status,
    note: r.request.note,
    requestedAt: r.request.createdAt.toISOString(),
    decidedAt: r.request.decidedAt ? r.request.decidedAt.toISOString() : null,
  }));
}

export async function saveBatchTimetable(
  user: AuthUser,
  batchId: string,
  slots: Array<{
    weekday: number;
    startTime: string;
    endTime: string;
    subjectId?: string | null;
    teacherId?: string | null;
    mode?: string;
    roomOrLinkNote?: string | null;
  }>,
  tx?: DatabaseExecutor
) {
  assert(isAdmin(user), "Only administrators can configure weekly timetables.");
  const d = tx || db;

  await d
    .delete(schema.batchTimetableSlots)
    .where(eq(schema.batchTimetableSlots.batchId, batchId));

  if (slots.length > 0) {
    await d.insert(schema.batchTimetableSlots).values(
      slots.map((s) => ({
        batchId,
        weekday: s.weekday,
        startTime: s.startTime,
        endTime: s.endTime,
        subjectId: s.subjectId || null,
        teacherId: s.teacherId || null,
        mode: s.mode || "offline",
        roomOrLinkNote: s.roomOrLinkNote || null,
      }))
    );
  }

  return { success: true, count: slots.length };
}
