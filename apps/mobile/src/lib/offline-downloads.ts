import * as SQLite from 'expo-sqlite';
import { File, Directory, Paths } from 'expo-file-system';
import { analytics } from './analytics';

export interface DownloadedItem {
  id: string;
  batchId: string;
  batchTitle: string;
  subjectName?: string;
  chapterId?: string;
  chapterTitle?: string;
  section?: string;
  title: string;
  localPath: string;
  sizeBytes: number;
  pageCount?: number;
  downloadedAt: number;
}

interface DownloadRow {
  id: string;
  batch_id: string;
  batch_title: string;
  subject_name: string | null;
  chapter_id: string | null;
  chapter_title: string | null;
  section: string | null;
  title: string;
  local_path: string;
  size_bytes: number;
  page_count: number | null;
  downloaded_at: number;
}

let dbInstance: SQLite.SQLiteDatabase | null = null;

function getDb(): SQLite.SQLiteDatabase {
  if (!dbInstance) {
    dbInstance = SQLite.openDatabaseSync('quick2learn_downloads.db');
    dbInstance.execSync(`
      CREATE TABLE IF NOT EXISTS batch_downloads (
        id TEXT PRIMARY KEY,
        batch_id TEXT NOT NULL,
        batch_title TEXT NOT NULL,
        subject_name TEXT,
        chapter_id TEXT,
        chapter_title TEXT,
        section TEXT,
        title TEXT NOT NULL,
        local_path TEXT NOT NULL,
        size_bytes INTEGER NOT NULL,
        page_count INTEGER,
        downloaded_at INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS pdf_reading_progress (
        content_id TEXT PRIMARY KEY,
        last_page INTEGER NOT NULL,
        total_pages INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );
    `);
  }
  return dbInstance;
}

function getDownloadsDirectory(): Directory {
  const dir = new Directory(Paths.document, 'batch_downloads');
  if (!dir.exists) {
    dir.create();
  }
  return dir;
}

function mapRow(row: DownloadRow): DownloadedItem {
  return {
    id: row.id,
    batchId: row.batch_id,
    batchTitle: row.batch_title,
    subjectName: row.subject_name || undefined,
    chapterId: row.chapter_id || undefined,
    chapterTitle: row.chapter_title || undefined,
    section: row.section || undefined,
    title: row.title,
    localPath: row.local_path,
    sizeBytes: row.size_bytes,
    pageCount: row.page_count ?? undefined,
    downloadedAt: row.downloaded_at,
  };
}

/**
 * Check if a content item is downloaded locally and verified on disk.
 */
export async function getDownloadedItem(id: string): Promise<DownloadedItem | null> {
  try {
    const db = getDb();
    const row = db.getFirstSync<DownloadRow>(
      'SELECT * FROM batch_downloads WHERE id = ?',
      id
    );

    if (!row) return null;

    // Verify file still exists on disk
    const file = new File(row.local_path);
    if (!file.exists) {
      db.runSync('DELETE FROM batch_downloads WHERE id = ?', id);
      return null;
    }

    return mapRow(row);
  } catch (err) {
    console.warn('[offline-downloads] getDownloadedItem failed:', err);
    return null;
  }
}

/**
 * Returns all downloaded PDFs grouped or sorted by download time.
 */
export async function getAllDownloads(): Promise<DownloadedItem[]> {
  try {
    const db = getDb();
    const rows = db.getAllSync<DownloadRow>(
      'SELECT * FROM batch_downloads ORDER BY downloaded_at DESC'
    );

    const validItems: DownloadedItem[] = [];
    for (const row of rows) {
      const file = new File(row.local_path);
      if (file.exists) {
        validItems.push(mapRow(row));
      } else {
        db.runSync('DELETE FROM batch_downloads WHERE id = ?', row.id);
      }
    }
    return validItems;
  } catch (err) {
    console.warn('[offline-downloads] getAllDownloads failed:', err);
    return [];
  }
}

/**
 * Returns downloaded items for a specific batch.
 */
export async function getBatchDownloads(batchId: string): Promise<DownloadedItem[]> {
  try {
    const db = getDb();
    const rows = db.getAllSync<DownloadRow>(
      'SELECT * FROM batch_downloads WHERE batch_id = ? ORDER BY downloaded_at DESC',
      batchId
    );

    const validItems: DownloadedItem[] = [];
    for (const row of rows) {
      const file = new File(row.local_path);
      if (file.exists) {
        validItems.push(mapRow(row));
      } else {
        db.runSync('DELETE FROM batch_downloads WHERE id = ?', row.id);
      }
    }
    return validItems;
  } catch (err) {
    console.warn('[offline-downloads] getBatchDownloads failed:', err);
    return [];
  }
}

/**
 * Downloads a PDF file to the private documents directory and registers it in SQLite.
 */
