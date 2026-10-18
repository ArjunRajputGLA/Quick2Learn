import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, TouchableOpacity } from 'react-native';
import { Button } from '../ui/Button';
import { Radio } from 'lucide-react-native';

export interface LiveBannerProps {
  title: string;
  isLive?: boolean;
  timeOrCountdown?: string; // e.g. "Live now" or "Starts in 15 mins"
  onJoin: () => void;
  className?: string;
}

export function LiveBanner({
  title,
  isLive = true,
  timeOrCountdown = 'Live now',
  onJoin,
  className = '',
}: LiveBannerProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.3,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
      ])
    );

    pulse.start();

    return () => pulse.stop();
  }, [pulseAnim]);

  return (
    <View
      className={`bg-surface border border-red-200 rounded-2xl p-4 shadow-sm flex-row items-center justify-between ${className}`}
    >
      <View className="flex-1 mr-3">
        {/* Pulsing indicator tag */}
        <View className="flex-row items-center mb-1.5">
          <View className="w-3.5 h-3.5 items-center justify-center mr-1.5">
            <Animated.View
              className="w-2.5 h-2.5 rounded-full bg-danger"
              style={{ opacity: pulseAnim }}
            />
          </View>
          <Text className="text-caption font-bold text-danger uppercase tracking-wider">
            {timeOrCountdown}
          </Text>
        </View>

        {/* Title */}
        <Text
          className="text-body font-semibold text-ink leading-snug"
          numberOfLines={2}
          ellipsizeMode="tail"
        >
          {title}
        </Text>
      </View>

      {/* Join Button */}
      <View className="w-[84px]">
        <Button
          variant="primary"
          size="sm"
          onPress={onJoin}
          className="bg-danger active:bg-danger/90"
        >
          Join
        </Button>
      </View>
    </View>
  );
}
