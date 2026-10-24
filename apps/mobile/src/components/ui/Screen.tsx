import React, { useState, useCallback } from 'react';
import {
  View,
  RefreshControl,
  ViewStyle,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { colors } from '@quick2learn/shared';
import { KeyboardAwareScrollView } from './KeyboardAwareScrollView';
import { KeyboardAwareView } from './KeyboardAwareView';

export interface ScreenProps {
  children: React.ReactNode;
  header?: React.ReactNode;
  scrollable?: boolean;
  refreshing?: boolean;
  onRefresh?: () => unknown | Promise<unknown>;
  enablePullToRefresh?: boolean;
  className?: string;
  contentContainerStyle?: ViewStyle;
  subtle?: boolean;
  safeAreaBottom?: boolean;
  keyboardAware?: boolean;
  onScroll?: (event: any) => void;
  scrollEventThrottle?: number;
}

export function Screen({
  children,
  header,
  scrollable = true,
  refreshing = false,
  onRefresh,
  enablePullToRefresh = true,
  className = '',
  contentContainerStyle,
  subtle = true,
  safeAreaBottom,
  keyboardAware = false,
  onScroll,
  scrollEventThrottle,
}: ScreenProps) {
  const insets = useSafeAreaInsets();
  let queryClient: ReturnType<typeof useQueryClient> | null = null;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    queryClient = useQueryClient();
  } catch {
    // Fallback if rendered outside QueryClientProvider
  }

  const [internalRefreshing, setInternalRefreshing] = useState(false);
  const isRefreshing = refreshing || internalRefreshing;

  const handleRefresh = useCallback(async () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setInternalRefreshing(true);
    try {
      if (onRefresh) {
        await onRefresh();
      } else if (queryClient) {
        await queryClient.refetchQueries({ type: 'active' });
      }
    } catch (err) {
      console.warn('[Screen] Pull to refresh error:', err);
    } finally {
      setTimeout(() => {
        setInternalRefreshing(false);
      }, 350);
    }
  }, [onRefresh, queryClient]);

  const hasRefresh = enablePullToRefresh && Boolean(onRefresh || queryClient);

  const bgColor = subtle ? 'bg-surface-subtle' : 'bg-surface';
  const resolvedBg = subtle ? colors['surface-subtle'] : colors.surface;

  // When scrollable is false (e.g. within Tab screens or screens hosting FlashList/custom ScrollView),
  // default safeAreaBottom to false so the container isn't artificially clipped short above the tab bar.
  // When scrollable is true, default to true so ScrollView content bottom has breathing room.
  const shouldApplySafeAreaBottom = safeAreaBottom ?? (scrollable ? true : false);

  const content = scrollable ? (
    <KeyboardAwareScrollView
      style={{ flex: 1 }}
      className="flex-1"
      contentContainerStyle={[
        {
          paddingBottom: (shouldApplySafeAreaBottom ? Math.max(insets.bottom, 16) : 16) + 16,
          flexGrow: 1,
        },
        contentContainerStyle,
      ]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      onScroll={onScroll}
      scrollEventThrottle={scrollEventThrottle ?? 16}
      refreshControl={
        hasRefresh ? (
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={['#2563EB']}
            tintColor="#2563EB"
          />
        ) : undefined
      }
    >
      {children}
    </KeyboardAwareScrollView>
  ) : keyboardAware ? (
    <KeyboardAwareView
      className="flex-1"
      style={[
        {
          flex: 1,
          paddingBottom: shouldApplySafeAreaBottom ? Math.max(insets.bottom, 16) : 0,
        },
        contentContainerStyle,
      ]}
    >
      {children}
    </KeyboardAwareView>
  ) : (
    <View
      className="flex-1"
      style={[
        {
          flex: 1,
          paddingBottom: shouldApplySafeAreaBottom ? Math.max(insets.bottom, 16) : 0,
        },
        contentContainerStyle,
      ]}
    >
      {children}
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: resolvedBg }} className={`flex-1 ${bgColor} ${className}`}>
      <StatusBar style="dark" />
      {header ? (
        <View style={{ paddingTop: insets.top }}>
          {header}
        </View>
      ) : (
        <View style={{ height: insets.top }} />
      )}
      <View style={{ flex: 1 }} className="flex-1">
        {content}
      </View>
    </View>
  );
}
