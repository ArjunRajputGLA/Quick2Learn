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
  type DatabaseExecutor,
} from "@quick2learn/db";
import { assert, isAdmin, isStaff, type AuthUser } from "../authz";
import { revalidateDataTag, safeRevalidatePath as revalidatePath } from "./cached-home";

// -------------------------------------------------------------
// 1. DASHBOARD KPIS & RECENT ACTIVITY
// -------------------------------------------------------------

export interface AdminDashboardKPIs {
  activeStudentsCount: number;
  enrolmentsThisMonth: number;
  collectionsThisMonthPaise: number;
  overdueDuesCount: number;
  overdueDuesPaise: number;
  newEnquiriesCount: number;
  recentPayments: Array<{
    id: string;
    studentName: string;
    studentEmail: string;
    batchTitle: string;
    amountPaise: number;
    status: string;
    method: string;
    receiptNo: string | null;
    paidAt: Date | null;
    createdAt: Date;
  }>;
  recentEnquiries: Array<{
    id: string;
    name: string;
    phone: string;
    classLevel: number | null;
    board: string | null;
    status: string;
    createdAt: Date;
  }>;
  lastSyncRun: {
    id: string;
    startedAt: Date;
    finishedAt: Date | null;
    added: number;
    updated: number;
    errors: unknown[];
  } | null;
}

export async function getAdminDashboardKPIs(
  user: AuthUser,
  tx?: DatabaseExecutor,
): Promise<AdminDashboardKPIs> {
  assert(isAdmin(user), "Only administrators can view KPI dashboard.");
  const d = tx || db;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // 1. Active students count (unique students with at least 1 active enrollment)
  const activeStudentsResult = await d
    .select({ count: sql<number>`count(distinct ${schema.enrollments.studentId})` })
    .from(schema.enrollments)
    .where(eq(schema.enrollments.status, "active"));
  const activeStudentsCount = Number(activeStudentsResult[0]?.count || 0);

  // 2. Enrolments this month
  const monthEnrolmentsResult = await d
    .select({ count: sql<number>`count(*)` })
    .from(schema.enrollments)
    .where(sql`${schema.enrollments.createdAt} >= ${startOfMonth}`);
  const enrolmentsThisMonth = Number(monthEnrolmentsResult[0]?.count || 0);

  // 3. Collections this month in paise
  const monthCollectionsResult = await d
    .select({ total: sql<number>`coalesce(sum(${schema.payments.amountPaise}), 0)` })
    .from(schema.payments)
    .where(
      and(
        eq(schema.payments.status, "paid"),
        sql`coalesce(${schema.payments.paidAt}, ${schema.payments.createdAt}) >= ${startOfMonth}`,
      ),
    );
  const collectionsThisMonthPaise = Number(monthCollectionsResult[0]?.total || 0);

  // 4. Overdue dues (due status with due_date < current_date)
  const todayStr = now.toISOString().split("T")[0];
  const overdueDuesResult = await d
    .select({
      count: sql<number>`count(*)`,
      totalPaise: sql<number>`coalesce(sum(${schema.feeDues.amountPaise}), 0)`,
    })
    .from(schema.feeDues)
    .where(
      and(
        eq(schema.feeDues.status, "due"),
        sql`${schema.feeDues.dueDate} < ${todayStr}`,
      ),
    );
  const overdueDuesCount = Number(overdueDuesResult[0]?.count || 0);
  const overdueDuesPaise = Number(overdueDuesResult[0]?.totalPaise || 0);

  // 5. New enquiries
  const newEnquiriesResult = await d
    .select({ count: sql<number>`count(*)` })
    .from(schema.enquiries)
    .where(eq(schema.enquiries.status, "new"));
  const newEnquiriesCount = Number(newEnquiriesResult[0]?.count || 0);

  // 6. Recent Payments
  const recentPaymentsRaw = await d
    .select({
      id: schema.payments.id,
      amountPaise: schema.payments.amountPaise,
      status: schema.payments.status,
      method: schema.payments.method,
      receiptNo: schema.payments.receiptNo,
      paidAt: schema.payments.paidAt,
      createdAt: schema.payments.createdAt,
      studentName: schema.profiles.fullName,
      studentEmail: schema.user.email,
      batchTitle: schema.batches.title,
    })
    .from(schema.payments)
    .innerJoin(schema.user, eq(schema.payments.studentId, schema.user.id))
    .leftJoin(schema.profiles, eq(schema.payments.studentId, schema.profiles.userId))
    .leftJoin(schema.enrollments, eq(schema.payments.enrollmentId, schema.enrollments.id))
    .leftJoin(schema.batches, eq(schema.enrollments.batchId, schema.batches.id))
    .orderBy(desc(schema.payments.createdAt))
    .limit(6);

  const recentPayments = recentPaymentsRaw.map((p) => ({
    id: p.id,
    studentName: p.studentName || "Student",
    studentEmail: p.studentEmail || "",
    batchTitle: p.batchTitle || "Course Batch",
    amountPaise: p.amountPaise,
    status: p.status,
    method: p.method,
    receiptNo: p.receiptNo,
    paidAt: p.paidAt,
    createdAt: p.createdAt,
  }));

  // 7. Recent Enquiries
  const recentEnquiries = await d
    .select({
      id: schema.enquiries.id,
      name: schema.enquiries.name,
      phone: schema.enquiries.phone,
      classLevel: schema.enquiries.classLevel,
      board: schema.enquiries.board,
      status: schema.enquiries.status,
      createdAt: schema.enquiries.createdAt,
    })
    .from(schema.enquiries)
    .orderBy(desc(schema.enquiries.createdAt))
    .limit(6);

  // 8. Last YouTube Sync Run
  const [lastSyncRun] = await d
    .select()
    .from(schema.syncRuns)
    .where(eq(schema.syncRuns.kind, "youtube_sync"))
    .orderBy(desc(schema.syncRuns.startedAt))
    .limit(1);

  return {
    activeStudentsCount,
    enrolmentsThisMonth,
    collectionsThisMonthPaise,
    overdueDuesCount,
    overdueDuesPaise,
    newEnquiriesCount,
    recentPayments,
    recentEnquiries,
    lastSyncRun: lastSyncRun
      ? {
          id: lastSyncRun.id,
          startedAt: lastSyncRun.startedAt,
          finishedAt: lastSyncRun.finishedAt,
          added: lastSyncRun.added,
          updated: lastSyncRun.updated,
          errors: Array.isArray(lastSyncRun.errors) ? lastSyncRun.errors : [],
        }
      : null,
  };
}

