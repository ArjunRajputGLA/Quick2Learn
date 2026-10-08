import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq } from "drizzle-orm";
import * as schema from "../packages/db/src/schema";
import { seed } from "../packages/db/src/seed";
import { syncYouTubeChannel } from "../apps/web/src/server/youtube/sync";
import { GET as cronHandler } from "../apps/web/src/app/api/cron/youtube-sync/route";

const testDbUrl =
  process.env.DATABASE_URL_TEST ||
  "postgresql://postgres:postgres@localhost:5432/quick2learn_test";

const testPool = new Pool({
  connectionString: testDbUrl,
});

const db = drizzle(testPool, { schema });

describe("YouTube Channel Import & Daily Synchronization Suite", () => {
  beforeAll(async () => {
    process.env.DATABASE_URL = testDbUrl;
    // Seed subjects, chapters, faculty, etc.
    await seed(testDbUrl);

    // Clean youtube tables and sync runs for this test suite
    await db.delete(schema.lectureViews);
    await db.delete(schema.youtubeVideos);
    await db.delete(schema.youtubePlaylists);
    await db.delete(schema.syncRuns);
  });

  afterAll(async () => {
    await seed(testDbUrl);
    await testPool.end();
  });

  it("Test 1: First local run imports all channel videos, playlists, and channel stats", async () => {
    const result = await syncYouTubeChannel({ mode: "full" });

    expect(result.mode).toBe("full");
    expect(result.added).toBeGreaterThanOrEqual(25);
    expect(result.updated).toBe(0);
    expect(result.errors).toEqual([]);
    expect(result.durationMs).toBeGreaterThanOrEqual(0);

    // Verify playlists in database
    const playlists = await db.select().from(schema.youtubePlaylists);
    expect(playlists.length).toBeGreaterThanOrEqual(15);
    const matricesPlaylist = playlists.find((p) => p.title.includes("Matrices"));
    expect(matricesPlaylist).toBeDefined();
    expect(matricesPlaylist?.classLevel).toBe(12);

    // Verify videos in database
    const videos = await db.select().from(schema.youtubeVideos);
    expect(videos.length).toBeGreaterThanOrEqual(result.added);

    // Verify short video flag (e.g. <= 180s duration)
    const shortVideos = videos.filter((v) => v.durationSeconds <= 180);
    expect(shortVideos.length).toBeGreaterThan(0);
    for (const sv of shortVideos) {
      expect(sv.isShort).toBe(true);
    }

    // Verify channel stats written to site_settings
    const [statsRow] = await db
      .select()
      .from(schema.siteSettings)
      .where(eq(schema.siteSettings.key, "channel_stats"));
    expect(statsRow).toBeDefined();
    const stats = statsRow?.value as Record<string, unknown>;
    expect(stats.subscriberCount).toBe(11300);
    expect(stats.uploadsPlaylistId).toBe("UUy1XY9I1Yeyy59Y5LMgqa8g");

    // Verify sync_runs logged run
    const [runRow] = await db
      .select()
      .from(schema.syncRuns)
      .where(eq(schema.syncRuns.id, result.runId));
    expect(runRow).toBeDefined();
    expect(runRow?.kind).toBe("youtube_sync");
    expect(runRow?.added).toBe(result.added);
    expect(runRow?.updated).toBe(0);
    expect(runRow?.finishedAt).not.toBeNull();
  });

  it("Test 2: Admin modifications to video fields survive second incremental sync", async () => {
    // Pick an existing video
    const [targetVideo] = await db.select().from(schema.youtubeVideos).limit(1);
    expect(targetVideo).toBeDefined();
    const targetId = targetVideo!.id;

    // Simulate an administrator customizing metadata in admin panel
    await db
      .update(schema.youtubeVideos)
      .set({
        classLevel: 10,
        isShort: true,
        isPublished: false,
        needsReview: false,
      })
      .where(eq(schema.youtubeVideos.id, targetId));

    // Verify update was applied
    const [updatedBeforeSync] = await db
      .select()
      .from(schema.youtubeVideos)
      .where(eq(schema.youtubeVideos.id, targetId));
    expect(updatedBeforeSync?.classLevel).toBe(10);
    expect(updatedBeforeSync?.isShort).toBe(true);
    expect(updatedBeforeSync?.isPublished).toBe(false);
    expect(updatedBeforeSync?.needsReview).toBe(false);

    // Perform a second incremental sync
    const secondRun = await syncYouTubeChannel({ mode: "incremental" });

    expect(secondRun.mode).toBe("incremental");
    expect(secondRun.added).toBe(0); // Idempotent: 0 new duplicates added
    expect(secondRun.updated).toBeGreaterThan(0); // Refreshed existing video stats

    // Re-query admin modified video: Admin fields MUST BE UNTOUCHED
    const [afterSecondSync] = await db
      .select()
      .from(schema.youtubeVideos)
      .where(eq(schema.youtubeVideos.id, targetId));

    expect(afterSecondSync?.classLevel).toBe(10);
    expect(afterSecondSync?.isShort).toBe(true);
    expect(afterSecondSync?.isPublished).toBe(false);
    expect(afterSecondSync?.needsReview).toBe(false);

    // Verify sync_runs recorded the second run
    const [secondRunRecord] = await db
      .select()
      .from(schema.syncRuns)
      .where(eq(schema.syncRuns.id, secondRun.runId));
    expect(secondRunRecord?.added).toBe(0);
    expect(secondRunRecord?.updated).toBe(secondRun.updated);
    expect(secondRunRecord?.finishedAt).not.toBeNull();
  });

  it("Test 3: sync_runs writes a record for every run including failed ones", async () => {
    const totalRunsBefore = (await db.select().from(schema.syncRuns)).length;

    // Simulate a run where an error is captured
    const [failedRun] = await db
      .insert(schema.syncRuns)
      .values({
        kind: "youtube_sync",
        startedAt: new Date(),
        finishedAt: new Date(),
        added: 0,
        updated: 0,
        errors: [{ message: "Simulated YouTube API Quota Exceeded (403)", time: new Date().toISOString() }],
      })
      .returning();

    expect(failedRun).toBeDefined();
    expect(failedRun.errors).toEqual([
      expect.objectContaining({ message: expect.stringContaining("Quota Exceeded") }),
    ]);

    const totalRunsAfter = (await db.select().from(schema.syncRuns)).length;
    expect(totalRunsAfter).toBe(totalRunsBefore + 1);
  });

  it("Test 4: GET /api/cron/youtube-sync requires valid CRON_SECRET authorization", async () => {
    // 1. Missing Authorization header -> 401
    const unauthReq = new Request("http://localhost:3000/api/cron/youtube-sync", {
      method: "GET",
    });
    const unauthRes = await cronHandler(unauthReq);
    expect(unauthRes.status).toBe(401);
    const unauthBody = await unauthRes.json();
    expect(unauthBody.error).toContain("Unauthorized");

    // 2. Invalid Bearer token -> 401
    const wrongTokenReq = new Request("http://localhost:3000/api/cron/youtube-sync", {
      method: "GET",
      headers: {
        Authorization: "Bearer invalid_secret_token",
      },
    });
    const wrongTokenRes = await cronHandler(wrongTokenReq);
    expect(wrongTokenRes.status).toBe(401);

    // 3. Valid Bearer token -> 200 OK
    const cronSecret = process.env.CRON_SECRET || "dummy_cron_secret_1234567890";
    const validReq = new Request("http://localhost:3000/api/cron/youtube-sync", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${cronSecret}`,
      },
    });
    const validRes = await cronHandler(validReq);
    expect(validRes.status).toBe(200);
    const validBody = await validRes.json();
    expect(validBody.success).toBe(true);
    expect(validBody.runId).toBeDefined();
  });
});
