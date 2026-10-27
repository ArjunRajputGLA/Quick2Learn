import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Dimensions,
  Share,
  Modal,
  Alert,
  Platform,
  StyleSheet,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as Linking from 'expo-linking';
import { StatusBar } from 'expo-status-bar';
import { Image } from 'expo-image';
import YoutubePlayer from 'react-native-youtube-iframe';
import {
  Menu,
  Bell,
  Play,
  Share2,
  ChevronRight,
  Clock,
  Calendar,
  Award,
  AlertCircle,
  GraduationCap,
  KeyRound,
  CheckCircle2,
  X,
  Plus,
  School,
  ExternalLink,
  MessageCircle,
  Link2,
  Sparkles,
  Check,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  useHome,
  useAvailableTests,
  useMe,
  useStudentBatches,
  useTeacherBatches,
  queryKeys,
} from '../../../src/api/hooks';
import { useAdminStore } from '../../../src/lib/adminDataStore';
import { ParentHomeScreen } from '../../../src/components/parent/ParentHomeScreen';
import { useQueryClient } from '@tanstack/react-query';
import { useDropdownStore } from '../../../src/lib/drawerStore';
import { OfflineBanner } from '../../../src/components/ui/OfflineBanner';
import { BookLoader } from '../../../src/components/ui/BookLoader';
import { Badge } from '../../../src/components/ui/Badge';
import { Button } from '../../../src/components/ui/Button';
import { ProgressBar } from '../../../src/components/ui/ProgressBar';
import { LiveBanner } from '../../../src/components/composite/LiveBanner';
import { JoinBatchModal } from '../../../src/components/batches/JoinBatchModal';
import { analytics } from '../../../src/lib/analytics';
import { useTabBarScroll } from '../../../src/lib/tabBarVisibilityStore';
import { colors, radii } from '@quick2learn/shared';
import { getFacultyAvatarSource } from '../../../src/lib/facultyImages';
import type { AppBannerItem, HomeFreeLecture, ContinueWatchingItem } from '@quick2learn/shared';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BANNER_WIDTH = Math.round(SCREEN_WIDTH * 0.84);
const BANNER_GAP = 12;
const BANNER_STEP = BANNER_WIDTH + BANNER_GAP;

// Authentic institute banners matching the screenshot & course materials
const LOCAL_BANNERS = [
  {
    id: 'banner-cbse-result',
    title: 'Spectacular Class XII CBSE Board Result',
    subtitle: '70+ students with 90-99 marks • Dinesh Rajput Sir',
    source: require('../../../assets/banners/cbse_results_banner.jpg'),
    actionType: 'results',
    route: '/(app)/results',
  },
  {
    id: 'banner-rajput-ix-x',
    title: 'Rajput Sir Tutorials - Classes IX & X',
    subtitle: 'Maths • Physics • Biology • Chemistry Registrations Open',
    source: require('../../../assets/banners/rajput_sir_ix_x.jpg'),
    actionType: 'batch_inquiry',
    route: '/(app)/(tabs)/batches',
  },
  {
    id: 'banner-rajput-xi-xii',
    title: 'Rajput Sir Tutorials - Classes XI & XII',
    subtitle: 'Maths • Physics • Chemistry Registrations Open',
    source: require('../../../assets/banners/rajput_sir_xi_xii.jpg'),
    actionType: 'batch_inquiry',
    route: '/(app)/(tabs)/batches',
  },
  {
    id: 'banner-xii-maths',
    title: 'CBSE Class 12 Maths Complete Course',
    subtitle: 'Detailed Course Term 1 • Finish Syllabus Fast & Prepare for IIT/NDA',
    source: require('../../../assets/banners/xii_maths_course.png'),
    actionType: 'course',
    route: '/(app)/(tabs)/learn',
  },
  {
    id: 'banner-icse-9-chem',
    title: 'ICSE Class 9 Chemistry Complete Course',
    subtitle: 'Study at your own comfort with full animated lectures',
    source: require('../../../assets/banners/icse_9_chemistry.png'),
    actionType: 'course',
    route: '/(app)/(tabs)/learn',
  },
];

export interface FreeVideoItem {
  id: string;
  title: string;
  category: string;
  duration: string;
  thumbnail: any;
  hasOverlayText: boolean;
  description: string;
  faculty: string;
  facultyRole: string;
  youtubeId: string;
}

