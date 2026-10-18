import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, RefreshCw } from 'lucide-react-native';
import { useQueryClient } from '@tanstack/react-query';
import { OtpInput } from '../../src/components/ui/OtpInput';
import { Button } from '../../src/components/ui/Button';
import { authClient } from '../../src/api/auth-client';
import { queryKeys } from '../../src/api/hooks';

export default function OtpScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const params = useLocalSearchParams<{ phone: string }>();
  const phone = params.phone || '';

  const [otp, setOtp] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(30);

  // Timer countdown for 30s resend cooldown
  useEffect(() => {
    let timer: any;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown((prev) => prev - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  // Handle auto-submission when all 6 digits are typed/autofilled
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
      const res = await (authClient as any).phoneNumber.verify({
        phoneNumber: phone,
        code: codeToVerify,
      });

      if (res?.error) {
        setError(mapErrorMessage(res.error));
        setIsVerifying(false);
        return;
      }

      // Invalidate me query to fetch latest profile status
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
      const res = await (authClient as any).phoneNumber.sendOtp({
        phoneNumber: phone,
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
    <SafeAreaView className="flex-1 bg-surface">
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          className="flex-1"
        >
          {/* Header */}
          <View className="px-4 py-3 flex-row items-center border-b border-border/40">
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Back"
              onPress={() => router.back()}
              className="w-10 h-10 items-center justify-center rounded-full active:bg-surface-subtle"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <ArrowLeft size={22} color="#1F2937" />
            </TouchableOpacity>
            <Text className="text-body font-semibold text-ink ml-2">
              Verification
            </Text>
          </View>

          <View className="flex-1 px-6 pt-6 justify-between pb-8">
            <View>
              {/* Title & Phone Display */}
              <View className="mb-8">
                <Text className="text-h2 font-bold text-ink mb-2">
                  Verify mobile number
                </Text>
                <Text className="text-body text-ink-muted">
                  Enter the 6-digit code sent to{' '}
                  <Text className="font-semibold text-ink">{phone}</Text>
                </Text>

                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel="Change phone number"
                  onPress={() => router.replace('/(auth)/phone' as any)}
                  className="mt-2 self-start py-1"
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text className="text-small font-semibold text-primary">
                    Change number
                  </Text>
                </TouchableOpacity>
              </View>

              {/* 6-box OTP Input */}
              <View className="py-2">
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
              <View className="items-center mt-6">
                {countdown > 0 ? (
                  <Text className="text-small text-ink-muted">
                    Resend code in{' '}
                    <Text className="font-bold text-ink">{countdown}s</Text>
                  </Text>
                ) : (
                  <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel="Resend code"
                    onPress={handleResend}
                    disabled={isResending}
                    className="flex-row items-center space-x-1.5 py-1"
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <RefreshCw size={14} color="#3B82F6" />
                    <Text className="text-small font-semibold text-primary">
                      {isResending ? 'Sending...' : 'Resend code'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Verify Button */}
            <View className="w-full">
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
          </View>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}
