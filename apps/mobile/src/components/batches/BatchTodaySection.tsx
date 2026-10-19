import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
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
import type { BatchDetailResponse, AnnouncementAttachment } from '@quick2learn/shared';

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

export function BatchTodaySection({
  batchId,
  batchDetail,
  isLoadingDetail,
}: BatchTodaySectionProps) {
  const { data: timetableData, isLoading: isLoadingTimetable } = useBatchTimetable(batchId);
  const { data: announcementsData, isLoading: isLoadingAnnouncements } = useBatchAnnouncements(batchId);
  const { data: liveData } = useBatchLive(batchId);

  const [selectedAttachment, setSelectedAttachment] = useState<AnnouncementAttachment | null>(null);

  // Determine current day of week in Asia/Kolkata (1 = Mon ... 7 = Sun)
  const nowKolkata = new Date(
    new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })
  );
  const rawDay = nowKolkata.getDay(); // 0 is Sun
  const todayWeekday = rawDay === 0 ? 7 : rawDay;

  const [activeWeekday, setActiveWeekday] = useState<number>(todayWeekday);

  const slots = timetableData?.slots || [];
  const selectedDaySlots = slots.filter((s) => s.weekday === activeWeekday);

  const activeLiveSession = liveData?.liveNow || liveData?.nextSession || null;

  const announcements = announcementsData?.announcements || [];

  if (isLoadingDetail && !batchDetail) {
    return (
      <View className="space-y-4">
        <Skeleton width="100%" height={90} borderRadius={16} />
        <Skeleton width="100%" height={70} borderRadius={16} />
        <Skeleton width="100%" height={120} borderRadius={16} />
      </View>
    );
  }

  return (
    <View className="space-y-5">
      {/* 1. LiveBanner (Pulsing Live Now / Countdown before start) */}
      {activeLiveSession ? (
        <LiveBanner session={activeLiveSession} />
      ) : (
        <View className="rounded-2xl p-4 bg-surface border border-border flex-row items-center justify-between mb-2">
          <View>
            <Text className="text-body font-bold text-ink">No Live Class Right Now</Text>
            <Text className="text-caption text-ink-muted">
              Check the schedule below for upcoming classes.
            </Text>
          </View>
          <Calendar size={24} color="#9CA3AF" />
        </View>
      )}

      {/* 2. Past Sessions & Recordings */}
      {liveData?.recentRecordings && liveData.recentRecordings.length > 0 && (
        <BatchRecordingsSection recordings={liveData.recentRecordings} />
      )}

      {/* 2. Week Strip with Today Highlighted */}
      <View className="space-y-3">
        <View className="flex-row items-center justify-between">
          <Text className="text-caption font-bold text-ink-muted uppercase tracking-wider">
            Weekly Schedule Strip
          </Text>
          <Text className="text-caption font-semibold text-primary">
            {activeWeekday === todayWeekday ? 'Today' : WEEKDAYS.find((w) => w.day === activeWeekday)?.short}
          </Text>
        </View>

        <View className="flex-row justify-between bg-surface-subtle p-1.5 rounded-2xl border border-border">
          {WEEKDAYS.map((wd) => {
            const isToday = wd.day === todayWeekday;
            const isSelected = wd.day === activeWeekday;
            const hasClasses = slots.some((s) => s.weekday === wd.day);

            return (
              <TouchableOpacity
                key={wd.day}
                onPress={() => setActiveWeekday(wd.day)}
                accessibilityLabel={`${wd.short}${isToday ? ' (Today)' : ''}`}
                className={`flex-1 py-2 rounded-xl items-center justify-center ${
                  isSelected
                    ? 'bg-primary shadow-xs'
                    : isToday
                    ? 'bg-surface border border-primary/30'
                    : ''
                }`}
              >
                <Text
                  className={`text-[11px] font-bold ${
                    isSelected
                      ? 'text-white'
                      : isToday
                      ? 'text-primary'
                      : 'text-ink-muted'
                  }`}
                >
                  {wd.short}
                </Text>

                {/* Dot indicator if has classes */}
                <View
                  className={`w-1.5 h-1.5 rounded-full mt-1 ${
                    isSelected
                      ? 'bg-white'
                      : hasClasses
                      ? 'bg-primary'
                      : 'bg-transparent'
                  }`}
                />
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Selected Day Classes */}
        <View className="space-y-2">
          {selectedDaySlots.length === 0 ? (
            <View className="p-4 rounded-xl bg-surface border border-border/80 text-center items-center">
              <Text className="text-caption text-ink-muted">
                No classes scheduled on {WEEKDAYS.find((w) => w.day === activeWeekday)?.short}.
              </Text>
            </View>
          ) : (
            selectedDaySlots.map((slot) => (
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
                  <Text className="text-caption text-ink-muted">
                    {slot.teacherName} {slot.roomOrLinkNote ? `· ${slot.roomOrLinkNote}` : ''}
                  </Text>
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
          <View className="p-5 rounded-2xl bg-surface border border-border items-center">
            <Bell size={24} color="#9CA3AF" />
            <Text className="text-caption text-ink-muted mt-2 text-center">
              No announcements posted for this batch yet.
            </Text>
          </View>
        ) : (
          announcements.map((item) => (
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
                <Text className="text-[11px] text-ink-muted font-medium">
                  {item.publishedAtFormatted || item.publishedAt}
                </Text>
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
                    {item.attachments.map((att, idx) => (
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