// -------------------------------------------------------------
// 2. STUDENTS DIRECTORY & MANAGEMENT
// -------------------------------------------------------------

export interface AdminStudentSummary {
  userId: string;
  fullName: string;
  email: string;
  phone: string | null;
  classLevel: number | null;
  board: string | null;
  activeBatchesCount: number;
  totalPendingDuesPaise: number;
  onboardedAt: Date | null;
  createdAt: Date;
}

export async function getAdminStudentsList(
  user: AuthUser,
  filters?: {
    search?: string;
    classLevel?: number;
    board?: string;
    batchId?: string;
    hasDues?: boolean;
    limit?: number;
    offset?: number;
  },
  tx?: DatabaseExecutor,
): Promise<{ students: AdminStudentSummary[]; total: number }> {
  assert(isAdmin(user), "Only administrators can view full student directory.");
  const d = tx || db;

  const conditions = [eq(schema.profiles.role, "student")];

  if (filters?.classLevel) {
    conditions.push(eq(schema.profiles.classLevel, filters.classLevel));
  }
  if (filters?.board) {
    conditions.push(eq(schema.profiles.board, filters.board as schema.Board));
  }
  if (filters?.search) {
    const s = `%${filters.search.trim().toLowerCase()}%`;
    conditions.push(
      or(
        sql`lower(${schema.profiles.fullName}) LIKE ${s}`,
        sql`lower(${schema.user.email}) LIKE ${s}`,
        sql`${schema.profiles.phone} LIKE ${s}`,
      )!,
    );
  }

  // Base query with join
  const studentsRaw = await d
    .select({
      userId: schema.user.id,
      fullName: schema.profiles.fullName,
      email: schema.user.email,
      phone: schema.profiles.phone,
      classLevel: schema.profiles.classLevel,
      board: schema.profiles.board,
      onboardedAt: schema.profiles.onboardedAt,
      createdAt: schema.user.createdAt,
    })
    .from(schema.user)
    .innerJoin(schema.profiles, eq(schema.user.id, schema.profiles.userId))
    .where(and(...conditions))
    .orderBy(desc(schema.user.createdAt));

  // Compute active batches and dues per student
  const studentIds = studentsRaw.map((s) => s.userId);

  const batchCountsMap: Record<string, number> = {};
  const duesMap: Record<string, number> = {};

  if (studentIds.length > 0) {
    // Active batches
    const enrollmentsRows = await d
      .select({
        studentId: schema.enrollments.studentId,
        batchId: schema.enrollments.batchId,
      })
      .from(schema.enrollments)
      .where(
        and(
          inArray(schema.enrollments.studentId, studentIds),
          eq(schema.enrollments.status, "active"),
        ),
      );

    for (const r of enrollmentsRows) {
      batchCountsMap[r.studentId] = (batchCountsMap[r.studentId] || 0) + 1;
    }

    // Pending dues
    const duesRows = await d
      .select({
        studentId: schema.enrollments.studentId,
        amountPaise: schema.feeDues.amountPaise,
      })
      .from(schema.feeDues)
      .innerJoin(schema.enrollments, eq(schema.feeDues.enrollmentId, schema.enrollments.id))
      .where(
        and(
          inArray(schema.enrollments.studentId, studentIds),
          eq(schema.feeDues.status, "due"),
        ),
      );

    for (const dRow of duesRows) {
      duesMap[dRow.studentId] = (duesMap[dRow.studentId] || 0) + Number(dRow.amountPaise);
    }
  }

  let results: AdminStudentSummary[] = studentsRaw.map((s) => ({
    userId: s.userId,
    fullName: s.fullName,
    email: s.email,
    phone: s.phone,
    classLevel: s.classLevel,
    board: s.board,
    activeBatchesCount: batchCountsMap[s.userId] || 0,
    totalPendingDuesPaise: duesMap[s.userId] || 0,
    onboardedAt: s.onboardedAt,
    createdAt: s.createdAt,
  }));

  if (filters?.hasDues !== undefined) {
    results = results.filter((s) => (filters.hasDues ? s.totalPendingDuesPaise > 0 : s.totalPendingDuesPaise === 0));
  }

  const total = results.length;
  const offset = filters?.offset || 0;
  const limit = filters?.limit || 50;
  const paged = results.slice(offset, offset + limit);

  return { students: paged, total };
}

