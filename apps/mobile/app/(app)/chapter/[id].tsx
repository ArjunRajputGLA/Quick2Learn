import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  Play,
  FileText,
  BookOpen,
  Sparkles,
  ChevronRight,
  GraduationCap,
} from 'lucide-react-native';
import { Screen } from '../../../src/components/ui/Screen';
import { AppHeader } from '../../../src/components/ui/AppHeader';
import { Button } from '../../../src/components/ui/Button';
import { Badge } from '../../../src/components/ui/Badge';
import { LectureRow } from '../../../src/components/composite/LectureRow';
import { PdfRow } from '../../../src/components/composite/PdfRow';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { useChapterDetail, useAvailableTests } from '../../../src/api/hooks';
import { HelpCircle, Award, CheckCircle2 } from 'lucide-react-native';

export default function ChapterDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: chapter, isLoading, isRefetching, refetch } = useChapterDetail(id || '');
  const { data: testsData } = useAvailableTests({ chapterId: id || undefined });

  const lectures = chapter?.lectures || [];
  const notes = chapter?.notes || [];
  const practiceTests = testsData?.tests || [];
  const continueLectureId = chapter?.continueLectureId;

  const handleContinue = () => {
    if (continueLectureId) {
      router.push(`/lecture/${continueLectureId}` as any);
    } else if (lectures.length > 0) {
      router.push(`/lecture/${lectures[0]!.id}` as any);
    }
  };

  const handleOpenNote = (url: string) => {
    Linking.openURL(url).catch((err) => {
      console.warn('Could not open PDF note:', err);
    });
  };

  return (
    <Screen
      scrollable={false}
      header={
        <AppHeader
          title={chapter?.title || 'Chapter Details'}
          subtitle={chapter ? `Class ${chapter.classLevel} • ${chapter.subjectName}` : undefined}
          showBack
        />
      }
    >
      {isLoading && !chapter ? (
        <View className="flex-1 items-center justify-center py-12">
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      ) : !chapter ? (
        <View className="flex-1 justify-center p-6">
          <EmptyState
            title="Chapter not found"
            description="The requested chapter could not be found or has been moved."
            actionLabel="Go Back"
            onAction={() => router.back()}
          />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: 48 }}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={() => {
                void refetch();
              }}
              colors={['#2563EB']}
              tintColor="#2563EB"
            />
          }
          showsVerticalScrollIndicator={false}
        >
          {/* Chapter Hero Card */}
          <View className="bg-surface rounded-2xl p-5 border border-border mb-5 shadow-xs">
            <View className="flex-row items-center space-x-2 mb-2">
              <Badge
                label={`Chapter ${chapter.number}`}
                variant="primary"
                size="sm"
              />
              <Badge
                label={`Class ${chapter.classLevel}`}
                variant="neutral"
                size="sm"
              />
            </View>

            <Text className="text-h2 font-bold text-ink mb-1.5 leading-snug">
              {chapter.title}
            </Text>
            <Text className="text-small text-ink-muted mb-4">
              {chapter.subjectName} • {lectures.length} Video Lectures
            </Text>

            {/* "Continue" Button: jumps to the first unfinished lecture */}
            {lectures.length > 0 ? (
              <Button
                variant="primary"
                size="lg"
                onPress={handleContinue}
                icon={<Play size={18} color="#FFFFFF" />}
              >
                Continue Learning
              </Button>
            ) : null}
          </View>

          {/* Section 1: Lectures */}
          <View className="mb-6">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-h3 font-bold text-ink">
                Video Lectures ({lectures.length})
              </Text>
            </View>

            {lectures.length === 0 ? (
              <View className="bg-surface rounded-2xl p-6 border border-border items-center">
                <Text className="text-body text-ink-muted text-center">
                  Lectures for this chapter will be uploaded soon.
                </Text>
              </View>
            ) : (
              <View className="bg-surface rounded-2xl border border-border overflow-hidden divide-y divide-border/60 shadow-xs">
                {lectures.map((lec) => (
                  <LectureRow
                    key={lec.id}
                    title={lec.title}
                    duration={lec.durationFormatted}
                    thumbnailUrl={lec.thumbnailUrl ?? undefined}
                    watched={lec.isCompleted}
                    progressPercentage={lec.progressPercent}
                    onPress={() => router.push(lec.route as any)}
                  />
                ))}
              </View>
            )}
          </View>

          {/* Section 2: Chapter Practice Tests */}
          {practiceTests.length > 0 ? (
            <View className="mb-6">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-h3 font-bold text-ink">
                  Practice Tests ({practiceTests.length})
                </Text>
                <Badge label="FREE PRACTICE" variant="accent" size="sm" />
              </View>

              <View className="space-y-3">
                {practiceTests.map((t) => {
                  const isCompleted =
                    t.latestAttemptStatus === 'submitted' ||
                    t.latestAttemptStatus === 'auto_submitted';

                  return (
                    <TouchableOpacity
                      key={t.id}
                      activeOpacity={0.8}
                      onPress={() => router.push(`/test/${t.id}` as any)}
                      className="bg-surface rounded-2xl p-4 border border-border shadow-xs"
                    >
                      <View className="flex-row items-center justify-between mb-1.5">
                        <Badge
                          label={isCompleted ? 'COMPLETED' : 'PRACTICE TEST'}
                          variant={isCompleted ? 'success' : 'primary'}
                          size="sm"
                        />
                        <Text className="text-caption font-semibold text-ink-muted">
                          {t.totalMarks} Marks • {t.durationMinutes} Mins
                        </Text>
                      </View>

                      <Text className="text-body font-bold text-ink mb-1">
                        {t.title}
                      </Text>

                      <View className="flex-row items-center justify-between pt-2 border-t border-border/50 mt-1">
                        <View className="flex-row items-center">
                          <HelpCircle size={14} color="#6B7280" />
                          <Text className="text-caption text-ink-muted ml-1">
                            {t.questionCount || 0} Questions
                          </Text>
                        </View>

                        {isCompleted && t.myBestScore !== null && t.myBestScore !== undefined ? (
                          <View className="flex-row items-center">
                            <CheckCircle2 size={14} color="#059669" />
                            <Text className="text-caption font-bold text-emerald-700 ml-1">
                              Best: {t.myBestScore}/{t.totalMarks}
                            </Text>
                          </View>
                        ) : (
                          <Text className="text-caption font-bold text-primary">
                            {t.latestAttemptStatus === 'in_progress' ? 'Resume Test →' : 'Start Practice →'}
                          </Text>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ) : null}

          {/* Section 3: Notes & Formula Sheets */}
          <View>
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-h3 font-bold text-ink">
                Notes & Formula Sheets ({notes.length})
              </Text>
            </View>

            {notes.length === 0 ? (
              <View className="bg-surface rounded-2xl p-6 border border-border items-center">
                <Text className="text-body text-ink-muted text-center">
                  Free revision notes and formula sheets for this chapter will appear here.
                </Text>
              </View>
            ) : (
              <View className="bg-surface rounded-2xl border border-border overflow-hidden divide-y divide-border/60 shadow-xs">
                {notes.map((note) => (
                  <PdfRow
                    key={note.id}
                    title={note.title}
                    size={note.fileSize || 'PDF Document'}
                    onPress={() => handleOpenNote(note.fileUrl)}
                  />
                ))}
              </View>
            )}
          </View>
        </ScrollView>
      )}
    </Screen>
  );
}
