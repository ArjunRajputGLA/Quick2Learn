import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  ActionSheetIOS,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import {
  HelpCircle,
  Camera,
  Image as ImageIcon,
  X,
  Upload,
  Video,
  CheckCircle2,
  AlertCircle,
  FileQuestion,
  ChevronDown,
  Sparkles,
  Calculator,
  Atom,
  BookOpen,
  Send,
  Info,
} from 'lucide-react-native';
import { Screen } from '../../../src/components/ui/Screen';
import { AppHeader } from '../../../src/components/ui/AppHeader';
import { Button } from '../../../src/components/ui/Button';
import { Badge } from '../../../src/components/ui/Badge';
import {
  useLearnClasses,
  useLearnChapters,
  useCreateDoubt,
  usePresignedDoubtUploads,
} from '../../../src/api/hooks';
import { analytics } from '../../../src/lib/analytics';
import { colors, radii } from '@quick2learn/shared';

interface SelectedPhoto {
  uri: string;
  width: number;
  height: number;
  name: string;
}

export default function AskDoubtScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    sourceType?: 'lecture' | 'test_question' | 'general';
    sourceId?: string;
    timestampSeconds?: string;
    subjectId?: string;
    chapterId?: string;
    questionId?: string;
    testId?: string;
    testTitle?: string;
    lectureTitle?: string;
    questionPosition?: string;
  }>();

  // Resolve source type & IDs
  const initialSourceType =
    params.sourceType ||
    (params.questionId ? 'test_question' : params.timestampSeconds ? 'lecture' : 'general');
  const initialSourceId = params.sourceId || params.questionId || '';
  const initialTimestampSeconds = params.timestampSeconds
    ? parseInt(params.timestampSeconds, 10)
    : undefined;

  // Subjects & Chapters query
  const { data: classesData, isLoading: isLoadingClasses } = useLearnClasses();

  // Deduplicate subjects across multiple classes by slug/name
  const subjects = useMemo(() => {
    if (!classesData?.classes) return [];
    const map = new Map<string, { id: string; name: string; slug: string }>();
    for (const c of classesData.classes) {
      for (const s of c.subjects) {
        const key = (s.slug || s.name).toLowerCase();
        if (!map.has(key)) {
          map.set(key, s);
        }
      }
    }
    return Array.from(map.values());
  }, [classesData?.classes]);

  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(
    params.subjectId || (subjects.length > 0 ? subjects[0]!.id : '')
  );

  // Set default subject once subjects load
  useEffect(() => {
    if (!selectedSubjectId && subjects.length > 0) {
      setSelectedSubjectId(params.subjectId || subjects[0]!.id);
    }
  }, [subjects, selectedSubjectId, params.subjectId]);

  // Find current subject
  const currentSubject = subjects.find((s) => s.id === selectedSubjectId);
  const subjectSlug = currentSubject?.slug || 'mathematics';

  // Chapters for selected subject
  const { data: chaptersData } = useLearnChapters(10, subjectSlug);
  const chapters = chaptersData?.chapters || [];

  const [selectedChapterId, setSelectedChapterId] = useState<string>(
    params.chapterId || ''
  );

  // Form Fields
  const [title, setTitle] = useState(
    params.questionPosition
      ? `Question ${params.questionPosition} Doubt`
      : params.lectureTitle && initialTimestampSeconds !== undefined
      ? `Doubt at ${Math.floor(initialTimestampSeconds / 60)}:${(initialTimestampSeconds % 60)
          .toString()
          .padStart(2, '0')} in ${params.lectureTitle}`
      : ''
  );
  const [body, setBody] = useState('');
  const [photos, setPhotos] = useState<SelectedPhoto[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [isTitleFocused, setIsTitleFocused] = useState(false);
  const [isBodyFocused, setIsBodyFocused] = useState(false);

  const createDoubtMutation = useCreateDoubt();
  const presignedUploadsMutation = usePresignedDoubtUploads();

  // Crop & Compress photo to <= 1600 px
  const processAndAddImage = async (uri: string, origWidth?: number, origHeight?: number) => {
    try {
      const w = origWidth || 2000;
      const h = origHeight || 2000;

      const actions: ImageManipulator.Action[] = [];
      if (w > 1600 || h > 1600) {
        if (w >= h) {
          actions.push({ resize: { width: 1600 } });
        } else {
          actions.push({ resize: { height: 1600 } });
        }
      }

      const manipResult = await ImageManipulator.manipulateAsync(
        uri,
        actions,
        {
          compress: 0.8,
          format: ImageManipulator.SaveFormat.JPEG,
        }
      );

      setPhotos((prev) => [
        ...prev,
        {
          uri: manipResult.uri,
          width: manipResult.width,
          height: manipResult.height,
          name: `doubt-photo-${Date.now()}.jpg`,
        },
      ]);
    } catch (err) {
      console.error('Image processing error:', err);
      Alert.alert('Image Error', 'Failed to compress photo.');
    }
  };

  // Pick from Camera
  const handleLaunchCamera = async () => {
    if (photos.length >= 3) {
      Alert.alert('Photo Limit', 'You can attach up to 3 photos per doubt.');
      return;
    }

    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Camera permission is required to take a photo.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.85,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      await processAndAddImage(asset.uri, asset.width, asset.height);
    }
  };

  // Pick from Gallery
  const handleLaunchGallery = async () => {
    if (photos.length >= 3) {
      Alert.alert('Photo Limit', 'You can attach up to 3 photos per doubt.');
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Gallery permission is required to select photos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      quality: 0.85,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      await processAndAddImage(asset.uri, asset.width, asset.height);
    }
  };

  const showPhotoPickerOptions = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Take Photo', 'Choose from Gallery'],
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) handleLaunchCamera();
          else if (buttonIndex === 2) handleLaunchGallery();
        }
      );
    } else {
      Alert.alert(
        'Add Photo',
        'Choose source for your doubt photo:',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Take Photo', onPress: handleLaunchCamera },
          { text: 'Choose from Gallery', onPress: handleLaunchGallery },
        ],
        { cancelable: true }
      );
    }
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  // Submit Doubt
  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('Required Field', 'Please enter a title or question summary.');
      return;
    }
    if (!body.trim()) {
      Alert.alert('Required Field', 'Please describe your doubt in detail.');
      return;
    }
    if (!selectedSubjectId && subjects.length > 0) {
      Alert.alert('Required Field', 'Please select a subject.');
      return;
    }

    setIsSubmitting(true);
    setUploadStatus('Preparing upload...');

    try {
      // 1. Upload photos to S3 via presigned PUT if any
      const uploadedKeys: string[] = [];

      if (photos.length > 0) {
        setUploadStatus(`Authorizing ${photos.length} photo(s)...`);
        const presignRes = await presignedUploadsMutation.mutateAsync({
          files: photos.map((p) => ({
            filename: p.name,
            contentType: 'image/jpeg',
          })),
        });

        for (let i = 0; i < photos.length; i++) {
          const photo = photos[i]!;
          const uploadInfo = presignRes.uploads[i]!;
          setUploadStatus(`Uploading photo ${i + 1} of ${photos.length}...`);

          const response = await fetch(photo.uri);
          const blob = await response.blob();

          const putRes = await fetch(uploadInfo.uploadUrl, {
            method: 'PUT',
            headers: {
              'Content-Type': 'image/jpeg',
            },
            body: blob,
          });

          if (!putRes.ok) {
            throw new Error(`Failed to upload photo ${i + 1}`);
          }

          uploadedKeys.push(uploadInfo.key);
        }
      }

      // 2. Create Doubt record
      setUploadStatus('Sending doubt to Dinesh Sir...');
      const doubtRes = await createDoubtMutation.mutateAsync({
        subjectId: selectedSubjectId || subjects[0]!.id,
        chapterId: selectedChapterId || undefined,
        sourceType: initialSourceType,
        sourceId: initialSourceId || undefined,
        timestampSeconds: initialTimestampSeconds,
        title: title.trim(),
        body: body.trim(),
        attachmentKeys: uploadedKeys,
      });

      analytics.track('doubt_created', {
        doubtId: doubtRes.doubt.id,
        subject: selectedSubjectId ? 'Subject' : 'Mathematics',
        classLevel: classesData?.classes?.[0]?.classLevel || 10,
        hasAttachment: uploadedKeys.length > 0,
      });

      Alert.alert(
        'Doubt Submitted! 🎓',
        'Dinesh Sir has been notified and will review your doubt shortly.',
        [
          {
            text: 'View Thread',
            onPress: () => {
              router.replace(`/(app)/doubt/${doubtRes.doubt.id}` as any);
            },
          },
        ]
      );
    } catch (err: any) {
      console.error('Submit doubt error:', err);
      const msg =
        err?.message ||
        'Unable to send doubt. Please check your connection and try again.';
      Alert.alert('Could Not Submit Doubt', msg);
    } finally {
      setIsSubmitting(false);
      setUploadStatus('');
    }
  };

  const getSubjectIcon = (slugOrName: string, isSelected: boolean) => {
    const s = slugOrName.toLowerCase();
    const color = isSelected ? '#FFFFFF' : colors.primary;
    if (s.includes('math')) return <Calculator size={15} color={color} />;
    if (s.includes('scien') || s.includes('physic') || s.includes('chem')) return <Atom size={15} color={color} />;
    return <BookOpen size={15} color={color} />;
  };

  const isFormValid = title.trim().length > 0 && body.trim().length > 0;

  return (
    <Screen
      scrollable={false}
      header={<AppHeader title="Ask a Doubt" showBack />}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 6, paddingBottom: 110 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Context Pill Banner if asked from lecture or test */}
          {initialSourceType === 'lecture' && params.lectureTitle ? (
            <View
              style={{
                backgroundColor: '#EEF2FF',
                borderColor: '#C7D2FE',
                borderWidth: 1,
                borderRadius: 16,
                padding: 12,
                marginBottom: 14,
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: '#E0E7FF',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 10,
                }}
              >
                <Video size={16} color="#4F46E5" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#3730A3' }}>
                  Linked Lecture Clip
                </Text>
                <Text style={{ fontSize: 12.5, fontWeight: '600', color: '#1E1B4B' }} numberOfLines={1}>
                  {params.lectureTitle}
                  {initialTimestampSeconds !== undefined
                    ? ` @ ${Math.floor(initialTimestampSeconds / 60)}:${(
                        initialTimestampSeconds % 60
                      )
                        .toString()
                        .padStart(2, '0')}`
                    : ''}
                </Text>
              </View>
            </View>
          ) : initialSourceType === 'test_question' ? (
            <View
              style={{
                backgroundColor: '#ECFDF5',
                borderColor: '#A7F3D0',
                borderWidth: 1,
                borderRadius: 16,
                padding: 12,
                marginBottom: 14,
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: '#D1FAE5',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 10,
                }}
              >
                <FileQuestion size={16} color="#059669" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#065F46' }}>
                  Linked Assessment Question
                </Text>
                <Text style={{ fontSize: 12.5, fontWeight: '600', color: '#064E3B' }} numberOfLines={1}>
                  {params.testTitle
                    ? `${params.testTitle} — Question ${params.questionPosition || ''}`
                    : `Question ${params.questionPosition || ''}`}
                </Text>
              </View>
            </View>
          ) : null}

          {/* Teacher Reassurance Card */}
          <View
            style={{
              backgroundColor: '#EFF6FF',
              borderRadius: 16,
              borderWidth: 1,
              borderColor: '#BFDBFE',
              paddingHorizontal: 14,
              paddingVertical: 10,
              marginBottom: 14,
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: colors['primary-soft'],
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 10,
              }}
            >
              <Sparkles size={16} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#1E3A8A' }}>
                Direct Faculty Guidance
              </Text>
              <Text style={{ fontSize: 11, color: '#2563EB', lineHeight: 15 }}>
                Dinesh Sir reviews each doubt and explains steps in detail.
              </Text>
            </View>
          </View>

          {/* 1. Subject Selector */}
          <View style={{ marginBottom: 14 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: '700',
                  color: colors['ink-muted'],
                  textTransform: 'uppercase',
                  letterSpacing: 0.8,
                }}
              >
                Subject *
              </Text>
              <Text style={{ fontSize: 11, color: colors['ink-muted'] }}>
                Choose course
              </Text>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8 }}
            >
              {subjects.map((sub) => {
                const isSelected = sub.id === selectedSubjectId;
                return (
                  <TouchableOpacity
                    key={sub.id}
                    activeOpacity={0.75}
                    onPress={() => setSelectedSubjectId(sub.id)}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 6,
                      paddingVertical: 8,
                      paddingHorizontal: 14,
                      borderRadius: 14,
                      backgroundColor: isSelected ? colors.primary : colors.surface,
                      borderWidth: 1.5,
                      borderColor: isSelected ? colors.primary : colors.border,
                      shadowColor: isSelected ? colors.primary : '#000000',
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: isSelected ? 0.2 : 0.03,
                      shadowRadius: 3,
                      elevation: isSelected ? 2 : 1,
                    }}
                  >
                    {getSubjectIcon(sub.name, isSelected)}
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: isSelected ? '700' : '600',
                        color: isSelected ? '#FFFFFF' : colors.ink,
                      }}
                    >
                      {sub.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* 2. Chapter Selector (if chapters available) */}
          {chapters.length > 0 && (
            <View style={{ marginBottom: 14 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: '700',
                    color: colors['ink-muted'],
                    textTransform: 'uppercase',
                    letterSpacing: 0.8,
                  }}
                >
                  Chapter (Optional)
                </Text>
                <Text style={{ fontSize: 11, color: colors['ink-muted'] }}>
                  Filters by topic
                </Text>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 6 }}
              >
                <TouchableOpacity
                  activeOpacity={0.75}
                  onPress={() => setSelectedChapterId('')}
                  style={{
                    paddingVertical: 6,
                    paddingHorizontal: 12,
                    borderRadius: 10,
                    backgroundColor: !selectedChapterId ? '#EFF6FF' : colors.surface,
                    borderWidth: 1,
                    borderColor: !selectedChapterId ? colors.primary : colors.border,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: !selectedChapterId ? '700' : '500',
                      color: !selectedChapterId ? colors.primary : colors['ink-muted'],
                    }}
                  >
                    All Chapters
                  </Text>
                </TouchableOpacity>

                {chapters.map((ch) => {
                  const isSelected = ch.id === selectedChapterId;
                  return (
                    <TouchableOpacity
                      key={ch.id}
                      activeOpacity={0.75}
                      onPress={() => setSelectedChapterId(ch.id)}
                      style={{
                        paddingVertical: 6,
                        paddingHorizontal: 12,
                        borderRadius: 10,
                        backgroundColor: isSelected ? '#EFF6FF' : colors.surface,
                        borderWidth: 1,
                        borderColor: isSelected ? colors.primary : colors.border,
                      }}
                    >
                      <Text
                        numberOfLines={1}
                        style={{
                          fontSize: 12,
                          fontWeight: isSelected ? '700' : '500',
                          color: isSelected ? colors.primary : colors['ink-muted'],
                          maxWidth: 160,
                        }}
                      >
                        {ch.title}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* 3. Doubt Title Input Card */}
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 18,
              borderWidth: 1,
              borderColor: colors.border,
              padding: 14,
              marginBottom: 14,
              shadowColor: '#000000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.04,
              shadowRadius: 3,
              elevation: 1,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: '700',
                  color: colors['ink-muted'],
                  textTransform: 'uppercase',
                  letterSpacing: 0.8,
                }}
              >
                Doubt Title *
              </Text>
              <Text style={{ fontSize: 11, color: colors['ink-muted'] }}>
                {title.length}/150
              </Text>
            </View>

            <TextInput
              placeholder="e.g. Step 3 in quadratic formula proof"
              placeholderTextColor="#94A3B8"
              value={title}
              onChangeText={setTitle}
              maxLength={150}
              onFocus={() => setIsTitleFocused(true)}
              onBlur={() => setIsTitleFocused(false)}
              style={{
                backgroundColor: colors['surface-subtle'],
                borderWidth: 1.5,
                borderColor: isTitleFocused ? colors.primary : colors.border,
                borderRadius: 12,
                paddingHorizontal: 14,
                paddingVertical: 10,
                fontSize: 14.5,
                fontWeight: '600',
                color: colors.ink,
              }}
            />
          </View>

          {/* 4. Question Description Input Card */}
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 18,
              borderWidth: 1,
              borderColor: colors.border,
              padding: 14,
              marginBottom: 14,
              shadowColor: '#000000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.04,
              shadowRadius: 3,
              elevation: 1,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: '700',
                  color: colors['ink-muted'],
                  textTransform: 'uppercase',
                  letterSpacing: 0.8,
                }}
              >
                Describe Your Doubt *
              </Text>
              <Text style={{ fontSize: 11, color: colors['ink-muted'] }}>
                Detailed explanation
              </Text>
            </View>

            <TextInput
              placeholder="Explain where you got stuck or what step isn't clear..."
              placeholderTextColor="#94A3B8"
              value={body}
              onChangeText={setBody}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              onFocus={() => setIsBodyFocused(true)}
              onBlur={() => setIsBodyFocused(false)}
              style={{
                backgroundColor: colors['surface-subtle'],
                borderWidth: 1.5,
                borderColor: isBodyFocused ? colors.primary : colors.border,
                borderRadius: 12,
                paddingHorizontal: 14,
                paddingVertical: 12,
                fontSize: 14,
                color: colors.ink,
                minHeight: 110,
                lineHeight: 20,
              }}
            />
          </View>

          {/* 5. Photos Section */}
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 18,
              borderWidth: 1,
              borderColor: colors.border,
              padding: 14,
              marginBottom: 14,
              shadowColor: '#000000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.04,
              shadowRadius: 3,
              elevation: 1,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: '700',
                    color: colors['ink-muted'],
                    textTransform: 'uppercase',
                    letterSpacing: 0.8,
                  }}
                >
                  Attach Photos ({photos.length}/3)
                </Text>
              </View>
              <Text style={{ fontSize: 10.5, color: colors['ink-muted'] }}>
                Auto-compressed ≤ 1600 px
              </Text>
            </View>

            {/* Photo thumbnails grid */}
            <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
              {photos.map((p, idx) => (
                <View
                  key={idx}
                  style={{
                    position: 'relative',
                    width: 88,
                    height: 88,
                    borderRadius: 14,
                    overflow: 'hidden',
                    borderWidth: 1,
                    borderColor: colors.border,
                    backgroundColor: colors['surface-subtle'],
                  }}
                >
                  <Image
                    source={{ uri: p.uri }}
                    contentFit="cover"
                    style={{ width: '100%', height: '100%' }}
                  />
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => handleRemovePhoto(idx)}
                    style={{
                      position: 'absolute',
                      top: 4,
                      right: 4,
                      width: 22,
                      height: 22,
                      borderRadius: 11,
                      backgroundColor: 'rgba(15, 23, 42, 0.75)',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    accessibilityLabel="Remove photo"
                  >
                    <X size={13} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              ))}

              {photos.length < 3 && (
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={showPhotoPickerOptions}
                  style={{
                    width: 88,
                    height: 88,
                    borderRadius: 14,
                    borderWidth: 1.5,
                    borderStyle: 'dashed',
                    borderColor: colors.primary,
                    backgroundColor: colors['primary-soft'],
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 8,
                  }}
                  accessibilityLabel="Add doubt photo"
                >
                  <Camera size={24} color={colors.primary} />
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: '700',
                      color: colors.primary,
                      marginTop: 4,
                      textAlign: 'center',
                    }}
                  >
                    Add Photo
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </ScrollView>

        {/* Floating/Anchored Bottom Bar with Safe Area */}
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: colors.surface,
            borderTopWidth: 1,
            borderTopColor: colors.border,
            paddingHorizontal: 16,
            paddingTop: 12,
            paddingBottom: Math.max(insets.bottom, 12) + 4,
            shadowColor: '#000000',
            shadowOffset: { width: 0, height: -3 },
            shadowOpacity: 0.06,
            shadowRadius: 8,
            elevation: 8,
          }}
        >
          <Button
            variant="primary"
            size="lg"
            onPress={handleSubmit}
            loading={isSubmitting}
            disabled={!isFormValid || isSubmitting}
            icon={
              !isSubmitting && (
                <Send size={16} color="#FFFFFF" />
              )
            }
          >
            {uploadStatus || 'Send Doubt to Dinesh Sir'}
          </Button>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}
