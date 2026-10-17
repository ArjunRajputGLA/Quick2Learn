import { db, schema, eq, desc, inArray, type DatabaseExecutor } from "@quick2learn/db";
import { assert, isStaff, type AuthUser } from "../authz";

// PAYMENTS
export async function getPayments(user: AuthUser, tx?: DatabaseExecutor) {
  assert(!!user?.id, "Authentication required to view payments.", 401);
  const d = tx || db;
  if (isStaff(user)) {
    return await d.select().from(schema.payments).orderBy(desc(schema.payments.createdAt));
  }
  return await d
    .select()
    .from(schema.payments)
    .where(eq(schema.payments.studentId, user.id))
    .orderBy(desc(schema.payments.createdAt));
}

// FEE DUES
export async function getFeeDues(user: AuthUser, enrollmentId?: string, tx?: DatabaseExecutor) {
  assert(!!user?.id, "Authentication required to view dues.", 401);
  const d = tx || db;
  if (isStaff(user)) {
    if (enrollmentId) {
      return await d.select().from(schema.feeDues).where(eq(schema.feeDues.enrollmentId, enrollmentId));
    }
    return await d.select().from(schema.feeDues).orderBy(desc(schema.feeDues.dueDate));
  }

  const studentEnrollments = await d
    .select({ id: schema.enrollments.id })
    .from(schema.enrollments)
    .where(eq(schema.enrollments.studentId, user.id));

  const enrollmentIds = studentEnrollments.map((e: { id: string }) => e.id);
  if (enrollmentIds.length === 0) return [];

  const targetEnrollmentIds = enrollmentId
    ? enrollmentIds.filter((id: string) => id === enrollmentId)
    : enrollmentIds;

  if (targetEnrollmentIds.length === 0) return [];

  return await d
    .select()
    .from(schema.feeDues)
    .where(inArray(schema.feeDues.enrollmentId, targetEnrollmentIds))
    .orderBy(desc(schema.feeDues.dueDate));
}

// RECORD PAYMENT
export async function recordPayment(
  user: AuthUser,
  data: {
    studentId: string;
    enrollmentId?: string;
    feeDueId?: string;
    method: schema.PaymentMethod;
    amountPaise: number;
    receiptNo?: string;
    razorpayOrderId?: string;
    razorpayPaymentId?: string;
    status?: schema.PaymentStatus;
    raw?: Record<string, unknown>;
  },
  parentTx?: DatabaseExecutor,
) {
  const isSelf = user.id === data.studentId;
  const staff = isStaff(user);
  assert(isSelf || staff, "Unauthorized to record payment for this student.");

  const runWithExecutor = async (tx: DatabaseExecutor) => {
    const [payment] = await tx
      .insert(schema.payments)
      .values({
        studentId: data.studentId,
        enrollmentId: data.enrollmentId,
        feeDueId: data.feeDueId,
        method: data.method,
        amountPaise: data.amountPaise,
        receiptNo: data.receiptNo || "",
        status: data.status || "created",
        razorpayOrderId: data.razorpayOrderId,
        razorpayPaymentId: data.razorpayPaymentId,
        recordedBy: staff ? user.id : undefined,
        raw: data.raw || {},
        paidAt: data.status === "paid" ? new Date() : undefined,
      })
      .returning();

    if (!payment) {
      throw new Error("Failed to record payment transaction.");
    }

    if (data.feeDueId && data.status === "paid") {
      await tx
        .update(schema.feeDues)
        .set({
          status: "paid",
          paymentId: payment.id,
        })
        .where(eq(schema.feeDues.id, data.feeDueId));
    }

    return payment;
  };

  if (parentTx) {
    return await runWithExecutor(parentTx);
  }
  return await db.transaction(runInTx => runWithExecutor(runInTx));
}

// GET PAYMENT RECEIPT DETAILS
export async function getPaymentReceipt(
  user: AuthUser,
  paymentId: string,
  tx?: DatabaseExecutor,
) {
  assert(!!user?.id, "Authentication required.", 401);
  const d = tx || db;

  const [payment] = await d
    .select()
    .from(schema.payments)
    .where(eq(schema.payments.id, paymentId))
    .limit(1);

  if (!payment) return null;

  if (!isStaff(user) && payment.studentId !== user.id) {
    assert(false, "Unauthorized to view this payment receipt.", 403);
  }

  // Fetch student user & profile
  const [studentUser] = await d
    .select({ name: schema.user.name, email: schema.user.email })
    .from(schema.user)
    .where(eq(schema.user.id, payment.studentId))
    .limit(1);

  const [studentProfile] = await d
    .select()
    .from(schema.profiles)
    .where(eq(schema.profiles.userId, payment.studentId))
    .limit(1);

  // Fetch enrollment and batch if present
  let batchData = null;
  let enrollmentData = null;
  if (payment.enrollmentId) {
    const [enrollment] = await d
      .select()
      .from(schema.enrollments)
      .where(eq(schema.enrollments.id, payment.enrollmentId))
      .limit(1);
    enrollmentData = enrollment || null;

    if (enrollment?.batchId) {
      const [batch] = await d
        .select()
        .from(schema.batches)
        .where(eq(schema.batches.id, enrollment.batchId))
        .limit(1);
      batchData = batch || null;
    }
  }

  // Fetch fee due
  let dueData = null;
  if (payment.feeDueId) {
    const [due] = await d
      .select()
      .from(schema.feeDues)
      .where(eq(schema.feeDues.id, payment.feeDueId))
      .limit(1);
    dueData = due || null;
  }

  return {
    payment,
    student: studentUser || { name: "Student", email: "" },
    profile: studentProfile || null,
    enrollment: enrollmentData,
    batch: batchData,
    due: dueData,
  };
}
