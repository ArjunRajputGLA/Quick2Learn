import React, { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as SecureStore from 'expo-secure-store';
import { useMe, DEMO_MODE_STORAGE_KEY, ACTIVE_USER_STORAGE_KEY } from '../src/api/hooks';
import { BookLoader } from '../src/components/ui/BookLoader';

import { colors } from '@quick2learn/shared';

export default function RootIndex() {
  const router = useRouter();
  const { data: me, isLoading, error } = useMe();
  const navigatedRef = React.useRef(false);

  useEffect(() => {
    let isMounted = true;

    // Instant local session check from SecureStore (executes in <15ms)
    const checkFastLocalSession = async () => {
      try {
        const [demoVal, activeUserRaw] = await Promise.all([
          SecureStore.getItemAsync(DEMO_MODE_STORAGE_KEY).catch(() => null),
          SecureStore.getItemAsync(ACTIVE_USER_STORAGE_KEY).catch(() => null),
        ]);

        if (!isMounted || navigatedRef.current) return;

        if (demoVal === 'true') {
          navigatedRef.current = true;
          router.replace('/(app)' as any);
          return;
        }

        if (activeUserRaw) {
          try {
            const activeUser = JSON.parse(activeUserRaw);
            if (activeUser?.user) {
              navigatedRef.current = true;
              if (!activeUser.profile?.onboardedAt) {
                router.replace('/(onboarding)' as any);
              } else {
                router.replace('/(app)' as any);
              }
              return;
            }
          } catch {}
        }
      } catch (err) {
        console.warn('[RootIndex] Fast check error:', err);
      }
    };

    checkFastLocalSession();

    // Fast fallback: if neither session nor API resolves within 800ms, route to welcome screen
    const safetyTimer = setTimeout(() => {
      if (!isMounted || navigatedRef.current) return;
      navigatedRef.current = true;
      router.replace('/(auth)/welcome' as any);
    }, 800);

    return () => {
      isMounted = false;
      clearTimeout(safetyTimer);
    };
  }, []);

  useEffect(() => {
    if (isLoading || navigatedRef.current) return;

    navigatedRef.current = true;
    if (error || !me?.user) {
      router.replace('/(auth)/welcome' as any);
    } else if (!me.profile?.onboardedAt) {
      router.replace('/(onboarding)' as any);
    } else {
      router.replace('/(app)' as any);
    }
  }, [me, isLoading, error, router]);

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', padding: 24 }}
      className="flex-1 bg-surface items-center justify-center p-6"
    >
      <StatusBar style="dark" />
      <BookLoader text="Loading" size="lg" />
    </SafeAreaView>
  );
}
