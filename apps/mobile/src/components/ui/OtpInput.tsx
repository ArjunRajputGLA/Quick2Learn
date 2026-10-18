import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
} from 'react-native';

export interface OtpInputProps {
  length?: number;
  value: string;
  onChange: (otp: string) => void;
  error?: string;
  disabled?: boolean;
  className?: string;
}

export function OtpInput({
  length = 6,
  value,
  onChange,
  error,
  disabled = false,
  className = '',
}: OtpInputProps) {
  const inputsRef = useRef<(any | null)[]>([]);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

  // Split value into array of length
  const digits = Array.from({ length }, (_, i) => value[i] || '');

  const handleChangeText = (text: string, index: number) => {
    // Handle paste of multiple characters (e.g. 6-digit SMS OTP)
    const cleaned = text.replace(/[^0-9]/g, '');
    if (cleaned.length > 1) {
      const newOtp = cleaned.slice(0, length);
      onChange(newOtp);
      // Focus on the next empty or last box
      const nextIndex = Math.min(newOtp.length, length - 1);
      inputsRef.current[nextIndex]?.focus();
      return;
    }

    const newDigits = [...digits];
    newDigits[index] = cleaned;
    const combined = newDigits.join('');
    onChange(combined);

    if (cleaned && index < length - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        // Current is already empty, move to previous and clear it
        const newDigits = [...digits];
        newDigits[index - 1] = '';
        onChange(newDigits.join(''));
        inputsRef.current[index - 1]?.focus();
      } else {
        const newDigits = [...digits];
        newDigits[index] = '';
        onChange(newDigits.join(''));
      }
    }
  };

  return (
    <View className={`w-full items-center ${className}`}>
      <View className="flex-row justify-between w-full max-w-[340px] px-1">
        {Array.from({ length }).map((_, index) => {
          const isFocused = focusedIndex === index;
          const hasDigit = Boolean(digits[index]);
          const hasError = Boolean(error);

          const borderColor = hasError
            ? 'border-danger'
            : isFocused
            ? 'border-primary'
            : hasDigit
            ? 'border-ink'
            : 'border-border';

          const bgColor = disabled
            ? 'bg-surface-subtle'
            : isFocused
            ? 'bg-primary-soft/30'
            : 'bg-surface';

          return (
            <TouchableOpacity
              key={index}
              activeOpacity={0.9}
              onPress={() => inputsRef.current[index]?.focus()}
              className="p-0.5"
            >
              <View
                className={`w-12 h-13 rounded-lg border-2 ${borderColor} ${bgColor} items-center justify-center`}
              >
                <TextInput
                  ref={(el) => {
                    inputsRef.current[index] = el;
                  }}
                  className="w-full h-full text-center text-h2 font-bold text-ink"
                  value={digits[index]}
                  onChangeText={(text) => handleChangeText(text, index)}
                  onKeyPress={(e) => handleKeyPress(e, index)}
                  onFocus={() => setFocusedIndex(index)}
                  onBlur={() => setFocusedIndex(null)}
                  keyboardType="number-pad"
                  maxLength={length} // Allow paste of full code
                  selectTextOnFocus
                  editable={!disabled}
                  autoComplete="sms-otp"
                  textContentType="oneTimeCode"
                  accessibilityLabel={`Digit ${index + 1}`}
                />
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {error ? (
        <Text className="text-caption text-danger mt-2 font-medium text-center">
          {error}
        </Text>
      ) : null}
    </View>
  );
}
