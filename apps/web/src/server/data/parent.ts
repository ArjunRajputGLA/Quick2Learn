import "server-only";
import {
  db,
  schema,
  eq,
  and,
  sql,
  gt,
  gte,
  isNull,
  inArray,
  desc,
  asc,
  type DatabaseExecutor,
} from "@quick2learn/db";
import { type AuthUser, assert, isAdmin, ForbiddenError, NotFoundError } from "../authz";
import { notify } from "../notify";
import { formatINR, type ParentHomeResponse } from "@quick2learn/shared";

/**
 * Extracts the 10-digit Indian phone number from any formatted phone string.
 */
export function normalizeIndianPhoneDigits(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return digits.slice(-10);
}

/**
 * Formats an Indian phone number to E.164 (+91XXXXXXXXXX).
 */
export function formatIndianE164(phone: string): string {
  const digits = normalizeIndianPhoneDigits(phone);
  return digits.length === 10 ? `+91${digits}` : phone;
}

/**
 * Links a parent to all students whose profiles.parent_phone matches the parent's phone.
 */
export async function linkParentToMatchingStudents(
  parentUserId: string,
  parentPhone: string
) {
  const digits = normalizeIndianPhoneDigits(parentPhone);
  if (digits.length !== 10) {
    return [];
  }

  // Find students whose parentPhone contains the matching 10 digits
  const matchingStudents = await db
    .select({
      id: schema.profiles.id,
      userId: schema.profiles.userId,
      fullName: schema.profiles.fullName,
      phone: schema.profiles.phone,
      classLevel: schema.profiles.classLevel,
      board: schema.profiles.board,
      school: schema.profiles.school,
      avatarUrl: schema.profiles.avatarUrl,
    })
    .from(schema.profiles)
    .where(
      and(
        sql`${schema.profiles.parentPhone} IS NOT NULL`,
        sql`RIGHT(REGEXP_REPLACE(${schema.profiles.parentPhone}, '\D', '', 'g'), 10) = ${digits}`
      )
    );

  const linked = [];
  for (const student of matchingStudents) {
    // A user cannot link themselves as their own parent
    if (student.userId === parentUserId) continue;

    await db
      .insert(schema.parentLinks)
      .values({
        parentUserId,
        studentUserId: student.userId,
        relation: "parent",
        verifiedAt: new Date(),
      })
      .onConflictDoNothing({
        target: [schema.parentLinks.parentUserId, schema.parentLinks.studentUserId],
      });

    linked.push(student);
  }

  return linked;
}

/**
 * Returns all students linked to a parent account.
 */
export async function getLinkedStudentsForParent(parentUserId: string) {
  const rows = await db
    .select({
      id: schema.profiles.userId,
      userId: schema.profiles.userId,
      fullName: schema.profiles.fullName,
      phone: schema.profiles.phone,
      classLevel: schema.profiles.classLevel,
      board: schema.profiles.board,
      school: schema.profiles.school,
      avatarUrl: schema.profiles.avatarUrl,
      relation: schema.parentLinks.relation,
      verifiedAt: schema.parentLinks.verifiedAt,
    })
    .from(schema.parentLinks)
    .innerJoin(
      schema.profiles,
      eq(schema.parentLinks.studentUserId, schema.profiles.userId)
    )
    .where(eq(schema.parentLinks.parentUserId, parentUserId));

  return rows;
}

/**
 * Checks if a parent is linked to a specific student.
 */
export async function isParentLinkedToStudent(
  parentUserId: string,
  studentUserId: string
): Promise<boolean> {
  const [link] = await db
    .select({ id: schema.parentLinks.id })
    .from(schema.parentLinks)
    .where(
      and(
        eq(schema.parentLinks.parentUserId, parentUserId),
        eq(schema.parentLinks.studentUserId, studentUserId)
      )
    )
    .limit(1);

  return !!link;
}

/**
 * Generates an ambiguous-character-free 6-character alphanumeric invite code valid for 24 hours.
 */
export async function generateStudentParentInviteCode(studentUserId: string) {
  // Check for an existing valid code first
  const existing = await getActiveStudentInviteCode(studentUserId);
  if (existing) {
    return existing;
  }

  // 6-character code avoiding 0/O, 1/I, L, etc.
  const chars = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  const [inserted] = await db
    .insert(schema.parentInviteCodes)
    .values({
      studentUserId,
      code,
      expiresAt,
    })
    .returning();

  if (!inserted) {
    throw new Error("Failed to generate parent invite code");
  }

  return {
    code: inserted.code,
    expiresAt: inserted.expiresAt,
  };
}

