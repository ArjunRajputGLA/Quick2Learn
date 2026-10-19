import * as SQLite from 'expo-sqlite';
import { apiClient } from '../api/client';
import type {
  StartAttemptResponse,
  StudentTestQuestion,
  SaveAnswerItem,
} from '@quick2learn/shared';

export interface LocalAttemptRecord {
  attemptId: string;
  testId: string;
  title: string;
  durationMinutes: number;
  startedAt: string;
  deadlineAt: string;
  serverNow: string;
  questions: StudentTestQuestion[];
  status: 'in_progress' | 'submitted';
  updatedAt: number;
}

export interface LocalAnswerRecord {
  questionId: string;
  answer: any;
  timeSpentSeconds: number;
  markedForReview: boolean;
  syncStatus: 'pending' | 'synced';
  updatedAt: number;
}

let dbInstance: SQLite.SQLiteDatabase | null = null;

function getTestDb(): SQLite.SQLiteDatabase {
  if (!dbInstance) {
    dbInstance = SQLite.openDatabaseSync('quick2learn_tests.db');
    dbInstance.execSync(`
      CREATE TABLE IF NOT EXISTS offline_test_attempts (
        attempt_id TEXT PRIMARY KEY,
        test_id TEXT NOT NULL,
        title TEXT NOT NULL,
        duration_minutes INTEGER NOT NULL,
        started_at TEXT NOT NULL,
        deadline_at TEXT NOT NULL,
        questions_json TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'in_progress',
        updated_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS offline_test_answers (
        attempt_id TEXT NOT NULL,
        question_id TEXT NOT NULL,
        answer_json TEXT,
        time_spent_seconds INTEGER NOT NULL DEFAULT 0,
        marked_for_review INTEGER NOT NULL DEFAULT 0,
        sync_status TEXT NOT NULL DEFAULT 'pending',
        updated_at INTEGER NOT NULL,
        PRIMARY KEY (attempt_id, question_id)
      );

      CREATE INDEX IF NOT EXISTS idx_test_answers_sync ON offline_test_answers (attempt_id, sync_status);
    `);
  }
  return dbInstance;
}

/**
 * Saves or updates a test attempt in local SQLite storage.
 */
export function saveLocalAttempt(attempt: StartAttemptResponse): void {
  try {
    const db = getTestDb();
    const now = Date.now();
    db.runSync(
      `INSERT OR REPLACE INTO offline_test_attempts (
        attempt_id, test_id, title, duration_minutes, started_at, deadline_at, questions_json, status, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'in_progress', ?);`,
      [
        attempt.attemptId,
        attempt.testId,
        attempt.title,
        attempt.durationMinutes,
        attempt.startedAt,
        attempt.deadlineAt,
        JSON.stringify(attempt.questions),
        now,
      ]
    );

    // If server returned initial saved answers, seed them into offline_test_answers as synced
    if (attempt.savedAnswers) {
      for (const [qId, data] of Object.entries(attempt.savedAnswers)) {
        db.runSync(
          `INSERT OR IGNORE INTO offline_test_answers (
            attempt_id, question_id, answer_json, time_spent_seconds, marked_for_review, sync_status, updated_at
          ) VALUES (?, ?, ?, ?, ?, 'synced', ?);`,
          [
            attempt.attemptId,
            qId,
            JSON.stringify(data.answer ?? null),
            data.timeSpentSeconds || 0,
            data.markedForReview ? 1 : 0,
            now,
          ]
        );
      }
    }
  } catch (err) {
    console.warn('[saveLocalAttempt] Error saving to SQLite:', err);
  }
}

/**
 * Retrieves a locally saved attempt from SQLite.
 */
export function getLocalAttempt(attemptId: string): LocalAttemptRecord | null {
  try {
    const db = getTestDb();
    const row = db.getFirstSync<{
      attempt_id: string;
      test_id: string;
      title: string;
      duration_minutes: number;
      started_at: string;
      deadline_at: string;
      questions_json: string;
      status: 'in_progress' | 'submitted';
      updated_at: number;
    }>(
      `SELECT attempt_id, test_id, title, duration_minutes, started_at, deadline_at, questions_json, status, updated_at
       FROM offline_test_attempts WHERE attempt_id = ?;`,
      [attemptId]
    );

    if (!row) return null;

    const questions = JSON.parse(row.questions_json) as StudentTestQuestion[];
    return {
      attemptId: row.attempt_id,
      testId: row.test_id,
      title: row.title,
      durationMinutes: row.duration_minutes,
      startedAt: row.started_at,
      deadlineAt: row.deadline_at,
      serverNow: new Date().toISOString(),
      questions,
      status: row.status,
      updatedAt: row.updated_at,
    };
  } catch (err) {
    console.warn('[getLocalAttempt] Error reading from SQLite:', err);
    return null;
  }
}

/**
 * Saves a single question answer to local SQLite first.
 * Marks sync_status = 'pending' so background sync can push it to server.
 */
