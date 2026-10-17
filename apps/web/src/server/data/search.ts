import {
  db,
  schema,
  eq,
  and,
  or,
  ilike,
  sql,
  desc,
  ne,
  type DatabaseExecutor,
} from "@quick2learn/db";
import { slugify, classLevelToSlug } from "@quick2learn/shared";
import { formatDuration, formatViews, formatRelativeTime } from "./videos";

export interface SearchCatalogResult {
  lectures: Array<{
    id: string;
    title: string;
    description: string | null;
    durationSeconds: number;
    thumbnailUrl: string | null;
    classLevel: number | null;
    rank: number;
  }>;
  batches: Array<{
    id: string;
    slug: string;
    title: string;
    subtitle: string | null;
    classLevel: number;
    board: string;
    mode: string;
    rank: number;
  }>;
  chapters: Array<{
    id: string;
    slug: string;
    title: string;
    number: number;
    classLevel: number;
    board: string | null;
    subjectSlug: string | null;
    subjectName: string | null;
    rank: number;
  }>;
  query: string;
}

export interface ParsedSearchQuery {
  raw: string;
  tokens: string[];
  classLevel: number | null;
  board: "cbse" | "icse" | "isc" | null;
}

/**
 * Intelligent parser that extracts class levels, boards, subjects, and expands synonyms
 * (e.g. math -> maths, mathematics; chem -> chemistry; class 10 -> classLevel 10).
 */
export function parseSearchQuery(q: string): ParsedSearchQuery {
  const raw = q.trim().toLowerCase();

  // 1. Detect Class / Grade (supports 9-12, roman numerals IX-XII)
  let classLevel: number | null = null;
  const classMatch = raw.match(
    /\b(?:class|grade|std)?\s*(9|10|11|12|ix|x|xi|xii)(?:th)?\b/i,
  );
  if (classMatch && classMatch[1]) {
    const val = classMatch[1].toLowerCase();
    if (val === "9" || val === "ix") classLevel = 9;
    else if (val === "10" || val === "x") classLevel = 10;
    else if (val === "11" || val === "xi") classLevel = 11;
    else if (val === "12" || val === "xii") classLevel = 12;
  }

  // 2. Detect Board
  let board: "cbse" | "icse" | "isc" | null = null;
  if (/\bcbse\b/i.test(raw)) board = "cbse";
  else if (/\bicse\b/i.test(raw)) board = "icse";
  else if (/\bisc\b/i.test(raw)) board = "isc";

  // 3. Extract word tokens & expand synonyms
  const wordTokens = raw
    .split(/[\s,+/_\-:]+/)
    .map((w) => w.replace(/[^a-z0-9]/gi, "").trim())
    .filter((w) => w.length >= 2);

  const tokenSet = new Set<string>();
  tokenSet.add(raw);

  for (const w of wordTokens) {
    tokenSet.add(w);

    if (["math", "maths", "mathematics", "mathematical"].includes(w)) {
      tokenSet.add("math");
      tokenSet.add("maths");
      tokenSet.add("mathematics");
    } else if (["chem", "chemistry", "chemical"].includes(w)) {
      tokenSet.add("chem");
      tokenSet.add("chemistry");
    } else if (["phys", "physics", "physical"].includes(w)) {
      tokenSet.add("phys");
      tokenSet.add("physics");
    } else if (["bio", "biology", "biological"].includes(w)) {
      tokenSet.add("bio");
      tokenSet.add("biology");
    } else if (["sci", "science", "sciences"].includes(w)) {
      tokenSet.add("sci");
      tokenSet.add("science");
      tokenSet.add("chemistry");
      tokenSet.add("biology");
      tokenSet.add("physics");
    } else if (["calc", "calculus"].includes(w)) {
      tokenSet.add("calc");
      tokenSet.add("calculus");
    } else if (["trig", "trigo", "trigonometry", "trigonometric"].includes(w)) {
      tokenSet.add("trig");
      tokenSet.add("trigonometry");
      tokenSet.add("trigonometric");
    } else if (["integral", "integrals", "integration"].includes(w)) {
      tokenSet.add("integral");
      tokenSet.add("integrals");
      tokenSet.add("integration");
    } else if (["matrix", "matrices", "determinant", "determinants"].includes(w)) {
      tokenSet.add("matrices");
      tokenSet.add("matrix");
      tokenSet.add("determinants");
    } else if (["dinesh", "sir"].includes(w)) {
      tokenSet.add("dinesh");
    } else if (["namita", "maam", "mam"].includes(w)) {
      tokenSet.add("namita");
    } else if (["hindi", "sahitya", "sagar", "sakhi", "kabir"].includes(w)) {
      tokenSet.add("hindi");
      tokenSet.add("sakhi");
    }
  }

  // Remove common stop words unless they are the only token
  const stopWords = new Set(["the", "for", "and", "with", "from", "in", "of", "to", "class", "grade"]);
  const tokens = Array.from(tokenSet).filter((t) => !stopWords.has(t) && t.length >= 2);

  return {
    raw,
    tokens: tokens.length > 0 ? tokens : [raw],
    classLevel,
    board,
  };
}

