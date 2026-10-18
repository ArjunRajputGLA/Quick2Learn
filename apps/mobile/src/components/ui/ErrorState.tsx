import React from 'react';
import { View, Text } from 'react-native';
import { Button } from './Button';
import { AlertTriangle, RefreshCw } from 'lucide-react-native';

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
    <View className={`items-center justify-center p-6 my-4 ${className}`}>
      <View className="w-18 h-18 rounded-2xl bg-red-50 border border-red-200 items-center justify-center mb-4">
        <AlertTriangle size={36} color="#B91C1C" />
      </View>

      <Text className="text-h2 font-semibold text-ink text-center mb-1.5">
        {title}
      </Text>

      <Text className="text-body text-ink-muted text-center max-w-[280px] mb-6 leading-relaxed">
        {message}
      </Text>

      <View className="w-full max-w-[200px]">
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
