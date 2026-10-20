import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TextInputProps,
  TouchableOpacity,
} from 'react-native';
import { Eye, EyeOff, XCircle } from 'lucide-react-native';

import { colors, radii } from '@quick2learn/shared';
import { useKeyboardAware } from './KeyboardAwareContext';

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
  style,
  ...rest
}: TextFieldProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const containerRef = useRef<any>(null);
  const keyboardAware = useKeyboardAware();

  const hasError = Boolean(error);

  const borderColor = hasError
    ? 'border-danger'
    : isFocused
    ? 'border-primary'
    : 'border-border';

  const bgColor = rest.editable === false ? 'bg-surface-subtle' : 'bg-surface';

  const activeBorderColor = hasError ? colors.danger : isFocused ? colors.primary : colors.border;
  const activeBgColor = rest.editable === false ? colors['surface-subtle'] : colors.surface;

  return (
    <View ref={containerRef} style={{ width: '100%' }} className={`w-full ${className}`}>
      {label ? (
        <Text
          style={{ fontSize: 13, fontWeight: '500', color: colors.ink, marginBottom: 6 }}
          className="text-small font-medium text-ink mb-1.5"
        >
          {label}
        </Text>
      ) : null}

      <View
        style={{
          minHeight: 48,
          paddingHorizontal: 14,
          flexDirection: 'row',
          alignItems: 'center',
          borderRadius: radii.md,
          borderWidth: 1,
          borderColor: activeBorderColor,
          backgroundColor: activeBgColor,
        }}
        className={`min-h-[48px] px-3.5 flex-row items-center rounded-lg border ${borderColor} ${bgColor}`}
      >
        {leftIcon ? <View style={{ marginRight: 10 }}>{leftIcon}</View> : null}

        <TextInput
          style={[
            {
              flex: 1,
              paddingVertical: 10,
              fontSize: 15,
              color: colors.ink,
            },
            style,
          ]}
          className="flex-1 py-2.5 text-body text-ink font-normal"
          placeholderTextColor="#9CA3AF"
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={isPassword ? !showPassword : secureTextEntry}
          onFocus={(e) => {
            setIsFocused(true);
            keyboardAware.onInputFocus(containerRef, 24);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            keyboardAware.onInputBlur(containerRef);
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
            style={{ width: 32, height: 32, alignItems: 'center', justifyContent: 'center', marginRight: -4 }}
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
            style={{ width: 32, height: 32, alignItems: 'center', justifyContent: 'center', marginRight: -4 }}
            className="w-8 h-8 items-center justify-center -mr-1"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            {showPassword ? (
              <EyeOff size={18} color={colors['ink-muted']} />
            ) : (
              <Eye size={18} color={colors['ink-muted']} />
            )}
          </TouchableOpacity>
        ) : null}

        {!isPassword && rightIcon ? (
          <View style={{ marginLeft: 8 }}>{rightIcon}</View>
        ) : null}
      </View>

      {hasError ? (
        <Text
          style={{ fontSize: 12, color: colors.danger, marginTop: 4, fontWeight: '500' }}
          className="text-caption text-danger mt-1 font-medium"
        >
          {error}
        </Text>
      ) : helperText ? (
        <Text
          style={{ fontSize: 12, color: colors['ink-muted'], marginTop: 4 }}
          className="text-caption text-ink-muted mt-1"
        >
          {helperText}
        </Text>
      ) : null}
    </View>
  );
}