export async function getAdminStudentDetails(
  user: AuthUser,
  studentId: string,
  tx?: DatabaseExecutor,
) {
  assert(isAdmin(user), "Only administrators can view detailed student records.");
  const d = tx || db;

  const [studentUser] = await d
    .select({
      id: schema.user.id,
      name: schema.user.name,
      email: schema.user.email,
      createdAt: schema.user.createdAt,
    })
    .from(schema.user)
    .where(eq(schema.user.id, studentId));

  if (!studentUser) return null;

  const [studentProfile] = await d
    .select()
    .from(schema.profiles)
    .where(eq(schema.profiles.userId, studentId));

  // Enrollments
  const enrollments = await d
    .select({
      enrollment: schema.enrollments,
      batch: schema.batches,
      feePlan: schema.batchFeePlans,
    })
    .from(schema.enrollments)
    .innerJoin(schema.batches, eq(schema.enrollments.batchId, schema.batches.id))
    .leftJoin(schema.batchFeePlans, eq(schema.enrollments.feePlanId, schema.batchFeePlans.id))
    .where(eq(schema.enrollments.studentId, studentId))
    .orderBy(desc(schema.enrollments.enrolledAt));

  // Fee dues
  const enrollmentIds = enrollments.map((e) => e.enrollment.id);
  let feeDues: Array<{
    id: string;
    enrollmentId: string;
    label: string;
    amountPaise: number;
    dueDate: string;
    status: string;
    paymentId: string | null;
    createdAt: Date;
    batchTitle: string;
  }> = [];

  if (enrollmentIds.length > 0) {
    const duesRaw = await d
      .select({
        due: schema.feeDues,
        batchTitle: schema.batches.title,
      })
      .from(schema.feeDues)
      .innerJoin(schema.enrollments, eq(schema.feeDues.enrollmentId, schema.enrollments.id))
      .innerJoin(schema.batches, eq(schema.enrollments.batchId, schema.batches.id))
      .where(inArray(schema.feeDues.enrollmentId, enrollmentIds))
      .orderBy(desc(schema.feeDues.dueDate));

    feeDues = duesRaw.map((r) => ({
      id: r.due.id,
      enrollmentId: r.due.enrollmentId,
      label: r.due.label,
      amountPaise: r.due.amountPaise,
      dueDate: r.due.dueDate,
      status: r.due.status,
      paymentId: r.due.paymentId,
      createdAt: r.due.createdAt,
      batchTitle: r.batchTitle,
    }));
  }

  // Payments
  const payments = await d
    .select()
    .from(schema.payments)
    .where(eq(schema.payments.studentId, studentId))
    .orderBy(desc(schema.payments.createdAt));

  // Staff notes and audit trail from audit_log
  const auditLogs = await d
    .select({
      id: schema.auditLog.id,
      action: schema.auditLog.action,
      diff: schema.auditLog.diff,
      createdAt: schema.auditLog.createdAt,
      actorId: schema.auditLog.actorId,
    })
    .from(schema.auditLog)
    .where(
      and(
        eq(schema.auditLog.entity, "student"),
        eq(schema.auditLog.entityId, studentId),
      ),
    )
    .orderBy(desc(schema.auditLog.createdAt));

  return {
    user: studentUser,
    profile: studentProfile || null,
    enrollments,
    feeDues,
    payments,
    notes: auditLogs,
  };
}

export async function manualEnrollStudent(
  user: AuthUser,
  params: {
    studentId: string;
    batchId: string;
    feePlanId?: string;
  },
  tx?: DatabaseExecutor,
) {
  assert(isAdmin(user), "Only administrators can perform manual enrollments.");
  const d = tx || db;

  // 1. Verify batch exists
  const [batch] = await d
    .select()
    .from(schema.batches)
    .where(eq(schema.batches.id, params.batchId));
  assert(!!batch, "Batch not found", 404);

  // 2. Insert or update enrollment
  const [enrollment] = await d
    .insert(schema.enrollments)
    .values({
      batchId: params.batchId,
      studentId: params.studentId,
      feePlanId: params.feePlanId,
      status: "active",
      source: "admin",
      enrolledAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [schema.enrollments.batchId, schema.enrollments.studentId],
      set: {
        status: "active",
        feePlanId: params.feePlanId,
        source: "admin",
        updatedAt: new Date(),
      },
    })
    .returning();

  assert(!!enrollment, "Failed to create enrollment record");

  // 3. Create fee dues if feePlanId provided
  if (params.feePlanId) {
    const [plan] = await d
      .select()
      .from(schema.batchFeePlans)
      .where(eq(schema.batchFeePlans.id, params.feePlanId));

    if (plan) {
      const instalments = Array.isArray(plan.instalments) ? (plan.instalments as Array<{
        name?: string;
        label?: string;
        amountPaise?: number;
        amount_paise?: number;
        dueDateOffsetDays?: number;
        due_date?: string;
      }>) : [];

      if (instalments.length > 0) {
        for (const inst of instalments) {
          const dueDate = new Date();
          if (inst.dueDateOffsetDays) {
            dueDate.setDate(dueDate.getDate() + inst.dueDateOffsetDays);
          }
          await d.insert(schema.feeDues).values({
            enrollmentId: enrollment.id,
            label: inst.label || inst.name || plan.name,
            amountPaise: inst.amountPaise ?? inst.amount_paise ?? Math.round(plan.totalPaise / instalments.length),
            dueDate: inst.due_date || dueDate.toISOString().slice(0, 10),
            status: "due",
          });
        }
      } else {
        // Single full fee due
        await d.insert(schema.feeDues).values({
          enrollmentId: enrollment.id,
          label: `${plan.name} - Tuition Fee`,
          amountPaise: plan.totalPaise,
          dueDate: new Date().toISOString().slice(0, 10),
          status: "due",
        });
      }
    }
  }

  // 4. Audit log
  await d.insert(schema.auditLog).values({
    actorId: user.id,
    action: "manual_enrollment",
    entity: "student",
    entityId: params.studentId,
    diff: {
      batchId: params.batchId,
      feePlanId: params.feePlanId,
      enrollmentId: enrollment.id,
    },
  });

  revalidatePath("/admin/students");
  revalidatePath(`/admin/students/${params.studentId}`);
  revalidatePath("/dashboard");
  revalidateDataTag("batches");

  return enrollment;
}