/**
 * Retrieves the currently active, unexpired, and unused invite code for a student.
 */
export async function getActiveStudentInviteCode(studentUserId: string) {
  const [record] = await db
    .select({
      code: schema.parentInviteCodes.code,
      expiresAt: schema.parentInviteCodes.expiresAt,
    })
    .from(schema.parentInviteCodes)
    .where(
      and(
        eq(schema.parentInviteCodes.studentUserId, studentUserId),
        isNull(schema.parentInviteCodes.usedAt),
        gt(schema.parentInviteCodes.expiresAt, new Date())
      )
    )
    .limit(1);

  return record || null;
}

/**
 * Parent claims a student invite code, creating a verified parent_links record.
 */
export async function claimParentInviteCode(
  parentUserId: string,
  rawCode: string
) {
  const code = rawCode.trim().toUpperCase();

  const [invite] = await db
    .select()
    .from(schema.parentInviteCodes)
    .where(
      and(
        eq(schema.parentInviteCodes.code, code),
        isNull(schema.parentInviteCodes.usedAt),
        gt(schema.parentInviteCodes.expiresAt, new Date())
      )
    )
    .limit(1);

  if (!invite) {
    throw new NotFoundError("Invalid or expired parent invite code.");
  }

  if (invite.studentUserId === parentUserId) {
    throw new ForbiddenError("You cannot link yourself as your own student.");
  }

  // Run in transaction: mark code used, insert parent link
  return await db.transaction(async (tx) => {
    await tx
      .update(schema.parentInviteCodes)
      .set({
        usedAt: new Date(),
        usedByParentId: parentUserId,
      })
      .where(eq(schema.parentInviteCodes.id, invite.id));

    await tx
      .insert(schema.parentLinks)
      .values({
        parentUserId,
        studentUserId: invite.studentUserId,
        relation: "parent",
        verifiedAt: new Date(),
      })
      .onConflictDoNothing({
        target: [schema.parentLinks.parentUserId, schema.parentLinks.studentUserId],
      });

    const [studentProfile] = await tx
      .select({
        id: schema.profiles.userId,
        userId: schema.profiles.userId,
        fullName: schema.profiles.fullName,
        phone: schema.profiles.phone,
        classLevel: schema.profiles.classLevel,
        board: schema.profiles.board,
        school: schema.profiles.school,
        avatarUrl: schema.profiles.avatarUrl,
      })
      .from(schema.profiles)
      .where(eq(schema.profiles.userId, invite.studentUserId))
      .limit(1);

    return studentProfile;
  });
}

/**
 * Retrieves the comprehensive Parent Home dashboard payload for a selected child.
 */
