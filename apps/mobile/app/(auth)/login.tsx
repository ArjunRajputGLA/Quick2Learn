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
  Mail,
  Lock,
  Eye,
  EyeOff,
  Shield,
  GraduationCap,
  Sparkles,
  Phone,
  Users,
} from 'lucide-react-native';
import * as SecureStore from 'expo-secure-store';
import { useQueryClient } from '@tanstack/react-query';
import { TextField } from '../../src/components/ui/TextField';
import { Button } from '../../src/components/ui/Button';
import { KeyboardAwareScrollView } from '../../src/components/ui/KeyboardAwareScrollView';
import { authClient } from '../../src/api/auth-client';
import {
  ACTIVE_USER_STORAGE_KEY,
  DEMO_ADMIN_ME,
  DEMO_TEACHER_ME,
  DEMO_USER_ME,
  DEMO_PARENT_ME,
  DEMO_MODE_STORAGE_KEY,
  queryKeys,
} from '../../src/api/hooks';
import {
  checkDeviceRoleMutualExclusion,
  verifyChildCodeDeviceClaim,
  claimChildCodeOnDevice,
  verifyAccountDeviceClaim,
  claimAccountOnDevice,
  setDeviceActiveRole,
} from '../../src/lib/deviceSession';
import { colors, radii } from '@quick2learn/shared';

