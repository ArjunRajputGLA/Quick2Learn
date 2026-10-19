import {
  db,
  schema,
  eq,
  and,
  inArray,
  desc,
  asc,
  sql,
  type DatabaseExecutor,
} from "@quick2learn/db";
import { type AuthUser, assert, isStaff } from "../authz";
import type {
  FeesResponse,
  FeeDueItem,
  PaymentHistoryItem,
  StudentQuickStats,
} from "@quick2learn/shared";

/**
 * Retrieves the full fees, dues, and payment receipt records for a student.
 */
export async function getStudentFeesData(
  user: AuthUser,
  studentIdParam?: string,
  tx?: DatabaseExecutor
): Promise<FeesResponse> {
  assert(!!user?.id, "Authentication required to view fees.", 401);
  const d = tx || db;

  const targetStudentId = studentIdParam || user.id;

  // Verify authorization: student themselves, staff, or linked parent
  if (targetStudentId !== user.id && !isStaff(user)) {
    const [parentLink] = await d
      .select({ id: schema.parentLinks.id })
      .from(schema.parentLinks)
      .where(
        and(
          eq(schema.parentLinks.parentUserId, user.id),
          eq(schema.parentLinks.studentUserId, targetStudentId)
        )
      )
      .limit(1);

    if (!parentLink) {
      assert(false, "Unauthorized to view fees for this student.", 403);
    }
  }

  // 1. Fetch student enrollments & batch titles
  const enrollments = await d
    .select({
      enrollmentId: schema.enrollments.id,
      batchId: schema.enrollments.batchId,
      batchTitle: schema.batches.title,
    })
    .from(schema.enrollments)
    .innerJoin(
      schema.batches,
      eq(schema.enrollments.batchId, schema.batches.id)
    )
    .where(eq(schema.enrollments.studentId, targetStudentId));

  const enrollmentMap = new Map<string, { batchId: string; batchTitle: string }>();
  enrollments.forEach((e) => {
    enrollmentMap.set(e.enrollmentId, {
      batchId: e.batchId,
      batchTitle: e.batchTitle,
    });
  });

  const enrollmentIds = enrollments.map((e) => e.enrollmentId);

  // 2. Fetch fee dues for these enrollments
  let rawDues: Array<typeof schema.feeDues.$inferSelect> = [];
  if (enrollmentIds.length > 0) {
    rawDues = await d
      .select()
      .from(schema.feeDues)
      .where(inArray(schema.feeDues.enrollmentId, enrollmentIds))
      .orderBy(asc(schema.feeDues.dueDate));
  }

  // 3. Fetch all payments for this student
  const rawPayments = await d
    .select()
    .from(schema.payments)
    .where(eq(schema.payments.studentId, targetStudentId))
    .orderBy(desc(schema.payments.createdAt));

  const paymentsMap = new Map<string, typeof schema.payments.$inferSelect>();
  rawPayments.forEach((p) => {
    paymentsMap.set(p.id, p);
  });

  // Map dues
  const dues: FeeDueItem[] = rawDues.map((dItem) => {
    const enr = enrollmentMap.get(dItem.enrollmentId);
    const linkedPayment = dItem.paymentId
      ? paymentsMap.get(dItem.paymentId)
      : undefined;

    return {
      id: dItem.id,
      enrollmentId: dItem.enrollmentId,
      batchId: enr?.batchId || null,
      batchTitle: enr?.batchTitle || "Classroom Tuition Batch",
      installmentName: dItem.label || "Instalment",
      amountPaise: dItem.amountPaise,
      dueDate: typeof dItem.dueDate === "string" ? dItem.dueDate : new Date(dItem.dueDate).toISOString(),
      status: dItem.status as "due" | "paid" | "cancelled",
      paymentId: dItem.paymentId || null,
      receiptNo: linkedPayment?.receiptNo || null,
      paidAt: linkedPayment?.paidAt ? linkedPayment.paidAt.toISOString() : null,
    };
  });

  // Map payment history
  const paymentHistory: PaymentHistoryItem[] = rawPayments.map((p) => {
    let batchTitle = "Institute Tuition";
    if (p.enrollmentId) {
      const enr = enrollmentMap.get(p.enrollmentId);
      if (enr?.batchTitle) {
        batchTitle = enr.batchTitle;
      }
    }

    return {
      id: p.id,
      batchTitle,
      amountPaise: p.amountPaise,
      method: p.method,
      status: p.status,
      receiptNo: p.receiptNo || null,
      paidAt: p.paidAt ? p.paidAt.toISOString() : null,
      createdAt: p.createdAt.toISOString(),
      receiptPdfUrl:
        p.status === "paid" && p.receiptNo
          ? `/api/v1/payments/${p.id}/receipt-pdf`
          : null,
    };
  });

  // Calculate summary
  let totalDuesPaise = 0;
  let totalPaidPaise = 0;
  let pendingAmountPaise = 0;
  let pendingDuesCount = 0;

  dues.forEach((dItem) => {
    totalDuesPaise += dItem.amountPaise;
    if (dItem.status === "due") {
      pendingAmountPaise += dItem.amountPaise;
      pendingDuesCount += 1;
    }
  });

  rawPayments.forEach((p) => {
    if (p.status === "paid") {
      totalPaidPaise += p.amountPaise;
    }
  });

  return {
    dues,
    paymentHistory,
    summary: {
      totalDuesPaise,
      totalPaidPaise,
      pendingAmountPaise,
      pendingDuesCount,
    },
  };
}

/**
 * Calculates quick stats for a student: attendance percentage, tests taken, lectures completed.
 */
export async function getStudentQuickStats(
  studentId: string,
  tx?: DatabaseExecutor
): Promise<StudentQuickStats> {
  const d = tx || db;

  // 1. Attendance %
  const [attendanceAgg] = await d
    .select({
      total: sql<number>`count(*)::int`,
      present: sql<number>`count(case when ${schema.attendanceRecords.status} = 'present' then 1 end)::int`,
    })
    .from(schema.attendanceRecords)
    .where(eq(schema.attendanceRecords.studentId, studentId));

  const totalAttendance = attendanceAgg?.total || 0;
  const presentAttendance = attendanceAgg?.present || 0;
  const attendancePercentage =
    totalAttendance > 0
      ? Math.round((presentAttendance / totalAttendance) * 100)
      : null;

  // 2. Tests Taken
  const [testsAgg] = await d
    .select({
      count: sql<number>`count(*)::int`,
    })
    .from(schema.testAttempts)
    .where(
      and(
        eq(schema.testAttempts.studentId, studentId),
        sql`${schema.testAttempts.status} IN ('submitted', 'auto_submitted')`
      )
    );

  const testsTaken = testsAgg?.count || 0;

  // 3. Lectures Completed
  const [progressAgg] = await d
    .select({
      count: sql<number>`count(*)::int`,
    })
    .from(schema.contentProgress)
    .where(
      and(
        eq(schema.contentProgress.userId, studentId),
        sql`${schema.contentProgress.completedAt} IS NOT NULL`
      )
    );

  let lecturesCompleted = progressAgg?.count || 0;
  if (lecturesCompleted === 0) {
    // Fallback to lectureViews count
    const [viewsAgg] = await d
      .select({
        count: sql<number>`count(*)::int`,
      })
      .from(schema.lectureViews)
      .where(eq(schema.lectureViews.userId, studentId));

    lecturesCompleted = viewsAgg?.count || 0;
  }

  return {
    attendancePercentage,
    testsTaken,
    lecturesCompleted,
  };
}
