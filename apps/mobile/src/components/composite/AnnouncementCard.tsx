import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Calendar } from 'lucide-react-native';
import { Badge } from '../ui/Badge';

export interface AnnouncementCardProps {
  title: string;
  message: string;
  date: string; // e.g. "Mon, 22 Apr" (Asia/Kolkata)
  category?: string; // e.g. "Schedule Update" or "Important"
  onPress?: () => void;
  className?: string;
}

function AnnouncementCardComponent({
  title,
  message,
  date,
  category,
  onPress,
  className = '',
}: AnnouncementCardProps) {
  const content = (
    <View
      className={`bg-surface border border-border rounded-2xl p-4 shadow-sm ${className}`}
      accessibilityLabel={`Announcement: ${title}. ${date}. ${category || ''}. ${message}`}
    >
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-row items-center">
          <Calendar size={13} color="#6B7280" />
          <Text className="text-caption text-ink-muted ml-1.5 font-medium">
            {date}
          </Text>
        </View>

        {category ? (
          <Badge label={category} variant="accent" size="sm" />
        ) : null}
      </View>

      <Text className="text-h3 font-semibold text-ink mb-1.5" numberOfLines={2}>
        {title}
      </Text>

      <Text
        className="text-body text-ink-muted leading-relaxed"
        numberOfLines={4}
      >
        {message}
      </Text>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`View announcement: ${title}`}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

export const AnnouncementCard = React.memo(AnnouncementCardComponent);
