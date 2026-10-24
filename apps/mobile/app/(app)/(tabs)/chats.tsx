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
  User,
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
import type { DoubtItem } from '@quick2learn/shared';
import { useTabBarScroll } from '../../../src/lib/tabBarVisibilityStore';

export default function ChatsTabScreen() {
  const router = useRouter();
  const { onScroll: onTabBarScroll } = useTabBarScroll();
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
    if (typeof dateStr === 'string' && (dateStr === 'Yesterday' || dateStr === 'Today' || dateStr.includes('days ago'))) {
      return dateStr;
    }
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
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
    const senderName = me?.profile?.fullName || me?.user?.name || 'Arjun Singh Rajput';
    const senderRole = me?.role === 'admin' ? 'admin' : me?.role === 'teacher' ? 'teacher' : 'student';

    await adminStore.sendChatMessage(
      selectedChannelId,
      text,
      senderRole,
      senderName
    );

    setTimeout(() => {
      chatScrollRef.current?.scrollToEnd({ animated: true });
    }, 80);

    // If student messaged direct faculty channel, simulate helpful faculty reply after 1.5s
    if (selectedChannel?.type === 'direct' && senderRole === 'student') {
      setTimeout(async () => {
        const facultyName = selectedChannel.facultyName || 'Namita Singh Rajput';
        await adminStore.sendChatMessage(
          selectedChannelId,
          `Received your message! I will review this concept and reply shortly.`,
          'teacher',
          `${facultyName} (Faculty)`
        );
        chatScrollRef.current?.scrollToEnd({ animated: true });
      }, 1500);
    }
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
              ? 'Chats'
              : 'Doubt Solver'
          }
          subtitle={selectedChannel ? selectedChannel.subtitle : undefined}
          showBack={Boolean(selectedChannel)}
          onBack={selectedChannel ? () => setSelectedChannelId(null) : undefined}
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
            {!selectedChannel ? (
              // Channels List View (Matching 5.jpeg)
              <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ paddingBottom: 32 }}
                onScroll={onTabBarScroll}
                scrollEventThrottle={16}
                refreshControl={
                  <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
                }
              >
                {/* Search Bar matching 5.jpeg */}
                <View style={{ paddingHorizontal: 12, paddingTop: 10, paddingBottom: 6 }}>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: '#FFFFFF',
                      borderRadius: 12,
                      paddingHorizontal: 12,
                      paddingVertical: Platform.OS === 'ios' ? 9 : 6,
                      borderWidth: 1,
                      borderColor: '#E2E8F0',
                    }}
                  >
                    <Search size={16} color="#94A3B8" style={{ marginRight: 8 }} />
                    <TextInput
                      value={chatSearch}
                      onChangeText={setChatSearch}
                      placeholder="Search by name or number"
                      placeholderTextColor="#94A3B8"
                      style={{
                        flex: 1,
                        fontSize: 14,
                        color: colors.ink,
                        padding: 0,
                      }}
                    />
                  </View>
                </View>

                {/* Section Title matching 5.jpeg */}
                <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 }}>
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: '700',
                      color: '#64748B',
                      letterSpacing: 0.6,
                      textTransform: 'uppercase',
                    }}
                  >
                    Messages
                  </Text>
                </View>

                {/* Channels List */}
                <View style={{ backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#F1F5F9' }}>
                  {filteredChannels.length === 0 ? (
                    <View style={{ padding: 32, alignItems: 'center' }}>
                      <Text style={{ fontSize: 14, color: '#94A3B8' }}>No chats found</Text>
                    </View>
                  ) : (
                    filteredChannels.map((channel) => {
                      const isDirect = channel.type === 'direct';
                      return (
                        <TouchableOpacity
                          key={channel.id}
                          activeOpacity={0.7}
                          onPress={() => setSelectedChannelId(channel.id)}
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            paddingHorizontal: 16,
                            paddingVertical: 13,
                            borderBottomWidth: 1,
                            borderBottomColor: '#F1F5F9',
                          }}
                        >
                          {/* Channel Avatar (matching 5.jpeg) */}
                          <View
                            style={{
                              width: 48,
                              height: 48,
                              borderRadius: 24,
                              backgroundColor: isDirect ? '#E2E8F0' : '#E0F2FE',
                              alignItems: 'center',
                              justifyContent: 'center',
                              marginRight: 14,
                            }}
                          >
                            {isDirect ? (
                              <User size={24} color="#334155" strokeWidth={1.8} />
                            ) : (
                              <Users size={24} color="#0284C7" strokeWidth={1.8} />
                            )}
                          </View>

                          {/* Channel Details */}
                          <View style={{ flex: 1, marginRight: 8 }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                              <Text
                                style={{
                                  fontSize: 15,
                                  fontWeight: '700',
                                  color: '#1E293B',
                                  flexShrink: 1,
                                }}
                                numberOfLines={1}
                              >
                                {channel.title}
                              </Text>
                              <Text
                                style={{
                                  fontSize: 12,
                                  color: '#64748B',
                                  marginLeft: 6,
                                }}
                              >
                                {formatActivityTime(channel.lastMessageTime || '')}
                              </Text>
                            </View>

                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                              <Text
                                style={{
                                  fontSize: 13.5,
                                  color: channel.unreadCount ? '#0F172A' : '#64748B',
                                  fontWeight: channel.unreadCount ? '600' : '400',
                                  flex: 1,
                                  marginRight: 6,
                                }}
                                numberOfLines={1}
                              >
                                {channel.lastMessage || 'No messages yet'}
                              </Text>
                              {channel.unreadCount ? (
                                <View
                                  style={{
                                    backgroundColor: '#2563EB',
                                    borderRadius: 10,
                                    minWidth: 18,
                                    height: 18,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    paddingHorizontal: 5,
                                  }}
                                >
                                  <Text style={{ fontSize: 10, color: '#FFFFFF', fontWeight: '700' }}>
                                    {channel.unreadCount}
                                  </Text>
                                </View>
                              ) : null}
                            </View>
                          </View>
                        </TouchableOpacity>
                      );
                    })
                  )}
                </View>
              </ScrollView>
            ) : (
              // Active Conversation Screen
              <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
              >
                {/* Messages List */}
                <ScrollView
                  ref={chatScrollRef}
                  style={{ flex: 1, paddingHorizontal: 12, paddingTop: 10 }}
                  contentContainerStyle={{ paddingBottom: 16 }}
                  onContentSizeChange={() => chatScrollRef.current?.scrollToEnd({ animated: false })}
                >
                  {/* Channel banner notice */}
                  <View
                    style={{
                      alignItems: 'center',
                      marginVertical: 10,
                      paddingHorizontal: 16,
                    }}
                  >
                    <View
                      style={{
                        backgroundColor: '#F1F5F9',
                        paddingHorizontal: 12,
                        paddingVertical: 5,
                        borderRadius: radii.full,
                      }}
                    >
                      <Text style={{ fontSize: 11, color: '#64748B', textAlign: 'center' }}>
                        Messages are end-to-end encrypted & synced with Dinesh Sir
                      </Text>
                    </View>
                  </View>

                  {/* Messages list */}
                  {(selectedChannel.messages || []).map((msg) => {
                    const isMe =
                      msg.senderRole === 'student' ||
                      msg.senderName?.includes('Arjun') ||
                      msg.senderName?.includes('Aarav');

                    return (
                      <View
                        key={msg.id}
                        style={{
                          marginVertical: 4,
                          alignItems: isMe ? 'flex-end' : 'flex-start',
                        }}
                      >
                        <View
                          style={{
                            maxWidth: '82%',
                            borderRadius: 16,
                            borderBottomRightRadius: isMe ? 4 : 16,
                            borderBottomLeftRadius: isMe ? 16 : 4,
                            paddingHorizontal: 14,
                            paddingVertical: 9,
                            backgroundColor: isMe ? '#2563EB' : '#FFFFFF',
                            borderWidth: isMe ? 0 : 1,
                            borderColor: '#E2E8F0',
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 1 },
                            shadowOpacity: 0.05,
                            shadowRadius: 2,
                            elevation: 1,
                          }}
                        >
                          {!isMe && (
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2, gap: 4 }}>
                              <Text style={{ fontSize: 11.5, fontWeight: '700', color: '#1E40AF' }}>
                                {msg.senderName}
                              </Text>
                              {msg.senderRole === 'teacher' || msg.senderRole === 'admin' ? (
                                <View
                                  style={{
                                    backgroundColor: '#EFF6FF',
                                    paddingHorizontal: 4,
                                    paddingVertical: 1,
                                    borderRadius: 4,
                                  }}
                                >
                                  <Text style={{ fontSize: 8.5, fontWeight: '700', color: '#2563EB' }}>
                                    FACULTY
                                  </Text>
                                </View>
                              ) : null}
                            </View>
                          )}

                          <Text
                            style={{
                              fontSize: 14.5,
                              lineHeight: 20,
                              color: isMe ? '#FFFFFF' : '#1E293B',
                            }}
                          >
                            {msg.text}
                          </Text>

                          <View
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              justifyContent: 'flex-end',
                              marginTop: 3,
                              gap: 3,
                            }}
                          >
                            <Text
                              style={{
                                fontSize: 10,
                                color: isMe ? 'rgba(255, 255, 255, 0.75)' : '#94A3B8',
                              }}
                            >
                              {formatActivityTime(msg.createdAt)}
                            </Text>
                            {isMe && <Check size={11} color="rgba(255, 255, 255, 0.8)" />}
                          </View>
                        </View>
                      </View>
                    );
                  })}
                </ScrollView>

                {/* Input Bar */}
                <View
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderTopWidth: 1,
                    borderTopColor: '#E2E8F0',
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <TextInput
                    value={chatMessageText}
                    onChangeText={setChatMessageText}
                    placeholder="Type a message..."
                    placeholderTextColor="#94A3B8"
                    multiline
                    style={{
                      flex: 1,
                      backgroundColor: '#F8FAFC',
                      borderWidth: 1,
                      borderColor: '#E2E8F0',
                      borderRadius: 20,
                      paddingHorizontal: 14,
                      paddingVertical: Platform.OS === 'ios' ? 8 : 6,
                      fontSize: 14,
                      maxHeight: 100,
                      color: colors.ink,
                    }}
                  />

                  <TouchableOpacity
                    onPress={handleSendMessage}
                    disabled={!chatMessageText.trim()}
                    activeOpacity={0.7}
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      backgroundColor: chatMessageText.trim() ? '#2563EB' : '#94A3B8',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Send size={18} color="#FFFFFF" style={{ marginLeft: 2 }} />
                  </TouchableOpacity>
                </View>
              </KeyboardAvoidingView>
            )}
          </View>
        )}

        {/* 2. DOUBT TICKETS TAB */}
        {mainTab === 1 && (
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: 12, paddingBottom: 40 }}
            onScroll={onTabBarScroll}
            scrollEventThrottle={16}
            refreshControl={
              <RefreshControl
                refreshing={isDoubtsRefetching}
                onRefresh={handleRefresh}
              />
            }
          >
            {/* Header Action Banner */}
            <View
              style={{
                backgroundColor: colors.surface,
                borderRadius: radii.xl,
                padding: 16,
                marginBottom: 14,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <HelpCircle size={18} color={colors.primary} />
                  <Text style={{ fontSize: 16, fontWeight: '700', color: colors.ink }}>
                    Have a Question?
                  </Text>
                </View>
                {openCount > 0 && (
                  <Badge label={`${openCount} Open`} variant="warning" size="sm" />
                )}
              </View>

              <Text style={{ fontSize: 13, color: colors['ink-muted'], marginBottom: 12, lineHeight: 18 }}>
                Submit question photos or textbook doubts directly to Dinesh Sir.
              </Text>

              <Button
                variant="primary"
                size="md"
                onPress={handleAskDoubt}
                icon={<Plus size={16} color="#FFFFFF" />}
              >
                Ask a Doubt
              </Button>
            </View>

            {/* Status Filter Chips */}
            <View style={{ flexDirection: 'row', gap: 6, marginBottom: 14 }}>
              {(['all', 'open', 'answered', 'closed'] as const).map((st) => (
                <Chip
                  key={st}
                  label={st.toUpperCase()}
                  selected={statusFilter === st}
                  onPress={() => setStatusFilter(st)}
                />
              ))}
            </View>

            {/* Doubts List */}
            {isDoubtsLoading ? (
              <View style={{ gap: 10 }}>
                <Skeleton width="100%" height={90} borderRadius={16} />
                <Skeleton width="100%" height={90} borderRadius={16} />
              </View>
            ) : doubts.length === 0 ? (
              <EmptyState
                title="No Doubts Found"
                description="You haven't submitted any doubts under this filter."
                illustration={<MessageCircle size={32} color={colors['ink-muted']} />}
                actionLabel="Ask a Doubt"
                onAction={handleAskDoubt}
              />
            ) : (
              doubts.map((item: DoubtItem) => (
                <TouchableOpacity
                  key={item.id}
                  activeOpacity={0.7}
                  onPress={() => handleOpenThread(item.id)}
                  style={{
                    backgroundColor: colors.surface,
                    borderRadius: radii.xl,
                    padding: 14,
                    marginBottom: 10,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                    <Badge
                      label={item.status.toUpperCase()}
                      variant={
                        item.status === 'answered'
                          ? 'success'
                          : item.status === 'open'
                          ? 'warning'
                          : 'neutral'
                      }
                      size="sm"
                    />
                    <Text style={{ fontSize: 11, color: colors['ink-muted'] }}>
                      {formatActivityTime(item.createdAt)}
                    </Text>
                  </View>

                  <Text
                    style={{ fontSize: 15, fontWeight: '700', color: colors.ink, marginBottom: 4 }}
                    numberOfLines={2}
                  >
                    {item.title}
                  </Text>

                  {item.firstMessageSnippet ? (
                    <View
                      style={{
                        backgroundColor: '#EFF6FF',
                        borderRadius: 8,
                        padding: 8,
                        marginTop: 6,
                        borderLeftWidth: 3,
                        borderLeftColor: '#2563EB',
                      }}
                    >
                      <Text style={{ fontSize: 12, color: '#1E40AF', fontWeight: '600' }} numberOfLines={2}>
                        {item.firstMessageSnippet}
                      </Text>
                    </View>
                  ) : null}
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        )}
      </View>
    </Screen>
  );
}
