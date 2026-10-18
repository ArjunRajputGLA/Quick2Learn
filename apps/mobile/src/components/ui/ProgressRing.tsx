import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

export interface ProgressRingProps {
  progress: number; // 0 to 100 or 0 to 1
  size?: number;
  strokeWidth?: number;
  color?: string;
  trackColor?: string;
  showText?: boolean;
  className?: string;
}

export function ProgressRing({
  progress,
  size = 56,
  strokeWidth = 5,
  color = '#3B82F6',
  trackColor = '#E5E7EB',
  showText = true,
  className = '',
}: ProgressRingProps) {
  // Normalize progress to 0-100 range
  const normalizedProgress = progress <= 1 && progress > 0 ? progress * 100 : Math.min(Math.max(progress, 0), 100);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (circumference * normalizedProgress) / 100;

  return (
    <View
      className={`items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      <Svg width={size} height={size}>
        {/* Track */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Progress Fill */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="transparent"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>

      {showText ? (
        <View className="absolute items-center justify-center">
          <Text className="text-caption font-bold text-ink">
            {Math.round(normalizedProgress)}%
          </Text>
        </View>
      ) : null}
    </View>
  );
}
