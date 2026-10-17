import {
  db,
  schema,
  eq,
  and,
  sql,
  desc,
  asc,
  ne,
  type DatabaseExecutor,
} from "@quick2learn/db";
import { assert, isAdmin, isStaff, type AuthUser } from "../authz";
import { formatClassRoman, classLevelToSlug } from "@quick2learn/shared";

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
