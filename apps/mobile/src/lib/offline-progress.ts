import * as SQLite from 'expo-sqlite';
import { apiClient } from '../api/client';
import type { ProgressBatchInput, ProgressBatchResponse } from '@quick2learn/shared';

let dbInstance: SQLite.SQLiteDatabase | null = null;

function getProgressDb(): SQLite.SQLiteDatabase {
  if (!dbInstance) {
    dbInstance = SQLite.openDatabaseSync('quick2learn_progress.db');
    dbInstance.execSync(`
      CREATE TABLE IF NOT EXISTS offline_progress_queue (
        item_id TEXT PRIMARY KEY,
        item_type TEXT NOT NULL,
        position_seconds INTEGER NOT NULL,
        duration_seconds INTEGER,
        sync_status TEXT NOT NULL DEFAULT 'pending',
        updated_at INTEGER NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_progress_sync ON offline_progress_queue (sync_status);
    `);
  }
  return dbInstance;
}

export interface QueuedProgressItem {
  itemId: string;
  itemType: 'youtube_video' | 'content_item';
  positionSeconds: number;
  durationSeconds?: number | null;
}

/**
 * Saves lecture watch or reading progress locally in SQLite immediately.
 */
export function saveProgressLocally(item: QueuedProgressItem): void {
  try {
    const db = getProgressDb();
    const now = Date.now();
    db.runSync(
      `INSERT INTO offline_progress_queue (item_id, item_type, position_seconds, duration_seconds, sync_status, updated_at)
       VALUES (?, ?, ?, ?, 'pending', ?)
       ON CONFLICT(item_id) DO UPDATE SET
         position_seconds = excluded.position_seconds,
         duration_seconds = excluded.duration_seconds,
         sync_status = 'pending',
         updated_at = excluded.updated_at;`,
      [
        item.itemId,
        item.itemType,
        item.positionSeconds,
        item.durationSeconds ?? null,
        now,
      ]
    );
  } catch (err) {
    console.warn('[saveProgressLocally] Failed to store progress locally:', err);
  }
}

/**
 * Returns all un-synced progress updates.
 */
export function getPendingProgressItems(): QueuedProgressItem[] {
  try {
    const db = getProgressDb();
    const rows = db.getAllSync<{
      item_id: string;
      item_type: string;
      position_seconds: number;
      duration_seconds: number | null;
    }>(
      `SELECT item_id, item_type, position_seconds, duration_seconds
       FROM offline_progress_queue
       WHERE sync_status = 'pending';`
    );

    return rows.map((r) => ({
      itemId: r.item_id,
      itemType: r.item_type as QueuedProgressItem['itemType'],
      positionSeconds: r.position_seconds,
      durationSeconds: r.duration_seconds,
    }));
  } catch (err) {
    console.warn('[getPendingProgressItems] Failed to read pending progress:', err);
    return [];
  }
}

/**
 * Flushes all queued progress items to the server.
 */
export async function syncPendingProgress(): Promise<{ synced: number; failed: number }> {
  const items = getPendingProgressItems();
  if (items.length === 0) return { synced: 0, failed: 0 };

  const db = getProgressDb();
  let synced = 0;
  let failed = 0;

  try {
    const payload: ProgressBatchInput = {
      updates: items.map((i) => ({
        itemId: i.itemId,
        itemType: i.itemType,
        positionSeconds: i.positionSeconds,
        durationSeconds: i.durationSeconds || 0,
      })),
    };

    await apiClient.post<ProgressBatchResponse>('/progress', payload);

    // Mark items as synced
    const ids = items.map((i) => i.itemId);
    const placeholders = ids.map(() => '?').join(',');
    db.runSync(
      `UPDATE offline_progress_queue SET sync_status = 'synced', updated_at = ? WHERE item_id IN (${placeholders});`,
      [Date.now(), ...ids]
    );
    synced = items.length;
  } catch (err) {
    console.warn('[syncPendingProgress] Failed to batch flush progress:', err);
    failed = items.length;
  }

  return { synced, failed };
}
