import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { colors } from '@quick2learn/shared';

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
      style={{
        minHeight: 56,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        backgroundColor: colors.surface,
      }}
      className={`min-h-[56px] px-4 flex-row items-center justify-between border-b border-border bg-surface ${className}`}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 }} className="flex-row items-center flex-1 mr-2">
        {showBack && (
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={handleBack}
            style={{
              width: 44,
              height: 44,
              marginLeft: -8,
              marginRight: 6,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 22,
            }}
            className="w-12 h-12 -ml-2 items-center justify-center rounded-full active:bg-surface-subtle"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <ArrowLeft size={22} color={colors.ink} />
          </TouchableOpacity>
        )}
        <View style={{ flex: 1, justifyContent: 'center', paddingVertical: 8 }} className="flex-1 justify-center py-2">
          <Text
            style={{ fontSize: 18, fontWeight: '700', color: colors.ink }}
            className="text-h3 font-semibold text-ink"
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {title}
          </Text>
          {subtitle ? (
            <Text
              style={{ fontSize: 12, color: colors['ink-muted'], marginTop: 2 }}
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
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }} className="flex-row items-center space-x-1">{rightActions}</View>
      ) : null}
    </View>
  );
}
