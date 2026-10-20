import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Image,
  RefreshControl,
  Switch,
  Modal,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as Print from 'expo-print';
import * as FileSystem from 'expo-file-system/legacy';
import {
  Calendar,
  CheckCircle2,
  XCircle,
  Video,
  Send,
  Upload,
  Camera,
  FileText,
  Clock,
  HelpCircle,
  Users,
  Bell,
  RefreshCw,
  Plus,
  Trash2,
  ExternalLink,
  BookOpen,
} from 'lucide-react-native';
import { Screen } from '../../../src/components/ui/Screen';
import { AppHeader } from '../../../src/components/ui/AppHeader';
import { Button } from '../../../src/components/ui/Button';
import { Badge } from '../../../src/components/ui/Badge';
import { Card } from '../../../src/components/ui/Card';
import { KeyboardAwareScrollView } from '../../../src/components/ui/KeyboardAwareScrollView';
import { Toast } from '../../../src/components/ui/Toast';
import { SegmentedControl } from '../../../src/components/ui/SegmentedControl';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import {
  useTeacherTodaySessions,
  useTeacherStartSession,
  useTeacherEndSession,
  useTeacherBatches,
  useTeacherBatchStudents,
  useTeacherSaveAttendance,
  useTeacherPostAnnouncement,
  useTeacherDoubts,
  useTeacherReplyDoubt,
  useTeacherBatchChapters,
  useTeacherQuickUpload,
  useTeacherPresignedUrl,
} from '../../../src/api/hooks';
import {
  saveAttendanceLocally,
  syncPendingAttendance,
  getPendingAttendanceCount,
  getLocalAttendanceEntries,
} from '../../../src/lib/offline-attendance';
import { analytics } from '../../../src/lib/analytics';
import type { TeacherBatchStudent } from '@quick2learn/shared';

type TeachTabSection = 'today' | 'attendance' | 'announcement' | 'doubts' | 'upload';

