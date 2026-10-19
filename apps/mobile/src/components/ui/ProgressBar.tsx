import React from 'react';
import { View } from 'react-native';

export interface ProgressBarProps {
  progress: number; // 0 to 100 or 0 to 1
  height?: number;
  color?: string;
  trackColor?: string;
  className?: string;
}

export function ProgressBar({
  progress,
  height = 6,
  color = '#3B82F6',
  trackColor = '#E5E7EB',
  className = '',
}: ProgressBarProps) {
  const normalized = progress <= 1 && progress > 0 ? progress * 100 : Math.min(Math.max(progress, 0), 100);

  return (
    <View
      className={`w-full rounded-full overflow-hidden ${className}`}
      style={{
        width: '100%',
        height,
        backgroundColor: trackColor,
        borderRadius: height / 2,
        overflow: 'hidden',
      }}
    >
      <View
        className="h-full rounded-full"
        style={{
          width: `${normalized}%`,
          height: '100%',
          backgroundColor: color,
          borderRadius: height / 2,
        }}
      />
    </View>
  );
}
