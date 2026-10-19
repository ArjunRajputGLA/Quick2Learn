import React from 'react';
import { View, Text, TouchableOpacity, ViewStyle } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { colors } from '@quick2learn/shared';

export interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  onSeeAll?: () => void;
  seeAllLabel?: string;
  className?: string;
  style?: ViewStyle;
}

export function SectionHeader({
  title,
  subtitle,
  onSeeAll,
  seeAllLabel = 'See all',
  className = '',
  style,
}: SectionHeaderProps) {
  return (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingVertical: 12,
          paddingHorizontal: 16,
        },
        style,
      ]}
      className={`flex-row items-center justify-between py-3 px-4 ${className}`}
    >
      <View style={{ flex: 1, marginRight: 12 }} className="flex-1 mr-3">
        <Text
          style={{ fontSize: 18, fontWeight: '700', color: colors.ink }}
          className="text-h3 font-semibold text-ink"
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {title}
        </Text>
        {subtitle ? (
          <Text
            style={{ fontSize: 12, color: colors['ink-muted'], marginTop: 2 }}
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
          style={{
            minHeight: 44,
            minWidth: 48,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'flex-end',
          }}
          className="min-h-[44px] min-w-[48px] flex-row items-center justify-end active:opacity-70"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text
            style={{ fontSize: 13, fontWeight: '600', color: colors.primary, marginRight: 2 }}
            className="text-small font-semibold text-primary mr-0.5"
          >
            {seeAllLabel}
          </Text>
          <ChevronRight size={16} color={colors.primary} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}
