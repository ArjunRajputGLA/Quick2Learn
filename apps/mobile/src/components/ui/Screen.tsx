import React from 'react';
import {
  View,
  ScrollView,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
  ViewStyle,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@quick2learn/shared';

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
    <ScrollView
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
    </ScrollView>
  ) : (
    <View
      className="flex-1"
      style={[
        {
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
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
        className="flex-1"
      >
        {content}
      </KeyboardAvoidingView>
    </View>
  );
}
