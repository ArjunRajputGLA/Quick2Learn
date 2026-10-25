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
import { useMe, useStudentBatches } from '../../../src/api/hooks';
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
                onPress={() => setShowJoinModal(true)}
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
                  <View
                    key={req.id}
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

                    <View className="flex-row items-center pt-1 border-t border-border/40">
                      <Clock size={13} color="#9CA3AF" />
                      <Text className="text-[11px] text-ink-muted ml-1.5">
                        Requested on {new Date(req.requestedAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Enrolled Batches Section */}
            {!isStudentLoading && batches.length > 0 && (
              <View style={{ marginBottom: 14 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: colors['ink-muted'], textTransform: 'uppercase', letterSpacing: 0.6 }}>
                    My Enrolled Batches ({batches.length})
                  </Text>
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

            {/* Empty State when no enrolled batches & no pending requests */}
            {!isStudentLoading && batches.length === 0 && pendingRequests.length === 0 && (
              <View className="bg-surface rounded-2xl p-4 border border-border items-center shadow-2xs mt-2">
                <View className="w-12 h-12 rounded-xl bg-primary-soft items-center justify-center mb-3 border border-primary/20">
                  <GraduationCap size={24} color="#2563EB" />
                </View>
                <Text className="text-body font-bold text-ink text-center mb-1">
                  Join Your First Batch
                </Text>
                <Text className="text-caption text-ink-muted text-center mb-4 leading-relaxed max-w-xs">
                  Access your timetable, live lectures, notes, test series, and teacher announcements.
                </Text>

                <View className="w-full space-y-2">
                  <Button
                    variant="primary"
                    size="md"
                    onPress={() => setShowJoinModal(true)}
                    icon={<KeyRound size={16} color="#FFFFFF" />}
                  >
                    Enter Batch Join Code
                  </Button>

                  <Button
                    variant="outline"
                    size="md"
                    onPress={() => setShowJoinModal(true)}
                    icon={<QrCode size={16} color="#2563EB" />}
                  >
                    Scan Classroom QR Code
                  </Button>
                </View>
              </View>
            )}
          </ScrollView>
        )}
      </View>

      {/* ---------------- MODALS ---------------- */}

      {/* Student: Join Batch Modal */}
      <JoinBatchModal
        visible={showJoinModal}
        onClose={() => setShowJoinModal(false)}
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
