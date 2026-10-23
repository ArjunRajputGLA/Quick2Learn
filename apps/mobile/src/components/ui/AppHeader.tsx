import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Menu } from 'lucide-react-native';
import { colors } from '@quick2learn/shared';
import { NotificationBell } from './NotificationBell';
import * as Haptics from 'expo-haptics';
import { useDropdownStore } from '../../lib/drawerStore';

export interface AppHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  showNotificationBell?: boolean;
  unreadCount?: number;
  rightActions?: React.ReactNode;
  className?: string;
}

export function AppHeader({
  title,
  subtitle,
  showBack = false,
  onBack,
  showNotificationBell = true,
  unreadCount,
  rightActions,
  className = '',
}: AppHeaderProps) {
  let router: ReturnType<typeof useRouter> | null = null;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    router = useRouter();
  } catch {
    // Fallback if rendered outside navigation context (e.g. tests or isolated preview)
  }

  const { toggleDropdown } = useDropdownStore();

  const handleBack = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (onBack) {
      onBack();
    } else if (router && router.canGoBack()) {
      router.back();
    }
  };

  const handleToggle = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleDropdown();
  };

  const hasLeadingIcon = true;

  return (
    <View
      style={{
        marginHorizontal: 12,
        marginTop: 4,
        marginBottom: 6,
        minHeight: 46,
        paddingHorizontal: hasLeadingIcon ? 8 : 14,
        paddingVertical: 6,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderRadius: 24,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: 'rgba(226, 232, 240, 0.9)',
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
        elevation: 3,
      }}
      className={`mx-3 mt-1 mb-1.5 min-h-[46px] flex-row items-center justify-between rounded-full bg-surface border border-border shadow-xs ${className}`}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 }} className="flex-row items-center flex-1 mr-2">
        {showBack ? (
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={handleBack}
            style={{
              width: 32,
              height: 32,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 16,
              backgroundColor: colors['surface-subtle'],
              borderWidth: 1,
              borderColor: colors.border,
              marginRight: 8,
            }}
            className="w-8 h-8 items-center justify-center rounded-full bg-surface-subtle border border-border active:bg-border/40 mr-2"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <ArrowLeft size={16} color={colors.ink} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Open sidebar menu"
            onPress={handleToggle}
            style={{
              width: 34,
              height: 34,
              borderRadius: 17,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: colors['surface-subtle'],
              borderWidth: 1,
              borderColor: colors.border,
              marginRight: 8,
            }}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Menu size={18} color={colors.ink} strokeWidth={2.2} />
          </TouchableOpacity>
        )}
        <View style={{ flex: 1, justifyContent: 'center' }} className="flex-1 justify-center">
          <Text
            style={{ fontSize: 15, fontWeight: '700', color: colors.ink }}
            className="text-body font-bold text-ink"
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {title}
          </Text>
          {subtitle ? (
            <Text
              style={{ fontSize: 10.5, color: colors['ink-muted'], marginTop: 0.5 }}
              className="text-[10.5px] text-ink-muted"
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>

      {rightActions || showNotificationBell ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }} className="flex-row items-center space-x-1.5">
          {rightActions}
          {showNotificationBell ? <NotificationBell count={unreadCount} /> : null}
        </View>
      ) : null}
    </View>
  );
} 