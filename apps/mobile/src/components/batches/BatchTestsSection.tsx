import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Pressable, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Award,
  Clock,
  CheckCircle2,
  Calendar,
  AlertCircle,
  FileCheck,
  Play,
  RotateCcw,
  XCircle,
} from 'lucide-react-native';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Skeleton } from '../ui/Skeleton';
import { EmptyState } from '../ui/EmptyState';
import { useAvailableTests } from '../../api/hooks';
import type { BatchDetailResponse, TestListItem } from '@quick2learn/shared';

interface BatchTestsSectionProps {
  batchDetail?: BatchDetailResponse;
  isLoading: boolean;
}

type TabType = 'live' | 'upcoming' | 'completed' | 'missed';

export function BatchTestsSection({
  batchDetail,
  isLoading: isBatchLoading,
}: BatchTestsSectionProps) {
  const router = useRouter();
  const batchId = batchDetail?.id;

  const { data, isLoading: isTestsLoading } = useAvailableTests({
    batchId,
  });

  const [activeTab, setActiveTab] = useState<TabType>('live');

  if (isBatchLoading || isTestsLoading) {
    return (
      <View className="space-y-4">
        <Skeleton width="100%" height={120} borderRadius={16} />
        <Skeleton width="100%" height={120} borderRadius={16} />
      </View>
    );
  }

  const allTests: TestListItem[] = data?.tests || [];
  const now = new Date();

  // Categorize tests
  const liveTests: TestListItem[] = [];
  const upcomingTests: TestListItem[] = [];
  const completedTests: TestListItem[] = [];
  const missedTests: TestListItem[] = [];

  for (const t of allTests) {
    const startsAt = t.startsAt ? new Date(t.startsAt) : null;
    const endsAt = t.endsAt ? new Date(t.endsAt) : null;
    const hasSubmitted =
      t.latestAttemptStatus === 'submitted' ||
      t.latestAttemptStatus === 'auto_submitted';
    const isOngoing = t.latestAttemptStatus === 'in_progress';

    if (hasSubmitted) {
      completedTests.push(t);
    } else if (isOngoing) {
      // In progress always belongs in live
      liveTests.push(t);
    } else if (endsAt && endsAt < now) {
      missedTests.push(t);
    } else if (startsAt && startsAt > now) {
      upcomingTests.push(t);
    } else {
      // Live now
      liveTests.push(t);
    }
  }

  const getActiveList = () => {
    switch (activeTab) {
      case 'live':
        return liveTests;
      case 'upcoming':
        return upcomingTests;
      case 'completed':
        return completedTests;
      case 'missed':
        return missedTests;
    }
  };

  const currentList = getActiveList();

  const handleTestPress = (t: TestListItem) => {
    if (t.latestAttemptStatus === 'submitted' || t.latestAttemptStatus === 'auto_submitted') {
      if (t.latestAttemptId) {
        router.push({
          pathname: '/(app)/test/[id]/result',
          params: { id: t.id, attemptId: t.latestAttemptId },
        } as any);
      } else {
        router.push(`/test/${t.id}` as any);
      }
    } else {
      router.push(`/test/${t.id}` as any);
    }
  };

  return (
    <View className="space-y-4">
      {/* Test Series Banner */}
      <View className="p-4 rounded-2xl bg-primary-soft/40 border border-primary/20 flex-row items-center justify-between shadow-2xs">
        <View className="flex-1 mr-3">
          <Text className="text-body font-bold text-ink">
            Batch Test Series
          </Text>
          <Text className="text-caption text-ink-muted">
            Weekly mock tests and chapter assessments graded with Dinesh Sir's step-wise marks.
          </Text>
        </View>
        <Award size={26} color="#2563EB" />
      </View>

      {/* Tabs: Live now, Upcoming, Completed, Missed */}
      <View className="flex-row bg-surface rounded-2xl p-1.5 border border-border shadow-2xs">
        {(
          [
            { key: 'live', label: `Live (${liveTests.length})` },
            { key: 'upcoming', label: `Upcoming (${upcomingTests.length})` },
            { key: 'completed', label: `Completed (${completedTests.length})` },
            { key: 'missed', label: `Missed (${missedTests.length})` },
          ] as const
        ).map((tab) => (
          <Pressable
            key={tab.key}
            onPress={() => setActiveTab(tab.key)}
            style={({ pressed }) => ({
              flex: 1,
              paddingVertical: 8,
              borderRadius: 12,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: activeTab === tab.key
                ? (pressed ? '#1D4ED8' : '#2563EB')
                : (pressed ? '#E2E8F0' : 'transparent'),
              ...(Platform.OS === 'web'
                ? ({
                    cursor: 'pointer',
                    userSelect: 'none',
                    WebkitUserSelect: 'none',
                    WebkitTapHighlightColor: 'transparent',
                    outline: 'none',
                  } as any)
                : {}),
            })}
          >
            <Text
              style={{
                fontSize: 11,
                fontWeight: '700',
                color: activeTab === tab.key ? '#FFFFFF' : '#64748B',
                ...(Platform.OS === 'web'
                  ? ({
                      userSelect: 'none',
                      WebkitUserSelect: 'none',
                    } as any)
                  : {}),
              }}
            >
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Test Cards List */}
      {currentList.length === 0 ? (
        <View className="bg-surface rounded-2xl p-6 border border-border items-center">
          <Text className="text-body text-ink-muted text-center">
            {activeTab === 'live'
              ? 'No live tests active at the moment.'
              : activeTab === 'upcoming'
              ? 'No upcoming tests scheduled yet.'
              : activeTab === 'completed'
              ? 'You have not completed any tests in this batch yet.'
              : 'Great job! No missed assessments.'}
          </Text>
        </View>
      ) : (
        <View className="space-y-3">
          {currentList.map((test) => {
            const isCompleted =
              test.latestAttemptStatus === 'submitted' ||
              test.latestAttemptStatus === 'auto_submitted';
            const isInProgress = test.latestAttemptStatus === 'in_progress';
            const isMissed = activeTab === 'missed';

            return (
              <View
                key={test.id}
                className="p-4 rounded-2xl bg-surface border border-border shadow-2xs space-y-3"
              >
                <View className="flex-row items-center justify-between">
                  <Badge
                    label={
                      isCompleted
                        ? 'COMPLETED · GRADED'
                        : isInProgress
                        ? 'RESUME TEST'
                        : isMissed
                        ? 'MISSED'
                        : activeTab === 'upcoming'
                        ? 'UPCOMING'
                        : 'LIVE NOW'
                    }
                    variant={
                      isCompleted
                        ? 'success'
                        : isInProgress
                        ? 'warning'
                        : isMissed
                        ? 'danger'
                        : 'primary'
                    }
                    size="sm"
                  />
                  <Text className="text-caption font-semibold text-ink-muted">
                    {test.totalMarks} Marks · {test.durationMinutes} Mins
                  </Text>
                </View>

                <Text className="text-body font-bold text-ink">
                  {test.title}
                </Text>

                <View className="flex-row items-center space-x-3 text-caption text-ink-muted">
                  <View className="flex-row items-center mr-3">
                    <Calendar size={13} color="#6B7280" />
                    <Text className="text-caption text-ink-muted ml-1">
                      {test.startsAt
                        ? new Date(test.startsAt).toLocaleDateString('en-IN', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short',
                          })
                        : 'Open Window'}
                    </Text>
                  </View>
                  <View className="flex-row items-center">
                    <Clock size={13} color="#6B7280" />
                    <Text className="text-caption text-ink-muted ml-1">
                      {test.questionCount || 0} Questions
                    </Text>
                  </View>
                </View>

                {isCompleted ? (
                  <View className="flex-row items-center justify-between pt-2 border-t border-border/50">
                    <View className="flex-row items-center">
                      <CheckCircle2 size={15} color="#059669" />
                      <Text className="text-caption font-bold text-emerald-700 ml-1">
                        Scored {test.myBestScore !== null ? `${test.myBestScore}/${test.totalMarks}` : 'Graded'}
                      </Text>
                    </View>

                    <Button
                      variant="outline"
                      size="sm"
                      onPress={() => handleTestPress(test)}
                      icon={<FileCheck size={14} color="#2563EB" />}
                    >
                      View Result
                    </Button>
                  </View>
                ) : (
                  <Button
                    variant={isInProgress ? 'primary' : activeTab === 'live' ? 'primary' : 'outline'}
                    size="md"
                    className="w-full mt-1"
                    onPress={() => handleTestPress(test)}
                    icon={
                      isInProgress ? (
                        <RotateCcw size={16} color="#FFFFFF" />
                      ) : activeTab === 'live' ? (
                        <Play size={16} color="#FFFFFF" />
                      ) : undefined
                    }
                  >
                    {isInProgress
                      ? 'Resume Attempt'
                      : activeTab === 'live'
                      ? 'Start Test'
                      : activeTab === 'upcoming'
                      ? 'View Syllabus & Rules'
                      : 'View Details'}
                  </Button>
                )}
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}
