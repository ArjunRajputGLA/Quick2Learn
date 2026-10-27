import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Linking,
  Alert,
  TextInput,
  Share,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import {
  MessageSquare,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Sparkles,
  BookOpen,
  Award,
  Download,
  Users,
  Video,
  ExternalLink,
  Paperclip,
  Share2,
  ShieldCheck,
  Calendar,
  CheckCircle2,
  FileText,
  ArrowRight,
  Phone,
  Search,
  X,
  CreditCard,
  GraduationCap,
  Sparkle,
} from 'lucide-react-native';
import { Screen } from '../../src/components/ui/Screen';
import { AppHeader } from '../../src/components/ui/AppHeader';
import { useI18n } from '../../src/lib/i18n';
import { useMe } from '../../src/api/hooks';

interface WalkthroughSlideItem {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  icon: React.ReactNode;
  accentBg: string;
  accentText: string;
  actionLabel?: string;
  onAction?: () => void;
}

interface FaqItem {
  q: string;
  a: string;
  category: 'General' | 'Batches' | 'Chats' | 'Tests' | 'Attendance' | 'Fees';
  keywords: string;
}

export default function HelpScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: me } = useMe();
  const role = me?.role || 'student';
  const isAdminOrTeacher = role === 'admin' || role === 'teacher';

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedRoleTab, setSelectedRoleTab] = useState<'student' | 'teacher'>(
    isAdminOrTeacher ? 'teacher' : 'student'
  );
  const [activeSlide, setActiveSlide] = useState(0);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFaqCategory, setSelectedFaqCategory] = useState<string>('All');

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await Promise.all([
        queryClient.refetchQueries({ type: 'active' }),
        new Promise((resolve) => setTimeout(resolve, 350)),
      ]);
    } catch (err) {
      console.warn('[Help] Refresh error:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleShareApp = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await Share.share({
        title: 'Quick2Learn App',
        message:
          'Join Quick2Learn to master CBSE & ICSE Mathematics with Dinesh Sir! Download the app: https://play.google.com/store/apps/details?id=in.quick2learn.app (Batch Code: KFVMT)',
      });
    } catch (e) {
      console.warn('Share error:', e);
    }
  };

  // Student Walkthrough Guides
  const studentSlides: WalkthroughSlideItem[] = useMemo(
    () => [
      {
        id: 'live-classes',
        title: '1. Interactive Live Classes & Replays',
        subtitle:
          'Join scheduled live stream lectures with 1 tap from your Home banner. View attendance and access full HD recorded replays with 1.25x / 1.5x / 2x speed controls anytime.',
        badge: 'Live Learning',
        icon: <Video size={20} color="#2563EB" />,
        accentBg: 'bg-blue-50',
        accentText: 'text-blue-700',
        actionLabel: 'Go to Home / Live',
        onAction: () => router.push('/(app)/(tabs)'),
      },
      {
        id: 'batches-join',
        title: '2. Enrolled Batches & 6-Char Join Codes',
        subtitle:
          'Switch between Class 9–12 CBSE & ICSE batches. To enroll, tap "Join Batch", enter the 6-character code from Dinesh Sir (e.g. MATH-1082), and access your daily schedule.',
        badge: 'Academics',
        icon: <Users size={20} color="#059669" />,
        accentBg: 'bg-emerald-50',
        accentText: 'text-emerald-700',
        actionLabel: 'View My Batches',
        onAction: () => router.push('/(app)/(tabs)/batches'),
      },
      {
        id: 'practice-tests',
        title: '3. Chapter Practice Tests & Analytics',
        subtitle:
          'Take chapter-wise timed MCQ tests with our live question palette. Receive instant scorecards, percentiles, ranking, and step-by-step mathematical explanations.',
        badge: 'Exam Prep',
        icon: <Award size={20} color="#7C3AED" />,
        accentBg: 'bg-purple-50',
        accentText: 'text-purple-700',
        actionLabel: 'Explore Tests',
        onAction: () => router.push('/(app)/(tabs)/tests'),
      },
      {
        id: 'chat-attachments',
        title: '4. Chats with Camera & PDF Attachments',
        subtitle:
          'Ask doubts 1-on-1 with Dinesh Sir or discuss in batch channels. Tap the Paperclip icon to attach camera photos, homework pictures, or PDF notes with instant read receipts.',
        badge: 'Doubt Clearing',
        icon: <MessageSquare size={20} color="#0284C7" />,
        accentBg: 'bg-sky-50',
        accentText: 'text-sky-700',
        actionLabel: 'Open Chats',
        onAction: () => router.push('/(app)/(tabs)/chats'),
      },
      {
        id: 'offline-library',
        title: '5. Offline Notes & Study Material',
        subtitle:
          'Download chapter formula sheets, NCERT exemplar solutions, and revision PDFs. Access all saved files under Profile > Offline Downloads without needing internet access.',
        badge: 'Offline Study',
        icon: <Download size={20} color="#D97706" />,
        accentBg: 'bg-amber-50',
        accentText: 'text-amber-700',
        actionLabel: 'Open Profile Library',
        onAction: () => router.push('/(app)/(tabs)/profile'),
      },
      {
        id: 'parent-receipts',
        title: '6. Parent Sync Code & Fee Receipts',
        subtitle:
          'Share your 6-character Parent Code so parents can monitor attendance and marks. Download official computer-generated serialized GST fee receipts directly from Payment History.',
        badge: 'Parent Link',
        icon: <CreditCard size={20} color="#E11D48" />,
        accentBg: 'bg-rose-50',
        accentText: 'text-rose-700',
        actionLabel: 'View Fee Receipts',
        onAction: () => router.push('/(app)/fees'),
      },
      {
        id: 'share-apk',
        title: '7. Share Quick2Learn APK with Friends',
        subtitle:
          'Share the Quick2Learn Android APK installer directly via WhatsApp, Bluetooth, or Nearby Share so your classmates can study and take mock tests with you.',
        badge: 'Community',
        icon: <Share2 size={20} color="#0D9488" />,
        accentBg: 'bg-teal-50',
        accentText: 'text-teal-700',
        actionLabel: 'Share App Now',
        onAction: handleShareApp,
      },
    ],
    [router]
  );

  // Faculty & Admin Walkthrough Guides
  const teacherSlides: WalkthroughSlideItem[] = useMemo(
    () => [
      {
        id: 'batch-creation',
        title: '1. Create Batches & Generate Join Codes',
        subtitle:
          'Create new class cohorts for Class 9th to 12th (CBSE & ICSE). Generate unique 6-character join codes (e.g. MATH-1082) to share with students for quick enrollment.',
        badge: 'Cohorts',
        icon: <Users size={20} color="#2563EB" />,
        accentBg: 'bg-blue-50',
        accentText: 'text-blue-700',
        actionLabel: 'Manage Batches',
        onAction: () => router.push('/(app)/(tabs)/batches'),
      },
      {
        id: 'mark-attendance',
        title: '2. 1-Tap Daily Attendance Marking',
        subtitle:
          'Record batch attendance effortlessly with Present (P), Absent (A), and Late (L) tags. Syncs instantly to student calendars and informs parents.',
        badge: 'Attendance',
        icon: <Calendar size={20} color="#059669" />,
        accentBg: 'bg-emerald-50',
        accentText: 'text-emerald-700',
        actionLabel: 'Open Attendance',
        onAction: () => router.push('/(app)/(tabs)/batches'),
      },
      {
        id: 'join-requests',
        title: '3. Approve Join Requests & View Profiles',
        subtitle:
          'Review pending student requests with 1-tap Approve/Reject. Open the Student Detail Modal to view phone numbers, enrolled subjects, and fee status.',
        badge: 'Roster',
        icon: <GraduationCap size={20} color="#7C3AED" />,
        accentBg: 'bg-purple-50',
        accentText: 'text-purple-700',
        actionLabel: 'Inspect Students',
        onAction: () => router.push('/(app)/(tabs)/batches'),
      },
      {
        id: 'faculty-chats',
        title: '4. Direct Student Chats & Document Sharing',
        subtitle:
          'Message enrolled students 1-on-1 or broadcast to batch groups. Send assignment PDFs, exam photos, and study guides with full attachment preview and read receipts.',
        badge: 'Communication',
        icon: <MessageSquare size={20} color="#0284C7" />,
        accentBg: 'bg-sky-50',
        accentText: 'text-sky-700',
        actionLabel: 'Open Chat Portal',
        onAction: () => router.push('/(app)/(tabs)/chats'),
      },
      {
        id: 'fee-receipts-mgmt',
        title: '5. Track Fees & Issue Computerized Receipts',
        subtitle:
          'Track paid and overdue fee instalments across all batches. Generate and download serialized GST-compliant computerized fee receipts for student records.',
        badge: 'Finance',
        icon: <CreditCard size={20} color="#D97706" />,
        accentBg: 'bg-amber-50',
        accentText: 'text-amber-700',
        actionLabel: 'Open Fees Portal',
        onAction: () => router.push('/(app)/fees'),
      },
    ],
    [router]
  );

  const activeSlides = selectedRoleTab === 'student' ? studentSlides : teacherSlides;
  const currentSlide = activeSlides[activeSlide] || activeSlides[0];

  const handleNextSlide = () => {
    setActiveSlide((prev) => Math.min(activeSlides.length - 1, prev + 1));
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handlePrevSlide = () => {
    setActiveSlide((prev) => Math.max(0, prev - 1));
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const faqs: FaqItem[] = useMemo(
    () => [
      {
        category: 'Chats',
        q: 'How do I attach photos or PDF documents in the chat?',
        a: 'Tap the Paperclip icon on the left side of the message typing bar. You can choose "Camera" to take a photo of your handwritten doubt, "Photo Library" to select an image, or "Document" to attach a PDF notes file. A preview chip will appear above the input bar where you can verify the file before tapping the blue Send arrow.',
        keywords: 'chat attach photo image pdf camera document paperclip file doubts message',
      },
      {
        category: 'Batches',
        q: 'How do I join a batch using a 6-character Join Code?',
        a: 'Navigate to the Batches tab, tap "Join Batch", and enter the 6-character code provided by Dinesh Sir (for example, MATH-1082 or SCIE-901). Once submitted, the faculty team approves your request, and your batch schedule, attendance calendar, and lecture replay library will activate immediately.',
        keywords: 'join code batch enroll student class code approve request',
      },
      {
        category: 'General',
        q: 'How do I join a live lecture or access lecture replays?',
        a: 'When a class is live, an orange banner appears at the top of your Home screen. Tap "Join Live" to enter the interactive stream. If you missed a live class, go to your Batch and tap any completed topic to watch the full HD recording with playback speed controls (1x, 1.25x, 1.5x, 2x).',
        keywords: 'live class lecture video replay record stream home banner watch',
      },
      {
        category: 'Tests',
        q: 'How do chapter practice tests and instant rankings work?',
        a: 'Open the Tests tab, select a chapter or subject test, and tap "Start Test". You can navigate questions using the live palette (answered, review, unanswered). After submitting, you receive your instant score, accuracy percentage, batch percentile rank, and mathematical step-by-step solutions.',
        keywords: 'test exam practice score rank percentile solution chapter math result',
      },
      {
        category: 'Attendance',
        q: 'How do I check my attendance and how is it marked?',
        a: 'Open your Batch from the Batches tab to view the monthly Attendance Calendar. Green represents Present (P), red represents Absent (A), and yellow represents Late (L). Faculty marks attendance daily during live lectures and classroom sessions.',
        keywords: 'attendance calendar present absent late check mark percentage',
      },
      {
        category: 'General',
        q: 'How can my parents monitor my attendance and test performance?',
        a: 'Navigate to Profile > Parent Access. Tap "Share Code" to send your unique 6-character link code to your parents via WhatsApp or SMS. Once linked, parents can view your verified daily attendance and academic report cards from their mobile device.',
        keywords: 'parent access invite code share link track report card scores',
      },
      {
        category: 'Fees',
        q: 'How do I view payment history and download computerized fee receipts?',
        a: 'Go to Profile > Payments & Fees > Payment History (or open the Fees tab). Each completed fee installment has a "Download Receipt" button that opens an official computer-generated serialized GST PDF receipt ready to save or print.',
        keywords: 'fee receipt download payment invoice history instalment pdf accounts',
      },
      {
        category: 'General',
        q: 'Can I study and view notes without an active internet connection?',
        a: 'Yes! Open any study note, NCERT solution, or formula sheet in the app and tap "Download for Offline Study". You can access all your saved revision materials under Profile > Offline Downloads anytime without mobile data or Wi-Fi.',
        keywords: 'offline download study material notes ncert formula pdf internet cache',
      },
      {
        category: 'Batches',
        q: 'How does faculty mark attendance and manage batch enrollments?',
        a: 'Teachers and administrators can open any batch, tap "Pending Requests" to approve verified students, and tap "Take Attendance" to mark Present, Absent, or Late with one tap. Faculty can also view full student details, phone numbers, and enrolled courses in the Student Detail Modal.',
        keywords: 'teacher faculty admin mark attendance approve student detail modal roster',
      },
      {
        category: 'General',
        q: 'How do I share the Quick2Learn APK with friends and classmates?',
        a: 'Open the top-left rolling dropdown menu or Profile, then tap "Share App APK". You can send the APK file directly to nearby Android devices using WhatsApp, Bluetooth, Nearby Share, or share the direct download link.',
        keywords: 'share apk bluetooth nearby share app whatsapp friends classmates invite',
      },
      {
        category: 'General',
        q: 'Who can I contact for urgent academic or technical assistance?',
        a: 'You can chat directly with Dinesh Sir and the academic faculty in the Chats tab, or tap the green "Institute WhatsApp Support" banner at the top of this screen to chat on WhatsApp (+91 94122 78888 or +91 94122 78910) or call directly.',
        keywords: 'contact support whatsapp phone dinesh sir help urgent call academic',
      },
    ],
    []
  );

  const categories = ['All', 'Chats', 'Batches', 'Tests', 'Attendance', 'Fees', 'General'];

  const filteredFaqs = useMemo(() => {
    let list = faqs;
    if (selectedFaqCategory !== 'All') {
      list = list.filter((f) => f.category === selectedFaqCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (f) =>
          f.q.toLowerCase().includes(q) ||
          f.a.toLowerCase().includes(q) ||
          f.keywords.toLowerCase().includes(q)
      );
    }
    return list;
  }, [faqs, selectedFaqCategory, searchQuery]);

  const handleOpenWhatsApp = async (phoneNum = '919412278910') => {
    const text = encodeURIComponent(
      'Hello Dinesh Sir & Quick2Learn team, I need assistance regarding the app.'
    );
    const url = `https://wa.me/${phoneNum}?text=${text}`;

    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        await Linking.openURL(`https://api.whatsapp.com/send?phone=${phoneNum}&text=${text}`);
      }
    } catch {
      Alert.alert(
        'WhatsApp Support',
        `Could not launch WhatsApp. You can reach Dinesh Sir directly at +${phoneNum}.`
      );
    }
  };

  const handleCallSupport = () => {
    Linking.openURL('tel:+919412278910');
  };

  return (
    <Screen scrollable={false} header={<AppHeader title="Help & How to Use" showBack />}>
      <ScrollView
        contentContainerStyle={{ padding: 14, paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={['#2563EB']}
            tintColor="#2563EB"
          />
        }
      >
        {/* Top Institute Support Banner */}
        <View className="bg-emerald-600 rounded-2xl p-4 mb-4 shadow-sm text-white">
          <View className="flex-row items-center justify-between mb-1.5">
            <View className="flex-row items-center space-x-2">
              <View className="w-8 h-8 rounded-full bg-emerald-500/50 items-center justify-center">
                <MessageSquare size={17} color="#FFFFFF" />
              </View>
              <Text className="text-sm font-bold text-white ml-2">
                Institute Faculty & Helpdesk
              </Text>
            </View>
            <View className="bg-emerald-700/60 px-2.5 py-0.5 rounded-full">
              <Text className="text-[10px] font-bold text-emerald-100 uppercase tracking-wider">
                Online
              </Text>
            </View>
          </View>

          <Text className="text-xs text-emerald-100 leading-relaxed mb-3">
            Have questions about your batches, attendance, practice tests, or admission? Connect
            directly with Dinesh Sir & the academic team.
          </Text>

          <View className="flex-row items-center gap-2">
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => handleOpenWhatsApp('919412278910')}
              className="flex-1 bg-white py-2 px-3 rounded-xl flex-row items-center justify-center min-h-[40px] active:bg-emerald-50 shadow-xs"
            >
              <MessageSquare size={15} color="#059669" />
              <Text className="text-xs font-bold text-emerald-800 ml-1.5">
                Chat on WhatsApp
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleCallSupport}
              className="bg-emerald-700/80 px-3.5 py-2 rounded-xl flex-row items-center justify-center min-h-[40px] active:bg-emerald-800 border border-emerald-500/40"
            >
              <Phone size={15} color="#FFFFFF" />
              <Text className="text-xs font-bold text-white ml-1.5">Call</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Role Tab Selector (Only shown for Faculty & Admin to prevent leaking staff tools to students) */}
        {isAdminOrTeacher && (
          <View className="bg-surface rounded-2xl p-1 border border-border mb-4 flex-row">
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                setSelectedRoleTab('student');
                setActiveSlide(0);
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              className={`flex-1 py-2 rounded-xl items-center flex-row justify-center ${
                selectedRoleTab === 'student' ? 'bg-primary shadow-xs' : 'bg-transparent'
              }`}
            >
              <GraduationCap
                size={15}
                color={selectedRoleTab === 'student' ? '#FFFFFF' : '#64748B'}
              />
              <Text
                className={`text-xs font-bold ml-1.5 ${
                  selectedRoleTab === 'student' ? 'text-white' : 'text-ink-muted'
                }`}
              >
                Student Guide
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                setSelectedRoleTab('teacher');
                setActiveSlide(0);
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              className={`flex-1 py-2 rounded-xl items-center flex-row justify-center ${
                selectedRoleTab === 'teacher' ? 'bg-primary shadow-xs' : 'bg-transparent'
              }`}
            >
              <Users
                size={15}
                color={selectedRoleTab === 'teacher' ? '#FFFFFF' : '#64748B'}
              />
              <Text
                className={`text-xs font-bold ml-1.5 ${
                  selectedRoleTab === 'teacher' ? 'text-white' : 'text-ink-muted'
                }`}
              >
                Faculty & Admin
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Walkthrough Carousel Section */}
        <View className="bg-surface rounded-2xl p-4 border border-border mb-4 shadow-xs space-y-3">
          <View className="flex-row items-center justify-between mb-1">
            <View className="flex-row items-center gap-1.5">
              <Sparkles size={16} color="#2563EB" />
              <Text className="text-sm font-bold text-ink">
                How to Use Quick2Learn
              </Text>
            </View>
            <View className="bg-primary/10 px-2.5 py-0.5 rounded-full">
              <Text className="text-[11px] font-bold text-primary">
                Step {activeSlide + 1} of {activeSlides.length}
              </Text>
            </View>
          </View>

          {/* Active Card Body */}
          <View className="p-3.5 rounded-xl bg-surface-subtle border border-border/80">
            <View className="flex-row items-center justify-between mb-2.5">
              <View
                className={`w-10 h-10 rounded-xl items-center justify-center ${currentSlide.accentBg}`}
              >
                {currentSlide.icon}
              </View>
              <View className={`px-2.5 py-0.5 rounded-full ${currentSlide.accentBg}`}>
                <Text className={`text-[10.5px] font-bold ${currentSlide.accentText}`}>
                  {currentSlide.badge}
                </Text>
              </View>
            </View>

            <Text className="text-sm font-bold text-ink mb-1.5">
              {currentSlide.title}
            </Text>
            <Text className="text-xs text-ink-muted leading-relaxed mb-3">
              {currentSlide.subtitle}
            </Text>

            {currentSlide.actionLabel && currentSlide.onAction && (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={currentSlide.onAction}
                className="bg-primary/10 border border-primary/25 rounded-lg py-2 px-3 flex-row items-center justify-between self-start active:bg-primary/20"
              >
                <Text className="text-xs font-bold text-primary mr-2">
                  {currentSlide.actionLabel}
                </Text>
                <ArrowRight size={13} color="#2563EB" />
              </TouchableOpacity>
            )}
          </View>

          {/* Carousel Navigation Buttons & Dots */}
          <View className="flex-row items-center justify-between pt-1">
            {/* Dots */}
            <View className="flex-row items-center">
              {activeSlides.map((_, idx) => (
                <TouchableOpacity
                  key={idx}
                  onPress={() => {
                    setActiveSlide(idx);
                    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  className={`h-1.5 rounded-full mr-1 ${
                    activeSlide === idx ? 'w-5 bg-primary' : 'w-1.5 bg-border'
                  }`}
                />
              ))}
            </View>

            {/* Prev / Next buttons */}
            <View className="flex-row items-center gap-2">
              <TouchableOpacity
                disabled={activeSlide === 0}
                onPress={handlePrevSlide}
                className={`py-1.5 px-3 rounded-lg border ${
                  activeSlide === 0
                    ? 'border-border/40 opacity-40'
                    : 'border-border bg-surface active:bg-surface-subtle'
                }`}
              >
                <Text className="text-xs font-semibold text-ink">Previous</Text>
              </TouchableOpacity>

              <TouchableOpacity
                disabled={activeSlide === activeSlides.length - 1}
                onPress={handleNextSlide}
                className={`py-1.5 px-3 rounded-lg border ${
                  activeSlide === activeSlides.length - 1
                    ? 'border-border/40 opacity-40'
                    : 'border-primary bg-primary active:bg-primary/90'
                }`}
              >
                <Text
                  className={`text-xs font-semibold ${
                    activeSlide === activeSlides.length - 1 ? 'text-ink-muted' : 'text-white'
                  }`}
                >
                  Next
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Quick Feature Pillars Grid */}
        <View className="mb-4">
          <Text className="text-xs font-bold text-ink-muted uppercase tracking-wider mb-2 px-0.5">
            Quick Navigation & Features
          </Text>

          <View className="flex-row flex-wrap gap-2">
            <TouchableOpacity
              activeOpacity={0.75}
              onPress={() => router.push('/(app)/(tabs)/batches')}
              style={{ width: '48.5%' }}
              className="bg-surface p-3 rounded-xl border border-border shadow-2xs"
            >
              <View className="w-8 h-8 rounded-lg bg-blue-50 items-center justify-center mb-1.5">
                <Users size={17} color="#2563EB" />
              </View>
              <Text className="text-xs font-bold text-ink mb-0.5">Batches & Attendance</Text>
              <Text className="text-[10.5px] text-ink-muted" numberOfLines={2}>
                Join codes, class roster & monthly attendance
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.75}
              onPress={() => router.push('/(app)/(tabs)/chats')}
              style={{ width: '48.5%' }}
              className="bg-surface p-3 rounded-xl border border-border shadow-2xs"
            >
              <View className="w-8 h-8 rounded-lg bg-sky-50 items-center justify-center mb-1.5">
                <MessageSquare size={17} color="#0284C7" />
              </View>
              <Text className="text-xs font-bold text-ink mb-0.5">Faculty & Batch Chat</Text>
              <Text className="text-[10.5px] text-ink-muted" numberOfLines={2}>
                Ask doubts with camera & PDF attachments
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.75}
              onPress={() => router.push('/(app)/(tabs)/tests')}
              style={{ width: '48.5%' }}
              className="bg-surface p-3 rounded-xl border border-border shadow-2xs"
            >
              <View className="w-8 h-8 rounded-lg bg-purple-50 items-center justify-center mb-1.5">
                <Award size={17} color="#7C3AED" />
              </View>
              <Text className="text-xs font-bold text-ink mb-0.5">Tests & Performance</Text>
              <Text className="text-[10.5px] text-ink-muted" numberOfLines={2}>
                Chapter mock tests, ranks & solutions
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.75}
              onPress={() => router.push('/(app)/fees')}
              style={{ width: '48.5%' }}
              className="bg-surface p-3 rounded-xl border border-border shadow-2xs"
            >
              <View className="w-8 h-8 rounded-lg bg-rose-50 items-center justify-center mb-1.5">
                <CreditCard size={17} color="#E11D48" />
              </View>
              <Text className="text-xs font-bold text-ink mb-0.5">Fees & PDF Receipts</Text>
              <Text className="text-[10.5px] text-ink-muted" numberOfLines={2}>
                Payment history & official GST invoices
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* FAQ Accordion Section */}
        <View className="bg-surface rounded-2xl p-4 border border-border shadow-xs space-y-3">
          <View className="flex-row items-center justify-between mb-1">
            <View className="flex-row items-center gap-1.5">
              <HelpCircle size={16} color="#2563EB" />
              <Text className="text-sm font-bold text-ink">
                Frequently Asked Questions
              </Text>
            </View>
            <Text className="text-[11px] font-semibold text-ink-muted">
              {filteredFaqs.length} Guides
            </Text>
          </View>

          {/* Search Input for FAQs */}
          <View className="flex-row items-center bg-surface-subtle border border-border rounded-xl px-3 py-1.5">
            <Search size={14} color="#94A3B8" className="mr-2" />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search features (e.g. attendance, chat, test, receipt)..."
              placeholderTextColor="#94A3B8"
              style={{
                flex: 1,
                fontSize: 12.5,
                color: '#0F172A',
                paddingVertical: Platform.OS === 'ios' ? 4 : 2,
              }}
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <X size={14} color="#94A3B8" />
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Category Pills */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="py-1 -mx-1">
            <View className="flex-row items-center px-1 gap-1.5">
              {categories.map((cat) => {
                const isSelected = selectedFaqCategory === cat;
                return (
                  <TouchableOpacity
                    key={cat}
                    activeOpacity={0.7}
                    onPress={() => {
                      setSelectedFaqCategory(cat);
                      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                    className={`px-3 py-1 rounded-full border ${
                      isSelected
                        ? 'bg-primary border-primary'
                        : 'bg-surface-subtle border-border'
                    }`}
                  >
                    <Text
                      className={`text-[11px] font-bold ${
                        isSelected ? 'text-white' : 'text-ink-muted'
                      }`}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          {/* Accordion FAQ Items */}
          <View className="divide-y divide-border/60">
            {filteredFaqs.length === 0 ? (
              <View className="py-6 items-center">
                <Text className="text-xs font-semibold text-ink-muted">
                  No questions match your search.
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    setSearchQuery('');
                    setSelectedFaqCategory('All');
                  }}
                  className="mt-2"
                >
                  <Text className="text-xs font-bold text-primary">Clear Filters</Text>
                </TouchableOpacity>
              </View>
            ) : (
              filteredFaqs.map((faq, index) => {
                const isOpen = expandedFaq === index;
                return (
                  <View key={index} className="py-3">
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => {
                        setExpandedFaq(isOpen ? null : index);
                        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }}
                      className="flex-row items-start justify-between"
                    >
                      <View className="flex-1 mr-3">
                        <View className="flex-row items-center gap-1.5 mb-1">
                          <View className="bg-primary/10 px-2 py-0.5 rounded-md">
                            <Text className="text-[9.5px] font-bold text-primary uppercase">
                              {faq.category}
                            </Text>
                          </View>
                        </View>
                        <Text className="text-xs font-semibold text-ink leading-snug">
                          {faq.q}
                        </Text>
                      </View>
                      <View className="mt-1">
                        {isOpen ? (
                          <ChevronUp size={16} color="#2563EB" />
                        ) : (
                          <ChevronDown size={16} color="#94A3B8" />
                        )}
                      </View>
                    </TouchableOpacity>

                    {isOpen && (
                      <View className="mt-2.5 bg-surface-subtle p-3 rounded-xl border border-border/70">
                        <Text className="text-xs text-ink-muted leading-relaxed">
                          {faq.a}
                        </Text>
                      </View>
                    )}
                  </View>
                );
              })
            )}
          </View>
        </View>

        {/* Footer Direct Contact Note */}
        <View className="items-center mt-3 mb-4">
          <View className="flex-row items-center gap-1 mb-1">
            <ShieldCheck size={14} color="#059669" />
            <Text className="text-xs font-bold text-ink">
              Quick2Learn Academic Guarantee
            </Text>
          </View>
          <Text className="text-[11px] text-ink-muted text-center max-w-[280px] leading-tight">
            Comprehensive CBSE & ICSE Mathematics coaching led by Dinesh Singh Rajput.
          </Text>
        </View>
      </ScrollView>
    </Screen>
  );
}
