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
import { Phone, Mail, Lock, UserPlus, Shield } from 'lucide-react-native';
import * as SecureStore from 'expo-secure-store';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '../../src/components/ui/Button';
import { GoogleIcon } from '../../src/components/ui/GoogleIcon';
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
        <View style={{ width: '100%', gap: 11, marginBottom: 12 }}>
          {authError && (
            <View
              style={{
                backgroundColor: '#FEF2F2',
                padding: 12,
                borderRadius: radii.md,
                borderWidth: 1,
                borderColor: '#FECACA',
                marginBottom: 4,
              }}
            >
              <Text
                style={{ fontSize: 13, color: colors.danger, textAlign: 'center', fontWeight: '500' }}
              >
                {authError}
              </Text>
            </View>
          )}

          {/* 1. Primary: Sign in with Password */}
          <Button
            variant="primary"
            size="lg"
            fullWidth
            onPress={() => router.push('/(auth)/login' as any)}
            icon={<Lock size={19} color="#FFFFFF" />}
            style={{
              height: 50,
              borderRadius: 16,
              shadowColor: '#2563EB',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.22,
              shadowRadius: 8,
              elevation: 4,
            }}
          >
            Sign in with Password
          </Button>

          {/* 2. Continue with phone */}
          {isPhoneLoginEnabled && (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => router.push('/(auth)/phone' as any)}
              accessibilityRole="button"
              accessibilityLabel="Continue with phone"
              style={{
                height: 50,
                width: '100%',
                backgroundColor: '#FFFFFF',
                borderRadius: 16,
                borderWidth: 1.5,
                borderColor: '#E2E8F0',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: '#0F172A',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.04,
                shadowRadius: 4,
                elevation: 1,
                gap: 10,
              }}
            >
              <View
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  backgroundColor: '#ECFDF5',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Phone size={15} color="#059669" />
              </View>
              <Text style={{ fontSize: 15, fontWeight: '700', color: colors.ink }}>
                Continue with phone
              </Text>
            </TouchableOpacity>
          )}

          {/* 3. Continue with Google (with official 4-color Google Icon) */}
          <TouchableOpacity
            activeOpacity={0.8}
            disabled={isGoogleLoading}
            onPress={handleGoogleSignIn}
            accessibilityRole="button"
            accessibilityLabel="Continue with Google"
            style={{
              height: 50,
              width: '100%',
              backgroundColor: '#FFFFFF',
              borderRadius: 16,
              borderWidth: 1.5,
              borderColor: '#E2E8F0',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: '#0F172A',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.04,
              shadowRadius: 4,
              elevation: 1,
              gap: 10,
            }}
          >
            {isGoogleLoading ? (
              <ActivityIndicator size="small" color="#2563EB" />
            ) : (
              <GoogleIcon size={20} />
            )}
            <Text style={{ fontSize: 15, fontWeight: '700', color: colors.ink }}>
              Continue with Google
            </Text>
          </TouchableOpacity>

          {/* Divider with "OR" */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginVertical: 2,
            }}
          >
            <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(226, 232, 240, 0.8)' }} />
            <Text
              style={{
                marginHorizontal: 12,
                fontSize: 11,
                fontWeight: '700',
                color: '#94A3B8',
                textTransform: 'uppercase',
                letterSpacing: 0.8,
              }}
            >
              or
            </Text>
            <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(226, 232, 240, 0.8)' }} />
          </View>

          {/* 4. Register Option (Student / Parent) */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push('/(auth)/register' as any)}
            accessibilityRole="button"
            accessibilityLabel="Register as Student or Parent"
            style={{
              height: 48,
              width: '100%',
              backgroundColor: '#EFF6FF',
              borderRadius: 16,
              borderWidth: 1.5,
              borderColor: '#BFDBFE',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            <UserPlus size={18} color="#2563EB" />
            <Text style={{ fontSize: 14.5, fontWeight: '700', color: '#1D4ED8' }}>
              New user? Create an account
            </Text>
          </TouchableOpacity>

          {/* 5. Use email instead (Email OTP) */}
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Use email instead"
            onPress={() => router.push('/(auth)/email' as any)}
            style={{
              paddingVertical: 8,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 7,
            }}
            hitSlop={{ top: 8, bottom: 8, left: 16, right: 16 }}
          >
            <Mail size={16} color={colors['ink-muted']} />
            <Text style={{ fontSize: 13.5, fontWeight: '600', color: colors['ink-muted'] }}>
              Use email OTP instead
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
