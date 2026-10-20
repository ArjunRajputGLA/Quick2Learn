import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import {
  Award,
  TrendingUp,
  AlertTriangle,
  Clock,
  Sparkles,
  BookOpen,
  CheckCircle2,
  XCircle,
  ChevronRight,
  Eye,
  FileText,
} from "lucide-react-native";
import { Screen } from "../../../src/components/ui/Screen";
import { AppHeader } from "../../../src/components/ui/AppHeader";
import { ChildSwitcher } from "../../../src/components/parent/ChildSwitcher";
import { useStudentPerformance, useChildTests, useMe, useParentStudents } from "../../../src/api/hooks";
import { useParentStore } from "../../../src/lib/parentStore";
import type { TestListItem } from "@quick2learn/shared";

export default function ParentTestsTab() {
  const router = useRouter();
  const { selectedChildId } = useParentStore();
  const { data: me } = useMe();
  const { data: parentStudentsData } = useParentStudents();

  const linkedStudents = parentStudentsData?.students || me?.linkedStudents || [];
  const currentChild =
    (selectedChildId && linkedStudents.find((c: any) => c.userId === selectedChildId || c.id === selectedChildId)) ||
    linkedStudents[0];

  const {
    data: perf,
    isLoading: perfLoading,
    isRefetching: perfRefetching,
    refetch: refetchPerf,
  } = useStudentPerformance(selectedChildId || undefined);

  const {
    data: testsData,
    isLoading: testsLoading,
    isRefetching: testsRefetching,
    refetch: refetchTests,
  } = useChildTests(selectedChildId || undefined);

  const [activeTab, setActiveTab] = useState<"all" | "completed">("all");

  const onRefresh = async () => {
    await Promise.all([refetchPerf(), refetchTests()]);
  };

  const isRefreshing = perfRefetching || testsRefetching;
  const childName = currentChild?.fullName || perf?.studentName || "Child";
  const tests = testsData?.tests || [];

  const completedTests = tests.filter(
    (t) => t.latestAttemptStatus === "submitted" || t.latestAttemptStatus === "auto_submitted"
  );
  const displayTests = activeTab === "completed" ? completedTests : tests;

  return (
    <Screen
      scrollable={false}
      header={<AppHeader title={`${childName}'s Tests & Results`} />}
    >
      <ChildSwitcher />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={Boolean(isRefreshing)}
            onRefresh={onRefresh}
            colors={["#2563EB"]}
            tintColor="#2563EB"
          />
        }
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      >
        {/* Performance Highlights Banner */}
        {perf && (
          <View className="bg-white rounded-2xl p-4.5 mb-4 border border-border shadow-xs">
            <View className="flex-row items-center justify-between pb-3 border-b border-border/60">
              <View className="flex-row items-center gap-2">
                <Award size={18} color="#D97706" />
                <Text className="text-body-sm font-bold text-ink">Academic Performance Summary</Text>
              </View>
              <TouchableOpacity
                onPress={() =>
                  router.push({
                    pathname: "/(app)/performance",
                    params: { studentId: selectedChildId || undefined },
                  } as any)
                }
                className="flex-row items-center gap-1"
              >
                <Text className="text-body-xs text-primary font-semibold">Detailed Analytics</Text>
                <ChevronRight size={14} color="#2563EB" />
              </TouchableOpacity>
            </View>

            <View className="grid grid-cols-3 gap-2 mt-3.5">
              <View className="bg-surface-subtle p-3 rounded-xl items-center border border-border/50">
                <Text className="text-[10px] font-bold text-ink-muted uppercase">Avg Score</Text>
                <Text className="text-display-xs font-bold text-primary mt-0.5">
                  {perf.averageScorePercentage}%
                </Text>
              </View>

              <View className="bg-surface-subtle p-3 rounded-xl items-center border border-border/50">
                <Text className="text-[10px] font-bold text-ink-muted uppercase">Attempted</Text>
                <Text className="text-display-xs font-bold text-emerald-600 mt-0.5">
                  {perf.totalTestsAttempted}
                </Text>
              </View>

              <View className="bg-surface-subtle p-3 rounded-xl items-center border border-border/50">
                <Text className="text-[10px] font-bold text-ink-muted uppercase">Missed</Text>
                <Text className="text-display-xs font-bold text-red-600 mt-0.5">
                  {perf.totalTestsMissed}
                </Text>
              </View>
            </View>

            {/* Strengths & Focus Areas */}
            <View className="mt-3.5 pt-3 border-t border-border/60 space-y-2">
              {perf.strongestChapters && perf.strongestChapters.length > 0 && (
                <View className="flex-row items-center gap-2">
                  <CheckCircle2 size={14} color="#059669" />
                  <Text className="text-body-xs text-ink-muted flex-1" numberOfLines={1}>
                    Strong in: <Text className="font-semibold text-ink">{perf.strongestChapters.join(", ")}</Text>
                  </Text>
                </View>
              )}
              {perf.weakestChapters && perf.weakestChapters.length > 0 && (
                <View className="flex-row items-center gap-2">
                  <AlertTriangle size={14} color="#D97706" />
                  <Text className="text-body-xs text-ink-muted flex-1" numberOfLines={1}>
                    Needs practice: <Text className="font-semibold text-ink">{perf.weakestChapters.join(", ")}</Text>
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Tab Filters */}
        <View className="flex-row bg-surface-subtle p-1 rounded-xl mb-4 border border-border">
          <TouchableOpacity
            onPress={() => setActiveTab("all")}
            className={`flex-1 py-2 rounded-lg items-center ${
              activeTab === "all" ? "bg-white shadow-xs" : ""
            }`}
          >
            <Text
              className={`text-body-sm font-semibold ${
                activeTab === "all" ? "text-primary" : "text-ink-muted"
              }`}
            >
              All Tests ({tests.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab("completed")}
            className={`flex-1 py-2 rounded-lg items-center ${
              activeTab === "completed" ? "bg-white shadow-xs" : ""
            }`}
          >
            <Text
              className={`text-body-sm font-semibold ${
                activeTab === "completed" ? "text-primary" : "text-ink-muted"
              }`}
            >
              Evaluated ({completedTests.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tests List */}
        {displayTests.length === 0 ? (
          <View className="bg-white rounded-2xl p-8 border border-border items-center justify-center">
            <FileText size={36} color="#9CA3AF" />
            <Text className="text-body font-bold text-ink mt-3">No Tests Available</Text>
            <Text className="text-body-xs text-ink-muted text-center mt-1">
              {activeTab === "completed"
                ? "No completed tests found for this student."
                : "No tests are currently assigned to this student's batches."}
            </Text>
          </View>
        ) : (
          <View className="space-y-3">
            {displayTests.map((t) => {
              const hasAttempt =
                t.latestAttemptStatus === "submitted" ||
                t.latestAttemptStatus === "auto_submitted";

              return (
                <View
                  key={t.id}
                  className="bg-white rounded-2xl p-4 border border-border shadow-xs"
                >
                  <View className="flex-row items-start justify-between gap-2">
                    <View className="flex-1">
                      <View className="flex-row items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-primary/10 text-primary">
                          {t.subjectName}
                        </span>
                        {t.batchName && (
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-surface-subtle text-ink-muted truncate max-w-[150px]">
                            {t.batchName}
                          </span>
                        )}
                      </View>
                      <Text className="text-body font-bold text-ink" numberOfLines={2}>
                        {t.title}
                      </Text>
                      <Text className="text-body-xs text-ink-muted mt-1">
                        {t.durationMinutes} mins • {t.totalMarks} marks • {t.questionCount} questions
                      </Text>
                    </View>
                  </View>

                  {/* Status & Results */}
                  <View className="mt-3 pt-3 border-t border-border/60 flex-row items-center justify-between">
                    {hasAttempt ? (
                      <View className="flex-row items-center gap-2">
                        <View className="w-7 h-7 rounded-full bg-emerald-100 items-center justify-center">
                          <CheckCircle2 size={16} color="#059669" />
                        </View>
                        <View>
                          <Text className="text-body-xs text-ink-muted">Child's Score:</Text>
                          <Text className="text-body-sm font-bold text-emerald-700">
                            {t.myBestScore !== null ? `${t.myBestScore} / ${t.totalMarks}` : "Evaluated"}
                          </Text>
                        </View>
                      </View>
                    ) : (
                      <View className="flex-row items-center gap-2">
                        <View className="w-7 h-7 rounded-full bg-amber-100 items-center justify-center">
                          <Clock size={16} color="#D97706" />
                        </View>
                        <View>
                          <Text className="text-body-xs text-ink-muted">Status:</Text>
                          <Text className="text-body-xs font-semibold text-amber-700">
                            Not Attempted by Student
                          </Text>
                        </View>
                      </View>
                    )}

                    {/* View Result button (Only available if student has attempted) */}
                    {hasAttempt && t.latestAttemptId ? (
                      <TouchableOpacity
                        onPress={() =>
                          router.push({
                            pathname: `/test/${t.id}/result`,
                            params: {
                              attemptId: t.latestAttemptId!,
                              studentId: selectedChildId || undefined,
                            },
                          } as any)
                        }
                        className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 active:bg-primary/20"
                      >
                        <Eye size={14} color="#2563EB" />
                        <Text className="text-body-xs font-bold text-primary">View Result</Text>
                      </TouchableOpacity>
                    ) : (
                      <View className="px-2.5 py-1 rounded-xl bg-surface-subtle">
                        <Text className="text-[11px] text-ink-muted">Read-Only View</Text>
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}
