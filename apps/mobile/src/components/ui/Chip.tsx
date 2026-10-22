import React from 'react';
import { TouchableOpacity, Text, View, ViewStyle, TextStyle } from 'react-native';
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

  const containerStyle: ViewStyle = {
    minHeight: 30,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: radii.full,
    borderWidth: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: selected ? '#2563EB' : '#FFFFFF',
    borderColor: selected ? '#1D4ED8' : '#CBD5E1',
    opacity: disabled ? 0.5 : 1,
  };

  const textStyle: TextStyle = {
    fontSize: 12,
    fontWeight: selected ? '700' : '600',
    color: selected ? '#FFFFFF' : '#334155',
  };

  return (
    <TouchableOpacity
      accessibilityRole="checkbox"
      accessibilityState={{ selected, disabled }}
      activeOpacity={0.85}
      disabled={disabled}
      onPress={handlePress}
      hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
      style={[containerStyle, style]}
    >
      {icon ? <View style={{ marginRight: 6 }}>{icon}</View> : null}
      <Text style={textStyle}>{label}</Text>
    </TouchableOpacity>
  );
}
