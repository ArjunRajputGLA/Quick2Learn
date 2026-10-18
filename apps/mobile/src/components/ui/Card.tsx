import React from 'react';
import { View, TouchableOpacity, ViewProps } from 'react-native';

export interface CardProps extends ViewProps {
  onPress?: () => void;
  className?: string;
  children: React.ReactNode;
}

export function Card({
  onPress,
  className = '',
  children,
  ...rest
}: CardProps) {
  const baseClasses = `bg-surface border border-border rounded-xl p-4 shadow-sm ${className}`;

  if (onPress) {
    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onPress}
        className={`${baseClasses} active:bg-surface-subtle`}
        {...rest}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View className={baseClasses} {...rest}>
      {children}
    </View>
  );
}