export async function getParentHomeData(
  user: AuthUser,
  studentIdParam?: string,
  tx?: DatabaseExecutor
): Promise<ParentHomeResponse> {
  assert(!!user?.id, "Authentication required to view parent home.", 401);
  const d = tx || db;

  let targetStudentId = studentIdParam;

  // If studentId not specified, pick first linked child
  if (!targetStudentId) {
    const linked = await getLinkedStudentsForParent(user.id);
    if (linked.length === 0) {
      throw new NotFoundError("No linked students found for this parent account.");
    }
    targetStudentId = linked[0]!.userId;
  }

  // Authorization: if not admin/teacher, verify parent link
  if (user.role !== "admin" && user.role !== "teacher") {
    const isLinked = await isParentLinkedToStudent(user.id, targetStudentId);
    if (!isLinked) {
      throw new ForbiddenError("You are not authorized to view details for this student.");
    }
  }

  // 1. Fetch student info
  const [studentProfile] = await d
    .select({
      id: schema.profiles.id,
      userId: schema.profiles.userId,
      fullName: schema.profiles.fullName,
      classLevel: schema.profiles.classLevel,
      board: schema.profiles.board,
      avatarUrl: schema.profiles.avatarUrl,
    })
    .from(schema.profiles)
    .where(eq(schema.profiles.userId, targetStudentId))
    .limit(1);

  if (!studentProfile) {
    throw new NotFoundError("Student profile not found.");
  }

  const childInfo = {
    id: studentProfile.userId,
    userId: studentProfile.userId,
    fullName: studentProfile.fullName || "Student",
    classLevel: studentProfile.classLevel ?? null,
    board: studentProfile.board as "cbse" | "icse" | "isc" | null,
    avatarUrl: studentProfile.avatarUrl ?? null,
  };

  // 2. This week's attendance (Monday to Sunday)
  const now = new Date();
  const dayOfWeek = (now.getDay() + 6) % 7; // Monday = 0
  const monday = new Date(now);
  monday.setDate(now.getDate() - dayOfWeek);
  const mondayStr = monday.toISOString().split("T")[0]!;

  const weekAttendanceRecords = await d
    .select({
      status: schema.attendanceRecords.status,
      date: schema.attendanceRecords.date,
    })
    .from(schema.attendanceRecords)
    .where(
      and(
        eq(schema.attendanceRecords.studentId, targetStudentId),
        gte(schema.attendanceRecords.date, mondayStr)
      )
    );

  const presentDays = weekAttendanceRecords.filter(
    (r) => r.status === "present" || r.status === "late"
  ).length;
  const absentDays = weekAttendanceRecords.filter((r) => r.status === "absent").length;
  const totalDays = weekAttendanceRecords.length;
  const attendancePercentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 100;
  const summaryText = `${presentDays} Present • ${absentDays} Absent this week`;

  const attendanceThisWeek = {
    presentDays,
    absentDays,
    totalDays,
    percentage: attendancePercentage,
    summaryText,
  };

  // 3. Latest test score with change from previous test
  const recentAttempts = await d
    .select({
      id: schema.testAttempts.id,
      testId: schema.testAttempts.testId,
      score: schema.testAttempts.score,
      submittedAt: schema.testAttempts.submittedAt,
      testTitle: schema.tests.title,
      totalMarks: schema.tests.totalMarks,
    })
    .from(schema.testAttempts)
    .innerJoin(schema.tests, eq(schema.testAttempts.testId, schema.tests.id))
    .where(
      and(
        eq(schema.testAttempts.studentId, targetStudentId),
        sql`${schema.testAttempts.status} IN ('submitted', 'auto_submitted')`
      )
    )
    .orderBy(desc(schema.testAttempts.submittedAt))
    .limit(2);

  let latestTestScore = null;
  if (recentAttempts.length > 0) {
    const latest = recentAttempts[0]!;
    const score = Number(latest.score);
    const totalMarks = Number(latest.totalMarks) || 1;
    const percentage = Number(((score / totalMarks) * 100).toFixed(1));

    let previousPercentage: number | null = null;
    let changePercentage: number | null = null;
    let changeLabel: string | null = null;

    if (recentAttempts.length > 1) {
      const prev = recentAttempts[1]!;
      const prevScore = Number(prev.score);
      const prevTotal = Number(prev.totalMarks) || 1;
      previousPercentage = Number(((prevScore / prevTotal) * 100).toFixed(1));
      changePercentage = Number((percentage - previousPercentage).toFixed(1));
      changeLabel =
        changePercentage >= 0
          ? `+${changePercentage}% from previous test`
          : `${changePercentage}% from previous test`;
    } else {
      changeLabel = "First completed test";
    }

    latestTestScore = {
      testId: latest.testId,
      testTitle: latest.testTitle,
      attemptId: latest.id,
      score,
      totalMarks,
      percentage,
      previousPercentage,
      changePercentage,
      changeLabel,
      submittedAt: latest.submittedAt ? latest.submittedAt.toISOString() : new Date().toISOString(),
    };
  }

  // 4. Next class (upcoming live session or batch schedule)
  const enrollments = await d
    .select({
      batchId: schema.enrollments.batchId,
      batchTitle: schema.batches.title,
    })
    .from(schema.enrollments)
    .innerJoin(schema.batches, eq(schema.enrollments.batchId, schema.batches.id))
    .where(
      and(
        eq(schema.enrollments.studentId, targetStudentId),
        eq(schema.enrollments.status, "active")
      )
    );

  const batchIds = enrollments.map((e) => e.batchId);
  let nextClass = null;

  if (batchIds.length > 0) {
    const upcomingSessions = await d
      .select({
        id: schema.liveSessions.id,
        batchId: schema.liveSessions.batchId,
        title: schema.liveSessions.title,
        startsAt: schema.liveSessions.startsAt,
        status: schema.liveSessions.status,
        batchTitle: schema.batches.title,
      })
      .from(schema.liveSessions)
      .innerJoin(schema.batches, eq(schema.liveSessions.batchId, schema.batches.id))
      .where(
        and(
          inArray(schema.liveSessions.batchId, batchIds),
          sql`${schema.liveSessions.status} IN ('scheduled', 'live')`,
          sql`${schema.liveSessions.startsAt} >= now() - interval '2 hours'`
        )
      )
      .orderBy(asc(schema.liveSessions.startsAt))
      .limit(1);

    if (upcomingSessions.length > 0) {
      const s = upcomingSessions[0]!;
      const isLive = s.status === "live";
      const timeStr = isLive
        ? "Live Now"
        : new Date(s.startsAt).toLocaleTimeString("en-IN", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          });

      nextClass = {
        batchId: s.batchId,
        batchTitle: s.batchTitle,
        subjectName: "Mathematics",
        isLive,
        timeOrCountdown: isLive ? "Class is in progress" : `Today at ${timeStr}`,
        startsAt: s.startsAt ? s.startsAt.toISOString() : null,
      };
    } else {
      // Default to next regular batch class
      const firstBatch = enrollments[0]!;
      nextClass = {
        batchId: firstBatch.batchId,
        batchTitle: firstBatch.batchTitle,
        subjectName: "Mathematics",
        isLive: false,
        timeOrCountdown: "Next scheduled lecture",
        startsAt: null,
      };
    }
  }

  // 5. Fee alert
  let feeAlert: {
    status: "all_clear" | "due_soon" | "overdue";
    amountPaise: number;
    formattedAmount: string;
    dueDate: string | null;
    dueLabel: string | null;
    message: string;
  } = {
    status: "all_clear",
    amountPaise: 0,
    formattedAmount: "₹0",
    dueDate: null,
    dueLabel: null,
    message: "All institute fee dues are cleared.",
  };

  if (batchIds.length > 0) {
    const studentDues = await d
      .select({
        id: schema.feeDues.id,
        label: schema.feeDues.label,
        amountPaise: schema.feeDues.amountPaise,
        dueDate: schema.feeDues.dueDate,
        status: schema.feeDues.status,
      })
      .from(schema.feeDues)
      .innerJoin(schema.enrollments, eq(schema.feeDues.enrollmentId, schema.enrollments.id))
      .where(
        and(
          eq(schema.enrollments.studentId, targetStudentId),
          eq(schema.feeDues.status, "due")
        )
      )
      .orderBy(asc(schema.feeDues.dueDate));

    if (studentDues.length > 0) {
      const totalDuePaise = studentDues.reduce((sum, d) => sum + d.amountPaise, 0);
      const earliestDue = studentDues[0]!;
      const today = new Date().toISOString().split("T")[0]!;

      const isOverdue = earliestDue.dueDate < today;
      const formattedAmount = formatINR(totalDuePaise);

      feeAlert = {
        status: isOverdue ? "overdue" : "due_soon",
        amountPaise: totalDuePaise,
        formattedAmount,
        dueDate: earliestDue.dueDate,
        dueLabel: earliestDue.label,
        message: isOverdue
          ? `Overdue fee: ${formattedAmount} was due on ${earliestDue.dueDate}. Please clear dues.`
          : `Upcoming due: ${formattedAmount} due on ${earliestDue.dueDate}.`,
      };
    }
  }

  // 6. Latest announcements from child's batches
  let announcementsList: Array<{
    id: string;
    title: string;
    body: string;
    batchTitle?: string | null;
    createdAt: string;
  }> = [];

  const announcementsConditions = [eq(schema.announcements.audience, "all_students")];
  if (batchIds.length > 0) {
    announcementsConditions.push(
      and(
        eq(schema.announcements.audience, "batch"),
        inArray(schema.announcements.batchId, batchIds)
      )!
    );
  }

  const rawAnnouncements = await d
    .select({
      id: schema.announcements.id,
      title: schema.announcements.title,
      body: schema.announcements.body,
      batchTitle: schema.batches.title,
      createdAt: schema.announcements.createdAt,
    })
    .from(schema.announcements)
    .leftJoin(schema.batches, eq(schema.announcements.batchId, schema.batches.id))
    .where(sql`(${schema.announcements.audience} = 'all_students' ${
      batchIds.length > 0 ? sql`OR (${schema.announcements.audience} = 'batch' AND ${schema.announcements.batchId} IN ${batchIds})` : sql``
    })`)
    .orderBy(desc(schema.announcements.createdAt))
    .limit(5);

  announcementsList = rawAnnouncements.map((a) => ({
    id: a.id,
    title: a.title,
    body: a.body,
    batchTitle: a.batchTitle ?? null,
    createdAt: a.createdAt ? a.createdAt.toISOString() : new Date().toISOString(),
  }));

  // 7. Message the Institute (WhatsApp prefilled)
  const institutePhone = "919412277888";
  const studentDisplayName = childInfo.fullName;
  const prefilledText = `Hello Quick2Learn Institute, I am writing regarding my child ${studentDisplayName} (Class ${childInfo.classLevel || 10} ${childInfo.board?.toUpperCase() || "CBSE"}).`;
  const whatsappUrl = `https://wa.me/${institutePhone}?text=${encodeURIComponent(prefilledText)}`;

  return {
    child: childInfo,
    attendanceThisWeek,
    latestTestScore,
    nextClass,
    feeAlert,
    announcements: announcementsList,
    instituteWhatsApp: {
      number: institutePhone,
      prefilledText,
      url: whatsappUrl,
    },
  };
}

