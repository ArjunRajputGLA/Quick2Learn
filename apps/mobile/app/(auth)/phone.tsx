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
import { ArrowLeft, Phone, ShieldCheck } from 'lucide-react-native';
import { TextField } from '../../src/components/ui/TextField';
import { Button } from '../../src/components/ui/Button';
import { authClient } from '../../src/api/auth-client';

import { colors, radii } from '@quick2learn/shared';

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
      } else {
        router.push({
          pathname: '/(auth)/otp' as any,
          params: { phone: fullE164 },
        });
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to send verification code. Please check your network.');
    } finally {
      setIsLoading(false);
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
              Sign In
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
              {/* Title & Description */}
              <View style={{ marginBottom: 32 }} className="mb-8">
                <Text
                  style={{ fontSize: 22, fontWeight: '700', color: colors.ink, marginBottom: 8 }}
                  className="text-h2 font-bold text-ink mb-2"
                >
                  Enter your mobile number
                </Text>
                <Text
                  style={{ fontSize: 14, color: colors['ink-muted'], lineHeight: 20 }}
                  className="text-body text-ink-muted"
                >
                  We will send a 6-digit OTP to verify your account
                </Text>
              </View>

              {/* Fixed +91 Prefix & 10-Digit Input */}
              <View style={{ gap: 4 }}>
                <Text
                  style={{ fontSize: 13, fontWeight: '500', color: colors.ink, marginBottom: 6 }}
                  className="text-small font-medium text-ink mb-1.5"
                >
                  Mobile Number
                </Text>

                <View style={{ flexDirection: 'row', alignItems: 'center' }} className="flex-row items-center">
                  {/* Fixed +91 country badge */}
                  <View
                    style={{
                      height: 48,
                      paddingHorizontal: 14,
                      backgroundColor: colors['surface-subtle'],
                      borderWidth: 1,
                      borderColor: colors.border,
                      borderRadius: radii.md,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 8,
                      flexDirection: 'row',
                      gap: 6,
                    }}
                    className="h-12 px-3.5 bg-surface-subtle border border-border rounded-lg items-center justify-center mr-2 flex-row space-x-1.5"
                  >
                    <Text style={{ fontSize: 16 }} className="text-body">🇮🇳</Text>
                    <Text
                      style={{ fontSize: 15, fontWeight: '600', color: colors.ink }}
                      className="text-body font-semibold text-ink"
                    >
                      +91
                    </Text>
                  </View>

                  {/* 10-digit numeric input */}
                  <View style={{ flex: 1 }} className="flex-1">
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
                  <Text
                    style={{ fontSize: 12, color: colors.danger, marginTop: 4, fontWeight: '500' }}
                    className="text-caption text-danger mt-1 font-medium"
                  >
                    {error}
                  </Text>
                ) : (
                  <Text
                    style={{ fontSize: 12, color: colors['ink-muted'], marginTop: 4 }}
                    className="text-caption text-ink-muted mt-1"
                  >
                    Valid for all Indian SIM cards (Airtel, Jio, Vi, BSNL)
                  </Text>
                )}
              </View>

              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginTop: 24,
                  padding: 12,
                  backgroundColor: 'rgba(239, 246, 255, 0.6)',
                  borderRadius: radii.lg,
                  borderWidth: 1,
                  borderColor: 'rgba(59, 130, 246, 0.15)',
                  gap: 8,
                }}
                className="flex-row items-center mt-6 p-3 bg-primary-soft/40 rounded-xl border border-primary/10"
              >
                <ShieldCheck size={18} color="#3B82F6" />
                <Text
                  style={{ fontSize: 12, color: colors['ink-muted'], flex: 1, lineHeight: 18 }}
                  className="text-caption text-ink-muted ml-2 flex-1"
                >
                  Your number is secured and will never be shared without consent.
                </Text>
              </View>
            </View>

            {/* Submit Button */}
            <View style={{ width: '100%', marginTop: 24 }} className="w-full">
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
          </ScrollView>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}
