import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { getFacultyAvatarSource } from '../../lib/facultyImages';
import {
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  Users,
  MessageCircle,
  AlertTriangle,
  Info,
  KeyRound,
  GraduationCap,
  ChevronRight,
} from 'lucide-react-native';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { ProgressBar } from '../ui/ProgressBar';
import { Skeleton } from '../ui/Skeleton';
import { useBatchTimetable } from '../../api/hooks';
import type { BatchDetailResponse, BatchTimetableSlot } from '@quick2learn/shared';

interface BatchMoreSectionProps {
  batchId: string;
  batchDetail?: BatchDetailResponse;
  isLoadingDetail: boolean;
}

const WEEKDAY_NAMES: Record<number, string> = {
  1: 'Monday',
  2: 'Tuesday',
  3: 'Wednesday',
  4: 'Thursday',
  5: 'Friday',
  6: 'Saturday',
  7: 'Sunday',
};

export function BatchMoreSection({
  batchId,
  batchDetail,
  isLoadingDetail,
}: BatchMoreSectionProps) {
  const router = useRouter();
  const { data: timetableData, isLoading: isLoadingTimetable } = useBatchTimetable(batchId);

  const slots: BatchTimetableSlot[] = (timetableData as any)?.slots || [];

  const handleOpenWhatsApp = async () => {
    const url = batchDetail?.whatsappGroupUrl || 'https://chat.whatsapp.com/Quick2Learn';
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Cannot Open WhatsApp', 'Please ensure WhatsApp is installed on your device.');
      }
    } catch {
      Alert.alert('Error', 'Could not open WhatsApp group link.');
    }
  };

  const handleReportProblem = () => {
    const subject = encodeURIComponent(`Issue with Batch: ${batchDetail?.title || batchId}`);
    const email = 'support@quick2learn.in';
    Linking.openURL(`mailto:${email}?subject=${subject}`).catch(() => {
      Alert.alert('Support Contact', 'Please email us directly at support@quick2learn.in or call centre office.');
    });
  };

  if (isLoadingDetail && !batchDetail) {
    return (
      <View className="space-y-4">
        <Skeleton width="100%" height={120} borderRadius={16} />
        <Skeleton width="100%" height={100} borderRadius={16} />
        <Skeleton width="100%" height={140} borderRadius={16} />
      </View>
    );
  }

  // Group slots by weekday
  const slotsByDay: Record<number, typeof slots> = {};
  for (const s of slots) {
    if (!slotsByDay[s.weekday]) {
      slotsByDay[s.weekday] = [];
    }
    slotsByDay[s.weekday].push(s);
  }

  return (
    <View className="space-y-5">
      {/* 1. Full Weekly Timetable */}
      <View className="space-y-3">
        <View className="flex-row items-center justify-between">
          <Text className="text-caption font-bold text-ink-muted uppercase tracking-wider">
            Full Weekly Timetable
          </Text>
          <Text className="text-caption font-semibold text-primary">
            {slots.length} Classes/Week
          </Text>
        </View>

        {isLoadingTimetable && !timetableData ? (
          <Skeleton width="100%" height={120} borderRadius={16} />
        ) : slots.length === 0 ? (
          <View className="p-4 rounded-xl bg-surface border border-border text-center items-center">
            <Clock size={20} color="#9CA3AF" />
            <Text className="text-caption text-ink-muted mt-1">
              No regular slots scheduled yet.
            </Text>
          </View>
        ) : (
          <View className="bg-surface rounded-2xl border border-border p-4 shadow-2xs divide-y divide-border/60">
            {[1, 2, 3, 4, 5, 6, 7].map((dayNum) => {
              const daySlots = slotsByDay[dayNum] || [];
              if (daySlots.length === 0) return null;

              return (
                <View key={dayNum} className="py-2.5 first:pt-0 last:pb-0 space-y-1.5">
                  <Text className="text-caption font-bold text-ink uppercase tracking-wide">
                    {WEEKDAY_NAMES[dayNum]}
                  </Text>

                  {daySlots.map((slot: BatchTimetableSlot) => (
                    <View
                      key={slot.id}
                      className="flex-row items-center justify-between bg-surface-subtle p-2.5 rounded-xl border border-border/40"
                    >
                      <View className="flex-1 mr-2">
                        <Text className="text-caption font-bold text-ink">
                          {slot.subjectName} · {slot.teacherName}
                        </Text>
                        {slot.roomOrLinkNote && (
                          <Text className="text-[11px] text-ink-muted">
                            {slot.roomOrLinkNote} ({slot.mode})
                          </Text>
                        )}
                      </View>

                      <Text className="text-caption font-bold text-primary font-mono">
                        {slot.startTime} - {slot.endTime}
                      </Text>
                    </View>
                  ))}
                </View>
              );
            })}
          </View>
        )}
      </View>

      {/* 2. Attendance Summary */}
      <View className="space-y-3">
        <Text className="text-caption font-bold text-ink-muted uppercase tracking-wider">
          Attendance Summary
        </Text>

        <View className="bg-surface rounded-2xl border border-border p-4 shadow-2xs space-y-3">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-h2 font-black text-ink">92%</Text>
              <Text className="text-caption font-semibold text-emerald-700">
                Good Standing
              </Text>
            </View>
            <View className="items-end">
              <Text className="text-caption font-semibold text-ink-muted">
                23 of 25 Classes Attended
              </Text>
              <Text className="text-[11px] text-ink-muted">
                2 Excused Absences
              </Text>
            </View>
          </View>

          <ProgressBar progress={0.92} height={6} color="#059669" />
        </View>
      </View>

      {/* Attendance & Class Participation */}
      <View className="space-y-3">
        <Text className="text-caption font-bold text-ink-muted uppercase tracking-wider">
          Attendance & Participation
        </Text>
        <TouchableOpacity
          onPress={() =>
            router.push(
              `/(app)/attendance?batchId=${batchId}&batchTitle=${encodeURIComponent(
                batchDetail?.title || ''
              )}` as any
            )
          }
          activeOpacity={0.8}
          className="bg-surface rounded-2xl border border-border p-4 shadow-2xs flex-row items-center justify-between"
        >
          <View className="flex-row items-center space-x-3 gap-3">
            <View className="w-10 h-10 rounded-xl bg-primary-soft items-center justify-center">
              <CheckCircle2 size={20} color="#2563EB" />
            </View>
            <View>
              <Text className="text-body font-bold text-ink">Class Attendance Calendar</Text>
              <Text className="text-caption text-ink-muted">View monthly turnout, absences & punctuality</Text>
            </View>
          </View>
          <ChevronRight size={18} color="#9CA3AF" />
        </TouchableOpacity>
      </View>

      {/* 3. Batch Information */}
      <View className="space-y-3">
        <Text className="text-caption font-bold text-ink-muted uppercase tracking-wider">
          Batch Details
        </Text>

        <View className="bg-surface rounded-2xl border border-border p-4 shadow-2xs divide-y divide-border/60 text-caption">
          <View className="flex-row items-center justify-between py-2 first:pt-0">
            <Text className="text-caption text-ink-muted">Join Code</Text>
            <View className="flex-row items-center bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
              <KeyRound size={12} color="#D97706" />
              <Text className="text-caption font-mono font-black text-amber-900 ml-1">
                {batchDetail?.joinCode || '—'}
              </Text>
            </View>
          </View>

          <View className="flex-row items-center justify-between py-2">
            <Text className="text-caption text-ink-muted">Academic Year</Text>
            <Text className="text-caption font-semibold text-ink">
              {batchDetail?.academicYear || '2026–2027'}
            </Text>
          </View>

          <View className="flex-row items-center justify-between py-2">
            <Text className="text-caption text-ink-muted">Start Date</Text>
            <Text className="text-caption font-semibold text-ink">
              {batchDetail?.startDate
                ? new Date(batchDetail.startDate).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })
                : '1 April 2026'}
            </Text>
          </View>

          <View className="flex-row items-center justify-between py-2">
            <Text className="text-caption text-ink-muted">Mode & Location</Text>
            <Text className="text-caption font-semibold text-ink capitalize">
              {batchDetail?.mode} ({batchDetail?.locationText || 'Coaching Center'})
            </Text>
          </View>

          <View className="flex-row items-center justify-between py-2 last:pb-0">
            <Text className="text-caption text-ink-muted">Instructors</Text>
            {(() => {
              const names = batchDetail?.teachers && batchDetail.teachers.length > 0
                ? batchDetail.teachers.map((t) => t.name)
                : ['Dinesh Singh Rajput'];
              return (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  {names.map((name, i) => {
                    const avatar = getFacultyAvatarSource(name);
                    return avatar ? (
                      <Image
                        key={i}
                        source={avatar}
                        style={{ width: 18, height: 18, borderRadius: 9 }}
                        contentFit="cover"
                      />
                    ) : null;
                  })}
                  <Text className="text-caption font-semibold text-ink">
                    {names.join(', ')}
                  </Text>
                </View>
              );
            })()}
          </View>
        </View>
      </View>

      {/* 4. WhatsApp Group & Support Actions */}
      <View className="space-y-3 pt-1">
        <Button
          variant="primary"
          size="lg"
          onPress={handleOpenWhatsApp}
          className="bg-emerald-600 border-emerald-600"
          icon={<MessageCircle size={18} color="#FFFFFF" />}
        >
          Join Batch WhatsApp Group
        </Button>

        <Button
          variant="outline"
          size="md"
          onPress={handleReportProblem}
          icon={<AlertTriangle size={16} color="#6B7280" />}
        >
          Report a Problem or Inquiry
        </Button>
      </View>
    </View>
  );
}
