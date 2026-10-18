import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { ChevronRight } from 'lucide-react-native';

export interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  onSeeAll?: () => void;
  seeAllLabel?: string;
  className?: string;
}

export function SectionHeader({
  title,
  subtitle,
  onSeeAll,
  seeAllLabel = 'See all',
  className = '',
}: SectionHeaderProps) {
  return (
    <View
      className={`flex-row items-center justify-between py-3 px-4 ${className}`}
    >
      <View className="flex-1 mr-3">
        <Text
          className="text-h3 font-semibold text-ink"
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {title}
        </Text>
        {subtitle ? (
          <Text
            className="text-caption text-ink-muted mt-0.5"
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {subtitle}
          </Text>
        ) : null}
      </View>

      {onSeeAll ? (
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={`${seeAllLabel} for ${title}`}
          onPress={onSeeAll}
          className="min-h-[44px] min-w-[48px] flex-row items-center justify-end active:opacity-70"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text className="text-small font-semibold text-primary mr-0.5">
            {seeAllLabel}
          </Text>
          <ChevronRight size={16} color="#3B82F6" />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}
