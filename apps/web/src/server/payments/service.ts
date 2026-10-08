import {
  db,
  schema,
  eq,
  and,
  sql,
  desc,
  asc,
  type DatabaseExecutor,
} from "@quick2learn/db";
import { assert, isStaff, type AuthUser } from "../authz";
import { createRazorpayOrder, verifyWebhookSignature } from "./razorpay";
import { publicEnv } from "@/lib/env";
import { consumePostgresRateLimit } from "../data/rate-limit";

export interface CreateOrderResult {
  success: boolean;
  orderId: string;
  amountPaise: number;
  paymentId: string;
  keyId: string;
  currency: string;
  batchTitle: string;
  isReusedOrder?: boolean;
}

export interface PlanFeeDueItem {
  label: string;
  amountPaise: number;
  dueDate: string;
}

export function generatePlanFeeDues(
  totalPaise: number,
  instalments?: unknown,
  todayStr: string = new Date().toISOString().split("T")[0]!,
): PlanFeeDueItem[] {
  const parsedInstalments = Array.isArray(instalments)
    ? (instalments as Array<{
        label?: string;
        amount_paise?: number;
        due_date?: string;
      }>)
    : [];

  if (parsedInstalments.length > 1) {
    return parsedInstalments.map((inst, idx) => ({
      label: inst.label || `Instalment ${idx + 1}`,
      amountPaise: inst.amount_paise || Math.round(totalPaise / parsedInstalments.length),
      dueDate: inst.due_date || todayStr,
    }));
  }

  return [
    {
      label: "Full Course Payment",
      amountPaise: totalPaise,
      dueDate: todayStr,
    },
  ];
}

/**
 * Requirement 4: One shared function markPaymentPaid(orderId, paymentId, source)
 * In its own transaction:
 * - Locks the payments row FOR UPDATE
 * - If already paid, returns without changes
 * - Otherwise marks payment paid, due paid, enrollment active, and assigns receipt number from sequence
 */
export async function markPaymentPaid(
  orderIdOrPaymentId: string,
  razorpayPaymentId?: string,
  source: string = "razorpay",
  parentTx?: DatabaseExecutor,
) {
  const runInTx = async (tx: DatabaseExecutor) => {
    // 1. Lock payment row FOR UPDATE matching razorpayOrderId, id, or razorpayPaymentId
    const paymentsFound = await tx
      .select()
      .from(schema.payments)
      .where(
        sql`${schema.payments.razorpayOrderId} = ${orderIdOrPaymentId} OR ${schema.payments.id}::text = ${orderIdOrPaymentId} OR (${razorpayPaymentId ? sql`${schema.payments.razorpayPaymentId} = ${razorpayPaymentId}` : sql`false`})`,
      )
      .for("update")
      .limit(1);

    const payment = paymentsFound[0];
    if (!payment) {
      throw new Error(`Payment record not found for order/ID: ${orderIdOrPaymentId}`);
    }

    // 2. If already paid, return early (idempotent!)
    if (payment.status === "paid") {
      return {
        payment,
        isAlreadyPaid: true,
        receiptNo: payment.receiptNo,
      };
    }

    // 3. Assign receipt number from PostgreSQL sequence if not already present
    let finalReceiptNo = payment.receiptNo;
    if (!finalReceiptNo) {
      const seqResult = await tx.execute(
        sql`SELECT nextval('public.receipt_no_seq') as seq;`,
      );
      const seqRow = seqResult.rows[0] as { seq?: string | number } | undefined;
      const seqVal = seqRow?.seq || Date.now().toString().slice(-6);
      const currentYear = new Date().getFullYear();
      finalReceiptNo = `Q2L-${currentYear}-${String(seqVal).padStart(6, "0")}`;
    }

    // 4. Update the payment record
    const updatedRaw = {
      ...(typeof payment.raw === "object" && payment.raw !== null
        ? payment.raw
        : {}),
      lastPaymentSource: source,
      verifiedAt: new Date().toISOString(),
    };

    const [updatedPayment] = await tx
      .update(schema.payments)
      .set({
        status: "paid",
        paidAt: new Date(),
        receiptNo: finalReceiptNo,
        razorpayPaymentId: razorpayPaymentId || payment.razorpayPaymentId,
        raw: updatedRaw,
        updatedAt: new Date(),
      })
      .where(eq(schema.payments.id, payment.id))
      .returning();

    if (!updatedPayment) {
      throw new Error("Failed to update payment record.");
    }

    // 5. Mark the corresponding fee due as paid
    if (payment.feeDueId) {
      await tx
        .update(schema.feeDues)
        .set({
          status: "paid",
          paymentId: payment.id,
          updatedAt: new Date(),
        })
        .where(eq(schema.feeDues.id, payment.feeDueId));
    }

    // 6. Mark the enrollment as active
    if (payment.enrollmentId) {
      await tx
        .update(schema.enrollments)
        .set({
          status: "active",
          updatedAt: new Date(),
        })
        .where(eq(schema.enrollments.id, payment.enrollmentId));
    }

    return {
      payment: updatedPayment,
      receiptNo: finalReceiptNo,
      isAlreadyPaid: false,
    };
  };

  if (parentTx) {
    return await runInTx(parentTx);
  }
  return await db.transaction(runInTx);
}

