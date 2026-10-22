import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { Image } from 'expo-image';
import { User } from 'lucide-react-native';
import { colors } from '@quick2learn/shared';
import { getFacultyAvatarSource } from '../../lib/facultyImages';

export interface AvatarProps {
  source?: any;
  name?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function Avatar({
  source,
  name,
  size = 'md',
  className = '',
}: AvatarProps) {
  const [imageError, setImageError] = useState(false);

  const dimensionMap = {
    sm: 26,
    md: 34,
    lg: 44,
    xl: 56,
  };

  const dim = dimensionMap[size];

  const getInitials = (str?: string) => {
    if (!str) return '';
    const parts = str.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return str.slice(0, 2).toUpperCase();
  };

  const facultyFallback = !source ? getFacultyAvatarSource(name) : null;
  const effectiveSource = source || facultyFallback;
  const imageSource = typeof effectiveSource === 'string' ? { uri: effectiveSource } : effectiveSource;

  const initials = getInitials(name);
  const showFallback = !imageSource || imageError;

  return (
    <View
      style={{
        width: dim,
        height: dim,
        borderRadius: dim / 2,
        backgroundColor: colors['primary-soft'],
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: colors.border,
        overflow: 'hidden',
      }}
      className={`rounded-full overflow-hidden bg-primary-soft items-center justify-center border border-border/80 ${className}`}
    >
      {!showFallback ? (
        <Image
          source={imageSource}
          style={{ width: dim, height: dim }}
          contentFit="cover"
          transition={200}
          onError={() => setImageError(true)}
        />
      ) : initials ? (
        <Text
          style={{
            fontSize: dim * 0.38,
            fontWeight: '700',
            color: colors.primary,
            textAlign: 'center',
          }}
          className="text-primary text-center font-bold"
        >
          {initials}
        </Text>
      ) : (
        <User size={dim * 0.5} color={colors.primary} />
      )}
    </View>
  );
}
