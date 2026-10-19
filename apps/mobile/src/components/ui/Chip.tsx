import React from 'react';
import { TouchableOpacity, Text, View, ViewStyle, TextStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, radii } from '@quick2learn/shared';

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
  const handlePress = async () => {
    if (disabled || !onPress) return;
    try {
      await Haptics.selectionAsync();
    } catch {
      // Haptics fallback
    }
    onPress();
  };

  const containerStyle: ViewStyle = {
    minHeight: 36,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: radii.full,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: selected ? colors.primary : colors.surface,
    borderColor: selected ? colors.primary : colors.border,
  };

  const textStyle: TextStyle = {
    fontSize: 13,
    fontWeight: selected ? '600' : '500',
    color: selected ? '#FFFFFF' : colors.ink,
  };

  const containerClasses = selected
    ? 'bg-primary border-primary'
    : 'bg-surface border-border active:bg-surface-subtle';

  const textClasses = selected ? 'text-white font-semibold' : 'text-ink font-medium';

  return (
    <TouchableOpacity
      accessibilityRole="checkbox"
      accessibilityState={{ selected, disabled }}
      disabled={disabled}
      onPress={handlePress}
      style={[containerStyle, style]}
      className={`min-h-[40px] px-3.5 py-1.5 rounded-full border flex-row items-center justify-center ${containerClasses} ${className}`}
      hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
    >
      {icon ? <View style={{ marginRight: 6 }} className="mr-1.5">{icon}</View> : null}
      <Text style={textStyle} className={`text-small ${textClasses}`}>{label}</Text>
    </TouchableOpacity>
  );
}
