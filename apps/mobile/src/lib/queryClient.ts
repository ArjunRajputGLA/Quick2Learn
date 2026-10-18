import { QueryClient, focusManager } from '@tanstack/react-query';
import { AppState, AppStateStatus, Platform } from 'react-native';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 60 seconds
      retry: 2,
      refetchOnWindowFocus: true,
    },
  },
});

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
