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
import { Phone, Mail, Sparkles } from 'lucide-react-native';
import { Button } from '../../src/components/ui/Button';
import { useAppConfig } from '../../src/api/hooks';
import { authClient } from '../../src/api/auth-client';

export default function WelcomeScreen() {
  const router = useRouter();
  const { data: config, isLoading: isConfigLoading } = useAppConfig();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Phone login is enabled by default unless explicitly turned off via feature flag
  const isPhoneLoginEnabled =
    config?.featureFlags?.enablePhoneLogin !== false;

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
    <SafeAreaView className="flex-1 bg-surface">
      <View className="flex-1 px-6 justify-between py-6">
        {/* Top Branding Section */}
        <View className="items-center mt-8">
          <View className="w-24 h-24 rounded-3xl bg-primary-soft items-center justify-center p-2 mb-6 shadow-sm border border-primary/20">
            <Image
              source={require('../../assets/logo.png')}
              className="w-full h-full rounded-2xl"
              resizeMode="contain"
            />
          </View>

          <View className="flex-row items-center space-x-1.5 mb-2 bg-primary-soft/50 px-3 py-1 rounded-full border border-primary/15">
            <Sparkles size={14} color="#3B82F6" />
            <Text className="text-caption font-semibold text-primary uppercase tracking-wide">
              Quick2Learn
            </Text>
          </View>

          <Text className="text-h1 font-bold text-ink text-center tracking-tight">
            Quick2Learn
          </Text>

          <Text className="text-body text-ink-muted text-center mt-3 leading-6 px-4">
            Learn Maths the quick and easy way with Dinesh Sir
          </Text>
        </View>

        {/* Action Buttons Section */}
        <View className="w-full space-y-3.5 mb-6">
          {authError && (
            <View className="bg-danger-soft p-3 rounded-xl border border-danger/20 mb-2">
              <Text className="text-caption text-danger text-center font-medium">
                {authError}
              </Text>
            </View>
          )}

          {/* Phone Sign-In (Primary, shown unless disabled in /app/config) */}
          {isPhoneLoginEnabled && (
            <Button
              variant="primary"
              size="lg"
              fullWidth
              onPress={() => router.push('/(auth)/phone' as any)}
              icon={<Phone size={20} color="#FFFFFF" />}
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
            className="py-3 items-center justify-center"
            hitSlop={{ top: 10, bottom: 10, left: 16, right: 16 }}
          >
            <View className="flex-row items-center space-x-1.5">
              <Mail size={16} color="#6B7280" />
              <Text className="text-small font-medium text-ink-muted">
                Use email instead
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
