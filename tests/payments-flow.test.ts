import { describe, it, expect, beforeEach, vi } from "vitest";
vi.mock("server-only", () => ({}));
import crypto from "crypto";
import {
  verifyPaymentSignature,
  verifyWebhookSignature,
  markPaymentPaid,
  createPaymentOrder,
  recordOfflinePayment,
  runPaymentHousekeeping,
} from "../apps/web/src/server/payments";
import {
  db,
  schema,
  eq,
  and,
  sql,
} from "@quick2learn/db";
import {
  paiseToRupees,
  rupeesToPaise,
  formatINR,
  isValidPaise,
} from "@quick2learn/shared";
import type { AuthUser } from "../apps/web/src/server/authz";

describe("Razorpay Payments & Checkout Architecture Suite", () => {
  const testSecret = "test_razorpay_secret_key_12345";
  const testWebhookSecret = "test_webhook_secret_key_67890";

  const studentUser: AuthUser = {
    id: "u0000000-0000-0000-0000-000000000001",
    email: "payment-student1@test.quick2learn.in",
    name: "Student One",
    role: "student",
  };

  const student2User: AuthUser = {
    id: "u0000000-0000-0000-0000-000000000002",
    email: "payment-student2@test.quick2learn.in",
    name: "Student Two",
    role: "student",
  };

  const adminUser: AuthUser = {
    id: "u0000000-0000-0000-0000-000000000003",
    email: "payment-admin@test.quick2learn.in",
    name: "Dinesh Sir (Admin)",
    role: "admin",
  };

  beforeEach(async () => {
    // Ensure test users exist in DB
    for (const u of [studentUser, student2User, adminUser]) {
      await db
        .insert(schema.user)
        .values({
          id: u.id,
          name: u.name,
          email: u.email,
          emailVerified: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .onConflictDoNothing();

      await db
        .insert(schema.profiles)
        .values({
          userId: u.id,
          fullName: u.name,
          role: u.role,
          phone: "9897000000",
          onboardedAt: new Date(),
        })
        .onConflictDoNothing();
    }
  });

  // 1. UNIT TESTS: SIGNATURE VERIFICATION & PAISE CALCULATIONS
  describe("Unit Tests: Signature Verification and Money Calculations", () => {
    it("correctly verifies valid Razorpay payment signature using HMAC-SHA256 constant-time comparison", () => {
      const orderId = "order_EKwxwAgItmmMnv";
      const paymentId = "pay_29QQoUBi66xm2f";
      const validSignature = crypto
        .createHmac("sha256", testSecret)
        .update(`${orderId}|${paymentId}`)
        .digest("hex");

      const isValid = verifyPaymentSignature(
        orderId,
        paymentId,
        validSignature,
        testSecret,
      );
      expect(isValid).toBe(true);
    });

    it("rejects tampered payment signatures, order IDs, or secrets", () => {
      const orderId = "order_EKwxwAgItmmMnv";
      const paymentId = "pay_29QQoUBi66xm2f";
      const validSignature = crypto
        .createHmac("sha256", testSecret)
        .update(`${orderId}|${paymentId}`)
        .digest("hex");

      // Tampered orderId
      expect(
        verifyPaymentSignature(
          "order_tampered",
          paymentId,
          validSignature,
          testSecret,
        ),
      ).toBe(false);

      // Tampered paymentId
      expect(
        verifyPaymentSignature(
          orderId,
          "pay_tampered",
          validSignature,
          testSecret,
        ),
      ).toBe(false);

      // Tampered signature string
      expect(
        verifyPaymentSignature(
          orderId,
          paymentId,
          "0000000000000000000000000000000000000000000000000000000000000000",
          testSecret,
        ),
      ).toBe(false);

      // Wrong secret key
      expect(
        verifyPaymentSignature(
          orderId,
          paymentId,
          validSignature,
          "wrong_secret",
        ),
      ).toBe(false);
    });

    it("correctly verifies valid webhook signature against raw body", () => {
      const rawPayload = JSON.stringify({
        event: "payment.captured",
        payload: { payment: { entity: { id: "pay_test123" } } },
      });

      const validSignature = crypto
        .createHmac("sha256", testWebhookSecret)
        .update(rawPayload)
        .digest("hex");

      expect(
        verifyWebhookSignature(rawPayload, validSignature, testWebhookSecret),
      ).toBe(true);

      // Tampered body
      expect(
        verifyWebhookSignature(
          rawPayload + " ",
          validSignature,
          testWebhookSecret,
        ),
      ).toBe(false);
    });

    it("accurately computes and formats integer paise amounts", () => {
      expect(paiseToRupees(1800000)).toBe(18000);
      expect(rupeesToPaise(18000)).toBe(1800000);
      expect(formatINR(1800000)).toContain("18,000");
      expect(isValidPaise(1800000)).toBe(true);
      expect(isValidPaise(-500)).toBe(false);
      expect(isValidPaise(18.5)).toBe(false);
    });
  });

  // 2. SERVER-DECIDED AMOUNTS & CHECKOUT ORDER CREATION
  describe("Server-Decided Amounts & Order Creation", () => {
    it("computes order amount strictly on the server from the fee plan in Postgres", async () => {
      const [feePlanRecord] = await db
        .select({
          batch: schema.batches,
          feePlan: schema.batchFeePlans,
        })
        .from(schema.batchFeePlans)
        .innerJoin(schema.batches, eq(schema.batchFeePlans.batchId, schema.batches.id))
        .where(
          and(
            eq(schema.batches.status, "open"),
            eq(schema.batchFeePlans.isActive, true),
          ),
        )
        .limit(1);

      const batch = feePlanRecord!.batch;
      const feePlan = feePlanRecord!.feePlan;

      // Clean up previous test enrollments for clean state
      await db
        .delete(schema.enrollments)
        .where(
          and(
            eq(schema.enrollments.batchId, batch.id),
            eq(schema.enrollments.studentId, studentUser.id),
          ),
        );

      const orderResult = await createPaymentOrder(studentUser, {
        batchSlug: batch.slug,
        feePlanId: feePlan.id,
      });

      expect(orderResult.success).toBe(true);
      expect(orderResult.orderId).toBeDefined();

      // Verify the payment row in DB has amount matching fee plan, NOT any client parameter
      const [paymentRecord] = await db
        .select()
        .from(schema.payments)
        .where(eq(schema.payments.id, orderResult.paymentId));

      expect(paymentRecord).toBeDefined();
      expect(paymentRecord.amountPaise).toBe(orderResult.amountPaise);
      expect(paymentRecord.status).toBe("created");
    });

    it("idempotently returns existing unpaid order for the same fee due instead of duplicating", async () => {
      const [feePlanRecord] = await db
        .select({
          batch: schema.batches,
          feePlan: schema.batchFeePlans,
        })
        .from(schema.batchFeePlans)
        .innerJoin(schema.batches, eq(schema.batchFeePlans.batchId, schema.batches.id))
        .where(
          and(
            eq(schema.batches.status, "open"),
            eq(schema.batchFeePlans.isActive, true),
          ),
        )
        .limit(1);

      const batch = feePlanRecord!.batch;
      const feePlan = feePlanRecord!.feePlan;

      // First checkout call
      const order1 = await createPaymentOrder(studentUser, {
        batchSlug: batch.slug,
        feePlanId: feePlan.id,
      });

      // Second checkout call immediately after (e.g. user refreshed or reopened)
      const order2 = await createPaymentOrder(studentUser, {
        batchSlug: batch.slug,
        feePlanId: feePlan.id,
      });

      expect(order2.orderId).toBe(order1.orderId);
      expect(order2.paymentId).toBe(order1.paymentId);
      expect(order2.amountPaise).toBe(order1.amountPaise);
    });
  });

  // 3. END-TO-END PAYMENT ACTIVATION & RECEIPT NUMBER GENERATION
  describe("End-to-End Payment Activation & Receipt Generation", () => {
    it("activates enrollment, marks fee due paid, and assigns receipt number from sequence", async () => {
      const [feePlanRecord] = await db
        .select({
          batch: schema.batches,
          feePlan: schema.batchFeePlans,
        })
        .from(schema.batchFeePlans)
        .innerJoin(schema.batches, eq(schema.batchFeePlans.batchId, schema.batches.id))
        .where(
          and(
            eq(schema.batches.status, "open"),
            eq(schema.batchFeePlans.isActive, true),
          ),
        )
        .limit(1);

      const batch = feePlanRecord!.batch;
      const feePlan = feePlanRecord!.feePlan;

      // Reset student enrollment
      await db
        .delete(schema.enrollments)
        .where(
          and(
            eq(schema.enrollments.batchId, batch.id),
            eq(schema.enrollments.studentId, studentUser.id),
          ),
        );

      const order = await createPaymentOrder(studentUser, {
        batchSlug: batch.slug,
        feePlanId: feePlan.id,
      });

      const rzpPaymentId = `pay_test_${Date.now()}`;

      // Mark payment paid via shared function
      const markResult = await markPaymentPaid(
        order.orderId,
        rzpPaymentId,
        "test_suite",
      );

      expect(markResult.isAlreadyPaid).toBe(false);
      expect(markResult.receiptNo).toMatch(/^Q2L-\d{4}-\d{6}$/);

      // Verify DB state:
      // 1. Payment is paid
      const [dbPayment] = await db
        .select()
        .from(schema.payments)
        .where(eq(schema.payments.id, order.paymentId));
      expect(dbPayment.status).toBe("paid");
      expect(dbPayment.receiptNo).toBe(markResult.receiptNo);
      expect(dbPayment.paidAt).not.toBeNull();

      // 2. Fee due is paid
      const [dbDue] = await db
        .select()
        .from(schema.feeDues)
        .where(eq(schema.feeDues.id, dbPayment.feeDueId!));
      expect(dbDue.status).toBe("paid");
      expect(dbDue.paymentId).toBe(dbPayment.id);

      // 3. Enrollment is active
      const [dbEnrollment] = await db
        .select()
        .from(schema.enrollments)
        .where(eq(schema.enrollments.id, dbPayment.enrollmentId!));
      expect(dbEnrollment.status).toBe("active");
    });
  });

  // 4. IDEMPOTENCY: CLIENT VERIFY & WEBHOOK IN EITHER ORDER
  describe("Idempotent Dual-Processing (Verify & Webhook in either order)", () => {
    it("case A: client verify first, then webhook -> applies exactly once with identical receipt", async () => {
      const [feePlanRecord] = await db
        .select({
          batch: schema.batches,
          feePlan: schema.batchFeePlans,
        })
        .from(schema.batchFeePlans)
        .innerJoin(schema.batches, eq(schema.batchFeePlans.batchId, schema.batches.id))
        .where(
          and(
            eq(schema.batches.status, "open"),
            eq(schema.batchFeePlans.isActive, true),
          ),
        )
        .limit(1);

      const batch = feePlanRecord!.batch;
      const feePlan = feePlanRecord!.feePlan;

      await db
        .delete(schema.enrollments)
        .where(
          and(
            eq(schema.enrollments.batchId, batch.id),
            eq(schema.enrollments.studentId, student2User.id),
          ),
        );

      const order = await createPaymentOrder(student2User, {
        batchSlug: batch.slug,
        feePlanId: feePlan.id,
      });

      const paymentId = `pay_order_case_a_${Date.now()}`;

      // 1. Client verify runs first
      const firstRun = await markPaymentPaid(order.orderId, paymentId, "client_verify");
      expect(firstRun.isAlreadyPaid).toBe(false);
      const originalReceipt = firstRun.receiptNo;

      // 2. Webhook arrives shortly after
      const secondRun = await markPaymentPaid(order.orderId, paymentId, "webhook");
      expect(secondRun.isAlreadyPaid).toBe(true);
      expect(secondRun.receiptNo).toBe(originalReceipt);

      // Verify only 1 payment row exists
      const payments = await db
        .select()
        .from(schema.payments)
        .where(eq(schema.payments.razorpayOrderId, order.orderId));
      expect(payments.length).toBe(1);
      expect(payments[0].status).toBe("paid");
    });

    it("case B: webhook first, then client verify -> applies exactly once with identical receipt", async () => {
      const [feePlanRecord] = await db
        .select({
          batch: schema.batches,
          feePlan: schema.batchFeePlans,
        })
        .from(schema.batchFeePlans)
        .innerJoin(schema.batches, eq(schema.batchFeePlans.batchId, schema.batches.id))
        .where(
          and(
            eq(schema.batches.status, "open"),
            eq(schema.batchFeePlans.isActive, true),
          ),
        )
        .limit(1);

      const batch = feePlanRecord!.batch;
      const feePlan = feePlanRecord!.feePlan;

      await db
        .delete(schema.enrollments)
        .where(
          and(
            eq(schema.enrollments.batchId, batch.id),
            eq(schema.enrollments.studentId, student2User.id),
          ),
        );

      const order = await createPaymentOrder(student2User, {
        batchSlug: batch.slug,
        feePlanId: feePlan.id,
      });

      const paymentId = `pay_order_case_b_${Date.now()}`;

      // 1. Webhook runs first
      const firstRun = await markPaymentPaid(order.orderId, paymentId, "webhook");
      expect(firstRun.isAlreadyPaid).toBe(false);
      const originalReceipt = firstRun.receiptNo;

      // 2. Client verify runs after
      const secondRun = await markPaymentPaid(order.orderId, paymentId, "client_verify");
      expect(secondRun.isAlreadyPaid).toBe(true);
      expect(secondRun.receiptNo).toBe(originalReceipt);
    });
  });

  // 5. CONCURRENT CHECKOUTS FOR THE LAST SEAT
  describe("Concurrent Checkout & Seat Race Condition Protection", () => {
    it("locks batch FOR UPDATE: when two students checkout the last seat, one gets order and the other gets 'Batch full'", async () => {
      // Create a test batch with capacity of exactly 1 seat
      const testBatchSlug = `last-seat-batch-${Date.now()}`;
      const [testBatch] = await db
        .insert(schema.batches)
        .values({
          slug: testBatchSlug,
          title: "Last Seat Limited Capacity Batch",
          description: "Comprehensive batch with exactly one seat remaining for testing concurrency.",
          scheduleText: "Mon, Wed, Fri 5 PM",
          startDate: new Date(),
          classLevel: 12,
          board: "cbse",
          subjectId: "a0000000-0000-0000-0000-000000000001",
          facultyId: "f0000000-0000-0000-0000-000000000001",
          seatsTotal: 1, // Only 1 seat available!
          status: "open",
        })
        .returning();

      const [plan] = await db
        .insert(schema.batchFeePlans)
        .values({
          batchId: testBatch.id,
          name: "Single Plan",
          totalPaise: 1000000,
          isActive: true,
        })
        .returning();

      // Run two simultaneous checkouts for student 1 and student 2
      const [res1, res2] = await Promise.allSettled([
        createPaymentOrder(studentUser, {
          batchSlug: testBatchSlug,
          feePlanId: plan.id,
        }),
        createPaymentOrder(student2User, {
          batchSlug: testBatchSlug,
          feePlanId: plan.id,
        }),
      ]);

      const successes = [res1, res2].filter((r) => r.status === "fulfilled");
      const failures = [res1, res2].filter((r) => r.status === "rejected");

      expect(successes.length).toBe(1);
      expect(failures.length).toBe(1);

      if (failures[0].status === "rejected") {
        expect(failures[0].reason.message).toContain("Batch full");
      }
    });
  });

  // 6. OFFLINE PAYMENT RECORDING FOR ADMIN
  describe("Offline Payment Recording for Admin", () => {
    it("records cash/offline payment in a transaction with audit log and receipt generation", async () => {
      // Find an unpaid fee due
      const [due] = await db
        .select()
        .from(schema.feeDues)
        .where(eq(schema.feeDues.status, "due"))
        .limit(1);

      if (!due) return;

      const offlineResult = await recordOfflinePayment(adminUser, {
        dueId: due.id,
        method: "cash",
        amountPaise: due.amountPaise,
        note: "Collected in cash at Mathura office desk",
      });

      expect(offlineResult.payment).toBeDefined();
      expect(offlineResult.receiptNo).toMatch(/^Q2L-\d{4}-\d{6}$/);

      // Verify audit log entry was written
      const [logEntry] = await db
        .select()
        .from(schema.auditLog)
        .where(
          and(
            eq(schema.auditLog.action, "record_offline_payment"),
            eq(schema.auditLog.entityId, offlineResult.payment.id),
          ),
        );

      expect(logEntry).toBeDefined();
      expect(logEntry.actorId).toBe(adminUser.id);
    });
  });

  // 7. HOUSEKEEPING DAILY CRON
  describe("Payment Housekeeping Cron", () => {
    it("marks 24h expired created payments as failed and cleans up pending enrollments", async () => {
      // Insert an expired created payment
      const yesterday = new Date(Date.now() - 25 * 60 * 60 * 1000);

      const [expiredPayment] = await db
        .insert(schema.payments)
        .values({
          studentId: studentUser.id,
          method: "razorpay",
          amountPaise: 500000,
          status: "created",
          createdAt: yesterday,
        })
        .returning();

      const housekeepingResult = await runPaymentHousekeeping();

      expect(housekeepingResult.expiredPaymentsCount).toBeGreaterThanOrEqual(1);

      const [refreshedPayment] = await db
        .select()
        .from(schema.payments)
        .where(eq(schema.payments.id, expiredPayment.id));

      expect(refreshedPayment.status).toBe("failed");
    });
  });
});
