import React from 'react';
import { View, Text, TouchableOpacity, ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, radii } from '@quick2learn/shared';

export interface SegmentedControlProps {
  options: string[];
  selectedIndex: number;
  onChange: (index: number) => void;
  className?: string;
  style?: ViewStyle;
}

export function SegmentedControl({
  options,
  selectedIndex,
  onChange,
  className = '',
  style,
}: SegmentedControlProps) {
  const handleSelect = async (index: number) => {
    if (index === selectedIndex) return;
    try {
      await Haptics.selectionAsync();
    } catch {
      // Haptics fallback
    }
    onChange(index);
  };

  return (
    <View
      style={[
        {
          minHeight: 38,
          padding: 3,
          backgroundColor: colors['surface-subtle'],
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: radii.lg,
          flexDirection: 'row',
          alignItems: 'center',
        },
        style,
      ]}
      className={`min-h-[38px] p-0.5 bg-surface-subtle border border-border rounded-lg flex-row items-center ${className}`}
    >
      {options.map((option, index) => {
        const isSelected = selectedIndex === index;
        return (
          <TouchableOpacity
            key={option}
            accessibilityRole="tab"
            accessibilityState={{ selected: isSelected }}
            onPress={() => handleSelect(index)}
            style={{
              flex: 1,
              minHeight: 32,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: radii.md,
              backgroundColor: isSelected ? colors.surface : 'transparent',
              borderWidth: isSelected ? 1 : 0,
              borderColor: isSelected ? colors.border : 'transparent',
              elevation: isSelected ? 1 : 0,
              shadowColor: '#000000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: isSelected ? 0.06 : 0,
              shadowRadius: 2,
            }}
            className={`flex-1 min-h-[32px] items-center justify-center rounded-md ${
              isSelected ? 'bg-surface border border-border/80 shadow-xs' : ''
            }`}
            hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
          >
            <Text
              style={{
                fontSize: 12,
                textAlign: 'center',
                fontWeight: isSelected ? '600' : '500',
                color: isSelected ? colors.primary : colors['ink-muted'],
              }}
              className={`text-[12px] text-center ${
                isSelected
                  ? 'font-semibold text-primary'
                  : 'font-medium text-ink-muted'
              }`}
              numberOfLines={1}
            >
              {option}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
