import React, { useEffect } from 'react';
import { View, ActivityIndicator, Image, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import { useMe, DEMO_MODE_STORAGE_KEY } from '../src/api/hooks';

import { colors, radii } from '@quick2learn/shared';

export default function RootIndex() {
  const router = useRouter();
  const { data: me, isLoading, error } = useMe();

  useEffect(() => {
    if (isLoading) return;

    if (error || !me?.user) {
      SecureStore.getItemAsync(DEMO_MODE_STORAGE_KEY)
        .then((val) => {
          if (val === 'true') {
            router.replace('/(app)' as any);
          } else {
            router.replace('/(auth)/welcome' as any);
          }
        })
        .catch(() => {
          router.replace('/(auth)/welcome' as any);
        });
    } else if (!me.profile?.onboardedAt) {
      // Authenticated but not onboarded -> send to onboarding wizard
      router.replace('/(onboarding)' as any);
    } else {
      // Authenticated and onboarded -> send to main app
      router.replace('/(app)' as any);
    }
  }, [me, isLoading, error, router]);

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', padding: 24 }}
      className="flex-1 bg-surface items-center justify-center p-6"
    >
      <View style={{ alignItems: 'center' }} className="items-center">
        <View
          style={{
            width: 72,
            height: 72,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 16,
          }}
          className="w-18 h-18 items-center justify-center mb-4"
        >
          <Image
            source={require('../assets/logo.png')}
            style={{ width: 72, height: 72 }}
            resizeMode="contain"
          />
        </View>
        <Text
          style={{ fontSize: 20, fontWeight: '700', color: colors.ink, marginBottom: 4 }}
          className="text-h3 font-bold text-ink mb-1"
        >
          Quick2Learn
        </Text>
        <Text
          style={{ fontSize: 13, color: colors['ink-muted'], marginBottom: 24 }}
          className="text-caption text-ink-muted mb-6"
        >
          Learn Maths the quick and easy way
        </Text>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    </SafeAreaView>
  );
}
