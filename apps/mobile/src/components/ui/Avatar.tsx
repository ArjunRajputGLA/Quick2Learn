import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { Image } from 'expo-image';
import { User } from 'lucide-react-native';

export interface AvatarProps {
  source?: string | null;
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
    sm: 32,
    md: 40,
    lg: 56,
    xl: 72,
  };

  const textMap = {
    sm: 'text-caption font-bold',
    md: 'text-small font-bold',
    lg: 'text-h3 font-bold',
    xl: 'text-h2 font-bold',
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

  const initials = getInitials(name);
  const showFallback = !source || imageError;

  return (
    <View
      className={`rounded-full overflow-hidden bg-primary-soft items-center justify-center border border-border/80 ${className}`}
      style={{ width: dim, height: dim }}
    >
      {!showFallback ? (
        <Image
          source={{ uri: source }}
          style={{ width: dim, height: dim }}
          contentFit="cover"
          transition={200}
          onError={() => setImageError(true)}
        />
      ) : initials ? (
        <Text className={`${textMap[size]} text-primary text-center`}>
          {initials}
        </Text>
      ) : (
        <User size={dim * 0.5} color="#3B82F6" />
      )}
    </View>
  );
}