export async function downloadAndSavePdf(item: {
  id: string;
  batchId: string;
  batchTitle: string;
  subjectName?: string;
  chapterId?: string;
  chapterTitle?: string;
  section?: string;
  title: string;
  downloadUrl: string;
  pageCount?: number;
}): Promise<DownloadedItem> {
  const dir = getDownloadsDirectory();
  const safeFilename = `${item.id}.pdf`;
  const destinationFile = new File(dir, safeFilename);

  // If already exists, delete previous version
  if (destinationFile.exists) {
    destinationFile.delete();
  }

  // Download the file
  await File.downloadFileAsync(item.downloadUrl, destinationFile);

  const finalSize = destinationFile.size || 0;
  const localUri = destinationFile.uri;
  const now = Date.now();

  const db = getDb();
  db.runSync(
    `INSERT OR REPLACE INTO batch_downloads 
      (id, batch_id, batch_title, subject_name, chapter_id, chapter_title, section, title, local_path, size_bytes, page_count, downloaded_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    item.id,
    item.batchId,
    item.batchTitle,
    item.subjectName || null,
    item.chapterId || null,
    item.chapterTitle || null,
    item.section || null,
    item.title,
    localUri,
    finalSize,
    item.pageCount || null,
    now
  );

  analytics.track('pdf_downloaded', {
    fileId: item.id,
    title: item.title,
    fileSize: `${Math.round(finalSize / 1024)} KB`,
    batchId: item.batchId,
  });

  return {
    id: item.id,
    batchId: item.batchId,
    batchTitle: item.batchTitle,
    subjectName: item.subjectName,
    chapterId: item.chapterId,
    chapterTitle: item.chapterTitle,
    section: item.section,
    title: item.title,
    localPath: localUri,
    sizeBytes: finalSize,
    pageCount: item.pageCount,
    downloadedAt: now,
  };
}

/**
 * Deletes a single downloaded PDF.
 */
export async function deleteDownloadedPdf(id: string): Promise<void> {
  try {
    const db = getDb();
    const row = db.getFirstSync<DownloadRow>(
      'SELECT local_path FROM batch_downloads WHERE id = ?',
      id
    );

    if (row?.local_path) {
      try {
        const file = new File(row.local_path);
        if (file.exists) {
          file.delete();
        }
      } catch (e) {
        console.warn('[offline-downloads] Failed to delete file on disk:', e);
      }
    }

    db.runSync('DELETE FROM batch_downloads WHERE id = ?', id);
  } catch (err) {
    console.warn('[offline-downloads] deleteDownloadedPdf failed:', err);
  }
}

/**
 * Deletes all downloaded PDFs for a batch.
 */
export async function deleteAllBatchDownloads(batchId: string): Promise<void> {
  try {
    const db = getDb();
    const rows = db.getAllSync<DownloadRow>(
      'SELECT local_path FROM batch_downloads WHERE batch_id = ?',
      batchId
    );

    for (const row of rows) {
      try {
        const file = new File(row.local_path);
        if (file.exists) {
          file.delete();
        }
      } catch {
        // ignore
      }
    }

    db.runSync('DELETE FROM batch_downloads WHERE batch_id = ?', batchId);
  } catch (err) {
    console.warn('[offline-downloads] deleteAllBatchDownloads failed:', err);
  }
}

/**
 * Deletes all downloads across all batches.
 */
export async function deleteAllDownloads(): Promise<void> {
  try {
    const db = getDb();
    const rows = db.getAllSync<DownloadRow>('SELECT local_path FROM batch_downloads');

    for (const row of rows) {
      try {
        const file = new File(row.local_path);
        if (file.exists) {
          file.delete();
        }
      } catch {
        // ignore
      }
    }

    db.runSync('DELETE FROM batch_downloads');
  } catch (err) {
    console.warn('[offline-downloads] deleteAllDownloads failed:', err);
  }
}

/**
 * Cleanup orphaned downloads when a student is no longer enrolled in a batch.
 * Called on app launch with the list of student's active batch IDs.
 */
export async function cleanupOrphanedBatchDownloads(activeBatchIds: string[]): Promise<number> {
  try {
    const db = getDb();
    const rows = db.getAllSync<DownloadRow>('SELECT id, batch_id, local_path FROM batch_downloads');
    const activeSet = new Set(activeBatchIds);

    let removedCount = 0;
    for (const row of rows) {
      if (!activeSet.has(row.batch_id)) {
        try {
          const file = new File(row.local_path);
          if (file.exists) {
            file.delete();
          }
        } catch {
          // ignore
        }
        db.runSync('DELETE FROM batch_downloads WHERE id = ?', row.id);
        removedCount++;
      }
    }

    return removedCount;
  } catch (err) {
    console.warn('[offline-downloads] cleanupOrphanedBatchDownloads error:', err);
    return 0;
  }
}

/**
 * Formats bytes to human-readable string (e.g. 2.4 MB).
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Get the last read page for a PDF (defaults to 1).
 */
export function getLastReadPage(contentId: string): number {
  try {
    const db = getDb();
    const row = db.getFirstSync<{ last_page: number }>(
      'SELECT last_page FROM pdf_reading_progress WHERE content_id = ?',
      contentId
    );
    return row?.last_page && row.last_page > 0 ? row.last_page : 1;
  } catch (err) {
    console.warn('[offline-downloads] getLastReadPage error:', err);
    return 1;
  }
}

/**
 * Persist the current page and total pages for a PDF.
 */
export function saveLastReadPage(contentId: string, page: number, totalPages: number): void {
  try {
    const db = getDb();
    db.runSync(
      `INSERT OR REPLACE INTO pdf_reading_progress (content_id, last_page, total_pages, updated_at)
       VALUES (?, ?, ?, ?)`,
      contentId,
      page,
      totalPages,
      Date.now()
    );
  } catch (err) {
    console.warn('[offline-downloads] saveLastReadPage error:', err);
  }
}

