import '../src/global.css';
import React, { useEffect } from 'react';
import { Slot } from 'expo-router';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import Constants from 'expo-constants';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import {
  NotoSansDevanagari_400Regular,
  NotoSansDevanagari_500Medium,
  NotoSansDevanagari_600SemiBold,
  NotoSansDevanagari_700Bold,
} from '@expo-google-fonts/noto-sans-devanagari';

import { queryClient, sqlitePersister, setupQueryClientAppStateFocus, TWENTY_FOUR_HOURS_MS } from '../src/lib/queryClient';
import { setupNotificationListeners } from '../src/lib/notifications';
import { setupNetworkSyncListener } from '../src/lib/network-sync';
import { initSentry, Sentry } from '../src/lib/sentry';
import { analytics } from '../src/lib/analytics';
import { ErrorBoundary } from '../src/components/ErrorBoundary';
import { GlobalAppStatusGuard } from '../src/components/composite/GlobalAppStatusGuard';

// Initialize Sentry with strict PII scrubbing early in app lifecycle
initSentry();

// Keep the splash screen visible while loading resources
SplashScreen.preventAutoHideAsync().catch(() => {
  // Splash screen might already be hidden or not available in dev client
});

function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    NotoSansDevanagari_400Regular,
    NotoSansDevanagari_500Medium,
    NotoSansDevanagari_600SemiBold,
    NotoSansDevanagari_700Bold,
  });

  useEffect(() => {
    const cleanupFocus = setupQueryClientAppStateFocus();
    const cleanupNotifications = setupNotificationListeners();
    const cleanupNetworkSync = setupNetworkSyncListener();

    // Fire app_open analytics event
    analytics.track('app_open', {
      coldStart: true,
      appVersion: Constants.expoConfig?.version || '1.0.0',
    });

    return () => {
      cleanupFocus();
      cleanupNotifications();
      cleanupNetworkSync();
    };
  }, []);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <PersistQueryClientProvider
          client={queryClient}
          persistOptions={{
            persister: sqlitePersister,
            maxAge: TWENTY_FOUR_HOURS_MS,
            buster: 'v1.0.0',
          }}
        >
          <ErrorBoundary>
            <GlobalAppStatusGuard>
              <Slot />
            </GlobalAppStatusGuard>
          </ErrorBoundary>
        </PersistQueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default Sentry.wrap(RootLayout);