export async function waiveFeeDue(
  user: AuthUser,
  params: {
    dueId: string;
    studentId: string;
    reason: string;
  },
  tx?: DatabaseExecutor,
) {
  assert(isAdmin(user), "Only administrators can waive fee dues.");
  const d = tx || db;

  const [due] = await d
    .select()
    .from(schema.feeDues)
    .where(eq(schema.feeDues.id, params.dueId));
  assert(!!due, "Fee due not found", 404);

  const [waived] = await d
    .update(schema.feeDues)
    .set({
      status: "waived",
      updatedAt: new Date(),
    })
    .where(eq(schema.feeDues.id, params.dueId))
    .returning();

  // Audit log
  await d.insert(schema.auditLog).values({
    actorId: user.id,
    action: "waive_fee_due",
    entity: "student",
    entityId: params.studentId,
    diff: {
      dueId: params.dueId,
      amountPaise: due.amountPaise,
      label: due.label,
      reason: params.reason,
    },
  });

  revalidatePath(`/admin/students/${params.studentId}`);
  revalidatePath("/admin/payments");
  revalidatePath("/dashboard/payments");

  return waived;
}

export async function addStudentNote(
  user: AuthUser,
  params: {
    studentId: string;
    note: string;
  },
  tx?: DatabaseExecutor,
) {
  assert(isStaff(user), "Staff permission required to add student notes.");
  const d = tx || db;

  const [logged] = await d
    .insert(schema.auditLog)
    .values({
      actorId: user.id,
      action: "add_note",
      entity: "student",
      entityId: params.studentId,
      diff: {
        note: params.note,
        author: user.name || "Institute Staff",
      },
    })
    .returning();

  revalidatePath(`/admin/students/${params.studentId}`);
  return logged;
}

// -------------------------------------------------------------
// 3. BATCHES MANAGEMENT
// -------------------------------------------------------------

export async function getAdminBatchesList(
  user: AuthUser,
  tx?: DatabaseExecutor,
) {
  assert(isStaff(user), "Staff permission required to view batches.");
  const d = tx || db;

  const rows = await d
    .select({
      batch: schema.batches,
      facultyName: schema.faculty.name,
      facultyProfileId: schema.faculty.profileId,
      subjectName: schema.subjects.name,
      activeEnrolled: sql<number>`count(distinct ${schema.enrollments.studentId}) filter (where ${schema.enrollments.status} = 'active')`,
    })
    .from(schema.batches)
    .leftJoin(schema.faculty, eq(schema.batches.facultyId, schema.faculty.id))
    .leftJoin(schema.subjects, eq(schema.batches.subjectId, schema.subjects.id))
    .leftJoin(schema.enrollments, eq(schema.batches.id, schema.enrollments.batchId))
    .groupBy(schema.batches.id, schema.faculty.name, schema.faculty.profileId, schema.subjects.name)
    .orderBy(desc(schema.batches.startDate));

  // Teachers see only their own batches
  if (user.role === "teacher") {
    return rows.filter(
      (r) => r.facultyProfileId === user.id || r.batch.facultyId === user.id,
    );
  }

  return rows;
}

export async function saveBatchWithPlans(
  user: AuthUser,
  data: {
    id?: string;
    title: string;
    slug: string;
    subtitle?: string;
    classLevel: number;
    board: schema.Board;
    subjectId: string;
    facultyId?: string;
    mode: schema.BatchMode;
    scheduleText: string;
    locationText?: string;
    startDate: string; // ISO
    endDate?: string;
    seatsTotal: number;
    status: schema.BatchStatus;
    isFeatured: boolean;
    whatsappGroupUrl?: string;
    coverKey?: string;
    description: string;
    outcomes: string[];
    syllabus: unknown[];
    faqs: unknown[];
    feePlans?: Array<{
      id?: string;
      name: string;
      totalPaise: number;
      originalPaise?: number;
      instalments?: unknown[];
      isActive?: boolean;
    }>;
  },
  tx?: DatabaseExecutor,
) {
  assert(isAdmin(user), "Only administrators can configure batches and fee plans.");
  const d = tx || db;

  const batchPayload = {
    title: data.title,
    slug: data.slug,
    subtitle: data.subtitle || null,
    classLevel: data.classLevel,
    board: data.board,
    subjectId: data.subjectId,
    facultyId: data.facultyId || null,
    mode: data.mode,
    scheduleText: data.scheduleText,
    locationText: data.locationText || null,
    startDate: new Date(data.startDate),
    endDate: data.endDate ? new Date(data.endDate) : null,
    seatsTotal: data.seatsTotal,
    status: data.status,
    isFeatured: data.isFeatured,
    whatsappGroupUrl: data.whatsappGroupUrl || null,
    coverKey: data.coverKey || null,
    description: data.description,
    outcomes: data.outcomes || [],
    syllabus: data.syllabus || [],
    faqs: data.faqs || [],
    updatedAt: new Date(),
  };

  let batchId = data.id;
  let isNew = false;

  if (batchId) {
    await d
      .update(schema.batches)
      .set(batchPayload)
      .where(eq(schema.batches.id, batchId));
  } else {
    isNew = true;
    const [inserted] = await d
      .insert(schema.batches)
      .values(batchPayload)
      .returning();
    assert(!!inserted, "Failed to create batch record");
    batchId = inserted.id;
  }

  // Manage Fee Plans
  if (data.feePlans && data.feePlans.length > 0) {
    for (const plan of data.feePlans) {
      if (plan.id) {
        await d
          .update(schema.batchFeePlans)
          .set({
            name: plan.name,
            totalPaise: plan.totalPaise,
            originalPaise: plan.originalPaise || null,
            instalments: plan.instalments || [],
            isActive: plan.isActive ?? true,
            updatedAt: new Date(),
          })
          .where(eq(schema.batchFeePlans.id, plan.id));
      } else {
        await d.insert(schema.batchFeePlans).values({
          batchId: batchId!,
          name: plan.name,
          totalPaise: plan.totalPaise,
          originalPaise: plan.originalPaise || null,
          instalments: plan.instalments || [],
          isActive: plan.isActive ?? true,
        });
      }
    }
  }

  // Audit log
  await d.insert(schema.auditLog).values({
    actorId: user.id,
    action: isNew ? "create_batch" : "update_batch",
    entity: "batch",
    entityId: batchId!,
    diff: {
      title: data.title,
      status: data.status,
      feePlansCount: data.feePlans?.length || 0,
    },
  });

  revalidateDataTag("batches");
  revalidatePath("/batches");
  revalidatePath(`/batches/${data.slug}`);
  revalidatePath("/admin/batches");
  revalidatePath("/dashboard/batches");

  return { batchId, slug: data.slug };
}

