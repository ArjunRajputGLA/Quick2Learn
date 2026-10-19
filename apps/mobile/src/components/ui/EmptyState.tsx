import React from 'react';
import { View, Text } from 'react-native';
import { Button } from './Button';
import { FolderOpen } from 'lucide-react-native';
import { colors, radii } from '@quick2learn/shared';

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
    <View
      style={{
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        marginVertical: 16,
      }}
      className={`items-center justify-center p-6 my-4 ${className}`}
    >
      <View
        style={{
          width: 72,
          height: 72,
          borderRadius: radii.lg,
          backgroundColor: colors['surface-subtle'],
          borderWidth: 1,
          borderColor: colors.border,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 16,
        }}
        className="w-18 h-18 rounded-2xl bg-surface-subtle border border-border items-center justify-center mb-4"
      >
        {illustration || <FolderOpen size={36} color={colors.primary} />}
      </View>

      <Text
        style={{
          fontSize: 18,
          fontWeight: '700',
          color: colors.ink,
          textAlign: 'center',
          marginBottom: 6,
        }}
        className="text-h2 font-semibold text-ink text-center mb-1.5"
      >
        {title}
      </Text>

      <Text
        style={{
          fontSize: 14,
          color: colors['ink-muted'],
          textAlign: 'center',
          maxWidth: 280,
          marginBottom: 20,
          lineHeight: 20,
        }}
        className="text-body text-ink-muted text-center max-w-[280px] mb-6 leading-relaxed"
      >
        {description}
      </Text>

      {actionLabel && onAction ? (
        <View style={{ width: '100%', maxWidth: 240, gap: 8 }} className="w-full max-w-[240px]">
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
