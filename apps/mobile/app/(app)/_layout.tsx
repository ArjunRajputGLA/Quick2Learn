import React from 'react';
import { Stack } from 'expo-router';

export default function AppLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: '#F9FAFB' },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="notifications" options={{ headerShown: false }} />
      <Stack.Screen name="search" options={{ headerShown: false }} />
      <Stack.Screen name="chapter/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="lecture/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="batch/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="test/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="doubt/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="pdf-viewer" options={{ headerShown: false }} />
      <Stack.Screen name="downloads" options={{ headerShown: false }} />
      <Stack.Screen name="fees" options={{ headerShown: false }} />
      <Stack.Screen name="profile/edit" options={{ headerShown: false }} />
      <Stack.Screen name="settings" options={{ headerShown: false }} />
      <Stack.Screen name="delete-account" options={{ headerShown: false }} />
      <Stack.Screen name="help" options={{ headerShown: false }} />
      <Stack.Screen name="results" options={{ headerShown: false }} />
      <Stack.Screen name="payments/result" options={{ headerShown: false }} />
    </Stack>
  );
}