/**
 * Fast search across lectures, batches, and chapters for typeahead and simple queries.
 */
export async function searchCatalog(
  q: string,
  tx?: DatabaseExecutor,
): Promise<SearchCatalogResult> {
  const trimmed = q.trim();
  if (!trimmed || trimmed.length < 2) {
    return { lectures: [], batches: [], chapters: [], query: trimmed };
  }

  const d = tx || db;
  const parsed = parseSearchQuery(trimmed);

  // 1. SEARCH LECTURES
  const lectureOrConditions = [
    sql`${schema.youtubeVideos.fts} @@ plainto_tsquery('simple', ${parsed.raw})`,
    ilike(schema.youtubeVideos.title, `%${parsed.raw}%`),
    ilike(schema.youtubeVideos.description, `%${parsed.raw}%`),
    ilike(schema.subjects.name, `%${parsed.raw}%`),
    ilike(schema.faculty.name, `%${parsed.raw}%`),
  ];

  for (const t of parsed.tokens) {
    lectureOrConditions.push(ilike(schema.youtubeVideos.title, `%${t}%`));
    lectureOrConditions.push(ilike(schema.youtubeVideos.description, `%${t}%`));
    lectureOrConditions.push(ilike(schema.subjects.name, `%${t}%`));
    lectureOrConditions.push(ilike(schema.faculty.name, `%${t}%`));
  }

  if (parsed.classLevel) {
    lectureOrConditions.push(eq(schema.youtubeVideos.classLevel, parsed.classLevel));
  }

  const lectureQuery = d
    .select({
      id: schema.youtubeVideos.id,
      title: schema.youtubeVideos.title,
      description: schema.youtubeVideos.description,
      durationSeconds: schema.youtubeVideos.durationSeconds,
      thumbnailUrl: schema.youtubeVideos.thumbnailUrl,
      classLevel: schema.youtubeVideos.classLevel,
      subjectName: schema.subjects.name,
      facultyName: schema.faculty.name,
    })
    .from(schema.youtubeVideos)
    .leftJoin(schema.subjects, eq(schema.youtubeVideos.subjectId, schema.subjects.id))
    .leftJoin(schema.faculty, eq(schema.youtubeVideos.facultyId, schema.faculty.id))
    .where(and(eq(schema.youtubeVideos.isPublished, true), or(...lectureOrConditions)))
    .limit(20);

  // 2. SEARCH BATCHES
  const batchOrConditions = [
    sql`${schema.batches.fts} @@ plainto_tsquery('simple', ${parsed.raw})`,
    ilike(schema.batches.title, `%${parsed.raw}%`),
    ilike(schema.batches.subtitle, `%${parsed.raw}%`),
    ilike(schema.batches.description, `%${parsed.raw}%`),
    ilike(schema.subjects.name, `%${parsed.raw}%`),
    ilike(schema.faculty.name, `%${parsed.raw}%`),
  ];

  for (const t of parsed.tokens) {
    batchOrConditions.push(ilike(schema.batches.title, `%${t}%`));
    batchOrConditions.push(ilike(schema.batches.subtitle, `%${t}%`));
    batchOrConditions.push(ilike(schema.batches.description, `%${t}%`));
    batchOrConditions.push(ilike(schema.subjects.name, `%${t}%`));
    batchOrConditions.push(ilike(schema.faculty.name, `%${t}%`));
  }

  if (parsed.classLevel) {
    batchOrConditions.push(eq(schema.batches.classLevel, parsed.classLevel));
  }
  if (parsed.board) {
    batchOrConditions.push(eq(schema.batches.board, parsed.board));
  }

  const batchQuery = d
    .select({
      id: schema.batches.id,
      slug: schema.batches.slug,
      title: schema.batches.title,
      subtitle: schema.batches.subtitle,
      description: schema.batches.description,
      classLevel: schema.batches.classLevel,
      board: schema.batches.board,
      mode: schema.batches.mode,
      subjectName: schema.subjects.name,
      facultyName: schema.faculty.name,
    })
    .from(schema.batches)
    .leftJoin(schema.subjects, eq(schema.batches.subjectId, schema.subjects.id))
    .leftJoin(schema.faculty, eq(schema.batches.facultyId, schema.faculty.id))
    .where(and(ne(schema.batches.status, "draft"), or(...batchOrConditions)))
    .limit(15);

  // 3. SEARCH CHAPTERS
  const chapterOrConditions = [
    sql`${schema.chapters.fts} @@ plainto_tsquery('simple', ${parsed.raw})`,
    ilike(schema.chapters.title, `%${parsed.raw}%`),
    ilike(schema.subjects.name, `%${parsed.raw}%`),
  ];

  for (const t of parsed.tokens) {
    chapterOrConditions.push(ilike(schema.chapters.title, `%${t}%`));
    chapterOrConditions.push(ilike(schema.subjects.name, `%${t}%`));
  }

  if (parsed.classLevel) {
    chapterOrConditions.push(eq(schema.chapters.classLevel, parsed.classLevel));
  }

  const chapterQuery = d
    .select({
      id: schema.chapters.id,
      slug: schema.chapters.slug,
      title: schema.chapters.title,
      number: schema.chapters.number,
      classLevel: schema.chapters.classLevel,
      board: schema.chapters.board,
      subjectSlug: schema.subjects.slug,
      subjectName: schema.subjects.name,
    })
    .from(schema.chapters)
    .leftJoin(schema.subjects, eq(schema.chapters.subjectId, schema.subjects.id))
    .where(or(...chapterOrConditions))
    .limit(15);

  const [rawLectures, rawBatches, rawChapters] = await Promise.all([
    lectureQuery,
    batchQuery,
    chapterQuery,
  ]);

  // Score & sort lectures
  const scoredLectures = rawLectures
    .map((lec) => {
      let score = 0;
      const t = lec.title.toLowerCase();
      const descText = (lec.description || "").toLowerCase();
      const sub = (lec.subjectName || "").toLowerCase();
      const fac = (lec.facultyName || "").toLowerCase();

      if (t.includes(parsed.raw)) score += 100;
      if (sub.includes(parsed.raw)) score += 60;
      if (fac.includes(parsed.raw)) score += 50;
      if (descText.includes(parsed.raw)) score += 20;

      if (parsed.classLevel && lec.classLevel === parsed.classLevel) {
        score += 40;
      }

      for (const token of parsed.tokens) {
        if (t.includes(token)) score += 25;
        if (sub.includes(token)) score += 20;
        if (fac.includes(token)) score += 15;
        if (descText.includes(token)) score += 5;
      }

      return {
        id: lec.id,
        title: lec.title,
        description: lec.description,
        durationSeconds: lec.durationSeconds,
        thumbnailUrl: lec.thumbnailUrl,
        classLevel: lec.classLevel,
        rank: score,
      };
    })
    .sort((a, b) => b.rank - a.rank)
    .slice(0, 5);

  // Score & sort batches
  const scoredBatches = rawBatches
    .map((b) => {
      let score = 0;
      const t = b.title.toLowerCase();
      const sub = (b.subtitle || "").toLowerCase();
      const subj = (b.subjectName || "").toLowerCase();
      const fac = (b.facultyName || "").toLowerCase();

      if (t.includes(parsed.raw)) score += 100;
      if (sub.includes(parsed.raw)) score += 70;
      if (subj.includes(parsed.raw)) score += 50;
      if (fac.includes(parsed.raw)) score += 40;

      if (parsed.classLevel && b.classLevel === parsed.classLevel) {
        score += 40;
      }
      if (parsed.board && b.board === parsed.board) {
        score += 30;
      }

      for (const token of parsed.tokens) {
        if (t.includes(token)) score += 25;
        if (sub.includes(token)) score += 20;
        if (subj.includes(token)) score += 15;
      }

      return {
        id: b.id,
        slug: b.slug,
        title: b.title,
        subtitle: b.subtitle,
        classLevel: b.classLevel,
        board: b.board,
        mode: b.mode,
        rank: score,
      };
    })
    .sort((a, b) => b.rank - a.rank)
    .slice(0, 3);

  // Score & sort chapters
  const scoredChapters = rawChapters
    .map((ch) => {
      let score = 0;
      const t = ch.title.toLowerCase();
      const subj = (ch.subjectName || "").toLowerCase();

      if (t.includes(parsed.raw)) score += 100;
      if (subj.includes(parsed.raw)) score += 50;

      if (parsed.classLevel && ch.classLevel === parsed.classLevel) {
        score += 40;
      }

      for (const token of parsed.tokens) {
        if (t.includes(token)) score += 25;
        if (subj.includes(token)) score += 15;
      }

      return {
        id: ch.id,
        slug: ch.slug,
        title: ch.title,
        number: ch.number,
        classLevel: ch.classLevel,
        board: ch.board,
        subjectSlug: ch.subjectSlug,
        subjectName: ch.subjectName,
        rank: score,
      };
    })
    .sort((a, b) => b.rank - a.rank)
    .slice(0, 3);

  return {
    lectures: scoredLectures,
    batches: scoredBatches,
    chapters: scoredChapters,
    query: trimmed,
  };
}

