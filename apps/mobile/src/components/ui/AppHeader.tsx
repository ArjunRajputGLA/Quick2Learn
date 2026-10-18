import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';

export interface AppHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  rightActions?: React.ReactNode;
  className?: string;
}

export function AppHeader({
  title,
  subtitle,
  showBack = false,
  onBack,
  rightActions,
  className = '',
}: AppHeaderProps) {
  let router: ReturnType<typeof useRouter> | null = null;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    router = useRouter();
  } catch {
    // Fallback if rendered outside navigation context (e.g. tests or isolated preview)
  }

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (router && router.canGoBack()) {
      router.back();
    }
  };

  return (
    <View
      className={`min-h-[56px] px-4 flex-row items-center justify-between border-b border-border bg-surface ${className}`}
    >
      <View className="flex-row items-center flex-1 mr-2">
        {showBack && (
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={handleBack}
            className="w-12 h-12 -ml-2 items-center justify-center rounded-full active:bg-surface-subtle"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <ArrowLeft size={22} color="#1F2937" />
          </TouchableOpacity>
        )}
        <View className="flex-1 justify-center py-2">
          <Text
            className="text-h3 font-semibold text-ink"
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {title}
          </Text>
          {subtitle ? (
            <Text
              className="text-caption text-ink-muted mt-0.5"
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>

      {rightActions ? (
        <View className="flex-row items-center space-x-1">{rightActions}</View>
      ) : null}
    </View>
  );
}
