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
  const handleSelect = (index: number) => {
    if (index === selectedIndex) return;
    try {
      void Haptics.selectionAsync().catch(() => {});
    } catch {
      // Haptics fallback
    }
    onChange(index);
  };

  return (
    <View
      style={[
        {
          minHeight: 40,
          padding: 3,
          backgroundColor: '#F1F5F9',
          borderWidth: 1,
          borderColor: '#E2E8F0',
          borderRadius: radii.lg,
          flexDirection: 'row',
          alignItems: 'center',
        },
        style,
      ]}
    >
      {options.map((option, index) => {
        const isSelected = selectedIndex === index;
        return (
          <TouchableOpacity
            key={option}
            accessibilityRole="tab"
            accessibilityState={{ selected: isSelected }}
            activeOpacity={0.85}
            onPress={() => handleSelect(index)}
            hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
            style={{
              flex: 1,
              minHeight: 32,
              paddingHorizontal: 8,
              paddingVertical: 6,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: radii.md,
              backgroundColor: isSelected ? '#FFFFFF' : 'transparent',
              borderWidth: isSelected ? 1 : 0,
              borderColor: isSelected ? '#CBD5E1' : 'transparent',
              elevation: isSelected ? 1 : 0,
              shadowColor: '#000000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: isSelected ? 0.08 : 0,
              shadowRadius: 2,
            }}
          >
            <Text
              style={{
                fontSize: 12,
                textAlign: 'center',
                fontWeight: isSelected ? '700' : '600',
                color: isSelected ? '#2563EB' : '#64748B',
              }}
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
