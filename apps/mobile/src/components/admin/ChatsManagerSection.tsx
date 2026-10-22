import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import {
  MessageSquare,
  Send,
  Users,
  User,
  Bell,
  ArrowLeft,
  Search,
  Plus,
  Radio,
  Clock,
  Sparkles,
  ChevronRight,
  X,
  Phone,
  MessageCircle,
} from 'lucide-react-native';
import { Badge } from '../ui/Badge';
import { EmptyState } from '../ui/EmptyState';
import { Chip } from '../ui/Chip';
import { Image } from 'expo-image';
import { getFacultyAvatarSource } from '../../lib/facultyImages';
import {
  useAdminStore,
  type AdminStore,
  type AdminChatChannelItem,
  type ChatMessageItem,
} from '../../lib/adminDataStore';

export interface ChatsManagerSectionProps {
  store: AdminStore;
  searchQuery?: string;
  setSearchQuery?: (q: string) => void;
  onToast?: (toast: { type: 'success' | 'error' | 'info'; message: string }) => void;
  onNotify?: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export function ChatsManagerSection({
  store,
  searchQuery = '',
  setSearchQuery,
  onToast,
  onNotify,
}: ChatsManagerSectionProps) {
  const notify = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    if (onToast) onToast({ type, message: msg });
    if (onNotify) onNotify(msg, type);
  };
  const chats = store.chats || [];
  const [filterType, setFilterType] = useState<'all' | 'batch_group' | 'direct' | 'announcements'>('all');
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
  const [messageText, setMessageText] = useState('');
  const [broadcastModalVisible, setBroadcastModalVisible] = useState(false);
  const [broadcastText, setBroadcastText] = useState('');
  const [selectedBatchForBroadcast, setSelectedBatchForBroadcast] = useState('All Batches');

  const selectedChannel = chats.find((c: AdminChatChannelItem) => c.id === selectedChannelId);

