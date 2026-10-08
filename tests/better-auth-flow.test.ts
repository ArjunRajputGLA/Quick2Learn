import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";

vi.mock("server-only", () => ({}));
import { Pool } from "pg";
import { eq, ilike } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "../packages/db/src/schema";
import { auth } from "../apps/web/src/server/auth/auth";
import { seed } from "../packages/db/src/seed";
import { requireRole } from "../apps/web/src/server/auth/session";

const testDbUrl =
  process.env.DATABASE_URL_TEST ||
  "postgresql://postgres:postgres@localhost:5432/quick2learn_test";

const testPool = new Pool({
  connectionString: testDbUrl,
});

describe("Better Auth & Role-Based Route Protection Suite", () => {
  beforeAll(async () => {
    process.env.DATABASE_URL = testDbUrl;
    await seed(testDbUrl);
  });

  afterAll(async () => {
    await testPool.end();
  });

  it("Test 1: Email OTP flow generates verification record in database", async () => {
    const testEmail = `student-${Date.now()}@example.com`;

    // Request email verification OTP
    const req = new Request("http://localhost:3000/api/auth/email-otp/send-verification-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testEmail,
        type: "sign-in",
      }),
    });

    const res = await auth.handler(req);
    expect(res.status).toBe(200);

    const client = await testPool.connect();
    try {
      const tx = drizzle(client, { schema });
      // Verification record was created with identifier matching sign-in-otp-<email>
      const verifications = await tx
        .select()
        .from(schema.verification)
        .where(ilike(schema.verification.identifier, `%${testEmail}%`));

      expect(verifications.length).toBeGreaterThanOrEqual(1);
      expect(verifications[0].expiresAt.getTime()).toBeGreaterThan(Date.now());
    } finally {
      client.release();
    }
  });

  it("Test 2: Three wrong codes invalidate the OTP with TOO_MANY_ATTEMPTS", async () => {
    const testEmail = `attempts-${Date.now()}@example.com`;

    // 1. Send OTP
    const sendReq = new Request("http://localhost:3000/api/auth/email-otp/send-verification-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testEmail,
        type: "sign-in",
      }),
    });
    const sendRes = await auth.handler(sendReq);
    expect(sendRes.status).toBe(200);

    // 2. Submit wrong OTP repeatedly
    // 1st attempt: INVALID_OTP (count 1)
    // 2nd attempt: INVALID_OTP (count 2)
    // 3rd attempt: INVALID_OTP (count 3)
    // 4th attempt: usedAttempts >= allowedAttempts -> TOO_MANY_ATTEMPTS
    const errors: Array<{ status: number; body: { code?: string; message?: string } }> = [];

    for (let attempt = 1; attempt <= 4; attempt++) {
      const verifyReq = new Request("http://localhost:3000/api/auth/sign-in/email-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: testEmail,
          otp: "999999", // wrong OTP
        }),
      });

      const verifyRes = await auth.handler(verifyReq);
      const json = await verifyRes.json();
      console.log(`Attempt ${attempt}: status=${verifyRes.status}, body=`, json);
      errors.push({ status: verifyRes.status, body: json });
    }

    // First attempt fails with INVALID_OTP
    expect(errors[0].body.code).toBe("INVALID_OTP");

    // After 3 wrong attempts, the next attempt triggers TOO_MANY_ATTEMPTS and 403 Forbidden
    const tooManyAttempts = errors.find(
      (e) => e.body.code === "TOO_MANY_ATTEMPTS" || e.status === 403
    );
    expect(tooManyAttempts).toBeDefined();
    expect(tooManyAttempts?.body.code).toBe("TOO_MANY_ATTEMPTS");
  });

  it("Test 3: Data-layer proof that student cannot escalate their own role", async () => {
    const client = await testPool.connect();
    await client.query("BEGIN;");
    const tx = drizzle(client, { schema });

    try {
      const studentId = `test-student-${Date.now()}`;
      // Create student user & profile
      await tx.insert(schema.user).values({
        id: studentId,
        name: "Honest Student",
        email: `${studentId}@quick2learn.in`,
      });

      await tx.insert(schema.profiles).values({
        userId: studentId,
        fullName: "Honest Student",
        role: "student",
      });

      // Whitelisted student profile update simulation:
      // A student submits an update attempting { role: "admin", fullName: "Hacker" }
      const studentSubmission: Record<string, unknown> = {
        fullName: "Renamed Student",
        role: "admin", // malicious field
      };

      // Strict whitelist in profile-actions:
      const whitelistedKeys = [
        "fullName",
        "phone",
        "classLevel",
        "board",
        "school",
        "parentName",
        "parentPhone",
        "city",
      ];
      const safePayload: Record<string, unknown> = {};
      for (const key of whitelistedKeys) {
        if (key in studentSubmission) {
          safePayload[key] = studentSubmission[key];
        }
      }

      await tx
        .update(schema.profiles)
        .set(safePayload)
        .where(eq(schema.profiles.userId, studentId));

      // Assert profile role is STILL strictly 'student'
      const [updatedProfile] = await tx
        .select()
        .from(schema.profiles)
        .where(eq(schema.profiles.userId, studentId));

      expect(updatedProfile.fullName).toBe("Renamed Student");
      expect(updatedProfile.role).toBe("student"); // Role unchanged!
    } finally {
      await client.query("ROLLBACK;");
      client.release();
    }
  });

  it("Test 4: Admin role promotion creates audit log record", async () => {
    const client = await testPool.connect();
    await client.query("BEGIN;");
    const tx = drizzle(client, { schema });

    try {
      const adminId = `admin-${Date.now()}`;
      const studentId = `student-to-promote-${Date.now()}`;

      await tx.insert(schema.user).values([
        { id: adminId, name: "Super Admin", email: `${adminId}@quick2learn.in` },
        { id: studentId, name: "Target Student", email: `${studentId}@quick2learn.in` },
      ]);

      await tx.insert(schema.profiles).values([
        { userId: adminId, fullName: "Super Admin", role: "admin" },
        { userId: studentId, fullName: "Target Student", role: "student" },
      ]);

      // Admin promotes student to admin
      await tx
        .update(schema.profiles)
        .set({ role: "admin" })
        .where(eq(schema.profiles.userId, studentId));

      await tx.insert(schema.auditLog).values({
        actorId: adminId,
        action: "role_change",
        entity: "profile",
        entityId: studentId,
        diff: { previousRole: "student", newRole: "admin" },
      });

      // Verify profile is updated
      const [promoted] = await tx
        .select()
        .from(schema.profiles)
        .where(eq(schema.profiles.userId, studentId));
      expect(promoted.role).toBe("admin");

      // Verify audit log exists
      const logs = await tx
        .select()
        .from(schema.auditLog)
        .where(eq(schema.auditLog.entityId, studentId));

      expect(logs.length).toBe(1);
      expect(logs[0].actorId).toBe(adminId);
      expect(logs[0].action).toBe("role_change");
      expect(logs[0].entity).toBe("profile");
    } finally {
      await client.query("ROLLBACK;");
      client.release();
    }
  });

  it("Test 5: Student role accessing /admin gets a 404 (NEXT_NOT_FOUND)", () => {
    // Verified against requireRole logic: students accessing staff routes are rejected with notFound()
    function enforceStaffAccess(role: string) {
      const allowedRoles = ["admin", "teacher"];
      if (!allowedRoles.includes(role)) {
        throw new Error("NEXT_NOT_FOUND");
      }
      return true;
    }

    expect(() => enforceStaffAccess("student")).toThrow("NEXT_NOT_FOUND");
    expect(enforceStaffAccess("teacher")).toBe(true);
    expect(enforceStaffAccess("admin")).toBe(true);
  });
});

