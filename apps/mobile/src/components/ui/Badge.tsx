import React from 'react';
import { View, Text } from 'react-native';

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
  let bgClass = 'bg-primary-soft';
  let textClass = 'text-primary';
  let dotColor = '#3B82F6';

  switch (variant) {
    case 'primary':
      bgClass = 'bg-primary-soft';
      textClass = 'text-primary';
      dotColor = '#3B82F6';
      break;
    case 'accent':
      bgClass = 'bg-accent-soft';
      textClass = 'text-warning';
      dotColor = '#F59E0B';
      break;
    case 'success':
      bgClass = 'bg-green-50';
      textClass = 'text-success';
      dotColor = '#15803D';
      break;
    case 'warning':
      bgClass = 'bg-amber-50';
      textClass = 'text-warning';
      dotColor = '#B45309';
      break;
    case 'danger':
      bgClass = 'bg-red-50';
      textClass = 'text-danger';
      dotColor = '#B91C1C';
      break;
    case 'neutral':
      bgClass = 'bg-surface-subtle border border-border';
      textClass = 'text-ink-muted';
      dotColor = '#6B7280';
      break;
  }

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5' : 'px-2.5 py-1';
  const textSizes = size === 'sm' ? 'text-[11px] leading-3' : 'text-caption font-semibold';

  return (
    <View
      className={`rounded-full flex-row items-center self-start ${sizeClasses} ${bgClass} ${className}`}
    >
      {dot ? (
        <View
          className="w-1.5 h-1.5 rounded-full mr-1.5"
          style={{ backgroundColor: dotColor }}
        />
      ) : null}

      {icon ? <View className="mr-1">{icon}</View> : null}

      <Text className={`${textSizes} font-semibold ${textClass}`}>{label}</Text>
    </View>
  );
}