// Authentic free video lectures matching Quick2Learn website's free video library
const FREE_VIDEOS: FreeVideoItem[] = [
  {
    id: 'free-vid-parabola',
    title: 'Class 11 Maths: Parabola & Its Standard Forms | Dinesh Sir',
    category: 'Class 11 CBSE/ISC Maths',
    duration: '44:30',
    thumbnail: { uri: 'https://i.ytimg.com/vi/E4FABpLiJ40/hqdefault.jpg' },
    hasOverlayText: false,
    description:
      'Detailed conceptual analysis of Parabola, standard equations, focal distance, and latus rectum with Dinesh Sir.',
    faculty: 'Dinesh Singh Rajput',
    facultyRole: 'Founder & Head of Mathematics',
    youtubeId: 'E4FABpLiJ40',
  },
  {
    id: 'free-vid-vectors',
    title: 'Class 12 Maths: Dot Product of Two Vectors | Dinesh Sir',
    category: 'Class 12 CBSE/ISC Maths',
    duration: '1:00:22',
    thumbnail: { uri: 'https://i.ytimg.com/vi/Vz3BaPSa6i0/hqdefault.jpg' },
    hasOverlayText: false,
    description:
      'Scalar or dot product of two vectors, geometric interpretation, angle between vectors and projection formulas.',
    faculty: 'Dinesh Singh Rajput',
    facultyRole: 'Founder & Head of Mathematics',
    youtubeId: 'Vz3BaPSa6i0',
  },
  {
    id: 'free-vid-3d-line',
    title: 'Class 12 Maths: Equation of a Line in Space | Dinesh Sir',
    category: 'Class 12 3D Geometry',
    duration: '1:01:15',
    thumbnail: { uri: 'https://i.ytimg.com/vi/j09xh8J7qlo/hqdefault.jpg' },
    hasOverlayText: false,
    description:
      'Three Dimensional Geometry: Vector and Cartesian equations of a line passing through given points by Dinesh Singh Rajput.',
    faculty: 'Dinesh Singh Rajput',
    facultyRole: 'Founder & Head of Mathematics',
    youtubeId: 'j09xh8J7qlo',
  },
  {
    id: 'free-vid-hindi-sakhi',
    title: "ICSE Class 9 Hindi: Sakhi (Kabir Das) Explanation & Notes | Namita Ma'am",
    category: 'ICSE Class 9 Hindi',
    duration: '1:10:00',
    thumbnail: { uri: 'https://i.ytimg.com/vi/bu6Hmff0m0U/hqdefault.jpg' },
    hasOverlayText: false,
    description:
      "Line-by-line explanation of Kabir Das Sakhi, word meanings, and ICSE Class 9 board question answers by Namita Ma'am.",
    faculty: 'Namita Singh Rajput',
    facultyRole: 'Faculty of ICSE Sciences & Hindi',
    youtubeId: 'bu6Hmff0m0U',
  },
  {
    id: 'free-vid-bio-classification',
    title: "ICSE Class 9 Biology: Five Kingdom Classification One-Shot | Namita Ma'am",
    category: 'ICSE Class 9 Biology',
    duration: '53:15',
    thumbnail: { uri: 'https://i.ytimg.com/vi/6rvDSfsuR6A/hqdefault.jpg' },
    hasOverlayText: false,
    description:
      "Complete one-shot revision of Monera, Protista, Fungi, Plantae, and Animalia with objective board questions by Namita Ma'am.",
    faculty: 'Namita Singh Rajput',
    facultyRole: 'Faculty of Biology & Sciences',
    youtubeId: '6rvDSfsuR6A',
  },
  {
    id: 'free-vid-history-strategy',
    title: "ICSE 9 History & Civics: Paper Pattern & Strategy | Namita Ma'am",
    category: 'ICSE Class 9 History & Civics',
    duration: '25:30',
    thumbnail: { uri: 'https://i.ytimg.com/vi/Sa6vSiYCqyo/hqdefault.jpg' },
    hasOverlayText: false,
    description:
      'Detailed analysis of ICSE Class 9 History and Civics question paper pattern, marks distribution, and answer-writing tips.',
    faculty: 'Namita Singh Rajput',
    facultyRole: 'Faculty of ICSE Sciences & Humanities',
    youtubeId: 'Sa6vSiYCqyo',
  },
  {
    id: 'free-vid-civics-rights',
    title: "ICSE Class 9 Civics: Fundamental Rights & Duties | Namita Ma'am",
    category: 'ICSE Class 9 Civics',
    duration: '1:18:17',
    thumbnail: { uri: 'https://i.ytimg.com/vi/THJtNZRmkT4/hqdefault.jpg' },
    hasOverlayText: false,
    description:
      'Comprehensive class on Right to Equality, Freedom of Speech, and Constitutional Remedies by Namita Singh Rajput.',
    faculty: 'Namita Singh Rajput',
    facultyRole: 'Faculty of ICSE Sciences & Humanities',
    youtubeId: 'THJtNZRmkT4',
  },
];

export default function HomeScreen() {
  const { data: me, isLoading: isMeLoading } = useMe();
  const isParent = me?.role === 'parent';

  if (isMeLoading && !me) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' }}>
        <BookLoader text="Loading your study space..." size="lg" />
      </View>
    );
  }

  if (isParent) {
    return <ParentHomeScreen />;
  }

  return <StudentHomeScreen />;
}

function StudentHomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { toggleDropdown } = useDropdownStore();
  const { data: me } = useMe();
  const { data: home, isLoading, isRefetching, refetch } = useHome();
  const { data: studentBatchesData, refetch: refetchStudentBatches } = useStudentBatches();
  const { data: availableTestsData, refetch: refetchTests } = useAvailableTests();
  const isStaff = me?.role === 'admin' || me?.role === 'teacher';
  const { data: teacherBatchesData, refetch: refetchTeacherBatches } = useTeacherBatches();
  const adminStore = useAdminStore();

  const [refreshing, setRefreshing] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<FreeVideoItem | null>(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [activeBannerIndex, setActiveBannerIndex] = useState(0);
  const [isCopied, setIsCopied] = useState(false);

  const bannerScrollRef = useRef<any>(null);
  const bannerIndexRef = useRef(0);
  const lastUserTouchTimeRef = useRef(0);
  const [isScreenFocused, setIsScreenFocused] = useState(true);

  const { onScroll: handleTabBarScroll, scrollEventThrottle } = useTabBarScroll();

  // Load and sync admin/faculty store on mount if staff
  useEffect(() => {
    if (isStaff) {
      adminStore.init();
    }
  }, [isStaff]);

  // Refresh home data and student batches on focus
  useFocusEffect(
    useCallback(() => {
      setIsScreenFocused(true);
      refetch();
      refetchStudentBatches();
      refetchTests();
      if (isStaff) {
        adminStore.init();
        refetchTeacherBatches();
      }
      return () => {
        setIsScreenFocused(false);
      };
    }, [refetch, refetchStudentBatches, refetchTests, isStaff, refetchTeacherBatches])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      refetch(),
      refetchStudentBatches(),
      refetchTests(),
      isStaff ? adminStore.init() : Promise.resolve(),
      isStaff ? refetchTeacherBatches() : Promise.resolve(),
    ]);
    setRefreshing(false);
  };

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  // WhatsApp Share Handler
  const handleShareWhatsApp = async () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const shareMsg =
      'Join Quick2Learn to learn Mathematics, Chemistry and Biology from Dinesh Singh Rajput Sir! Download the app: https://play.google.com/store/apps/details?id=in.quick2learn.app';
    const whatsappUrl = `whatsapp://send?text=${encodeURIComponent(shareMsg)}`;
    try {
      const supported = await Linking.canOpenURL(whatsappUrl);
      if (supported) {
        await Linking.openURL(whatsappUrl);
      } else {
        await Share.share({
          message: shareMsg,
          url: 'https://play.google.com/store/apps/details?id=in.quick2learn.app',
        });
      }
    } catch {
      await Share.share({
        message: shareMsg,
        url: 'https://play.google.com/store/apps/details?id=in.quick2learn.app',
      });
    }
  };

  // Copy Link Handler
  const handleCopyLink = async () => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const appUrl = 'https://play.google.com/store/apps/details?id=in.quick2learn.app';
    try {
      await Share.share({
        title: 'Quick2Learn App',
        message: appUrl,
        url: appUrl,
      });
      setIsCopied(true);
      showToast('App link ready to share!');
      setTimeout(() => setIsCopied(false), 2400);
    } catch {
      setIsCopied(true);
      showToast('Link: ' + appUrl);
      setTimeout(() => setIsCopied(false), 2400);
    }
  };

  const handleBannerPress = (banner: (typeof LOCAL_BANNERS)[0]) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (banner.route) {
      router.push(banner.route as any);
    }
  };

  // Unread notification count
  const unreadCount = home?.header?.unreadNotificationsCount ?? 0;
  const liveClass = home?.liveClass;
  const announcements = home?.announcements || [];
  // Batches status & enrollment (combines student batches API, local joined batches, and home todayClasses)
  const enrolledBatches = useMemo(() => {
    if (studentBatchesData?.enrolled && studentBatchesData.enrolled.length > 0) {
      return studentBatchesData.enrolled;
    }
    if (home?.todayClasses && home.todayClasses.length > 0) {
      return home.todayClasses.map((tc) => ({
        id: tc.batchId,
        title: tc.batchTitle,
        classLevel: 12,
        board: 'CBSE',
        subjectName: tc.subjectName || 'Mathematics',
        mode: tc.mode || 'offline',
        status: 'ongoing',
        teacherName: tc.facultyName || 'Dinesh Singh Rajput',
        progressPercentage: 45,
      }));
    }
    return [];
  }, [studentBatchesData?.enrolled, home?.todayClasses]);

  const pendingRequests = studentBatchesData?.pendingRequests || [];
  const hasEnrolledBatches = enrolledBatches.length > 0;
  const hasPendingRequests = pendingRequests.length > 0;

  // Banner list: combine API banners (if any) with authentic local banners
  const displayBanners = useMemo(() => {
    if (home?.banners && home.banners.length > 0) {
      return home.banners.map((b) => ({
        id: b.id,
        title: b.title,
        subtitle: 'Quick2Learn Admission & Highlights',
        source: { uri: b.imageUrl },
        actionType: 'batch_inquiry',
        route: b.route || '/(app)/(tabs)/batches',
      }));
    }
    return LOCAL_BANNERS;
  }, [home?.banners]);

  // Infinite non-stop sliding loop: repeat banners in forward sequence so scrolling is continuous right-to-left
  const REPEAT_COUNT = 60;
  const loopBanners = useMemo(() => {
    if (displayBanners.length <= 1) {
      return displayBanners.map((b) => ({ ...b, uniqueKey: b.id }));
    }
    const items: Array<(typeof displayBanners)[0] & { uniqueKey: string }> = [];
    for (let r = 0; r < REPEAT_COUNT; r++) {
      for (let i = 0; i < displayBanners.length; i++) {
        items.push({
          ...displayBanners[i],
          uniqueKey: `${displayBanners[i].id}-rep-${r}-${i}`,
        });
      }
    }
    return items;
  }, [displayBanners]);

  // Auto-sliding nonstop banner carousel effect:
  // Slides from right to left, stops for 3 seconds at each image, then moves to next
  useEffect(() => {
    if (displayBanners.length <= 1 || !isScreenFocused) return;

    let timer: ReturnType<typeof setTimeout> | null = null;
    let isMounted = true;

    const tick = () => {
      timer = setTimeout(() => {
        if (!isMounted) return;

        // If the user touched the carousel recently, pause and re-check after cooldown
        const timeSinceTouch = Date.now() - lastUserTouchTimeRef.current;
        if (timeSinceTouch < 3000) {
          const waitRemaining = Math.max(500, 3000 - timeSinceTouch);
          timer = setTimeout(tick, waitRemaining);
          return;
        }

        // Calculate next slide index (moving forward: right to left)
        const currentIdx = bannerIndexRef.current;
        const totalItems = loopBanners.length;
        const nextIdx = (currentIdx + 1) % totalItems;

        bannerIndexRef.current = nextIdx;
        setActiveBannerIndex(nextIdx % displayBanners.length);

        bannerScrollRef.current?.scrollTo({
          x: nextIdx * BANNER_STEP,
          animated: true,
        });

        // Stay on this image for 3 seconds before advancing to next
        tick();
      }, 3000);
    };

    tick();

    return () => {
      isMounted = false;
      if (timer) clearTimeout(timer);
    };
  }, [displayBanners.length, loopBanners.length, isScreenFocused]);

  // Free video lectures: combine backend lectures (if any) with authentic website lectures
  const displayVideos = useMemo(() => {
    if (home?.freeLectures && home.freeLectures.length > 0) {
      return home.freeLectures.map((item, idx) => {
        const matched = FREE_VIDEOS.find(
          (v) => v.youtubeId === item.id || v.id === item.id
        );
        if (matched) return matched;

        const isNamita =
          item.title?.includes('Hindi') ||
          item.title?.includes('Biology') ||
          item.title?.includes('Civics') ||
          item.title?.includes('History') ||
          item.title?.includes('Chemistry');

        return {
          id: item.id || `api-free-vid-${idx}`,
          title: item.title,
          category: item.subjectName
            ? `${item.classLevel ? `Class ${item.classLevel} ` : ''}${item.subjectName}`
            : 'Free Lecture',
          duration: item.durationFormatted || '45:00',
          thumbnail: item.thumbnailUrl
            ? { uri: item.thumbnailUrl }
            : { uri: `https://i.ytimg.com/vi/${item.id}/hqdefault.jpg` },
          hasOverlayText: false,
          description: `Watch free conceptual lecture on ${item.title} by Quick2Learn faculty.`,
          faculty: isNamita ? 'Namita Singh Rajput' : 'Dinesh Singh Rajput',
          facultyRole: isNamita
            ? 'Faculty of ICSE Sciences & Hindi'
            : 'Founder & Head of Mathematics',
          youtubeId: item.id.length === 11 ? item.id : 'bu6Hmff0m0U',
        };
      });
    }
    return FREE_VIDEOS;
  }, [home?.freeLectures]);

  const handleCloseVideoModal = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsVideoPlaying(false);
    setSelectedVideo(null);
  };

  return (
    <View style={styles.screenContainer}>
      <StatusBar style="dark" />

      {/* 1. Floating Header: Floating card matching the other floating sections */}
      <View style={[styles.floatingHeaderWrapper, { paddingTop: insets.top + 6 }]}>
        <View style={styles.floatingHeaderCard}>
          {/* Menu Button -> Opens Sidebar Drawer */}
          <TouchableOpacity
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel="Open navigation menu"
            onPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              toggleDropdown();
            }}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={styles.headerIconButton}
          >
            <Menu size={22} color="#FFFFFF" strokeWidth={2.2} />
          </TouchableOpacity>

          {/* App Title */}
          <View style={styles.headerTitleWrapper}>
            <Text numberOfLines={2} style={styles.headerTitleText}>
              {'Quick 2 Learn CBSE/ICSE - 9th\nto 12th'}
            </Text>
          </View>

          {/* Notification Bell */}
          <TouchableOpacity
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel="Open notifications"
            onPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/(app)/notifications');
            }}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={styles.headerIconButton}
          >
            <Bell size={21} color="#FFFFFF" strokeWidth={2} />
            {unreadCount > 0 && (
              <View style={styles.bellBadge}>
                <Text style={styles.bellBadgeText}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Offline banner indicator (shows cached data banner if offline) */}
      <OfflineBanner />

      {/* Main Home Scroll Area */}
      <ScrollView
        onScroll={handleTabBarScroll}
        scrollEventThrottle={scrollEventThrottle}
        contentContainerStyle={{
          paddingBottom: Math.max(insets.bottom, 12) + 76,
          backgroundColor: '#F8FAFC',
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing || isRefetching}
            onRefresh={onRefresh}
            colors={['#4845D2']}
            tintColor="#4845D2"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Optional Live Class Alert (When teacher is live now) */}
        {liveClass ? (
          <View style={styles.liveBannerWrapper}>
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

        {/* 2. Top Carousel / Banner Section */}
        <View style={styles.bannersSection}>
          <ScrollView
            ref={bannerScrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            nestedScrollEnabled={true}
            decelerationRate="fast"
            snapToInterval={BANNER_STEP}
            snapToAlignment="start"
            disableIntervalMomentum={true}
            contentContainerStyle={styles.bannersScrollContent}
            onTouchStart={() => {
              lastUserTouchTimeRef.current = Date.now();
            }}
            onScrollBeginDrag={() => {
              lastUserTouchTimeRef.current = Date.now();
            }}
            onScroll={(e) => {
              const offsetX = e.nativeEvent.contentOffset.x;
              const idx = Math.max(0, Math.round(offsetX / BANNER_STEP));
              setActiveBannerIndex(idx % displayBanners.length);
            }}
            onScrollEndDrag={() => {
              lastUserTouchTimeRef.current = Date.now();
            }}
            onMomentumScrollEnd={(e) => {
              const offsetX = e.nativeEvent.contentOffset.x;
              const idx = Math.max(0, Math.round(offsetX / BANNER_STEP));
              bannerIndexRef.current = idx;
              setActiveBannerIndex(idx % displayBanners.length);
              lastUserTouchTimeRef.current = Date.now();
            }}
          >
            {loopBanners.map((banner, index) => (
              <TouchableOpacity
                key={banner.uniqueKey || `${banner.id}-${index}`}
                activeOpacity={0.92}
                onPress={() => handleBannerPress(banner as any)}
                style={[
                  styles.bannerCard,
                  {
                    width: BANNER_WIDTH,
                    marginRight: index === loopBanners.length - 1 ? 0 : BANNER_GAP,
                  },
                ]}
              >
                <Image
                  source={banner.source}
                  style={styles.bannerImage}
                  contentFit="cover"
                  transition={200}
                />
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Dots Indicator */}
          <View style={styles.bannerDotsRow}>
            {displayBanners.map((_, i) => (
              <TouchableOpacity
                key={i}
                activeOpacity={0.7}
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  const currentRep = Math.floor(bannerIndexRef.current / displayBanners.length);
                  const targetIndex = currentRep * displayBanners.length + i;
                  bannerIndexRef.current = targetIndex;
                  setActiveBannerIndex(i);
                  bannerScrollRef.current?.scrollTo({
                    x: targetIndex * BANNER_STEP,
                    animated: true,
                  });
                  lastUserTouchTimeRef.current = Date.now();
                }}
                hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
              >
                <View
                  style={[
                    styles.bannerDot,
                    i === activeBannerIndex && styles.bannerDotActive,
                  ]}
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 3. "FREE VIDEOS FOR YOU" Section */}
        <View style={styles.freeVideosSection}>
          {/* Header Row: "FREE VIDEOS FOR YOU" on left, "View All" on right */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeaderText}>FREE VIDEOS FOR YOU</Text>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/(app)/free-material' as any);
              }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.sectionViewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          {/* Horizontal list of Free Video Cards with Exact Matching Thumbnails */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.videosScrollContent}
          >
            {displayVideos.map((video) => {
              const videoWidth = Math.round(SCREEN_WIDTH * 0.74);
              return (
                <TouchableOpacity
                  key={video.id}
                  activeOpacity={0.88}
                  onPress={() => {
                    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedVideo(video);
                    setIsVideoPlaying(true);
                  }}
                  style={[styles.videoCard, { width: videoWidth }]}
                >
                  {/* Video Thumbnail with Play Button overlay and Advertisement tag */}
                  <View style={styles.videoThumbnailWrapper}>
                    <Image
                      source={video.thumbnail}
                      style={styles.videoThumbnailImage}
                      contentFit="cover"
                      transition={200}
                    />

                    {/* Duration badge on Top Left */}
                    <View style={styles.videoDurationBadge}>
                      <Clock size={11} color="#FFFFFF" strokeWidth={2.4} />
                      <Text style={styles.videoDurationText}>{video.duration}</Text>
                    </View>

                    {/* Play Button Icon on Top Right (matching screenshot) */}
                    <View style={styles.playIconOverlay}>
                      <Play size={15} color="#FFFFFF" fill="#FFFFFF" />
                    </View>

                    {/* Bottom overlay: subtle dark scrim with advertisement tag & QUICK2LEARN watermark */}
                    <View style={styles.videoBottomScrim}>
                      <View style={styles.videoBottomOverlayRow}>
                        <Text style={styles.videoAdvertTag}>advertisement</Text>
                        <View style={styles.videoWatermarkBadge}>
                          <Text style={styles.videoWatermarkText}>QUICK2LEARN</Text>
                        </View>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* 4. Batch Status Card: Staff Overview vs Student Enrolled vs Pending Approval vs Not Added */}
        {isStaff ? (
          /* State STAFF: Faculty & Administrator Institute Overview Card */
          <View style={styles.batchStatusCardWrapper}>
            <View style={[styles.batchStatusCard, { borderColor: '#C7D2FE', backgroundColor: '#F8FAFF' }]}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4, gap: 8 }}>
                  <Text style={styles.batchTitleText} numberOfLines={1} ellipsizeMode="tail">
                    Institute Batch Administration
                  </Text>
                  <View style={[styles.enrolledBadge, { backgroundColor: '#EEF2FF', borderColor: '#C7D2FE', flexShrink: 0 }]}>
                    <Text style={[styles.enrolledBadgeText, { color: '#4F46E5' }]}>Administrator</Text>
                  </View>
                </View>

                {(() => {
                  const batchesCount = adminStore.batches.length;
                  const totalEnrolled = adminStore.students.length > 0
                    ? adminStore.students.length
                    : adminStore.batches.reduce((sum, b) => sum + (b.enrolledCount || 0), 0);
                  const classesList = Array.from(new Set(adminStore.batches.map((b) => b.classLevel).filter(Boolean))).sort((a, b) => a - b);
                  const classesLabel = classesList.length > 0
                    ? `Classes ${classesList.map((c) => c === 9 ? 'IX' : c === 10 ? 'X' : c === 11 ? 'XI' : 'XII').join(', ')}`
                    : 'Classes IX–XII';
                  return (
                    <Text style={styles.batchSubtitleText} numberOfLines={1} ellipsizeMode="tail">
                      {batchesCount > 0
                        ? `${batchesCount} Active Batches • ${totalEnrolled} Enrolled • ${classesLabel}`
                        : '0 Active Batches • 0 Enrolled'}
                    </Text>
                  );
                })()}

                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 6 }}>
                  <Image
                    source={require('../../../assets/Dinesh Singh Rajput.jpeg')}
                    style={{ width: 18, height: 18, borderRadius: 9 }}
                  />
                  <Text style={{ fontSize: 11.5, fontWeight: '700', color: '#334155', textTransform: 'uppercase' }} numberOfLines={1}>
                    DIRECTOR & MASTER FACULTY CONSOLE
                  </Text>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => router.push("/(app)/(tabs)/batches" as any)}
                    style={[styles.goToBatchButton, { backgroundColor: '#4F46E5', borderColor: '#4338CA' }]}
                  >
                    <Text style={[styles.goToBatchButtonText, { color: '#FFFFFF' }]}>Manage Batches</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => router.push("/(app)/(tabs)/teach" as any)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Text style={[styles.joinAnotherButtonText, { color: '#4F46E5' }]}>
                      Open Admin Portal →
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        ) : hasEnrolledBatches ? (
          /* State A: Student is ENROLLED in batch(es) (Screenshot 20-26-18 & 20-33-27 match) */
          <View style={styles.batchStatusCardWrapper}>
            <View style={styles.batchStatusCard}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4, gap: 8 }}>
                  <Text style={styles.batchTitleText} numberOfLines={1} ellipsizeMode="tail">
                    {enrolledBatches[0].title}
                  </Text>
                  <View style={[styles.enrolledBadge, { flexShrink: 0 }]}>
                    <Text style={styles.enrolledBadgeText}>Enrolled</Text>
                  </View>
                </View>

                <Text style={styles.batchSubtitleText} numberOfLines={1} ellipsizeMode="tail">
                  Class {enrolledBatches[0].classLevel} • Tests available • {enrolledBatches[0].subjectName || 'Maths, Science'}
                </Text>

                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 6 }}>
                  <Image
                    source={
                      getFacultyAvatarSource(enrolledBatches[0].teacherName) ||
                      require('../../../assets/Dinesh Singh Rajput.jpeg')
                    }
                    style={{ width: 18, height: 18, borderRadius: 9 }}
                  />
                  <Text style={{ fontSize: 11.5, fontWeight: '700', color: '#334155', textTransform: 'uppercase' }} numberOfLines={1}>
                    {enrolledBatches[0].teacherName || 'DINESH SINGH RAJPUT'}
                  </Text>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => router.push(`/batch/${enrolledBatches[0].id}` as any)}
                    style={styles.goToBatchButton}
                  >
                    <Text style={styles.goToBatchButtonText}>View Batch</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => setShowJoinModal(true)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Text style={styles.joinAnotherButtonText}>
                      + Join Another
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        ) : hasPendingRequests ? (
          /* State B: Student has submitted a JOIN REQUEST awaiting tutor approval */
          <View style={styles.batchStatusCardWrapper}>
            <View style={[styles.batchStatusCard, { borderColor: '#FDE68A', backgroundColor: '#FFFDF5' }]}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4, gap: 8 }}>
                  <Text style={styles.batchTitleText} numberOfLines={1} ellipsizeMode="tail">
                    {pendingRequests[0].batchTitle}
                  </Text>
                  <View style={[styles.enrolledBadge, { backgroundColor: '#FEF3C7', borderColor: '#FCD34D', flexShrink: 0 }]}>
                    <Text style={[styles.enrolledBadgeText, { color: '#B45309' }]}>Approval Pending</Text>
                  </View>
                </View>

                {(() => {
                  const isNam =
                    (pendingRequests[0].batchTitle || '').toLowerCase().includes('science') ||
                    (pendingRequests[0].batchTitle || '').toLowerCase().includes('biology') ||
                    (pendingRequests[0].batchTitle || '').toLowerCase().includes('namita');
                  const mentorName = isNam ? "Namita Ma'am" : "Dinesh Sir";
                  const mentorAvatar = getFacultyAvatarSource(mentorName);
                  return (
                    <>
                      <Text style={styles.batchSubtitleText} numberOfLines={1} ellipsizeMode="tail">
                        Class {pendingRequests[0].classLevel} • Join request submitted to {mentorName}
                      </Text>

                      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 6 }}>
                        {mentorAvatar ? (
                          <Image
                            source={mentorAvatar}
                            style={{ width: 16, height: 16, borderRadius: 8 }}
                          />
                        ) : (
                          <Clock size={14} color="#D97706" />
                        )}
                        <Text style={{ fontSize: 12, fontWeight: '600', color: '#92400E' }} numberOfLines={1}>
                          Awaiting tutor approval. Materials will unlock once approved.
                        </Text>
                      </View>
                    </>
                  );
                })()}

                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => router.push(`/batch/${pendingRequests[0].batchId}` as any)}
                    style={[styles.goToBatchButton, { backgroundColor: '#FEF3C7', borderColor: '#FCD34D' }]}
                  >
                    <Text style={[styles.goToBatchButtonText, { color: '#B45309' }]}>Check Status</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => setShowJoinModal(true)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Text style={styles.joinAnotherButtonText}>
                      + Enter Another Code
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        ) : (
          /* State C: Student is NOT added to any batch yet (Exact Screenshot Match) */
          <View style={styles.batchStatusCardWrapper}>
            <View style={styles.batchStatusCard}>
              {/* Circular Classroom Illustration Avatar on Left */}
              <View style={styles.batchAvatarWrapper}>
                <Image
                  source={require('../../../assets/banners/no_batch_icon.png')}
                  style={styles.batchAvatarImage}
                  contentFit="contain"
                />
              </View>

              {/* Title, Subtitle, and Send Join Request Action Link */}
              <View style={styles.batchInfoWrapper}>
                <Text style={styles.batchTitleText}>
                  You are not added to any batch yet
                </Text>

                <Text style={styles.batchSubtitleText}>
                  Request your tutor to add you to a batch
                </Text>

                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => {
                    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setShowJoinModal(true);
                  }}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Text style={styles.sendJoinRequestText}>
                    Send Join Request
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* 5. "Share the app" Card */}
        <View style={styles.shareAppSection}>
          <View style={styles.shareAppCard}>
            {/* Soft concentric ripple waves watermark on top right */}
            <View style={styles.shareWatermarkContainer} pointerEvents="none">
              <View style={styles.shareRingOuter} />
              <View style={styles.shareRingMid} />
              <View style={styles.shareRingInner} />
            </View>

            {/* Header: Title, Subtitle, and Invite Pill Badge */}
            <View style={styles.shareHeaderRow}>
              <View style={{ flex: 1, paddingRight: 8, zIndex: 1 }}>
                <Text style={styles.shareTitleText}>Share the app</Text>
                <Text style={styles.shareSubtitleText}>
                  Let your friends know how much you enjoy this app
                </Text>
              </View>
              <View style={styles.shareInviteBadge}>
                <Share2 size={11} color="#4845D2" strokeWidth={2.4} />
                <Text style={styles.shareInviteBadgeText}>INVITE</Text>
              </View>
            </View>

            {/* Actions Row: Two Distinct, Tactile Pill Buttons */}
            <View style={styles.shareActionsRow}>
              {/* WhatsApp Action Pill */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleShareWhatsApp}
                style={styles.shareWhatsAppPill}
              >
                <View style={styles.whatsappIconCircle}>
                  <MessageCircle size={13} color="#FFFFFF" strokeWidth={2.4} />
                </View>
                <Text
                  style={styles.shareWhatsAppText}
                  numberOfLines={1}
                >
                  Share on WhatsApp
                </Text>
              </TouchableOpacity>

              {/* Copy Link Action Pill */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleCopyLink}
                style={[
                  styles.shareCopyLinkPill,
                  isCopied && styles.shareCopiedPill,
                ]}
              >
                <View style={[styles.copyLinkIconCircle, isCopied && styles.copiedIconCircle]}>
                  {isCopied ? (
                    <Check size={13} color="#059669" strokeWidth={2.8} />
                  ) : (
                    <Link2 size={13} color="#0284C7" strokeWidth={2.5} />
                  )}
                </View>
                <Text style={[styles.shareCopyLinkText, isCopied && styles.shareCopiedText]}>
                  {isCopied ? 'Copied!' : 'Copy link'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* 6. Announcements (if any from Dinesh Sir) */}
        {announcements.length > 0 && (
          <View style={styles.announcementsSection}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionHeaderText}>ANNOUNCEMENTS</Text>
              <TouchableOpacity
                onPress={() => router.push('/(app)/notifications' as any)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.sectionViewAllText}>See all</Text>
              </TouchableOpacity>
            </View>

            <View style={{ gap: 8 }}>
              {announcements.slice(0, 2).map((ann) => (
                <View key={ann.id} style={styles.announcementCard}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text style={{ fontSize: 11, color: '#64748B' }}>
                      {ann.dateFormatted}
                    </Text>
                    {ann.isPinned && (
                      <Badge label="Pinned" variant="accent" size="sm" />
                    )}
                  </View>
                  <Text style={{ fontSize: 13.5, fontWeight: '700', color: '#0F172A', marginBottom: 2 }}>
                    {ann.title}
                  </Text>
                  <Text style={{ fontSize: 12, color: '#64748B', lineHeight: 17 }} numberOfLines={2}>
                    {ann.body}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Floating Toast Alert (e.g. for Copy Link confirmation) */}
      {toastMessage && (
        <View style={[styles.toastContainer, { bottom: insets.bottom + 68 }]}>
          <Check size={16} color="#FFFFFF" strokeWidth={2.5} />
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      )}

      {/* Join Batch Modal */}
      <JoinBatchModal
        visible={showJoinModal}
        onClose={() => setShowJoinModal(false)}
        onSuccess={() => {
          setShowJoinModal(false);
          refetchStudentBatches();
          refetch();
          showToast('Batch updated successfully!');
        }}
      />

      {/* Free Video Player Popup Modal */}
      <Modal
        visible={Boolean(selectedVideo)}
        transparent
        animationType="fade"
        onRequestClose={handleCloseVideoModal}
      >
        <View style={styles.videoModalOverlay}>
          {/* Backdrop dismiss */}
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={handleCloseVideoModal}
          />

          <View style={styles.videoModalPopup}>
            {/* Minimal Header */}
            <View style={styles.videoModalHeader}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={styles.videoModalTitle} numberOfLines={2}>
                  {selectedVideo?.title}
                </Text>
                <View style={styles.videoModalSubtitleRow}>
                  <Clock size={11} color="#64748B" strokeWidth={2.2} />
                  <Text style={styles.videoModalSubtitleText}>
                    {selectedVideo?.duration} • {selectedVideo?.category}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={handleCloseVideoModal}
                style={styles.videoModalCloseButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <X size={15} color="#64748B" strokeWidth={2.4} />
              </TouchableOpacity>
            </View>

            {/* Video Player Display (Clean & Responsive) */}
            <View style={styles.modalPlayerWrapper}>
              {selectedVideo?.youtubeId ? (
                <YoutubePlayer
                  height={205}
                  play={isVideoPlaying}
                  videoId={selectedVideo.youtubeId}
                  onChangeState={(state: string) => {
                    if (state === 'ended') {
                      setIsVideoPlaying(false);
                    }
                  }}
                />
              ) : (
                <Image
                  source={selectedVideo?.thumbnail}
                  style={styles.modalPlayerThumbnail}
                  contentFit="cover"
                />
              )}
            </View>

            {/* Minimal Teacher Details & YouTube Action */}
            <View style={styles.videoModalFooterRow}>
              <View style={styles.videoFacultyMinimal}>
                <Image
                  source={
                    getFacultyAvatarSource(selectedVideo?.faculty) ||
                    require('../../../assets/Dinesh Singh Rajput.jpeg')
                  }
                  style={styles.videoFacultyAvatar}
                />
                <View>
                  <Text style={styles.videoFacultyName}>
                    {selectedVideo?.faculty || 'Dinesh Singh Rajput'}
                  </Text>
                  <Text style={styles.videoFacultyRole}>
                    {selectedVideo?.facultyRole || 'Founder & Head of Mathematics'}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                activeOpacity={0.75}
                onPress={() => {
                  if (selectedVideo?.youtubeId) {
                    Linking.openURL(`https://www.youtube.com/watch?v=${selectedVideo.youtubeId}`).catch(() => {});
                  }
                }}
                style={styles.minimalYoutubeButton}
              >
                <Play size={11} color="#DC2626" fill="#DC2626" />
                <Text style={styles.minimalYoutubeText}>YouTube</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  // 1. Floating Header Styles: Floating Card matching other sections
  floatingHeaderWrapper: {
    paddingHorizontal: 14,
    paddingBottom: 4,
    backgroundColor: '#F8FAFC',
    zIndex: 10,
  },
  floatingHeaderCard: {
    height: 54,
    borderRadius: 16,
    backgroundColor: '#4845D2',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    elevation: 3,
    shadowColor: '#1E1B4B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.16,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  headerIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  headerTitleWrapper: {
    flex: 1,
    paddingHorizontal: 10,
  },
  headerTitleText: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 19,
    letterSpacing: 0.15,
  },
  bellBadge: {
    position: 'absolute',
    top: -1,
    right: -1,
    minWidth: 15,
    height: 15,
    borderRadius: 7.5,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#4845D2',
    paddingHorizontal: 2,
  },
  bellBadgeText: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  liveBannerWrapper: {
    paddingHorizontal: 14,
    paddingTop: 10,
  },

  // 2. Banner Section Styles
  bannersSection: {
    paddingTop: 12,
    paddingBottom: 6,
  },
  bannersScrollContent: {
    paddingHorizontal: 14,
  },
  bannerCard: {
    height: 165,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    elevation: 2,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  bannerDotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    marginTop: 8,
  },
  bannerDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#D1D5DB',
  },
  bannerDotActive: {
    width: 14,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#4845D2',
  },

  // 3. "FREE VIDEOS FOR YOU" Styles
  freeVideosSection: {
    paddingTop: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  sectionHeaderText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  sectionViewAllText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#2563EB',
  },
  videosScrollContent: {
    paddingHorizontal: 14,
    gap: 12,
  },
  videoCard: {
    height: 160,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  videoThumbnailWrapper: {
    width: '100%',
    height: '100%',
    position: 'relative',
    backgroundColor: '#F1F5F9',
  },
  videoThumbnailImage: {
    width: '100%',
    height: '100%',
  },
  videoDurationBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(15, 23, 42, 0.78)',
    paddingHorizontal: 7,
    paddingVertical: 3.5,
    borderRadius: 6,
  },
  videoDurationText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  playIconOverlay: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoBottomScrim: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 16,
    paddingBottom: 8,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.36)',
  },
  videoBottomOverlayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  videoAdvertTag: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  videoWatermarkBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  videoWatermarkText: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#0F172A',
  },

  // 4. Batch Status Card Styles: "You are not added to any batch yet"
  batchStatusCardWrapper: {
    paddingHorizontal: 14,
    paddingTop: 16,
  },
  batchStatusCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
  },
  batchAvatarWrapper: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 14,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: '#FFF7ED',
  },
  batchAvatarImage: {
    width: '100%',
    height: '100%',
  },
  batchInfoWrapper: {
    flex: 1,
  },
  batchTitleText: {
    fontSize: 15.5,
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 21,
    flex: 1,
    marginRight: 8,
  },
  batchSubtitleText: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
    lineHeight: 18,
  },
  sendJoinRequestText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0284C7',
    marginTop: 10,
  },
  joinAnotherButtonText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0284C7',
  },
  enrolledBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    flexShrink: 0,
  },
  enrolledBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#059669',
  },
  goToBatchButton: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  goToBatchButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563EB',
  },

  // 5. "Share the app" Card Styles
  shareAppSection: {
    paddingHorizontal: 14,
    paddingTop: 14,
  },
  shareAppCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#1E1B4B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    overflow: 'hidden',
    position: 'relative',
  },
  shareWatermarkContainer: {
    position: 'absolute',
    top: -35,
    right: -35,
    width: 170,
    height: 170,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 0,
  },
  shareRingOuter: {
    position: 'absolute',
    width: 170,
    height: 170,
    borderRadius: 85,
    borderWidth: 1.5,
    borderColor: 'rgba(186, 230, 253, 0.45)',
    backgroundColor: 'rgba(240, 249, 255, 0.35)',
  },
  shareRingMid: {
    position: 'absolute',
    width: 118,
    height: 118,
    borderRadius: 59,
    borderWidth: 1.5,
    borderColor: 'rgba(186, 230, 253, 0.65)',
    backgroundColor: 'rgba(224, 242, 254, 0.3)',
  },
  shareRingInner: {
    position: 'absolute',
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: 'rgba(186, 230, 253, 0.45)',
  },
  shareHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    zIndex: 1,
  },
  shareTitleText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  shareSubtitleText: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 3,
    lineHeight: 18,
  },
  shareInviteBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E7FF',
    zIndex: 1,
  },
  shareInviteBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#4845D2',
    letterSpacing: 0.5,
  },
  shareActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    zIndex: 1,
  },
  shareWhatsAppPill: {
    flex: 1.15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  whatsappIconCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#25D366',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareWhatsAppText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#15803D',
  },
  shareCopyLinkPill: {
    flex: 0.85,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  shareCopiedPill: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  copyLinkIconCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  copiedIconCircle: {
    backgroundColor: '#D1FAE5',
  },
  shareCopyLinkText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#0284C7',
  },
  shareCopiedText: {
    color: '#059669',
  },

  // 6. Announcements Styles
  announcementsSection: {
    paddingHorizontal: 14,
    paddingTop: 14,
  },
  announcementCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 1,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
  },

  // Toast Styles
  toastContainer: {
    position: 'absolute',
    alignSelf: 'center',
    backgroundColor: '#0F172A',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    elevation: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    zIndex: 999,
  },
  toastText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Video Modal Popup Styles (Minimal & Clean)
  videoModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  videoModalPopup: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 14,
    elevation: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  videoModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  videoModalTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 18,
    letterSpacing: -0.2,
  },
  videoModalSubtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  videoModalSubtitleText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#64748B',
  },
  videoModalCloseButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modalPlayerWrapper: {
    width: '100%',
    height: 205,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#000000',
    justifyContent: 'center',
  },
  modalPlayerThumbnail: {
    width: '100%',
    height: '100%',
  },
  videoModalFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 6,
  },
  videoFacultyMinimal: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  videoFacultyAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#E2E8F0',
  },
  videoFacultyName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  videoFacultyRole: {
    fontSize: 10.5,
    color: '#64748B',
  },
  minimalYoutubeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  minimalYoutubeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#DC2626',
  },
});
