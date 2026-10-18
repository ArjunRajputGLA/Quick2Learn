import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TextInputProps,
  TouchableOpacity,
} from 'react-native';
import { Eye, EyeOff, XCircle } from 'lucide-react-native';

export interface TextFieldProps extends TextInputProps {
  label?: string;
  helperText?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  clearable?: boolean;
  isPassword?: boolean;
  className?: string;
}

export function TextField({
  label,
  helperText,
  error,
  leftIcon,
  rightIcon,
  clearable = false,
  isPassword = false,
  className = '',
  value,
  onChangeText,
  onFocus,
  onBlur,
  secureTextEntry,
  ...rest
}: TextFieldProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const hasError = Boolean(error);

  const borderColor = hasError
    ? 'border-danger'
    : isFocused
    ? 'border-primary'
    : 'border-border';

  const bgColor = rest.editable === false ? 'bg-surface-subtle' : 'bg-surface';

  return (
    <View className={`w-full ${className}`}>
      {label ? (
        <Text className="text-small font-medium text-ink mb-1.5">{label}</Text>
      ) : null}

      <View
        className={`min-h-[48px] px-3.5 flex-row items-center rounded-lg border ${borderColor} ${bgColor}`}
      >
        {leftIcon ? <View className="mr-2.5">{leftIcon}</View> : null}

        <TextInput
          className="flex-1 py-2.5 text-body text-ink font-normal"
          placeholderTextColor="#9CA3AF"
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={isPassword ? !showPassword : secureTextEntry}
          onFocus={(e) => {
            setIsFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            onBlur?.(e);
          }}
          accessibilityLabel={label}
          {...rest}
        />

        {clearable && value && value.length > 0 ? (
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Clear input"
            onPress={() => onChangeText?.('')}
            className="w-8 h-8 items-center justify-center -mr-1"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <XCircle size={18} color="#9CA3AF" />
          </TouchableOpacity>
        ) : null}

        {isPassword ? (
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
            onPress={() => setShowPassword((prev) => !prev)}
            className="w-8 h-8 items-center justify-center -mr-1"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            {showPassword ? (
              <EyeOff size={18} color="#6B7280" />
            ) : (
              <Eye size={18} color="#6B7280" />
            )}
          </TouchableOpacity>
        ) : null}

        {!isPassword && rightIcon ? (
          <View className="ml-2">{rightIcon}</View>
        ) : null}
      </View>

      {hasError ? (
        <Text className="text-caption text-danger mt-1 font-medium">
          {error}
        </Text>
      ) : helperText ? (
        <Text className="text-caption text-ink-muted mt-1">{helperText}</Text>
      ) : null}
    </View>
  );
}
