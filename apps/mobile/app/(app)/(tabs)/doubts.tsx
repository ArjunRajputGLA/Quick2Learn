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
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: radii.full,
                borderWidth: 1,
                borderColor: '#A7F3D0',
              }}
              className="flex-row items-center bg-emerald-50 px-2.5 py-1.5 rounded-full border border-emerald-200"
              accessibilityRole="button"
              accessibilityLabel="Open batch WhatsApp group"
            >
              <MessageCircle size={14} color="#059669" />
              <Text style={{ fontSize: 11, fontWeight: '700', color: '#065F46', marginLeft: 4 }} className="text-[11px] font-bold text-emerald-800 ml-1">
                WhatsApp Group
              </Text>
            </TouchableOpacity>
          }
        />
      }
    >
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 60 }}
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
            borderRadius: radii.xl,
            padding: 16,
            borderWidth: 1,
            borderColor: colors.border,
            marginBottom: 16,
            elevation: 2,
            shadowColor: '#000000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 3,
          }}
          className="bg-surface rounded-2xl p-4 border border-border shadow-xs mb-4"
        >
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }} className="flex-row items-start justify-between">
            <View style={{ flex: 1, marginRight: 12 }} className="flex-1 mr-3">
              <Text style={{ fontSize: 18, fontWeight: '700', color: colors.ink, marginBottom: 4 }} className="text-h3 font-bold text-ink mb-1">
                Have a Doubt?
              </Text>
              <Text style={{ fontSize: 13, color: colors['ink-muted'], lineHeight: 18 }} className="text-caption text-ink-muted leading-relaxed">
                Snap a photo of your textbook problem or rough work for step-by-step guidance from Dinesh Sir.
              </Text>
            </View>

            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: radii.md,
                backgroundColor: colors['primary-soft'],
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: 'rgba(37, 99, 235, 0.2)',
              }}
              className="w-10 h-10 rounded-xl bg-primary-soft items-center justify-center border border-primary/20"
            >
              <HelpCircle size={22} color={colors.primary} />
            </View>
          </View>

          {/* Open Doubts Quota Alert if at limit */}
          {openCount >= 5 ? (
            <View
              style={{
                marginTop: 14,
                backgroundColor: '#FFFBEB',
                padding: 12,
                borderRadius: radii.md,
                borderWidth: 1,
                borderColor: '#FDE68A',
                flexDirection: 'row',
                alignItems: 'center',
              }}
              className="mt-3.5 bg-amber-50 p-3 rounded-xl border border-amber-200 flex-row items-center"
            >
              <AlertCircle size={16} color="#D97706" />
              <Text style={{ fontSize: 12, color: '#92400E', fontWeight: '500', marginLeft: 8, flex: 1 }} className="text-caption text-amber-900 font-medium ml-2 flex-1">
                You have 5 open doubts (limit reached). A teacher will respond shortly, or you can close resolved doubts.
              </Text>
            </View>
          ) : (
            <View
              style={{
                marginTop: 14,
                paddingTop: 12,
                borderTopWidth: 1,
                borderTopColor: colors.border,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
              className="mt-3.5 pt-3 border-t border-border/70 flex-row items-center justify-between"
            >
              <Text style={{ fontSize: 13, color: colors['ink-muted'] }} className="text-caption text-ink-muted">
                {openCount}/5 open doubts
              </Text>
              <Button
                variant="primary"
                size="sm"
                onPress={handleAskDoubt}
                icon={<Plus size={16} color="#FFFFFF" />}
              >
                Ask a Doubt
              </Button>
            </View>
          )}
        </View>

        {/* Filter Chips: All, Open, Answered, Closed */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 }} className="flex-row items-center space-x-2 mb-3.5">
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
                  paddingVertical: 6,
                  paddingHorizontal: 12,
                  borderRadius: radii.full,
                  borderWidth: 1,
                  backgroundColor: isSelected ? colors.primary : colors.surface,
                  borderColor: isSelected ? colors.primary : colors.border,
                }}
                className={`py-1.5 px-3 rounded-full border ${
                  isSelected
                    ? 'bg-primary border-primary'
                    : 'bg-surface border-border'
                }`}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: '600',
                    color: isSelected ? '#FFFFFF' : colors['ink-muted'],
                  }}
                  className={`text-small font-semibold ${
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
                    borderRadius: radii.xl,
                    padding: 16,
                    borderWidth: 1,
                    borderColor: colors.border,
                    marginBottom: 12,
                    elevation: 2,
                    shadowColor: '#000000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.05,
                    shadowRadius: 3,
                  }}
                  className="bg-surface rounded-2xl p-4 border border-border shadow-xs"
                >
                  {/* Card Header: Status & Time */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }} className="flex-row items-center justify-between mb-2">
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
                            paddingHorizontal: 8,
                            paddingVertical: 2,
                            borderRadius: radii.full,
                            borderWidth: 1,
                            borderColor: '#A7F3D0',
                            flexDirection: 'row',
                            alignItems: 'center',
                          }}
                          className="bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex-row items-center"
                        >
                          <Sparkles size={10} color="#059669" />
                          <Text style={{ fontSize: 10, fontWeight: '700', color: '#065F46', marginLeft: 4 }} className="text-[10px] font-bold text-emerald-800 ml-1">
                            Solved
                          </Text>
                        </View>
                      )}
                    </View>

                    <Text style={{ fontSize: 11, color: colors['ink-muted'] }} className="text-[11px] text-ink-muted">
                      {formatActivityTime(doubt.lastActivityAt)}
                    </Text>
                  </View>

                  {/* Doubt Title */}
                  <Text style={{ fontSize: 15, fontWeight: '700', color: colors.ink, marginBottom: 4 }} className="text-body font-bold text-ink mb-1 leading-snug">
                    {doubt.title}
                  </Text>

                  {/* First message snippet */}
                  {doubt.firstMessageSnippet ? (
                    <Text
                      numberOfLines={2}
                      style={{ fontSize: 13, color: colors['ink-muted'], marginBottom: 10, lineHeight: 18 }}
                      className="text-small text-ink-muted mb-2.5 leading-relaxed"
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
                      paddingTop: 8,
                      borderTopWidth: 1,
                      borderTopColor: colors.border,
                    }}
                    className="flex-row items-center justify-between pt-2 border-t border-border/60"
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }} className="flex-row items-center space-x-2">
                      {doubt.subjectName ? (
                        <Text style={{ fontSize: 12, fontWeight: '600', color: colors.primary }} className="text-caption font-semibold text-primary">
                          {doubt.subjectName}
                        </Text>
                      ) : null}
                      {doubt.chapterTitle ? (
                        <Text
                          numberOfLines={1}
                          style={{ fontSize: 12, color: colors['ink-muted'], maxWidth: 140 }}
                          className="text-caption text-ink-muted max-w-[140px]"
                        >
                          • {doubt.chapterTitle}
                        </Text>
                      ) : null}
                    </View>

                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }} className="flex-row items-center space-x-2.5">
                      {doubt.hasAttachments && (
                        <View style={{ flexDirection: 'row', alignItems: 'center' }} className="flex-row items-center">
                          <Paperclip size={12} color="#6B7280" />
                          <Text style={{ fontSize: 11, color: colors['ink-muted'], marginLeft: 2 }} className="text-[11px] text-ink-muted ml-0.5">
                            Photo
                          </Text>
                        </View>
                      )}

                      {doubt.sourceType === 'lecture' && (
                        <View style={{ flexDirection: 'row', alignItems: 'center' }} className="flex-row items-center">
                          <Video size={12} color="#4F46E5" />
                          <Text style={{ fontSize: 11, color: '#4338CA', marginLeft: 2, fontWeight: '500' }} className="text-[11px] text-indigo-700 ml-0.5 font-medium">
                            Lecture
                          </Text>
                        </View>
                      )}

                      <ChevronRight size={16} color="#9CA3AF" />
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
