import React from 'react';
import { View, Text, StyleProp, ViewStyle } from 'react-native';
import { Image, ImageSource } from 'expo-image';
import { Button } from './Button';
import { FolderOpen } from 'lucide-react-native';
import { colors, radii } from '@quick2learn/shared';

const EMPTY_BATCH_IMG = require('../../../assets/empty batch.png');
const EMPTY_MATERIAL_IMG = require('../../../assets/empty material.png');
const EMPTY_CHATS_IMG = require('../../../assets/empty chats.png');
const EMPTY_NOTIFICATIONS_IMG = require('../../../assets/empty notifications.svg');

export interface EmptyStateProps {
  illustration?: React.ReactNode;
  imageSource?: ImageSource | number | string;
  imageSize?: number;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  className?: string;
  style?: StyleProp<ViewStyle>;
}

export function EmptyState({
  illustration,
  imageSource,
  imageSize = 130,
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  className = '',
  style,
}: EmptyStateProps) {
  // Determine if a contextual illustration should be used
  const lowerTitle = (title || '').toLowerCase();
  const lowerDesc = (description || '').toLowerCase();
  const combined = `${lowerTitle} ${lowerDesc}`;

  const resolvedImage =
    imageSource ||
    (!illustration && (combined.includes('notification') || combined.includes('alert') || combined.includes('notice'))
      ? EMPTY_NOTIFICATIONS_IMG
      : !illustration && (combined.includes('batch') || combined.includes('enrolled'))
      ? EMPTY_BATCH_IMG
      : !illustration &&
        (combined.includes('material') ||
          combined.includes('resource') ||
          combined.includes('offline') ||
          combined.includes('download') ||
          combined.includes('document') ||
          combined.includes('formula') ||
          combined.includes('chapter') ||
          combined.includes('note') ||
          combined.includes('notes') ||
          combined.includes('paper') ||
          combined.includes('pdf') ||
          combined.includes('study') ||
          combined.includes('syllabus'))
      ? EMPTY_MATERIAL_IMG
      : !illustration &&
        (combined.includes('chat') ||
          combined.includes('message') ||
          combined.includes('conversation'))
      ? EMPTY_CHATS_IMG
      : null);

  return (
    <View
      style={[
        {
          alignItems: 'center',
          justifyContent: 'center',
          padding: 16,
          marginVertical: 8,
        },
        style,
      ]}
      className={`items-center justify-center p-4 my-2 ${className}`}
    >
      {resolvedImage ? (
        <Image
          source={resolvedImage}
          style={{ width: imageSize, height: imageSize, marginBottom: 12 }}
          contentFit="contain"
          transition={200}
        />
      ) : (
        <View
          style={{
            width: 52,
            height: 52,
            borderRadius: radii.md,
            backgroundColor: colors['surface-subtle'],
            borderWidth: 1,
            borderColor: colors.border,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 12,
          }}
          className="w-13 h-13 rounded-xl bg-surface-subtle border border-border items-center justify-center mb-3"
        >
          {illustration || <FolderOpen size={24} color={colors.primary} />}
        </View>
      )}

      <Text
        style={{
          fontSize: 15,
          fontWeight: '700',
          color: colors.ink,
          textAlign: 'center',
          marginBottom: 4,
        }}
        className="text-h3 font-semibold text-ink text-center mb-1"
      >
        {title}
      </Text>

      <Text
        style={{
          fontSize: 12.5,
          color: colors['ink-muted'],
          textAlign: 'center',
          maxWidth: 260,
          marginBottom: 14,
          lineHeight: 18,
        }}
        className="text-caption text-ink-muted text-center max-w-[260px] mb-3.5 leading-relaxed"
      >
        {description}
      </Text>

      {actionLabel && onAction ? (
        <View style={{ width: '100%', maxWidth: 180, gap: 6 }} className="w-full max-w-[180px]">
          <Button variant="primary" size="sm" onPress={onAction}>
            {actionLabel}
          </Button>

          {secondaryActionLabel && onSecondaryAction ? (
            <Button
              variant="ghost"
              size="sm"
              onPress={onSecondaryAction}
              className="mt-1"
            >
              {secondaryActionLabel}
            </Button>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
