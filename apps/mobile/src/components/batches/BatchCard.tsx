import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import {
  Clock,
  MapPin,
  ChevronRight,
  Radio,
  BookOpen,
} from 'lucide-react-native';
import { Badge } from '../ui/Badge';
import { ProgressBar } from '../ui/ProgressBar';
import type { MyBatchItem } from '@quick2learn/shared';

interface BatchCardProps {
  batch: MyBatchItem;
  onPress: () => void;
}

export function BatchCard({ batch, onPress }: BatchCardProps) {
  const isLive = batch.nextClass?.isLive;
  const startsSoon =
    batch.nextClass?.startsInMinutes !== undefined &&
    batch.nextClass.startsInMinutes <= 30 &&
    !isLive;

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Open ${batch.title}`}
      className="bg-surface rounded-2xl border border-border p-4 mb-3 shadow-xs"
    >
      {/* Top row: Class & Mode */}
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-row items-center space-x-1.5">
          <Badge
            label={`Class ${batch.classLevel}`}
            variant="neutral"
            size="sm"
          />
          <Badge
            label={batch.board.toUpperCase()}
            variant="neutral"
            size="sm"
          />
        </View>

        <Badge
          label={batch.mode.toUpperCase()}
          variant={batch.mode === 'offline' ? 'neutral' : 'primary'}
          size="sm"
        />
      </View>

      {/* Title & Subject */}
      <View className="mb-3">
        <Text
          className="text-body-large font-bold text-ink leading-snug"
          numberOfLines={2}
        >
          {batch.title}
        </Text>
        <Text className="text-small text-ink-muted mt-0.5">
          {batch.subjectName} · {batch.teacherName}
        </Text>
      </View>

      {/* Next Class Strip */}
      {batch.nextClass ? (
        <View
          className={`flex-row items-center justify-between px-3 py-2 rounded-xl mb-3 ${
            isLive
              ? 'bg-critical/10 border border-critical/30'
              : startsSoon
              ? 'bg-amber-50 border border-amber-200'
              : 'bg-surface-subtle border border-border/60'
          }`}
        >
          <View className="flex-row items-center flex-1 mr-2">
            {isLive ? (
              <Radio size={15} color="#DC2626" />
            ) : (
              <Clock
                size={15}
                color={startsSoon ? '#D97706' : '#6B7280'}
              />
            )}
            <Text
              className={`text-caption font-semibold ml-2 flex-1 ${
                isLive
                  ? 'text-critical font-bold'
                  : startsSoon
                  ? 'text-amber-800'
                  : 'text-ink'
              }`}
              numberOfLines={1}
            >
              {isLive
                ? 'LIVE NOW · In Progress'
                : startsSoon
                ? `Starts in ${batch.nextClass.startsInMinutes} mins (${batch.nextClass.timeFormatted})`
                : `${batch.nextClass.title} · ${batch.nextClass.timeFormatted}`}
            </Text>
          </View>

          {batch.nextClass.roomOrLinkNote && (
            <Text
              className="text-[11px] text-ink-muted font-medium"
              numberOfLines={1}
            >
              {batch.nextClass.roomOrLinkNote}
            </Text>
          )}
        </View>
      ) : (
        <View className="px-3 py-1.5 rounded-xl bg-surface-subtle border border-border/50 mb-3">
          <Text className="text-caption text-ink-muted">
            No class scheduled today
          </Text>
        </View>
      )}

      {/* Progress Bar */}
      <View className="space-y-1 pt-1">
        <View className="flex-row items-center justify-between">
          <Text className="text-[11px] font-semibold text-ink-muted">
            Syllabus Covered
          </Text>
          <Text className="text-[11px] font-bold text-primary">
            {batch.progressPercentage}%
          </Text>
        </View>
        <ProgressBar
          progress={batch.progressPercentage / 100}
          height={6}
          color="#2563EB"
        />
      </View>

      {/* Footer Chevron */}
      <View className="flex-row items-center justify-between pt-3 mt-2 border-t border-border/50">
        <View className="flex-row items-center space-x-2">
          {batch.teacherAvatarUrl ? (
            <Image
              source={{ uri: batch.teacherAvatarUrl }}
              style={{ width: 22, height: 22, borderRadius: 11 }}
            />
          ) : (
            <View className="w-5 h-5 rounded-full bg-primary-soft items-center justify-center">
              <Text className="text-[10px] font-bold text-primary">
                {batch.teacherName.slice(0, 1)}
              </Text>
            </View>
          )}
          <Text className="text-caption text-ink font-medium">
            {batch.teacherName}
          </Text>
        </View>

        <View className="flex-row items-center space-x-1">
          <Text className="text-caption font-semibold text-primary">
            Open Batch
          </Text>
          <ChevronRight size={14} color="#2563EB" />
        </View>
      </View>
    </TouchableOpacity>
  );
}
