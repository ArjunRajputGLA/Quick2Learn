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

export interface ScreenProps {
  children: React.ReactNode;
  header?: React.ReactNode;
  scrollable?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  className?: string;
  contentContainerStyle?: ViewStyle;
  subtle?: boolean;
}

export function Screen({
  children,
  header,
  scrollable = true,
  refreshing = false,
  onRefresh,
  className = '',
  contentContainerStyle,
  subtle = false,
}: ScreenProps) {
  const insets = useSafeAreaInsets();

  const bgColor = subtle ? 'bg-surface-subtle' : 'bg-surface';

  const content = scrollable ? (
    <ScrollView
      className="flex-1"
      contentContainerStyle={[
        {
          paddingBottom: Math.max(insets.bottom, 16) + 16,
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
          paddingBottom: Math.max(insets.bottom, 16),
        },
        contentContainerStyle,
      ]}
    >
      {children}
    </View>
  );

  return (
    <View className={`flex-1 ${bgColor} ${className}`}>
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
        className="flex-1"
      >
        {content}
      </KeyboardAvoidingView>
    </View>
  );
}