export default function LoginScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleQuickFill = (role: 'admin' | 'teacher' | 'parent') => {
    setError(null);
    if (role === 'admin') {
      setIdentifier('admin@quick2learn.in');
      setPassword('AdminPassword123');
    } else if (role === 'teacher') {
      setIdentifier('teacher@quick2learn.in');
      setPassword('TeacherPassword123');
    } else {
      setIdentifier('9800000003');
      setPassword('ParentPassword123');
    }
  };

  const handleSignIn = async () => {
    Keyboard.dismiss();
    const cleanId = identifier.trim().toLowerCase();
    const cleanDigits = identifier.trim().replace(/\D/g, '').slice(-10);
    const cleanPassword = password.trim();

    if (!cleanId) {
      setError('Please enter your 10-digit mobile number or email address');
      return;
    }

    if (!cleanPassword) {
      setError('Please enter your password');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // 1. Check Fixed Admin Credentials
      const isAdminMatch =
        (cleanId === 'admin@quick2learn.in' || cleanId === 'admin') &&
        (cleanPassword === 'AdminPassword123' ||
          cleanPassword === 'admin123' ||
          cleanPassword === 'Admin@123');

      if (isAdminMatch) {
        await setDeviceActiveRole('admin');
        await SecureStore.setItemAsync(
          ACTIVE_USER_STORAGE_KEY,
          JSON.stringify(DEMO_ADMIN_ME)
        );
        await SecureStore.setItemAsync(DEMO_MODE_STORAGE_KEY, 'true').catch(() => {});
        queryClient.setQueryData(queryKeys.me, DEMO_ADMIN_ME);
        router.replace('/(app)' as any);
        return;
      }

      // 2. Check Fixed Teacher Credentials
      const isTeacherMatch =
        (cleanId === 'teacher@quick2learn.in' || cleanId === 'teacher') &&
        (cleanPassword === 'TeacherPassword123' ||
          cleanPassword === 'teacher123' ||
          cleanPassword === 'Teacher@123');

      if (isTeacherMatch) {
        await setDeviceActiveRole('teacher');
        await SecureStore.setItemAsync(
          ACTIVE_USER_STORAGE_KEY,
          JSON.stringify(DEMO_TEACHER_ME)
        );
        await SecureStore.setItemAsync(DEMO_MODE_STORAGE_KEY, 'true').catch(() => {});
        queryClient.setQueryData(queryKeys.me, DEMO_TEACHER_ME);
        router.replace('/(app)' as any);
        return;
      }

      // 3. Check Registered Accounts in Local Storage (matches by 10-digit phone number OR email)
      const registeredJson = await SecureStore.getItemAsync('q2l_registered_accounts').catch(
        () => null
      );
      if (registeredJson) {
        try {
          const accounts: any[] = JSON.parse(registeredJson);
          const matched = accounts.find((acc) => {
            const accPhoneDigits = acc.phone?.replace(/\D/g, '').slice(-10);
            return (
              (cleanDigits.length === 10 && accPhoneDigits === cleanDigits) ||
              acc.email?.toLowerCase() === cleanId ||
              (acc.phone && acc.phone.replace(/\D/g, '') === cleanId.replace(/\D/g, ''))
            );
          });

          if (matched) {
            // Check single device account claim
            const accountKey = cleanDigits.length === 10 ? cleanDigits : (matched.phone || matched.email || cleanId);
            const accountClaimCheck = await verifyAccountDeviceClaim(accountKey, matched.id);
            if (!accountClaimCheck.allowed) {
              setError(accountClaimCheck.error || 'This account is already active on another device.');
              setIsLoading(false);
              return;
            }

            if (matched.password !== cleanPassword) {
              setError('Incorrect password. Please verify your credentials.');
              setIsLoading(false);
              return;
            }

            const targetRole = matched.role || 'student';
            // Device Role Mutual Exclusivity Check
            const roleCheck = await checkDeviceRoleMutualExclusion(targetRole);
            if (!roleCheck.allowed) {
              setError(roleCheck.message || 'Portal role conflict on this device.');
              setIsLoading(false);
              return;
            }

            // Single Parent Device Binding Check for Child Invite Code
            if (targetRole === 'parent') {
              const code =
                matched.childInviteCode ||
                matched.linkedStudents?.[0]?.inviteCode ||
                'DEMO10';
              const claimCheck = await verifyChildCodeDeviceClaim(code, matched.id);
              if (!claimCheck.allowed) {
                setError(claimCheck.error || 'This child invite code is already active on another parent device.');
                setIsLoading(false);
                return;
              }
              await claimChildCodeOnDevice(code, matched.id, matched.fullName);
            }

            await claimAccountOnDevice(accountKey, matched.id, targetRole);
            await setDeviceActiveRole(targetRole);

            let resolvedLinkedStudents: any[] = [];
            if (matched.role === 'parent') {
              if (Array.isArray(matched.linkedStudents) && matched.linkedStudents.length > 0) {
                resolvedLinkedStudents = matched.linkedStudents;
              } else if (matched.childInviteCode) {
                const code = matched.childInviteCode.trim().toUpperCase();
                const studentMatch = accounts.find(
                  (acc) =>
                    acc.role === 'student' &&
                    (acc.inviteCode?.toUpperCase() === code ||
                      acc.studentInviteCode?.toUpperCase() === code)
                );
                if (studentMatch) {
                  resolvedLinkedStudents = [
                    {
                      id: studentMatch.id || `profile-${studentMatch.id}`,
                      userId: studentMatch.id || `user-${Date.now()}`,
                      fullName: studentMatch.fullName,
                      classLevel: studentMatch.classLevel || 10,
                      board: (studentMatch.board || 'cbse') as 'cbse' | 'icse',
                      school: studentMatch.school || 'Quick2Learn High School',
                      avatarUrl: null,
                    },
                  ];
                }
              }

              if (resolvedLinkedStudents.length === 0) {
                resolvedLinkedStudents = DEMO_PARENT_ME.linkedStudents;
              }
            }

            // Create active profile from registered account
            const userProfile = {
              user: {
                id: matched.id || `user-${Date.now()}`,
                email: matched.email,
                name: matched.fullName,
                image: null,
                phoneNumber: matched.phone || null,
                phoneNumberVerified: true,
                emailVerified: true,
                createdAt: matched.createdAt || new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
              profile: {
                id: `profile-${Date.now()}`,
                userId: matched.id || `user-${Date.now()}`,
                fullName: matched.fullName,
                phone: matched.phone || null,
                role: matched.role || 'student',
                classLevel: matched.classLevel || 10,
                board: matched.board || 'cbse',
                school: matched.school || 'Quick2Learn High',
                parentName: matched.parentName || null,
                parentPhone: matched.parentPhone || null,
                city: 'Bhopal',
                avatarUrl: null,
                onboardedAt: new Date().toISOString(),
                inviteCode: matched.inviteCode || matched.studentInviteCode || null,
                createdAt: matched.createdAt || new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
              role: matched.role || 'student',
              linkedStudents: resolvedLinkedStudents,
            };

            await SecureStore.setItemAsync(
              ACTIVE_USER_STORAGE_KEY,
              JSON.stringify(userProfile)
            );
            await SecureStore.setItemAsync(DEMO_MODE_STORAGE_KEY, 'true').catch(() => {});
            queryClient.setQueryData(queryKeys.me, userProfile);
            if (matched.role === 'parent') {
              queryClient.setQueryData(queryKeys.parentStudents, { students: resolvedLinkedStudents });
            }
            router.replace('/(app)' as any);
            return;
          }
        } catch (e) {
          console.warn('Error reading registered accounts:', e);
        }
      }

      // 4. Check Demo Student / Parent fallback
      if (
        cleanId === 'student@quick2learn.in' ||
        cleanId === 'student.demo@quick2learn.in' ||
        cleanDigits === '9876543210'
      ) {
        const studentKey = cleanDigits === '9876543210' ? '9876543210' : cleanId;
        const accountClaimCheck = await verifyAccountDeviceClaim(studentKey, DEMO_USER_ME.user.id);
        if (!accountClaimCheck.allowed) {
          setError(accountClaimCheck.error || 'This account is already active on another device.');
          setIsLoading(false);
          return;
        }

        const roleCheck = await checkDeviceRoleMutualExclusion('student');
        if (!roleCheck.allowed) {
          setError(roleCheck.message || 'Portal role conflict on this device.');
          setIsLoading(false);
          return;
        }
        await claimAccountOnDevice(studentKey, DEMO_USER_ME.user.id, 'student');
        await setDeviceActiveRole('student');
        await SecureStore.setItemAsync(
          ACTIVE_USER_STORAGE_KEY,
          JSON.stringify(DEMO_USER_ME)
        );
        await SecureStore.setItemAsync(DEMO_MODE_STORAGE_KEY, 'true').catch(() => {});
        queryClient.setQueryData(queryKeys.me, DEMO_USER_ME);
        router.replace('/(app)' as any);
        return;
      }

      if (
        cleanId === 'parent@quick2learn.in' ||
        cleanId === 'parent.demo@quick2learn.in' ||
        cleanDigits === '9800000003'
      ) {
        const parentKey = cleanDigits === '9800000003' ? '9800000003' : cleanId;
        const accountClaimCheck = await verifyAccountDeviceClaim(parentKey, DEMO_PARENT_ME.user.id);
        if (!accountClaimCheck.allowed) {
          setError(accountClaimCheck.error || 'This account is already active on another device.');
          setIsLoading(false);
          return;
        }

        const roleCheck = await checkDeviceRoleMutualExclusion('parent');
        if (!roleCheck.allowed) {
          setError(roleCheck.message || 'Portal role conflict on this device.');
          setIsLoading(false);
          return;
        }
        const claimCheck = await verifyChildCodeDeviceClaim('DEMO10', DEMO_PARENT_ME.user.id);
        if (!claimCheck.allowed) {
          setError(claimCheck.error || 'Child invite code is already active on another parent device.');
          setIsLoading(false);
          return;
        }
        await claimChildCodeOnDevice('DEMO10', DEMO_PARENT_ME.user.id, DEMO_PARENT_ME.user.name);
        await claimAccountOnDevice(parentKey, DEMO_PARENT_ME.user.id, 'parent');
        await setDeviceActiveRole('parent');
        await SecureStore.setItemAsync(
          ACTIVE_USER_STORAGE_KEY,
          JSON.stringify(DEMO_PARENT_ME)
        );
        await SecureStore.setItemAsync(DEMO_MODE_STORAGE_KEY, 'true').catch(() => {});
        queryClient.setQueryData(queryKeys.me, DEMO_PARENT_ME);
        router.replace('/(app)' as any);
        return;
      }

      // 5. Attempt Live Better-Auth API Email & Password Login
      try {
        const liveIdentifier = cleanId.includes('@')
          ? cleanId
          : cleanDigits.length === 10
          ? `${cleanDigits}@parent.quick2learn.in`
          : cleanId;

        const res = await authClient.signIn.email({
          email: liveIdentifier,
          password: cleanPassword,
        });

        if (res?.error) {
          setError(res.error.message || 'No account found with this mobile number or email. Please check your credentials or register.');
          return;
        }

        // Live sign-in successful
        await SecureStore.deleteItemAsync(ACTIVE_USER_STORAGE_KEY).catch(() => {});
        await SecureStore.deleteItemAsync(DEMO_MODE_STORAGE_KEY).catch(() => {});
        queryClient.invalidateQueries({ queryKey: queryKeys.me });
        router.replace('/(app)' as any);
      } catch (apiErr: any) {
        setError(
          apiErr?.message ||
            'No account found with this mobile number or email. Please check your credentials or register.'
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.surface }}>
      <StatusBar style="dark" />
      <View style={{ flex: 1 }}>
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
            Sign In
          </Text>
        </View>

        <KeyboardAwareScrollView
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: 24,
            paddingTop: 24,
            paddingBottom: 36,
            justifyContent: 'space-between',
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
            <View>
              {/* Title & Subtitle */}
              <View style={{ marginBottom: 24 }}>
                <Text
                  style={{
                    fontSize: 24,
                    fontWeight: '800',
                    color: colors.ink,
                    marginBottom: 6,
                    letterSpacing: -0.5,
                  }}
                >
                  Welcome Back
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    color: colors['ink-muted'],
                    lineHeight: 20,
                  }}
                >
                  Sign in with your registered mobile number or email and password
                </Text>
              </View>

              {/* Error Box */}
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
              <View style={{ gap: 16 }}>
                <View>
                  <TextField
                    label="Mobile Number or Email"
                    placeholder="10-digit mobile number or email"
                    value={identifier}
                    onChangeText={(text) => {
                      setIdentifier(text);
                      if (error) setError(null);
                    }}
                    keyboardType="default"
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="next"
                    leftIcon={
                      /^\+?\d[\d\s-]*$/.test(identifier.trim()) ? (
                        <Phone size={18} color="#2563EB" />
                      ) : (
                        <Mail size={18} color="#9CA3AF" />
                      )
                    }
                    clearable
                  />
                  <Text style={{ fontSize: 11.5, color: '#64748B', marginTop: 4, marginLeft: 2 }}>
                    Parents who registered without an email can enter their 10-digit phone number.
                  </Text>
                </View>

                <TextField
                  label="Password"
                  placeholder="Enter your password"
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (error) setError(null);
                  }}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="done"
                  onSubmitEditing={handleSignIn}
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
              </View>

              {/* Quick Fill for Admin, Teacher & Parent Demo */}
              <View
                style={{
                  marginTop: 22,
                  padding: 14,
                  borderRadius: 18,
                  backgroundColor: '#F8FAFC',
                  borderWidth: 1,
                  borderColor: '#E2E8F0',
                }}
              >
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginBottom: 8,
                    gap: 6,
                  }}
                >
                  <Sparkles size={14} color={colors.primary} />
                  <Text
                    style={{
                      fontSize: 11.5,
                      fontWeight: '700',
                      color: colors.ink,
                      textTransform: 'uppercase',
                      letterSpacing: 0.5,
                    }}
                  >
                    Quick Fill Demo Credentials
                  </Text>
                </View>

                <Text
                  style={{
                    fontSize: 12,
                    color: colors['ink-muted'],
                    marginBottom: 10,
                    lineHeight: 17,
                  }}
                >
                  Tap below to auto-fill credentials for Admin, Faculty, or Parent:
                </Text>

                <View style={{ flexDirection: 'row', gap: 7 }}>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => handleQuickFill('admin')}
                    style={{
                      flex: 1,
                      backgroundColor: '#EFF6FF',
                      borderWidth: 1,
                      borderColor: '#BFDBFE',
                      borderRadius: 12,
                      paddingVertical: 7,
                      paddingHorizontal: 6,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 4,
                    }}
                  >
                    <Shield size={13} color="#2563EB" />
                    <Text
                      style={{
                        fontSize: 11.5,
                        fontWeight: '700',
                        color: '#1E40AF',
                      }}
                    >
                      Admin
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => handleQuickFill('teacher')}
                    style={{
                      flex: 1,
                      backgroundColor: '#FAF5FF',
                      borderWidth: 1,
                      borderColor: '#E9D5FF',
                      borderRadius: 12,
                      paddingVertical: 7,
                      paddingHorizontal: 6,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 4,
                    }}
                  >
                    <GraduationCap size={14} color="#7C3AED" />
                    <Text
                      style={{
                        fontSize: 11.5,
                        fontWeight: '700',
                        color: '#6B21A8',
                      }}
                    >
                      Teacher
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => handleQuickFill('parent')}
                    style={{
                      flex: 1,
                      backgroundColor: '#ECFDF5',
                      borderWidth: 1,
                      borderColor: '#A7F3D0',
                      borderRadius: 12,
                      paddingVertical: 7,
                      paddingHorizontal: 6,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 4,
                    }}
                  >
                    <Users size={13} color="#059669" />
                    <Text
                      style={{
                        fontSize: 11.5,
                        fontWeight: '700',
                        color: '#047857',
                      }}
                    >
                      Parent
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Bottom Section */}
            <View style={{ width: '100%', marginTop: 24, gap: 14 }}>
              <Button
                variant="primary"
                size="lg"
                fullWidth
                disabled={isLoading}
                loading={isLoading}
                onPress={handleSignIn}
              >
                Sign In
              </Button>

              {/* Registration Link */}
              <TouchableOpacity
                onPress={() => router.push('/(auth)/register' as any)}
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
                  Don't have an account?{' '}
                  <Text style={{ fontWeight: '700', color: colors.primary }}>
                    Register here
                  </Text>
                </Text>
              </TouchableOpacity>
            </View>
          </KeyboardAwareScrollView>
        </View>
      </SafeAreaView>
    );
  }
