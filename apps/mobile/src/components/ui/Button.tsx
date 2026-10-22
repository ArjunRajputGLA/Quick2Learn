import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  View,
  StyleProp,
  ViewStyle,
  TextStyle,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, radii } from '@quick2learn/shared';

export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  children: React.ReactNode;
  className?: string;
  style?: StyleProp<ViewStyle>;
  onPress?: (e: any) => void;
  accessibilityLabel?: string;
  testID?: string;
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  icon,
  iconPosition = 'left',
  children,
  className = '',
  style,
  onPress,
  accessibilityLabel,
  testID,
}: ButtonProps) {
  const handlePress = (e: any) => {
    if (disabled || loading) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    } catch {
      // Haptics safe fallback
    }
    onPress?.(e);
  };

  const sizeClasses = {
    sm: 'min-h-[38px] px-3 py-1.5',
    md: 'min-h-[42px] px-4 py-2.5',
    lg: 'min-h-[46px] px-5 py-3',
  }[size];

  const sizeStyles: Record<'sm' | 'md' | 'lg', ViewStyle> = {
    sm: { minHeight: 38, paddingHorizontal: 12, paddingVertical: 6 },
    md: { minHeight: 42, paddingHorizontal: 16, paddingVertical: 9 },
    lg: { minHeight: 46, paddingHorizontal: 20, paddingVertical: 11 },
  };

  const textSizes = {
    sm: 'text-[12px] font-semibold',
    md: 'text-[13.5px] font-semibold',
    lg: 'text-[15px] font-semibold',
  }[size];

  const textStyles: Record<'sm' | 'md' | 'lg', TextStyle> = {
    sm: { fontSize: 12, fontWeight: '600' },
    md: { fontSize: 13.5, fontWeight: '600' },
    lg: { fontSize: 15, fontWeight: '600' },
  };

  const getVariantStyles = (): { container: ViewStyle; text: TextStyle; spinner: string } => {
    switch (variant) {
      case 'primary':
        return {
          container: {
            backgroundColor: disabled
              ? 'rgba(59, 130, 246, 0.5)'
              : colors.primary,
          },
          text: { color: '#FFFFFF' },
          spinner: '#FFFFFF',
        };
      case 'secondary':
        return {
          container: {
            backgroundColor: disabled
              ? 'rgba(245, 247, 251, 0.5)'
              : colors['surface-subtle'],
            borderWidth: 1,
            borderColor: colors.border,
          },
          text: { color: disabled ? colors['ink-muted'] : colors.ink },
          spinner: colors.ink,
        };
      case 'outline':
        return {
          container: {
            backgroundColor: 'transparent',
            borderWidth: 1,
            borderColor: disabled ? colors.border : colors.primary,
          },
          text: { color: disabled ? colors['ink-muted'] : colors.primary },
          spinner: colors.primary,
        };
      case 'ghost':
        return {
          container: {
            backgroundColor: 'transparent',
          },
          text: { color: disabled ? colors['ink-muted'] : colors.primary },
          spinner: colors.primary,
        };
      case 'danger':
        return {
          container: {
            backgroundColor: disabled
              ? 'rgba(185, 28, 28, 0.5)'
              : colors.danger,
          },
          text: { color: '#FFFFFF' },
          spinner: '#FFFFFF',
        };
    }
  };

  const { container: variantStyle, text: variantTextStyle, spinner: spinnerColor } = getVariantStyles();

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: disabled || loading }}
      activeOpacity={0.85}
      disabled={disabled || loading}
      onPress={handlePress}
      testID={testID}
      hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
      style={[
        {
          borderRadius: radii.md,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          width: fullWidth ? '100%' : undefined,
          opacity: disabled && variant !== 'primary' && variant !== 'danger' ? 0.6 : 1,
        },
        sizeStyles[size],
        variantStyle,
        style as any,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={spinnerColor} style={{ marginRight: 8 }} />
      ) : null}

      {!loading && icon && iconPosition === 'left' ? (
        <View style={{ marginRight: 8 }}>{icon}</View>
      ) : null}

      <Text
        style={[
          { textAlign: 'center' },
          textStyles[size],
          variantTextStyle,
        ]}
      >
        {children}
      </Text>

      {!loading && icon && iconPosition === 'right' ? (
        <View style={{ marginLeft: 8 }}>{icon}</View>
      ) : null}
    </TouchableOpacity>
  );
}
