import { describe, it, expect, beforeAll, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { getHomeData } from "../apps/web/src/server/data/home";
import { homeResponseSchema } from "@quick2learn/shared";
import { GET as getAssetlinks } from "../apps/web/src/app/.well-known/assetlinks.json/route";
import { db, schema, eq } from "@quick2learn/db";

describe("Home Screen API & AssetLinks Deep Links Suite", () => {
  let testUser: { id: string; email: string; name: string };

  beforeAll(async () => {
    // Look up or create a test student user
    let [existing] = await db
      .select()
      .from(schema.user)
      .where(eq(schema.user.email, "student@quick2learn.com"))
      .limit(1);

    if (!existing) {
      const [created] = await db
        .insert(schema.user)
        .values({
          id: `student-home-${Date.now()}`,
          name: "Aryan Sharma",
          email: "student@quick2learn.com",
          emailVerified: true,
          role: "student",
        })
        .returning();
      existing = created;

      await db
        .insert(schema.profiles)
        .values({
          userId: existing.id,
          fullName: "Aryan Sharma",
          classLevel: 10,
          board: "cbse",
          school: "DPS Mathura",
          onboardedAt: new Date(),
        })
        .onConflictDoNothing();
    }

    testUser = {
      id: existing.id,
      email: existing.email,
      name: existing.name || "Aryan",
    };
  });

  it("Test 1: getHomeData aggregates all screen data into a single verified response", async () => {
    const data = await getHomeData(testUser);

    // Validate with zod schema
    const parsed = homeResponseSchema.safeParse(data);
    expect(parsed.success).toBe(true);

    if (parsed.success) {
      expect(parsed.data.header.firstName).toBeDefined();
      expect(parsed.data.header.unreadNotificationsCount).toBeGreaterThanOrEqual(0);

      // Verify shareApp metadata
      expect(parsed.data.shareApp.title).toContain("Quick2Learn");
      expect(parsed.data.shareApp.url).toContain("quick2learn");

      // Verify banners contain valid routes and images
      expect(parsed.data.banners.length).toBeGreaterThan(0);
      expect(parsed.data.banners[0]!.title).toBeDefined();
      expect(parsed.data.banners[0]!.imageUrl).toBeDefined();

      // Free lectures list returns class-relevant lectures
      expect(Array.isArray(parsed.data.freeLectures)).toBe(true);
    }
  });

  it("Test 2: Assetlinks endpoint returns valid Android App Links schema", async () => {
    const res = await getAssetlinks();
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThanOrEqual(1);

    const item = data[0];
    expect(item.relation).toContain("delegate_permission/common.handle_all_urls");
    expect(item.target.namespace).toBe("android_app");
    expect(item.target.package_name).toBe("in.quick2learn.app");
    expect(Array.isArray(item.target.sha256_cert_fingerprints)).toBe(true);
    expect(item.target.sha256_cert_fingerprints.length).toBeGreaterThanOrEqual(1);
    expect(item.target.sha256_cert_fingerprints[0]).toMatch(/^([0-9A-Fa-f]{2}:){31}[0-9A-Fa-f]{2}$/);
  });
});
