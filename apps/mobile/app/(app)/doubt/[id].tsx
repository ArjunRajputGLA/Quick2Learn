import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Linking,
  ActionSheetIOS,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import {
  HelpCircle,
  Send,
  Camera,
  Image as ImageIcon,
  CheckCircle2,
  Sparkles,
  Video,
  Clock,
  Play,
  X,
  FileQuestion,
  User,
  ExternalLink,
} from 'lucide-react-native';
import { Screen } from '../../../src/components/ui/Screen';
import { AppHeader } from '../../../src/components/ui/AppHeader';
import { Button } from '../../../src/components/ui/Button';
import { Badge } from '../../../src/components/ui/Badge';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { ImageViewerModal } from '../../../src/components/tests/ImageViewerModal';
import {
  useDoubtThread,
  useReplyDoubt,
  useCloseDoubt,
  useMarkDoubtHelpful,
  usePresignedDoubtUploads,
} from '../../../src/api/hooks';
import type { DoubtMessageItem } from '@quick2learn/shared';

interface SelectedPhoto {
  uri: string;
  name: string;
}

export default function DoubtThreadScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data, isLoading, isError, refetch } = useDoubtThread(id || '');
  const replyMutation = useReplyDoubt(id || '');
  const closeMutation = useCloseDoubt(id || '');
  const markHelpfulMutation = useMarkDoubtHelpful(id || '');
  const presignedUploadsMutation = usePresignedDoubtUploads();

  const [replyText, setReplyText] = useState('');
  const [replyPhotos, setReplyPhotos] = useState<SelectedPhoto[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [viewerImageUrl, setViewerImageUrl] = useState<string | null>(null);

  const scrollViewRef = useRef<any>(null);

  // Auto-scroll to bottom when messages update
  useEffect(() => {
    if (data?.messages && data.messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 200);
    }
  }, [data?.messages?.length]);

  if (isLoading) {
    return (
      <Screen scrollable={false} header={<AppHeader title="Doubt Thread" showBack />}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#2563EB" />
          <Text className="text-small text-ink-muted mt-3">Loading discussion...</Text>
        </View>
      </Screen>
    );
  }

  if (isError || !data?.doubt) {
    return (
      <Screen scrollable={false} header={<AppHeader title="Doubt Thread" showBack />}>
        <View className="flex-1 p-6 justify-center">
          <EmptyState
            title="Doubt not found"
            description="This doubt thread does not exist or you do not have permission to access it."
            actionLabel="Go Back"
            onAction={() => router.back()}
          />
        </View>
      </Screen>
    );
  }

  const { doubt, messages, sourceContext } = data;

  // Handle Mark as Helpful ("This solved it")
  const handleMarkHelpful = async () => {
    try {
      await markHelpfulMutation.mutateAsync();
      Alert.alert(
        'Doubt Solved! ⭐',
        'Thank you! Your feedback has been shared with Dinesh Sir and the faculty.'
      );
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Could not update doubt.');
    }
  };

  // Handle Close
  const handleClose = async () => {
    try {
      await closeMutation.mutateAsync();
      Alert.alert('Doubt Closed', 'This doubt thread is now marked as closed.');
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Could not close doubt.');
    }
  };

  // Add photo to reply
  const processAndAddReplyImage = async (uri: string, w?: number, h?: number) => {
    try {
      const origW = w || 2000;
      const origH = h || 2000;
      const actions: ImageManipulator.Action[] = [];
      if (origW > 1600 || origH > 1600) {
        if (origW >= origH) {
          actions.push({ resize: { width: 1600 } });
        } else {
          actions.push({ resize: { height: 1600 } });
        }
      }

      const manipResult = await ImageManipulator.manipulateAsync(
        uri,
        actions,
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
      );

      setReplyPhotos((prev) => [
        ...prev,
        { uri: manipResult.uri, name: `reply-${Date.now()}.jpg` },
      ]);
    } catch (err) {
      console.error('Image compression error:', err);
    }
  };

  const handlePickCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') return;
    const res = await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 0.8 });
    if (!res.canceled && res.assets[0]) {
      await processAndAddReplyImage(res.assets[0].uri, res.assets[0].width, res.assets[0].height);
    }
  };

  const handlePickGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;
    const res = await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, quality: 0.8 });
    if (!res.canceled && res.assets[0]) {
      await processAndAddReplyImage(res.assets[0].uri, res.assets[0].width, res.assets[0].height);
    }
  };

  const showReplyPhotoPicker = () => {
    if (replyPhotos.length >= 3) {
      Alert.alert('Limit Reached', 'At most 3 photos per reply.');
      return;
    }
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: ['Cancel', 'Take Photo', 'Choose from Gallery'], cancelButtonIndex: 0 },
        (idx) => {
          if (idx === 1) handlePickCamera();
          else if (idx === 2) handlePickGallery();
        }
      );
    } else {
      Alert.alert(
        'Attach Photo',
        'Choose source for reply photo:',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Camera', onPress: handlePickCamera },
          { text: 'Gallery', onPress: handlePickGallery },
        ],
        { cancelable: true }
      );
    }
  };

  // Send Reply
  const handleSendReply = async () => {
    if (!replyText.trim() && replyPhotos.length === 0) return;

    setIsSending(true);
    try {
      const uploadedKeys: string[] = [];

      if (replyPhotos.length > 0) {
        const presignRes = await presignedUploadsMutation.mutateAsync({
          files: replyPhotos.map((p) => ({ filename: p.name, contentType: 'image/jpeg' })),
        });

        for (let i = 0; i < replyPhotos.length; i++) {
          const photo = replyPhotos[i]!;
          const uploadInfo = presignRes.uploads[i]!;
          const response = await fetch(photo.uri);
          const blob = await response.blob();
          await fetch(uploadInfo.uploadUrl, {
            method: 'PUT',
            headers: { 'Content-Type': 'image/jpeg' },
            body: blob,
          });
          uploadedKeys.push(uploadInfo.key);
        }
      }

      await replyMutation.mutateAsync({
        body: replyText.trim() || 'See attached photo.',
        attachmentKeys: uploadedKeys,
      });

      setReplyText('');
      setReplyPhotos([]);
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Could not send reply.');
    } finally {
      setIsSending(false);
    }
  };

  // Parse lecture timestamp links inside message text:
  // e.g. [▶ Watch Lecture at 05:20](/lecture/xyz?t=320)
  const renderMessageContent = (bodyText: string) => {
    const lectureLinkRegex = /\[▶\s*Watch\s*([^\]]+)\]\(\/lecture\/([^?]+)\?t=(\d+)\)/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = lectureLinkRegex.exec(bodyText)) !== null) {
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          content: bodyText.substring(lastIndex, match.index),
        });
      }

      const label = match[1];
      const lectureId = match[2];
      const seconds = match[3];

      parts.push({
        type: 'lecture_link',
        label: `▶ Watch ${label}`,
        lectureId,
        seconds,
      });

      lastIndex = lectureLinkRegex.lastIndex;
    }

    if (lastIndex < bodyText.length) {
      parts.push({
        type: 'text',
        content: bodyText.substring(lastIndex),
      });
    }

    return (
      <View>
        {parts.map((p, i) => {
          if (p.type === 'lecture_link') {
            return (
              <TouchableOpacity
                key={i}
                activeOpacity={0.7}
                onPress={() => router.push(`/lecture/${p.lectureId}?t=${p.seconds}` as any)}
                className="my-2 p-2.5 bg-indigo-50 rounded-xl border border-indigo-200 flex-row items-center"
              >
                <Video size={16} color="#4F46E5" />
                <Text className="text-small font-bold text-indigo-900 ml-2 flex-1">
                  {p.label}
                </Text>
                <Play size={14} color="#4F46E5" />
              </TouchableOpacity>
            );
          }
          return (
            <Text key={i} className="text-body text-ink leading-relaxed">
              {p.content}
            </Text>
          );
        })}
      </View>
    );
  };

  return (
    <Screen
      scrollable={false}
      safeAreaBottom
      header={
        <AppHeader
          title={doubt.title}
          showBack
          rightActions={
            doubt.status !== 'closed' ? (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={handleClose}
                className="px-2.5 py-1 rounded-lg border border-border bg-surface"
              >
                <Text className="text-[11px] font-semibold text-ink-muted">
                  Close
                </Text>
              </TouchableOpacity>
            ) : null
          }
        />
      }
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={{ padding: 16, paddingBottom: 30 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header Metadata Pill Banner */}
          <View className="bg-surface rounded-2xl p-4 border border-border shadow-xs mb-4">
            <View className="flex-row items-center justify-between mb-2">
              <View className="flex-row items-center space-x-2">
                <Badge
                  label={
                    doubt.status === 'open'
                      ? 'Waiting for Teacher'
                      : doubt.status === 'answered'
                      ? 'Teacher Replied'
                      : 'Closed'
                  }
                  variant={
                    doubt.status === 'open'
                      ? 'warning'
                      : doubt.status === 'answered'
                      ? 'primary'
                      : 'neutral'
                  }
                  size="sm"
                />

                {doubt.isHelpful && (
                  <View className="bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex-row items-center">
                    <Sparkles size={11} color="#059669" />
                    <Text className="text-[10px] font-bold text-emerald-800 ml-1">
                      Solved!
                    </Text>
                  </View>
                )}
              </View>

              <Text className="text-[11px] text-ink-muted font-medium">
                {doubt.subjectName}
              </Text>
            </View>

            <Text className="text-h3 font-bold text-ink mb-1">
              {doubt.title}
            </Text>

            {doubt.chapterTitle ? (
              <Text className="text-caption text-ink-muted">
                Chapter: {doubt.chapterTitle}
              </Text>
            ) : null}

            {/* Source Context: Lecture or Test Question */}
            {sourceContext?.lectureId ? (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() =>
                  router.push(
                    `/lecture/${sourceContext.lectureId}?t=${doubt.timestampSeconds || 0}` as any
                  )
                }
                className="mt-3 p-2.5 bg-indigo-50 rounded-xl border border-indigo-200 flex-row items-center justify-between"
              >
                <View className="flex-row items-center flex-1 mr-2">
                  <Video size={16} color="#4F46E5" />
                  <View className="ml-2 flex-1">
                    <Text className="text-caption font-bold text-indigo-900">
                      From Lecture: {sourceContext.lectureTitle}
                    </Text>
                    {sourceContext.timestampFormatted && (
                      <Text className="text-[11px] text-indigo-700 font-mono">
                        At timestamp {sourceContext.timestampFormatted}
                      </Text>
                    )}
                  </View>
                </View>

                <View className="flex-row items-center">
                  <Text className="text-[11px] font-bold text-primary mr-1">
                    Play
                  </Text>
                  <Play size={12} color="#2563EB" />
                </View>
              </TouchableOpacity>
            ) : sourceContext?.questionId ? (
              <View className="mt-3 p-2.5 bg-emerald-50 rounded-xl border border-emerald-200">
                <View className="flex-row items-center mb-1">
                  <FileQuestion size={15} color="#059669" />
                  <Text className="text-caption font-bold text-emerald-900 ml-1.5">
                    From Test Solution
                  </Text>
                </View>
                {sourceContext.questionStem ? (
                  <Text numberOfLines={2} className="text-small text-emerald-950">
                    {sourceContext.questionStem}
                  </Text>
                ) : null}
              </View>
            ) : null}
          </View>

          {/* Solved Banner / "This solved it" Callout */}
          {doubt.status === 'answered' && !doubt.isHelpful && (
            <View className="bg-emerald-50/80 rounded-2xl p-4 border border-emerald-200 shadow-xs mb-4 flex-row items-center justify-between">
              <View className="flex-1 mr-3">
                <Text className="text-small font-bold text-emerald-950 mb-0.5">
                  Did this answer solve your doubt?
                </Text>
                <Text className="text-caption text-emerald-800">
                  Let Dinesh Sir know your doubt is resolved.
                </Text>
              </View>

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={handleMarkHelpful}
                className="bg-emerald-600 px-3.5 py-2 rounded-xl flex-row items-center shadow-xs"
              >
                <Sparkles size={14} color="#FFFFFF" />
                <Text className="text-small font-bold text-white ml-1.5">
                  This solved it
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Messages Stream */}
          <View className="space-y-4">
            {messages.map((msg: DoubtMessageItem) => {
              const isTeacher =
                msg.authorRole === 'teacher' || msg.authorRole === 'admin';

              return (
                <View
                  key={msg.id}
                  className={`flex-col ${
                    isTeacher ? 'items-start mr-8' : 'items-end ml-8'
                  }`}
                >
                  <View className="flex-row items-center space-x-1.5 mb-1 px-1">
                    <Text className="text-[11px] font-bold text-ink">
                      {isTeacher ? 'Dinesh Sir / Faculty' : 'You'}
                    </Text>
                    <Text className="text-[10px] text-ink-muted">
                      {new Date(msg.createdAt).toLocaleTimeString('en-IN', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true,
                      })}
                    </Text>
                  </View>

                  <View
                    className={`rounded-3xl p-4 shadow-2xs ${
                      isTeacher
                        ? 'bg-surface border border-border text-ink rounded-tl-sm'
                        : 'bg-primary-soft/60 border border-primary/20 text-ink rounded-tr-sm'
                    }`}
                  >
                    {renderMessageContent(msg.body)}

                    {/* Image Attachments */}
                    {msg.attachmentUrls && msg.attachmentUrls.length > 0 && (
                      <View className="mt-3 flex-row flex-wrap gap-2">
                        {msg.attachmentUrls.map((url, i) => (
                          <TouchableOpacity
                            key={i}
                            activeOpacity={0.8}
                            onPress={() => setViewerImageUrl(url)}
                            className="w-24 h-24 rounded-xl overflow-hidden border border-black/10 bg-black/5"
                          >
                            <Image
                              source={{ uri: url }}
                              contentFit="cover"
                              className="w-full h-full"
                            />
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        </ScrollView>

        {/* Reply Input Bar (if open/answered) */}
        {doubt.status !== 'closed' ? (
          <View className="p-3 bg-surface border-t border-border">
            {/* Pending photo previews */}
            {replyPhotos.length > 0 && (
              <View className="flex-row items-center space-x-2 mb-2">
                {replyPhotos.map((p, idx) => (
                  <View
                    key={idx}
                    className="relative w-14 h-14 rounded-xl overflow-hidden border border-border"
                  >
                    <Image source={{ uri: p.uri }} contentFit="cover" className="w-full h-full" />
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => setReplyPhotos((prev) => prev.filter((_, i) => i !== idx))}
                      className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-black/70 items-center justify-center"
                    >
                      <X size={10} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            <View className="flex-row items-center space-x-2">
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={showReplyPhotoPicker}
                className="w-10 h-10 rounded-full bg-surface-subtle border border-border items-center justify-center"
                accessibilityLabel="Attach photo"
              >
                <Camera size={18} color="#2563EB" />
              </TouchableOpacity>

              <TextInput
                placeholder="Ask follow-up or reply..."
                placeholderTextColor="#9CA3AF"
                value={replyText}
                onChangeText={setReplyText}
                multiline
                className="flex-1 bg-surface-subtle border border-border rounded-2xl px-3.5 py-2.5 text-body text-ink max-h-24"
              />

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={handleSendReply}
                disabled={isSending || (!replyText.trim() && replyPhotos.length === 0)}
                className={`w-10 h-10 rounded-full items-center justify-center ${
                  !replyText.trim() && replyPhotos.length === 0
                    ? 'bg-border opacity-50'
                    : 'bg-primary'
                }`}
                accessibilityLabel="Send reply"
              >
                {isSending ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Send size={16} color="#FFFFFF" />
                )}
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View className="p-3 bg-surface border-t border-border items-center">
            <Text className="text-caption text-ink-muted">
              This doubt has been marked as resolved.
            </Text>
          </View>
        )}
      </KeyboardAvoidingView>

      {/* Full Screen Zoomable Image Modal */}
      <ImageViewerModal
        visible={Boolean(viewerImageUrl)}
        imageUrl={viewerImageUrl}
        onClose={() => setViewerImageUrl(null)}
        title="Doubt Photo"
      />
    </Screen>
  );
}