export function saveLocalAnswer(
  attemptId: string,
  questionId: string,
  answer: any,
  timeSpentSeconds: number,
  markedForReview: boolean
): void {
  try {
    const db = getTestDb();
    const now = Date.now();
    db.runSync(
      `INSERT INTO offline_test_answers (
        attempt_id, question_id, answer_json, time_spent_seconds, marked_for_review, sync_status, updated_at
      ) VALUES (?, ?, ?, ?, ?, 'pending', ?)
      ON CONFLICT(attempt_id, question_id) DO UPDATE SET
        answer_json = excluded.answer_json,
        time_spent_seconds = excluded.time_spent_seconds,
        marked_for_review = excluded.marked_for_review,
        sync_status = 'pending',
        updated_at = excluded.updated_at;`,
      [
        attemptId,
        questionId,
        JSON.stringify(answer ?? null),
        timeSpentSeconds,
        markedForReview ? 1 : 0,
        now,
      ]
    );
  } catch (err) {
    console.warn('[saveLocalAnswer] Error saving answer to SQLite:', err);
  }
}

/**
 * Returns all local answers for an attempt as a map: { [questionId]: LocalAnswerRecord }
 */
export function getLocalAnswers(
  attemptId: string
): Record<string, LocalAnswerRecord> {
  try {
    const db = getTestDb();
    const rows = db.getAllSync<{
      question_id: string;
      answer_json: string | null;
      time_spent_seconds: number;
      marked_for_review: number;
      sync_status: 'pending' | 'synced';
      updated_at: number;
    }>(
      `SELECT question_id, answer_json, time_spent_seconds, marked_for_review, sync_status, updated_at
       FROM offline_test_answers WHERE attempt_id = ?;`,
      [attemptId]
    );

    const result: Record<string, LocalAnswerRecord> = {};
    for (const r of rows) {
      result[r.question_id] = {
        questionId: r.question_id,
        answer: r.answer_json ? JSON.parse(r.answer_json) : null,
        timeSpentSeconds: r.time_spent_seconds,
        markedForReview: Boolean(r.marked_for_review),
        syncStatus: r.sync_status,
        updatedAt: r.updated_at,
      };
    }
    return result;
  } catch (err) {
    console.warn('[getLocalAnswers] Error fetching answers:', err);
    return {};
  }
}

/**
 * Retrieves all answers that are currently marked as 'pending' sync.
 */
export function getPendingSyncAnswers(attemptId: string): SaveAnswerItem[] {
  try {
    const db = getTestDb();
    const rows = db.getAllSync<{
      question_id: string;
      answer_json: string | null;
      time_spent_seconds: number;
      marked_for_review: number;
    }>(
      `SELECT question_id, answer_json, time_spent_seconds, marked_for_review
       FROM offline_test_answers WHERE attempt_id = ? AND sync_status = 'pending';`,
      [attemptId]
    );

    return rows.map((r) => ({
      questionId: r.question_id,
      answer: r.answer_json ? JSON.parse(r.answer_json) : null,
      timeSpentSeconds: r.time_spent_seconds,
      markedForReview: Boolean(r.marked_for_review),
    }));
  } catch (err) {
    console.warn('[getPendingSyncAnswers] Error getting pending sync:', err);
    return [];
  }
}

/**
 * Marks specified question answers as successfully synced with the server.
 */
export function markAnswersAsSynced(
  attemptId: string,
  questionIds: string[]
): void {
  if (questionIds.length === 0) return;
  try {
    const db = getTestDb();
    const placeholders = questionIds.map(() => '?').join(',');
    db.runSync(
      `UPDATE offline_test_answers SET sync_status = 'synced'
       WHERE attempt_id = ? AND question_id IN (${placeholders});`,
      [attemptId, ...questionIds]
    );
  } catch (err) {
    console.warn('[markAnswersAsSynced] Error updating sync status:', err);
  }
}

/**
 * Marks attempt as submitted locally and cleans up old answers.
 */
export function markAttemptSubmitted(attemptId: string): void {
  try {
    const db = getTestDb();
    db.runSync(
      `UPDATE offline_test_attempts SET status = 'submitted' WHERE attempt_id = ?;`,
      [attemptId]
    );
  } catch (err) {
    console.warn('[markAttemptSubmitted] Error marking submitted:', err);
  }
}

/**
 * Synchronizes all pending test answers across all active attempts with the server.
 */
export async function syncPendingTestAnswers(): Promise<{ syncedAttempts: number; failedAttempts: number }> {
  try {
    const db = getTestDb();
    const rows = db.getAllSync<{ attempt_id: string }>(
      `SELECT DISTINCT attempt_id FROM offline_test_answers WHERE sync_status = 'pending';`
    );

    let syncedAttempts = 0;
    let failedAttempts = 0;

    for (const { attempt_id } of rows) {
      const pendingAnswers = getPendingSyncAnswers(attempt_id);
      if (pendingAnswers.length === 0) continue;

      try {
        await apiClient.put(`/attempts/${attempt_id}/answers`, { answers: pendingAnswers });
        const questionIds = pendingAnswers.map((a) => a.questionId);
        markAnswersAsSynced(attempt_id, questionIds);
        syncedAttempts++;
      } catch (err) {
        console.warn(`[syncPendingTestAnswers] Failed to sync answers for attempt ${attempt_id}:`, err);
        failedAttempts++;
      }
    }

    return { syncedAttempts, failedAttempts };
  } catch (err) {
    console.warn('[syncPendingTestAnswers] Error during sync:', err);
    return { syncedAttempts: 0, failedAttempts: 0 };
  }
}

