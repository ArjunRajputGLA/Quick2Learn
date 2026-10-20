import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  HelpCircle,
  MessageCircle,
  Plus,
  Paperclip,
  CheckCircle2,
  Clock,
  ExternalLink,
  ChevronRight,
  Sparkles,
  AlertCircle,
  Video,
} from 'lucide-react-native';
import { Screen } from '../../../src/components/ui/Screen';
import { AppHeader } from '../../../src/components/ui/AppHeader';
import { Button } from '../../../src/components/ui/Button';
import { Badge } from '../../../src/components/ui/Badge';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { Skeleton } from '../../../src/components/ui/Skeleton';
import { useStudentDoubts } from '../../../src/api/hooks';
import { colors, radii } from '@quick2learn/shared';
import type { DoubtItem } from '@quick2learn/shared';

export default function DoubtsTabScreen() {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'answered' | 'closed'>('all');

  const {
    data,
    isLoading,
    isRefetching,
    refetch,
  } = useStudentDoubts(statusFilter === 'all' ? undefined : statusFilter);

  const doubts = data?.doubts || [];
  const openCount = data?.openCount || 0;

  const handleOpenWhatsAppGroup = () => {
    Linking.openURL(
      'https://wa.me/919412278910?text=Hi%20Dinesh%20Sir%2C%20regarding%20the%20batch%20WhatsApp%20group...'
    );
  };

  const handleAskDoubt = () => {
    router.push('/(app)/doubt/new' as any);
  };

  const handleOpenThread = (doubtId: string) => {
    router.push(`/(app)/doubt/${doubtId}` as any);
  };

  const formatActivityTime = (dateStr: string | Date) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <Screen
      scrollable={false}
      header={
        <AppHeader
          title="Doubts"
          rightActions={
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleOpenWhatsAppGroup}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: '#ECFDF5',
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: radii.full,
                borderWidth: 1,
                borderColor: '#A7F3D0',
              }}
              className="flex-row items-center bg-emerald-50 px-2 py-1 rounded-full border border-emerald-200"
              accessibilityRole="button"
              accessibilityLabel="Open batch WhatsApp group"
            >
              <MessageCircle size={13} color="#059669" />
              <Text style={{ fontSize: 10.5, fontWeight: '700', color: '#065F46', marginLeft: 3 }} className="text-[10.5px] font-bold text-emerald-800 ml-1">
                WhatsApp Group
              </Text>
            </TouchableOpacity>
          }
        />
      }
    >
      <ScrollView
        style={{ flex: 1 }}
        className="flex-1"
        contentContainerStyle={{ padding: 12, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => {
              refetch();
            }}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {/* Top Action Card: Ask Dinesh Sir */}
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: radii.md,
            padding: 12,
            borderWidth: 1,
            borderColor: colors.border,
            marginBottom: 10,
            elevation: 1,
            shadowColor: '#000000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.04,
            shadowRadius: 2,
          }}
          className="bg-surface rounded-xl p-3 border border-border shadow-2xs mb-2.5"
        >
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }} className="flex-row items-start justify-between">
            <View style={{ flex: 1, marginRight: 10 }} className="flex-1 mr-2.5">
              <Text style={{ fontSize: 15, fontWeight: '700', color: colors.ink, marginBottom: 2 }} className="text-body font-bold text-ink mb-0.5">
                Have a Doubt?
              </Text>
              <Text style={{ fontSize: 12, color: colors['ink-muted'], lineHeight: 16 }} className="text-caption text-ink-muted leading-relaxed">
                Snap a photo of your textbook problem or rough work for step-by-step guidance from Dinesh Sir.
              </Text>
            </View>

            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: radii.sm,
                backgroundColor: colors['primary-soft'],
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: 'rgba(37, 99, 235, 0.2)',
              }}
              className="w-8 h-8 rounded-lg bg-primary-soft items-center justify-center border border-primary/20"
            >
              <HelpCircle size={18} color={colors.primary} />
            </View>
          </View>

          {/* Open Doubts Quota Alert if at limit */}
          {openCount >= 5 ? (
            <View
              style={{
                marginTop: 10,
                backgroundColor: '#FFFBEB',
                padding: 8,
                borderRadius: radii.sm,
                borderWidth: 1,
                borderColor: '#FDE68A',
                flexDirection: 'row',
                alignItems: 'center',
              }}
              className="mt-2.5 bg-amber-50 p-2 rounded-lg border border-amber-200 flex-row items-center"
            >
              <AlertCircle size={14} color="#D97706" />
              <Text style={{ fontSize: 11, color: '#92400E', fontWeight: '500', marginLeft: 6, flex: 1 }} className="text-[11px] text-amber-900 font-medium ml-1.5 flex-1">
                You have 5 open doubts (limit reached). A teacher will respond shortly, or you can close resolved doubts.
              </Text>
            </View>
          ) : (
            <View
              style={{
                marginTop: 10,
                paddingTop: 8,
                borderTopWidth: 1,
                borderTopColor: colors.border,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
              className="mt-2.5 pt-2 border-t border-border/70 flex-row items-center justify-between"
            >
              <Text style={{ fontSize: 11.5, color: colors['ink-muted'] }} className="text-[11.5px] text-ink-muted">
                {openCount}/5 open doubts
              </Text>
              <Button
                variant="primary"
                size="sm"
                onPress={handleAskDoubt}
                icon={<Plus size={14} color="#FFFFFF" />}
              >
                Ask a Doubt
              </Button>
            </View>
          )}
        </View>

        {/* Filter Chips: All, Open, Answered, Closed */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 }} className="flex-row items-center space-x-1.5 mb-2.5">
          {(
            [
              { id: 'all', label: 'All' },
              { id: 'open', label: 'Open' },
              { id: 'answered', label: 'Answered' },
              { id: 'closed', label: 'Closed' },
            ] as const
          ).map((chip) => {
            const isSelected = statusFilter === chip.id;
            return (
              <TouchableOpacity
                key={chip.id}
                activeOpacity={0.7}
                onPress={() => setStatusFilter(chip.id)}
                style={{
                  paddingVertical: 4,
                  paddingHorizontal: 10,
                  borderRadius: radii.full,
                  borderWidth: 1,
                  backgroundColor: isSelected ? colors.primary : colors.surface,
                  borderColor: isSelected ? colors.primary : colors.border,
                }}
                className={`py-1 px-2.5 rounded-full border ${
                  isSelected
                    ? 'bg-primary border-primary'
                    : 'bg-surface border-border'
                }`}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: '600',
                    color: isSelected ? '#FFFFFF' : colors['ink-muted'],
                  }}
                  className={`text-[12px] font-semibold ${
                    isSelected ? 'text-white' : 'text-ink-muted'
                  }`}
                >
                  {chip.label}
                  {chip.id === 'open' && openCount > 0 ? ` (${openCount})` : ''}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Doubts List */}
        {isLoading && !isRefetching ? (
          <View className="space-y-3">
            {[1, 2, 3].map((i) => (
              <View
                key={i}
                className="bg-surface rounded-2xl p-4 border border-border space-y-2.5"
              >
                <View className="flex-row items-center justify-between">
                  <Skeleton width={80} height={20} className="rounded-full" />
                  <Skeleton width={60} height={14} className="rounded" />
                </View>
                <Skeleton width="90%" height={18} className="rounded" />
                <Skeleton width="60%" height={14} className="rounded" />
              </View>
            ))}
          </View>
        ) : doubts.length === 0 ? (
          <View className="py-8">
            <EmptyState
              title={
                statusFilter === 'all'
                  ? 'No Doubts Asked Yet'
                  : `No ${statusFilter} doubts`
              }
              description={
                statusFilter === 'all'
                  ? 'Whenever you get stuck on a homework question or test step, ask Dinesh Sir right here!'
                  : `You have no doubts marked as ${statusFilter}.`
              }
              actionLabel="Ask a Doubt"
              onAction={handleAskDoubt}
            />
          </View>
        ) : (
          <View style={{ gap: 12 }} className="space-y-3">
            {doubts.map((doubt: DoubtItem) => {
              const statusVariant =
                doubt.status === 'open'
                  ? 'warning'
                  : doubt.status === 'answered'
                  ? 'primary'
                  : 'success';

              const statusText =
                doubt.status === 'open'
                  ? 'Waiting for Teacher'
                  : doubt.status === 'answered'
                  ? 'Teacher Replied'
                  : 'Resolved';

              return (
                <TouchableOpacity
                  key={doubt.id}
                  activeOpacity={0.7}
                  onPress={() => handleOpenThread(doubt.id)}
                  style={{
                    backgroundColor: colors.surface,
                    borderRadius: radii.md,
                    padding: 12,
                    borderWidth: 1,
                    borderColor: colors.border,
                    marginBottom: 8,
                    elevation: 1,
                    shadowColor: '#000000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.04,
                    shadowRadius: 2,
                  }}
                  className="bg-surface rounded-xl p-3 border border-border shadow-2xs mb-2"
                >
                  {/* Card Header: Status & Time */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }} className="flex-row items-center justify-between mb-1.5">
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }} className="flex-row items-center space-x-1.5">
                      <Badge
                        label={statusText}
                        variant={statusVariant as any}
                        size="sm"
                      />
                      {doubt.isHelpful && (
                        <View
                          style={{
                            backgroundColor: '#ECFDF5',
                            paddingHorizontal: 6,
                            paddingVertical: 1.5,
                            borderRadius: radii.full,
                            borderWidth: 1,
                            borderColor: '#A7F3D0',
                            flexDirection: 'row',
                            alignItems: 'center',
                          }}
                          className="bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-200 flex-row items-center"
                        >
                          <Sparkles size={10} color="#059669" />
                          <Text style={{ fontSize: 9.5, fontWeight: '700', color: '#065F46', marginLeft: 3 }} className="text-[9.5px] font-bold text-emerald-800 ml-1">
                            Solved
                          </Text>
                        </View>
                      )}
                    </View>

                    <Text style={{ fontSize: 10.5, color: colors['ink-muted'] }} className="text-[10.5px] text-ink-muted">
                      {formatActivityTime(doubt.lastActivityAt)}
                    </Text>
                  </View>

                  {/* Doubt Title */}
                  <Text style={{ fontSize: 14, fontWeight: '700', color: colors.ink, marginBottom: 2 }} className="text-body font-bold text-ink mb-0.5 leading-snug">
                    {doubt.title}
                  </Text>

                  {/* First message snippet */}
                  {doubt.firstMessageSnippet ? (
                    <Text
                      numberOfLines={2}
                      style={{ fontSize: 12, color: colors['ink-muted'], marginBottom: 6, lineHeight: 16 }}
                      className="text-caption text-ink-muted mb-1.5 leading-relaxed"
                    >
                      {doubt.firstMessageSnippet}
                    </Text>
                  ) : null}

                  {/* Card Footer: Subject, Source & Message Count */}
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingTop: 6,
                      borderTopWidth: 1,
                      borderTopColor: colors.border,
                    }}
                    className="flex-row items-center justify-between pt-1.5 border-t border-border/60"
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }} className="flex-row items-center space-x-2">
                      {doubt.subjectName ? (
                        <Text style={{ fontSize: 11.5, fontWeight: '600', color: colors.primary }} className="text-caption font-semibold text-primary">
                          {doubt.subjectName}
                        </Text>
                      ) : null}
                      {doubt.chapterTitle ? (
                        <Text
                          numberOfLines={1}
                          style={{ fontSize: 11.5, color: colors['ink-muted'], maxWidth: 140 }}
                          className="text-caption text-ink-muted max-w-[140px]"
                        >
                          • {doubt.chapterTitle}
                        </Text>
                      ) : null}
                    </View>

                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }} className="flex-row items-center space-x-2">
                      {doubt.hasAttachments && (
                        <View style={{ flexDirection: 'row', alignItems: 'center' }} className="flex-row items-center">
                          <Paperclip size={11} color="#6B7280" />
                          <Text style={{ fontSize: 10.5, color: colors['ink-muted'], marginLeft: 2 }} className="text-[10.5px] text-ink-muted ml-0.5">
                            Photo
                          </Text>
                        </View>
                      )}

                      {doubt.sourceType === 'lecture' && (
                        <View style={{ flexDirection: 'row', alignItems: 'center' }} className="flex-row items-center">
                          <Video size={11} color="#4F46E5" />
                          <Text style={{ fontSize: 10.5, color: '#4338CA', marginLeft: 2, fontWeight: '500' }} className="text-[10.5px] text-indigo-700 ml-0.5 font-medium">
                            Lecture
                          </Text>
                        </View>
                      )}

                      <ChevronRight size={14} color="#9CA3AF" />
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}
