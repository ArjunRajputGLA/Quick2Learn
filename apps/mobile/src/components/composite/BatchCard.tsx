import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { Badge } from '../ui/Badge';
import { ProgressBar } from '../ui/ProgressBar';
import { Calendar, User } from 'lucide-react-native';
import { getFacultyAvatarSource } from '../../lib/facultyImages';

export interface BatchCardProps {
  classNameBadge: string; // e.g. "Class XII"
  boardBadge: string;     // e.g. "CBSE"
  title: string;          // e.g. "Target Board 2027 Mathematics"
  teacher: string;        // e.g. "Dinesh Singh Rajput" (shown once per batch)
  nextClassTime?: string; // e.g. "Mon, 22 Apr at 8:00 PM"
  progressPercentage?: number; // 0 to 100
  totalLectures?: number;
  completedLectures?: number;
  onPress?: () => void;
  className?: string;
}

function BatchCardComponent({
  classNameBadge,
  boardBadge,
  title,
  teacher,
  nextClassTime,
  progressPercentage,
  totalLectures,
  completedLectures,
  onPress,
  className = '',
}: BatchCardProps) {
  const facultyAvatar = getFacultyAvatarSource(teacher);

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Batch: ${title}. ${classNameBadge}. ${boardBadge}. Faculty: ${teacher}.${nextClassTime ? ` Next class: ${nextClassTime}.` : ''}`}
      className={`bg-surface border border-border rounded-2xl p-4 shadow-sm active:bg-surface-subtle ${className}`}
    >
      {/* Badges row */}
      <View className="flex-row items-center space-x-2 mb-2.5">
        <Badge label={classNameBadge} variant="primary" size="sm" />
        <View className="w-1.5" />
        <Badge label={boardBadge} variant="accent" size="sm" />
      </View>

      {/* Batch Title */}
      <Text
        className="text-h3 font-bold text-ink mb-1.5 leading-snug"
        numberOfLines={2}
      >
        {title}
      </Text>

      {/* Teacher Name (strictly shown once per batch card, never per row) */}
      <View className="flex-row items-center mb-3">
        {facultyAvatar ? (
          <Image
            source={facultyAvatar}
            style={{ width: 18, height: 18, borderRadius: 9, marginRight: 6 }}
            contentFit="cover"
          />
        ) : (
          <User size={14} color="#6B7280" className="mr-1.5" />
        )}
        <Text className="text-small text-ink-muted ml-1" numberOfLines={1}>
          {teacher}
        </Text>
      </View>

      {/* Next Class Info */}
      {nextClassTime ? (
        <View className="flex-row items-center bg-surface-subtle rounded-lg py-2 px-3 mb-3 border border-border/60">
          <Calendar size={14} color="#3B82F6" className="mr-2" />
          <Text className="text-caption font-medium text-ink ml-1.5 flex-1" numberOfLines={1}>
            Next class: <Text className="font-semibold">{nextClassTime}</Text>
          </Text>
        </View>
      ) : null}

      {/* Progress Section */}
      {progressPercentage !== undefined ? (
        <View className="mt-1">
          <View className="flex-row justify-between items-center mb-1.5">
            <Text className="text-caption text-ink-muted">Course progress</Text>
            <Text className="text-caption font-semibold text-primary">
              {Math.round(progressPercentage)}%
              {completedLectures !== undefined && totalLectures !== undefined
                ? ` (${completedLectures}/${totalLectures})`
                : ''}
            </Text>
          </View>
          <ProgressBar progress={progressPercentage} height={6} />
        </View>
      ) : null}
    </TouchableOpacity>
  );
}

export const BatchCard = React.memo(BatchCardComponent);
