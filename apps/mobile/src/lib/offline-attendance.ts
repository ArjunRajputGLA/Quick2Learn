import * as SQLite from 'expo-sqlite';
import { apiClient } from '../api/client';
import type { TeacherSaveAttendanceInput, TeacherSaveAttendanceResponse } from '@quick2learn/shared';

let dbInstance: SQLite.SQLiteDatabase | null = null;

function getAttendanceDb(): SQLite.SQLiteDatabase {
  if (!dbInstance) {
    dbInstance = SQLite.openDatabaseSync('quick2learn_attendance.db');
    dbInstance.execSync(`
      CREATE TABLE IF NOT EXISTS offline_attendance_queue (
        id TEXT PRIMARY KEY,
        batch_id TEXT NOT NULL,
        session_id TEXT,
        date TEXT NOT NULL,
        entries_json TEXT NOT NULL,
        sync_status TEXT NOT NULL DEFAULT 'pending',
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_attendance_sync ON offline_attendance_queue (sync_status);
    `);
  }
  return dbInstance;
}

export interface OfflineAttendanceRecord {
  id: string;
  batchId: string;
  sessionId: string | null;
  date: string;
  entries: Array<{
    studentId: string;
    status: 'present' | 'absent' | 'late' | 'excused';
    note?: string;
  }>;
  syncStatus: 'pending' | 'synced' | 'failed';
  updatedAt: number;
}

/**
 * Saves attendance locally immediately for zero-latency instant feedback.
 */
export function saveAttendanceLocally(input: TeacherSaveAttendanceInput): string {
  const db = getAttendanceDb();
  const id = `${input.batchId}_${input.date}_${input.sessionId || 'nosession'}`;
  const now = Date.now();
  const entriesJson = JSON.stringify(input.entries);

  db.runSync(
    `INSERT INTO offline_attendance_queue (id, batch_id, session_id, date, entries_json, sync_status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, 'pending', ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       entries_json = excluded.entries_json,
       sync_status = 'pending',
       updated_at = excluded.updated_at;`,
    [
      id,
      input.batchId,
      input.sessionId || null,
      input.date,
      entriesJson,
      now,
      now,
    ]
  );

  return id;
}

/**
 * Retrieves cached attendance entries if available offline.
 */
export function getLocalAttendanceEntries(
  batchId: string,
  date: string,
  sessionId?: string | null
): Array<{ studentId: string; status: 'present' | 'absent' | 'late' | 'excused'; note?: string }> | null {
  const db = getAttendanceDb();
  const id = `${batchId}_${date}_${sessionId || 'nosession'}`;

  const row = db.getFirstSync<{ entries_json: string }>(
    `SELECT entries_json FROM offline_attendance_queue WHERE id = ?`,
    [id]
  );

  if (!row) return null;
  try {
    return JSON.parse(row.entries_json);
  } catch {
    return null;
  }
}

/**
 * Returns count of pending offline records waiting to sync.
 */
export function getPendingAttendanceCount(): number {
  const db = getAttendanceDb();
  const row = db.getFirstSync<{ count: number }>(
    `SELECT count(*) as count FROM offline_attendance_queue WHERE sync_status = 'pending'`
  );
  return row?.count || 0;
}

/**
 * Flushes all pending attendance records to server.
 */
export async function syncPendingAttendance(): Promise<{ synced: number; failed: number }> {
  const db = getAttendanceDb();
  const rows = db.getAllSync<{
    id: string;
    batch_id: string;
    session_id: string | null;
    date: string;
    entries_json: string;
  }>(`SELECT id, batch_id, session_id, date, entries_json FROM offline_attendance_queue WHERE sync_status = 'pending'`);

  let synced = 0;
  let failed = 0;

  for (const row of rows) {
    try {
      const entries = JSON.parse(row.entries_json);
      await apiClient.post<TeacherSaveAttendanceResponse>(
        '/teacher/attendance',
        {
          batchId: row.batch_id,
          sessionId: row.session_id,
          date: row.date,
          entries,
        }
      );

      // Mark synced
      db.runSync(
        `UPDATE offline_attendance_queue SET sync_status = 'synced', updated_at = ? WHERE id = ?`,
        [Date.now(), row.id]
      );
      synced++;
    } catch (err) {
      console.warn(`[syncPendingAttendance] Failed to sync attendance ${row.id}:`, err);
      failed++;
    }
  }

  return { synced, failed };
}
