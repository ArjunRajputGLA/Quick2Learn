import { db, schema, eq, and, desc, asc, sql, inArray, isNull, or, lt } from "@quick2learn/db";
import { ForbiddenError, NotFoundError } from "@/server/authz";
import { notify } from "@/server/notify";
import type {
  CreateTestInput,
  SaveAnswerItem,
  TestListItem,
  StartAttemptResponse,
  TestResultResponse,
  StudentPerformanceResponse,
} from "@quick2learn/shared";

/**
 * Lists tests available to a student (or filter by batchId/status for admin).
 */
export async function getAvailableTests(
  userId: string,
  role: string,
  params: { batchId?: string; status?: string; studentId?: string } = {}
) {
  const isAdminOrTeacher = role === "admin" || role === "teacher";
  const isParent = role === "parent";

  let targetStudentId = userId;
  if (isParent) {
    if (params.studentId) {
      const [link] = await db
        .select({ id: schema.parentLinks.id })
        .from(schema.parentLinks)
        .where(
          and(
            eq(schema.parentLinks.parentUserId, userId),
            eq(schema.parentLinks.studentUserId, params.studentId)
          )
        )
        .limit(1);

      if (!link) {
        throw new ForbiddenError("You are not authorized to view tests for this student.");
      }
      targetStudentId = params.studentId;
    } else {
      const [firstLink] = await db
        .select({ studentUserId: schema.parentLinks.studentUserId })
        .from(schema.parentLinks)
        .where(eq(schema.parentLinks.parentUserId, userId))
        .limit(1);

      if (firstLink) {
        targetStudentId = firstLink.studentUserId;
      }
    }
  }

  let batchIdsToFilter: string[] = [];

  if (params.batchId) {
    batchIdsToFilter = [params.batchId];
  } else if (!isAdminOrTeacher) {
    // Find active batch enrollments for student
    const enrollments = await db
      .select({ batchId: schema.enrollments.batchId })
      .from(schema.enrollments)
      .where(
        and(
          eq(schema.enrollments.studentId, targetStudentId),
          eq(schema.enrollments.status, "active")
        )
      );
    batchIdsToFilter = enrollments.map((e) => e.batchId);
  }

  const conditions = [];

  if (batchIdsToFilter.length > 0) {
    if (isAdminOrTeacher) {
      conditions.push(inArray(schema.tests.batchId, batchIdsToFilter));
    } else {
      // Students see tests for their enrolled batches OR free practice tests (batchId is null)
      conditions.push(
        or(inArray(schema.tests.batchId, batchIdsToFilter), isNull(schema.tests.batchId))
      );
    }
  } else if (!isAdminOrTeacher) {
    // Only free practice tests
    conditions.push(isNull(schema.tests.batchId));
  }

  if (params.status) {
    conditions.push(eq(schema.tests.status, params.status as any));
  } else if (!isAdminOrTeacher) {
    // Students only see live or scheduled tests
    conditions.push(or(eq(schema.tests.status, "live"), eq(schema.tests.status, "scheduled")));
  }

  const testsQuery = db
    .select({
      id: schema.tests.id,
      title: schema.tests.title,
      batchId: schema.tests.batchId,
      batchName: schema.batches.title,
      subjectId: schema.tests.subjectId,
      subjectName: schema.subjects.name,
      chapterIds: schema.tests.chapterIds,
      kind: schema.tests.kind,
      durationMinutes: schema.tests.durationMinutes,
      totalMarks: schema.tests.totalMarks,
      startsAt: schema.tests.startsAt,
      endsAt: schema.tests.endsAt,
      attemptsAllowed: schema.tests.attemptsAllowed,
      shuffleQuestions: schema.tests.shuffleQuestions,
      shuffleOptions: schema.tests.shuffleOptions,
      showSolutions: schema.tests.showSolutions,
      status: schema.tests.status,
      createdAt: schema.tests.createdAt,
    })
    .from(schema.tests)
    .innerJoin(schema.subjects, eq(schema.tests.subjectId, schema.subjects.id))
    .leftJoin(schema.batches, eq(schema.tests.batchId, schema.batches.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(schema.tests.createdAt));

  const testList = await testsQuery;

  // Enhance with student attempt stats
  const results: TestListItem[] = [];

  for (const t of testList) {
    // Question count
    const [qCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(schema.testQuestions)
      .where(eq(schema.testQuestions.testId, t.id));

    // My attempts
    const myAttempts = await db
      .select({
        id: schema.testAttempts.id,
        status: schema.testAttempts.status,
        score: schema.testAttempts.score,
        startedAt: schema.testAttempts.startedAt,
      })
      .from(schema.testAttempts)
      .where(
        and(
          eq(schema.testAttempts.testId, t.id),
          eq(schema.testAttempts.studentId, targetStudentId)
        )
      )
      .orderBy(desc(schema.testAttempts.startedAt));

    const bestScore = myAttempts
      .filter((a) => a.status === "submitted" || a.status === "auto_submitted")
      .reduce((max, a) => Math.max(max, Number(a.score)), -1);

    const latestAttempt = myAttempts[0];

    results.push({
      id: t.id,
      title: t.title,
      batchId: t.batchId,
      batchName: t.batchName ?? undefined,
      subjectId: t.subjectId,
      subjectName: t.subjectName,
      chapterIds: (t.chapterIds as string[]) || [],
      kind: t.kind,
      durationMinutes: t.durationMinutes,
      totalMarks: Number(t.totalMarks),
      startsAt: t.startsAt ? t.startsAt.toISOString() : null,
      endsAt: t.endsAt ? t.endsAt.toISOString() : null,
      attemptsAllowed: t.attemptsAllowed,
      shuffleQuestions: t.shuffleQuestions,
      shuffleOptions: t.shuffleOptions,
      showSolutions: t.showSolutions,
      status: t.status,
      questionCount: qCount?.count ?? 0,
      myAttemptsCount: myAttempts.length,
      myBestScore: bestScore >= 0 ? bestScore : null,
      latestAttemptStatus: latestAttempt ? latestAttempt.status : null,
      latestAttemptId: latestAttempt ? latestAttempt.id : null,
      createdAt: t.createdAt.toISOString(),
    });
  }

  return results;
}

/**
 * Gets test by ID with full metadata, questions count, and syllabus info.
 */
export async function getTestById(id: string, _userId?: string, _role?: string) {
  const [test] = await db
    .select({
      id: schema.tests.id,
      title: schema.tests.title,
      batchId: schema.tests.batchId,
      batchName: schema.batches.title,
      subjectId: schema.tests.subjectId,
      subjectName: schema.subjects.name,
      chapterIds: schema.tests.chapterIds,
      kind: schema.tests.kind,
      durationMinutes: schema.tests.durationMinutes,
      totalMarks: schema.tests.totalMarks,
      startsAt: schema.tests.startsAt,
      endsAt: schema.tests.endsAt,
      attemptsAllowed: schema.tests.attemptsAllowed,
      shuffleQuestions: schema.tests.shuffleQuestions,
      shuffleOptions: schema.tests.shuffleOptions,
      showSolutions: schema.tests.showSolutions,
      status: schema.tests.status,
      createdAt: schema.tests.createdAt,
    })
    .from(schema.tests)
    .innerJoin(schema.subjects, eq(schema.tests.subjectId, schema.subjects.id))
    .leftJoin(schema.batches, eq(schema.tests.batchId, schema.batches.id))
    .where(eq(schema.tests.id, id))
    .limit(1);

  if (!test) {
    throw new NotFoundError("Test not found");
  }

  const testQuestionsList = await db
    .select({
      id: schema.testQuestions.id,
      position: schema.testQuestions.position,
      marksOverride: schema.testQuestions.marksOverride,
      questionId: schema.questions.id,
      stem: schema.questions.stem,
      type: schema.questions.type,
      difficulty: schema.questions.difficulty,
      marks: schema.questions.marks,
      negativeMarks: schema.questions.negativeMarks,
      options: schema.questions.options,
      correct: schema.questions.correct,
      solution: schema.questions.solution,
    })
    .from(schema.testQuestions)
    .innerJoin(schema.questions, eq(schema.testQuestions.questionId, schema.questions.id))
    .where(eq(schema.testQuestions.testId, id))
    .orderBy(asc(schema.testQuestions.position));

  return {
    ...test,
    totalMarks: Number(test.totalMarks),
    questionsCount: testQuestionsList.length,
    questions: testQuestionsList.map((q) => ({
      ...q,
      marks: Number(q.marksOverride ?? q.marks),
      negativeMarks: Number(q.negativeMarks),
    })),
  };
}

/**
 * Creates a test and attaches its questions inside a transaction.
 */
export async function createTest(input: CreateTestInput, userId: string) {
  return await db.transaction(async (tx) => {
    // 1. Compute total marks from attached questions
    let computedTotalMarks = 0;
    const questionIds = input.questionIds.map((q) => q.questionId);

    const questionsData = questionIds.length > 0
      ? await tx
          .select({ id: schema.questions.id, marks: schema.questions.marks })
          .from(schema.questions)
          .where(inArray(schema.questions.id, questionIds))
      : [];

    const marksMap = new Map<string, number>();
    for (const q of questionsData) {
      marksMap.set(q.id, Number(q.marks));
    }

    for (const qItem of input.questionIds) {
      const qMarks = qItem.marksOverride ?? marksMap.get(qItem.questionId) ?? 1;
      computedTotalMarks += qMarks;
    }

    // 2. Insert test
    const [test] = await tx
      .insert(schema.tests)
      .values({
        title: input.title,
        batchId: input.batchId ?? null,
        subjectId: input.subjectId,
        chapterIds: input.chapterIds ?? [],
        kind: input.kind,
        durationMinutes: input.durationMinutes,
        totalMarks: computedTotalMarks.toFixed(2),
        startsAt: input.startsAt ? new Date(input.startsAt) : null,
        endsAt: input.endsAt ? new Date(input.endsAt) : null,
        attemptsAllowed: input.attemptsAllowed,
        shuffleQuestions: input.shuffleQuestions,
        shuffleOptions: input.shuffleOptions,
        showSolutions: input.showSolutions,
        status: input.status,
        createdBy: userId,
      })
      .returning();

    if (!test) {
      throw new Error("Failed to create test");
    }

    // 3. Insert test_questions
    if (input.questionIds.length > 0) {
      await tx.insert(schema.testQuestions).values(
        input.questionIds.map((q, idx) => ({
          testId: test.id,
          questionId: q.questionId,
          position: q.position || idx + 1,
          marksOverride: q.marksOverride !== undefined && q.marksOverride !== null
            ? q.marksOverride.toFixed(2)
            : null,
        }))
      );
    }

    return test;
  });
}

/**
 * Updates a test and its question associations.
 */
export async function updateTest(id: string, input: Partial<CreateTestInput>, _userId: string) {
  return await db.transaction(async (tx) => {
    const updateValues: Record<string, any> = {
      updatedAt: sql`timezone('utc'::text, now())`,
    };

    if (input.title !== undefined) updateValues.title = input.title;
    if (input.batchId !== undefined) updateValues.batchId = input.batchId;
    if (input.subjectId !== undefined) updateValues.subjectId = input.subjectId;
    if (input.chapterIds !== undefined) updateValues.chapterIds = input.chapterIds;
    if (input.kind !== undefined) updateValues.kind = input.kind;
    if (input.durationMinutes !== undefined) updateValues.durationMinutes = input.durationMinutes;
    if (input.startsAt !== undefined) updateValues.startsAt = input.startsAt ? new Date(input.startsAt) : null;
    if (input.endsAt !== undefined) updateValues.endsAt = input.endsAt ? new Date(input.endsAt) : null;
    if (input.attemptsAllowed !== undefined) updateValues.attemptsAllowed = input.attemptsAllowed;
    if (input.shuffleQuestions !== undefined) updateValues.shuffleQuestions = input.shuffleQuestions;
    if (input.shuffleOptions !== undefined) updateValues.shuffleOptions = input.shuffleOptions;
    if (input.showSolutions !== undefined) updateValues.showSolutions = input.showSolutions;
    if (input.status !== undefined) updateValues.status = input.status;

    if (input.questionIds) {
      // Re-calculate total marks
      const questionIds = input.questionIds.map((q) => q.questionId);
      const questionsData = questionIds.length > 0
        ? await tx
            .select({ id: schema.questions.id, marks: schema.questions.marks })
            .from(schema.questions)
            .where(inArray(schema.questions.id, questionIds))
        : [];

      const marksMap = new Map<string, number>();
      for (const q of questionsData) {
        marksMap.set(q.id, Number(q.marks));
      }

      let computedTotalMarks = 0;
      for (const qItem of input.questionIds) {
        const qMarks = qItem.marksOverride ?? marksMap.get(qItem.questionId) ?? 1;
        computedTotalMarks += qMarks;
      }
      updateValues.totalMarks = computedTotalMarks.toFixed(2);

      // Replace test_questions
      await tx.delete(schema.testQuestions).where(eq(schema.testQuestions.testId, id));

      if (input.questionIds.length > 0) {
        await tx.insert(schema.testQuestions).values(
          input.questionIds.map((q, idx) => ({
            testId: id,
            questionId: q.questionId,
            position: q.position || idx + 1,
            marksOverride: q.marksOverride !== undefined && q.marksOverride !== null
              ? q.marksOverride.toFixed(2)
              : null,
          }))
        );
      }
    }

    const [updated] = await tx
      .update(schema.tests)
      .set(updateValues)
      .where(eq(schema.tests.id, id))
      .returning();

    return updated;
  });
}

/**
 * Publishes a test (status -> 'live' or 'scheduled') and pushes notification to the batch.
 */
export async function publishTest(id: string) {
  const [test] = await db
    .select({
      id: schema.tests.id,
      title: schema.tests.title,
      batchId: schema.tests.batchId,
      startsAt: schema.tests.startsAt,
      durationMinutes: schema.tests.durationMinutes,
      status: schema.tests.status,
    })
    .from(schema.tests)
    .where(eq(schema.tests.id, id))
    .limit(1);

  if (!test) {
    throw new NotFoundError("Test not found");
  }

  const now = new Date();
  const nextStatus = test.startsAt && test.startsAt > now ? "scheduled" : "live";

  const [updated] = await db
    .update(schema.tests)
    .set({
      status: nextStatus,
      updatedAt: sql`timezone('utc'::text, now())`,
    })
    .where(eq(schema.tests.id, id))
    .returning();

  // Get question count
  const [qCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(schema.testQuestions)
    .where(eq(schema.testQuestions.testId, id));

  const questionsCount = qCount?.count ?? 0;

  // Send push notification to batch students if linked to a batch
  if (test.batchId) {
    try {
      await notify(
        { batchId: test.batchId },
        {
          type: "new_test",
          title: `New test: ${test.title}`,
          body: `New test: ${test.title} — ${questionsCount} questions, ${test.durationMinutes} min`,
          data: {
            route: `/test/${test.id}`,
            testId: test.id,
          },
        }
      );
    } catch (err) {
      console.error("[publishTest] Failed to send push notification:", err);
    }
  }

  return updated;
}

/**
 * Auto-picks questions from the question bank by chapter and difficulty counts.
 */
export async function autoPickQuestions(params: {
  subjectId: string;
  classLevel: number;
  chapterIds?: string[];
  counts: {
    easy?: number;
    medium?: number;
    hard?: number;
  };
}) {
  const conditions = [
    eq(schema.questions.subjectId, params.subjectId),
    eq(schema.questions.classLevel, params.classLevel),
    eq(schema.questions.isActive, true),
  ];

  if (params.chapterIds && params.chapterIds.length > 0) {
    conditions.push(inArray(schema.questions.chapterId, params.chapterIds));
  }

  const allAvailable = await db
    .select()
    .from(schema.questions)
    .where(and(...conditions));

  const easyPool = allAvailable.filter((q) => q.difficulty === "easy");
  const medPool = allAvailable.filter((q) => q.difficulty === "medium");
  const hardPool = allAvailable.filter((q) => q.difficulty === "hard");

  function pickRandom<T>(arr: T[], n: number): T[] {
    const shuffled = [...arr].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, n);
  }

  const pickedEasy = pickRandom(easyPool, params.counts.easy || 0);
  const pickedMed = pickRandom(medPool, params.counts.medium || 0);
  const pickedHard = pickRandom(hardPool, params.counts.hard || 0);

  const combined = [...pickedEasy, ...pickedMed, ...pickedHard];

  return combined.map((q, idx) => ({
    questionId: q.id,
    position: idx + 1,
    marksOverride: null,
    stem: q.stem,
    type: q.type,
    difficulty: q.difficulty,
    marks: Number(q.marks),
  }));
}

// -------------------------------------------------------------
// TEST ATTEMPT LIFECYCLE (START -> SAVE -> SUBMIT -> GRADE)
// -------------------------------------------------------------

/**
 * Starts or resumes a test attempt.
 *
 * CRITICAL REQUIREMENT:
 * The response MUST contain questions WITHOUT correct answers or solutions!
 */
export async function startTestAttempt(
  testId: string,
  studentId: string,
  isTeacherPreview = false
): Promise<StartAttemptResponse> {
  // 1. Fetch test
  const [test] = await db
    .select()
    .from(schema.tests)
    .where(eq(schema.tests.id, testId))
    .limit(1);

  if (!test) {
    throw new NotFoundError("Test not found");
  }

  const now = new Date();

  // 2. Window and authorization checks (unless teacher previewing)
  if (!isTeacherPreview) {
    if (test.status !== "live") {
      throw new ForbiddenError(
        test.status === "scheduled"
          ? "This test has not started yet."
          : "This test is not currently active."
      );
    }

    if (test.startsAt && now < test.startsAt) {
      throw new ForbiddenError("This test has not started yet.");
    }

    if (test.endsAt && now > test.endsAt) {
      throw new ForbiddenError("This test window has closed.");
    }

    // Check batch enrollment if test is assigned to a batch
    if (test.batchId) {
      const [enrollment] = await db
        .select({ id: schema.enrollments.id })
        .from(schema.enrollments)
        .where(
          and(
            eq(schema.enrollments.batchId, test.batchId),
            eq(schema.enrollments.studentId, studentId),
            eq(schema.enrollments.status, "active")
          )
        )
        .limit(1);

      if (!enrollment) {
        throw new ForbiddenError("You are not enrolled in the batch for this test.");
      }
    }

    // 3. Check attempts left
    const pastAttempts = await db
      .select({ id: schema.testAttempts.id, status: schema.testAttempts.status })
      .from(schema.testAttempts)
      .where(
        and(
          eq(schema.testAttempts.testId, testId),
          eq(schema.testAttempts.studentId, studentId)
        )
      );

    const completedAttempts = pastAttempts.filter(
      (a) => a.status === "submitted" || a.status === "auto_submitted"
    );

    if (completedAttempts.length >= test.attemptsAllowed) {
      throw new ForbiddenError(
        `You have used all ${test.attemptsAllowed} attempt(s) allowed for this test.`
      );
    }
  }

  // 4. Check for active in-progress attempt to resume
  const [existingAttempt] = await db
    .select()
    .from(schema.testAttempts)
    .where(
      and(
        eq(schema.testAttempts.testId, testId),
        eq(schema.testAttempts.studentId, studentId),
        eq(schema.testAttempts.status, "in_progress")
      )
    )
    .orderBy(desc(schema.testAttempts.startedAt))
    .limit(1);

  let attemptId: string;
  let startedAt: Date;
  let deadlineAt: Date;

  if (existingAttempt) {
    // Check if grace period expired
    const graceExpiry = new Date(existingAttempt.deadlineAt.getTime() + 30_000);
    if (now > graceExpiry) {
      // Auto-submit expired attempt immediately and return error or start new if allowed
      await submitTestAttempt(existingAttempt.id, studentId, true);
      throw new ForbiddenError("Your previous attempt timed out and has been auto-submitted.");
    }
    attemptId = existingAttempt.id;
    startedAt = existingAttempt.startedAt;
    deadlineAt = existingAttempt.deadlineAt;
  } else {
    // Calculate deadline = min(now + durationMinutes, test.endsAt)
    startedAt = now;
    const durationMs = test.durationMinutes * 60 * 1000;
    const endWindow = test.endsAt ? test.endsAt.getTime() : Infinity;
    const calculatedDeadlineMs = Math.min(startedAt.getTime() + durationMs, endWindow);
    deadlineAt = new Date(calculatedDeadlineMs);

    const [createdAttempt] = await db
      .insert(schema.testAttempts)
      .values({
        testId: test.id,
        studentId,
        startedAt,
        deadlineAt,
        status: "in_progress",
      })
      .returning();

    if (!createdAttempt) {
      throw new Error("Failed to create test attempt");
    }

    attemptId = createdAttempt.id;
  }

  // 5. Fetch test questions and case groups
  const testQuestionsList = await db
    .select({
      id: schema.questions.id,
      position: schema.testQuestions.position,
      marksOverride: schema.testQuestions.marksOverride,
      marks: schema.questions.marks,
      negativeMarks: schema.questions.negativeMarks,
      type: schema.questions.type,
      stem: schema.questions.stem,
      imageKey: schema.questions.imageKey,
      options: schema.questions.options,
      caseGroupId: schema.questions.caseGroupId,
      caseGroupPassage: schema.caseGroups.passage,
      caseGroupImageKey: schema.caseGroups.imageKey,
    })
    .from(schema.testQuestions)
    .innerJoin(schema.questions, eq(schema.testQuestions.questionId, schema.questions.id))
    .leftJoin(schema.caseGroups, eq(schema.questions.caseGroupId, schema.caseGroups.id))
    .where(eq(schema.testQuestions.testId, testId))
    .orderBy(asc(schema.testQuestions.position));

  // Shuffling if configured
  let processedQuestions = [...testQuestionsList];
  if (test.shuffleQuestions) {
    processedQuestions.sort(() => 0.5 - Math.random());
  }

  // 6. Format questions STRICTLY WITHOUT correct answers or solutions
  const sanitizedQuestions = processedQuestions.map((q, idx) => {
    let options = q.options ? [...q.options] : [];
    if (test.shuffleOptions && options.length > 0) {
      options.sort(() => 0.5 - Math.random());
    }

    return {
      id: q.id,
      position: idx + 1,
      marks: Number(q.marksOverride ?? q.marks),
      negativeMarks: Number(q.negativeMarks),
      type: q.type,
      stem: q.stem,
      imageKey: q.imageKey,
      options: options.length > 0 ? options : null,
      caseGroup: q.caseGroupId
        ? {
            id: q.caseGroupId,
            passage: q.caseGroupPassage ?? "",
            imageKey: q.caseGroupImageKey ?? null,
          }
        : null,
      // STRICT: NO correct, NO solution!
    };
  });

  // 7. Fetch any previously saved answers for this attempt
  const savedAnswersList = await db
    .select({
      questionId: schema.attemptAnswers.questionId,
      answer: schema.attemptAnswers.answer,
      timeSpentSeconds: schema.attemptAnswers.timeSpentSeconds,
      markedForReview: schema.attemptAnswers.markedForReview,
    })
    .from(schema.attemptAnswers)
    .where(eq(schema.attemptAnswers.attemptId, attemptId));

  const savedAnswersMap: Record<
    string,
    { answer: any; timeSpentSeconds: number; markedForReview: boolean }
  > = {};
  for (const a of savedAnswersList) {
    savedAnswersMap[a.questionId] = {
      answer: a.answer,
      timeSpentSeconds: a.timeSpentSeconds,
      markedForReview: a.markedForReview,
    };
  }

  return {
    attemptId,
    testId: test.id,
    title: test.title,
    durationMinutes: test.durationMinutes,
    startedAt: startedAt.toISOString(),
    deadlineAt: deadlineAt.toISOString(),
    serverNow: now.toISOString(),
    questions: sanitizedQuestions,
    savedAnswers: savedAnswersMap,
  };
}

/**
 * Saves attempt answers (batch or single).
 * Idempotent upserts accepted until deadline_at + 30 s grace for slow networks.
 */
export async function saveAttemptAnswers(
  attemptId: string,
  studentId: string,
  answers: SaveAnswerItem[]
) {
  const [attempt] = await db
    .select()
    .from(schema.testAttempts)
    .where(
      and(
        eq(schema.testAttempts.id, attemptId),
        eq(schema.testAttempts.studentId, studentId)
      )
    )
    .limit(1);

  if (!attempt) {
    throw new NotFoundError("Attempt not found");
  }

  if (attempt.status !== "in_progress") {
    throw new ForbiddenError("This attempt has already been submitted.");
  }

  const now = new Date();
  const graceDeadline = new Date(attempt.deadlineAt.getTime() + 30_000); // 30s grace

  if (now > graceDeadline) {
    // Time expired
    await submitTestAttempt(attemptId, studentId, true);
    throw new ForbiddenError("Test time expired. Your attempt has been auto-submitted.");
  }

  // Upsert answers
  for (const item of answers) {
    const [existing] = await db
      .select({ id: schema.attemptAnswers.id })
      .from(schema.attemptAnswers)
      .where(
        and(
          eq(schema.attemptAnswers.attemptId, attemptId),
          eq(schema.attemptAnswers.questionId, item.questionId)
        )
      )
      .limit(1);

    if (existing) {
      await db
        .update(schema.attemptAnswers)
        .set({
          answer: item.answer ?? null,
          timeSpentSeconds: item.timeSpentSeconds || 0,
          markedForReview: item.markedForReview || false,
          updatedAt: sql`timezone('utc'::text, now())`,
        })
        .where(eq(schema.attemptAnswers.id, existing.id));
    } else {
      await db.insert(schema.attemptAnswers).values({
        attemptId,
        questionId: item.questionId,
        answer: item.answer ?? null,
        timeSpentSeconds: item.timeSpentSeconds || 0,
        markedForReview: item.markedForReview || false,
      });
    }
  }

  return { success: true, savedCount: answers.length };
}

/**
 * Submits and grades a test attempt on the server.
 * Evaluates correctness, marks, negative marks, and recalculates rank.
 */
export async function submitTestAttempt(
  attemptId: string,
  studentId?: string,
  isAutoSubmit = false
) {
  const [attempt] = await db
    .select()
    .from(schema.testAttempts)
    .where(eq(schema.testAttempts.id, attemptId))
    .limit(1);

  if (!attempt) {
    throw new NotFoundError("Attempt not found");
  }

  if (!isAutoSubmit && studentId && attempt.studentId !== studentId) {
    throw new ForbiddenError("Not authorized to submit this attempt");
  }

  if (attempt.status === "submitted" || attempt.status === "auto_submitted") {
    return {
      attemptId: attempt.id,
      score: Number(attempt.score),
      alreadySubmitted: true,
    };
  }

  // 1. Fetch all questions in this test with correct answers and marks
  const questionsInTest = await db
    .select({
      id: schema.questions.id,
      type: schema.questions.type,
      marks: schema.questions.marks,
      negativeMarks: schema.questions.negativeMarks,
      marksOverride: schema.testQuestions.marksOverride,
      correct: schema.questions.correct,
    })
    .from(schema.testQuestions)
    .innerJoin(schema.questions, eq(schema.testQuestions.questionId, schema.questions.id))
    .where(eq(schema.testQuestions.testId, attempt.testId));

  // 2. Fetch existing student answers
  const studentAnswers = await db
    .select()
    .from(schema.attemptAnswers)
    .where(eq(schema.attemptAnswers.attemptId, attemptId));

  const answersMap = new Map<string, typeof schema.attemptAnswers.$inferSelect>();
  for (const a of studentAnswers) {
    answersMap.set(a.questionId, a);
  }

  let totalScore = 0;
  let correctCount = 0;
  let wrongCount = 0;
  let skippedCount = 0;
  let totalTimeSpent = 0;

  // 3. Grade each question
  for (const q of questionsInTest) {
    const studentAns = answersMap.get(q.id);
    const qMarks = Number(q.marksOverride ?? q.marks);
    const negMarks = Number(q.negativeMarks);
    const ansVal = studentAns?.answer;

    totalTimeSpent += studentAns?.timeSpentSeconds || 0;

    // Check if skipped / empty
    const isSkipped =
      ansVal === undefined ||
      ansVal === null ||
      ansVal === "" ||
      (Array.isArray(ansVal) && ansVal.length === 0);

    if (isSkipped) {
      skippedCount++;
      if (studentAns) {
        await db
          .update(schema.attemptAnswers)
          .set({
            isCorrect: null,
            marksAwarded: "0.00",
            updatedAt: sql`timezone('utc'::text, now())`,
          })
          .where(eq(schema.attemptAnswers.id, studentAns.id));
      }
      continue;
    }

    // Evaluate correctness based on question type
    let isCorrect = false;

    if (q.type === "mcq_single" || q.type === "assertion_reason" || q.type === "case_study") {
      const studentChoice = String(Array.isArray(ansVal) ? ansVal[0] : ansVal).trim().toLowerCase();
      const correctChoice = String(Array.isArray(q.correct) ? q.correct[0] : q.correct).trim().toLowerCase();
      isCorrect = studentChoice === correctChoice;
    } else if (q.type === "mcq_multi") {
      const studentArr = (Array.isArray(ansVal) ? ansVal : [ansVal])
        .map((s) => String(s).trim().toLowerCase())
        .sort();
      const correctArr = (Array.isArray(q.correct) ? q.correct : [q.correct])
        .map((s) => String(s).trim().toLowerCase())
        .sort();

      isCorrect =
        studentArr.length === correctArr.length &&
        studentArr.every((val, idx) => val === correctArr[idx]);
    } else if (q.type === "true_false") {
      const studentBool = String(ansVal).trim().toLowerCase();
      const correctBool = String(q.correct).trim().toLowerCase();
      isCorrect = studentBool === correctBool;
    } else if (q.type === "numeric") {
      const studentNum = parseFloat(String(ansVal));
      const correctNum = parseFloat(String(q.correct));
      if (!isNaN(studentNum) && !isNaN(correctNum)) {
        isCorrect = Math.abs(studentNum - correctNum) < 0.001;
      } else {
        isCorrect = String(ansVal).trim().toLowerCase() === String(q.correct).trim().toLowerCase();
      }
    }

    // Assign marks
    let marksAwarded = 0;
    if (isCorrect) {
      marksAwarded = qMarks;
      correctCount++;
      totalScore += qMarks;
    } else {
      marksAwarded = -negMarks;
      wrongCount++;
      totalScore -= negMarks;
    }

    // Upsert graded answer
    if (studentAns) {
      await db
        .update(schema.attemptAnswers)
        .set({
          isCorrect,
          marksAwarded: marksAwarded.toFixed(2),
          updatedAt: sql`timezone('utc'::text, now())`,
        })
        .where(eq(schema.attemptAnswers.id, studentAns.id));
    } else {
      await db.insert(schema.attemptAnswers).values({
        attemptId,
        questionId: q.id,
        answer: ansVal ?? null,
        isCorrect,
        marksAwarded: marksAwarded.toFixed(2),
      });
    }
  }

  // Total score can be clamped or left exact
  const finalScore = Number(totalScore.toFixed(2));
  const submittedAt = new Date();

  // 4. Update test attempt record
  await db
    .update(schema.testAttempts)
    .set({
      status: isAutoSubmit ? "auto_submitted" : "submitted",
      submittedAt,
      score: finalScore.toFixed(2),
      correct: correctCount,
      wrong: wrongCount,
      skipped: skippedCount,
      timeSpentSeconds: totalTimeSpent,
      updatedAt: sql`timezone('utc'::text, now())`,
    })
    .where(eq(schema.testAttempts.id, attemptId));

  // 5. Recompute ranks for all submitted attempts for this test
  const allSubmittedAttempts = await db
    .select({
      id: schema.testAttempts.id,
      score: schema.testAttempts.score,
      timeSpentSeconds: schema.testAttempts.timeSpentSeconds,
      submittedAt: schema.testAttempts.submittedAt,
    })
    .from(schema.testAttempts)
    .where(
      and(
        eq(schema.testAttempts.testId, attempt.testId),
        or(
          eq(schema.testAttempts.status, "submitted"),
          eq(schema.testAttempts.status, "auto_submitted")
        )
      )
    )
    .orderBy(
      desc(schema.testAttempts.score),
      asc(schema.testAttempts.timeSpentSeconds),
      asc(schema.testAttempts.submittedAt)
    );

  for (let i = 0; i < allSubmittedAttempts.length; i++) {
    const att = allSubmittedAttempts[i];
    if (!att) continue;
    const rank = i + 1;
    await db
      .update(schema.testAttempts)
      .set({ rank })
      .where(eq(schema.testAttempts.id, att.id));
  }

  // 6. Dispatch test result published notification to linked parents
  try {
    const linkedParents = await db
      .select({ parentUserId: schema.parentLinks.parentUserId })
      .from(schema.parentLinks)
      .where(eq(schema.parentLinks.studentUserId, attempt.studentId));

    if (linkedParents.length > 0) {
      const [studentProfile] = await db
        .select({ fullName: schema.profiles.fullName })
        .from(schema.profiles)
        .where(eq(schema.profiles.userId, attempt.studentId))
        .limit(1);
      const studentName = studentProfile?.fullName || "Your child";

      const [testRecord] = await db
        .select({
          title: schema.tests.title,
          totalMarks: schema.tests.totalMarks,
        })
        .from(schema.tests)
        .where(eq(schema.tests.id, attempt.testId))
        .limit(1);

      const testTitle = testRecord?.title || "Class Test";
      const totalMarks = testRecord?.totalMarks ? Number(testRecord.totalMarks) : 100;

      const parentIds = linkedParents.map((p) => p.parentUserId);
      await notify(parentIds, {
        type: "test_result_published",
        title: `Test Result Published: ${testTitle}`,
        body: `${studentName} scored ${finalScore}/${totalMarks} on "${testTitle}".`,
        data: {
          route: `/test/${attempt.testId}/result?attemptId=${attemptId}&studentId=${attempt.studentId}`,
          testId: attempt.testId,
          attemptId,
          studentId: attempt.studentId,
        },
      });
    }
  } catch (err) {
    console.error("[submitTestAttempt] Error notifying parents:", err);
  }

  return {
    attemptId,
    score: finalScore,
    correct: correctCount,
    wrong: wrongCount,
    skipped: skippedCount,
    isAutoSubmit,
  };
}

/**
 * Auto-submits all expired attempts (run by cron every minute).
 * An abandoned attempt is auto-submitted within a minute of its deadline.
 */
export async function autoSubmitExpiredAttempts() {
  const cutoff = new Date(Date.now() - 30_000);
  const expiredAttempts = await db
    .select({
      id: schema.testAttempts.id,
      studentId: schema.testAttempts.studentId,
      deadlineAt: schema.testAttempts.deadlineAt,
    })
    .from(schema.testAttempts)
    .where(
      and(
        eq(schema.testAttempts.status, "in_progress"),
        lt(schema.testAttempts.deadlineAt, cutoff)
      )
    );

  let processedCount = 0;
  for (const a of expiredAttempts) {
    try {
      await submitTestAttempt(a.id, a.studentId, true);
      processedCount++;
    } catch (err) {
      console.error(`[autoSubmitExpiredAttempts] Failed to auto-submit attempt ${a.id}:`, err);
    }
  }

  return { processedCount, totalExpired: expiredAttempts.length };
}

/**
 * Gets test attempt results with score, rank, chapter-wise breakdown,
 * and solutions conditioned by show_solutions rule.
 */
export async function getAttemptResult(
  attemptId: string,
  requestingUserId: string,
  requestingRole: string = "student"
): Promise<TestResultResponse> {
  const [attempt] = await db
    .select({
      id: schema.testAttempts.id,
      testId: schema.testAttempts.testId,
      studentId: schema.testAttempts.studentId,
      startedAt: schema.testAttempts.startedAt,
      submittedAt: schema.testAttempts.submittedAt,
      status: schema.testAttempts.status,
      score: schema.testAttempts.score,
      correct: schema.testAttempts.correct,
      wrong: schema.testAttempts.wrong,
      skipped: schema.testAttempts.skipped,
      timeSpentSeconds: schema.testAttempts.timeSpentSeconds,
      rank: schema.testAttempts.rank,
      testTitle: schema.tests.title,
      totalMarks: schema.tests.totalMarks,
      durationMinutes: schema.tests.durationMinutes,
      endsAt: schema.tests.endsAt,
      showSolutions: schema.tests.showSolutions,
    })
    .from(schema.testAttempts)
    .innerJoin(schema.tests, eq(schema.testAttempts.testId, schema.tests.id))
    .where(eq(schema.testAttempts.id, attemptId))
    .limit(1);

  if (!attempt) {
    throw new NotFoundError("Test attempt not found");
  }

  const isAdminOrTeacher = requestingRole === "admin" || requestingRole === "teacher";

  // Authorization check: own attempt or admin/teacher or linked parent
  if (attempt.studentId !== requestingUserId && !isAdminOrTeacher) {
    // Check if requesting user is linked parent
    const [parentLink] = await db
      .select({ id: schema.parentLinks.id })
      .from(schema.parentLinks)
      .where(
        and(
          eq(schema.parentLinks.parentUserId, requestingUserId),
          eq(schema.parentLinks.studentUserId, attempt.studentId)
        )
      )
      .limit(1);

    if (!parentLink) {
      throw new ForbiddenError("You are not authorized to view this test result.");
    }
  }

  const now = new Date();
  let solutionsAvailable = false;
  let solutionsNote = "";

  if (isAdminOrTeacher) {
    solutionsAvailable = true;
  } else {
    switch (attempt.showSolutions) {
      case "after_submit":
        solutionsAvailable = attempt.status === "submitted" || attempt.status === "auto_submitted";
        break;
      case "after_end":
        if (attempt.endsAt && now >= attempt.endsAt) {
          solutionsAvailable = true;
        } else {
          solutionsAvailable = false;
          solutionsNote = `Solutions will be unlocked after the test closes on ${attempt.endsAt ? attempt.endsAt.toLocaleString("en-IN") : "the scheduled end time"}.`;
        }
        break;
      case "never":
      default:
        solutionsAvailable = false;
        solutionsNote = "Solutions are not published for this test.";
        break;
    }
  }

  // Fetch attempt questions and answers
  const questionsList = await db
    .select({
      questionId: schema.questions.id,
      position: schema.testQuestions.position,
      marksOverride: schema.testQuestions.marksOverride,
      marks: schema.questions.marks,
      negativeMarks: schema.questions.negativeMarks,
      type: schema.questions.type,
      stem: schema.questions.stem,
      imageKey: schema.questions.imageKey,
      options: schema.questions.options,
      correct: schema.questions.correct,
      solution: schema.questions.solution,
      chapterId: schema.questions.chapterId,
      chapterTitle: schema.chapters.title,
      caseGroupId: schema.questions.caseGroupId,
      caseGroupPassage: schema.caseGroups.passage,
      caseGroupImageKey: schema.caseGroups.imageKey,
      studentAnswer: schema.attemptAnswers.answer,
      isCorrect: schema.attemptAnswers.isCorrect,
      marksAwarded: schema.attemptAnswers.marksAwarded,
      timeSpentSeconds: schema.attemptAnswers.timeSpentSeconds,
      markedForReview: schema.attemptAnswers.markedForReview,
    })
    .from(schema.testQuestions)
    .innerJoin(schema.questions, eq(schema.testQuestions.questionId, schema.questions.id))
    .leftJoin(schema.chapters, eq(schema.questions.chapterId, schema.chapters.id))
    .leftJoin(schema.caseGroups, eq(schema.questions.caseGroupId, schema.caseGroups.id))
    .leftJoin(
      schema.attemptAnswers,
      and(
        eq(schema.attemptAnswers.attemptId, attemptId),
        eq(schema.attemptAnswers.questionId, schema.questions.id)
      )
    )
    .where(eq(schema.testQuestions.testId, attempt.testId))
    .orderBy(asc(schema.testQuestions.position));

  // Chapter-wise breakdown calculation
  const chapterMap = new Map<
    string,
    {
      chapterId: string | null;
      chapterTitle: string;
      total: number;
      correct: number;
      wrong: number;
      skipped: number;
      marksObtained: number;
      totalMarks: number;
    }
  >();

  for (const q of questionsList) {
    const key = q.chapterId ?? "other";
    const title = q.chapterTitle ?? "General / Unassigned";
    const qMarks = Number(q.marksOverride ?? q.marks);
    const qAwarded = Number(q.marksAwarded ?? 0);

    let stats = chapterMap.get(key);
    if (!stats) {
      stats = {
        chapterId: q.chapterId,
        chapterTitle: title,
        total: 0,
        correct: 0,
        wrong: 0,
        skipped: 0,
        marksObtained: 0,
        totalMarks: 0,
      };
      chapterMap.set(key, stats);
    }

    stats.total++;
    stats.totalMarks += qMarks;
    stats.marksObtained += qAwarded;

    if (q.isCorrect === true) stats.correct++;
    else if (q.isCorrect === false) stats.wrong++;
    else stats.skipped++;
  }

  const chapterBreakdown = Array.from(chapterMap.values()).map((c) => ({
    chapterId: c.chapterId,
    chapterTitle: c.chapterTitle,
    totalQuestions: c.total,
    correctQuestions: c.correct,
    wrongQuestions: c.wrong,
    skippedQuestions: c.skipped,
    marksObtained: Number(c.marksObtained.toFixed(2)),
    totalMarks: Number(c.totalMarks.toFixed(2)),
    accuracyPercentage:
      c.correct + c.wrong > 0
        ? Number(((c.correct / (c.correct + c.wrong)) * 100).toFixed(1))
        : 0,
  }));

  // Total participants
  const [participantsCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(schema.testAttempts)
    .where(
      and(
        eq(schema.testAttempts.testId, attempt.testId),
        or(
          eq(schema.testAttempts.status, "submitted"),
          eq(schema.testAttempts.status, "auto_submitted")
        )
      )
    );

  const attemptedCount = attempt.correct + attempt.wrong;
  const accuracy =
    attemptedCount > 0 ? Number(((attempt.correct / attemptedCount) * 100).toFixed(1)) : 0;
  const percentage =
    Number(attempt.totalMarks) > 0
      ? Number(((Number(attempt.score) / Number(attempt.totalMarks)) * 100).toFixed(1))
      : 0;

  return {
    attemptId: attempt.id,
    testId: attempt.testId,
    title: attempt.testTitle,
    status: attempt.status,
    score: Number(attempt.score),
    totalMarks: Number(attempt.totalMarks),
    percentage,
    correct: attempt.correct,
    wrong: attempt.wrong,
    skipped: attempt.skipped,
    accuracy,
    timeSpentSeconds: attempt.timeSpentSeconds,
    durationMinutes: attempt.durationMinutes,
    rank: attempt.rank,
    totalParticipants: participantsCount?.count ?? 1,
    solutionsAvailable,
    solutionsNote: solutionsNote || undefined,
    chapterBreakdown,
    questions: questionsList.map((q) => ({
      questionId: q.questionId,
      position: q.position,
      type: q.type,
      stem: q.stem,
      imageKey: q.imageKey,
      options: q.options,
      caseGroup: q.caseGroupId
        ? {
            id: q.caseGroupId,
            passage: q.caseGroupPassage ?? "",
            imageKey: q.caseGroupImageKey ?? null,
          }
        : null,
      studentAnswer: q.studentAnswer,
      correct: solutionsAvailable ? q.correct : undefined,
      correctAnswer: solutionsAvailable ? q.correct : undefined,
      solution: solutionsAvailable ? q.solution : undefined,
      isCorrect: q.isCorrect,
      marksAwarded: Number(q.marksAwarded ?? 0),
      marksPossible: Number(q.marksOverride ?? q.marks),
      negativeMarks: Number(q.negativeMarks),
      timeSpentSeconds: q.timeSpentSeconds ?? 0,
      markedForReview: q.markedForReview ?? false,
    })),
  };
}

/**
 * Gets student performance overview across all attempted tests.
 */
export async function getStudentPerformance(
  studentId: string,
  requestingUserId: string,
  requestingRole: string
): Promise<StudentPerformanceResponse> {
  const isAdminOrTeacher = requestingRole === "admin" || requestingRole === "teacher";

  if (studentId !== requestingUserId && !isAdminOrTeacher) {
    const [link] = await db
      .select({ id: schema.parentLinks.id })
      .from(schema.parentLinks)
      .where(
        and(
          eq(schema.parentLinks.parentUserId, requestingUserId),
          eq(schema.parentLinks.studentUserId, studentId)
        )
      )
      .limit(1);

    if (!link) {
      throw new ForbiddenError("Not authorized to view student performance.");
    }
  }

  const [studentUser] = await db
    .select({ name: schema.user.name })
    .from(schema.user)
    .where(eq(schema.user.id, studentId))
    .limit(1);

  const attempts = await db
    .select({
      id: schema.testAttempts.id,
      testId: schema.testAttempts.testId,
      testTitle: schema.tests.title,
      subjectId: schema.tests.subjectId,
      subjectName: schema.subjects.name,
      score: schema.testAttempts.score,
      totalMarks: schema.tests.totalMarks,
      timeSpentSeconds: schema.testAttempts.timeSpentSeconds,
      rank: schema.testAttempts.rank,
      submittedAt: schema.testAttempts.submittedAt,
    })
    .from(schema.testAttempts)
    .innerJoin(schema.tests, eq(schema.testAttempts.testId, schema.tests.id))
    .innerJoin(schema.subjects, eq(schema.tests.subjectId, schema.subjects.id))
    .where(
      and(
        eq(schema.testAttempts.studentId, studentId),
        or(
          eq(schema.testAttempts.status, "submitted"),
          eq(schema.testAttempts.status, "auto_submitted")
        )
      )
    )
    .orderBy(desc(schema.testAttempts.submittedAt));

  let totalPercentage = 0;
  let totalTime = 0;

  const subjectMap = new Map<string, { id: string; name: string; totalPct: number; count: number }>();
  const attemptedTestIds = new Set<string>();

  for (const a of attempts) {
    attemptedTestIds.add(a.testId);
    const total = Number(a.totalMarks) || 1;
    const score = Number(a.score);
    const pct = (score / total) * 100;
    totalPercentage += pct;
    totalTime += a.timeSpentSeconds;

    let sub = subjectMap.get(a.subjectId);
    if (!sub) {
      sub = { id: a.subjectId, name: a.subjectName, totalPct: 0, count: 0 };
      subjectMap.set(a.subjectId, sub);
    }
    sub.totalPct += pct;
    sub.count++;
  }

  const avgPct = attempts.length > 0 ? Number((totalPercentage / attempts.length).toFixed(1)) : 0;

  // 1. Calculate missed tests count: tests assigned to student's batches that have ended and were not attempted
  let missedCount = 0;
  const enrollments = await db
    .select({ batchId: schema.enrollments.batchId })
    .from(schema.enrollments)
    .where(
      and(
        eq(schema.enrollments.studentId, studentId),
        eq(schema.enrollments.status, "active")
      )
    );

  const batchIds = enrollments.map((e) => e.batchId);
  if (batchIds.length > 0) {
    const now = new Date();
    const batchTests = await db
      .select({ id: schema.tests.id, endsAt: schema.tests.endsAt, status: schema.tests.status })
      .from(schema.tests)
      .where(inArray(schema.tests.batchId, batchIds));

    for (const bt of batchTests) {
      if (!attemptedTestIds.has(bt.id)) {
        if ((bt.endsAt && bt.endsAt < now) || bt.status === "closed") {
          missedCount++;
        }
      }
    }
  }

  // 2. Calculate chapter-wise breakdown across all attempt answers
  const chapterMap = new Map<
    string,
    { chapterId: string | null; chapterTitle: string; correct: number; total: number }
  >();

  if (attempts.length > 0) {
    const attemptIds = attempts.map((a) => a.id);
    const answersWithQuestions = await db
      .select({
        questionId: schema.attemptAnswers.questionId,
        isCorrect: schema.attemptAnswers.isCorrect,
        chapterId: schema.questions.chapterId,
        chapterTitle: schema.chapters.title,
      })
      .from(schema.attemptAnswers)
      .innerJoin(schema.questions, eq(schema.attemptAnswers.questionId, schema.questions.id))
      .leftJoin(schema.chapters, eq(schema.questions.chapterId, schema.chapters.id))
      .where(inArray(schema.attemptAnswers.attemptId, attemptIds));

    for (const ans of answersWithQuestions) {
      const chKey = ans.chapterId || "general";
      const chTitle = ans.chapterTitle || "General Practice";

      let ch = chapterMap.get(chKey);
      if (!ch) {
        ch = { chapterId: ans.chapterId, chapterTitle: chTitle, correct: 0, total: 0 };
        chapterMap.set(chKey, ch);
      }
      ch.total++;
      if (ans.isCorrect) ch.correct++;
    }
  }

  const chapterBreakdown = Array.from(chapterMap.values()).map((ch) => ({
    chapterId: ch.chapterId,
    chapterTitle: ch.chapterTitle,
    averageAccuracyPercentage: ch.total > 0 ? Math.round((ch.correct / ch.total) * 100) : 0,
    totalQuestions: ch.total,
  }));

  // Sort chapters by accuracy descending
  const sortedChapters = [...chapterBreakdown].sort(
    (a, b) => b.averageAccuracyPercentage - a.averageAccuracyPercentage
  );

  const strongestChapters = sortedChapters
    .filter((c) => c.averageAccuracyPercentage >= 70)
    .slice(0, 3)
    .map((c) => c.chapterTitle);

  const weakestChapters = sortedChapters
    .filter((c) => c.averageAccuracyPercentage < 70)
    .reverse()
    .slice(0, 3)
    .map((c) => c.chapterTitle);

  return {
    studentId,
    studentName: studentUser?.name ?? "Student",
    totalTestsAttempted: attempts.length,
    totalTestsMissed: missedCount,
    averageScorePercentage: avgPct,
    totalTimeSpentMinutes: Math.round(totalTime / 60),
    recentAttempts: attempts.slice(0, 10).map((a) => {
      const tot = Number(a.totalMarks) || 1;
      const sc = Number(a.score);
      return {
        attemptId: a.id,
        testId: a.testId,
        testTitle: a.testTitle,
        score: sc,
        totalMarks: tot,
        percentage: Number(((sc / tot) * 100).toFixed(1)),
        rank: a.rank,
        submittedAt: a.submittedAt ? a.submittedAt.toISOString() : new Date().toISOString(),
      };
    }),
    subjectBreakdown: Array.from(subjectMap.values()).map((s) => ({
      subjectId: s.id,
      subjectName: s.name,
      testsCount: s.count,
      averageScorePercentage: Number((s.totalPct / s.count).toFixed(1)),
    })),
    chapterBreakdown,
    strongestChapters,
    weakestChapters,
  };
}

/**
 * Gets test admin results, score distribution, question accuracy, and attempts for CSV export.
 */
export async function getTestAdminResults(testId: string) {
  const [test] = await db
    .select({
      id: schema.tests.id,
      title: schema.tests.title,
      batchId: schema.tests.batchId,
      batchName: schema.batches.title,
      totalMarks: schema.tests.totalMarks,
      durationMinutes: schema.tests.durationMinutes,
      status: schema.tests.status,
    })
    .from(schema.tests)
    .leftJoin(schema.batches, eq(schema.tests.batchId, schema.batches.id))
    .where(eq(schema.tests.id, testId))
    .limit(1);

  if (!test) {
    throw new NotFoundError("Test not found");
  }

  // All completed attempts
  const attempts = await db
    .select({
      id: schema.testAttempts.id,
      studentId: schema.testAttempts.studentId,
      studentName: schema.user.name,
      studentEmail: schema.user.email,
      score: schema.testAttempts.score,
      correct: schema.testAttempts.correct,
      wrong: schema.testAttempts.wrong,
      skipped: schema.testAttempts.skipped,
      timeSpentSeconds: schema.testAttempts.timeSpentSeconds,
      rank: schema.testAttempts.rank,
      status: schema.testAttempts.status,
      submittedAt: schema.testAttempts.submittedAt,
    })
    .from(schema.testAttempts)
    .innerJoin(schema.user, eq(schema.testAttempts.studentId, schema.user.id))
    .where(
      and(
        eq(schema.testAttempts.testId, testId),
        or(
          eq(schema.testAttempts.status, "submitted"),
          eq(schema.testAttempts.status, "auto_submitted")
        )
      )
    )
    .orderBy(asc(schema.testAttempts.rank));

  // Question-wise accuracy
  const testQuestionsList = await db
    .select({
      questionId: schema.questions.id,
      position: schema.testQuestions.position,
      stem: schema.questions.stem,
      type: schema.questions.type,
      marks: schema.questions.marks,
      marksOverride: schema.testQuestions.marksOverride,
      chapterTitle: schema.chapters.title,
    })
    .from(schema.testQuestions)
    .innerJoin(schema.questions, eq(schema.testQuestions.questionId, schema.questions.id))
    .leftJoin(schema.chapters, eq(schema.questions.chapterId, schema.chapters.id))
    .where(eq(schema.testQuestions.testId, testId))
    .orderBy(asc(schema.testQuestions.position));

  const questionStats = [];
  for (const q of testQuestionsList) {
    const answers = await db
      .select({
        isCorrect: schema.attemptAnswers.isCorrect,
      })
      .from(schema.attemptAnswers)
      .innerJoin(schema.testAttempts, eq(schema.attemptAnswers.attemptId, schema.testAttempts.id))
      .where(
        and(
          eq(schema.testAttempts.testId, testId),
          eq(schema.attemptAnswers.questionId, q.questionId),
          or(
            eq(schema.testAttempts.status, "submitted"),
            eq(schema.testAttempts.status, "auto_submitted")
          )
        )
      );

    const totalAns = answers.length;
    const correctCount = answers.filter((a) => a.isCorrect === true).length;
    const wrongCount = answers.filter((a) => a.isCorrect === false).length;
    const skippedCount = totalAns - (correctCount + wrongCount);
    const accuracy = totalAns > 0 ? Number(((correctCount / totalAns) * 100).toFixed(1)) : 0;

    questionStats.push({
      questionId: q.questionId,
      position: q.position,
      stem: q.stem,
      type: q.type,
      chapterTitle: q.chapterTitle ?? "General",
      totalAnswers: totalAns,
      correctCount,
      wrongCount,
      skippedCount,
      accuracyPercentage: accuracy,
    });
  }

  // Summary statistics
  const scores = attempts.map((a) => Number(a.score));
  const maxScore = scores.length > 0 ? Math.max(...scores) : 0;
  const minScore = scores.length > 0 ? Math.min(...scores) : 0;
  const avgScore =
    scores.length > 0
      ? Number((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2))
      : 0;

  return {
    test: {
      ...test,
      totalMarks: Number(test.totalMarks),
    },
    totalParticipants: attempts.length,
    stats: {
      highestScore: maxScore,
      lowestScore: minScore,
      averageScore: avgScore,
    },
    questionStats,
    attempts: attempts.map((a) => ({
      id: a.id,
      studentId: a.studentId,
      studentName: a.studentName,
      studentEmail: a.studentEmail,
      score: Number(a.score),
      correct: a.correct,
      wrong: a.wrong,
      skipped: a.skipped,
      timeSpentSeconds: a.timeSpentSeconds,
      rank: a.rank,
      status: a.status,
      submittedAt: a.submittedAt ? a.submittedAt.toISOString() : "",
    })),
  };
}
