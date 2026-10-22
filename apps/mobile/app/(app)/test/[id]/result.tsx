import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Share,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  Award,
  Trophy,
  Target,
  Clock,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ArrowRight,
  BookOpen,
  MessageSquarePlus,
  Share2,
  ChevronDown,
  ChevronUp,
  AlertCircle,
} from 'lucide-react-native';
import { Screen } from '../../../../src/components/ui/Screen';
import { AppHeader } from '../../../../src/components/ui/AppHeader';
import { Button } from '../../../../src/components/ui/Button';
import { Badge } from '../../../../src/components/ui/Badge';
import { Chip } from '../../../../src/components/ui/Chip';
import { ProgressRing } from '../../../../src/components/ui/ProgressRing';
import { ProgressBar } from '../../../../src/components/ui/ProgressBar';
import { MathView } from '../../../../src/components/composite/MathView';
import { useTestResult } from '../../../../src/api/hooks';
import type { TestQuestionResult } from '@quick2learn/shared';

export default function TestResultScreen() {
  const { id: testId, attemptId } = useLocalSearchParams<{
    id: string;
    attemptId: string;
  }>();
  const router = useRouter();

  const { data: result, isLoading, error, refetch } = useTestResult(attemptId || '');
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
      console.warn('[TestResult] Refresh error:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Filter questions by All / Incorrect / Correct / Skipped
  const [filter, setFilter] = useState<'all' | 'wrong' | 'correct' | 'skipped'>('all');
  const [expandedQuestionId, setExpandedQuestionId] = useState<string | null>(null);

  const handleShareResult = async () => {
    if (!result) return;
    try {
      await Share.share({
        title: `${result.title} Result`,
        message: `I scored ${result.score}/${result.totalMarks} (${result.percentage}%) in ${result.title} on Quick2Learn!`,
      });
    } catch {}
  };

  const handleAskDoubt = (q: TestQuestionResult) => {
    router.push({
      pathname: '/(app)/doubt/new',
      params: {
        sourceType: 'test_question',
        sourceId: q.questionId,
        questionId: q.questionId,
        testId: result?.testId,
        testTitle: result?.title,
        questionPosition: String(q.position),
        chapterId: (q as any).chapterId || '',
        subjectId: (result as any)?.subjectId || '',
      },
    } as any);
  };

  const handlePracticeChapter = (chapterId: string | null) => {
    if (chapterId) {
      router.push(`/chapter/${chapterId}` as any);
    } else {
      router.push('/(app)/(tabs)/learn' as any);
    }
  };

  if (isLoading && !result) {
    return (
      <Screen header={<AppHeader title="Test Result" showBack />}>
        <View className="flex-1 items-center justify-center p-6">
          <ActivityIndicator size="large" color="#2563EB" />
          <Text className="text-body text-ink-muted mt-3">Evaluating results & ranking...</Text>
        </View>
      </Screen>
    );
  }

  if (!result) {
    return (
      <Screen header={<AppHeader title="Test Result" showBack />}>
        <View className="flex-1 items-center justify-center p-6">
          <AlertCircle size={40} color="#DC2626" />
          <Text className="text-h3 font-bold text-ink mt-3">Result Not Found</Text>
          <Text className="text-body text-ink-muted text-center mt-1">
            Unable to load grading analysis for this attempt.
          </Text>
          <Button
            variant="outline"
            size="md"
            className="mt-4"
            onPress={() => router.back()}
          >
            Go Back
          </Button>
        </View>
      </Screen>
    );
  }

  const formatTimeSpent = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins}m ${remainder}s`;
  };

  // Find weak chapters (accuracy < 70%)
  const weakChapters = result.chapterBreakdown.filter(
    (ch) => ch.accuracyPercentage < 70
  );

  // Filtered questions
  const filteredQuestions = result.questions.filter((q) => {
    if (filter === 'correct') return q.isCorrect === true;
    if (filter === 'wrong') return q.isCorrect === false && q.studentAnswer !== null;
    if (filter === 'skipped') return q.studentAnswer === null || q.studentAnswer === undefined;
    return true;
  });

  return (
    <Screen
      scrollable={false}
      header={
        <AppHeader
          title="Performance Analysis"
          showBack
          rightActions={
            <TouchableOpacity
              onPress={handleShareResult}
              className="w-10 h-10 items-center justify-center -mr-2"
            >
              <Share2 size={20} color="#1F2937" />
            </TouchableOpacity>
          }
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
        {/* 1. HERO SCORE CARD */}
        <View className="bg-surface rounded-3xl p-5 border border-border shadow-xs mb-4">
          <Text className="text-caption font-bold uppercase tracking-wider text-primary mb-1">
            Result Declared
          </Text>
          <Text className="text-h2 font-bold text-ink mb-4 leading-snug">
            {result.title}
          </Text>

          {/* Progress Ring & Score breakdown */}
          <View className="flex-row items-center justify-between mb-5">
            <View className="items-center mr-4">
              <ProgressRing
                progress={result.percentage}
                size={88}
                strokeWidth={8}
                color={result.percentage >= 60 ? '#059669' : result.percentage >= 40 ? '#D97706' : '#DC2626'}
                trackColor="#F3F4F6"
                showText={false}
              />
              <View className="absolute inset-0 items-center justify-center">
                <Text className="text-h3 font-bold text-ink">
                  {Math.round(result.percentage)}%
                </Text>
              </View>
            </View>

            <View className="flex-1 justify-center">
              <Text className="text-caption text-ink-muted">Total Score</Text>
              <View className="flex-row items-baseline mb-1">
                <Text className="text-h1 font-extrabold text-ink">
                  {result.score}
                </Text>
                <Text className="text-body font-semibold text-ink-muted ml-1">
                  / {result.totalMarks}
                </Text>
              </View>

              {result.rank !== null && result.rank !== undefined ? (
                <View className="flex-row items-center">
                  <Trophy size={14} color="#D97706" />
                  <Text className="text-caption font-bold text-amber-800 ml-1">
                    Rank {result.rank}
                    {result.totalParticipants ? ` of ${result.totalParticipants}` : ''}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>

          {/* 3 Metric Cards: Rank, Accuracy, Time Taken */}
          <View className="grid grid-cols-3 gap-2 pt-4 border-t border-border/60">
            <View className="bg-surface-subtle p-2.5 rounded-xl border border-border/50 items-center">
              <Target size={18} color="#2563EB" />
              <Text className="text-caption text-ink-muted mt-1">Accuracy</Text>
              <Text className="text-small font-bold text-ink">
                {result.accuracy}%
              </Text>
            </View>

            <View className="bg-surface-subtle p-2.5 rounded-xl border border-border/50 items-center">
              <CheckCircle2 size={18} color="#059669" />
              <Text className="text-caption text-ink-muted mt-1">Correct</Text>
              <Text className="text-small font-bold text-emerald-700">
                {result.correct} / {result.questions.length}
              </Text>
            </View>

            <View className="bg-surface-subtle p-2.5 rounded-xl border border-border/50 items-center">
              <Clock size={18} color="#7C3AED" />
              <Text className="text-caption text-ink-muted mt-1">Time Spent</Text>
              <Text className="text-small font-bold text-ink">
                {formatTimeSpent(result.timeSpentSeconds)}
              </Text>
            </View>
          </View>
        </View>

        {/* 2. CHAPTER-WISE PERFORMANCE BARS */}
        {result.chapterBreakdown.length > 0 ? (
          <View className="bg-surface rounded-2xl p-4 border border-border shadow-xs mb-4">
            <Text className="text-h3 font-bold text-ink mb-3">
              Chapter-wise Breakdown
            </Text>

            <View className="space-y-3.5">
              {result.chapterBreakdown.map((ch, idx) => (
                <View key={ch.chapterId || idx} className="space-y-1.5">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-body font-semibold text-ink flex-1 mr-2" numberOfLines={1}>
                      {ch.chapterTitle}
                    </Text>
                    <Text className="text-caption font-bold text-ink">
                      {ch.marksObtained}/{ch.totalMarks} ({ch.accuracyPercentage}%)
                    </Text>
                  </View>

                  <ProgressBar
                    progress={ch.accuracyPercentage}
                    height={6}
                    color={ch.accuracyPercentage >= 70 ? '#059669' : ch.accuracyPercentage >= 40 ? '#D97706' : '#DC2626'}
                    trackColor="#F3F4F6"
                  />
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {/* 3. PRACTISE WEAK CHAPTERS RECOMMENDATION */}
        {weakChapters.length > 0 ? (
          <View className="bg-amber-50/70 rounded-2xl p-4 border border-amber-200 shadow-xs mb-4">
            <View className="flex-row items-center mb-1.5">
              <BookOpen size={18} color="#D97706" />
              <Text className="text-body font-bold text-amber-900 ml-2">
                Recommended Revision
              </Text>
            </View>
            <Text className="text-caption text-amber-800 mb-3 leading-relaxed">
              Dinesh Sir recommends revising lectures for chapters with scores below 70%:
            </Text>

            <View className="space-y-2">
              {weakChapters.map((ch) => (
                <TouchableOpacity
                  key={ch.chapterId || ch.chapterTitle}
                  activeOpacity={0.8}
                  onPress={() => handlePracticeChapter(ch.chapterId)}
                  className="bg-surface p-3 rounded-xl border border-amber-200 flex-row items-center justify-between"
                >
                  <View className="flex-1 mr-2">
                    <Text className="text-small font-bold text-ink" numberOfLines={1}>
                      {ch.chapterTitle}
                    </Text>
                    <Text className="text-[11px] text-amber-800">
                      Accuracy: {ch.accuracyPercentage}% • {ch.wrongQuestions} incorrect questions
                    </Text>
                  </View>
                  <View className="flex-row items-center">
                    <Text className="text-caption font-bold text-primary mr-1">
                      Lectures
                    </Text>
                    <ArrowRight size={14} color="#2563EB" />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : null}

        {/* 4. QUESTION-BY-QUESTION REVIEW */}
        <View className="space-y-3">
          <View className="flex-row items-center justify-between">
            <Text className="text-h3 font-bold text-ink">
              Question Review ({result.questions.length})
            </Text>
          </View>

          {!result.solutionsAvailable ? (
            <View className="bg-primary-soft/40 p-4 rounded-2xl border border-primary/20 flex-row items-start">
              <AlertCircle size={18} color="#2563EB" className="mt-0.5 mr-2" />
              <Text className="text-caption text-primary flex-1 leading-relaxed">
                {result.solutionsNote || 'Detailed step-wise solutions will be unlocked after the submission deadline.'}
              </Text>
            </View>
          ) : null}

          {/* Filter Pills */}
          <View className="flex-row space-x-2">
            {(['all', 'wrong', 'correct', 'skipped'] as const).map((tab) => (
              <Chip
                key={tab}
                label={
                  tab === 'all'
                    ? 'All'
                    : tab === 'wrong'
                    ? `Wrong (${result.wrong})`
                    : tab === 'correct'
                    ? `Correct (${result.correct})`
                    : `Skipped (${result.skipped})`
                }
                selected={filter === tab}
                onPress={() => setFilter(tab)}
              />
            ))}
          </View>

          {/* Question List */}
          <View className="space-y-3 mt-1">
            {filteredQuestions.map((q) => {
              const isExpanded = expandedQuestionId === q.questionId;
              const isCorrect = q.isCorrect === true;
              const isSkipped = q.studentAnswer === null || q.studentAnswer === undefined;
              const isWrong = !isCorrect && !isSkipped;

              return (
                <View
                  key={q.questionId}
                  className="bg-surface rounded-2xl border border-border p-4 shadow-2xs space-y-3"
                >
                  {/* Status header */}
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() =>
                      setExpandedQuestionId(isExpanded ? null : q.questionId)
                    }
                    className="flex-row items-center justify-between"
                  >
                    <View className="flex-row items-center space-x-2">
                      <Badge
                        label={`Q${q.position}`}
                        variant={isCorrect ? 'success' : isWrong ? 'danger' : 'neutral'}
                        size="sm"
                      />
                      <Text
                        className={`text-caption font-bold ml-1.5 ${
                          isCorrect
                            ? 'text-emerald-700'
                            : isWrong
                            ? 'text-red-700'
                            : 'text-ink-muted'
                        }`}
                      >
                        {isCorrect
                          ? `+${q.marksAwarded} Marks`
                          : isWrong
                          ? `-${q.negativeMarks} Marks`
                          : '0 Marks (Skipped)'}
                      </Text>
                    </View>

                    <View className="flex-row items-center">
                      <Text className="text-[11px] text-ink-muted mr-1">
                        {isExpanded ? 'Hide' : 'Solution'}
                      </Text>
                      {isExpanded ? (
                        <ChevronUp size={16} color="#6B7280" />
                      ) : (
                        <ChevronDown size={16} color="#6B7280" />
                      )}
                    </View>
                  </TouchableOpacity>

                  {/* Stem */}
                  <MathView content={q.stem} fontSize={15} color="#1F2937" />

                  {/* Student Answer vs Correct Answer */}
                  <View className="bg-surface-subtle p-3 rounded-xl border border-border/60 space-y-2">
                    <View className="flex-row items-start">
                      <Text className="text-caption font-bold text-ink-muted w-24">
                        Your Answer:
                      </Text>
                      <View className="flex-1">
                        <Text
                          className={`text-small font-semibold ${
                            isCorrect
                              ? 'text-emerald-700'
                              : isWrong
                              ? 'text-red-700'
                              : 'text-ink-muted'
                          }`}
                        >
                          {isSkipped
                            ? 'Not Attempted'
                            : typeof q.studentAnswer === 'object'
                            ? JSON.stringify(q.studentAnswer)
                            : String(q.studentAnswer)}
                        </Text>
                      </View>
                    </View>

                    {result.solutionsAvailable && q.correctAnswer !== undefined ? (
                      <View className="flex-row items-start pt-1.5 border-t border-border/40">
                        <Text className="text-caption font-bold text-emerald-800 w-24">
                          Correct Answer:
                        </Text>
                        <View className="flex-1">
                          <Text className="text-small font-bold text-emerald-800">
                            {typeof q.correctAnswer === 'object'
                              ? JSON.stringify(q.correctAnswer)
                              : String(q.correctAnswer)}
                          </Text>
                        </View>
                      </View>
                    ) : null}
                  </View>

                  {/* Expanded Solution View (rendered via MathView) */}
                  {isExpanded && result.solutionsAvailable && q.solution ? (
                    <View className="bg-emerald-50/50 p-3.5 rounded-xl border border-emerald-200 space-y-1.5">
                      <Text className="text-caption font-bold uppercase tracking-wider text-emerald-800">
                        Step-by-step Solution
                      </Text>
                      <MathView
                        content={q.solution}
                        fontSize={14}
                        color="#064E3B"
                      />
                    </View>
                  ) : null}

                  {/* Ask a Doubt Button on any question (Prompt 11) */}
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => handleAskDoubt(q)}
                    className="flex-row items-center justify-center py-2 px-3 bg-surface-subtle border border-primary/20 rounded-xl"
                  >
                    <MessageSquarePlus size={15} color="#2563EB" />
                    <Text className="text-small font-bold text-primary ml-1.5">
                      Ask Dinesh Sir a Doubt on Q{q.position}
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}
