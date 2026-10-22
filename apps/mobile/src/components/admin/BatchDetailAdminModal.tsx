import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  Share,
  Linking,
  Platform,
  KeyboardAvoidingView,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import {
  X,
  ArrowLeft,
  Calendar,
  Clock,
  School,
  Users,
  Copy,
  Share2,
  Video,
  FileText,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Play,
  Download,
  Plus,
  Edit3,
  Trash2,
  ExternalLink,
  Phone,
  MessageCircle,
  Award,
  Check,
  Sparkles,
  Search,
  ChevronRight,
  Folder,
  Radio,
  Send,
  BookOpen,
  FileUp,
  Layers,
} from 'lucide-react-native';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { EmptyState } from '../ui/EmptyState';
import { colors, radii } from '@quick2learn/shared';
import {
  useAdminStore,
  type BatchItem,
  type AdminLectureItem,
  type AdminResourceItem,
  type AdminAssignmentItem,
  type AdminLiveClassItem,
  type AdminTestItem,
  type AdminStudentItem,
  type AdminAnnouncementItem,
} from '../../lib/adminDataStore';

export type BatchDetailTab =
  | 'overview'
  | 'videos'
  | 'materials'
  | 'assignments'
  | 'announcements'
  | 'tests'
  | 'live'
  | 'attendance'
  | 'students';

interface BatchDetailAdminModalProps {
  visible: boolean;
  batch: BatchItem | null;
  onClose: () => void;
  onEditBatch: (batch: BatchItem) => void;
  initialTab?: BatchDetailTab;
  onToast: (toast: { type: 'success' | 'error' | 'info'; message: string }) => void;
}

