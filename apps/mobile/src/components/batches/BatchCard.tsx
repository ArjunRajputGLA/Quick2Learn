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
import { getFacultyAvatarSource } from '../../lib/facultyImages';

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
        borderRadius: radii.md,
        borderWidth: 1,
        borderColor: colors.border,
        padding: 12,
        marginBottom: 10,
        elevation: 1,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 2,
      }}
      className="bg-surface rounded-xl border border-border p-3 mb-2.5 shadow-2xs"
    >
      {/* Top row: Class & Mode */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 8,
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
      <View style={{ marginBottom: 10 }}>
        <Text
          style={{ fontSize: 14, fontWeight: '700', color: colors.ink, lineHeight: 19 }}
          className="text-body font-bold text-ink leading-snug"
          numberOfLines={2}
        >
          {batch.title}
        </Text>
        <Text
          style={{ fontSize: 12, color: colors['ink-muted'], marginTop: 2 }}
          className="text-caption text-ink-muted mt-0.5"
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
            paddingHorizontal: 10,
            paddingVertical: 6,
            borderRadius: radii.sm,
            marginBottom: 8,
            backgroundColor: isLive ? 'rgba(239, 68, 68, 0.08)' : startsSoon ? '#FEF3C7' : colors['surface-subtle'],
            borderWidth: 1,
            borderColor: isLive ? 'rgba(239, 68, 68, 0.3)' : startsSoon ? '#FDE68A' : colors.border,
          }}
          className={`flex-row items-center justify-between px-2.5 py-1.5 rounded-lg mb-2 ${
            isLive
              ? 'bg-critical/10 border border-critical/30'
              : startsSoon
              ? 'bg-amber-50 border border-amber-200'
              : 'bg-surface-subtle border border-border/60'
          }`}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 }} className="flex-row items-center flex-1 mr-2">
            {isLive ? (
              <Radio size={13} color="#DC2626" />
            ) : (
              <Clock
                size={13}
                color={startsSoon ? '#D97706' : '#6B7280'}
              />
            )}
            <Text
              style={{
                fontSize: 11.5,
                fontWeight: '600',
                color: isLive ? '#DC2626' : startsSoon ? '#92400E' : colors.ink,
                marginLeft: 6,
                flex: 1,
              }}
              className="text-caption font-semibold ml-1.5 flex-1"
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
              style={{ fontSize: 10.5, color: colors['ink-muted'], fontWeight: '500' }}
              className="text-[10px] text-ink-muted font-medium"
              numberOfLines={1}
            >
              {batch.nextClass.roomOrLinkNote}
            </Text>
          )}
        </View>
      ) : (
        <View
          style={{
            paddingHorizontal: 10,
            paddingVertical: 6,
            borderRadius: radii.sm,
            backgroundColor: colors['surface-subtle'],
            borderWidth: 1,
            borderColor: colors.border,
            marginBottom: 8,
          }}
          className="px-2.5 py-1.5 rounded-lg bg-surface-subtle border border-border/50 mb-2"
        >
          <Text style={{ fontSize: 11.5, color: colors['ink-muted'] }} className="text-caption text-ink-muted">
            No class scheduled today
          </Text>
        </View>
      )}

      {/* Progress Bar */}
      <View style={{ paddingTop: 1 }} className="space-y-1">
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }} className="flex-row items-center justify-between">
          <Text style={{ fontSize: 11, fontWeight: '600', color: colors['ink-muted'] }} className="text-[11px] font-semibold text-ink-muted">
            Syllabus Covered
          </Text>
          <Text style={{ fontSize: 11, fontWeight: '700', color: colors.primary }} className="text-[11px] font-bold text-primary">
            {batch.progressPercentage}%
          </Text>
        </View>
        <ProgressBar
          progress={batch.progressPercentage / 100}
          height={4}
          color={colors.primary}
        />
      </View>

      {/* Footer Chevron */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: 8,
          marginTop: 8,
          borderTopWidth: 1,
          borderTopColor: colors.border,
        }}
        className="flex-row items-center justify-between pt-2 mt-2 border-t border-border/50"
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }} className="flex-row items-center space-x-1.5">
          {getFacultyAvatarSource(batch.teacherName) || batch.teacherAvatarUrl ? (
            <Image
              source={getFacultyAvatarSource(batch.teacherName) || { uri: batch.teacherAvatarUrl! }}
              style={{ width: 22, height: 22, borderRadius: 11 }}
              contentFit="cover"
            />
          ) : (
            <View
              style={{
                width: 22,
                height: 22,
                borderRadius: 11,
                backgroundColor: colors['primary-soft'],
                alignItems: 'center',
                justifyContent: 'center',
              }}
              className="w-5 h-5 rounded-full bg-primary-soft items-center justify-center"
            >
              <Text style={{ fontSize: 10, fontWeight: '700', color: colors.primary }} className="text-[10px] font-bold text-primary">
                {batch.teacherName.slice(0, 1)}
              </Text>
            </View>
          )}
          <Text style={{ fontSize: 12, color: colors.ink, fontWeight: '600' }} className="text-caption text-ink font-medium">
            {batch.teacherName}
          </Text>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }} className="flex-row items-center space-x-1">
          <Text style={{ fontSize: 12, fontWeight: '600', color: colors.primary }} className="text-caption font-semibold text-primary">
            Open Batch
          </Text>
          <ChevronRight size={14} color={colors.primary} />
        </View>
      </View>
    </TouchableOpacity>
  );
}
