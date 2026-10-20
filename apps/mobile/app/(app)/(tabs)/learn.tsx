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
import { colors, radii } from '@quick2learn/shared';

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
              style={{
                width: 34,
                height: 34,
                marginRight: -4,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 17,
                backgroundColor: colors['surface-subtle'],
              }}
              accessibilityRole="button"
              accessibilityLabel="Search lectures and notes"
            >
              <Search size={18} color={colors.ink} />
            </TouchableOpacity>
          }
        />
      }
    >
      <View style={{ flex: 1, backgroundColor: colors['surface-subtle'] }} className="flex-1 bg-surface-subtle">
        {/* 1. Class Switcher card */}
        <View
          style={{
            marginHorizontal: 12,
            marginBottom: 6,
            paddingHorizontal: 10,
            paddingVertical: 7,
            backgroundColor: colors.surface,
            borderRadius: radii.md,
            borderWidth: 1,
            borderColor: colors.border,
            elevation: 1,
            shadowColor: '#000000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.04,
            shadowRadius: 2,
          }}
          className="mx-3 mb-1.5 px-2.5 py-2 bg-surface rounded-xl border border-border shadow-2xs"
        >
          <SegmentedControl
            options={CLASS_OPTIONS}
            selectedIndex={selectedClassIndex}
            onChange={setSelectedClassIndex}
          />

          {/* 2. Subject Filter Chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingTop: 6, paddingHorizontal: 2 }}
          >
            {subjects.map((sub) => {
              const isSelected = selectedSubjectSlug === sub.slug;
              return (
                <View key={sub.id} style={{ marginRight: 8 }} className="mr-2">
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
          <ScrollView
            style={{ flex: 1 }}
            className="flex-1"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ padding: 12, paddingBottom: 24 }}
          >
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
              <View
                key={i}
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: radii.md,
                  padding: 12,
                  borderWidth: 1,
                  borderColor: colors.border,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 8,
                }}
                className="bg-surface rounded-xl p-3 border border-border flex-row items-center justify-between"
              >
                <View style={{ flex: 1, marginRight: 10 }} className="flex-1 mr-2.5">
                  <Skeleton width={140} height={16} borderRadius={4} className="mb-1.5" />
                  <Skeleton width={100} height={12} borderRadius={4} />
                </View>
                <Skeleton width={38} height={38} borderRadius={19} />
              </View>
            ))}
          </ScrollView>
        ) : chapters.length === 0 ? (
          <View style={{ flex: 1, justifyContent: 'center', padding: 16 }} className="flex-1 justify-center p-4">
            <EmptyState
              title="No chapters available"
              description={`No chapters found for Class ${selectedClassLevel} ${chaptersData?.subject.name || 'this subject'}.`}
              actionLabel="Refresh"
              onAction={() => refetch()}
            />
          </View>
        ) : (
          <View style={{ flex: 1 }} className="flex-1">
            <FlashList
              data={chapters}
              contentContainerStyle={{ padding: 12, paddingBottom: 32 }}
              refreshControl={
                <RefreshControl
                  refreshing={isRefetching}
                  onRefresh={() => {
                    void refetch();
                  }}
                  colors={[colors.primary]}
                  tintColor={colors.primary}
                />
              }
              keyExtractor={(item: LearnChapterItem) => item.id}
              renderItem={({ item }: { item: LearnChapterItem }) => (
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => handleOpenChapter(item.id)}
                  style={{
                    backgroundColor: colors.surface,
                    borderRadius: radii.md,
                    padding: 12,
                    borderWidth: 1,
                    borderColor: colors.border,
                    marginBottom: 8,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    elevation: 1,
                    shadowColor: '#000000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.04,
                    shadowRadius: 2,
                  }}
                  className="bg-surface rounded-xl p-3 border border-border mb-2 shadow-2xs flex-row items-center justify-between active:bg-surface-subtle"
                >
                  <View style={{ flex: 1, marginRight: 10, justifyContent: 'center' }} className="flex-1 mr-2.5 justify-center">
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 3 }} className="flex-row items-center mb-1">
                      <View
                        style={{
                          paddingHorizontal: 6,
                          paddingVertical: 1.5,
                          borderRadius: radii.sm,
                          backgroundColor: colors['primary-soft'],
                          borderWidth: 1,
                          borderColor: 'rgba(37, 99, 235, 0.2)',
                          marginRight: 6,
                        }}
                        className="px-1.5 py-0.5 rounded bg-primary-soft border border-primary/20 mr-1.5"
                      >
                        <Text style={{ fontSize: 10.5, fontWeight: '700', color: colors.primary }} className="text-[10.5px] font-bold text-primary">
                          Ch {item.number}
                        </Text>
                      </View>
                      <Text
                        style={{ fontSize: 14, fontWeight: '700', color: colors.ink, flex: 1 }}
                        className="text-body font-bold text-ink flex-1"
                        numberOfLines={1}
                      >
                        {item.title}
                      </Text>
                    </View>

                    {/* e.g. "4 of 9 lectures · 3 h 20 m" */}
                    <Text
                      style={{ fontSize: 12, color: colors['ink-muted'] }}
                      className="text-caption text-ink-muted"
                    >
                      {item.completedLecturesCount} of {item.lectureCount} lectures •{' '}
                      {item.totalDurationFormatted}
                    </Text>
                  </View>

                  {/* ProgressRing */}
                  <View style={{ alignItems: 'center', justifyContent: 'center' }} className="items-center justify-center">
                    <ProgressRing
                      progress={item.progressPercentage}
                      size={38}
                      strokeWidth={3.5}
                      color={colors.primary}
                      trackColor={colors.border}
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
