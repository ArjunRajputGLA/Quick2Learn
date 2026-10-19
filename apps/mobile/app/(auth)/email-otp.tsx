import React, { useState, useEffect } from 'react';
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
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ArrowLeft, RefreshCw } from 'lucide-react-native';
import { useQueryClient } from '@tanstack/react-query';
import { OtpInput } from '../../src/components/ui/OtpInput';
import { Button } from '../../src/components/ui/Button';
import { authClient } from '../../src/api/auth-client';
import { queryKeys } from '../../src/api/hooks';
import { colors } from '@quick2learn/shared';

export default function EmailOtpScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const params = useLocalSearchParams<{ email: string }>();
  const email = params.email || '';

  const [otp, setOtp] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(30);

  useEffect(() => {
    let timer: any;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown((prev) => prev - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  useEffect(() => {
    if (otp.length === 6 && !isVerifying) {
      handleVerify(otp);
    }
  }, [otp]);

  const mapErrorMessage = (rawError: any): string => {
    const msg = (rawError?.message || rawError?.statusText || '').toLowerCase();
    const code = (rawError?.code || '').toLowerCase();

    if (code.includes('expired') || msg.includes('expired')) {
      return 'Verification code has expired. Please request a new code.';
    }
    if (
      code.includes('too_many') ||
      msg.includes('too many') ||
      msg.includes('rate limit') ||
      rawError?.status === 429
    ) {
      return 'Too many failed attempts. Please request a new code or try again later.';
    }
    if (code.includes('invalid') || msg.includes('invalid') || msg.includes('incorrect') || msg.includes('wrong')) {
      return 'Incorrect verification code. Please check and try again.';
    }
    return rawError?.message || 'Verification failed. Please try again.';
  };

  const handleVerify = async (codeToVerify = otp) => {
    Keyboard.dismiss();
    if (codeToVerify.length !== 6) {
      setError('Please enter the complete 6-digit code');
      return;
    }

    setIsVerifying(true);
    setError(null);

    try {
      const res = await (authClient as any).signIn.emailOtp({
        email,
        otp: codeToVerify,
      });

      if (res?.error) {
        setError(mapErrorMessage(res.error));
        setIsVerifying(false);
        return;
      }

      await queryClient.invalidateQueries({ queryKey: queryKeys.me });
      const meData: any = await queryClient.fetchQuery({
        queryKey: queryKeys.me,
      }).catch(() => null);

      if (!meData?.profile?.onboardedAt) {
        router.replace('/(onboarding)' as any);
      } else {
        router.replace('/(app)' as any);
      }
    } catch (err: any) {
      setError(mapErrorMessage(err));
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0 || isResending) return;

    setIsResending(true);
    setError(null);
    setOtp('');

    try {
      const res = await (authClient as any).emailOTP.sendVerificationOtp({
        email,
        type: 'sign-in',
      });

      if (res?.error) {
        setError(mapErrorMessage(res.error));
      } else {
        setCountdown(30);
      }
    } catch (err: any) {
      setError(mapErrorMessage(err));
    } finally {
      setIsResending(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.surface }} className="flex-1 bg-surface">
      <StatusBar style="dark" />
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
          className="flex-1"
        >
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
              Email Verification
            </Text>
          </View>

          <ScrollView
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
              {/* Title & Email Display */}
              <View style={{ marginBottom: 32 }} className="mb-8">
                <Text
                  style={{ fontSize: 22, fontWeight: '700', color: colors.ink, marginBottom: 8 }}
                  className="text-h2 font-bold text-ink mb-2"
                >
                  Check your email
                </Text>
                <Text
                  style={{ fontSize: 14, color: colors['ink-muted'], lineHeight: 20 }}
                  className="text-body text-ink-muted"
                >
                  Enter the 6-digit code sent to{' '}
                  <Text style={{ fontWeight: '600', color: colors.ink }} className="font-semibold text-ink">
                    {email}
                  </Text>
                </Text>

                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel="Change email"
                  onPress={() => router.replace('/(auth)/email' as any)}
                  style={{ marginTop: 8, alignSelf: 'flex-start', paddingVertical: 4 }}
                  className="mt-2 self-start py-1"
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text
                    style={{ fontSize: 13, fontWeight: '600', color: colors.primary }}
                    className="text-small font-semibold text-primary"
                  >
                    Change email
                  </Text>
                </TouchableOpacity>
              </View>

              {/* 6-box OTP Input */}
              <View style={{ paddingVertical: 8 }} className="py-2">
                <OtpInput
                  length={6}
                  value={otp}
                  onChange={(val) => {
                    setOtp(val);
                    if (error) setError(null);
                  }}
                  error={error || undefined}
                  disabled={isVerifying}
                />
              </View>

              {/* 30-Second Countdown & Resend Link */}
              <View style={{ alignItems: 'center', marginTop: 24 }} className="items-center mt-6">
                {countdown > 0 ? (
                  <Text
                    style={{ fontSize: 13, color: colors['ink-muted'] }}
                    className="text-small text-ink-muted"
                  >
                    Resend code in{' '}
                    <Text
                      style={{ fontWeight: '700', color: colors.ink }}
                      className="font-bold text-ink"
                    >
                      {countdown}s
                    </Text>
                  </Text>
                ) : (
                  <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel="Resend code"
                    onPress={handleResend}
                    disabled={isResending}
                    style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 4, gap: 6 }}
                    className="flex-row items-center space-x-1.5 py-1"
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <RefreshCw size={14} color="#3B82F6" />
                    <Text
                      style={{ fontSize: 13, fontWeight: '600', color: colors.primary }}
                      className="text-small font-semibold text-primary"
                    >
                      {isResending ? 'Sending...' : 'Resend code'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Verify Button */}
            <View style={{ width: '100%', marginTop: 24 }} className="w-full">
              <Button
                variant="primary"
                size="lg"
                fullWidth
                disabled={otp.length !== 6 || isVerifying}
                loading={isVerifying}
                onPress={() => handleVerify()}
              >
                Verify & Continue
              </Button>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}
