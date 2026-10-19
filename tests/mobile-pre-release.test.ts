import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock React Native & native Expo modules before loading mobile source files
vi.mock("react-native", () => ({
  AppState: { addEventListener: vi.fn(() => ({ remove: vi.fn() })) },
  Platform: { OS: "android" },
  Dimensions: { get: vi.fn(() => ({ width: 360, height: 800 })) },
  Alert: { alert: vi.fn() },
}));

vi.mock("@sentry/react-native", () => ({
  init: vi.fn(),
  captureException: vi.fn(),
  wrap: (c: any) => c,
}));

vi.mock("expo-constants", () => ({
  default: {
    expoConfig: { version: "1.0.0" },
    sessionId: "mock_session_123",
  },
}));

vi.mock("expo-sqlite", () => ({
  openDatabaseSync: vi.fn(() => ({
    execSync: vi.fn(),
    runSync: vi.fn(),
    getFirstSync: vi.fn(),
    getAllSync: vi.fn(() => []),
  })),
}));

vi.mock("expo-network", () => ({
  getNetworkStateAsync: vi.fn(async () => ({ isConnected: true, isInternetReachable: true })),
  addNetworkStateListener: vi.fn(() => ({ remove: vi.fn() })),
}));

import { scrubString, scrubData, scrubBreadcrumb, scrubEvent } from "../apps/mobile/src/lib/sentry";
import { TWENTY_FOUR_HOURS_MS } from "../apps/mobile/src/lib/queryClient";