// -------------------------------------------------------------
// 4. LECTURES & PLAYLIST MAPPING
// -------------------------------------------------------------

export async function getAdminLecturesList(
  user: AuthUser,
  filters?: {
    search?: string;
    needsReview?: boolean;
    unmapped?: boolean;
    isShort?: boolean;
    isPublished?: boolean;
    classLevel?: number;
    subjectId?: string;
    chapterId?: string;
    limit?: number;
    offset?: number;
  },
  tx?: DatabaseExecutor,
) {
  assert(isStaff(user), "Staff permission required to view lecture inventory.");
  const d = tx || db;

  const conditions = [];

  if (filters?.needsReview !== undefined) {
    conditions.push(eq(schema.youtubeVideos.needsReview, filters.needsReview));
  }
  if (filters?.unmapped) {
    conditions.push(
      or(
        sql`${schema.youtubeVideos.classLevel} IS NULL`,
        sql`${schema.youtubeVideos.chapterId} IS NULL`,
      )!,
    );
  }
  if (filters?.isShort !== undefined) {
    conditions.push(eq(schema.youtubeVideos.isShort, filters.isShort));
  }
  if (filters?.isPublished !== undefined) {
    conditions.push(eq(schema.youtubeVideos.isPublished, filters.isPublished));
  }
  if (filters?.classLevel) {
    conditions.push(eq(schema.youtubeVideos.classLevel, filters.classLevel));
  }
  if (filters?.subjectId) {
    conditions.push(eq(schema.youtubeVideos.subjectId, filters.subjectId));
  }
  if (filters?.chapterId) {
    conditions.push(eq(schema.youtubeVideos.chapterId, filters.chapterId));
  }
  if (filters?.search) {
    const s = `%${filters.search.trim().toLowerCase()}%`;
    conditions.push(
      or(
        sql`lower(${schema.youtubeVideos.title}) LIKE ${s}`,
        eq(schema.youtubeVideos.id, filters.search.trim()),
      )!,
    );
  }

  const offset = filters?.offset || 0;
  const limit = filters?.limit || 50;

  const rows = await d
    .select({
      video: schema.youtubeVideos,
      chapterTitle: schema.chapters.title,
      subjectName: schema.subjects.name,
      facultyName: schema.faculty.name,
    })
    .from(schema.youtubeVideos)
    .leftJoin(schema.chapters, eq(schema.youtubeVideos.chapterId, schema.chapters.id))
    .leftJoin(schema.subjects, eq(schema.youtubeVideos.subjectId, schema.subjects.id))
    .leftJoin(schema.faculty, eq(schema.youtubeVideos.facultyId, schema.faculty.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(schema.youtubeVideos.publishedAt))
    .limit(limit)
    .offset(offset);

  const countRes = await d
    .select({ count: sql<number>`count(*)` })
    .from(schema.youtubeVideos)
    .where(conditions.length > 0 ? and(...conditions) : undefined);
  const total = Number(countRes[0]?.count || 0);

  return { videos: rows, total };
}

export async function bulkUpdateVideos(
  user: AuthUser,
  payload: {
    videoIds: string[];
    classLevel?: number;
    subjectId?: string;
    chapterId?: string;
    facultyId?: string;
    isPublished?: boolean;
    isShort?: boolean;
    needsReview?: boolean;
  },
  tx?: DatabaseExecutor,
) {
  assert(isStaff(user), "Staff permission required to modify video mappings.");
  assert(payload.videoIds.length > 0, "No videos selected for bulk update.");
  const d = tx || db;

  const updateFields: Record<string, unknown> = {
    updatedAt: new Date(),
  };

  if (payload.classLevel !== undefined) updateFields.classLevel = payload.classLevel;
  if (payload.subjectId !== undefined) updateFields.subjectId = payload.subjectId;
  if (payload.chapterId !== undefined) updateFields.chapterId = payload.chapterId;
  if (payload.facultyId !== undefined) updateFields.facultyId = payload.facultyId;
  if (payload.isPublished !== undefined) updateFields.isPublished = payload.isPublished;
  if (payload.isShort !== undefined) updateFields.isShort = payload.isShort;
  if (payload.needsReview !== undefined) updateFields.needsReview = payload.needsReview;
  else if (payload.chapterId && payload.classLevel) {
    updateFields.needsReview = false;
  }

  const updatedRows = await d
    .update(schema.youtubeVideos)
    .set(updateFields)
    .where(inArray(schema.youtubeVideos.id, payload.videoIds))
    .returning({ id: schema.youtubeVideos.id });

  // Audit log
  await d.insert(schema.auditLog).values({
    actorId: user.id,
    action: "bulk_update_videos",
    entity: "youtube_videos",
    entityId: payload.videoIds.join(","),
    diff: {
      count: updatedRows.length,
      fields: updateFields,
    },
  });

  revalidateDataTag("videos");
  revalidatePath("/lectures");
  revalidatePath("/learn");
  revalidatePath("/admin/lectures");
  revalidatePath("/dashboard/lectures");

  return updatedRows;
}

export async function mapPlaylistToChapter(
  user: AuthUser,
  payload: {
    playlistId: string;
    classLevel: number;
    subjectId: string;
    chapterId: string;
    facultyId?: string;
  },
  tx?: DatabaseExecutor,
) {
  assert(isStaff(user), "Staff permission required to map playlists.");
  const d = tx || db;

  // 1. Update playlist record
  await d
    .update(schema.youtubePlaylists)
    .set({
      classLevel: payload.classLevel,
      subjectId: payload.subjectId,
      chapterId: payload.chapterId,
      updatedAt: new Date(),
    })
    .where(eq(schema.youtubePlaylists.id, payload.playlistId));

  // 2. Bulk update all constituent videos containing playlistId
  const updatedVideos = await d
    .update(schema.youtubeVideos)
    .set({
      classLevel: payload.classLevel,
      subjectId: payload.subjectId,
      chapterId: payload.chapterId,
      facultyId: payload.facultyId || undefined,
      needsReview: false,
      updatedAt: new Date(),
    })
    .where(sql`${payload.playlistId} = ANY(${schema.youtubeVideos.playlistIds})`)
    .returning({ id: schema.youtubeVideos.id });

  // 3. Audit log
  await d.insert(schema.auditLog).values({
    actorId: user.id,
    action: "map_playlist_to_chapter",
    entity: "youtube_playlists",
    entityId: payload.playlistId,
    diff: {
      affectedVideosCount: updatedVideos.length,
      classLevel: payload.classLevel,
      chapterId: payload.chapterId,
    },
  });

  revalidateDataTag("videos");
  revalidatePath("/lectures");
  revalidatePath("/learn");
  revalidatePath("/admin/lectures");
  revalidatePath("/dashboard/lectures");

  return {
    playlistId: payload.playlistId,
    updatedVideosCount: updatedVideos.length,
  };
}

// -------------------------------------------------------------
// 5. RESOURCES MANAGEMENT
// -------------------------------------------------------------

export async function getAdminResourcesList(
  user: AuthUser,
  filters?: {
    type?: string;
    visibility?: string;
    search?: string;
  },
  tx?: DatabaseExecutor,
) {
  assert(isStaff(user), "Staff permission required to inspect study materials.");
  const d = tx || db;

  const conditions = [];
  if (filters?.type) {
    conditions.push(eq(schema.resources.type, filters.type as schema.ResourceType));
  }
  if (filters?.visibility) {
    conditions.push(eq(schema.resources.visibility, filters.visibility as schema.Visibility));
  }
  if (filters?.search) {
    conditions.push(sql`lower(${schema.resources.title}) LIKE ${`%${filters.search.toLowerCase()}%`}`);
  }

  return await d
    .select({
      resource: schema.resources,
      chapterTitle: schema.chapters.title,
      batchTitle: schema.batches.title,
    })
    .from(schema.resources)
    .leftJoin(schema.chapters, eq(schema.resources.chapterId, schema.chapters.id))
    .leftJoin(schema.batches, eq(schema.resources.batchId, schema.batches.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(schema.resources.createdAt));
}

export async function deleteResource(
  user: AuthUser,
  resourceId: string,
  tx?: DatabaseExecutor,
) {
  assert(isStaff(user), "Staff permission required to delete resources.");
  const d = tx || db;

  const [resource] = await d
    .select()
    .from(schema.resources)
    .where(eq(schema.resources.id, resourceId));
  assert(!!resource, "Resource not found", 404);

  await d.delete(schema.resources).where(eq(schema.resources.id, resourceId));

  await d.insert(schema.auditLog).values({
    actorId: user.id,
    action: "delete_resource",
    entity: "resources",
    entityId: resourceId,
    diff: {
      title: resource.title,
      storageKey: resource.storageKey,
    },
  });

  revalidatePath("/admin/resources");
  revalidatePath("/dashboard/notes");
  revalidatePath("/learn");

  return { success: true };
}

// -------------------------------------------------------------
// 6. ANNOUNCEMENTS MANAGEMENT
// -------------------------------------------------------------

export async function getAdminAnnouncementsList(
  user: AuthUser,
  tx?: DatabaseExecutor,
) {
  assert(isStaff(user), "Staff permission required to view announcements.");
  const d = tx || db;

  return await d
    .select({
      announcement: schema.announcements,
      batchTitle: schema.batches.title,
    })
    .from(schema.announcements)
    .leftJoin(schema.batches, eq(schema.announcements.batchId, schema.batches.id))
    .orderBy(desc(schema.announcements.isPinned), desc(schema.announcements.publishedAt));
}

export async function deleteAnnouncement(
  user: AuthUser,
  announcementId: string,
  tx?: DatabaseExecutor,
) {
  assert(isStaff(user), "Staff permission required to delete announcements.");
  const d = tx || db;

  const [announcement] = await d
    .select()
    .from(schema.announcements)
    .where(eq(schema.announcements.id, announcementId));
  assert(!!announcement, "Announcement not found", 404);

  await d.delete(schema.announcements).where(eq(schema.announcements.id, announcementId));

  await d.insert(schema.auditLog).values({
    actorId: user.id,
    action: "delete_announcement",
    entity: "announcements",
    entityId: announcementId,
    diff: {
      title: announcement.title,
      audience: announcement.audience,
    },
  });

  revalidatePath("/admin/announcements");
  revalidatePath("/dashboard");

  return { success: true };
}

// -------------------------------------------------------------
// 7. ENQUIRIES CONVERSION & NOTES
// -------------------------------------------------------------

export async function convertEnquiryToStudent(
  user: AuthUser,
  enquiryId: string,
  tx?: DatabaseExecutor,
) {
  assert(isAdmin(user), "Only administrators can convert enquiries to student accounts.");
  const d = tx || db;

  const [enquiry] = await d
    .select()
    .from(schema.enquiries)
    .where(eq(schema.enquiries.id, enquiryId));
  assert(!!enquiry, "Enquiry not found", 404);

  // Synthesize clean student email from phone
  const studentEmail = `${enquiry.phone}@student.quick2learn.in`;
  const studentUserId = `student_${enquiry.phone}`;

  // 1. Create or ensure user
  await d
    .insert(schema.user)
    .values({
      id: studentUserId,
      name: enquiry.name,
      email: studentEmail,
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .onConflictDoNothing();

  // 2. Create or ensure student profile
  await d
    .insert(schema.profiles)
    .values({
      userId: studentUserId,
      fullName: enquiry.name,
      phone: enquiry.phone,
      classLevel: enquiry.classLevel || 12,
      board: enquiry.board || "cbse",
      role: "student",
      city: "Mathura",
      onboardedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .onConflictDoNothing();

  // 3. Update enquiry status to 'enrolled'
  await d
    .update(schema.enquiries)
    .set({
      status: "enrolled",
      notes: (enquiry.notes ? `${enquiry.notes}\n` : "") + `Converted to student account (${studentEmail}) on ${new Date().toLocaleDateString()}`,
      updatedAt: new Date(),
    })
    .where(eq(schema.enquiries.id, enquiryId));

  // 4. Audit log
  await d.insert(schema.auditLog).values({
    actorId: user.id,
    action: "convert_enquiry_to_student",
    entity: "enquiries",
    entityId: enquiryId,
    diff: {
      studentUserId,
      studentEmail,
      name: enquiry.name,
    },
  });

  revalidatePath("/admin/enquiries");
  revalidatePath("/admin/students");

  return { studentUserId, studentEmail };
}

// -------------------------------------------------------------
// 8. PAYMENTS & CSV EXPORT
// -------------------------------------------------------------

export async function getAdminPaymentsList(
  user: AuthUser,
  filters?: {
    status?: string;
    method?: string;
    fromDate?: string;
    toDate?: string;
    search?: string;
  },
  tx?: DatabaseExecutor,
) {
  assert(isAdmin(user), "Only administrators can view payment records.");
  const d = tx || db;

  const conditions = [];

  if (filters?.status) {
    conditions.push(eq(schema.payments.status, filters.status as schema.PaymentStatus));
  }
  if (filters?.method) {
    conditions.push(eq(schema.payments.method, filters.method as schema.PaymentMethod));
  }
  if (filters?.fromDate) {
    conditions.push(sql`${schema.payments.createdAt} >= ${new Date(filters.fromDate)}`);
  }
  if (filters?.toDate) {
    const end = new Date(filters.toDate);
    end.setHours(23, 59, 59, 999);
    conditions.push(sql`${schema.payments.createdAt} <= ${end}`);
  }
  if (filters?.search) {
    const s = `%${filters.search.trim().toLowerCase()}%`;
    conditions.push(
      or(
        sql`lower(${schema.payments.receiptNo}) LIKE ${s}`,
        sql`lower(${schema.profiles.fullName}) LIKE ${s}`,
        sql`lower(${schema.user.email}) LIKE ${s}`,
        sql`${schema.payments.razorpayOrderId} LIKE ${s}`,
      )!,
    );
  }

  return await d
    .select({
      payment: schema.payments,
      studentName: schema.profiles.fullName,
      studentEmail: schema.user.email,
      studentPhone: schema.profiles.phone,
      batchTitle: schema.batches.title,
    })
    .from(schema.payments)
    .innerJoin(schema.user, eq(schema.payments.studentId, schema.user.id))
    .leftJoin(schema.profiles, eq(schema.payments.studentId, schema.profiles.userId))
    .leftJoin(schema.enrollments, eq(schema.payments.enrollmentId, schema.enrollments.id))
    .leftJoin(schema.batches, eq(schema.enrollments.batchId, schema.batches.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(schema.payments.createdAt));
}

// -------------------------------------------------------------
// 9. CONTENT MANAGEMENT (FACULTY, TESTIMONIALS, RESULTS, SETTINGS)
// -------------------------------------------------------------

export async function getAdminContentData(
  user: AuthUser,
  tx?: DatabaseExecutor,
) {
  assert(isAdmin(user), "Only administrators can manage site content.");
  const d = tx || db;

  const facultyList = await d
    .select()
    .from(schema.faculty)
    .orderBy(asc(schema.faculty.sortOrder));

  const testimonialsList = await d
    .select()
    .from(schema.testimonials)
    .orderBy(asc(schema.testimonials.sortOrder));

  const resultsList = await d
    .select()
    .from(schema.results)
    .orderBy(asc(schema.results.sortOrder));

  const settingsRows = await d.select().from(schema.siteSettings);
  const settingsMap: Record<string, unknown> = {};
  for (const s of settingsRows) {
    settingsMap[s.key] = s.value;
  }

    return {
    faculty: facultyList,
    testimonials: testimonialsList,
    results: resultsList,
    settings: settingsMap,
  };
}

// -------------------------------------------------------------
// 10. PAGE SPECIFIC DATA HELPERS (NO DIRECT DB ACCESS IN PAGES)
// -------------------------------------------------------------

export async function getAdminBatchOptions(user: AuthUser, tx?: DatabaseExecutor) {
  assert(isStaff(user), "Staff permission required.");
  const d = tx || db;
  return await d
    .select({
      id: schema.batches.id,
      title: schema.batches.title,
    })
    .from(schema.batches)
    .orderBy(desc(schema.batches.startDate));
}

export async function getAdminAvailableBatchesWithPlans(user: AuthUser, tx?: DatabaseExecutor) {
  assert(isAdmin(user), "Admin permission required.");
  const d = tx || db;

  const batchRows = await d
    .select({
      id: schema.batches.id,
      title: schema.batches.title,
    })
    .from(schema.batches)
    .where(inArray(schema.batches.status, ["draft", "open"]))
    .orderBy(desc(schema.batches.startDate));

  const batchIds = batchRows.map((b) => b.id);
  const feePlansRows = batchIds.length > 0
    ? await d
        .select({
          id: schema.batchFeePlans.id,
          batchId: schema.batchFeePlans.batchId,
          name: schema.batchFeePlans.name,
          totalPaise: schema.batchFeePlans.totalPaise,
        })
        .from(schema.batchFeePlans)
        .where(inArray(schema.batchFeePlans.batchId, batchIds))
    : [];

  return batchRows.map((b) => ({
    id: b.id,
    title: b.title,
    feePlans: feePlansRows
      .filter((p) => p.batchId === b.id)
      .map((p) => ({
        id: p.id,
        name: p.name,
        totalPaise: p.totalPaise,
      })),
  }));
}

export async function getAdminBatchEditorData(user: AuthUser, batchId?: string, tx?: DatabaseExecutor) {
  assert(isAdmin(user), "Admin permission required.");
  const d = tx || db;

  let existingBatch = null;
  let feePlans: typeof schema.batchFeePlans.$inferSelect[] = [];

  if (batchId) {
    const [b] = await d.select().from(schema.batches).where(eq(schema.batches.id, batchId));
    existingBatch = b || null;

    if (existingBatch) {
      feePlans = await d
        .select()
        .from(schema.batchFeePlans)
        .where(eq(schema.batchFeePlans.batchId, batchId))
        .orderBy(asc(schema.batchFeePlans.createdAt));
    }
  }

  const subjects = await d
    .select({
      id: schema.subjects.id,
      name: schema.subjects.name,
    })
    .from(schema.subjects)
    .orderBy(asc(schema.subjects.sortOrder));

  const facultyList = await d
    .select({
      id: schema.faculty.id,
      name: schema.faculty.name,
    })
    .from(schema.faculty)
    .orderBy(asc(schema.faculty.sortOrder));

  const chaptersList = await d
    .select({
      id: schema.chapters.id,
      title: schema.chapters.title,
      classLevel: schema.chapters.classLevel,
      subjectId: schema.chapters.subjectId,
    })
    .from(schema.chapters)
    .orderBy(asc(schema.chapters.number));

  return {
    batch: existingBatch,
    feePlans,
    subjects,
    faculty: facultyList,
    chapters: chaptersList,
  };
}

export async function getAdminEnquiriesList(user: AuthUser, tx?: DatabaseExecutor) {
  assert(isAdmin(user), "Admin permission required.");
  const d = tx || db;
  return await d
    .select()
    .from(schema.enquiries)
    .orderBy(desc(schema.enquiries.createdAt));
}

export async function getAdminPlaylistMapData(user: AuthUser, tx?: DatabaseExecutor) {
  assert(isStaff(user), "Staff permission required.");
  const d = tx || db;

  const playlistsRaw = await d
    .select({
      id: schema.youtubePlaylists.id,
      title: schema.youtubePlaylists.title,
      itemCount: schema.youtubePlaylists.itemCount,
      classLevel: schema.youtubePlaylists.classLevel,
      chapterTitle: schema.chapters.title,
      subjectName: schema.subjects.name,
    })
    .from(schema.youtubePlaylists)
    .leftJoin(schema.chapters, eq(schema.youtubePlaylists.chapterId, schema.chapters.id))
    .leftJoin(schema.subjects, eq(schema.youtubePlaylists.subjectId, schema.subjects.id))
    .orderBy(desc(schema.youtubePlaylists.itemCount));

  const subjects = await d
    .select({
      id: schema.subjects.id,
      name: schema.subjects.name,
    })
    .from(schema.subjects)
    .orderBy(asc(schema.subjects.sortOrder));

  const chapters = await d
    .select({
      id: schema.chapters.id,
      title: schema.chapters.title,
      classLevel: schema.chapters.classLevel,
      subjectId: schema.chapters.subjectId,
    })
    .from(schema.chapters)
    .orderBy(asc(schema.chapters.number));

  return { playlists: playlistsRaw, subjects, chapters };
}

export async function getAdminSubjectChapterOptions(user: AuthUser, tx?: DatabaseExecutor) {
  assert(isStaff(user), "Staff permission required.");
  const d = tx || db;

  const subjects = await d
    .select({
      id: schema.subjects.id,
      name: schema.subjects.name,
    })
    .from(schema.subjects)
    .orderBy(asc(schema.subjects.sortOrder));

  const chapters = await d
    .select({
      id: schema.chapters.id,
      title: schema.chapters.title,
      classLevel: schema.chapters.classLevel,
      subjectId: schema.chapters.subjectId,
    })
    .from(schema.chapters)
    .orderBy(asc(schema.chapters.number));

  return { subjects, chapters };
}

export async function getAdminResourceOptions(user: AuthUser, tx?: DatabaseExecutor) {
  assert(isStaff(user), "Staff permission required.");
  const d = tx || db;

  const chapters = await d
    .select({
      id: schema.chapters.id,
      title: schema.chapters.title,
      classLevel: schema.chapters.classLevel,
    })
    .from(schema.chapters)
    .orderBy(asc(schema.chapters.number));

  const batches = await d
    .select({
      id: schema.batches.id,
      title: schema.batches.title,
    })
    .from(schema.batches)
    .orderBy(desc(schema.batches.startDate));

  return { chapters, batches };
}
