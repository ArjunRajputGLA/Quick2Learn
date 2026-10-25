import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Clock,
  Users,
  UserCheck,
  Plus,
  Check,
  X,
  Sparkles,
  Filter,
  AlertCircle,
  Edit3,
  ShieldCheck,
  Award,
  Search,
  BookOpen,
  MapPin,
  ChevronDown,
  ChevronUp,
  List,
  CalendarDays,
  User,
  Phone,
} from 'lucide-react-native';
import { colors, radii } from '@quick2learn/shared';
import {
  useAdminStore,
  type BatchItem,
  type BatchAttendanceRecord,
  type AdminStudentItem,
  type JoinRequestItem,
} from '../../lib/adminDataStore';

/**
 * Normalized student roster item
 */
export interface RosterStudent {
  id: string;
  fullName: string;
  rollNo: string;
  phone?: string;
  guardianPhone?: string;
  classLevel?: number;
}

/**
 * Individual class session representation
 */
export interface BatchClassSession {
  id: string; // unique session key
  batchId: string;
  batchTitle: string;
  subject: string;
  classLevel: number;
  board?: string;
  mode: 'offline' | 'online' | 'hybrid';
  room: string;
  faculty: string;
  date: string; // YYYY-MM-DD
  time: string; // Exact time: e.g. "05:00 PM – 06:30 PM"
  duration?: string;
  topic?: string;
  isLiveClass?: boolean;
  isConducted: boolean;
  attendanceStatus: 'marked' | 'pending';
  savedRecord?: BatchAttendanceRecord;
  roster: Array<{
    student: RosterStudent;
    status: 'P' | 'A' | 'L' | 'pending';
  }>;
  stats: {
    total: number;
    present: number;
    absent: number;
    late: number;
    rate: number;
  };
}

export interface AdminAttendanceCalendarProps {
  initialBatchId?: string;
  onBatchPress?: (batchId: string) => void;
  style?: any;
}

const PAD = (n: number) => n.toString().padStart(2, '0');

