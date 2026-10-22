import React from 'react';
import { View, Text, Pressable, ViewStyle, Platform } from 'react-native';
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
          <Pressable
            key={option}
            accessibilityRole="tab"
            accessibilityState={{ selected: isSelected }}
            onPress={() => handleSelect(index)}
            hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
            style={({ pressed }) => [
              {
                flex: 1,
                minHeight: 32,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: radii.md,
                backgroundColor: isSelected
                  ? colors.surface
                  : pressed
                  ? 'rgba(0,0,0,0.04)'
                  : 'transparent',
                borderWidth: isSelected ? 1 : 0,
                borderColor: isSelected ? colors.border : 'transparent',
                elevation: isSelected ? 1 : 0,
                shadowColor: '#000000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: isSelected ? 0.06 : 0,
                shadowRadius: 2,
                ...(Platform.OS === 'web'
                  ? ({
                      cursor: 'pointer',
                      userSelect: 'none',
                      WebkitUserSelect: 'none',
                      WebkitTapHighlightColor: 'transparent',
                      outline: 'none',
                    } as any)
                  : {}),
              },
            ]}
          >
            <Text
              style={{
                fontSize: 12,
                textAlign: 'center',
                fontWeight: isSelected ? '600' : '500',
                color: isSelected ? colors.primary : colors['ink-muted'],
                ...(Platform.OS === 'web'
                  ? ({
                      userSelect: 'none',
                      WebkitUserSelect: 'none',
                    } as any)
                  : {}),
              }}
              numberOfLines={1}
            >
              {option}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