/**
 * Admin links a parent to a student by email or mobile number.
 */
export async function adminLinkParentToStudent(
  adminUser: AuthUser,
  studentUserId: string,
  parentIdentifier: string,
  relation: string = "parent",
  tx?: DatabaseExecutor
) {
  assert(isAdmin(adminUser), "Only administrators can manually link parents to students.", 403);
  const d = tx || db;

  // 1. Verify student exists
  const [studentUser] = await d
    .select({ id: schema.user.id, name: schema.user.name })
    .from(schema.user)
    .where(eq(schema.user.id, studentUserId))
    .limit(1);

  if (!studentUser) {
    throw new NotFoundError("Student user not found.");
  }

  // 2. Identify parent user
  const cleanId = parentIdentifier.trim();
  let parentUser = null;

  if (cleanId.includes("@")) {
    const emailLower = cleanId.toLowerCase();
    const [found] = await d
      .select({ id: schema.user.id, name: schema.user.name, email: schema.user.email })
      .from(schema.user)
      .where(eq(schema.user.email, emailLower))
      .limit(1);

    if (found) {
      parentUser = found;
    } else {
      // Auto-provision parent user account for this email
      const parentId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const [createdUser] = await d
        .insert(schema.user)
        .values({
          id: parentId,
          name: "Parent",
          email: emailLower,
          emailVerified: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning({ id: schema.user.id, name: schema.user.name, email: schema.user.email });

      await d.insert(schema.profiles).values({
        userId: parentId,
        fullName: "Parent",
        role: "parent",
        onboardedAt: new Date(),
      });

      parentUser = createdUser;
    }
  } else {
    const digits = normalizeIndianPhoneDigits(cleanId);
    if (digits.length !== 10) {
      throw new Error("Please enter a valid email address or 10-digit mobile number.");
    }
    const e164 = formatIndianE164(digits);

    // Search by phone in user or profiles
    const [foundUser] = await d
      .select({ id: schema.user.id, name: schema.user.name, email: schema.user.email })
      .from(schema.user)
      .where(sql`${schema.user.phoneNumber} = ${e164} OR ${schema.user.email} = ${`${digits}@phone.quick2learn.in`}`)
      .limit(1);

    if (foundUser) {
      parentUser = foundUser;
    } else {
      const [foundProfile] = await d
        .select({ userId: schema.profiles.userId })
        .from(schema.profiles)
        .where(eq(schema.profiles.phone, digits))
        .limit(1);

      if (foundProfile) {
        const [usr] = await d
          .select({ id: schema.user.id, name: schema.user.name, email: schema.user.email })
          .from(schema.user)
          .where(eq(schema.user.id, foundProfile.userId))
          .limit(1);
        parentUser = usr;
      } else {
        // Create new parent user account
        const parentId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        const dummyEmail = `${digits}@phone.quick2learn.in`;
        const [createdUser] = await d
          .insert(schema.user)
          .values({
            id: parentId,
            name: "Parent",
            email: dummyEmail,
            emailVerified: true,
            phoneNumber: e164,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning();

        await d.insert(schema.profiles).values({
          userId: parentId,
          fullName: "Parent",
          role: "parent",
          phone: digits,
          onboardedAt: new Date(),
        });

        parentUser = createdUser;
      }
    }
  }

  if (!parentUser) {
    throw new NotFoundError("Parent user could not be found or created.");
  }

  if (parentUser.id === studentUserId) {
    throw new ForbiddenError("Cannot link a student as their own parent.");
  }

  // Ensure role is parent
  await d
    .update(schema.profiles)
    .set({ role: "parent" })
    .where(eq(schema.profiles.userId, parentUser.id));

  // 3. Create parent link record
  const [link] = await d
    .insert(schema.parentLinks)
    .values({
      parentUserId: parentUser.id,
      studentUserId,
      relation,
      verifiedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [schema.parentLinks.parentUserId, schema.parentLinks.studentUserId],
      set: { relation, verifiedAt: new Date() },
    })
    .returning();

  // 4. Audit log
  await d.insert(schema.auditLog).values({
    actorId: adminUser.id,
    action: "admin_link_parent",
    entity: "student",
    entityId: studentUserId,
    diff: {
      parentUserId: parentUser.id,
      parentEmail: parentUser.email,
      relation,
    },
  });

  return {
    success: true,
    link,
    parentUser,
  };
}

/**
 * Admin unlinks a parent from a student.
 */
export async function adminUnlinkParentFromStudent(
  adminUser: AuthUser,
  linkId: string,
  tx?: DatabaseExecutor
) {
  assert(isAdmin(adminUser), "Only administrators can remove parent links.", 403);
  const d = tx || db;

  const [existing] = await d
    .select()
    .from(schema.parentLinks)
    .where(eq(schema.parentLinks.id, linkId))
    .limit(1);

  if (!existing) {
    throw new NotFoundError("Parent link not found.");
  }

  await d.delete(schema.parentLinks).where(eq(schema.parentLinks.id, linkId));

  await d.insert(schema.auditLog).values({
    actorId: adminUser.id,
    action: "admin_unlink_parent",
    entity: "student",
    entityId: existing.studentUserId,
    diff: {
      parentUserId: existing.parentUserId,
      linkId,
    },
  });

  return { success: true };
}

/**
 * Checks for upcoming (due in 3 days) or overdue fee dues and dispatches notifications to linked parents.
 */
export async function notifyFeeDuesToParents(tx?: DatabaseExecutor) {
  const d = tx || db;
  const today = new Date().toISOString().split("T")[0]!;
  const threeDaysLater = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0]!;

  // Find all active dues due on or before 3 days from now
  const pendingDues = await d
    .select({
      dueId: schema.feeDues.id,
      label: schema.feeDues.label,
      amountPaise: schema.feeDues.amountPaise,
      dueDate: schema.feeDues.dueDate,
      studentId: schema.enrollments.studentId,
      batchTitle: schema.batches.title,
    })
    .from(schema.feeDues)
    .innerJoin(schema.enrollments, eq(schema.feeDues.enrollmentId, schema.enrollments.id))
    .innerJoin(schema.batches, eq(schema.enrollments.batchId, schema.batches.id))
    .where(
      and(
        eq(schema.feeDues.status, "due"),
        sql`${schema.feeDues.dueDate} <= ${threeDaysLater}`
      )
    );

  let notifiedCount = 0;

  for (const due of pendingDues) {
    try {
      const parentLinks = await d
        .select({ parentUserId: schema.parentLinks.parentUserId })
        .from(schema.parentLinks)
        .where(eq(schema.parentLinks.studentUserId, due.studentId));

      if (parentLinks.length === 0) continue;

      const [studentProfile] = await d
        .select({ fullName: schema.profiles.fullName })
        .from(schema.profiles)
        .where(eq(schema.profiles.userId, due.studentId))
        .limit(1);

      const studentName = studentProfile?.fullName || "Your child";
      const isOverdue = due.dueDate < today;
      const formattedAmount = formatINR(due.amountPaise);

      const title = isOverdue
        ? `Fee Overdue Alert: ${studentName}`
        : `Fee Due in 3 Days: ${studentName}`;
      const body = isOverdue
        ? `Installment of ${formattedAmount} for ${studentName} (${due.batchTitle}) was due on ${due.dueDate}. Please clear dues to prevent class interruption.`
        : `Installment of ${formattedAmount} for ${studentName} (${due.batchTitle}) is due on ${due.dueDate}.`;

      const parentIds = parentLinks.map((p) => p.parentUserId);

      await notify(parentIds, {
        type: "fee_due_alert",
        title,
        body,
        data: {
          route: `/fees?studentId=${due.studentId}`,
          dueId: due.dueId,
          studentId: due.studentId,
          dueDate: due.dueDate,
        },
      });

      notifiedCount += parentIds.length;
    } catch (err) {
      console.error(`[notifyFeeDuesToParents] Failed for due ${due.dueId}:`, err);
    }
  }

  return { success: true, notifiedCount };
}