export function BatchDetailAdminModal({
  visible,
  batch,
  initialTab = 'overview',
  onClose,
  onEditBatch,
  onToast,
}: BatchDetailAdminModalProps) {
  const insets = useSafeAreaInsets();
  const headerPaddingTop = Math.max(
    insets.top,
    Platform.OS === 'android' ? (StatusBar.currentHeight || 28) : 20
  ) + 8;
  const store = useAdminStore();
  const [activeTab, setActiveTab] = useState<BatchDetailTab>(initialTab);

  React.useEffect(() => {
    if (visible && initialTab) {
      setActiveTab(initialTab);
    }
  }, [visible, initialTab]);

  // Video folder navigation
  const [selectedVideoChapter, setSelectedVideoChapter] = useState<string | null>(null);
  // Material folder navigation
  const [selectedMaterialFolder, setSelectedMaterialFolder] = useState<string | null>(null);

  // Attendance state for active date
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [attendanceDate, setAttendanceDate] = useState<string>(todayStr);
  const [dailyAttendance, setDailyAttendance] = useState<Record<string, 'P' | 'A' | 'L'>>({});

  // Sub-modals inside Batch Command Center
  const [addLectureModalVisible, setAddLectureModalVisible] = useState(false);
  const [addResourceModalVisible, setAddResourceModalVisible] = useState(false);
  const [addAssignmentModalVisible, setAddAssignmentModalVisible] = useState(false);
  const [scheduleLiveModalVisible, setScheduleLiveModalVisible] = useState(false);
  const [addAnnouncementModalVisible, setAddAnnouncementModalVisible] = useState(false);
  const [addStudentModalVisible, setAddStudentModalVisible] = useState(false);
  const [submissionsModalVisible, setSubmissionsModalVisible] = useState(false);
  const [selectedAssignmentForReview, setSelectedAssignmentForReview] = useState<AdminAssignmentItem | null>(null);

  // Student search
  const [studentSearch, setStudentSearch] = useState('');

  // Filter batch specific data safely without conditional hooks
  const batchLectures = useMemo(() => {
    if (!batch) return [];
    return store.lectures.filter(
      (l) => l.batchId === batch.id || (l.subject.toLowerCase() === batch.subject.toLowerCase() && l.classLevel === batch.classLevel)
    );
  }, [store.lectures, batch]);

  const batchResources = useMemo(() => {
    if (!batch) return [];
    return store.resources.filter(
      (r) => r.batchId === batch.id || r.batchTitle === batch.title || (r.subject.toLowerCase() === batch.subject.toLowerCase() && r.classLevel === batch.classLevel)
    );
  }, [store.resources, batch]);

  const batchAssignments = useMemo(() => {
    if (!batch) return [];
    return store.assignments.filter(
      (a) => a.batchId === batch.id || a.batchTitle === batch.title
    );
  }, [store.assignments, batch]);

  const batchLiveClasses = useMemo(() => {
    if (!batch) return [];
    return store.liveClasses.filter(
      (l) => l.batchId === batch.id || l.batchTitle === batch.title
    );
  }, [store.liveClasses, batch]);

  const activeLiveClass = useMemo(() => {
    return batchLiveClasses.find((l) => l.isLive);
  }, [batchLiveClasses]);

  const batchTests = useMemo(() => {
    if (!batch) return [];
    return store.tests.filter(
      (t) => t.subject.toLowerCase() === batch.subject.toLowerCase() && t.classLevel === batch.classLevel
    );
  }, [store.tests, batch]);

  const batchAnnouncements = useMemo(() => {
    if (!batch) return [];
    return store.announcements.filter(
      (a) => a.targetAudience.includes(batch.title) || a.targetAudience.includes('All Batches')
    );
  }, [store.announcements, batch]);

  const batchStudents = useMemo(() => {
    if (!batch) return [];
    return store.students.filter(
      (s) => s.enrolledBatchIds.includes(batch.id) || s.enrolledBatchNames.includes(batch.title)
    );
  }, [store.students, batch]);

  // Load attendance record whenever date or batch changes
  const currentAttendanceRecord = useMemo(() => {
    if (!batch) return undefined;
    return store.attendanceRecords.find(
      (r) => r.batchId === batch.id && r.date === attendanceDate
    );
  }, [store.attendanceRecords, batch, attendanceDate]);

  // Sync attendance record when record loads
  React.useEffect(() => {
    if (!batch) return;
    if (currentAttendanceRecord) {
      setDailyAttendance(currentAttendanceRecord.records);
    } else {
      // Default: set all enrolled students as 'P'
      const initial: Record<string, 'P' | 'A' | 'L'> = {};
      batchStudents.forEach((s) => {
        initial[s.id] = 'P';
      });
      setDailyAttendance(initial);
    }
  }, [batch?.id, attendanceDate, currentAttendanceRecord?.savedAt, batchStudents.length]);

  // Video chapters grouping
  const videoChapters = useMemo(() => {
    return Array.from(new Set(batchLectures.map((l) => l.chapter)));
  }, [batchLectures]);

  const filteredLectures = useMemo(() => {
    if (!selectedVideoChapter) return batchLectures;
    return batchLectures.filter((l) => l.chapter === selectedVideoChapter);
  }, [batchLectures, selectedVideoChapter]);

  // Material folders grouping
  const materialFolders = useMemo(() => {
    return Array.from(
      new Set(batchResources.map((r) => r.folderName || r.chapter || 'Class Study Material'))
    );
  }, [batchResources]);

  const filteredResources = useMemo(() => {
    if (!selectedMaterialFolder) return batchResources;
    return batchResources.filter(
      (r) => (r.folderName || r.chapter || 'Class Study Material') === selectedMaterialFolder
    );
  }, [batchResources, selectedMaterialFolder]);

  // Handle Save Attendance
  const handleSaveAttendance = async () => {
    if (!batch) return;
    try {
      await store.saveBatchAttendance(batch.id, attendanceDate, dailyAttendance);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onToast({
        type: 'success',
        message: `Attendance saved for ${attendanceDate} (${Object.values(dailyAttendance).filter((v) => v === 'P').length} Present).`,
      });
    } catch {
      onToast({ type: 'error', message: 'Failed to save attendance.' });
    }
  };

  if (!batch || !visible) return null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
        {/* HEADER BAR WITH SAFE AREA AWARENESS */}
        <View
          style={{
            backgroundColor: '#FFFFFF',
            borderBottomWidth: 1,
            borderBottomColor: '#E2E8F0',
            paddingTop: headerPaddingTop,
            paddingBottom: 10,
            paddingHorizontal: 16,
            elevation: 2,
            shadowColor: '#000000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 3,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onClose}
              style={{
                width: 38,
                height: 38,
                borderRadius: 19,
                backgroundColor: '#F8FAFC',
                borderWidth: 1,
                borderColor: '#E2E8F0',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              accessibilityLabel="Back to batches"
            >
              <ArrowLeft size={18} color="#0F172A" />
            </TouchableOpacity>

            <View style={{ flex: 1, marginHorizontal: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={{ fontSize: 16, fontWeight: '800', color: '#0F172A', flexShrink: 1 }} numberOfLines={1}>
                  {batch.title}
                </Text>
              </View>
              <Text style={{ fontSize: 11.5, color: '#64748B', fontWeight: '500', marginTop: 1 }} numberOfLines={1}>
                {batch.subject} • {batch.faculty} • Class {batch.classLevel} ({batch.board.toUpperCase()})
              </Text>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => onEditBatch(batch)}
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 19,
                  backgroundColor: '#EFF6FF',
                  borderWidth: 1,
                  borderColor: '#BFDBFE',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                accessibilityLabel="Edit batch settings"
              >
                <Edit3 size={17} color="#2563EB" />
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={onClose}
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 19,
                  backgroundColor: '#F8FAFC',
                  borderWidth: 1,
                  borderColor: '#E2E8F0',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                accessibilityLabel="Close batch console"
              >
                <X size={18} color="#64748B" />
              </TouchableOpacity>
            </View>
          </View>

          {/* SUB-TABS ROW (Classplus 8 Tabs) */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8, paddingTop: 12, paddingBottom: 4, paddingHorizontal: 2 }}
          >
            <SubTabPill
              label="Overview"
              isActive={activeTab === 'overview'}
              onPress={() => setActiveTab('overview')}
            />
            <SubTabPill
              label="Videos"
              badge={batchLectures.length}
              isActive={activeTab === 'videos'}
              onPress={() => setActiveTab('videos')}
            />
            <SubTabPill
              label="Study Material"
              badge={batchResources.length}
              isActive={activeTab === 'materials'}
              onPress={() => setActiveTab('materials')}
            />
            <SubTabPill
              label="Assignments"
              badge={batchAssignments.length}
              isActive={activeTab === 'assignments'}
              onPress={() => setActiveTab('assignments')}
            />
            <SubTabPill
              label="Announcements"
              badge={batchAnnouncements.length}
              isActive={activeTab === 'announcements'}
              onPress={() => setActiveTab('announcements')}
            />
            <SubTabPill
              label="Tests"
              badge={batchTests.length}
              isActive={activeTab === 'tests'}
              onPress={() => setActiveTab('tests')}
            />
            <SubTabPill
              label="Live Classes"
              badge={activeLiveClass ? 'LIVE' : batchLiveClasses.length}
              isActive={activeTab === 'live'}
              onPress={() => setActiveTab('live')}
            />
            <SubTabPill
              label="Attendance"
              isActive={activeTab === 'attendance'}
              onPress={() => setActiveTab('attendance')}
            />
            <SubTabPill
              label="Students"
              badge={batchStudents.length}
              isActive={activeTab === 'students'}
              onPress={() => setActiveTab('students')}
            />
          </ScrollView>
        </View>

        {/* TAB CONTENTS */}
        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            padding: 14,
            paddingBottom: Math.max(insets.bottom, 24) + 40,
          }}
        >
          {/* 1. OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <View style={{ gap: 14 }}>
              {/* LIVE CLASS BANNER (Matching Classplus "Join your live class now") */}
              {activeLiveClass ? (
                <View
                  style={{
                    backgroundColor: '#FFF1F2',
                    borderRadius: 18,
                    padding: 16,
                    borderWidth: 1.5,
                    borderColor: '#FECDD3',
                    gap: 10,
                    elevation: 2,
                    shadowColor: '#E11D48',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 6,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
                      <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#E11D48' }} />
                      <Text style={{ fontSize: 12, fontWeight: '900', color: '#9F1239', letterSpacing: 0.8 }}>
                        LIVE CLASS IN PROGRESS
                      </Text>
                    </View>
                    <View
                      style={{
                        backgroundColor: '#FFE4E6',
                        paddingHorizontal: 8,
                        paddingVertical: 3,
                        borderRadius: 12,
                        borderWidth: 1,
                        borderColor: '#FDA4AF',
                      }}
                    >
                      <Text style={{ fontSize: 10.5, fontWeight: '800', color: '#BE123C' }}>
                        {activeLiveClass.platform.toUpperCase()}
                      </Text>
                    </View>
                  </View>

                  <Text style={{ fontSize: 16, fontWeight: '800', color: '#881337', lineHeight: 22 }}>
                    {activeLiveClass.title}
                  </Text>

                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Clock size={13} color="#9F1239" />
                    <Text style={{ fontSize: 12, color: '#9F1239', fontWeight: '600' }}>
                      Faculty: {activeLiveClass.faculty} • {activeLiveClass.duration} Session
                    </Text>
                  </View>

                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => {
                        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        Linking.openURL(activeLiveClass.meetingUrl);
                      }}
                      style={{
                        flex: 1,
                        backgroundColor: '#E11D48',
                        paddingVertical: 11,
                        borderRadius: 12,
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexDirection: 'row',
                        gap: 6,
                        elevation: 2,
                        shadowColor: '#E11D48',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.25,
                        shadowRadius: 4,
                      }}
                    >
                      <Radio size={16} color="#FFFFFF" />
                      <Text style={{ fontSize: 13.5, fontWeight: '800', color: '#FFFFFF' }}>Join Live Room Now</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => {
                        Alert.alert('End Live Class', 'Mark this live session as completed?', [
                          { text: 'Cancel', style: 'cancel' },
                          {
                            text: 'End Session',
                            style: 'destructive',
                            onPress: async () => {
                              await store.toggleLiveClassState(activeLiveClass.id);
                              onToast({ type: 'info', message: 'Live class session ended.' });
                            },
                          },
                        ]);
                      }}
                      style={{
                        backgroundColor: '#FFFFFF',
                        borderWidth: 1,
                        borderColor: '#FECDD3',
                        paddingHorizontal: 14,
                        paddingVertical: 11,
                        borderRadius: 12,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Text style={{ fontSize: 12.5, fontWeight: '700', color: '#9F1239' }}>End</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setScheduleLiveModalVisible(true)}
                  style={{
                    backgroundColor: '#EFF6FF',
                    borderRadius: 16,
                    padding: 14,
                    borderWidth: 1,
                    borderColor: '#BFDBFE',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <View
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 19,
                        backgroundColor: '#DBEAFE',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Video size={18} color="#2563EB" />
                    </View>
                    <View>
                      <Text style={{ fontSize: 13.5, fontWeight: '800', color: '#1E3A8A' }}>
                        Schedule or Go Live Now
                      </Text>
                      <Text style={{ fontSize: 11.5, color: '#3B82F6', marginTop: 1 }}>
                        Stream live lecture via Zoom, YouTube or Google Meet
                      </Text>
                    </View>
                  </View>
                  <ChevronRight size={16} color="#2563EB" />
                </TouchableOpacity>
              )}

              {/* BATCH INFORMATION CARD */}
              <View
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: 18,
                  padding: 16,
                  borderWidth: 1,
                  borderColor: '#E2E8F0',
                  gap: 14,
                  elevation: 1,
                  shadowColor: '#000000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.05,
                  shadowRadius: 3,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 14.5, fontWeight: '800', color: '#0F172A' }}>Batch Information</Text>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 5,
                      backgroundColor: batch.status === 'ongoing' ? '#ECFDF5' : '#F1F5F9',
                      paddingHorizontal: 9,
                      paddingVertical: 3.5,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: batch.status === 'ongoing' ? '#A7F3D0' : '#CBD5E1',
                    }}
                  >
                    <View
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: batch.status === 'ongoing' ? '#10B981' : '#64748B',
                      }}
                    />
                    <Text
                      style={{
                        fontSize: 10.5,
                        fontWeight: '800',
                        color: batch.status === 'ongoing' ? '#047857' : '#475569',
                        textTransform: 'uppercase',
                      }}
                    >
                      {batch.status}
                    </Text>
                  </View>
                </View>

                {/* Batch Code Banner with Copy & Share */}
                <View
                  style={{
                    backgroundColor: '#F8FAFC',
                    borderRadius: 14,
                    padding: 12,
                    borderWidth: 1,
                    borderColor: '#E2E8F0',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <View>
                    <Text style={{ fontSize: 10, fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      BATCH JOIN CODE
                    </Text>
                    <Text style={{ fontSize: 17, fontWeight: '900', color: '#0F172A', letterSpacing: 1.2, marginTop: 1 }}>
                      {batch.joinCode}
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => {
                        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        void Share.share({
                          title: `Join ${batch.title} on Quick2Learn`,
                          message: `Join ${batch.title} at Quick2Learn!\nBatch Code: ${batch.joinCode}\nDownload App: https://quick2learn.in`,
                        });
                      }}
                      style={{
                        paddingHorizontal: 11,
                        paddingVertical: 7,
                        borderRadius: 9,
                        backgroundColor: '#2563EB',
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <Share2 size={13} color="#FFFFFF" />
                      <Text style={{ fontSize: 11.5, fontWeight: '800', color: '#FFFFFF' }}>Share</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => {
                        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                        Alert.alert('Code Copied', `Batch Code ${batch.joinCode} copied to clipboard!`);
                      }}
                      style={{
                        paddingHorizontal: 9,
                        paddingVertical: 7,
                        borderRadius: 9,
                        backgroundColor: '#FFFFFF',
                        borderWidth: 1,
                        borderColor: '#CBD5E1',
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <Copy size={13} color="#334155" />
                      <Text style={{ fontSize: 11.5, fontWeight: '700', color: '#334155' }}>Copy</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={async () => {
                        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        const newCode = await store.regenerateJoinCode(batch.id);
                        onToast({ type: 'info', message: `Regenerated new code: ${newCode}` });
                      }}
                      style={{
                        paddingHorizontal: 9,
                        paddingVertical: 7,
                        borderRadius: 9,
                        backgroundColor: '#F1F5F9',
                        borderWidth: 1,
                        borderColor: '#E2E8F0',
                      }}
                    >
                      <Text style={{ fontSize: 11, fontWeight: '700', color: '#475569' }}>Refresh</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Faculty & Schedule Details with soft icon chips */}
                <View style={{ gap: 10 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center' }}>
                      <Users size={15} color="#4F46E5" />
                    </View>
                    <Text style={{ fontSize: 13, color: '#334155', flex: 1 }}>
                      <Text style={{ fontWeight: '700', color: '#0F172A' }}>Faculty: </Text>
                      {batch.faculty}
                    </Text>
                  </View>

                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: '#FEF3C7', alignItems: 'center', justifyContent: 'center' }}>
                      <Calendar size={15} color="#D97706" />
                    </View>
                    <Text style={{ fontSize: 13, color: '#334155', flex: 1 }}>
                      <Text style={{ fontWeight: '700', color: '#0F172A' }}>Schedule: </Text>
                      {batch.scheduleDays.join(', ')} • {batch.scheduleTime}
                    </Text>
                  </View>

                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: '#ECFDF5', alignItems: 'center', justifyContent: 'center' }}>
                      <School size={15} color="#059669" />
                    </View>
                    <Text style={{ fontSize: 13, color: '#334155', flex: 1 }}>
                      <Text style={{ fontWeight: '700', color: '#0F172A' }}>Location: </Text>
                      {batch.room}
                    </Text>
                  </View>

                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' }}>
                      <Clock size={15} color="#64748B" />
                    </View>
                    <Text style={{ fontSize: 13, color: '#334155', flex: 1 }}>
                      <Text style={{ fontWeight: '700', color: '#0F172A' }}>Session Duration: </Text>
                      {batch.startDate} to {batch.endDate}
                    </Text>
                  </View>
                </View>

                {/* 3 KPI stats cards */}
                <View
                  style={{
                    flexDirection: 'row',
                    gap: 10,
                    paddingTop: 10,
                    borderTopWidth: 1,
                    borderTopColor: '#F1F5F9',
                  }}
                >
                  <View
                    style={{
                      flex: 1,
                      backgroundColor: '#F0F9FF',
                      borderWidth: 1,
                      borderColor: '#BAE6FD',
                      padding: 10,
                      borderRadius: 12,
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ fontSize: 10, color: '#0369A1', fontWeight: '800', letterSpacing: 0.5 }}>STUDENTS</Text>
                    <Text style={{ fontSize: 16, fontWeight: '900', color: '#0C4A6E', marginTop: 2 }}>
                      {batchStudents.length} / {batch.capacity}
                    </Text>
                  </View>
                  <View
                    style={{
                      flex: 1,
                      backgroundColor: '#ECFDF5',
                      borderWidth: 1,
                      borderColor: '#A7F3D0',
                      padding: 10,
                      borderRadius: 12,
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ fontSize: 10, color: '#047857', fontWeight: '800', letterSpacing: 0.5 }}>COURSE FEE</Text>
                    <Text style={{ fontSize: 16, fontWeight: '900', color: '#064E3B', marginTop: 2 }}>
                      ₹{batch.fee.toLocaleString('en-IN')}
                    </Text>
                  </View>
                  <View
                    style={{
                      flex: 1,
                      backgroundColor: batch.mode === 'offline' ? '#FEF3C7' : '#EFF6FF',
                      borderWidth: 1,
                      borderColor: batch.mode === 'offline' ? '#FDE68A' : '#BFDBFE',
                      padding: 10,
                      borderRadius: 12,
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ fontSize: 10, color: batch.mode === 'offline' ? '#92400E' : '#1E40AF', fontWeight: '800', letterSpacing: 0.5 }}>MODE</Text>
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: '900',
                        color: batch.mode === 'offline' ? '#78350F' : '#1E3A8A',
                        marginTop: 2,
                        textTransform: 'uppercase',
                      }}
                    >
                      {batch.mode}
                    </Text>
                  </View>
                </View>
              </View>

              {/* QUICK ACTIONS ROW */}
              <View style={{ gap: 10 }}>
                <Text style={{ fontSize: 13, fontWeight: '800', color: '#334155', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Quick Batch Actions
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                  <ActionButton
                    label="+ Add Video"
                    icon={<Video size={16} color="#2563EB" />}
                    bgColor="#EFF6FF"
                    onPress={() => setAddLectureModalVisible(true)}
                  />
                  <ActionButton
                    label="+ Upload Notes"
                    icon={<FileText size={16} color="#059669" />}
                    bgColor="#ECFDF5"
                    onPress={() => setAddResourceModalVisible(true)}
                  />
                  <ActionButton
                    label="+ Homework"
                    icon={<BookOpen size={16} color="#7C3AED" />}
                    bgColor="#F5F3FF"
                    onPress={() => setAddAssignmentModalVisible(true)}
                  />
                  <ActionButton
                    label="Mark Attendance"
                    icon={<CheckCircle2 size={16} color="#D97706" />}
                    bgColor="#FEF3C7"
                    onPress={() => setActiveTab('attendance')}
                  />
                  <ActionButton
                    label="+ Post Notice"
                    icon={<Send size={16} color="#E11D48" />}
                    bgColor="#FFF1F2"
                    onPress={() => setAddAnnouncementModalVisible(true)}
                  />
                  <ActionButton
                    label="+ Add Student"
                    icon={<Users size={16} color="#0284C7" />}
                    bgColor="#F0F9FF"
                    onPress={() => setAddStudentModalVisible(true)}
                  />
                </View>
              </View>

              {/* RECENT BATCH ANNOUNCEMENTS */}
              <View
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: 18,
                  padding: 16,
                  borderWidth: 1,
                  borderColor: '#E2E8F0',
                  gap: 12,
                  elevation: 1,
                  shadowColor: '#000000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.04,
                  shadowRadius: 2,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 14.5, fontWeight: '800', color: '#0F172A' }}>Recent Notices</Text>
                  <TouchableOpacity onPress={() => setActiveTab('announcements')}>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: '#2563EB' }}>View All ({batchAnnouncements.length})</Text>
                  </TouchableOpacity>
                </View>
                {batchAnnouncements.length === 0 ? (
                  <Text style={{ fontSize: 12.5, color: '#94A3B8', fontStyle: 'italic', paddingVertical: 8 }}>
                    No announcements posted for this batch yet.
                  </Text>
                ) : (
                  batchAnnouncements.slice(0, 2).map((a) => (
                    <View
                      key={a.id}
                      style={{
                        backgroundColor: '#F8FAFC',
                        borderRadius: 12,
                        padding: 12,
                        borderLeftWidth: 3.5,
                        borderLeftColor: a.priority === 'urgent' ? '#EF4444' : '#2563EB',
                        gap: 4,
                      }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Text style={{ fontSize: 13.5, fontWeight: '800', color: '#0F172A', flex: 1 }} numberOfLines={1}>
                          {a.title}
                        </Text>
                        {a.priority === 'urgent' && (
                          <View style={{ backgroundColor: '#FEE2E2', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 8, marginLeft: 6 }}>
                            <Text style={{ fontSize: 9.5, fontWeight: '800', color: '#DC2626' }}>URGENT</Text>
                          </View>
                        )}
                      </View>
                      <Text style={{ fontSize: 12, color: '#475569', lineHeight: 17 }} numberOfLines={2}>
                        {a.body}
                      </Text>
                      <Text style={{ fontSize: 10.5, color: '#94A3B8', marginTop: 2 }}>
                        {new Date(a.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} • By {a.authorName}
                      </Text>
                    </View>
                  ))
                )}
              </View>
            </View>
          )}

          {/* 2. VIDEOS TAB (Hierarchical folder view matching Classplus) */}
          {activeTab === 'videos' && (
            <View style={{ gap: 12 }}>
              {/* Top Action Header */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View>
                  <Text style={{ fontSize: 15, fontWeight: '800', color: '#0F172A' }}>Batch Video Lectures</Text>
                  <Text style={{ fontSize: 11.5, color: '#64748B' }}>
                    {batchLectures.length} total videos in {videoChapters.length} chapter folders
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setAddLectureModalVisible(true)}
                  style={{
                    backgroundColor: '#2563EB',
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 10,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <Plus size={15} color="#FFFFFF" />
                  <Text style={{ fontSize: 12, fontWeight: '800', color: '#FFFFFF' }}>Add Video</Text>
                </TouchableOpacity>
              </View>

              {/* Breadcrumb if chapter selected */}
              {selectedVideoChapter && (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: '#EFF6FF',
                    padding: 8,
                    borderRadius: 8,
                    gap: 6,
                  }}
                >
                  <TouchableOpacity onPress={() => setSelectedVideoChapter(null)}>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: '#2563EB' }}>← All Chapter Folders</Text>
                  </TouchableOpacity>
                  <Text style={{ fontSize: 12, color: '#64748B' }}>/</Text>
                  <Text style={{ fontSize: 12, fontWeight: '800', color: '#1E3A8A' }}>{selectedVideoChapter}</Text>
                </View>
              )}

              {/* Chapter Folders Scroll if not in a chapter */}
              {!selectedVideoChapter && videoChapters.length > 0 && (
                <View style={{ gap: 8 }}>
                  <Text style={{ fontSize: 11, fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase' }}>
                    Chapters & Folders
                  </Text>
                  <View style={{ gap: 6 }}>
                    {videoChapters.map((chapterName) => {
                      const count = batchLectures.filter((l) => l.chapter === chapterName).length;
                      return (
                        <TouchableOpacity
                          key={chapterName}
                          onPress={() => setSelectedVideoChapter(chapterName)}
                          style={{
                            backgroundColor: '#FFFFFF',
                            borderRadius: 12,
                            padding: 12,
                            borderWidth: 1,
                            borderColor: '#E2E8F0',
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                          }}
                        >
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                            <View
                              style={{
                                width: 34,
                                height: 34,
                                borderRadius: 8,
                                backgroundColor: '#EFF6FF',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <Folder size={18} color="#2563EB" />
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text style={{ fontSize: 13, fontWeight: '800', color: '#0F172A' }}>{chapterName}</Text>
                              <Text style={{ fontSize: 11, color: '#64748B' }}>{count} lecture{count !== 1 ? 's' : ''}</Text>
                            </View>
                          </View>
                          <ChevronRight size={16} color="#94A3B8" />
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}

              {/* Lectures List */}
              <View style={{ gap: 10, marginTop: 4 }}>
                <Text style={{ fontSize: 11, fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase' }}>
                  {selectedVideoChapter ? `Lectures in ${selectedVideoChapter}` : 'All Batch Lectures'}
                </Text>
                {filteredLectures.length === 0 ? (
                  <EmptyState
                    title="No lectures uploaded"
                    description="Add YouTube lecture URLs to provide video lessons to students."
                    actionLabel="Add Video Lecture"
                    onAction={() => setAddLectureModalVisible(true)}
                  />
                ) : (
                  filteredLectures.map((l) => (
                    <View
                      key={l.id}
                      style={{
                        backgroundColor: '#FFFFFF',
                        borderRadius: 14,
                        padding: 12,
                        borderWidth: 1,
                        borderColor: '#E2E8F0',
                        gap: 8,
                      }}
                    >
                      <View style={{ flexDirection: 'row', gap: 10 }}>
                        {/* Video thumbnail box */}
                        <TouchableOpacity
                          onPress={() => Linking.openURL(l.youtubeUrl)}
                          style={{
                            width: 80,
                            height: 56,
                            borderRadius: 8,
                            backgroundColor: '#0F172A',
                            alignItems: 'center',
                            justifyContent: 'center',
                            position: 'relative',
                          }}
                        >
                          <Play size={20} color="#FFFFFF" fill="#FFFFFF" />
                          <View
                            style={{
                              position: 'absolute',
                              bottom: 3,
                              right: 3,
                              backgroundColor: 'rgba(0,0,0,0.75)',
                              paddingHorizontal: 4,
                              borderRadius: 4,
                            }}
                          >
                            <Text style={{ fontSize: 9, fontWeight: '700', color: '#FFFFFF' }}>{l.duration}</Text>
                          </View>
                        </TouchableOpacity>

                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                            <Badge
                              label={l.isPublished ? 'PUBLISHED' : 'DRAFT'}
                              variant={l.isPublished ? 'success' : 'neutral'}
                              size="sm"
                            />
                            <Text style={{ fontSize: 10, color: '#94A3B8' }}>{l.viewsCount} views</Text>
                          </View>
                          <Text style={{ fontSize: 13, fontWeight: '800', color: '#0F172A' }} numberOfLines={2}>
                            {l.title}
                          </Text>
                          <Text style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>{l.chapter}</Text>
                        </View>
                      </View>

                      {/* Video Actions Footer */}
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
                          onPress={() => Linking.openURL(l.youtubeUrl)}
                          style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
                        >
                          <ExternalLink size={12} color="#2563EB" />
                          <Text style={{ fontSize: 11.5, fontWeight: '700', color: '#2563EB' }}>Play on YouTube</Text>
                        </TouchableOpacity>

                        <View style={{ flexDirection: 'row', gap: 8 }}>
                          <TouchableOpacity
                            onPress={async () => {
                              await store.updateLecture(l.id, { isPublished: !l.isPublished });
                              onToast({
                                type: 'info',
                                message: `Lecture ${l.isPublished ? 'unpublished' : 'published'}.`,
                              });
                            }}
                            style={{
                              paddingHorizontal: 8,
                              paddingVertical: 4,
                              borderRadius: 6,
                              backgroundColor: '#F1F5F9',
                            }}
                          >
                            <Text style={{ fontSize: 11, fontWeight: '700', color: '#475569' }}>
                              {l.isPublished ? 'Unpublish' : 'Publish'}
                            </Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => {
                              Alert.alert('Delete Lecture', 'Are you sure you want to remove this lecture?', [
                                { text: 'Cancel', style: 'cancel' },
                                {
                                  text: 'Delete',
                                  style: 'destructive',
                                  onPress: async () => {
                                    await store.deleteLecture(l.id);
                                    onToast({ type: 'info', message: 'Lecture deleted.' });
                                  },
                                },
                              ]);
                            }}
                            style={{
                              paddingHorizontal: 8,
                              paddingVertical: 4,
                              borderRadius: 6,
                              backgroundColor: '#FEE2E2',
                            }}
                          >
                            <Trash2 size={13} color="#EF4444" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  ))
                )}
              </View>
            </View>
          )}

          {/* 3. STUDY MATERIAL TAB (Hierarchical PDF folders matching Classplus) */}
          {activeTab === 'materials' && (
            <View style={{ gap: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View>
                  <Text style={{ fontSize: 15, fontWeight: '800', color: '#0F172A' }}>Batch Study Material</Text>
                  <Text style={{ fontSize: 11.5, color: '#64748B' }}>
                    {batchResources.length} PDF documents & notes
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setAddResourceModalVisible(true)}
                  style={{
                    backgroundColor: '#2563EB',
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 10,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <Plus size={15} color="#FFFFFF" />
                  <Text style={{ fontSize: 12, fontWeight: '800', color: '#FFFFFF' }}>Upload PDF</Text>
                </TouchableOpacity>
              </View>

              {/* Breadcrumb if material folder selected */}
              {selectedMaterialFolder && (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: '#EFF6FF',
                    padding: 8,
                    borderRadius: 8,
                    gap: 6,
                  }}
                >
                  <TouchableOpacity onPress={() => setSelectedMaterialFolder(null)}>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: '#2563EB' }}>← All Material Folders</Text>
                  </TouchableOpacity>
                  <Text style={{ fontSize: 12, color: '#64748B' }}>/</Text>
                  <Text style={{ fontSize: 12, fontWeight: '800', color: '#1E3A8A' }}>{selectedMaterialFolder}</Text>
                </View>
              )}

              {/* Folders List if not inside a folder */}
              {!selectedMaterialFolder && materialFolders.length > 0 && (
                <View style={{ gap: 8 }}>
                  <Text style={{ fontSize: 11, fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase' }}>
                    Subject Folders & Solution Books
                  </Text>
                  <View style={{ gap: 6 }}>
                    {materialFolders.map((fName) => {
                      const count = batchResources.filter(
                        (r) => (r.folderName || r.chapter || 'Class Study Material') === fName
                      ).length;
                      return (
                        <TouchableOpacity
                          key={fName}
                          onPress={() => setSelectedMaterialFolder(fName)}
                          style={{
                            backgroundColor: '#FFFFFF',
                            borderRadius: 12,
                            padding: 12,
                            borderWidth: 1,
                            borderColor: '#E2E8F0',
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                          }}
                        >
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                            <View
                              style={{
                                width: 34,
                                height: 34,
                                borderRadius: 8,
                                backgroundColor: '#FEF2F2',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <Folder size={18} color="#DC2626" />
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text style={{ fontSize: 13, fontWeight: '800', color: '#0F172A' }}>{fName}</Text>
                              <Text style={{ fontSize: 11, color: '#64748B' }}>{count} file{count !== 1 ? 's' : ''}</Text>
                            </View>
                          </View>
                          <ChevronRight size={16} color="#94A3B8" />
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}

              {/* Files List */}
              <View style={{ gap: 8, marginTop: 4 }}>
                <Text style={{ fontSize: 11, fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase' }}>
                  {selectedMaterialFolder ? `Files in ${selectedMaterialFolder}` : 'All PDF Documents'}
                </Text>
                {filteredResources.length === 0 ? (
                  <EmptyState
                    title="No materials uploaded"
                    description="Upload exercise sheets, Selina solutions, or notes for this batch."
                    actionLabel="Upload PDF"
                    onAction={() => setAddResourceModalVisible(true)}
                  />
                ) : (
                  filteredResources.map((res) => (
                    <View
                      key={res.id}
                      style={{
                        backgroundColor: '#FFFFFF',
                        borderRadius: 14,
                        padding: 12,
                        borderWidth: 1,
                        borderColor: '#E2E8F0',
                        gap: 8,
                      }}
                    >
                      <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
                        <View
                          style={{
                            width: 36,
                            height: 42,
                            borderRadius: 8,
                            backgroundColor: '#FEF2F2',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderWidth: 1,
                            borderColor: '#FECACA',
                          }}
                        >
                          <FileText size={18} color="#DC2626" />
                        </View>
                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                            <Badge
                              label={res.visibility === 'public' ? 'FREE MATERIAL' : 'BATCH ONLY'}
                              variant={res.visibility === 'public' ? 'success' : 'primary'}
                              size="sm"
                            />
                            <Badge label={res.type.toUpperCase().replace('_', ' ')} variant="neutral" size="sm" />
                          </View>
                          <Text style={{ fontSize: 13, fontWeight: '800', color: '#0F172A' }}>{res.title}</Text>
                          <Text style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>
                            {res.chapter} • {res.filePages} pages • {res.fileSize} • {res.downloadCount} downloads
                          </Text>
                        </View>
                      </View>

                      {/* File Actions */}
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
                          onPress={() => Linking.openURL(res.fileUrl)}
                          style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
                        >
                          <Download size={13} color="#2563EB" />
                          <Text style={{ fontSize: 11.5, fontWeight: '700', color: '#2563EB' }}>Download / View PDF</Text>
                        </TouchableOpacity>

                        <View style={{ flexDirection: 'row', gap: 8 }}>
                          <TouchableOpacity
                            onPress={async () => {
                              const newVis = res.visibility === 'public' ? 'batch_only' : 'public';
                              await store.updateResource(res.id, { visibility: newVis });
                              onToast({
                                type: 'info',
                                message: `Visibility updated to ${newVis === 'public' ? 'Free Material' : 'Batch Only'}.`,
                              });
                            }}
                            style={{
                              paddingHorizontal: 8,
                              paddingVertical: 4,
                              borderRadius: 6,
                              backgroundColor: '#F1F5F9',
                            }}
                          >
                            <Text style={{ fontSize: 11, fontWeight: '700', color: '#475569' }}>
                              {res.visibility === 'public' ? 'Make Batch Only' : 'Make Public'}
                            </Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => {
                              Alert.alert('Delete Material', 'Delete this study material?', [
                                { text: 'Cancel', style: 'cancel' },
                                {
                                  text: 'Delete',
                                  style: 'destructive',
                                  onPress: async () => {
                                    await store.deleteResource(res.id);
                                    onToast({ type: 'info', message: 'Study material deleted.' });
                                  },
                                },
                              ]);
                            }}
                            style={{
                              paddingHorizontal: 8,
                              paddingVertical: 4,
                              borderRadius: 6,
                              backgroundColor: '#FEE2E2',
                            }}
                          >
                            <Trash2 size={13} color="#EF4444" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  ))
                )}
              </View>
            </View>
          )}

          {/* 4. ASSIGNMENTS TAB (Matching Classplus Homework) */}
          {activeTab === 'assignments' && (
            <View style={{ gap: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View>
                  <Text style={{ fontSize: 15, fontWeight: '800', color: '#0F172A' }}>Batch Assignments</Text>
                  <Text style={{ fontSize: 11.5, color: '#64748B' }}>
                    Homework and worksheets given to this batch
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setAddAssignmentModalVisible(true)}
                  style={{
                    backgroundColor: '#2563EB',
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 10,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <Plus size={15} color="#FFFFFF" />
                  <Text style={{ fontSize: 12, fontWeight: '800', color: '#FFFFFF' }}>New Assignment</Text>
                </TouchableOpacity>
              </View>

              {batchAssignments.length === 0 ? (
                <EmptyState
                  title="No assignments yet"
                  description="Assign homework or worksheets with submission due dates."
                  actionLabel="Create Assignment"
                  onAction={() => setAddAssignmentModalVisible(true)}
                />
              ) : (
                batchAssignments.map((asg) => {
                  const subsCount = asg.submissions.length;
                  const totalStudentsCount = Math.max(batchStudents.length, 1);
                  const completionRate = Math.round((subsCount / totalStudentsCount) * 100);

                  return (
                    <View
                      key={asg.id}
                      style={{
                        backgroundColor: '#FFFFFF',
                        borderRadius: 14,
                        padding: 14,
                        borderWidth: 1,
                        borderColor: '#E2E8F0',
                        gap: 10,
                      }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                        <View style={{ flex: 1, marginRight: 8 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                            <Badge label={`DUE: ${asg.dueDate}`} variant="warning" size="sm" />
                            <Badge label={`${asg.totalMarks} MARKS`} variant="neutral" size="sm" />
                          </View>
                          <Text style={{ fontSize: 14, fontWeight: '800', color: '#0F172A' }}>{asg.title}</Text>
                          <Text style={{ fontSize: 11.5, color: '#64748B', marginTop: 2 }}>
                            Chapter: {asg.chapter}
                          </Text>
                        </View>

                        <TouchableOpacity
                          onPress={() => {
                            Alert.alert('Delete Assignment', 'Delete this assignment?', [
                              { text: 'Cancel', style: 'cancel' },
                              {
                                text: 'Delete',
                                style: 'destructive',
                                onPress: async () => {
                                  await store.deleteAssignment(asg.id);
                                  onToast({ type: 'info', message: 'Assignment deleted.' });
                                },
                              },
                            ]);
                          }}
                          style={{
                            padding: 6,
                            borderRadius: 6,
                            backgroundColor: '#FEE2E2',
                          }}
                        >
                          <Trash2 size={14} color="#EF4444" />
                        </TouchableOpacity>
                      </View>

                      {/* Instructions */}
                      <Text style={{ fontSize: 12, color: '#475569', lineHeight: 16 }}>{asg.instructions}</Text>

                      {/* Submissions Progress */}
                      <View
                        style={{
                          backgroundColor: '#F8FAFC',
                          padding: 10,
                          borderRadius: 10,
                          gap: 6,
                        }}
                      >
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Text style={{ fontSize: 11, fontWeight: '700', color: '#64748B' }}>SUBMISSIONS</Text>
                          <Text style={{ fontSize: 11, fontWeight: '800', color: '#0F172A' }}>
                            {subsCount} of {batchStudents.length} Students ({completionRate}%)
                          </Text>
                        </View>
                        <View style={{ height: 6, backgroundColor: '#E2E8F0', borderRadius: 3, overflow: 'hidden' }}>
                          <View
                            style={{
                              width: `${Math.min(completionRate, 100)}%`,
                              height: '100%',
                              backgroundColor: completionRate >= 80 ? '#16A34A' : '#2563EB',
                            }}
                          />
                        </View>
                      </View>

                      {/* Actions */}
                      <View style={{ flexDirection: 'row', gap: 8 }}>
                        <TouchableOpacity
                          onPress={() => {
                            setSelectedAssignmentForReview(asg);
                            setSubmissionsModalVisible(true);
                          }}
                          style={{
                            flex: 1,
                            backgroundColor: '#EFF6FF',
                            paddingVertical: 8,
                            borderRadius: 8,
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexDirection: 'row',
                            gap: 4,
                          }}
                        >
                          <Award size={14} color="#2563EB" />
                          <Text style={{ fontSize: 12, fontWeight: '800', color: '#2563EB' }}>
                            Review Submissions ({asg.submissions.length})
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          )}

          {/* 5. ANNOUNCEMENTS TAB */}
          {activeTab === 'announcements' && (
            <View style={{ gap: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View>
                  <Text style={{ fontSize: 15, fontWeight: '800', color: '#0F172A' }}>Batch Notice Board</Text>
                  <Text style={{ fontSize: 11.5, color: '#64748B' }}>
                    Announcements broadcast to students in this batch
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setAddAnnouncementModalVisible(true)}
                  style={{
                    backgroundColor: '#2563EB',
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 10,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <Plus size={15} color="#FFFFFF" />
                  <Text style={{ fontSize: 12, fontWeight: '800', color: '#FFFFFF' }}>Post Notice</Text>
                </TouchableOpacity>
              </View>

              {batchAnnouncements.length === 0 ? (
                <EmptyState
                  title="No notices posted"
                  description="Post alerts about tests, schedule changes, or holidays."
                  actionLabel="Post Notice"
                  onAction={() => setAddAnnouncementModalVisible(true)}
                />
              ) : (
                batchAnnouncements.map((ann) => (
                  <View
                    key={ann.id}
                    style={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: 14,
                      padding: 14,
                      borderWidth: 1,
                      borderColor: '#E2E8F0',
                      gap: 8,
                      borderLeftWidth: 4,
                      borderLeftColor: ann.priority === 'urgent' ? '#EF4444' : '#2563EB',
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Badge
                        label={ann.priority.toUpperCase()}
                        variant={ann.priority === 'urgent' ? 'danger' : 'primary'}
                        size="sm"
                      />
                      <TouchableOpacity
                        onPress={() => {
                          Alert.alert('Delete Notice', 'Delete this announcement?', [
                            { text: 'Cancel', style: 'cancel' },
                            {
                              text: 'Delete',
                              style: 'destructive',
                              onPress: async () => {
                                await store.deleteAnnouncement(ann.id);
                                onToast({ type: 'info', message: 'Notice deleted.' });
                              },
                            },
                          ]);
                        }}
                      >
                        <Trash2 size={14} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                    <Text style={{ fontSize: 14, fontWeight: '800', color: '#0F172A' }}>{ann.title}</Text>
                    <Text style={{ fontSize: 12.5, color: '#334155', lineHeight: 18 }}>{ann.body}</Text>
                    <Text style={{ fontSize: 10.5, color: '#94A3B8', marginTop: 2 }}>
                      Posted on {new Date(ann.createdAt).toLocaleDateString('en-IN')} by {ann.authorName}
                    </Text>
                  </View>
                ))
              )}
            </View>
          )}

          {/* 6. TESTS TAB */}
          {activeTab === 'tests' && (
            <View style={{ gap: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View>
                  <Text style={{ fontSize: 15, fontWeight: '800', color: '#0F172A' }}>Batch Tests & Quizzes</Text>
                  <Text style={{ fontSize: 11.5, color: '#64748B' }}>
                    Scheduled assessments and results
                  </Text>
                </View>
              </View>

              {batchTests.length === 0 ? (
                <EmptyState
                  title="No tests assigned"
                  description="Create assessments and assign them to this batch."
                />
              ) : (
                batchTests.map((t) => (
                  <View
                    key={t.id}
                    style={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: 14,
                      padding: 14,
                      borderWidth: 1,
                      borderColor: '#E2E8F0',
                      gap: 8,
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Badge
                        label={t.status.toUpperCase()}
                        variant={t.status === 'live' ? 'danger' : t.status === 'completed' ? 'success' : 'primary'}
                        size="sm"
                      />
                      <Text style={{ fontSize: 11, fontWeight: '700', color: '#64748B' }}>
                        {t.durationMinutes} Mins • {t.totalMarks} Marks
                      </Text>
                    </View>
                    <Text style={{ fontSize: 14, fontWeight: '800', color: '#0F172A' }}>{t.title}</Text>
                    <Text style={{ fontSize: 11.5, color: '#64748B' }}>
                      Chapters: {t.chapters.join(', ')} • {t.questionsCount} Questions
                    </Text>

                    {/* Score stats */}
                    <View
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        backgroundColor: '#F8FAFC',
                        padding: 8,
                        borderRadius: 8,
                      }}
                    >
                      <Text style={{ fontSize: 11.5, color: '#475569' }}>
                        Submissions: <Text style={{ fontWeight: '800' }}>{t.submissionsCount}</Text>
                      </Text>
                      <Text style={{ fontSize: 11.5, color: '#475569' }}>
                        Average: <Text style={{ fontWeight: '800', color: '#16A34A' }}>{t.averageScore} / {t.totalMarks}</Text>
                      </Text>
                    </View>

                    <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
                      {!t.isPublished && (
                        <TouchableOpacity
                          onPress={async () => {
                            await store.publishTestResults(t.id);
                            onToast({ type: 'success', message: 'Test results published to students.' });
                          }}
                          style={{
                            flex: 1,
                            backgroundColor: '#2563EB',
                            paddingVertical: 7,
                            borderRadius: 8,
                            alignItems: 'center',
                          }}
                        >
                          <Text style={{ fontSize: 12, fontWeight: '800', color: '#FFFFFF' }}>Publish Results</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                ))
              )}
            </View>
          )}

          {/* 7. LIVE CLASSES TAB */}
          {activeTab === 'live' && (
            <View style={{ gap: 14 }}>
              {/* Studio Header Card */}
              <View
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: 16,
                  padding: 14,
                  borderWidth: 1,
                  borderColor: '#E2E8F0',
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  elevation: 1,
                  shadowColor: '#000000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.04,
                  shadowRadius: 2,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, marginRight: 8 }}>
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 12,
                      backgroundColor: '#EFF6FF',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderWidth: 1,
                      borderColor: '#DBEAFE',
                    }}
                  >
                    <Radio size={20} color="#2563EB" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={{ fontSize: 15, fontWeight: '800', color: '#0F172A' }}>Live Lectures Console</Text>
                      {activeLiveClass && (
                        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444' }} />
                      )}
                    </View>
                    <Text style={{ fontSize: 11.5, color: '#64748B', marginTop: 1 }}>
                      Zoom, YouTube Live & Google Meet sessions
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => {
                    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setScheduleLiveModalVisible(true);
                  }}
                  style={{
                    backgroundColor: '#2563EB',
                    paddingHorizontal: 13,
                    paddingVertical: 9,
                    borderRadius: 11,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 5,
                    elevation: 2,
                    shadowColor: '#2563EB',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.25,
                    shadowRadius: 4,
                  }}
                >
                  <Plus size={15} color="#FFFFFF" strokeWidth={2.5} />
                  <Text style={{ fontSize: 12.5, fontWeight: '800', color: '#FFFFFF' }}>Schedule Live</Text>
                </TouchableOpacity>
              </View>

              {batchLiveClasses.length === 0 ? (
                <EmptyState
                  title="No live classes scheduled"
                  description="Schedule an online interactive lecture with meeting link for this batch."
                  actionLabel="Schedule Live Class"
                  onAction={() => setScheduleLiveModalVisible(true)}
                />
              ) : (
                batchLiveClasses.map((live) => {
                  const isZoom = live.platform.toLowerCase() === 'zoom';
                  const isYT = live.platform.toLowerCase() === 'youtube';
                  const isMeet = live.platform.toLowerCase() === 'meet';
                  const platformColor = isZoom ? '#2563EB' : isYT ? '#DC2626' : '#059669';
                  const platformBg = isZoom ? '#EFF6FF' : isYT ? '#FEF2F2' : '#ECFDF5';
                  const platformBorder = isZoom ? '#BFDBFE' : isYT ? '#FECDD3' : '#A7F3D0';

                  return (
                    <View
                      key={live.id}
                      style={{
                        backgroundColor: '#FFFFFF',
                        borderRadius: 18,
                        padding: 16,
                        borderWidth: 1.5,
                        borderColor: live.isLive ? '#FDA4AF' : '#E2E8F0',
                        borderLeftWidth: live.isLive ? 5 : 1.5,
                        borderLeftColor: live.isLive ? '#EF4444' : '#E2E8F0',
                        gap: 12,
                        elevation: live.isLive ? 3 : 1,
                        shadowColor: live.isLive ? '#E11D48' : '#000000',
                        shadowOffset: { width: 0, height: live.isLive ? 3 : 1 },
                        shadowOpacity: live.isLive ? 0.12 : 0.04,
                        shadowRadius: 6,
                      }}
                    >
                      {/* Top Badges */}
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        {live.isLive ? (
                          <View
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              gap: 6,
                              backgroundColor: '#FEE2E2',
                              paddingHorizontal: 10,
                              paddingVertical: 4,
                              borderRadius: 20,
                              borderWidth: 1,
                              borderColor: '#FCA5A5',
                            }}
                          >
                            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444' }} />
                            <Text style={{ fontSize: 11, fontWeight: '900', color: '#B91C1C', letterSpacing: 0.5 }}>
                              LIVE NOW
                            </Text>
                          </View>
                        ) : (
                          <View
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              gap: 5,
                              backgroundColor: '#F1F5F9',
                              paddingHorizontal: 10,
                              paddingVertical: 4,
                              borderRadius: 20,
                              borderWidth: 1,
                              borderColor: '#E2E8F0',
                            }}
                          >
                            <Clock size={11} color="#64748B" />
                            <Text style={{ fontSize: 11, fontWeight: '800', color: '#475569' }}>
                              SCHEDULED
                            </Text>
                          </View>
                        )}

                        {/* Platform Badge */}
                        <View
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 5,
                            backgroundColor: platformBg,
                            paddingHorizontal: 10,
                            paddingVertical: 4,
                            borderRadius: 12,
                            borderWidth: 1,
                            borderColor: platformBorder,
                          }}
                        >
                          <Video size={12} color={platformColor} />
                          <Text style={{ fontSize: 11, fontWeight: '800', color: platformColor }}>
                            {live.platform.toUpperCase()}
                          </Text>
                        </View>
                      </View>

                      {/* Title & Faculty Info */}
                      <View style={{ gap: 4 }}>
                        <Text style={{ fontSize: 15.5, fontWeight: '800', color: '#0F172A', lineHeight: 21 }}>
                          {live.title}
                        </Text>
                        <Text style={{ fontSize: 12, color: '#475569', lineHeight: 18 }}>
                          Faculty: <Text style={{ fontWeight: '700', color: '#1E293B' }}>{live.faculty}</Text> • Time: {new Date(live.scheduledAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })} ({live.duration})
                        </Text>
                      </View>

                      {/* Ticket: Meeting ID & Passcode with 1-tap Copy/Share */}
                      {(live.meetingId || live.passcode) && (
                        <View
                          style={{
                            backgroundColor: '#F8FAFC',
                            borderRadius: 12,
                            paddingHorizontal: 12,
                            paddingVertical: 10,
                            borderWidth: 1,
                            borderColor: '#E2E8F0',
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                          }}
                        >
                          <View style={{ flex: 1, marginRight: 8 }}>
                            <Text style={{ fontSize: 10, fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                              CREDENTIALS
                            </Text>
                            <Text style={{ fontSize: 12.5, color: '#334155', fontWeight: '600', marginTop: 2 }}>
                              ID: <Text style={{ fontWeight: '800', color: '#0F172A' }}>{live.meetingId || 'N/A'}</Text>
                              {live.passcode ? ` • Passcode: ` : ''}
                              {live.passcode ? <Text style={{ fontWeight: '800', color: '#0F172A' }}>{live.passcode}</Text> : null}
                            </Text>
                          </View>
                          <TouchableOpacity
                            activeOpacity={0.7}
                            onPress={() => {
                              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                              void Share.share({
                                title: live.title,
                                message: `Join Live Class: ${live.title}\nPlatform: ${live.platform.toUpperCase()}\nLink: ${live.meetingUrl}${live.meetingId ? `\nMeeting ID: ${live.meetingId}` : ''}${live.passcode ? `\nPasscode: ${live.passcode}` : ''}`,
                              });
                            }}
                            style={{
                              paddingHorizontal: 9,
                              paddingVertical: 5,
                              borderRadius: 8,
                              backgroundColor: '#EFF6FF',
                              borderWidth: 1,
                              borderColor: '#BFDBFE',
                              flexDirection: 'row',
                              alignItems: 'center',
                              gap: 4,
                            }}
                          >
                            <Copy size={12} color="#2563EB" />
                            <Text style={{ fontSize: 11, fontWeight: '800', color: '#2563EB' }}>Share</Text>
                          </TouchableOpacity>
                        </View>
                      )}

                      {/* Actions Row */}
                      <View style={{ flexDirection: 'row', gap: 8, marginTop: 2 }}>
                        <TouchableOpacity
                          activeOpacity={0.8}
                          onPress={() => {
                            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                            Linking.openURL(live.meetingUrl);
                          }}
                          style={{
                            flex: 1,
                            backgroundColor: live.isLive ? '#EF4444' : '#2563EB',
                            paddingVertical: 10,
                            borderRadius: 11,
                            alignItems: 'center',
                            flexDirection: 'row',
                            justifyContent: 'center',
                            gap: 6,
                            elevation: 2,
                            shadowColor: live.isLive ? '#EF4444' : '#2563EB',
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.2,
                            shadowRadius: 4,
                          }}
                        >
                          <Radio size={15} color="#FFFFFF" />
                          <Text style={{ fontSize: 12.5, fontWeight: '800', color: '#FFFFFF' }}>
                            {live.isLive ? 'Join Live Now' : 'Launch Meeting Link'}
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          activeOpacity={0.75}
                          onPress={async () => {
                            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            await store.toggleLiveClassState(live.id);
                            onToast({
                              type: 'info',
                              message: `Live class status set to ${live.isLive ? 'ended' : 'LIVE NOW'}.`,
                            });
                          }}
                          style={{
                            paddingHorizontal: 12,
                            paddingVertical: 10,
                            borderRadius: 11,
                            backgroundColor: '#F1F5F9',
                            borderWidth: 1,
                            borderColor: '#E2E8F0',
                            justifyContent: 'center',
                            alignItems: 'center',
                          }}
                        >
                          <Text style={{ fontSize: 12, fontWeight: '700', color: '#475569' }}>
                            {live.isLive ? 'Mark Ended' : 'Set Live'}
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          activeOpacity={0.75}
                          onPress={() => {
                            Alert.alert('Delete Session', 'Delete this live class record?', [
                              { text: 'Cancel', style: 'cancel' },
                              {
                                text: 'Delete',
                                style: 'destructive',
                                onPress: async () => {
                                  void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                                  await store.deleteLiveClass(live.id);
                                  onToast({ type: 'info', message: 'Live class deleted.' });
                                },
                              },
                            ]);
                          }}
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: 11,
                            backgroundColor: '#FEE2E2',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderWidth: 1,
                            borderColor: '#FECDD3',
                          }}
                        >
                          <Trash2 size={16} color="#EF4444" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          )}

          {/* 8. ATTENDANCE TAB (Matching Classplus daily attendance sheet) */}
          {activeTab === 'attendance' && (
            <View style={{ gap: 12 }}>
              {/* Date Header & Quick Actions */}
              <View
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: 14,
                  padding: 14,
                  borderWidth: 1,
                  borderColor: '#E2E8F0',
                  gap: 10,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View>
                    <Text style={{ fontSize: 11, fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase' }}>
                      Marking Attendance For
                    </Text>
                    <Text style={{ fontSize: 16, fontWeight: '900', color: '#0F172A', marginTop: 2 }}>
                      {attendanceDate} {attendanceDate === todayStr ? '(Today)' : ''}
                    </Text>
                  </View>

                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    <TouchableOpacity
                      onPress={() => {
                        const allP: Record<string, 'P' | 'A' | 'L'> = {};
                        batchStudents.forEach((s) => (allP[s.id] = 'P'));
                        setDailyAttendance(allP);
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }}
                      style={{
                        paddingHorizontal: 10,
                        paddingVertical: 6,
                        borderRadius: 8,
                        backgroundColor: '#DCFCE7',
                      }}
                    >
                      <Text style={{ fontSize: 11.5, fontWeight: '800', color: '#16A34A' }}>All Present</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Summary counters */}
                {(() => {
                  const presentCount = Object.values(dailyAttendance).filter((v) => v === 'P').length;
                  const absentCount = Object.values(dailyAttendance).filter((v) => v === 'A').length;
                  const lateCount = Object.values(dailyAttendance).filter((v) => v === 'L').length;
                  const total = batchStudents.length;
                  const rate = total > 0 ? Math.round((presentCount / total) * 100) : 0;

                  return (
                    <View style={{ flexDirection: 'row', gap: 8, paddingTop: 4 }}>
                      <View style={{ flex: 1, backgroundColor: '#F0FDF4', padding: 8, borderRadius: 8, alignItems: 'center' }}>
                        <Text style={{ fontSize: 10, color: '#16A34A', fontWeight: '800' }}>PRESENT</Text>
                        <Text style={{ fontSize: 14, fontWeight: '900', color: '#16A34A' }}>{presentCount}</Text>
                      </View>
                      <View style={{ flex: 1, backgroundColor: '#FEF2F2', padding: 8, borderRadius: 8, alignItems: 'center' }}>
                        <Text style={{ fontSize: 10, color: '#DC2626', fontWeight: '800' }}>ABSENT</Text>
                        <Text style={{ fontSize: 14, fontWeight: '900', color: '#DC2626' }}>{absentCount}</Text>
                      </View>
                      <View style={{ flex: 1, backgroundColor: '#FFFBEB', padding: 8, borderRadius: 8, alignItems: 'center' }}>
                        <Text style={{ fontSize: 10, color: '#D97706', fontWeight: '800' }}>LATE</Text>
                        <Text style={{ fontSize: 14, fontWeight: '900', color: '#D97706' }}>{lateCount}</Text>
                      </View>
                      <View style={{ flex: 1, backgroundColor: '#EFF6FF', padding: 8, borderRadius: 8, alignItems: 'center' }}>
                        <Text style={{ fontSize: 10, color: '#2563EB', fontWeight: '800' }}>RATE</Text>
                        <Text style={{ fontSize: 14, fontWeight: '900', color: '#2563EB' }}>{rate}%</Text>
                      </View>
                    </View>
                  );
                })()}
              </View>

              {/* Student Attendance Roster */}
              <View style={{ gap: 8 }}>
                <Text style={{ fontSize: 11, fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase' }}>
                  Student Attendance Roster ({batchStudents.length})
                </Text>

                {batchStudents.length === 0 ? (
                  <EmptyState
                    title="No students enrolled"
                    description="Enroll students into this batch to track daily attendance."
                    actionLabel="Add Student"
                    onAction={() => setAddStudentModalVisible(true)}
                  />
                ) : (
                  batchStudents.map((stud, idx) => {
                    const status = dailyAttendance[stud.id] || 'P';
                    return (
                      <View
                        key={stud.id}
                        style={{
                          backgroundColor: '#FFFFFF',
                          borderRadius: 12,
                          padding: 12,
                          borderWidth: 1,
                          borderColor: '#E2E8F0',
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, marginRight: 8 }}>
                          <View
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: 16,
                              backgroundColor: '#EFF6FF',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Text style={{ fontSize: 12, fontWeight: '800', color: '#2563EB' }}>
                              {idx + 1}
                            </Text>
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 13, fontWeight: '800', color: '#0F172A' }}>{stud.fullName}</Text>
                            <Text style={{ fontSize: 10.5, color: '#64748B' }}>{stud.school}</Text>
                          </View>
                        </View>

                        {/* P / A / L Selector Pills */}
                        <View style={{ flexDirection: 'row', gap: 6 }}>
                          <TouchableOpacity
                            onPress={() => {
                              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                              setDailyAttendance((prev) => ({ ...prev, [stud.id]: 'P' }));
                            }}
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: 16,
                              backgroundColor: status === 'P' ? '#16A34A' : '#F1F5F9',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Text style={{ fontSize: 12, fontWeight: '900', color: status === 'P' ? '#FFFFFF' : '#64748B' }}>
                              P
                            </Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            onPress={() => {
                              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                              setDailyAttendance((prev) => ({ ...prev, [stud.id]: 'A' }));
                            }}
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: 16,
                              backgroundColor: status === 'A' ? '#DC2626' : '#F1F5F9',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Text style={{ fontSize: 12, fontWeight: '900', color: status === 'A' ? '#FFFFFF' : '#64748B' }}>
                              A
                            </Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            onPress={() => {
                              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                              setDailyAttendance((prev) => ({ ...prev, [stud.id]: 'L' }));
                            }}
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: 16,
                              backgroundColor: status === 'L' ? '#D97706' : '#F1F5F9',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Text style={{ fontSize: 12, fontWeight: '900', color: status === 'L' ? '#FFFFFF' : '#64748B' }}>
                              L
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })
                )}

                {/* Save Attendance Button */}
                {batchStudents.length > 0 && (
                  <TouchableOpacity
                    onPress={handleSaveAttendance}
                    style={{
                      backgroundColor: '#2563EB',
                      paddingVertical: 14,
                      borderRadius: 12,
                      alignItems: 'center',
                      marginTop: 10,
                      shadowColor: '#2563EB',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.2,
                      shadowRadius: 4,
                      elevation: 2,
                    }}
                  >
                    <Text style={{ fontSize: 14, fontWeight: '800', color: '#FFFFFF' }}>
                      Save Attendance ({attendanceDate})
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}

          {/* 9. STUDENTS TAB (Batch Roster with Classplus 1-tap call/whatsapp) */}
          {activeTab === 'students' && (
            <View style={{ gap: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View>
                  <Text style={{ fontSize: 15, fontWeight: '800', color: '#0F172A' }}>Batch Student Roster</Text>
                  <Text style={{ fontSize: 11.5, color: '#64748B' }}>
                    {batchStudents.length} of {batch.capacity} capacity enrolled
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setAddStudentModalVisible(true)}
                  style={{
                    backgroundColor: '#2563EB',
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 10,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <Plus size={15} color="#FFFFFF" />
                  <Text style={{ fontSize: 12, fontWeight: '800', color: '#FFFFFF' }}>Add Student</Text>
                </TouchableOpacity>
              </View>

              {/* Search */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: '#FFFFFF',
                  borderRadius: 10,
                  paddingHorizontal: 10,
                  borderWidth: 1,
                  borderColor: '#E2E8F0',
                  height: 38,
                }}
              >
                <Search size={15} color="#94A3B8" />
                <TextInput
                  value={studentSearch}
                  onChangeText={setStudentSearch}
                  placeholder="Search enrolled student name or school..."
                  placeholderTextColor="#94A3B8"
                  style={{ flex: 1, marginLeft: 8, fontSize: 12.5, color: '#0F172A' }}
                />
              </View>

              {/* Students List */}
              {batchStudents.length === 0 ? (
                <EmptyState
                  title="No students enrolled yet"
                  description="Add students from your institute registry or share the batch code."
                  actionLabel="Add Student"
                  onAction={() => setAddStudentModalVisible(true)}
                />
              ) : (
                batchStudents
                  .filter((s) => s.fullName.toLowerCase().includes(studentSearch.toLowerCase()) || s.school.toLowerCase().includes(studentSearch.toLowerCase()))
                  .map((stud) => (
                    <View
                      key={stud.id}
                      style={{
                        backgroundColor: '#FFFFFF',
                        borderRadius: 14,
                        padding: 14,
                        borderWidth: 1,
                        borderColor: '#E2E8F0',
                        gap: 10,
                      }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                        <View style={{ flex: 1, marginRight: 8 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                            <Badge
                              label={`${stud.attendanceRate}% ATTENDANCE`}
                              variant={stud.attendanceRate >= 90 ? 'success' : 'primary'}
                              size="sm"
                            />
                            <Badge
                              label={stud.feeStatus.toUpperCase()}
                              variant={stud.feeStatus === 'paid' ? 'success' : 'danger'}
                              size="sm"
                            />
                          </View>
                          <Text style={{ fontSize: 14, fontWeight: '800', color: '#0F172A' }}>{stud.fullName}</Text>
                          <Text style={{ fontSize: 11.5, color: '#64748B' }}>{stud.school}</Text>
                        </View>

                        <TouchableOpacity
                          onPress={() => {
                            Alert.alert('Remove Student', `Remove ${stud.fullName} from this batch?`, [
                              { text: 'Cancel', style: 'cancel' },
                              {
                                text: 'Remove',
                                style: 'destructive',
                                onPress: async () => {
                                  await store.removeStudentFromBatch(stud.id, batch.id);
                                  onToast({ type: 'info', message: `${stud.fullName} removed from batch.` });
                                },
                              },
                            ]);
                          }}
                          style={{
                            padding: 6,
                            borderRadius: 6,
                            backgroundColor: '#FEE2E2',
                          }}
                        >
                          <Trash2 size={14} color="#EF4444" />
                        </TouchableOpacity>
                      </View>

                      {/* Parent invite code */}
                      <View
                        style={{
                          backgroundColor: '#F8FAFC',
                          borderRadius: 8,
                          padding: 8,
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <Text style={{ fontSize: 11, color: '#64748B' }}>
                          Parent Link Code: <Text style={{ fontWeight: '800', color: '#0F172A' }}>{stud.parentInviteCode}</Text>
                        </Text>
                        <TouchableOpacity
                          onPress={() => {
                            Share.share({
                              message: `Dear Parent of ${stud.fullName}, monitor class attendance and test marks on Quick2Learn app using parent code: ${stud.parentInviteCode}`,
                            });
                          }}
                        >
                          <Text style={{ fontSize: 11, fontWeight: '700', color: '#2563EB' }}>Share with Parent</Text>
                        </TouchableOpacity>
                      </View>

                      {/* Quick Communication Buttons */}
                      <View style={{ flexDirection: 'row', gap: 6, paddingTop: 2 }}>
                        <TouchableOpacity
                          onPress={() => Linking.openURL(`tel:${stud.phone}`)}
                          style={{
                            flex: 1,
                            backgroundColor: '#F1F5F9',
                            paddingVertical: 7,
                            borderRadius: 8,
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 4,
                          }}
                        >
                          <Phone size={13} color="#2563EB" />
                          <Text style={{ fontSize: 11.5, fontWeight: '700', color: '#2563EB' }}>Call Student</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() => Linking.openURL(`whatsapp://send?phone=${stud.phone}&text=Hello ${stud.fullName}, Quick2Learn Admin update:`)}
                          style={{
                            flex: 1,
                            backgroundColor: '#DCFCE7',
                            paddingVertical: 7,
                            borderRadius: 8,
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 4,
                          }}
                        >
                          <MessageCircle size={13} color="#16A34A" />
                          <Text style={{ fontSize: 11.5, fontWeight: '700', color: '#16A34A' }}>WhatsApp</Text>
                        </TouchableOpacity>

                        {stud.parentPhone && (
                          <TouchableOpacity
                            onPress={() => Linking.openURL(`tel:${stud.parentPhone}`)}
                            style={{
                              flex: 1,
                              backgroundColor: '#EFF6FF',
                              paddingVertical: 7,
                              borderRadius: 8,
                              flexDirection: 'row',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: 4,
                            }}
                          >
                            <Phone size={13} color="#475569" />
                            <Text style={{ fontSize: 11.5, fontWeight: '700', color: '#475569' }}>Call Parent</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  ))
              )}
            </View>
          )}
        </ScrollView>
      </View>

      {/* MODAL 1: ADD VIDEO LECTURE TO THIS BATCH */}
      <AddLectureToBatchModal
        visible={addLectureModalVisible}
        batch={batch}
        onClose={() => setAddLectureModalVisible(false)}
        onSaved={() => {
          setAddLectureModalVisible(false);
          onToast({ type: 'success', message: 'Video lecture added to batch.' });
        }}
      />

      {/* MODAL 2: UPLOAD PDF TO THIS BATCH */}
      <AddResourceToBatchModal
        visible={addResourceModalVisible}
        batch={batch}
        onClose={() => setAddResourceModalVisible(false)}
        onSaved={() => {
          setAddResourceModalVisible(false);
          onToast({ type: 'success', message: 'Study material uploaded to batch.' });
        }}
      />

      {/* MODAL 3: CREATE ASSIGNMENT FOR THIS BATCH */}
      <AddAssignmentToBatchModal
        visible={addAssignmentModalVisible}
        batch={batch}
        onClose={() => setAddAssignmentModalVisible(false)}
        onSaved={() => {
          setAddAssignmentModalVisible(false);
          onToast({ type: 'success', message: 'Assignment created for batch.' });
        }}
      />

      {/* MODAL 4: SCHEDULE LIVE CLASS */}
      <ScheduleLiveToBatchModal
        visible={scheduleLiveModalVisible}
        batch={batch}
        onClose={() => setScheduleLiveModalVisible(false)}
        onSaved={() => {
          setScheduleLiveModalVisible(false);
          onToast({ type: 'success', message: 'Live class scheduled.' });
        }}
      />

      {/* MODAL 5: POST ANNOUNCEMENT TO BATCH */}
      <AddAnnouncementToBatchModal
        visible={addAnnouncementModalVisible}
        batch={batch}
        onClose={() => setAddAnnouncementModalVisible(false)}
        onSaved={() => {
          setAddAnnouncementModalVisible(false);
          onToast({ type: 'success', message: 'Announcement posted to batch notice board.' });
        }}
      />

      {/* MODAL 6: ADD STUDENT FROM REGISTRY */}
      <AddStudentToBatchModal
        visible={addStudentModalVisible}
        batch={batch}
        enrolledStudentIds={batchStudents.map((s) => s.id)}
        onClose={() => setAddStudentModalVisible(false)}
        onSaved={(studName) => {
          setAddStudentModalVisible(false);
          onToast({ type: 'success', message: `${studName} enrolled in ${batch.title}.` });
        }}
      />

      {/* MODAL 7: REVIEW SUBMISSIONS FOR AN ASSIGNMENT */}
      <ReviewSubmissionsModal
        visible={submissionsModalVisible}
        assignment={selectedAssignmentForReview}
        onClose={() => {
          setSubmissionsModalVisible(false);
          setSelectedAssignmentForReview(null);
        }}
        onGraded={() => {
          onToast({ type: 'success', message: 'Submission evaluated successfully.' });
        }}
      />
    </Modal>
  );
}

// -------------------------------------------------------------
// HELPER SUB-COMPONENTS
// -------------------------------------------------------------

function SubTabPill({
  label,
  badge,
  badgeColor,
  isActive,
  onPress,
}: {
  label: string;
  badge?: number | string;
  badgeColor?: string;
  isActive: boolean;
  onPress: () => void;
}) {
  const isLive = badge === 'LIVE';
  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={() => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 7,
        borderRadius: 24,
        backgroundColor: isActive ? '#2563EB' : '#FFFFFF',
        borderWidth: 1,
        borderColor: isActive ? '#1D4ED8' : '#E2E8F0',
        elevation: isActive ? 2 : 1,
        shadowColor: isActive ? '#2563EB' : '#000000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: isActive ? 0.25 : 0.04,
        shadowRadius: 2,
        gap: 6,
      }}
    >
      {isLive && (
        <View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#EF4444' }} />
      )}
      <Text
        style={{
          fontSize: 12.5,
          fontWeight: isActive ? '800' : '600',
          color: isActive ? '#FFFFFF' : '#334155',
        }}
      >
        {label}
      </Text>
      {badge !== undefined && (
        <View
          style={{
            backgroundColor: isLive
              ? '#EF4444'
              : badgeColor || (isActive ? 'rgba(255, 255, 255, 0.25)' : '#F1F5F9'),
            paddingHorizontal: 6,
            paddingVertical: 1.5,
            borderRadius: 10,
          }}
        >
          <Text
            style={{
              fontSize: 10,
              fontWeight: '800',
              color: isLive ? '#FFFFFF' : isActive ? '#FFFFFF' : '#475569',
            }}
          >
            {badge}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

function ActionButton({
  label,
  icon,
  bgColor = '#EFF6FF',
  onPress,
}: {
  label: string;
  icon: React.ReactNode;
  bgColor?: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={() => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        elevation: 1,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 2,
        gap: 10,
        flex: 1,
        minWidth: '47%',
      }}
    >
      <View
        style={{
          width: 34,
          height: 34,
          borderRadius: 10,
          backgroundColor: bgColor,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {icon}
      </View>
      <Text style={{ fontSize: 12.5, fontWeight: '700', color: '#0F172A', flex: 1 }} numberOfLines={1}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

// -------------------------------------------------------------
// SUB-MODALS & FORM HELPERS
// -------------------------------------------------------------

function BatchFormField({
  label,
  value,
  onChangeText,
  placeholder,
  multiline,
  numberOfLines,
  keyboardType,
  autoCapitalize,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  multiline?: boolean;
  numberOfLines?: number;
  keyboardType?: 'default' | 'numeric' | 'email-address' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
}) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={{ fontSize: 12, fontWeight: '700', color: '#334155', letterSpacing: 0.2 }}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#94A3B8"
        multiline={multiline}
        numberOfLines={numberOfLines}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        style={{
          borderWidth: 1.5,
          borderColor: '#E2E8F0',
          borderRadius: 12,
          paddingHorizontal: 14,
          paddingVertical: multiline ? 12 : 11,
          minHeight: multiline ? (numberOfLines ? numberOfLines * 24 : 80) : 46,
          fontSize: 14,
          color: '#0F172A',
          backgroundColor: '#F8FAFC',
          textAlignVertical: multiline ? 'top' : 'center',
        }}
      />
    </View>
  );
}

function AddLectureToBatchModal({
  visible,
  batch,
  onClose,
  onSaved,
}: {
  visible: boolean;
  batch: BatchItem;
  onClose: () => void;
  onSaved: () => void;
}) {
  const insets = useSafeAreaInsets();
  const store = useAdminStore();
  const [title, setTitle] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [chapter, setChapter] = useState('');
  const [duration, setDuration] = useState('45:00');

  const handleSubmit = async () => {
    if (!title.trim() || !youtubeUrl.trim() || !chapter.trim()) {
      Alert.alert('Missing Fields', 'Please enter Title, YouTube URL, and Chapter name.');
      return;
    }
    let ytId = 'sample-yt-id';
    const match = youtubeUrl.match(/(?:youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=)([^#&?]*).*/);
    if (match && match[1]) {
      ytId = match[1];
    }
    await store.addLecture({
      title: title.trim(),
      youtubeId: ytId,
      youtubeUrl: youtubeUrl.trim(),
      subject: batch.subject,
      classLevel: batch.classLevel,
      board: batch.board,
      chapter: chapter.trim(),
      duration: duration.trim() || '45:00',
      orderNo: 1,
      isPublished: true,
      batchId: batch.id,
    });
    setTitle('');
    setYoutubeUrl('');
    setChapter('');
    onSaved();
  };

  const sheetBottomPadding = Math.max(insets.bottom, 16) + 12;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.65)', justifyContent: 'flex-end' }}
      >
        <View
          style={{
            backgroundColor: '#FFFFFF',
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            paddingHorizontal: 20,
            paddingTop: 12,
            paddingBottom: sheetBottomPadding,
            maxHeight: '90%',
            gap: 16,
            shadowColor: '#000000',
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.12,
            shadowRadius: 16,
            elevation: 20,
          }}
        >
          {/* Drag Handle */}
          <View style={{ alignItems: 'center', marginBottom: 2 }}>
            <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: '#CBD5E1' }} />
          </View>

          {/* Header */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, marginRight: 8 }}>
              <View
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 12,
                  backgroundColor: '#EFF6FF',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Video size={20} color="#2563EB" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 17, fontWeight: '800', color: '#0F172A', letterSpacing: -0.2 }}>
                  Add Video Lecture
                </Text>
                <Text style={{ fontSize: 12, color: '#64748B' }} numberOfLines={1}>
                  {batch.title}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onClose();
              }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={{
                width: 34,
                height: 34,
                borderRadius: 17,
                backgroundColor: '#F1F5F9',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <X size={18} color="#475569" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 14 }}>
            <BatchFormField
              label="Lecture Title"
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. Lec 01: Integration by Substitution"
            />

            <BatchFormField
              label="Chapter Name / Folder"
              value={chapter}
              onChangeText={setChapter}
              placeholder="e.g. Integrals"
            />

            <View style={{ gap: 6 }}>
              <BatchFormField
                label="YouTube Video URL"
                value={youtubeUrl}
                onChangeText={setYoutubeUrl}
                placeholder="https://www.youtube.com/watch?v=..."
                autoCapitalize="none"
              />
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 2 }}>
                <Sparkles size={11} color="#64748B" />
                <Text style={{ fontSize: 11, color: '#64748B' }}>
                  Auto-extracts YouTube Video ID and thumbnail
                </Text>
              </View>
            </View>

            <BatchFormField
              label="Duration (mm:ss)"
              value={duration}
              onChangeText={setDuration}
              placeholder="48:30"
            />

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                void handleSubmit();
              }}
              style={{
                backgroundColor: '#2563EB',
                borderRadius: 14,
                paddingVertical: 13,
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: 6,
                flexDirection: 'row',
                gap: 8,
                elevation: 2,
                shadowColor: '#2563EB',
                shadowOffset: { width: 0, height: 3 },
                shadowOpacity: 0.25,
                shadowRadius: 6,
              }}
            >
              <Video size={18} color="#FFFFFF" />
              <Text style={{ fontSize: 15, fontWeight: '800', color: '#FFFFFF' }}>Save Video Lecture</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function AddResourceToBatchModal({
  visible,
  batch,
  onClose,
  onSaved,
}: {
  visible: boolean;
  batch: BatchItem;
  onClose: () => void;
  onSaved: () => void;
}) {
  const insets = useSafeAreaInsets();
  const store = useAdminStore();
  const [title, setTitle] = useState('');
  const [chapter, setChapter] = useState('');
  const [folderName, setFolderName] = useState('Selina Concise Solutions');
  const [fileUrl, setFileUrl] = useState('https://quick2learn.in/assets/sample-exercise.pdf');
  const [pages, setPages] = useState('12');
  const [fileSize, setFileSize] = useState('2.4 MB');
  const [visibility, setVisibility] = useState<'batch_only' | 'public'>('batch_only');

  const handleSubmit = async () => {
    if (!title.trim() || !chapter.trim()) {
      Alert.alert('Missing Fields', 'Please enter Title and Chapter.');
      return;
    }
    await store.uploadResource({
      title: title.trim(),
      type: 'solution',
      fileUrl: fileUrl.trim() || 'https://quick2learn.in/assets/sample-exercise.pdf',
      filePages: parseInt(pages) || 10,
      fileSize: fileSize.trim() || '1.8 MB',
      subject: batch.subject,
      classLevel: batch.classLevel,
      chapter: chapter.trim(),
      folderName: folderName.trim(),
      visibility,
      batchTitle: batch.title,
      batchId: batch.id,
    });
    setTitle('');
    setChapter('');
    onSaved();
  };

  const sheetBottomPadding = Math.max(insets.bottom, 16) + 12;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.65)', justifyContent: 'flex-end' }}
      >
        <View
          style={{
            backgroundColor: '#FFFFFF',
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            paddingHorizontal: 20,
            paddingTop: 12,
            paddingBottom: sheetBottomPadding,
            maxHeight: '90%',
            gap: 16,
            shadowColor: '#000000',
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.12,
            shadowRadius: 16,
            elevation: 20,
          }}
        >
          {/* Drag Handle */}
          <View style={{ alignItems: 'center', marginBottom: 2 }}>
            <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: '#CBD5E1' }} />
          </View>

          {/* Header */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, marginRight: 8 }}>
              <View
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 12,
                  backgroundColor: '#ECFDF5',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <FileUp size={20} color="#059669" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 17, fontWeight: '800', color: '#0F172A', letterSpacing: -0.2 }}>
                  Upload Study Material
                </Text>
                <Text style={{ fontSize: 12, color: '#64748B' }} numberOfLines={1}>
                  PDF document for {batch.title}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onClose();
              }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={{
                width: 34,
                height: 34,
                borderRadius: 17,
                backgroundColor: '#F1F5F9',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <X size={18} color="#475569" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 14 }}>
            {/* Dashed PDF Upload Box */}
            <TouchableOpacity
              activeOpacity={0.75}
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                Alert.alert('PDF Picker', 'Sample document attached: Selina_Maths_Notes.pdf');
              }}
              style={{
                borderWidth: 1.5,
                borderColor: '#10B981',
                borderStyle: 'dashed',
                borderRadius: 16,
                backgroundColor: '#F0FDF4',
                paddingVertical: 18,
                paddingHorizontal: 16,
                alignItems: 'center',
                gap: 6,
              }}
            >
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: '#DCFCE7',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <FileUp size={22} color="#059669" />
              </View>
              <Text style={{ fontSize: 13.5, fontWeight: '800', color: '#065F46' }}>
                Tap to select PDF file from device
              </Text>
              <Text style={{ fontSize: 11, color: '#047857' }}>
                Accepts .pdf (Formula Sheets, DPPs, Notes)
              </Text>
            </TouchableOpacity>

            <BatchFormField
              label="Document Title"
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. EX 4(A) Solutions - Expansions.pdf"
            />

            <BatchFormField
              label="Folder / Book Category"
              value={folderName}
              onChangeText={setFolderName}
              placeholder="e.g. Selina Concise Solutions or NCERT Exemplar"
            />

            <BatchFormField
              label="Chapter Name"
              value={chapter}
              onChangeText={setChapter}
              placeholder="e.g. Expansions"
            />

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <BatchFormField
                  label="Pages"
                  value={pages}
                  onChangeText={setPages}
                  keyboardType="numeric"
                  placeholder="10"
                />
              </View>
              <View style={{ flex: 1 }}>
                <BatchFormField
                  label="File Size"
                  value={fileSize}
                  onChangeText={setFileSize}
                  placeholder="2.4 MB"
                />
              </View>
            </View>

            <View style={{ gap: 6 }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#334155' }}>Access & Visibility</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => {
                    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setVisibility('batch_only');
                  }}
                  style={{
                    flex: 1,
                    paddingVertical: 10,
                    borderRadius: 12,
                    backgroundColor: visibility === 'batch_only' ? '#2563EB' : '#F1F5F9',
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor: visibility === 'batch_only' ? '#1D4ED8' : '#E2E8F0',
                    elevation: visibility === 'batch_only' ? 2 : 0,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12.5,
                      fontWeight: '800',
                      color: visibility === 'batch_only' ? '#FFFFFF' : '#475569',
                    }}
                  >
                    Batch Only
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => {
                    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setVisibility('public');
                  }}
                  style={{
                    flex: 1,
                    paddingVertical: 10,
                    borderRadius: 12,
                    backgroundColor: visibility === 'public' ? '#059669' : '#F1F5F9',
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor: visibility === 'public' ? '#047857' : '#E2E8F0',
                    elevation: visibility === 'public' ? 2 : 0,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12.5,
                      fontWeight: '800',
                      color: visibility === 'public' ? '#FFFFFF' : '#475569',
                    }}
                  >
                    Free Material (Public)
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                void handleSubmit();
              }}
              style={{
                backgroundColor: '#059669',
                borderRadius: 14,
                paddingVertical: 13,
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: 6,
                flexDirection: 'row',
                gap: 8,
                elevation: 2,
                shadowColor: '#059669',
                shadowOffset: { width: 0, height: 3 },
                shadowOpacity: 0.25,
                shadowRadius: 6,
              }}
            >
              <FileUp size={18} color="#FFFFFF" />
              <Text style={{ fontSize: 15, fontWeight: '800', color: '#FFFFFF' }}>Upload Resource</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function AddAssignmentToBatchModal({
  visible,
  batch,
  onClose,
  onSaved,
}: {
  visible: boolean;
  batch: BatchItem;
  onClose: () => void;
  onSaved: () => void;
}) {
  const insets = useSafeAreaInsets();
  const store = useAdminStore();
  const [title, setTitle] = useState('');
  const [chapter, setChapter] = useState('');
  const [dueDate, setDueDate] = useState('2026-10-30');
  const [totalMarks, setTotalMarks] = useState('25');
  const [instructions, setInstructions] = useState('');

  const handleSubmit = async () => {
    if (!title.trim() || !chapter.trim()) {
      Alert.alert('Missing Fields', 'Please enter Title and Chapter.');
      return;
    }
    await store.createAssignment({
      batchId: batch.id,
      batchTitle: batch.title,
      title: title.trim(),
      subject: batch.subject,
      classLevel: batch.classLevel,
      chapter: chapter.trim(),
      dueDate: dueDate.trim() || '2026-10-30',
      totalMarks: parseInt(totalMarks) || 25,
      instructions: instructions.trim() || 'Complete all questions in your homework notebook and submit.',
    });
    setTitle('');
    setChapter('');
    setInstructions('');
    onSaved();
  };

  const sheetBottomPadding = Math.max(insets.bottom, 16) + 12;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.65)', justifyContent: 'flex-end' }}
      >
        <View
          style={{
            backgroundColor: '#FFFFFF',
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            paddingHorizontal: 20,
            paddingTop: 12,
            paddingBottom: sheetBottomPadding,
            maxHeight: '90%',
            gap: 16,
            shadowColor: '#000000',
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.12,
            shadowRadius: 16,
            elevation: 20,
          }}
        >
          {/* Drag Handle */}
          <View style={{ alignItems: 'center', marginBottom: 2 }}>
            <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: '#CBD5E1' }} />
          </View>

          {/* Header */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, marginRight: 8 }}>
              <View
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 12,
                  backgroundColor: '#EFF6FF',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Award size={20} color="#2563EB" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 17, fontWeight: '800', color: '#0F172A', letterSpacing: -0.2 }}>
                  Create Batch Assignment
                </Text>
                <Text style={{ fontSize: 12, color: '#64748B' }} numberOfLines={1}>
                  Homework & DPP for {batch.title}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onClose();
              }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={{
                width: 34,
                height: 34,
                borderRadius: 17,
                backgroundColor: '#F1F5F9',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <X size={18} color="#475569" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 14 }}>
            <BatchFormField
              label="Assignment Title"
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. Chapter 7 Integrals DPP 04"
            />

            <BatchFormField
              label="Chapter Name"
              value={chapter}
              onChangeText={setChapter}
              placeholder="e.g. Integrals"
            />

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <BatchFormField
                  label="Due Date (YYYY-MM-DD)"
                  value={dueDate}
                  onChangeText={setDueDate}
                  placeholder="2026-10-30"
                />
              </View>
              <View style={{ flex: 1 }}>
                <BatchFormField
                  label="Total Marks"
                  value={totalMarks}
                  onChangeText={setTotalMarks}
                  keyboardType="numeric"
                  placeholder="25"
                />
              </View>
            </View>

            <BatchFormField
              label="Instructions / Guidelines"
              value={instructions}
              onChangeText={setInstructions}
              placeholder="Enter guidelines for submission..."
              multiline
              numberOfLines={3}
            />

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                void handleSubmit();
              }}
              style={{
                backgroundColor: '#2563EB',
                borderRadius: 14,
                paddingVertical: 13,
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: 6,
                flexDirection: 'row',
                gap: 8,
                elevation: 2,
                shadowColor: '#2563EB',
                shadowOffset: { width: 0, height: 3 },
                shadowOpacity: 0.25,
                shadowRadius: 6,
              }}
            >
              <Award size={18} color="#FFFFFF" />
              <Text style={{ fontSize: 15, fontWeight: '800', color: '#FFFFFF' }}>Assign to Batch</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function ScheduleLiveToBatchModal({
  visible,
  batch,
  onClose,
  onSaved,
}: {
  visible: boolean;
  batch: BatchItem;
  onClose: () => void;
  onSaved: () => void;
}) {
  const insets = useSafeAreaInsets();
  const store = useAdminStore();
  const [title, setTitle] = useState('');
  const [platform, setPlatform] = useState<'zoom' | 'youtube' | 'meet'>('zoom');
  const [meetingUrl, setMeetingUrl] = useState('https://zoom.us/j/9876543210?pwd=quick2learn');
  const [meetingId, setMeetingId] = useState('987 654 3210');
  const [passcode, setPasscode] = useState('MATH100');
  const [duration, setDuration] = useState('60 min');

  const handleSubmit = async () => {
    if (!title.trim() || !meetingUrl.trim()) {
      Alert.alert('Missing Fields', 'Please enter Title and Meeting Link.');
      return;
    }
    await store.scheduleLiveClass({
      batchId: batch.id,
      batchTitle: batch.title,
      title: title.trim(),
      subject: batch.subject,
      classLevel: batch.classLevel,
      faculty: batch.faculty,
      platform,
      meetingUrl: meetingUrl.trim(),
      meetingId: meetingId.trim(),
      passcode: passcode.trim(),
      scheduledAt: new Date().toISOString(),
      duration: duration.trim() || '60 min',
    });
    setTitle('');
    onSaved();
  };

  const sheetBottomPadding = Math.max(insets.bottom, 16) + 12;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.65)', justifyContent: 'flex-end' }}
      >
        <View
          style={{
            backgroundColor: '#FFFFFF',
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            paddingHorizontal: 20,
            paddingTop: 12,
            paddingBottom: sheetBottomPadding,
            maxHeight: '90%',
            gap: 16,
            shadowColor: '#000000',
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.12,
            shadowRadius: 16,
            elevation: 20,
          }}
        >
          {/* Drag Handle */}
          <View style={{ alignItems: 'center', marginBottom: 2 }}>
            <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: '#CBD5E1' }} />
          </View>

          {/* Header */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, marginRight: 8 }}>
              <View
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 12,
                  backgroundColor: '#FEF2F2',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Radio size={20} color="#EF4444" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 17, fontWeight: '800', color: '#0F172A', letterSpacing: -0.2 }}>
                  Schedule Live Class
                </Text>
                <Text style={{ fontSize: 12, color: '#64748B' }} numberOfLines={1}>
                  Online lecture for {batch.title}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onClose();
              }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={{
                width: 34,
                height: 34,
                borderRadius: 17,
                backgroundColor: '#F1F5F9',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <X size={18} color="#475569" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 14 }}>
            <BatchFormField
              label="Live Topic / Title"
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. Live Doubt Clearing & Problem Solving"
            />

            {/* Platform Selector */}
            <View style={{ gap: 6 }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#334155' }}>Live Platform</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {[
                  { id: 'zoom' as const, label: 'ZOOM', color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE' },
                  { id: 'youtube' as const, label: 'YOUTUBE', color: '#DC2626', bg: '#FEF2F2', border: '#FECDD3' },
                  { id: 'meet' as const, label: 'MEET', color: '#059669', bg: '#ECFDF5', border: '#A7F3D0' },
                ].map((item) => {
                  const isSelected = platform === item.id;
                  return (
                    <TouchableOpacity
                      key={item.id}
                      activeOpacity={0.8}
                      onPress={() => {
                        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setPlatform(item.id);
                      }}
                      style={{
                        flex: 1,
                        paddingVertical: 10,
                        borderRadius: 12,
                        backgroundColor: isSelected ? item.color : '#F1F5F9',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderWidth: 1,
                        borderColor: isSelected ? item.color : '#E2E8F0',
                        elevation: isSelected ? 2 : 0,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: '800',
                          color: isSelected ? '#FFFFFF' : '#475569',
                          letterSpacing: 0.4,
                        }}
                      >
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <BatchFormField
              label="Meeting / Stream URL"
              value={meetingUrl}
              onChangeText={setMeetingUrl}
              placeholder="https://zoom.us/... or YouTube Live URL"
              autoCapitalize="none"
            />

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <BatchFormField
                  label="Meeting ID"
                  value={meetingId}
                  onChangeText={setMeetingId}
                  placeholder="987 654 3210"
                />
              </View>
              <View style={{ flex: 1 }}>
                <BatchFormField
                  label="Passcode"
                  value={passcode}
                  onChangeText={setPasscode}
                  placeholder="MATH100"
                />
              </View>
            </View>

            <BatchFormField
              label="Duration"
              value={duration}
              onChangeText={setDuration}
              placeholder="60 min"
            />

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                void handleSubmit();
              }}
              style={{
                backgroundColor: '#2563EB',
                borderRadius: 14,
                paddingVertical: 13,
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: 6,
                flexDirection: 'row',
                gap: 8,
                elevation: 2,
                shadowColor: '#2563EB',
                shadowOffset: { width: 0, height: 3 },
                shadowOpacity: 0.25,
                shadowRadius: 6,
              }}
            >
              <Radio size={18} color="#FFFFFF" />
              <Text style={{ fontSize: 15, fontWeight: '800', color: '#FFFFFF' }}>Schedule Live Lecture</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function AddAnnouncementToBatchModal({
  visible,
  batch,
  onClose,
  onSaved,
}: {
  visible: boolean;
  batch: BatchItem;
  onClose: () => void;
  onSaved: () => void;
}) {
  const insets = useSafeAreaInsets();
  const store = useAdminStore();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [priority, setPriority] = useState<'normal' | 'urgent'>('normal');

  const handleSubmit = async () => {
    if (!title.trim() || !body.trim()) {
      Alert.alert('Missing Fields', 'Please enter Title and Message.');
      return;
    }
    await store.createAnnouncement({
      title: title.trim(),
      body: body.trim(),
      priority,
      targetAudience: batch.title,
      authorName: `${batch.faculty} (Quick2Learn Admin)`,
    });
    setTitle('');
    setBody('');
    onSaved();
  };

  const sheetBottomPadding = Math.max(insets.bottom, 16) + 12;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.65)', justifyContent: 'flex-end' }}
      >
        <View
          style={{
            backgroundColor: '#FFFFFF',
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            paddingHorizontal: 20,
            paddingTop: 12,
            paddingBottom: sheetBottomPadding,
            maxHeight: '90%',
            gap: 16,
            shadowColor: '#000000',
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.12,
            shadowRadius: 16,
            elevation: 20,
          }}
        >
          {/* Drag Handle */}
          <View style={{ alignItems: 'center', marginBottom: 2 }}>
            <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: '#CBD5E1' }} />
          </View>

          {/* Header */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, marginRight: 8 }}>
              <View
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 12,
                  backgroundColor: '#EFF6FF',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Send size={20} color="#2563EB" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 17, fontWeight: '800', color: '#0F172A', letterSpacing: -0.2 }}>
                  Post Batch Notice
                </Text>
                <Text style={{ fontSize: 12, color: '#64748B' }} numberOfLines={1}>
                  Broadcast alert to {batch.title}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onClose();
              }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={{
                width: 34,
                height: 34,
                borderRadius: 17,
                backgroundColor: '#F1F5F9',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <X size={18} color="#475569" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 14 }}>
            <BatchFormField
              label="Notice Title"
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. Unit Test 02 on Saturday 10:00 AM"
            />

            {/* Priority Selector */}
            <View style={{ gap: 6 }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#334155' }}>Priority Level</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => {
                    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setPriority('normal');
                  }}
                  style={{
                    flex: 1,
                    paddingVertical: 10,
                    borderRadius: 12,
                    backgroundColor: priority === 'normal' ? '#2563EB' : '#F1F5F9',
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor: priority === 'normal' ? '#1D4ED8' : '#E2E8F0',
                    elevation: priority === 'normal' ? 2 : 0,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12.5,
                      fontWeight: '800',
                      color: priority === 'normal' ? '#FFFFFF' : '#475569',
                    }}
                  >
                    NORMAL
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => {
                    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setPriority('urgent');
                  }}
                  style={{
                    flex: 1,
                    paddingVertical: 10,
                    borderRadius: 12,
                    backgroundColor: priority === 'urgent' ? '#EF4444' : '#F1F5F9',
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor: priority === 'urgent' ? '#DC2626' : '#E2E8F0',
                    elevation: priority === 'urgent' ? 2 : 0,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12.5,
                      fontWeight: '800',
                      color: priority === 'urgent' ? '#FFFFFF' : '#475569',
                    }}
                  >
                    URGENT / ALERT
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <BatchFormField
              label="Notice Message"
              value={body}
              onChangeText={setBody}
              placeholder="Write notice details for students..."
              multiline
              numberOfLines={4}
            />

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                void handleSubmit();
              }}
              style={{
                backgroundColor: priority === 'urgent' ? '#EF4444' : '#2563EB',
                borderRadius: 14,
                paddingVertical: 13,
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: 6,
                flexDirection: 'row',
                gap: 8,
                elevation: 2,
                shadowColor: priority === 'urgent' ? '#EF4444' : '#2563EB',
                shadowOffset: { width: 0, height: 3 },
                shadowOpacity: 0.25,
                shadowRadius: 6,
              }}
            >
              <Send size={18} color="#FFFFFF" />
              <Text style={{ fontSize: 15, fontWeight: '800', color: '#FFFFFF' }}>Broadcast to Batch</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function AddStudentToBatchModal({
  visible,
  batch,
  enrolledStudentIds,
  onClose,
  onSaved,
}: {
  visible: boolean;
  batch: BatchItem;
  enrolledStudentIds: string[];
  onClose: () => void;
  onSaved: (name: string) => void;
}) {
  const insets = useSafeAreaInsets();
  const store = useAdminStore();
  const [search, setSearch] = useState('');
  const availableStudents = useMemo(() => {
    return store.students.filter((s) => {
      const notEnrolled = !enrolledStudentIds.includes(s.id);
      if (!notEnrolled) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        s.fullName.toLowerCase().includes(q) ||
        s.school.toLowerCase().includes(q) ||
        s.phone.includes(q)
      );
    });
  }, [store.students, enrolledStudentIds, search]);

  const sheetBottomPadding = Math.max(insets.bottom, 16) + 12;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.65)', justifyContent: 'flex-end' }}>
        <View
          style={{
            backgroundColor: '#FFFFFF',
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            paddingHorizontal: 20,
            paddingTop: 12,
            paddingBottom: sheetBottomPadding,
            maxHeight: '85%',
            gap: 16,
            shadowColor: '#000000',
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.12,
            shadowRadius: 16,
            elevation: 20,
          }}
        >
          {/* Drag Handle */}
          <View style={{ alignItems: 'center', marginBottom: 2 }}>
            <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: '#CBD5E1' }} />
          </View>

          {/* Header */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, marginRight: 8 }}>
              <View
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 12,
                  backgroundColor: '#EFF6FF',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Users size={20} color="#2563EB" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 17, fontWeight: '800', color: '#0F172A', letterSpacing: -0.2 }}>
                  Enroll Student
                </Text>
                <Text style={{ fontSize: 12, color: '#64748B' }} numberOfLines={1}>
                  Select from directory for {batch.title}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onClose();
              }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={{
                width: 34,
                height: 34,
                borderRadius: 17,
                backgroundColor: '#F1F5F9',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <X size={18} color="#475569" />
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#F8FAFC',
              borderRadius: 12,
              paddingHorizontal: 12,
              borderWidth: 1.5,
              borderColor: '#E2E8F0',
            }}
          >
            <Search size={16} color="#64748B" />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search student by name or school..."
              placeholderTextColor="#94A3B8"
              style={{
                flex: 1,
                paddingVertical: 10,
                paddingHorizontal: 8,
                fontSize: 13,
                color: '#0F172A',
              }}
            />
          </View>

          {/* Students List */}
          <ScrollView style={{ maxHeight: 350 }} contentContainerStyle={{ gap: 8 }}>
            {availableStudents.length === 0 ? (
              <View style={{ paddingVertical: 32, alignItems: 'center', gap: 6 }}>
                <Text style={{ fontSize: 13.5, fontWeight: '700', color: '#475569', textAlign: 'center' }}>
                  {search ? 'No matching students found' : 'All institute students enrolled!'}
                </Text>
                <Text style={{ fontSize: 11.5, color: '#94A3B8', textAlign: 'center' }}>
                  {search ? 'Try searching a different name or clear the search' : 'Every student in your registry is already in this batch.'}
                </Text>
              </View>
            ) : (
              availableStudents.map((stud) => (
                <View
                  key={stud.id}
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: 14,
                    padding: 12,
                    borderWidth: 1,
                    borderColor: '#E2E8F0',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    elevation: 1,
                    shadowColor: '#000000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.04,
                    shadowRadius: 2,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, marginRight: 8 }}>
                    <View
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 19,
                        backgroundColor: '#EFF6FF',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderWidth: 1,
                        borderColor: '#DBEAFE',
                      }}
                    >
                      <Text style={{ fontSize: 14, fontWeight: '800', color: '#2563EB' }}>
                        {stud.fullName.charAt(0)}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 13.5, fontWeight: '800', color: '#0F172A' }}>{stud.fullName}</Text>
                      <Text style={{ fontSize: 11, color: '#64748B' }}>
                        Class {stud.classLevel} • {stud.school}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={async () => {
                      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      await store.addStudentToBatch(stud.id, batch.id);
                      onSaved(stud.fullName);
                    }}
                    style={{
                      backgroundColor: '#2563EB',
                      paddingHorizontal: 14,
                      paddingVertical: 8,
                      borderRadius: 10,
                      elevation: 1,
                    }}
                  >
                    <Text style={{ fontSize: 12, fontWeight: '800', color: '#FFFFFF' }}>Enroll</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function ReviewSubmissionsModal({
  visible,
  assignment,
  onClose,
  onGraded,
}: {
  visible: boolean;
  assignment: AdminAssignmentItem | null;
  onClose: () => void;
  onGraded: () => void;
}) {
  const insets = useSafeAreaInsets();
  const store = useAdminStore();
  const [gradingMarks, setGradingMarks] = useState<Record<string, string>>({});
  const [gradingRemarks, setGradingRemarks] = useState<Record<string, string>>({});

  if (!assignment) return null;

  const sheetBottomPadding = Math.max(insets.bottom, 16) + 12;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.65)', justifyContent: 'flex-end' }}>
        <View
          style={{
            backgroundColor: '#FFFFFF',
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            paddingHorizontal: 20,
            paddingTop: 12,
            paddingBottom: sheetBottomPadding,
            maxHeight: '85%',
            gap: 16,
            shadowColor: '#000000',
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.12,
            shadowRadius: 16,
            elevation: 20,
          }}
        >
          {/* Drag Handle */}
          <View style={{ alignItems: 'center', marginBottom: 2 }}>
            <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: '#CBD5E1' }} />
          </View>

          {/* Header */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, marginRight: 8 }}>
              <View
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 12,
                  backgroundColor: '#EFF6FF',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Award size={20} color="#2563EB" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 17, fontWeight: '800', color: '#0F172A', letterSpacing: -0.2 }}>
                  Submissions Review
                </Text>
                <Text style={{ fontSize: 12, color: '#64748B' }} numberOfLines={1}>
                  {assignment.title} (Max {assignment.totalMarks} Marks)
                </Text>
              </View>
            </View>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onClose();
              }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={{
                width: 34,
                height: 34,
                borderRadius: 17,
                backgroundColor: '#F1F5F9',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <X size={18} color="#475569" />
            </TouchableOpacity>
          </View>

          <ScrollView style={{ maxHeight: 420 }} contentContainerStyle={{ gap: 12 }}>
            {assignment.submissions.length === 0 ? (
              <View style={{ paddingVertical: 32, alignItems: 'center', gap: 6 }}>
                <Text style={{ fontSize: 13.5, fontWeight: '700', color: '#475569', textAlign: 'center' }}>
                  No student submissions uploaded yet
                </Text>
                <Text style={{ fontSize: 11.5, color: '#94A3B8', textAlign: 'center' }}>
                  When students submit solutions on their mobile app, they will appear here for grading.
                </Text>
              </View>
            ) : (
              assignment.submissions.map((sub) => {
                const currentScore =
                  gradingMarks[sub.id] ?? (sub.marksObtained !== undefined ? sub.marksObtained.toString() : '');
                const currentRemark = gradingRemarks[sub.id] ?? (sub.remarks || '');

                return (
                  <View
                    key={sub.id}
                    style={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: 14,
                      padding: 14,
                      borderWidth: 1.5,
                      borderColor: '#E2E8F0',
                      gap: 10,
                      elevation: 1,
                      shadowColor: '#000000',
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.04,
                      shadowRadius: 2,
                    }}
                  >
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={{ fontSize: 14, fontWeight: '800', color: '#0F172A' }}>{sub.studentName}</Text>
                      <Badge
                        label={sub.status.toUpperCase()}
                        variant={sub.status === 'evaluated' ? 'success' : 'warning'}
                        size="sm"
                      />
                    </View>
                    <Text style={{ fontSize: 11, color: '#64748B' }}>
                      Submitted at: {new Date(sub.submittedAt).toLocaleString('en-IN')}
                    </Text>

                    {/* Marks & Remarks Input */}
                    <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center', marginTop: 2 }}>
                      <View style={{ width: 110 }}>
                        <Text style={{ fontSize: 10.5, fontWeight: '700', color: '#475569', marginBottom: 4 }}>
                          Score (/{assignment.totalMarks})
                        </Text>
                        <TextInput
                          value={currentScore}
                          onChangeText={(val) => setGradingMarks((prev) => ({ ...prev, [sub.id]: val }))}
                          keyboardType="numeric"
                          placeholder="Marks"
                          style={{
                            borderWidth: 1.5,
                            borderColor: '#E2E8F0',
                            borderRadius: 10,
                            paddingHorizontal: 10,
                            paddingVertical: 7,
                            fontSize: 13,
                            backgroundColor: '#F8FAFC',
                            color: '#0F172A',
                            fontWeight: '700',
                          }}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 10.5, fontWeight: '700', color: '#475569', marginBottom: 4 }}>
                          Teacher Feedback
                        </Text>
                        <TextInput
                          value={currentRemark}
                          onChangeText={(val) => setGradingRemarks((prev) => ({ ...prev, [sub.id]: val }))}
                          placeholder="Remarks..."
                          placeholderTextColor="#94A3B8"
                          style={{
                            borderWidth: 1.5,
                            borderColor: '#E2E8F0',
                            borderRadius: 10,
                            paddingHorizontal: 10,
                            paddingVertical: 7,
                            fontSize: 13,
                            backgroundColor: '#F8FAFC',
                            color: '#0F172A',
                          }}
                        />
                      </View>
                    </View>

                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={async () => {
                        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        const marksNum = parseInt(currentScore) || 0;
                        await store.gradeAssignmentSubmission(assignment.id, sub.id, marksNum, currentRemark);
                        onGraded();
                      }}
                      style={{
                        backgroundColor: '#059669',
                        paddingVertical: 10,
                        borderRadius: 10,
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginTop: 4,
                        flexDirection: 'row',
                        gap: 6,
                      }}
                    >
                      <Check size={14} color="#FFFFFF" strokeWidth={2.5} />
                      <Text style={{ fontSize: 12.5, fontWeight: '800', color: '#FFFFFF' }}>
                        Save Grade & Feedback
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              })
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
