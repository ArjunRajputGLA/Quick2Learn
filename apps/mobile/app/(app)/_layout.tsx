import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function AppLayout() {
  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          contentStyle: { backgroundColor: '#F9FAFB' },
          statusBarStyle: 'dark',
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
        <Stack.Screen name="admin/index" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}
