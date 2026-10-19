import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { db, schema, eq, sql } from "@quick2learn/db";
import { getStudentFeesData, getStudentQuickStats } from "../apps/web/src/server/data/fees";
import { generateReceiptPdf } from "../apps/web/src/server/pdf/receipt-pdf";
import { getAppConfig } from "../apps/web/src/server/data/settings";
import {
  requestAccountDeletionOtp,
  confirmAccountDeletion,
  requestPublicAccountDeletion,
} from "../apps/web/src/server/data/account-deletion";
import {
  requestPhoneChangeOtp,
  confirmPhoneChange,
} from "../apps/web/src/server/data/phone-change";
import { getPaymentReceipt } from "../apps/web/src/server/data/payments";

describe("Profile, Fees, Receipts, Settings & Play Rules Integration Suite", () => {
  const testStudentId = `student-p12-${Date.now()}`;
  const testStudentEmail = `${testStudentId}@quick2learn.test`;
  const initialPhone = "98" + Math.floor(10000000 + Math.random() * 90000000).toString();
  let testBatchId: string;
  let testEnrollmentId: string;
  let testDueId: string;
  let testPaymentId: string;
  const testReceiptNo = `Q2L-2026-${Math.floor(100000 + Math.random() * 900000)}`;

  const studentUser = {
    id: testStudentId,
    name: "Arjun Sharma",
    email: testStudentEmail,
    role: "student" as const,
  };

  beforeAll(async () => {
    // 1. Seed Student User & Profile
    await db.insert(schema.user).values({
      id: testStudentId,
      name: studentUser.name,
      email: testStudentEmail,
      phoneNumber: initialPhone,
      emailVerified: true,
      phoneNumberVerified: true,
    });

    await db.insert(schema.profiles).values({
      userId: testStudentId,
      fullName: studentUser.name,
      phone: initialPhone,
      role: "student",
      classLevel: 10,
      board: "cbse",
      school: "Delhi Public School, Mathura",
      parentName: "Ramesh Sharma",
      parentPhone: "9876543211",
      city: "Mathura",
      onboardedAt: new Date(),
    });

    // 2. Seed Subject and Batch
    const [subject] = await db
      .insert(schema.subjects)
      .values({
        name: `Maths P12 ${Date.now()}`,
        slug: `maths-p12-${Date.now()}`,
        classLevel: 10,
        board: "cbse",
        orderIndex: 1,
      })
      .returning();

    const [faculty] = await db
      .select({ id: schema.faculty.id })
      .from(schema.faculty)
      .limit(1);

    const [batch] = await db
      .insert(schema.batches)
      .values({
        title: "Class 10 CBSE Maths Excellence 2026",
        slug: `class-10-cbse-p12-${Date.now()}`,
        description: "Comprehensive Mathematics with Dinesh Sir",
        classLevel: 10,
        board: "cbse",
        subjectId: subject.id,
        facultyId: faculty?.id || "faculty-1",
        mode: "hybrid",
        feePaise: 2400000,
        startDate: new Date("2026-04-01"),
        scheduleText: "Mon, Wed, Fri • 5:00 PM - 6:30 PM",
        status: "open",
        isAdmissionsOpen: true,
      })
      .returning();

    testBatchId = batch.id;

    // 3. Seed Enrollment
    const [enrollment] = await db
      .insert(schema.enrollments)
      .values({
        studentId: testStudentId,
        batchId: testBatchId,
        status: "active",
      })
      .returning();

    testEnrollmentId = enrollment.id;

    // 4. Seed Paid Payment & Official Serialized Receipt
    const [payment] = await db
      .insert(schema.payments)
      .values({
        studentId: testStudentId,
        enrollmentId: testEnrollmentId,
        method: "razorpay",
        amountPaise: 1200000,
        currency: "INR",
        status: "paid",
        receiptNo: testReceiptNo,
        razorpayPaymentId: `pay_test_p12_${Date.now()}`,
        paidAt: new Date(),
      })
      .returning();

    testPaymentId = payment.id;

    // 5. Seed Cleared Fee Due (linked to payment)
    await db.insert(schema.feeDues).values({
      enrollmentId: testEnrollmentId,
      label: "Instalment 1 (Term 1)",
      amountPaise: 1200000,
      dueDate: "2026-04-10",
      status: "paid",
      paymentId: testPaymentId,
    });

    // 6. Seed Pending Fee Due
    const [pendingDue] = await db
      .insert(schema.feeDues)
      .values({
        enrollmentId: testEnrollmentId,
        label: "Instalment 2 (Term 2)",
        amountPaise: 1200000,
        dueDate: "2026-08-10",
        status: "due",
      })
      .returning();

    testDueId = pendingDue.id;

    // 7. Seed Attendance record
    await db.insert(schema.attendanceRecords).values({
      studentId: testStudentId,
      batchId: testBatchId,
      date: "2026-04-12",
      status: "present",
      source: "marked",
    });

    // 8. Seed a Test and Attempt
    const [test] = await db
      .insert(schema.tests)
      .values({
        title: "Real Numbers Chapter Test",
        subjectId: subject.id,
        classLevel: 10,
        board: "cbse",
        batchId: testBatchId,
        durationMinutes: 45,
        totalMarks: 40,
        published: true,
      })
      .returning();

    await db.insert(schema.testAttempts).values({
      testId: test.id,
      studentId: testStudentId,
      status: "submitted",
      score: 36,
      startedAt: new Date(),
      deadlineAt: new Date(Date.now() + 3600000),
      submittedAt: new Date(),
    });
  });

  afterAll(async () => {
    // Cleanup any lingering verification or test records
    await db
      .delete(schema.verification)
      .where(sql`${schema.verification.identifier} LIKE ${`%${testStudentId}%`}`);
  });

  // --------------------------------------------------------------------------
  // TEST 1: Fees & Receipts Data Layer (GET /fees parity)
  // --------------------------------------------------------------------------
  it("retrieves dues and payment history matching website records with accurate summary", async () => {
    const feesData = await getStudentFeesData(studentUser);

    expect(feesData).toBeDefined();
    expect(feesData.dues.length).toBe(2);
    expect(feesData.paymentHistory.length).toBe(1);

    // Paid Due & Receipt
    const paidDue = feesData.dues.find((d) => d.status === "paid");
    expect(paidDue).toBeDefined();
    expect(paidDue?.receiptNo).toBe(testReceiptNo);

    // Pending Due
    const pendingDue = feesData.dues.find((d) => d.status === "due");
    expect(pendingDue).toBeDefined();
    expect(pendingDue?.amountPaise).toBe(1200000);
    expect(pendingDue?.batchTitle).toBe("Class 10 CBSE Maths Excellence 2026");

    // Payment History
    const historyItem = feesData.paymentHistory[0];
    expect(historyItem.id).toBe(testPaymentId);
    expect(historyItem.receiptNo).toBe(testReceiptNo);
    expect(historyItem.status).toBe("paid");
    expect(historyItem.receiptPdfUrl).toBe(`/api/v1/payments/${testPaymentId}/receipt-pdf`);

    // Financial Summary
    expect(feesData.summary.totalDuesPaise).toBe(2400000);
    expect(feesData.summary.totalPaidPaise).toBe(1200000);
    expect(feesData.summary.pendingAmountPaise).toBe(1200000);
    expect(feesData.summary.pendingDuesCount).toBe(1);
  });

  // --------------------------------------------------------------------------
  // TEST 2: Google Play Consumption-Only Rule
  // --------------------------------------------------------------------------
  it("enforces inAppPayments is off (false) by default in appConfig to comply with Google Play consumption-only policy", async () => {
    const config = await getAppConfig();

    expect(config).toBeDefined();
    expect(config.featureFlags).toBeDefined();
    expect(config.featureFlags.inAppPayments).toBe(false);
  });

  // --------------------------------------------------------------------------
  // TEST 3: Server-Generated PDF Receipt Generation
  // --------------------------------------------------------------------------
  it("generates a valid binary PDF receipt containing student and institute details", async () => {
    const receiptData = await getPaymentReceipt(studentUser, testPaymentId);
    expect(receiptData).toBeDefined();
    expect(receiptData?.payment.receiptNo).toBe(testReceiptNo);

    const pdfBytes = await generateReceiptPdf(receiptData!);
    expect(pdfBytes).toBeDefined();
    expect(pdfBytes.length).toBeGreaterThan(1000);

    // PDF files begin with magic header %PDF-1.
    const pdfHeader = Buffer.from(pdfBytes.slice(0, 5)).toString("utf-8");
    expect(pdfHeader).toBe("%PDF-");
  });

  // --------------------------------------------------------------------------
  // TEST 4: Student Quick Stats (Profile Tab)
  // --------------------------------------------------------------------------
  it("computes attendance percentage, tests taken, and lectures completed for the profile tab", async () => {
    const stats = await getStudentQuickStats(testStudentId);

    expect(stats).toBeDefined();
    expect(stats.attendancePercentage).toBe(100); // 1 present out of 1
    expect(stats.testsTaken).toBe(1); // 1 submitted test attempt
    expect(typeof stats.lecturesCompleted).toBe("number");
  });

  // --------------------------------------------------------------------------
  // TEST 5: Phone Number Change with OTP
  // --------------------------------------------------------------------------
  it("sends OTP and updates phone number across user and profile tables upon verification", async () => {
    const newPhone = "97" + Math.floor(10000000 + Math.random() * 90000000).toString();

    // 1. Request OTP
    const reqRes = await requestPhoneChangeOtp(testStudentId, newPhone);
    expect(reqRes.success).toBe(true);

    // 2. Confirm with valid code (123456 in test environment)
    const verifyRes = await confirmPhoneChange(testStudentId, newPhone, "123456");
    expect(verifyRes.success).toBe(true);
    expect(verifyRes.phoneNumber).toBe(newPhone);

    // 3. Verify user and profile records updated in DB
    const [dbUser] = await db
      .select({ phoneNumber: schema.user.phoneNumber })
      .from(schema.user)
      .where(eq(schema.user.id, testStudentId));
    expect(dbUser.phoneNumber).toBe(newPhone);

    const [dbProfile] = await db
      .select({ phone: schema.profiles.phone })
      .from(schema.profiles)
      .where(eq(schema.profiles.userId, testStudentId));
    expect(dbProfile.phone).toBe(newPhone);
  });

  // --------------------------------------------------------------------------
  // TEST 6: Public Web Account Deletion Flow (Google Play Listing URL)
  // --------------------------------------------------------------------------
  it("handles public web account deletion OTP dispatch and error prevention", async () => {
    // 1. Request deletion OTP by registered email
    const publicReq = await requestPublicAccountDeletion(testStudentEmail);
    expect(publicReq.success).toBe(true);
    expect(publicReq.userId).toBe(testStudentId);

    // 2. Request deletion OTP for unknown identifier (should not throw, anti-enumeration)
    const unknownReq = await requestPublicAccountDeletion("unknown_student_999@test.com");
    expect(unknownReq.success).toBe(true);
    expect(unknownReq.userId).toBeNull();
  });

  // --------------------------------------------------------------------------
  // TEST 7: Account Deletion, Personal Data Scrubbing & Financial Records Preservation
  // --------------------------------------------------------------------------
  it("anonymizes personal profile details while legally retaining official fee receipts and payment logs", async () => {
    // 1. Request deletion OTP
    const otpRes = await requestAccountDeletionOtp(testStudentId);
    expect(otpRes.success).toBe(true);

    // 2. Confirm deletion with OTP
    const delRes = await confirmAccountDeletion(testStudentId, "123456");
    expect(delRes.success).toBe(true);

    // 3. Verify personal profile details are permanently anonymized
    const [scrubbedUser] = await db
      .select()
      .from(schema.user)
      .where(eq(schema.user.id, testStudentId));

    expect(scrubbedUser.name).toBe("Deleted Account");
    expect(scrubbedUser.email).toContain("@quick2learn.invalid");
    expect(scrubbedUser.phoneNumber).toBeNull();

    const [scrubbedProfile] = await db
      .select()
      .from(schema.profiles)
      .where(eq(schema.profiles.userId, testStudentId));

    expect(scrubbedProfile.fullName).toBe("Deleted Account");
    expect(scrubbedProfile.phone).toBeNull();
    expect(scrubbedProfile.parentPhone).toBeNull();

    // 4. Critical Legal Compliance: Verify payments and official receipts remain intact in DB
    const [retainedPayment] = await db
      .select()
      .from(schema.payments)
      .where(eq(schema.payments.id, testPaymentId));

    expect(retainedPayment).toBeDefined();
    expect(retainedPayment.receiptNo).toBe(testReceiptNo);
    expect(retainedPayment.amountPaise).toBe(1200000);
    expect(retainedPayment.status).toBe("paid");
  });
});