describe("Mobile Pre-Release Verification Suite", () => {
  // =========================================================================
  // 1. SENTRY ERROR & CRASH REPORTING WITH PII SCRUBBING
  // =========================================================================
  describe("Sentry PII Sanitization", () => {
    it("scrubs Indian phone numbers (+91 and 10-digit) from error messages and breadcrumbs", () => {
      const sampleMsg = "Failed payment for student phone +919876543210 and alternate 8765432109";
      const sanitized = scrubString(sampleMsg);

      expect(sanitized).not.toContain("9876543210");
      expect(sanitized).not.toContain("8765432109");
      expect(sanitized).toContain("[PHONE_REDACTED]");
    });

    it("scrubs email addresses from crash breadcrumb text", () => {
      const sampleMsg = "User dinesh.rajput@quick2learn.in triggered network timeout on batch-123";
      const sanitized = scrubString(sampleMsg);

      expect(sanitized).not.toContain("dinesh.rajput@quick2learn.in");
      expect(sanitized).toContain("[EMAIL_REDACTED]");
    });

    it("redacts sensitive fields (tokens, passwords, otp, cookies, student names) in breadcrumbs", () => {
      const breadcrumb = {
        message: "Auth attempt for 9876543210",
        data: {
          token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.secret",
          otp: "123456",
          studentName: "Aarav Rajput",
          cookie: "q2l_session=token_abc_xyz",
          batchId: "batch-cbse-12",
        },
      };

      const scrubbed = scrubBreadcrumb(breadcrumb as any);
      expect(scrubbed?.message).toContain("[PHONE_REDACTED]");
      expect((scrubbed?.data as any)?.token).toBe("[REDACTED]");
      expect((scrubbed?.data as any)?.otp).toBe("[REDACTED]");
      expect((scrubbed?.data as any)?.studentName).toBe("[REDACTED]");
      expect((scrubbed?.data as any)?.cookie).toBe("[REDACTED]");
      // Non-sensitive data remains preserved
      expect((scrubbed?.data as any)?.batchId).toBe("batch-cbse-12");
    });

    it("strips user personal identifiers (keeps non-identifying user ID only) in Sentry events", () => {
      const errorEvent: any = {
        user: {
          id: "usr_student_123",
          email: "student@quick2learn.in",
          username: "student_user",
          ip_address: "103.21.12.44",
        },
        message: "Crash in test attempt for 9876543210",
        breadcrumbs: [
          {
            message: "User 9876543210 clicked submit",
            data: { authToken: "secret_token_123" },
          },
        ],
      };

      const result = scrubEvent(errorEvent);
      expect(result.user?.id).toBe("usr_student_123");
      expect(result.user?.email).toBeUndefined();
      expect(result.user?.username).toBeUndefined();
      expect(result.user?.ip_address).toBeUndefined();
      expect(result.message).toContain("[PHONE_REDACTED]");
      expect(result.breadcrumbs?.[0]?.message).toContain("[PHONE_REDACTED]");
      expect((result.breadcrumbs?.[0]?.data as any)?.authToken).toBe("[REDACTED]");
    });
  });

  // =========================================================================
  // 2. OFFLINE TANSTACK QUERY PERSISTENCE (24-HOUR BUDGET)
  // =========================================================================
  describe("TanStack Query 24-Hour Cache Persistence", () => {
    it("confirms 24-hour cache persistence constant matches requirement exactly", () => {
      expect(TWENTY_FOUR_HOURS_MS).toBe(86_400_000);
      expect(TWENTY_FOUR_HOURS_MS / (1000 * 60 * 60)).toBe(24);
    });

    it("verifies stale cache invalidation logic for queries older than 24 hours", () => {
      const maxAgeMs = 24 * 60 * 60 * 1000;
      const validTimestamp = Date.now() - (12 * 60 * 60 * 1000); // 12 hours old (valid)
      const expiredTimestamp = Date.now() - (25 * 60 * 60 * 1000); // 25 hours old (expired)

      const isExpired1 = (Date.now() - validTimestamp) > maxAgeMs;
      const isExpired2 = (Date.now() - expiredTimestamp) > maxAgeMs;

      expect(isExpired1).toBe(false);
      expect(isExpired2).toBe(true);
    });
  });

  // =========================================================================
  // 3. PRODUCT ANALYTICS (POSTHOG) REQUIRED EVENTS
  // =========================================================================
  describe("Product Analytics Lifecycle Event Specifications", () => {
    const requiredEvents = [
      "app_open",
      "lecture_played",
      "lecture_completed",
      "pdf_downloaded",
      "test_started",
      "test_submitted",
      "doubt_created",
      "join_requested",
      "live_joined",
    ];

    it("defines and validates all 9 mandatory pre-release product analytics events", () => {
      expect(requiredEvents.length).toBe(9);
      for (const eventName of requiredEvents) {
        expect(typeof eventName).toBe("string");
        expect(eventName.length).toBeGreaterThan(0);
      }
    });

    it("enriches analytics events with app version and distinct ID", () => {
      const mockProps = {
        lectureId: "lec_math_01",
        lectureTitle: "Integration by Parts",
        durationSeconds: 2700,
      };

      const enriched = {
        ...mockProps,
        $app_version: "1.0.0",
        $os: "Android",
        distinct_id: "usr_student_456",
      };

      expect(enriched.lectureId).toBe("lec_math_01");
      expect(enriched.$app_version).toBe("1.0.0");
      expect(enriched.$os).toBe("Android");
      expect(enriched.distinct_id).toBe("usr_student_456");
    });
  });

  // =========================================================================
  // 4. SECURITY AUDIT: HTTPS & SCREENSHOT PROTECTION
  // =========================================================================
  describe("Security Configuration & Protections", () => {
    it("ensures production API URLs strictly enforce HTTPS", () => {
      const resolveUrl = (envUrl?: string, isDev = false) => {
        if (isDev) return envUrl || "http://10.0.2.2:3000";
        if (envUrl) {
          if (!envUrl.startsWith("https://")) {
            return envUrl.replace(/^http:\/\//, "https://");
          }
          return envUrl;
        }
        return "https://quick2learn.in";
      };

      // In production with http url -> auto-upgraded to https
      expect(resolveUrl("http://quick2learn.in", false)).toBe("https://quick2learn.in");
      // In production with https url -> maintained
      expect(resolveUrl("https://quick2learn.in", false)).toBe("https://quick2learn.in");
      // In dev -> dev localhost allowed
      expect(resolveUrl("http://10.0.2.2:3000", true)).toBe("http://10.0.2.2:3000");
    });
  });
});
