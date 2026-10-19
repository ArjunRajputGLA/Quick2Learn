import React, { useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { FlashList } from '@shopify/flash-list';
import { Bell, CheckCheck, Clock, ChevronRight, Inbox } from 'lucide-react-native';
import { Screen } from '../../src/components/ui/Screen';
import { AppHeader } from '../../src/components/ui/AppHeader';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { Button } from '../../src/components/ui/Button';
import {
  useNotifications,
  useMarkNotificationsRead,
} from '../../src/api/hooks';
import { normalizeNotificationRoute } from '../../src/lib/notifications';
import type { NotificationItem } from '@quick2learn/shared';

function isTodayDate(dateInput: Date | string): boolean {
  const d = new Date(dateInput);
  const now = new Date();

  const dDate = d.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' });
  const nowDate = now.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' });

  return dDate === nowDate;
}

function formatNotificationTime(dateInput: Date | string): string {
  const d = new Date(dateInput);
  return d.toLocaleTimeString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kolkata',
  });
}

function formatNotificationDate(dateInput: Date | string): string {
  const d = new Date(dateInput);
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    timeZone: 'Asia/Kolkata',
  });
}

export default function NotificationsScreen() {
  const router = useRouter();
  const {
    data,
    isLoading,
    isRefetching,
    refetch,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useNotifications({ limit: 20 });

  const markReadMutation = useMarkNotificationsRead();
  const [refreshing, setRefreshing] = useState(false);

  // Flatten paginated pages
  const allNotifications: NotificationItem[] = useMemo(() => {
    if (!data?.pages) return [];
    return data.pages.flatMap((page) => page.items);
  }, [data?.pages]);

  const hasUnread = useMemo(() => {
    return allNotifications.some((n) => !n.readAt);
  }, [allNotifications]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  const handleMarkAllRead = useCallback(() => {
    if (markReadMutation.isPending) return;
    markReadMutation.mutate({ all: true });
  }, [markReadMutation]);

  const handleNotificationPress = useCallback((item: NotificationItem) => {
    // If not read yet, mark it read
    if (!item.readAt) {
      markReadMutation.mutate({ ids: [item.id] });
    }

    // Navigate to deep link if present
    const deepLink = item.data?.route || item.data?.url;
    if (deepLink) {
      const normalized = normalizeNotificationRoute(deepLink);
      router.push(normalized as any);
    }
  }, [markReadMutation, router]);

  return (
    <Screen
      scrollable={false}
      header={
        <AppHeader
          title="Notifications"
          showBack
          rightActions={
            hasUnread ? (
              <TouchableOpacity
                onPress={handleMarkAllRead}
                disabled={markReadMutation.isPending}
                className="py-1 px-2.5 rounded-lg active:bg-surface-subtle min-h-[44px] justify-center"
                accessibilityRole="button"
                accessibilityLabel="Mark all notifications as read"
              >
                <Text className="text-small font-semibold text-primary">
                  {markReadMutation.isPending ? 'Marking...' : 'Mark all read'}
                </Text>
              </TouchableOpacity>
            ) : null
          }
        />
      }
    >
      {isLoading && allNotifications.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      ) : allNotifications.length === 0 ? (
        <EmptyState
          title="No notifications yet"
          description="You are all caught up! When Dinesh Sir posts batch updates or test results, they'll appear here."
          actionLabel="Refresh"
          onAction={onRefresh}
        />
      ) : (
        <View className="flex-1 px-4 pt-2">
          <FlashList
            data={allNotifications}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <MemoizedNotificationRow
                item={item}
                onPress={() => handleNotificationPress(item)}
              />
            )}
            refreshControl={
              <RefreshControl
                refreshing={refreshing || isRefetching}
                onRefresh={onRefresh}
                colors={['#2563EB']}
                tintColor="#2563EB"
              />
            }
            onEndReached={() => {
              if (hasNextPage && !isFetchingNextPage) {
                fetchNextPage();
              }
            }}
            onEndReachedThreshold={0.5}
            contentContainerStyle={{ paddingBottom: 40 }}
          />
        </View>
      )}
    </Screen>
  );
}

function NotificationRow({
  item,
  onPress,
}: {
  item: NotificationItem;
  onPress: () => void;
}) {
  const isUnread = !item.readAt;
  const isToday = isTodayDate(item.createdAt);
  const timeFormatted = isToday
    ? formatNotificationTime(item.createdAt)
    : `${formatNotificationDate(item.createdAt)}, ${formatNotificationTime(item.createdAt)}`;

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Notification: ${item.title}. ${item.body}. ${isUnread ? 'Unread' : 'Read'}`}
      className={`p-4 flex-row items-start min-h-[72px] rounded-xl mb-2.5 border border-border/80 shadow-2xs active:bg-surface-subtle ${
        isUnread ? 'bg-primary-soft/30' : 'bg-surface'
      }`}
    >
      {/* Unread indicator dot */}
      <View className="w-3 pt-1 mr-2 items-center">
        {isUnread ? (
          <View className="w-2.5 h-2.5 rounded-full bg-primary" />
        ) : null}
      </View>

      <View className="flex-1 mr-2">
        <Text
          className={`text-body leading-snug mb-1 ${
            isUnread ? 'font-bold text-ink' : 'font-semibold text-ink/90'
          }`}
        >
          {item.title}
        </Text>

        <Text
          className="text-small text-ink-muted leading-relaxed mb-1.5"
          numberOfLines={3}
        >
          {item.body}
        </Text>

        <View className="flex-row items-center">
          <Clock size={12} color="#6B7280" />
          <Text className="text-[11px] text-ink-muted ml-1">
            {timeFormatted}
          </Text>
        </View>
      </View>

      {item.data?.route || item.data?.url ? (
        <View className="pt-1">
          <ChevronRight size={18} color="#9CA3AF" />
        </View>
      ) : null}
    </TouchableOpacity>
  );
}

const MemoizedNotificationRow = React.memo(NotificationRow);
