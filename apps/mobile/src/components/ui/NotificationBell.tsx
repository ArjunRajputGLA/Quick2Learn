import React from 'react';
import { View, Text, TouchableOpacity, StyleProp, ViewStyle } from 'react-native';
import { useRouter } from 'expo-router';
import { Bell } from 'lucide-react-native';
import { colors } from '@quick2learn/shared';
import { useUnreadNotificationsCount } from '../../api/hooks';

export interface NotificationBellProps {
  count?: number;
  size?: number;
  color?: string;
  style?: StyleProp<ViewStyle>;
  className?: string;
  onPress?: () => void;
}

export function NotificationBell({
  count,
  size = 16,
  color = colors.ink,
  style,
  className = '',
  onPress,
}: NotificationBellProps) {
  let router: ReturnType<typeof useRouter> | null = null;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    router = useRouter();
  } catch {
    // Fallback if rendered outside navigation context (e.g. tests or isolated preview)
  }

  // Retrieve unread notifications count query
  const { data } = useUnreadNotificationsCount();
  const unreadCount = count !== undefined ? count : (data?.unreadCount ?? 0);

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else if (router) {
      router.push('/(app)/notifications' as any);
    }
  };

  const label = unreadCount > 0
    ? `Notifications, ${unreadCount} unread`
    : 'Notifications';

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
      style={[
        {
          width: 34,
          height: 34,
          borderRadius: 17,
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          backgroundColor: colors['surface-subtle'],
          borderWidth: 1,
          borderColor: colors.border,
        },
        style,
      ]}
      className={`w-8.5 h-8.5 rounded-full items-center justify-center relative bg-surface-subtle border border-border active:bg-border/40 ${className}`}
    >
      <Bell size={size} color={color} />
      {unreadCount > 0 ? (
        <View
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            minWidth: 15,
            height: 15,
            borderRadius: 7.5,
            backgroundColor: colors.danger,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 2.5,
            borderWidth: 1.5,
            borderColor: colors.surface,
          }}
          className="absolute -top-0.5 -right-0.5 min-w-[15px] h-[15px] rounded-full bg-danger items-center justify-center px-0.5 border border-surface"
        >
          <Text
            style={{ fontSize: 9, fontWeight: '700', color: '#FFFFFF' }}
            className="text-[9px] font-bold text-white"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );
}
