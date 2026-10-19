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
import { colors, radii } from '@quick2learn/shared';
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
      style={{
        backgroundColor: colors.surface,
        borderRadius: radii.lg,
        borderWidth: 1,
        borderColor: colors.border,
        padding: 16,
        marginBottom: 14,
        elevation: 2,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
      }}
      className="bg-surface rounded-2xl border border-border p-4 mb-3 shadow-xs"
    >
      {/* Top row: Class & Mode */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 10,
        }}
        className="flex-row items-center justify-between mb-2"
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }} className="flex-row items-center space-x-1.5">
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
      <View style={{ marginBottom: 12 }}>
        <Text
          style={{ fontSize: 16, fontWeight: '700', color: colors.ink, lineHeight: 22 }}
          className="text-body-large font-bold text-ink leading-snug"
          numberOfLines={2}
        >
          {batch.title}
        </Text>
        <Text
          style={{ fontSize: 13, color: colors['ink-muted'], marginTop: 3 }}
          className="text-small text-ink-muted mt-0.5"
        >
          {batch.subjectName} · {batch.teacherName}
        </Text>
      </View>

      {/* Next Class Strip */}
      {batch.nextClass ? (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 12,
            paddingVertical: 9,
            borderRadius: radii.md,
            marginBottom: 12,
            backgroundColor: isLive ? 'rgba(239, 68, 68, 0.08)' : startsSoon ? '#FEF3C7' : colors['surface-subtle'],
            borderWidth: 1,
            borderColor: isLive ? 'rgba(239, 68, 68, 0.3)' : startsSoon ? '#FDE68A' : colors.border,
          }}
          className={`flex-row items-center justify-between px-3 py-2 rounded-xl mb-3 ${
            isLive
              ? 'bg-critical/10 border border-critical/30'
              : startsSoon
              ? 'bg-amber-50 border border-amber-200'
              : 'bg-surface-subtle border border-border/60'
          }`}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 }} className="flex-row items-center flex-1 mr-2">
            {isLive ? (
              <Radio size={15} color="#DC2626" />
            ) : (
              <Clock
                size={15}
                color={startsSoon ? '#D97706' : '#6B7280'}
              />
            )}
            <Text
              style={{
                fontSize: 12,
                fontWeight: '600',
                color: isLive ? '#DC2626' : startsSoon ? '#92400E' : colors.ink,
                marginLeft: 8,
                flex: 1,
              }}
              className="text-caption font-semibold ml-2 flex-1"
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
              style={{ fontSize: 11, color: colors['ink-muted'], fontWeight: '500' }}
              className="text-[11px] text-ink-muted font-medium"
              numberOfLines={1}
            >
              {batch.nextClass.roomOrLinkNote}
            </Text>
          )}
        </View>
      ) : (
        <View
          style={{
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: radii.md,
            backgroundColor: colors['surface-subtle'],
            borderWidth: 1,
            borderColor: colors.border,
            marginBottom: 12,
          }}
          className="px-3 py-1.5 rounded-xl bg-surface-subtle border border-border/50 mb-3"
        >
          <Text style={{ fontSize: 12, color: colors['ink-muted'] }} className="text-caption text-ink-muted">
            No class scheduled today
          </Text>
        </View>
      )}

      {/* Progress Bar */}
      <View style={{ paddingTop: 2 }} className="space-y-1 pt-1">
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }} className="flex-row items-center justify-between">
          <Text style={{ fontSize: 12, fontWeight: '600', color: colors['ink-muted'] }} className="text-[11px] font-semibold text-ink-muted">
            Syllabus Covered
          </Text>
          <Text style={{ fontSize: 12, fontWeight: '700', color: colors.primary }} className="text-[11px] font-bold text-primary">
            {batch.progressPercentage}%
          </Text>
        </View>
        <ProgressBar
          progress={batch.progressPercentage / 100}
          height={6}
          color={colors.primary}
        />
      </View>

      {/* Footer Chevron */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: 12,
          marginTop: 12,
          borderTopWidth: 1,
          borderTopColor: colors.border,
        }}
        className="flex-row items-center justify-between pt-3 mt-2 border-t border-border/50"
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }} className="flex-row items-center space-x-2">
          {batch.teacherAvatarUrl ? (
            <Image
              source={{ uri: batch.teacherAvatarUrl }}
              style={{ width: 22, height: 22, borderRadius: 11 }}
            />
          ) : (
            <View
              style={{
                width: 24,
                height: 24,
                borderRadius: 12,
                backgroundColor: colors['primary-soft'],
                alignItems: 'center',
                justifyContent: 'center',
              }}
              className="w-5 h-5 rounded-full bg-primary-soft items-center justify-center"
            >
              <Text style={{ fontSize: 11, fontWeight: '700', color: colors.primary }} className="text-[10px] font-bold text-primary">
                {batch.teacherName.slice(0, 1)}
              </Text>
            </View>
          )}
          <Text style={{ fontSize: 13, color: colors.ink, fontWeight: '600' }} className="text-caption text-ink font-medium">
            {batch.teacherName}
          </Text>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }} className="flex-row items-center space-x-1">
          <Text style={{ fontSize: 13, fontWeight: '600', color: colors.primary }} className="text-caption font-semibold text-primary">
            Open Batch
          </Text>
          <ChevronRight size={15} color={colors.primary} />
        </View>
      </View>
    </TouchableOpacity>
  );
}
