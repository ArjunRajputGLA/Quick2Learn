import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Share,
  Alert,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import {
  GraduationCap,
  Plus,
  KeyRound,
  QrCode,
  Clock,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Search,
  Users,
  Copy,
  Share2,
  Video,
  Edit3,
  ChevronRight,
  School,
  Sparkles,
  Layers,
  X,
  BookOpen,
  UserCheck,
  MessageCircle,
  HelpCircle,
} from 'lucide-react-native';
import { Screen } from '../../../src/components/ui/Screen';
import { AppHeader } from '../../../src/components/ui/AppHeader';
import { Button } from '../../../src/components/ui/Button';
import { Badge } from '../../../src/components/ui/Badge';
import { Chip } from '../../../src/components/ui/Chip';
import { Skeleton } from '../../../src/components/ui/Skeleton';
import { BookLoader } from '../../../src/components/ui/BookLoader';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { SegmentedControl } from '../../../src/components/ui/SegmentedControl';
import { useMe, useStudentBatches, DEFAULT_INSTITUTE_BATCHES } from '../../../src/api/hooks';
import { useTabBarScroll } from '../../../src/lib/tabBarVisibilityStore';
import { BatchCard } from '../../../src/components/batches/BatchCard';
import { JoinBatchModal } from '../../../src/components/batches/JoinBatchModal';
import { cleanupOrphanedBatchDownloads } from '../../../src/lib/offline-downloads';
import {
  useAdminStore,
  type BatchItem,
} from '../../../src/lib/adminDataStore';
import {
  BatchDetailAdminModal,
  type BatchDetailTab,
} from '../../../src/components/admin/BatchDetailAdminModal';
import { BatchFormModal } from '../../../src/components/admin/AdminPortal';
import { colors, radii } from '@quick2learn/shared';
import { Image } from 'expo-image';
import { getFacultyAvatarSource } from '../../../src/lib/facultyImages';

const CLASS_FILTERS = ['all', '9', '10', '11', '12'] as const;
type ClassFilterType = (typeof CLASS_FILTERS)[number];

function formatScheduleSummary(days: string[] | undefined, time: string | undefined): string {
  const safeTime = time || 'Flexible';
  if (!days || days.length === 0) return safeTime;
  const count = days.length;
  if (count === 6 && !days.includes('Sun')) {
    return `Mon - Sat • ${safeTime}`;
  }
  if (count === 7) {
    return `Daily • ${safeTime}`;
  }
  if (count === 5 && days.includes('Mon') && days.includes('Fri') && !days.includes('Sat') && !days.includes('Sun')) {
    return `Mon - Fri • ${safeTime}`;
  }
  if (count === 3 && days.includes('Mon') && days.includes('Wed') && days.includes('Fri')) {
    return `Mon, Wed, Fri • ${safeTime}`;
  }
  if (count === 3 && days.includes('Tue') && days.includes('Thu') && days.includes('Sat')) {
    return `Tue, Thu, Sat • ${safeTime}`;
  }
  return `${days.join(', ')} • ${safeTime}`;
}

