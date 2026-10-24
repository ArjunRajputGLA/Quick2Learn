import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Svg, { Line, Circle, Polyline, Text as SvgText } from 'react-native-svg';
import {
  TrendingUp,
  Award,
  AlertTriangle,
  Clock,
  Sparkles,
  BookOpen,
  Calendar,
  CheckCircle2,
  XCircle,
  ChevronRight,
  ArrowRight,
} from 'lucide-react-native';
import { Screen } from '../../src/components/ui/Screen';
import { AppHeader } from '../../src/components/ui/AppHeader';
import { Badge } from '../../src/components/ui/Badge';
import { ProgressBar } from '../../src/components/ui/ProgressBar';
import { BookLoader } from '../../src/components/ui/BookLoader';
import { Button } from '../../src/components/ui/Button';
import { useStudentPerformance } from '../../src/api/hooks';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function PerformanceScreen() {
  const { studentId } = useLocalSearchParams<{ studentId?: string }>();
  const router = useRouter();

  const { data: perf, isLoading, error, refetch } = useStudentPerformance(studentId);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await Promise.all([
        refetch(),
        new Promise((resolve) => setTimeout(resolve, 350)),
      ]);
    } catch (err) {
      console.warn('[Performance] Refresh error:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  if (isLoading && !perf) {
    return (
      <Screen header={<AppHeader title="Academic Performance" showBack />}>
        <View className="flex-1 items-center justify-center p-6">
          <BookLoader text="Loading performance insights..." size="lg" />
        </View>
      </Screen>
    );
  }

  if (!perf) {
    return (
      <Screen header={<AppHeader title="Academic Performance" showBack />}>
        <View className="flex-1 items-center justify-center p-6">
          <Text className="text-h3 font-bold text-ink">No Test Data Available</Text>
          <Text className="text-body text-ink-muted text-center mt-2">
            Complete your first test assessment to unlock detailed analytics and chapter recommendations.
          </Text>
          <Button
            variant="primary"
            size="md"
            className="mt-4"
            onPress={() => router.push('/(app)/(tabs)/batches' as any)}
          >
            Explore Tests
          </Button>
        </View>
      </Screen>
    );
  }

  // 1. Trend Line SVG preparation
  const recentTests = [...perf.recentAttempts].reverse(); // chronological order
  const chartWidth = SCREEN_WIDTH - 64;
  const chartHeight = 130;
  const paddingX = 24;
  const paddingY = 20;

  const points = recentTests.map((t, idx) => {
    const x =
      recentTests.length > 1
        ? paddingX + (idx / (recentTests.length - 1)) * (chartWidth - paddingX * 2)
        : chartWidth / 2;
    const y =
      chartHeight -
      paddingY -
      (Math.min(100, Math.max(0, t.percentage)) / 100) *
        (chartHeight - paddingY * 2);
    return { x, y, percentage: t.percentage, title: t.testTitle };
  });

  const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(' ');

  return (
    <Screen
      scrollable={false}
      header={
        <AppHeader
          title={studentId ? `${perf.studentName}'s Performance` : 'Academic Performance'}
          showBack
        />
      }
    >
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 48 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={['#2563EB']}
            tintColor="#2563EB"
          />
        }
      >
        {/* 1. OVERALL STATS CARDS: Average %, Total Attempted vs Missed */}
        <View className="bg-surface rounded-3xl p-5 border border-border shadow-xs mb-4">
          <View className="flex-row items-center justify-between mb-4">
            <View>
              <Text className="text-caption font-bold uppercase tracking-wider text-ink-muted">
                Cumulative Average
              </Text>
              <Text className="text-h1 font-extrabold text-ink">
                {perf.averageScorePercentage}%
              </Text>
            </View>

            <View className="w-12 h-12 rounded-2xl bg-primary-soft items-center justify-center">
              <TrendingUp size={24} color="#2563EB" />
            </View>
          </View>

          {/* Attempted vs Missed Counts */}
          <View className="grid grid-cols-3 gap-2.5 pt-3 border-t border-border/60">
            <View className="bg-surface-subtle p-3 rounded-2xl border border-border/50">
              <View className="flex-row items-center">
                <CheckCircle2 size={14} color="#059669" />
                <Text className="text-caption font-semibold text-ink-muted ml-1.5">
                  Attempted
                </Text>
              </View>
              <Text className="text-h3 font-bold text-emerald-700 mt-1">
                {perf.totalTestsAttempted}
              </Text>
            </View>

            <View className="bg-surface-subtle p-3 rounded-2xl border border-border/50">
              <View className="flex-row items-center">
                <XCircle size={14} color="#DC2626" />
                <Text className="text-caption font-semibold text-ink-muted ml-1.5">
                  Missed
                </Text>
              </View>
              <Text className="text-h3 font-bold text-red-700 mt-1">
                {perf.totalTestsMissed}
              </Text>
            </View>

            <View className="bg-surface-subtle p-3 rounded-2xl border border-border/50">
              <View className="flex-row items-center">
                <Clock size={14} color="#7C3AED" />
                <Text className="text-caption font-semibold text-ink-muted ml-1.5">
                  Time Spent
                </Text>
              </View>
              <Text className="text-h3 font-bold text-ink mt-1">
                {perf.totalTimeSpentMinutes}m
              </Text>
            </View>
          </View>
        </View>

        {/* 2. TREND LINE ACROSS RECENT TESTS */}
        {recentTests.length > 0 ? (
          <View className="bg-surface rounded-2xl p-4 border border-border shadow-xs mb-4">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-h3 font-bold text-ink">
                Score Trend (% across tests)
              </Text>
              <Badge label="Latest Tests" variant="neutral" size="sm" />
            </View>

            <View className="items-center py-2">
              <Svg width={chartWidth} height={chartHeight}>
                {/* Horizontal guide lines */}
                <Line
                  x1={paddingX}
                  y1={paddingY}
                  x2={chartWidth - paddingX}
                  y2={paddingY}
                  stroke="#E5E7EB"
                  strokeDasharray="4 4"
                  strokeWidth={1}
                />
                <Line
                  x1={paddingX}
                  y1={chartHeight / 2}
                  x2={chartWidth - paddingX}
                  y2={chartHeight / 2}
                  stroke="#E5E7EB"
                  strokeDasharray="4 4"
                  strokeWidth={1}
                />
                <Line
                  x1={paddingX}
                  y1={chartHeight - paddingY}
                  x2={chartWidth - paddingX}
                  y2={chartHeight - paddingY}
                  stroke="#E5E7EB"
                  strokeWidth={1}
                />

                {/* Trend Polyline */}
                {points.length > 1 ? (
                  <Polyline
                    points={polylinePoints}
                    fill="none"
                    stroke="#2563EB"
                    strokeWidth={3}
                  />
                ) : null}

                {/* Dot markers */}
                {points.map((p, idx) => (
                  <React.Fragment key={idx}>
                    <Circle
                      cx={p.x}
                      cy={p.y}
                      r={5}
                      fill="#FFFFFF"
                      stroke="#2563EB"
                      strokeWidth={2.5}
                    />
                    <SvgText
                      x={p.x}
                      y={p.y - 8}
                      fontSize="10"
                      fontWeight="bold"
                      fill="#1E40AF"
                      textAnchor="middle"
                    >
                      {Math.round(p.percentage)}%
                    </SvgText>
                  </React.Fragment>
                ))}
              </Svg>
            </View>
          </View>
        ) : null}

        {/* 3. STRONGEST & WEAKEST CHAPTERS */}
        <View className="grid grid-cols-2 gap-3 mb-4">
          {/* Strongest */}
          <View className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-200 shadow-2xs">
            <View className="flex-row items-center mb-2">
              <Sparkles size={16} color="#059669" />
              <Text className="text-small font-bold text-emerald-900 ml-1.5">
                Strongest
              </Text>
            </View>
            {perf.strongestChapters && perf.strongestChapters.length > 0 ? (
              <View className="space-y-1.5">
                {perf.strongestChapters.map((title, i) => (
                  <Text
                    key={i}
                    className="text-caption font-semibold text-emerald-800 leading-snug"
                    numberOfLines={2}
                  >
                    • {title}
                  </Text>
                ))}
              </View>
            ) : (
              <Text className="text-caption text-ink-muted">
                Complete more tests to identify strength areas.
              </Text>
            )}
          </View>

          {/* Weakest */}
          <View className="bg-amber-50/70 p-4 rounded-2xl border border-amber-200 shadow-2xs">
            <View className="flex-row items-center mb-2">
              <AlertTriangle size={16} color="#D97706" />
              <Text className="text-small font-bold text-amber-900 ml-1.5">
                Needs Work
              </Text>
            </View>
            {perf.weakestChapters && perf.weakestChapters.length > 0 ? (
              <View className="space-y-1.5">
                {perf.weakestChapters.map((title, i) => (
                  <Text
                    key={i}
                    className="text-caption font-semibold text-amber-800 leading-snug"
                    numberOfLines={2}
                  >
                    • {title}
                  </Text>
                ))}
              </View>
            ) : (
              <Text className="text-caption text-ink-muted">
                No weak chapters identified. Keep it up!
              </Text>
            )}
          </View>
        </View>

        {/* 4. SUBJECT AVERAGES */}
        {perf.subjectBreakdown.length > 0 ? (
          <View className="bg-surface rounded-2xl p-4 border border-border shadow-xs mb-4">
            <Text className="text-h3 font-bold text-ink mb-3">
              Subject Averages
            </Text>

            <View className="space-y-3">
              {perf.subjectBreakdown.map((s) => (
                <View key={s.subjectId} className="space-y-1.5">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-body font-semibold text-ink">
                      {s.subjectName} ({s.testsCount} tests)
                    </Text>
                    <Text className="text-body font-bold text-ink">
                      {s.averageScorePercentage}%
                    </Text>
                  </View>

                  <ProgressBar
                    progress={s.averageScorePercentage}
                    height={6}
                    color="#2563EB"
                    trackColor="#F3F4F6"
                  />
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {/* 5. CHAPTER AVERAGES */}
        {perf.chapterBreakdown && perf.chapterBreakdown.length > 0 ? (
          <View className="bg-surface rounded-2xl p-4 border border-border shadow-xs mb-4">
            <Text className="text-h3 font-bold text-ink mb-3">
              Chapter Accuracy
            </Text>

            <View className="space-y-3">
              {perf.chapterBreakdown.map((ch, idx) => (
                <View key={ch.chapterId || idx} className="space-y-1.5">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-small font-semibold text-ink flex-1 mr-2" numberOfLines={1}>
                      {ch.chapterTitle}
                    </Text>
                    <Text className="text-caption font-bold text-ink">
                      {ch.averageAccuracyPercentage}% ({ch.totalQuestions} Qs)
                    </Text>
                  </View>

                  <ProgressBar
                    progress={ch.averageAccuracyPercentage}
                    height={5}
                    color={
                      ch.averageAccuracyPercentage >= 70
                        ? '#059669'
                        : ch.averageAccuracyPercentage >= 40
                        ? '#D97706'
                        : '#DC2626'
                    }
                    trackColor="#F3F4F6"
                  />
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {/* 6. RECENT TESTS HISTORY */}
        <View className="space-y-3">
          <Text className="text-h3 font-bold text-ink">
            Test Attempt History
          </Text>

          {perf.recentAttempts.length === 0 ? (
            <View className="bg-surface rounded-2xl p-6 border border-border items-center">
              <Text className="text-body text-ink-muted text-center">
                No submitted tests yet.
              </Text>
            </View>
          ) : (
            <View className="space-y-2.5">
              {perf.recentAttempts.map((item) => (
                <TouchableOpacity
                  key={item.attemptId}
                  activeOpacity={0.8}
                  onPress={() =>
                    router.push({
                      pathname: '/(app)/test/[id]/result',
                      params: { id: item.testId, attemptId: item.attemptId },
                    } as any)
                  }
                  className="bg-surface rounded-2xl p-4 border border-border shadow-2xs flex-row items-center justify-between"
                >
                  <View className="flex-1 mr-3">
                    <Text className="text-body font-bold text-ink mb-0.5" numberOfLines={1}>
                      {item.testTitle}
                    </Text>
                    <Text className="text-caption text-ink-muted">
                      Score: {item.score} / {item.totalMarks} ({item.percentage}%)
                      {item.rank ? ` • Rank ${item.rank}` : ''}
                    </Text>
                  </View>

                  <ChevronRight size={18} color="#9CA3AF" />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}
