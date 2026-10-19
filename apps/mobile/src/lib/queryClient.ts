import { QueryClient, focusManager } from '@tanstack/react-query';
import { AppState, AppStateStatus, Platform } from 'react-native';
import { sqlitePersister } from './sqlite-persister';

export const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes fresh
      gcTime: TWENTY_FOUR_HOURS_MS, // 24-hour cache retention
      networkMode: 'offlineFirst', // Always serve from cache first when offline
      retry: 2,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
    mutations: {
      networkMode: 'offlineFirst',
      retry: 3,
    },
  },
});

export { sqlitePersister };

/**
 * Configure React Query to refetch when app transitions from background to active (foreground).
 */
export function setupQueryClientAppStateFocus() {
  function onAppStateChange(status: AppStateStatus) {
    if (Platform.OS !== 'web') {
      focusManager.setFocused(status === 'active');
    }
  }

  const subscription = AppState.addEventListener('change', onAppStateChange);
  return () => subscription.remove();
}
