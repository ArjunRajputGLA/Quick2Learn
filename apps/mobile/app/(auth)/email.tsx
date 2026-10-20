import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ArrowLeft, Mail } from 'lucide-react-native';
import { TextField } from '../../src/components/ui/TextField';
import { Button } from '../../src/components/ui/Button';
import { KeyboardAwareScrollView } from '../../src/components/ui/KeyboardAwareScrollView';
import { authClient } from '../../src/api/auth-client';
import { colors } from '@quick2learn/shared';

export default function EmailScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const handleContinue = async () => {
    Keyboard.dismiss();
    const cleanEmail = email.trim().toLowerCase();

    if (!isValidEmail) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await (authClient as any).emailOTP.sendVerificationOtp({
        email: cleanEmail,
        type: 'sign-in',
      });

      if (res?.error) {
        setError(res.error.message || 'Failed to send OTP to email. Please try again.');
        return;
      }

      router.push({
        pathname: '/(auth)/email-otp' as any,
        params: { email: cleanEmail },
      });
    } catch (err: any) {
      setError(err?.message || 'Failed to send verification code. Please check your network.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.surface }} className="flex-1 bg-surface">
      <StatusBar style="dark" />
      <View style={{ flex: 1 }} className="flex-1">
        {/* Header */}
        <View
          style={{
            paddingHorizontal: 16,
            paddingVertical: 12,
            flexDirection: 'row',
            alignItems: 'center',
            borderBottomWidth: 1,
            borderBottomColor: 'rgba(229, 231, 235, 0.6)',
          }}
          className="px-4 py-3 flex-row items-center border-b border-border/40"
        >
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Back"
            onPress={() => router.back()}
            style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 20 }}
            className="w-10 h-10 items-center justify-center rounded-full active:bg-surface-subtle"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <ArrowLeft size={22} color={colors.ink} />
          </TouchableOpacity>
          <Text
            style={{ fontSize: 16, fontWeight: '600', color: colors.ink, marginLeft: 8 }}
            className="text-body font-semibold text-ink ml-2"
          >
            Email Sign In
          </Text>
        </View>

        <KeyboardAwareScrollView
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: 24,
            paddingTop: 24,
            paddingBottom: 32,
            justifyContent: 'space-between',
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
            <View>
              {/* Title & Description */}
              <View style={{ marginBottom: 32 }} className="mb-8">
                <Text
                  style={{ fontSize: 22, fontWeight: '700', color: colors.ink, marginBottom: 8 }}
                  className="text-h2 font-bold text-ink mb-2"
                >
                  Sign in with email
                </Text>
                <Text
                  style={{ fontSize: 14, color: colors['ink-muted'], lineHeight: 20 }}
                  className="text-body text-ink-muted"
                >
                  We will send a 6-digit code to your email address
                </Text>
              </View>

              {/* Email Input */}
              <View style={{ gap: 4 }}>
                <TextField
                  label="Email Address"
                  placeholder="name@example.com"
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (error) setError(null);
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoFocus
                  returnKeyType="done"
                  onSubmitEditing={handleContinue}
                  error={error || undefined}
                  leftIcon={<Mail size={20} color="#9CA3AF" />}
                  clearable
                />
              </View>
            </View>

            {/* Submit Button */}
            <View style={{ width: '100%', marginTop: 24 }} className="w-full">
              <Button
                variant="primary"
                size="lg"
                fullWidth
                disabled={!isValidEmail || isLoading}
                loading={isLoading}
                onPress={handleContinue}
              >
                Send Code
              </Button>
            </View>
          </KeyboardAwareScrollView>
        </View>
      </SafeAreaView>
    );
  }
