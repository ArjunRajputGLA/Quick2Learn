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
import { ArrowLeft, Mail } from 'lucide-react-native';
import { TextField } from '../../src/components/ui/TextField';
import { Button } from '../../src/components/ui/Button';
import { authClient } from '../../src/api/auth-client';

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
              Email Sign In
            </Text>
          </View>

          <View className="flex-1 px-6 pt-6 justify-between pb-8">
            <View>
              {/* Title & Description */}
              <View className="mb-8">
                <Text className="text-h2 font-bold text-ink mb-2">
                  Sign in with email
                </Text>
                <Text className="text-body text-ink-muted">
                  We will send a 6-digit code to your email address
                </Text>
              </View>

              {/* Email Input */}
              <View className="space-y-1">
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
            <View className="w-full">
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
          </View>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}
