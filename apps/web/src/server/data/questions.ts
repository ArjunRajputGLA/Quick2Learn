import { db, schema, eq, and, desc, sql, ilike } from "@quick2learn/db";
import { NotFoundError } from "@/server/authz";
import type { CreateQuestionInput } from "@quick2learn/shared";

export interface QuestionFilterParams {
  classLevel?: number;
  subjectId?: string;
  chapterId?: string;
  type?: string;
  difficulty?: string;
  source?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

/**
 * Lists questions from the question bank with rich filtering.
 */
export async function getQuestions(filters: QuestionFilterParams = {}) {
  const conditions = [eq(schema.questions.isActive, true)];

  if (filters.classLevel) {
    conditions.push(eq(schema.questions.classLevel, filters.classLevel));
  }
  if (filters.subjectId) {
    conditions.push(eq(schema.questions.subjectId, filters.subjectId));
  }
  if (filters.chapterId) {
    conditions.push(eq(schema.questions.chapterId, filters.chapterId));
  }
  if (filters.type) {
    conditions.push(eq(schema.questions.type, filters.type as any));
  }
  if (filters.difficulty) {
    conditions.push(eq(schema.questions.difficulty, filters.difficulty as any));
  }
  if (filters.source) {
    conditions.push(ilike(schema.questions.source, `%${filters.source}%`));
  }
  if (filters.search) {
    conditions.push(ilike(schema.questions.stem, `%${filters.search}%`));
  }

  const query = db
    .select({
      id: schema.questions.id,
      subjectId: schema.questions.subjectId,
      subjectName: schema.subjects.name,
      chapterId: schema.questions.chapterId,
      chapterTitle: schema.chapters.title,
      classLevel: schema.questions.classLevel,
      type: schema.questions.type,
      stem: schema.questions.stem,
      imageKey: schema.questions.imageKey,
      options: schema.questions.options,
      correct: schema.questions.correct,
      solution: schema.questions.solution,
      difficulty: schema.questions.difficulty,
      marks: schema.questions.marks,
      negativeMarks: schema.questions.negativeMarks,
      tags: schema.questions.tags,
      source: schema.questions.source,
      competency: schema.questions.competency,
      caseGroupId: schema.questions.caseGroupId,
      caseGroupPassage: schema.caseGroups.passage,
      caseGroupImageKey: schema.caseGroups.imageKey,
      isActive: schema.questions.isActive,
      createdAt: schema.questions.createdAt,
    })
    .from(schema.questions)
    .innerJoin(schema.subjects, eq(schema.questions.subjectId, schema.subjects.id))
    .leftJoin(schema.chapters, eq(schema.questions.chapterId, schema.chapters.id))
    .leftJoin(schema.caseGroups, eq(schema.questions.caseGroupId, schema.caseGroups.id))
    .where(and(...conditions))
    .orderBy(desc(schema.questions.createdAt));

  if (filters.limit) {
    query.limit(filters.limit);
  }
  if (filters.offset) {
    query.offset(filters.offset);
  }

  const rows = await query;

  return rows.map((r) => ({
    id: r.id,
    subjectId: r.subjectId,
    subjectName: r.subjectName,
    chapterId: r.chapterId,
    chapterTitle: r.chapterTitle ?? undefined,
    classLevel: r.classLevel,
    type: r.type,
    stem: r.stem,
    imageKey: r.imageKey,
    options: r.options,
    correct: r.correct,
    solution: r.solution,
    difficulty: r.difficulty,
    marks: Number(r.marks),
    negativeMarks: Number(r.negativeMarks),
    tags: r.tags,
    source: r.source,
    competency: r.competency,
    caseGroupId: r.caseGroupId,
    caseGroup: r.caseGroupId
      ? {
          id: r.caseGroupId,
          passage: r.caseGroupPassage ?? "",
          imageKey: r.caseGroupImageKey ?? null,
        }
      : null,
    isActive: r.isActive,
    createdAt: r.createdAt.toISOString(),
  }));
}

/**
 * Checks for duplicate question stems within the same subject and class.
 */
export async function checkDuplicateQuestion(
  subjectId: string,
  classLevel: number,
  stem: string,
  excludeId?: string
) {
  const normalized = stem.trim().toLowerCase();
  const existing = await db
    .select({ id: schema.questions.id, stem: schema.questions.stem })
    .from(schema.questions)
    .where(
      and(
        eq(schema.questions.subjectId, subjectId),
        eq(schema.questions.classLevel, classLevel),
        eq(schema.questions.isActive, true)
      )
    )
    .limit(200);

  const matched = existing.find((q) => {
    if (excludeId && q.id === excludeId) return false;
    const qNorm = q.stem.trim().toLowerCase();
    return qNorm === normalized || (qNorm.length > 20 && normalized.includes(qNorm.slice(0, 40)));
  });

  return matched ? { isDuplicate: true, existingId: matched.id, existingStem: matched.stem } : { isDuplicate: false };
}

/**
 * Creates a single question in the question bank.
 */
export async function createQuestion(data: CreateQuestionInput, userId: string) {
  let caseGroupId = data.caseGroupId;

  if (!caseGroupId && data.passageText && data.passageText.trim()) {
    const [cg] = await db
      .insert(schema.caseGroups)
      .values({
        passage: data.passageText.trim(),
      })
      .returning();
    if (cg) {
      caseGroupId = cg.id;
    }
  }

  const cleanOptions = data.options
    ? data.options.map((opt) => ({
        id: opt.id,
        text: opt.text,
        ...(opt.imageKey ? { imageKey: opt.imageKey } : {}),
      }))
    : null;

  const [question] = await db
    .insert(schema.questions)
    .values({
      subjectId: data.subjectId,
      chapterId: data.chapterId ?? null,
      classLevel: data.classLevel,
      type: data.type,
      stem: data.stem,
      imageKey: data.imageKey ?? null,
      options: cleanOptions,
      correct: data.correct,
      solution: data.solution ?? null,
      difficulty: data.difficulty,
      marks: (data.marks !== undefined && data.marks !== null ? data.marks : 1).toFixed(2),
      negativeMarks: (data.negativeMarks !== undefined && data.negativeMarks !== null ? data.negativeMarks : 0).toFixed(2),
      tags: data.tags ?? [],
      source: data.source ?? null,
      competency: data.competency ?? null,
      caseGroupId: caseGroupId ?? null,
      createdBy: userId,
    })
    .returning();

  return question;
}

/**
 * Updates an existing question.
 */
export async function updateQuestion(id: string, data: Partial<CreateQuestionInput>, _userId: string) {
  const [existing] = await db
    .select()
    .from(schema.questions)
    .where(eq(schema.questions.id, id))
    .limit(1);

  if (!existing) {
    throw new NotFoundError("Question not found");
  }

  let caseGroupId = data.caseGroupId !== undefined ? data.caseGroupId : existing.caseGroupId;

  if (data.passageText && data.passageText.trim()) {
    if (caseGroupId) {
      await db
        .update(schema.caseGroups)
        .set({ passage: data.passageText.trim(), updatedAt: sql`timezone('utc'::text, now())` })
        .where(eq(schema.caseGroups.id, caseGroupId));
    } else {
      const [cg] = await db
        .insert(schema.caseGroups)
        .values({ passage: data.passageText.trim() })
        .returning();
      if (cg) {
        caseGroupId = cg.id;
      }
    }
  }

  const updateValues: Record<string, any> = {
    updatedAt: sql`timezone('utc'::text, now())`,
  };

  if (data.subjectId) updateValues.subjectId = data.subjectId;
  if (data.chapterId !== undefined) updateValues.chapterId = data.chapterId;
  if (data.classLevel !== undefined) updateValues.classLevel = data.classLevel;
  if (data.type) updateValues.type = data.type;
  if (data.stem !== undefined) updateValues.stem = data.stem;
  if (data.imageKey !== undefined) updateValues.imageKey = data.imageKey;
  if (data.options !== undefined) updateValues.options = data.options;
  if (data.correct !== undefined) updateValues.correct = data.correct;
  if (data.solution !== undefined) updateValues.solution = data.solution;
  if (data.difficulty) updateValues.difficulty = data.difficulty;
  if (data.marks !== undefined) updateValues.marks = data.marks.toFixed(2);
  if (data.negativeMarks !== undefined) updateValues.negativeMarks = data.negativeMarks.toFixed(2);
  if (data.tags !== undefined) updateValues.tags = data.tags;
  if (data.source !== undefined) updateValues.source = data.source;
  if (data.competency !== undefined) updateValues.competency = data.competency;
  updateValues.caseGroupId = caseGroupId;

  const [updated] = await db
    .update(schema.questions)
    .set(updateValues)
    .where(eq(schema.questions.id, id))
    .returning();

  return updated;
}

/**
 * Soft deletes a question.
 */
export async function deleteQuestion(id: string) {
  const [updated] = await db
    .update(schema.questions)
    .set({ isActive: false, updatedAt: sql`timezone('utc'::text, now())` })
    .where(eq(schema.questions.id, id))
    .returning();

  return updated;
}

export interface ImportPreviewRow {
  rowIndex: number;
  classLevel: number;
  subjectName: string;
  subjectId: string | null;
  chapterNo: number | null;
  chapterId: string | null;
  type: string;
  stem: string;
  options: Array<{ id: string; text: string }>;
  correct: any;
  solution: string | null;
  difficulty: "easy" | "medium" | "hard";
  marks: number;
  negativeMarks: number;
  tags: string[];
  source: string | null;
  competency: string | null;
  caseGroup: string | null;
  passage: string | null;
  errors: string[];
}

/**
 * Validates and parses raw rows imported from XLSX or CSV.
 * Preserves LaTeX equations verbatim.
 */
export async function parseAndValidateImportRows(rawRows: Array<Record<string, any>>) {
  // Load lookup subjects and chapters
  const allSubjects = await db.select().from(schema.subjects);
  const allChapters = await db.select().from(schema.chapters);

  const previewRows: ImportPreviewRow[] = [];
  const validTypes = ["mcq_single", "mcq_multi", "assertion_reason", "case_study", "numeric", "true_false"];
  const validDifficulties = ["easy", "medium", "hard"];

  for (let i = 0; i < rawRows.length; i++) {
    const row = rawRows[i];
    if (!row) continue;
    const errors: string[] = [];

    // Parse class level
    const classRaw = String(row.class || row.Class || row.class_level || "").trim();
    const classNum = parseInt(classRaw.replace(/[^0-9]/g, ""), 10);
    if (isNaN(classNum) || classNum < 9 || classNum > 12) {
      errors.push(`Class must be 9, 10, 11, or 12 (got "${classRaw}")`);
    }

    // Match subject
    const subjectRaw = String(row.subject || row.Subject || "").trim().toLowerCase();
    const matchedSubject = allSubjects.find(
      (s) =>
        s.name.toLowerCase() === subjectRaw ||
        s.slug.toLowerCase() === subjectRaw ||
        (subjectRaw.includes("math") && s.name.toLowerCase().includes("math")) ||
        (subjectRaw.includes("science") && s.name.toLowerCase().includes("science")) ||
        (subjectRaw.includes("chem") && s.name.toLowerCase().includes("chem")) ||
        (subjectRaw.includes("bio") && s.name.toLowerCase().includes("bio"))
    );
    if (!matchedSubject) {
      errors.push(`Subject "${row.subject}" not found in system`);
    }

    // Match chapter (optional)
    let matchedChapter: (typeof allChapters)[number] | undefined;
    const chapterNoRaw = row.chapter_no || row.chapter || row.Chapter || row.chapter_number;
    if (chapterNoRaw !== undefined && chapterNoRaw !== null && String(chapterNoRaw).trim() !== "") {
      const chNum = parseInt(String(chapterNoRaw), 10);
      if (!isNaN(chNum) && matchedSubject && !isNaN(classNum)) {
        matchedChapter = allChapters.find(
          (c) => c.subjectId === matchedSubject.id && c.classLevel === classNum && c.number === chNum
        );
      }
    }

    // Parse question type
    let qType = String(row.type || row.Type || "mcq_single").trim().toLowerCase().replace(/-/g, "_");
    if (!validTypes.includes(qType)) {
      if (qType.includes("assert") || qType.includes("reason")) {
        qType = "assertion_reason";
      } else if (qType.includes("case")) {
        qType = "case_study";
      } else if (qType.includes("num")) {
        qType = "numeric";
      } else if (qType.includes("true") || qType.includes("false") || qType === "tf") {
        qType = "true_false";
      } else if (qType.includes("multi")) {
        qType = "mcq_multi";
      } else {
        qType = "mcq_single";
      }
    }

    // Stem (keep LaTeX exactly as typed)
    const stem = String(row.stem || row.question || row.Question || "").trim();
    if (!stem) {
      errors.push("Question stem is required");
    }

    // Options (keep LaTeX exactly as typed)
    const options: Array<{ id: string; text: string }> = [];
    const optA = row.option_a ?? row.optionA ?? row.A ?? row.a;
    const optB = row.option_b ?? row.optionB ?? row.B ?? row.b;
    const optC = row.option_c ?? row.optionC ?? row.C ?? row.c;
    const optD = row.option_d ?? row.optionD ?? row.D ?? row.d;

    if (optA !== undefined && optA !== null && String(optA).trim() !== "") {
      options.push({ id: "a", text: String(optA).trim() });
    }
    if (optB !== undefined && optB !== null && String(optB).trim() !== "") {
      options.push({ id: "b", text: String(optB).trim() });
    }
    if (optC !== undefined && optC !== null && String(optC).trim() !== "") {
      options.push({ id: "c", text: String(optC).trim() });
    }
    if (optD !== undefined && optD !== null && String(optD).trim() !== "") {
      options.push({ id: "d", text: String(optD).trim() });
    }

    // Correct answer
    let correctRaw = row.correct ?? row.Correct ?? row.answer ?? row.Answer;
    let correctParsed: any = "";
    if (correctRaw === undefined || correctRaw === null || String(correctRaw).trim() === "") {
      errors.push("Correct answer is required");
    } else {
      const correctStr = String(correctRaw).trim();
      if (qType === "mcq_single" || qType === "assertion_reason" || qType === "case_study") {
        const lower = correctStr.toLowerCase();
        correctParsed = lower.length === 1 ? lower : lower.startsWith("opt") ? lower.replace("option", "").trim() : lower;
        if (options.length > 0 && !options.some((o) => o.id === correctParsed)) {
          // If sir wrote the full text or choice number 1-4
          const numericIndex = parseInt(correctParsed, 10);
          const indexedOpt = !isNaN(numericIndex) && numericIndex >= 1 && numericIndex <= options.length ? options[numericIndex - 1] : undefined;
          if (indexedOpt) {
            correctParsed = indexedOpt.id;
          } else {
            const matchedOpt = options.find((o) => o.text.trim().toLowerCase() === correctStr.toLowerCase());
            if (matchedOpt) {
              correctParsed = matchedOpt.id;
            } else {
              errors.push(`Correct answer "${correctStr}" does not match option IDs (a, b, c, d)`);
            }
          }
        }
      } else if (qType === "mcq_multi") {
        correctParsed = correctStr
          .split(/[,;/ ]+/)
          .map((s) => s.trim().toLowerCase())
          .filter(Boolean);
      } else if (qType === "true_false") {
        const lower = correctStr.toLowerCase();
        correctParsed = lower === "t" || lower === "true" || lower === "1" ? "true" : "false";
      } else {
        correctParsed = correctStr;
      }
    }

    // Difficulty
    let diff = String(row.difficulty || row.Difficulty || "medium").trim().toLowerCase();
    if (!validDifficulties.includes(diff)) {
      diff = "medium";
    }

    // Marks & Negative Marks
    const marksRaw = row.marks ?? row.Marks ?? 1;
    const marksNum = parseFloat(String(marksRaw)) || 1;
    const negMarksRaw = row.negative_marks ?? row.negativeMarks ?? row.neg_marks ?? 0;
    const negMarksNum = parseFloat(String(negMarksRaw)) || 0;

    // Tags
    const tagsRaw = row.tags || row.Tags || "";
    const tags = String(tagsRaw)
      .split(/[,;]+/)
      .map((t) => t.trim())
      .filter(Boolean);

    // Case group & Passage
    const caseGroup = row.case_group || row.caseGroup || row.passage_group || null;
    const passage = row.passage || row.Passage || null;

    previewRows.push({
      rowIndex: i + 1,
      classLevel: classNum || 10,
      subjectName: matchedSubject?.name || String(row.subject || ""),
      subjectId: matchedSubject?.id || null,
      chapterNo: matchedChapter?.number ?? (parseInt(String(chapterNoRaw), 10) || null),
      chapterId: matchedChapter?.id || null,
      type: qType,
      stem,
      options,
      correct: correctParsed,
      solution: row.solution ? String(row.solution).trim() : null,
      difficulty: diff as any,
      marks: marksNum,
      negativeMarks: negMarksNum,
      tags,
      source: row.source ? String(row.source).trim() : null,
      competency: row.competency ? String(row.competency).trim() : null,
      caseGroup: caseGroup ? String(caseGroup).trim() : null,
      passage: passage ? String(passage).trim() : null,
      errors,
    });
  }

  const validCount = previewRows.filter((r) => r.errors.length === 0).length;
  const errorCount = previewRows.filter((r) => r.errors.length > 0).length;

  return {
    previewRows,
    totalCount: previewRows.length,
    validCount,
    errorCount,
    canImport: validCount > 0,
  };
}

/**
 * Commits verified preview rows to the questions table inside a transaction.
 */
export async function commitImportRows(rows: ImportPreviewRow[], userId: string) {
  const validRows = rows.filter((r) => r.errors.length === 0 && r.subjectId);

  if (validRows.length === 0) {
    throw new Error("No valid rows to import.");
  }

  // Pre-create any case groups
  const caseGroupMap = new Map<string, string>(); // groupIdentifier -> caseGroupId
  for (const row of validRows) {
    if (row.caseGroup && row.passage && !caseGroupMap.has(row.caseGroup)) {
      const [cg] = await db
        .insert(schema.caseGroups)
        .values({
          passage: row.passage,
        })
        .returning();
      if (cg) {
        caseGroupMap.set(row.caseGroup, cg.id);
      }
    }
  }

  const createdQuestions: Array<typeof schema.questions.$inferSelect> = [];

  await db.transaction(async (tx) => {
    for (const r of validRows) {
      const caseGroupId = r.caseGroup ? caseGroupMap.get(r.caseGroup) ?? null : null;
      const [q] = await tx
        .insert(schema.questions)
        .values({
          subjectId: r.subjectId!,
          chapterId: r.chapterId,
          classLevel: r.classLevel,
          type: r.type as any,
          stem: r.stem,
          options: r.options.length > 0 ? r.options : null,
          correct: r.correct,
          solution: r.solution,
          difficulty: r.difficulty as any,
          marks: r.marks.toFixed(2),
          negativeMarks: r.negativeMarks.toFixed(2),
          tags: r.tags,
          source: r.source,
          competency: r.competency,
          caseGroupId,
          isActive: true,
          createdBy: userId,
        })
        .returning();

      if (q) {
        createdQuestions.push(q);
      }
    }
  });

  return {
    importedCount: createdQuestions.length,
    questionIds: createdQuestions.map((q) => q.id),
  };
}
