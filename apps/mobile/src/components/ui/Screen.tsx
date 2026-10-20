import React from 'react';
import {
  View,
  RefreshControl,
  ViewStyle,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@quick2learn/shared';
import { KeyboardAwareScrollView } from './KeyboardAwareScrollView';
import { KeyboardAwareView } from './KeyboardAwareView';

export interface ScreenProps {
  children: React.ReactNode;
  header?: React.ReactNode;
  scrollable?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  className?: string;
  contentContainerStyle?: ViewStyle;
  subtle?: boolean;
  safeAreaBottom?: boolean;
}

export function Screen({
  children,
  header,
  scrollable = true,
  refreshing = false,
  onRefresh,
  className = '',
  contentContainerStyle,
  subtle = true,
  safeAreaBottom,
}: ScreenProps) {
  const insets = useSafeAreaInsets();

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
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#3B82F6']}
            tintColor="#3B82F6"
          />
        ) : undefined
      }
    >
      {children}
    </KeyboardAwareScrollView>
  ) : (
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