/**
 * Requirement 2: Server action createOrder inside one db.transaction()
 * - Lock batch row (SELECT ... FOR UPDATE) and re-check:
 *   - batch open
 *   - seats taken (active enrollments + pending ones < 30m) < seats_total
 *   - student not already actively enrolled
 * - Create or reuse enrollment (pending_payment) and fee_dues from chosen plan
 * - Insert payments row (status: created, amount computed on server in paise)
 * - Create Razorpay order via Orders API (amount, currency INR, receipt = payments row id)
 * - Idempotent: if unpaid order exists for the same due, returns it
 */
export async function createPaymentOrder(
  user: AuthUser,
  params: {
    batchSlug: string;
    feePlanId: string;
    studentDetails?: {
      fullName?: string;
      phone?: string;
      parentName?: string;
      parentPhone?: string;
    };
  },
  parentTx?: DatabaseExecutor,
): Promise<CreateOrderResult> {
  assert(!!user?.id, "Authentication required to checkout.", 401);

  // Rate limit checkout attempts per student (10 attempts per 15 minutes)
  const rateLimitKey = `checkout:user:${user.id}`;
  const rateCheck = await consumePostgresRateLimit(rateLimitKey, 10, 15 * 60 * 1000, parentTx || db);
  if (!rateCheck.success) {
    throw new Error("Too many checkout attempts. Please wait a few minutes before trying again.");
  }

  const runInTx = async (tx: DatabaseExecutor): Promise<CreateOrderResult> => {
    // 1. Lock the batch row FOR UPDATE
    const lockedBatches = await tx
      .select()
      .from(schema.batches)
      .where(eq(schema.batches.slug, params.batchSlug))
      .for("update")
      .limit(1);

    const batch = lockedBatches[0];
    if (!batch) {
      throw new Error("Batch not found.");
    }

    // Batch status check
    if (batch.status !== "open") {
      throw new Error("This batch is currently closed for admissions.");
    }

    // 2. Re-check seats taken:
    // active enrollments + pending enrollments under 30 minutes old
    const seatsTakenRes = await tx.execute(sql`
      SELECT count(*)::int as count 
      FROM enrollments 
      WHERE batch_id = ${batch.id} 
        AND (
          status = 'active' 
          OR (status = 'pending_payment' AND created_at > now() - interval '30 minutes')
        );
    `);
    const seatsTaken = (seatsTakenRes.rows[0] as { count?: number } | undefined)?.count ?? 0;

    if (seatsTaken >= batch.seatsTotal) {
      throw new Error("Batch full");
    }

    // 3. Check student not already actively enrolled
    const activeExisting = await tx
      .select()
      .from(schema.enrollments)
      .where(
        and(
          eq(schema.enrollments.batchId, batch.id),
          eq(schema.enrollments.studentId, user.id),
          eq(schema.enrollments.status, "active"),
        ),
      )
      .limit(1);

    if (activeExisting.length > 0) {
      throw new Error("You are already actively enrolled in this batch.");
    }

    // 4. Fetch the chosen fee plan
    const [feePlan] = await tx
      .select()
      .from(schema.batchFeePlans)
      .where(
        and(
          eq(schema.batchFeePlans.id, params.feePlanId),
          eq(schema.batchFeePlans.batchId, batch.id),
          eq(schema.batchFeePlans.isActive, true),
        ),
      )
      .limit(1);

    if (!feePlan) {
      throw new Error("Invalid or inactive fee plan selected.");
    }

    // 5. Create or reuse the enrollment (status: pending_payment)
    let enrollment = (
      await tx
        .select()
        .from(schema.enrollments)
        .where(
          and(
            eq(schema.enrollments.batchId, batch.id),
            eq(schema.enrollments.studentId, user.id),
          ),
        )
        .limit(1)
    )[0];

    if (enrollment) {
      const [updated] = await tx
        .update(schema.enrollments)
        .set({
          feePlanId: feePlan.id,
          status: "pending_payment",
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(schema.enrollments.id, enrollment.id))
        .returning();
      enrollment = updated;
    } else {
      const [inserted] = await tx
        .insert(schema.enrollments)
        .values({
          batchId: batch.id,
          studentId: user.id,
          feePlanId: feePlan.id,
          status: "pending_payment",
          source: "online",
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();
      enrollment = inserted;
    }

    if (!enrollment) {
      throw new Error("Failed to initialize enrollment record.");
    }

    // 6. Generate or sync fee_dues from the chosen plan
    const existingDues = await tx
      .select()
      .from(schema.feeDues)
      .where(eq(schema.feeDues.enrollmentId, enrollment.id))
      .orderBy(asc(schema.feeDues.dueDate));

    let targetDue: typeof schema.feeDues.$inferSelect | undefined;

    const todayStr = new Date().toISOString().split("T")[0]!;

    if (existingDues.length === 0) {
      const generated = generatePlanFeeDues(feePlan.totalPaise, feePlan.instalments, todayStr);
      const newDuesToInsert = generated.map((due) => ({
        enrollmentId: enrollment.id,
        label: due.label,
        amountPaise: due.amountPaise,
        dueDate: due.dueDate,
        status: "due" as const,
      }));

      const insertedDues = await tx
        .insert(schema.feeDues)
        .values(newDuesToInsert)
        .returning();

      targetDue = insertedDues[0];
    } else {
      // Reusing dues: find first unpaid due
      targetDue = existingDues.find((d) => d.status === "due") || existingDues[0];
    }

    if (!targetDue) {
      throw new Error("Unable to determine payable fee due for this plan.");
    }

    // 7. Check idempotency: If an unpaid order already exists for this due within 30m, reuse it
    const existingUnpaidPayment = (
      await tx
        .select()
        .from(schema.payments)
        .where(
          and(
            eq(schema.payments.feeDueId, targetDue.id),
            eq(schema.payments.status, "created"),
            sql`${schema.payments.razorpayOrderId} IS NOT NULL`,
            sql`${schema.payments.createdAt} > timezone('utc'::text, now()) - interval '30 minutes'`,
          ),
        )
        .orderBy(desc(schema.payments.createdAt))
        .limit(1)
    )[0];

    if (existingUnpaidPayment && existingUnpaidPayment.razorpayOrderId) {
      return {
        success: true,
        orderId: existingUnpaidPayment.razorpayOrderId,
        amountPaise: existingUnpaidPayment.amountPaise,
        paymentId: existingUnpaidPayment.id,
        keyId: publicEnv.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        currency: "INR",
        batchTitle: batch.title,
        isReusedOrder: true,
      };
    }

    // 8. Insert new payments row in 'created' status with server-computed amount
    const [paymentRecord] = await tx
      .insert(schema.payments)
      .values({
        studentId: user.id,
        enrollmentId: enrollment.id,
        feeDueId: targetDue.id,
        method: "razorpay",
        amountPaise: targetDue.amountPaise,
        currency: "INR",
        status: "created",
        raw: {
          batchSlug: batch.slug,
          feePlanName: feePlan.name,
          studentDetails: params.studentDetails || {},
        },
      })
      .returning();

    if (!paymentRecord) {
      throw new Error("Failed to create internal payment record.");
    }

    // 9. Create Razorpay order via Orders API
    const rzpOrder = await createRazorpayOrder({
      amountPaise: targetDue.amountPaise,
      currency: "INR",
      receipt: paymentRecord.id,
      notes: {
        enrollment_id: enrollment.id,
        fee_due_id: targetDue.id,
        student_id: user.id,
        batch_id: batch.id,
      },
    });

    // 10. Save razorpay_order_id on payments row
    await tx
      .update(schema.payments)
      .set({
        razorpayOrderId: rzpOrder.id,
        updatedAt: new Date(),
      })
      .where(eq(schema.payments.id, paymentRecord.id));

    // Optionally update user profile if student/parent details provided
    if (params.studentDetails && Object.keys(params.studentDetails).length > 0) {
      await tx
        .update(schema.profiles)
        .set({
          phone: params.studentDetails.phone || undefined,
          parentName: params.studentDetails.parentName || undefined,
          parentPhone: params.studentDetails.parentPhone || undefined,
          updatedAt: new Date(),
        })
        .where(eq(schema.profiles.userId, user.id));
    }

    return {
      success: true,
      orderId: rzpOrder.id,
      amountPaise: targetDue.amountPaise,
      paymentId: paymentRecord.id,
      keyId: publicEnv.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      currency: "INR",
      batchTitle: batch.title,
    };
  };

  if (parentTx) {
    return await runInTx(parentTx);
  }
  return await db.transaction(runInTx);
}

/**
 * Requirement 7: Later instalments payment order flow
 * From the dashboard, each due has a "Pay ₹X" button that runs the same flow for that due only.
 */
export async function createPaymentOrderForDue(
  user: AuthUser,
  dueId: string,
  parentTx?: DatabaseExecutor,
): Promise<CreateOrderResult> {
  assert(!!user?.id, "Authentication required.", 401);

  const runInTx = async (tx: DatabaseExecutor): Promise<CreateOrderResult> => {
    // 1. Fetch due and verify ownership
    const [due] = await tx
      .select()
      .from(schema.feeDues)
      .where(eq(schema.feeDues.id, dueId))
      .for("update")
      .limit(1);

    if (!due) {
      throw new Error("Fee due not found.");
    }

    if (due.status !== "due") {
      throw new Error("This fee due is already paid or waived.");
    }

    // 2. Fetch enrollment
    const [enrollment] = await tx
      .select()
      .from(schema.enrollments)
      .where(eq(schema.enrollments.id, due.enrollmentId))
      .limit(1);

    if (!enrollment) {
      throw new Error("Associated enrollment not found.");
    }

    if (!isStaff(user) && enrollment.studentId !== user.id) {
      throw new Error("Unauthorized to pay this due.");
    }

    // 3. Fetch batch title
    const [batch] = await tx
      .select()
      .from(schema.batches)
      .where(eq(schema.batches.id, enrollment.batchId))
      .limit(1);

    // 4. Idempotency check: Reuse existing unpaid order under 30 minutes
    const existingUnpaidPayment = (
      await tx
        .select()
        .from(schema.payments)
        .where(
          and(
            eq(schema.payments.feeDueId, due.id),
            eq(schema.payments.status, "created"),
            sql`${schema.payments.razorpayOrderId} IS NOT NULL`,
            sql`${schema.payments.createdAt} > timezone('utc'::text, now()) - interval '30 minutes'`,
          ),
        )
        .orderBy(desc(schema.payments.createdAt))
        .limit(1)
    )[0];

    if (existingUnpaidPayment && existingUnpaidPayment.razorpayOrderId) {
      return {
        success: true,
        orderId: existingUnpaidPayment.razorpayOrderId,
        amountPaise: existingUnpaidPayment.amountPaise,
        paymentId: existingUnpaidPayment.id,
        keyId: publicEnv.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        currency: "INR",
        batchTitle: batch?.title || "Quick2Learn Course",
        isReusedOrder: true,
      };
    }

    // 5. Insert payments row
    const [paymentRecord] = await tx
      .insert(schema.payments)
      .values({
        studentId: enrollment.studentId,
        enrollmentId: enrollment.id,
        feeDueId: due.id,
        method: "razorpay",
        amountPaise: due.amountPaise,
        currency: "INR",
        status: "created",
        raw: {
          dueLabel: due.label,
          batchId: enrollment.batchId,
        },
      })
      .returning();

    if (!paymentRecord) {
      throw new Error("Failed to create payment record.");
    }

    // 6. Create Razorpay order
    const rzpOrder = await createRazorpayOrder({
      amountPaise: due.amountPaise,
      currency: "INR",
      receipt: paymentRecord.id,
      notes: {
        enrollment_id: enrollment.id,
        fee_due_id: due.id,
        student_id: enrollment.studentId,
      },
    });

    await tx
      .update(schema.payments)
      .set({
        razorpayOrderId: rzpOrder.id,
        updatedAt: new Date(),
      })
      .where(eq(schema.payments.id, paymentRecord.id));

    return {
      success: true,
      orderId: rzpOrder.id,
      amountPaise: due.amountPaise,
      paymentId: paymentRecord.id,
      keyId: publicEnv.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      currency: "INR",
      batchTitle: batch?.title || "Quick2Learn Course",
    };
  };

  if (parentTx) {
    return await runInTx(parentTx);
  }
  return await db.transaction(runInTx);
}

/**
 * Requirement 8: Offline payments for the admin panel
 * recordOfflinePayment(dueId, method, amountPaise, note, recordedBy)
 * In one transaction:
 * - Insert payment with recorded_by, method in ('cash', 'upi_offline', 'bank_transfer')
 * - Mark due paid
 * - Activate enrollment if pending
 * - Write audit_log
 */
export async function recordOfflinePayment(
  staffUser: AuthUser,
  params: {
    dueId: string;
    method: "cash" | "upi_offline" | "bank_transfer";
    amountPaise: number;
    note?: string;
  },
  parentTx?: DatabaseExecutor,
) {
  assert(isStaff(staffUser), "Staff or Admin authorization required to record offline payments.", 403);

  const runInTx = async (tx: DatabaseExecutor) => {
    // 1. Lock fee due FOR UPDATE
    const [due] = await tx
      .select()
      .from(schema.feeDues)
      .where(eq(schema.feeDues.id, params.dueId))
      .for("update")
      .limit(1);

    if (!due) {
      throw new Error("Fee due not found.");
    }

    if (due.status === "paid") {
      throw new Error("This fee due has already been marked paid.");
    }

    // 2. Fetch enrollment
    const [enrollment] = await tx
      .select()
      .from(schema.enrollments)
      .where(eq(schema.enrollments.id, due.enrollmentId))
      .limit(1);

    if (!enrollment) {
      throw new Error("Associated enrollment not found.");
    }

    // 3. Assign receipt number from sequence
    const seqResult = await tx.execute(
      sql`SELECT nextval('public.receipt_no_seq') as seq;`,
    );
    const seqRow = seqResult.rows[0] as { seq?: string | number } | undefined;
    const seqVal = seqRow?.seq || Date.now().toString().slice(-6);
    const currentYear = new Date().getFullYear();
    const receiptNo = `Q2L-${currentYear}-${String(seqVal).padStart(6, "0")}`;

    // 4. Insert paid payment record
    const [payment] = await tx
      .insert(schema.payments)
      .values({
        studentId: enrollment.studentId,
        enrollmentId: enrollment.id,
        feeDueId: due.id,
        method: params.method,
        amountPaise: params.amountPaise,
        currency: "INR",
        status: "paid",
        receiptNo,
        recordedBy: staffUser.id,
        paidAt: new Date(),
        raw: {
          note: params.note || "Offline payment recorded by staff",
          offline: true,
          recordedByName: staffUser.name,
        },
      })
      .returning();

    if (!payment) {
      throw new Error("Failed to record offline payment.");
    }

    // 5. Mark fee due paid
    await tx
      .update(schema.feeDues)
      .set({
        status: "paid",
        paymentId: payment.id,
        updatedAt: new Date(),
      })
      .where(eq(schema.feeDues.id, due.id));

    // 6. Activate enrollment if pending
    if (enrollment.status === "pending_payment") {
      await tx
        .update(schema.enrollments)
        .set({
          status: "active",
          updatedAt: new Date(),
        })
        .where(eq(schema.enrollments.id, enrollment.id));
    }

    // 7. Write audit log
    await tx.insert(schema.auditLog).values({
      actorId: staffUser.id,
      action: "record_offline_payment",
      entity: "payments",
      entityId: payment.id,
      diff: {
        dueId: due.id,
        method: params.method,
        amountPaise: params.amountPaise,
        receiptNo,
        note: params.note,
      },
    });

    return {
      payment,
      receiptNo,
    };
  };

  if (parentTx) {
    return await runInTx(parentTx);
  }
  return await db.transaction(runInTx);
}

/**
 * Requirement 9: Housekeeping daily cleanup
 * Marks orders unpaid for 24 hours as failed and cancels their pending enrollments.
 */
export async function runPaymentHousekeeping(parentTx?: DatabaseExecutor) {
  const runInTx = async (tx: DatabaseExecutor) => {
    // 1. Find payments created > 24 hours ago still in 'created' status
    const expiredPayments = await tx
      .select({ id: schema.payments.id, enrollmentId: schema.payments.enrollmentId })
      .from(schema.payments)
      .where(
        and(
          eq(schema.payments.status, "created"),
          sql`${schema.payments.createdAt} < now() - interval '24 hours'`,
        ),
      );

    if (expiredPayments.length > 0) {
      await tx
        .update(schema.payments)
        .set({
          status: "failed",
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(schema.payments.status, "created"),
            sql`${schema.payments.createdAt} < now() - interval '24 hours'`,
          ),
        );
    }

    // 2. Cancel enrollments pending payment for > 24 hours with no active payments
    const cancelledEnrollments = await tx.execute(sql`
      UPDATE enrollments e
      SET status = 'cancelled', updated_at = now()
      WHERE e.status = 'pending_payment'
        AND e.created_at < now() - interval '24 hours'
        AND NOT EXISTS (
          SELECT 1 FROM payments p 
          WHERE p.enrollment_id = e.id AND p.status = 'paid'
        )
      RETURNING e.id;
    `);

    return {
      expiredPaymentsCount: expiredPayments.length,
      cancelledEnrollmentsCount: cancelledEnrollments.rowCount || 0,
    };
  };

  if (parentTx) {
    return await runInTx(parentTx);
  }
  return await db.transaction(runInTx);
}

/**
 * Requirement 6: Handle Razorpay Webhooks
 * - Verifies signature with RAZORPAY_WEBHOOK_SECRET
 * - INSERT INTO webhook_events … ON CONFLICT (event_id) DO NOTHING RETURNING id
 * - If no row comes back, it is a replay: respond 200 and stop
 * - Handles payment.captured, order.paid, payment.failed, refund.processed
 * - Sets processed_at when done
 */
export async function handleRazorpayWebhook(
  rawBody: string,
  signature: string,
): Promise<{ statusCode: number; body: Record<string, unknown> }> {
  // 1. Verify HMAC-SHA256 signature
  const isValid = verifyWebhookSignature(rawBody, signature);
  if (!isValid) {
    return {
      statusCode: 401,
      body: { error: "Invalid webhook signature" },
    };
  }

  // 2. Parse JSON payload
  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return {
      statusCode: 400,
      body: { error: "Malformed JSON payload" },
    };
  }

  const eventName = typeof payload.event === "string" ? payload.event : "";
  const eventId =
    (typeof payload.event_id === "string" && payload.event_id) ||
    (typeof payload.id === "string" && payload.id) ||
    `${eventName}_${(payload.created_at as number) || Date.now()}`;

  // 3. Deduplication via ON CONFLICT DO NOTHING
  const insertedEvents = await db
    .insert(schema.webhookEvents)
    .values({
      provider: "razorpay",
      eventId,
      payload,
    })
    .onConflictDoNothing({
      target: schema.webhookEvents.eventId,
    })
    .returning({ id: schema.webhookEvents.id });

  // Replay: respond 200 and stop
  if (insertedEvents.length === 0) {
    return {
      statusCode: 200,
      body: { status: "ignored_duplicate", eventId },
    };
  }

  const webhookEventRecordId = insertedEvents[0]!.id;

  // 4. Handle event types
  const eventPayload = (payload.payload as Record<string, unknown>) || {};
  const paymentEntity =
    ((eventPayload.payment as Record<string, unknown>)?.entity as Record<
      string,
      unknown
    >) || {};
  const orderEntity =
    ((eventPayload.order as Record<string, unknown>)?.entity as Record<
      string,
      unknown
    >) || {};
  const refundEntity =
    ((eventPayload.refund as Record<string, unknown>)?.entity as Record<
      string,
      unknown
    >) || {};

  const orderId =
    (typeof paymentEntity.order_id === "string" && paymentEntity.order_id) ||
    (typeof orderEntity.id === "string" && orderEntity.id) ||
    undefined;

  const paymentId =
    (typeof paymentEntity.id === "string" && paymentEntity.id) ||
    (typeof refundEntity.payment_id === "string" && refundEntity.payment_id) ||
    undefined;

  if (eventName === "payment.captured" || eventName === "order.paid") {
    if (orderId) {
      await markPaymentPaid(orderId, paymentId, "webhook");
    }
  } else if (eventName === "payment.failed") {
    if (orderId) {
      await db
        .update(schema.payments)
        .set({
          status: "failed",
          updatedAt: new Date(),
        })
        .where(eq(schema.payments.razorpayOrderId, orderId));
    }
  } else if (eventName === "refund.processed") {
    if (paymentId) {
      const [refundedPayment] = await db
        .update(schema.payments)
        .set({
          status: "refunded",
          updatedAt: new Date(),
        })
        .where(eq(schema.payments.razorpayPaymentId, paymentId))
        .returning();

      if (refundedPayment?.feeDueId) {
        await db
          .update(schema.feeDues)
          .set({
            status: "due",
            paymentId: null,
            updatedAt: new Date(),
          })
          .where(eq(schema.feeDues.id, refundedPayment.feeDueId));
      }
    }
  }

  // 5. Set processed_at when done
  await db
    .update(schema.webhookEvents)
    .set({
      processedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(schema.webhookEvents.id, webhookEventRecordId));

  return {
    statusCode: 200,
    body: { status: "success", eventId },
  };
}
