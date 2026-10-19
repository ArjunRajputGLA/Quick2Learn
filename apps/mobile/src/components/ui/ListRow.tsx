import React from 'react';
import { View, Text, TouchableOpacity, ViewStyle } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { colors } from '@quick2learn/shared';

export interface ListRowProps {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  trailing?: React.ReactNode;
  onPress?: () => void;
  showChevron?: boolean;
  border?: boolean;
  className?: string;
  style?: ViewStyle;
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
  style,
}: ListRowProps) {
  const content = (
    <View
      style={[
        {
          minHeight: 56,
          paddingVertical: 12,
          paddingHorizontal: 16,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: colors.surface,
          borderBottomWidth: border ? 1 : 0,
          borderBottomColor: colors.border,
        },
        style,
      ]}
      className={`min-h-[56px] py-3 px-4 flex-row items-center justify-between bg-surface ${
        border ? 'border-b border-border/70' : ''
      } ${className}`}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 12 }} className="flex-row items-center flex-1 mr-3">
        {icon ? (
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: colors['primary-soft'],
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 12,
            }}
            className="w-10 h-10 rounded-full bg-primary-soft/60 items-center justify-center mr-3"
          >
            {icon}
          </View>
        ) : null}

        <View style={{ flex: 1, justifyContent: 'center' }} className="flex-1 justify-center">
          <Text
            style={{ fontSize: 15, fontWeight: '500', color: colors.ink }}
            className="text-body font-medium text-ink"
            numberOfLines={2}
            ellipsizeMode="tail"
          >
            {title}
          </Text>
          {subtitle ? (
            <Text
              style={{ fontSize: 12, color: colors['ink-muted'], marginTop: 2 }}
              className="text-small text-ink-muted mt-0.5"
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center' }} className="flex-row items-center">
        {trailing}
        {showChevron ? (
          <ChevronRight size={18} color="#9CA3AF" />
        ) : null}
      </View>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={onPress}
        style={{ width: '100%' }}
        className="w-full active:bg-surface-subtle"
      >
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}
