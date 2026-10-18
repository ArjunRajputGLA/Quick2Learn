import React from 'react';
import { View, Text } from 'react-native';
import { Button } from './Button';
import { FolderOpen } from 'lucide-react-native';

export interface EmptyStateProps {
  illustration?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  className?: string;
}

export function EmptyState({
  illustration,
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  className = '',
}: EmptyStateProps) {
  return (
    <View className={`items-center justify-center p-6 my-4 ${className}`}>
      <View className="w-18 h-18 rounded-2xl bg-surface-subtle border border-border items-center justify-center mb-4">
        {illustration || <FolderOpen size={36} color="#3B82F6" />}
      </View>

      <Text className="text-h2 font-semibold text-ink text-center mb-1.5">
        {title}
      </Text>

      <Text className="text-body text-ink-muted text-center max-w-[280px] mb-6 leading-relaxed">
        {description}
      </Text>

      {actionLabel && onAction ? (
        <View className="w-full max-w-[240px]">
          <Button variant="primary" onPress={onAction}>
            {actionLabel}
          </Button>

          {secondaryActionLabel && onSecondaryAction ? (
            <Button
              variant="ghost"
              onPress={onSecondaryAction}
              className="mt-2"
            >
              {secondaryActionLabel}
            </Button>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
