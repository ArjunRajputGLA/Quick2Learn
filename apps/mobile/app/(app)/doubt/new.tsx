import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
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

interface SelectedPhoto {
  uri: string;
  width: number;
  height: number;
  name: string;
}

export default function AskDoubtScreen() {
  const router = useRouter();
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

  const subjects = React.useMemo(() => {
    if (!classesData?.classes) return [];
    const map = new Map<string, { id: string; name: string; slug: string }>();
    for (const c of classesData.classes) {
      for (const s of c.subjects) {
        if (!map.has(s.id)) map.set(s.id, s);
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

  return (
    <Screen
      scrollable={false}
      header={<AppHeader title="Ask a Doubt" showBack />}
    >
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Context Pill Banner if asked from lecture or test */}
        {initialSourceType === 'lecture' && params.lectureTitle ? (
          <View className="bg-indigo-50 p-3.5 rounded-2xl border border-indigo-200 mb-4 flex-row items-center">
            <Video size={18} color="#4F46E5" />
            <View className="ml-2.5 flex-1">
              <Text className="text-caption font-bold text-indigo-900">
                Context: Lecture Clip
              </Text>
              <Text className="text-small text-indigo-800" numberOfLines={1}>
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
          <View className="bg-emerald-50 p-3.5 rounded-2xl border border-emerald-200 mb-4 flex-row items-center">
            <FileQuestion size={18} color="#059669" />
            <View className="ml-2.5 flex-1">
              <Text className="text-caption font-bold text-emerald-900">
                Context: Test Solution
              </Text>
              <Text className="text-small text-emerald-800" numberOfLines={1}>
                {params.testTitle
                  ? `${params.testTitle} — Question ${params.questionPosition || ''}`
                  : `Question ${params.questionPosition || ''}`}
              </Text>
            </View>
          </View>
        ) : null}

        {/* 1. Subject Selector */}
        <View className="mb-4">
          <Text className="text-caption font-bold uppercase tracking-wider text-ink-muted mb-1.5">
            Subject *
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="flex-row space-x-2"
          >
            {subjects.map((sub) => {
              const isSelected = sub.id === selectedSubjectId;
              return (
                <TouchableOpacity
                  key={sub.id}
                  activeOpacity={0.7}
                  onPress={() => setSelectedSubjectId(sub.id)}
                  className={`py-2 px-3.5 rounded-xl border ${
                    isSelected
                      ? 'bg-primary border-primary'
                      : 'bg-surface border-border'
                  }`}
                >
                  <Text
                    className={`text-small font-semibold ${
                      isSelected ? 'text-white' : 'text-ink'
                    }`}
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
          <View className="mb-4">
            <Text className="text-caption font-bold uppercase tracking-wider text-ink-muted mb-1.5">
              Chapter (Optional)
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="flex-row space-x-2"
            >
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setSelectedChapterId('')}
                className={`py-1.5 px-3 rounded-lg border ${
                  !selectedChapterId
                    ? 'bg-primary border-primary'
                    : 'bg-surface border-border'
                }`}
              >
                <Text
                  className={`text-caption font-semibold ${
                    !selectedChapterId ? 'text-white' : 'text-ink-muted'
                  }`}
                >
                  General
                </Text>
              </TouchableOpacity>

              {chapters.map((ch) => {
                const isSelected = ch.id === selectedChapterId;
                return (
                  <TouchableOpacity
                    key={ch.id}
                    activeOpacity={0.7}
                    onPress={() => setSelectedChapterId(ch.id)}
                    className={`py-1.5 px-3 rounded-lg border ${
                      isSelected
                        ? 'bg-primary border-primary'
                        : 'bg-surface border-border'
                    }`}
                  >
                    <Text
                      numberOfLines={1}
                      className={`text-caption font-semibold max-w-[160px] ${
                        isSelected ? 'text-white' : 'text-ink-muted'
                      }`}
                    >
                      {ch.title}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* 3. Doubt Title */}
        <View className="mb-4">
          <Text className="text-caption font-bold uppercase tracking-wider text-ink-muted mb-1.5">
            Doubt Title *
          </Text>
          <TextInput
            placeholder="e.g. Step 3 in quadratic formula proof"
            placeholderTextColor="#9CA3AF"
            value={title}
            onChangeText={setTitle}
            maxLength={150}
            className="bg-surface border border-border rounded-xl px-3.5 py-3 text-body text-ink"
          />
        </View>

        {/* 4. Question Description */}
        <View className="mb-4">
          <Text className="text-caption font-bold uppercase tracking-wider text-ink-muted mb-1.5">
            Describe Your Doubt *
          </Text>
          <TextInput
            placeholder="Explain where you got stuck or what step isn't clear..."
            placeholderTextColor="#9CA3AF"
            value={body}
            onChangeText={setBody}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            className="bg-surface border border-border rounded-xl p-3.5 text-body text-ink min-h-[110px]"
          />
        </View>

        {/* 5. Photos Section (Camera or Gallery, cropped & compressed <= 1600 px) */}
        <View className="mb-6">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-caption font-bold uppercase tracking-wider text-ink-muted">
              Attach Photos ({photos.length}/3)
            </Text>
            <Text className="text-[11px] text-ink-muted">
              Compressed to ≤ 1600 px
            </Text>
          </View>

          {/* Photo thumbnails */}
          <View className="flex-row items-center flex-wrap gap-3">
            {photos.map((p, idx) => (
              <View
                key={idx}
                className="relative w-24 h-24 rounded-2xl overflow-hidden border border-border bg-surface-subtle"
              >
                <Image
                  source={{ uri: p.uri }}
                  contentFit="cover"
                  className="w-full h-full"
                />
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => handleRemovePhoto(idx)}
                  className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/70 items-center justify-center"
                  accessibilityLabel="Remove photo"
                >
                  <X size={14} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            ))}

            {photos.length < 3 && (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={showPhotoPickerOptions}
                className="w-24 h-24 rounded-2xl border-2 border-dashed border-primary/40 bg-primary-soft/30 items-center justify-center p-2"
                accessibilityLabel="Add doubt photo"
              >
                <Camera size={22} color="#2563EB" />
                <Text className="text-[11px] font-bold text-primary mt-1 text-center">
                  Add Photo
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Submit Button */}
        <Button
          variant="primary"
          size="lg"
          onPress={handleSubmit}
          loading={isSubmitting}
          disabled={isSubmitting}
          icon={<Upload size={18} color="#FFFFFF" />}
        >
          {uploadStatus || 'Send Doubt to Dinesh Sir'}
        </Button>
      </ScrollView>
    </Screen>
  );
}
