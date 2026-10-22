import React from 'react';
import { Pressable, Text, View, ViewStyle, TextStyle, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { radii } from '@quick2learn/shared';

export interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: React.ReactNode;
  disabled?: boolean;
  className?: string;
  style?: ViewStyle;
}

export function Chip({
  label,
  selected = false,
  onPress,
  icon,
  disabled = false,
  className = '',
  style,
}: ChipProps) {
  const handlePress = () => {
    if (disabled || !onPress) return;
    try {
      void Haptics.selectionAsync().catch(() => {});
    } catch {
      // Haptics fallback
    }
    onPress();
  };

  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ selected, disabled }}
      disabled={disabled}
      onPress={handlePress}
      hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
      style={({ pressed }) => [
        {
          minHeight: 30,
          paddingHorizontal: 12,
          paddingVertical: 4.5,
          borderRadius: radii.full,
          borderWidth: 1.2,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: selected
            ? (pressed ? '#1D4ED8' : '#2563EB')
            : (pressed ? '#F1F5F9' : '#FFFFFF'),
          borderColor: selected
            ? '#1D4ED8'
            : (pressed ? '#CBD5E1' : '#E2E8F0'),
          opacity: disabled ? 0.5 : 1,
          ...(Platform.OS === 'web'
            ? ({
                cursor: disabled ? 'default' : 'pointer',
                userSelect: 'none',
                WebkitUserSelect: 'none',
                WebkitTapHighlightColor: 'transparent',
                outline: 'none',
              } as any)
            : {}),
        },
        style,
      ]}
    >
      {icon ? <View style={{ marginRight: 6 }}>{icon}</View> : null}
      <Text
        style={{
          fontSize: 12,
          fontWeight: selected ? '700' : '600',
          color: selected ? '#FFFFFF' : '#334155',
          ...(Platform.OS === 'web'
            ? ({
                userSelect: 'none',
                WebkitUserSelect: 'none',
              } as any)
            : {}),
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