export default function TeachScreen() {
  const [activeSection, setActiveSection] = useState<TeachTabSection>('today');
  const [toastMessage, setToastMessage] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  const [selectedAttendanceBatchId, setSelectedAttendanceBatchId] = useState<string | undefined>(undefined);
  const [selectedAttendanceSessionId, setSelectedAttendanceSessionId] = useState<string | undefined>(undefined);

  // Pending offline sync count
  const [pendingSyncs, setPendingSyncs] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    try {
      setPendingSyncs(getPendingAttendanceCount());
    } catch {
      // Ignore initial DB load
    }
  }, []);

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      const res = await syncPendingAttendance();
      setPendingSyncs(getPendingAttendanceCount());
      if (res.synced > 0) {
        setToastMessage({
          type: 'success',
          message: `Synced ${res.synced} attendance records with server!`,
        });
      }
    } catch {
      setToastMessage({
        type: 'error',
        message: 'Sync failed. Will retry automatically when online.',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // Section options
  const sectionOptions = ['Today', 'Attendance', 'Announce', 'Doubts', 'Notes PDF'];

  return (
    <Screen
      scrollable={false}
      header={
        <AppHeader
          title="Teach"
          rightActions={
            pendingSyncs > 0 ? (
              <TouchableOpacity
                onPress={handleManualSync}
                disabled={isSyncing}
                className="px-2.5 py-1 rounded-full bg-amber-100 border border-amber-300 flex-row items-center min-h-[44px]"
                accessibilityLabel="Sync pending attendance"
              >
                <RefreshCw
                  size={14}
                  color="#B45309"
                  className={isSyncing ? 'animate-spin' : ''}
                />
                <Text className="text-caption font-bold text-amber-800 ml-1.5">
                  {pendingSyncs} queued
                </Text>
              </TouchableOpacity>
            ) : null
          }
        />
      }
    >
      <View className="px-4 py-2 bg-surface border-b border-border">
        <SegmentedControl
          options={sectionOptions}
          selectedIndex={
            activeSection === 'today'
              ? 0
              : activeSection === 'attendance'
              ? 1
              : activeSection === 'announcement'
              ? 2
              : activeSection === 'doubts'
              ? 3
              : 4
          }
          onChange={(index) => {
            const mapped: TeachTabSection[] = [
              'today',
              'attendance',
              'announcement',
              'doubts',
              'upload',
            ];
            setActiveSection(mapped[index]);
          }}
        />
      </View>

      {toastMessage ? (
        <View className="px-4 pt-2">
          <Toast
            type={toastMessage.type}
            message={toastMessage.message}
            onDismiss={() => setToastMessage(null)}
          />
        </View>
      ) : null}

      <View className="flex-1">
        {activeSection === 'today' && (
          <TodaySessionsSection
            onOpenAttendance={(batchId, sessionId) => {
              setActiveSection('attendance');
              setSelectedAttendanceBatchId(batchId);
              setSelectedAttendanceSessionId(sessionId);
            }}
            setToast={setToastMessage}
          />
        )}

        {activeSection === 'attendance' && (
          <FastAttendanceSection
            initialBatchId={selectedAttendanceBatchId}
            initialSessionId={selectedAttendanceSessionId}
            setToast={setToastMessage}
            onAttendanceSaved={() => setPendingSyncs(getPendingAttendanceCount())}
          />
        )}

        {activeSection === 'announcement' && (
          <PostAnnouncementSection setToast={setToastMessage} />
        )}

        {activeSection === 'doubts' && (
          <DoubtsInboxSection setToast={setToastMessage} />
        )}

        {activeSection === 'upload' && (
          <QuickNotesUploadSection setToast={setToastMessage} />
        )}
      </View>
    </Screen>
  );
}

// =========================================================================
// 1. TODAY'S SESSIONS (START LIVE / END / MARK ATTENDANCE)
// =========================================================================

function TodaySessionsSection({
  onOpenAttendance,
  setToast,
}: {
  onOpenAttendance: (batchId: string, sessionId?: string) => void;
  setToast: (toast: { type: 'success' | 'error' | 'info'; message: string }) => void;
}) {
  const { data, isLoading, refetch, isRefetching } = useTeacherTodaySessions();
  const startSessionMutation = useTeacherStartSession();
  const endSessionMutation = useTeacherEndSession();

  const sessions = data?.sessions || [];

  const handleStartLive = async (sessionId: string, title: string) => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await startSessionMutation.mutateAsync(sessionId);
      analytics.track('live_joined', {
        batchId: sessionId,
        sessionId,
        isTeacher: true,
      });
      setToast({
        type: 'success',
        message: `${title} is now LIVE. Push notification sent to batch students!`,
      });
    } catch (err: any) {
      setToast({
        type: 'error',
        message: err?.message || 'Failed to start live session',
      });
    }
  };

  const handleEndSession = async (sessionId: string, title: string) => {
    Alert.alert(
      'End Class',
      `Are you sure you want to end "${title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End Class',
          style: 'destructive',
          onPress: async () => {
            try {
              await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              await endSessionMutation.mutateAsync({ sessionId });
              setToast({
                type: 'info',
                message: `Class "${title}" has ended.`,
              });
            } catch (err: any) {
              setToast({
                type: 'error',
                message: err?.message || 'Failed to end live session',
              });
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center p-6">
        <ActivityIndicator size="large" color="#2563EB" />
        <Text className="text-body font-medium text-ink-muted mt-3">
          Loading today's schedule...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 px-4 py-3"
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={() => {
            void refetch();
          }}
          tintColor="#2563EB"
        />
      }
    >
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-h3 font-bold text-ink">
          Today's Classes ({sessions.length})
        </Text>
        <Text className="text-small font-medium text-ink-muted">
          {data?.todayFormatted}
        </Text>
      </View>

      {sessions.length === 0 ? (
        <EmptyState
          title="No classes scheduled today"
          description="Enjoy your day! Tap refresh if a new slot was assigned."
          actionLabel="Refresh Schedule"
          onAction={refetch}
        />
      ) : (
        sessions.map((session) => {
          const isLive = session.status === 'live';
          const isEnded = session.status === 'ended';
          const isScheduled = session.status === 'scheduled';

          return (
            <Card key={session.id} className="p-4 mb-3 border border-border">
              {/* Batch & Status */}
              <View className="flex-row items-center justify-between mb-2">
                <View className="flex-1 mr-2">
                  <Text className="text-body font-bold text-ink" numberOfLines={1}>
                    {session.batchTitle}
                  </Text>
                  <Text className="text-small text-ink-muted">
                    {session.subjectName || session.title}
                  </Text>
                </View>

                {isLive ? (
                  <Badge variant="success" size="md" label="🔴 Live Now" />
                ) : isEnded ? (
                  <Badge variant="neutral" size="md" label="Ended" />
                ) : (
                  <Badge variant="primary" size="md" label="Scheduled" />
                )}
              </View>

              {/* Timing */}
              <View className="flex-row items-center mb-3">
                <Clock size={16} color="#6B7280" />
                <Text className="text-small font-semibold text-ink ml-1.5">
                  {session.timeFormatted}
                </Text>

                {session.enrolledCount > 0 ? (
                  <View className="flex-row items-center ml-4">
                    <Users size={14} color="#6B7280" />
                    <Text className="text-caption text-ink-muted ml-1">
                      {session.attendanceCount > 0
                        ? `${session.attendanceCount}/${session.enrolledCount} marked`
                        : `${session.enrolledCount} students`}
                    </Text>
                  </View>
                ) : null}
              </View>

              {/* Action Buttons */}
              <View className="flex-row items-center space-x-2 pt-2 border-t border-border/60">
                {isScheduled ? (
                  <Button
                    size="sm"
                    variant="primary"
                    className="flex-1 mr-2"
                    loading={startSessionMutation.isPending}
                    icon={<Video size={16} color="#FFFFFF" />}
                    onPress={() => handleStartLive(session.id, session.title)}
                  >
                    Start Live
                  </Button>
                ) : isLive ? (
                  <Button
                    size="sm"
                    variant="danger"
                    className="flex-1 mr-2"
                    loading={endSessionMutation.isPending}
                    onPress={() => handleEndSession(session.id, session.title)}
                  >
                    End Class
                  </Button>
                ) : null}

                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  icon={<CheckCircle2 size={16} color="#2563EB" />}
                  onPress={() => onOpenAttendance(session.batchId, session.id)}
                >
                  Mark Attendance
                </Button>
              </View>
            </Card>
          );
        })
      )}
    </ScrollView>
  );
}

// =========================================================================
// 2. FAST ATTENDANCE (40 STUDENTS IN UNDER A MINUTE, INSTANT OFFLINE SAVE)
// =========================================================================

function FastAttendanceSection({
  initialBatchId,
  initialSessionId,
  setToast,
  onAttendanceSaved,
}: {
  initialBatchId?: string;
  initialSessionId?: string;
  setToast: (toast: { type: 'success' | 'error' | 'info'; message: string }) => void;
  onAttendanceSaved: () => void;
}) {
  const { data: batchesData } = useTeacherBatches();
  const batches = batchesData?.batches || [];

  const [selectedBatchId, setSelectedBatchId] = useState<string>(
    initialBatchId || batches[0]?.id || ''
  );

  // If initialBatchId changes or batches load
  useEffect(() => {
    if (initialBatchId) {
      setSelectedBatchId(initialBatchId);
    } else if (!selectedBatchId && batches.length > 0) {
      setSelectedBatchId(batches[0].id);
    }
  }, [initialBatchId, batches]);

  const todayStr = new Date().toLocaleDateString('en-CA', {
    timeZone: 'Asia/Kolkata',
  });

  const {
    data: studentsData,
    isLoading: isLoadingStudents,
    refetch,
    isRefetching,
  } = useTeacherBatchStudents(selectedBatchId, todayStr, initialSessionId);

  // Local attendance map: studentId -> 'present' | 'absent'
  const [attendanceMap, setAttendanceMap] = useState<
    Record<string, 'present' | 'absent'>
  >({});

  const [saveStatus, setSaveStatus] = useState<
    'idle' | 'saved_locally' | 'synced'
  >('idle');

  // Load students into attendance map
  useEffect(() => {
    if (studentsData?.students) {
      // Check if local cached entries exist in SQLite
      const cached = getLocalAttendanceEntries(
        selectedBatchId,
        todayStr,
        initialSessionId
      );

      const newMap: Record<string, 'present' | 'absent'> = {};
      for (const s of studentsData.students) {
        if (cached) {
          const match = cached.find((c) => c.studentId === s.id);
          newMap[s.id] = (match?.status as 'present' | 'absent') || 'present';
        } else if (s.status === 'absent') {
          newMap[s.id] = 'absent';
        } else {
          // Default to present for ultra-fast "tap absentees" workflow!
          newMap[s.id] = 'present';
        }
      }
      setAttendanceMap(newMap);
    }
  }, [studentsData?.students, selectedBatchId]);

  const saveAttendanceMutation = useTeacherSaveAttendance();

  // Instant save function (writes to SQLite in < 5ms, pushes to server in background)
  const commitAttendance = async (
    currentMap: Record<string, 'present' | 'absent'>,
    showToastMessage = false
  ) => {
    const entries = Object.entries(currentMap).map(([studentId, status]) => ({
      studentId,
      status,
    }));

    if (entries.length === 0) return;

    // 1. Instant local SQLite save
    try {
      saveAttendanceLocally({
        batchId: selectedBatchId,
        sessionId: initialSessionId || null,
        date: todayStr,
        entries,
      });
      setSaveStatus('saved_locally');
      onAttendanceSaved();
    } catch (e) {
      console.warn('Local save failed:', e);
    }

    // 2. Commit to server
    try {
      const res = await saveAttendanceMutation.mutateAsync({
        batchId: selectedBatchId,
        sessionId: initialSessionId || null,
        date: todayStr,
        entries,
      });
      setSaveStatus('synced');
      if (showToastMessage) {
        setToast({
          type: 'success',
          message: `Attendance saved for ${res.count} students! (${res.absencesNotified} parents notified)`,
        });
      }
    } catch {
      // Server failed -> remains queued offline in SQLite
      if (showToastMessage) {
        setToast({
          type: 'info',
          message: 'Saved offline. Attendance will automatically sync when online.',
        });
      }
    }
  };

  // ONE-TAP ALL PRESENT ACTION
  const handleAllPresent = async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const updated: Record<string, 'present' | 'absent'> = {};
    const students = studentsData?.students || [];
    for (const s of students) {
      updated[s.id] = 'present';
    }
    setAttendanceMap(updated);
    void commitAttendance(updated, true);
  };

  // TOGGLE SINGLE STUDENT
  const toggleStudent = async (studentId: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const nextStatus: 'present' | 'absent' =
      attendanceMap[studentId] === 'absent' ? 'present' : 'absent';
    const updated: Record<string, 'present' | 'absent'> = {
      ...attendanceMap,
      [studentId]: nextStatus,
    };
    setAttendanceMap(updated);
    // Instant background save
    void commitAttendance(updated, false);
  };

  const students = studentsData?.students || [];
  const presentCount = Object.values(attendanceMap).filter(
    (s) => s === 'present'
  ).length;
  const absentCount = Object.values(attendanceMap).filter(
    (s) => s === 'absent'
  ).length;

  return (
    <View className="flex-1 bg-surface-subtle">
      {/* Batch selector bar */}
      <View className="bg-surface px-4 py-2 border-b border-border">
        <Text className="text-caption font-semibold text-ink-muted mb-1.5 uppercase">
          Select Batch
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row items-center space-x-2">
            {batches.map((b) => {
              const isSelected = b.id === selectedBatchId;
              return (
                <TouchableOpacity
                  key={b.id}
                  onPress={() => setSelectedBatchId(b.id)}
                  className={`px-3 py-2 rounded-lg border min-h-[44px] justify-center ${
                    isSelected
                      ? 'bg-primary border-primary'
                      : 'bg-surface border-border active:bg-surface-subtle'
                  }`}
                >
                  <Text
                    className={`text-small font-semibold ${
                      isSelected ? 'text-white' : 'text-ink'
                    }`}
                  >
                    {b.title}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </View>

      {/* Quick Action & Stats Header */}
      <View className="bg-surface px-4 py-3 border-b border-border shadow-xs">
        <View className="flex-row items-center justify-between mb-2">
          <View>
            <Text className="text-body font-bold text-ink">
              Roster ({students.length} students)
            </Text>
            <Text className="text-caption text-ink-muted">
              {presentCount} Present • {absentCount} Absent
            </Text>
          </View>

          {/* Quick All Present Button */}
          <Button
            size="sm"
            variant="primary"
            icon={<CheckCircle2 size={16} color="#FFFFFF" />}
            onPress={handleAllPresent}
          >
            All Present
          </Button>
        </View>

        {absentCount > 0 ? (
          <Text className="text-caption font-medium text-danger">
            ⚠️ {absentCount} student{absentCount > 1 ? 's' : ''} marked absent.
            Parents will receive attendance alerts.
          </Text>
        ) : null}
      </View>

      {/* Student List */}
      {isLoadingStudents ? (
        <View className="flex-1 items-center justify-center p-6">
          <ActivityIndicator size="large" color="#2563EB" />
          <Text className="text-small text-ink-muted mt-2">Loading roster...</Text>
        </View>
      ) : students.length === 0 ? (
        <EmptyState
          title="No students enrolled"
          description="There are currently no active students in this batch."
        />
      ) : (
        <ScrollView
          className="flex-1 px-4 py-2"
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={() => {
                void refetch();
              }}
              tintColor="#2563EB"
            />
          }
        >
          {students.map((student, index) => {
            const status = attendanceMap[student.id] || 'present';
            const isPresent = status === 'present';

            return (
              <View
                key={student.id}
                className="flex-row items-center justify-between py-2.5 px-3 mb-2 bg-surface rounded-xl border border-border shadow-xs"
              >
                {/* Student Info */}
                <View className="flex-1 mr-3">
                  <View className="flex-row items-center">
                    <Text className="text-caption font-bold text-ink-muted mr-2">
                      #{index + 1}
                    </Text>
                    <Text
                      className="text-body font-semibold text-ink flex-1"
                      numberOfLines={1}
                    >
                      {student.name}
                    </Text>
                  </View>
                  {student.phone ? (
                    <Text className="text-caption text-ink-muted ml-5">
                      Phone: {student.phone}
                    </Text>
                  ) : null}
                </View>

                {/* Large Present / Absent Toggles (Minimum 48dp touch target) */}
                <View className="flex-row items-center space-x-1.5">
                  {/* Present Toggle */}
                  <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel={`Mark ${student.name} Present`}
                    onPress={() => {
                      if (!isPresent) toggleStudent(student.id);
                    }}
                    className={`w-12 h-12 rounded-xl items-center justify-center border ${
                      isPresent
                        ? 'bg-green-600 border-green-700 shadow-sm'
                        : 'bg-surface border-border active:bg-green-50'
                    }`}
                    hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
                  >
                    <Text
                      className={`text-body font-bold ${
                        isPresent ? 'text-white' : 'text-green-700'
                      }`}
                    >
                      P
                    </Text>
                  </TouchableOpacity>

                  {/* Absent Toggle */}
                  <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel={`Mark ${student.name} Absent`}
                    onPress={() => {
                      if (isPresent) toggleStudent(student.id);
                    }}
                    className={`w-12 h-12 rounded-xl items-center justify-center border ${
                      !isPresent
                        ? 'bg-red-600 border-red-700 shadow-sm'
                        : 'bg-surface border-border active:bg-red-50'
                    }`}
                    hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
                  >
                    <Text
                      className={`text-body font-bold ${
                        !isPresent ? 'text-white' : 'text-red-700'
                      }`}
                    >
                      A
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}

          {/* Bottom Save confirmation button */}
          <View className="py-4">
            <Button
              size="lg"
              variant="primary"
              fullWidth
              loading={saveAttendanceMutation.isPending}
              onPress={() => commitAttendance(attendanceMap, true)}
            >
              Save Attendance ({students.length} Students)
            </Button>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

// =========================================================================
// 3. POST ANNOUNCEMENT (PHOTO/PDF ATTACHMENT, NOTIFY PARENTS SWITCH)
// =========================================================================

function PostAnnouncementSection({
  setToast,
}: {
  setToast: (toast: { type: 'success' | 'error' | 'info'; message: string }) => void;
}) {
  const { data: batchesData } = useTeacherBatches();
  const batches = batchesData?.batches || [];

  const [selectedBatchId, setSelectedBatchId] = useState<string>(
    batches[0]?.id || ''
  );
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [notifyParents, setNotifyParents] = useState(false);

  // Attachment state
  const [attachment, setAttachment] = useState<{
    uri: string;
    filename: string;
    type: string;
    storageKey?: string;
  } | null>(null);
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);

  useEffect(() => {
    if (!selectedBatchId && batches.length > 0) {
      setSelectedBatchId(batches[0].id);
    }
  }, [batches, selectedBatchId]);

  const postAnnouncementMutation = useTeacherPostAnnouncement();
  const presignedUrlMutation = useTeacherPresignedUrl();

  const handlePickPhoto = async () => {
    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.8,
      });

      if (!res.canceled && res.assets[0]) {
        const asset = res.assets[0];
        const filename = asset.fileName || `announcement_${Date.now()}.jpg`;
        setAttachment({
          uri: asset.uri,
          filename,
          type: asset.mimeType || 'image/jpeg',
        });
      }
    } catch (e: any) {
      setToast({ type: 'error', message: 'Could not access photo library' });
    }
  };

  const handlePickPdf = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
      });

      if (!res.canceled && res.assets && res.assets[0]) {
        const asset = res.assets[0];
        setAttachment({
          uri: asset.uri,
          filename: asset.name,
          type: 'application/pdf',
        });
      }
    } catch (e: any) {
      setToast({ type: 'error', message: 'Could not pick PDF file' });
    }
  };

  const handleSubmit = async () => {
    if (!selectedBatchId) {
      setToast({ type: 'error', message: 'Please select a batch' });
      return;
    }
    if (!title.trim() || !body.trim()) {
      setToast({
        type: 'error',
        message: 'Please fill in both title and announcement text',
      });
      return;
    }

    try {
      let attachmentKeys: string[] = [];

      // If an attachment is selected, upload it via presigned URL
      if (attachment) {
        setIsUploadingAttachment(true);
        const { key, uploadUrl } = await presignedUrlMutation.mutateAsync({
          filename: attachment.filename,
          contentType: attachment.type,
          folder: 'announcements',
        });

        await FileSystem.uploadAsync(uploadUrl, attachment.uri, {
          httpMethod: 'PUT',
          headers: { 'Content-Type': attachment.type },
          uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
        });

        attachmentKeys = [key];
      }

      await postAnnouncementMutation.mutateAsync({
        batchId: selectedBatchId,
        title: title.trim(),
        body: body.trim(),
        attachmentKeys,
        notifyParents,
      });

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setToast({
        type: 'success',
        message: `Announcement posted! ${
          notifyParents ? 'Students and parents' : 'Students'
        } were notified.`,
      });

      // Reset form
      setTitle('');
      setBody('');
      setAttachment(null);
      setNotifyParents(false);
    } catch (err: any) {
      setToast({
        type: 'error',
        message: err?.message || 'Failed to post announcement',
      });
    } finally {
      setIsUploadingAttachment(false);
    }
  };

  return (
    <KeyboardAwareScrollView className="flex-1 px-4 py-3 bg-surface-subtle">
      <Card className="p-4 bg-surface border border-border mb-4">
        <Text className="text-h3 font-bold text-ink mb-3">
          Post Batch Announcement
        </Text>

        {/* Batch Picker */}
        <Text className="text-small font-semibold text-ink mb-1.5">
          Select Batch
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mb-3"
        >
          <View className="flex-row items-center space-x-2">
            {batches.map((b) => {
              const isSelected = b.id === selectedBatchId;
              return (
                <TouchableOpacity
                  key={b.id}
                  onPress={() => setSelectedBatchId(b.id)}
                  className={`px-3 py-2 rounded-lg border min-h-[44px] justify-center ${
                    isSelected
                      ? 'bg-primary border-primary'
                      : 'bg-surface border-border active:bg-surface-subtle'
                  }`}
                >
                  <Text
                    className={`text-small font-semibold ${
                      isSelected ? 'text-white' : 'text-ink'
                    }`}
                  >
                    {b.title}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>

        {/* Title */}
        <Text className="text-small font-semibold text-ink mb-1">Title</Text>
        <TextInput
          placeholder="e.g. Extra Class Timing for Monday"
          value={title}
          onChangeText={setTitle}
          className="w-full px-3 py-2.5 bg-surface border border-border rounded-xl text-body text-ink mb-3 min-h-[48px]"
        />

        {/* Body */}
        <Text className="text-small font-semibold text-ink mb-1">
          Announcement Message
        </Text>
        <TextInput
          placeholder="Write your announcement message clearly..."
          value={body}
          onChangeText={setBody}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          className="w-full p-3 bg-surface border border-border rounded-xl text-body text-ink mb-3 min-h-[100px]"
        />

        {/* Attachment Options */}
        <Text className="text-small font-semibold text-ink mb-1.5">
          Attachment (Optional)
        </Text>
        {attachment ? (
          <View className="flex-row items-center justify-between p-3 bg-primary-soft border border-primary/20 rounded-xl mb-3">
            <View className="flex-row items-center flex-1 mr-2">
              <FileText size={18} color="#2563EB" />
              <Text
                className="text-small font-medium text-primary ml-2 flex-1"
                numberOfLines={1}
              >
                {attachment.filename}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setAttachment(null)}
              className="p-1.5 rounded-full bg-surface"
            >
              <Trash2 size={16} color="#DC2626" />
            </TouchableOpacity>
          </View>
        ) : (
          <View className="flex-row items-center space-x-2 mb-3">
            <Button
              size="sm"
              variant="outline"
              className="flex-1 mr-2"
              icon={<Camera size={16} color="#2563EB" />}
              onPress={handlePickPhoto}
            >
              Add Photo
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1"
              icon={<FileText size={16} color="#2563EB" />}
              onPress={handlePickPdf}
            >
              Add PDF
            </Button>
          </View>
        )}

        {/* Notify Parents Switch */}
        <View className="flex-row items-center justify-between p-3 bg-surface-subtle border border-border rounded-xl mb-4">
          <View className="flex-1 mr-3">
            <View className="flex-row items-center">
              <Bell size={16} color="#2563EB" />
              <Text className="text-small font-bold text-ink ml-1.5">
                Also notify parents
              </Text>
            </View>
            <Text className="text-caption text-ink-muted mt-0.5">
              Sends an instant push notification to linked parents
            </Text>
          </View>
          <Switch
            value={notifyParents}
            onValueChange={setNotifyParents}
            trackColor={{ false: '#D1D5DB', true: '#2563EB' }}
          />
        </View>

        {/* Submit */}
        <Button
          size="lg"
          variant="primary"
          fullWidth
          loading={postAnnouncementMutation.isPending || isUploadingAttachment}
          icon={<Send size={18} color="#FFFFFF" />}
          onPress={handleSubmit}
        >
          Post Announcement
        </Button>
      </Card>
    </KeyboardAwareScrollView>
  );
}

// =========================================================================
// 4. DOUBTS INBOX (REPLY WITH TEXT, CAMERA PHOTO OF SOLUTION, OR LECTURE)
// =========================================================================

function DoubtsInboxSection({
  setToast,
}: {
  setToast: (toast: { type: 'success' | 'error' | 'info'; message: string }) => void;
}) {
  const [filterStatus, setFilterStatus] = useState<'open' | 'answered'>('open');
  const { data, isLoading, refetch, isRefetching } = useTeacherDoubts(filterStatus);

  const doubts = data?.doubts || [];

  // Active doubt reply modal state
  const [selectedDoubt, setSelectedDoubt] = useState<any | null>(null);
  const [replyText, setReplyText] = useState('');
  const [solutionPhoto, setSolutionPhoto] = useState<string | null>(null);
  const [lectureUrl, setLectureUrl] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);

  const replyMutation = useTeacherReplyDoubt();
  const presignedUrlMutation = useTeacherPresignedUrl();

  const handleCaptureSolutionPhoto = async () => {
    try {
      const res = await ImagePicker.launchCameraAsync({
        quality: 0.8,
      });

      if (!res.canceled && res.assets[0]) {
        setSolutionPhoto(res.assets[0].uri);
      }
    } catch {
      setToast({ type: 'error', message: 'Camera permission denied' });
    }
  };

  const handleSendReply = async () => {
    if (!selectedDoubt) return;
    if (!replyText.trim() && !solutionPhoto) {
      setToast({
        type: 'error',
        message: 'Please enter a reply or photograph your handwritten solution.',
      });
      return;
    }

    setIsSubmittingReply(true);
    try {
      let attachmentKeys: string[] = [];

      // Upload photographed handwritten solution if present
      if (solutionPhoto) {
        const { key, uploadUrl } = await presignedUrlMutation.mutateAsync({
          filename: `solution_${Date.now()}.jpg`,
          contentType: 'image/jpeg',
          folder: 'solutions',
        });

        await FileSystem.uploadAsync(uploadUrl, solutionPhoto, {
          httpMethod: 'PUT',
          headers: { 'Content-Type': 'image/jpeg' },
          uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
        });

        attachmentKeys = [key];
      }

      await replyMutation.mutateAsync({
        doubtId: selectedDoubt.id,
        input: {
          body: replyText.trim() || 'Here is the step-by-step solution attached.',
          attachmentKeys,
        },
      });

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setToast({
        type: 'success',
        message: 'Reply sent to student successfully!',
      });

      // Close modal
      setSelectedDoubt(null);
      setReplyText('');
      setSolutionPhoto(null);
      setLectureUrl('');
    } catch (err: any) {
      setToast({
        type: 'error',
        message: err?.message || 'Failed to send doubt reply',
      });
    } finally {
      setIsSubmittingReply(false);
    }
  };

  return (
    <View className="flex-1 bg-surface-subtle">
      {/* Filter Tabs */}
      <View className="bg-surface px-4 py-2 border-b border-border flex-row items-center justify-between">
        <View className="flex-row items-center space-x-2">
          <TouchableOpacity
            onPress={() => setFilterStatus('open')}
            className={`px-3 py-1.5 rounded-full border min-h-[40px] items-center justify-center ${
              filterStatus === 'open'
                ? 'bg-primary border-primary'
                : 'bg-surface border-border'
            }`}
          >
            <Text
              className={`text-small font-semibold ${
                filterStatus === 'open' ? 'text-white' : 'text-ink'
              }`}
            >
              Unanswered ({data?.openCount || 0})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setFilterStatus('answered')}
            className={`px-3 py-1.5 rounded-full border min-h-[40px] items-center justify-center ${
              filterStatus === 'answered'
                ? 'bg-primary border-primary'
                : 'bg-surface border-border'
            }`}
          >
            <Text
              className={`text-small font-semibold ${
                filterStatus === 'answered' ? 'text-white' : 'text-ink'
              }`}
            >
              Answered
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => refetch()} className="p-2">
          <RefreshCw size={16} color="#6B7280" />
        </TouchableOpacity>
      </View>

      {/* Doubts List */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center p-6">
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      ) : doubts.length === 0 ? (
        <EmptyState
          title={
            filterStatus === 'open'
              ? 'No unanswered doubts 🎉'
              : 'No answered doubts found'
          }
          description={
            filterStatus === 'open'
              ? 'All student doubts have been answered.'
              : 'Answered doubts will appear here.'
          }
        />
      ) : (
        <ScrollView
          className="flex-1 px-4 py-3"
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={() => {
                void refetch();
              }}
              tintColor="#2563EB"
            />
          }
        >
          {doubts.map((doubt: any) => (
            <Card key={doubt.id} className="p-4 mb-3 bg-surface border border-border">
              <View className="flex-row items-center justify-between mb-1.5">
                <Text className="text-body font-bold text-ink">
                  {doubt.studentName || 'Student'}
                </Text>
                <Text className="text-caption text-ink-muted">
                  {doubt.subjectName}
                </Text>
              </View>

              <Text className="text-body text-ink mb-3 font-normal" numberOfLines={3}>
                {doubt.title}
              </Text>

              {doubt.attachments && doubt.attachments.length > 0 ? (
                <View className="flex-row items-center space-x-2 mb-3">
                  {doubt.attachments.map((attUrl: string, idx: number) => (
                    <Image
                      key={idx}
                      source={{ uri: attUrl }}
                      className="w-16 h-16 rounded-lg bg-surface-subtle border border-border mr-2"
                      resizeMode="cover"
                    />
                  ))}
                </View>
              ) : null}

              <Button
                size="sm"
                variant={filterStatus === 'open' ? 'primary' : 'outline'}
                icon={<Send size={14} color={filterStatus === 'open' ? '#FFF' : '#2563EB'} />}
                onPress={() => {
                  setSelectedDoubt(doubt);
                  setReplyText('');
                  setSolutionPhoto(null);
                }}
              >
                {filterStatus === 'open' ? 'Reply to Doubt' : 'View Thread'}
              </Button>
            </Card>
          ))}
        </ScrollView>
      )}

      {/* Reply Modal */}
      {selectedDoubt ? (
        <Modal
          visible={!!selectedDoubt}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setSelectedDoubt(null)}
        >
          <View className="flex-1 bg-surface p-4">
            <View className="flex-row items-center justify-between pb-3 border-b border-border mb-3">
              <Text className="text-h3 font-bold text-ink">
                Reply to {selectedDoubt.studentName}
              </Text>
              <TouchableOpacity
                onPress={() => setSelectedDoubt(null)}
                className="p-2 -mr-2"
              >
                <Text className="text-body font-bold text-ink-muted">Close</Text>
              </TouchableOpacity>
            </View>

            <KeyboardAwareScrollView className="flex-1">
              {/* Question summary */}
              <View className="p-3 bg-surface-subtle rounded-xl border border-border mb-3">
                <Text className="text-caption font-semibold text-ink-muted uppercase mb-1">
                  Student's Question ({selectedDoubt.subjectName})
                </Text>
                <Text className="text-body text-ink">{selectedDoubt.title}</Text>
              </View>

              {/* Reply text */}
              <Text className="text-small font-semibold text-ink mb-1">
                Your Explanation
              </Text>
              <TextInput
                placeholder="Type explanation or guidance for the student..."
                value={replyText}
                onChangeText={setReplyText}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                className="w-full p-3 bg-surface border border-border rounded-xl text-body text-ink mb-3 min-h-[90px]"
              />

              {/* Quick Canned Presets */}
              <Text className="text-caption font-semibold text-ink-muted mb-1.5 uppercase">
                Quick Preset Answers
              </Text>
              <View className="flex-row flex-wrap gap-1.5 mb-3">
                {[
                  'Review formula in step 2.',
                  'Watch lecture derivation for this step.',
                  'Sign error when moving across equals.',
                  'Great attempt! Your working is completely correct.',
                ].map((preset) => (
                  <TouchableOpacity
                    key={preset}
                    onPress={() => setReplyText((prev) => (prev ? `${prev} ${preset}` : preset))}
                    className="px-2.5 py-1 rounded-full bg-surface-subtle border border-border"
                  >
                    <Text className="text-caption font-medium text-ink">
                      + {preset.slice(0, 24)}...
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Photograph handwritten solution paper */}
              <Text className="text-small font-semibold text-ink mb-1.5">
                Handwritten Solution Photo
              </Text>
              {solutionPhoto ? (
                <View className="relative mb-4">
                  <Image
                    source={{ uri: solutionPhoto }}
                    className="w-full h-48 rounded-xl border border-border"
                    resizeMode="contain"
                  />
                  <TouchableOpacity
                    onPress={() => setSolutionPhoto(null)}
                    className="absolute top-2 right-2 p-2 rounded-full bg-black/60"
                  >
                    <Trash2 size={16} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              ) : (
                <Button
                  size="md"
                  variant="outline"
                  icon={<Camera size={18} color="#2563EB" />}
                  onPress={handleCaptureSolutionPhoto}
                  className="mb-4"
                >
                  Photograph Handwritten Solution
                </Button>
              )}

              {/* Submit */}
              <Button
                size="lg"
                variant="primary"
                fullWidth
                loading={isSubmittingReply}
                icon={<Send size={18} color="#FFFFFF" />}
                onPress={handleSendReply}
              >
                Send Solution to Student
              </Button>
            </KeyboardAwareScrollView>
          </View>
        </Modal>
      ) : null}
    </View>
  );
}

// =========================================================================
// 5. QUICK UPLOAD (HANDWRITTEN NOTES TO COMPILED PDF WITH EXPO-PRINT)
// =========================================================================

function QuickNotesUploadSection({
  setToast,
}: {
  setToast: (toast: { type: 'success' | 'error' | 'info'; message: string }) => void;
}) {
  const { data: batchesData } = useTeacherBatches();
  const batches = batchesData?.batches || [];

  const [selectedBatchId, setSelectedBatchId] = useState<string>(
    batches[0]?.id || ''
  );

  const { data: chaptersData } = useTeacherBatchChapters(selectedBatchId);
  const chapters = chaptersData?.chapters || [];

  const [selectedChapterId, setSelectedChapterId] = useState<string>('');
  const [section, setSection] = useState('Class Notes');
  const [title, setTitle] = useState('');
  const [notifyBatch, setNotifyBatch] = useState(true);

  // Scanned pages URIs
  const [scannedPages, setScannedPages] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!selectedBatchId && batches.length > 0) {
      setSelectedBatchId(batches[0].id);
    }
  }, [batches, selectedBatchId]);

  useEffect(() => {
    if (chapters.length > 0 && !selectedChapterId) {
      setSelectedChapterId(chapters[0].id);
    }
  }, [chapters, selectedChapterId]);

  const presignedUrlMutation = useTeacherPresignedUrl();
  const quickUploadMutation = useTeacherQuickUpload();

  // Capture page via camera
  const handleCapturePage = async () => {
    try {
      const res = await ImagePicker.launchCameraAsync({
        quality: 0.85,
      });

      if (!res.canceled && res.assets[0]) {
        setScannedPages((prev) => [...prev, res.assets[0].uri]);
      }
    } catch {
      setToast({ type: 'error', message: 'Camera permission denied' });
    }
  };

  // Pick page from gallery
  const handlePickFromGallery = async () => {
    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        allowsMultipleSelection: true,
        quality: 0.85,
      });

      if (!res.canceled && res.assets) {
        const uris = res.assets.map((a) => a.uri);
        setScannedPages((prev) => [...prev, ...uris]);
      }
    } catch {
      setToast({ type: 'error', message: 'Could not access photo library' });
    }
  };

  const removePage = (index: number) => {
    setScannedPages((prev) => prev.filter((_, i) => i !== index));
  };

  // Compile to single PDF using expo-print and upload to server
  const handleCompileAndUpload = async () => {
    if (!selectedBatchId) {
      setToast({ type: 'error', message: 'Please select a batch' });
      return;
    }
    if (!selectedChapterId) {
      setToast({ type: 'error', message: 'Please select a chapter' });
      return;
    }
    if (!title.trim()) {
      setToast({ type: 'error', message: 'Please enter notes title' });
      return;
    }
    if (scannedPages.length === 0) {
      setToast({
        type: 'error',
        message: 'Please photograph at least one page of handwritten notes',
      });
      return;
    }

    setIsProcessing(true);
    try {
      // 1. Build HTML with all photographed pages
      // Read each image as base64 or file URI
      const pageImagesHtml = await Promise.all(
        scannedPages.map(async (uri, idx) => {
          let src = uri;
          try {
            const base64 = await FileSystem.readAsStringAsync(uri, {
              encoding: FileSystem.EncodingType.Base64,
            });
            src = `data:image/jpeg;base64,${base64}`;
          } catch {
            // Fallback to direct URI
          }
          return `
            <div class="page">
              <div class="page-header">Quick2Learn Notes • Page ${idx + 1}</div>
              <img src="${src}" />
            </div>
          `;
        })
      );

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
          <style>
            @page { size: A4; margin: 10mm; }
            body { font-family: sans-serif; margin: 0; padding: 0; }
            .page {
              page-break-after: always;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              height: 100vh;
              box-sizing: border-box;
            }
            .page-header {
              font-size: 12px;
              color: #666;
              margin-bottom: 8px;
              text-align: right;
              width: 100%;
            }
            img {
              max-width: 100%;
              max-height: 90vh;
              object-fit: contain;
              border-radius: 4px;
            }
          </style>
        </head>
        <body>
          ${pageImagesHtml.join('')}
        </body>
        </html>
      `;

      // 2. Generate PDF with expo-print directly on the phone
      const { uri: pdfUri } = await Print.printToFileAsync({ html });

      // 3. Request presigned upload URL
      const cleanTitle = title.trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
      const filename = `${cleanTitle}_${Date.now()}.pdf`;

      const { key, uploadUrl } = await presignedUrlMutation.mutateAsync({
        filename,
        contentType: 'application/pdf',
        folder: 'notes',
      });

      // 4. Upload compiled PDF to storage
      await FileSystem.uploadAsync(uploadUrl, pdfUri, {
        httpMethod: 'PUT',
        headers: { 'Content-Type': 'application/pdf' },
        uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
      });

      // 5. Register in batch chapter content
      await quickUploadMutation.mutateAsync({
        batchId: selectedBatchId,
        chapterId: selectedChapterId,
        section: section || 'Class Notes',
        title: title.trim(),
        storageKey: key,
        pageCount: scannedPages.length,
        notifyBatch,
      });

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setToast({
        type: 'success',
        message: `Successfully uploaded ${scannedPages.length}-page notes PDF to batch!`,
      });

      // Reset
      setTitle('');
      setScannedPages([]);
    } catch (err: any) {
      setToast({
        type: 'error',
        message: err?.message || 'Failed to compile or upload PDF notes',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <KeyboardAwareScrollView className="flex-1 px-4 py-3 bg-surface-subtle">
      <Card className="p-4 bg-surface border border-border mb-4">
        <Text className="text-h3 font-bold text-ink mb-1">
          Quick Upload: Handwritten Notes to PDF
        </Text>
        <Text className="text-small text-ink-muted mb-4">
          Photograph handwritten pages. The app automatically compiles them into
          one clean PDF and uploads it to the chapter for students.
        </Text>

        {/* Batch picker */}
        <Text className="text-small font-semibold text-ink mb-1.5">
          Select Batch
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mb-3"
        >
          <View className="flex-row items-center space-x-2">
            {batches.map((b) => {
              const isSelected = b.id === selectedBatchId;
              return (
                <TouchableOpacity
                  key={b.id}
                  onPress={() => setSelectedBatchId(b.id)}
                  className={`px-3 py-2 rounded-lg border min-h-[44px] justify-center ${
                    isSelected
                      ? 'bg-primary border-primary'
                      : 'bg-surface border-border'
                  }`}
                >
                  <Text
                    className={`text-small font-semibold ${
                      isSelected ? 'text-white' : 'text-ink'
                    }`}
                  >
                    {b.title}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>

        {/* Chapter picker */}
        <Text className="text-small font-semibold text-ink mb-1.5">
          Select Chapter
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mb-3"
        >
          <View className="flex-row items-center space-x-2">
            {chapters.map((ch) => {
              const isSelected = ch.id === selectedChapterId;
              return (
                <TouchableOpacity
                  key={ch.id}
                  onPress={() => setSelectedChapterId(ch.id)}
                  className={`px-3 py-2 rounded-lg border min-h-[44px] justify-center ${
                    isSelected
                      ? 'bg-primary border-primary'
                      : 'bg-surface border-border'
                  }`}
                >
                  <Text
                    className={`text-small font-semibold ${
                      isSelected ? 'text-white' : 'text-ink'
                    }`}
                  >
                    {ch.chapterNumber ? `Ch ${ch.chapterNumber}: ` : ''}
                    {ch.title}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>

        {/* Title */}
        <Text className="text-small font-semibold text-ink mb-1">
          Notes Title
        </Text>
        <TextInput
          placeholder="e.g. Exercise 4.2 Formulae & Step-by-Step Solutions"
          value={title}
          onChangeText={setTitle}
          className="w-full px-3 py-2.5 bg-surface border border-border rounded-xl text-body text-ink mb-3 min-h-[48px]"
        />

        {/* Section label */}
        <Text className="text-small font-semibold text-ink mb-1">
          Section Category
        </Text>
        <TextInput
          placeholder="e.g. Class Notes, Formula Sheet, Homework"
          value={section}
          onChangeText={setSection}
          className="w-full px-3 py-2.5 bg-surface border border-border rounded-xl text-body text-ink mb-4 min-h-[48px]"
        />

        {/* Camera / Scanned Pages */}
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-small font-bold text-ink">
            Photographed Pages ({scannedPages.length})
          </Text>
        </View>

        {scannedPages.length === 0 ? (
          <View className="p-6 bg-surface-subtle border border-dashed border-border rounded-xl items-center justify-center mb-4">
            <Camera size={32} color="#9CA3AF" />
            <Text className="text-small text-ink-muted text-center mt-2 font-medium">
              No pages captured yet. Tap below to photograph page 1 of your notes.
            </Text>
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mb-4"
          >
            <View className="flex-row items-center space-x-3">
              {scannedPages.map((uri, idx) => (
                <View key={idx} className="relative w-24 h-32 mr-2">
                  <Image
                    source={{ uri }}
                    className="w-full h-full rounded-lg bg-surface-subtle border border-border"
                    resizeMode="cover"
                  />
                  <View className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/70">
                    <Text className="text-caption font-bold text-white">
                      Page {idx + 1}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => removePage(idx)}
                    className="absolute top-1 right-1 p-1 rounded-full bg-red-600"
                  >
                    <Trash2 size={12} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </ScrollView>
        )}

        <View className="flex-row items-center space-x-2 mb-4">
          <Button
            size="md"
            variant="outline"
            className="flex-1 mr-2"
            icon={<Camera size={18} color="#2563EB" />}
            onPress={handleCapturePage}
          >
            + Snap Page
          </Button>

          <Button
            size="md"
            variant="secondary"
            className="flex-1"
            icon={<Upload size={18} color="#374151" />}
            onPress={handlePickFromGallery}
          >
            + From Gallery
          </Button>
        </View>

        {/* Notify batch switch */}
        <View className="flex-row items-center justify-between p-3 bg-surface-subtle border border-border rounded-xl mb-4">
          <View className="flex-1 mr-3">
            <Text className="text-small font-bold text-ink">Notify batch</Text>
            <Text className="text-caption text-ink-muted">
              Sends push notification to students about new study notes
            </Text>
          </View>
          <Switch
            value={notifyBatch}
            onValueChange={setNotifyBatch}
            trackColor={{ false: '#D1D5DB', true: '#2563EB' }}
          />
        </View>

        {/* Submit */}
        <Button
          size="lg"
          variant="primary"
          fullWidth
          disabled={scannedPages.length === 0}
          loading={isProcessing}
          icon={<FileText size={18} color="#FFFFFF" />}
          onPress={handleCompileAndUpload}
        >
          Compile into PDF & Upload Notes
        </Button>
      </Card>
    </KeyboardAwareScrollView>
  );
} 