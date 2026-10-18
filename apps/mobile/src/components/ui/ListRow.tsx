import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { ChevronRight } from 'lucide-react-native';

export interface ListRowProps {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  trailing?: React.ReactNode;
  onPress?: () => void;
  showChevron?: boolean;
  border?: boolean;
  className?: string;
}

export function ListRow({
  icon,
  title,
  subtitle,
  trailing,
  onPress,
  showChevron = false,
  border = true,
  className = '',
}: ListRowProps) {
  const content = (
    <View
      className={`min-h-[56px] py-3 px-4 flex-row items-center justify-between bg-surface ${
        border ? 'border-b border-border/70' : ''
      } ${className}`}
    >
      <View className="flex-row items-center flex-1 mr-3">
        {icon ? (
          <View className="w-10 h-10 rounded-full bg-primary-soft/60 items-center justify-center mr-3">
            {icon}
          </View>
        ) : null}

        <View className="flex-1 justify-center">
          <Text
            className="text-body font-medium text-ink"
            numberOfLines={2}
            ellipsizeMode="tail"
          >
            {title}
          </Text>
          {subtitle ? (
            <Text
              className="text-small text-ink-muted mt-0.5"
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>

      <View className="flex-row items-center">
        {trailing}
        {showChevron ? (
          <ChevronRight size={18} color="#9CA3AF" className="ml-1" />
        ) : null}
      </View>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={onPress}
        className="w-full active:bg-surface-subtle"
      >
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}
