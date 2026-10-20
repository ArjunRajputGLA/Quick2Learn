import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Dimensions,
  Share,
  Linking,
  Modal,
  Alert,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Image } from 'expo-image';
import {
  Bell,
  Sparkles,
  Calendar,
  Clock,
  MapPin,
  GraduationCap,
  Play,
  KeyRound,
  Share2,
  ChevronRight,
  AlertCircle,
  Award,
  CreditCard,
  Layers,
  FileText,
  Volume2,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useHome, useAvailableTests, useMe, queryKeys } from '../../../src/api/hooks';
import { ParentHomeScreen } from '../../../src/components/parent/ParentHomeScreen';
import { useQueryClient } from '@tanstack/react-query';
import { OfflineBanner } from '../../../src/components/ui/OfflineBanner';
import { Skeleton } from '../../../src/components/ui/Skeleton';
import { NotificationBell } from '../../../src/components/ui/NotificationBell';
import { Button } from '../../../src/components/ui/Button';
import { Badge } from '../../../src/components/ui/Badge';
import { TextField } from '../../../src/components/ui/TextField';
import { ProgressBar } from '../../../src/components/ui/ProgressBar';
import { LiveBanner } from '../../../src/components/composite/LiveBanner';
import { analytics } from '../../../src/lib/analytics';
import { colors, radii } from '@quick2learn/shared';
import type { AppBannerItem, HomeFreeLecture, ContinueWatchingItem } from '@quick2learn/shared';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { data: me } = useMe();
  const isParent = me?.role === 'parent';

  if (isParent) {
    return <ParentHomeScreen />;
  }

  const { data: home, isLoading, isRefetching, refetch } = useHome();
  const { data: availableTestsData, refetch: refetchTests } = useAvailableTests();

  const [refreshing, setRefreshing] = useState(false);
  const [showBatchCodeModal, setShowBatchCodeModal] = useState(false);
  const [batchCodeInput, setBatchCodeInput] = useState('');
  const [isSubmittingCode, setIsSubmittingCode] = useState(false);

  // Refresh home data on screen focus
  useFocusEffect(
    useCallback(() => {
      refetch();
      refetchTests();
    }, [refetch, refetchTests])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleShareApp = async () => {
    try {
      const shareData = home?.shareApp || {
        title: 'Quick2Learn App',
        message: 'Master CBSE & ICSE Mathematics with Dinesh Singh Rajput Sir on Quick2Learn.',
        url: 'https://play.google.com/store/apps/details?id=in.quick2learn.app',
      };
      await Share.share({
        title: shareData.title,
        message: `${shareData.message}\n${shareData.url}`,
      });
    } catch (err) {
      console.warn('Share error:', err);
    }
  };

  const handleBannerPress = (banner: AppBannerItem) => {
    if (banner.targetType === 'url') {
      Linking.openURL(banner.targetValue).catch((e) =>
        console.warn('Cannot open banner url:', e)
      );
    } else if (banner.targetType === 'batch') {
      router.push(`/batch/${banner.targetValue}` as any);
    } else if (banner.targetType === 'lecture') {
      router.push(`/lecture/${banner.targetValue}` as any);
    } else if (banner.route) {
      router.push(banner.route as any);
    }
  };

  const handleSubmitBatchCode = async () => {
    if (!batchCodeInput.trim()) {
      Alert.alert('Required', 'Please enter a valid batch code.');
      return;
    }
    try {
      setIsSubmittingCode(true);
      setShowBatchCodeModal(false);
      setBatchCodeInput('');
      Alert.alert(
        'Request Submitted',
        'Your batch admission request has been submitted to Dinesh Sir for review.'
      );
    } finally {
      setIsSubmittingCode(false);
    }
  };

  // 1. Loading Skeleton State (< 1.5s target)
  if (isLoading && !home) {
    return (
      <View className="flex-1 bg-surface-subtle" style={{ paddingTop: insets.top }}>
        <View
          style={{
            marginHorizontal: 12,
            marginTop: 4,
            marginBottom: 6,
            paddingHorizontal: 14,
            paddingVertical: 7,
            borderRadius: 24,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: 'rgba(226, 232, 240, 0.9)',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
          className="mx-3 mt-1 mb-1.5 px-3.5 py-1.5 flex-row items-center justify-between rounded-full bg-surface border border-border shadow-xs"
        >
          <View className="flex-row items-center space-x-2">
            <Skeleton width={110} height={20} borderRadius={6} />
            <Skeleton width={70} height={18} borderRadius={10} className="ml-2" />
          </View>
          <Skeleton width={34} height={34} borderRadius={17} />
        </View>

        <ScrollView className="p-4 space-y-4">
          <Skeleton width="100%" height={90} borderRadius={16} className="mb-4" />
          <Skeleton width="100%" height={160} borderRadius={16} className="mb-4" />
          <Skeleton width={180} height={20} borderRadius={4} className="mb-2" />
          <Skeleton width="100%" height={74} borderRadius={12} className="mb-2" />
          <Skeleton width="100%" height={74} borderRadius={12} className="mb-4" />
          <Skeleton width="100%" height={140} borderRadius={16} />
        </ScrollView>
      </View>
    );
  }

  const header = home?.header;
  const unreadCount = header?.unreadNotificationsCount ?? 0;
  const liveClass = home?.liveClass;
  const continueWatching = home?.continueWatching || [];
  const todayClasses = home?.todayClasses || [];
  const upcomingTests = home?.upcomingTests || [];
  const recentResults = home?.recentResults || [];
  const feeAlert = home?.feeAlert;
  const announcements = home?.announcements || [];
  const banners = home?.banners || [];
  const freeLectures = home?.freeLectures || [];
  const enrolledBatchesCount = home?.enrolledBatchesCount ?? 0;

  // Resolve the logged-in person's name accurately
  const rawName =
    me?.profile?.fullName ||
    me?.user?.name ||
    header?.fullName ||
    header?.firstName ||
    'Student';
  // Strip parenthetical role notes if any (e.g., "Dinesh Sir (Administrator)" -> "Dinesh Sir")
  const cleanName = rawName.replace(/\s*\([^)]*\)/g, '').trim() || 'Student';
  const displayName = cleanName;

  // Resolve chip label dynamically based on profile or header
  const chipLabel =
    me?.role === 'teacher'
      ? 'Faculty'
      : me?.role === 'admin'
      ? 'Administrator'
      : me?.profile?.classLevel
      ? `Class ${me.profile.classLevel} • ${(me.profile.board || 'CBSE').toUpperCase()}`
      : header?.chipLabel || null;

  return (
    <View className="flex-1 bg-surface-subtle" style={{ paddingTop: insets.top }}>
      {/* Offline banner indicator (shows cached data) */}
      <OfflineBanner />

      {/* 1. Header Island: "Hi, [Name]", class/board chip, notification bell */}
      <View
        style={{
          marginHorizontal: 12,
          marginTop: 4,
          marginBottom: 6,
          paddingHorizontal: 14,
          paddingVertical: 7,
          minHeight: 48,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderRadius: 24,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: 'rgba(226, 232, 240, 0.9)',
          shadowColor: '#0F172A',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.06,
          shadowRadius: 6,
          elevation: 3,
        }}
        className="mx-3 mt-1 mb-1.5 px-3.5 py-1.5 flex-row items-center justify-between bg-surface rounded-full border border-border shadow-xs"
      >
        <View style={{ flex: 1, paddingRight: 8, justifyContent: 'center' }} className="flex-1 pr-2 justify-center">
          <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'nowrap', gap: 6 }} className="flex-row items-center">
            <Text
              style={{ fontSize: 15, fontWeight: '700', color: colors.ink, flexShrink: 1 }}
              className="text-body font-bold text-ink mr-1.5"
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              Hi, {displayName}
            </Text>
            {chipLabel ? (
              <View
                style={{
                  backgroundColor: colors['primary-soft'],
                  paddingHorizontal: 7,
                  paddingVertical: 1.5,
                  borderRadius: radii.full,
                  borderWidth: 1,
                  borderColor: 'rgba(37, 99, 235, 0.2)',
                  flexShrink: 0,
                }}
                className="bg-primary-soft px-1.5 py-0.5 rounded-full border border-primary/20"
              >
                <Text style={{ fontSize: 10, fontWeight: '600', color: colors.primary }} className="text-[10px] font-semibold text-primary">
                  {chipLabel}
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Bell Button */}
        <NotificationBell count={unreadCount} />
      </View>

      {/* Main Home Scroll Area */}
      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing || isRefetching}
            onRefresh={onRefresh}
            colors={['#2563EB']}
            tintColor="#2563EB"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* 2. LiveBanner (when class is live now or starting within 15 mins) */}
        {liveClass ? (
          <View className="px-4 pt-4">
            <LiveBanner
              title={`${liveClass.subjectName} • ${liveClass.batchTitle}`}
              isLive={liveClass.isLive}
              timeOrCountdown={liveClass.timeOrCountdown}
              onJoin={() => {
                analytics.track('live_joined', {
                  batchId: (liveClass as any).batchId || 'live_session',
                  sessionId: (liveClass as any).sessionId,
                  isTeacher: false,
                });
                if (liveClass.joinUrl) {
                  Linking.openURL(liveClass.joinUrl).catch(() => {});
                } else if (liveClass.route) {
                  router.push(liveClass.route as any);
                }
              }}
            />
          </View>
        ) : null}

        {/* Live Test Card (When test is Live now or In Progress) */}
        {(() => {
          const liveTest = availableTestsData?.tests?.find(
            (t) => t.status === 'live' || t.latestAttemptStatus === 'in_progress'
          );
          if (!liveTest) return null;

          const isInProgress = liveTest.latestAttemptStatus === 'in_progress';

          return (
            <View className="px-4 pt-4">
              <View className="bg-primary rounded-2xl p-4 shadow-sm border border-primary/30 flex-row items-center justify-between">
                <View className="flex-1 mr-3">
                  <View className="flex-row items-center mb-1">
                    <View className="w-2.5 h-2.5 rounded-full bg-emerald-400 mr-2" />
                    <Text className="text-[11px] font-bold uppercase tracking-wider text-white">
                      {isInProgress ? 'RESUME TEST' : 'TEST LIVE NOW'}
                    </Text>
                  </View>
                  <Text className="text-body font-bold text-white mb-0.5" numberOfLines={1}>
                    {liveTest.title}
                  </Text>
                  <Text className="text-caption text-white/80">
                    {liveTest.subjectName || 'Maths & Science'} • {liveTest.durationMinutes} mins • {liveTest.totalMarks} marks
                  </Text>
                </View>

                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => router.push(`/test/${liveTest.id}` as any)}
                  className="bg-white px-3.5 py-2.5 rounded-xl shadow-2xs"
                >
                  <Text className="text-small font-bold text-primary">
                    {isInProgress ? 'Resume' : 'Start'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })()}

        {/* 3. Fee alert (when due within 7 days or overdue) */}
        {feeAlert ? (
          <View className="px-4 pt-4">
            <View
              className={`rounded-2xl p-4 border shadow-sm ${
                feeAlert.isOverdue
                  ? 'bg-red-50/80 border-red-200'
                  : 'bg-amber-50/80 border-amber-200'
              }`}
            >
              <View className="flex-row items-center justify-between mb-1.5">
                <View className="flex-row items-center">
                  <AlertCircle
                    size={16}
                    color={feeAlert.isOverdue ? '#DC2626' : '#D97706'}
                  />
                  <Text
                    className={`text-caption font-bold uppercase tracking-wider ml-1.5 ${
                      feeAlert.isOverdue ? 'text-danger' : 'text-amber-700'
                    }`}
                  >
                    {feeAlert.label}
                  </Text>
                </View>
                <Text
                  className={`text-caption font-bold ${
                    feeAlert.isOverdue ? 'text-danger' : 'text-amber-800'
                  }`}
                >
                  {feeAlert.isOverdue
                    ? `Overdue by ${Math.abs(feeAlert.daysRemaining)}d`
                    : `Due in ${feeAlert.daysRemaining}d`}
                </Text>
              </View>

              <View className="flex-row items-center justify-between mt-1">
                <View>
                  <Text className="text-h3 font-bold text-ink">
                    {feeAlert.formattedAmount}
                  </Text>
                  <Text className="text-caption text-ink-muted">
                    {feeAlert.batchTitle} • Due {feeAlert.dueDate}
                  </Text>
                </View>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => router.push(feeAlert.route as any)}
                  className={`py-2 px-3.5 rounded-xl min-h-[40px] justify-center ${
                    feeAlert.isOverdue ? 'bg-danger' : 'bg-primary'
                  }`}
                >
                  <Text className="text-small font-bold text-white">
                    Pay Now
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ) : null}

        {/* 4. Continue watching (the last 5 partly watched lectures with progress bars) */}
        {continueWatching.length > 0 ? (
          <View className="pt-5">
            <View className="px-4 flex-row items-center justify-between mb-2.5">
              <Text className="text-h3 font-bold text-ink">
                Continue Watching
              </Text>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16 }}
            >
              {continueWatching.map((item: ContinueWatchingItem) => (
                <TouchableOpacity
                  key={item.id}
                  activeOpacity={0.85}
                  onPress={() => router.push(item.route as any)}
                  className="w-[220px] mr-3 bg-surface rounded-2xl border border-border overflow-hidden shadow-sm"
                >
                  {/* Thumbnail with progress */}
                  <View className="w-full h-[120px] bg-ink/10 relative justify-end">
                    {item.thumbnailUrl ? (
                      <Image
                        source={{ uri: item.thumbnailUrl }}
                        style={{ width: '100%', height: '100%', position: 'absolute' }}
                        contentFit="cover"
                        transition={200}
                      />
                    ) : (
                      <View className="absolute inset-0 bg-primary-soft items-center justify-center">
                        <Play size={28} color="#2563EB" />
                      </View>
                    )}

                    {/* Duration badge */}
                    <View className="absolute bottom-2 right-2 bg-black/75 px-1.5 py-0.5 rounded">
                      <Text className="text-[10px] font-bold text-white">
                        {item.durationFormatted}
                      </Text>
                    </View>

                    {/* Progress bar */}
                    <View className="w-full">
                      <ProgressBar
                        progress={item.progressPercent}
                        height={4}
                        color="#2563EB"
                        trackColor="rgba(0,0,0,0.4)"
                      />
                    </View>
                  </View>

                  <View className="p-3">
                    <Text
                      className="text-body font-semibold text-ink leading-snug"
                      numberOfLines={2}
                    >
                      {item.title}
                    </Text>
                    {item.subjectName || item.chapterTitle ? (
                      <Text
                        className="text-caption text-ink-muted mt-1"
                        numberOfLines={1}
                      >
                        {item.subjectName}
                        {item.chapterTitle ? ` • ${item.chapterTitle}` : ''}
                      </Text>
                    ) : null}
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        ) : null}

        {/* 5. Today's Classes (from batch timetables) */}
        {todayClasses.length > 0 ? (
          <View style={{ paddingHorizontal: 16, paddingTop: 14 }} className="px-4 pt-3.5">
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }} className="flex-row items-center justify-between mb-2">
              <View style={{ flexDirection: 'row', alignItems: 'center' }} className="flex-row items-center">
                <Calendar size={16} color={colors.primary} />
                <Text style={{ fontSize: 15, fontWeight: '700', color: colors.ink, marginLeft: 6 }} className="text-body font-bold text-ink ml-1.5">
                  Classes Today
                </Text>
              </View>
              <Badge label="Today" variant="primary" size="sm" />
            </View>

            <View style={{ gap: 8 }} className="space-y-2">
              {todayClasses.map((cls) => (
                <TouchableOpacity
                  key={cls.batchId}
                  activeOpacity={0.8}
                  onPress={() => router.push(cls.route as any)}
                  style={{
                    backgroundColor: colors.surface,
                    borderRadius: radii.md,
                    padding: 12,
                    borderWidth: 1,
                    borderColor: colors.border,
                    marginBottom: 8,
                    elevation: 1,
                    shadowColor: '#000000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.04,
                    shadowRadius: 2,
                  }}
                  className="bg-surface rounded-xl p-3 border border-border shadow-xs mb-2"
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }} className="flex-row items-center justify-between mb-1.5">
                    <Badge
                      label={cls.mode.toUpperCase()}
                      variant={cls.mode === 'offline' ? 'neutral' : 'primary'}
                      size="sm"
                    />
                    <View style={{ flexDirection: 'row', alignItems: 'center' }} className="flex-row items-center">
                      <Clock size={12} color={colors.primary} />
                      <Text style={{ fontSize: 12, fontWeight: '700', color: colors.primary, marginLeft: 4 }} className="text-caption font-bold text-primary ml-1">
                        {cls.timeText}
                      </Text>
                    </View>
                  </View>

                  <Text style={{ fontSize: 14, fontWeight: '700', color: colors.ink, marginBottom: 2 }} className="text-body font-bold text-ink mb-0.5">
                    {cls.batchTitle}
                  </Text>
                  <Text style={{ fontSize: 12, color: colors['ink-muted'] }} className="text-caption text-ink-muted">
                    {cls.subjectName} • {cls.facultyName || 'Dinesh Singh Rajput'}
                  </Text>
                  {cls.locationText ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }} className="flex-row items-center mt-1.5">
                      <MapPin size={11} color="#6B7280" />
                      <Text style={{ fontSize: 10.5, color: colors['ink-muted'], marginLeft: 4 }} className="text-[10.5px] text-ink-muted ml-1">
                        {cls.locationText}
                      </Text>
                    </View>
                  ) : null}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : null}

        {/* 6. Upcoming tests and new results */}
        {upcomingTests.length > 0 || recentResults.length > 0 ? (
          <View style={{ paddingHorizontal: 16, paddingTop: 14 }} className="px-4 pt-3.5">
            <Text style={{ fontSize: 15, fontWeight: '700', color: colors.ink, marginBottom: 8 }} className="text-body font-bold text-ink mb-2">
              Tests & Results
            </Text>

            {/* Upcoming tests */}
            {upcomingTests.map((test) => (
              <TouchableOpacity
                key={test.id}
                activeOpacity={0.8}
                onPress={() => router.push(test.route as any)}
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: radii.md,
                  padding: 12,
                  borderWidth: 1,
                  borderColor: colors.border,
                  marginBottom: 8,
                  elevation: 1,
                  shadowColor: '#000000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.04,
                  shadowRadius: 2,
                }}
                className="bg-surface rounded-xl p-3 border border-border shadow-xs mb-2"
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }} className="flex-row items-center justify-between mb-1.5">
                  <Badge label="Upcoming Test" variant="accent" size="sm" />
                  <Text style={{ fontSize: 11.5, fontWeight: '600', color: colors.primary }} className="text-caption font-semibold text-primary">
                    {test.dateText}
                  </Text>
                </View>
                <Text style={{ fontSize: 14, fontWeight: '700', color: colors.ink, marginBottom: 2 }} className="text-body font-bold text-ink mb-0.5">
                  {test.title}
                </Text>
                <Text style={{ fontSize: 12, color: colors['ink-muted'] }} className="text-caption text-ink-muted">
                  {test.batchTitle} • {test.subjectName}
                  {test.totalMarks ? ` (${test.totalMarks} Marks)` : ''}
                </Text>
              </TouchableOpacity>
            ))}

            {/* Recent results */}
            {recentResults.map((result) => (
              <TouchableOpacity
                key={result.id}
                activeOpacity={0.8}
                onPress={() => router.push(result.route as any)}
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: radii.md,
                  padding: 12,
                  borderWidth: 1,
                  borderColor: colors.border,
                  marginBottom: 8,
                  elevation: 1,
                  shadowColor: '#000000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.04,
                  shadowRadius: 2,
                }}
                className="bg-surface rounded-xl p-3 border border-border shadow-xs mb-2"
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }} className="flex-row items-center justify-between mb-1.5">
                  <View style={{ flexDirection: 'row', alignItems: 'center' }} className="flex-row items-center">
                    <Award size={13} color="#15803D" />
                    <Text style={{ fontSize: 11.5, fontWeight: '700', color: '#15803D', marginLeft: 4 }} className="text-caption font-bold text-green-700 ml-1">
                      Result Declared
                    </Text>
                  </View>
                  <Text style={{ fontSize: 11.5, color: colors['ink-muted'] }} className="text-caption text-ink-muted">
                    {result.dateText}
                  </Text>
                </View>
                <Text style={{ fontSize: 14, fontWeight: '700', color: colors.ink, marginBottom: 2 }} className="text-body font-bold text-ink mb-0.5">
                  {result.testTitle}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }} className="flex-row items-center justify-between mt-1">
                  <Text style={{ fontSize: 11.5, color: colors['ink-muted'] }} className="text-caption text-ink-muted">
                    {result.batchTitle}
                  </Text>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: '#15803D' }} className="text-small font-bold text-green-700">
                    {result.scoreText}
                    {result.percentage !== null && result.percentage !== undefined
                      ? ` (${result.percentage}%)`
                      : ''}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ) : null}

        {/* 7. With no batches: Friendly "Join your batch" card */}
        {enrolledBatchesCount === 0 ? (
          <View className="px-4 pt-5">
            <View className="bg-surface rounded-2xl p-5 border border-primary/20 shadow-sm">
              <View className="w-12 h-12 rounded-xl bg-primary-soft items-center justify-center mb-3 border border-primary/20">
                <GraduationCap size={26} color="#2563EB" />
              </View>

              <Text className="text-h3 font-bold text-ink mb-1.5">
                Join your batch
              </Text>

              <Text className="text-body text-ink-muted mb-4 leading-relaxed">
                Connect with Dinesh Sir's classroom to receive daily timetables, test alerts, and syllabus announcements.
              </Text>

              <View className="flex-row space-x-3">
                <View className="flex-1 mr-2">
                  <Button
                    variant="primary"
                    size="md"
                    onPress={() => setShowBatchCodeModal(true)}
                    icon={<KeyRound size={16} color="#FFFFFF" />}
                  >
                    Enter Code
                  </Button>
                </View>
                <View className="flex-1 ml-2">
                  <Button
                    variant="outline"
                    size="md"
                    onPress={() => router.push('/(app)/(tabs)/batches' as any)}
                  >
                    Explore
                  </Button>
                </View>
              </View>
            </View>
          </View>
        ) : null}

        {/* 8. Announcements: latest 3, pinned first, "See all" */}
        {announcements.length > 0 ? (
          <View style={{ paddingHorizontal: 16, paddingTop: 14 }} className="px-4 pt-3.5">
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }} className="flex-row items-center justify-between mb-2">
              <Text style={{ fontSize: 15, fontWeight: '700', color: colors.ink }} className="text-body font-bold text-ink">
                Announcements
              </Text>
              <TouchableOpacity
                onPress={() => router.push('/(app)/notifications' as any)}
                style={{ paddingVertical: 2, paddingHorizontal: 6 }}
                className="py-0.5 px-1.5"
              >
                <Text style={{ fontSize: 12, fontWeight: '600', color: colors.primary }} className="text-caption font-semibold text-primary">
                  See all
                </Text>
              </TouchableOpacity>
            </View>

            <View style={{ gap: 8 }} className="space-y-2">
              {announcements.map((ann) => (
                <TouchableOpacity
                  key={ann.id}
                  activeOpacity={0.8}
                  onPress={() => router.push(ann.route as any)}
                  style={{
                    backgroundColor: colors.surface,
                    borderRadius: radii.md,
                    padding: 12,
                    borderWidth: 1,
                    borderColor: colors.border,
                    marginBottom: 8,
                    elevation: 1,
                    shadowColor: '#000000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.04,
                    shadowRadius: 2,
                  }}
                  className="bg-surface rounded-xl p-3 border border-border shadow-xs mb-2"
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }} className="flex-row items-center justify-between mb-1">
                    <Text style={{ fontSize: 11.5, color: colors['ink-muted'] }} className="text-caption text-ink-muted">
                      {ann.dateFormatted}
                    </Text>
                    {ann.isPinned ? (
                      <Badge label="Pinned" variant="accent" size="sm" />
                    ) : null}
                  </View>

                  <Text style={{ fontSize: 14, fontWeight: '700', color: colors.ink, marginBottom: 2 }} className="text-body font-bold text-ink mb-0.5">
                    {ann.title}
                  </Text>
                  <Text
                    style={{ fontSize: 12, color: colors['ink-muted'], lineHeight: 16 }}
                    className="text-caption text-ink-muted leading-relaxed"
                    numberOfLines={2}
                  >
                    {ann.body}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : null}

        {/* 9. Banner carousel from site_settings.app_banners (results, admissions) */}
        {banners.length > 0 ? (
          <View className="pt-5">
            <View className="px-4 mb-2.5">
              <Text className="text-h3 font-bold text-ink">
                Highlights & Admissions
              </Text>
            </View>

            <ScrollView
              horizontal
              pagingEnabled
              snapToInterval={SCREEN_WIDTH - 32}
              decelerationRate="fast"
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16 }}
            >
              {banners.map((banner) => (
                <TouchableOpacity
                  key={banner.id}
                  activeOpacity={0.9}
                  onPress={() => handleBannerPress(banner)}
                  style={{ width: SCREEN_WIDTH - 32 }}
                  className="mr-4 rounded-2xl overflow-hidden border border-border shadow-sm bg-surface"
                >
                  <Image
                    source={{ uri: banner.imageUrl }}
                    style={{ width: '100%', height: 160 }}
                    contentFit="cover"
                    transition={200}
                  />
                  <View className="p-3 bg-surface flex-row items-center justify-between">
                    <Text
                      className="text-body font-bold text-ink flex-1 mr-2"
                      numberOfLines={1}
                    >
                      {banner.title}
                    </Text>
                    <ChevronRight size={18} color="#2563EB" />
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        ) : null}

        {/* 10. Free lectures for my class (latest 10), "See all" -> Learn tab */}
        {freeLectures.length > 0 ? (
          <View className="pt-5">
            <View className="px-4 flex-row items-center justify-between mb-2.5">
              <Text className="text-h3 font-bold text-ink">
                Free Lectures
              </Text>
              <TouchableOpacity
                onPress={() => router.push('/(app)/(tabs)/learn' as any)}
                className="py-1 px-2"
              >
                <Text className="text-small font-semibold text-primary">
                  See all
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16 }}
            >
              {freeLectures.map((lec: HomeFreeLecture) => (
                <TouchableOpacity
                  key={lec.id}
                  activeOpacity={0.85}
                  onPress={() => router.push(lec.route as any)}
                  className="w-[200px] mr-3 bg-surface rounded-2xl border border-border overflow-hidden shadow-sm"
                >
                  <View className="w-full h-[110px] bg-ink/10 relative justify-end">
                    {lec.thumbnailUrl ? (
                      <Image
                        source={{ uri: lec.thumbnailUrl }}
                        style={{ width: '100%', height: '100%', position: 'absolute' }}
                        contentFit="cover"
                        transition={200}
                      />
                    ) : (
                      <View className="absolute inset-0 bg-primary-soft items-center justify-center">
                        <Play size={24} color="#2563EB" />
                      </View>
                    )}
                    <View className="absolute bottom-2 right-2 bg-black/75 px-1.5 py-0.5 rounded">
                      <Text className="text-[10px] font-bold text-white">
                        {lec.durationFormatted}
                      </Text>
                    </View>
                  </View>

                  <View className="p-3">
                    <Text
                      className="text-body font-semibold text-ink leading-snug"
                      numberOfLines={2}
                    >
                      {lec.title}
                    </Text>
                    <Text className="text-caption text-ink-muted mt-1">
                      {lec.subjectName || `Class ${lec.classLevel ?? ''}`}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        ) : null}

        {/* 11. Share the app card (Android share sheet with Play Store link) */}
        <View style={{ paddingHorizontal: 16, paddingTop: 20 }} className="px-4 pt-5">
          <View
            style={{
              backgroundColor: colors['primary-soft'],
              borderRadius: radii.xl,
              padding: 20,
              borderWidth: 1,
              borderColor: 'rgba(37, 99, 235, 0.2)',
              elevation: 2,
              shadowColor: '#000000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05,
              shadowRadius: 3,
            }}
            className="bg-primary-soft/60 rounded-2xl p-5 border border-primary/20 shadow-sm"
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }} className="flex-row items-center mb-2">
              <Share2 size={20} color={colors.primary} />
              <Text style={{ fontSize: 18, fontWeight: '700', color: colors.primary, marginLeft: 8 }} className="text-h3 font-bold text-primary ml-2">
                Share Quick2Learn
              </Text>
            </View>

            <Text style={{ fontSize: 13, color: colors['ink-muted'], marginBottom: 16, lineHeight: 19 }} className="text-body text-ink-muted mb-4 leading-relaxed">
              Help your friends and classmates master CBSE and ICSE Mathematics with Dinesh Sir. Share the app today!
            </Text>

            <Button
              variant="primary"
              size="md"
              onPress={handleShareApp}
              icon={<Share2 size={16} color="#FFFFFF" />}
            >
              Share App
            </Button>
          </View>
        </View>
      </ScrollView>

      {/* Enter Batch Code Modal */}
      <Modal
        visible={showBatchCodeModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowBatchCodeModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-center p-6">
          <View className="bg-surface rounded-3xl p-6 shadow-xl border border-border">
            <Text className="text-h2 font-bold text-ink mb-2">
              Enter Batch Code
            </Text>
            <Text className="text-body text-ink-muted mb-4 leading-relaxed">
              Enter the batch code provided by Dinesh Sir or the Quick2Learn administration.
            </Text>

            <TextField
              label="Batch Code"
              placeholder="e.g. M10CBSE"
              value={batchCodeInput}
              onChangeText={setBatchCodeInput}
              autoCapitalize="characters"
              maxLength={12}
            />

            <View className="flex-row space-x-3 mt-4">
              <View className="flex-1 mr-2">
                <Button
                  variant="outline"
                  size="md"
                  onPress={() => setShowBatchCodeModal(false)}
                >
                  Cancel
                </Button>
              </View>
              <View className="flex-1 ml-2">
                <Button
                  variant="primary"
                  size="md"
                  loading={isSubmittingCode}
                  onPress={handleSubmitBatchCode}
                >
                  Join
                </Button>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
