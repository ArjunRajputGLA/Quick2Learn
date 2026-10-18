import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Phone, ShieldCheck } from 'lucide-react-native';
import { TextField } from '../../src/components/ui/TextField';
import { Button } from '../../src/components/ui/Button';
import { authClient } from '../../src/api/auth-client';

export default function PhoneScreen() {
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Validate Indian 10-digit phone number starting with 6-9
  const isValidNumber = /^[6-9]\d{9}$/.test(phoneNumber.trim());

  const handlePhoneChange = (text: string) => {
    // Only allow digits up to 10
    const cleaned = text.replace(/\D/g, '').slice(0, 10);
    setPhoneNumber(cleaned);
    if (error) setError(null);
  };

  const handleContinue = async () => {
    Keyboard.dismiss();
    const digits = phoneNumber.trim();

    if (!isValidNumber) {
      setError('Please enter a valid 10-digit Indian mobile number');
      return;
    }

    const fullE164 = `+91${digits}`;
    setIsLoading(true);
    setError(null);

    try {
      const res = await (authClient as any).phoneNumber.sendOtp({
        phoneNumber: fullE164,
      });

      if (res?.error) {
        setError(res.error.message || 'Failed to send verification code. Please try again.');
        return;
      }

      router.push({
        pathname: '/(auth)/otp' as any,
        params: { phone: fullE164 },
      });
    } catch (err: any) {
      setError(err?.message || 'Failed to send verification code. Please check your network.');
    } finally {
      setIsLoading(false);
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
              Sign In
            </Text>
          </View>

          <View className="flex-1 px-6 pt-6 justify-between pb-8">
            <View>
              {/* Title & Description */}
              <View className="mb-8">
                <Text className="text-h2 font-bold text-ink mb-2">
                  Enter your mobile number
                </Text>
                <Text className="text-body text-ink-muted">
                  We will send a 6-digit OTP to verify your account
                </Text>
              </View>

              {/* Fixed +91 Prefix & 10-Digit Input */}
              <View className="space-y-1">
                <Text className="text-small font-medium text-ink mb-1.5">
                  Mobile Number
                </Text>

                <View className="flex-row items-center">
                  {/* Fixed +91 country badge */}
                  <View className="h-12 px-3.5 bg-surface-subtle border border-border rounded-lg items-center justify-center mr-2 flex-row space-x-1.5">
                    <Text className="text-body">🇮🇳</Text>
                    <Text className="text-body font-semibold text-ink">
                      +91
                    </Text>
                  </View>

                  {/* 10-digit numeric input */}
                  <View className="flex-1">
                    <TextField
                      placeholder="98765 43210"
                      value={phoneNumber}
                      onChangeText={handlePhoneChange}
                      keyboardType="number-pad"
                      maxLength={10}
                      autoFocus
                      returnKeyType="done"
                      onSubmitEditing={handleContinue}
                      clearable
                    />
                  </View>
                </View>

                {error ? (
                  <Text className="text-caption text-danger mt-1 font-medium">
                    {error}
                  </Text>
                ) : (
                  <Text className="text-caption text-ink-muted mt-1">
                    Valid for all Indian SIM cards (Airtel, Jio, Vi, BSNL)
                  </Text>
                )}
              </View>

              <View className="flex-row items-center mt-6 p-3 bg-primary-soft/40 rounded-xl border border-primary/10">
                <ShieldCheck size={18} color="#3B82F6" />
                <Text className="text-caption text-ink-muted ml-2 flex-1">
                  Your number is secured and will never be shared without consent.
                </Text>
              </View>
            </View>

            {/* Submit Button */}
            <View className="w-full">
              <Button
                variant="primary"
                size="lg"
                fullWidth
                disabled={!isValidNumber || isLoading}
                loading={isLoading}
                onPress={handleContinue}
              >
                Continue
              </Button>
            </View>
          </View>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}
