import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { Pool } from "pg";
import { db, schema, eq, and, sql, desc } from "@quick2learn/db";
import { seed } from "../packages/db/src/seed";
import * as XLSX from "xlsx";
import {
  parseAndValidateImportRows,
  commitImportRows,
  checkDuplicateQuestion,
  getQuestions,
  createQuestion,
} from "../apps/web/src/server/data/questions";
import {
  createTest,
  publishTest,
  autoPickQuestions,
  startTestAttempt,
  saveAttemptAnswers,
  submitTestAttempt,
  autoSubmitExpiredAttempts,
  getAttemptResult,
  getStudentPerformance,
  getTestAdminResults,
} from "../apps/web/src/server/data/tests";

const testDbUrl =
  process.env.DATABASE_URL_TEST ||
  "postgresql://postgres:postgres@localhost:5432/quick2learn_test";

const testPool = new Pool({
  connectionString: testDbUrl,
});

describe("Test Engine & Question Bank Comprehensive Test Suite", () => {
  const teacherId = `teacher-tests-${Date.now()}`;
  const student1Id = `student-1-tests-${Date.now()}`;
  const student2Id = `student-2-tests-${Date.now()}`;
  const student3Id = `student-3-tests-${Date.now()}`;
  const unenrolledStudentId = `unenrolled-tests-${Date.now()}`;

  let subjectMathId: string;
  let subjectScienceId: string;
  let chapterIntegrationId: string;
  let chapterQuadraticId: string;
  let testBatchId: string;

  beforeAll(async () => {
    process.env.DATABASE_URL = testDbUrl;
    await seed(testDbUrl);

    // 1. Ensure test users exist
    const users = [
      { id: teacherId, name: "Dinesh Sir", email: `dinesh-${Date.now()}@quick2learn.in`, role: "teacher" },
      { id: student1Id, name: "Aarav Sharma", email: `aarav-${Date.now()}@quick2learn.in`, role: "student" },
      { id: student2Id, name: "Diya Patel", email: `diya-${Date.now()}@quick2learn.in`, role: "student" },
      { id: student3Id, name: "Rohan Gupta", email: `rohan-${Date.now()}@quick2learn.in`, role: "student" },
      { id: unenrolledStudentId, name: "Stranger Kid", email: `stranger-${Date.now()}@quick2learn.in`, role: "student" },
    ];

    for (const u of users) {
      await db
        .insert(schema.user)
        .values({
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role as any,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .onConflictDoNothing();

      await db
        .insert(schema.profiles)
        .values({
          userId: u.id,
          fullName: u.name,
          role: u.role as any,
        })
        .onConflictDoNothing();
    }

    // 2. Fetch or create subjects
    const allSubjects = await db.select().from(schema.subjects);
    const math = allSubjects.find((s) => s.name.toLowerCase().includes("math")) || allSubjects[0];
    const science = allSubjects.find((s) => s.name.toLowerCase().includes("science")) || allSubjects[1] || allSubjects[0];

    if (!math) {
      throw new Error("No subjects found in test database");
    }

    subjectMathId = math.id;
    subjectScienceId = science ? science.id : math.id;

    // 3. Ensure chapters exist
    const [ch1] = await db
      .insert(schema.chapters)
      .values({
        subjectId: subjectMathId,
        title: "Integrals",
        number: 7,
        classLevel: 12,
        slug: `integrals-${Date.now()}`,
      })
      .returning();
    chapterIntegrationId = ch1!.id;

    const [ch2] = await db
      .insert(schema.chapters)
      .values({
        subjectId: subjectMathId,
        title: "Quadratic Equations",
        number: 4,
        classLevel: 10,
        slug: `quadratic-${Date.now()}`,
      })
      .returning();
    chapterQuadraticId = ch2!.id;

    // 4. Use seeded batch or create batch and enroll student1, student2, student3
    const [seededBatch] = await db.select().from(schema.batches).limit(1);
    if (seededBatch) {
      testBatchId = seededBatch.id;
    } else {
      const [batch] = await db
        .insert(schema.batches)
        .values({
          slug: `batch-${Date.now()}`,
          title: `Class 12 Maths Champions ${Date.now()}`,
          description: "Top scoring batch for class 12 maths",
          scheduleText: "Mon, Wed, Fri 5 PM",
          classLevel: 12,
          subjectId: subjectMathId,
          board: "cbse",
          startDate: new Date(),
          endDate: new Date(Date.now() + 180 * 24 * 3600 * 1000),
          status: "open",
        })
        .returning();
      testBatchId = batch!.id;
    }

    for (const sId of [student1Id, student2Id, student3Id]) {
      await db
        .insert(schema.enrollments)
        .values({
          studentId: sId,
          batchId: testBatchId,
          status: "active",
        })
        .onConflictDoNothing();
    }
  });

  afterAll(async () => {
    await testPool.end();
  });

  // =========================================================================
  // DONE WHEN #1: 50-Question XLSX Import with LaTeX
  // =========================================================================
  it("Done When #1: A 50-question XLSX with LaTeX imports into 50 questions that render correctly in the preview and commits to db", async () => {
    // Generate 50 realistic math & science rows with LaTeX strings
    const rows: Array<Record<string, any>> = [];

    for (let i = 1; i <= 50; i++) {
      let type = "mcq_single";
      let stem = "";
      let optA = "";
      let optB = "";
      let optC = "";
      let optD = "";
      let correct = "a";
      let solution = "";
      let caseGroup = "";
      let passage = "";

      if (i <= 20) {
        // Standard MCQ Single with inline & block LaTeX
        type = "mcq_single";
        stem = `Evaluate the integral: $I = \\int x e^{${i}x} dx$. What is the correct expression?`;
        optA = `$\\frac{e^{${i}x}}{${i}^2}(${i}x - 1) + C$`;
        optB = `$\\frac{e^{${i}x}}{${i}}(x - 1) + C$`;
        optC = `$\\frac{e^{${i}x}}{${i}^2}(${i}x + 1) + C$`;
        optD = `$e^{${i}x} + C$`;
        correct = "a";
        solution = `By integration by parts: $\\int u v' dx = uv - \\int u' v dx$. Let $u = x, v' = e^{${i}x}$. Hence $I = \\frac{e^{${i}x}}{${i}^2}(${i}x - 1) + C$.`;
      } else if (i <= 30) {
        // Assertion - Reason with LaTeX
        type = "assertion_reason";
        stem = `Assertion (A): The function $f(x) = \\sin(${i}x)$ is continuous at $x = 0$.\nReason (R): $\\lim_{x \\to 0} \\sin(${i}x) = 0 = f(0)$.`;
        optA = "Both A and R are true and R is the correct explanation of A";
        optB = "Both A and R are true but R is not the correct explanation of A";
        optC = "A is true but R is false";
        optD = "A is false but R is true";
        correct = "a";
        solution = `Continuous because the two-sided limit $\\lim_{x \\to 0} f(x) = f(0) = 0$.`;
      } else if (i <= 40) {
        // Case Study sharing a passage among 5 questions each
        type = "case_study";
        const groupNum = i <= 35 ? "Passage-Alpha" : "Passage-Beta";
        caseGroup = groupNum;
        passage = `Consider a charged particle in an electric field $E = ${i} \\times 10^3 \\text{ V/m}$ moving along the x-axis. The kinetic energy is governed by $K = \\frac{1}{2}mv^2$.`;
        stem = `Sub-question ${i}: Calculate the force experienced by charge $q = 1.6 \\times 10^{-19} \\text{ C}$ in field $E = ${i} \\times 10^3 \\text{ V/m}$.`;
        optA = `$${(i * 1.6).toFixed(1)} \\times 10^{-16} \\text{ N}$`;
        optB = `$${(i * 3.2).toFixed(1)} \\times 10^{-16} \\text{ N}$`;
        optC = `$1.0 \\times 10^{-15} \\text{ N}$`;
        optD = `$0 \\text{ N}$`;
        correct = "a";
        solution = `Force $F = qE = (1.6 \\times 10^{-19})(${i} \\times 10^3) = ${(i * 1.6).toFixed(1)} \\times 10^{-16} \\text{ N}$.`;
      } else if (i <= 45) {
        // Numeric question
        type = "numeric";
        stem = `If the discriminant of $x^2 - ${2 * i}x + ${i * i} = 0$ is $\\Delta$, find $\\Delta$.`;
        correct = "0";
        solution = `$\\Delta = b^2 - 4ac = (${2 * i})^2 - 4(1)(${i * i}) = 0$.`;
      } else {
        // True / False
        type = "true_false";
        stem = `True or False: Every differentiable function is continuous on its domain.`;
        correct = "true";
        solution = `Differentiability implies continuity via $\\lim_{h \\to 0} [f(x+h) - f(x)] = f'(x) \\cdot 0 = 0$.`;
      }

      rows.push({
        class: 12,
        subject: "Mathematics",
        chapter_no: 7,
        type,
        stem,
        option_a: optA,
        option_b: optB,
        option_c: optC,
        option_d: optD,
        correct,
        solution,
        difficulty: i % 3 === 0 ? "hard" : i % 2 === 0 ? "medium" : "easy",
        marks: type === "case_study" ? 4 : 2,
        negative_marks: type === "numeric" ? 0 : 0.5,
        tags: `calculus, class12, q${i}`,
        source: "Dinesh Sir — Ch 7 deck",
        competency: "Problem Solving & Analysis",
        case_group: caseGroup,
        passage,
      });
    }

    expect(rows.length).toBe(50);

    // 1. Build workbook
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Questions");
    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    // 2. Read back using same parameters as admin UI
    const readWb = XLSX.read(buffer, { type: "buffer" });
    const sheetName = readWb.SheetNames[0]!;
    const readJson = XLSX.utils.sheet_to_json(readWb.Sheets[sheetName]!, {
      raw: false,
      defval: "",
    }) as any[];

    expect(readJson.length).toBe(50);

    // 3. Validate via parseAndValidateImportRows
    const validation = await parseAndValidateImportRows(readJson);

    expect(validation.validCount).toBe(50);
    expect(validation.errorCount).toBe(0);
    expect(validation.canImport).toBe(true);
    expect(validation.previewRows.length).toBe(50);

    // Verify LaTeX strings survived verbatim without corruption
    const row1 = validation.previewRows[0]!;
    expect(row1.stem).toContain("$I = \\int x e^{1x} dx$");
    expect(row1.options![0]!.text).toContain("$\\frac{e^{1x}}{1^2}(1x - 1) + C$");
    expect(row1.solution).toContain("$\\int u v' dx = uv - \\int u' v dx$");

    // 4. Commit to database
    const commitRes = await commitImportRows(validation.previewRows, teacherId);
    expect(commitRes.importedCount).toBe(50);

    // 5. Query DB to verify persistence and case groups
    const dbQuestions = await getQuestions({ classLevel: 12, source: "Dinesh Sir — Ch 7 deck", limit: 100 });
    expect(dbQuestions.length).toBeGreaterThanOrEqual(50);

    // Verify case groups were shared among questions sharing case_group
    const caseQuestions = dbQuestions.filter((q) => q.type === "case_study");
    expect(caseQuestions.length).toBeGreaterThanOrEqual(10);
    const caseGroupIds = new Set(caseQuestions.map((q) => q.caseGroupId).filter(Boolean));
    expect(caseGroupIds.size).toBeGreaterThanOrEqual(2); // Passage-Alpha and Passage-Beta
  });

  // =========================================================================
  // DONE WHEN #2: Start Attempt Contains NO Correct Answers or Solutions
  // =========================================================================
  it("Done When #2: The start-attempt response contains no correct answers or solutions", async () => {
    // 1. Fetch 5 committed questions
    const sampleQuestions = await getQuestions({ classLevel: 12, limit: 5 });
    expect(sampleQuestions.length).toBeGreaterThanOrEqual(5);

    // 2. Create a test
    const test = await createTest(
      {
        title: "Integrals Speed Test — 5 Questions",
        batchId: testBatchId,
        subjectId: subjectMathId,
        chapterIds: [chapterIntegrationId],
        kind: "chapter_test",
        durationMinutes: 30,
        startsAt: new Date(Date.now() - 3600 * 1000).toISOString(),
        endsAt: new Date(Date.now() + 3600 * 1000).toISOString(),
        attemptsAllowed: 2,
        shuffleQuestions: true,
        shuffleOptions: false,
        showSolutions: "after_submit",
        status: "live",
        questionIds: sampleQuestions.slice(0, 5).map((q, idx) => ({
          questionId: q.id,
          position: idx + 1,
        })),
      },
      teacherId
    );

    expect(test.id).toBeDefined();

    // 3. Student starts attempt
    const attemptData = await startTestAttempt(test.id, student1Id);

    expect(attemptData.attemptId).toBeDefined();
    expect(attemptData.testId).toBe(test.id);
    expect(attemptData.questions.length).toBe(5);

    // CRITICAL SECURITY ASSERTION: Verify start-attempt questions leak NO answers or solutions
    for (const q of attemptData.questions) {
      expect((q as any).correct).toBeUndefined();
      expect((q as any).solution).toBeUndefined();
      expect(q.id).toBeDefined();
      expect(q.stem).toBeDefined();
      expect(q.type).toBeDefined();
      expect(q.marks).toBeGreaterThan(0);
    }
  });

  // =========================================================================
  // DONE WHEN #3: Abandoned Attempt is Auto-Submitted by Cron
  // =========================================================================
  it("Done When #3: An abandoned attempt is auto-submitted within a minute of its deadline", async () => {
    const sampleQuestions = await getQuestions({ classLevel: 12, limit: 3 });

    // 1. Create a test with 1-minute duration
    const test = await createTest(
      {
        title: "Quick 1-Minute Pop Quiz",
        batchId: testBatchId,
        subjectId: subjectMathId,
        chapterIds: [chapterIntegrationId],
        kind: "chapter_test",
        durationMinutes: 1,
        startsAt: new Date(Date.now() - 7200 * 1000).toISOString(),
        endsAt: new Date(Date.now() + 7200 * 1000).toISOString(),
        attemptsAllowed: 1,
        shuffleQuestions: false,
        shuffleOptions: false,
        showSolutions: "after_submit",
        status: "live",
        questionIds: sampleQuestions.slice(0, 3).map((q, idx) => ({
          questionId: q.id,
          position: idx + 1,
        })),
      },
      teacherId
    );

    // 2. Student 2 starts attempt
    const attemptData = await startTestAttempt(test.id, student2Id);
    const attemptId = attemptData.attemptId;

    // Student answers question 1 correctly, then abandons
    const q1 = sampleQuestions[0]!;
    await saveAttemptAnswers(attemptId, student2Id, [
      {
        questionId: q1.id,
        answer: q1.correct,
        timeSpentSeconds: 20,
      },
    ]);

    // 3. Simulate passage of time past deadline: set deadline_at to 2 minutes ago
    const pastDeadline = new Date(Date.now() - 120 * 1000);
    await db
      .update(schema.testAttempts)
      .set({ deadlineAt: pastDeadline })
      .where(eq(schema.testAttempts.id, attemptId));

    // 4. Trigger autoSubmitExpiredAttempts (as executed by /api/cron/test-attempts every minute)
    const cronResult = await autoSubmitExpiredAttempts();

    expect(cronResult.processedCount).toBeGreaterThanOrEqual(1);

    // 5. Inspect database to confirm attempt was auto-submitted and graded
    const [updatedAttempt] = await db
      .select()
      .from(schema.testAttempts)
      .where(eq(schema.testAttempts.id, attemptId));

    expect(updatedAttempt).toBeDefined();
    expect(updatedAttempt!.status).toBe("auto_submitted");
    expect(updatedAttempt!.submittedAt).toBeDefined();
    expect(Number(updatedAttempt!.score)).toBeGreaterThan(0);
    expect(updatedAttempt!.correct).toBe(1);
    expect(updatedAttempt!.rank).toBe(1);
  });

  // =========================================================================
  // TEST 4: 30-Second Grace Period for Answer Upserts
  // =========================================================================
  it("allows answer saving within 30s grace period but rejects after grace period expires", async () => {
    const sampleQuestions = await getQuestions({ classLevel: 12, limit: 2 });
    const test = await createTest(
      {
        title: "Grace Period Test",
        batchId: testBatchId,
        subjectId: subjectMathId,
        chapterIds: [chapterIntegrationId],
        kind: "chapter_test",
        durationMinutes: 10,
        startsAt: new Date(Date.now() - 3600 * 1000).toISOString(),
        endsAt: new Date(Date.now() + 3600 * 1000).toISOString(),
        attemptsAllowed: 1,
        shuffleQuestions: false,
        shuffleOptions: false,
        showSolutions: "after_submit",
        status: "live",
        questionIds: sampleQuestions.slice(0, 2).map((q, idx) => ({
          questionId: q.id,
          position: idx + 1,
        })),
      },
      teacherId
    );

    const attemptData = await startTestAttempt(test.id, student3Id);
    const attemptId = attemptData.attemptId;
    const q1 = sampleQuestions[0]!;

    // Scenario A: Set deadline to 15 seconds ago (within 30s grace window) -> ACCEPTED
    await db
      .update(schema.testAttempts)
      .set({ deadlineAt: new Date(Date.now() - 15 * 1000) })
      .where(eq(schema.testAttempts.id, attemptId));

    const saveSuccess = await saveAttemptAnswers(attemptId, student3Id, [
      {
        questionId: q1.id,
        answer: "a",
        timeSpentSeconds: 12,
      },
    ]);
    expect(saveSuccess.savedCount).toBe(1);

    // Scenario B: Set deadline to 45 seconds ago (past 30s grace window) -> REJECTED
    await db
      .update(schema.testAttempts)
      .set({ deadlineAt: new Date(Date.now() - 45 * 1000) })
      .where(eq(schema.testAttempts.id, attemptId));

    await expect(
      saveAttemptAnswers(attemptId, student3Id, [
        {
          questionId: q1.id,
          answer: "b",
          timeSpentSeconds: 15,
        },
      ])
    ).rejects.toThrow("Test time expired");
  });

  // =========================================================================
  // TEST 5: Server-side Grading Correctness & Negative Marking
  // =========================================================================
  it("accurately grades diverse question types with negative marking and ranks students", async () => {
    // 1. Create a controlled 4-question test:
    // Q1: MCQ single (2 marks, -0.5 neg)
    // Q2: Numeric (4 marks, 0 neg)
    // Q3: True/False (1 mark, -0.25 neg)
    // Q4: MCQ multi (3 marks, -1 neg)
    const q1 = await createQuestion(
      {
        subjectId: subjectMathId,
        classLevel: 12,
        type: "mcq_single",
        stem: "What is $\\int 0 dx$?",
        options: [
          { id: "a", text: "Constant $C$" },
          { id: "b", text: "$0$" },
          { id: "c", text: "$1$" },
          { id: "d", text: "Undefined" },
        ],
        correct: "a",
        solution: "Integral of zero is a constant.",
        difficulty: "easy",
        marks: 2,
        negativeMarks: 0.5,
      },
      teacherId
    );

    const q2 = await createQuestion(
      {
        subjectId: subjectMathId,
        classLevel: 12,
        type: "numeric",
        stem: "Value of $\\lim_{x \\to 0} \\frac{\\sin(x)}{x}$",
        correct: "1",
        solution: "Standard limit is 1.",
        difficulty: "easy",
        marks: 4,
        negativeMarks: 0,
      },
      teacherId
    );

    const q3 = await createQuestion(
      {
        subjectId: subjectMathId,
        classLevel: 12,
        type: "true_false",
        stem: "Every continuous function is differentiable.",
        correct: "false",
        solution: "Counterexample is $|x|$ at $x=0$.",
        difficulty: "easy",
        marks: 1,
        negativeMarks: 0.25,
      },
      teacherId
    );

    const gradingTest = await createTest(
      {
        title: "Rigorous Server-side Grading Test",
        batchId: testBatchId,
        subjectId: subjectMathId,
        chapterIds: [chapterIntegrationId],
        kind: "chapter_test",
        durationMinutes: 45,
        startsAt: new Date(Date.now() - 3600 * 1000).toISOString(),
        endsAt: new Date(Date.now() + 3600 * 1000).toISOString(),
        attemptsAllowed: 3,
        shuffleQuestions: false,
        shuffleOptions: false,
        showSolutions: "after_submit",
        status: "live",
        questionIds: [
          { questionId: q1.id, position: 1 },
          { questionId: q2.id, position: 2 },
          { questionId: q3.id, position: 3 },
        ],
      },
      teacherId
    );

    // Student 1 answers: Q1 correct (+2), Q2 correct (+4), Q3 wrong (-0.25) -> Total = 5.75
    const att1 = await startTestAttempt(gradingTest.id, student1Id);
    await saveAttemptAnswers(att1.attemptId, student1Id, [
      { questionId: q1.id, answer: "a", timeSpentSeconds: 30 },
      { questionId: q2.id, answer: "1.0", timeSpentSeconds: 25 },
      { questionId: q3.id, answer: "true", timeSpentSeconds: 15 }, // Wrong!
    ]);
    const submit1 = await submitTestAttempt(att1.attemptId, student1Id);
    expect(submit1.score).toBe(5.75);
    expect(submit1.correct).toBe(2);
    expect(submit1.wrong).toBe(1);
    expect(submit1.skipped).toBe(0);

    // Student 2 answers: Q1 wrong (-0.5), Q2 skipped (0), Q3 correct (+1) -> Total = 0.5
    const att2 = await startTestAttempt(gradingTest.id, student2Id);
    await saveAttemptAnswers(att2.attemptId, student2Id, [
      { questionId: q1.id, answer: "b", timeSpentSeconds: 40 }, // Wrong (-0.5)
      { questionId: q3.id, answer: "false", timeSpentSeconds: 20 }, // Correct (+1)
    ]);
    const submit2 = await submitTestAttempt(att2.attemptId, student2Id);
    expect(submit2.score).toBe(0.5);
    expect(submit2.correct).toBe(1);
    expect(submit2.wrong).toBe(1);
    expect(submit2.skipped).toBe(1);

    // Verify Rank order: Student 1 has rank 1, Student 2 has rank 2
    const res1 = await getAttemptResult(att1.attemptId, student1Id);
    const res2 = await getAttemptResult(att2.attemptId, student2Id);
    expect(res1.rank).toBe(1);
    expect(res2.rank).toBe(2);
  });

  // =========================================================================
  // TEST 6: Solution Visibility Rules (after_submit, after_end, never)
  // =========================================================================
  it("enforces solution visibility rules strictly", async () => {
    const q = await createQuestion(
      {
        subjectId: subjectMathId,
        classLevel: 12,
        type: "mcq_single",
        stem: "Visibility question",
        options: [{ id: "a", text: "A" }, { id: "b", text: "B" }],
        correct: "a",
        solution: "Secret explanation",
        difficulty: "easy",
        marks: 2,
        negativeMarks: 0,
      },
      teacherId
    );

    // Rule 1: 'never' -> answers and solutions NEVER revealed
    const testNever = await createTest(
      {
        title: "Test Never Solutions",
        batchId: testBatchId,
        subjectId: subjectMathId,
        chapterIds: [chapterIntegrationId],
        kind: "mock",
        durationMinutes: 30,
        startsAt: new Date(Date.now() - 3600 * 1000).toISOString(),
        endsAt: new Date(Date.now() + 3600 * 1000).toISOString(),
        attemptsAllowed: 1,
        shuffleQuestions: false,
        shuffleOptions: false,
        showSolutions: "never",
        status: "live",
        questionIds: [{ questionId: q.id, position: 1 }],
      },
      teacherId
    );

    const attNever = await startTestAttempt(testNever.id, student1Id);
    await submitTestAttempt(attNever.attemptId, student1Id);
    const resultNever = await getAttemptResult(attNever.attemptId, student1Id);

    expect(resultNever.solutionsAvailable).toBe(false);
    expect(resultNever.questions[0]!.correct).toBeUndefined();
    expect(resultNever.questions[0]!.solution).toBeUndefined();

    // Rule 2: 'after_end' while test is still ongoing (endsAt in future) -> solutions HIDDEN
    const testAfterEndOngoing = await createTest(
      {
        title: "Test After End — Ongoing",
        batchId: testBatchId,
        subjectId: subjectMathId,
        chapterIds: [chapterIntegrationId],
        kind: "unit_test",
        durationMinutes: 30,
        startsAt: new Date(Date.now() - 1000).toISOString(),
        endsAt: new Date(Date.now() + 7200 * 1000).toISOString(), // 2 hours in future
        attemptsAllowed: 1,
        shuffleQuestions: false,
        shuffleOptions: false,
        showSolutions: "after_end",
        status: "live",
        questionIds: [{ questionId: q.id, position: 1 }],
      },
      teacherId
    );

    const attAfterEnd = await startTestAttempt(testAfterEndOngoing.id, student1Id);
    await submitTestAttempt(attAfterEnd.attemptId, student1Id);
    const resultAfterEndOngoing = await getAttemptResult(attAfterEnd.attemptId, student1Id);

    expect(resultAfterEndOngoing.solutionsAvailable).toBe(false);
    expect(resultAfterEndOngoing.questions[0]!.correct).toBeUndefined();
    expect(resultAfterEndOngoing.questions[0]!.solution).toBeUndefined();

    // Rule 3: 'after_submit' -> solutions revealed immediately
    const testAfterSubmit = await createTest(
      {
        title: "Test After Submit",
        batchId: testBatchId,
        subjectId: subjectMathId,
        chapterIds: [chapterIntegrationId],
        kind: "practice",
        durationMinutes: 30,
        startsAt: new Date(Date.now() - 1000).toISOString(),
        endsAt: new Date(Date.now() + 7200 * 1000).toISOString(),
        attemptsAllowed: 1,
        shuffleQuestions: false,
        shuffleOptions: false,
        showSolutions: "after_submit",
        status: "live",
        questionIds: [{ questionId: q.id, position: 1 }],
      },
      teacherId
    );

    const attAfterSubmit = await startTestAttempt(testAfterSubmit.id, student1Id);
    await submitTestAttempt(attAfterSubmit.attemptId, student1Id);
    const resultAfterSubmit = await getAttemptResult(attAfterSubmit.attemptId, student1Id);

    expect(resultAfterSubmit.solutionsAvailable).toBe(true);
    expect(resultAfterSubmit.questions[0]!.correct).toBe("a");
    expect(resultAfterSubmit.questions[0]!.solution).toBe("Secret explanation");
  });

  // =========================================================================
  // TEST 7: Duplicate Question Detection
  // =========================================================================
  it("warns about duplicate questions accurately based on stem similarity", async () => {
    const stem = "What is the speed of light in vacuum under standard conditions?";
    await createQuestion(
      {
        subjectId: subjectScienceId,
        classLevel: 10,
        type: "mcq_single",
        stem,
        options: [{ id: "a", text: "$3 \\times 10^8$ m/s" }],
        correct: "a",
        difficulty: "easy",
        marks: 1,
      },
      teacherId
    );

    // Exact duplicate check
    const dup1 = await checkDuplicateQuestion(subjectScienceId, 10, stem);
    expect(dup1.isDuplicate).toBe(true);

    // Near duplicate check (slight capitalization/spacing)
    const dup2 = await checkDuplicateQuestion(subjectScienceId, 10, "  what is the speed of light in vacuum under standard conditions?  ");
    expect(dup2.isDuplicate).toBe(true);

    // Different subject or class -> not duplicate
    const dup3 = await checkDuplicateQuestion(subjectScienceId, 12, stem);
    expect(dup3.isDuplicate).toBe(false);

    // Unrelated stem -> not duplicate
    const dup4 = await checkDuplicateQuestion(subjectScienceId, 10, "State Ohm's law and derive V = IR.");
    expect(dup4.isDuplicate).toBe(false);
  });

  // =========================================================================
  // TEST 8: Auto-Pick Questions by Chapter & Difficulty
  // =========================================================================
  it("auto-picks questions matching requested difficulty counts", async () => {
    const picked = await autoPickQuestions({
      subjectId: subjectMathId,
      classLevel: 12,
      counts: {
        easy: 3,
        medium: 2,
        hard: 1,
      },
    });

    expect(picked.length).toBe(6);
    const easyCount = picked.filter((p) => p.difficulty === "easy").length;
    const medCount = picked.filter((p) => p.difficulty === "medium").length;
    const hardCount = picked.filter((p) => p.difficulty === "hard").length;

    expect(easyCount).toBe(3);
    expect(medCount).toBe(2);
    expect(hardCount).toBe(1);
  });

  // =========================================================================
  // TEST 9: Enrollment & Window Authorization
  // =========================================================================
  it("prevents unenrolled students from taking batch-restricted tests and honors attemptsAllowed", async () => {
    const q = await createQuestion(
      {
        subjectId: subjectMathId,
        classLevel: 12,
        type: "mcq_single",
        stem: "Enrollment check question",
        correct: "a",
        difficulty: "easy",
        marks: 1,
      },
      teacherId
    );

    const batchTest = await createTest(
      {
        title: "Exclusive Batch Test",
        batchId: testBatchId,
        subjectId: subjectMathId,
        chapterIds: [chapterIntegrationId],
        kind: "chapter_test",
        durationMinutes: 30,
        startsAt: new Date(Date.now() - 3600 * 1000).toISOString(),
        endsAt: new Date(Date.now() + 3600 * 1000).toISOString(),
        attemptsAllowed: 1,
        shuffleQuestions: false,
        shuffleOptions: false,
        showSolutions: "after_submit",
        status: "live",
        questionIds: [{ questionId: q.id, position: 1 }],
      },
      teacherId
    );

    // Unenrolled student should be rejected
    await expect(startTestAttempt(batchTest.id, unenrolledStudentId)).rejects.toThrow(
      "You are not enrolled in the batch"
    );

    // Enrolled student completes their 1 allowed attempt
    const att = await startTestAttempt(batchTest.id, student1Id);
    await submitTestAttempt(att.attemptId, student1Id);

    // Second attempt should be rejected because attemptsAllowed === 1
    await expect(startTestAttempt(batchTest.id, student1Id)).rejects.toThrow(
      "You have used all 1 attempt(s) allowed"
    );
  });

  // =========================================================================
  // TEST 10: Admin Results & Diagnostics
  // =========================================================================
  it("computes test admin metrics, score distribution, and question accuracy diagnostics", async () => {
    const q1 = await createQuestion(
      {
        subjectId: subjectMathId,
        classLevel: 12,
        type: "mcq_single",
        stem: "Diagnostic Q1",
        correct: "a",
        difficulty: "easy",
        marks: 2,
      },
      teacherId
    );

    const q2 = await createQuestion(
      {
        subjectId: subjectMathId,
        classLevel: 12,
        type: "mcq_single",
        stem: "Diagnostic Q2 (Hard problem)",
        correct: "b",
        difficulty: "hard",
        marks: 4,
      },
      teacherId
    );

    const diagTest = await createTest(
      {
        title: "Diagnostics Exam",
        batchId: testBatchId,
        subjectId: subjectMathId,
        chapterIds: [chapterIntegrationId],
        kind: "chapter_test",
        durationMinutes: 30,
        startsAt: new Date(Date.now() - 3600 * 1000).toISOString(),
        endsAt: new Date(Date.now() + 3600 * 1000).toISOString(),
        attemptsAllowed: 2,
        shuffleQuestions: false,
        shuffleOptions: false,
        showSolutions: "after_submit",
        status: "live",
        questionIds: [
          { questionId: q1.id, position: 1 },
          { questionId: q2.id, position: 2 },
        ],
      },
      teacherId
    );

    // Student 1: Q1 right, Q2 wrong
    const a1 = await startTestAttempt(diagTest.id, student1Id);
    await saveAttemptAnswers(a1.attemptId, student1Id, [
      { questionId: q1.id, answer: "a", timeSpentSeconds: 30 },
      { questionId: q2.id, answer: "c", timeSpentSeconds: 60 },
    ]);
    await submitTestAttempt(a1.attemptId, student1Id);

    // Student 2: Q1 right, Q2 wrong
    const a2 = await startTestAttempt(diagTest.id, student2Id);
    await saveAttemptAnswers(a2.attemptId, student2Id, [
      { questionId: q1.id, answer: "a", timeSpentSeconds: 40 },
      { questionId: q2.id, answer: "d", timeSpentSeconds: 70 },
    ]);
    await submitTestAttempt(a2.attemptId, student2Id);

    const adminStats = await getTestAdminResults(diagTest.id);

    expect(adminStats.totalParticipants).toBe(2);
    expect(adminStats.questionStats.length).toBe(2);

    // Q1 had 2 correct out of 2 -> 100% accuracy
    const q1Stat = adminStats.questionStats.find((q) => q.questionId === q1.id);
    expect(q1Stat?.accuracyPercentage).toBe(100);

    // Q2 had 0 correct out of 2 -> 0% accuracy (flagged as hard / low accuracy!)
    const q2Stat = adminStats.questionStats.find((q) => q.questionId === q2.id);
    expect(q2Stat?.accuracyPercentage).toBe(0);
    expect(q2Stat?.wrongCount).toBe(2);
  });

  // =========================================================================
  // TEST 11: Publishing Test Dispatches Push Notification
  // =========================================================================
  it("publishes test to live status and notifies batch students", async () => {
    const q = await createQuestion(
      {
        subjectId: subjectMathId,
        classLevel: 12,
        type: "mcq_single",
        stem: "Notification test question",
        correct: "a",
        difficulty: "easy",
        marks: 1,
      },
      teacherId
    );

    const draftTest = await createTest(
      {
        title: "Integrals Master Quiz",
        batchId: testBatchId,
        subjectId: subjectMathId,
        chapterIds: [chapterIntegrationId],
        kind: "chapter_test",
        durationMinutes: 30,
        status: "draft",
        questionIds: [{ questionId: q.id, position: 1 }],
      },
      teacherId
    );

    expect(draftTest.status).toBe("draft");

    const published = await publishTest(draftTest.id);
    expect(published.status).toBe("live");

    // Verify inbox notifications were delivered to enrolled students
    const notifications = await db
      .select()
      .from(schema.notifications)
      .where(eq(schema.notifications.userId, student1Id))
      .orderBy(desc(schema.notifications.createdAt))
      .limit(5);

    const testNotification = notifications.find((n) => n.title.includes("Integrals Master Quiz"));
    expect(testNotification).toBeDefined();
    expect(testNotification?.body).toContain("Integrals Master Quiz — 1 questions, 30 min");
  });

  // =========================================================================
  // TEST 12: Cron Endpoint /api/cron/test-attempts
  // =========================================================================
  it("Cron endpoint GET /api/cron/test-attempts triggers auto-submission and returns valid JSON", async () => {
    const { GET: cronHandler } = await import("../apps/web/src/app/api/cron/test-attempts/route");
    const req = new Request("http://localhost:3000/api/cron/test-attempts") as any;
    const res = await cronHandler(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(typeof data.processedCount).toBe("number");
  });
});
