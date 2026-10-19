import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  AppState,
  Alert,
  BackHandler,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ScreenCapture from 'expo-screen-capture';
import * as Haptics from 'expo-haptics';
import {
  Clock,
  LayoutGrid,
  ChevronLeft,
  ChevronRight,
  Bookmark,
  CheckCircle,
  CloudOff,
  CloudCheck,
  CheckCircle2,
} from 'lucide-react-native';

import {
  useStartTestAttempt,
  useSaveTestAnswers,
  useSubmitTestAttempt,
} from '../../../../src/api/hooks';
import {
  saveLocalAttempt,
  getLocalAttempt,
  saveLocalAnswer,
  getLocalAnswers,
  getPendingSyncAnswers,
  markAnswersAsSynced,
  markAttemptSubmitted,
  type LocalAnswerRecord,
} from '../../../../src/lib/offline-tests';
import { QuestionContentView } from '../../../../src/components/tests/QuestionContentView';
import { AnswerControl } from '../../../../src/components/tests/AnswerControl';
import { QuestionPaletteBottomSheet } from '../../../../src/components/tests/QuestionPaletteBottomSheet';
import { SubmitSummaryModal } from '../../../../src/components/tests/SubmitSummaryModal';
import { analytics } from '../../../../src/lib/analytics';
import type { StudentTestQuestion } from '@quick2learn/shared';

