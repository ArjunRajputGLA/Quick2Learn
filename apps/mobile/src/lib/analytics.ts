import * as SQLite from 'expo-sqlite';
import * as Network from 'expo-network';
import Constants from 'expo-constants';

export type AnalyticsEventName =
  | 'app_open'
  | 'lecture_played'
  | 'lecture_completed'
  | 'pdf_downloaded'
  | 'test_started'
  | 'test_submitted'
  | 'doubt_created'
  | 'join_requested'
  | 'live_joined';

export interface AnalyticsEventPropsMap {
  app_open: { fromBackground?: boolean; coldStart?: boolean; appVersion?: string };
  lecture_played: { lectureId: string; lectureTitle?: string; chapterTitle?: string; durationSeconds?: number };
  lecture_completed: { lectureId: string; lectureTitle?: string; watchTimeSeconds: number; percentWatched: number };
  pdf_downloaded: { fileId: string; title: string; fileSize?: string; batchId?: string };
  test_started: { testId: string; attemptId: string; title?: string; durationMinutes?: number };
  test_submitted: { testId: string; attemptId: string; answeredCount: number; totalQuestions: number };
  doubt_created: { doubtId?: string; subject?: string; classLevel?: number; hasAttachment?: boolean };
  join_requested: { batchId: string; batchName?: string };
  live_joined: { batchId: string; sessionId?: string; isTeacher?: boolean };
}

let dbInstance: SQLite.SQLiteDatabase | null = null;

function getAnalyticsDb(): SQLite.SQLiteDatabase {
  if (!dbInstance) {
    dbInstance = SQLite.openDatabaseSync('quick2learn_analytics.db');
    dbInstance.execSync(`
      CREATE TABLE IF NOT EXISTS offline_analytics_events (
        id TEXT PRIMARY KEY,
        event TEXT NOT NULL,
        properties_json TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        sync_status TEXT NOT NULL DEFAULT 'pending'
      );

      CREATE INDEX IF NOT EXISTS idx_analytics_sync ON offline_analytics_events (sync_status);
    `);
  }
  return dbInstance;
}

const POSTHOG_API_KEY = process.env.EXPO_PUBLIC_POSTHOG_API_KEY || 'phc_quick2learn_mobile_telemetry';
const POSTHOG_HOST = process.env.EXPO_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com';

class PostHogAnalyticsClient {
  private distinctId: string = 'device_' + (Constants.sessionId || 'anonymous');
  private isFlushing = false;

  public identify(userId: string) {
    this.distinctId = userId;
  }

  public reset() {
    this.distinctId = 'device_' + (Constants.sessionId || 'anonymous');
  }

  /**
   * Records an analytics event with offline queuing and batch dispatching.
   */
  public track<E extends AnalyticsEventName>(
    event: E,
    properties: AnalyticsEventPropsMap[E]
  ): void {
    try {
      const db = getAnalyticsDb();
      const id = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const enrichedProps = {
        ...properties,
        $app_version: Constants.expoConfig?.version || '1.0.0',
        $os: 'Android',
        distinct_id: this.distinctId,
      };

      db.runSync(
        `INSERT INTO offline_analytics_events (id, event, properties_json, timestamp, sync_status)
         VALUES (?, ?, ?, ?, 'pending');`,
        [id, event, JSON.stringify(enrichedProps), Date.now()]
      );

      // Attempt immediate background flush
      this.flush().catch(() => {});
    } catch (err) {
      console.warn(`[analytics] Error recording event ${event}:`, err);
    }
  }

  /**
   * Flushes pending events to PostHog telemetry server.
   */
  public async flush(): Promise<number> {
    if (this.isFlushing) return 0;
    this.isFlushing = true;

    try {
      const net = await Network.getNetworkStateAsync();
      if (!net.isConnected || net.isInternetReachable === false) {
        return 0;
      }

      const db = getAnalyticsDb();
      const rows = db.getAllSync<{
        id: string;
        event: string;
        properties_json: string;
        timestamp: number;
      }>(
        `SELECT id, event, properties_json, timestamp
         FROM offline_analytics_events
         WHERE sync_status = 'pending'
         ORDER BY timestamp ASC
         LIMIT 50;`
      );

      if (rows.length === 0) return 0;

      const batch = rows.map((r) => {
        let parsedProps: Record<string, unknown> = {};
        try {
          parsedProps = JSON.parse(r.properties_json);
        } catch {
          // ignore parse error
        }
        return {
          event: r.event,
          properties: parsedProps,
          timestamp: new Date(r.timestamp).toISOString(),
          distinct_id: (parsedProps.distinct_id as string) || this.distinctId,
        };
      });

      // Post batch to PostHog
      try {
        const res = await fetch(`${POSTHOG_HOST}/batch`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            api_key: POSTHOG_API_KEY,
            batch,
          }),
        });

        if (res.ok || res.status === 200) {
          const ids = rows.map((r) => r.id);
          const placeholders = ids.map(() => '?').join(',');
          db.runSync(
            `DELETE FROM offline_analytics_events WHERE id IN (${placeholders});`,
            ids
          );
          return rows.length;
        }
      } catch (postErr) {
        // Network or fetch error
        console.warn('[analytics] PostHog dispatch warning:', postErr);
      }

      return 0;
    } catch (err) {
      console.warn('[analytics] Flush warning:', err);
      return 0;
    } finally {
      this.isFlushing = false;
    }
  }
}

export const analytics = new PostHogAnalyticsClient();
