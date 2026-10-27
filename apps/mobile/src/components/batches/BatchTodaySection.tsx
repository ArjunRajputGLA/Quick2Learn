import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Pressable,
  Platform,
  ScrollView,
} from 'react-native';
import { Image } from 'expo-image';
import {
  Radio,
  Clock,
  MapPin,
  Calendar,
  Bell,
  Paperclip,
  FileText,
  ImageIcon,
  ChevronRight,
} from 'lucide-react-native';
import { Skeleton } from '../ui/Skeleton';
import { Badge } from '../ui/Badge';
import {
  useBatchTimetable,
  useBatchAnnouncements,
  useBatchLive,
} from '../../api/hooks';
import { AnnouncementAttachmentViewer } from './AnnouncementAttachmentViewer';
import { LiveBanner } from './LiveBanner';
import { BatchRecordingsSection } from './BatchRecordingsSection';
import { getFacultyAvatarSource } from '../../lib/facultyImages';
import type {
  BatchDetailResponse,
  AnnouncementAttachment,
  BatchTimetableSlot,
  LiveSessionItem,
  BatchAnnouncementItem,
} from '@quick2learn/shared';

interface BatchTodaySectionProps {
  batchId: string;
  batchDetail?: BatchDetailResponse;
  isLoadingDetail: boolean;
}

const WEEKDAYS = [
  { day: 1, short: 'Mon' },
  { day: 2, short: 'Tue' },
  { day: 3, short: 'Wed' },
  { day: 4, short: 'Thu' },
  { day: 5, short: 'Fri' },
  { day: 6, short: 'Sat' },
  { day: 7, short: 'Sun' },
];

function getTodayKolkataWeekday(): number {
  try {
    const now = new Date();
    const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
    const kolkataTime = new Date(utcMs + 5.5 * 60 * 60 * 1000);
    const day = kolkataTime.getDay(); // 0 = Sun, 1 = Mon ... 6 = Sat
    const weekday = day === 0 ? 7 : day;
    return Number.isFinite(weekday) && weekday >= 1 && weekday <= 7 ? weekday : 1;
  } catch {
    return 1;
  }
}

const FULL_DAY_NAMES: Record<number, string> = {
  1: 'Monday',
  2: 'Tuesday',
  3: 'Wednesday',
  4: 'Thursday',
  5: 'Friday',
  6: 'Saturday',
  7: 'Sunday',
};

