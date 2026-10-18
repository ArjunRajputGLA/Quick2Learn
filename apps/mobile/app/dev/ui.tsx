import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Screen,
  AppHeader,
  Button,
  TextField,
  OtpInput,
  Chip,
  SegmentedControl,
  Card,
  ListRow,
  ProgressRing,
  ProgressBar,
  Badge,
  Avatar,
  BottomSheet,
  Toast,
  Skeleton,
  EmptyState,
  ErrorState,
  OfflineBanner,
  SectionHeader,
} from '../../src/components/ui';
import {
  LectureRow,
  PdfRow,
  BatchCard,
  LiveBanner,
  TestCard,
  AnnouncementCard,
} from '../../src/components/composite';
import {
  BookOpen,
  Download,
  FileText,
  HelpCircle,
  Play,
  Search,
  Sparkles,
  User,
  Video,
} from 'lucide-react-native';

export default function DevUiScreen() {
  const router = useRouter();

  // Component state toggles for interactive testing
  const [textFieldVal, setTextFieldVal] = useState('Dinesh Singh Rajput');
  const [passwordVal, setPasswordVal] = useState('SecurePass123');
  const [otpVal, setOtpVal] = useState('482910');
  const [emptyOtpVal, setEmptyOtpVal] = useState('');
  const [chipSelected, setChipSelected] = useState<string>('Class XII');
  const [segmentIndex, setSegmentIndex] = useState(0);
  const [bottomSheetVisible, setBottomSheetVisible] = useState(false);
  const [toastDismissed, setToastDismissed] = useState(false);
  const [errorRetrying, setErrorRetrying] = useState(false);

  // If not development build, return 404/not available
  if (!__DEV__) {
    return (
      <Screen subtle>
        <EmptyState
          title="Not Available"
          description="The component showcase is only accessible in development builds."
          actionLabel="Go Home"
          onAction={() => router.replace('/' as any)}
        />
      </Screen>
    );
  }

  return (
    <Screen
      subtle
      header={
        <AppHeader
          title="Component Showcase"
          subtitle="All components in every state"
          showBack
          onBack={() => router.back()}
        />
      }
    >
      <View className="p-4 space-y-6">
        {/* Intro Banner */}
        <View className="bg-primary-soft p-4 rounded-xl border border-primary/20 mb-4">
          <Text className="text-body font-bold text-primary mb-1">
            Design Tokens & UI Kit Showcase
          </Text>
          <Text className="text-small text-ink leading-relaxed">
            Tested for budget Android devices (360 dp width, 130% font scale).
            All touch targets are minimum 48 dp.
          </Text>
        </View>

        {/* 1. OfflineBanner */}
        <SectionHeader title="1. Offline Banner" className="px-0" />
        <Card className="p-0 overflow-hidden">
          <OfflineBanner forcedOffline />
        </Card>

        {/* 2. Buttons */}
        <SectionHeader title="2. Button States & Sizes" className="px-0" />
        <Card className="space-y-3">
          <Text className="text-caption font-semibold text-ink-muted uppercase">
            Primary Variant
          </Text>
          <Button variant="primary">Primary Button</Button>
          <Button variant="primary" loading>Loading State</Button>
          <Button variant="primary" disabled>Disabled State</Button>
          <Button
            variant="primary"
            icon={<Sparkles size={18} color="#FFFFFF" />}
            iconPosition="left"
          >
            With Left Icon
          </Button>

          <Text className="text-caption font-semibold text-ink-muted uppercase mt-3">
            Outline & Ghost Variants
          </Text>
          <Button variant="outline">Outline Button</Button>
          <Button variant="ghost">Ghost Button</Button>
          <Button variant="danger">Danger Button</Button>

          <Text className="text-caption font-semibold text-ink-muted uppercase mt-3">
            Button Sizes (Min 48dp Touch Targets)
          </Text>
          <View className="flex-row items-center space-x-2">
            <Button variant="primary" size="sm" className="flex-1 mr-2">
              Small
            </Button>
            <Button variant="primary" size="md" className="flex-1 mr-2">
              Medium
            </Button>
            <Button variant="primary" size="lg" className="flex-1">
              Large
            </Button>
          </View>
        </Card>

        {/* 3. Text Fields */}
        <SectionHeader title="3. TextField States" className="px-0" />
        <Card className="space-y-4">
          <TextField
            label="Student Full Name"
            placeholder="Enter your name"
            value={textFieldVal}
            onChangeText={setTextFieldVal}
            clearable
            leftIcon={<User size={18} color="#6B7280" />}
            helperText="Matches your board registration certificate"
          />

          <TextField
            label="Password"
            placeholder="Enter your password"
            value={passwordVal}
            onChangeText={setPasswordVal}
            isPassword
          />

          <TextField
            label="Email Address (Error State)"
            placeholder="student@example.com"
            value="invalid-email@"
            error="Please enter a valid email address"
          />

          <TextField
            label="Roll Number (Disabled)"
            placeholder="Not assigned"
            value="Q2L-2027-0091"
            editable={false}
          />
        </Card>

        {/* 4. OtpInput */}
        <SectionHeader title="4. OtpInput (6 Boxes & Autofill)" className="px-0" />
        <Card className="space-y-4">
          <Text className="text-small text-ink-muted mb-2">
            Supports pasting full 6-digit codes and SMS autofill (autoComplete="sms-otp"):
          </Text>
          <OtpInput
            value={otpVal}
            onChange={setOtpVal}
          />

          <Text className="text-caption font-semibold text-ink-muted mt-3">
            Empty State:
          </Text>
          <OtpInput
            value={emptyOtpVal}
            onChange={setEmptyOtpVal}
          />

          <Text className="text-caption font-semibold text-ink-muted mt-3">
            Error State:
          </Text>
          <OtpInput
            value="123"
            onChange={() => {}}
            error="Incorrect OTP. 2 attempts remaining."
          />
        </Card>

        {/* 5. Chips */}
        <SectionHeader title="5. Chips & Filters" className="px-0" />
        <Card>
          <View className="flex-row flex-wrap gap-2">
            {['Class IX', 'Class X', 'Class XI', 'Class XII'].map((cls) => (
              <Chip
                key={cls}
                label={cls}
                selected={chipSelected === cls}
                onPress={() => setChipSelected(cls)}
              />
            ))}
            <Chip
              label="Mathematics"
              selected={true}
              icon={<BookOpen size={14} color="#FFFFFF" />}
            />
            <Chip label="Chemistry (Disabled)" disabled />
          </View>
        </Card>

        {/* 6. SegmentedControl */}
        <SectionHeader title="6. Segmented Control" className="px-0" />
        <Card>
          <SegmentedControl
            options={['Lectures', 'Notes', 'Assignments', 'Tests']}
            selectedIndex={segmentIndex}
            onChange={setSegmentIndex}
          />
        </Card>

        {/* 7. ListRow */}
        <SectionHeader title="7. List Rows" className="px-0" />
        <Card className="p-0 overflow-hidden">
          <ListRow
            icon={<Video size={20} color="#3B82F6" />}
            title="Video Lecture 1: Sets & Relations"
            subtitle="Uploaded on Mon, 22 Apr • 45 mins"
            showChevron
            onPress={() => {}}
          />
          <ListRow
            icon={<FileText size={20} color="#3B82F6" />}
            title="Assignment 2 Solutions PDF"
            subtitle="Size 3.2 MB"
            trailing={<Badge label="New" variant="accent" size="sm" />}
            onPress={() => {}}
          />
          <ListRow
            title="Doubt Clearing Session Recording"
            subtitle="Recorded on Sat, 20 Apr"
            showChevron
            border={false}
            onPress={() => {}}
          />
        </Card>

        {/* 8. Progress Metrics */}
        <SectionHeader title="8. Progress Ring & Bar" className="px-0" />
        <Card className="space-y-4">
          <Text className="text-caption font-semibold text-ink-muted uppercase">
            Progress Rings (0%, 45%, 75%, 100%)
          </Text>
          <View className="flex-row items-center justify-around py-2">
            <ProgressRing progress={0} size={52} />
            <ProgressRing progress={45} size={52} />
            <ProgressRing progress={75} size={52} color="#F59E0B" />
            <ProgressRing progress={100} size={52} color="#15803D" />
          </View>

          <Text className="text-caption font-semibold text-ink-muted uppercase mt-3">
            Progress Bars
          </Text>
          <ProgressBar progress={25} height={6} />
          <ProgressBar progress={60} height={6} color="#F59E0B" />
          <ProgressBar progress={100} height={6} color="#15803D" />
        </Card>

        {/* 9. Badges & Avatars */}
        <SectionHeader title="9. Badges & Avatars" className="px-0" />
        <Card className="space-y-4">
          <Text className="text-caption font-semibold text-ink-muted uppercase">
            Badge Variants
          </Text>
          <View className="flex-row flex-wrap gap-2">
            <Badge label="Primary" variant="primary" />
            <Badge label="Accent" variant="accent" />
            <Badge label="Success" variant="success" />
            <Badge label="Warning" variant="warning" />
            <Badge label="Danger" variant="danger" />
            <Badge label="Neutral" variant="neutral" />
            <Badge label="Live Dot" variant="danger" dot />
          </View>

          <Text className="text-caption font-semibold text-ink-muted uppercase mt-3">
            Avatar Sizes & Fallback Initials
          </Text>
          <View className="flex-row items-center space-x-3">
            <Avatar name="Dinesh Singh Rajput" size="sm" />
            <View className="w-2" />
            <Avatar name="Namita Singh Rajput" size="md" />
            <View className="w-2" />
            <Avatar name="Quick2Learn" size="lg" />
            <View className="w-2" />
            <Avatar name="Student Profile" size="xl" />
          </View>
        </Card>

        {/* 10. Toasts */}
        <SectionHeader title="10. Toast Feedback" className="px-0" />
        <View className="space-y-3">
          <Toast
            type="info"
            title="Notice"
            message="Mathura center will remain open on Sunday for revision tests."
          />
          <Toast
            type="success"
            title="Enrolment Confirmed"
            message="Receipt #Q2L-2027-0012 has been sent to your email."
          />
          {!toastDismissed && (
            <Toast
              type="error"
              title="Connection Timeout"
              message="Tap to dismiss this error alert."
              onDismiss={() => setToastDismissed(true)}
            />
          )}
        </View>

        {/* 11. Skeletons */}
        <SectionHeader title="11. Skeletons (Loading Placeholders)" className="px-0" />
        <Card className="space-y-3">
          <View className="flex-row items-center space-x-3">
            <Skeleton width={44} height={44} borderRadius={22} />
            <View className="flex-1 ml-3 space-y-2">
              <Skeleton width="80%" height={16} />
              <View className="h-1" />
              <Skeleton width="50%" height={12} />
            </View>
          </View>
          <Skeleton width="100%" height={120} borderRadius={12} />
        </Card>

        {/* 12. BottomSheet Trigger */}
        <SectionHeader title="12. Bottom Sheet" className="px-0" />
        <Card>
          <Button
            variant="outline"
            onPress={() => setBottomSheetVisible(true)}
          >
            Open Interactive Bottom Sheet
          </Button>

          <BottomSheet
            visible={bottomSheetVisible}
            onClose={() => setBottomSheetVisible(false)}
            title="Batch Details"
          >
            <View className="py-2 space-y-3">
              <Text className="text-body text-ink leading-relaxed">
                Quick2Learn batches are taught exclusively by Dinesh Singh Rajput (Mathematics) and Namita Singh Rajput (ICSE Chemistry & Biology).
              </Text>
              <Button
                variant="primary"
                onPress={() => setBottomSheetVisible(false)}
                className="mt-4"
              >
                Close Sheet
              </Button>
            </View>
          </BottomSheet>
        </Card>

        {/* 13. Empty & Error States */}
        <SectionHeader title="13. Empty & Error States" className="px-0" />
        <Card className="p-0 overflow-hidden mb-4">
          <EmptyState
            title="No lectures watched yet"
            description="Start watching recorded classes to build your daily study streak."
            actionLabel="Explore Free Lectures"
            onAction={() => {}}
          />
        </Card>

        <Card className="p-0 overflow-hidden">
          <ErrorState
            title="Could not load assignments"
            message="Server could not be reached. Check your network or retry."
            retrying={errorRetrying}
            onRetry={() => {
              setErrorRetrying(true);
              setTimeout(() => setErrorRetrying(false), 1500);
            }}
          />
        </Card>

        {/* 14. Composite Components */}
        <SectionHeader title="14. Composite: LectureRow" className="px-0" />
        <Card className="p-0 overflow-hidden">
          <LectureRow
            title="Definite Integrals - Properties & Standard Formulas"
            chapterOrSubject="Mathematics • Chapter 7"
            duration="54:30"
            watched={true}
            onPress={() => {}}
          />
          <LectureRow
            title="Application of Integrals - Area between Parabolas"
            chapterOrSubject="Mathematics • Chapter 8"
            duration="42:15"
            progressPercentage={60}
            onPress={() => {}}
          />
          <LectureRow
            title="Differential Equations - Homogeneous Equations"
            chapterOrSubject="Mathematics • Chapter 9"
            duration="38:00"
            progressPercentage={0}
            onPress={() => {}}
          />
        </Card>

        <SectionHeader title="15. Composite: PdfRow" className="px-0" />
        <Card className="p-0 overflow-hidden">
          <PdfRow
            title="CBSE Class XII Mathematics Question Bank (2015-2026)"
            size="5.8 MB"
            downloadState="idle"
            onPress={() => {}}
          />
          <PdfRow
            title="Vector Algebra Important Formulas & Summary"
            size="1.2 MB"
            downloadState="downloading"
            onPress={() => {}}
          />
          <PdfRow
            title="Three Dimensional Geometry NCERT Complete Solutions"
            size="3.6 MB"
            downloadState="downloaded"
            onPress={() => {}}
          />
        </Card>

        <SectionHeader title="16. Composite: BatchCard" className="px-0" />
        <BatchCard
          classNameBadge="Class XII"
          boardBadge="CBSE"
          title="Target Board 2027 Mathematics"
          teacher="Dinesh Singh Rajput"
          nextClassTime="Mon, 22 Apr at 8:00 PM"
          progressPercentage={74}
          completedLectures={37}
          totalLectures={50}
          onPress={() => {}}
        />

        <View className="h-3" />
        <BatchCard
          classNameBadge="Class X"
          boardBadge="ICSE"
          title="ICSE Chemistry & Biology Masterclass"
          teacher="Namita Singh Rajput"
          nextClassTime="Tue, 23 Apr at 6:00 PM"
          progressPercentage={40}
          completedLectures={12}
          totalLectures={30}
          onPress={() => {}}
        />

        <SectionHeader title="17. Composite: LiveBanner" className="px-0" />
        <LiveBanner
          title="Integration by Parts - Live Doubt Session"
          isLive={true}
          timeOrCountdown="Live now"
          onJoin={() => {}}
        />
        <View className="h-3" />
        <LiveBanner
          title="Board Paper Solving Strategy Session"
          isLive={false}
          timeOrCountdown="Starts in 15 mins"
          onJoin={() => {}}
        />

        <SectionHeader title="18. Composite: TestCard" className="px-0" />
        <TestCard
          title="Relations & Functions - Practice Test 1"
          questionsCount={25}
          durationMinutes={60}
          status="not_started"
          onActionPress={() => {}}
        />
        <View className="h-3" />
        <TestCard
          title="Inverse Trigonometric Functions Unit Test"
          questionsCount={30}
          durationMinutes={75}
          status="completed"
          score="94/100"
          onActionPress={() => {}}
        />

        <SectionHeader title="19. Composite: AnnouncementCard" className="px-0" />
        <AnnouncementCard
          title="Special Sunday Mathematics Practice Session"
          message="Offline batch at Mathura center will run from 9:00 AM to 12:00 PM covering calculus previous year board questions."
          date="Mon, 22 Apr"
          category="Schedule Update"
          onPress={() => {}}
        />
      </View>
    </Screen>
  );
}
