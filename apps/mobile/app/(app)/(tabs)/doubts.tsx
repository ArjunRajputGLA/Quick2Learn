import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Linking,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform,
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
  Send,
  Users,
  Radio,
  ArrowLeft,
  Check,
  ShieldCheck,
  Search,
} from 'lucide-react-native';
import { Screen } from '../../../src/components/ui/Screen';
import { AppHeader } from '../../../src/components/ui/AppHeader';
import { Button } from '../../../src/components/ui/Button';
import { Badge } from '../../../src/components/ui/Badge';
import { Chip } from '../../../src/components/ui/Chip';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { Skeleton } from '../../../src/components/ui/Skeleton';
import { SegmentedControl } from '../../../src/components/ui/SegmentedControl';
import { useStudentDoubts, useMe } from '../../../src/api/hooks';
import {
  useAdminStore,
  type AdminChatChannelItem,
  type ChatMessageItem,
} from '../../../src/lib/adminDataStore';
import { colors, radii } from '@quick2learn/shared';
import { Image } from 'expo-image';
import { getFacultyAvatarSource } from '../../../src/lib/facultyImages';
import type { DoubtItem } from '@quick2learn/shared';

export default function DoubtsTabScreen() {
  const router = useRouter();
  const { data: me } = useMe();
  const adminStore = useAdminStore();

  const [mainTab, setMainTab] = useState<0 | 1>(0); // 0 = Batch & Faculty Chats, 1 = Doubt Tickets
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
  const [chatMessageText, setChatMessageText] = useState('');
  const [chatSearch, setChatSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'answered' | 'closed'>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const chatScrollRef = useRef<any>(null);

  useEffect(() => {
    adminStore.init();
  }, []);

  const {
    data: doubtsData,
    isLoading: isDoubtsLoading,
    isRefetching: isDoubtsRefetching,
    refetch: refetchDoubts,
  } = useStudentDoubts(statusFilter === 'all' ? undefined : statusFilter);

  const doubts = doubtsData?.doubts || [];
  const openCount = doubtsData?.openCount || 0;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await adminStore.init();
    await refetchDoubts();
    setIsRefreshing(false);
  };

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

  // Chats data from admin store
  const channels = adminStore.chats || [];
  const selectedChannel = channels.find((c) => c.id === selectedChannelId);

  const filteredChannels = useMemo(() => {
    if (!chatSearch.trim()) return channels;
    const q = chatSearch.toLowerCase();
    return channels.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        (c.subtitle && c.subtitle.toLowerCase().includes(q))
    );
  }, [channels, chatSearch]);

  const handleSendMessage = async () => {
    if (!chatMessageText.trim() || !selectedChannelId) return;
    const text = chatMessageText.trim();
    setChatMessageText('');
    await adminStore.sendChatMessage(
      selectedChannelId,
      text,
      'student',
      me?.profile?.fullName || 'Aarav Sharma'
    );
    setTimeout(() => {
      chatScrollRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  return (
    <Screen
      scrollable={false}
      header={
        <AppHeader
          title={
            selectedChannel
              ? selectedChannel.title
              : mainTab === 0
              ? 'Chats & Discussions'
              : 'Doubt Solver'
          }
          rightActions={
            selectedChannel ? (
              <TouchableOpacity
                onPress={() => setSelectedChannelId(null)}
                style={{
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  borderRadius: radii.full,
                  backgroundColor: '#EFF6FF',
                  borderWidth: 1,
                  borderColor: '#BFDBFE',
                }}
              >
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#2563EB' }}>
                  All Chats
                </Text>
              </TouchableOpacity>
            ) : (
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
              >
                <MessageCircle size={13} color="#059669" />
                <Text style={{ fontSize: 10.5, fontWeight: '700', color: '#065F46', marginLeft: 3 }}>
                  WhatsApp
                </Text>
              </TouchableOpacity>
            )
          }
        />
      }
    >
      <View style={{ flex: 1, backgroundColor: colors['surface-subtle'] }}>
        {/* Top Segmented Control (Hidden when inside a specific active conversation) */}
        {!selectedChannel && (
          <View
            style={{
              backgroundColor: colors.surface,
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
            }}
          >
            <SegmentedControl
              options={['Batch & Faculty Chats', 'Doubt Tickets']}
              selectedIndex={mainTab}
              onChange={(idx) => {
                setMainTab(idx as 0 | 1);
                setSelectedChannelId(null);
              }}
            />
          </View>
        )}

        {/* 1. BATCH & FACULTY CHATS TAB */}
        {mainTab === 0 && (
          <View style={{ flex: 1 }}>
            {selectedChannel ? (
              /* Active Chat Conversation View */
              <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
              >
                {/* Channel Header Info Bar */}
                <View
                  style={{
                    backgroundColor: colors.surface,
                    paddingHorizontal: 14,
                    paddingVertical: 9,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.border,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                    <TouchableOpacity
                      onPress={() => setSelectedChannelId(null)}
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 16,
                        backgroundColor: '#F1F5F9',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <ArrowLeft size={16} color="#334155" />
                    </TouchableOpacity>
                    {(() => {
                      const avatar = getFacultyAvatarSource(selectedChannel.facultyName || selectedChannel.title);
                      return avatar ? (
                        <Image
                          source={avatar}
                          style={{ width: 34, height: 34, borderRadius: 17, borderWidth: 1, borderColor: '#BFDBFE' }}
                          contentFit="cover"
                        />
                      ) : null;
                    })()}
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 14, fontWeight: '800', color: '#0F172A' }} numberOfLines={1}>
                        {selectedChannel.title}
                      </Text>
                      <Text style={{ fontSize: 11, color: '#64748B' }} numberOfLines={1}>
                        {selectedChannel.subtitle || 'Active conversation'}
                      </Text>
                    </View>
                  </View>

                  <View
                    style={{
                      paddingHorizontal: 7,
                      paddingVertical: 2,
                      borderRadius: radii.full,
                      backgroundColor:
                        selectedChannel.type === 'announcements'
                          ? '#FEF3C7'
                          : selectedChannel.type === 'direct'
                          ? '#ECFDF5'
                          : '#EFF6FF',
                      borderWidth: 1,
                      borderColor:
                        selectedChannel.type === 'announcements'
                          ? '#FDE68A'
                          : selectedChannel.type === 'direct'
                          ? '#A7F3D0'
                          : '#BFDBFE',
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 10,
                        fontWeight: '800',
                        color:
                          selectedChannel.type === 'announcements'
                            ? '#B45309'
                            : selectedChannel.type === 'direct'
                            ? '#059669'
                            : '#2563EB',
                      }}
                    >
                      {selectedChannel.type.toUpperCase()}
                    </Text>
                  </View>
                </View>

                {/* Messages Feed */}
                <ScrollView
                  ref={chatScrollRef}
                  style={{ flex: 1 }}
                  contentContainerStyle={{ padding: 14, paddingBottom: 20, gap: 10 }}
                  onContentSizeChange={() => chatScrollRef.current?.scrollToEnd({ animated: true })}
                >
                  {selectedChannel.messages.length === 0 ? (
                    <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                      <Text style={{ fontSize: 13, color: '#94A3B8', fontWeight: '500' }}>
                        No messages yet in this discussion. Say hello!
                      </Text>
                    </View>
                  ) : (
                    selectedChannel.messages.map((msg) => {
                      const isMe = msg.senderType === 'student';
                      const isTeacherOrAdmin = msg.senderType === 'teacher' || msg.senderType === 'admin';

                      return (
                        <View
                          key={msg.id}
                          style={{
                            alignSelf: isMe ? 'flex-end' : 'flex-start',
                            maxWidth: '82%',
                          }}
                        >
                          <View
                            style={{
                              backgroundColor: isMe
                                ? colors.primary
                                : isTeacherOrAdmin
                                ? '#FFFFFF'
                                : '#FFFFFF',
                              borderRadius: 16,
                              borderBottomRightRadius: isMe ? 4 : 16,
                              borderBottomLeftRadius: isMe ? 16 : 4,
                              borderWidth: isMe ? 0 : 1,
                              borderColor: '#E2E8F0',
                              paddingHorizontal: 13,
                              paddingVertical: 9,
                              elevation: 1,
                              shadowColor: '#000',
                              shadowOffset: { width: 0, height: 1 },
                              shadowOpacity: 0.04,
                              shadowRadius: 2,
                            }}
                          >
                            {!isMe && (
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 3 }}>
                                {getFacultyAvatarSource(msg.senderName) ? (
                                  <Image
                                    source={getFacultyAvatarSource(msg.senderName)!}
                                    style={{ width: 16, height: 16, borderRadius: 8 }}
                                    contentFit="cover"
                                  />
                                ) : null}
                                <Text
                                  style={{
                                    fontSize: 11,
                                    fontWeight: '800',
                                    color: isTeacherOrAdmin ? '#2563EB' : '#475569',
                                  }}
                                >
                                  {msg.senderName}
                                </Text>
                                {isTeacherOrAdmin && (
                                  <View
                                    style={{
                                      backgroundColor: '#EFF6FF',
                                      paddingHorizontal: 4,
                                      paddingVertical: 1,
                                      borderRadius: 4,
                                    }}
                                  >
                                    <Text style={{ fontSize: 9, fontWeight: '800', color: '#1D4ED8' }}>
                                      FACULTY
                                    </Text>
                                  </View>
                                )}
                              </View>
                            )}

                            <Text
                              style={{
                                fontSize: 13.5,
                                color: isMe ? '#FFFFFF' : '#0F172A',
                                lineHeight: 19,
                                fontWeight: '500',
                              }}
                            >
                              {msg.text}
                            </Text>

                            <View
                              style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'flex-end',
                                gap: 3,
                                marginTop: 4,
                              }}
                            >
                              <Text
                                style={{
                                  fontSize: 10,
                                  color: isMe ? 'rgba(255,255,255,0.75)' : '#94A3B8',
                                  fontWeight: '500',
                                }}
                              >
                                {msg.time}
                              </Text>
                              {isMe && <Check size={11} color="rgba(255,255,255,0.75)" />}
                            </View>
                          </View>
                        </View>
                      );
                    })
                  )}
                </ScrollView>

                {/* Chat Input Bar */}
                <View
                  style={{
                    backgroundColor: colors.surface,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderTopWidth: 1,
                    borderTopColor: colors.border,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <TextInput
                    value={chatMessageText}
                    onChangeText={setChatMessageText}
                    placeholder="Message your batch or teacher..."
                    placeholderTextColor="#94A3B8"
                    multiline
                    style={{
                      flex: 1,
                      backgroundColor: '#F8FAFC',
                      borderRadius: 20,
                      borderWidth: 1,
                      borderColor: '#E2E8F0',
                      paddingHorizontal: 14,
                      paddingVertical: 8,
                      fontSize: 13.5,
                      color: colors.ink,
                      maxHeight: 90,
                    }}
                  />
                  <TouchableOpacity
                    onPress={handleSendMessage}
                    disabled={!chatMessageText.trim()}
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      backgroundColor: chatMessageText.trim() ? colors.primary : '#E2E8F0',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Send size={16} color={chatMessageText.trim() ? '#FFFFFF' : '#94A3B8'} />
                  </TouchableOpacity>
                </View>
              </KeyboardAvoidingView>
            ) : (
              /* Channel List View */
              <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ padding: 12, paddingBottom: 40 }}
                showsVerticalScrollIndicator={false}
                refreshControl={
                  <RefreshControl
                    refreshing={isRefreshing}
                    onRefresh={handleRefresh}
                    tintColor={colors.primary}
                    colors={[colors.primary]}
                  />
                }
              >
                {/* Search Bar */}
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: colors.surface,
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: radii.md,
                    paddingHorizontal: 10,
                    paddingVertical: 7,
                    marginBottom: 12,
                  }}
                >
                  <Search size={16} color="#64748B" />
                  <TextInput
                    value={chatSearch}
                    onChangeText={setChatSearch}
                    placeholder="Search batch groups or faculty..."
                    placeholderTextColor="#94A3B8"
                    style={{
                      flex: 1,
                      marginLeft: 8,
                      fontSize: 13,
                      color: colors.ink,
                      padding: 0,
                    }}
                  />
                  {chatSearch.length > 0 && (
                    <TouchableOpacity onPress={() => setChatSearch('')}>
                      <Text style={{ fontSize: 12, color: '#94A3B8', fontWeight: '600' }}>Clear</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Institute Chat Help Banner */}
                <View
                  style={{
                    backgroundColor: '#EFF6FF',
                    borderWidth: 1,
                    borderColor: '#BFDBFE',
                    borderRadius: radii.md,
                    padding: 11,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 10,
                    marginBottom: 12,
                  }}
                >
                  <MessageCircle size={20} color="#2563EB" />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: '#1E3A8A' }}>
                      Official Classplus Chat Hub
                    </Text>
                    <Text style={{ fontSize: 11, color: '#3B82F6', marginTop: 1 }}>
                      Chat in real-time with Dinesh Sir, batchmates, and receive official notices.
                    </Text>
                  </View>
                </View>

                {/* Channels Cards */}
                {filteredChannels.length === 0 ? (
                  <EmptyState
                    title="No Chat Channels"
                    description="No conversations found matching your search."
                    actionLabel="View All"
                    onAction={() => setChatSearch('')}
                  />
                ) : (
                  <View style={{ gap: 8 }}>
                    {filteredChannels.map((channel) => {
                      const lastMessage =
                        channel.messages.length > 0
                          ? channel.messages[channel.messages.length - 1]
                          : null;

                      return (
                        <TouchableOpacity
                          key={channel.id}
                          activeOpacity={0.8}
                          onPress={() => setSelectedChannelId(channel.id)}
                          style={{
                            backgroundColor: colors.surface,
                            borderRadius: radii.md,
                            padding: 12,
                            borderWidth: 1,
                            borderColor: colors.border,
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 12,
                            elevation: 1,
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 1 },
                            shadowOpacity: 0.04,
                            shadowRadius: 2,
                          }}
                        >
                          {/* Channel Icon Avatar */}
                          {(() => {
                            const facultyAvatar = getFacultyAvatarSource(channel.facultyName || channel.title);
                            if (facultyAvatar) {
                              return (
                                <Image
                                  source={facultyAvatar}
                                  style={{
                                    width: 44,
                                    height: 44,
                                    borderRadius: 22,
                                    borderWidth: 1.5,
                                    borderColor: '#BFDBFE',
                                  }}
                                  contentFit="cover"
                                />
                              );
                            }
                            return (
                              <View
                                style={{
                                  width: 44,
                                  height: 44,
                                  borderRadius: 22,
                                  backgroundColor:
                                    channel.type === 'announcements'
                                      ? '#FEF3C7'
                                      : channel.type === 'direct'
                                      ? '#ECFDF5'
                                      : '#EFF6FF',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  borderWidth: 1,
                                  borderColor:
                                    channel.type === 'announcements'
                                      ? '#FDE68A'
                                      : channel.type === 'direct'
                                      ? '#A7F3D0'
                                      : '#BFDBFE',
                                }}
                              >
                                {channel.type === 'announcements' ? (
                                  <Radio size={20} color="#D97706" />
                                ) : channel.type === 'direct' ? (
                                  <ShieldCheck size={20} color="#059669" />
                                ) : (
                                  <Users size={20} color="#2563EB" />
                                )}
                              </View>
                            );
                          })()}

                          {/* Channel Details */}
                          <View style={{ flex: 1 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                              <Text style={{ fontSize: 14.5, fontWeight: '700', color: '#0F172A', flex: 1 }} numberOfLines={1}>
                                {channel.title}
                              </Text>
                              <Text style={{ fontSize: 11, color: '#94A3B8', marginLeft: 6 }}>
                                {lastMessage ? lastMessage.time : channel.lastMessageTime}
                              </Text>
                            </View>

                            <Text style={{ fontSize: 12.5, color: '#64748B' }} numberOfLines={1}>
                              {lastMessage
                                ? `${lastMessage.senderType === 'student' ? 'You: ' : ''}${lastMessage.text}`
                                : channel.subtitle || 'Tap to open chat'}
                            </Text>
                          </View>

                          {/* Unread badge & arrow */}
                          <View style={{ alignItems: 'flex-end', gap: 4 }}>
                            {channel.unreadCount > 0 && (
                              <View
                                style={{
                                  backgroundColor: colors.primary,
                                  minWidth: 18,
                                  height: 18,
                                  borderRadius: 9,
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  paddingHorizontal: 5,
                                }}
                              >
                                <Text style={{ fontSize: 10, fontWeight: '800', color: '#FFFFFF' }}>
                                  {channel.unreadCount}
                                </Text>
                              </View>
                            )}
                            <ChevronRight size={14} color="#94A3B8" />
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </ScrollView>
            )}
          </View>
        )}

        {/* 2. FORMAL DOUBT TICKETS TAB */}
        {mainTab === 1 && (
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: 12, paddingBottom: 40 }}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={handleRefresh}
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
            >
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <View style={{ flex: 1, marginRight: 10 }}>
                  <Text style={{ fontSize: 15, fontWeight: '700', color: colors.ink, marginBottom: 2 }}>
                    Have a Doubt?
                  </Text>
                  <Text style={{ fontSize: 12, color: colors['ink-muted'], lineHeight: 16 }}>
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
                >
                  <AlertCircle size={14} color="#D97706" />
                  <Text style={{ fontSize: 11, color: '#92400E', fontWeight: '500', marginLeft: 6, flex: 1 }}>
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
                >
                  <Text style={{ fontSize: 11.5, color: colors['ink-muted'] }}>
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
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 }}>
              {(
                [
                  { id: 'all', label: 'All' },
                  { id: 'open', label: 'Open' },
                  { id: 'answered', label: 'Answered' },
                  { id: 'closed', label: 'Closed' },
                ] as const
              ).map((chip) => {
                const isSelected = statusFilter === chip.id;
                const label = `${chip.label}${chip.id === 'open' && openCount > 0 ? ` (${openCount})` : ''}`;
                return (
                  <Chip
                    key={chip.id}
                    label={label}
                    selected={isSelected}
                    onPress={() => setStatusFilter(chip.id)}
                  />
                );
              })}
            </View>

            {/* Doubts List */}
            {isDoubtsLoading && !isDoubtsRefetching ? (
              <View style={{ gap: 10 }}>
                {[1, 2, 3].map((i) => (
                  <View
                    key={i}
                    style={{
                      backgroundColor: colors.surface,
                      borderRadius: radii.md,
                      padding: 12,
                      borderWidth: 1,
                      borderColor: colors.border,
                      gap: 8,
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Skeleton width={80} height={20} borderRadius={10} />
                      <Skeleton width={60} height={14} borderRadius={4} />
                    </View>
                    <Skeleton width="90%" height={18} borderRadius={4} />
                    <Skeleton width="60%" height={14} borderRadius={4} />
                  </View>
                ))}
              </View>
            ) : doubts.length === 0 ? (
              <View style={{ paddingVertical: 24 }}>
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
              <View style={{ gap: 8 }}>
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
                        elevation: 1,
                        shadowColor: '#000000',
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.04,
                        shadowRadius: 2,
                      }}
                    >
                      {/* Card Header: Status & Time */}
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
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
                            >
                              <Sparkles size={10} color="#059669" />
                              <Text style={{ fontSize: 9.5, fontWeight: '700', color: '#065F46', marginLeft: 3 }}>
                                Solved
                              </Text>
                            </View>
                          )}
                        </View>

                        <Text style={{ fontSize: 10.5, color: colors['ink-muted'] }}>
                          {formatActivityTime(doubt.lastActivityAt)}
                        </Text>
                      </View>

                      {/* Doubt Title */}
                      <Text style={{ fontSize: 14, fontWeight: '700', color: colors.ink, marginBottom: 2 }}>
                        {doubt.title}
                      </Text>

                      {/* First message snippet */}
                      {doubt.firstMessageSnippet ? (
                        <Text
                          numberOfLines={2}
                          style={{ fontSize: 12, color: colors['ink-muted'], marginBottom: 6, lineHeight: 16 }}
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
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          {doubt.subjectName ? (
                            <Text style={{ fontSize: 11.5, fontWeight: '600', color: colors.primary }}>
                              {doubt.subjectName}
                            </Text>
                          ) : null}
                          {doubt.chapterTitle ? (
                            <Text
                              numberOfLines={1}
                              style={{ fontSize: 11.5, color: colors['ink-muted'], maxWidth: 140 }}
                            >
                              • {doubt.chapterTitle}
                            </Text>
                          ) : null}
                        </View>

                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          {doubt.hasAttachments && (
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                              <Paperclip size={11} color="#6B7280" />
                              <Text style={{ fontSize: 10.5, color: colors['ink-muted'], marginLeft: 2 }}>
                                Photo
                              </Text>
                            </View>
                          )}

                          {doubt.sourceType === 'lecture' && (
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                              <Video size={11} color="#4F46E5" />
                              <Text style={{ fontSize: 10.5, color: '#4338CA', marginLeft: 2, fontWeight: '500' }}>
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
        )}
      </View>
    </Screen>
  );
}