export function BatchTodaySection({
  batchId,
  batchDetail,
  isLoadingDetail,
}: BatchTodaySectionProps) {
  const { data: timetableData, isLoading: isLoadingTimetable } = useBatchTimetable(batchId);
  const { data: announcementsData, isLoading: isLoadingAnnouncements } = useBatchAnnouncements(batchId);
  const { data: liveData } = useBatchLive(batchId);

  const [selectedAttachment, setSelectedAttachment] = useState<AnnouncementAttachment | null>(null);

  // Determine current day of week safely in Asia/Kolkata (1 = Mon ... 7 = Sun)
  const todayWeekday = getTodayKolkataWeekday();
  const [activeWeekday, setActiveWeekday] = useState<number>(todayWeekday);

  const slots: BatchTimetableSlot[] = (timetableData as any)?.slots || [];
  const selectedDaySlots = slots.filter((s: BatchTimetableSlot) => s.weekday === activeWeekday);

  const activeLiveSession: LiveSessionItem | null = (liveData as any)?.liveNow || (liveData as any)?.nextSession || null;

  const announcements = (announcementsData as any)?.announcements || [];

  if (isLoadingDetail && !batchDetail) {
    return (
      <View className="space-y-4">
        <Skeleton width="100%" height={90} borderRadius={16} />
        <Skeleton width="100%" height={70} borderRadius={16} />
        <Skeleton width="100%" height={120} borderRadius={16} />
      </View>
    );
  }

  const selectedDayName = FULL_DAY_NAMES[activeWeekday] || 'this day';
  const hasClassesOnAnyDay = slots.length > 0;
  const daysWithClasses = Array.from(new Set(slots.map((s) => FULL_DAY_NAMES[s.weekday]).filter(Boolean))).join(', ');

  return (
    <View className="space-y-5">
      {/* 1. LiveBanner (Pulsing Live Now / Countdown before start) or Modern Ambient Schedule Card */}
      {activeLiveSession ? (
        <LiveBanner session={activeLiveSession} />
      ) : (
        <View
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 20,
            padding: 16,
            borderWidth: 1,
            borderColor: '#E2E8F0',
            shadowColor: '#0F172A',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.04,
            shadowRadius: 6,
            elevation: 1,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: '#EFF6FF',
                paddingHorizontal: 8,
                paddingVertical: 3,
                borderRadius: 8,
                gap: 5,
              }}
            >
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#2563EB' }} />
              <Text style={{ fontSize: 11, fontWeight: '700', color: '#1D4ED8', textTransform: 'uppercase' }}>
                Batch Schedule
              </Text>
            </View>
            <View
              style={{
                width: 34,
                height: 34,
                borderRadius: 17,
                backgroundColor: '#F1F5F9',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Calendar size={18} color="#64748B" />
            </View>
          </View>
          <Text style={{ fontSize: 15, fontWeight: '800', color: '#0F172A', marginBottom: 2 }}>
            No Live Class Right Now
          </Text>
          <Text style={{ fontSize: 12.5, color: '#64748B', lineHeight: 18 }}>
            Live interactive sessions will appear here when class begins. Review syllabus & notes below.
          </Text>
        </View>
      )}

      {/* 2. Past Sessions & Recordings */}
      {(liveData as any)?.recentRecordings && (liveData as any).recentRecordings.length > 0 && (
        <BatchRecordingsSection recordings={(liveData as any).recentRecordings} />
      )}

      {/* 2. Week Strip with Today Highlighted */}
      <View className="space-y-3">
        <View className="flex-row items-center justify-between">
          <Text className="text-caption font-bold text-ink-muted uppercase tracking-wider">
            Weekly Schedule Strip
          </Text>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: activeWeekday === todayWeekday ? '#EFF6FF' : '#F1F5F9',
              paddingHorizontal: 8,
              paddingVertical: 2,
              borderRadius: 6,
            }}
          >
            <Text
              style={{
                fontSize: 11,
                fontWeight: '700',
                color: activeWeekday === todayWeekday ? '#2563EB' : '#64748B',
              }}
            >
              {activeWeekday === todayWeekday ? 'Today' : selectedDayName}
            </Text>
          </View>
        </View>

        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            backgroundColor: '#F8FAFC',
            padding: 6,
            borderRadius: 18,
            borderWidth: 1,
            borderColor: '#E2E8F0',
          }}
        >
          {WEEKDAYS.map((wd) => {
            const isToday = wd.day === todayWeekday;
            const isSelected = wd.day === activeWeekday;
            const hasClasses = slots.some((s: BatchTimetableSlot) => s.weekday === wd.day);

            return (
              <TouchableOpacity
                key={wd.day}
                activeOpacity={0.85}
                onPress={() => setActiveWeekday(wd.day)}
                accessibilityLabel={`${wd.short}${isToday ? ' (Today)' : ''}`}
                style={{
                  flex: 1,
                  paddingVertical: 9,
                  borderRadius: 12,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: isSelected
                    ? '#2563EB'
                    : isToday
                    ? '#FFFFFF'
                    : 'transparent',
                  borderWidth: isToday && !isSelected ? 1 : 0,
                  borderColor: isToday && !isSelected ? '#BFDBFE' : 'transparent',
                  elevation: isSelected ? 2 : isToday ? 1 : 0,
                  shadowColor: isSelected ? '#2563EB' : '#000000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: isSelected ? 0.25 : 0.05,
                  shadowRadius: 3,
                }}
              >
                <Text
                  style={{
                    fontSize: 11.5,
                    fontWeight: isSelected ? '800' : isToday ? '700' : '600',
                    color: isSelected
                      ? '#FFFFFF'
                      : isToday
                      ? '#2563EB'
                      : '#64748B',
                  }}
                >
                  {wd.short}
                </Text>

                {/* Dot indicator if has classes */}
                <View
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: 2.5,
                    marginTop: 4,
                    backgroundColor: isSelected
                      ? '#FFFFFF'
                      : hasClasses
                      ? '#2563EB'
                      : '#CBD5E1',
                    opacity: hasClasses || isSelected ? 1 : 0.3,
                  }}
                />
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Selected Day Classes */}
        <View className="space-y-2">
          {selectedDaySlots.length === 0 ? (
            <View
              style={{
                padding: 16,
                borderRadius: 16,
                backgroundColor: '#FFFFFF',
                borderWidth: 1,
                borderColor: '#E2E8F0',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: '#F1F5F9',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Clock size={16} color="#94A3B8" />
              </View>
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#334155', textAlign: 'center' }}>
                No classes scheduled on {selectedDayName}
              </Text>
              <Text style={{ fontSize: 11.5, color: '#64748B', textAlign: 'center', maxWidth: 280 }}>
                {hasClassesOnAnyDay && daysWithClasses
                  ? `Weekly lectures are scheduled on ${daysWithClasses}. Tap a day above to view timings.`
                  : 'Classes for this batch will appear in the schedule once announced.'}
              </Text>
            </View>
          ) : (
            selectedDaySlots.map((slot: BatchTimetableSlot) => (
              <View
                key={slot.id}
                className="bg-surface rounded-xl p-3.5 border border-border shadow-2xs flex-row items-center justify-between"
              >
                <View className="flex-1 mr-2">
                  <View className="flex-row items-center space-x-2 mb-0.5">
                    <Badge
                      label={slot.mode.toUpperCase()}
                      variant={slot.mode === 'offline' ? 'neutral' : 'primary'}
                      size="sm"
                    />
                    <Text className="text-body font-bold text-ink">
                      {slot.subjectName}
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 3 }}>
                    {getFacultyAvatarSource(slot.teacherName) ? (
                      <Image
                        source={getFacultyAvatarSource(slot.teacherName)!}
                        style={{ width: 18, height: 18, borderRadius: 9, marginRight: 6 }}
                        contentFit="cover"
                      />
                    ) : null}
                    <Text className="text-caption text-ink-muted">
                      {slot.teacherName} {slot.roomOrLinkNote ? `· ${slot.roomOrLinkNote}` : ''}
                    </Text>
                  </View>
                </View>

                <View className="items-end">
                  <Text className="text-caption font-bold text-primary font-mono">
                    {slot.startTime}
                  </Text>
                  <Text className="text-[10px] text-ink-muted font-mono">
                    to {slot.endTime}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>
      </View>

      {/* 3. Latest Announcements Section */}
      <View className="space-y-3 pt-2">
        <View className="flex-row items-center justify-between">
          <Text className="text-caption font-bold text-ink-muted uppercase tracking-wider">
            Batch Announcements ({announcements.length})
          </Text>
        </View>

        {isLoadingAnnouncements && !announcementsData ? (
          <Skeleton width="100%" height={100} borderRadius={16} />
        ) : announcements.length === 0 ? (
          <View
            style={{
              padding: 20,
              borderRadius: 20,
              backgroundColor: '#FFFFFF',
              borderWidth: 1,
              borderColor: '#E2E8F0',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: '#EFF6FF',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 8,
              }}
            >
              <Bell size={20} color="#2563EB" />
            </View>
            <Text style={{ fontSize: 14, fontWeight: '700', color: '#1E293B', marginBottom: 2 }}>
              No Announcements Yet
            </Text>
            <Text style={{ fontSize: 12, color: '#64748B', textAlign: 'center', maxWidth: 260 }}>
              Official batch notices, test schedules, and homework guidelines will appear here.
            </Text>
          </View>
        ) : (
          announcements.map((item: BatchAnnouncementItem) => (
            <View
              key={item.id}
              className="bg-surface rounded-2xl p-4 border border-border shadow-2xs space-y-2"
            >
              <View className="flex-row items-center justify-between">
                {item.isPinned ? (
                  <Badge label="PINNED NOTICE" variant="primary" size="sm" />
                ) : (
                  <Badge label="ANNOUNCEMENT" variant="neutral" size="sm" />
                )}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                  {(() => {
                    const author = (item as any).authorName || (batchDetail?.teachers && batchDetail.teachers[0]?.name);
                    const avatar = getFacultyAvatarSource(author);
                    return avatar ? (
                      <Image
                        source={avatar}
                        style={{ width: 16, height: 16, borderRadius: 8 }}
                        contentFit="cover"
                      />
                    ) : null;
                  })()}
                  <Text className="text-[11px] text-ink-muted font-medium">
                    {item.publishedAtFormatted || item.publishedAt}
                  </Text>
                </View>
              </View>

              <Text className="text-body font-bold text-ink">
                {item.title}
              </Text>
              <Text className="text-caption text-ink-muted leading-relaxed">
                {item.body}
              </Text>

              {/* Attachments */}
              {item.attachments && item.attachments.length > 0 && (
                <View className="pt-2 border-t border-border/50 space-y-2">
                  <Text className="text-[11px] font-bold uppercase tracking-wider text-ink-muted">
                    Attachments ({item.attachments.length})
                  </Text>
                  <View className="flex-row flex-wrap gap-2">
                    {item.attachments.map((att: AnnouncementAttachment, idx: number) => (
                      <TouchableOpacity
                        key={idx}
                        onPress={() => setSelectedAttachment(att)}
                        className="flex-row items-center px-3 py-2 rounded-xl bg-surface-subtle border border-border"
                      >
                        {att.type === 'pdf' ? (
                          <FileText size={16} color="#DC2626" />
                        ) : (
                          <ImageIcon size={16} color="#2563EB" />
                        )}
                        <Text
                          className="text-caption font-semibold text-ink ml-1.5 max-w-[140px] truncate"
                          numberOfLines={1}
                        >
                          {att.fileName}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
            </View>
          ))
        )}
      </View>

      {/* Attachment Full-Screen Modal */}
      <AnnouncementAttachmentViewer
        visible={Boolean(selectedAttachment)}
        attachment={selectedAttachment}
        onClose={() => setSelectedAttachment(null)}
      />
    </View>
  );
}
