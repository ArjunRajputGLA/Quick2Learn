import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import {
  BookOpen,
  PlayCircle,
  FileText,
  ChevronRight,
  CheckCircle2,
  FolderOpen,
} from 'lucide-react-native';
import { Badge } from '../ui/Badge';
import { Chip } from '../ui/Chip';
import { ProgressBar } from '../ui/ProgressBar';
import { Skeleton } from '../ui/Skeleton';
import { useBatchContent } from '../../api/hooks';
import type { BatchDetailResponse, BatchContentSubject, BatchContentChapter } from '@quick2learn/shared';

interface BatchContentSectionProps {
  batchId?: string;
  batchDetail?: BatchDetailResponse;
  isLoading: boolean;
}

export function BatchContentSection({
  batchId,
  batchDetail,
  isLoading,
}: BatchContentSectionProps) {
  const router = useRouter();
  const actualBatchId = batchId || batchDetail?.id || '';

  const {
    data: contentData,
    isLoading: isLoadingContent,
  } = useBatchContent(actualBatchId);

  const subjects: BatchContentSubject[] = (contentData as any)?.subjects || [];
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');

  const activeSubjectId =
    selectedSubjectId && subjects.some((s: BatchContentSubject) => s.id === selectedSubjectId)
      ? selectedSubjectId
      : subjects[0]?.id || '';

  const activeSubject = subjects.find((s: BatchContentSubject) => s.id === activeSubjectId) || subjects[0];
  const chapters: BatchContentChapter[] = activeSubject?.chapters || [];

  if ((isLoading || isLoadingContent) && !contentData) {
    return (
      <View className="space-y-4">
        <Skeleton width="100%" height={44} borderRadius={12} />
        <Skeleton width="100%" height={90} borderRadius={16} />
        <Skeleton width="100%" height={100} borderRadius={16} />
        <Skeleton width="100%" height={100} borderRadius={16} />
      </View>
    );
  }

  // Calculate totals across all subjects
  const totalChapters = subjects.reduce((sum: number, s: BatchContentSubject) => sum + s.chapters.length, 0);
  const totalLectures = subjects.reduce(
    (sum: number, s: BatchContentSubject) => sum + s.chapters.reduce((csum: number, c: BatchContentChapter) => csum + c.lecturesCount, 0),
    0
  );
  const totalNotes = subjects.reduce(
    (sum: number, s: BatchContentSubject) => sum + s.chapters.reduce((csum: number, c: BatchContentChapter) => csum + c.notesCount, 0),
    0
  );

  return (
    <View className="space-y-4">
      {/* Subjects Switcher Chips */}
      {subjects.length > 1 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="flex-row space-x-2"
        >
          {subjects.map((sub: BatchContentSubject) => {
            const isSelected = sub.id === activeSubjectId;
            return (
              <Chip
                key={sub.id}
                label={sub.name}
                selected={isSelected}
                onPress={() => setSelectedSubjectId(sub.id)}
              />
            );
          })}
        </ScrollView>
      )}

      {/* Curriculum Summary Card */}
      <View className="p-4 rounded-2xl bg-surface border border-border flex-row items-center justify-between shadow-2xs">
        <View className="flex-1 mr-3">
          <Text className="text-body font-bold text-ink">
            {activeSubject ? activeSubject.name : 'Batch Curriculum'}
          </Text>
          <Text className="text-caption text-ink-muted mt-0.5">
            {totalChapters} {totalChapters === 1 ? 'Chapter' : 'Chapters'} · {totalLectures} Lectures · {totalNotes} Notes
          </Text>
        </View>
        <BookOpen size={24} color="#2563EB" />
      </View>

      {/* Empty State if no chapters */}
      {chapters.length === 0 ? (
        <View className="p-8 rounded-2xl bg-surface border border-border items-center justify-center text-center space-y-2">
          <Image
            source={require('../../../assets/empty material.png')}
            style={{ width: 140, height: 140, marginBottom: 8 }}
            contentFit="contain"
          />
          <Text className="text-body font-bold text-ink text-center">
            No Study Material Available Yet
          </Text>
          <Text className="text-caption text-ink-muted text-center max-w-[260px]">
            Study materials and video lectures for this subject are being prepared by your teachers.
          </Text>
        </View>
      ) : (
        /* Chapters List */
        <View className="space-y-3">
          {chapters.map((ch: BatchContentChapter, idx: number) => (
            <TouchableOpacity
              key={ch.id}
              onPress={() => {
                router.push({
                  pathname: `/(app)/batch/${actualBatchId}/chapter/${ch.id}` as any,
                  params: {
                    batchTitle: batchDetail?.title || 'Batch',
                    subjectName: activeSubject?.name || 'Subject',
                  },
                });
              }}
              accessibilityRole="button"
              className="p-4 rounded-2xl bg-surface border border-border shadow-2xs space-y-3"
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center space-x-2 flex-1 mr-2">
                  <View
                    className={`w-7 h-7 rounded-full items-center justify-center ${
                      ch.completed ? 'bg-emerald-100' : 'bg-primary/10'
                    }`}
                  >
                    {ch.completed ? (
                      <CheckCircle2 size={16} color="#059669" />
                    ) : (
                      <Text className="text-caption font-bold text-primary">
                        {ch.chapterNumber || idx + 1}
                      </Text>
                    )}
                  </View>
                  <Text
                    className="text-body font-bold text-ink flex-1"
                    numberOfLines={1}
                  >
                    {ch.title}
                  </Text>
                </View>

                <ChevronRight size={16} color="#9CA3AF" />
              </View>

              <View className="flex-row items-center justify-between text-caption text-ink-muted">
                <View className="flex-row items-center space-x-3">
                  <View className="flex-row items-center">
                    <PlayCircle size={14} color="#6B7280" />
                    <Text className="text-caption text-ink-muted ml-1">
                      {ch.lecturesCount} {ch.lecturesCount === 1 ? 'Lecture' : 'Lectures'}
                    </Text>
                  </View>
                  <View className="flex-row items-center">
                    <FileText size={14} color="#6B7280" />
                    <Text className="text-caption text-ink-muted ml-1">
                      {ch.notesCount} {ch.notesCount === 1 ? 'Note' : 'Notes'}
                    </Text>
                  </View>
                </View>

                <Text className="text-caption font-bold text-primary">
                  {ch.progress}%
                </Text>
              </View>

              <ProgressBar
                progress={ch.progress / 100}
                height={4}
                color={ch.completed ? '#059669' : '#2563EB'}
              />
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}
