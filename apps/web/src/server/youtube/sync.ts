import {
  db,
  schema,
  eq,
  desc,
  sql,
} from "@quick2learn/db";
import { YouTubeClient } from "./client";
import { tagPlaylist, tagVideo, type PlaylistTagMapping } from "./tagger";
import { revalidateDataTag } from "../data/cached-home";
import type { SyncOptions, SyncResult } from "./types";

/**
 * Orchestrates importing and synchronizing YouTube playlists and videos
 * into PostgreSQL with strict separation between YouTube-owned and admin-owned fields.
 */
export async function syncYouTubeChannel(
  options?: SyncOptions,
): Promise<SyncResult> {
  const startTime = Date.now();

  const [run] = await db
    .insert(schema.syncRuns)
    .values({
      kind: "youtube_sync",
      startedAt: new Date(),
      added: 0,
      updated: 0,
      errors: [],
    })
    .returning({ id: schema.syncRuns.id });

  if (!run) {
    throw new Error("Failed to initialize sync_runs record");
  }
  const runId = run.id;

  try {
    const client = new YouTubeClient();

    // 2. Fetch channel stats and store in site_settings.channel_stats
    const channelStats = await client.getChannelStats();
    await db
      .insert(schema.siteSettings)
      .values({
        key: "channel_stats",
        value: channelStats as unknown as Record<string, unknown>,
      })
      .onConflictDoUpdate({
        target: schema.siteSettings.key,
        set: {
          value: channelStats as unknown as Record<string, unknown>,
          updatedAt: sql`timezone('utc'::text, now())`,
        },
      });

    // 3. Load catalog context for auto-tagging
    const subjects = await db.select().from(schema.subjects);
    const chapters = await db.select().from(schema.chapters);
    const facultyList = await db.select().from(schema.faculty);

    // 4. Fetch playlists and upsert them
    const playlists = await client.getPlaylists();
    const playlistMappings = new Map<string, PlaylistTagMapping>();

    const playlistRows = playlists.map((p) => {
      const tags = tagPlaylist(p.title, { subjects, chapters });
      playlistMappings.set(p.id, {
        id: p.id,
        title: p.title,
        classLevel: tags.classLevel,
        subjectId: tags.subjectId,
        chapterId: tags.chapterId,
      });

      return {
        id: p.id,
        title: p.title,
        description: p.description,
        thumbnailUrl: p.thumbnailUrl,
        itemCount: p.itemCount,
        classLevel: tags.classLevel,
        subjectId: tags.subjectId,
        chapterId: tags.chapterId,
        syncedAt: new Date(),
      };
    });

    if (playlistRows.length > 0) {
      await db.transaction(async (tx) => {
        for (let i = 0; i < playlistRows.length; i += 50) {
          const chunk = playlistRows.slice(i, i + 50);
          await tx
            .insert(schema.youtubePlaylists)
            .values(chunk)
            .onConflictDoUpdate({
              target: schema.youtubePlaylists.id,
              set: {
                title: sql`excluded.title`,
                description: sql`excluded.description`,
                thumbnailUrl: sql`excluded.thumbnail_url`,
                itemCount: sql`excluded.item_count`,
                syncedAt: sql`excluded.synced_at`,
                updatedAt: sql`timezone('utc'::text, now())`,
              },
            });
        }
      });
    }

    // 5. Build playlist -> video mapping
    const videoToPlaylistIds = new Map<string, string[]>();
    for (const pl of playlists) {
      const vids = await client.getPlaylistItemVideoIds(pl.id);
      for (const vid of vids) {
        const existingList = videoToPlaylistIds.get(vid) || [];
        if (!existingList.includes(pl.id)) {
          existingList.push(pl.id);
        }
        videoToPlaylistIds.set(vid, existingList);
      }
    }

    // 6. Determine sync mode
    const existingVideos = await db
      .select({
        id: schema.youtubeVideos.id,
        publishedAt: schema.youtubeVideos.publishedAt,
      })
      .from(schema.youtubeVideos);

    const existingVideoIds = new Set(existingVideos.map((v) => v.id));
    const isFirstRun = existingVideoIds.size === 0 || options?.forceFull;
    const mode: "full" | "incremental" =
      options?.mode === "full"
        ? "full"
        : options?.mode === "incremental"
          ? "incremental"
          : isFirstRun
            ? "full"
            : "incremental";

    // 7. Get target video IDs based on mode
    let targetVideoIds: string[] = [];

    if (mode === "full") {
      // Paging through the uploads playlist completely
      targetVideoIds = await client.getUploadsVideoIds(
        channelStats.uploadsPlaylistId,
      );
    } else {
      // Incremental mode: stop paging uploads playlist once already-synced videos reached
      const newUploads = await client.getUploadsVideoIds(
        channelStats.uploadsPlaylistId,
        {
          stopWhenFound: (videoId) => existingVideoIds.has(videoId),
        },
      );

      // Always refresh stats for the newest 200 videos in DB
      const newest200 = await db
        .select({ id: schema.youtubeVideos.id })
        .from(schema.youtubeVideos)
        .orderBy(desc(schema.youtubeVideos.publishedAt))
        .limit(200);

      const targetSet = new Set<string>();
      for (const id of newUploads) targetSet.add(id);
      for (const row of newest200) targetSet.add(row.id);
      targetVideoIds = Array.from(targetSet);
    }

    // 8. Fetch detailed video stats & metadata in batches of 50
    const videoDetails = await client.getVideosDetailsBatch(targetVideoIds);

    let addedCount = 0;
    let updatedCount = 0;

    const videoRows = videoDetails.map((v) => {
      const isExisting = existingVideoIds.has(v.id);
      if (isExisting) {
        updatedCount++;
      } else {
        addedCount++;
      }

      const assignedPlaylists = Array.from(
        new Set([
          ...(videoToPlaylistIds.get(v.id) || []),
          ...v.playlistIds,
        ]),
      );

      const tags = tagVideo(
        {
          title: v.title,
          description: v.description,
          durationSeconds: v.durationSeconds,
          playlistIds: assignedPlaylists,
        },
        {
          subjects,
          chapters,
          facultyList,
          playlistMappings,
        },
      );

      return {
        id: v.id,
        title: v.title,
        description: v.description,
        publishedAt: v.publishedAt,
        durationSeconds: v.durationSeconds,
        thumbnailUrl: v.thumbnailUrl,
        viewCount: v.viewCount,
        likeCount: v.likeCount,
        playlistIds: assignedPlaylists,
        isShort: tags.isShort,
        classLevel: tags.classLevel,
        subjectId: tags.subjectId,
        chapterId: tags.chapterId,
        facultyId: tags.facultyId,
        isPublished: true,
        needsReview: tags.needsReview,
        syncedAt: new Date(),
      };
    });

    // 9. Upsert in batches of 50 inside a transaction
    // YouTube-owned fields are updated, admin-owned fields are NEVER overwritten
    if (videoRows.length > 0) {
      await db.transaction(async (tx) => {
        for (let i = 0; i < videoRows.length; i += 50) {
          const chunk = videoRows.slice(i, i + 50);
          await tx
            .insert(schema.youtubeVideos)
            .values(chunk)
            .onConflictDoUpdate({
              target: schema.youtubeVideos.id,
              set: {
                title: sql`excluded.title`,
                description: sql`excluded.description`,
                publishedAt: sql`excluded.published_at`,
                durationSeconds: sql`excluded.duration_seconds`,
                thumbnailUrl: sql`excluded.thumbnail_url`,
                viewCount: sql`excluded.view_count`,
                likeCount: sql`excluded.like_count`,
                playlistIds: sql`excluded.playlist_ids`,
                syncedAt: sql`excluded.synced_at`,
                updatedAt: sql`timezone('utc'::text, now())`,
              },
            });
        }
      });
    }

    // 10. Update sync_runs row
    await db
      .update(schema.syncRuns)
      .set({
        finishedAt: new Date(),
        added: addedCount,
        updated: updatedCount,
        errors: [],
      })
      .where(eq(schema.syncRuns.id, runId));

    // 11. Revalidate videos tag in Next.js
    revalidateDataTag("videos");

    return {
      runId,
      mode,
      added: addedCount,
      updated: updatedCount,
      errors: [],
      durationMs: Date.now() - startTime,
    };
  } catch (err) {
    const errorObj = {
      message: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
      time: new Date().toISOString(),
    };

    // Update sync_runs row on failure
    await db
      .update(schema.syncRuns)
      .set({
        finishedAt: new Date(),
        errors: [errorObj],
      })
      .where(eq(schema.syncRuns.id, runId));

    return {
      runId,
      mode: options?.mode === "incremental" ? "incremental" : "full",
      added: 0,
      updated: 0,
      errors: [errorObj],
      durationMs: Date.now() - startTime,
    };
  }
}
