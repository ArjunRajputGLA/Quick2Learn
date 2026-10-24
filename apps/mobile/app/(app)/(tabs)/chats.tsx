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
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
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
  X,
  UserPlus,
  GraduationCap,
  Phone,
  MessageSquare,
  Sparkle,
  BookOpen,
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

interface EnrolledStudentOption {
  id: string;
  name: string;
  phone?: string;
  batchName: string;
  classLevel?: number;
  school?: string;
  avatarColor?: string;
}

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

  // New Chat Modal state
  const [isNewChatModalVisible, setIsNewChatModalVisible] = useState(false);
  const [modalTab, setModalTab] = useState<'students' | 'batches' | 'custom'>('students');
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('All');

  // Custom student inputs
  const [customStudentName, setCustomStudentName] = useState('');
  const [customStudentBatch, setCustomStudentBatch] = useState('');
  const [customStudentPhone, setCustomStudentPhone] = useState('');
  const [customStudentInitialMessage, setCustomStudentInitialMessage] = useState('');

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

  // Enrolled students aggregated from admin store, approved join requests, and default cohort
  const enrolledStudents = useMemo<EnrolledStudentOption[]>(() => {
    const list: EnrolledStudentOption[] = [];
    const seenIds = new Set<string>();
    const seenNames = new Set<string>();

    const addStudent = (item: EnrolledStudentOption) => {
      const lowerName = item.name.trim().toLowerCase();
      if (!lowerName || seenIds.has(item.id) || seenNames.has(lowerName)) return;
      seenIds.add(item.id);
      seenNames.add(lowerName);
      list.push(item);
    };

    // 1. From adminStore.students
    (adminStore.students || []).forEach((s) => {
      addStudent({
        id: s.id,
        name: s.fullName,
        phone: s.phone,
        batchName: (s.enrolledBatchNames && s.enrolledBatchNames[0]) || `Class ${s.classLevel} Batch`,
        classLevel: s.classLevel,
        school: s.school,
        avatarColor: '#2563EB',
      });
    });

    // 2. From adminStore.joinRequests (approved)
    (adminStore.joinRequests || [])
      .filter((r) => r.status === 'approved')
      .forEach((r) => {
        addStudent({
          id: r.studentId || `req-${r.id}`,
          name: r.studentName,
          phone: r.studentPhone,
          batchName: r.batchTitle || `Class ${r.classLevel} Batch`,
          classLevel: r.classLevel,
          avatarColor: '#059669',
        });
      });

    return list;
  }, [adminStore.students, adminStore.joinRequests]);

  // Filtered enrolled students for the modal
  const filteredEnrolledStudents = useMemo(() => {
    let result = enrolledStudents;
    if (selectedClassFilter !== 'All') {
      const classNum = parseInt(selectedClassFilter.replace(/\D/g, ''), 10);
      result = result.filter(
        (s) =>
          (classNum && s.classLevel === classNum) ||
          s.batchName.toLowerCase().includes(selectedClassFilter.toLowerCase())
      );
    }
    if (studentSearchQuery.trim()) {
      const q = studentSearchQuery.trim().toLowerCase();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.batchName.toLowerCase().includes(q) ||
          (s.phone && s.phone.toLowerCase().includes(q)) ||
          (s.school && s.school.toLowerCase().includes(q))
      );
    }
    return result;
  }, [enrolledStudents, selectedClassFilter, studentSearchQuery]);

  // Available batches from database
  const availableBatches = useMemo(() => {
    return adminStore.batches || [];
  }, [adminStore.batches]);

  const filteredBatches = useMemo(() => {
    if (!studentSearchQuery.trim()) return availableBatches;
    const q = studentSearchQuery.trim().toLowerCase();
    return availableBatches.filter(
      (b: any) =>
        b.title.toLowerCase().includes(q) ||
        (b.subject && b.subject.toLowerCase().includes(q))
    );
  }, [availableBatches, studentSearchQuery]);

  // Start chat with an individual enrolled student
  const handleStartStudentChat = async (student: EnrolledStudentOption) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}

    const existing = (adminStore.chats || []).find(
      (c) =>
        c.type === 'direct' &&
        (c.studentId === student.id ||
          (c.studentName && c.studentName.toLowerCase() === student.name.toLowerCase()) ||
          c.title.toLowerCase() === student.name.toLowerCase())
    );

    if (existing) {
      setIsNewChatModalVisible(false);
      setSelectedChannelId(existing.id);
      return;
    }

    const facultyName =
      me?.profile?.fullName ||
      me?.user?.name ||
      (isAdminOrTeacher ? 'Dinesh Singh Rajput (Faculty)' : 'Quick2Learn Faculty');

    const newChannel = await adminStore.createChatChannel({
      type: 'direct',
      title: student.name,
      subtitle: student.batchName || (student.classLevel ? `Class ${student.classLevel} Student` : 'Enrolled Student'),
      studentId: student.id,
      studentName: student.name,
      facultyName,
      lastMessage: 'Conversation started',
      lastMessageTime: new Date().toISOString(),
    });

    setIsNewChatModalVisible(false);
    setSelectedChannelId(newChannel.id);
  };

  // Start / open chat for a batch group
  const handleStartBatchChat = async (batch: any) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}

    const existing = (adminStore.chats || []).find(
      (c) =>
        c.type === 'batch_group' &&
        (c.batchId === batch.id || c.title.toLowerCase() === batch.title.toLowerCase())
    );

    if (existing) {
      setIsNewChatModalVisible(false);
      setSelectedChannelId(existing.id);
      return;
    }

    const facultyName =
      me?.profile?.fullName ||
      me?.user?.name ||
      (isAdminOrTeacher ? 'Dinesh Singh Rajput (Faculty)' : 'Quick2Learn Faculty');

    const newChannel = await adminStore.createChatChannel({
      type: 'batch_group',
      title: batch.title,
      subtitle: `${batch.enrolledCount || 20} Enrolled Students • ${batch.subject || 'All Subjects'}`,
      batchId: batch.id,
      facultyName,
      lastMessage: 'Batch discussion group opened',
      lastMessageTime: new Date().toISOString(),
    });

    setIsNewChatModalVisible(false);
    setSelectedChannelId(newChannel.id);
  };

  // Create custom student direct chat
  const handleCreateCustomStudentChat = async () => {
    if (!customStudentName.trim()) {
      Alert.alert('Student Name Required', 'Please enter the enrolled student\'s full name.');
      return;
    }

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}

    const name = customStudentName.trim();
    const batch = customStudentBatch.trim() || 'Class 10 CBSE - Mathematics';
    const phone = customStudentPhone.trim();
    const firstMsg = customStudentInitialMessage.trim();

    const existing = (adminStore.chats || []).find(
      (c) =>
        c.type === 'direct' &&
        (c.title.toLowerCase() === name.toLowerCase() ||
          (c.studentName && c.studentName.toLowerCase() === name.toLowerCase()))
    );

    let channelId = existing?.id;

    if (!channelId) {
      const facultyName =
        me?.profile?.fullName ||
        me?.user?.name ||
        (isAdminOrTeacher ? 'Dinesh Singh Rajput (Faculty)' : 'Quick2Learn Faculty');
      const newChannel = await adminStore.createChatChannel({
        type: 'direct',
        title: name,
        subtitle: `${batch}${phone ? ` • ${phone}` : ''}`,
        studentId: `student-${Date.now()}`,
        studentName: name,
        facultyName,
        lastMessage: firstMsg || 'Conversation started',
        lastMessageTime: new Date().toISOString(),
      });
      channelId = newChannel.id;
    }

    if (firstMsg && channelId) {
      const senderName =
        me?.profile?.fullName ||
        me?.user?.name ||
        (isAdminOrTeacher ? 'Dinesh Singh Rajput' : 'Quick2Learn Faculty');
      await adminStore.sendChatMessage(
        channelId,
        firstMsg,
        isAdminOrTeacher ? 'teacher' : 'student',
        senderName,
        undefined,
        true
      );
    }

    setCustomStudentName('');
    setCustomStudentBatch('');
    setCustomStudentPhone('');
    setCustomStudentInitialMessage('');
    setIsNewChatModalVisible(false);
    setSelectedChannelId(channelId);
  };

  const handleSendMessage = async () => {
    if (!chatMessageText.trim() || !selectedChannelId) return;
    const text = chatMessageText.trim();
    setChatMessageText('');
    const senderName =
      me?.profile?.fullName ||
      me?.user?.name ||
      (isAdminOrTeacher ? 'Dinesh Singh Rajput' : 'Student');
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
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <TouchableOpacity
                  activeOpacity={0.75}
                  onPress={() => setIsNewChatModalVisible(true)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: '#2563EB',
                    paddingHorizontal: 9,
                    paddingVertical: 4.5,
                    borderRadius: radii.full,
                    shadowColor: '#2563EB',
                    shadowOffset: { width: 0, height: 1.5 },
                    shadowOpacity: 0.25,
                    shadowRadius: 3,
                    elevation: 2,
                  }}
                >
                  <Plus size={12} color="#FFFFFF" strokeWidth={2.5} />
                  <Text style={{ fontSize: 10.5, fontWeight: '700', color: '#FFFFFF', marginLeft: 3 }}>
                    New Chat
                  </Text>
                </TouchableOpacity>

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
                  <MessageCircle size={12} color="#059669" />
                  <Text style={{ fontSize: 10, fontWeight: '700', color: '#065F46', marginLeft: 3 }}>
                    WhatsApp
                  </Text>
                </TouchableOpacity>
              </View>
            )
          }
        />
      }
    >
      <View style={{ flex: 1, backgroundColor: colors['surface-subtle'] }}>
        {!selectedChannel ? (
          // Channels List View (Matching 5.jpeg)
          <View style={{ flex: 1 }}>
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
                  {chatSearch ? (
                    <TouchableOpacity onPress={() => setChatSearch('')}>
                      <X size={14} color="#94A3B8" />
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>

              {/* Section Title with New Chat Quick Button */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingHorizontal: 14,
                  paddingTop: 8,
                  paddingBottom: 4,
                }}
              >
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
                <TouchableOpacity
                  onPress={() => setIsNewChatModalVisible(true)}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}
                >
                  <Plus size={12} color="#2563EB" strokeWidth={2.5} />
                  <Text style={{ fontSize: 11, fontWeight: '700', color: '#2563EB' }}>
                    Start Chat
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Channels List */}
              <View style={{ backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#F1F5F9', flex: 1 }}>
                {filteredChannels.length === 0 ? (
                  <View style={{ flex: 1 }}>
                    <EmptyState
                      imageSource={require('../../../assets/empty chats.png')}
                      imageSize={160}
                      title="No Chats Found"
                      description="Batch groups and conversations will appear here."
                      actionLabel="Start Chat with Student"
                      onAction={() => setIsNewChatModalVisible(true)}
                      style={{ paddingVertical: 36, flex: 1, justifyContent: 'center' }}
                    />

                    {/* Quick Start Suggestions with Enrolled Students (only if students exist in DB) */}
                    {enrolledStudents.length > 0 && (
                      <View style={{ paddingHorizontal: 16, paddingBottom: 24 }}>
                        <Text
                          style={{
                            fontSize: 11,
                            fontWeight: '700',
                            color: '#64748B',
                            textTransform: 'uppercase',
                            letterSpacing: 0.6,
                            marginBottom: 10,
                          }}
                        >
                          Start With Enrolled Students
                        </Text>
                        <View style={{ gap: 8 }}>
                          {enrolledStudents.slice(0, 3).map((student) => (
                            <TouchableOpacity
                              key={student.id}
                              activeOpacity={0.7}
                              onPress={() => handleStartStudentChat(student)}
                              style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                backgroundColor: '#F8FAFC',
                                borderRadius: 12,
                                padding: 10,
                                borderWidth: 1,
                                borderColor: '#E2E8F0',
                              }}
                            >
                              <View
                                style={{
                                  width: 38,
                                  height: 38,
                                  borderRadius: 19,
                                  backgroundColor: student.avatarColor || '#2563EB',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  marginRight: 10,
                                }}
                              >
                                <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 13 }}>
                                  {student.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                                </Text>
                              </View>
                              <View style={{ flex: 1 }}>
                                <Text style={{ fontSize: 13.5, fontWeight: '600', color: '#0F172A' }}>
                                  {student.name}
                                </Text>
                                <Text style={{ fontSize: 11, color: '#64748B' }} numberOfLines={1}>
                                  {student.batchName}
                                </Text>
                              </View>
                              <View
                                style={{
                                  flexDirection: 'row',
                                  alignItems: 'center',
                                  backgroundColor: '#EFF6FF',
                                  paddingHorizontal: 9,
                                  paddingVertical: 4.5,
                                  borderRadius: 6,
                                  borderWidth: 1,
                                  borderColor: '#BFDBFE',
                                  gap: 4,
                                }}
                              >
                                <MessageSquare size={11} color="#2563EB" />
                                <Text style={{ fontSize: 11, fontWeight: '700', color: '#2563EB' }}>
                                  Message
                                </Text>
                              </View>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>
                    )}
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

            {/* Floating Action Button for New Chat */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setIsNewChatModalVisible(true)}
              style={{
                position: 'absolute',
                bottom: 20,
                right: 16,
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: '#2563EB',
                paddingVertical: 12,
                paddingHorizontal: 16,
                borderRadius: 28,
                shadowColor: '#1E40AF',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 6,
                elevation: 6,
                gap: 8,
              }}
            >
              <UserPlus size={18} color="#FFFFFF" strokeWidth={2.3} />
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#FFFFFF', letterSpacing: 0.2 }}>
                Start Chat
              </Text>
            </TouchableOpacity>
          </View>
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

              {/* Friendly Welcome Banner when chat has no messages yet */}
              {(selectedChannel.messages || []).length === 0 && (
                <View style={{ alignItems: 'center', marginVertical: 32, paddingHorizontal: 24 }}>
                  <View
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: 28,
                      backgroundColor: '#FFFFFF',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 12,
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.08,
                      shadowRadius: 4,
                      elevation: 2,
                    }}
                  >
                    <MessageCircle size={28} color="#2563EB" />
                  </View>
                  <Text style={{ fontSize: 15, fontWeight: '700', color: '#0F172A', textAlign: 'center' }}>
                    Start chat with {selectedChannel.studentName || selectedChannel.title}
                  </Text>
                  <Text style={{ fontSize: 12, color: '#64748B', textAlign: 'center', marginTop: 4, lineHeight: 16 }}>
                    Send questions, doubts, assignments, or batch notices. Type your message below.
                  </Text>
                </View>
              )}

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
                          marginTop: 2,
                          gap: 3,
                        }}
                      >
                        <Text style={{ fontSize: 10, color: '#667781' }}>
                          {formatBubbleTime(msg.createdAt)}
                        </Text>
                        {isMe && (
                          <CheckCheck size={14} color="#53BDEB" strokeWidth={2.2} />
                        )}
                      </View>
                    </View>
                  </View>
                );
              })}
            </ScrollView>

            {/* Message Input Bar (WhatsApp Styled) */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: '#F0F2F5',
                paddingHorizontal: 8,
                paddingVertical: 6,
                paddingBottom: Math.max(insets.bottom, 8),
                gap: 6,
              }}
            >
              <TouchableOpacity
                onPress={() => Alert.alert('Attachment', 'Attach notes, assignments, or PDF.')}
                activeOpacity={0.7}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  alignItems: 'center',
                  justifyContent: 'center',
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

      {/* Start Chat with Enrolled Student Modal */}
      <Modal
        visible={isNewChatModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setIsNewChatModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{
            flex: 1,
            backgroundColor: 'rgba(15, 23, 42, 0.55)',
            justifyContent: 'flex-end',
          }}
        >
          <View
            style={{
              backgroundColor: '#FFFFFF',
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              maxHeight: '90%',
              paddingBottom: Math.max(insets.bottom, 16),
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -4 },
              shadowOpacity: 0.15,
              shadowRadius: 12,
              elevation: 12,
            }}
          >
            {/* Drag Handle */}
            <View
              style={{
                width: 40,
                height: 4,
                borderRadius: 2,
                backgroundColor: '#CBD5E1',
                alignSelf: 'center',
                marginTop: 10,
                marginBottom: 6,
              }}
            />

            {/* Modal Header */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingHorizontal: 16,
                paddingVertical: 10,
                borderBottomWidth: 1,
                borderBottomColor: '#F1F5F9',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: '#EFF6FF',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 1,
                    borderColor: '#BFDBFE',
                  }}
                >
                  <UserPlus size={20} color="#2563EB" />
                </View>
                <View>
                  <Text style={{ fontSize: 16, fontWeight: '700', color: '#0F172A' }}>
                    Start Chat
                  </Text>
                  <Text style={{ fontSize: 12, color: '#64748B' }}>
                    Message enrolled students or batch groups
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={() => setIsNewChatModalVisible(false)}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: '#F1F5F9',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={16} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Tab Switcher: Enrolled Students | Batch Groups | Custom Entry */}
            <View style={{ flexDirection: 'row', paddingHorizontal: 16, paddingTop: 12, gap: 8 }}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setModalTab('students')}
                style={{
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 5,
                  paddingVertical: 8,
                  borderRadius: 10,
                  backgroundColor: modalTab === 'students' ? '#2563EB' : '#F1F5F9',
                }}
              >
                <User size={13} color={modalTab === 'students' ? '#FFFFFF' : '#64748B'} />
                <Text
                  style={{
                    fontSize: 12.5,
                    fontWeight: '700',
                    color: modalTab === 'students' ? '#FFFFFF' : '#64748B',
                  }}
                >
                  Students ({filteredEnrolledStudents.length})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setModalTab('batches')}
                style={{
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 5,
                  paddingVertical: 8,
                  borderRadius: 10,
                  backgroundColor: modalTab === 'batches' ? '#2563EB' : '#F1F5F9',
                }}
              >
                <Users size={13} color={modalTab === 'batches' ? '#FFFFFF' : '#64748B'} />
                <Text
                  style={{
                    fontSize: 12.5,
                    fontWeight: '700',
                    color: modalTab === 'batches' ? '#FFFFFF' : '#64748B',
                  }}
                >
                  Batches ({availableBatches.length})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setModalTab('custom')}
                style={{
                  paddingHorizontal: 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 4,
                  paddingVertical: 8,
                  borderRadius: 10,
                  backgroundColor: modalTab === 'custom' ? '#2563EB' : '#F1F5F9',
                }}
              >
                <Plus size={13} color={modalTab === 'custom' ? '#FFFFFF' : '#64748B'} />
                <Text
                  style={{
                    fontSize: 12.5,
                    fontWeight: '700',
                    color: modalTab === 'custom' ? '#FFFFFF' : '#64748B',
                  }}
                >
                  Custom
                </Text>
              </TouchableOpacity>
            </View>

            {/* TAB 1: ENROLLED STUDENTS LIST */}
            {modalTab === 'students' && (
              <View style={{ flexShrink: 1 }}>
                {/* Search & Class Filter */}
                <View style={{ paddingHorizontal: 16, paddingTop: 10, gap: 8 }}>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: '#F8FAFC',
                      borderRadius: 10,
                      paddingHorizontal: 10,
                      paddingVertical: Platform.OS === 'ios' ? 7 : 5,
                      borderWidth: 1,
                      borderColor: '#E2E8F0',
                    }}
                  >
                    <Search size={14} color="#94A3B8" style={{ marginRight: 8 }} />
                    <TextInput
                      value={studentSearchQuery}
                      onChangeText={setStudentSearchQuery}
                      placeholder="Search student by name, batch, phone..."
                      placeholderTextColor="#94A3B8"
                      style={{ flex: 1, fontSize: 13, color: '#0F172A', padding: 0 }}
                    />
                    {studentSearchQuery ? (
                      <TouchableOpacity onPress={() => setStudentSearchQuery('')}>
                        <X size={14} color="#94A3B8" />
                      </TouchableOpacity>
                    ) : null}
                  </View>

                  {/* Class Filter Chips */}
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                    {['All', 'Class 9', 'Class 10', 'Class 11', 'Class 12'].map((cls) => (
                      <Chip
                        key={cls}
                        label={cls}
                        selected={selectedClassFilter === cls}
                        onPress={() => setSelectedClassFilter(cls)}
                      />
                    ))}
                  </ScrollView>
                </View>

                {/* Students Scroll List */}
                <ScrollView
                  style={{ maxHeight: 380, marginTop: 8 }}
                  contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16, gap: 8 }}
                >
                  {filteredEnrolledStudents.length === 0 ? (
                    <View style={{ alignItems: 'center', paddingVertical: 32 }}>
                      <User size={32} color="#94A3B8" style={{ marginBottom: 8 }} />
                      <Text style={{ fontSize: 13, fontWeight: '600', color: '#64748B' }}>
                        {studentSearchQuery.trim()
                          ? 'No enrolled students found matching search.'
                          : 'No enrolled students in database yet.'}
                      </Text>
                      <Text style={{ fontSize: 11.5, color: '#94A3B8', marginTop: 4, textAlign: 'center', paddingHorizontal: 20 }}>
                        Admitted students will appear here automatically.
                      </Text>
                      <TouchableOpacity
                        onPress={() => setModalTab('custom')}
                        style={{ marginTop: 12, backgroundColor: '#EFF6FF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 }}
                      >
                        <Text style={{ fontSize: 12.5, fontWeight: '700', color: '#2563EB' }}>
                          + Enter student name directly
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    filteredEnrolledStudents.map((student) => {
                      const existing = (adminStore.chats || []).find(
                        (c) =>
                          c.type === 'direct' &&
                          (c.studentId === student.id ||
                            (c.studentName && c.studentName.toLowerCase() === student.name.toLowerCase()) ||
                            c.title.toLowerCase() === student.name.toLowerCase())
                      );

                      return (
                        <TouchableOpacity
                          key={student.id}
                          activeOpacity={0.75}
                          onPress={() => handleStartStudentChat(student)}
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            backgroundColor: '#FFFFFF',
                            borderRadius: 14,
                            padding: 12,
                            borderWidth: 1,
                            borderColor: existing ? '#BFDBFE' : '#E2E8F0',
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 1 },
                            shadowOpacity: 0.04,
                            shadowRadius: 2,
                            elevation: 1,
                          }}
                        >
                          {/* Student Initials Avatar */}
                          <View
                            style={{
                              width: 44,
                              height: 44,
                              borderRadius: 22,
                              backgroundColor: student.avatarColor || '#2563EB',
                              alignItems: 'center',
                              justifyContent: 'center',
                              marginRight: 12,
                            }}
                          >
                            <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 15 }}>
                              {student.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                            </Text>
                          </View>

                          {/* Student Info */}
                          <View style={{ flex: 1, marginRight: 8 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                              <Text
                                style={{ fontSize: 14, fontWeight: '700', color: '#0F172A', flexShrink: 1 }}
                                numberOfLines={1}
                              >
                                {student.name}
                              </Text>
                              {student.classLevel ? (
                                <View
                                  style={{
                                    backgroundColor: '#EFF6FF',
                                    paddingHorizontal: 5,
                                    paddingVertical: 1,
                                    borderRadius: 4,
                                  }}
                                >
                                  <Text style={{ fontSize: 10, fontWeight: '700', color: '#2563EB' }}>
                                    Class {student.classLevel}
                                  </Text>
                                </View>
                              ) : null}
                            </View>

                            <Text
                              style={{ fontSize: 12, color: '#475569', marginBottom: 2 }}
                              numberOfLines={1}
                            >
                              {student.batchName}
                            </Text>

                            {student.phone ? (
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                <Phone size={10} color="#94A3B8" />
                                <Text style={{ fontSize: 11, color: '#94A3B8' }}>
                                  {student.phone}
                                </Text>
                              </View>
                            ) : null}
                          </View>

                          {/* Action indicator */}
                          <View
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              paddingHorizontal: 9,
                              paddingVertical: 5,
                              borderRadius: 8,
                              backgroundColor: existing ? '#EFF6FF' : '#2563EB',
                              borderWidth: existing ? 1 : 0,
                              borderColor: '#BFDBFE',
                              gap: 4,
                            }}
                          >
                            <MessageSquare size={12} color={existing ? '#2563EB' : '#FFFFFF'} />
                            <Text
                              style={{
                                fontSize: 11.5,
                                fontWeight: '700',
                                color: existing ? '#2563EB' : '#FFFFFF',
                              }}
                            >
                              {existing ? 'Open' : 'Chat'}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })
                  )}
                </ScrollView>
              </View>
            )}

            {/* TAB 2: BATCH GROUPS */}
            {modalTab === 'batches' && (
              <View style={{ flexShrink: 1 }}>
                <View style={{ paddingHorizontal: 16, paddingTop: 10 }}>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: '#F8FAFC',
                      borderRadius: 10,
                      paddingHorizontal: 10,
                      paddingVertical: Platform.OS === 'ios' ? 7 : 5,
                      borderWidth: 1,
                      borderColor: '#E2E8F0',
                    }}
                  >
                    <Search size={14} color="#94A3B8" style={{ marginRight: 8 }} />
                    <TextInput
                      value={studentSearchQuery}
                      onChangeText={setStudentSearchQuery}
                      placeholder="Search batch name or subject..."
                      placeholderTextColor="#94A3B8"
                      style={{ flex: 1, fontSize: 13, color: '#0F172A', padding: 0 }}
                    />
                    {studentSearchQuery ? (
                      <TouchableOpacity onPress={() => setStudentSearchQuery('')}>
                        <X size={14} color="#94A3B8" />
                      </TouchableOpacity>
                    ) : null}
                  </View>
                </View>

                <ScrollView
                  style={{ maxHeight: 380, marginTop: 10 }}
                  contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16, gap: 8 }}
                >
                  {filteredBatches.length === 0 ? (
                    <View style={{ alignItems: 'center', paddingVertical: 32 }}>
                      <Users size={32} color="#94A3B8" style={{ marginBottom: 8 }} />
                      <Text style={{ fontSize: 13, fontWeight: '600', color: '#64748B' }}>
                        {studentSearchQuery.trim()
                          ? 'No batches found matching search.'
                          : 'No batches in database yet.'}
                      </Text>
                      <Text style={{ fontSize: 11.5, color: '#94A3B8', marginTop: 4, textAlign: 'center', paddingHorizontal: 20 }}>
                        Batches created in the Admin Portal will appear here.
                      </Text>
                    </View>
                  ) : (
                    filteredBatches.map((batch: any) => {
                      const existing = (adminStore.chats || []).find(
                        (c) =>
                          c.type === 'batch_group' &&
                          (c.batchId === batch.id || c.title.toLowerCase() === batch.title.toLowerCase())
                      );

                      return (
                        <TouchableOpacity
                          key={batch.id}
                          activeOpacity={0.75}
                          onPress={() => handleStartBatchChat(batch)}
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            backgroundColor: '#FFFFFF',
                            borderRadius: 14,
                            padding: 12,
                            borderWidth: 1,
                            borderColor: existing ? '#BAE6FD' : '#E2E8F0',
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 1 },
                            shadowOpacity: 0.04,
                            shadowRadius: 2,
                            elevation: 1,
                          }}
                        >
                          <View
                            style={{
                              width: 44,
                              height: 44,
                              borderRadius: 22,
                              backgroundColor: '#E0F2FE',
                              alignItems: 'center',
                              justifyContent: 'center',
                              marginRight: 12,
                              borderWidth: 1,
                              borderColor: '#BAE6FD',
                            }}
                          >
                            <Users size={20} color="#0284C7" />
                          </View>

                          <View style={{ flex: 1, marginRight: 8 }}>
                            <Text
                              style={{ fontSize: 13.5, fontWeight: '700', color: '#0F172A', marginBottom: 2 }}
                              numberOfLines={1}
                            >
                              {batch.title}
                            </Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                              <Text style={{ fontSize: 11.5, color: '#0284C7', fontWeight: '600' }}>
                                {batch.subject}
                              </Text>
                              <Text style={{ fontSize: 11.5, color: '#64748B' }}>
                                • {batch.enrolledCount || 0} enrolled students
                              </Text>
                            </View>
                          </View>

                          <View
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              paddingHorizontal: 9,
                              paddingVertical: 5,
                              borderRadius: 8,
                              backgroundColor: existing ? '#F0F9FF' : '#0284C7',
                              borderWidth: existing ? 1 : 0,
                              borderColor: '#BAE6FD',
                              gap: 4,
                            }}
                          >
                            <Users size={12} color={existing ? '#0284C7' : '#FFFFFF'} />
                            <Text
                              style={{
                                fontSize: 11.5,
                                fontWeight: '700',
                                color: existing ? '#0284C7' : '#FFFFFF',
                              }}
                            >
                              {existing ? 'Open' : 'Group Chat'}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })
                  )}
                </ScrollView>
              </View>
            )}

            {/* TAB 3: CUSTOM DIRECT STUDENT ENTRY */}
            {modalTab === 'custom' && (
              <ScrollView
                style={{ maxHeight: 420 }}
                contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16, gap: 12 }}
              >
                <View
                  style={{
                    backgroundColor: '#EFF6FF',
                    borderRadius: 12,
                    padding: 10,
                    borderWidth: 1,
                    borderColor: '#BFDBFE',
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <Sparkles size={16} color="#2563EB" />
                  <Text style={{ fontSize: 12, color: '#1E40AF', flex: 1, lineHeight: 16 }}>
                    Directly message any student by entering their name and batch. A direct chat channel will be created immediately.
                  </Text>
                </View>

                {/* Student Full Name */}
                <View>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: '#334155', marginBottom: 4 }}>
                    Student Full Name *
                  </Text>
                  <TextInput
                    value={customStudentName}
                    onChangeText={setCustomStudentName}
                    placeholder="e.g. Arjun Singh Rajput"
                    placeholderTextColor="#94A3B8"
                    style={{
                      backgroundColor: '#F8FAFC',
                      borderWidth: 1,
                      borderColor: '#CBD5E1',
                      borderRadius: 10,
                      paddingHorizontal: 12,
                      paddingVertical: Platform.OS === 'ios' ? 10 : 7,
                      fontSize: 13.5,
                      color: '#0F172A',
                    }}
                  />
                </View>

                {/* Batch Name */}
                <View>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: '#334155', marginBottom: 4 }}>
                    Batch / Class
                  </Text>
                  <TextInput
                    value={customStudentBatch}
                    onChangeText={setCustomStudentBatch}
                    placeholder="e.g. Class 10 CBSE - Mathematics"
                    placeholderTextColor="#94A3B8"
                    style={{
                      backgroundColor: '#F8FAFC',
                      borderWidth: 1,
                      borderColor: '#CBD5E1',
                      borderRadius: 10,
                      paddingHorizontal: 12,
                      paddingVertical: Platform.OS === 'ios' ? 10 : 7,
                      fontSize: 13.5,
                      color: '#0F172A',
                    }}
                  />
                  {/* Quick autofill pills */}
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ gap: 6, marginTop: 6 }}
                  >
                    {[
                      'Class 10 CBSE - Mathematics',
                      'Class 10 CBSE - Science',
                      'Class 12 CBSE - Mathematics',
                      'Class 11 CBSE - Physics',
                      'Class 9 CBSE - Foundation',
                    ].map((bName) => (
                      <TouchableOpacity
                        key={bName}
                        onPress={() => setCustomStudentBatch(bName)}
                        style={{
                          backgroundColor: '#F1F5F9',
                          paddingHorizontal: 8,
                          paddingVertical: 3.5,
                          borderRadius: 6,
                        }}
                      >
                        <Text style={{ fontSize: 11, color: '#475569' }}>{bName}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                {/* Student Phone */}
                <View>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: '#334155', marginBottom: 4 }}>
                    Mobile Number (Optional)
                  </Text>
                  <TextInput
                    value={customStudentPhone}
                    onChangeText={setCustomStudentPhone}
                    placeholder="e.g. +91 94122 78910"
                    placeholderTextColor="#94A3B8"
                    keyboardType="phone-pad"
                    style={{
                      backgroundColor: '#F8FAFC',
                      borderWidth: 1,
                      borderColor: '#CBD5E1',
                      borderRadius: 10,
                      paddingHorizontal: 12,
                      paddingVertical: Platform.OS === 'ios' ? 10 : 7,
                      fontSize: 13.5,
                      color: '#0F172A',
                    }}
                  />
                </View>

                {/* Initial Message */}
                <View>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: '#334155', marginBottom: 4 }}>
                    First Message (Optional)
                  </Text>
                  <TextInput
                    value={customStudentInitialMessage}
                    onChangeText={setCustomStudentInitialMessage}
                    placeholder="e.g. Hi, feel free to ask your doubts here regarding batch lectures."
                    placeholderTextColor="#94A3B8"
                    multiline
                    style={{
                      backgroundColor: '#F8FAFC',
                      borderWidth: 1,
                      borderColor: '#CBD5E1',
                      borderRadius: 10,
                      paddingHorizontal: 12,
                      paddingVertical: Platform.OS === 'ios' ? 10 : 7,
                      fontSize: 13.5,
                      color: '#0F172A',
                      minHeight: 54,
                    }}
                  />
                </View>

                {/* Submit button */}
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={handleCreateCustomStudentChat}
                  style={{
                    backgroundColor: '#2563EB',
                    borderRadius: 12,
                    paddingVertical: 12,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginTop: 6,
                    shadowColor: '#2563EB',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.2,
                    shadowRadius: 4,
                    elevation: 3,
                  }}
                >
                  <Text style={{ fontSize: 14, fontWeight: '700', color: '#FFFFFF' }}>
                    Start Conversation
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </Screen>
  );
}
