import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  View,
  TouchableOpacityProps,
  StyleProp,
  ViewStyle,
  TextStyle,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, radii } from '@quick2learn/shared';

export interface ButtonProps extends TouchableOpacityProps {
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
  ...rest
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

  let variantContainer = '';
  let variantText = '';
  let spinnerColor = '#FFFFFF';
  let variantStyle: ViewStyle = {};
  let variantTextStyle: TextStyle = {};

  switch (variant) {
    case 'primary':
      variantContainer = disabled
        ? 'bg-primary/50'
        : 'bg-primary active:bg-primary-hover';
      variantText = 'text-white';
      spinnerColor = '#FFFFFF';
      variantStyle = {
        backgroundColor: disabled ? 'rgba(59, 130, 246, 0.5)' : colors.primary,
      };
      variantTextStyle = { color: '#FFFFFF' };
      break;
    case 'secondary':
      variantContainer = disabled
        ? 'bg-surface-subtle/50 border border-border/50'
        : 'bg-surface-subtle border border-border active:bg-border/60';
      variantText = disabled ? 'text-ink-muted' : 'text-ink';
      spinnerColor = colors.ink;
      variantStyle = {
        backgroundColor: disabled ? 'rgba(245, 247, 251, 0.5)' : colors['surface-subtle'],
        borderWidth: 1,
        borderColor: colors.border,
      };
      variantTextStyle = { color: disabled ? colors['ink-muted'] : colors.ink };
      break;
    case 'outline':
      variantContainer = disabled
        ? 'border border-border bg-transparent'
        : 'border border-primary bg-transparent active:bg-primary-soft';
      variantText = disabled ? 'text-ink-muted' : 'text-primary';
      spinnerColor = colors.primary;
      variantStyle = {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: disabled ? colors.border : colors.primary,
      };
      variantTextStyle = { color: disabled ? colors['ink-muted'] : colors.primary };
      break;
    case 'ghost':
      variantContainer = disabled
        ? 'bg-transparent'
        : 'bg-transparent active:bg-surface-subtle';
      variantText = disabled ? 'text-ink-muted' : 'text-primary';
      spinnerColor = colors.primary;
      variantStyle = { backgroundColor: 'transparent' };
      variantTextStyle = { color: disabled ? colors['ink-muted'] : colors.primary };
      break;
    case 'danger':
      variantContainer = disabled
        ? 'bg-danger/50'
        : 'bg-danger active:opacity-90';
      variantText = 'text-white';
      spinnerColor = '#FFFFFF';
      variantStyle = {
        backgroundColor: disabled ? 'rgba(185, 28, 28, 0.5)' : colors.danger,
      };
      variantTextStyle = { color: '#FFFFFF' };
      break;
  }

  const widthClass = fullWidth ? 'w-full' : '';

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading }}
      activeOpacity={0.8}
      disabled={disabled || loading}
      onPress={handlePress}
      className={`rounded-lg flex-row items-center justify-center ${sizeClasses} ${variantContainer} ${widthClass} ${className}`}
      style={[
        {
          borderRadius: radii.md,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          width: fullWidth ? '100%' : undefined,
        },
        sizeStyles[size],
        variantStyle,
        style,
      ]}
      hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator size="small" color={spinnerColor} style={{ marginRight: 8 }} />
      ) : null}

      {!loading && icon && iconPosition === 'left' ? (
        <View style={{ marginRight: 8 }}>{icon}</View>
      ) : null}

      <Text
        className={`${textSizes} ${variantText} text-center`}
        style={[{ textAlign: 'center' }, textStyles[size], variantTextStyle]}
      >
        {children}
      </Text>

      {!loading && icon && iconPosition === 'right' ? (
        <View style={{ marginLeft: 8 }}>{icon}</View>
      ) : null}
    </TouchableOpacity>
  );
}
