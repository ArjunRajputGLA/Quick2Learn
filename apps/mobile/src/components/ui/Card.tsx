import React from 'react';
import { View, TouchableOpacity, ViewProps, ViewStyle } from 'react-native';
import { colors, radii } from '@quick2learn/shared';

export interface CardProps extends ViewProps {
  onPress?: () => void;
  className?: string;
  children: React.ReactNode;
}

export function Card({
  onPress,
  className = '',
  children,
  style,
  ...rest
}: CardProps) {
  const baseClasses = `bg-surface border border-border rounded-lg p-3 shadow-xs ${className}`;
  const baseStyle: ViewStyle = {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: 12,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  };

  if (onPress) {
    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onPress}
        style={[baseStyle, style as ViewStyle]}
        className={`${baseClasses} active:bg-surface-subtle`}
        {...rest}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View style={[baseStyle, style as ViewStyle]} className={baseClasses} {...rest}>
      {children}
    </View>
  );
}
