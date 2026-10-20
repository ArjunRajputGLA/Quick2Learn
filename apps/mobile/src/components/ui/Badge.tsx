import React from 'react';
import { View, Text } from 'react-native';
import { colors, radii } from '@quick2learn/shared';

export interface BadgeProps {
  label: string;
  variant?: 'primary' | 'accent' | 'success' | 'warning' | 'danger' | 'neutral';
  size?: 'sm' | 'md';
  icon?: React.ReactNode;
  dot?: boolean;
  className?: string;
}

export function Badge({
  label,
  variant = 'primary',
  size = 'md',
  icon,
  dot = false,
  className = '',
}: BadgeProps) {
  let bgColor: string = colors['primary-soft'];
  let textColor: string = colors.primary;
  let dotColor: string = colors.primary;
  let borderColor: string = 'transparent';

  switch (variant) {
    case 'primary':
      bgColor = colors['primary-soft'];
      textColor = colors.primary;
      dotColor = colors.primary;
      borderColor = 'rgba(37, 99, 235, 0.2)';
      break;
    case 'accent':
      bgColor = colors['accent-soft'];
      textColor = '#B45309';
      dotColor = colors.accent;
      borderColor = 'rgba(245, 158, 11, 0.25)';
      break;
    case 'success':
      bgColor = '#DEF7EC';
      textColor = '#047857';
      dotColor = colors.success;
      borderColor = 'rgba(16, 185, 129, 0.25)';
      break;
    case 'warning':
      bgColor = '#FEF3C7';
      textColor = '#B45309';
      dotColor = '#B45309';
      borderColor = 'rgba(180, 83, 9, 0.2)';
      break;
    case 'danger':
      bgColor = '#FDE8E8';
      textColor = colors.danger;
      dotColor = colors.danger;
      borderColor = 'rgba(239, 68, 68, 0.2)';
      break;
    case 'neutral':
      bgColor = colors['surface-subtle'];
      textColor = colors['ink-muted'];
      dotColor = colors['ink-muted'];
      borderColor = colors.border;
      break;
  }

  const isSm = size === 'sm';
  const padH = isSm ? 6 : 8;
  const padV = isSm ? 2 : 3;
  const fontSize = isSm ? 10.5 : 11.5;

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        backgroundColor: bgColor,
        borderColor: borderColor,
        borderWidth: 1,
        borderRadius: radii.full,
        paddingHorizontal: padH,
        paddingVertical: padV,
      }}
      className={`rounded-full flex-row items-center self-start ${className}`}
    >
      {dot ? (
        <View
          style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: dotColor, marginRight: 5 }}
          className="w-1.5 h-1.5 rounded-full mr-1.5"
        />
      ) : null}

      {icon ? <View style={{ marginRight: 4 }} className="mr-1">{icon}</View> : null}

      <Text
        style={{ fontSize, fontWeight: '600', color: textColor }}
        className="font-semibold"
      >
        {label}
      </Text>
    </View>
  );
}
