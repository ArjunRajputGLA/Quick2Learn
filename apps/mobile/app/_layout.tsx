import '../src/global.css';
import React, { useEffect } from 'react';
import { View, Platform, StatusBar as RNStatusBar, LogBox } from 'react-native';

LogBox.ignoreLogs([
  'Looks like you have configured linking in multiple places',
]);
import { StatusBar } from 'expo-status-bar';
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

import { BookLoader } from '../src/components/ui/BookLoader';
import { useIsRestoring } from '@tanstack/react-query';
import { ConfirmDialogProvider } from '../src/components/ui/ConfirmModal';
import { SidebarDrawer } from '../src/components/ui/SidebarDrawer';

function AppStartupGate({ children }: { children: React.ReactNode }) {
  const isRestoring = useIsRestoring();

  if (isRestoring) {
    return (
      <View style={{ flex: 1, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center' }}>
        <StatusBar style="dark" />
        <BookLoader text="Loading" size="lg" />
      </View>
    );
  }

  return <>{children}</>;
}

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

  const [fontTimeout, setFontTimeout] = React.useState(false);

  useEffect(() => {
    // Safety latch: don't block app start for more than 500ms waiting for web fonts
    const timer = setTimeout(() => {
      setFontTimeout(true);
      SplashScreen.hideAsync().catch(() => {});
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const cleanupFocus = setupQueryClientAppStateFocus();
    const cleanupNotifications = setupNotificationListeners();
    const cleanupNetworkSync = setupNetworkSyncListener();

    // Ensure status bar text and icons are always dark/black across the app
    if (Platform.OS === 'android') {
      RNStatusBar.setBarStyle('dark-content');
    }

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
    if (fontsLoaded || fontError || fontTimeout) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError, fontTimeout]);

  if (!fontsLoaded && !fontError && !fontTimeout) {
    return (
      <View style={{ flex: 1, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center' }}>
        <StatusBar style="dark" />
        <BookLoader text="Loading" size="lg" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="dark" />
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
              <AppStartupGate>
                <ConfirmDialogProvider>
                  <View style={{ flex: 1, position: 'relative' }}>
                    <Slot />
                    <SidebarDrawer />
                  </View>
                </ConfirmDialogProvider>
              </AppStartupGate>
            </GlobalAppStatusGuard>
          </ErrorBoundary>
        </PersistQueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default (__DEV__ || !process.env.EXPO_PUBLIC_SENTRY_DSN)
  ? RootLayout
  : (Sentry?.wrap ? Sentry.wrap(RootLayout) : RootLayout);
