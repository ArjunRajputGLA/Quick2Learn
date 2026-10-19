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
import { presignedGet, presignedPut } from "../storage";
import { notify } from "../notify";
import type {
  CreateDoubtInput,
  ReplyDoubtInput,
  AdminDoubtsQuery,
  DoubtItem,
  DoubtMessageItem,
  DoubtThreadResponse,
  DoubtCannedReplyItem,
} from "@quick2learn/shared";

export class ValidationError extends Error {
  readonly status = 400;
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

/**
 * Default canned replies seeded when none exist.
 */
const DEFAULT_CANNED_REPLIES = [
  {
    title: "Review Formula",
    category: "Math",
    body: "Please verify the algebraic formula in your textbook for this step before continuing. Pay special attention to signs.",
  },
  {
    title: "Step-by-Step Working",
    category: "General",
    body: "Please write down all intermediate calculation steps clearly on paper and re-upload a clear photo so we can pinpoint exactly where the error occurred.",
  },
  {
    title: "Watch Lecture Derivation",
    category: "Concept",
    body: "This concept is thoroughly derived step-by-step in our chapter lecture. Please review the video clip linked below.",
  },
  {
    title: "Sign / Direction Error",
    category: "Math",
    body: "Great attempt! Notice the sign error when transferring terms across the equals sign in step 2.",
  },
  {
    title: "Correct Approach",
    category: "General",
    body: "Your logic and reasoning are completely correct! Excellent work on solving this problem.",
  },
];

/**
 * Creates presigned PUT URLs for up to 3 doubt image attachments.
 */
export async function generateDoubtPresignedPutUrls(
  user: AuthUser,
  files: Array<{ filename: string; contentType: string; sizeBytes?: number }>
): Promise<Array<{ key: string; uploadUrl: string }>> {
  assert(!!user.id, "Authentication required", 401);
  if (files.length > 3) {
    throw new ValidationError("At most 3 photos allowed per doubt.");
  }

  const results: Array<{ key: string; uploadUrl: string }> = [];

  for (const file of files) {
    const cleanName = file.filename.toLowerCase().replace(/[^a-z0-9._-]/g, "_");
    const uniqueKey = `doubts/${user.id}/${Date.now()}-${Math.random().toString(36).substring(2, 8)}-${cleanName}`;
    const uploadUrl = await presignedPut(uniqueKey, file.contentType, file.sizeBytes);
    results.push({ key: uniqueKey, uploadUrl });
  }

  return results;
}

/**
 * Resolve presigned GET URLs for a list of storage keys.
 */
export async function resolveAttachmentUrls(keys: string[]): Promise<string[]> {
  if (!keys || keys.length === 0) return [];
  const urls = await Promise.all(
    keys.map(async (key) => {
      try {
        return await presignedGet(key, 86400); // 24 hours validity
      } catch (err) {
        console.warn(`[resolveAttachmentUrls] Failed to get signed URL for ${key}:`, err);
        return "";
      }
    })
  );
  return urls.filter(Boolean);
}

/**
 * Create a new student doubt with initial message and optional attachments.
 * Enforces the rule: A student may have at most 5 open doubts at once.
 */
export async function createDoubt(
  user: AuthUser,
  input: CreateDoubtInput,
  tx?: DatabaseExecutor
): Promise<DoubtItem> {
  assert(!!user.id, "Authentication required", 401);
  if (user.role === "parent") {
    throw new ForbiddenError("Parents cannot ask or post doubts.");
  }
  const d = tx || db;

  // 1. Enforce max 5 open doubts rule
  const [openCountRes] = await d
    .select({ count: sql<number>`count(*)::int` })
    .from(schema.doubts)
    .where(
      and(
        eq(schema.doubts.studentId, user.id),
        eq(schema.doubts.status, "open")
      )
    );

  const openCount = openCountRes?.count ?? 0;
  if (openCount >= 5) {
    throw new ValidationError(
      "A student may have at most 5 open doubts at once. Please wait for a teacher to reply or close resolved doubts."
    );
  }

  // 2. Validate subject exists
  const [subject] = await d
    .select({ id: schema.subjects.id, name: schema.subjects.name })
    .from(schema.subjects)
    .where(eq(schema.subjects.id, input.subjectId));

  if (!subject) {
    throw new ValidationError("Selected subject does not exist.");
  }

  // Validate chapter if provided
  let chapterTitle: string | undefined;
  if (input.chapterId) {
    const [chapter] = await d
      .select({ id: schema.chapters.id, title: schema.chapters.title })
      .from(schema.chapters)
      .where(eq(schema.chapters.id, input.chapterId));
    chapterTitle = chapter?.title;
  }

  // 3. Atomically insert doubt and initial message
  const now = new Date();
  const createdDoubt = await d.transaction(async (trx) => {
    const [newDoubt] = await trx
      .insert(schema.doubts)
      .values({
        studentId: user.id,
        batchId: input.batchId || null,
        subjectId: input.subjectId,
        chapterId: input.chapterId || null,
        sourceType: input.sourceType || "general",
        sourceId: input.sourceId || null,
        timestampSeconds: input.timestampSeconds ?? null,
        title: input.title.trim(),
        status: "open",
        assignedTeacherId: null,
        lastActivityAt: now,
        isHelpful: false,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    if (!newDoubt) {
      throw new Error("Failed to create doubt.");
    }

    await trx.insert(schema.doubtMessages).values({
      doubtId: newDoubt.id,
      authorId: user.id,
      body: input.body.trim(),
      attachmentKeys: input.attachmentKeys || [],
      createdAt: now,
    });

    return newDoubt;
  });

  // Notify teachers of new doubt
  notify(
    { role: "teacher" },
    {
      type: "new_doubt",
      title: "New Student Doubt",
      body: `${user.name || "A student"} asked: "${input.title}"`,
      data: {
        route: `/admin/doubts?doubtId=${createdDoubt.id}`,
        doubtId: createdDoubt.id,
      },
    }
  ).catch((e) => console.warn("[createDoubt] notify failed:", e));

  return {
    ...createdDoubt,
    subjectName: subject.name,
    chapterTitle,
    messagesCount: 1,
    firstMessageSnippet: input.body.slice(0, 100),
    hasAttachments: (input.attachmentKeys?.length ?? 0) > 0,
  };
}

/**
 * List the calling student's own doubts.
 * Students CANNOT see other students' doubts.
 */
export async function listStudentDoubts(
  user: AuthUser,
  statusFilter?: string,
  tx?: DatabaseExecutor
): Promise<{ doubts: DoubtItem[]; openCount: number }> {
  assert(!!user.id, "Authentication required", 401);
  const d = tx || db;

  const conditions = [eq(schema.doubts.studentId, user.id)];

  if (statusFilter && ["open", "answered", "closed"].includes(statusFilter)) {
    conditions.push(eq(schema.doubts.status, statusFilter as any));
  }

  const rows = await d
    .select({
      doubt: schema.doubts,
      subjectName: schema.subjects.name,
      chapterTitle: schema.chapters.title,
      batchName: schema.batches.title,
      teacherName: schema.user.name,
    })
    .from(schema.doubts)
    .innerJoin(schema.subjects, eq(schema.doubts.subjectId, schema.subjects.id))
    .leftJoin(schema.chapters, eq(schema.doubts.chapterId, schema.chapters.id))
    .leftJoin(schema.batches, eq(schema.doubts.batchId, schema.batches.id))
    .leftJoin(schema.user, eq(schema.doubts.assignedTeacherId, schema.user.id))
    .where(and(...conditions))
    .orderBy(desc(schema.doubts.lastActivityAt));

  // Get message snippets and counts
  const doubtIds = rows.map((r) => r.doubt.id);
  const messageStats = new Map<string, { count: number; firstSnippet: string; hasAttachments: boolean }>();

  if (doubtIds.length > 0) {
    const messages = await d
      .select({
        doubtId: schema.doubtMessages.doubtId,
        body: schema.doubtMessages.body,
        attachmentKeys: schema.doubtMessages.attachmentKeys,
        createdAt: schema.doubtMessages.createdAt,
      })
      .from(schema.doubtMessages)
      .where(inArray(schema.doubtMessages.doubtId, doubtIds))
      .orderBy(asc(schema.doubtMessages.createdAt));

    for (const msg of messages) {
      const existing = messageStats.get(msg.doubtId);
      const keys = (msg.attachmentKeys as string[]) || [];
      if (!existing) {
        messageStats.set(msg.doubtId, {
          count: 1,
          firstSnippet: msg.body.slice(0, 100),
          hasAttachments: keys.length > 0,
        });
      } else {
        existing.count += 1;
        if (keys.length > 0) existing.hasAttachments = true;
      }
    }
  }

  // Count open doubts for student
  const [openCountRes] = await d
    .select({ count: sql<number>`count(*)::int` })
    .from(schema.doubts)
    .where(
      and(
        eq(schema.doubts.studentId, user.id),
        eq(schema.doubts.status, "open")
      )
    );

  const formatted: DoubtItem[] = rows.map((r) => {
    const stats = messageStats.get(r.doubt.id);
    return {
      ...r.doubt,
      subjectName: r.subjectName,
      chapterTitle: r.chapterTitle ?? undefined,
      batchName: r.batchName ?? undefined,
      assignedTeacherName: r.teacherName ?? undefined,
      messagesCount: stats?.count ?? 0,
      firstMessageSnippet: stats?.firstSnippet,
      hasAttachments: stats?.hasAttachments ?? false,
    };
  });

  return {
    doubts: formatted,
    openCount: openCountRes?.count ?? 0,
  };
}

/**
 * Get full thread for a doubt.
 * Privacy rule: If caller is student, doubt.studentId === caller.id MUST match.
 */
export async function getDoubtThread(
  user: AuthUser,
  doubtId: string,
  tx?: DatabaseExecutor
): Promise<DoubtThreadResponse> {
  assert(!!user.id, "Authentication required", 401);
  const d = tx || db;

  const [row] = await d
    .select({
      doubt: schema.doubts,
      subjectName: schema.subjects.name,
      chapterTitle: schema.chapters.title,
      batchName: schema.batches.title,
      studentName: schema.user.name,
      teacherName: sql<string>`teacher_user.name`,
    })
    .from(schema.doubts)
    .innerJoin(schema.subjects, eq(schema.doubts.subjectId, schema.subjects.id))
    .innerJoin(schema.user, eq(schema.doubts.studentId, schema.user.id))
    .leftJoin(schema.chapters, eq(schema.doubts.chapterId, schema.chapters.id))
    .leftJoin(schema.batches, eq(schema.doubts.batchId, schema.batches.id))
    .leftJoin(
      sql`${schema.user} AS teacher_user`,
      sql`teacher_user.id = ${schema.doubts.assignedTeacherId}`
    )
    .where(eq(schema.doubts.id, doubtId));

  if (!row) {
    throw new NotFoundError("Doubt not found.");
  }

  // STRICT PRIVACY CHECK:
  // If caller is not staff, they MUST be the student who owns the doubt!
  if (!isStaff(user) && row.doubt.studentId !== user.id) {
    throw new ForbiddenError("You do not have permission to view this doubt.");
  }

  // Fetch messages with author details
  const rawMessages = await d
    .select({
      id: schema.doubtMessages.id,
      doubtId: schema.doubtMessages.doubtId,
      authorId: schema.doubtMessages.authorId,
      body: schema.doubtMessages.body,
      attachmentKeys: schema.doubtMessages.attachmentKeys,
      createdAt: schema.doubtMessages.createdAt,
      authorName: schema.user.name,
      authorRole: schema.profiles.role,
      authorAvatarUrl: schema.profiles.avatarUrl,
    })
    .from(schema.doubtMessages)
    .innerJoin(schema.user, eq(schema.doubtMessages.authorId, schema.user.id))
    .leftJoin(schema.profiles, eq(schema.doubtMessages.authorId, schema.profiles.userId))
    .where(eq(schema.doubtMessages.doubtId, doubtId))
    .orderBy(asc(schema.doubtMessages.createdAt));

  // Resolve presigned URLs for all message attachments
  const messages: DoubtMessageItem[] = await Promise.all(
    rawMessages.map(async (m) => {
      const keys = (m.attachmentKeys as string[]) || [];
      const attachmentUrls = await resolveAttachmentUrls(keys);
      return {
        id: m.id,
        doubtId: m.doubtId,
        authorId: m.authorId,
        authorName: m.authorName || "Anonymous",
        authorRole: m.authorRole || "student",
        authorAvatarUrl: m.authorAvatarUrl,
        body: m.body,
        attachmentKeys: keys,
        attachmentUrls,
        createdAt: m.createdAt,
      };
    })
  );

  // Fetch source context if applicable (lecture or test question)
  let sourceContext: DoubtThreadResponse["sourceContext"] = null;

  if (row.doubt.sourceType === "lecture" && row.doubt.sourceId) {
    const [vid] = await d
      .select({
        id: schema.youtubeVideos.id,
        title: schema.youtubeVideos.title,
        durationSeconds: schema.youtubeVideos.durationSeconds,
      })
      .from(schema.youtubeVideos)
      .where(eq(schema.youtubeVideos.id, row.doubt.sourceId));

    if (vid) {
      let timestampFormatted: string | undefined;
      if (row.doubt.timestampSeconds !== null && row.doubt.timestampSeconds !== undefined) {
        const mins = Math.floor(row.doubt.timestampSeconds / 60);
        const secs = row.doubt.timestampSeconds % 60;
        timestampFormatted = `${mins}:${secs.toString().padStart(2, "0")}`;
      }
      sourceContext = {
        lectureId: vid.id,
        lectureTitle: vid.title,
        lectureDurationFormatted: `${Math.floor(vid.durationSeconds / 60)} min`,
        timestampFormatted,
      };
    }
  } else if (row.doubt.sourceType === "test_question" && row.doubt.sourceId) {
    const [q] = await d
      .select({
        id: schema.questions.id,
        stem: schema.questions.stem,
        type: schema.questions.type,
        solution: schema.questions.solution,
      })
      .from(schema.questions)
      .where(eq(schema.questions.id, row.doubt.sourceId));

    if (q) {
      sourceContext = {
        questionId: q.id,
        questionStem: q.stem,
        questionType: q.type,
        questionSolution: q.solution,
      };
    }
  }

  const doubtItem: DoubtItem = {
    ...row.doubt,
    subjectName: row.subjectName,
    chapterTitle: row.chapterTitle ?? undefined,
    batchName: row.batchName ?? undefined,
    studentName: row.studentName,
    assignedTeacherName: row.teacherName ?? undefined,
    messagesCount: messages.length,
    hasAttachments: messages.some((m) => m.attachmentKeys.length > 0),
  };

  return {
    doubt: doubtItem,
    messages,
    sourceContext,
  };
}

/**
 * Add a reply message to a doubt thread.
 * If author is staff (teacher/admin):
 *   - Doubt status becomes 'answered'
 *   - assignedTeacherId is set
 *   - Student receives a push notification
 * If author is student:
 *   - Doubt status becomes 'open'
 *   - Teachers receive activity push
 */
export async function addDoubtMessage(
  user: AuthUser,
  doubtId: string,
  input: ReplyDoubtInput,
  tx?: DatabaseExecutor
): Promise<{ message: DoubtMessageItem; doubt: DoubtItem }> {
  assert(!!user.id, "Authentication required", 401);
  const d = tx || db;

  const [doubt] = await d
    .select()
    .from(schema.doubts)
    .where(eq(schema.doubts.id, doubtId));

  if (!doubt) {
    throw new NotFoundError("Doubt not found.");
  }

  const callerIsStaff = isStaff(user);

  // Privacy verification: If not staff, must be the owner student
  if (!callerIsStaff && doubt.studentId !== user.id) {
    throw new ForbiddenError("You do not have permission to reply to this doubt.");
  }

  // Format body: If lectureLink is provided by teacher, append timestamp link markdown
  let fullBody = input.body.trim();
  if (input.lectureLink) {
    const mins = Math.floor(input.lectureLink.timestampSeconds / 60);
    const secs = input.lectureLink.timestampSeconds % 60;
    const timeFormatted = `${mins}:${secs.toString().padStart(2, "0")}`;
    const lectureTitle = input.lectureLink.title || "Lecture";
    fullBody += `\n\n[▶ Watch ${lectureTitle} at ${timeFormatted}](/lecture/${input.lectureLink.lectureId}?t=${input.lectureLink.timestampSeconds})`;
  }

  const now = new Date();

  const { newMessage, updatedDoubt } = await d.transaction(async (trx) => {
    // 1. Insert message
    const [msg] = await trx
      .insert(schema.doubtMessages)
      .values({
        doubtId: doubt.id,
        authorId: user.id,
        body: fullBody,
        attachmentKeys: input.attachmentKeys || [],
        createdAt: now,
      })
      .returning();

    // 2. Update doubt status & activity
    const updateValues: Partial<typeof schema.doubts.$inferInsert> = {
      lastActivityAt: now,
      updatedAt: now,
    };

    if (callerIsStaff) {
      updateValues.status = "answered";
      updateValues.assignedTeacherId = user.id;
    } else {
      updateValues.status = "open";
    }

    const [updated] = await trx
      .update(schema.doubts)
      .set(updateValues)
      .where(eq(schema.doubts.id, doubt.id))
      .returning();

    if (!msg || !updated) {
      throw new Error("Failed to insert message or update doubt.");
    }

    return { newMessage: msg, updatedDoubt: updated };
  });

  // 3. Send Push Notifications
  if (callerIsStaff) {
    // Push notification to student on every teacher reply
    notify(
      [doubt.studentId],
      {
        type: "doubt_reply",
        title: "Doubt Answered",
        body: `${user.name || "Dinesh Sir"} replied to: "${doubt.title}"`,
        data: {
          route: `/doubt/${doubt.id}`,
          doubtId: doubt.id,
        },
      }
    ).catch((e) => console.warn("[addDoubtMessage] notify student failed:", e));
  } else {
    // Push notification to assigned teacher or all teachers
    const target = doubt.assignedTeacherId
      ? [doubt.assignedTeacherId]
      : { role: "teacher" as const };
    notify(
      target,
      {
        type: "doubt_activity",
        title: "Doubt Follow-up",
        body: `${user.name || "Student"} replied on: "${doubt.title}"`,
        data: {
          route: `/admin/doubts?doubtId=${doubt.id}`,
          doubtId: doubt.id,
        },
      }
    ).catch((e) => console.warn("[addDoubtMessage] notify teacher failed:", e));
  }

  // Resolve attachment URLs for response
  const attachmentUrls = await resolveAttachmentUrls(
    (newMessage.attachmentKeys as string[]) || []
  );

  return {
    message: {
      id: newMessage.id,
      doubtId: newMessage.doubtId,
      authorId: newMessage.authorId,
      authorName: user.name || (callerIsStaff ? "Teacher" : "Student"),
      authorRole: user.role || (callerIsStaff ? "teacher" : "student"),
      body: newMessage.body,
      attachmentKeys: (newMessage.attachmentKeys as string[]) || [],
      attachmentUrls,
      createdAt: newMessage.createdAt,
    },
    doubt: {
      ...updatedDoubt,
      isHelpful: updatedDoubt.isHelpful ?? false,
    },
  };
}

/**
 * Close a doubt. Can be triggered by the student or staff.
 */
export async function closeDoubt(
  user: AuthUser,
  doubtId: string,
  tx?: DatabaseExecutor
): Promise<DoubtItem> {
  assert(!!user.id, "Authentication required", 401);
  const d = tx || db;

  const [doubt] = await d
    .select()
    .from(schema.doubts)
    .where(eq(schema.doubts.id, doubtId));

  if (!doubt) {
    throw new NotFoundError("Doubt not found.");
  }

  if (!isStaff(user) && doubt.studentId !== user.id) {
    throw new ForbiddenError("You do not have permission to close this doubt.");
  }

  const now = new Date();
  const [updated] = await d
    .update(schema.doubts)
    .set({
      status: "closed",
      lastActivityAt: now,
      updatedAt: now,
    })
    .where(eq(schema.doubts.id, doubtId))
    .returning();

  if (!updated) {
    throw new NotFoundError("Doubt could not be updated.");
  }

  return updated;
}

/**
 * Mark doubt answer as helpful ("This solved it").
 * Marks isHelpful = true and status = 'closed'.
 */
export async function markDoubtHelpful(
  user: AuthUser,
  doubtId: string,
  tx?: DatabaseExecutor
): Promise<DoubtItem> {
  assert(!!user.id, "Authentication required", 401);
  const d = tx || db;

  const [doubt] = await d
    .select()
    .from(schema.doubts)
    .where(eq(schema.doubts.id, doubtId));

  if (!doubt) {
    throw new NotFoundError("Doubt not found.");
  }

  // Only the student can mark their doubt as helpful / solved
  if (doubt.studentId !== user.id) {
    throw new ForbiddenError("Only the student can mark this answer as helpful.");
  }

  const now = new Date();
  const [updated] = await d
    .update(schema.doubts)
    .set({
      isHelpful: true,
      status: "closed",
      lastActivityAt: now,
      updatedAt: now,
    })
    .where(eq(schema.doubts.id, doubtId))
    .returning();

  // If teacher was assigned, send them positive feedback push
  if (doubt.assignedTeacherId) {
    notify(
      [doubt.assignedTeacherId],
      {
        type: "doubt_solved",
        title: "Doubt Solved! ⭐",
        body: `${user.name || "Student"} marked your explanation as helpful for "${doubt.title}"`,
        data: {
          route: `/admin/doubts?doubtId=${doubt.id}`,
          doubtId: doubt.id,
        },
      }
    ).catch((e) => console.warn("[markDoubtHelpful] notify teacher failed:", e));
  }

  if (!updated) {
    throw new NotFoundError("Doubt could not be updated.");
  }

  return updated;
}

/**
 * Admin / Teacher Inbox listing with filters:
 * - status: 'unanswered' (status = 'open'), 'open', 'answered', 'closed', 'all'
 * - subjectId
 * - batchId
 * - ORDER BY oldest first for unanswered/open doubts!
 */
export async function listAdminDoubts(
  user: AuthUser,
  query: AdminDoubtsQuery,
  tx?: DatabaseExecutor
): Promise<{ doubts: DoubtItem[]; totalCount: number; openCount: number }> {
  assert(isStaff(user), "Only teachers and admins can view the doubts inbox.", 403);
  const d = tx || db;

  const conditions = [];

  if (query.status === "unanswered" || query.status === "open") {
    conditions.push(eq(schema.doubts.status, "open"));
  } else if (query.status === "answered") {
    conditions.push(eq(schema.doubts.status, "answered"));
  } else if (query.status === "closed") {
    conditions.push(eq(schema.doubts.status, "closed"));
  }

  if (query.subjectId) {
    conditions.push(eq(schema.doubts.subjectId, query.subjectId));
  }

  if (query.batchId) {
    conditions.push(eq(schema.doubts.batchId, query.batchId));
  }

  // For unanswered / open doubts, show OLDEST FIRST so students waiting longest are addressed first!
  const isOldestFirst = query.status === "unanswered" || query.status === "open";
  const orderClause = isOldestFirst
    ? asc(schema.doubts.lastActivityAt)
    : desc(schema.doubts.lastActivityAt);

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const rows = await d
    .select({
      doubt: schema.doubts,
      subjectName: schema.subjects.name,
      chapterTitle: schema.chapters.title,
      batchName: schema.batches.title,
      studentName: schema.user.name,
      studentPhone: schema.profiles.phone,
      teacherName: sql<string>`teacher_user.name`,
    })
    .from(schema.doubts)
    .innerJoin(schema.subjects, eq(schema.doubts.subjectId, schema.subjects.id))
    .innerJoin(schema.user, eq(schema.doubts.studentId, schema.user.id))
    .leftJoin(schema.profiles, eq(schema.doubts.studentId, schema.profiles.userId))
    .leftJoin(schema.chapters, eq(schema.doubts.chapterId, schema.chapters.id))
    .leftJoin(schema.batches, eq(schema.doubts.batchId, schema.batches.id))
    .leftJoin(
      sql`${schema.user} AS teacher_user`,
      sql`teacher_user.id = ${schema.doubts.assignedTeacherId}`
    )
    .where(whereClause)
    .orderBy(orderClause)
    .limit(query.limit)
    .offset((query.page - 1) * query.limit);

  // Total open count
  const [openCountRes] = await d
    .select({ count: sql<number>`count(*)::int` })
    .from(schema.doubts)
    .where(eq(schema.doubts.status, "open"));

  // Message stats
  const doubtIds = rows.map((r) => r.doubt.id);
  const messageStats = new Map<string, { count: number; firstSnippet: string; hasAttachments: boolean }>();

  if (doubtIds.length > 0) {
    const messages = await d
      .select({
        doubtId: schema.doubtMessages.doubtId,
        body: schema.doubtMessages.body,
        attachmentKeys: schema.doubtMessages.attachmentKeys,
        createdAt: schema.doubtMessages.createdAt,
      })
      .from(schema.doubtMessages)
      .where(inArray(schema.doubtMessages.doubtId, doubtIds))
      .orderBy(asc(schema.doubtMessages.createdAt));

    for (const msg of messages) {
      const existing = messageStats.get(msg.doubtId);
      const keys = (msg.attachmentKeys as string[]) || [];
      if (!existing) {
        messageStats.set(msg.doubtId, {
          count: 1,
          firstSnippet: msg.body.slice(0, 100),
          hasAttachments: keys.length > 0,
        });
      } else {
        existing.count += 1;
        if (keys.length > 0) existing.hasAttachments = true;
      }
    }
  }

  const doubts: DoubtItem[] = rows.map((r) => {
    const stats = messageStats.get(r.doubt.id);
    return {
      ...r.doubt,
      subjectName: r.subjectName,
      chapterTitle: r.chapterTitle ?? undefined,
      batchName: r.batchName ?? undefined,
      studentName: r.studentName,
      studentPhone: r.studentPhone,
      assignedTeacherName: r.teacherName ?? undefined,
      messagesCount: stats?.count ?? 0,
      firstMessageSnippet: stats?.firstSnippet,
      hasAttachments: stats?.hasAttachments ?? false,
    };
  });

  return {
    doubts,
    totalCount: doubts.length,
    openCount: openCountRes?.count ?? 0,
  };
}

/**
 * List saved canned replies for teachers.
 * Seeds defaults if table is empty.
 */
export async function listCannedReplies(
  user: AuthUser,
  tx?: DatabaseExecutor
): Promise<DoubtCannedReplyItem[]> {
  assert(isStaff(user), "Only teachers and admins can view canned replies.", 403);
  const d = tx || db;

  let rows = await d.select().from(schema.doubtCannedReplies).orderBy(asc(schema.doubtCannedReplies.title));

  if (rows.length === 0) {
    // Seed default canned replies
    await d.insert(schema.doubtCannedReplies).values(
      DEFAULT_CANNED_REPLIES.map((r) => ({
        title: r.title,
        body: r.body,
        category: r.category,
        createdBy: user.id,
      }))
    );
    rows = await d.select().from(schema.doubtCannedReplies).orderBy(asc(schema.doubtCannedReplies.title));
  }

  return rows;
}

/**
 * Create a new canned reply.
 */
export async function createCannedReply(
  user: AuthUser,
  input: { title: string; body: string; category?: string },
  tx?: DatabaseExecutor
): Promise<DoubtCannedReplyItem> {
  assert(isStaff(user), "Only teachers and admins can create canned replies.", 403);
  const d = tx || db;

  const [created] = await d
    .insert(schema.doubtCannedReplies)
    .values({
      title: input.title.trim(),
      body: input.body.trim(),
      category: input.category?.trim() || "general",
      createdBy: user.id,
    })
    .returning();

  if (!created) {
    throw new Error("Failed to create canned reply.");
  }

  return created;
}

/**
 * Daily digest push to teachers with open doubt count.
 */
export async function sendDailyDoubtsDigest(): Promise<{ openCount: number; notified: boolean }> {
  const [openCountRes] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(schema.doubts)
    .where(eq(schema.doubts.status, "open"));

  const openCount = openCountRes?.count ?? 0;
  if (openCount <= 0) {
    return { openCount: 0, notified: false };
  }

  await notify(
    { role: "teacher" },
    {
      type: "doubts_digest",
      title: "Daily Doubts Digest",
      body: `You have ${openCount} open student doubt${openCount > 1 ? "s" : ""} waiting for resolution.`,
      data: {
        route: "/admin/doubts",
      },
    }
  );

  return { openCount, notified: true };
}
