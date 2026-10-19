import React from 'react';
import { View, Text } from 'react-native';
import { Button } from './Button';
import { AlertTriangle, RefreshCw } from 'lucide-react-native';
import { colors, radii } from '@quick2learn/shared';

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry: () => void;
  retrying?: boolean;
  className?: string;
}

export function ErrorState({
  title = 'Something went wrong',
  message = 'We could not load this information. Please check your connection and try again.',
  onRetry,
  retrying = false,
  className = '',
}: ErrorStateProps) {
  return (
    <View
      style={{ alignItems: 'center', justifyContent: 'center', padding: 24, marginVertical: 16 }}
      className={`items-center justify-center p-6 my-4 ${className}`}
    >
      <View
        style={{
          width: 72,
          height: 72,
          borderRadius: radii.xl,
          backgroundColor: '#FEF2F2',
          borderWidth: 1,
          borderColor: '#FECACA',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 16,
        }}
        className="w-18 h-18 rounded-2xl bg-red-50 border border-red-200 items-center justify-center mb-4"
      >
        <AlertTriangle size={36} color={colors.danger} />
      </View>

      <Text
        style={{ fontSize: 18, fontWeight: '700', color: colors.ink, textAlign: 'center', marginBottom: 6 }}
        className="text-h2 font-semibold text-ink text-center mb-1.5"
      >
        {title}
      </Text>

      <Text
        style={{ fontSize: 14, color: colors['ink-muted'], textAlign: 'center', maxWidth: 280, marginBottom: 24, lineHeight: 20 }}
        className="text-body text-ink-muted text-center max-w-[280px] mb-6 leading-relaxed"
      >
        {message}
      </Text>

      <View style={{ width: '100%', maxWidth: 200 }} className="w-full max-w-[200px]">
        <Button
          variant="primary"
          onPress={onRetry}
          loading={retrying}
          icon={<RefreshCw size={18} color="#FFFFFF" />}
        >
          Try Again
        </Button>
      </View>
    </View>
  );
}
