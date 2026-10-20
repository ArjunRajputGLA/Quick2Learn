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
  Share,
  Modal,
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
  Sparkles,
  Share2,
  Copy,
} from 'lucide-react-native';
import * as SecureStore from 'expo-secure-store';
import { useQueryClient } from '@tanstack/react-query';
import { TextField } from '../../src/components/ui/TextField';
import { Button } from '../../src/components/ui/Button';
import { KeyboardAwareScrollView } from '../../src/components/ui/KeyboardAwareScrollView';
import {
  ACTIVE_USER_STORAGE_KEY,
  DEMO_MODE_STORAGE_KEY,
  queryKeys,
} from '../../src/api/hooks';
import {
  checkDeviceRoleMutualExclusion,
  verifyChildCodeDeviceClaim,
  claimChildCodeOnDevice,
  claimAccountOnDevice,
  setDeviceActiveRole,
} from '../../src/lib/deviceSession';
import {
  generateUniqueInviteCode,
  registerStudentInviteCode,
  lookupStudentByInviteCode,
  saveLastKnownStudentProfile,
} from '../../src/lib/studentInviteDirectory';
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

  // Flash modal state for student's one-time invite code reveal
  const [flashInviteModal, setFlashInviteModal] = useState<{
    visible: boolean;
    code: string;
    studentName: string;
  } | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async () => {
    Keyboard.dismiss();
    setError(null);

    const cleanName = fullName.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.trim().replace(/\D/g, '');
    const cleanPassword = password.trim();
    const cleanInviteCode = childInviteCode.trim().toUpperCase();

    // 0. Mutual Exclusivity Check on Device
    const roleCheck = await checkDeviceRoleMutualExclusion(role);
    if (!roleCheck.allowed) {
      setError(roleCheck.message || 'Portal role conflict on this device.');
      return;
    }

    // 1. Name is mandatory (at least 2 characters)
    if (cleanName.length < 2) {
      setError('Please enter your full name (at least 2 characters)');
      return;
    }

    // 2. Phone is mandatory (10 digits)
    if (cleanPhone.length < 10) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }

    // 3. Email validation: Mandatory for student, OPTIONAL for parents
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (role === 'student') {
      if (!emailRegex.test(cleanEmail)) {
        setError('Please enter a valid email address');
        return;
      }
    } else {
      // Parent: email is optional
      if (cleanEmail && !emailRegex.test(cleanEmail)) {
        setError('Please enter a valid email address, or leave it blank.');
        return;
      }

      // Child invite code is MANDATORY for parents!
      if (!cleanInviteCode) {
        setError("Please enter your child's 6-character invite code.");
        return;
      }
      if (cleanInviteCode.length !== 6) {
        setError("Child's invite code must be exactly 6 characters.");
        return;
      }

      // Single-Parent Device Binding Check
      const claimCheck = await verifyChildCodeDeviceClaim(cleanInviteCode);
      if (!claimCheck.allowed) {
        setError(claimCheck.error || 'This child invite code is already active on another parent device.');
        return;
      }
    }

    // 4. Password validation
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
      const formattedPhone = cleanPhone.startsWith('+91')
        ? cleanPhone
        : `+91${cleanPhone.slice(-10)}`;
      const effectiveEmail = cleanEmail || `${cleanPhone.slice(-10)}@parent.quick2learn.in`;

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

      // STRICT CHECK: Reject registration if phone number already exists
      const existingByPhone = accountsList.find(
        (a) => a.phone?.replace(/\D/g, '').slice(-10) === cleanPhone.slice(-10)
      );
      const isDemoPhone =
        cleanPhone.slice(-10) === '9876543210' ||
        cleanPhone.slice(-10) === '9800000003';

      if (existingByPhone || isDemoPhone) {
        setError('An account with this mobile number already exists. Please sign in instead.');
        setIsLoading(false);
        return;
      }

      // STRICT CHECK: Reject registration if email already exists
      if (cleanEmail) {
        const existingByEmail = accountsList.find(
          (a) =>
            a.email?.toLowerCase() === cleanEmail ||
            a.displayEmail?.toLowerCase() === cleanEmail
        );
        const isDemoEmail =
          cleanEmail === 'admin@quick2learn.in' ||
          cleanEmail === 'teacher@quick2learn.in' ||
          cleanEmail === 'student@quick2learn.in' ||
          cleanEmail === 'student.demo@quick2learn.in' ||
          cleanEmail === 'parent@quick2learn.in' ||
          cleanEmail === 'parent.demo@quick2learn.in';

        if (existingByEmail || isDemoEmail) {
          setError('An account with this email address already exists. Please sign in instead.');
          setIsLoading(false);
          return;
        }
      }

      let generatedStudentInviteCode = '';
      let parentLinkedStudents: any[] = [];

      if (role === 'parent') {
        // Look up student from unique invite code directory or registered accounts
        const matchedStudent = await lookupStudentByInviteCode(cleanInviteCode);

        if (!matchedStudent) {
          setError(
            `No student found with invite code "${cleanInviteCode}". Please check your child's Quick2Learn profile for their 6-character code.`
          );
          setIsLoading(false);
          return;
        }

        parentLinkedStudents = [
          {
            id: matchedStudent.id || `profile-${matchedStudent.userId}`,
            userId: matchedStudent.userId || matchedStudent.id,
            fullName: matchedStudent.fullName,
            classLevel: matchedStudent.classLevel || 10,
            board: (matchedStudent.board || 'cbse') as 'cbse' | 'icse',
            school: matchedStudent.school || 'Quick2Learn High School',
            avatarUrl: null,
          },
        ];
      } else {
        // Generate guaranteed unique 6-character student invite code
        generatedStudentInviteCode = await generateUniqueInviteCode();
      }

      const newAccountRecord = {
        id: newAccountId,
        fullName: cleanName,
        email: effectiveEmail,
        displayEmail: cleanEmail || null,
        phone: formattedPhone,
        password: cleanPassword,
        role,
        classLevel: role === 'student' ? classLevel : null,
        board: role === 'student' ? board : null,
        school: role === 'student' ? school.trim() || 'Quick2Learn High School' : null,
        childInviteCode: role === 'parent' ? cleanInviteCode : null,
        inviteCode: role === 'student' ? generatedStudentInviteCode : null,
        studentInviteCode: role === 'student' ? generatedStudentInviteCode : null,
        linkedStudents: role === 'parent' ? parentLinkedStudents : [],
        createdAt: new Date().toISOString(),
      };

      // Append verified new account to registered accounts list
      accountsList.push(newAccountRecord);

      await SecureStore.setItemAsync(
        'q2l_registered_accounts',
        JSON.stringify(accountsList)
      );

      // If student, register profile details to this unique invite code and record as last known student
      if (role === 'student') {
        const studentRecord = {
          id: newAccountId,
          userId: newAccountId,
          fullName: cleanName,
          classLevel,
          board,
          school: school.trim() || 'Quick2Learn High School',
          phone: formattedPhone,
          email: effectiveEmail,
          inviteCode: generatedStudentInviteCode,
        };
        await registerStudentInviteCode(generatedStudentInviteCode, studentRecord);
        await saveLastKnownStudentProfile(studentRecord);
      }

      // Create MeResponse object
      const userProfile = {
        user: {
          id: newAccountId,
          email: effectiveEmail,
          name: cleanName,
          image: null,
          phoneNumber: formattedPhone,
          phoneNumberVerified: true,
          emailVerified: Boolean(cleanEmail),
          createdAt: newAccountRecord.createdAt,
          updatedAt: newAccountRecord.createdAt,
        },
        profile: {
          id: newProfileId,
          userId: newAccountId,
          fullName: cleanName,
          phone: formattedPhone,
          role,
          classLevel: role === 'student' ? classLevel : null,
          board: role === 'student' ? board : null,
          school: role === 'student' ? newAccountRecord.school : null,
          parentName: null,
          parentPhone: null,
          city: 'Bhopal',
          avatarUrl: null,
          inviteCode: role === 'student' ? generatedStudentInviteCode : null,
          onboardedAt: newAccountRecord.createdAt,
          createdAt: newAccountRecord.createdAt,
          updatedAt: newAccountRecord.createdAt,
        },
        role,
        linkedStudents: parentLinkedStudents,
      };

      // Set active user session
      await SecureStore.setItemAsync(
        ACTIVE_USER_STORAGE_KEY,
        JSON.stringify(userProfile)
      );
      await SecureStore.setItemAsync(DEMO_MODE_STORAGE_KEY, 'true').catch(() => {});
      queryClient.setQueryData(queryKeys.me, userProfile);
      await claimAccountOnDevice(cleanPhone, newAccountId, role);
      if (cleanEmail) {
        await claimAccountOnDevice(cleanEmail, newAccountId, role);
      }

      if (role === 'student') {
        await setDeviceActiveRole('student');
        // Save student invite code to SecureStore & queryCache
        await SecureStore.setItemAsync('q2l_active_student_invite_code', generatedStudentInviteCode).catch(() => {});
        queryClient.setQueryData(queryKeys.studentInviteCode, {
          code: generatedStudentInviteCode,
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        });

        // Flash invite code modal for student!
        setFlashInviteModal({
          visible: true,
          code: generatedStudentInviteCode,
          studentName: cleanName,
        });
      } else {
        // Parent: bind the child code to this device
        await claimChildCodeOnDevice(cleanInviteCode, newAccountId, cleanName);
        await setDeviceActiveRole('parent');
        queryClient.setQueryData(queryKeys.parentStudents, { students: parentLinkedStudents });
        // Parent navigates directly into app
        router.replace('/(app)' as any);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to create account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleShareFlashCode = async () => {
    if (!flashInviteModal?.code) return;
    try {
      await Share.share({
        title: 'Quick2Learn Parent Link Code',
        message: `Hi Mummy / Papa! I have registered on Quick2Learn. Please use my Invite Code [${flashInviteModal.code}] when creating your Parent Account to link with my profile: https://play.google.com/store/apps/details?id=in.quick2learn.app`,
      });
    } catch (e) {
      console.warn('Share error:', e);
    }
  };

  const handleDismissFlashModal = () => {
    setFlashInviteModal(null);
    router.replace('/(app)' as any);
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
            Create Account
          </Text>
        </View>

        <KeyboardAwareScrollView
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
                label="Full Name *"
                placeholder={role === 'student' ? 'e.g. Rahul Sharma' : 'e.g. Anil Sharma (Parent)'}
                value={fullName}
                onChangeText={(text) => {
                  setFullName(text);
                  if (error) setError(null);
                }}
                leftIcon={<User size={18} color="#9CA3AF" />}
                clearable
              />

              {role === 'student' && (
                <TextField
                  label="Email Address *"
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
              )}

              <TextField
                label="Mobile Number *"
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

              {/* For Parents: Child's Invite Code is MANDATORY */}
              {role === 'parent' && (
                <View
                  style={{
                    backgroundColor: '#FAF5FF',
                    padding: 14,
                    borderRadius: 16,
                    borderWidth: 1.5,
                    borderColor: '#DDD6FE',
                    gap: 8,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text
                      style={{
                        fontSize: 12.5,
                        fontWeight: '800',
                        color: '#4C1D95',
                      }}
                    >
                      Child's Invite Code * (Mandatory)
                    </Text>
                    <View style={{ backgroundColor: '#EDE9FE', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 }}>
                      <Text style={{ fontSize: 10, fontWeight: '700', color: '#7C3AED' }}>Required</Text>
                    </View>
                  </View>
                  <TextField
                    placeholder="6-character code (e.g. Q2L894)"
                    value={childInviteCode}
                    onChangeText={(text) => {
                      setChildInviteCode(text.toUpperCase());
                      if (error) setError(null);
                    }}
                    autoCapitalize="characters"
                    maxLength={6}
                    leftIcon={<KeyRound size={16} color="#7C3AED" />}
                  />
                  <Text
                    style={{
                      fontSize: 11,
                      color: '#6B7280',
                      lineHeight: 15,
                    }}
                  >
                    Found on your child's Quick2Learn profile screen. Required to link your accounts.
                  </Text>
                </View>
              )}

              {/* For Parents: Email is OPTIONAL */}
              {role === 'parent' && (
                <TextField
                  label="Email Address (Optional)"
                  placeholder="name@example.com (optional)"
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
              )}

              <TextField
                label="Password *"
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
                label="Confirm Password *"
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
          </KeyboardAwareScrollView>
        </View>

        {/* Student One-Time Registration Invite Code Flash Modal */}
        <Modal
          visible={Boolean(flashInviteModal?.visible)}
          transparent
          animationType="fade"
          statusBarTranslucent
          onRequestClose={handleDismissFlashModal}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: 'rgba(15, 23, 42, 0.72)',
              alignItems: 'center',
              justifyContent: 'center',
              paddingHorizontal: 20,
            }}
          >
            <View
              style={{
                width: '100%',
                maxWidth: 360,
                backgroundColor: '#FFFFFF',
                borderRadius: 28,
                paddingVertical: 26,
                paddingHorizontal: 22,
                alignItems: 'center',
                shadowColor: '#0F172A',
                shadowOffset: { width: 0, height: 12 },
                shadowOpacity: 0.2,
                shadowRadius: 24,
                elevation: 12,
              }}
            >
              {/* Sparkle Badge */}
              <View
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: 30,
                  backgroundColor: '#EDE9FE',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 14,
                  borderWidth: 2,
                  borderColor: '#DDD6FE',
                }}
              >
                <KeyRound size={28} color="#7C3AED" />
              </View>

              <Text
                style={{
                  fontSize: 20,
                  fontWeight: '800',
                  color: colors.ink,
                  textAlign: 'center',
                  marginBottom: 4,
                }}
              >
                Account Created! 🎉
              </Text>
              <Text
                style={{
                  fontSize: 13,
                  color: colors['ink-muted'],
                  textAlign: 'center',
                  marginBottom: 18,
                }}
              >
                Welcome, {flashInviteModal?.studentName}! Here is your Parent Link Code:
              </Text>

              {/* Code Box */}
              <View
                style={{
                  width: '100%',
                  backgroundColor: '#FAF5FF',
                  borderRadius: 18,
                  paddingVertical: 16,
                  paddingHorizontal: 16,
                  alignItems: 'center',
                  borderWidth: 1.5,
                  borderColor: '#D8B4FE',
                  marginBottom: 16,
                }}
              >
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: '700',
                    color: '#7C3AED',
                    letterSpacing: 1,
                    textTransform: 'uppercase',
                    marginBottom: 6,
                  }}
                >
                  Your Parent Invite Code
                </Text>
                <Text
                  style={{
                    fontSize: 30,
                    fontWeight: '900',
                    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
                    color: '#581C87',
                    letterSpacing: 6,
                  }}
                >
                  {flashInviteModal?.code}
                </Text>
              </View>

              <Text
                style={{
                  fontSize: 12,
                  color: '#6B7280',
                  textAlign: 'center',
                  lineHeight: 18,
                  marginBottom: 20,
                }}
              >
                Share this 6-character code with your parents so they can register and link their account to view your attendance and performance.
              </Text>

              <View style={{ width: '100%', gap: 10 }}>
                <Button
                  variant="primary"
                  size="md"
                  fullWidth
                  onPress={handleShareFlashCode}
                  icon={<Share2 size={16} color="#FFFFFF" />}
                >
                  Share Code with Parents
                </Button>

                <Button
                  variant="outline"
                  size="md"
                  fullWidth
                  onPress={handleDismissFlashModal}
                >
                  Continue to App
                </Button>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    );
  }
