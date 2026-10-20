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
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  GraduationCap,
  Users,
  Check,
  Building,
  KeyRound,
} from 'lucide-react-native';
import * as SecureStore from 'expo-secure-store';
import { useQueryClient } from '@tanstack/react-query';
import { TextField } from '../../src/components/ui/TextField';
import { Button } from '../../src/components/ui/Button';
import {
  ACTIVE_USER_STORAGE_KEY,
  DEMO_MODE_STORAGE_KEY,
  queryKeys,
} from '../../src/api/hooks';
import { colors, radii } from '@quick2learn/shared';

type RegisterRole = 'student' | 'parent';
const CLASS_OPTIONS = [9, 10, 11, 12];
const BOARD_OPTIONS: ('cbse' | 'icse')[] = ['cbse', 'icse'];

export default function RegisterScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [role, setRole] = useState<RegisterRole>('student');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Student specific
  const [classLevel, setClassLevel] = useState<number>(10);
  const [board, setBoard] = useState<'cbse' | 'icse'>('cbse');
  const [school, setSchool] = useState('');

  // Parent specific
  const [childInviteCode, setChildInviteCode] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async () => {
    Keyboard.dismiss();
    setError(null);

    const cleanName = fullName.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.trim().replace(/\D/g, '');
    const cleanPassword = password.trim();

    if (cleanName.length < 2) {
      setError('Please enter your full name (at least 2 characters)');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setError('Please enter a valid email address');
      return;
    }

    if (cleanPhone.length < 10) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }

    if (cleanPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (cleanPassword !== confirmPassword.trim()) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    setIsLoading(true);

    try {
      const newAccountId = `user-${Date.now()}`;
      const newProfileId = `profile-${Date.now()}`;

      const newAccountRecord = {
        id: newAccountId,
        fullName: cleanName,
        email: cleanEmail,
        phone: cleanPhone.startsWith('+91') ? cleanPhone : `+91${cleanPhone.slice(-10)}`,
        password: cleanPassword,
        role,
        classLevel: role === 'student' ? classLevel : null,
        board: role === 'student' ? board : null,
        school: role === 'student' ? school.trim() || 'Quick2Learn High' : null,
        childInviteCode: role === 'parent' ? childInviteCode.trim() : null,
        createdAt: new Date().toISOString(),
      };

      // Persist in list of registered accounts
      const existingAccountsJson = await SecureStore.getItemAsync(
        'q2l_registered_accounts'
      ).catch(() => null);
      let accountsList: any[] = [];
      if (existingAccountsJson) {
        try {
          accountsList = JSON.parse(existingAccountsJson);
        } catch {}
      }

      // Check if email already registered
      const existingIndex = accountsList.findIndex(
        (a) => a.email?.toLowerCase() === cleanEmail
      );
      if (existingIndex >= 0) {
        accountsList[existingIndex] = newAccountRecord;
      } else {
        accountsList.push(newAccountRecord);
      }

      await SecureStore.setItemAsync(
        'q2l_registered_accounts',
        JSON.stringify(accountsList)
      );

      // Create MeResponse object
      const userProfile = {
        user: {
          id: newAccountId,
          email: cleanEmail,
          name: cleanName,
          image: null,
          phoneNumber: newAccountRecord.phone,
          phoneNumberVerified: true,
          emailVerified: true,
          createdAt: newAccountRecord.createdAt,
          updatedAt: newAccountRecord.createdAt,
        },
        profile: {
          id: newProfileId,
          userId: newAccountId,
          fullName: cleanName,
          phone: newAccountRecord.phone,
          role,
          classLevel: role === 'student' ? classLevel : null,
          board: role === 'student' ? board : null,
          school: role === 'student' ? newAccountRecord.school : null,
          parentName: null,
          parentPhone: null,
          city: 'Bhopal',
          avatarUrl: null,
          onboardedAt: newAccountRecord.createdAt,
          createdAt: newAccountRecord.createdAt,
          updatedAt: newAccountRecord.createdAt,
        },
        role,
        linkedStudents:
          role === 'parent'
            ? [
                {
                  id: 'linked-student-demo',
                  userId: 'user-linked-student-demo',
                  fullName: 'Student Demo',
                  classLevel: 10,
                  board: 'cbse' as const,
                  school: 'Quick2Learn High',
                  avatarUrl: null,
                },
              ]
            : [],
      };

      // Set active user session
      await SecureStore.setItemAsync(
        ACTIVE_USER_STORAGE_KEY,
        JSON.stringify(userProfile)
      );
      await SecureStore.setItemAsync(DEMO_MODE_STORAGE_KEY, 'true').catch(() => {});
      queryClient.setQueryData(queryKeys.me, userProfile);

      // Route into app
      router.replace('/(app)' as any);
    } catch (err: any) {
      setError(err?.message || 'Failed to create account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.surface }}>
      <StatusBar style="dark" />
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
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
          >
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Back"
              onPress={() => router.back()}
              style={{
                width: 40,
                height: 40,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 20,
              }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <ArrowLeft size={22} color={colors.ink} />
            </TouchableOpacity>
            <Text
              style={{
                fontSize: 16,
                fontWeight: '600',
                color: colors.ink,
                marginLeft: 8,
              }}
            >
              Create Account
            </Text>
          </View>

          <ScrollView
            contentContainerStyle={{
              flexGrow: 1,
              paddingHorizontal: 24,
              paddingTop: 20,
              paddingBottom: 40,
            }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Header Titles */}
            <View style={{ marginBottom: 20 }}>
              <Text
                style={{
                  fontSize: 24,
                  fontWeight: '800',
                  color: colors.ink,
                  marginBottom: 6,
                  letterSpacing: -0.5,
                }}
              >
                Join Quick2Learn
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color: colors['ink-muted'],
                  lineHeight: 20,
                }}
              >
                Register as a Student or Parent to get started
              </Text>
            </View>

            {/* Role Switcher Cards */}
            <View style={{ marginBottom: 20 }}>
              <Text
                style={{
                  fontSize: 12.5,
                  fontWeight: '700',
                  color: colors.ink,
                  marginBottom: 8,
                }}
              >
                I am registering as:
              </Text>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                {/* Student Option */}
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setRole('student')}
                  style={{
                    flex: 1,
                    paddingVertical: 12,
                    paddingHorizontal: 12,
                    borderRadius: 16,
                    borderWidth: 1.5,
                    borderColor: role === 'student' ? colors.primary : colors.border,
                    backgroundColor:
                      role === 'student' ? '#EFF6FF' : colors.surface,
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      backgroundColor:
                        role === 'student' ? '#DBEAFE' : '#F1F5F9',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <GraduationCap
                      size={20}
                      color={role === 'student' ? '#2563EB' : '#64748B'}
                    />
                  </View>
                  <Text
                    style={{
                      fontSize: 13.5,
                      fontWeight: '700',
                      color: role === 'student' ? colors.primary : colors.ink,
                    }}
                  >
                    Student
                  </Text>
                </TouchableOpacity>

                {/* Parent Option */}
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setRole('parent')}
                  style={{
                    flex: 1,
                    paddingVertical: 12,
                    paddingHorizontal: 12,
                    borderRadius: 16,
                    borderWidth: 1.5,
                    borderColor: role === 'parent' ? '#7C3AED' : colors.border,
                    backgroundColor:
                      role === 'parent' ? '#FAF5FF' : colors.surface,
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      backgroundColor:
                        role === 'parent' ? '#F3E8FF' : '#F1F5F9',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Users
                      size={20}
                      color={role === 'parent' ? '#7C3AED' : '#64748B'}
                    />
                  </View>
                  <Text
                    style={{
                      fontSize: 13.5,
                      fontWeight: '700',
                      color: role === 'parent' ? '#7C3AED' : colors.ink,
                    }}
                  >
                    Parent
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Error Message */}
            {error && (
              <View
                style={{
                  backgroundColor: '#FEF2F2',
                  padding: 12,
                  borderRadius: radii.md,
                  borderWidth: 1,
                  borderColor: '#FECACA',
                  marginBottom: 16,
                }}
              >
                <Text
                  style={{
                    fontSize: 13,
                    color: colors.danger,
                    textAlign: 'center',
                    fontWeight: '500',
                  }}
                >
                  {error}
                </Text>
              </View>
            )}

            {/* Form Fields */}
            <View style={{ gap: 14 }}>
              <TextField
                label="Full Name"
                placeholder={role === 'student' ? 'e.g. Rahul Sharma' : 'e.g. Anil Sharma'}
                value={fullName}
                onChangeText={(text) => {
                  setFullName(text);
                  if (error) setError(null);
                }}
                leftIcon={<User size={18} color="#9CA3AF" />}
                clearable
              />

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
                leftIcon={<Mail size={18} color="#9CA3AF" />}
                clearable
              />

              <TextField
                label="Mobile Number"
                placeholder="10-digit phone number"
                value={phone}
                onChangeText={(text) => {
                  setPhone(text);
                  if (error) setError(null);
                }}
                keyboardType="phone-pad"
                maxLength={10}
                leftIcon={<Phone size={18} color="#9CA3AF" />}
                clearable
              />

              <TextField
                label="Password"
                placeholder="At least 6 characters"
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (error) setError(null);
                }}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                leftIcon={<Lock size={18} color="#9CA3AF" />}
                rightIcon={
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    {showPassword ? (
                      <EyeOff size={18} color="#6B7280" />
                    ) : (
                      <Eye size={18} color="#6B7280" />
                    )}
                  </TouchableOpacity>
                }
              />

              <TextField
                label="Confirm Password"
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChangeText={(text) => {
                  setConfirmPassword(text);
                  if (error) setError(null);
                }}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                leftIcon={<Lock size={18} color="#9CA3AF" />}
              />

              {/* Student Specific Fields */}
              {role === 'student' && (
                <View
                  style={{
                    backgroundColor: '#F8FAFC',
                    padding: 14,
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: '#E2E8F0',
                    gap: 12,
                  }}
                >
                  {/* Class Selection */}
                  <View>
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: '700',
                        color: colors.ink,
                        marginBottom: 6,
                      }}
                    >
                      Class Level
                    </Text>
                    <View style={{ flexDirection: 'row', gap: 6 }}>
                      {CLASS_OPTIONS.map((cls) => (
                        <TouchableOpacity
                          key={cls}
                          activeOpacity={0.7}
                          onPress={() => setClassLevel(cls)}
                          style={{
                            flex: 1,
                            paddingVertical: 7,
                            alignItems: 'center',
                            borderRadius: 10,
                            borderWidth: 1,
                            borderColor:
                              classLevel === cls ? colors.primary : '#CBD5E1',
                            backgroundColor:
                              classLevel === cls ? colors.primary : '#FFFFFF',
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 12,
                              fontWeight: '700',
                              color: classLevel === cls ? '#FFFFFF' : '#334155',
                            }}
                          >
                            Class {cls}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  {/* Board Selection */}
                  <View>
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: '700',
                        color: colors.ink,
                        marginBottom: 6,
                      }}
                    >
                      Board
                    </Text>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      {BOARD_OPTIONS.map((b) => (
                        <TouchableOpacity
                          key={b}
                          activeOpacity={0.7}
                          onPress={() => setBoard(b)}
                          style={{
                            flex: 1,
                            paddingVertical: 7,
                            alignItems: 'center',
                            borderRadius: 10,
                            borderWidth: 1,
                            borderColor:
                              board === b ? colors.primary : '#CBD5E1',
                            backgroundColor:
                              board === b ? colors.primary : '#FFFFFF',
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 12,
                              fontWeight: '700',
                              color: board === b ? '#FFFFFF' : '#334155',
                            }}
                          >
                            {b.toUpperCase()}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  {/* School Name */}
                  <TextField
                    label="School Name (Optional)"
                    placeholder="e.g. Delhi Public School"
                    value={school}
                    onChangeText={setSchool}
                    leftIcon={<Building size={16} color="#9CA3AF" />}
                  />
                </View>
              )}

              {/* Parent Specific Fields */}
              {role === 'parent' && (
                <View
                  style={{
                    backgroundColor: '#FAF5FF',
                    padding: 14,
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: '#E9D5FF',
                    gap: 8,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: '700',
                      color: '#4C1D95',
                    }}
                  >
                    Child's Invite Code (Optional)
                  </Text>
                  <TextField
                    placeholder="e.g. A1B2C3"
                    value={childInviteCode}
                    onChangeText={(text) =>
                      setChildInviteCode(text.toUpperCase())
                    }
                    autoCapitalize="characters"
                    maxLength={8}
                    leftIcon={<KeyRound size={16} color="#7C3AED" />}
                  />
                  <Text
                    style={{
                      fontSize: 11,
                      color: '#6B7280',
                      lineHeight: 15,
                    }}
                  >
                    Found on your child's Quick2Learn app (under Profile → Parent Access). You can also link this anytime later.
                  </Text>
                </View>
              )}
            </View>

            {/* Submit Button Section */}
            <View style={{ marginTop: 24, gap: 14 }}>
              <Button
                variant="primary"
                size="lg"
                fullWidth
                disabled={isLoading}
                loading={isLoading}
                onPress={handleRegister}
              >
                Create Account
              </Button>

              {/* Sign In Link */}
              <TouchableOpacity
                onPress={() => router.push('/(auth)/login' as any)}
                style={{ paddingVertical: 8, alignItems: 'center' }}
                hitSlop={{ top: 8, bottom: 8, left: 16, right: 16 }}
              >
                <Text
                  style={{
                    fontSize: 13.5,
                    color: colors['ink-muted'],
                    textAlign: 'center',
                  }}
                >
                  Already have an account?{' '}
                  <Text style={{ fontWeight: '700', color: colors.primary }}>
                    Sign In
                  </Text>
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}
