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
  Alert,
  BackHandler,
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
  CheckCheck,
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
import {
  useAdminStore,
  type AdminChatChannelItem,
  type ChatMessageItem,
} from '../../../src/lib/adminDataStore';
import { colors, radii } from '@quick2learn/shared';
import { useTabBarScroll, useTabBarVisibilityStore } from '../../../src/lib/tabBarVisibilityStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMe } from '../../../src/api/hooks';

export default function ChatsTabScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { onScroll: onTabBarScroll } = useTabBarScroll();
  const { data: me } = useMe();
  const role = me?.role || 'student';
  const isAdminOrTeacher = role === 'admin' || role === 'teacher';
  const adminStore = useAdminStore();

  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
  const [chatMessageText, setChatMessageText] = useState('');
  const [chatSearch, setChatSearch] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const chatScrollRef = useRef<any>(null);

  useEffect(() => {
    adminStore.init();
  }, []);

  // Hide footer navbar inside active chat, restore on exit or unmount
  useEffect(() => {
    if (selectedChannelId) {
      useTabBarVisibilityStore.getState().setVisible(false);
    } else {
      useTabBarVisibilityStore.getState().setVisible(true);
    }
    return () => {
      useTabBarVisibilityStore.getState().setVisible(true);
    };
  }, [selectedChannelId]);

  // Handle hardware back press on Android when inside a chat
  useEffect(() => {
    if (!selectedChannelId) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      setSelectedChannelId(null);
      return true;
    });
    return () => sub.remove();
  }, [selectedChannelId]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await adminStore.init();
    setIsRefreshing(false);
  };

  const handleOpenWhatsAppGroup = () => {
    Linking.openURL(
      'https://wa.me/919412278910?text=Hi%20Dinesh%20Sir%2C%20regarding%20the%20batch%20WhatsApp%20group...'
    );
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

  const formatBubbleTime = (dateStr: string | Date | undefined) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
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
    const senderName =
      me?.profile?.fullName ||
      me?.user?.name ||
      (isAdminOrTeacher ? 'Dinesh Singh Rajput' : 'Arjun Singh Rajput');
    const senderRole = me?.role === 'admin' ? 'admin' : me?.role === 'teacher' ? 'teacher' : 'student';

    await adminStore.sendChatMessage(
      selectedChannelId,
      text,
      senderRole,
      senderName,
      undefined,
      true
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
          `${facultyName} (Faculty)`,
          undefined,
          false
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
          title={selectedChannel ? selectedChannel.title : 'Chats'}
          subtitle={selectedChannel ? selectedChannel.subtitle : undefined}
          showBack={Boolean(selectedChannel)}
          onBack={selectedChannel ? () => setSelectedChannelId(null) : undefined}
          rightActions={
            selectedChannel ? (
              <TouchableOpacity
                onPress={() => setSelectedChannelId(null)}
                style={{
                  paddingHorizontal: 9,
                  paddingVertical: 4,
                  borderRadius: radii.full,
                  backgroundColor: '#EFF6FF',
                  borderWidth: 1,
                  borderColor: '#BFDBFE',
                }}
              >
                <Text style={{ fontSize: 10.5, fontWeight: '700', color: '#2563EB' }}>
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
                  paddingVertical: 3.5,
                  borderRadius: radii.full,
                  borderWidth: 1,
                  borderColor: '#A7F3D0',
                }}
              >
                <MessageCircle size={12} color="#059669" />
                <Text style={{ fontSize: 10, fontWeight: '700', color: '#065F46', marginLeft: 3 }}>
                  WhatsApp
                </Text>
              </TouchableOpacity>
            )
          }
        />
      }
    >
      <View style={{ flex: 1, backgroundColor: colors['surface-subtle'] }}>
        {!selectedChannel ? (
              // Channels List View (Matching 5.jpeg)
              <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ paddingBottom: 130, flexGrow: 1 }}
                onScroll={onTabBarScroll}
                scrollEventThrottle={16}
                refreshControl={
                  <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
                }
              >
                {/* Search Bar matching modern messaging UI */}
                <View style={{ paddingHorizontal: 12, paddingTop: 8, paddingBottom: 4 }}>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: '#FFFFFF',
                      borderRadius: 10,
                      paddingHorizontal: 10,
                      paddingVertical: Platform.OS === 'ios' ? 7 : 4.5,
                      borderWidth: 1,
                      borderColor: '#E2E8F0',
                    }}
                  >
                    <Search size={14} color="#94A3B8" style={{ marginRight: 8 }} />
                    <TextInput
                      value={chatSearch}
                      onChangeText={setChatSearch}
                      placeholder={isAdminOrTeacher ? 'Search batch or student...' : 'Search by name or number'}
                      placeholderTextColor="#94A3B8"
                      style={{
                        flex: 1,
                        fontSize: 13,
                        color: colors.ink,
                        padding: 0,
                      }}
                    />
                  </View>
                </View>

                {/* Section Title */}
                <View style={{ paddingHorizontal: 14, paddingTop: 8, paddingBottom: 3 }}>
                  <Text
                    style={{
                      fontSize: 10.5,
                      fontWeight: '700',
                      color: '#94A3B8',
                      letterSpacing: 0.8,
                      textTransform: 'uppercase',
                    }}
                  >
                    Messages
                  </Text>
                </View>

                {/* Channels List */}
                <View style={{ backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#F1F5F9', flex: 1 }}>
                  {filteredChannels.length === 0 ? (
                    <EmptyState
                      imageSource={require('../../../assets/empty chats.png')}
                      imageSize={160}
                      title="No Chats Found"
                      description="Batch groups and conversations will appear here."
                      style={{ paddingVertical: 48, flex: 1, justifyContent: 'center' }}
                    />
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
                            paddingHorizontal: 14,
                            paddingVertical: 10,
                            borderBottomWidth: 1,
                            borderBottomColor: '#F1F5F9',
                          }}
                        >
                          {/* Channel Avatar */}
                          <View
                            style={{
                              width: 42,
                              height: 42,
                              borderRadius: 21,
                              backgroundColor: isDirect ? '#F1F5F9' : '#E0F2FE',
                              alignItems: 'center',
                              justifyContent: 'center',
                              marginRight: 11,
                              borderWidth: 1,
                              borderColor: isDirect ? '#E2E8F0' : '#BAE6FD',
                            }}
                          >
                            {isDirect ? (
                              <User size={20} color="#334155" strokeWidth={1.8} />
                            ) : (
                              <Users size={20} color="#0284C7" strokeWidth={1.8} />
                            )}
                          </View>

                          {/* Channel Details */}
                          <View style={{ flex: 1, marginRight: 6 }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                              <Text
                                style={{
                                  fontSize: 14,
                                  fontWeight: '600',
                                  color: '#0F172A',
                                  flexShrink: 1,
                                }}
                                numberOfLines={1}
                              >
                                {channel.title}
                              </Text>
                              <Text
                                style={{
                                  fontSize: 11,
                                  color: '#94A3B8',
                                  marginLeft: 6,
                                }}
                              >
                                {formatActivityTime(channel.lastMessageTime || '')}
                              </Text>
                            </View>

                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                              <Text
                                style={{
                                  fontSize: 12.5,
                                  color: channel.unreadCount ? '#0F172A' : '#64748B',
                                  fontWeight: channel.unreadCount ? '600' : '400',
                                  flex: 1,
                                  marginRight: 6,
                                  lineHeight: 16,
                                }}
                                numberOfLines={1}
                              >
                                {channel.lastMessage || 'No messages yet'}
                              </Text>
                              {channel.unreadCount ? (
                                <View
                                  style={{
                                    backgroundColor: '#2563EB',
                                    borderRadius: 9,
                                    minWidth: 18,
                                    height: 18,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    paddingHorizontal: 4,
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
              // Active Conversation Screen (WhatsApp Styled)
              <KeyboardAvoidingView
                style={{ flex: 1, backgroundColor: '#EFEAE2' }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
              >
                {/* Messages List */}
                <ScrollView
                  ref={chatScrollRef}
                  style={{ flex: 1, backgroundColor: '#EFEAE2' }}
                  contentContainerStyle={{ paddingHorizontal: 10, paddingTop: 10, paddingBottom: 16 }}
                  onContentSizeChange={() => chatScrollRef.current?.scrollToEnd({ animated: false })}
                >
                  {/* WhatsApp style encryption banner notice */}
                  <View style={{ alignItems: 'center', marginVertical: 8, paddingHorizontal: 16 }}>
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 6,
                        backgroundColor: '#FFEECD',
                        paddingHorizontal: 10,
                        paddingVertical: 5,
                        borderRadius: 8,
                        maxWidth: '92%',
                      }}
                    >
                      <ShieldCheck size={13} color="#856404" />
                      <Text style={{ fontSize: 10.5, color: '#543B00', textAlign: 'center', flexShrink: 1, lineHeight: 14 }}>
                        Messages are end-to-end encrypted & synced with Dinesh Sir
                      </Text>
                    </View>
                  </View>

                  {/* Messages list - WhatsApp layout */}
                  {(selectedChannel.messages || []).map((msg) => {
                    const isMe = Boolean(
                      msg.isOutgoing ||
                      (me?.user?.id && msg.senderId === me.user.id) ||
                      (isAdminOrTeacher
                        ? (msg.senderRole === 'admin' || msg.senderRole === 'teacher' || msg.senderName?.includes('Dinesh')) &&
                          !msg.senderName?.includes('Namita')
                        : msg.senderRole === 'student' ||
                          msg.senderName?.includes('Arjun') ||
                          msg.senderName?.includes('Aarav'))
                    );

                    return (
                      <View
                        key={msg.id}
                        style={{
                          marginVertical: 3,
                          alignItems: isMe ? 'flex-end' : 'flex-start',
                          paddingLeft: isMe ? 40 : 0,
                          paddingRight: isMe ? 0 : 40,
                        }}
                      >
                        <View
                          style={{
                            maxWidth: '85%',
                            borderRadius: 10,
                            borderTopRightRadius: isMe ? 2 : 10,
                            borderTopLeftRadius: isMe ? 10 : 2,
                            paddingHorizontal: 11,
                            paddingTop: 6,
                            paddingBottom: 6,
                            backgroundColor: isMe ? '#D9FDD3' : '#FFFFFF',
                            borderWidth: isMe ? 0 : 0.5,
                            borderColor: '#E2E8F0',
                            shadowColor: '#0F172A',
                            shadowOffset: { width: 0, height: 1 },
                            shadowOpacity: 0.08,
                            shadowRadius: 1.5,
                            elevation: 1,
                          }}
                        >
                          {/* Incoming message sender name header */}
                          {!isMe && (
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2.5, gap: 5 }}>
                              <Text
                                style={{
                                  fontSize: 11.5,
                                  fontWeight: '700',
                                  color:
                                    msg.senderRole === 'teacher' || msg.senderRole === 'admin'
                                      ? '#0D9488'
                                      : '#D97706',
                                }}
                              >
                                {msg.senderName}
                              </Text>
                              {msg.senderRole === 'teacher' || msg.senderRole === 'admin' ? (
                                <View
                                  style={{
                                    backgroundColor: '#ECFDF5',
                                    paddingHorizontal: 4,
                                    paddingVertical: 1,
                                    borderRadius: 4,
                                    borderWidth: 0.5,
                                    borderColor: '#A7F3D0',
                                  }}
                                >
                                  <Text style={{ fontSize: 8.5, fontWeight: '700', color: '#065F46' }}>
                                    FACULTY
                                  </Text>
                                </View>
                              ) : null}
                            </View>
                          )}

                          <Text
                            style={{
                              fontSize: 14,
                              lineHeight: 19.5,
                              color: '#111B21',
                            }}
                          >
                            {msg.text}
                          </Text>

                          <View
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              justifyContent: 'flex-end',
                              alignSelf: 'flex-end',
                              marginTop: 2.5,
                              gap: 3,
                            }}
                          >
                            <Text
                              style={{
                                fontSize: 10,
                                color: '#667781',
                              }}
                            >
                              {formatBubbleTime(msg.createdAt)}
                            </Text>
                            {isMe && <CheckCheck size={14} color="#53BDEB" />}
                          </View>
                        </View>
                      </View>
                    );
                  })}
                </ScrollView>

                {/* Input Bar - WhatsApp style directly at the bottom with NO footer */}
                <View
                  style={{
                    backgroundColor: '#F0F2F5',
                    borderTopWidth: 1,
                    borderTopColor: '#E2E8F0',
                    paddingHorizontal: 10,
                    paddingTop: 8,
                    paddingBottom: Platform.OS === 'ios' ? Math.max(insets.bottom, 12) : Math.max(insets.bottom, 10),
                    marginBottom: 0,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => Alert.alert('Attach File', 'Attach photos of questions or solutions.')}
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 19,
                      backgroundColor: '#FFFFFF',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderWidth: 1,
                      borderColor: '#E2E8F0',
                    }}
                  >
                    <Paperclip size={18} color="#54656F" />
                  </TouchableOpacity>

                  <TextInput
                    value={chatMessageText}
                    onChangeText={setChatMessageText}
                    placeholder="Message"
                    placeholderTextColor="#667781"
                    multiline
                    style={{
                      flex: 1,
                      backgroundColor: '#FFFFFF',
                      borderWidth: 1,
                      borderColor: '#E2E8F0',
                      borderRadius: 22,
                      paddingHorizontal: 14,
                      paddingVertical: Platform.OS === 'ios' ? 8 : 6,
                      fontSize: 14,
                      maxHeight: 96,
                      color: '#111B21',
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
                      backgroundColor: chatMessageText.trim() ? '#00A884' : '#CBD5E1',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Send size={17} color="#FFFFFF" style={{ marginLeft: 2 }} />
                  </TouchableOpacity>
                </View>
              </KeyboardAvoidingView>
            )}
      </View>
    </Screen>
  );
}

