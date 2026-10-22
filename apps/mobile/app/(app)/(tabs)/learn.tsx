import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
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

const FALLBACK_CHAPTERS: Record<string, LearnChapterItem[]> = {
  // Class 10 Mathematics (Dinesh Sir - CBSE & ICSE)
  '10-mathematics': [
    { id: 'ch-10-m-1', number: 1, title: 'Real Numbers', slug: 'real-numbers', lectureCount: 6, totalDurationSeconds: 11400, totalDurationFormatted: '3 h 10 m', completedLecturesCount: 6, progressPercentage: 100 },
    { id: 'ch-10-m-2', number: 2, title: 'Polynomials', slug: 'polynomials', lectureCount: 8, totalDurationSeconds: 15300, totalDurationFormatted: '4 h 15 m', completedLecturesCount: 6, progressPercentage: 75 },
    { id: 'ch-10-m-3', number: 3, title: 'Pair of Linear Equations in Two Variables', slug: 'linear-equations', lectureCount: 9, totalDurationSeconds: 18000, totalDurationFormatted: '5 h 00 m', completedLecturesCount: 4, progressPercentage: 44 },
    { id: 'ch-10-m-4', number: 4, title: 'Quadratic Equations', slug: 'quadratic-equations', lectureCount: 7, totalDurationSeconds: 16200, totalDurationFormatted: '4 h 30 m', completedLecturesCount: 2, progressPercentage: 28 },
    { id: 'ch-10-m-5', number: 5, title: 'Arithmetic Progressions', slug: 'arithmetic-progressions', lectureCount: 6, totalDurationSeconds: 13500, totalDurationFormatted: '3 h 45 m', completedLecturesCount: 0, progressPercentage: 0 },
    { id: 'ch-10-m-6', number: 6, title: 'Triangles', slug: 'triangles', lectureCount: 10, totalDurationSeconds: 22500, totalDurationFormatted: '6 h 15 m', completedLecturesCount: 0, progressPercentage: 0 },
    { id: 'ch-10-m-7', number: 7, title: 'Coordinate Geometry', slug: 'coordinate-geometry', lectureCount: 5, totalDurationSeconds: 10200, totalDurationFormatted: '2 h 50 m', completedLecturesCount: 0, progressPercentage: 0 },
    { id: 'ch-10-m-8', number: 8, title: 'Introduction to Trigonometry', slug: 'trigonometry', lectureCount: 8, totalDurationSeconds: 17400, totalDurationFormatted: '4 h 50 m', completedLecturesCount: 0, progressPercentage: 0 },
    { id: 'ch-10-m-9', number: 9, title: 'Some Applications of Trigonometry', slug: 'applications-of-trigonometry', lectureCount: 4, totalDurationSeconds: 8400, totalDurationFormatted: '2 h 20 m', completedLecturesCount: 0, progressPercentage: 0 },
    { id: 'ch-10-m-10', number: 10, title: 'Circles', slug: 'circles', lectureCount: 5, totalDurationSeconds: 11400, totalDurationFormatted: '3 h 10 m', completedLecturesCount: 0, progressPercentage: 0 },
    { id: 'ch-10-m-11', number: 11, title: 'Areas Related to Circles', slug: 'areas-related-to-circles', lectureCount: 5, totalDurationSeconds: 10800, totalDurationFormatted: '3 h 00 m', completedLecturesCount: 0, progressPercentage: 0 },
    { id: 'ch-10-m-12', number: 12, title: 'Surface Areas and Volumes', slug: 'surface-areas-and-volumes', lectureCount: 7, totalDurationSeconds: 16800, totalDurationFormatted: '4 h 40 m', completedLecturesCount: 0, progressPercentage: 0 },
    { id: 'ch-10-m-13', number: 13, title: 'Statistics', slug: 'statistics', lectureCount: 5, totalDurationSeconds: 12600, totalDurationFormatted: '3 h 30 m', completedLecturesCount: 0, progressPercentage: 0 },
    { id: 'ch-10-m-14', number: 14, title: 'Probability', slug: 'probability', lectureCount: 4, totalDurationSeconds: 8100, totalDurationFormatted: '2 h 15 m', completedLecturesCount: 0, progressPercentage: 0 },
  ],
  // Class 10 Science (Namita Ma'am)
  '10-science': [
    { id: 'ch-10-s-1', number: 1, title: 'Chemical Reactions and Equations', slug: 'chemical-reactions', lectureCount: 6, totalDurationSeconds: 12000, totalDurationFormatted: '3 h 20 m', completedLecturesCount: 4, progressPercentage: 67 },
    { id: 'ch-10-s-2', number: 2, title: 'Acids, Bases and Salts', slug: 'acids-bases-salts', lectureCount: 7, totalDurationSeconds: 14400, totalDurationFormatted: '4 h 00 m', completedLecturesCount: 3, progressPercentage: 42 },
    { id: 'ch-10-s-3', number: 3, title: 'Metals and Non-Metals', slug: 'metals-non-metals', lectureCount: 6, totalDurationSeconds: 12600, totalDurationFormatted: '3 h 30 m', completedLecturesCount: 0, progressPercentage: 0 },
    { id: 'ch-10-s-4', number: 4, title: 'Carbon and its Compounds', slug: 'carbon-compounds', lectureCount: 8, totalDurationSeconds: 18000, totalDurationFormatted: '5 h 00 m', completedLecturesCount: 0, progressPercentage: 0 },
    { id: 'ch-10-s-5', number: 5, title: 'Life Processes', slug: 'life-processes', lectureCount: 9, totalDurationSeconds: 19800, totalDurationFormatted: '5 h 30 m', completedLecturesCount: 0, progressPercentage: 0 },
    { id: 'ch-10-s-6', number: 6, title: 'Control and Coordination', slug: 'control-coordination', lectureCount: 6, totalDurationSeconds: 12600, totalDurationFormatted: '3 h 30 m', completedLecturesCount: 0, progressPercentage: 0 },
    { id: 'ch-10-s-7', number: 7, title: 'How do Organisms Reproduce?', slug: 'reproduction', lectureCount: 7, totalDurationSeconds: 15000, totalDurationFormatted: '4 h 10 m', completedLecturesCount: 0, progressPercentage: 0 },
    { id: 'ch-10-s-8', number: 8, title: 'Heredity', slug: 'heredity', lectureCount: 5, totalDurationSeconds: 10800, totalDurationFormatted: '3 h 00 m', completedLecturesCount: 0, progressPercentage: 0 },
    { id: 'ch-10-s-9', number: 9, title: 'Light - Reflection and Refraction', slug: 'light-reflection-refraction', lectureCount: 8, totalDurationSeconds: 17400, totalDurationFormatted: '4 h 50 m', completedLecturesCount: 0, progressPercentage: 0 },
    { id: 'ch-10-s-10', number: 10, title: 'The Human Eye and the Colourful World', slug: 'human-eye', lectureCount: 4, totalDurationSeconds: 8400, totalDurationFormatted: '2 h 20 m', completedLecturesCount: 0, progressPercentage: 0 },
    { id: 'ch-10-s-11', number: 11, title: 'Electricity', slug: 'electricity', lectureCount: 8, totalDurationSeconds: 16800, totalDurationFormatted: '4 h 40 m', completedLecturesCount: 0, progressPercentage: 0 },
    { id: 'ch-10-s-12', number: 12, title: 'Magnetic Effects of Electric Current', slug: 'magnetic-effects', lectureCount: 6, totalDurationSeconds: 13200, totalDurationFormatted: '3 h 40 m', completedLecturesCount: 0, progressPercentage: 0 },
    { id: 'ch-10-s-13', number: 13, title: 'Our Environment', slug: 'our-environment', lectureCount: 3, totalDurationSeconds: 6000, totalDurationFormatted: '1 h 40 m', completedLecturesCount: 0, progressPercentage: 0 },
  ],
  // Class 9 Mathematics
  '9-mathematics': [
    { id: 'ch-9-m-1', number: 1, title: 'Number Systems', slug: 'number-systems', lectureCount: 6, totalDurationSeconds: 12000, totalDurationFormatted: '3 h 20 m', completedLecturesCount: 6, progressPercentage: 100 },
    { id: 'ch-9-m-2', number: 2, title: 'Polynomials', slug: 'polynomials-9', lectureCount: 7, totalDurationSeconds: 14400, totalDurationFormatted: '4 h 00 m', completedLecturesCount: 5, progressPercentage: 71 },
    { id: 'ch-9-m-3', number: 3, title: 'Coordinate Geometry', slug: 'coordinate-geometry-9', lectureCount: 4, totalDurationSeconds: 8400, totalDurationFormatted: '2 h 20 m', completedLecturesCount: 4, progressPercentage: 100 },
    { id: 'ch-9-m-4', number: 4, title: 'Linear Equations in Two Variables', slug: 'linear-equations-9', lectureCount: 5, totalDurationSeconds: 10800, totalDurationFormatted: '3 h 00 m', completedLecturesCount: 1, progressPercentage: 20 },
    { id: 'ch-9-m-5', number: 5, title: 'Lines and Angles', slug: 'lines-and-angles', lectureCount: 6, totalDurationSeconds: 13200, totalDurationFormatted: '3 h 40 m', completedLecturesCount: 0, progressPercentage: 0 },
    { id: 'ch-9-m-6', number: 6, title: 'Triangles', slug: 'triangles-9', lectureCount: 8, totalDurationSeconds: 16800, totalDurationFormatted: '4 h 40 m', completedLecturesCount: 0, progressPercentage: 0 },
    { id: 'ch-9-m-7', number: 7, title: 'Quadrilaterals', slug: 'quadrilaterals', lectureCount: 5, totalDurationSeconds: 11400, totalDurationFormatted: '3 h 10 m', completedLecturesCount: 0, progressPercentage: 0 },
    { id: 'ch-9-m-8', number: 8, title: 'Circles', slug: 'circles-9', lectureCount: 6, totalDurationSeconds: 12600, totalDurationFormatted: '3 h 30 m', completedLecturesCount: 0, progressPercentage: 0 },
    { id: 'ch-9-m-9', number: 9, title: "Heron's Formula", slug: 'herons-formula', lectureCount: 4, totalDurationSeconds: 8400, totalDurationFormatted: '2 h 20 m', completedLecturesCount: 0, progressPercentage: 0 },
    { id: 'ch-9-m-10', number: 10, title: 'Surface Areas and Volumes', slug: 'surface-areas-9', lectureCount: 6, totalDurationSeconds: 13800, totalDurationFormatted: '3 h 50 m', completedLecturesCount: 0, progressPercentage: 0 },
    { id: 'ch-9-m-11', number: 11, title: 'Statistics', slug: 'statistics-9', lectureCount: 5, totalDurationSeconds: 10800, totalDurationFormatted: '3 h 00 m', completedLecturesCount: 0, progressPercentage: 0 },
  ],
  // Class 9 Science
  '9-science': [
    { id: 'ch-9-s-1', number: 1, title: 'Matter in Our Surroundings', slug: 'matter-in-surroundings', lectureCount: 5, totalDurationSeconds: 10800, totalDurationFormatted: '3 h 00 m', completedLecturesCount: 5, progressPercentage: 100 },
    { id: 'ch-9-s-2', number: 2, title: 'Is Matter Around Us Pure', slug: 'is-matter-pure', lectureCount: 6, totalDurationSeconds: 12600, totalDurationFormatted: '3 h 30 m', completedLecturesCount: 3, progressPercentage: 50 },
    { id: 'ch-9-s-3', number: 3, title: 'Atoms and Molecules', slug: 'atoms-molecules', lectureCount: 7, totalDurationSeconds: 14400, totalDurationFormatted: '4 h 00 m', completedLecturesCount: 0, progressPercentage: 0 },
    { id: 'ch-9-s-4', number: 4, title: 'Structure of the Atom', slug: 'structure-atom', lectureCount: 6, totalDurationSeconds: 12000, totalDurationFormatted: '3 h 20 m', completedLecturesCount: 0, progressPercentage: 0 },
    { id: 'ch-9-s-5', number: 5, title: 'The Fundamental Unit of Life', slug: 'fundamental-unit-life', lectureCount: 7, totalDurationSeconds: 15000, totalDurationFormatted: '4 h 10 m', completedLecturesCount: 0, progressPercentage: 0 },
    { id: 'ch-9-s-6', number: 6, title: 'Tissues', slug: 'tissues', lectureCount: 6, totalDurationSeconds: 13200, totalDurationFormatted: '3 h 40 m', completedLecturesCount: 0, progressPercentage: 0 },
    { id: 'ch-9-s-7', number: 7, title: 'Motion', slug: 'motion', lectureCount: 8, totalDurationSeconds: 16800, totalDurationFormatted: '4 h 40 m', completedLecturesCount: 0, progressPercentage: 0 },
    { id: 'ch-9-s-8', number: 8, title: 'Force and Laws of Motion', slug: 'force-laws-motion', lectureCount: 6, totalDurationSeconds: 12600, totalDurationFormatted: '3 h 30 m', completedLecturesCount: 0, progressPercentage: 0 },
  ],
  // Class 11 Mathematics
  '11-mathematics': [
    { id: 'ch-11-m-1', number: 1, title: 'Sets and Relations', slug: 'sets-relations', lectureCount: 7, totalDurationSeconds: 15600, totalDurationFormatted: '4 h 20 m', completedLecturesCount: 7, progressPercentage: 100 },
    { id: 'ch-11-m-2', number: 2, title: 'Functions', slug: 'functions', lectureCount: 8, totalDurationSeconds: 17400, totalDurationFormatted: '4 h 50 m', completedLecturesCount: 5, progressPercentage: 62 },
    { id: 'ch-11-m-3', number: 3, title: 'Trigonometric Functions', slug: 'trigonometric-functions', lectureCount: 11, totalDurationSeconds: 25200, totalDurationFormatted: '7 h 00 m', completedLecturesCount: 4, progressPercentage: 36 },
    { id: 'ch-11-m-4', number: 4, title: 'Complex Numbers & Quadratic Equations', slug: 'complex-numbers', lectureCount: 8, totalDurationSeconds: 18000, totalDurationFormatted: '5 h 00 m', completedLecturesCount: 0, progressPercentage: 0 },
    { id: 'ch-11-m-5', number: 5, title: 'Linear Inequalities', slug: 'linear-inequalities', lectureCount: 4, totalDurationSeconds: 9000, totalDurationFormatted: '2 h 30 m', completedLecturesCount: 0, progressPercentage: 0 },
    { id: 'ch-11-m-6', number: 6, title: 'Permutations and Combinations', slug: 'permutations-combinations', lectureCount: 8, totalDurationSeconds: 18000, totalDurationFormatted: '5 h 00 m', completedLecturesCount: 0, progressPercentage: 0 },
    { id: 'ch-11-m-7', number: 7, title: 'Binomial Theorem', slug: 'binomial-theorem', lectureCount: 5, totalDurationSeconds: 11400, totalDurationFormatted: '3 h 10 m', completedLecturesCount: 0, progressPercentage: 0 },
    { id: 'ch-11-m-8', number: 8, title: 'Sequences and Series', slug: 'sequences-series', lectureCount: 7, totalDurationSeconds: 15600, totalDurationFormatted: '4 h 20 m', completedLecturesCount: 0, progressPercentage: 0 },
    { id: 'ch-11-m-9', number: 9, title: 'Straight Lines', slug: 'straight-lines', lectureCount: 8, totalDurationSeconds: 18000, totalDurationFormatted: '5 h 00 m', completedLecturesCount: 0, progressPercentage: 0 },
    { id: 'ch-11-m-10', number: 10, title: 'Conic Sections', slug: 'conic-sections', lectureCount: 9, totalDurationSeconds: 20400, totalDurationFormatted: '5 h 40 m', completedLecturesCount: 0, progressPercentage: 0 },
    { id: 'ch-11-m-11', number: 11, title: 'Limits and Derivatives', slug: 'limits-derivatives', lectureCount: 10, totalDurationSeconds: 22800, totalDurationFormatted: '6 h 20 m', completedLecturesCount: 0, progressPercentage: 0 },
  ],
  // Class 12 Mathematics (Dinesh Sir Master Class)
  '12-mathematics': [
    { id: 'ch-12-m-1', number: 1, title: 'Relations and Functions', slug: 'relations-functions-12', lectureCount: 7, totalDurationSeconds: 15600, totalDurationFormatted: '4 h 20 m', completedLecturesCount: 7, progressPercentage: 100 },
    { id: 'ch-12-m-2', number: 2, title: 'Inverse Trigonometric Functions', slug: 'itf', lectureCount: 6, totalDurationSeconds: 13800, totalDurationFormatted: '3 h 50 m', completedLecturesCount: 6, progressPercentage: 100 },
    { id: 'ch-12-m-3', number: 3, title: 'Matrices', slug: 'matrices', lectureCount: 8, totalDurationSeconds: 18000, totalDurationFormatted: '5 h 00 m', completedLecturesCount: 8, progressPercentage: 100 },
    { id: 'ch-12-m-4', number: 4, title: 'Determinants', slug: 'determinants', lectureCount: 8, totalDurationSeconds: 17400, totalDurationFormatted: '4 h 50 m', completedLecturesCount: 6, progressPercentage: 75 },
    { id: 'ch-12-m-5', number: 5, title: 'Continuity and Differentiability', slug: 'continuity-differentiability', lectureCount: 12, totalDurationSeconds: 27000, totalDurationFormatted: '7 h 30 m', completedLecturesCount: 9, progressPercentage: 75 },
    { id: 'ch-12-m-6', number: 6, title: 'Application of Derivatives (AOD)', slug: 'application-of-derivatives', lectureCount: 10, totalDurationSeconds: 22800, totalDurationFormatted: '6 h 20 m', completedLecturesCount: 5, progressPercentage: 50 },
    { id: 'ch-12-m-7', number: 7, title: 'Integrals (Indefinite & Definite)', slug: 'integrals', lectureCount: 16, totalDurationSeconds: 36000, totalDurationFormatted: '10 h 00 m', completedLecturesCount: 3, progressPercentage: 18 },
    { id: 'ch-12-m-8', number: 8, title: 'Application of Integrals (Area)', slug: 'application-of-integrals', lectureCount: 6, totalDurationSeconds: 13200, totalDurationFormatted: '3 h 40 m', completedLecturesCount: 0, progressPercentage: 0 },
    { id: 'ch-12-m-9', number: 9, title: 'Differential Equations', slug: 'differential-equations', lectureCount: 8, totalDurationSeconds: 18000, totalDurationFormatted: '5 h 00 m', completedLecturesCount: 0, progressPercentage: 0 },
    { id: 'ch-12-m-10', number: 10, title: 'Vector Algebra', slug: 'vector-algebra', lectureCount: 7, totalDurationSeconds: 15600, totalDurationFormatted: '4 h 20 m', completedLecturesCount: 0, progressPercentage: 0 },
    { id: 'ch-12-m-11', number: 11, title: 'Three Dimensional Geometry (3D)', slug: 'three-dimensional-geometry', lectureCount: 8, totalDurationSeconds: 18000, totalDurationFormatted: '5 h 00 m', completedLecturesCount: 0, progressPercentage: 0 },
    { id: 'ch-12-m-12', number: 12, title: 'Linear Programming (LPP)', slug: 'linear-programming', lectureCount: 4, totalDurationSeconds: 9000, totalDurationFormatted: '2 h 30 m', completedLecturesCount: 0, progressPercentage: 0 },
    { id: 'ch-12-m-13', number: 13, title: 'Probability', slug: 'probability-12', lectureCount: 7, totalDurationSeconds: 16200, totalDurationFormatted: '4 h 30 m', completedLecturesCount: 0, progressPercentage: 0 },
  ],
};

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
      { id: '2', name: 'Science', slug: 'science', lectureCount: 0 },
      { id: '3', name: 'Physics', slug: 'physics', lectureCount: 0 },
      { id: '4', name: 'Chemistry', slug: 'chemistry', lectureCount: 0 },
      { id: '5', name: 'Biology', slug: 'biology', lectureCount: 0 },
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

  // Fallback curriculum ensures zero blank/skeleton screens when backend is offline
  const fallbackChapters = useMemo(() => {
    const key = `${selectedClassLevel}-${selectedSubjectSlug}`;
    if (FALLBACK_CHAPTERS[key]) return FALLBACK_CHAPTERS[key];
    if (FALLBACK_CHAPTERS[`${selectedClassLevel}-mathematics`]) return FALLBACK_CHAPTERS[`${selectedClassLevel}-mathematics`];
    return FALLBACK_CHAPTERS['10-mathematics'] || [];
  }, [selectedClassLevel, selectedSubjectSlug]);

  const chapters = useMemo(() => {
    if (chaptersData?.chapters && chaptersData.chapters.length > 0) {
      return chaptersData.chapters;
    }
    return fallbackChapters;
  }, [chaptersData?.chapters, fallbackChapters]);

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
            <FlatList
              data={chapters}
              contentContainerStyle={{ padding: 12, paddingBottom: 32 }}
              showsVerticalScrollIndicator={false}
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
