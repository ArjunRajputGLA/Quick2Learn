import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  GraduationCap,
  Users,
  ArrowLeft,
  CheckCircle2,
  Bell,
  Sparkles,
  BookOpen,
  School,
  KeyRound,
  Shield,
} from 'lucide-react-native';
import * as Notifications from 'expo-notifications';
import { ProgressBar } from '../../src/components/ui/ProgressBar';
import { TextField } from '../../src/components/ui/TextField';
import { Chip } from '../../src/components/ui/Chip';
import { Button } from '../../src/components/ui/Button';
import { Card } from '../../src/components/ui/Card';
import {
  useOnboarding,
  useRegisterDevice,
  useMe,
} from '../../src/api/hooks';

type RoleChoice = 'student' | 'parent';

export default function OnboardingScreen() {
  const router = useRouter();
  const { data: me } = useMe();
  const onboardingMutation = useOnboarding();
  const registerDeviceMutation = useRegisterDevice();

  // Wizard state: 1 (role selection), 2 (details), 3 (notification prompt)
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [role, setRole] = useState<RoleChoice>('student');

  // Student details
  const [studentName, setStudentName] = useState(
    me?.user?.name && me.user.name !== 'Student' ? me.user.name : ''
  );
  const [classLevel, setClassLevel] = useState<number>(12);
  const [board, setBoard] = useState<'cbse' | 'icse' | 'isc'>('cbse');
  const [school, setSchool] = useState('');
  const [parentPhone, setParentPhone] = useState('');

  // Parent details
  const [parentName, setParentName] = useState(
    me?.user?.name && me.user.name !== 'Student' ? me.user.name : ''
  );
  const [inviteCode, setInviteCode] = useState('');

  // Errors & submission
  const [error, setError] = useState<string | null>(null);

  const handleRoleSelect = (selectedRole: RoleChoice) => {
    setRole(selectedRole);
    setStep(2);
    setError(null);
  };

  const handleStudentSubmit = async () => {
    if (!studentName.trim() || studentName.trim().length < 2) {
      setError('Please enter your full name (at least 2 characters)');
      return;
    }
    if (!school.trim() || school.trim().length < 2) {
      setError('Please enter your school name');
      return;
    }

    if (parentPhone.trim()) {
      const cleanPhone = parentPhone.replace(/\D/g, '');
      if (cleanPhone.length < 10) {
        setError('Please enter a valid 10-digit parent mobile number');
        return;
      }
    }

    setError(null);
    try {
      await onboardingMutation.mutateAsync({
        role: 'student',
        fullName: studentName.trim(),
        classLevel,
        board,
        school: school.trim(),
        parentPhone: parentPhone.trim() ? parentPhone.trim() : undefined,
      });

      // Advance to post-onboarding notification permission step
      setStep(3);
    } catch (err: any) {
      setError(err?.message || 'Failed to complete onboarding. Please try again.');
    }
  };

  const handleParentSubmit = async () => {
    if (!parentName.trim() || parentName.trim().length < 2) {
      setError('Please enter your full name (at least 2 characters)');
      return;
    }

    if (inviteCode.trim() && inviteCode.trim().length !== 6) {
      setError('Invite code must be exactly 6 characters');
      return;
    }

    setError(null);
    try {
      await onboardingMutation.mutateAsync({
        role: 'parent',
        fullName: parentName.trim(),
        inviteCode: inviteCode.trim() ? inviteCode.trim().toUpperCase() : undefined,
      });

      // Advance to post-onboarding notification permission step
      setStep(3);
    } catch (err: any) {
      setError(err?.message || 'Failed to complete onboarding. Please try again.');
    }
  };

  const handleNotificationPermission = async (grantPermission: boolean) => {
    if (grantPermission) {
      try {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }

        if (finalStatus === 'granted') {
          const tokenData = await Notifications.getExpoPushTokenAsync().catch(() => null);
          if (tokenData?.data) {
            await registerDeviceMutation.mutateAsync({
              expoPushToken: tokenData.data,
              platform: Platform.OS === 'ios' ? 'ios' : 'android',
              appVersion: '1.0.0',
            }).catch((err) => {
              console.warn('[push] Registration error:', err);
            });
          }
        }
      } catch (err) {
        console.warn('[notifications] Permission request error:', err);
      }
    }

    // Done with onboarding -> route to main app
    router.replace('/(app)' as any);
  };

  // Render Step 1: Who's using the app?
  const renderStep1 = () => (
    <View className="flex-1 justify-between">
      <View>
        <View className="mb-6">
          <Text className="text-h1 font-bold text-ink mb-2">
            Who's using the app?
          </Text>
          <Text className="text-body text-ink-muted leading-6">
            Choose your profile type so we can customize your Quick2Learn experience.
          </Text>
        </View>

        {/* Large Cards: Student vs Parent */}
        <View className="space-y-4">
          {/* Student Card */}
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="I am a student"
            onPress={() => handleRoleSelect('student')}
            activeOpacity={0.88}
          >
            <View className="p-5 rounded-2xl bg-surface border-2 border-border hover:border-primary active:border-primary active:bg-primary-soft/20 shadow-sm">
              <View className="flex-row items-center justify-between mb-3">
                <View className="w-14 h-14 rounded-2xl bg-primary-soft items-center justify-center">
                  <GraduationCap size={28} color="#3B82F6" />
                </View>
                <View className="w-6 h-6 rounded-full border border-border items-center justify-center">
                  <View className="w-2.5 h-2.5 rounded-full bg-border" />
                </View>
              </View>
              <Text className="text-h3 font-bold text-ink mb-1">
                I'm a student
              </Text>
              <Text className="text-small text-ink-muted leading-5">
                Attend classes, watch lecture recordings, access chapter notes, and track your practice scores.
              </Text>
            </View>
          </TouchableOpacity>

          {/* Parent Card */}
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="I am a parent"
            onPress={() => handleRoleSelect('parent')}
            activeOpacity={0.88}
          >
            <View className="p-5 rounded-2xl bg-surface border-2 border-border hover:border-primary active:border-primary active:bg-primary-soft/20 shadow-sm">
              <View className="flex-row items-center justify-between mb-3">
                <View className="w-14 h-14 rounded-2xl bg-success-soft items-center justify-center">
                  <Users size={28} color="#10B981" />
                </View>
                <View className="w-6 h-6 rounded-full border border-border items-center justify-center">
                  <View className="w-2.5 h-2.5 rounded-full bg-border" />
                </View>
              </View>
              <Text className="text-h3 font-bold text-ink mb-1">
                I'm a parent
              </Text>
              <Text className="text-small text-ink-muted leading-5">
                Follow your child's attendance, test results, fee dues, and batch announcements directly on your phone.
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  // Render Step 2 for Student
  const renderStudentStep2 = () => (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 32 }}
    >
      <View className="mb-6">
        <Text className="text-h2 font-bold text-ink mb-2">
          Tell us about yourself
        </Text>
        <Text className="text-body text-ink-muted">
          Help us personalize your math syllabus and study materials
        </Text>
      </View>

      {error && (
        <View className="bg-danger-soft p-3 rounded-xl border border-danger/20 mb-4">
          <Text className="text-caption text-danger font-medium">{error}</Text>
        </View>
      )}

      {/* Name */}
      <View className="mb-5">
        <TextField
          label="Full Name *"
          placeholder="e.g. Aarav Sharma"
          value={studentName}
          onChangeText={setStudentName}
          autoCapitalize="words"
        />
      </View>

      {/* Class Level Chips (IX to XII) */}
      <View className="mb-5">
        <Text className="text-small font-medium text-ink mb-2">
          Select Your Class *
        </Text>
        <View className="flex-row space-x-2">
          {[
            { label: 'Class IX', value: 9 },
            { label: 'Class X', value: 10 },
            { label: 'Class XI', value: 11 },
            { label: 'Class XII', value: 12 },
          ].map((item) => (
            <Chip
              key={item.value}
              label={item.label}
              selected={classLevel === item.value}
              onPress={() => setClassLevel(item.value)}
              className="flex-1 py-2.5"
            />
          ))}
        </View>
      </View>

      {/* Board Chips (CBSE / ICSE / ISC) */}
      <View className="mb-5">
        <Text className="text-small font-medium text-ink mb-2">
          Education Board *
        </Text>
        <View className="flex-row space-x-2">
          {[
            { label: 'CBSE', value: 'cbse' as const },
            { label: 'ICSE', value: 'icse' as const },
            { label: 'ISC', value: 'isc' as const },
          ].map((item) => (
            <Chip
              key={item.value}
              label={item.label}
              selected={board === item.value}
              onPress={() => setBoard(item.value)}
              className="flex-1 py-2.5"
            />
          ))}
        </View>
      </View>

      {/* School Name */}
      <View className="mb-5">
        <TextField
          label="School / College Name *"
          placeholder="e.g. Delhi Public School, Mathura"
          value={school}
          onChangeText={setSchool}
          leftIcon={<School size={18} color="#9CA3AF" />}
        />
      </View>

      {/* Parent's Phone (Optional with reason) */}
      <View className="mb-6">
        <TextField
          label="Parent's Mobile Number (Optional)"
          placeholder="98765 43210"
          value={parentPhone}
          onChangeText={setParentPhone}
          keyboardType="phone-pad"
          maxLength={10}
          helperText="so your parent can follow your progress"
        />
      </View>

      <Button
        variant="primary"
        size="lg"
        fullWidth
        loading={onboardingMutation.isPending}
        disabled={onboardingMutation.isPending}
        onPress={handleStudentSubmit}
      >
        Complete Setup
      </Button>
    </ScrollView>
  );

  // Render Step 2 for Parent
  const renderParentStep2 = () => {
    const linkedStudents = me?.linkedStudents || [];

    return (
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        <View className="mb-6">
          <Text className="text-h2 font-bold text-ink mb-2">
            Parent Profile Setup
          </Text>
          <Text className="text-body text-ink-muted">
            Connect with your child's Quick2Learn academic dashboard
          </Text>
        </View>

        {error && (
          <View className="bg-danger-soft p-3 rounded-xl border border-danger/20 mb-4">
            <Text className="text-caption text-danger font-medium">{error}</Text>
          </View>
        )}

        {/* Parent Name */}
        <View className="mb-6">
          <TextField
            label="Your Full Name *"
            placeholder="e.g. Rajesh Sharma"
            value={parentName}
            onChangeText={setParentName}
            autoCapitalize="words"
          />
        </View>

        {/* Linked Children Found by Phone */}
        {linkedStudents.length > 0 ? (
          <View className="mb-6 bg-success-soft/40 border border-success/20 p-4 rounded-2xl">
            <View className="flex-row items-center mb-2">
              <CheckCircle2 size={18} color="#10B981" />
              <Text className="text-small font-bold text-ink ml-1.5">
                Children Found via Phone Number
              </Text>
            </View>
            <Text className="text-caption text-ink-muted mb-3">
              We automatically connected your account with your children:
            </Text>
            {linkedStudents.map((child) => (
              <View
                key={child.id}
                className="bg-surface p-3 rounded-xl border border-border flex-row items-center justify-between mb-2"
              >
                <View>
                  <Text className="text-body font-bold text-ink">
                    {child.fullName}
                  </Text>
                  <Text className="text-caption text-ink-muted">
                    Class {child.classLevel || 'N/A'} • {child.board?.toUpperCase() || ''} • {child.school || ''}
                  </Text>
                </View>
                <View className="bg-success-soft px-2.5 py-1 rounded-full">
                  <Text className="text-caption font-semibold text-success">
                    Linked
                  </Text>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View className="mb-6 bg-surface-subtle p-4 rounded-2xl border border-border">
            <Text className="text-small font-bold text-ink mb-1">
              Link Your Child
            </Text>
            <Text className="text-caption text-ink-muted mb-3">
              If your phone wasn't listed on your child's profile, enter the 6-character parent invite code shown in their Profile tab:
            </Text>
            <TextField
              label="Student Invite Code (6 characters)"
              placeholder="e.g. 8K4M9P"
              value={inviteCode}
              onChangeText={(text) => setInviteCode(text.toUpperCase())}
              autoCapitalize="characters"
              maxLength={6}
              leftIcon={<KeyRound size={18} color="#9CA3AF" />}
            />
          </View>
        )}

        <Button
          variant="primary"
          size="lg"
          fullWidth
          loading={onboardingMutation.isPending}
          disabled={onboardingMutation.isPending}
          onPress={handleParentSubmit}
        >
          Complete Setup
        </Button>
      </ScrollView>
    );
  };

  // Render Step 3: Notification Permission
  const renderStep3 = () => (
    <View className="flex-1 justify-between py-6">
      <View className="items-center mt-12 px-4">
        <View className="w-20 h-20 rounded-full bg-primary-soft items-center justify-center mb-6">
          <Bell size={38} color="#3B82F6" />
        </View>

        <Text className="text-h2 font-bold text-ink text-center mb-3">
          Never miss an important class
        </Text>

        <Text className="text-body text-ink-muted text-center leading-6 max-w-[280px]">
          Get a ping when class goes live
        </Text>
      </View>

      <View className="w-full space-y-3 px-2">
        <Button
          variant="primary"
          size="lg"
          fullWidth
          onPress={() => handleNotificationPermission(true)}
        >
          Allow Notifications
        </Button>

        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Maybe later"
          onPress={() => handleNotificationPermission(false)}
          className="py-3 items-center justify-center"
          hitSlop={{ top: 8, bottom: 8, left: 16, right: 16 }}
        >
          <Text className="text-small font-medium text-ink-muted">
            Maybe later
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        {/* Top Header with Progress Bar */}
        {step !== 3 && (
          <View className="px-6 pt-4 pb-2">
            <View className="flex-row items-center justify-between mb-3">
              {step === 2 ? (
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel="Back to step 1"
                  onPress={() => setStep(1)}
                  className="w-8 h-8 items-center justify-center rounded-full active:bg-surface-subtle -ml-2"
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <ArrowLeft size={20} color="#1F2937" />
                </TouchableOpacity>
              ) : (
                <View className="w-8" />
              )}
              <Text className="text-caption font-semibold text-ink-muted">
                Step {step} of 2
              </Text>
              <View className="w-8" />
            </View>

            <ProgressBar
              progress={step === 1 ? 50 : 100}
              className="h-2 rounded-full"
            />
          </View>
        )}

        {/* Content Body */}
        <View className="flex-1 px-6 pt-4">
          {step === 1 && renderStep1()}
          {step === 2 && role === 'student' && renderStudentStep2()}
          {step === 2 && role === 'parent' && renderParentStep2()}
          {step === 3 && renderStep3()}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
