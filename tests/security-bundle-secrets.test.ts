import { describe, it, expect, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { readFileSync, readdirSync, statSync, existsSync } from "fs";
import { join } from "path";
import { scrubData, scrubString, beforeSendScrubber } from "../apps/web/src/lib/sentry-scrubber";

describe("Security Hardening & Client Bundle Secret Scanning Suite", () => {
  // 1. CLIENT BUNDLE SECRET SCANNING
  it("Test 1: Confirms zero sensitive secrets appear in the Next.js client bundle (.next/static)", () => {
    const staticDir = join(__dirname, "../apps/web/.next/static");

    // Only run if build artifacts exist
    if (!existsSync(staticDir)) {
      console.warn("Client bundle directory not found. Skipping static asset scan.");
      return;
    }

    const getAllFiles = (dir: string): string[] => {
      let results: string[] = [];
      const list = readdirSync(dir);
      for (const file of list) {
        const fullPath = join(dir, file);
        const stat = statSync(fullPath);
        if (stat && stat.isDirectory()) {
          results = results.concat(getAllFiles(fullPath));
        } else if (file.endsWith(".js") || file.endsWith(".css")) {
          results.push(fullPath);
        }
      }
      return results;
    };

    const clientFiles = getAllFiles(staticDir);
    expect(clientFiles.length).toBeGreaterThan(0);

    // List of sensitive variable values to check against
    const sensitiveValues = [
      process.env.BETTER_AUTH_SECRET,
      process.env.RAZORPAY_KEY_SECRET,
      process.env.RAZORPAY_WEBHOOK_SECRET,
      process.env.DATABASE_URL,
      process.env.DATABASE_URL_DIRECT,
      process.env.MINIO_SECRET_KEY,
      "test_rzp_secret_987654321",
      "postgres:postgres@localhost:5432",
    ].filter((v): v is string => typeof v === "string" && v.length >= 8);

    for (const filePath of clientFiles) {
      const content = readFileSync(filePath, "utf-8");

      for (const secret of sensitiveValues) {
        const hasSecret = content.includes(secret);
        if (hasSecret) {
          throw new Error(
            `SECURITY VIOLATION: Secret leaked into client bundle file: ${filePath}`,
          );
        }
        expect(hasSecret).toBe(false);
      }
    }
  });

  // 2. SENTRY DATA SCRUBBING
  it("Test 2: Sentry scrubber strips emails and Indian mobile numbers from strings and nested objects", () => {
    const rawText = "User rahul.verma@example.com called from +919876543210 about payment";
    const scrubbed = scrubString(rawText);

    expect(scrubbed).not.toContain("rahul.verma@example.com");
    expect(scrubbed).not.toContain("9876543210");
    expect(scrubbed).toContain("[EMAIL_REDACTED]");
    expect(scrubbed).toContain("[PHONE_REDACTED]");

    const rawPayload = {
      name: "Rahul Verma",
      phone: "9876543210",
      password: "SuperSecretPassword123",
      email: "rahul@example.com",
      nested: {
        otp: "123456",
        signature: "sig_deadbeef",
        note: "Contact phone is 9412280000",
      },
    };

    const scrubbedObj = scrubData(rawPayload) as any;
    expect(scrubbedObj.name).toBe("Rahul Verma");
    expect(scrubbedObj.phone).toBe("[REDACTED]");
    expect(scrubbedObj.password).toBe("[REDACTED]");
    expect(scrubbedObj.email).toBe("[REDACTED]");
    expect(scrubbedObj.nested.otp).toBe("[REDACTED]");
    expect(scrubbedObj.nested.signature).toBe("[REDACTED]");
    expect(scrubbedObj.nested.note).toContain("[PHONE_REDACTED]");
  });

  // 3. SENTRY beforeSend HOOK
  it("Test 3: Sentry beforeSendScrubber sanitizes user IP, email, headers, and request payload", () => {
    const mockEvent = {
      user: {
        id: "usr_123",
        ip_address: "103.21.244.2",
        email: "student@quick2learn.in",
        username: "student",
      },
      request: {
        headers: {
          authorization: "Bearer secret-token-xyz",
          cookie: "better-auth.session_token=secret_cookie_val",
          "x-razorpay-signature": "razorpay_sig_123",
          "content-type": "application/json",
        },
        data: {
          phone: "9876543210",
          amount: 1500000,
        },
      },
      message: "Order creation failed for 9876543210 with error",
    };

    const sanitized = beforeSendScrubber(mockEvent as any);

    expect(sanitized.user?.ip_address).toBe("[REDACTED]");
    expect(sanitized.user?.email).toBe("[REDACTED]");
    expect(sanitized.request?.headers?.authorization).toBe("[REDACTED]");
    expect(sanitized.request?.headers?.cookie).toBe("[REDACTED]");
    expect(sanitized.request?.headers?.["x-razorpay-signature"]).toBe("[REDACTED]");
    expect(sanitized.request?.headers?.["content-type"]).toBe("application/json");
    expect((sanitized.request?.data as any)?.phone).toBe("[REDACTED]");
    expect(sanitized.message).toContain("[PHONE_REDACTED]");
  });

  // 4. SECURITY HEADERS & CSP
  it("Test 4: next.config.ts configures Content-Security-Policy with strict origins", () => {
    const configPath = join(__dirname, "../apps/web/next.config.ts");
    const content = readFileSync(configPath, "utf-8");

    expect(content).toContain("Content-Security-Policy");
    expect(content).toContain("youtube-nocookie.com");
    expect(content).toContain("i.ytimg.com");
    expect(content).toContain("checkout.razorpay.com");
    expect(content).toContain("api.razorpay.com");
    expect(content).toContain("maps.google.com");
    expect(content).toContain("X-Frame-Options");
    expect(content).toContain("DENY");
    expect(content).toContain("X-Content-Type-Options");
    expect(content).toContain("nosniff");
  });
});
