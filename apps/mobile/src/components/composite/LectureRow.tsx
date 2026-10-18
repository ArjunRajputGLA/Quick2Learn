import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { CheckCircle2, Play } from 'lucide-react-native';
import { ProgressBar } from '../ui/ProgressBar';

export interface LectureRowProps {
  title: string;
  chapterOrSubject?: string;
  duration: string; // e.g. "45:30"
  thumbnailUrl?: string;
  watched?: boolean;
  progressPercentage?: number; // 0 to 100
  onPress?: () => void;
  className?: string;
}

export function LectureRow({
  title,
  chapterOrSubject,
  duration,
  thumbnailUrl,
  watched = false,
  progressPercentage = 0,
  onPress,
  className = '',
}: LectureRowProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={onPress}
      className={`min-h-[76px] py-3 px-4 flex-row items-center border-b border-border/70 bg-surface active:bg-surface-subtle ${className}`}
    >
      {/* 16:9 Thumbnail container */}
      <View className="w-[120px] h-[68px] rounded-lg overflow-hidden bg-ink/10 mr-3 relative justify-end">
        {thumbnailUrl ? (
          <Image
            source={{ uri: thumbnailUrl }}
            style={{ width: '100%', height: '100%', position: 'absolute' }}
            contentFit="cover"
            transition={200}
          />
        ) : (
          <View className="absolute inset-0 bg-primary-soft items-center justify-center">
            <Play size={24} color="#3B82F6" />
          </View>
        )}

        {/* Watched tick or duration badge */}
        {watched ? (
          <View className="absolute top-1.5 right-1.5 bg-black/60 rounded-full p-0.5">
            <CheckCircle2 size={16} color="#22C55E" />
          </View>
        ) : (
          <View className="absolute bottom-1.5 right-1.5 bg-black/75 px-1.5 py-0.5 rounded">
            <Text className="text-[10px] font-bold text-white tracking-wider">
              {duration}
            </Text>
          </View>
        )}

        {/* Partial progress bar */}
        {!watched && progressPercentage > 0 ? (
          <View className="w-full">
            <ProgressBar
              progress={progressPercentage}
              height={3}
              color="#3B82F6"
              trackColor="rgba(0,0,0,0.4)"
            />
          </View>
        ) : null}
      </View>

      {/* Details */}
      <View className="flex-1 justify-center">
        <Text
          className="text-body font-semibold text-ink leading-snug"
          numberOfLines={2}
          ellipsizeMode="tail"
        >
          {title}
        </Text>
        {chapterOrSubject ? (
          <Text
            className="text-caption text-ink-muted mt-1"
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {chapterOrSubject}
          </Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}
