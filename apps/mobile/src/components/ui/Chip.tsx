import React from 'react';
import { TouchableOpacity, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';

export interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: React.ReactNode;
  disabled?: boolean;
  className?: string;
}

export function Chip({
  label,
  selected = false,
  onPress,
  icon,
  disabled = false,
  className = '',
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
      className={`min-h-[40px] px-3.5 py-1.5 rounded-full border flex-row items-center justify-center ${containerClasses} ${className}`}
      hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
    >
      {icon ? <View className="mr-1.5">{icon}</View> : null}
      <Text className={`text-small ${textClasses}`}>{label}</Text>
    </TouchableOpacity>
  );
}
