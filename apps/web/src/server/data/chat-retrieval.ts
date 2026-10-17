import { db, schema, eq, and, or, sql, desc, type DatabaseExecutor } from "@quick2learn/db";
import { slugify } from "@quick2learn/shared";
import { formatDuration, formatViews } from "./videos";

export interface ChatVideoCard {
  id: string;
  title: string;
  thumbnailUrl: string;
  duration: string;
  gradeAndSubject: string;
  faculty: string;
  rating: string;
  views: string;
  href: string;
}

export interface ChatBatchCard {
  id: string;
  slug: string;
  title: string;
  grade: string;
  board: string;
  mode: string;
  facultyName: string;
  schedule: string;
  href: string;
}

export interface ChatRetrievalResult {
  videos: ChatVideoCard[];
  batches: ChatBatchCard[];
  contextSummary: string;
}

/**
 * Searches the database for videos and batches matching keywords in the user's message.
 */
export async function retrieveChatContext(
  userQuery: string,
  tx?: DatabaseExecutor,
): Promise<ChatRetrievalResult> {
  const d = tx || db;
  const q = userQuery.toLowerCase().trim();

  // Extract key concept terms (supports Unicode / Indian scripts)
  const terms = q
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((w) => w.length > 1);

  // Map common Hindi/regional academic terms to English domain terms so DB search finds lectures
  const regionalTermMappings: Record<string, string[]> = {
    आव्यूह: ["matrix", "matrices"],
    मैट्रिक्स: ["matrix", "matrices"],
    मॅट्रिक्स: ["matrix", "matrices"],
    सारणिक: ["determinant", "determinants"],
    डिटरमिनेंट: ["determinant", "determinants"],
    समाकलन: ["integral", "integrals", "integration"],
    इंटीग्रल: ["integral", "integrals"],
    अवकलन: ["derivative", "derivatives", "differentiation"],
    डिफरेंशिएशन: ["differentiation", "derivative"],
    कलन: ["calculus"],
    कैलकुलस: ["calculus"],
    त्रिकोणमिति: ["trigonometry"],
    संबंध: ["relation"],
    फलन: ["function"],
    सदिश: ["vector"],
    प्रायिकता: ["probability"],
    रसायन: ["chemistry"],
    जीव: ["biology"],
    भौतिकी: ["physics"],
    इतिहास: ["history"],
    नागरिक: ["civics"],
    नागरिकशास्त्र: ["civics"],
    हड़प्पा: ["harappan", "indus valley"],
    सिंधु: ["indus"],
    वैदिक: ["vedic"],
    मौर्य: ["mauryan", "maurya"],
    गुप्त: ["gupta", "guptas"],
    संविधान: ["constitution"],
  };

  for (const [term, mapped] of Object.entries(regionalTermMappings)) {
    if (q.includes(term)) {
      terms.push(...mapped);
    }
  }

  const isClass12 = /12|twelfth|xii|१२|बारहवीं|बारावी/.test(q);
  const isClass11 = /11|eleventh|xi|११|ग्यारहवीं|अकरावी/.test(q);
  const isClass10 = /10|tenth|x\b|१०|दसवीं|दहावी/.test(q);
  const isClass9 = /9|ninth|ix\b|९|नौवीं|नववी/.test(q);
  const isBatchQuery = /batch|fee|admission|enroll|offline|online|class|join|timing|schedule|बैच|फीस|प्रवेश|दाखिला|बॅच/.test(q);

  // 1. Video Search
  let matchedVideos: Array<{
    video: typeof schema.youtubeVideos.$inferSelect;
    facultyName: string | null;
    subjectName: string | null;
  }> = [];

  try {
    // Build search conditions
    const videoConditions = [eq(schema.youtubeVideos.isPublished, true)];

    if (terms.length > 0) {
      const orClauses = terms.map(
        (t) =>
          sql`(${schema.youtubeVideos.title} ILIKE ${`%${t}%`} OR coalesce(${schema.youtubeVideos.description}, '') ILIKE ${`%${t}%`})`,
      );
      videoConditions.push(or(...orClauses)!);
    }

    if (isClass12) videoConditions.push(eq(schema.youtubeVideos.classLevel, 12));
    else if (isClass11) videoConditions.push(eq(schema.youtubeVideos.classLevel, 11));
    else if (isClass10) videoConditions.push(eq(schema.youtubeVideos.classLevel, 10));
    else if (isClass9) videoConditions.push(eq(schema.youtubeVideos.classLevel, 9));

    matchedVideos = await d
      .select({
        video: schema.youtubeVideos,
        facultyName: schema.faculty.name,
        subjectName: schema.subjects.name,
      })
      .from(schema.youtubeVideos)
      .leftJoin(schema.faculty, eq(schema.youtubeVideos.facultyId, schema.faculty.id))
      .leftJoin(schema.subjects, eq(schema.youtubeVideos.subjectId, schema.subjects.id))
      .where(and(...videoConditions))
      .orderBy(desc(schema.youtubeVideos.viewCount))
      .limit(6);

    // Fallback: If no exact search match, fetch top popular/featured videos
    if (matchedVideos.length === 0) {
      matchedVideos = await d
        .select({
          video: schema.youtubeVideos,
          facultyName: schema.faculty.name,
          subjectName: schema.subjects.name,
        })
        .from(schema.youtubeVideos)
        .leftJoin(schema.faculty, eq(schema.youtubeVideos.facultyId, schema.faculty.id))
        .leftJoin(schema.subjects, eq(schema.youtubeVideos.subjectId, schema.subjects.id))
        .where(eq(schema.youtubeVideos.isPublished, true))
        .orderBy(desc(schema.youtubeVideos.viewCount))
        .limit(4);
    }
  } catch (err) {
    console.error("Chat retrieval video error:", err);
  }

  // 2. Batch Search
  let matchedBatches: Array<{
    batch: typeof schema.batches.$inferSelect;
    facultyName: string | null;
    subjectName: string | null;
  }> = [];

  try {
    const batchConditions = [eq(schema.batches.status, "open")];

    if (isClass12) batchConditions.push(eq(schema.batches.classLevel, 12));
    else if (isClass11) batchConditions.push(eq(schema.batches.classLevel, 11));
    else if (isClass10) batchConditions.push(eq(schema.batches.classLevel, 10));
    else if (isClass9) batchConditions.push(eq(schema.batches.classLevel, 9));

    matchedBatches = await d
      .select({
        batch: schema.batches,
        facultyName: schema.faculty.name,
        subjectName: schema.subjects.name,
      })
      .from(schema.batches)
      .leftJoin(schema.faculty, eq(schema.batches.facultyId, schema.faculty.id))
      .leftJoin(schema.subjects, eq(schema.batches.subjectId, schema.subjects.id))
      .where(and(...batchConditions))
      .orderBy(desc(schema.batches.isFeatured), desc(schema.batches.createdAt))
      .limit(3);

    // If still empty or query wasn't class-specific, grab open featured batches
    if (matchedBatches.length === 0) {
      matchedBatches = await d
        .select({
          batch: schema.batches,
          facultyName: schema.faculty.name,
          subjectName: schema.subjects.name,
        })
        .from(schema.batches)
        .leftJoin(schema.faculty, eq(schema.batches.facultyId, schema.faculty.id))
        .leftJoin(schema.subjects, eq(schema.batches.subjectId, schema.subjects.id))
        .where(eq(schema.batches.status, "open"))
        .orderBy(desc(schema.batches.isFeatured))
        .limit(2);
    }
  } catch (err) {
    console.error("Chat retrieval batch error:", err);
  }

  // Format Video Cards
  const videoCards: ChatVideoCard[] = matchedVideos.map((item, index) => {
    const v = item.video;
    const classStr = v.classLevel
      ? `Class ${v.classLevel === 12 ? "XII" : v.classLevel === 11 ? "XI" : v.classLevel === 10 ? "X" : "IX"}`
      : "Class XII";
    const subStr = item.subjectName || "Mathematics";
    const slug = slugify(v.title);
    const faculty = item.facultyName || (subStr === "Mathematics" ? "Dinesh Singh Rajput" : "Namita Singh Rajput");
    const rating = (4.8 + (index % 3) * 0.1).toFixed(1);

    return {
      id: v.id,
      title: v.title,
      thumbnailUrl:
        v.thumbnailUrl ||
        `https://img.youtube.com/vi/${v.id}/hqdefault.jpg`,
      duration: formatDuration(v.durationSeconds),
      gradeAndSubject: `${classStr} · ${subStr}`,
      faculty: faculty.includes("Dinesh")
        ? "Dinesh Sir (Senior Faculty)"
        : faculty.includes("Namita")
          ? "Namita Ma'am (ICSE Specialist)"
          : faculty,
      rating,
      views: formatViews(v.viewCount),
      href: `/lecture/${v.id}/${slug}`,
    };
  });

  // Format Batch Cards
  const batchCards: ChatBatchCard[] = matchedBatches.map((item) => {
    const b = item.batch;
    const grade = `Class ${b.classLevel === 12 ? "XII" : b.classLevel === 11 ? "XI" : b.classLevel === 10 ? "X" : "IX"}`;
    return {
      id: b.id,
      slug: b.slug,
      title: b.title,
      grade,
      board: b.board.toUpperCase(),
      mode: b.mode === "offline" ? "Offline (Mathura)" : b.mode === "online" ? "Live Online" : "Hybrid",
      facultyName: item.facultyName || "Senior Faculty",
      schedule: b.scheduleText,
      href: `/batches/${b.slug}`,
    };
  });

  // Context summary to feed to the LLM
  const contextParts: string[] = [];
  if (videoCards.length > 0) {
    contextParts.push(
      "AVAILABLE MATCHING VIDEO LECTURES ON QUICK2LEARN:\n" +
        videoCards
          .map(
            (c, i) =>
              `${i + 1}. "${c.title}" by ${c.faculty} (${c.gradeAndSubject}, Duration: ${c.duration}, Link: ${c.href})`,
          )
          .join("\n"),
    );
  }
  if (batchCards.length > 0 && isBatchQuery) {
    contextParts.push(
      "AVAILABLE CLASSROOM BATCHES ON QUICK2LEARN:\n" +
        batchCards
          .map(
            (b, i) =>
              `${i + 1}. "${b.title}" (${b.grade} ${b.board}, Mode: ${b.mode}, Faculty: ${b.facultyName}, Schedule: ${b.schedule}, Link: ${b.href})`,
          )
          .join("\n"),
    );
  }

  return {
    videos: videoCards,
    batches: isBatchQuery ? batchCards : [],
    contextSummary: contextParts.join("\n\n"),
  };
}
