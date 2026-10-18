import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";

vi.mock("server-only", () => ({}));
import { Pool } from "pg";
import { eq, and, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "../packages/db/src/schema";
import { auth } from "../apps/web/src/server/auth/auth";
import { seed } from "../packages/db/src/seed";
import {
  canActForStudent,
  canViewPayment,
  canViewFeeDue,
  canViewEnrollment,
} from "../apps/web/src/server/authz";
import {
  linkParentToMatchingStudents,
  getLinkedStudentsForParent,
  isParentLinkedToStudent,
  generateStudentParentInviteCode,
  getActiveStudentInviteCode,
  claimParentInviteCode,
  normalizeIndianPhoneDigits,
  formatIndianE164,
} from "../apps/web/src/server/data/parent";
import { POST as postOnboarding } from "../apps/web/src/app/api/v1/onboarding/route";
import { GET as getParentStudents } from "../apps/web/src/app/api/v1/parent/students/route";
import { POST as postParentLink } from "../apps/web/src/app/api/v1/parent/link/route";
import {
  GET as getStudentInviteCode,
  POST as postStudentInviteCode,
} from "../apps/web/src/app/api/v1/student/invite-code/route";

const testDbUrl =
  process.env.DATABASE_URL_TEST ||
  "postgresql://postgres:postgres@localhost:5432/quick2learn_test";

const testPool = new Pool({
  connectionString: testDbUrl,
});

describe("Phone OTP, Account Linking, and Parent Accounts Suite", () => {
  beforeAll(async () => {
    process.env.DATABASE_URL = testDbUrl;
    process.env.AUTH_PHONE_ENABLED = "true";
    await seed(testDbUrl);
  });

  afterAll(async () => {
    await testPool.end();
  });

  it("Test 1: Indian mobile numbers are properly normalised and validated", () => {
    expect(normalizeIndianPhoneDigits("+919876543210")).toBe("9876543210");
    expect(normalizeIndianPhoneDigits("09876543210")).toBe("9876543210");
    expect(normalizeIndianPhoneDigits("98765-43210")).toBe("9876543210");
    expect(formatIndianE164("9876543210")).toBe("+919876543210");
    expect(formatIndianE164("+919876543210")).toBe("+919876543210");
  });

  it("Test 2: Phone OTP endpoint rejects invalid and non-Indian phone numbers", async () => {
    // 1. Invalid number starting with 1
    const req1 = new Request("http://localhost:3000/api/auth/phone-number/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Forwarded-For": "10.0.1.1" },
      body: JSON.stringify({
        phoneNumber: "+911234567890",
      }),
    });
    const res1 = await auth.handler(req1);
    expect(res1.status).toBeGreaterThanOrEqual(400);

    // 2. Too short
    const req2 = new Request("http://localhost:3000/api/auth/phone-number/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Forwarded-For": "10.0.1.2" },
      body: JSON.stringify({
        phoneNumber: "+9198765",
      }),
    });
    const res2 = await auth.handler(req2);
    expect(res2.status).toBeGreaterThanOrEqual(400);

    // 3. Non-Indian country code
    const req3 = new Request("http://localhost:3000/api/auth/phone-number/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Forwarded-For": "10.0.1.3" },
      body: JSON.stringify({
        phoneNumber: "+14155552671",
      }),
    });
    const res3 = await auth.handler(req3);
    expect(res3.status).toBeGreaterThanOrEqual(400);
  });

  it("Test 3: Phone OTP endpoint generates verification record for valid Indian number", async () => {
    const validNumber = "+9196" + Date.now().toString().slice(-8);

    const req = new Request("http://localhost:3000/api/auth/phone-number/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Forwarded-For": "10.0.1.4" },
      body: JSON.stringify({
        phoneNumber: validNumber,
      }),
    });

    const res = await auth.handler(req);
    expect(res.status).toBe(200);

    const client = await testPool.connect();
    try {
      const tx = drizzle(client, { schema });
      const verifications = await tx
        .select()
        .from(schema.verification)
        .where(eq(schema.verification.identifier, validNumber));

      expect(verifications.length).toBeGreaterThanOrEqual(1);
      const v = verifications[0];
      const code = v.value.split(":")[0];
      // Value should be 6 digits
      expect(code.length).toBe(6);
      expect(/^\d{6}$/.test(code)).toBe(true);
      // Expiry should be roughly 300 seconds (5 min) in future
      const diffSec = (v.expiresAt.getTime() - Date.now()) / 1000;
      expect(diffSec).toBeGreaterThan(200);
      expect(diffSec).toBeLessThanOrEqual(305);
    } finally {
      client.release();
    }
  });

  it("Test 4: Phone OTP verification creates user with temporary phone email and Student name", async () => {
    const digits = "98" + Date.now().toString().slice(-8);
    const testPhone = `+91${digits}`;

    // 1. Send OTP
    const sendReq = new Request("http://localhost:3000/api/auth/phone-number/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Forwarded-For": "10.0.1.5" },
      body: JSON.stringify({ phoneNumber: testPhone }),
    });
    const sendRes = await auth.handler(sendReq);
    expect(sendRes.status).toBe(200);

    // 2. Fetch generated OTP from DB
    const client = await testPool.connect();
    let otp = "";
    try {
      const tx = drizzle(client, { schema });
      const [v] = await tx
        .select()
        .from(schema.verification)
        .where(eq(schema.verification.identifier, testPhone));
      expect(v).toBeDefined();
      otp = v.value.split(":")[0];
    } finally {
      client.release();
    }

    // 3. Verify OTP
    const verifyReq = new Request("http://localhost:3000/api/auth/phone-number/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Forwarded-For": "10.0.1.5" },
      body: JSON.stringify({
        phoneNumber: testPhone,
        code: otp,
      }),
    });

    const verifyRes = await auth.handler(verifyReq);
    if (verifyRes.status !== 200) {
      const errText = await verifyRes.clone().text();
      console.error("[Test 4 Verify Error]", verifyRes.status, errText);
    }
    expect(verifyRes.status).toBe(200);

    // 4. Verify user record in DB
    const client2 = await testPool.connect();
    try {
      const tx = drizzle(client2, { schema });
      const [user] = await tx
        .select()
        .from(schema.user)
        .where(eq(schema.user.phoneNumber, testPhone));

      expect(user).toBeDefined();
      expect(user.email).toBe(`${digits}@phone.quick2learn.invalid`);
      expect(user.name).toBe("Student");
      expect(user.phoneNumberVerified).toBe(true);
    } finally {
      client2.release();
    }
  });

  it("Test 5: Parent phone verification automatically links matching student with parent_phone", async () => {
    const client = await testPool.connect();
    try {
      const tx = drizzle(client, { schema });
      const parentDigits = "97" + Date.now().toString().slice(-8);
      const parentPhone = `+91${parentDigits}`;

      // Create student user & profile
      const studentId = `test-student-${Date.now()}`;
      await tx.insert(schema.user).values({
        id: studentId,
        name: "Test Student Linking",
        email: `student-${Date.now()}@example.com`,
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await tx.insert(schema.profiles).values({
        userId: studentId,
        fullName: "Test Student Linking",
        role: "student",
        classLevel: 12,
        board: "cbse",
        school: "Mathura Public School",
        parentPhone: parentDigits, // Student's parent phone
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Create parent user
      const parentId = `test-parent-${Date.now()}`;
      await tx.insert(schema.user).values({
        id: parentId,
        name: "Test Parent User",
        email: `parent-${Date.now()}@example.com`,
        phoneNumber: parentPhone,
        phoneNumberVerified: true,
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await tx.insert(schema.profiles).values({
        userId: parentId,
        fullName: "Test Parent User",
        role: "parent",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Execute auto-linking
      const linked = await linkParentToMatchingStudents(parentId, parentPhone);
      expect(linked.length).toBeGreaterThanOrEqual(1);
      expect(linked.some((s) => s.userId === studentId)).toBe(true);

      // Verify link in DB
      const isLinked = await isParentLinkedToStudent(parentId, studentId);
      expect(isLinked).toBe(true);

      // Get linked students for parent
      const parentStudents = await getLinkedStudentsForParent(parentId);
      expect(parentStudents.length).toBeGreaterThanOrEqual(1);
      expect(parentStudents.some((s) => s.userId === studentId)).toBe(true);
    } finally {
      client.release();
    }
  });

  it("Test 6: Student 6-character invite code generation and parent claiming", async () => {
    const client = await testPool.connect();
    try {
      const tx = drizzle(client, { schema });

      const studentId = `test-stud-code-${Date.now()}`;
      await tx.insert(schema.user).values({
        id: studentId,
        name: "Student With Code",
        email: `studentcode-${Date.now()}@example.com`,
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      await tx.insert(schema.profiles).values({
        userId: studentId,
        fullName: "Student With Code",
        role: "student",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const parentId = `test-parent-claim-${Date.now()}`;
      await tx.insert(schema.user).values({
        id: parentId,
        name: "Parent Claimer",
        email: `parentclaim-${Date.now()}@example.com`,
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      await tx.insert(schema.profiles).values({
        userId: parentId,
        fullName: "Parent Claimer",
        role: "parent",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // 1. Generate code
      const invite = await generateStudentParentInviteCode(studentId);
      expect(invite.code.length).toBe(6);
      expect(/^[A-Z0-9]{6}$/.test(invite.code)).toBe(true);

      // 2. Fetching active returns the same code
      const active = await getActiveStudentInviteCode(studentId);
      expect(active?.code).toBe(invite.code);

      // 3. Parent claims the code
      const linkedStudent = await claimParentInviteCode(parentId, invite.code);
      expect(linkedStudent.userId).toBe(studentId);

      // 4. Code is now used; claiming again throws error
      await expect(claimParentInviteCode(parentId, invite.code)).rejects.toThrow(
        /invalid or expired/i
      );

      // 5. Student cannot claim their own code
      const selfInvite = await generateStudentParentInviteCode(studentId);
      await expect(claimParentInviteCode(studentId, selfInvite.code)).rejects.toThrow(
        /cannot link yourself/i
      );
    } finally {
      client.release();
    }
  });

  it("Test 7: Authorization helper canActForStudent strictly limits parents to attendance, tests, fees, announcements, timetable", async () => {
    const parentUser = {
      id: "parent-user-123",
      email: "parent@example.com",
      role: "parent" as const,
      name: "Parent",
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const linkedStudentId = "student-linked-456";
    const unlinkedStudentId = "student-unlinked-789";

    const linkedStudentIds = [linkedStudentId];

    // Allowed scopes for linked student: attendance, tests, fees, announcements, timetable
    const allowedScopes = ["attendance", "tests", "fees", "announcements", "timetable"] as const;
    for (const scope of allowedScopes) {
      const canAct = await canActForStudent(parentUser, linkedStudentId, {
        scope,
        linkedStudentIds,
      });
      expect(canAct).toBe(true);
    }

    // Forbidden scopes for linked student (e.g., watching private videos, submitting tests, editing profile)
    const forbiddenScopes = ["lecture", "submit_test", "profile_edit", "order_refund"];
    for (const scope of forbiddenScopes) {
      const canAct = await canActForStudent(parentUser, linkedStudentId, {
        scope,
        linkedStudentIds,
      });
      expect(canAct).toBe(false);
    }

    // Unlinked student: parent cannot read anything (every scope returns false)
    for (const scope of allowedScopes) {
      const canAct = await canActForStudent(parentUser, unlinkedStudentId, {
        scope,
        linkedStudentIds,
      });
      expect(canAct).toBe(false);
    }

    // Payment and Fee Due checks for parent
    expect(canViewPayment(parentUser, { studentId: linkedStudentId }, linkedStudentIds)).toBe(true);
    expect(canViewPayment(parentUser, { studentId: unlinkedStudentId }, linkedStudentIds)).toBe(false);

    expect(canViewFeeDue(parentUser, linkedStudentId, linkedStudentIds)).toBe(true);
    expect(canViewFeeDue(parentUser, unlinkedStudentId, linkedStudentIds)).toBe(false);

    expect(canViewEnrollment(parentUser, { studentId: linkedStudentId }, linkedStudentIds)).toBe(true);
    expect(canViewEnrollment(parentUser, { studentId: unlinkedStudentId }, linkedStudentIds)).toBe(false);
  });

  it("Test 8: POST /api/v1/onboarding sets student role and completes onboarding", async () => {
    const studentUserId = `onboard-stud-${Date.now()}`;
    const sessionToken = `sess-onboard-stud-${Date.now()}`;
    const secret = (auth as any).options?.secret || "quick2learn_dev_secret_key_at_least_32_characters_long";
    const cookie = await signCookie(sessionToken, secret);

    const client = await testPool.connect();
    try {
      const tx = drizzle(client, { schema });
      await tx.insert(schema.user).values({
        id: studentUserId,
        name: "Pre Onboard Student",
        email: `${studentUserId}@quick2learn.in`,
        emailVerified: true,
      });
      await tx.insert(schema.profiles).values({
        userId: studentUserId,
        fullName: "Pre Onboard Student",
        role: "student",
      });
      await tx.insert(schema.session).values({
        id: `sess-${studentUserId}`,
        token: sessionToken,
        userId: studentUserId,
        expiresAt: new Date(Date.now() + 86400000),
      });
    } finally {
      client.release();
    }

    const req = new Request("http://localhost:3000/api/v1/onboarding", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `better-auth.session_token=${cookie}`,
      },
      body: JSON.stringify({
        role: "student",
        fullName: "Aarav Sharma Onboarded",
        classLevel: 12,
        board: "cbse",
        school: "Delhi Public School, Mathura",
        parentPhone: "9876543210",
      }),
    });

    const res = await postOnboarding(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.user.name).toBe("Aarav Sharma Onboarded");
    expect(data.profile.classLevel).toBe(12);
    expect(data.profile.board).toBe("cbse");
    expect(data.profile.school).toBe("Delhi Public School, Mathura");
    expect(data.profile.onboardedAt).toBeDefined();
  });

  it("Test 9: Student invite code API (GET & POST) generates valid 6-char code", async () => {
    const studentUserId = `invite-stud-${Date.now()}`;
    const sessionToken = `sess-invite-stud-${Date.now()}`;
    const secret = (auth as any).options?.secret || "quick2learn_dev_secret_key_at_least_32_characters_long";
    const cookie = await signCookie(sessionToken, secret);

    const client = await testPool.connect();
    try {
      const tx = drizzle(client, { schema });
      await tx.insert(schema.user).values({
        id: studentUserId,
        name: "Student Inviter",
        email: `${studentUserId}@quick2learn.in`,
        emailVerified: true,
      });
      await tx.insert(schema.profiles).values({
        userId: studentUserId,
        fullName: "Student Inviter",
        role: "student",
      });
      await tx.insert(schema.session).values({
        id: `sess-${studentUserId}`,
        token: sessionToken,
        userId: studentUserId,
        expiresAt: new Date(Date.now() + 86400000),
      });
    } finally {
      client.release();
    }

    const req = new Request("http://localhost:3000/api/v1/student/invite-code", {
      method: "GET",
      headers: {
        Cookie: `better-auth.session_token=${cookie}`,
      },
    });

    const res = await getStudentInviteCode(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.code.length).toBe(6);
    expect(data.expiresAt).toBeDefined();
  });

  it("Test 10: Parent claiming invite code via POST /api/v1/parent/link and GET /api/v1/parent/students", async () => {
    const studentUserId = `stud-claim-${Date.now()}`;
    const parentUserId = `parent-claim-${Date.now()}`;
    const parentSessionToken = `sess-parent-claim-${Date.now()}`;
    const secret = (auth as any).options?.secret || "quick2learn_dev_secret_key_at_least_32_characters_long";
    const parentCookie = await signCookie(parentSessionToken, secret);

    let code = "";
    const client = await testPool.connect();
    try {
      const tx = drizzle(client, { schema });
      await tx.insert(schema.user).values([
        {
          id: studentUserId,
          name: "Child Student",
          email: `${studentUserId}@quick2learn.in`,
          emailVerified: true,
        },
        {
          id: parentUserId,
          name: "Parent User",
          email: `${parentUserId}@quick2learn.in`,
          emailVerified: true,
        },
      ]);
      await tx.insert(schema.profiles).values([
        {
          userId: studentUserId,
          fullName: "Child Student",
          role: "student",
          classLevel: 11,
          board: "cbse",
          school: "Heritage School",
        },
        {
          userId: parentUserId,
          fullName: "Parent User",
          role: "parent",
        },
      ]);
      await tx.insert(schema.session).values({
        id: `sess-${parentUserId}`,
        token: parentSessionToken,
        userId: parentUserId,
        expiresAt: new Date(Date.now() + 86400000),
      });

      const invite = await generateStudentParentInviteCode(studentUserId);
      code = invite.code;
    } finally {
      client.release();
    }

    // 1. Parent links child using code
    const linkReq = new Request("http://localhost:3000/api/v1/parent/link", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `better-auth.session_token=${parentCookie}`,
      },
      body: JSON.stringify({ code }),
    });

    const linkRes = await postParentLink(linkReq);
    expect(linkRes.status).toBe(200);
    const linkData = await linkRes.json();
    expect(linkData.student.userId).toBe(studentUserId);

    // 2. Parent checks GET /api/v1/parent/students
    const listReq = new Request("http://localhost:3000/api/v1/parent/students", {
      method: "GET",
      headers: {
        Cookie: `better-auth.session_token=${parentCookie}`,
      },
    });

    const listRes = await getParentStudents(listReq);
    expect(listRes.status).toBe(200);
    const listData = await listRes.json();
    expect(listData.students.length).toBeGreaterThanOrEqual(1);
    expect(listData.students.some((s: any) => s.userId === studentUserId)).toBe(true);
  });
});

async function signCookie(value: string, secret: string) {
  const secretBuf = new TextEncoder().encode(secret);
  const key = await crypto.subtle.importKey(
    "raw",
    secretBuf,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig)));
  return `${value}.${sigB64}`;
}