  const filteredChannels = chats.filter((c: AdminChatChannelItem) => {
    const matchSearch =
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.subtitle && c.subtitle.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (c.lastMessage && c.lastMessage.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchType = filterType === 'all' || c.type === filterType;
    return matchSearch && matchType;
  });

  const handleSendMessage = async () => {
    if (!selectedChannelId || !messageText.trim()) return;
    try {
      await store.sendChatMessage(selectedChannelId, messageText.trim());
      setMessageText('');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      notify('Message sent.', 'success');
    } catch {
      Alert.alert('Error', 'Failed to send message.');
    }
  };

  const handleSendBroadcast = async () => {
    if (!broadcastText.trim()) {
      Alert.alert('Required', 'Please enter a message for broadcast.');
      return;
    }

    try {
      // Find or create announcement channel
      let annChannel = chats.find((c: AdminChatChannelItem) => c.type === 'announcements');
      if (annChannel) {
        await store.sendChatMessage(
          annChannel.id,
          `[BROADCAST - ${selectedBatchForBroadcast}]: ${broadcastText.trim()}`
        );
      }
      // Also post as announcement notice
      await store.createAnnouncement({
        title: `Announcement: ${selectedBatchForBroadcast}`,
        body: broadcastText.trim(),
        priority: 'urgent',
        targetAudience: selectedBatchForBroadcast,
        authorName: 'Dinesh Singh Rajput (Administrator)',
      });

      setBroadcastText('');
      setBroadcastModalVisible(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      notify('Broadcast published to all students.', 'success');
    } catch {
      Alert.alert('Error', 'Failed to send broadcast.');
    }
  };

  const formatTime = (isoString?: string) => {
    if (!isoString) return '';
    const d = new Date(isoString);
    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  // If a channel is selected, show the conversation view
  if (selectedChannel) {
    return (
      <View
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 16,
          borderWidth: 1,
          borderColor: '#E2E8F0',
          minHeight: 480,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Channel Header */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: 14,
            borderBottomWidth: 1,
            borderBottomColor: '#F1F5F9',
            backgroundColor: '#F8FAFC',
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
            <TouchableOpacity
              onPress={() => setSelectedChannelId(null)}
              style={{
                padding: 6,
                borderRadius: 8,
                backgroundColor: '#FFFFFF',
                borderWidth: 1,
                borderColor: '#E2E8F0',
              }}
            >
              <ArrowLeft size={16} color="#2563EB" />
            </TouchableOpacity>

            {(() => {
              const avatar = getFacultyAvatarSource(selectedChannel.facultyName || selectedChannel.title);
              return avatar ? (
                <Image
                  source={avatar}
                  style={{ width: 34, height: 34, borderRadius: 10, borderWidth: 1, borderColor: '#BFDBFE' }}
                  contentFit="cover"
                />
              ) : null;
            })()}

            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14.5, fontWeight: '800', color: '#0F172A' }} numberOfLines={1}>
                {selectedChannel.title}
              </Text>
              <Text style={{ fontSize: 11, color: '#64748B' }} numberOfLines={1}>
                {selectedChannel.subtitle || (selectedChannel.type === 'batch_group' ? 'Batch Group Chat' : 'Direct Message')}
              </Text>
            </View>
          </View>

          <Badge
            label={selectedChannel.type.toUpperCase().replace('_', ' ')}
            variant={selectedChannel.type === 'announcements' ? 'danger' : 'primary'}
            size="sm"
          />
        </View>

        {/* Messages List */}
        <ScrollView
          style={{ flex: 1, padding: 14 }}
          contentContainerStyle={{ gap: 12, paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
        >
          {selectedChannel.messages.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 40, gap: 6 }}>
              <MessageSquare size={32} color="#94A3B8" />
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#64748B' }}>
                No messages yet in this channel
              </Text>
              <Text style={{ fontSize: 11.5, color: '#94A3B8' }}>
                Send a message below to start the conversation with students.
              </Text>
            </View>
          ) : (
            selectedChannel.messages.map((m: ChatMessageItem) => {
              const isAdminMsg = m.senderRole === 'admin' || m.senderRole === 'teacher';
              return (
                <View
                  key={m.id}
                  style={{
                    alignSelf: isAdminMsg ? 'flex-end' : 'flex-start',
                    maxWidth: '82%',
                    gap: 3,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: isAdminMsg ? 'flex-end' : 'flex-start' }}>
                    {getFacultyAvatarSource(m.senderName) ? (
                      <Image
                        source={getFacultyAvatarSource(m.senderName)!}
                        style={{ width: 14, height: 14, borderRadius: 7 }}
                        contentFit="cover"
                      />
                    ) : null}
                    <Text style={{ fontSize: 10.5, fontWeight: '700', color: '#64748B' }}>
                      {m.senderName}
                    </Text>
                    <Text style={{ fontSize: 9.5, color: '#94A3B8' }}>
                      {formatTime(m.createdAt)}
                    </Text>
                  </View>

                  <View
                    style={{
                      paddingHorizontal: 13,
                      paddingVertical: 9,
                      borderRadius: 14,
                      backgroundColor: isAdminMsg ? '#2563EB' : '#F1F5F9',
                      borderBottomRightRadius: isAdminMsg ? 2 : 14,
                      borderBottomLeftRadius: !isAdminMsg ? 2 : 14,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 13,
                        lineHeight: 18,
                        color: isAdminMsg ? '#FFFFFF' : '#0F172A',
                      }}
                    >
                      {m.text}
                    </Text>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>

        {/* Message Input Composer */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            padding: 10,
            borderTopWidth: 1,
            borderTopColor: '#F1F5F9',
            backgroundColor: '#FFFFFF',
            gap: 8,
          }}
        >
          <TextInput
            value={messageText}
            onChangeText={setMessageText}
            placeholder="Type message to students..."
            placeholderTextColor="#94A3B8"
            style={{
              flex: 1,
              backgroundColor: '#F8FAFC',
              borderWidth: 1,
              borderColor: '#E2E8F0',
              borderRadius: 20,
              paddingHorizontal: 14,
              paddingVertical: 8,
              fontSize: 13,
              color: '#0F172A',
              maxHeight: 90,
            }}
          />
          <TouchableOpacity
            onPress={handleSendMessage}
            disabled={!messageText.trim()}
            style={{
              width: 38,
              height: 38,
              borderRadius: 19,
              backgroundColor: messageText.trim() ? '#2563EB' : '#94A3B8',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Send size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Channel List View
  return (
    <View style={{ gap: 14 }}>
      {/* Top Banner & Broadcast Action */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#FFFFFF',
          padding: 12,
          borderRadius: 14,
          borderWidth: 1,
          borderColor: '#E2E8F0',
          gap: 10,
        }}
      >
        <View style={{ flex: 1, minWidth: 0 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
            <View
              style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                backgroundColor: '#EFF6FF',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <MessageSquare size={15} color="#2563EB" />
            </View>
            <Text
              style={{ fontSize: 13.5, fontWeight: '800', color: '#0F172A', flexShrink: 1 }}
              numberOfLines={1}
            >
              Institute Chats
            </Text>
          </View>
          <Text
            style={{ fontSize: 11, color: '#64748B', marginTop: 2, marginLeft: 35 }}
            numberOfLines={1}
          >
            Batch groups & student messaging
          </Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setBroadcastModalVisible(true)}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
            backgroundColor: '#2563EB',
            paddingHorizontal: 11,
            paddingVertical: 7.5,
            borderRadius: 10,
            flexShrink: 0,
            shadowColor: '#2563EB',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.18,
            shadowRadius: 3,
            elevation: 2,
          }}
        >
          <Bell size={14} color="#FFFFFF" />
          <Text style={{ fontSize: 11.5, fontWeight: '800', color: '#FFFFFF' }}>Broadcast</Text>
        </TouchableOpacity>
      </View>

      {/* Search & Channel Type Filter */}
      <View style={{ gap: 10 }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: '#FFFFFF',
            borderRadius: 12,
            paddingHorizontal: 12,
            borderWidth: 1,
            borderColor: '#E2E8F0',
            height: 42,
          }}
        >
          <Search size={16} color="#94A3B8" />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search chat channels or messages..."
            placeholderTextColor="#94A3B8"
            style={{ flex: 1, marginLeft: 8, fontSize: 13, color: '#0F172A' }}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery?.('')}>
              <X size={14} color="#94A3B8" />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Filter Pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
          {[
            { id: 'all', label: `All (${chats.length})` },
            { id: 'batch_group', label: 'Batch Groups' },
            { id: 'direct', label: 'Direct Messages' },
            { id: 'announcements', label: 'Announcements' },
          ].map((tab) => (
            <Chip
              key={tab.id}
              label={tab.label}
              selected={filterType === tab.id}
              onPress={() => setFilterType(tab.id as any)}
            />
          ))}
        </ScrollView>
      </View>

      {/* Channels List */}
      {filteredChannels.length === 0 ? (
        <EmptyState
          title="No Chat Channels"
          description="Create a broadcast or wait for students to send questions."
          actionLabel="Send Broadcast"
          onAction={() => setBroadcastModalVisible(true)}
        />
      ) : (
        <View style={{ gap: 8 }}>
          {filteredChannels.map((c: AdminChatChannelItem) => {
            const isAnnounce = c.type === 'announcements';
            const isDirect = c.type === 'direct';

            return (
              <TouchableOpacity
                key={c.id}
                activeOpacity={0.75}
                onPress={() => setSelectedChannelId(c.id)}
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: 14,
                  padding: 14,
                  borderWidth: 1,
                  borderColor: '#E2E8F0',
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  elevation: 1,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.03,
                  shadowRadius: 2,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1, marginRight: 8 }}>
                  {(() => {
                    const facultyAvatar = getFacultyAvatarSource(c.facultyName || c.title);
                    if (facultyAvatar) {
                      return (
                        <Image
                          source={facultyAvatar}
                          style={{
                            width: 44,
                            height: 44,
                            borderRadius: 12,
                            borderWidth: 1,
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
                          borderRadius: 12,
                          backgroundColor: isAnnounce ? '#FEF2F2' : isDirect ? '#F0FDF4' : '#EFF6FF',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {isAnnounce ? (
                          <Bell size={20} color="#DC2626" />
                        ) : isDirect ? (
                          <User size={20} color="#16A34A" />
                        ) : (
                          <Users size={20} color="#2563EB" />
                        )}
                      </View>
                    );
                  })()}

                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                      <Text style={{ fontSize: 14, fontWeight: '800', color: '#0F172A', flex: 1, marginRight: 6 }} numberOfLines={1}>
                        {c.title}
                      </Text>
                      {c.lastMessageTime && (
                        <Text style={{ fontSize: 10.5, color: '#94A3B8', flexShrink: 0 }}>
                          {formatTime(c.lastMessageTime)}
                        </Text>
                      )}
                    </View>

                    <Text style={{ fontSize: 11.5, color: '#64748B', marginTop: 2 }} numberOfLines={1}>
                      {c.subtitle || (isDirect ? 'Direct Student Chat' : 'Batch Discussion Group')}
                    </Text>

                    {c.lastMessage && (
                      <Text style={{ fontSize: 12, color: '#334155', marginTop: 4, fontWeight: '500' }} numberOfLines={1}>
                        {c.lastMessage}
                      </Text>
                    )}
                  </View>
                </View>

                <ChevronRight size={16} color="#94A3B8" style={{ flexShrink: 0 }} />
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* Broadcast Message Modal */}
      <Modal visible={broadcastModalVisible} animationType="slide" transparent onRequestClose={() => setBroadcastModalVisible(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}
        >
          <View
            style={{
              backgroundColor: '#FFFFFF',
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              padding: 20,
              gap: 16,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View>
                <Text style={{ fontSize: 17, fontWeight: '800', color: '#0F172A' }}>
                  Send Institute Broadcast
                </Text>
                <Text style={{ fontSize: 12, color: '#64748B' }}>
                  Sends message to all students and posts on Notice Board
                </Text>
              </View>
              <TouchableOpacity onPress={() => setBroadcastModalVisible(false)} style={{ padding: 6 }}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={{ gap: 8 }}>
              <Text style={{ fontSize: 12.5, fontWeight: '700', color: '#334155' }}>Target Audience</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                {['All Batches', ...store.batches.map((b) => b.title)].map((aud: string) => {
                  const isSel = selectedBatchForBroadcast === aud;
                  return (
                    <TouchableOpacity
                      key={aud}
                      onPress={() => setSelectedBatchForBroadcast(aud)}
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 7,
                        borderRadius: 8,
                        backgroundColor: isSel ? '#2563EB' : '#F1F5F9',
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 11.5,
                          fontWeight: '700',
                          color: isSel ? '#FFFFFF' : '#475569',
                        }}
                      >
                        {aud}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            <View style={{ gap: 4 }}>
              <Text style={{ fontSize: 12.5, fontWeight: '700', color: '#334155' }}>Broadcast Message *</Text>
              <TextInput
                value={broadcastText}
                onChangeText={setBroadcastText}
                placeholder="Type notice message (e.g. Schedule change, test alert, holiday)..."
                placeholderTextColor="#94A3B8"
                multiline
                numberOfLines={4}
                style={{
                  backgroundColor: '#F8FAFC',
                  borderWidth: 1,
                  borderColor: '#E2E8F0',
                  borderRadius: 12,
                  padding: 12,
                  fontSize: 13,
                  color: '#0F172A',
                  minHeight: 90,
                  textAlignVertical: 'top',
                }}
              />
            </View>

            <TouchableOpacity
              onPress={handleSendBroadcast}
              style={{
                backgroundColor: '#2563EB',
                paddingVertical: 13,
                borderRadius: 12,
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              <Send size={15} color="#FFFFFF" />
              <Text style={{ fontSize: 14, fontWeight: '800', color: '#FFFFFF' }}>Send Broadcast</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
