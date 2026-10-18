import React, { useEffect } from 'react';
import { View, ActivityIndicator, Image, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMe } from '../src/api/hooks';

export default function RootIndex() {
  const router = useRouter();
  const { data: me, isLoading, error } = useMe();

  useEffect(() => {
    if (isLoading) return;

    if (error || !me?.user) {
      // Unauthenticated -> send to auth welcome screen
      router.replace('/(auth)/welcome' as any);
    } else if (!me.profile?.onboardedAt) {
      // Authenticated but not onboarded -> send to onboarding wizard
      router.replace('/(onboarding)' as any);
    } else {
      // Authenticated and onboarded -> send to main app
      router.replace('/(app)' as any);
    }
  }, [me, isLoading, error, router]);

  return (
    <SafeAreaView className="flex-1 bg-surface items-center justify-center p-6">
      <View className="items-center">
        <View className="w-20 h-20 rounded-2xl bg-primary-soft items-center justify-center p-2 mb-4 border border-primary/20">
          <Image
            source={require('../assets/logo.png')}
            className="w-full h-full rounded-xl"
            resizeMode="contain"
          />
        </View>
        <Text className="text-h3 font-bold text-ink mb-1">
          Quick2Learn
        </Text>
        <Text className="text-caption text-ink-muted mb-6">
          Learn Maths the quick and easy way
        </Text>
        <ActivityIndicator size="small" color="#3B82F6" />
      </View>
    </SafeAreaView>
  );
}