export function AdminAttendanceCalendar({
  initialBatchId,
  onBatchPress,
  style,
}: AdminAttendanceCalendarProps) {
  const store = useAdminStore();

  // Initialize store if needed
  useEffect(() => {
    if (!store.isInitialized) {
      store.init();
    }
  }, [store.isInitialized]);

  // View mode: 'calendar' (Matrix + Day details) or 'list' (All Classes Held log)
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');

  // Selected batch filter: 'all' or batchId
  const [selectedBatchId, setSelectedBatchId] = useState<string>(initialBatchId || 'all');

  // Search filter for Classes Log view
  const [searchQuery, setSearchQuery] = useState('');

  // Expanded class roster IDs set for accordions
  const [expandedSessionIds, setExpandedSessionIds] = useState<Record<string, boolean>>({});

  const toggleSessionAccordion = (sessionId: string) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExpandedSessionIds((prev) => ({
      ...prev,
      [sessionId]: !prev[sessionId],
    }));
  };

  // Month navigation state
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const todayStr = useMemo(() => {
    const t = new Date();
    return `${t.getFullYear()}-${PAD(t.getMonth() + 1)}-${PAD(t.getDate())}`;
  }, []);

  // Selected calendar day (defaults to today's date if current month, else 1st of month)
  const [selectedDateStr, setSelectedDateStr] = useState<string>(() => {
    const now = new Date();
    if (now.getFullYear() === year && now.getMonth() === month) {
      return `${year}-${PAD(month + 1)}-${PAD(now.getDate())}`;
    }
    return `${year}-${PAD(month + 1)}-01`;
  });

  // Keep selected date aligned when month changes
  const monthPrefix = useMemo(() => `${year}-${PAD(month + 1)}`, [year, month]);

  useEffect(() => {
    if (!selectedDateStr.startsWith(monthPrefix)) {
      const now = new Date();
      if (now.getFullYear() === year && now.getMonth() === month) {
        setSelectedDateStr(`${year}-${PAD(month + 1)}-${PAD(now.getDate())}`);
      } else {
        setSelectedDateStr(`${monthPrefix}-01`);
      }
    }
  }, [monthPrefix, year, month, selectedDateStr]);

  // Real institute batches from store
  const instituteBatches = store.batches;

  /**
   * Helper: Get real enrolled students roster for a batch (ZERO fake data)
   */
  const getBatchRoster = useMemo(() => {
    return (batchId: string): RosterStudent[] => {
      const batch = instituteBatches.find((b) => b.id === batchId);
      const studentMap = new Map<string, RosterStudent>();

      // 1. From store.students
      (store.students || []).forEach((s) => {
        const matchesId = s.enrolledBatchIds?.includes(batchId);
        const matchesName = batch && s.enrolledBatchNames?.some(
          (name) => name.trim().toLowerCase() === batch.title.trim().toLowerCase()
        );
        if (matchesId || matchesName) {
          studentMap.set(s.id, {
            id: s.id,
            fullName: s.fullName,
            rollNo: (s as any).rollNo || s.userId || s.id.slice(-4),
            phone: s.phone,
            guardianPhone: s.parentPhone || undefined,
            classLevel: s.classLevel,
          });
        }
      });

      // 2. From approved store.joinRequests
      (store.joinRequests || [])
        .filter((r) => r.status === 'approved')
        .forEach((r) => {
          const matchesBatchId = r.batchId === batchId;
          const matchesBatchTitle =
            batch && r.batchTitle?.trim().toLowerCase() === batch.title.trim().toLowerCase();
          if (matchesBatchId || matchesBatchTitle) {
            const sid = r.studentId || r.id;
            if (!studentMap.has(sid)) {
              studentMap.set(sid, {
                id: sid,
                fullName: r.studentName,
                rollNo: (r as any).rollNo || (r.studentId ? r.studentId.slice(-4) : 'ENR'),
                phone: r.studentPhone,
                guardianPhone: undefined,
                classLevel: r.classLevel,
              });
            }
          }
        });

      return Array.from(studentMap.values()).sort((a, b) =>
        a.fullName.localeCompare(b.fullName)
      );
    };
  }, [instituteBatches, store.students, store.joinRequests]);

  /**
   * Helper: Determine if a batch was scheduled on a given day of week
   */
  const isBatchScheduledOnDay = (batch: BatchItem, dayName: string, dayOfWeekIndex: number) => {
    if (batch.scheduleDays && batch.scheduleDays.length > 0) {
      return batch.scheduleDays.some(
        (d) => d.toLowerCase().slice(0, 3) === dayName.toLowerCase().slice(0, 3)
      );
    }
    // Default fallback if no days specified: Mon, Wed, Fri
    return dayOfWeekIndex === 1 || dayOfWeekIndex === 3 || dayOfWeekIndex === 5;
  };

  /**
   * Calculate all class sessions held or scheduled in this month from every batch
   */
  const monthClassSessions = useMemo(() => {
    const sessions: BatchClassSession[] = [];
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Map saved attendance records for quick lookup: `${batchId}__${date}`
    const savedMap = new Map<string, BatchAttendanceRecord>();
    (store.attendanceRecords || []).forEach((r) => {
      if (r.date.startsWith(monthPrefix)) {
        savedMap.set(`${r.batchId}__${r.date}`, r);
      }
    });

    // 1. Traverse all batches across all days of the month
    instituteBatches.forEach((batch) => {
      const rosterStudents = getBatchRoster(batch.id);

      for (let d = 1; d <= daysInMonth; d++) {
        const dateKey = `${year}-${PAD(month + 1)}-${PAD(d)}`;
        const dateObj = new Date(year, month, d);
        const dayOfWeek = dateObj.getDay();
        const dayName = dayNames[dayOfWeek];

        const savedRecord = savedMap.get(`${batch.id}__${dateKey}`);
        const isScheduled = isBatchScheduledOnDay(batch, dayName, dayOfWeek);
        const isPastOrToday = dateKey <= todayStr;

        // A class session exists if:
        // (a) An attendance record was explicitly marked/saved for it, OR
        // (b) It is scheduled on this day and the date has occurred (past or today)
        if (savedRecord || (isScheduled && isPastOrToday)) {
          const isMarked = !!savedRecord;
          const sessionTime =
            savedRecord?.time || batch.scheduleTime || '05:00 PM – 06:30 PM';
          const sessionRoom =
            savedRecord?.room || batch.room || (batch.mode === 'online' ? 'Online Live Room' : 'Main Classroom');
          const sessionFaculty = savedRecord?.faculty || batch.faculty || 'Dinesh Sir';
          const sessionTopic = savedRecord?.topic || batch.subject;

          // Build student roster with attendance statuses
          let presentCount = 0;
          let absentCount = 0;
          let lateCount = 0;

          const sessionRoster = rosterStudents.map((student) => {
            let status: 'P' | 'A' | 'L' | 'pending' = 'pending';
            if (savedRecord) {
              const recorded = savedRecord.records[student.id];
              if (recorded === 'P') {
                status = 'P';
                presentCount++;
              } else if (recorded === 'A') {
                status = 'A';
                absentCount++;
              } else if (recorded === 'L') {
                status = 'L';
                lateCount++;
              } else {
                status = 'A'; // Recorded session without status defaults to absent
                absentCount++;
              }
            }
            return { student, status };
          });

          const totalStudents = rosterStudents.length;
          const rate =
            isMarked && totalStudents > 0
              ? Math.round(((presentCount + lateCount) / totalStudents) * 100)
              : 0;

          sessions.push({
            id: `session-${batch.id}-${dateKey}`,
            batchId: batch.id,
            batchTitle: batch.title,
            subject: batch.subject,
            classLevel: batch.classLevel,
            board: batch.board,
            mode: batch.mode,
            room: sessionRoom,
            faculty: sessionFaculty,
            date: dateKey,
            time: sessionTime,
            topic: sessionTopic,
            isConducted: isPastOrToday,
            attendanceStatus: isMarked ? 'marked' : 'pending',
            savedRecord,
            roster: sessionRoster,
            stats: {
              total: totalStudents,
              present: presentCount,
              absent: absentCount,
              late: lateCount,
              rate,
            },
          });
        }
      }
    });

    // 2. Add any live classes from store.liveClasses for this month
    (store.liveClasses || []).forEach((lc) => {
      const lcDateStr = lc.scheduledAt ? lc.scheduledAt.split('T')[0] : '';
      if (lcDateStr && lcDateStr.startsWith(monthPrefix) && lcDateStr <= todayStr) {
        // Check if not already added
        const exists = sessions.some(
          (s) => s.batchId === lc.batchId && s.date === lcDateStr && s.isLiveClass
        );
        if (!exists) {
          const batch = instituteBatches.find((b) => b.id === lc.batchId);
          const rosterStudents = batch ? getBatchRoster(batch.id) : [];
          const savedRecord = savedMap.get(`${lc.batchId}__${lcDateStr}`);

          let presentCount = 0;
          let absentCount = 0;
          let lateCount = 0;

          const sessionRoster = rosterStudents.map((student) => {
            let status: 'P' | 'A' | 'L' | 'pending' = 'pending';
            if (savedRecord) {
              const recorded = savedRecord.records[student.id];
              if (recorded === 'P') {
                status = 'P';
                presentCount++;
              } else if (recorded === 'A') {
                status = 'A';
                absentCount++;
              } else if (recorded === 'L') {
                status = 'L';
                lateCount++;
              }
            }
            return { student, status };
          });

          const totalStudents = rosterStudents.length;
          const rate =
            savedRecord && totalStudents > 0
              ? Math.round(((presentCount + lateCount) / totalStudents) * 100)
              : 0;

          // Format time from scheduledAt
          let formattedTime = 'Live Class';
          try {
            const dt = new Date(lc.scheduledAt);
            formattedTime = dt.toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: true,
            });
            if (lc.duration) {
              formattedTime += ` • ${lc.duration}`;
            }
          } catch {}

          sessions.push({
            id: `live-${lc.id}-${lcDateStr}`,
            batchId: lc.batchId,
            batchTitle: lc.batchTitle || batch?.title || 'Live Batch Session',
            subject: batch?.subject || 'Live Class',
            classLevel: batch?.classLevel || 10,
            board: batch?.board,
            mode: 'online',
            room: 'Live Virtual Classroom',
            faculty: 'Dinesh Sir',
            date: lcDateStr,
            time: formattedTime,
            topic: lc.title,
            isLiveClass: true,
            isConducted: true,
            attendanceStatus: savedRecord ? 'marked' : 'pending',
            savedRecord,
            roster: sessionRoster,
            stats: {
              total: totalStudents,
              present: presentCount,
              absent: absentCount,
              late: lateCount,
              rate,
            },
          });
        }
      }
    });

    // Sort descending by date, then by time
    return sessions.sort((a, b) => b.date.localeCompare(a.date));
  }, [
    year,
    month,
    monthPrefix,
    todayStr,
    instituteBatches,
    store.attendanceRecords,
    store.liveClasses,
    getBatchRoster,
  ]);

  // Filtered sessions based on selected batch
  const filteredMonthSessions = useMemo(() => {
    if (selectedBatchId === 'all') return monthClassSessions;
    return monthClassSessions.filter((s) => s.batchId === selectedBatchId);
  }, [monthClassSessions, selectedBatchId]);

  // Sessions map by date: dateKey -> BatchClassSession[]
  const sessionsByDate = useMemo(() => {
    const map = new Map<string, BatchClassSession[]>();
    filteredMonthSessions.forEach((s) => {
      const arr = map.get(s.date) || [];
      arr.push(s);
      map.set(s.date, arr);
    });
    return map;
  }, [filteredMonthSessions]);

  // Overall Monthly KPI Metrics
  const monthMetrics = useMemo(() => {
    let totalPresent = 0;
    let totalExpected = 0;
    let markedClasses = 0;
    const conductedCount = filteredMonthSessions.length;

    filteredMonthSessions.forEach((s) => {
      if (s.attendanceStatus === 'marked') {
        markedClasses++;
        totalPresent += s.stats.present + s.stats.late;
        totalExpected += s.stats.total;
      }
    });

    const avgRate =
      totalExpected > 0 ? Math.round((totalPresent / totalExpected) * 100) : markedClasses > 0 ? 100 : 0;

    // Total unique students across relevant batches
    let enrolledRosterTotal = 0;
    if (selectedBatchId === 'all') {
      const allUniqueStudentIds = new Set<string>();
      instituteBatches.forEach((b) => {
        getBatchRoster(b.id).forEach((st) => allUniqueStudentIds.add(st.id));
      });
      enrolledRosterTotal = allUniqueStudentIds.size;
    } else {
      enrolledRosterTotal = getBatchRoster(selectedBatchId).length;
    }

    return {
      classesHeld: conductedCount,
      classesMarked: markedClasses,
      avgAttendanceRate: avgRate,
      enrolledStudents: enrolledRosterTotal,
    };
  }, [filteredMonthSessions, selectedBatchId, instituteBatches, getBatchRoster]);

  // Calendar Day Grid Matrix (Sunday to Saturday)
  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const calendarDays: Array<{
    dayNumber: number;
    dateKey: string;
    isToday: boolean;
    sessions: BatchClassSession[];
    hasMarked: boolean;
    hasPending: boolean;
    attendanceRate: number;
  } | null> = [];

  for (let i = 0; i < firstDayIndex; i++) {
    calendarDays.push(null);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dateKey = `${year}-${PAD(month + 1)}-${PAD(d)}`;
    const daySessions = sessionsByDate.get(dateKey) || [];
    const hasMarked = daySessions.some((s) => s.attendanceStatus === 'marked');
    const hasPending = daySessions.some((s) => s.attendanceStatus === 'pending');

    let totalP = 0;
    let totalE = 0;
    daySessions.forEach((s) => {
      if (s.attendanceStatus === 'marked') {
        totalP += s.stats.present + s.stats.late;
        totalE += s.stats.total;
      }
    });

    const rate = totalE > 0 ? Math.round((totalP / totalE) * 100) : 0;

    calendarDays.push({
      dayNumber: d,
      dateKey,
      isToday: dateKey === todayStr,
      sessions: daySessions,
      hasMarked,
      hasPending,
      attendanceRate: rate,
    });
  }

  // Selected date sessions
  const selectedDateSessions = sessionsByDate.get(selectedDateStr) || [];

  // Filtered sessions for "All Classes Log" view
  const searchFilteredSessions = useMemo(() => {
    if (!searchQuery.trim()) return filteredMonthSessions;
    const q = searchQuery.toLowerCase().trim();
    return filteredMonthSessions.filter(
      (s) =>
        s.batchTitle.toLowerCase().includes(q) ||
        s.subject.toLowerCase().includes(q) ||
        s.faculty.toLowerCase().includes(q) ||
        s.room.toLowerCase().includes(q) ||
        s.date.includes(q) ||
        s.roster.some((r) => r.student.fullName.toLowerCase().includes(q))
    );
  }, [filteredMonthSessions, searchQuery]);

  // Month navigation helpers
  const goToPrevMonth = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const goToToday = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const now = new Date();
    setCurrentDate(now);
    setSelectedDateStr(`${now.getFullYear()}-${PAD(now.getMonth() + 1)}-${PAD(now.getDate())}`);
  };

  const monthLabel = currentDate.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  // Attendance Marking / Editing Modal State
  const [markingModalVisible, setMarkingModalVisible] = useState(false);
  const [markingBatchId, setMarkingBatchId] = useState<string>('');
  const [markingDateStr, setMarkingDateStr] = useState<string>(selectedDateStr);
  const [markingTime, setMarkingTime] = useState<string>('');
  const [markingTopic, setMarkingTopic] = useState<string>('');
  const [markingRoom, setMarkingRoom] = useState<string>('');
  const [markingFaculty, setMarkingFaculty] = useState<string>('Dinesh Sir');
  const [markingRoster, setMarkingRoster] = useState<Record<string, 'P' | 'A' | 'L'>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Target batch and students for the marking modal
  const targetMarkingBatch = useMemo(() => {
    return instituteBatches.find((b) => b.id === markingBatchId) || instituteBatches[0];
  }, [instituteBatches, markingBatchId]);

  const targetMarkingStudents = useMemo(() => {
    if (!targetMarkingBatch) return [];
    return getBatchRoster(targetMarkingBatch.id);
  }, [targetMarkingBatch, getBatchRoster]);

  // Open Marking Modal for specific session or selected date
  const handleOpenMarkModal = (session?: BatchClassSession, fallbackBatchId?: string) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const bId =
      session?.batchId ||
      fallbackBatchId ||
      (selectedBatchId !== 'all' ? selectedBatchId : instituteBatches[0]?.id || '');
    const b = instituteBatches.find((item) => item.id === bId) || instituteBatches[0];
    const targetDate = session?.date || selectedDateStr;

    setMarkingBatchId(b ? b.id : '');
    setMarkingDateStr(targetDate);
    setMarkingTime(session?.time || b?.scheduleTime || '05:00 PM – 06:30 PM');
    setMarkingTopic(session?.topic || b?.subject || '');
    setMarkingRoom(session?.room || b?.room || 'Hall A (Smart Room)');
    setMarkingFaculty(session?.faculty || b?.faculty || 'Dinesh Sir');

    // Load existing records or default all present
    const existingRec = store.attendanceRecords.find(
      (r) => r.batchId === bId && r.date === targetDate
    );

    const rosterStudents = b ? getBatchRoster(b.id) : [];
    const initialMap: Record<string, 'P' | 'A' | 'L'> = {};

    rosterStudents.forEach((st) => {
      if (existingRec && existingRec.records[st.id]) {
        initialMap[st.id] = existingRec.records[st.id];
      } else {
        initialMap[st.id] = 'P'; // Default present
      }
    });

    setMarkingRoster(initialMap);
    setMarkingModalVisible(true);
  };

  // Save Attendance to Store
  const handleSaveAttendance = async () => {
    if (!markingBatchId) {
      Alert.alert('Selection Error', 'Please select a batch first.');
      return;
    }
    if (targetMarkingStudents.length === 0) {
      Alert.alert(
        'Empty Roster',
        'No students are currently enrolled in this batch. Please enroll students or approve join requests before saving attendance.'
      );
      return;
    }

    try {
      setIsSaving(true);
      await store.saveBatchAttendance(markingBatchId, markingDateStr, markingRoster, {
        time: markingTime.trim(),
        topic: markingTopic.trim(),
        room: markingRoom.trim(),
        faculty: markingFaculty.trim(),
      });

      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setMarkingModalVisible(false);

      const presentCount = Object.values(markingRoster).filter((v) => v === 'P' || v === 'L').length;
      Alert.alert(
        'Attendance Recorded!',
        `Attendance for ${targetMarkingBatch?.title.split('—')[0]?.trim() || 'Batch'} on ${markingDateStr} saved successfully.\n(${presentCount}/${targetMarkingStudents.length} Students Present)`
      );
    } catch {
      Alert.alert('Save Failed', 'Unable to record attendance at this time.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View
      style={[
        {
          backgroundColor: '#FFFFFF',
          borderRadius: 24,
          padding: 16,
          borderWidth: 1,
          borderColor: '#E2E8F0',
          shadowColor: '#0F172A',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.07,
          shadowRadius: 12,
          elevation: 3,
          marginBottom: 20,
        },
        style,
      ]}
    >
      {/* 1. INSTITUTE CALENDAR HEADER */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 14,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 14,
              backgroundColor: '#EEF2FF',
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1.5,
              borderColor: '#C7D2FE',
            }}
          >
            <CalendarIcon size={22} color="#2563EB" />
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={{ fontSize: 17, fontWeight: '900', color: '#0F172A' }}>
                Attendance Calendar
              </Text>
              <View
                style={{
                  backgroundColor: '#DCFCE7',
                  paddingHorizontal: 7,
                  paddingVertical: 2,
                  borderRadius: 6,
                }}
              >
                <Text style={{ fontSize: 9.5, fontWeight: '800', color: '#16A34A' }}>
                  OFFICIAL ROSTER
                </Text>
              </View>
            </View>
            <Text style={{ fontSize: 11.5, color: '#64748B', marginTop: 1 }}>
              Exact dates, times & student records for every batch
            </Text>
          </View>
        </View>

        <TouchableOpacity
          activeOpacity={0.75}
          onPress={goToToday}
          style={{
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: radii.full,
            backgroundColor: '#EFF6FF',
            borderWidth: 1,
            borderColor: '#BFDBFE',
          }}
        >
          <Text style={{ fontSize: 11.5, fontWeight: '800', color: '#2563EB' }}>Today</Text>
        </TouchableOpacity>
      </View>

      {/* 2. MONTH SELECTOR */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#F8FAFC',
          borderRadius: 16,
          paddingHorizontal: 10,
          paddingVertical: 8,
          borderWidth: 1,
          borderColor: '#E2E8F0',
          marginBottom: 12,
        }}
      >
        <TouchableOpacity
          onPress={goToPrevMonth}
          activeOpacity={0.7}
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            backgroundColor: '#FFFFFF',
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: '#CBD5E1',
          }}
          accessibilityLabel="Previous Month"
        >
          <ChevronLeft size={18} color="#1E293B" />
        </TouchableOpacity>

        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: 16, fontWeight: '900', color: '#0F172A' }}>
            {monthLabel}
          </Text>
          <Text style={{ fontSize: 10.5, color: '#64748B', fontWeight: '600', marginTop: 1 }}>
            Academic Session 2026–27 • Dinesh Sir Institute
          </Text>
        </View>

        <TouchableOpacity
          onPress={goToNextMonth}
          activeOpacity={0.7}
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            backgroundColor: '#FFFFFF',
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: '#CBD5E1',
          }}
          accessibilityLabel="Next Month"
        >
          <ChevronRight size={18} color="#1E293B" />
        </TouchableOpacity>
      </View>

      {/* 3. VIEW MODE SWITCHER TABS: [Calendar View] | [All Classes Log] */}
      <View
        style={{
          flexDirection: 'row',
          backgroundColor: '#F1F5F9',
          borderRadius: 12,
          padding: 3,
          marginBottom: 12,
        }}
      >
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => {
            void Haptics.selectionAsync();
            setViewMode('calendar');
          }}
          style={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: 8,
            borderRadius: 10,
            backgroundColor: viewMode === 'calendar' ? '#FFFFFF' : 'transparent',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: viewMode === 'calendar' ? 0.08 : 0,
            shadowRadius: 2,
            elevation: viewMode === 'calendar' ? 1 : 0,
            gap: 6,
          }}
        >
          <CalendarDays size={14} color={viewMode === 'calendar' ? '#2563EB' : '#64748B'} />
          <Text
            style={{
              fontSize: 12,
              fontWeight: '800',
              color: viewMode === 'calendar' ? '#1E293B' : '#64748B',
            }}
          >
            Calendar Grid
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => {
            void Haptics.selectionAsync();
            setViewMode('list');
          }}
          style={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: 8,
            borderRadius: 10,
            backgroundColor: viewMode === 'list' ? '#FFFFFF' : 'transparent',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: viewMode === 'list' ? 0.08 : 0,
            shadowRadius: 2,
            elevation: viewMode === 'list' ? 1 : 0,
            gap: 6,
          }}
        >
          <List size={14} color={viewMode === 'list' ? '#2563EB' : '#64748B'} />
          <Text
            style={{
              fontSize: 12,
              fontWeight: '800',
              color: viewMode === 'list' ? '#1E293B' : '#64748B',
            }}
          >
            All Classes Log ({filteredMonthSessions.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* 4. BATCH FILTER PILLS (HORIZONTAL SCROLL) */}
      <View style={{ marginBottom: 12 }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 6, paddingVertical: 2 }}
        >
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setSelectedBatchId('all');
            }}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: radii.full,
              backgroundColor: selectedBatchId === 'all' ? '#2563EB' : '#F1F5F9',
              borderWidth: 1,
              borderColor: selectedBatchId === 'all' ? '#2563EB' : '#E2E8F0',
            }}
          >
            <Text
              style={{
                fontSize: 11.5,
                fontWeight: '800',
                color: selectedBatchId === 'all' ? '#FFFFFF' : '#475569',
              }}
            >
              All Batches ({instituteBatches.length})
            </Text>
          </TouchableOpacity>

          {instituteBatches.map((b) => {
            const isSelected = selectedBatchId === b.id;
            return (
              <TouchableOpacity
                key={b.id}
                activeOpacity={0.8}
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSelectedBatchId(b.id);
                }}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: radii.full,
                  backgroundColor: isSelected ? '#2563EB' : '#F1F5F9',
                  borderWidth: 1,
                  borderColor: isSelected ? '#2563EB' : '#E2E8F0',
                }}
              >
                <Text
                  style={{
                    fontSize: 11.5,
                    fontWeight: '800',
                    color: isSelected ? '#FFFFFF' : '#475569',
                  }}
                >
                  {b.title.split('—')[0]?.trim() || b.title}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* 5. OVERVIEW STATS CARDS */}
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
        <View
          style={{
            flex: 1,
            backgroundColor: '#EFF6FF',
            borderRadius: 14,
            paddingVertical: 10,
            paddingHorizontal: 8,
            alignItems: 'center',
            borderWidth: 1,
            borderColor: '#BFDBFE',
          }}
        >
          <Text style={{ fontSize: 9.5, fontWeight: '800', color: '#1D4ED8', textTransform: 'uppercase' }}>
            CLASSES HELD
          </Text>
          <Text style={{ fontSize: 19, fontWeight: '900', color: '#1E3A8A', marginTop: 2 }}>
            {monthMetrics.classesHeld}
          </Text>
          <Text style={{ fontSize: 10, color: '#3B82F6', marginTop: 1 }}>
            {monthMetrics.classesMarked} Marked
          </Text>
        </View>

        <View
          style={{
            flex: 1,
            backgroundColor: '#F0FDF4',
            borderRadius: 14,
            paddingVertical: 10,
            paddingHorizontal: 8,
            alignItems: 'center',
            borderWidth: 1,
            borderColor: '#BBF7D0',
          }}
        >
          <Text style={{ fontSize: 9.5, fontWeight: '800', color: '#15803D', textTransform: 'uppercase' }}>
            AVG ATTENDANCE
          </Text>
          <Text style={{ fontSize: 19, fontWeight: '900', color: '#14532D', marginTop: 2 }}>
            {monthMetrics.avgAttendanceRate}%
          </Text>
          <Text style={{ fontSize: 10, color: '#16A34A', marginTop: 1 }}>Institute Avg</Text>
        </View>

        <View
          style={{
            flex: 1,
            backgroundColor: '#FAF5FF',
            borderRadius: 14,
            paddingVertical: 10,
            paddingHorizontal: 8,
            alignItems: 'center',
            borderWidth: 1,
            borderColor: '#E9D5FF',
          }}
        >
          <Text style={{ fontSize: 9.5, fontWeight: '800', color: '#7E22CE', textTransform: 'uppercase' }}>
            ACTIVE ROSTER
          </Text>
          <Text style={{ fontSize: 19, fontWeight: '900', color: '#581C87', marginTop: 2 }}>
            {monthMetrics.enrolledStudents}
          </Text>
          <Text style={{ fontSize: 10, color: '#9333EA', marginTop: 1 }}>Enrolled Students</Text>
        </View>
      </View>

      {/* 6. EMPTY INSTITUTE BATCHES CHECK */}
      {instituteBatches.length === 0 ? (
        <View
          style={{
            padding: 24,
            backgroundColor: '#F8FAFC',
            borderRadius: 18,
            alignItems: 'center',
            borderWidth: 1,
            borderColor: '#E2E8F0',
          }}
        >
          <AlertCircle size={32} color="#94A3B8" />
          <Text style={{ fontSize: 15, fontWeight: '800', color: '#0F172A', marginTop: 8 }}>
            No Institute Batches Found
          </Text>
          <Text
            style={{
              fontSize: 12,
              color: '#64748B',
              textAlign: 'center',
              marginTop: 4,
              lineHeight: 18,
            }}
          >
            Please create a batch first in the Batches tab to view scheduled class sessions, record daily attendance, and manage student rosters.
          </Text>
          {onBatchPress && (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => onBatchPress('')}
              style={{
                marginTop: 14,
                backgroundColor: '#2563EB',
                paddingHorizontal: 16,
                paddingVertical: 9,
                borderRadius: radii.full,
              }}
            >
              <Text style={{ fontSize: 12.5, fontWeight: '800', color: '#FFFFFF' }}>
                Go to Batches Tab
              </Text>
            </TouchableOpacity>
          )}
        </View>
      ) : viewMode === 'calendar' ? (
        /* ======================== MODE 1: CALENDAR VIEW ======================== */
        <>
          {/* Calendar Day Grid Matrix */}
          <View
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 18,
              padding: 10,
              borderWidth: 1,
              borderColor: '#F1F5F9',
              marginBottom: 14,
            }}
          >
            {/* Weekday Row Labels (S M T W T F S) */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 8,
                paddingBottom: 6,
                borderBottomWidth: 1,
                borderBottomColor: '#F1F5F9',
              }}
            >
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((lbl, idx) => (
                <View key={idx} style={{ width: `${100 / 7}%`, alignItems: 'center' }}>
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: '800',
                      color: idx === 0 ? '#EF4444' : '#64748B',
                    }}
                  >
                    {lbl}
                  </Text>
                </View>
              ))}
            </View>

            {/* Calendar Day Cells */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {calendarDays.map((cell, idx) => {
                if (!cell) {
                  return <View key={`blank-${idx}`} style={{ width: `${100 / 7}%`, height: 44 }} />;
                }

                const isSelected = selectedDateStr === cell.dateKey;
                const isToday = cell.isToday;
                const sessionsCount = cell.sessions.length;
                const hasMarked = cell.hasMarked;
                const hasPending = cell.hasPending;
                const rate = cell.attendanceRate;

                // Color code for status dots
                let dotColor = '#94A3B8';
                if (hasMarked) {
                  if (rate >= 85) dotColor = '#10B981';
                  else if (rate >= 70) dotColor = '#F59E0B';
                  else dotColor = '#EF4444';
                } else if (hasPending) {
                  dotColor = '#3B82F6';
                }

                return (
                  <TouchableOpacity
                    key={cell.dateKey}
                    activeOpacity={0.7}
                    onPress={() => {
                      void Haptics.selectionAsync();
                      setSelectedDateStr(cell.dateKey);
                    }}
                    style={{
                      width: `${100 / 7}%`,
                      height: 44,
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: 2,
                    }}
                  >
                    <View
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 11,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: isSelected
                          ? '#2563EB'
                          : isToday
                          ? '#EFF6FF'
                          : 'transparent',
                        borderWidth: isToday && !isSelected ? 1.5 : 0,
                        borderColor: '#2563EB',
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 12.5,
                          fontWeight: isSelected || isToday ? '900' : '600',
                          color: isSelected ? '#FFFFFF' : isToday ? '#2563EB' : '#1E293B',
                        }}
                      >
                        {cell.dayNumber}
                      </Text>

                      {/* Sessions indicator dot */}
                      {sessionsCount > 0 && (
                        <View
                          style={{
                            width: 5,
                            height: 5,
                            borderRadius: 2.5,
                            backgroundColor: isSelected ? '#FFFFFF' : dotColor,
                            marginTop: 1.5,
                          }}
                        />
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Legend */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 12,
                marginTop: 8,
                paddingTop: 8,
                borderTopWidth: 1,
                borderTopColor: '#F8FAFC',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981' }} />
                <Text style={{ fontSize: 9.5, color: '#64748B', fontWeight: '600' }}>≥85% Marked</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#F59E0B' }} />
                <Text style={{ fontSize: 9.5, color: '#64748B', fontWeight: '600' }}>70–84% Avg</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#3B82F6' }} />
                <Text style={{ fontSize: 9.5, color: '#64748B', fontWeight: '600' }}>Scheduled / Pending</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <View
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: 3.5,
                    borderWidth: 1.5,
                    borderColor: '#2563EB',
                  }}
                />
                <Text style={{ fontSize: 9.5, color: '#64748B', fontWeight: '600' }}>Today</Text>
              </View>
            </View>
          </View>

          {/* Selected Date Classes & Roster Section */}
          <View
            style={{
              backgroundColor: '#F8FAFC',
              borderRadius: 18,
              padding: 14,
              borderWidth: 1,
              borderColor: '#E2E8F0',
            }}
          >
            {/* Header: Exact Date */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 10,
              }}
            >
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={{ fontSize: 14, fontWeight: '900', color: '#0F172A' }}>
                  {new Date(selectedDateStr + 'T00:00:00').toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                  {selectedDateStr === todayStr ? ' (Today)' : ''}
                </Text>
                <Text style={{ fontSize: 11, color: '#64748B', marginTop: 1 }}>
                  {selectedDateSessions.length > 0
                    ? `${selectedDateSessions.length} Class session(s) held / scheduled`
                    : 'No batch classes scheduled on this date'}
                </Text>
              </View>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => handleOpenMarkModal()}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: '#2563EB',
                  paddingHorizontal: 12,
                  paddingVertical: 7,
                  borderRadius: radii.full,
                  gap: 5,
                }}
              >
                <Plus size={13} color="#FFFFFF" />
                <Text style={{ fontSize: 11.5, fontWeight: '800', color: '#FFFFFF' }}>
                  Mark Class
                </Text>
              </TouchableOpacity>
            </View>

            {/* List of class sessions on this date */}
            {selectedDateSessions.length > 0 ? (
              <View style={{ gap: 10 }}>
                {selectedDateSessions.map((session) => {
                  const isExpanded = !!expandedSessionIds[session.id];
                  const isMarked = session.attendanceStatus === 'marked';

                  return (
                    <View
                      key={session.id}
                      style={{
                        backgroundColor: '#FFFFFF',
                        borderRadius: 16,
                        padding: 12,
                        borderWidth: 1,
                        borderColor: isMarked ? '#E2E8F0' : '#DBEAFE',
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.04,
                        shadowRadius: 3,
                        elevation: 1,
                      }}
                    >
                      {/* Top Row: Batch Title & Attendance Status Badge */}
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'flex-start',
                          justifyContent: 'space-between',
                          marginBottom: 8,
                        }}
                      >
                        <View style={{ flex: 1, marginRight: 8 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                            <Text style={{ fontSize: 13.5, fontWeight: '800', color: '#0F172A' }}>
                              {session.batchTitle}
                            </Text>
                            {session.isLiveClass && (
                              <View
                                style={{
                                  backgroundColor: '#FEE2E2',
                                  paddingHorizontal: 6,
                                  paddingVertical: 1.5,
                                  borderRadius: 4,
                                }}
                              >
                                <Text style={{ fontSize: 9, fontWeight: '800', color: '#DC2626' }}>
                                  LIVE CLASS
                                </Text>
                              </View>
                            )}
                          </View>
                          <Text style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>
                            {session.subject} • Class {session.classLevel} ({session.board?.toUpperCase() || 'CBSE'})
                          </Text>
                        </View>

                        {/* Status Badge */}
                        <View
                          style={{
                            paddingHorizontal: 8,
                            paddingVertical: 3,
                            borderRadius: 8,
                            backgroundColor: isMarked
                              ? session.stats.rate >= 85
                                ? '#DCFCE7'
                                : session.stats.rate >= 70
                                ? '#FEF3C7'
                                : '#FEE2E2'
                              : '#EFF6FF',
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 10,
                              fontWeight: '900',
                              color: isMarked
                                ? session.stats.rate >= 85
                                  ? '#16A34A'
                                  : session.stats.rate >= 70
                                  ? '#D97706'
                                  : '#DC2626'
                                : '#2563EB',
                            }}
                          >
                            {isMarked ? `${session.stats.rate}% ATTENDANCE` : 'PENDING MARKING'}
                          </Text>
                        </View>
                      </View>

                      {/* Middle Row: Exact Date, Exact Time, Room & Faculty */}
                      <View
                        style={{
                          backgroundColor: '#F8FAFC',
                          borderRadius: 10,
                          padding: 8,
                          gap: 5,
                          marginBottom: 10,
                          borderWidth: 1,
                          borderColor: '#F1F5F9',
                        }}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                            <Clock size={13} color="#2563EB" />
                            <Text style={{ fontSize: 11.5, fontWeight: '800', color: '#1E293B' }}>
                              Time: {session.time}
                            </Text>
                          </View>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                            <CalendarIcon size={12} color="#64748B" />
                            <Text style={{ fontSize: 11, color: '#475569', fontWeight: '700' }}>
                              {session.date}
                            </Text>
                          </View>
                        </View>

                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                            <MapPin size={12} color="#64748B" />
                            <Text style={{ fontSize: 11, color: '#475569', fontWeight: '600' }}>
                              {session.room} • {session.mode.toUpperCase()}
                            </Text>
                          </View>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                            <User size={12} color="#64748B" />
                            <Text style={{ fontSize: 11, color: '#475569', fontWeight: '600' }}>
                              {session.faculty}
                            </Text>
                          </View>
                        </View>
                      </View>

                      {/* Attendance Counts bar */}
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          paddingVertical: 6,
                          borderTopWidth: 1,
                          borderTopColor: '#F1F5F9',
                        }}
                      >
                        {isMarked ? (
                          <View style={{ flexDirection: 'row', gap: 12 }}>
                            <Text style={{ fontSize: 11.5, color: '#16A34A', fontWeight: '800' }}>
                              ✓ {session.stats.present} Present
                            </Text>
                            <Text style={{ fontSize: 11.5, color: '#DC2626', fontWeight: '800' }}>
                              ✕ {session.stats.absent} Absent
                            </Text>
                            {session.stats.late > 0 && (
                              <Text style={{ fontSize: 11.5, color: '#D97706', fontWeight: '800' }}>
                                ⏱ {session.stats.late} Late
                              </Text>
                            )}
                          </View>
                        ) : (
                          <Text style={{ fontSize: 11, color: '#64748B', fontWeight: '600' }}>
                            {session.roster.length} Enrolled student(s) waiting for attendance
                          </Text>
                        )}

                        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                          <TouchableOpacity
                            activeOpacity={0.7}
                            onPress={() => toggleSessionAccordion(session.id)}
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              backgroundColor: '#F1F5F9',
                              paddingHorizontal: 8,
                              paddingVertical: 4,
                              borderRadius: 6,
                              gap: 3,
                            }}
                          >
                            <Users size={11} color="#475569" />
                            <Text style={{ fontSize: 10.5, fontWeight: '700', color: '#475569' }}>
                              Roster ({session.roster.length})
                            </Text>
                            {isExpanded ? (
                              <ChevronUp size={11} color="#475569" />
                            ) : (
                              <ChevronDown size={11} color="#475569" />
                            )}
                          </TouchableOpacity>

                          <TouchableOpacity
                            activeOpacity={0.7}
                            onPress={() => handleOpenMarkModal(session)}
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              backgroundColor: isMarked ? '#EEF2FF' : '#2563EB',
                              paddingHorizontal: 8,
                              paddingVertical: 4,
                              borderRadius: 6,
                              gap: 3,
                            }}
                          >
                            {isMarked ? (
                              <>
                                <Edit3 size={11} color="#2563EB" />
                                <Text style={{ fontSize: 10.5, fontWeight: '800', color: '#2563EB' }}>
                                  Edit
                                </Text>
                              </>
                            ) : (
                              <>
                                <CheckCircle2 size={11} color="#FFFFFF" />
                                <Text style={{ fontSize: 10.5, fontWeight: '800', color: '#FFFFFF' }}>
                                  Mark
                                </Text>
                              </>
                            )}
                          </TouchableOpacity>
                        </View>
                      </View>

                      {/* Expandable Student Roster Accordion */}
                      {isExpanded && (
                        <View
                          style={{
                            marginTop: 8,
                            paddingTop: 8,
                            borderTopWidth: 1,
                            borderTopColor: '#F1F5F9',
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 10.5,
                              fontWeight: '800',
                              color: '#64748B',
                              textTransform: 'uppercase',
                              marginBottom: 6,
                            }}
                          >
                            Enrolled Student Roster ({session.roster.length})
                          </Text>

                          {session.roster.length === 0 ? (
                            <View
                              style={{
                                padding: 12,
                                backgroundColor: '#F8FAFC',
                                borderRadius: 8,
                                alignItems: 'center',
                              }}
                            >
                              <Text style={{ fontSize: 11, color: '#64748B', textAlign: 'center' }}>
                                No students currently enrolled in this batch.
                              </Text>
                            </View>
                          ) : (
                            <View style={{ gap: 5 }}>
                              {session.roster.map(({ student, status }) => {
                                const statusBg =
                                  status === 'P'
                                    ? '#DCFCE7'
                                    : status === 'A'
                                    ? '#FEE2E2'
                                    : status === 'L'
                                    ? '#FEF3C7'
                                    : '#F1F5F9';
                                const statusText =
                                  status === 'P'
                                    ? '#16A34A'
                                    : status === 'A'
                                    ? '#DC2626'
                                    : status === 'L'
                                    ? '#D97706'
                                    : '#64748B';
                                const statusLabel =
                                  status === 'P'
                                    ? '✓ Present'
                                    : status === 'A'
                                    ? '✕ Absent'
                                    : status === 'L'
                                    ? '⏱ Late'
                                    : 'Pending';

                                return (
                                  <View
                                    key={student.id}
                                    style={{
                                      flexDirection: 'row',
                                      alignItems: 'center',
                                      justifyContent: 'space-between',
                                      backgroundColor: '#F8FAFC',
                                      paddingVertical: 6,
                                      paddingHorizontal: 8,
                                      borderRadius: 8,
                                    }}
                                  >
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                      <View
                                        style={{
                                          width: 24,
                                          height: 24,
                                          borderRadius: 6,
                                          backgroundColor: '#EEF2FF',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                        }}
                                      >
                                        <Text style={{ fontSize: 9.5, fontWeight: '800', color: '#2563EB' }}>
                                          {student.rollNo}
                                        </Text>
                                      </View>
                                      <View>
                                        <Text style={{ fontSize: 12, fontWeight: '700', color: '#0F172A' }}>
                                          {student.fullName}
                                        </Text>
                                        {student.phone ? (
                                          <Text style={{ fontSize: 10, color: '#64748B' }}>
                                            {student.phone}
                                          </Text>
                                        ) : null}
                                      </View>
                                    </View>

                                    <View
                                      style={{
                                        backgroundColor: statusBg,
                                        paddingHorizontal: 7,
                                        paddingVertical: 2,
                                        borderRadius: 6,
                                      }}
                                    >
                                      <Text style={{ fontSize: 10.5, fontWeight: '800', color: statusText }}>
                                        {statusLabel}
                                      </Text>
                                    </View>
                                  </View>
                                );
                              })}
                            </View>
                          )}
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            ) : (
              <View
                style={{
                  paddingVertical: 16,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Clock size={24} color="#94A3B8" />
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#475569', marginTop: 6 }}>
                  No classes held or scheduled on this date
                </Text>
                <Text style={{ fontSize: 11, color: '#64748B', textAlign: 'center', marginTop: 2 }}>
                  Tap "Mark Class" above to record a special or extra class session for any batch.
                </Text>
              </View>
            )}
          </View>
        </>
      ) : (
        /* ======================== MODE 2: ALL CLASSES HELD LOG ======================== */
        <View>
          {/* Search Bar */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#F8FAFC',
              borderRadius: 14,
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderWidth: 1,
              borderColor: '#E2E8F0',
              marginBottom: 12,
            }}
          >
            <Search size={16} color="#64748B" />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search by batch, subject, faculty or student..."
              placeholderTextColor="#94A3B8"
              style={{
                flex: 1,
                marginLeft: 8,
                fontSize: 12.5,
                color: '#0F172A',
                padding: 0,
              }}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <X size={15} color="#64748B" />
              </TouchableOpacity>
            )}
          </View>

          {/* List of all classes held in this month */}
          {searchFilteredSessions.length === 0 ? (
            <View
              style={{
                padding: 24,
                backgroundColor: '#F8FAFC',
                borderRadius: 16,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: '#E2E8F0',
              }}
            >
              <CalendarIcon size={28} color="#94A3B8" />
              <Text style={{ fontSize: 13, fontWeight: '800', color: '#0F172A', marginTop: 8 }}>
                No Classes Found
              </Text>
              <Text style={{ fontSize: 11.5, color: '#64748B', textAlign: 'center', marginTop: 2 }}>
                {searchQuery
                  ? 'No class sessions match your search query.'
                  : 'No classes were conducted or scheduled for the selected filter.'}
              </Text>
            </View>
          ) : (
            <View style={{ gap: 10 }}>
              {searchFilteredSessions.map((session) => {
                const isExpanded = !!expandedSessionIds[session.id];
                const isMarked = session.attendanceStatus === 'marked';

                return (
                  <View
                    key={session.id}
                    style={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: 16,
                      padding: 12,
                      borderWidth: 1,
                      borderColor: '#E2E8F0',
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.04,
                      shadowRadius: 3,
                      elevation: 1,
                    }}
                  >
                    {/* Header: Date + Time + Status */}
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: 6,
                      }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <View
                          style={{
                            backgroundColor: '#EEF2FF',
                            paddingHorizontal: 8,
                            paddingVertical: 3,
                            borderRadius: 6,
                          }}
                        >
                          <Text style={{ fontSize: 11, fontWeight: '900', color: '#2563EB' }}>
                            {session.date}
                          </Text>
                        </View>
                        <Text style={{ fontSize: 11, fontWeight: '700', color: '#475569' }}>
                          🕒 {session.time}
                        </Text>
                      </View>

                      <View
                        style={{
                          backgroundColor: isMarked
                            ? session.stats.rate >= 85
                              ? '#DCFCE7'
                              : session.stats.rate >= 70
                              ? '#FEF3C7'
                              : '#FEE2E2'
                            : '#EFF6FF',
                          paddingHorizontal: 7,
                          paddingVertical: 2,
                          borderRadius: 6,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 10,
                            fontWeight: '800',
                            color: isMarked
                              ? session.stats.rate >= 85
                                ? '#16A34A'
                                : session.stats.rate >= 70
                                ? '#D97706'
                                : '#DC2626'
                              : '#2563EB',
                          }}
                        >
                          {isMarked ? `${session.stats.rate}% ATTENDANCE` : 'PENDING'}
                        </Text>
                      </View>
                    </View>

                    {/* Batch details */}
                    <Text style={{ fontSize: 13, fontWeight: '800', color: '#0F172A', marginBottom: 2 }}>
                      {session.batchTitle}
                    </Text>
                    <Text style={{ fontSize: 11, color: '#64748B', marginBottom: 6 }}>
                      {session.subject} • Class {session.classLevel} ({session.board?.toUpperCase() || 'CBSE'}) • {session.room} • {session.faculty}
                    </Text>

                    {/* Footer Row: Stats and Action */}
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingTop: 6,
                        borderTopWidth: 1,
                        borderTopColor: '#F1F5F9',
                      }}
                    >
                      {isMarked ? (
                        <View style={{ flexDirection: 'row', gap: 10 }}>
                          <Text style={{ fontSize: 11, color: '#16A34A', fontWeight: '800' }}>
                            ✓ {session.stats.present} Present
                          </Text>
                          <Text style={{ fontSize: 11, color: '#DC2626', fontWeight: '800' }}>
                            ✕ {session.stats.absent} Absent
                          </Text>
                          {session.stats.late > 0 && (
                            <Text style={{ fontSize: 11, color: '#D97706', fontWeight: '800' }}>
                              ⏱ {session.stats.late} Late
                            </Text>
                          )}
                        </View>
                      ) : (
                        <Text style={{ fontSize: 11, color: '#64748B', fontWeight: '600' }}>
                          Attendance pending marking
                        </Text>
                      )}

                      <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                        <TouchableOpacity
                          activeOpacity={0.7}
                          onPress={() => toggleSessionAccordion(session.id)}
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            backgroundColor: '#F1F5F9',
                            paddingHorizontal: 8,
                            paddingVertical: 4,
                            borderRadius: 6,
                            gap: 3,
                          }}
                        >
                          <Users size={11} color="#475569" />
                          <Text style={{ fontSize: 10.5, fontWeight: '700', color: '#475569' }}>
                            Roster ({session.roster.length})
                          </Text>
                          {isExpanded ? (
                            <ChevronUp size={11} color="#475569" />
                          ) : (
                            <ChevronDown size={11} color="#475569" />
                          )}
                        </TouchableOpacity>

                        <TouchableOpacity
                          activeOpacity={0.7}
                          onPress={() => handleOpenMarkModal(session)}
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            backgroundColor: isMarked ? '#EEF2FF' : '#2563EB',
                            paddingHorizontal: 8,
                            paddingVertical: 4,
                            borderRadius: 6,
                            gap: 3,
                          }}
                        >
                          {isMarked ? (
                            <>
                              <Edit3 size={11} color="#2563EB" />
                              <Text style={{ fontSize: 10.5, fontWeight: '800', color: '#2563EB' }}>
                                Edit
                              </Text>
                            </>
                          ) : (
                            <>
                              <CheckCircle2 size={11} color="#FFFFFF" />
                              <Text style={{ fontSize: 10.5, fontWeight: '800', color: '#FFFFFF' }}>
                                Mark
                              </Text>
                            </>
                          )}
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Accordion Roster */}
                    {isExpanded && (
                      <View
                        style={{
                          marginTop: 8,
                          paddingTop: 8,
                          borderTopWidth: 1,
                          borderTopColor: '#F1F5F9',
                          gap: 4,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 10.5,
                            fontWeight: '800',
                            color: '#64748B',
                            textTransform: 'uppercase',
                            marginBottom: 4,
                          }}
                        >
                          Class Attendance Roster ({session.roster.length})
                        </Text>
                        {session.roster.map(({ student, status }) => {
                          const statusBg =
                            status === 'P'
                              ? '#DCFCE7'
                              : status === 'A'
                              ? '#FEE2E2'
                              : status === 'L'
                              ? '#FEF3C7'
                              : '#F1F5F9';
                          const statusText =
                            status === 'P'
                              ? '#16A34A'
                              : status === 'A'
                              ? '#DC2626'
                              : status === 'L'
                              ? '#D97706'
                              : '#64748B';
                          const statusLabel =
                            status === 'P'
                              ? '✓ Present'
                              : status === 'A'
                              ? '✕ Absent'
                              : status === 'L'
                              ? '⏱ Late'
                              : 'Pending';

                          return (
                            <View
                              key={student.id}
                              style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                backgroundColor: '#F8FAFC',
                                paddingVertical: 5,
                                paddingHorizontal: 8,
                                borderRadius: 6,
                              }}
                            >
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                <View
                                  style={{
                                    width: 22,
                                    height: 22,
                                    borderRadius: 5,
                                    backgroundColor: '#EEF2FF',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                  }}
                                >
                                  <Text style={{ fontSize: 9, fontWeight: '800', color: '#2563EB' }}>
                                    {student.rollNo}
                                  </Text>
                                </View>
                                <Text style={{ fontSize: 11.5, fontWeight: '700', color: '#0F172A' }}>
                                  {student.fullName}
                                </Text>
                              </View>

                              <View
                                style={{
                                  backgroundColor: statusBg,
                                  paddingHorizontal: 6,
                                  paddingVertical: 1.5,
                                  borderRadius: 4,
                                }}
                              >
                                <Text style={{ fontSize: 10, fontWeight: '800', color: statusText }}>
                                  {statusLabel}
                                </Text>
                              </View>
                            </View>
                          );
                        })}
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          )}
        </View>
      )}

      {/* ======================== ATTENDANCE MARKING / EDITING MODAL SHEET ======================== */}
      <Modal
        visible={markingModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setMarkingModalVisible(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            justifyContent: 'flex-end',
          }}
        >
          <View
            style={{
              backgroundColor: '#FFFFFF',
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              paddingTop: 12,
              paddingBottom: Platform.OS === 'ios' ? 34 : 24,
              paddingHorizontal: 16,
              maxHeight: '90%',
            }}
          >
            {/* Modal drag bar */}
            <View
              style={{
                width: 38,
                height: 4,
                borderRadius: 2,
                backgroundColor: '#CBD5E1',
                alignSelf: 'center',
                marginBottom: 12,
              }}
            />

            {/* Modal Header */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 12,
              }}
            >
              <View>
                <Text style={{ fontSize: 17, fontWeight: '900', color: '#0F172A' }}>
                  Record Batch Attendance
                </Text>
                <Text style={{ fontSize: 12, color: '#64748B', marginTop: 1 }}>
                  Exact Date: {markingDateStr} • {targetMarkingBatch?.title.split('—')[0]?.trim()}
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => setMarkingModalVisible(false)}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: '#F1F5F9',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={18} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Batch Selector pills in modal */}
            <Text
              style={{
                fontSize: 10.5,
                fontWeight: '800',
                color: '#475569',
                textTransform: 'uppercase',
                marginBottom: 6,
              }}
            >
              Select Batch:
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 6, marginBottom: 10 }}
            >
              {instituteBatches.map((b) => {
                const isSelected = markingBatchId === b.id;
                return (
                  <TouchableOpacity
                    key={b.id}
                    onPress={() => {
                      setMarkingBatchId(b.id);
                      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      // Update defaults from this batch
                      setMarkingTime(b.scheduleTime || '05:00 PM – 06:30 PM');
                      setMarkingRoom(b.room || 'Hall A');
                      setMarkingTopic(b.subject);
                      // Reset initial roster for this batch
                      const students = getBatchRoster(b.id);
                      const initialMap: Record<string, 'P' | 'A' | 'L'> = {};
                      students.forEach((st) => (initialMap[st.id] = 'P'));
                      setMarkingRoster(initialMap);
                    }}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: radii.full,
                      backgroundColor: isSelected ? '#2563EB' : '#F1F5F9',
                      borderWidth: 1,
                      borderColor: isSelected ? '#2563EB' : '#E2E8F0',
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 11.5,
                        fontWeight: '800',
                        color: isSelected ? '#FFFFFF' : '#475569',
                      }}
                    >
                      {b.title.split('—')[0]?.trim()}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Exact Time & Room Details */}
            <View
              style={{
                flexDirection: 'row',
                gap: 8,
                backgroundColor: '#F8FAFC',
                padding: 8,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: '#E2E8F0',
                marginBottom: 10,
              }}
            >
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 10, fontWeight: '800', color: '#64748B', textTransform: 'uppercase' }}>
                  Exact Class Time
                </Text>
                <TextInput
                  value={markingTime}
                  onChangeText={setMarkingTime}
                  placeholder="e.g. 05:00 PM – 06:30 PM"
                  placeholderTextColor="#94A3B8"
                  style={{
                    fontSize: 12,
                    fontWeight: '700',
                    color: '#0F172A',
                    padding: 0,
                    marginTop: 2,
                  }}
                />
              </View>

              <View style={{ width: 1, backgroundColor: '#E2E8F0' }} />

              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 10, fontWeight: '800', color: '#64748B', textTransform: 'uppercase' }}>
                  Room / Venue
                </Text>
                <TextInput
                  value={markingRoom}
                  onChangeText={setMarkingRoom}
                  placeholder="e.g. Hall A (Smart Room)"
                  placeholderTextColor="#94A3B8"
                  style={{
                    fontSize: 12,
                    fontWeight: '700',
                    color: '#0F172A',
                    padding: 0,
                    marginTop: 2,
                  }}
                />
              </View>
            </View>

            {/* Quick Bulk Actions: All Present / All Absent */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingVertical: 7,
                paddingHorizontal: 10,
                backgroundColor: '#F8FAFC',
                borderRadius: 12,
                marginBottom: 10,
              }}
            >
              <Text style={{ fontSize: 11.5, fontWeight: '800', color: '#64748B' }}>
                Quick Roster Fill:
              </Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity
                  onPress={() => {
                    const updated: Record<string, 'P' | 'A' | 'L'> = {};
                    targetMarkingStudents.forEach((st) => (updated[st.id] = 'P'));
                    setMarkingRoster(updated);
                    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  style={{
                    paddingHorizontal: 10,
                    paddingVertical: 5,
                    backgroundColor: '#DCFCE7',
                    borderRadius: 8,
                  }}
                >
                  <Text style={{ fontSize: 11, fontWeight: '800', color: '#16A34A' }}>
                    All Present
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    const updated: Record<string, 'P' | 'A' | 'L'> = {};
                    targetMarkingStudents.forEach((st) => (updated[st.id] = 'A'));
                    setMarkingRoster(updated);
                    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  style={{
                    paddingHorizontal: 10,
                    paddingVertical: 5,
                    backgroundColor: '#FEE2E2',
                    borderRadius: 8,
                  }}
                >
                  <Text style={{ fontSize: 11, fontWeight: '800', color: '#DC2626' }}>
                    All Absent
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Student Roster List */}
            <ScrollView
              style={{ maxHeight: 280 }}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ gap: 6, paddingBottom: 10 }}
            >
              {targetMarkingStudents.length === 0 ? (
                <View
                  style={{
                    padding: 20,
                    alignItems: 'center',
                    backgroundColor: '#F8FAFC',
                    borderRadius: 12,
                  }}
                >
                  <Users size={24} color="#94A3B8" />
                  <Text style={{ fontSize: 12.5, fontWeight: '800', color: '#0F172A', marginTop: 6 }}>
                    No Enrolled Students
                  </Text>
                  <Text
                    style={{
                      fontSize: 11,
                      color: '#64748B',
                      textAlign: 'center',
                      marginTop: 2,
                    }}
                  >
                    No students are enrolled in this batch yet. Approve pending join requests in the Admin Portal to add students to this roster.
                  </Text>
                </View>
              ) : (
                targetMarkingStudents.map((st) => {
                  const currentStatus = markingRoster[st.id] || 'P';
                  return (
                    <View
                      key={st.id}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        backgroundColor: '#FFFFFF',
                        borderRadius: 12,
                        paddingVertical: 8,
                        paddingHorizontal: 10,
                        borderWidth: 1,
                        borderColor: '#E2E8F0',
                      }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, marginRight: 8 }}>
                        <View
                          style={{
                            width: 30,
                            height: 30,
                            borderRadius: 8,
                            backgroundColor: '#EEF2FF',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Text style={{ fontSize: 10.5, fontWeight: '900', color: '#2563EB' }}>
                            {st.rollNo}
                          </Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 12.5, fontWeight: '800', color: '#0F172A' }} numberOfLines={1}>
                            {st.fullName}
                          </Text>
                          {st.phone ? (
                            <Text style={{ fontSize: 10, color: '#64748B' }}>
                              {st.phone}
                            </Text>
                          ) : null}
                        </View>
                      </View>

                      {/* Status Pills: P, A, L */}
                      <View style={{ flexDirection: 'row', gap: 5 }}>
                        {(['P', 'A', 'L'] as const).map((stat) => {
                          const isStatActive = currentStatus === stat;
                          const bgColor = isStatActive
                            ? stat === 'P'
                              ? '#16A34A'
                              : stat === 'A'
                              ? '#DC2626'
                              : '#D97706'
                            : '#F1F5F9';
                          const textColor = isStatActive ? '#FFFFFF' : '#64748B';

                          return (
                            <TouchableOpacity
                              key={stat}
                              onPress={() => {
                                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                setMarkingRoster((prev) => ({
                                  ...prev,
                                  [st.id]: stat,
                                }));
                              }}
                              style={{
                                width: 34,
                                height: 32,
                                borderRadius: 8,
                                backgroundColor: bgColor,
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <Text style={{ fontSize: 12, fontWeight: '900', color: textColor }}>
                                {stat}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                  );
                })
              )}
            </ScrollView>

            {/* Save Button */}
            <TouchableOpacity
              activeOpacity={0.85}
              disabled={isSaving || targetMarkingStudents.length === 0}
              onPress={handleSaveAttendance}
              style={{
                marginTop: 10,
                backgroundColor: targetMarkingStudents.length === 0 ? '#94A3B8' : '#2563EB',
                borderRadius: 14,
                paddingVertical: 13,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: '900', color: '#FFFFFF' }}>
                {isSaving ? 'Saving Roster...' : 'Save Attendance Record'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
