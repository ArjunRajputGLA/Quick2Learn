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
  Animated,
  Keyboard,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
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
  Camera,
  FileText,
  Download,
  Image as ImageIcon,
  Mic,
  MoreVertical,
  Trash2,
  Mail,
} from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
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

interface ChatAttachmentItem {
  uri: string;
  name: string;
  size?: string;
  type: 'image' | 'pdf' | 'document';
  mimeType?: string;
}

function formatFileSize(bytes?: number): string {
  if (!bytes || bytes <= 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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
  const [chatInputHeight, setChatInputHeight] = useState(42);
  const [chatSearch, setChatSearch] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const chatScrollRef = useRef<any>(null);

  // File attachment state
  const [isAttachmentModalVisible, setIsAttachmentModalVisible] = useState(false);
  const [attachedFile, setAttachedFile] = useState<ChatAttachmentItem | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  // Keyboard visibility state
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    const handleKeyboardShow = () => {
      setIsKeyboardVisible(true);
      setTimeout(() => {
        chatScrollRef.current?.scrollToEnd({ animated: true });
      }, 50);
      setTimeout(() => {
        chatScrollRef.current?.scrollToEnd({ animated: true });
      }, 150);
    };

    const handleKeyboardHide = () => {
      setIsKeyboardVisible(false);
    };

    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, handleKeyboardShow);
    const hideSub = Keyboard.addListener(hideEvent, handleKeyboardHide);

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // New Chat Modal state
  const [isNewChatModalVisible, setIsNewChatModalVisible] = useState(false);
  const [modalTab, setModalTab] = useState<'students' | 'batches' | 'custom'>('students');
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('All');

  // Chat Options Modal state & Unread Messages banner
  const [isChatOptionsModalVisible, setIsChatOptionsModalVisible] = useState(false);
  const [unreadBannerCount, setUnreadBannerCount] = useState<number>(0);

  // Custom student inputs
  const [customStudentName, setCustomStudentName] = useState('');
  const [customStudentBatch, setCustomStudentBatch] = useState('');
  const [customStudentPhone, setCustomStudentPhone] = useState('');
  const [customStudentInitialMessage, setCustomStudentInitialMessage] = useState('');

  useEffect(() => {
    adminStore.init();
  }, []);

  // Track unread messages on entering channel & mark as read
  useEffect(() => {
    if (selectedChannelId) {
      const channel = (adminStore.chats || []).find((c) => c.id === selectedChannelId);
      if (channel && channel.unreadCount > 0) {
        setUnreadBannerCount(channel.unreadCount);
        adminStore.markChatAsRead(selectedChannelId);
      } else {
        setUnreadBannerCount(0);
      }
    } else {
      setUnreadBannerCount(0);
      setIsChatOptionsModalVisible(false);
      setIsKeyboardVisible(false);
    }
  }, [selectedChannelId]);

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
      if (isChatOptionsModalVisible) {
        setIsChatOptionsModalVisible(false);
        return true;
      }
      if (isAttachmentModalVisible) {
        setIsAttachmentModalVisible(false);
        return true;
      }
      if (previewImageUrl) {
        setPreviewImageUrl(null);
        return true;
      }
      if (isKeyboardVisible) {
        Keyboard.dismiss();
        setIsKeyboardVisible(false);
        return true;
      }
      setSelectedChannelId(null);
      return true;
    });
    return () => sub.remove();
  }, [selectedChannelId, isChatOptionsModalVisible, isKeyboardVisible, isAttachmentModalVisible, previewImageUrl]);

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

  const formatChatDate = (dateStr?: string | Date) => {
    if (!dateStr) return '24 May 2021';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '24 May 2021';
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const handleRecordVoiceNote = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    Alert.alert(
      'Voice Note',
      'Voice note recording is coming soon! You can type your doubts and attach documents or photos directly in this chat.',
      [{ text: 'OK' }]
    );
  };

  // Chats data from admin store
  const channels = adminStore.chats || [];
  const selectedChannel = channels.find((c) => c.id === selectedChannelId);

  // Check whether other party in direct chat is online
  const isOtherUserOnline = useMemo(() => {
    if (!selectedChannel || selectedChannel.type !== 'direct') return false;
    if (typeof selectedChannel.isOnline === 'boolean') {
      return selectedChannel.isOnline;
    }
    // Check if other party sent an incoming message within last 5 minutes
    const lastMsg = selectedChannel.messages?.[selectedChannel.messages.length - 1];
    if (lastMsg && !lastMsg.isOutgoing && lastMsg.createdAt) {
      const diff = Date.now() - new Date(lastMsg.createdAt).getTime();
      if (diff >= 0 && diff < 5 * 60 * 1000) return true;
    }
    return false;
  }, [selectedChannel]);

  // Contextual target contact details for Chat Options Modal
  const targetContactName = useMemo(() => {
    if (!selectedChannel) return 'CHAT CONTACT';
    if (selectedChannel.type === 'batch_group') return (selectedChannel.title || 'BATCH GROUP').toUpperCase();
    if (isAdminOrTeacher) {
      return (selectedChannel.studentName || selectedChannel.title || 'STUDENT').toUpperCase();
    }
    return (selectedChannel.facultyName || selectedChannel.title || 'DINESH SINGH RAJPUT').toUpperCase();
  }, [selectedChannel, isAdminOrTeacher]);

  const targetSubtitle = useMemo(() => {
    if (!selectedChannel) return '';
    return selectedChannel.subtitle || (selectedChannel.type === 'batch_group' ? 'Batch Discussion' : 'Enrolled Student');
  }, [selectedChannel]);

  const targetPhoneNumber = useMemo(() => {
    if (!selectedChannel) return '9412278910';
    if (isAdminOrTeacher) {
      if (selectedChannel.studentPhone) return selectedChannel.studentPhone;
      const found = (adminStore.students || []).find(
        (s) => s.id === selectedChannel.studentId || s.fullName.toLowerCase() === (selectedChannel.studentName || selectedChannel.title).toLowerCase()
      );
      if (found?.phone) return found.phone;
      const foundJoinReq = (adminStore.joinRequests || []).find(
        (r) => (r.studentId && r.studentId === selectedChannel.studentId) || r.studentName?.toLowerCase() === (selectedChannel.studentName || selectedChannel.title).toLowerCase()
      );
      if (foundJoinReq?.studentPhone) return foundJoinReq.studentPhone;
      return '9412278910';
    }
    return selectedChannel.facultyPhone || '9412278910';
  }, [selectedChannel, isAdminOrTeacher, adminStore.students, adminStore.joinRequests]);

  const callButtonLabel = useMemo(() => {
    if (selectedChannel?.type === 'batch_group') {
      return 'Call Institute (+91 94122 78910)';
    }
    if (isAdminOrTeacher) {
      const rawName = selectedChannel?.studentName || selectedChannel?.title || 'Student';
      const firstName = rawName.split(' ')[0] || 'Student';
      return `Call ${firstName}`;
    }
    return 'Call Faculty (Dinesh Sir)';
  }, [selectedChannel, isAdminOrTeacher]);

  const whatsappButtonLabel = useMemo(() => {
    if (selectedChannel?.type === 'batch_group') {
      return 'Join Batch WhatsApp Group';
    }
    if (isAdminOrTeacher) {
      const rawName = selectedChannel?.studentName || selectedChannel?.title || 'Student';
      const firstName = rawName.split(' ')[0] || 'Student';
      return `WhatsApp Chat (${firstName})`;
    }
    return 'WhatsApp Chat';
  }, [selectedChannel, isAdminOrTeacher]);

  const handleOpenChatOptions = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    setIsChatOptionsModalVisible(true);
  };

  const handleCallContact = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}
    setIsChatOptionsModalVisible(false);
    const cleanNumber = targetPhoneNumber.replace(/[^0-9+]/g, '');
    const url = `tel:${cleanNumber}`;
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert(
          'Contact Phone',
          `Direct dialer is unavailable on this device.\n\nPhone Number: ${cleanNumber}`,
          [{ text: 'OK' }]
        );
      }
    } catch (e) {
      Alert.alert(
        'Contact Phone',
        `Phone Number: ${cleanNumber}`,
        [{ text: 'OK' }]
      );
    }
  };

  const handleWhatsAppContact = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}
    setIsChatOptionsModalVisible(false);
    const digitsOnly = targetPhoneNumber.replace(/\D/g, '');
    const fullPhone = digitsOnly.length === 10 ? `91${digitsOnly}` : digitsOnly;
    const greeting = isAdminOrTeacher
      ? `Hi ${selectedChannel?.studentName || selectedChannel?.title || 'Student'}, messaging you from Quick2Learn regarding your classes and doubts.`
      : `Hi Dinesh Sir, regarding the batch and my coursework in Quick2Learn...`;
    const url = `https://wa.me/${fullPhone}?text=${encodeURIComponent(greeting)}`;
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        await Linking.openURL(`https://api.whatsapp.com/send?phone=${fullPhone}&text=${encodeURIComponent(greeting)}`);
      }
    } catch (e) {
      Alert.alert(
        'WhatsApp Contact',
        `Unable to open WhatsApp.\n\nWhatsApp Number: +${fullPhone}`,
        [{ text: 'OK' }]
      );
    }
  };

  const handleClearChat = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } catch {}
    setIsChatOptionsModalVisible(false);
    Alert.alert(
      'Clear Conversation',
      `Are you sure you want to delete all messages in this conversation with ${targetContactName}? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All Messages',
          style: 'destructive',
          onPress: async () => {
            if (selectedChannelId) {
              await adminStore.clearChatMessages(selectedChannelId);
              setUnreadBannerCount(0);
              try {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              } catch {}
            }
          },
        },
      ]
    );
  };

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

  const handleTakePhoto = async () => {
    setIsAttachmentModalVisible(false);
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Camera Permission Required', 'Please enable camera permissions in settings to take photos.');
        return;
      }
      const res = await ImagePicker.launchCameraAsync({
        quality: 0.85,
      });
      if (!res.canceled && res.assets && res.assets.length > 0) {
        const asset = res.assets[0];
        const filename = asset.fileName || `camera_photo_${Date.now()}.jpg`;
        const sizeStr = asset.fileSize ? formatFileSize(asset.fileSize) : undefined;
        setAttachedFile({
          uri: asset.uri,
          name: filename,
          size: sizeStr,
          type: 'image',
          mimeType: asset.mimeType || 'image/jpeg',
        });
      }
    } catch (e: any) {
      console.warn('Error taking photo:', e);
      Alert.alert('Error', 'Unable to open camera. Please try again.');
    }
  };

  const handlePickGallery = async () => {
    setIsAttachmentModalVisible(false);
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Gallery Permission Required', 'Please enable photo library permissions in settings to attach photos.');
        return;
      }
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.85,
        allowsMultipleSelection: false,
      });
      if (!res.canceled && res.assets && res.assets.length > 0) {
        const asset = res.assets[0];
        const filename = asset.fileName || `gallery_image_${Date.now()}.jpg`;
        const sizeStr = asset.fileSize ? formatFileSize(asset.fileSize) : undefined;
        setAttachedFile({
          uri: asset.uri,
          name: filename,
          size: sizeStr,
          type: 'image',
          mimeType: asset.mimeType || 'image/jpeg',
        });
      }
    } catch (e: any) {
      console.warn('Error picking image from gallery:', e);
      Alert.alert('Error', 'Unable to pick photo from gallery. Please try again.');
    }
  };

  const handlePickDocument = async () => {
    setIsAttachmentModalVisible(false);
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: [
          'application/pdf',
          'image/*',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-powerpoint',
          'text/plain',
        ],
        copyToCacheDirectory: true,
      });
      if (!res.canceled && res.assets && res.assets.length > 0) {
        const asset = res.assets[0];
        const isImage =
          (asset.mimeType && asset.mimeType.startsWith('image/')) ||
          /\.(jpg|jpeg|png|webp|gif)$/i.test(asset.name);
        const isPdf = asset.mimeType === 'application/pdf' || /\.pdf$/i.test(asset.name);
        const sizeStr = asset.size ? formatFileSize(asset.size) : undefined;
        setAttachedFile({
          uri: asset.uri,
          name: asset.name,
          size: sizeStr,
          type: isImage ? 'image' : isPdf ? 'pdf' : 'document',
          mimeType: asset.mimeType || 'application/octet-stream',
        });
      }
    } catch (e: any) {
      console.warn('Error picking document:', e);
      Alert.alert('Error', 'Unable to pick document. Please try again.');
    }
  };

  const handleOpenFile = async (fileUrl?: string, fileName?: string) => {
    if (!fileUrl) return;
    try {
      const supported = await Linking.canOpenURL(fileUrl);
      if (supported) {
        await Linking.openURL(fileUrl);
      } else {
        Alert.alert('Attachment', `File: ${fileName || 'Document'}\n${fileUrl}`);
      }
    } catch {
      Alert.alert('Attachment', `File: ${fileName || 'Document'}`);
    }
  };

  const handleSendMessage = async () => {
    if ((!chatMessageText.trim() && !attachedFile) || !selectedChannelId) return;
    const text = chatMessageText.trim();
    const fileToAttach = attachedFile ? { ...attachedFile } : null;

    setChatMessageText('');
    setAttachedFile(null);
    setChatInputHeight(42);
    setUnreadBannerCount(0);

    const senderName =
      me?.profile?.fullName ||
      me?.user?.name ||
      (isAdminOrTeacher ? 'Dinesh Singh Rajput' : 'Student');
    const senderRole = me?.role === 'admin' ? 'admin' : me?.role === 'teacher' ? 'teacher' : 'student';

    await adminStore.sendChatMessage(
      selectedChannelId,
      text || (fileToAttach ? fileToAttach.name : 'Message'),
      senderRole,
      senderName,
      fileToAttach?.type === 'image' ? fileToAttach.uri : undefined,
      true,
      fileToAttach
        ? {
            fileUrl: fileToAttach.uri,
            fileName: fileToAttach.name,
            fileSize: fileToAttach.size,
            fileType: fileToAttach.type,
          }
        : undefined
    );

    setTimeout(() => {
      chatScrollRef.current?.scrollToEnd({ animated: true });
    }, 80);

    // If student messaged direct faculty channel, simulate helpful faculty reply after 1.5s
    if (selectedChannel?.type === 'direct' && senderRole === 'student') {
      setTimeout(async () => {
        const facultyName = selectedChannel.facultyName || 'Namita Singh Rajput';
        const replyText = fileToAttach
          ? `Received your attachment "${fileToAttach.name}". I will review this and get back to you shortly!`
          : `Received your message! I will review this concept and reply shortly.`;
        await adminStore.sendChatMessage(
          selectedChannelId,
          replyText,
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
        selectedChannel ? (
          <View
            style={{
              backgroundColor: '#4845D2',
              marginTop: -insets.top,
              paddingTop: insets.top,
              shadowColor: '#1E1B4B',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.15,
              shadowRadius: 3,
              elevation: 4,
            }}
          >
            <View
              style={{
                height: 56,
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 12,
                justifyContent: 'space-between',
              }}
            >
              {/* Back button + Profile Avatar + Contact Name */}
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 }}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setSelectedChannelId(null)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  style={{ padding: 4, marginRight: 6 }}
                >
                  <ArrowLeft size={24} color="#FFFFFF" strokeWidth={2.2} />
                </TouchableOpacity>

                {/* Circular Avatar with bright green online dot (rendered ONLY when other user online) */}
                <View style={{ position: 'relative', marginRight: 10 }}>
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      backgroundColor: '#F1F5F9',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                    }}
                  >
                    {selectedChannel.type === 'batch_group' ? (
                      <Users size={20} color="#0284C7" strokeWidth={1.8} />
                    ) : (
                      <User size={22} color="#64748B" strokeWidth={2} />
                    )}
                  </View>
                  {isOtherUserOnline ? (
                    <View
                      style={{
                        position: 'absolute',
                        bottom: 0,
                        right: 0,
                        width: 12,
                        height: 12,
                        borderRadius: 6,
                        backgroundColor: '#22C55E',
                        borderWidth: 2,
                        borderColor: '#4845D2',
                      }}
                    />
                  ) : null}
                </View>

                {/* Uppercase bold contact name & online status */}
                <View style={{ flex: 1, justifyContent: 'center' }}>
                  <Text
                    numberOfLines={1}
                    style={{
                      fontSize: 15.5,
                      fontWeight: '700',
                      color: '#FFFFFF',
                      letterSpacing: 0.3,
                      textTransform: 'uppercase',
                    }}
                  >
                    {selectedChannel.title || 'DINESH SINGH RAJPUT'}
                  </Text>
                  <Text
                    numberOfLines={1}
                    style={{
                      fontSize: 11,
                      color: isOtherUserOnline ? '#86EFAC' : 'rgba(255, 255, 255, 0.75)',
                      fontWeight: isOtherUserOnline ? '600' : '400',
                      marginTop: 1,
                    }}
                  >
                    {selectedChannel.type === 'batch_group'
                      ? (selectedChannel.subtitle || 'Batch Discussion')
                      : isOtherUserOnline
                      ? 'Online'
                      : (selectedChannel.lastSeen || 'Offline')}
                  </Text>
                </View>
              </View>

              {/* Three dots vertical menu */}
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={handleOpenChatOptions}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                style={{ padding: 6 }}
              >
                <MoreVertical size={22} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <AppHeader
            title="Chats"
            rightActions={
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
            }
          />
        )
      }
    >
      <StatusBar
        style={selectedChannel ? 'light' : 'dark'}
      />
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
          // Active Conversation Screen (Quick2Learn Educational Theme)
          (() => {
            const activeChatBody = (
              <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
                {/* 1. Unread Banner - Rendered only at appropriate times when there are unread messages */}
                {unreadBannerCount > 0 ? (
                  <View
                    style={{
                      backgroundColor: '#E0F2FE',
                      paddingVertical: 7,
                      paddingHorizontal: 12,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderBottomWidth: 0.5,
                      borderBottomColor: '#BAE6FD',
                      flexDirection: 'row',
                      gap: 6,
                    }}
                  >
                    <Mail size={13} color="#0284C7" />
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: '700',
                        color: '#0284C7',
                        letterSpacing: 0.6,
                        textTransform: 'uppercase',
                      }}
                    >
                      {unreadBannerCount === 1 ? '1 UNREAD MESSAGE' : `${unreadBannerCount} UNREAD MESSAGES`}
                    </Text>
                  </View>
                ) : null}

                {/* 2. Messages List */}
                <ScrollView
                  ref={chatScrollRef}
                  style={{ flex: 1, backgroundColor: '#F8FAFC' }}
                  contentContainerStyle={{ paddingHorizontal: 14, paddingTop: 10, paddingBottom: 16 }}
                  keyboardShouldPersistTaps="handled"
                  onScrollBeginDrag={() => {
                    Keyboard.dismiss();
                    setIsKeyboardVisible(false);
                  }}
                  onContentSizeChange={() => chatScrollRef.current?.scrollToEnd({ animated: false })}
                  onLayout={() => chatScrollRef.current?.scrollToEnd({ animated: true })}
                >
                  {/* Centered Date Separator */}
                  <View style={{ alignItems: 'center', marginVertical: 12 }}>
                    <Text style={{ fontSize: 13, fontWeight: '600', color: '#64748B' }}>
                      {formatChatDate(selectedChannel.messages?.[0]?.createdAt || selectedChannel.lastMessageTime)}
                    </Text>
                  </View>

                  {/* Messages list - Matching Screenshot Layout */}
                  {(selectedChannel.messages || []).map((msg) => {
                    const isMe = Boolean(
                      msg.isOutgoing ||
                      (me?.user?.id && msg.senderId === me.user.id) ||
                      (isAdminOrTeacher
                        ? (msg.senderRole === 'admin' || msg.senderRole === 'teacher' || msg.senderName?.includes('Dinesh')) &&
                          !msg.senderName?.includes('Namita') && !msg.senderName?.includes('Anisha')
                        : msg.senderRole === 'student' ||
                          msg.senderName?.includes('Arjun') ||
                          msg.senderName?.includes('Aarav') ||
                          msg.senderName?.includes('Anisha'))
                    );

                    const hasImage = Boolean(msg.imageUrl || msg.fileType === 'image');
                    const hasDoc = Boolean(
                      msg.fileType === 'pdf' ||
                      msg.fileType === 'document' ||
                      (msg.fileUrl && !hasImage && msg.fileType !== 'image')
                    );
                    const showText = Boolean(
                      msg.text && (msg.text !== msg.fileName || (!hasImage && !hasDoc))
                    );

                    return (
                      <View
                        key={msg.id}
                        style={{
                          marginVertical: 4,
                          alignItems: isMe ? 'flex-end' : 'flex-start',
                          paddingLeft: isMe ? 36 : 0,
                          paddingRight: isMe ? 0 : 36,
                        }}
                      >
                        <View
                          style={{
                            maxWidth: '88%',
                            borderRadius: 14,
                            borderBottomRightRadius: isMe ? 3 : 14,
                            borderBottomLeftRadius: !isMe ? 3 : 14,
                            paddingHorizontal: 14,
                            paddingTop: 10,
                            paddingBottom: 7,
                            backgroundColor: '#FFFFFF',
                            borderWidth: 1,
                            borderColor: isMe ? '#CBD5E1' : '#E2E8F0',
                            shadowColor: '#0F172A',
                            shadowOffset: { width: 0, height: 1 },
                            shadowOpacity: 0.04,
                            shadowRadius: 2,
                            elevation: 1,
                          }}
                        >
                          {/* Image Attachment Preview */}
                          {hasImage && (
                            <TouchableOpacity
                              activeOpacity={0.9}
                              onPress={() => setPreviewImageUrl(msg.imageUrl || msg.fileUrl || null)}
                              style={{
                                marginBottom: showText ? 6 : 2,
                                borderRadius: 10,
                                overflow: 'hidden',
                              }}
                            >
                              <Image
                                source={{ uri: msg.imageUrl || msg.fileUrl }}
                                style={{
                                  width: 220,
                                  height: 150,
                                  borderRadius: 10,
                                  backgroundColor: '#E2E8F0',
                                }}
                                resizeMode="cover"
                              />
                            </TouchableOpacity>
                          )}

                          {/* Document / PDF Attachment Preview */}
                          {hasDoc && (
                            <TouchableOpacity
                              activeOpacity={0.8}
                              onPress={() => handleOpenFile(msg.fileUrl, msg.fileName)}
                              style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 10,
                                padding: 9,
                                borderRadius: 10,
                                backgroundColor: '#F1F5F9',
                                borderWidth: 1,
                                borderColor: '#E2E8F0',
                                marginBottom: showText ? 6 : 2,
                                minWidth: 200,
                                maxWidth: 240,
                              }}
                            >
                              <View
                                style={{
                                  width: 36,
                                  height: 36,
                                  borderRadius: 8,
                                  backgroundColor: msg.fileType === 'pdf' ? '#FEE2E2' : '#EFF6FF',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                <FileText
                                  size={18}
                                  color={msg.fileType === 'pdf' ? '#DC2626' : '#2563EB'}
                                />
                              </View>
                              <View style={{ flex: 1 }}>
                                <Text
                                  numberOfLines={1}
                                  style={{
                                    fontSize: 12.5,
                                    fontWeight: '700',
                                    color: '#0F172A',
                                  }}
                                >
                                  {msg.fileName || 'Attached Document'}
                                </Text>
                                <Text
                                  style={{
                                    fontSize: 10.5,
                                    color: '#64748B',
                                    marginTop: 1,
                                  }}
                                >
                                  {msg.fileType ? msg.fileType.toUpperCase() : 'DOCUMENT'}
                                  {msg.fileSize ? ` • ${msg.fileSize}` : ''}
                                </Text>
                              </View>
                              <Download size={15} color="#64748B" />
                            </TouchableOpacity>
                          )}

                          {/* Text Message */}
                          {showText && (
                            <Text
                              style={{
                                fontSize: 14.5,
                                lineHeight: 21,
                                color: '#0F172A',
                              }}
                            >
                              {msg.text}
                            </Text>
                          )}

                          {/* Bottom Right Timestamp + Ticks */}
                          <View
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              justifyContent: 'flex-end',
                              marginTop: 4,
                              gap: 4,
                            }}
                          >
                            <Text
                              style={{
                                fontSize: 10.5,
                                color: '#64748B',
                                fontWeight: '500',
                              }}
                            >
                              {formatBubbleTime(msg.createdAt)}
                            </Text>
                            {isMe && (
                              <CheckCheck size={14} color="#2563EB" strokeWidth={2.2} />
                            )}
                          </View>
                        </View>
                      </View>
                    );
                  })}
                </ScrollView>

                {/* Attachment Preview Chip above input bar */}
                {attachedFile && (
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: '#F8FAFC',
                      borderTopWidth: 1,
                      borderTopColor: '#E2E8F0',
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      gap: 10,
                    }}
                  >
                    {attachedFile.type === 'image' ? (
                      <Image
                        source={{ uri: attachedFile.uri }}
                        style={{ width: 44, height: 44, borderRadius: 8, backgroundColor: '#E2E8F0' }}
                        resizeMode="cover"
                      />
                    ) : (
                      <View
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 8,
                          backgroundColor: attachedFile.type === 'pdf' ? '#FEE2E2' : '#EFF6FF',
                          borderWidth: 1,
                          borderColor: attachedFile.type === 'pdf' ? '#FECACA' : '#BFDBFE',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <FileText size={22} color={attachedFile.type === 'pdf' ? '#DC2626' : '#2563EB'} />
                      </View>
                    )}
                    <View style={{ flex: 1 }}>
                      <Text
                        numberOfLines={1}
                        style={{ fontSize: 13, fontWeight: '700', color: '#0F172A' }}
                      >
                        {attachedFile.name}
                      </Text>
                      <Text style={{ fontSize: 11, color: '#64748B', marginTop: 1 }}>
                        {attachedFile.type === 'image' ? 'Image file' : attachedFile.type === 'pdf' ? 'PDF document' : 'Document'}
                        {attachedFile.size ? ` • ${attachedFile.size}` : ''}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => setAttachedFile(null)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 14,
                        backgroundColor: '#E2E8F0',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <X size={15} color="#475569" strokeWidth={2.4} />
                    </TouchableOpacity>
                  </View>
                )}

                {/* Message Input Bar (Matching User Reference Image) */}
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'flex-end',
                    backgroundColor: '#FFFFFF',
                    borderTopWidth: 1,
                    borderTopColor: '#E2E8F0',
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    paddingBottom: isKeyboardVisible ? 8 : Math.max(insets.bottom, 10),
                    gap: 12,
                  }}
                >
                  {/* Paperclip */}
                  <TouchableOpacity
                    onPress={() => {
                      Keyboard.dismiss();
                      setIsAttachmentModalVisible(true);
                    }}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    style={{ paddingBottom: 8 }}
                  >
                    <Paperclip size={24} color={attachedFile ? '#2563EB' : '#64748B'} strokeWidth={2} />
                  </TouchableOpacity>

                  {/* Frameless Multiline TextInput */}
                  <TextInput
                    value={chatMessageText}
                    onChangeText={(text) => {
                      setChatMessageText(text);
                      if (!text || text.length === 0) {
                        setChatInputHeight(38);
                      }
                    }}
                    onContentSizeChange={(e) => {
                      const rawHeight = e.nativeEvent.contentSize.height;
                      if (!chatMessageText || chatMessageText.trim().length === 0) {
                        setChatInputHeight(38);
                        return;
                      }
                      const clampedHeight = Math.max(38, Math.min(110, Math.round(rawHeight + 8)));
                      setChatInputHeight(clampedHeight);
                    }}
                    onFocus={() => {
                      setIsKeyboardVisible(true);
                      setTimeout(() => {
                        chatScrollRef.current?.scrollToEnd({ animated: true });
                      }, 100);
                    }}
                    onBlur={() => {
                      setIsKeyboardVisible(false);
                    }}
                    placeholder={attachedFile ? 'Add a caption...' : 'Type a message...'}
                    placeholderTextColor="#94A3B8"
                    multiline
                    textAlignVertical="center"
                    style={{
                      flex: 1,
                      height: chatInputHeight,
                      minHeight: 38,
                      maxHeight: 110,
                      backgroundColor: 'transparent',
                      borderWidth: 0,
                      paddingHorizontal: 4,
                      paddingVertical: 6,
                      fontSize: 15.5,
                      lineHeight: 21,
                      color: '#0F172A',
                    }}
                  />

                  {/* Mic Button */}
                  <TouchableOpacity
                    onPress={handleRecordVoiceNote}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    style={{ paddingBottom: 8 }}
                  >
                    <Mic size={24} color="#64748B" strokeWidth={2} />
                  </TouchableOpacity>

                  {/* Send Button */}
                  <TouchableOpacity
                    onPress={handleSendMessage}
                    disabled={!chatMessageText.trim() && !attachedFile}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    style={{ paddingBottom: 8 }}
                  >
                    <Send
                      size={24}
                      color={(chatMessageText.trim() || attachedFile) ? '#2563EB' : '#94A3B8'}
                      strokeWidth={2.2}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            );

            return (
              <KeyboardAvoidingView
                style={{ flex: 1, backgroundColor: '#F8FAFC' }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top + 56 : 0}
              >
                {activeChatBody}
              </KeyboardAvoidingView>
            );
          })()
        )}
      </View>

      {/* Sleek Custom Chat Options Modal (Replacing generic Alert.alert) */}
      <Modal
        visible={isChatOptionsModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsChatOptionsModalVisible(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setIsChatOptionsModalVisible(false)}
          style={{
            flex: 1,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 20,
          }}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 24,
              padding: 22,
              width: '100%',
              maxWidth: 380,
              alignItems: 'center',
              shadowColor: '#0F172A',
              shadowOffset: { width: 0, height: 12 },
              shadowOpacity: 0.22,
              shadowRadius: 24,
              elevation: 16,
            }}
          >
            {/* Top Avatar / Help Icon Badge matching screenshot style */}
            <View
              style={{
                width: 58,
                height: 58,
                borderRadius: 29,
                backgroundColor: '#EFF6FF',
                borderWidth: 2,
                borderColor: '#BFDBFE',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 12,
              }}
            >
              <HelpCircle size={28} color="#2563EB" strokeWidth={2.2} />
            </View>

            {/* Contact Title */}
            <Text
              numberOfLines={1}
              style={{
                fontSize: 18,
                fontWeight: '800',
                color: '#0F172A',
                textAlign: 'center',
                textTransform: 'uppercase',
                letterSpacing: 0.3,
              }}
            >
              {targetContactName}
            </Text>

            {/* Subtitle Prompt */}
            <Text
              style={{
                fontSize: 13,
                color: '#64748B',
                textAlign: 'center',
                marginTop: 4,
                marginBottom: selectedChannel?.type === 'direct' ? 8 : 16,
              }}
            >
              Select an action for this chat:
            </Text>

            {/* Online Status Pill for Direct chats */}
            {selectedChannel?.type === 'direct' && (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: isOtherUserOnline ? '#ECFDF5' : '#F1F5F9',
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: 12,
                  marginBottom: 16,
                  gap: 6,
                }}
              >
                <View
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: 3.5,
                    backgroundColor: isOtherUserOnline ? '#10B981' : '#94A3B8',
                  }}
                />
                <Text
                  style={{
                    fontSize: 11.5,
                    fontWeight: '700',
                    color: isOtherUserOnline ? '#059669' : '#64748B',
                  }}
                >
                  {isOtherUserOnline ? 'Active Online' : (selectedChannel?.lastSeen || 'Offline')}
                </Text>
              </View>
            )}

            {/* Action 1: Call Button */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleCallContact}
              style={{
                width: '100%',
                backgroundColor: '#2563EB',
                borderRadius: 14,
                paddingVertical: 13,
                paddingHorizontal: 16,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 10,
                shadowColor: '#2563EB',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.25,
                shadowRadius: 4,
                elevation: 3,
                gap: 10,
              }}
            >
              <Phone size={18} color="#FFFFFF" strokeWidth={2.3} />
              <Text
                numberOfLines={1}
                style={{
                  color: '#FFFFFF',
                  fontSize: 14.5,
                  fontWeight: '700',
                  letterSpacing: 0.1,
                }}
              >
                {callButtonLabel}
              </Text>
            </TouchableOpacity>

            {/* Action 2: WhatsApp Chat Button */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleWhatsAppContact}
              style={{
                width: '100%',
                backgroundColor: '#16A34A',
                borderRadius: 14,
                paddingVertical: 13,
                paddingHorizontal: 16,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 10,
                shadowColor: '#16A34A',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.25,
                shadowRadius: 4,
                elevation: 3,
                gap: 10,
              }}
            >
              <MessageCircle size={18} color="#FFFFFF" strokeWidth={2.3} />
              <Text
                numberOfLines={1}
                style={{
                  color: '#FFFFFF',
                  fontSize: 14.5,
                  fontWeight: '700',
                  letterSpacing: 0.1,
                }}
              >
                {whatsappButtonLabel}
              </Text>
            </TouchableOpacity>

            {/* Action 3: Clear Chat Messages Button */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleClearChat}
              style={{
                width: '100%',
                backgroundColor: '#DC2626',
                borderRadius: 14,
                paddingVertical: 13,
                paddingHorizontal: 16,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 12,
                shadowColor: '#DC2626',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.25,
                shadowRadius: 4,
                elevation: 3,
                gap: 10,
              }}
            >
              <Trash2 size={18} color="#FFFFFF" strokeWidth={2.3} />
              <Text
                style={{
                  color: '#FFFFFF',
                  fontSize: 14.5,
                  fontWeight: '700',
                  letterSpacing: 0.1,
                }}
              >
                Clear Chat Messages
              </Text>
            </TouchableOpacity>

            {/* Action 4: Cancel Button */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setIsChatOptionsModalVisible(false)}
              style={{
                width: '100%',
                backgroundColor: '#F8FAFC',
                borderWidth: 1.5,
                borderColor: '#E2E8F0',
                borderRadius: 14,
                paddingVertical: 12,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text
                style={{
                  color: '#475569',
                  fontSize: 14.5,
                  fontWeight: '700',
                }}
              >
                Cancel
              </Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

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
      {/* Attachment Picker Modal */}
      <Modal
        visible={isAttachmentModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setIsAttachmentModalVisible(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setIsAttachmentModalVisible(false)}
          style={{
            flex: 1,
            backgroundColor: 'rgba(15, 23, 42, 0.55)',
            justifyContent: 'flex-end',
          }}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={{
              backgroundColor: '#FFFFFF',
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              paddingHorizontal: 20,
              paddingTop: 14,
              paddingBottom: Math.max(insets.bottom, 20),
              shadowColor: '#0F172A',
              shadowOffset: { width: 0, height: -4 },
              shadowOpacity: 0.15,
              shadowRadius: 12,
              elevation: 10,
            }}
          >
            {/* Drag handle */}
            <View
              style={{
                width: 36,
                height: 4,
                borderRadius: 2,
                backgroundColor: '#CBD5E1',
                alignSelf: 'center',
                marginBottom: 16,
              }}
            />

            <Text style={{ fontSize: 17, fontWeight: '700', color: '#0F172A', marginBottom: 4 }}>
              Attach File or Media
            </Text>
            <Text style={{ fontSize: 13, color: '#64748B', marginBottom: 18 }}>
              Share doubts, photos, class notes, or assignment PDF
            </Text>

            {/* Options */}
            <View style={{ gap: 10 }}>
              {/* Camera */}
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={handleTakePhoto}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: 13,
                  borderRadius: 14,
                  backgroundColor: '#F8FAFC',
                  borderWidth: 1,
                  borderColor: '#E2E8F0',
                  gap: 14,
                }}
              >
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: '#EFF6FF',
                    borderWidth: 1,
                    borderColor: '#BFDBFE',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Camera size={22} color="#2563EB" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: '600', color: '#0F172A' }}>
                    Take Photo
                  </Text>
                  <Text style={{ fontSize: 12, color: '#64748B', marginTop: 1 }}>
                    Use camera to snap homework, doubt, or board
                  </Text>
                </View>
                <ChevronRight size={18} color="#94A3B8" />
              </TouchableOpacity>

              {/* Gallery */}
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={handlePickGallery}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: 13,
                  borderRadius: 14,
                  backgroundColor: '#F8FAFC',
                  borderWidth: 1,
                  borderColor: '#E2E8F0',
                  gap: 14,
                }}
              >
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: '#F5F3FF',
                    borderWidth: 1,
                    borderColor: '#DDD6FE',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <ImageIcon size={22} color="#7C3AED" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: '600', color: '#0F172A' }}>
                    Photo Library
                  </Text>
                  <Text style={{ fontSize: 12, color: '#64748B', marginTop: 1 }}>
                    Choose image or screenshot from your device
                  </Text>
                </View>
                <ChevronRight size={18} color="#94A3B8" />
              </TouchableOpacity>

              {/* Document / PDF */}
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={handlePickDocument}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: 13,
                  borderRadius: 14,
                  backgroundColor: '#F8FAFC',
                  borderWidth: 1,
                  borderColor: '#E2E8F0',
                  gap: 14,
                }}
              >
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: '#ECFDF5',
                    borderWidth: 1,
                    borderColor: '#A7F3D0',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <FileText size={22} color="#059669" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: '600', color: '#0F172A' }}>
                    Document or PDF
                  </Text>
                  <Text style={{ fontSize: 12, color: '#64748B', marginTop: 1 }}>
                    Attach study material, notes, or test solutions
                  </Text>
                </View>
                <ChevronRight size={18} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            {/* Cancel Button */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setIsAttachmentModalVisible(false)}
              style={{
                marginTop: 14,
                paddingVertical: 12,
                borderRadius: 12,
                backgroundColor: '#F1F5F9',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#475569' }}>
                Cancel
              </Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Full Image Preview Modal */}
      <Modal
        visible={Boolean(previewImageUrl)}
        transparent
        animationType="fade"
        onRequestClose={() => setPreviewImageUrl(null)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', justifyContent: 'center', alignItems: 'center' }}>
          <TouchableOpacity
            onPress={() => setPreviewImageUrl(null)}
            style={{
              position: 'absolute',
              top: Math.max(insets.top, 20) + 10,
              right: 20,
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10,
            }}
          >
            <X size={22} color="#FFFFFF" />
          </TouchableOpacity>
          {previewImageUrl && (
            <Image
              source={{ uri: previewImageUrl }}
              style={{ width: '92%', height: '75%', borderRadius: 12 }}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>
    </Screen>
  );
}
