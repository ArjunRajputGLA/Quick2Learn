import * as Network from 'expo-network';
import { syncPendingAttendance } from './offline-attendance';
import { syncPendingTestAnswers } from './offline-tests';
import { syncPendingProgress } from './offline-progress';
import { queryClient } from './queryClient';

let isSyncing = false;

/**
 * Triggers flush of all offline queued mutations across attendance,
 * test assessments, and lecture watch progress.
 */
export async function syncAllPendingOfflineData() {
  if (isSyncing) return;
  isSyncing = true;

  try {
    const netState = await Network.getNetworkStateAsync();
    if (!netState.isConnected || netState.isInternetReachable === false) {
      return;
    }

    console.log('[networkSync] Network reachable. Flushing offline mutation queues...');

    // 1. Flush offline attendance records
    const attendanceResult = await syncPendingAttendance();
    if (attendanceResult.synced > 0) {
      console.log(`[networkSync] Synced ${attendanceResult.synced} attendance records.`);
    }

    // 2. Flush offline test answers
    const testResult = await syncPendingTestAnswers();
    if (testResult.syncedAttempts > 0) {
      console.log(`[networkSync] Synced answers for ${testResult.syncedAttempts} test attempts.`);
    }

    // 3. Flush offline lecture progress
    const progressResult = await syncPendingProgress();
    if (progressResult.synced > 0) {
      console.log(`[networkSync] Synced ${progressResult.synced} progress items.`);
    }

    // 4. Resume any paused TanStack mutations
    await queryClient.resumePausedMutations();
  } catch (err) {
    console.warn('[networkSync] Error while synchronizing offline data:', err);
  } finally {
    isSyncing = false;
  }
}

/**
 * Subscribes to network connectivity state changes to auto-retry
 * queued offline mutations immediately upon connection restoration.
 */
export function setupNetworkSyncListener() {
  // Check initial state
  syncAllPendingOfflineData().catch(() => {});

  const subscription = Network.addNetworkStateListener((state) => {
    if (state.isConnected && state.isInternetReachable !== false) {
      syncAllPendingOfflineData().catch(() => {});
    }
  });

  return () => {
    subscription.remove();
  };
}
