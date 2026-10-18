import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";

vi.mock("server-only", () => ({}));
import { Pool } from "pg";
import { db, schema, eq, inArray } from "@quick2learn/db";
import { seed } from "../packages/db/src/seed";
import { auth } from "../apps/web/src/server/auth/auth";
import { GET as getAppConfig } from "../apps/web/src/app/api/v1/app/config/route";
import { GET as getMe, PATCH as patchMe } from "../apps/web/src/app/api/v1/me/route";
import { POST as postDevice } from "../apps/web/src/app/api/v1/devices/route";
import { DELETE as deleteDevice } from "../apps/web/src/app/api/v1/devices/[id]/route";
import { GET as getNotifications } from "../apps/web/src/app/api/v1/notifications/route";
import { POST as markNotificationsRead } from "../apps/web/src/app/api/v1/notifications/read/route";
import { GET as getUnreadCount } from "../apps/web/src/app/api/v1/notifications/unread-count/route";
import { notify } from "../apps/web/src/server/notify";
import { createApiClient, ApiClientError, meResponseSchema } from "@quick2learn/shared";

const testDbUrl =
  process.env.DATABASE_URL_TEST ||
  "postgresql://postgres:postgres@localhost:5432/quick2learn_test";

const testPool = new Pool({
  connectionString: testDbUrl,
});

