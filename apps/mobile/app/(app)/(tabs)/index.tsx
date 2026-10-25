import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
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

// Authentic free video lectures matching the screenshot
const FREE_VIDEOS = [
  {
    id: 'free-vid-1',
    title: 'Start your revision & doubt clearing with us',
    category: 'advertisement',
    duration: '2:45',
    thumbnail: require('../../../assets/banners/free_video_1.png'),
    hasOverlayText: true,
    description: 'Learn how Quick2Learn helps Class IX to XII students excel in CBSE and ICSE Board examinations with Dinesh Rajput Sir.',
    faculty: 'Dinesh Singh Rajput',
  },
  {
    id: 'free-vid-2',
    title: 'Class 9 & 10 Mathematics Foundations & Exam Strategy',
    category: 'advertisement',
    duration: '18:15',
    thumbnail: require('../../../assets/banners/rajput_sir_ix_x.jpg'),
    hasOverlayText: false,
    description: 'In-depth introduction to ICSE Class IX and CBSE Class X Mathematics by Dinesh Singh Rajput Sir.',
    faculty: 'Dinesh Singh Rajput',
  },
  {
    id: 'free-vid-3',
    title: 'ICSE Class 9 Chemistry - Course Introduction',
    category: 'advertisement',
    duration: '14:20',
    thumbnail: require('../../../assets/banners/icse_9_chemistry.png'),
    hasOverlayText: false,
    description: "Complete syllabus overview and chapter breakdown for ICSE Class 9 Chemistry with Namita Singh Rajput Ma'am.",
    faculty: 'Namita Singh Rajput',
  },
  {
    id: 'free-vid-4',
    title: 'CBSE Class 12 Mathematics - Term 1 Strategy & Calculus',
    category: 'advertisement',
    duration: '22:40',
    thumbnail: require('../../../assets/banners/xii_maths_course.png'),
    hasOverlayText: false,
    description: 'Detailed strategy for scoring 95+ in Class XII Board Mathematics with Dinesh Singh Rajput Sir.',
    faculty: 'Dinesh Singh Rajput',
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
  const [selectedVideo, setSelectedVideo] = useState<(typeof FREE_VIDEOS)[0] | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [activeBannerIndex, setActiveBannerIndex] = useState(0);

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
      refetch();
      refetchStudentBatches();
      refetchTests();
      if (isStaff) {
        adminStore.init();
        refetchTeacherBatches();
      }
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
      showToast('App link ready to share!');
    } catch {
      showToast('Link: ' + appUrl);
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
  const enrolledBatches = studentBatchesData?.enrolled || [];
  const hasEnrolledBatches = enrolledBatches.length > 0;

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

  return (
    <View style={styles.screenContainer}>
      <StatusBar style="light" />

      {/* 1. Header Bar: Solid #4845D2 with Menu icon, 2-line title, and Notification Bell */}
      <View style={[styles.headerContainer, { paddingTop: insets.top }]}>
        <View style={styles.headerContent}>
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
            <Menu size={24} color="#FFFFFF" strokeWidth={2.2} />
          </TouchableOpacity>

          {/* App Title: Exact 2-lines format as seen in the screenshot */}
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
            <Bell size={22} color="#FFFFFF" strokeWidth={2} />
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
            horizontal
            pagingEnabled={false}
            decelerationRate="fast"
            snapToInterval={Math.round(SCREEN_WIDTH * 0.84) + 12}
            snapToAlignment="start"
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.bannersScrollContent}
            onScroll={(e) => {
              const offsetX = e.nativeEvent.contentOffset.x;
              const cardWidth = Math.round(SCREEN_WIDTH * 0.84) + 12;
              const index = Math.round(offsetX / cardWidth);
              if (index !== activeBannerIndex) {
                setActiveBannerIndex(index);
              }
            }}
            scrollEventThrottle={32}
          >
            {displayBanners.map((banner, index) => {
              const cardWidth = Math.round(SCREEN_WIDTH * 0.84);
              return (
                <TouchableOpacity
                  key={banner.id}
                  activeOpacity={0.92}
                  onPress={() => handleBannerPress(banner as any)}
                  style={[styles.bannerCard, { width: cardWidth }]}
                >
                  <Image
                    source={banner.source}
                    style={styles.bannerImage}
                    contentFit="cover"
                    transition={200}
                  />
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Dots Indicator */}
          <View style={styles.bannerDotsRow}>
            {displayBanners.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.bannerDot,
                  i === activeBannerIndex && styles.bannerDotActive,
                ]}
              />
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

          {/* Horizontal list of Free Video Cards */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.videosScrollContent}
          >
            {FREE_VIDEOS.map((video) => {
              const videoWidth = Math.round(SCREEN_WIDTH * 0.74);
              return (
                <TouchableOpacity
                  key={video.id}
                  activeOpacity={0.88}
                  onPress={() => {
                    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedVideo(video);
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

                    {/* Play Button Icon on Top Right (matching screenshot) */}
                    <View style={styles.playIconOverlay}>
                      <Play size={15} color="#FFFFFF" fill="#FFFFFF" />
                    </View>

                    {/* If not pre-printed on image, show bottom labels */}
                    {!video.hasOverlayText && (
                      <View style={styles.videoBottomOverlayRow}>
                        <Text style={styles.videoAdvertTag}>advertisement</Text>
                        <View style={styles.videoWatermarkBadge}>
                          <Text style={styles.videoWatermarkText}>QUICK2LEARN</Text>
                        </View>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* 4. Batch Status Card */}
        {!hasEnrolledBatches ? (
          /* State A: Student is NOT added to any batch yet (Exact Screenshot Match) */
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
        ) : (
          /* State B: Student is enrolled in batch(es) (Screenshot 20-26-18 & 20-33-27 match) */
          <View style={styles.batchStatusCardWrapper}>
            <View style={styles.batchStatusCard}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text style={styles.batchTitleText} numberOfLines={1}>
                    {enrolledBatches[0].title}
                  </Text>
                  <View style={styles.enrolledBadge}>
                    <Text style={styles.enrolledBadgeText}>Enrolled</Text>
                  </View>
                </View>

                <Text style={styles.batchSubtitleText}>
                  Class {enrolledBatches[0].classLevel} • Tests available • {enrolledBatches[0].subjectName || 'Maths, Science'}
                </Text>

                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 6 }}>
                  <Image
                    source={require('../../../assets/Dinesh Singh Rajput.jpeg')}
                    style={{ width: 18, height: 18, borderRadius: 9 }}
                  />
                  <Text style={{ fontSize: 11.5, fontWeight: '700', color: '#334155', textTransform: 'uppercase' }}>
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
                  >
                    <Text style={styles.sendJoinRequestText}>
                      + Join Another
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* 5. "Share the app" Card (Exact match with Screenshot 20-23-35) */}
        <View style={styles.shareAppSection}>
          <View style={styles.shareAppCard}>
            {/* Subtle soft cyan/blue curved watermark shape on right */}
            <View style={styles.shareWatermarkBlob} />

            <Text style={styles.shareTitleText}>Share the app</Text>
            <Text style={styles.shareSubtitleText}>
              Let your friends know how much you enjoy this app
            </Text>

            {/* Actions Row: "Share on WhatsApp" | "Copy link" */}
            <View style={styles.shareActionsRow}>
              {/* WhatsApp Action */}
              <TouchableOpacity
                activeOpacity={0.75}
                onPress={handleShareWhatsApp}
                style={styles.shareActionButton}
              >
                <View style={styles.whatsappIconCircle}>
                  <MessageCircle size={15} color="#FFFFFF" strokeWidth={2.4} />
                </View>
                <Text style={styles.shareActionLinkText}>
                  Share on WhatsApp
                </Text>
              </TouchableOpacity>

              {/* Vertical Divider */}
              <View style={styles.shareDivider} />

              {/* Copy Link Action */}
              <TouchableOpacity
                activeOpacity={0.75}
                onPress={handleCopyLink}
                style={styles.shareActionButton}
              >
                <Link2 size={16} color="#0284C7" strokeWidth={2.4} />
                <Text style={styles.shareActionLinkText}>
                  Copy link
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
          showToast('Join request sent to Dinesh Sir!');
        }}
      />

      {/* Free Video Player Modal */}
      <Modal
        visible={Boolean(selectedVideo)}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedVideo(null)}
      >
        <View style={styles.videoModalOverlay}>
          <View style={styles.videoModalContent}>
            {/* Modal Header */}
            <View style={styles.videoModalHeader}>
              <View style={{ flex: 1, marginRight: 10 }}>
                <Text style={styles.videoModalCategory}>FREE LECTURE PREVIEW</Text>
                <Text style={styles.videoModalTitle} numberOfLines={2}>
                  {selectedVideo?.title}
                </Text>
              </View>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setSelectedVideo(null)}
                style={styles.videoModalCloseButton}
              >
                <X size={18} color="#0F172A" />
              </TouchableOpacity>
            </View>

            {/* Video Player Display */}
            {selectedVideo && (
              <View style={styles.modalPlayerWrapper}>
                <Image
                  source={selectedVideo.thumbnail}
                  style={styles.modalPlayerThumbnail}
                  contentFit="cover"
                />
                <View style={styles.modalPlayButtonOverlay}>
                  <Play size={28} color="#FFFFFF" fill="#FFFFFF" />
                </View>
                <View style={styles.modalDurationBadge}>
                  <Text style={styles.modalDurationText}>
                    {selectedVideo.duration}
                  </Text>
                </View>
              </View>
            )}

            {/* Teacher Details & Description */}
            <View style={styles.videoModalMeta}>
              <View style={styles.videoFacultyRow}>
                <Image
                  source={require('../../../assets/Dinesh Singh Rajput.jpeg')}
                  style={styles.videoFacultyAvatar}
                />
                <View>
                  <Text style={styles.videoFacultyName}>
                    {selectedVideo?.faculty || 'Dinesh Singh Rajput'}
                  </Text>
                  <Text style={styles.videoFacultyRole}>
                    Founder & Head of Mathematics
                  </Text>
                </View>
              </View>

              <Text style={styles.videoModalDescription}>
                {selectedVideo?.description}
              </Text>
            </View>

            {/* Actions */}
            <View style={styles.videoModalActions}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  setSelectedVideo(null);
                  router.push('/(app)/free-material' as any);
                }}
                style={styles.viewMoreVideosButton}
              >
                <Text style={styles.viewMoreVideosText}>Explore All Free Videos</Text>
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
    backgroundColor: '#4845D2',
  },
  // 1. Header Styles: Solid #4845D2 Action Bar
  headerContainer: {
    backgroundColor: '#4845D2',
    elevation: 4,
    shadowColor: '#1E1B4B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    zIndex: 10,
  },
  headerContent: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
  },
  headerIconButton: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  headerTitleWrapper: {
    flex: 1,
    paddingHorizontal: 8,
  },
  headerTitleText: {
    fontSize: 15.5,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 20,
    letterSpacing: 0.2,
  },
  bellBadge: {
    position: 'absolute',
    top: 3,
    right: 4,
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
    gap: 12,
  },
  bannerCard: {
    height: 165,
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
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#CBD5E1',
  },
  bannerDotActive: {
    width: 16,
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
  videoBottomOverlayRow: {
    position: 'absolute',
    bottom: 8,
    left: 10,
    right: 10,
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
  enrolledBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#A7F3D0',
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

  // 5. "Share the app" Card Styles (Screenshot 20-23-35 match)
  shareAppSection: {
    paddingHorizontal: 14,
    paddingTop: 14,
  },
  shareAppCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    overflow: 'hidden',
    position: 'relative',
  },
  shareWatermarkBlob: {
    position: 'absolute',
    top: -20,
    right: -20,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(238, 242, 255, 0.65)',
    zIndex: 0,
  },
  shareTitleText: {
    fontSize: 15.5,
    fontWeight: '700',
    color: '#0F172A',
    zIndex: 1,
  },
  shareSubtitleText: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 3,
    lineHeight: 18,
    zIndex: 1,
  },
  shareActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    zIndex: 1,
  },
  shareActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 4,
  },
  whatsappIconCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#25D366',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareActionLinkText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0284C7',
  },
  shareDivider: {
    width: 1,
    height: 20,
    backgroundColor: '#E2E8F0',
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

  // Video Modal Styles
  videoModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    justifyContent: 'flex-end',
  },
  videoModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 18,
    maxHeight: '85%',
  },
  videoModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  videoModalCategory: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#2563EB',
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  videoModalTitle: {
    fontSize: 15.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  videoModalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalPlayerWrapper: {
    width: '100%',
    height: 190,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#0F172A',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalPlayerThumbnail: {
    width: '100%',
    height: '100%',
  },
  modalPlayButtonOverlay: {
    position: 'absolute',
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(37, 99, 235, 0.88)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalDurationBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  modalDurationText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  videoModalMeta: {
    marginTop: 14,
  },
  videoFacultyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  videoFacultyAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  videoFacultyName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  videoFacultyRole: {
    fontSize: 11,
    color: '#64748B',
  },
  videoModalDescription: {
    fontSize: 12.5,
    color: '#475569',
    lineHeight: 18,
  },
  videoModalActions: {
    marginTop: 16,
  },
  viewMoreVideosButton: {
    backgroundColor: '#4845D2',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewMoreVideosText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
