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
import * as Haptics from 'expo-haptics';
import {
  Search,
  BookOpen,
  Sparkles,
  ChevronRight,
  ShoppingBag,
  Tag,
  Clock,
  Check,
  CheckCircle2,
  Star,
  Award,
  Video,
  FileText,
  ArrowRight,
  Filter,
} from 'lucide-react-native';
import { TextInput, Alert } from 'react-native';
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
import { useTabBarScroll } from '../../../src/lib/tabBarVisibilityStore';
import {
  useAdminStore,
  type AdminCourseItem,
} from '../../../src/lib/adminDataStore';
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

  // Admin store for live courses and study packages
  const adminStore = useAdminStore();
  const [activeMainTab, setActiveMainTab] = useState<0 | 1>(0); // 0 = Institute Courses, 1 = Curriculum Syllabus
  const [courseSearch, setCourseSearch] = useState('');
  const [courseClassFilter, setCourseClassFilter] = useState<'all' | '9' | '10' | '11' | '12'>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { onScroll: handleTabBarScroll, scrollEventThrottle } = useTabBarScroll();

  useEffect(() => {
    adminStore.init();
  }, []);

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await Promise.all([
        adminStore.init(),
        refetch(),
        new Promise((resolve) => setTimeout(resolve, 350)),
      ]);
    } catch (err) {
      console.warn('[Learn] Refresh error:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const publishedCourses = useMemo(() => {
    const list = adminStore.courses || [];
    return list.filter((c) => {
      if (c.status !== 'published') return false;
      const cls = (c.targetClass || c.classLevel || 9).toString();
      if (courseClassFilter !== 'all' && cls !== courseClassFilter) return false;
      if (courseSearch.trim()) {
        const q = courseSearch.toLowerCase();
        const matchTitle = c.title.toLowerCase().includes(q);
        const matchSub = (c.subtitle || '').toLowerCase().includes(q);
        const matchDesc = c.description.toLowerCase().includes(q);
        if (!matchTitle && !matchSub && !matchDesc) return false;
      }
      return true;
    });
  }, [adminStore.courses, courseClassFilter, courseSearch]);

  const handleCourseAction = (course: AdminCourseItem) => {
    if (course.batchId) {
      router.push(`/(app)/batch/${course.batchId}` as any);
    } else {
      const sellingPrice = course.discountedPrice ?? course.price;
      Alert.alert(
        'Enroll in Course',
        `Join "${course.title}" for ₹${sellingPrice.toLocaleString('en-IN')} (Original: ₹${course.price.toLocaleString('en-IN')})?\n\nThis grants complete access to all video lectures, study materials, notes, and tests managed by Dinesh Sir.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Confirm Enrollment',
            onPress: () => {
              Alert.alert(
                'Enrollment Successful! 🎉',
                `Welcome to "${course.title}"! Your batch study material and classes are now live in the Batches tab.`,
                [
                  {
                    text: 'View Batches',
                    onPress: () => router.push('/(app)/(tabs)/batches' as any),
                  },
                ]
              );
            },
          },
        ]
      );
    }
  };

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
          title="Learn & Courses"
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
      <View style={{ flex: 1, backgroundColor: colors['surface-subtle'] }}>
        {/* TOP SEGMENTED CONTROL: COURSES VS SYLLABUS */}
        <View style={{ backgroundColor: colors.surface, paddingHorizontal: 12, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border }}>
          <SegmentedControl
            options={['Institute Courses', 'Curriculum Syllabus']}
            selectedIndex={activeMainTab}
            onChange={(idx) => setActiveMainTab(idx as 0 | 1)}
          />
        </View>

        {/* 1. COURSES & TEST PACKS TAB (LOADED LIVE FROM ADMIN DATA STORE) */}
        {activeMainTab === 0 && (
          <ScrollView
            onScroll={handleTabBarScroll}
            scrollEventThrottle={scrollEventThrottle}
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: 12, paddingBottom: 130 }}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={handleRefresh}
                tintColor={colors.primary}
                colors={[colors.primary]}
              />
            }
          >
            {/* Search Input */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: radii.md,
                paddingHorizontal: 10,
                paddingVertical: 7,
                marginBottom: 10,
              }}
            >
              <Search size={16} color="#64748B" />
              <TextInput
                value={courseSearch}
                onChangeText={setCourseSearch}
                placeholder="Search courses, test packs, board booster..."
                placeholderTextColor="#94A3B8"
                style={{
                  flex: 1,
                  marginLeft: 8,
                  fontSize: 13,
                  color: colors.ink,
                  padding: 0,
                }}
              />
              {courseSearch.length > 0 && (
                <TouchableOpacity onPress={() => setCourseSearch('')}>
                  <Text style={{ fontSize: 12, color: '#94A3B8', fontWeight: '600' }}>Clear</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Class Filter Chips */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 6, marginBottom: 12 }}
            >
              {(
                [
                  { id: 'all', label: 'All Classes' },
                  { id: '9', label: 'Class 9' },
                  { id: '10', label: 'Class 10' },
                  { id: '11', label: 'Class 11' },
                  { id: '12', label: 'Class 12' },
                ] as const
              ).map((chip) => (
                <Chip
                  key={chip.id}
                  label={chip.label}
                  selected={courseClassFilter === chip.id}
                  onPress={() => setCourseClassFilter(chip.id)}
                />
              ))}
            </ScrollView>

            {/* Course Cards List */}
            {publishedCourses.length === 0 ? (
              <EmptyState
                title="No Courses Found"
                description={
                  courseSearch
                    ? `No courses matching "${courseSearch}".`
                    : 'No courses published yet for this selection.'
                }
                actionLabel="View All Courses"
                onAction={() => {
                  setCourseSearch('');
                  setCourseClassFilter('all');
                }}
              />
            ) : (
              <View style={{ gap: 12 }}>
                {publishedCourses.map((course) => {
                  const discountedPrice = course.discountedPrice ?? course.price;
                  const discountPercent =
                    course.price > discountedPrice
                      ? Math.round(((course.price - discountedPrice) / course.price) * 100)
                      : 0;

                  return (
                    <View
                      key={course.id}
                      style={{
                        backgroundColor: colors.surface,
                        borderRadius: radii.lg,
                        borderWidth: 1,
                        borderColor: colors.border,
                        padding: 14,
                        elevation: 1,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.05,
                        shadowRadius: 3,
                      }}
                    >
                      {/* Top Badges Row */}
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          {course.badge ? (
                            <View
                              style={{
                                backgroundColor: '#EFF6FF',
                                borderWidth: 1,
                                borderColor: '#BFDBFE',
                                paddingHorizontal: 8,
                                paddingVertical: 2,
                                borderRadius: radii.full,
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 4,
                              }}
                            >
                              <Sparkles size={11} color="#2563EB" />
                              <Text style={{ fontSize: 10.5, fontWeight: '800', color: '#1D4ED8' }}>
                                {course.badge}
                              </Text>
                            </View>
                          ) : null}
                          <View
                            style={{
                              backgroundColor: '#F1F5F9',
                              paddingHorizontal: 7,
                              paddingVertical: 2,
                              borderRadius: radii.sm,
                            }}
                          >
                            <Text style={{ fontSize: 11, fontWeight: '700', color: '#475569' }}>
                              Class {course.targetClass || course.classLevel || 9} • {course.board.toUpperCase()}
                            </Text>
                          </View>
                        </View>

                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                          <Star size={12} color="#F59E0B" fill="#F59E0B" />
                          <Text style={{ fontSize: 11.5, fontWeight: '700', color: '#1E293B' }}>4.9</Text>
                          <Text style={{ fontSize: 10.5, color: '#64748B' }}>(180+)</Text>
                        </View>
                      </View>

                      {/* Course Title & Subtitle */}
                      <Text style={{ fontSize: 15.5, fontWeight: '800', color: '#0F172A', marginBottom: 3 }}>
                        {course.title}
                      </Text>
                      {course.subtitle ? (
                        <Text style={{ fontSize: 12.5, color: '#475569', lineHeight: 17, marginBottom: 8 }}>
                          {course.subtitle}
                        </Text>
                      ) : null}

                      {/* Features Bullet Points */}
                      {course.features && course.features.length > 0 && (
                        <View style={{ gap: 4, marginBottom: 12, backgroundColor: '#F8FAFC', padding: 10, borderRadius: radii.md }}>
                          {course.features.slice(0, 4).map((f, idx) => (
                            <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                              <CheckCircle2 size={13} color="#059669" />
                              <Text style={{ fontSize: 12, color: '#334155', fontWeight: '500', flex: 1 }}>
                                {f}
                              </Text>
                            </View>
                          ))}
                        </View>
                      )}

                      {/* Bottom Pricing & Action */}
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          paddingTop: 8,
                          borderTopWidth: 1,
                          borderTopColor: '#F1F5F9',
                        }}
                      >
                        <View>
                          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
                            <Text style={{ fontSize: 17, fontWeight: '900', color: '#0F172A' }}>
                              ₹{discountedPrice.toLocaleString('en-IN')}
                            </Text>
                            {course.price > discountedPrice && (
                              <Text style={{ fontSize: 12.5, color: '#94A3B8', textDecorationLine: 'line-through' }}>
                                ₹{course.price.toLocaleString('en-IN')}
                              </Text>
                            )}
                            {discountPercent > 0 && (
                              <View style={{ backgroundColor: '#DCFCE7', paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4 }}>
                                <Text style={{ fontSize: 10, fontWeight: '800', color: '#15803D' }}>
                                  {discountPercent}% OFF
                                </Text>
                              </View>
                            )}
                          </View>
                          <Text style={{ fontSize: 10.5, color: '#64748B', marginTop: 1 }}>
                            {course.validity}
                          </Text>
                        </View>

                        <TouchableOpacity
                          activeOpacity={0.8}
                          onPress={() => handleCourseAction(course)}
                          style={{
                            backgroundColor: colors.primary,
                            paddingHorizontal: 14,
                            paddingVertical: 7,
                            borderRadius: radii.md,
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 5,
                          }}
                        >
                          <Text style={{ fontSize: 12.5, fontWeight: '800', color: '#FFFFFF' }}>
                            {course.batchId ? 'Explore Batch' : 'Enroll Now'}
                          </Text>
                          <ArrowRight size={13} color="#FFFFFF" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </ScrollView>
        )}

        {/* 2. CURRICULUM SYLLABUS TAB */}
        {activeMainTab === 1 && (
          <View style={{ flex: 1 }}>
            {/* Class Switcher card */}
            <View
              style={{
                marginHorizontal: 12,
                marginTop: 8,
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
            >
              <SegmentedControl
                options={CLASS_OPTIONS}
                selectedIndex={selectedClassIndex}
                onChange={setSelectedClassIndex}
              />

              {/* Subject Filter Chips */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingTop: 6, paddingHorizontal: 2 }}
              >
                {subjects.map((sub) => {
                  const isSelected = selectedSubjectSlug === sub.slug;
                  return (
                    <View key={sub.id} style={{ marginRight: 8 }}>
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

            {/* Chapter List using FlatList */}
            {isChaptersLoading && chapters.length === 0 ? (
              <ScrollView
                style={{ flex: 1 }}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ padding: 12, paddingBottom: 24 }}
                refreshControl={
                  <RefreshControl
                    refreshing={isRefreshing}
                    onRefresh={handleRefresh}
                    colors={[colors.primary]}
                    tintColor={colors.primary}
                  />
                }
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
                  >
                    <View style={{ flex: 1, marginRight: 10 }}>
                      <Skeleton width={140} height={16} borderRadius={4} style={{ marginBottom: 6 }} />
                      <Skeleton width={100} height={12} borderRadius={4} />
                    </View>
                    <Skeleton width={38} height={38} borderRadius={19} />
                  </View>
                ))}
              </ScrollView>
            ) : chapters.length === 0 ? (
              <View style={{ flex: 1, justifyContent: 'center', padding: 16 }}>
                <EmptyState
                  title="No chapters available"
                  description={`No chapters found for Class ${selectedClassLevel} ${chaptersData?.subject.name || 'this subject'}.`}
                  actionLabel="Refresh"
                  onAction={handleRefresh}
                />
              </View>
            ) : (
              <View style={{ flex: 1 }}>
                <FlatList
                  onScroll={handleTabBarScroll}
                  scrollEventThrottle={scrollEventThrottle}
                  data={chapters}
                  contentContainerStyle={{ padding: 12, paddingBottom: 80 }}
                  showsVerticalScrollIndicator={false}
                  refreshControl={
                    <RefreshControl
                      refreshing={isRefreshing || isRefetching}
                      onRefresh={handleRefresh}
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
                    >
                      <View style={{ flex: 1, marginRight: 10, justifyContent: 'center' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 3 }}>
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
                          >
                            <Text style={{ fontSize: 10.5, fontWeight: '700', color: colors.primary }}>
                              Ch {item.number}
                            </Text>
                          </View>
                          <Text
                            style={{ fontSize: 14, fontWeight: '700', color: colors.ink, flex: 1 }}
                            numberOfLines={1}
                          >
                            {item.title}
                          </Text>
                        </View>

                        <Text style={{ fontSize: 12, color: colors['ink-muted'] }}>
                          {item.completedLecturesCount} of {item.lectureCount} lectures •{' '}
                          {item.totalDurationFormatted}
                        </Text>
                      </View>

                      {/* ProgressRing */}
                      <View style={{ alignItems: 'center', justifyContent: 'center' }}>
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
        )}
      </View>
    </Screen>
  );
}
