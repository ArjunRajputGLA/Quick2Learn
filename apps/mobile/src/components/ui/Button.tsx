import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  View,
  TouchableOpacityProps,
} from 'react-native';
import * as Haptics from 'expo-haptics';

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
  onPress,
  ...rest
}: ButtonProps) {
  const handlePress = async (e: any) => {
    if (disabled || loading) return;
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Haptics might fail on emulator or unsupported devices
    }
    onPress?.(e);
  };

  // Min-height is strictly 48dp for touch target accessibility
  const sizeClasses = {
    sm: 'min-h-[44px] px-3 py-2',
    md: 'min-h-[48px] px-4 py-3',
    lg: 'min-h-[52px] px-6 py-3.5',
  }[size];

  const textSizes = {
    sm: 'text-small font-medium',
    md: 'text-body font-semibold',
    lg: 'text-h3 font-semibold',
  }[size];

  let variantContainer = '';
  let variantText = '';
  let spinnerColor = '#FFFFFF';

  switch (variant) {
    case 'primary':
      variantContainer = disabled
        ? 'bg-primary/50'
        : 'bg-primary active:bg-primary-hover';
      variantText = 'text-white';
      spinnerColor = '#FFFFFF';
      break;
    case 'secondary':
      variantContainer = disabled
        ? 'bg-surface-subtle/50 border border-border/50'
        : 'bg-surface-subtle border border-border active:bg-border/60';
      variantText = disabled ? 'text-ink-muted' : 'text-ink';
      spinnerColor = '#1F2937';
      break;
    case 'outline':
      variantContainer = disabled
        ? 'border border-border bg-transparent'
        : 'border border-primary bg-transparent active:bg-primary-soft';
      variantText = disabled ? 'text-ink-muted' : 'text-primary';
      spinnerColor = '#3B82F6';
      break;
    case 'ghost':
      variantContainer = disabled
        ? 'bg-transparent'
        : 'bg-transparent active:bg-surface-subtle';
      variantText = disabled ? 'text-ink-muted' : 'text-primary';
      spinnerColor = '#3B82F6';
      break;
    case 'danger':
      variantContainer = disabled
        ? 'bg-danger/50'
        : 'bg-danger active:opacity-90';
      variantText = 'text-white';
      spinnerColor = '#FFFFFF';
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
      hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator size="small" color={spinnerColor} className="mr-2" />
      ) : null}

      {!loading && icon && iconPosition === 'left' ? (
        <View className="mr-2">{icon}</View>
      ) : null}

      <Text className={`${textSizes} ${variantText} text-center`}>
        {children}
      </Text>

      {!loading && icon && iconPosition === 'right' ? (
        <View className="ml-2">{icon}</View>
      ) : null}
    </TouchableOpacity>
  );
}
