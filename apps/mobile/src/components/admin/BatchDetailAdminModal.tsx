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
} from 'react-native';
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
  onToast: (toast: { type: 'success' | 'error' | 'info'; message: string }) => void;
}

export function BatchDetailAdminModal({
  visible,
  batch,
  onClose,
  onEditBatch,
  onToast,
}: BatchDetailAdminModalProps) {
  const store = useAdminStore();
  const [activeTab, setActiveTab] = useState<BatchDetailTab>('overview');

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

  if (!batch) return null;

  // Filter batch specific data
  const batchLectures = store.lectures.filter(
    (l) => l.batchId === batch.id || (l.subject.toLowerCase() === batch.subject.toLowerCase() && l.classLevel === batch.classLevel)
  );
  const batchResources = store.resources.filter(
    (r) => r.batchId === batch.id || r.batchTitle === batch.title || (r.subject.toLowerCase() === batch.subject.toLowerCase() && r.classLevel === batch.classLevel)
  );
  const batchAssignments = store.assignments.filter(
    (a) => a.batchId === batch.id || a.batchTitle === batch.title
  );
  const batchLiveClasses = store.liveClasses.filter(
    (l) => l.batchId === batch.id || l.batchTitle === batch.title
  );
  const activeLiveClass = batchLiveClasses.find((l) => l.isLive);
  const batchTests = store.tests.filter(
    (t) => t.subject.toLowerCase() === batch.subject.toLowerCase() && t.classLevel === batch.classLevel
  );
  const batchAnnouncements = store.announcements.filter(
    (a) => a.targetAudience.includes(batch.title) || a.targetAudience.includes('All Batches')
  );
  const batchStudents = store.students.filter(
    (s) => s.enrolledBatchIds.includes(batch.id) || s.enrolledBatchNames.includes(batch.title)
  );

  // Load attendance record whenever date or batch changes
  const currentAttendanceRecord = store.attendanceRecords.find(
    (r) => r.batchId === batch.id && r.date === attendanceDate
  );

  // Sync attendance record when record loads
  React.useEffect(() => {
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
  }, [batch.id, attendanceDate, currentAttendanceRecord?.savedAt, batchStudents.length]);

  // Video chapters grouping
  const videoChapters = useMemo(() => {
    const chapters = Array.from(new Set(batchLectures.map((l) => l.chapter)));
    return chapters;
  }, [batchLectures]);

  const filteredLectures = useMemo(() => {
    if (!selectedVideoChapter) return batchLectures;
    return batchLectures.filter((l) => l.chapter === selectedVideoChapter);
  }, [batchLectures, selectedVideoChapter]);

  // Material folders grouping
  const materialFolders = useMemo(() => {
    const folders = Array.from(
      new Set(batchResources.map((r) => r.folderName || r.chapter || 'Class Study Material'))
    );
    return folders;
  }, [batchResources]);

  const filteredResources = useMemo(() => {
    if (!selectedMaterialFolder) return batchResources;
    return batchResources.filter(
      (r) => (r.folderName || r.chapter || 'Class Study Material') === selectedMaterialFolder
    );
  }, [batchResources, selectedMaterialFolder]);

  // Handle Save Attendance
  const handleSaveAttendance = async () => {
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

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
        {/* HEADER BAR */}
        <View
          style={{
            backgroundColor: '#FFFFFF',
            borderBottomWidth: 1,
            borderBottomColor: '#E2E8F0',
            paddingTop: Platform.OS === 'ios' ? 12 : 16,
            paddingBottom: 8,
            paddingHorizontal: 16,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <TouchableOpacity
              onPress={onClose}
              style={{
                width: 38,
                height: 38,
                borderRadius: 19,
                backgroundColor: '#F1F5F9',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ArrowLeft size={18} color="#0F172A" />
            </TouchableOpacity>

            <View style={{ flex: 1, marginHorizontal: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={{ fontSize: 16, fontWeight: '800', color: '#0F172A' }} numberOfLines={1}>
                  {batch.title}
                </Text>
              </View>
              <Text style={{ fontSize: 11.5, color: '#64748B' }}>
                {batch.subject} • {batch.faculty}
              </Text>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <TouchableOpacity
                onPress={() => onEditBatch(batch)}
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 19,
                  backgroundColor: '#EFF6FF',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Edit3 size={17} color="#2563EB" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={onClose}
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 19,
                  backgroundColor: '#F1F5F9',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={18} color="#64748B" />
              </TouchableOpacity>
            </View>
          </View>

          {/* SUB-TABS ROW (Classplus 8 Tabs) */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 6, paddingTop: 12, paddingBottom: 4 }}
          >
            <SubTabPill
              label="Overview"
              isActive={activeTab === 'overview'}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setActiveTab('overview');
              }}
            />
            <SubTabPill
              label="Videos"
              badge={batchLectures.length}
              isActive={activeTab === 'videos'}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setActiveTab('videos');
              }}
            />
            <SubTabPill
              label="Study Material"
              badge={batchResources.length}
              isActive={activeTab === 'materials'}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setActiveTab('materials');
              }}
            />
            <SubTabPill
              label="Assignments"
              badge={batchAssignments.length}
              isActive={activeTab === 'assignments'}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setActiveTab('assignments');
              }}
            />
            <SubTabPill
              label="Announcements"
              badge={batchAnnouncements.length}
              isActive={activeTab === 'announcements'}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setActiveTab('announcements');
              }}
            />
            <SubTabPill
              label="Tests"
              badge={batchTests.length}
              isActive={activeTab === 'tests'}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setActiveTab('tests');
              }}
            />
            <SubTabPill
              label="Live Classes"
              badge={activeLiveClass ? 'LIVE' : batchLiveClasses.length}
              badgeColor={activeLiveClass ? '#EF4444' : undefined}
              isActive={activeTab === 'live'}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setActiveTab('live');
              }}
            />
            <SubTabPill
              label="Attendance"
              isActive={activeTab === 'attendance'}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setActiveTab('attendance');
              }}
            />
            <SubTabPill
              label="Students"
              badge={batchStudents.length}
              isActive={activeTab === 'students'}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setActiveTab('students');
              }}
            />
          </ScrollView>
        </View>

        {/* TAB CONTENTS */}
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 14, paddingBottom: 60 }}>
          {/* 1. OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <View style={{ gap: 12 }}>
              {/* LIVE CLASS BANNER (Matching Classplus "Join your live class now") */}
              {activeLiveClass ? (
                <View
                  style={{
                    backgroundColor: '#FEF2F2',
                    borderRadius: 16,
                    padding: 14,
                    borderWidth: 1.5,
                    borderColor: '#F87171',
                    gap: 10,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#EF4444' }} />
                      <Text style={{ fontSize: 13, fontWeight: '900', color: '#B91C1C', letterSpacing: 0.5 }}>
                        LIVE CLASS IN PROGRESS
                      </Text>
                    </View>
                    <Badge label={activeLiveClass.platform.toUpperCase()} variant="danger" size="sm" />
                  </View>
                  <Text style={{ fontSize: 15, fontWeight: '800', color: '#7F1D1D' }}>
                    {activeLiveClass.title}
                  </Text>
                  <Text style={{ fontSize: 12, color: '#991B1B' }}>
                    Faculty: {activeLiveClass.faculty} • {activeLiveClass.duration}
                  </Text>
                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
                    <TouchableOpacity
                      onPress={() => Linking.openURL(activeLiveClass.meetingUrl)}
                      style={{
                        flex: 1,
                        backgroundColor: '#EF4444',
                        paddingVertical: 10,
                        borderRadius: 10,
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexDirection: 'row',
                        gap: 6,
                      }}
                    >
                      <Radio size={16} color="#FFFFFF" />
                      <Text style={{ fontSize: 13, fontWeight: '800', color: '#FFFFFF' }}>Join Live Class Now</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
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
                        backgroundColor: '#FEE2E2',
                        paddingHorizontal: 12,
                        paddingVertical: 10,
                        borderRadius: 10,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Text style={{ fontSize: 12, fontWeight: '700', color: '#B91C1C' }}>End</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <TouchableOpacity
                  onPress={() => setScheduleLiveModalVisible(true)}
                  style={{
                    backgroundColor: '#EFF6FF',
                    borderRadius: 14,
                    padding: 12,
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
                        width: 36,
                        height: 36,
                        borderRadius: 18,
                        backgroundColor: '#DBEAFE',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Video size={18} color="#2563EB" />
                    </View>
                    <View>
                      <Text style={{ fontSize: 13, fontWeight: '800', color: '#1E3A8A' }}>
                        Schedule or Go Live Now
                      </Text>
                      <Text style={{ fontSize: 11, color: '#3B82F6' }}>
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
                  borderRadius: 16,
                  padding: 16,
                  borderWidth: 1,
                  borderColor: '#E2E8F0',
                  gap: 12,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 14, fontWeight: '800', color: '#0F172A' }}>Batch Information</Text>
                  <Badge
                    label={batch.status.toUpperCase()}
                    variant={batch.status === 'ongoing' ? 'success' : 'neutral'}
                    size="sm"
                  />
                </View>

                {/* Batch Code Banner with Copy */}
                <View
                  style={{
                    backgroundColor: '#F8FAFC',
                    borderRadius: 12,
                    padding: 12,
                    borderWidth: 1,
                    borderColor: '#E2E8F0',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <View>
                    <Text style={{ fontSize: 10, fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase' }}>
                      Batch Join Code
                    </Text>
                    <Text style={{ fontSize: 16, fontWeight: '900', color: '#0F172A', letterSpacing: 1 }}>
                      {batch.joinCode}
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    <TouchableOpacity
                      onPress={() => {
                        Share.share({
                          message: `Join ${batch.title} at Quick2Learn using Batch Code: ${batch.joinCode}`,
                        });
                      }}
                      style={{
                        paddingHorizontal: 10,
                        paddingVertical: 6,
                        borderRadius: 8,
                        backgroundColor: '#EFF6FF',
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <Share2 size={13} color="#2563EB" />
                      <Text style={{ fontSize: 11.5, fontWeight: '700', color: '#2563EB' }}>Share</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={async () => {
                        const newCode = await store.regenerateJoinCode(batch.id);
                        onToast({ type: 'info', message: `Regenerated new code: ${newCode}` });
                      }}
                      style={{
                        paddingHorizontal: 8,
                        paddingVertical: 6,
                        borderRadius: 8,
                        backgroundColor: '#F1F5F9',
                      }}
                    >
                      <Text style={{ fontSize: 11, fontWeight: '700', color: '#475569' }}>Refresh</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Faculty & Schedule */}
                <View style={{ gap: 8 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Users size={15} color="#64748B" />
                    <Text style={{ fontSize: 12.5, color: '#334155' }}>
                      <Text style={{ fontWeight: '700' }}>Faculty: </Text>
                      {batch.faculty}
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Calendar size={15} color="#64748B" />
                    <Text style={{ fontSize: 12.5, color: '#334155' }}>
                      <Text style={{ fontWeight: '700' }}>Schedule: </Text>
                      {batch.scheduleDays.join(', ')} • {batch.scheduleTime}
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <School size={15} color="#64748B" />
                    <Text style={{ fontSize: 12.5, color: '#334155' }}>
                      <Text style={{ fontWeight: '700' }}>Location: </Text>
                      {batch.room}
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Clock size={15} color="#64748B" />
                    <Text style={{ fontSize: 12.5, color: '#334155' }}>
                      <Text style={{ fontWeight: '700' }}>Session Duration: </Text>
                      {batch.startDate} to {batch.endDate}
                    </Text>
                  </View>
                </View>

                {/* KPI stats grid */}
                <View
                  style={{
                    flexDirection: 'row',
                    gap: 10,
                    paddingTop: 8,
                    borderTopWidth: 1,
                    borderTopColor: '#F1F5F9',
                  }}
                >
                  <View
                    style={{
                      flex: 1,
                      backgroundColor: '#F8FAFC',
                      padding: 10,
                      borderRadius: 10,
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ fontSize: 10, color: '#64748B', fontWeight: '700' }}>STUDENTS</Text>
                    <Text style={{ fontSize: 15, fontWeight: '800', color: '#0F172A', marginTop: 2 }}>
                      {batchStudents.length} / {batch.capacity}
                    </Text>
                  </View>
                  <View
                    style={{
                      flex: 1,
                      backgroundColor: '#F8FAFC',
                      padding: 10,
                      borderRadius: 10,
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ fontSize: 10, color: '#64748B', fontWeight: '700' }}>FEE</Text>
                    <Text style={{ fontSize: 15, fontWeight: '800', color: '#0F172A', marginTop: 2 }}>
                      ₹{batch.fee.toLocaleString('en-IN')}
                    </Text>
                  </View>
                  <View
                    style={{
                      flex: 1,
                      backgroundColor: '#F8FAFC',
                      padding: 10,
                      borderRadius: 10,
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ fontSize: 10, color: '#64748B', fontWeight: '700' }}>MODE</Text>
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: '800',
                        color: batch.mode === 'offline' ? '#16A34A' : '#2563EB',
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
              <View style={{ gap: 8 }}>
                <Text style={{ fontSize: 13, fontWeight: '800', color: '#475569', textTransform: 'uppercase' }}>
                  Quick Batch Actions
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  <ActionButton
                    label="+ Add Video"
                    icon={<Video size={14} color="#2563EB" />}
                    onPress={() => setAddLectureModalVisible(true)}
                  />
                  <ActionButton
                    label="+ Upload Notes"
                    icon={<FileText size={14} color="#2563EB" />}
                    onPress={() => setAddResourceModalVisible(true)}
                  />
                  <ActionButton
                    label="+ Homework"
                    icon={<BookOpen size={14} color="#2563EB" />}
                    onPress={() => setAddAssignmentModalVisible(true)}
                  />
                  <ActionButton
                    label="Mark Attendance"
                    icon={<CheckCircle2 size={14} color="#16A34A" />}
                    onPress={() => setActiveTab('attendance')}
                  />
                  <ActionButton
                    label="+ Post Notice"
                    icon={<Send size={14} color="#2563EB" />}
                    onPress={() => setAddAnnouncementModalVisible(true)}
                  />
                  <ActionButton
                    label="+ Add Student"
                    icon={<Users size={14} color="#2563EB" />}
                    onPress={() => setAddStudentModalVisible(true)}
                  />
                </View>
              </View>

              {/* RECENT BATCH ANNOUNCEMENTS */}
              <View
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: 16,
                  padding: 16,
                  borderWidth: 1,
                  borderColor: '#E2E8F0',
                  gap: 10,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 14, fontWeight: '800', color: '#0F172A' }}>Recent Notices</Text>
                  <TouchableOpacity onPress={() => setActiveTab('announcements')}>
                    <Text style={{ fontSize: 11.5, fontWeight: '700', color: '#2563EB' }}>View All ({batchAnnouncements.length})</Text>
                  </TouchableOpacity>
                </View>
                {batchAnnouncements.length === 0 ? (
                  <Text style={{ fontSize: 12, color: '#94A3B8', fontStyle: 'italic' }}>
                    No announcements posted for this batch yet.
                  </Text>
                ) : (
                  batchAnnouncements.slice(0, 2).map((a) => (
                    <View
                      key={a.id}
                      style={{
                        backgroundColor: '#F8FAFC',
                        borderRadius: 10,
                        padding: 10,
                        borderLeftWidth: 3,
                        borderLeftColor: a.priority === 'urgent' ? '#EF4444' : '#2563EB',
                      }}
                    >
                      <Text style={{ fontSize: 12.5, fontWeight: '800', color: '#0F172A' }}>{a.title}</Text>
                      <Text style={{ fontSize: 11.5, color: '#475569', marginTop: 2 }} numberOfLines={2}>
                        {a.body}
                      </Text>
                      <Text style={{ fontSize: 10, color: '#94A3B8', marginTop: 4 }}>
                        {new Date(a.createdAt).toLocaleDateString('en-IN')} • By {a.authorName}
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
            <View style={{ gap: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View>
                  <Text style={{ fontSize: 15, fontWeight: '800', color: '#0F172A' }}>Live Lectures Console</Text>
                  <Text style={{ fontSize: 11.5, color: '#64748B' }}>
                    Zoom, YouTube Live & Google Meet sessions
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setScheduleLiveModalVisible(true)}
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
                  <Text style={{ fontSize: 12, fontWeight: '800', color: '#FFFFFF' }}>Schedule Live</Text>
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
                batchLiveClasses.map((live) => (
                  <View
                    key={live.id}
                    style={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: 14,
                      padding: 14,
                      borderWidth: 1,
                      borderColor: live.isLive ? '#F87171' : '#E2E8F0',
                      gap: 10,
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Badge
                        label={live.isLive ? 'LIVE NOW' : 'SCHEDULED'}
                        variant={live.isLive ? 'danger' : 'primary'}
                        size="sm"
                      />
                      <Badge label={live.platform.toUpperCase()} variant="neutral" size="sm" />
                    </View>

                    <Text style={{ fontSize: 14.5, fontWeight: '800', color: '#0F172A' }}>{live.title}</Text>
                    <Text style={{ fontSize: 12, color: '#475569' }}>
                      Faculty: {live.faculty} • Time: {new Date(live.scheduledAt).toLocaleString('en-IN')} ({live.duration})
                    </Text>

                    {live.meetingId && (
                      <View style={{ backgroundColor: '#F8FAFC', padding: 8, borderRadius: 8, gap: 2 }}>
                        <Text style={{ fontSize: 11, color: '#64748B' }}>
                          Meeting ID: <Text style={{ fontWeight: '700', color: '#0F172A' }}>{live.meetingId}</Text>
                          {live.passcode ? ` • Passcode: ${live.passcode}` : ''}
                        </Text>
                      </View>
                    )}

                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <TouchableOpacity
                        onPress={() => Linking.openURL(live.meetingUrl)}
                        style={{
                          flex: 1,
                          backgroundColor: live.isLive ? '#EF4444' : '#2563EB',
                          paddingVertical: 9,
                          borderRadius: 8,
                          alignItems: 'center',
                          flexDirection: 'row',
                          justifyContent: 'center',
                          gap: 6,
                        }}
                      >
                        <Radio size={14} color="#FFFFFF" />
                        <Text style={{ fontSize: 12, fontWeight: '800', color: '#FFFFFF' }}>
                          {live.isLive ? 'Join Live Now' : 'Launch Meeting Link'}
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={async () => {
                          await store.toggleLiveClassState(live.id);
                          onToast({
                            type: 'info',
                            message: `Live class status set to ${live.isLive ? 'ended' : 'LIVE NOW'}.`,
                          });
                        }}
                        style={{
                          paddingHorizontal: 12,
                          paddingVertical: 9,
                          borderRadius: 8,
                          backgroundColor: '#F1F5F9',
                        }}
                      >
                        <Text style={{ fontSize: 11.5, fontWeight: '700', color: '#475569' }}>
                          {live.isLive ? 'Mark Ended' : 'Set Live'}
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => {
                          Alert.alert('Delete Session', 'Delete this live class record?', [
                            { text: 'Cancel', style: 'cancel' },
                            {
                              text: 'Delete',
                              style: 'destructive',
                              onPress: async () => {
                                await store.deleteLiveClass(live.id);
                                onToast({ type: 'info', message: 'Live class deleted.' });
                              },
                            },
                          ]);
                        }}
                        style={{
                          paddingHorizontal: 10,
                          paddingVertical: 9,
                          borderRadius: 8,
                          backgroundColor: '#FEE2E2',
                        }}
                      >
                        <Trash2 size={14} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
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
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        backgroundColor: isActive ? '#0F172A' : '#F1F5F9',
        gap: 6,
      }}
    >
      <Text
        style={{
          fontSize: 12,
          fontWeight: isActive ? '800' : '600',
          color: isActive ? '#FFFFFF' : '#475569',
        }}
      >
        {label}
      </Text>
      {badge !== undefined && (
        <View
          style={{
            backgroundColor: badgeColor || (isActive ? '#3B82F6' : '#E2E8F0'),
            paddingHorizontal: 6,
            paddingVertical: 1,
            borderRadius: 10,
          }}
        >
          <Text
            style={{
              fontSize: 10,
              fontWeight: '800',
              color: badgeColor || isActive ? '#FFFFFF' : '#475569',
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
  onPress,
}: {
  label: string;
  icon: React.ReactNode;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        gap: 6,
      }}
    >
      {icon}
      <Text style={{ fontSize: 12, fontWeight: '700', color: '#0F172A' }}>{label}</Text>
    </TouchableOpacity>
  );
}

// -------------------------------------------------------------
// SUB-MODALS
// -------------------------------------------------------------

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
    // Extract video ID if possible
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

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}
      >
        <View style={{ backgroundColor: '#FFFFFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 18, gap: 12 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontSize: 16, fontWeight: '800', color: '#0F172A' }}>Add Video Lecture</Text>
            <TouchableOpacity onPress={onClose}>
              <X size={18} color="#64748B" />
            </TouchableOpacity>
          </View>

          <View style={{ gap: 4 }}>
            <Text style={{ fontSize: 11.5, fontWeight: '700', color: '#475569' }}>Lecture Title</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. Lec 01: Integration by Substitution"
              style={{ borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8, padding: 10, fontSize: 13 }}
            />
          </View>

          <View style={{ gap: 4 }}>
            <Text style={{ fontSize: 11.5, fontWeight: '700', color: '#475569' }}>Chapter Name / Folder</Text>
            <TextInput
              value={chapter}
              onChangeText={setChapter}
              placeholder="e.g. Integrals"
              style={{ borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8, padding: 10, fontSize: 13 }}
            />
          </View>

          <View style={{ gap: 4 }}>
            <Text style={{ fontSize: 11.5, fontWeight: '700', color: '#475569' }}>YouTube Video URL</Text>
            <TextInput
              value={youtubeUrl}
              onChangeText={setYoutubeUrl}
              placeholder="https://www.youtube.com/watch?v=..."
              style={{ borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8, padding: 10, fontSize: 13 }}
            />
          </View>

          <View style={{ gap: 4 }}>
            <Text style={{ fontSize: 11.5, fontWeight: '700', color: '#475569' }}>Duration (mm:ss)</Text>
            <TextInput
              value={duration}
              onChangeText={setDuration}
              placeholder="48:30"
              style={{ borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8, padding: 10, fontSize: 13 }}
            />
          </View>

          <Button onPress={handleSubmit} variant="primary" style={{ marginTop: 8 }}>
            Save Video Lecture
          </Button>
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

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}
      >
        <View style={{ backgroundColor: '#FFFFFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 18, gap: 12 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontSize: 16, fontWeight: '800', color: '#0F172A' }}>Upload Study Material (PDF)</Text>
            <TouchableOpacity onPress={onClose}>
              <X size={18} color="#64748B" />
            </TouchableOpacity>
          </View>

          <View style={{ gap: 4 }}>
            <Text style={{ fontSize: 11.5, fontWeight: '700', color: '#475569' }}>Document Title</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. EX 4(A) Solutions - Expansions.pdf"
              style={{ borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8, padding: 10, fontSize: 13 }}
            />
          </View>

          <View style={{ gap: 4 }}>
            <Text style={{ fontSize: 11.5, fontWeight: '700', color: '#475569' }}>Folder / Book Category</Text>
            <TextInput
              value={folderName}
              onChangeText={setFolderName}
              placeholder="e.g. Selina Concise Solutions or NCERT Exemplar"
              style={{ borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8, padding: 10, fontSize: 13 }}
            />
          </View>

          <View style={{ gap: 4 }}>
            <Text style={{ fontSize: 11.5, fontWeight: '700', color: '#475569' }}>Chapter Name</Text>
            <TextInput
              value={chapter}
              onChangeText={setChapter}
              placeholder="e.g. Expansions"
              style={{ borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8, padding: 10, fontSize: 13 }}
            />
          </View>

          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={{ fontSize: 11.5, fontWeight: '700', color: '#475569' }}>Pages</Text>
              <TextInput
                value={pages}
                onChangeText={setPages}
                keyboardType="numeric"
                style={{ borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8, padding: 10, fontSize: 13 }}
              />
            </View>
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={{ fontSize: 11.5, fontWeight: '700', color: '#475569' }}>Size</Text>
              <TextInput
                value={fileSize}
                onChangeText={setFileSize}
                style={{ borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8, padding: 10, fontSize: 13 }}
              />
            </View>
          </View>

          <View style={{ gap: 4 }}>
            <Text style={{ fontSize: 11.5, fontWeight: '700', color: '#475569' }}>Visibility</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity
                onPress={() => setVisibility('batch_only')}
                style={{
                  flex: 1,
                  paddingVertical: 8,
                  borderRadius: 8,
                  backgroundColor: visibility === 'batch_only' ? '#2563EB' : '#F1F5F9',
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: '700', color: visibility === 'batch_only' ? '#FFFFFF' : '#475569' }}>
                  Batch Only
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setVisibility('public')}
                style={{
                  flex: 1,
                  paddingVertical: 8,
                  borderRadius: 8,
                  backgroundColor: visibility === 'public' ? '#16A34A' : '#F1F5F9',
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: '700', color: visibility === 'public' ? '#FFFFFF' : '#475569' }}>
                  Free Material (Public)
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <Button onPress={handleSubmit} variant="primary" style={{ marginTop: 8 }}>
            Upload Study Material
          </Button>
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

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}
      >
        <View style={{ backgroundColor: '#FFFFFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 18, gap: 12 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontSize: 16, fontWeight: '800', color: '#0F172A' }}>Create Batch Assignment</Text>
            <TouchableOpacity onPress={onClose}>
              <X size={18} color="#64748B" />
            </TouchableOpacity>
          </View>

          <View style={{ gap: 4 }}>
            <Text style={{ fontSize: 11.5, fontWeight: '700', color: '#475569' }}>Assignment Title</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. Chapter 7 Integrals DPP 04"
              style={{ borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8, padding: 10, fontSize: 13 }}
            />
          </View>

          <View style={{ gap: 4 }}>
            <Text style={{ fontSize: 11.5, fontWeight: '700', color: '#475569' }}>Chapter Name</Text>
            <TextInput
              value={chapter}
              onChangeText={setChapter}
              placeholder="e.g. Integrals"
              style={{ borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8, padding: 10, fontSize: 13 }}
            />
          </View>

          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={{ fontSize: 11.5, fontWeight: '700', color: '#475569' }}>Due Date (YYYY-MM-DD)</Text>
              <TextInput
                value={dueDate}
                onChangeText={setDueDate}
                style={{ borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8, padding: 10, fontSize: 13 }}
              />
            </View>
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={{ fontSize: 11.5, fontWeight: '700', color: '#475569' }}>Total Marks</Text>
              <TextInput
                value={totalMarks}
                onChangeText={setTotalMarks}
                keyboardType="numeric"
                style={{ borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8, padding: 10, fontSize: 13 }}
              />
            </View>
          </View>

          <View style={{ gap: 4 }}>
            <Text style={{ fontSize: 11.5, fontWeight: '700', color: '#475569' }}>Instructions</Text>
            <TextInput
              value={instructions}
              onChangeText={setInstructions}
              placeholder="Enter guidelines for submission..."
              multiline
              numberOfLines={3}
              style={{ borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8, padding: 10, fontSize: 13, height: 70 }}
            />
          </View>

          <Button onPress={handleSubmit} variant="primary" style={{ marginTop: 8 }}>
            Assign to Batch
          </Button>
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

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}
      >
        <View style={{ backgroundColor: '#FFFFFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 18, gap: 12 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontSize: 16, fontWeight: '800', color: '#0F172A' }}>Schedule Live Class</Text>
            <TouchableOpacity onPress={onClose}>
              <X size={18} color="#64748B" />
            </TouchableOpacity>
          </View>

          <View style={{ gap: 4 }}>
            <Text style={{ fontSize: 11.5, fontWeight: '700', color: '#475569' }}>Live Topic / Title</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. Live Doubt Clearing & Problem Solving"
              style={{ borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8, padding: 10, fontSize: 13 }}
            />
          </View>

          <View style={{ gap: 4 }}>
            <Text style={{ fontSize: 11.5, fontWeight: '700', color: '#475569' }}>Platform</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {(['zoom', 'youtube', 'meet'] as const).map((p) => (
                <TouchableOpacity
                  key={p}
                  onPress={() => setPlatform(p)}
                  style={{
                    flex: 1,
                    paddingVertical: 8,
                    borderRadius: 8,
                    backgroundColor: platform === p ? '#2563EB' : '#F1F5F9',
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ fontSize: 12, fontWeight: '700', color: platform === p ? '#FFFFFF' : '#475569' }}>
                    {p.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={{ gap: 4 }}>
            <Text style={{ fontSize: 11.5, fontWeight: '700', color: '#475569' }}>Meeting / Stream URL</Text>
            <TextInput
              value={meetingUrl}
              onChangeText={setMeetingUrl}
              placeholder="https://zoom.us/... or YouTube Live"
              style={{ borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8, padding: 10, fontSize: 13 }}
            />
          </View>

          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={{ fontSize: 11.5, fontWeight: '700', color: '#475569' }}>Meeting ID</Text>
              <TextInput
                value={meetingId}
                onChangeText={setMeetingId}
                style={{ borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8, padding: 10, fontSize: 13 }}
              />
            </View>
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={{ fontSize: 11.5, fontWeight: '700', color: '#475569' }}>Passcode</Text>
              <TextInput
                value={passcode}
                onChangeText={setPasscode}
                style={{ borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8, padding: 10, fontSize: 13 }}
              />
            </View>
          </View>

          <Button onPress={handleSubmit} variant="primary" style={{ marginTop: 8 }}>
            Schedule Live Lecture
          </Button>
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

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}
      >
        <View style={{ backgroundColor: '#FFFFFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 18, gap: 12 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontSize: 16, fontWeight: '800', color: '#0F172A' }}>Post Batch Notice</Text>
            <TouchableOpacity onPress={onClose}>
              <X size={18} color="#64748B" />
            </TouchableOpacity>
          </View>

          <View style={{ gap: 4 }}>
            <Text style={{ fontSize: 11.5, fontWeight: '700', color: '#475569' }}>Notice Title</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. Unit Test 02 on Saturday 10:00 AM"
              style={{ borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8, padding: 10, fontSize: 13 }}
            />
          </View>

          <View style={{ gap: 4 }}>
            <Text style={{ fontSize: 11.5, fontWeight: '700', color: '#475569' }}>Priority</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity
                onPress={() => setPriority('normal')}
                style={{
                  flex: 1,
                  paddingVertical: 8,
                  borderRadius: 8,
                  backgroundColor: priority === 'normal' ? '#2563EB' : '#F1F5F9',
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: '700', color: priority === 'normal' ? '#FFFFFF' : '#475569' }}>
                  Normal Notice
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setPriority('urgent')}
                style={{
                  flex: 1,
                  paddingVertical: 8,
                  borderRadius: 8,
                  backgroundColor: priority === 'urgent' ? '#EF4444' : '#F1F5F9',
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: '700', color: priority === 'urgent' ? '#FFFFFF' : '#475569' }}>
                  Urgent / Alert
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={{ gap: 4 }}>
            <Text style={{ fontSize: 11.5, fontWeight: '700', color: '#475569' }}>Notice Message</Text>
            <TextInput
              value={body}
              onChangeText={setBody}
              placeholder="Write notice details for students..."
              multiline
              numberOfLines={4}
              style={{ borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8, padding: 10, fontSize: 13, height: 90 }}
            />
          </View>

          <Button onPress={handleSubmit} variant="primary" style={{ marginTop: 8 }}>
            Broadcast to Batch
          </Button>
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
  const store = useAdminStore();
  const availableStudents = store.students.filter((s) => !enrolledStudentIds.includes(s.id));

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
        <View
          style={{
            backgroundColor: '#FFFFFF',
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            padding: 18,
            maxHeight: '80%',
            gap: 12,
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <Text style={{ fontSize: 16, fontWeight: '800', color: '#0F172A' }}>Enroll Student from Directory</Text>
              <Text style={{ fontSize: 11.5, color: '#64748B' }}>Add student to {batch.title}</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <X size={18} color="#64748B" />
            </TouchableOpacity>
          </View>

          <ScrollView style={{ maxHeight: 350 }} contentContainerStyle={{ gap: 8 }}>
            {availableStudents.length === 0 ? (
              <Text style={{ fontSize: 12.5, color: '#64748B', textAlign: 'center', paddingVertical: 20 }}>
                All registered students in the institute are already enrolled in this batch!
              </Text>
            ) : (
              availableStudents.map((stud) => (
                <View
                  key={stud.id}
                  style={{
                    backgroundColor: '#F8FAFC',
                    borderRadius: 10,
                    padding: 12,
                    borderWidth: 1,
                    borderColor: '#E2E8F0',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, fontWeight: '800', color: '#0F172A' }}>{stud.fullName}</Text>
                    <Text style={{ fontSize: 11, color: '#64748B' }}>
                      Class {stud.classLevel} • {stud.school}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={async () => {
                      await store.addStudentToBatch(stud.id, batch.id);
                      onSaved(stud.fullName);
                    }}
                    style={{
                      backgroundColor: '#2563EB',
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 8,
                    }}
                  >
                    <Text style={{ fontSize: 11.5, fontWeight: '800', color: '#FFFFFF' }}>Enroll</Text>
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
  const store = useAdminStore();
  const [gradingMarks, setGradingMarks] = useState<Record<string, string>>({});
  const [gradingRemarks, setGradingRemarks] = useState<Record<string, string>>({});

  if (!assignment) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
        <View
          style={{
            backgroundColor: '#FFFFFF',
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            padding: 18,
            maxHeight: '85%',
            gap: 12,
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={{ fontSize: 16, fontWeight: '800', color: '#0F172A' }}>Submissions Review</Text>
              <Text style={{ fontSize: 11.5, color: '#64748B' }} numberOfLines={1}>
                {assignment.title} (Max {assignment.totalMarks} Marks)
              </Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <X size={18} color="#64748B" />
            </TouchableOpacity>
          </View>

          <ScrollView style={{ maxHeight: 420 }} contentContainerStyle={{ gap: 10 }}>
            {assignment.submissions.length === 0 ? (
              <Text style={{ fontSize: 12.5, color: '#64748B', textAlign: 'center', paddingVertical: 24 }}>
                No student submissions uploaded yet for this assignment.
              </Text>
            ) : (
              assignment.submissions.map((sub) => {
                const currentScore = gradingMarks[sub.id] ?? (sub.marksObtained !== undefined ? sub.marksObtained.toString() : '');
                const currentRemark = gradingRemarks[sub.id] ?? (sub.remarks || '');

                return (
                  <View
                    key={sub.id}
                    style={{
                      backgroundColor: '#F8FAFC',
                      borderRadius: 12,
                      padding: 12,
                      borderWidth: 1,
                      borderColor: '#E2E8F0',
                      gap: 8,
                    }}
                  >
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={{ fontSize: 13.5, fontWeight: '800', color: '#0F172A' }}>{sub.studentName}</Text>
                      <Badge
                        label={sub.status.toUpperCase()}
                        variant={sub.status === 'evaluated' ? 'success' : 'warning'}
                        size="sm"
                      />
                    </View>
                    <Text style={{ fontSize: 10.5, color: '#64748B' }}>
                      Submitted at: {new Date(sub.submittedAt).toLocaleString('en-IN')}
                    </Text>

                    {/* Marks & Remarks Input */}
                    <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', marginTop: 4 }}>
                      <View style={{ width: 100 }}>
                        <Text style={{ fontSize: 10, fontWeight: '700', color: '#475569' }}>
                          Marks (/{assignment.totalMarks})
                        </Text>
                        <TextInput
                          value={currentScore}
                          onChangeText={(val) => setGradingMarks((prev) => ({ ...prev, [sub.id]: val }))}
                          keyboardType="numeric"
                          placeholder="Marks"
                          style={{
                            borderWidth: 1,
                            borderColor: '#CBD5E1',
                            borderRadius: 6,
                            padding: 6,
                            fontSize: 12.5,
                            backgroundColor: '#FFFFFF',
                          }}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 10, fontWeight: '700', color: '#475569' }}>Teacher Feedback</Text>
                        <TextInput
                          value={currentRemark}
                          onChangeText={(val) => setGradingRemarks((prev) => ({ ...prev, [sub.id]: val }))}
                          placeholder="Remarks..."
                          style={{
                            borderWidth: 1,
                            borderColor: '#CBD5E1',
                            borderRadius: 6,
                            padding: 6,
                            fontSize: 12.5,
                            backgroundColor: '#FFFFFF',
                          }}
                        />
                      </View>
                    </View>

                    <TouchableOpacity
                      onPress={async () => {
                        const marksNum = parseInt(currentScore) || 0;
                        await store.gradeAssignmentSubmission(assignment.id, sub.id, marksNum, currentRemark);
                        onGraded();
                      }}
                      style={{
                        backgroundColor: '#16A34A',
                        paddingVertical: 7,
                        borderRadius: 8,
                        alignItems: 'center',
                        marginTop: 4,
                      }}
                    >
                      <Text style={{ fontSize: 12, fontWeight: '800', color: '#FFFFFF' }}>Save Grade & Feedback</Text>
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
