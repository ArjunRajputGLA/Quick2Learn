import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { FlashList } from '@shopify/flash-list';
import { Search, BookOpen, Sparkles, ChevronRight } from 'lucide-react-native';
import { Screen } from '../../../src/components/ui/Screen';
import { AppHeader } from '../../../src/components/ui/AppHeader';
import { SegmentedControl } from '../../../src/components/ui/SegmentedControl';
import { Chip } from '../../../src/components/ui/Chip';
import { ProgressRing } from '../../../src/components/ui/ProgressRing';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { Skeleton } from '../../../src/components/ui/Skeleton';
import {
  useMe,
  useLearnClasses,
  useLearnChapters,
} from '../../../src/api/hooks';
import type { LearnChapterItem } from '@quick2learn/shared';

const CLASS_OPTIONS = ['Class 9', 'Class 10', 'Class 11', 'Class 12'];
const CLASS_VALUES = [9, 10, 11, 12];

export default function LearnScreen() {
  const router = useRouter();
  const { data: me } = useMe();
  const { data: classesData, isLoading: isClassesLoading } = useLearnClasses();

  // Initialize selected class level from user's profile
  const userClass = me?.profile?.classLevel || 10;
  const initialClassIndex = Math.max(0, CLASS_VALUES.indexOf(userClass));
  const [selectedClassIndex, setSelectedClassIndex] = useState(
    initialClassIndex !== -1 ? initialClassIndex : 1
  );

  const selectedClassLevel = CLASS_VALUES[selectedClassIndex] || 10;

  // Find subjects available for this class level
  const currentClassData = useMemo(() => {
    return classesData?.classes.find(
      (c) => c.classLevel === selectedClassLevel
    );
  }, [classesData, selectedClassLevel]);

  const subjects = useMemo(() => {
    if (currentClassData && currentClassData.subjects.length > 0) {
      return currentClassData.subjects;
    }
    return [
      { id: '1', name: 'Mathematics', slug: 'mathematics', lectureCount: 0 },
      { id: '2', name: 'Physics', slug: 'physics', lectureCount: 0 },
      { id: '3', name: 'Chemistry', slug: 'chemistry', lectureCount: 0 },
      { id: '4', name: 'Biology', slug: 'biology', lectureCount: 0 },
    ];
  }, [currentClassData]);

  const [selectedSubjectSlug, setSelectedSubjectSlug] = useState('mathematics');

  // Verify subject slug exists in current class subjects
  useEffect(() => {
    if (subjects.length > 0 && !subjects.some((s) => s.slug === selectedSubjectSlug)) {
      setSelectedSubjectSlug(subjects[0]?.slug || 'mathematics');
    }
  }, [subjects, selectedSubjectSlug]);

  const {
    data: chaptersData,
    isLoading: isChaptersLoading,
    isRefetching,
    refetch,
  } = useLearnChapters(selectedClassLevel, selectedSubjectSlug);

  const chapters = chaptersData?.chapters || [];

  const handleOpenChapter = (chapterId: string) => {
    router.push(`/chapter/${chapterId}` as any);
  };

  return (
    <Screen
      scrollable={false}
      header={
        <AppHeader
          title="Learn"
          rightActions={
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => router.push('/(app)/search' as any)}
              className="w-12 h-12 -mr-2 items-center justify-center rounded-full active:bg-surface-subtle"
              accessibilityRole="button"
              accessibilityLabel="Search lectures and notes"
            >
              <Search size={22} color="#1F2937" />
            </TouchableOpacity>
          }
        />
      }
    >
      <View className="flex-1 bg-surface-subtle">
        {/* 1. Class Switcher at top (defaults to student's class) */}
        <View className="p-3 bg-surface border-b border-border">
          <SegmentedControl
            options={CLASS_OPTIONS}
            selectedIndex={selectedClassIndex}
            onChange={setSelectedClassIndex}
          />

          {/* 2. Subject Filter Chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingTop: 10, paddingHorizontal: 2 }}
          >
            {subjects.map((sub) => {
              const isSelected = selectedSubjectSlug === sub.slug;
              return (
                <View key={sub.id} className="mr-2">
                  <Chip
                    label={sub.name}
                    selected={isSelected}
                    onPress={() => setSelectedSubjectSlug(sub.slug)}
                  />
                </View>
              );
            })}
          </ScrollView>
        </View>

        {/* 3. Chapter List using FlashList (high-performance for 300+ items) */}
        {isChaptersLoading && chapters.length === 0 ? (
          <View className="p-4 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <View
                key={i}
                className="bg-surface rounded-2xl p-4 border border-border flex-row items-center justify-between"
              >
                <View className="flex-1 mr-3">
                  <Skeleton width={160} height={20} borderRadius={6} className="mb-2" />
                  <Skeleton width={120} height={14} borderRadius={4} />
                </View>
                <Skeleton width={48} height={48} borderRadius={24} />
              </View>
            ))}
          </View>
        ) : chapters.length === 0 ? (
          <View className="flex-1 justify-center p-6">
            <EmptyState
              title="No chapters available"
              description={`No chapters found for Class ${selectedClassLevel} ${chaptersData?.subject.name || 'this subject'}.`}
              actionLabel="Refresh"
              onAction={() => refetch()}
            />
          </View>
        ) : (
          <View className="flex-1">
            <FlashList
              data={chapters}
              contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
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
              keyExtractor={(item: LearnChapterItem) => item.id}
              renderItem={({ item }: { item: LearnChapterItem }) => (
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => handleOpenChapter(item.id)}
                  className="bg-surface rounded-2xl p-4 border border-border mb-3 shadow-xs flex-row items-center justify-between active:bg-surface-subtle"
                >
                  <View className="flex-1 mr-3 justify-center">
                    <View className="flex-row items-center mb-1">
                      <View className="px-2 py-0.5 rounded bg-primary-soft border border-primary/20 mr-2">
                        <Text className="text-[11px] font-bold text-primary">
                          Ch {item.number}
                        </Text>
                      </View>
                      <Text
                        className="text-body font-bold text-ink flex-1"
                        numberOfLines={1}
                      >
                        {item.title}
                      </Text>
                    </View>

                    {/* e.g. "4 of 9 lectures · 3 h 20 m" */}
                    <Text className="text-small text-ink-muted">
                      {item.completedLecturesCount} of {item.lectureCount} lectures •{' '}
                      {item.totalDurationFormatted}
                    </Text>
                  </View>

                  {/* ProgressRing */}
                  <View className="items-center justify-center">
                    <ProgressRing
                      progress={item.progressPercentage}
                      size={48}
                      strokeWidth={4.5}
                      color="#2563EB"
                      trackColor="#E5E7EB"
                      showText
                    />
                  </View>
                </TouchableOpacity>
              )}
            />
          </View>
        )}
      </View>
    </Screen>
  );
}
