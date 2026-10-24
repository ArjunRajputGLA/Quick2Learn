import React, { useState } from 'react';
import { View, Text, ScrollView, RefreshControl, ActivityIndicator, Alert } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  Clock,
  HelpCircle,
  Award,
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
  Play,
  RotateCcw,
} from 'lucide-react-native';
import { Screen } from '../../../src/components/ui/Screen';
import { AppHeader } from '../../../src/components/ui/AppHeader';
import { Button } from '../../../src/components/ui/Button';
import { Badge } from '../../../src/components/ui/Badge';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { BookLoader } from '../../../src/components/ui/BookLoader';
import { useTestDetail, useStartTestAttempt } from '../../../src/api/hooks';
import { saveLocalAttempt } from '../../../src/lib/offline-tests';

export default function TestIntroScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const { data, isLoading, error, refetch } = useTestDetail(id || '');
  const startAttemptMutation = useStartTestAttempt();
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
      console.warn('[TestIntro] Refresh error:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const test = data?.test;

  const handleStartOrResume = async () => {
    if (!id) return;
    try {
      const response = await startAttemptMutation.mutateAsync(id);
      // Cache attempt locally in SQLite
      saveLocalAttempt(response);
      // Navigate to attempt screen
      router.replace({
        pathname: '/(app)/test/[id]/attempt',
        params: { id, attemptId: response.attemptId },
      } as any);
    } catch (err: any) {
      Alert.alert(
        'Unable to Start Test',
        err?.message || 'Could not initiate test attempt. Please check your connection and try again.'
      );
    }
  };

  const handleViewResult = () => {
    if (test?.latestAttemptId) {
      router.push({
        pathname: '/(app)/test/[id]/result',
        params: { id: test.id, attemptId: test.latestAttemptId },
      } as any);
    }
  };

  return (
    <Screen
      scrollable={false}
      header={<AppHeader title="Test Instructions" showBack />}
    >
      {isLoading && !test ? (
        <View className="flex-1 items-center justify-center p-6">
          <BookLoader text="Loading assessment details..." size="lg" />
        </View>
      ) : !test ? (
        <View className="flex-1 justify-center p-6">
          <EmptyState
            title="Test not found"
            description="The assessment you are looking for does not exist or is not available."
            actionLabel="Go Back"
            onAction={() => router.back()}
          />
        </View>
      ) : (
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
          {/* Main Info Card */}
          <View className="bg-surface rounded-2xl p-5 border border-border mb-4 shadow-xs">
            <View className="flex-row items-center space-x-2 mb-2">
              <Badge
                label={test.kind ? test.kind.replace('_', ' ').toUpperCase() : 'TEST'}
                variant="primary"
                size="sm"
              />
              {test.batchName ? (
                <Badge label={test.batchName} variant="neutral" size="sm" />
              ) : null}
            </View>

            <Text className="text-h2 font-bold text-ink mb-1.5 leading-snug">
              {test.title}
            </Text>

            <Text className="text-small text-ink-muted mb-4 font-medium">
              {test.subjectName || 'Maths & Science'}
            </Text>

            {/* 4 Stats Chips: Questions, Marks, Duration, Negative Marking */}
            <View className="grid grid-cols-2 gap-2.5 mb-2">
              <View className="flex-row items-center bg-surface-subtle p-3 rounded-xl border border-border/60">
                <View className="w-8 h-8 rounded-lg bg-blue-50 items-center justify-center mr-2.5">
                  <HelpCircle size={17} color="#2563EB" />
                </View>
                <View>
                  <Text className="text-[11px] font-semibold text-ink-muted uppercase">
                    Questions
                  </Text>
                  <Text className="text-body font-bold text-ink">
                    {test.questionsCount || test.questions?.length || 0}
                  </Text>
                </View>
              </View>

              <View className="flex-row items-center bg-surface-subtle p-3 rounded-xl border border-border/60">
                <View className="w-8 h-8 rounded-lg bg-emerald-50 items-center justify-center mr-2.5">
                  <Award size={17} color="#059669" />
                </View>
                <View>
                  <Text className="text-[11px] font-semibold text-ink-muted uppercase">
                    Total Marks
                  </Text>
                  <Text className="text-body font-bold text-ink">
                    {test.totalMarks}
                  </Text>
                </View>
              </View>

              <View className="flex-row items-center bg-surface-subtle p-3 rounded-xl border border-border/60">
                <View className="w-8 h-8 rounded-lg bg-purple-50 items-center justify-center mr-2.5">
                  <Clock size={17} color="#7C3AED" />
                </View>
                <View>
                  <Text className="text-[11px] font-semibold text-ink-muted uppercase">
                    Duration
                  </Text>
                  <Text className="text-body font-bold text-ink">
                    {test.durationMinutes} Mins
                  </Text>
                </View>
              </View>

              <View className="flex-row items-center bg-surface-subtle p-3 rounded-xl border border-border/60">
                <View className="w-8 h-8 rounded-lg bg-amber-50 items-center justify-center mr-2.5">
                  <AlertTriangle size={17} color="#D97706" />
                </View>
                <View>
                  <Text className="text-[11px] font-semibold text-ink-muted uppercase">
                    Marking
                  </Text>
                  <Text className="text-body font-bold text-ink">
                    {test.questions?.some((q: any) => q.negativeMarks > 0)
                      ? 'Negative'
                      : 'No Negative'}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Test Attempt Status Banner if previous or in-progress */}
          {test.latestAttemptStatus === 'in_progress' ? (
            <View className="bg-amber-50 rounded-2xl p-4 border border-amber-200 mb-4 flex-row items-center justify-between">
              <View className="flex-1 mr-3">
                <Text className="text-body font-bold text-amber-900">
                  Attempt in progress
                </Text>
                <Text className="text-caption text-amber-800">
                  You have an unfinished attempt. Resume before the server deadline.
                </Text>
              </View>
              <RotateCcw size={20} color="#D97706" />
            </View>
          ) : test.myBestScore !== null && test.myBestScore !== undefined && test.myBestScore >= 0 ? (
            <View className="bg-emerald-50 rounded-2xl p-4 border border-emerald-200 mb-4 flex-row items-center justify-between">
              <View className="flex-1 mr-3">
                <Text className="text-body font-bold text-emerald-900">
                  Previously Attempted
                </Text>
                <Text className="text-caption text-emerald-800">
                  Best Score: {test.myBestScore} / {test.totalMarks}
                </Text>
              </View>
              <Button variant="outline" size="sm" onPress={handleViewResult}>
                View Result
              </Button>
            </View>
          ) : null}

          {/* Rules & Instructions */}
          <View className="bg-surface rounded-2xl p-5 border border-border mb-6 shadow-xs">
            <View className="flex-row items-center mb-3">
              <ShieldCheck size={20} color="#2563EB" />
              <Text className="text-h3 font-bold text-ink ml-2">
                Important Rules & Guidelines
              </Text>
            </View>

            <View className="space-y-3">
              <View className="flex-row items-start">
                <CheckCircle2 size={16} color="#059669" className="mt-0.5 mr-2.5 flex-shrink-0" />
                <Text className="text-small text-ink-muted flex-1 leading-relaxed">
                  <Text className="font-semibold text-ink">Continuous Timer:</Text> The server deadline is the source of truth. Leaving or switching apps will <Text className="font-semibold text-ink">not</Text> pause the timer.
                </Text>
              </View>

              <View className="flex-row items-start">
                <CheckCircle2 size={16} color="#059669" className="mt-0.5 mr-2.5 flex-shrink-0" />
                <Text className="text-small text-ink-muted flex-1 leading-relaxed">
                  <Text className="font-semibold text-ink">Local-First Safety:</Text> Every answer is saved on your phone immediately and synced in the background. Even if your internet disconnects, your progress is never lost.
                </Text>
              </View>

              <View className="flex-row items-start">
                <CheckCircle2 size={16} color="#059669" className="mt-0.5 mr-2.5 flex-shrink-0" />
                <Text className="text-small text-ink-muted flex-1 leading-relaxed">
                  <Text className="font-semibold text-ink">Anti-Cheating Policy:</Text> Screenshots and screen recordings are strictly blocked during the test attempt.
                </Text>
              </View>

              <View className="flex-row items-start">
                <CheckCircle2 size={16} color="#059669" className="mt-0.5 mr-2.5 flex-shrink-0" />
                <Text className="text-small text-ink-muted flex-1 leading-relaxed">
                  <Text className="font-semibold text-ink">Auto-Submit:</Text> When the countdown timer reaches 00:00, your test will be automatically submitted and graded.
                </Text>
              </View>
            </View>
          </View>

          {/* Action Button */}
          <Button
            variant="primary"
            size="lg"
            loading={startAttemptMutation.isPending}
            onPress={handleStartOrResume}
            icon={
              test.latestAttemptStatus === 'in_progress' ? (
                <RotateCcw size={18} color="#FFFFFF" />
              ) : (
                <Play size={18} color="#FFFFFF" />
              )
            }
          >
            {test.latestAttemptStatus === 'in_progress' ? 'Resume Test' : 'Start Test'}
          </Button>
        </ScrollView>
      )}
    </Screen>
  );
}