export default function BatchesScreen() {
  const router = useRouter();
  const { data: me } = useMe();
  const isAdmin = me?.role === 'admin' || me?.role === 'teacher';

  // Student hook data
  const { data: studentData, isLoading: isStudentLoading, refetch: refetchStudent, isRefetching: isStudentRefetching } = useStudentBatches();
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinModalCode, setJoinModalCode] = useState('');
  const [joinModalTab, setJoinModalTab] = useState<'code' | 'scanner'>('code');
  const [studentExploreClassFilter, setStudentExploreClassFilter] = useState<'all' | '9' | '10' | '11' | '12'>('all');

  // Admin store data
  const adminStore = useAdminStore();
  const [adminClassFilter, setAdminClassFilter] = useState<ClassFilterType>('all');
  const [adminSearchQuery, setAdminSearchQuery] = useState('');
  const [selectedViewIndex, setSelectedViewIndex] = useState(0); // 0 = Institute Batches, 1 = Student View
  const [refreshingAdmin, setRefreshingAdmin] = useState(false);
  const { onScroll: handleTabBarScroll, scrollEventThrottle } = useTabBarScroll();

  // Admin Batch Modals
  const [selectedBatchForConsole, setSelectedBatchForConsole] = useState<BatchItem | null>(null);
  const [consoleInitialTab, setConsoleInitialTab] = useState<BatchDetailTab>('overview');
  const [batchModalVisible, setBatchModalVisible] = useState(false);
  const [editingBatch, setEditingBatch] = useState<BatchItem | null>(null);

  // Init admin store on mount
  useEffect(() => {
    if (isAdmin) {
      adminStore.init();
    }
  }, [isAdmin]);

  const batches = studentData?.enrolled || [];
  const pendingRequests = studentData?.pendingRequests || [];

  // Cleanup downloads if student leaves a batch
  useEffect(() => {
    if (studentData?.enrolled) {
      const activeIds = studentData.enrolled.map((b) => b.id);
      void cleanupOrphanedBatchDownloads(activeIds);
    }
  }, [studentData?.enrolled]);

  // Filtered Institute Batches for Admin
  const filteredAdminBatches = useMemo(() => {
    return adminStore.batches.filter((b) => {
      const matchSearch =
        b.title.toLowerCase().includes(adminSearchQuery.toLowerCase()) ||
        b.subject.toLowerCase().includes(adminSearchQuery.toLowerCase()) ||
        b.faculty.toLowerCase().includes(adminSearchQuery.toLowerCase()) ||
        b.joinCode.toLowerCase().includes(adminSearchQuery.toLowerCase()) ||
        (b.room || '').toLowerCase().includes(adminSearchQuery.toLowerCase());
      const matchClass =
        adminClassFilter === 'all' || b.classLevel.toString() === adminClassFilter;
      return matchSearch && matchClass;
    });
  }, [adminStore.batches, adminSearchQuery, adminClassFilter]);

  // Explored Institute Batches for Students
  const exploreBatches = useMemo(() => {
    const list: Array<{
      id: string;
      title: string;
      subject: string;
      classLevel: number;
      board: string;
      mode: string;
      joinCode: string;
      faculty: string;
      room?: string;
      scheduleText: string;
    }> = [];

    const seenCodes = new Set<string>();

    // Add default institute batches
    DEFAULT_INSTITUTE_BATCHES.forEach((b) => {
      if (!seenCodes.has(b.joinCode)) {
        seenCodes.add(b.joinCode);
        list.push({
          id: b.id,
          title: b.title,
          subject: b.subjectName,
          classLevel: b.classLevel,
          board: b.board,
          mode: b.mode,
          joinCode: b.joinCode,
          faculty: b.teacherName,
          room: b.mode === 'online' ? 'Live Digital Classroom' : 'Quick2Learn Centre • Room 101',
          scheduleText:
            b.classLevel === 12
              ? 'Mon - Sat • 5:00 PM – 6:30 PM'
              : b.classLevel === 11
              ? 'Mon - Sat • 6:30 PM – 8:00 PM'
              : 'Mon, Wed, Fri • 4:00 PM – 5:30 PM',
        });
      }
    });

    // Add any custom batches from adminStore
    adminStore.batches.forEach((b) => {
      if (!seenCodes.has(b.joinCode)) {
        seenCodes.add(b.joinCode);
        list.push({
          id: b.id,
          title: b.title,
          subject: b.subject,
          classLevel: b.classLevel,
          board: b.board,
          mode: b.mode,
          joinCode: b.joinCode,
          faculty: b.faculty,
          room: b.room || 'Room 101',
          scheduleText: formatScheduleSummary(b.scheduleDays, b.scheduleTime),
        });
      }
    });

    return list;
  }, [adminStore.batches]);

  const filteredExploreBatches = useMemo(() => {
    if (studentExploreClassFilter === 'all') return exploreBatches;
    return exploreBatches.filter((b) => b.classLevel.toString() === studentExploreClassFilter);
  }, [exploreBatches, studentExploreClassFilter]);

  const handleRefresh = async () => {
    if (isAdmin) {
      setRefreshingAdmin(true);
      await Promise.all([adminStore.init(), refetchStudent()]);
      setRefreshingAdmin(false);
    } else {
      refetchStudent();
    }
  };

  const handleShareBatchCode = async (batch: BatchItem) => {
    try {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await Share.share({
        title: `Join ${batch.title} on Quick2Learn`,
        message: `Join ${batch.title} (${batch.subject}) by ${batch.faculty} at Quick2Learn!\n\nUse Batch Join Code: ${batch.joinCode}\nDownload App: https://quick2learn.in`,
      });
    } catch (err) {
      console.warn('Share error:', err);
    }
  };

  const handleCopyCode = (code: string) => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('Code Copied!', `Batch Join Code ${code} copied for student invitations.`);
  };

  const handleOpenConsole = (batch: BatchItem, tab: BatchDetailTab = 'overview') => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setConsoleInitialTab(tab);
    setSelectedBatchForConsole(batch);
  };

  return (
    <Screen
      scrollable={false}
      header={
        <AppHeader
          title="Batches"
          rightActions={
            isAdmin && selectedViewIndex === 0 ? (
              <TouchableOpacity
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setEditingBatch(null);
                  setBatchModalVisible(true);
                }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: '#2563EB',
                  borderRadius: radii.full,
                  paddingHorizontal: 12,
                  paddingVertical: 5,
                  minHeight: 32,
                  shadowColor: '#2563EB',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.2,
                  shadowRadius: 2,
                  elevation: 2,
                }}
                accessibilityLabel="Create New Batch"
              >
                <Plus size={14} color="#FFFFFF" />
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#FFFFFF', marginLeft: 4 }}>
                  New Batch
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setJoinModalCode('');
                  setJoinModalTab('code');
                  setShowJoinModal(true);
                }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: colors['primary-soft'],
                  borderWidth: 1,
                  borderColor: 'rgba(37, 99, 235, 0.2)',
                  borderRadius: radii.full,
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  minHeight: 32,
                }}
                accessibilityLabel="Join a Batch"
              >
                <Plus size={14} color={colors.primary} />
                <Text style={{ fontSize: 12, fontWeight: '700', color: colors.primary, marginLeft: 4 }}>
                  Join Batch
                </Text>
              </TouchableOpacity>
            )
          }
        />
      }
    >
      <View style={{ flex: 1, backgroundColor: colors['surface-subtle'] }}>
        {/* If Administrator, offer toggle between Institute Admin view & Student view */}
        {isAdmin && (
          <View
            style={{
              paddingHorizontal: 14,
              paddingTop: 8,
              paddingBottom: 4,
              backgroundColor: '#FFFFFF',
              borderBottomWidth: 1,
              borderBottomColor: '#E2E8F0',
            }}
          >
            <SegmentedControl
              options={[
                `Institute Batches (${adminStore.batches.length})`,
                `Student View (${batches.length})`,
              ]}
              selectedIndex={selectedViewIndex}
              onChange={setSelectedViewIndex}
            />
          </View>
        )}

        {/* ---------------- ADMIN VIEW (INSTITUTE BATCHES) ---------------- */}
        {isAdmin && selectedViewIndex === 0 ? (
          <ScrollView
            onScroll={handleTabBarScroll}
            scrollEventThrottle={scrollEventThrottle}
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: 12, paddingBottom: 130 }}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshingAdmin}
                onRefresh={handleRefresh}
                tintColor={colors.primary}
                colors={[colors.primary]}
              />
            }
          >
            {/* Search Bar */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: '#FFFFFF',
                borderRadius: radii.md,
                paddingHorizontal: 12,
                borderWidth: 1,
                borderColor: '#E2E8F0',
                height: 42,
                marginBottom: 10,
                elevation: 1,
                shadowColor: '#000000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.04,
                shadowRadius: 2,
              }}
            >
              <Search size={16} color="#94A3B8" />
              <TextInput
                value={adminSearchQuery}
                onChangeText={setAdminSearchQuery}
                placeholder="Search batch title, faculty, join code..."
                placeholderTextColor="#94A3B8"
                style={{ flex: 1, marginLeft: 8, fontSize: 13, color: '#0F172A' }}
              />
              {adminSearchQuery ? (
                <TouchableOpacity onPress={() => setAdminSearchQuery('')}>
                  <X size={15} color="#94A3B8" />
                </TouchableOpacity>
              ) : null}
            </View>

            {/* Class Filter Chips */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 6, paddingBottom: 10, paddingRight: 16 }}
            >
              <Chip
                label="All Classes"
                selected={adminClassFilter === 'all'}
                onPress={() => setAdminClassFilter('all')}
              />
              {(['9', '10', '11', '12'] as const).map((lvl) => (
                <Chip
                  key={lvl}
                  label={`Class ${lvl}`}
                  selected={adminClassFilter === lvl}
                  onPress={() => setAdminClassFilter(lvl)}
                />
              ))}
            </ScrollView>

            {/* Center Summary Header */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: '#EFF6FF',
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: radii.md,
                borderWidth: 1,
                borderColor: '#BFDBFE',
                marginBottom: 12,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <School size={15} color="#2563EB" />
                <Text style={{ fontSize: 12, fontWeight: '800', color: '#1E40AF' }}>
                  Active Batches
                </Text>
              </View>
              <Text style={{ fontSize: 11, fontWeight: '700', color: '#2563EB' }}>
                {filteredAdminBatches.length} Batches
              </Text>
            </View>

            {/* Empty State */}
            {filteredAdminBatches.length === 0 ? (
              <View style={{ backgroundColor: '#FFFFFF', borderRadius: radii.lg, padding: 20, borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center' }}>
                <EmptyState
                  imageSource={require('../../../assets/empty batch.png')}
                  imageSize={140}
                  title="No Batches Found"
                  description="No institute batches match your active search and class filter."
                  actionLabel="Create Batch"
                  onAction={() => {
                    setEditingBatch(null);
                    setBatchModalVisible(true);
                  }}
                />
              </View>
            ) : (
              /* Batch Cards List */
              filteredAdminBatches.map((batch) => {
                const liveClass = adminStore.liveClasses.find(
                  (l) => l.batchId === batch.id && l.isLive
                );
                return (
                  <View
                    key={batch.id}
                    style={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: 16,
                      borderWidth: 1,
                      borderColor: '#E2E8F0',
                      padding: 14,
                      marginBottom: 14,
                      elevation: 2,
                      shadowColor: '#1E293B',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.05,
                      shadowRadius: 6,
                      gap: 10,
                    }}
                  >
                    {/* Header Row: Badges, Status & Quick Edit */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap', flex: 1 }}>
                        <Badge label={`CLASS ${batch.classLevel}`} variant="primary" size="sm" />
                        <Badge label={batch.board.toUpperCase()} variant="neutral" size="sm" />
                        <Badge
                          label={batch.mode.toUpperCase()}
                          variant={batch.mode === 'online' ? 'primary' : batch.mode === 'hybrid' ? 'warning' : 'neutral'}
                          size="sm"
                        />
                        <Badge
                          label={batch.status.toUpperCase()}
                          variant={batch.status === 'ongoing' ? 'success' : 'neutral'}
                          size="sm"
                        />
                      </View>
                      <TouchableOpacity
                        activeOpacity={0.75}
                        onPress={() => {
                          setEditingBatch(batch);
                          setBatchModalVisible(true);
                        }}
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 8,
                          backgroundColor: '#F8FAFC',
                          borderWidth: 1,
                          borderColor: '#E2E8F0',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                        accessibilityLabel="Edit batch settings"
                      >
                        <Edit3 size={14} color="#64748B" />
                      </TouchableOpacity>
                    </View>

                    {/* Batch Title, Subject & Faculty */}
                    <View style={{ gap: 4 }}>
                      <Text
                        style={{
                          fontSize: 16,
                          fontWeight: '800',
                          color: '#0F172A',
                          letterSpacing: -0.2,
                          lineHeight: 22,
                        }}
                      >
                        {batch.title}
                      </Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <BookOpen size={13} color="#64748B" />
                        <Text
                          style={{ fontSize: 12, color: '#475569', fontWeight: '600', flexShrink: 1 }}
                          numberOfLines={1}
                        >
                          {batch.subject} • Class {batch.classLevel}
                        </Text>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        {getFacultyAvatarSource(batch.faculty) ? (
                          <Image
                            source={getFacultyAvatarSource(batch.faculty)!}
                            style={{ width: 18, height: 18, borderRadius: 9 }}
                            contentFit="cover"
                          />
                        ) : (
                          <UserCheck size={13} color="#2563EB" />
                        )}
                        <Text
                          style={{ fontSize: 12, color: '#475569', fontWeight: '500', flexShrink: 1 }}
                          numberOfLines={1}
                        >
                          Faculty: <Text style={{ fontWeight: '700', color: '#1E293B' }}>{batch.faculty}</Text>
                        </Text>
                      </View>
                    </View>

                    {/* Live Class banner if active */}
                    {liveClass && (
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => handleOpenConsole(batch, 'live')}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          backgroundColor: '#FEF2F2',
                          borderRadius: 10,
                          paddingHorizontal: 11,
                          paddingVertical: 7,
                          borderWidth: 1,
                          borderColor: '#FECACA',
                        }}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1, minWidth: 0, marginRight: 8 }}>
                          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444' }} />
                          <Text style={{ fontSize: 11.5, fontWeight: '800', color: '#DC2626' }} numberOfLines={1}>
                            LIVE NOW: {liveClass.title}
                          </Text>
                        </View>
                        <Text style={{ fontSize: 11, fontWeight: '800', color: '#EF4444', flexShrink: 0 }}>Join Room →</Text>
                      </TouchableOpacity>
                    )}

                    {/* Compact Enrolled & Fee Strip */}
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        backgroundColor: '#F8FAFC',
                        borderRadius: 10,
                        paddingHorizontal: 10,
                        paddingVertical: 7,
                        borderWidth: 1,
                        borderColor: '#F1F5F9',
                      }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Users size={13} color="#2563EB" />
                        <Text style={{ fontSize: 12, fontWeight: '700', color: '#1E293B' }}>
                          {batch.enrolledCount} / {batch.capacity} Enrolled
                        </Text>
                      </View>
                      <View
                        style={{
                          backgroundColor: '#ECFDF5',
                          paddingHorizontal: 8,
                          paddingVertical: 2.5,
                          borderRadius: 6,
                          borderWidth: 1,
                          borderColor: '#A7F3D0',
                        }}
                      >
                        <Text style={{ fontSize: 12.5, fontWeight: '900', color: '#047857' }}>
                          ₹{batch.fee.toLocaleString('en-IN')}
                        </Text>
                      </View>
                    </View>

                    {/* Action Buttons: Open Batch (Primary) & Attendance */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 2 }}>
                      <TouchableOpacity
                        activeOpacity={0.85}
                        onPress={() => handleOpenConsole(batch, 'overview')}
                        style={{
                          flex: 1.4,
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: '#2563EB',
                          height: 40,
                          paddingHorizontal: 14,
                          borderRadius: 10,
                          gap: 6,
                          elevation: 2,
                          shadowColor: '#2563EB',
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: 0.2,
                          shadowRadius: 3,
                        }}
                      >
                        <Text style={{ fontSize: 13, fontWeight: '800', color: '#FFFFFF' }} numberOfLines={1}>
                          Open Batch
                        </Text>
                        <ChevronRight size={15} color="#FFFFFF" />
                      </TouchableOpacity>

                      <TouchableOpacity
                        activeOpacity={0.75}
                        onPress={() => handleOpenConsole(batch, 'attendance')}
                        style={{
                          flex: 1,
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: '#EFF6FF',
                          borderWidth: 1.2,
                          borderColor: '#BFDBFE',
                          height: 40,
                          paddingHorizontal: 10,
                          borderRadius: 10,
                          gap: 5,
                        }}
                      >
                        <CheckCircle2 size={14} color="#2563EB" />
                        <Text style={{ fontSize: 12.5, fontWeight: '700', color: '#2563EB' }} numberOfLines={1}>
                          Attendance
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })
            )}
          </ScrollView>
        ) : (
          /* ---------------- STUDENT VIEW (ENROLLED BATCHES) ---------------- */
          <ScrollView
            onScroll={handleTabBarScroll}
            scrollEventThrottle={scrollEventThrottle}
            style={{ flex: 1 }}
            className="flex-1"
            contentContainerStyle={{ padding: 12, paddingBottom: 80 }}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isStudentRefetching}
                onRefresh={() => {
                  void refetchStudent();
                }}
                tintColor={colors.primary}
                colors={[colors.primary]}
              />
            }
          >
            {/* Loading State */}
            {isStudentLoading && !studentData && (
              <View style={{ paddingVertical: 48, alignItems: 'center', justifyContent: 'center' }}>
                <BookLoader text="Loading your batches..." size="lg" />
              </View>
            )}

            {/* Pending Requests Section */}
            {pendingRequests.length > 0 && (
              <View className="mb-6 space-y-2">
                <View className="flex-row items-center justify-between">
                  <Text className="text-caption font-bold text-ink-muted uppercase tracking-wider">
                    Pending Requests ({pendingRequests.length})
                  </Text>
                </View>

                {pendingRequests.map((req) => (
                  <TouchableOpacity
                    key={req.id}
                    activeOpacity={0.85}
                    onPress={() => router.push(`/batch/${req.batchId}` as any)}
                    className="bg-surface rounded-2xl border border-amber-200/80 p-4 shadow-2xs space-y-2"
                  >
                    <View className="flex-row items-center justify-between">
                      <Badge
                        label={
                          req.status === 'pending'
                            ? 'WAITING FOR APPROVAL'
                            : req.status.toUpperCase()
                        }
                        variant={req.status === 'pending' ? 'neutral' : 'danger'}
                        size="sm"
                      />
                      <Text className="text-[11px] font-semibold text-ink-muted">
                        Class {req.classLevel}
                      </Text>
                    </View>

                    <Text className="text-body font-bold text-ink">
                      {req.batchTitle}
                    </Text>

                    <Text className="text-caption text-ink-muted leading-relaxed">
                      {req.status === 'pending'
                        ? 'Your join request was submitted. Quick2Learn administration will approve your enrollment shortly.'
                        : req.note
                        ? `Reason: ${req.note}`
                        : 'Your request could not be approved. Please contact the centre office.'}
                    </Text>

                    <View className="flex-row items-center justify-between pt-1 border-t border-border/40">
                      <View className="flex-row items-center">
                        <Clock size={13} color="#9CA3AF" />
                        <Text className="text-[11px] text-ink-muted ml-1.5">
                          Requested on {new Date(req.requestedAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                          })}
                        </Text>
                      </View>
                      <Text className="text-[11px] font-bold text-primary">
                        View Status →
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Enrolled Batches Section */}
            {!isStudentLoading && batches.length > 0 && (
              <View style={{ marginBottom: 18 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <Text style={{ fontSize: 11.5, fontWeight: '800', color: '#1E293B', textTransform: 'uppercase', letterSpacing: 0.6 }}>
                    My Enrolled Batches ({batches.length})
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setJoinModalCode('');
                      setJoinModalTab('code');
                      setShowJoinModal(true);
                    }}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
                  >
                    <Plus size={14} color="#2563EB" />
                    <Text style={{ fontSize: 12, fontWeight: '700', color: '#2563EB' }}>
                      Add Another
                    </Text>
                  </TouchableOpacity>
                </View>

                {batches.map((batch) => (
                  <BatchCard
                    key={batch.id}
                    batch={batch}
                    onPress={() => router.push(`/batch/${batch.id}`)}
                  />
                ))}
              </View>
            )}

            {/* If NO enrolled batches & NO pending requests: Hero Join Card */}
            {!isStudentLoading && batches.length === 0 && pendingRequests.length === 0 && (
              <View
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: 22,
                  borderWidth: 1.5,
                  borderColor: '#DBEAFE',
                  padding: 18,
                  marginBottom: 18,
                  shadowColor: '#2563EB',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.08,
                  shadowRadius: 14,
                  elevation: 3,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <View
                    style={{
                      width: 50,
                      height: 50,
                      borderRadius: 15,
                      backgroundColor: '#EFF6FF',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderWidth: 1.5,
                      borderColor: '#BFDBFE',
                    }}
                  >
                    <GraduationCap size={26} color="#2563EB" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={{ fontSize: 17, fontWeight: '800', color: '#0F172A', letterSpacing: -0.2 }}>
                        Join Your First Batch
                      </Text>
                      <View
                        style={{
                          backgroundColor: '#EFF6FF',
                          paddingHorizontal: 7,
                          paddingVertical: 2,
                          borderRadius: 6,
                          borderWidth: 1,
                          borderColor: '#BFDBFE',
                        }}
                      >
                        <Text style={{ fontSize: 10, fontWeight: '800', color: '#2563EB' }}>
                          2026–27
                        </Text>
                      </View>
                    </View>
                    <Text style={{ fontSize: 12, color: '#64748B', marginTop: 1 }}>
                      Quick2Learn Classroom Portal
                    </Text>
                  </View>
                </View>

                <Text style={{ fontSize: 13, color: '#475569', lineHeight: 19, marginBottom: 16 }}>
                  Access your daily timetable, live lectures, curated chapter notes, and board-pattern test series.
                </Text>

                {/* Primary Action Buttons */}
                <View style={{ flexDirection: 'row', gap: 10, marginBottom: 14 }}>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => {
                      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      setJoinModalCode('');
                      setJoinModalTab('code');
                      setShowJoinModal(true);
                    }}
                    style={{
                      flex: 1,
                      backgroundColor: '#2563EB',
                      borderRadius: 12,
                      paddingVertical: 12,
                      paddingHorizontal: 10,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 7,
                      shadowColor: '#2563EB',
                      shadowOffset: { width: 0, height: 3 },
                      shadowOpacity: 0.2,
                      shadowRadius: 6,
                      elevation: 2,
                    }}
                  >
                    <KeyRound size={16} color="#FFFFFF" />
                    <Text style={{ fontSize: 13, fontWeight: '700', color: '#FFFFFF' }}>
                      Enter Batch Code
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => {
                      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      setJoinModalCode('');
                      setJoinModalTab('scanner');
                      setShowJoinModal(true);
                    }}
                    style={{
                      flex: 1,
                      backgroundColor: '#EFF6FF',
                      borderWidth: 1.5,
                      borderColor: '#BFDBFE',
                      borderRadius: 12,
                      paddingVertical: 12,
                      paddingHorizontal: 10,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 7,
                    }}
                  >
                    <QrCode size={16} color="#2563EB" />
                    <Text style={{ fontSize: 13, fontWeight: '700', color: '#2563EB' }}>
                      Scan QR Code
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Quick Join Chips */}
                <View
                  style={{
                    backgroundColor: '#F8FAFC',
                    borderRadius: 12,
                    padding: 11,
                    borderWidth: 1,
                    borderColor: '#E2E8F0',
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                      <Sparkles size={13} color="#2563EB" />
                      <Text style={{ fontSize: 11.5, fontWeight: '700', color: '#334155' }}>
                        Quick Select by Class:
                      </Text>
                    </View>
                    <Text style={{ fontSize: 10, fontWeight: '600', color: '#64748B' }}>
                      Tap to autofill
                    </Text>
                  </View>

                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                    {[
                      { code: 'Q2L012', label: 'Class 12 Maths' },
                      { code: 'Q2L011', label: 'Class 11 Maths' },
                      { code: 'Q2L010', label: 'Class 10 Science' },
                      { code: 'Q2L009', label: 'Class 10 Maths' },
                    ].map((item) => (
                      <TouchableOpacity
                        key={item.code}
                        activeOpacity={0.7}
                        onPress={() => {
                          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                          setJoinModalCode(item.code);
                          setJoinModalTab('code');
                          setShowJoinModal(true);
                        }}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          backgroundColor: '#FFFFFF',
                          borderWidth: 1,
                          borderColor: '#CBD5E1',
                          borderRadius: 8,
                          paddingHorizontal: 8,
                          paddingVertical: 4.5,
                          gap: 4,
                        }}
                      >
                        <Text style={{ fontSize: 11, fontWeight: '800', color: '#2563EB' }}>
                          {item.code}
                        </Text>
                        <Text style={{ fontSize: 11, color: '#475569', fontWeight: '500' }}>
                          {item.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>
            )}

            {/* "What Unlocks Inside Your Batch" (Grid of 4) */}
            <View style={{ marginBottom: 20 }}>
              <Text style={{ fontSize: 14, fontWeight: '800', color: '#0F172A', letterSpacing: -0.2, marginBottom: 2 }}>
                What Unlocks Inside Your Batch
              </Text>
              <Text style={{ fontSize: 11.5, color: '#64748B', marginBottom: 10 }}>
                Essential academic features enabled for classroom students
              </Text>

              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 9 }}>
                {[
                  {
                    icon: Video,
                    color: '#2563EB',
                    bgColor: '#EFF6FF',
                    borderColor: '#BFDBFE',
                    title: 'Live Lectures & Doubts',
                    desc: 'Interactive live sessions with Dinesh Sir & instant doubt resolution',
                  },
                  {
                    icon: BookOpen,
                    color: '#059669',
                    bgColor: '#ECFDF5',
                    borderColor: '#A7F3D0',
                    title: 'Digital Notes & DPPs',
                    desc: 'Hand-crafted chapter PDFs, formula sheets & homework banks',
                  },
                  {
                    icon: CheckCircle2,
                    color: '#7C3AED',
                    bgColor: '#F5F3FF',
                    borderColor: '#DDD6FE',
                    title: 'Mock Tests & Ranks',
                    desc: 'Timed board mock exams with detailed scorecards & rank',
                  },
                  {
                    icon: Clock,
                    color: '#D97706',
                    bgColor: '#FFFBEB',
                    borderColor: '#FDE68A',
                    title: 'Timetable & Attendance',
                    desc: 'Real-time lecture schedule, room updates & attendance log',
                  },
                ].map((feature, idx) => {
                  const IconComp = feature.icon;
                  return (
                    <View
                      key={idx}
                      style={{
                        width: '48%',
                        flexGrow: 1,
                        backgroundColor: '#FFFFFF',
                        borderRadius: 14,
                        borderWidth: 1,
                        borderColor: '#E2E8F0',
                        padding: 12,
                        shadowColor: '#000000',
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.02,
                        shadowRadius: 3,
                        elevation: 1,
                      }}
                    >
                      <View
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 10,
                          backgroundColor: feature.bgColor,
                          borderWidth: 1,
                          borderColor: feature.borderColor,
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginBottom: 8,
                        }}
                      >
                        <IconComp size={17} color={feature.color} />
                      </View>
                      <Text style={{ fontSize: 12.5, fontWeight: '700', color: '#0F172A', marginBottom: 2 }}>
                        {feature.title}
                      </Text>
                      <Text style={{ fontSize: 11, color: '#64748B', lineHeight: 15 }}>
                        {feature.desc}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* "Explore Institute Batches (2026–27)" */}
            <View style={{ marginBottom: 20 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={{ fontSize: 14, fontWeight: '800', color: '#0F172A', letterSpacing: -0.2 }}>
                    Explore Institute Batches
                  </Text>
                  <View
                    style={{
                      backgroundColor: '#EFF6FF',
                      paddingHorizontal: 6,
                      paddingVertical: 1.5,
                      borderRadius: 6,
                      borderWidth: 1,
                      borderColor: '#BFDBFE',
                    }}
                  >
                    <Text style={{ fontSize: 9.5, fontWeight: '800', color: '#2563EB' }}>
                      2026–27
                    </Text>
                  </View>
                </View>
              </View>
              <Text style={{ fontSize: 11.5, color: '#64748B', marginBottom: 8 }}>
                Official Quick2Learn offline & hybrid batches for CBSE / ICSE
              </Text>

              {/* Class Filter Chips */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 6, paddingBottom: 10 }}
              >
                <Chip
                  label="All Classes"
                  selected={studentExploreClassFilter === 'all'}
                  onPress={() => setStudentExploreClassFilter('all')}
                />
                {(['12', '11', '10', '9'] as const).map((lvl) => (
                  <Chip
                    key={lvl}
                    label={`Class ${lvl}`}
                    selected={studentExploreClassFilter === lvl}
                    onPress={() => setStudentExploreClassFilter(lvl)}
                  />
                ))}
              </ScrollView>

              {/* Explored Batches Cards */}
              <View style={{ gap: 9 }}>
                {filteredExploreBatches.map((b) => {
                  const avatarSource = getFacultyAvatarSource(b.faculty);
                  return (
                    <View
                      key={b.id}
                      style={{
                        backgroundColor: '#FFFFFF',
                        borderRadius: 16,
                        borderWidth: 1,
                        borderColor: '#E2E8F0',
                        padding: 13,
                        shadowColor: '#000000',
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.03,
                        shadowRadius: 3,
                        elevation: 1,
                      }}
                    >
                      {/* Top Badges */}
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                          <Badge label={`Class ${b.classLevel}`} variant="neutral" size="sm" />
                          <Badge label={b.board.toUpperCase()} variant="neutral" size="sm" />
                        </View>
                        <Badge
                          label={b.mode.toUpperCase()}
                          variant={b.mode === 'online' ? 'primary' : b.mode === 'hybrid' ? 'warning' : 'neutral'}
                          size="sm"
                        />
                      </View>

                      {/* Title */}
                      <Text style={{ fontSize: 13.5, fontWeight: '800', color: '#0F172A', lineHeight: 18, marginBottom: 7 }}>
                        {b.title}
                      </Text>

                      {/* Faculty info */}
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 8,
                          backgroundColor: '#F8FAFC',
                          borderRadius: 10,
                          padding: 8,
                          marginBottom: 8,
                          borderWidth: 1,
                          borderColor: '#F1F5F9',
                        }}
                      >
                        {avatarSource ? (
                          <Image
                            source={avatarSource}
                            style={{ width: 32, height: 32, borderRadius: 16, borderWidth: 1, borderColor: '#CBD5E1' }}
                            contentFit="cover"
                          />
                        ) : (
                          <View
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: 16,
                              backgroundColor: '#EFF6FF',
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderWidth: 1,
                              borderColor: '#BFDBFE',
                            }}
                          >
                            <Users size={15} color="#2563EB" />
                          </View>
                        )}
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 12, fontWeight: '700', color: '#1E293B' }}>
                            {b.faculty}
                          </Text>
                          <Text style={{ fontSize: 10.5, color: '#64748B' }}>
                            {b.subject} • Senior Faculty
                          </Text>
                        </View>
                      </View>

                      {/* Schedule info */}
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 10 }}>
                        <Clock size={12} color="#64748B" />
                        <Text style={{ fontSize: 11, color: '#475569', fontWeight: '500' }}>
                          {b.scheduleText}
                        </Text>
                      </View>

                      {/* Bottom row: Join Code & Join CTA */}
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          paddingTop: 8,
                          borderTopWidth: 1,
                          borderTopColor: '#F1F5F9',
                        }}
                      >
                        <TouchableOpacity
                          activeOpacity={0.7}
                          onPress={() => {
                            void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                            setJoinModalCode(b.joinCode);
                            setJoinModalTab('code');
                            setShowJoinModal(true);
                          }}
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            backgroundColor: '#EFF6FF',
                            borderRadius: 7,
                            paddingHorizontal: 8,
                            paddingVertical: 4,
                            gap: 4,
                            borderWidth: 1,
                            borderColor: '#BFDBFE',
                          }}
                        >
                          <KeyRound size={11} color="#2563EB" />
                          <Text style={{ fontSize: 11, fontWeight: '800', color: '#2563EB' }}>
                            Code: {b.joinCode}
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          activeOpacity={0.8}
                          onPress={() => {
                            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                            setJoinModalCode(b.joinCode);
                            setJoinModalTab('code');
                            setShowJoinModal(true);
                          }}
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            backgroundColor: '#2563EB',
                            borderRadius: 9,
                            paddingHorizontal: 12,
                            paddingVertical: 6,
                            gap: 4,
                          }}
                        >
                          <Text style={{ fontSize: 11.5, fontWeight: '700', color: '#FFFFFF' }}>
                            Join Batch
                          </Text>
                          <ChevronRight size={13} color="#FFFFFF" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* "How to Find Your Batch Code" Guide */}
            <View
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 16,
                borderWidth: 1,
                borderColor: '#E2E8F0',
                padding: 14,
                marginBottom: 16,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 10 }}>
                <HelpCircle size={16} color="#2563EB" />
                <Text style={{ fontSize: 13, fontWeight: '800', color: '#0F172A' }}>
                  Where to Find Your Batch Code?
                </Text>
              </View>

              <View style={{ gap: 8 }}>
                {[
                  {
                    num: '1',
                    title: 'Admission Fee Receipt',
                    desc: 'Check your official receipt provided by Quick2Learn centre desk.',
                  },
                  {
                    num: '2',
                    title: 'Classroom Notice Board',
                    desc: 'Batch codes and timetables are posted outside each lecture room.',
                  },
                  {
                    num: '3',
                    title: 'WhatsApp Batch Broadcast',
                    desc: 'Your faculty or batch coordinator will post the join code in the group.',
                  },
                ].map((step) => (
                  <View key={step.num} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
                    <View
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: 10,
                        backgroundColor: '#EFF6FF',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderWidth: 1,
                        borderColor: '#BFDBFE',
                        marginTop: 1,
                      }}
                    >
                      <Text style={{ fontSize: 10.5, fontWeight: '800', color: '#2563EB' }}>
                        {step.num}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 12, fontWeight: '700', color: '#1E293B' }}>
                        {step.title}
                      </Text>
                      <Text style={{ fontSize: 11, color: '#64748B', lineHeight: 14.5 }}>
                        {step.desc}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>

            {/* Faculty WhatsApp Support Card */}
            <View
              style={{
                backgroundColor: '#F0FDF4',
                borderRadius: 16,
                borderWidth: 1.5,
                borderColor: '#BBF7D0',
                padding: 14,
                marginBottom: 20,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 6 }}>
                <View
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 10,
                    backgroundColor: '#DCFCE7',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 1,
                    borderColor: '#86EFAC',
                  }}
                >
                  <MessageCircle size={17} color="#16A34A" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: '800', color: '#14532D' }}>
                    Don't Have Your Batch Code?
                  </Text>
                  <Text style={{ fontSize: 11, color: '#15803D' }}>
                    Contact Dinesh Sir directly on WhatsApp
                  </Text>
                </View>
              </View>

              <Text style={{ fontSize: 11.5, color: '#166534', lineHeight: 16, marginBottom: 10 }}>
                Send your student name and class level. The Quick2Learn administration team will verify and send your batch join code immediately.
              </Text>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  Linking.openURL(
                    'https://wa.me/919412278775?text=Hello%20Dinesh%20Sir%2C%20I%20am%20a%20student%20at%20Quick2Learn%20and%20need%20my%20batch%20join%20code.'
                  ).catch(() => {
                    Alert.alert('Quick2Learn Support', 'Please contact Dinesh Sir at +91 94122 78775.');
                  });
                }}
                style={{
                  backgroundColor: '#16A34A',
                  borderRadius: 10,
                  paddingVertical: 9,
                  paddingHorizontal: 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 7,
                }}
              >
                <MessageCircle size={15} color="#FFFFFF" />
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#FFFFFF' }}>
                  Chat with Dinesh Sir (+91 94122 78775)
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}
      </View>

      {/* ---------------- MODALS ---------------- */}

      {/* Student: Join Batch Modal */}
      <JoinBatchModal
        visible={showJoinModal}
        initialCode={joinModalCode}
        initialTab={joinModalTab}
        onClose={() => {
          setShowJoinModal(false);
          setJoinModalCode('');
          setJoinModalTab('code');
        }}
        onSuccess={() => {
          refetchStudent();
        }}
      />

      {/* Admin: Batch Command Center (Classplus 8 Tabs Modal) */}
      <BatchDetailAdminModal
        visible={!!selectedBatchForConsole}
        batch={selectedBatchForConsole}
        initialTab={consoleInitialTab}
        onClose={() => setSelectedBatchForConsole(null)}
        onEditBatch={(b) => {
          setSelectedBatchForConsole(null);
          setEditingBatch(b);
          setBatchModalVisible(true);
        }}
        onToast={(t) => {
          Alert.alert(t.type === 'error' ? 'Notice' : 'Success', t.message);
        }}
      />

      {/* Admin: Create / Edit Batch Modal */}
      <BatchFormModal
        visible={batchModalVisible}
        batch={editingBatch}
        onClose={() => setBatchModalVisible(false)}
        onSave={async (batchData) => {
          if (editingBatch) {
            await adminStore.updateBatch(editingBatch.id, batchData);
            Alert.alert('Success', 'Batch updated successfully!');
          } else {
            await adminStore.createBatch(batchData as any);
            Alert.alert('Success', 'New batch published!');
          }
          setBatchModalVisible(false);
        }}
        onDelete={async (id) => {
          await adminStore.deleteBatch(id);
          Alert.alert('Removed', 'Batch removed from center.');
          setBatchModalVisible(false);
        }}
      />
    </Screen>
  );
}
