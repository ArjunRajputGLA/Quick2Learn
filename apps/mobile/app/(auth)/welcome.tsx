import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Phone, Mail, Zap } from 'lucide-react-native';
import * as SecureStore from 'expo-secure-store';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '../../src/components/ui/Button';
import {
  useAppConfig,
  DEMO_MODE_STORAGE_KEY,
  DEMO_USER_ME,
  DEMO_HOME_DATA,
  DEMO_STUDENT_STATS,
  DEMO_BATCHES_DATA,
  DEMO_LEARN_CLASSES,
  queryKeys,
} from '../../src/api/hooks';
import { authClient } from '../../src/api/auth-client';

import { colors, radii } from '@quick2learn/shared';

export default function WelcomeScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: config, isLoading: isConfigLoading } = useAppConfig();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isDirectLoading, setIsDirectLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Phone login is enabled by default unless explicitly turned off via feature flag
  const isPhoneLoginEnabled =
    config?.featureFlags?.enablePhoneLogin !== false;

  const handleDirectSignIn = async () => {
    try {
      setIsDirectLoading(true);
      setAuthError(null);
      // Store demo mode flag so session persists
      await SecureStore.setItemAsync(DEMO_MODE_STORAGE_KEY, 'true').catch(() => {});
      // Prime React Query caches immediately with rich mock student session
      queryClient.setQueryData(queryKeys.me, DEMO_USER_ME);
      queryClient.setQueryData(queryKeys.home, DEMO_HOME_DATA);
      queryClient.setQueryData(queryKeys.studentStats(), DEMO_STUDENT_STATS);
      queryClient.setQueryData(queryKeys.batchesMine, DEMO_BATCHES_DATA);
      queryClient.setQueryData(queryKeys.learnClasses, DEMO_LEARN_CLASSES);

      // Route directly into the main app tabs
      router.replace('/(app)' as any);
    } catch (err: any) {
      console.warn('Direct sign-in error:', err);
      router.replace('/(app)' as any);
    } finally {
      setIsDirectLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setAuthError(null);
      setIsGoogleLoading(true);
      const res = await authClient.signIn.social({
        provider: 'google',
        callbackURL: '/',
      });

      // On Android it doesn't navigate by itself, so route manually after it resolves
      if (res?.error) {
        setAuthError(res.error.message || 'Google sign-in failed. Please try again.');
      } else {
        router.replace('/(app)' as any);
      }
    } catch (err: any) {
      setAuthError(err?.message || 'Google sign-in failed. Please try again.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.surface }} className="flex-1 bg-surface">
      <StatusBar style="dark" />
      <View
        style={{ flex: 1, paddingHorizontal: 24, paddingVertical: 24, justifyContent: 'space-between' }}
        className="flex-1 px-6 justify-between py-6"
      >
        {/* Top Branding Section */}
        <View style={{ alignItems: 'center', marginTop: 24 }} className="items-center mt-8">
          <View
            style={{
              width: 88,
              height: 88,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 20,
            }}
            className="w-22 h-22 items-center justify-center mb-5"
          >
            <Image
              source={require('../../assets/logo.png')}
              style={{ width: 88, height: 88 }}
              resizeMode="contain"
            />
          </View>

          <Text
            style={{
              fontSize: 26,
              fontWeight: '800',
              color: colors.ink,
              textAlign: 'center',
              letterSpacing: -0.5,
            }}
            className="text-h1 font-bold text-ink text-center tracking-tight"
          >
            Quick2Learn
          </Text>

          <Text
            style={{
              fontSize: 15,
              color: colors['ink-muted'],
              textAlign: 'center',
              marginTop: 10,
              lineHeight: 22,
              paddingHorizontal: 16,
            }}
            className="text-body text-ink-muted text-center mt-3 leading-6 px-4"
          >
            Learn Maths the quick and easy way with Dinesh Sir
          </Text>
        </View>

        {/* Action Buttons Section */}
        <View style={{ width: '100%', gap: 14, marginBottom: 16 }} className="w-full space-y-3.5 mb-6">
          {authError && (
            <View
              style={{
                backgroundColor: 'rgba(185, 28, 28, 0.1)',
                padding: 12,
                borderRadius: radii.md,
                borderWidth: 1,
                borderColor: 'rgba(185, 28, 28, 0.2)',
                marginBottom: 8,
              }}
              className="bg-danger-soft p-3 rounded-xl border border-danger/20 mb-2"
            >
              <Text
                style={{ fontSize: 13, color: colors.danger, textAlign: 'center', fontWeight: '500' }}
                className="text-caption text-danger text-center font-medium"
              >
                {authError}
              </Text>
            </View>
          )}

          {/* Direct Sign-In (No Credentials) */}
          <Button
            variant="primary"
            size="lg"
            fullWidth
            loading={isDirectLoading}
            onPress={handleDirectSignIn}
            icon={<Zap size={20} color="#FFFFFF" />}
          >
            Direct Sign In
          </Button>

          {/* Phone Sign-In (shown unless disabled in /app/config) */}
          {isPhoneLoginEnabled && (
            <Button
              variant="outline"
              size="lg"
              fullWidth
              onPress={() => router.push('/(auth)/phone' as any)}
              icon={<Phone size={20} color={colors.primary} />}
            >
              Continue with phone
            </Button>
          )}

          {/* Google Sign-In */}
          <Button
            variant="secondary"
            size="lg"
            fullWidth
            loading={isGoogleLoading}
            onPress={handleGoogleSignIn}
          >
            Continue with Google
          </Button>

          {/* Email Fallback Link */}
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Use email instead"
            onPress={() => router.push('/(auth)/email' as any)}
            style={{ paddingVertical: 12, alignItems: 'center', justifyContent: 'center' }}
            className="py-3 items-center justify-center"
            hitSlop={{ top: 10, bottom: 10, left: 16, right: 16 }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }} className="flex-row items-center space-x-1.5">
              <Mail size={16} color={colors['ink-muted']} />
              <Text
                style={{ fontSize: 14, fontWeight: '500', color: colors['ink-muted'] }}
                className="text-small font-medium text-ink-muted"
              >
                Use email instead
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