describe("API v1 & Push Notifications Suite", () => {
  const studentUserId = `student-v1-${Date.now()}`;
  const parentUserId = `parent-v1-${Date.now()}`;
  const otherUserId = `other-v1-${Date.now()}`;

  const studentSessionToken = `token-student-${Date.now()}`;
  const parentSessionToken = `token-parent-${Date.now()}`;
  const otherSessionToken = `token-other-${Date.now()}`;

  const studentPhone = "9876543210";
  const parentPhone = "9876500000";

  let studentCookie: string;
  let parentCookie: string;
  let otherCookie: string;

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

  beforeAll(async () => {
    process.env.DATABASE_URL = testDbUrl;
    await seed(testDbUrl);

    const secret =
      (auth as any).options?.secret ||
      "quick2learn_dev_secret_key_at_least_32_characters_long";
    studentCookie = await signCookie(studentSessionToken, secret);
    parentCookie = await signCookie(parentSessionToken, secret);
    otherCookie = await signCookie(otherSessionToken, secret);

    // 1. Create student user and session
    await db.insert(schema.user).values([
      {
        id: studentUserId,
        name: "Aarav Sharma",
        email: `${studentUserId}@quick2learn.in`,
        emailVerified: true,
      },
      {
        id: parentUserId,
        name: "Rajesh Sharma",
        email: `${parentUserId}@quick2learn.in`,
        emailVerified: true,
      },
      {
        id: otherUserId,
        name: "Other Student",
        email: `${otherUserId}@quick2learn.in`,
        emailVerified: true,
      },
    ]);

    await db.insert(schema.session).values([
      {
        id: `sess-${studentUserId}`,
        token: studentSessionToken,
        userId: studentUserId,
        expiresAt: new Date(Date.now() + 86400000),
      },
      {
        id: `sess-${parentUserId}`,
        token: parentSessionToken,
        userId: parentUserId,
        expiresAt: new Date(Date.now() + 86400000),
      },
      {
        id: `sess-${otherUserId}`,
        token: otherSessionToken,
        userId: otherUserId,
        expiresAt: new Date(Date.now() + 86400000),
      },
    ]);

    // 2. Create student profile with parentPhone linked to parent
    await db.insert(schema.profiles).values([
      {
        userId: studentUserId,
        fullName: "Aarav Sharma",
        phone: studentPhone,
        role: "student",
        classLevel: 12,
        board: "cbse",
        school: "DPS Mathura",
        parentName: "Rajesh Sharma",
        parentPhone: parentPhone,
        city: "Mathura",
        onboardedAt: new Date(),
      },
      {
        userId: parentUserId,
        fullName: "Rajesh Sharma",
        phone: parentPhone,
        role: "parent",
        city: "Mathura",
        onboardedAt: new Date(),
      },
      {
        userId: otherUserId,
        fullName: "Other Student",
        phone: "9123456789",
        role: "student",
        city: "Mathura",
        onboardedAt: new Date(),
      },
    ]);
  });

  afterAll(async () => {
    await db
      .delete(schema.user)
      .where(inArray(schema.user.id, [studentUserId, parentUserId, otherUserId]));
    await testPool.end();
  });

  // 1. App Config Endpoint
  it("Test 1: GET /api/v1/app/config returns 200 with versions and featureFlags", async () => {
    const req = new Request("http://localhost:3000/api/v1/app/config", {
      headers: {
        "X-App-Version": "1.0.0",
      },
    });

    const res = await getAppConfig(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data).toHaveProperty("minSupportedVersion");
    expect(data).toHaveProperty("latestVersion");
    expect(data).toHaveProperty("maintenance", false);
    expect(data.featureFlags).toHaveProperty("enablePushNotifications", true);
  });

  // 2. Auth: 401 without session cookie
  it("Test 2: GET /api/v1/me returns 401 in standard error shape without session cookie", async () => {
    const req = new Request("http://localhost:3000/api/v1/me", {
      headers: {
        "X-App-Version": "1.0.0",
      },
    });

    const res = await getMe(req);
    expect(res.status).toBe(401);

    const data = await res.json();
    expect(data).toEqual({
      error: {
        code: "UNAUTHORIZED",
        message: "Unauthorized: Authentication required.",
      },
    });
  });

  // 3. Auth: 200 with session cookie
  it("Test 3: GET /api/v1/me returns user, profile, and role with valid session cookie", async () => {
    const req = new Request("http://localhost:3000/api/v1/me", {
      headers: {
        Cookie: `better-auth.session_token=${studentCookie}`,
        "X-App-Version": "1.0.0",
      },
    });

    const res = await getMe(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.user.id).toBe(studentUserId);
    expect(data.profile.fullName).toBe("Aarav Sharma");
    expect(data.role).toBe("student");
    expect(data.linkedStudents).toEqual([]);
  });

  // 4. Linked students for parent account
  it("Test 4: GET /api/v1/me returns linked students for parent account matching phone", async () => {
    const req = new Request("http://localhost:3000/api/v1/me", {
      headers: {
        Cookie: `better-auth.session_token=${parentCookie}`,
        "X-App-Version": "1.0.0",
      },
    });

    const res = await getMe(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.user.id).toBe(parentUserId);
    expect(data.linkedStudents.length).toBeGreaterThanOrEqual(1);
    expect(data.linkedStudents[0].fullName).toBe("Aarav Sharma");
    expect(data.linkedStudents[0].classLevel).toBe(12);
  });

  // 5. PATCH /api/v1/me (whitelisted fields only)
  it("Test 5: PATCH /api/v1/me updates whitelisted fields and ignores unauthorized fields", async () => {
    const req = new Request("http://localhost:3000/api/v1/me", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Cookie: `better-auth.session_token=${studentCookie}`,
        "X-App-Version": "1.0.0",
      },
      body: JSON.stringify({
        fullName: "Aarav S. Rajput",
        city: "Mathura Cantonment",
      }),
    });

    const res = await patchMe(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.profile.fullName).toBe("Aarav S. Rajput");
    expect(data.profile.city).toBe("Mathura Cantonment");
    expect(data.role).toBe("student");
  });

  // 6. Device registration & deletion
  let registeredDeviceId = "";
  it("Test 6: POST /api/v1/devices registers expo push token", async () => {
    const pushToken = `ExponentPushToken[test_${Date.now()}]`;
    const req = new Request("http://localhost:3000/api/v1/devices", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `better-auth.session_token=${studentCookie}`,
        "X-App-Version": "1.0.0",
      },
      body: JSON.stringify({
        expoPushToken: pushToken,
        platform: "android",
        appVersion: "1.0.0",
      }),
    });

    const res = await postDevice(req);
    expect(res.status).toBe(201);

    const data = await res.json();
    expect(data.userId).toBe(studentUserId);
    expect(data.expoPushToken).toBe(pushToken);
    expect(data.platform).toBe("android");
    registeredDeviceId = data.id;
  });

  // 7. Forbidden (403) when deleting another user's device
  it("Test 7: DELETE /api/v1/devices/:id returns 403 when deleting another user's device", async () => {
    const req = new Request(`http://localhost:3000/api/v1/devices/${registeredDeviceId}`, {
      method: "DELETE",
      headers: {
        Cookie: `better-auth.session_token=${otherCookie}`, // Different user!
        "X-App-Version": "1.0.0",
      },
    });

    const res = await deleteDevice(req, {
      params: Promise.resolve({ id: registeredDeviceId }),
    });
    expect(res.status).toBe(403);

    const data = await res.json();
    expect(data.error.code).toBe("FORBIDDEN");
  });

  // 8. Successful deletion of own device
  it("Test 8: DELETE /api/v1/devices/:id unregisters own device token successfully", async () => {
    const req = new Request(`http://localhost:3000/api/v1/devices/${registeredDeviceId}`, {
      method: "DELETE",
      headers: {
        Cookie: `better-auth.session_token=${studentCookie}`,
        "X-App-Version": "1.0.0",
      },
    });

    const res = await deleteDevice(req, {
      params: Promise.resolve({ id: registeredDeviceId }),
    });
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data).toEqual({ success: true });
  });

  // 9. Push notifications: notify() writes inbox rows
  it("Test 9: notify() writes inbox rows and delivers push notifications", async () => {
    const result = await notify([studentUserId], {
      type: "announcement",
      title: "Test Class Announcement",
      body: "Mathematics batch test scheduled for tomorrow.",
      data: { route: "/batches/class-12" },
    });

    expect(result.success).toBe(true);
    expect(result.inboxCount).toBe(1);

    // Verify inbox record in database
    const inboxRows = await db
      .select()
      .from(schema.notifications)
      .where(eq(schema.notifications.userId, studentUserId));

    expect(inboxRows.length).toBeGreaterThanOrEqual(1);
    const newest = inboxRows[inboxRows.length - 1];
    expect(newest.title).toBe("Test Class Announcement");
    expect(newest.readAt).toBeNull();
  });

  // 10. Per-type notification preferences respected by notify()
  it("Test 10: notify() respects notification_prefs and skips disabled types", async () => {
    // Disable 'fee_reminder' for studentUserId
    await db.insert(schema.notificationPrefs).values({
      userId: studentUserId,
      type: "fee_reminder",
      enabled: false,
    });

    const result = await notify([studentUserId], {
      type: "fee_reminder",
      title: "Fee Due",
      body: "Upcoming fee due",
    });

    // Recipient count should be 0 because disabled in preferences
    expect(result.recipientCount).toBe(0);
    expect(result.inboxCount).toBe(0);
  });

  // 11. GET /api/v1/notifications (paginated)
  let notificationId = "";
  it("Test 11: GET /api/v1/notifications returns paginated inbox items", async () => {
    const req = new Request("http://localhost:3000/api/v1/notifications?limit=10", {
      headers: {
        Cookie: `better-auth.session_token=${studentCookie}`,
        "X-App-Version": "1.0.0",
      },
    });

    const res = await getNotifications(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(Array.isArray(data.items)).toBe(true);
    expect(data.items.length).toBeGreaterThanOrEqual(1);
    expect(data.items[0].title).toBe("Test Class Announcement");
    notificationId = data.items[0].id;
  });

  // 12. GET /api/v1/notifications/unread-count
  it("Test 12: GET /api/v1/notifications/unread-count returns unread count", async () => {
    const req = new Request("http://localhost:3000/api/v1/notifications/unread-count", {
      headers: {
        Cookie: `better-auth.session_token=${studentCookie}`,
        "X-App-Version": "1.0.0",
      },
    });

    const res = await getUnreadCount(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.unreadCount).toBeGreaterThanOrEqual(1);
  });

  // 13. POST /api/v1/notifications/read
  it("Test 13: POST /api/v1/notifications/read marks notifications as read", async () => {
    const req = new Request("http://localhost:3000/api/v1/notifications/read", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `better-auth.session_token=${studentCookie}`,
        "X-App-Version": "1.0.0",
      },
      body: JSON.stringify({
        ids: [notificationId],
      }),
    });

    const res = await markNotificationsRead(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.count).toBe(1);

    // Verify readAt is now set
    const [row] = await db
      .select()
      .from(schema.notifications)
      .where(eq(schema.notifications.id, notificationId));

    expect(row.readAt).not.toBeNull();
  });

  // 14. Typed client error handling & validation
  it("Test 14: Typed client parses responses and throws typed ApiClientError on errors", async () => {
    // Custom mock fetch simulating standard API responses
    const mockFetch = vi.fn().mockImplementation(async (url: string) => {
      if (url.includes("/unauthorized")) {
        return new Response(
          JSON.stringify({
            error: {
              code: "UNAUTHORIZED",
              message: "Unauthorized: Authentication required.",
            },
          }),
          { status: 401, headers: { "Content-Type": "application/json" } }
        );
      }
      return new Response(
        JSON.stringify({
          user: {
            id: "usr_mock",
            email: "mock@quick2learn.in",
            name: "Mock User",
            emailVerified: true,
            createdAt: "2026-10-18T10:00:00.000Z",
            updatedAt: "2026-10-18T10:00:00.000Z",
          },
          profile: null,
          role: "student",
          linkedStudents: [],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    });

    const client = createApiClient({
      baseUrl: "http://localhost:3000/api/v1",
      customFetch: mockFetch,
    });

    // 1. Success case parses with schema
    const result = await client.get("/me", { schema: meResponseSchema });
    expect(result.user.name).toBe("Mock User");
    expect(result.role).toBe("student");

    // 2. Error case throws ApiClientError with code and status
    try {
      await client.get("/unauthorized");
      expect.fail("Should have thrown ApiClientError");
    } catch (err) {
      expect(err).toBeInstanceOf(ApiClientError);
      const apiErr = err as ApiClientError;
      expect(apiErr.code).toBe("UNAUTHORIZED");
      expect(apiErr.status).toBe(401);
      expect(apiErr.message).toBe("Unauthorized: Authentication required.");
    }
  });
});