export default function TestAttemptScreen() {
  const { id: testId, attemptId: initialAttemptId } = useLocalSearchParams<{
    id: string;
    attemptId?: string;
  }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Network mutations
  const startAttemptMutation = useStartTestAttempt();
  const saveAnswersMutation = useSaveTestAnswers();
  const submitAttemptMutation = useSubmitTestAttempt();

  // Attempt State
  const [attemptId, setAttemptId] = useState<string>(initialAttemptId || '');
  const [testTitle, setTestTitle] = useState<string>('Test Assessment');
  const [questions, setQuestions] = useState<StudentTestQuestion[]>([]);
  const [deadlineAt, setDeadlineAt] = useState<string>('');
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [visitedQuestions, setVisitedQuestions] = useState<Set<string>>(new Set());

  // Local answers state: questionId -> LocalAnswerRecord
  const [answers, setAnswers] = useState<Record<string, LocalAnswerRecord>>({});

  // Sync state: 'saved' | 'syncing' | 'offline'
  const [syncStatus, setSyncStatus] = useState<'saved' | 'syncing' | 'offline'>('saved');

  // Timer & AppState
  const [remainingSeconds, setRemainingSeconds] = useState<number>(3600);
  const timerIntervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Modals & Bottom Sheets
  const [showPalette, setShowPalette] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [isAutoSubmitting, setIsAutoSubmitting] = useState(false);

  // Track per-question time spent
  const questionStartTimeRef = useRef<number>(Date.now());

  // 1. Prevent Screenshots and Screen Recording during attempt
  useEffect(() => {
    ScreenCapture.preventScreenCaptureAsync().catch(() => {});
    return () => {
      ScreenCapture.allowScreenCaptureAsync().catch(() => {});
    };
  }, []);

  // 2. Hardware Back Button confirmation
  useEffect(() => {
    const onBackPress = () => {
      Alert.alert(
        'Leave Test?',
        'Your answers are saved on this phone. However, the timer will continue running. Are you sure you want to pause?',
        [
          { text: 'Keep Answering', style: 'cancel' },
          {
            text: 'Leave',
            style: 'destructive',
            onPress: () => router.replace(`/test/${testId}` as any),
          },
        ]
      );
      return true;
    };

    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [testId, router]);

  // 3. Load or Resume Attempt
  useEffect(() => {
    let isMounted = true;

    async function initAttempt() {
      // Check local SQLite first for offline recovery
      if (initialAttemptId) {
        const local = getLocalAttempt(initialAttemptId);
        if (local && local.questions.length > 0) {
          setAttemptId(local.attemptId);
          setTestTitle(local.title);
          setQuestions(local.questions);
          setDeadlineAt(local.deadlineAt);

          const localAnswers = getLocalAnswers(local.attemptId);
          setAnswers(localAnswers);

          // Mark first question visited
          if (local.questions[0]) {
            setVisitedQuestions(new Set([local.questions[0].id]));
          }
          return;
        }
      }

      // If not in local SQLite, start or fetch from server
      if (testId) {
        try {
          const res = await startAttemptMutation.mutateAsync(testId);
          if (!isMounted) return;

          saveLocalAttempt(res);
          setAttemptId(res.attemptId);
          setTestTitle(res.title);
          setQuestions(res.questions);
          setDeadlineAt(res.deadlineAt);

          const localAnswers = getLocalAnswers(res.attemptId);
          setAnswers(localAnswers);

          if (res.questions[0]) {
            setVisitedQuestions(new Set([res.questions[0].id]));
          }

          analytics.track('test_started', {
            testId: testId || res.testId,
            attemptId: res.attemptId,
            title: res.title,
            durationMinutes: res.durationMinutes,
          });
        } catch (err: any) {
          Alert.alert(
            'Error Starting Attempt',
            err?.message || 'Failed to initialize test. Please check network connection.',
            [{ text: 'Go Back', onPress: () => router.back() }]
          );
        }
      }
    }

    initAttempt();

    return () => {
      isMounted = false;
    };
  }, [testId, initialAttemptId]);

  // 4. Timer calculation against server deadline truth
  const recalculateTimer = useCallback(() => {
    if (!deadlineAt) return;
    const deadlineMs = new Date(deadlineAt).getTime();
    const diff = Math.max(0, Math.floor((deadlineMs - Date.now()) / 1000));
    setRemainingSeconds(diff);

    if (diff <= 0) {
      handleAutoSubmit();
    }
  }, [deadlineAt]);

  // Run timer tick every second
  useEffect(() => {
    if (!deadlineAt) return;
    recalculateTimer();

    timerIntervalRef.current = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timerIntervalRef.current as any);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [deadlineAt, recalculateTimer]);

  // AppState listener: When returning to app, timer jumps to exact server deadline
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        recalculateTimer();
        triggerPendingSync();
      }
    });

    return () => subscription.remove();
  }, [recalculateTimer]);

  // 5. Background sync for pending answers
  const triggerPendingSync = useCallback(async () => {
    if (!attemptId) return;
    const pending = getPendingSyncAnswers(attemptId);
    if (pending.length === 0) {
      setSyncStatus('saved');
      return;
    }

    try {
      setSyncStatus('syncing');
      await saveAnswersMutation.mutateAsync({
        attemptId,
        answers: pending,
      });
      // Mark as synced locally
      markAnswersAsSynced(
        attemptId,
        pending.map((p) => p.questionId)
      );
      setSyncStatus('saved');
    } catch {
      // Offline / network failure -> safe in SQLite
      setSyncStatus('offline');
    }
  }, [attemptId, saveAnswersMutation]);

  // Auto-sync debounce
  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const queueSync = useCallback(() => {
    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    syncTimeoutRef.current = setTimeout(() => {
      triggerPendingSync();
    }, 1500);
  }, [triggerPendingSync]);

  // 6. Handle Answer Change (Saved to SQLite immediately!)
  const currentQuestion = questions[currentIndex];

  const handleAnswerChange = (newAnswer: any) => {
    if (!currentQuestion || !attemptId) return;

    const prevRecord = answers[currentQuestion.id];
    const timeSpent =
      (prevRecord?.timeSpentSeconds || 0) +
      Math.floor((Date.now() - questionStartTimeRef.current) / 1000);
    questionStartTimeRef.current = Date.now();

    // 1. Write to SQLite synchronously
    saveLocalAnswer(
      attemptId,
      currentQuestion.id,
      newAnswer,
      timeSpent,
      prevRecord?.markedForReview || false
    );

    // 2. Update React State
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: {
        questionId: currentQuestion.id,
        answer: newAnswer,
        timeSpentSeconds: timeSpent,
        markedForReview: prevRecord?.markedForReview || false,
        syncStatus: 'pending',
        updatedAt: Date.now(),
      },
    }));

    // 3. Queue network sync
    queueSync();
  };

  // 7. Toggle Mark for Review
  const handleToggleReview = () => {
    if (!currentQuestion || !attemptId) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}

    const prevRecord = answers[currentQuestion.id];
    const newMarked = !prevRecord?.markedForReview;

    saveLocalAnswer(
      attemptId,
      currentQuestion.id,
      prevRecord?.answer ?? null,
      prevRecord?.timeSpentSeconds || 0,
      newMarked
    );

    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: {
        questionId: currentQuestion.id,
        answer: prevRecord?.answer ?? null,
        timeSpentSeconds: prevRecord?.timeSpentSeconds || 0,
        markedForReview: newMarked,
        syncStatus: 'pending',
        updatedAt: Date.now(),
      },
    }));

    queueSync();
  };

  // 8. Navigation between questions
  const goToQuestion = (targetIndex: number) => {
    if (targetIndex < 0 || targetIndex >= questions.length) return;

    // Accumulate time spent on current question
    if (currentQuestion) {
      const timeSpent = Math.floor((Date.now() - questionStartTimeRef.current) / 1000);
      const prevRecord = answers[currentQuestion.id];
      const totalTime = (prevRecord?.timeSpentSeconds || 0) + timeSpent;

      saveLocalAnswer(
        attemptId,
        currentQuestion.id,
        prevRecord?.answer ?? null,
        totalTime,
        prevRecord?.markedForReview || false
      );
    }

    questionStartTimeRef.current = Date.now();
    setCurrentIndex(targetIndex);

    const targetQ = questions[targetIndex];
    if (targetQ) {
      setVisitedQuestions((prev) => new Set(prev).add(targetQ.id));
    }
  };

  // 9. Submit Flow (Confirmation & Final Submit)
  const handleConfirmSubmit = async () => {
    if (!attemptId) return;

    try {
      // 1. Flush any pending answers first
      const pending = getPendingSyncAnswers(attemptId);
      if (pending.length > 0) {
        await saveAnswersMutation.mutateAsync({
          attemptId,
          answers: pending,
        });
        markAnswersAsSynced(
          attemptId,
          pending.map((p) => p.questionId)
        );
      }

      // 2. Submit attempt on server
      await submitAttemptMutation.mutateAsync(attemptId);
      markAttemptSubmitted(attemptId);

      const answeredCount = Object.values(answers).filter(
        (a) => a.answer !== null && a.answer !== undefined && a.answer !== ''
      ).length;

      analytics.track('test_submitted', {
        testId: testId || '',
        attemptId,
        answeredCount,
        totalQuestions: questions.length,
      });

      setShowSubmitModal(false);

      // 3. Navigate to result screen
      router.replace({
        pathname: '/(app)/test/[id]/result',
        params: { id: testId, attemptId },
      } as any);
    } catch (err: any) {
      Alert.alert(
        'Submission Failed',
        err?.message || 'Could not submit test. Your answers are safe on this device. Please check internet and retry.',
        [{ text: 'OK' }]
      );
    }
  };

  // Auto-Submit when timer expires
  const handleAutoSubmit = useCallback(async () => {
    if (isAutoSubmitting || !attemptId) return;
    setIsAutoSubmitting(true);

    try {
      // Flush pending
      const pending = getPendingSyncAnswers(attemptId);
      if (pending.length > 0) {
        await saveAnswersMutation
          .mutateAsync({
            attemptId,
            answers: pending,
          })
          .catch(() => {});
      }

      await submitAttemptMutation.mutateAsync(attemptId);
      markAttemptSubmitted(attemptId);

      const answeredCount = Object.values(answers).filter(
        (a) => a.answer !== null && a.answer !== undefined && a.answer !== ''
      ).length;

      analytics.track('test_submitted', {
        testId: testId || '',
        attemptId,
        answeredCount,
        totalQuestions: questions.length,
      });

      router.replace({
        pathname: '/(app)/test/[id]/result',
        params: { id: testId, attemptId },
      } as any);
    } catch {
      // Even if network fails, server auto-submit cron evaluates it
      router.replace({
        pathname: '/(app)/test/[id]/result',
        params: { id: testId, attemptId },
      } as any);
    }
  }, [attemptId, isAutoSubmitting, saveAnswersMutation, submitAttemptMutation, testId, router, answers, questions.length]);

  // Format Timer mm:ss
  const formatTimer = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Timer Color styling: amber at <= 5 mins (300s), red at <= 1 min (60s)
  let timerBadgeBg = 'bg-primary-soft/50 border-primary/20';
  let timerTextColor = 'text-primary';
  let timerIconColor = '#2563EB';

  if (remainingSeconds <= 60) {
    timerBadgeBg = 'bg-red-50 border-red-300';
    timerTextColor = 'text-red-700';
    timerIconColor = '#DC2626';
  } else if (remainingSeconds <= 300) {
    timerBadgeBg = 'bg-amber-50 border-amber-300';
    timerTextColor = 'text-amber-800';
    timerIconColor = '#D97706';
  }

  // Answered, Unanswered, Marked counts
  let answeredCount = 0;
  let markedCount = 0;
  for (const q of questions) {
    const ansRecord = answers[q.id];
    const isAns =
      ansRecord?.answer !== null &&
      ansRecord?.answer !== undefined &&
      (Array.isArray(ansRecord.answer)
        ? ansRecord.answer.length > 0
        : String(ansRecord.answer).trim().length > 0);
    if (ansRecord?.markedForReview) markedCount++;
    if (isAns) answeredCount++;
  }
  const unansweredCount = questions.length - answeredCount;

  if (questions.length === 0) {
    return (
      <View className="flex-1 bg-surface-subtle items-center justify-center p-6">
        <ActivityIndicator size="large" color="#2563EB" />
        <Text className="text-body text-ink-muted mt-3 font-medium">
          Setting up test environment...
        </Text>
      </View>
    );
  }

  const currentAnswerRecord = currentQuestion ? answers[currentQuestion.id] : null;
  const isCurrentMarked = Boolean(currentAnswerRecord?.markedForReview);

  return (
    <View className="flex-1 bg-surface-subtle" style={{ paddingTop: insets.top }}>
      {/* 1. TOP BAR: Timer, Question Number, Sync Indicator, Palette Button */}
      <View className="px-4 py-3 bg-surface border-b border-border/80 flex-row items-center justify-between">
        {/* Left: Timer Badge */}
        <View
          className={`flex-row items-center px-3 py-1.5 rounded-full border ${timerBadgeBg}`}
        >
          <Clock size={15} color={timerIconColor} />
          <Text className={`text-small font-mono font-bold ml-1.5 ${timerTextColor}`}>
            {formatTimer(remainingSeconds)}
          </Text>
        </View>

        {/* Center: Sync Status Indicator */}
        <View className="flex-row items-center">
          {syncStatus === 'syncing' ? (
            <ActivityIndicator size="small" color="#2563EB" />
          ) : syncStatus === 'offline' ? (
            <View className="flex-row items-center bg-gray-100 px-2 py-0.5 rounded border border-gray-300">
              <CloudOff size={12} color="#6B7280" />
              <Text className="text-[10px] text-ink-muted font-medium ml-1">
                Offline — will sync
              </Text>
            </View>
          ) : (
            <View className="flex-row items-center">
              <View className="w-2 h-2 rounded-full bg-emerald-500 mr-1" />
              <Text className="text-[10px] text-emerald-700 font-semibold">
                Saved
              </Text>
            </View>
          )}
        </View>

        {/* Right: Palette Button */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setShowPalette(true)}
          className="w-10 h-10 rounded-xl bg-surface-subtle border border-border items-center justify-center"
          accessibilityRole="button"
          accessibilityLabel="Open question palette"
        >
          <LayoutGrid size={18} color="#1F2937" />
        </TouchableOpacity>
      </View>

      {/* 2. QUESTION & ANSWER SCROLL AREA */}
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 110 }}
        showsVerticalScrollIndicator={false}
      >
        {currentQuestion ? (
          <>
            {/* Stem, Case Group, Diagrams */}
            <QuestionContentView
              question={currentQuestion}
              questionNumber={currentIndex + 1}
              totalQuestions={questions.length}
            />

            {/* Answer Controls */}
            <View className="mt-4">
              <AnswerControl
                question={currentQuestion}
                currentAnswer={currentAnswerRecord?.answer ?? null}
                onAnswerChange={handleAnswerChange}
              />
            </View>
          </>
        ) : null}
      </ScrollView>

      {/* 3. BOTTOM BAR: Previous, Mark for Review, Save & Next */}
      <View
        style={{ paddingBottom: Math.max(insets.bottom, 12) }}
        className="absolute bottom-0 left-0 right-0 bg-surface border-t border-border px-4 pt-3 flex-row items-center justify-between shadow-lg"
      >
        {/* Previous Button */}
        <TouchableOpacity
          activeOpacity={0.7}
          disabled={currentIndex === 0}
          onPress={() => goToQuestion(currentIndex - 1)}
          className={`h-12 px-3.5 rounded-xl border flex-row items-center justify-center ${
            currentIndex === 0
              ? 'border-border/40 bg-surface-subtle opacity-40'
              : 'border-border bg-surface'
          }`}
        >
          <ChevronLeft size={18} color={currentIndex === 0 ? '#9CA3AF' : '#1F2937'} />
          <Text
            className={`text-small font-bold ml-1 ${
              currentIndex === 0 ? 'text-ink-muted' : 'text-ink'
            }`}
          >
            Previous
          </Text>
        </TouchableOpacity>

        {/* Mark for Review Button */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleToggleReview}
          className={`h-12 px-3.5 rounded-xl border flex-row items-center justify-center mx-2 ${
            isCurrentMarked
              ? 'bg-amber-500 border-amber-600'
              : 'bg-amber-50 border-amber-200'
          }`}
        >
          <Bookmark
            size={16}
            color={isCurrentMarked ? '#FFFFFF' : '#D97706'}
            fill={isCurrentMarked ? '#FFFFFF' : 'transparent'}
          />
          <Text
            className={`text-small font-bold ml-1.5 ${
              isCurrentMarked ? 'text-white' : 'text-amber-800'
            }`}
          >
            {isCurrentMarked ? 'Marked' : 'Review'}
          </Text>
        </TouchableOpacity>

        {/* Save & Next / Submit Button */}
        {currentIndex < questions.length - 1 ? (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => goToQuestion(currentIndex + 1)}
            className="flex-1 h-12 rounded-xl bg-primary flex-row items-center justify-center"
          >
            <Text className="text-small font-bold text-white mr-1">
              Save & Next
            </Text>
            <ChevronRight size={18} color="#FFFFFF" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setShowSubmitModal(true)}
            className="flex-1 h-12 rounded-xl bg-emerald-600 flex-row items-center justify-center"
          >
            <CheckCircle2 size={18} color="#FFFFFF" />
            <Text className="text-small font-bold text-white ml-1.5">
              Submit Test
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* 4. Question Palette Bottom Sheet */}
      <QuestionPaletteBottomSheet
        visible={showPalette}
        onClose={() => setShowPalette(false)}
        questions={questions}
        currentIndex={currentIndex}
        answers={answers}
        visitedQuestions={visitedQuestions}
        onSelectQuestion={(idx) => goToQuestion(idx)}
      />

      {/* 5. Pre-Submission Confirmation Modal */}
      <SubmitSummaryModal
        visible={showSubmitModal}
        totalQuestions={questions.length}
        answeredCount={answeredCount}
        unansweredCount={unansweredCount}
        markedCount={markedCount}
        remainingTimeFormatted={formatTimer(remainingSeconds)}
        isSubmitting={submitAttemptMutation.isPending}
        onConfirmSubmit={handleConfirmSubmit}
        onCancel={() => setShowSubmitModal(false)}
      />
    </View>
  );
}