export interface AdvancedSearchParams {
  q?: string;
  classLevel?: number | null;
  board?: string | null;
  subjectSlug?: string | null;
  type?: "all" | "lecture" | "batch" | "notes";
  duration?: "all" | "under10" | "10to30" | "30plus";
  sort?: "relevance" | "newest" | "views";
  page?: number;
  pageSize?: number;
}

export interface SearchResultItem {
  id: string;
  type: "lecture" | "batch" | "notes";
  title: string;
  subtitle?: string | null;
  description?: string | null;
  classLevel?: number | null;
  board?: string | null;
  subjectName?: string | null;
  thumbnailUrl?: string | null;
  duration?: string | null;
  views?: string | null;
  publishedAt?: string | null;
  href: string;
  badgeText?: string | null;
  score?: number;
}

export interface AdvancedSearchResponse {
  items: SearchResultItem[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  query: string;
  activeFilters: {
    classLevel?: number | null;
    board?: string | null;
    subjectSlug?: string | null;
    type: "all" | "lecture" | "batch" | "notes";
    duration: "all" | "under10" | "10to30" | "30plus";
    sort: "relevance" | "newest" | "views";
  };
}

/**
 * Advanced multi-criteria search supporting Coursera-style filter rail and pagination.
 */
export async function searchCatalogAdvanced(
  params: AdvancedSearchParams,
  tx?: DatabaseExecutor,
): Promise<AdvancedSearchResponse> {
  const d = tx || db;
  const q = params.q?.trim() || "";
  const page = Math.max(1, params.page || 1);
  const pageSize = Math.max(1, Math.min(params.pageSize || 12, 50));
  const type = params.type || "all";
  const duration = params.duration || "all";
  const sort = params.sort || (q ? "relevance" : "newest");
  const hasQuery = q.length >= 2;

  const parsed = hasQuery ? parseSearchQuery(q) : null;
  const items: SearchResultItem[] = [];

  // 1. QUERY LECTURES
  if (type === "all" || type === "lecture") {
    const lectureConditions = [eq(schema.youtubeVideos.isPublished, true)];

    if (hasQuery && parsed) {
      const matchers = [
        sql`${schema.youtubeVideos.fts} @@ plainto_tsquery('simple', ${parsed.raw})`,
        ilike(schema.youtubeVideos.title, `%${parsed.raw}%`),
        ilike(schema.youtubeVideos.description, `%${parsed.raw}%`),
        ilike(schema.subjects.name, `%${parsed.raw}%`),
        ilike(schema.faculty.name, `%${parsed.raw}%`),
      ];
      for (const t of parsed.tokens) {
        matchers.push(ilike(schema.youtubeVideos.title, `%${t}%`));
        matchers.push(ilike(schema.youtubeVideos.description, `%${t}%`));
        matchers.push(ilike(schema.subjects.name, `%${t}%`));
        matchers.push(ilike(schema.faculty.name, `%${t}%`));
      }
      if (parsed.classLevel && !params.classLevel) {
        matchers.push(eq(schema.youtubeVideos.classLevel, parsed.classLevel));
      }
      lectureConditions.push(or(...matchers)!);
    }

    if (params.classLevel) {
      lectureConditions.push(eq(schema.youtubeVideos.classLevel, params.classLevel));
    }

    if (duration === "under10") {
      lectureConditions.push(sql`${schema.youtubeVideos.durationSeconds} < 600`);
    } else if (duration === "10to30") {
      lectureConditions.push(
        and(
          sql`${schema.youtubeVideos.durationSeconds} >= 600`,
          sql`${schema.youtubeVideos.durationSeconds} <= 1800`,
        )!,
      );
    } else if (duration === "30plus") {
      lectureConditions.push(sql`${schema.youtubeVideos.durationSeconds} > 1800`);
    }

    let lectureOrder = desc(schema.youtubeVideos.publishedAt);
    if (sort === "views") {
      lectureOrder = desc(schema.youtubeVideos.viewCount);
    }

    const lectureRows = await d
      .select({
        video: schema.youtubeVideos,
        subject: schema.subjects,
        faculty: schema.faculty,
      })
      .from(schema.youtubeVideos)
      .leftJoin(schema.subjects, eq(schema.youtubeVideos.subjectId, schema.subjects.id))
      .leftJoin(schema.faculty, eq(schema.youtubeVideos.facultyId, schema.faculty.id))
      .where(and(...lectureConditions))
      .orderBy(lectureOrder)
      .limit(type === "lecture" ? pageSize * 5 : 30);

    for (const r of lectureRows) {
      if (params.subjectSlug && r.subject?.slug !== params.subjectSlug) {
        continue;
      }

      const slug = slugify(r.video.title);
      let score = 0;
      if (parsed) {
        const t = r.video.title.toLowerCase();
        const descText = (r.video.description || "").toLowerCase();
        const sub = (r.subject?.name || "").toLowerCase();
        const fac = (r.faculty?.name || "").toLowerCase();

        if (t.includes(parsed.raw)) score += 100;
        if (sub.includes(parsed.raw)) score += 60;
        if (fac.includes(parsed.raw)) score += 50;
        if (descText.includes(parsed.raw)) score += 20;

        if (parsed.classLevel && r.video.classLevel === parsed.classLevel) score += 40;

        for (const token of parsed.tokens) {
          if (t.includes(token)) score += 25;
          if (sub.includes(token)) score += 20;
          if (fac.includes(token)) score += 15;
          if (descText.includes(token)) score += 5;
        }
      }

      items.push({
        id: r.video.id,
        type: "lecture",
        title: r.video.title,
        description: r.video.description,
        classLevel: r.video.classLevel,
        subjectName: r.subject?.name || "Mathematics",
        thumbnailUrl:
          r.video.thumbnailUrl ||
          `https://img.youtube.com/vi/${r.video.id}/hqdefault.jpg`,
        duration: formatDuration(r.video.durationSeconds),
        views: formatViews(r.video.viewCount),
        publishedAt: formatRelativeTime(r.video.publishedAt),
        href: `/lecture/${r.video.id}/${slug}`,
        badgeText: r.video.isShort ? "Short" : "Lecture",
        score,
      });
    }
  }

  // 2. QUERY BATCHES
  if ((type === "all" || type === "batch") && duration === "all") {
    const batchConditions = [ne(schema.batches.status, "draft")];

    if (hasQuery && parsed) {
      const matchers = [
        sql`${schema.batches.fts} @@ plainto_tsquery('simple', ${parsed.raw})`,
        ilike(schema.batches.title, `%${parsed.raw}%`),
        ilike(schema.batches.subtitle, `%${parsed.raw}%`),
        ilike(schema.batches.description, `%${parsed.raw}%`),
        ilike(schema.subjects.name, `%${parsed.raw}%`),
        ilike(schema.faculty.name, `%${parsed.raw}%`),
      ];
      for (const t of parsed.tokens) {
        matchers.push(ilike(schema.batches.title, `%${t}%`));
        matchers.push(ilike(schema.batches.subtitle, `%${t}%`));
        matchers.push(ilike(schema.batches.description, `%${t}%`));
        matchers.push(ilike(schema.subjects.name, `%${t}%`));
        matchers.push(ilike(schema.faculty.name, `%${t}%`));
      }
      if (parsed.classLevel && !params.classLevel) {
        matchers.push(eq(schema.batches.classLevel, parsed.classLevel));
      }
      if (parsed.board && !params.board) {
        matchers.push(eq(schema.batches.board, parsed.board));
      }
      batchConditions.push(or(...matchers)!);
    }

    if (params.classLevel) {
      batchConditions.push(eq(schema.batches.classLevel, params.classLevel));
    }
    if (params.board) {
      batchConditions.push(eq(schema.batches.board, params.board as schema.Board));
    }

    const batchRows = await d
      .select({
        batch: schema.batches,
        subject: schema.subjects,
        faculty: schema.faculty,
      })
      .from(schema.batches)
      .leftJoin(schema.subjects, eq(schema.batches.subjectId, schema.subjects.id))
      .leftJoin(schema.faculty, eq(schema.batches.facultyId, schema.faculty.id))
      .where(and(...batchConditions))
      .orderBy(desc(schema.batches.createdAt))
      .limit(type === "batch" ? pageSize * 5 : 15);

    for (const r of batchRows) {
      if (params.subjectSlug && r.subject?.slug !== params.subjectSlug) {
        continue;
      }

      let score = 0;
      if (parsed) {
        const t = r.batch.title.toLowerCase();
        const sub = (r.batch.subtitle || "").toLowerCase();
        const subj = (r.subject?.name || "").toLowerCase();
        const fac = (r.faculty?.name || "").toLowerCase();

        if (t.includes(parsed.raw)) score += 100;
        if (sub.includes(parsed.raw)) score += 70;
        if (subj.includes(parsed.raw)) score += 50;
        if (fac.includes(parsed.raw)) score += 40;

        if (parsed.classLevel && r.batch.classLevel === parsed.classLevel) score += 40;
        if (parsed.board && r.batch.board === parsed.board) score += 30;

        for (const token of parsed.tokens) {
          if (t.includes(token)) score += 25;
          if (sub.includes(token)) score += 20;
          if (subj.includes(token)) score += 15;
        }
      }

      items.push({
        id: r.batch.id,
        type: "batch",
        title: r.batch.title,
        subtitle: r.batch.subtitle,
        description: r.batch.description,
        classLevel: r.batch.classLevel,
        board: r.batch.board,
        subjectName: r.subject?.name,
        href: `/batches/${r.batch.slug}`,
        badgeText: `${r.batch.mode.toUpperCase()} BATCH`,
        score,
      });
    }
  }

  // 3. QUERY PUBLIC RESOURCES (NOTES)
  if ((type === "all" || type === "notes") && duration === "all") {
    const resourceConditions = [eq(schema.resources.visibility, "public")];

    if (hasQuery && parsed) {
      const matchers = [
        ilike(schema.resources.title, `%${parsed.raw}%`),
        ilike(schema.chapters.title, `%${parsed.raw}%`),
        ilike(schema.subjects.name, `%${parsed.raw}%`),
      ];
      for (const t of parsed.tokens) {
        matchers.push(ilike(schema.resources.title, `%${t}%`));
        matchers.push(ilike(schema.chapters.title, `%${t}%`));
        matchers.push(ilike(schema.subjects.name, `%${t}%`));
      }
      if (parsed.classLevel && !params.classLevel) {
        matchers.push(eq(schema.chapters.classLevel, parsed.classLevel));
      }
      resourceConditions.push(or(...matchers)!);
    }

    const resourceRows = await d
      .select({
        resource: schema.resources,
        chapter: schema.chapters,
        subject: schema.subjects,
      })
      .from(schema.resources)
      .leftJoin(schema.chapters, eq(schema.resources.chapterId, schema.chapters.id))
      .leftJoin(schema.subjects, eq(schema.chapters.subjectId, schema.subjects.id))
      .where(and(...resourceConditions))
      .orderBy(desc(schema.resources.createdAt))
      .limit(type === "notes" ? pageSize * 5 : 15);

    for (const r of resourceRows) {
      if (params.classLevel && r.chapter?.classLevel !== params.classLevel) {
        continue;
      }
      if (params.subjectSlug && r.subject?.slug !== params.subjectSlug) {
        continue;
      }

      const clsSlug = r.chapter?.classLevel ? classLevelToSlug(r.chapter.classLevel) : "xii";
      const subSlug = r.subject?.slug || "mathematics";
      const chSlug = r.chapter?.slug || "curriculum";

      let score = 0;
      if (parsed) {
        const t = r.resource.title.toLowerCase();
        const ch = (r.chapter?.title || "").toLowerCase();
        const sub = (r.subject?.name || "").toLowerCase();

        if (t.includes(parsed.raw)) score += 100;
        if (ch.includes(parsed.raw)) score += 60;
        if (sub.includes(parsed.raw)) score += 40;

        for (const token of parsed.tokens) {
          if (t.includes(token)) score += 25;
          if (ch.includes(token)) score += 15;
        }
      }

      items.push({
        id: r.resource.id,
        type: "notes",
        title: r.resource.title,
        subtitle: r.chapter?.title ? `Chapter: ${r.chapter.title}` : undefined,
        description: `Official free study resource (${r.resource.type.toUpperCase()}) for Quick2Learn students.`,
        classLevel: r.chapter?.classLevel,
        subjectName: r.subject?.name,
        href: `/learn/${clsSlug}/${subSlug}/${chSlug}`,
        badgeText: r.resource.type.toUpperCase(),
        score,
      });
    }
  }

  // Sort aggregated items by relevance score if requested
  if (sort === "relevance" && hasQuery) {
    items.sort((a, b) => (b.score || 0) - (a.score || 0));
  }

  // Paginate aggregated items
  const totalCount = items.length;
  const totalPages = Math.ceil(totalCount / pageSize) || 1;
  const startIndex = (page - 1) * pageSize;
  const paginatedItems = items.slice(startIndex, startIndex + pageSize);

  return {
    items: paginatedItems,
    totalCount,
    totalPages,
    currentPage: page,
    query: q,
    activeFilters: {
      classLevel: params.classLevel,
      board: params.board,
      subjectSlug: params.subjectSlug,
      type,
      duration,
      sort,
    },
  };
}
