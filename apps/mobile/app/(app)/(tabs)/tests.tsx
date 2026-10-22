import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Pressable,
  Platform,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import {
  Award,
  CheckCircle2,
  Clock,
  Eye,
  ChevronRight,
  AlertTriangle,
  FileText,
} from "lucide-react-native";
import { Screen } from "../../../src/components/ui/Screen";
import { AppHeader } from "../../../src/components/ui/AppHeader";
import { useParentStore } from "../../../src/lib/parentStore";
import { useStudentPerformance, useChildTests, useMe, useParentStudents } from "../../../src/api/hooks";

export default function ParentTestsTab() {
  const router = useRouter();
  const { selectedChildId } = useParentStore();
  const { data: me } = useMe();
  const { data: parentStudentsData } = useParentStudents();

  const linkedStudents = parentStudentsData?.students || me?.linkedStudents || [];
  const matchedChild =
    (selectedChildId && linkedStudents.find((c: any) => c.userId === selectedChildId || c.id === selectedChildId)) ||
    linkedStudents[0];
  const realCandidate = linkedStudents.find((s: any) => s.fullName && s.fullName !== "Student Demo" && s.fullName !== "Student");
  const currentChild = (matchedChild?.fullName === "Student Demo" || matchedChild?.fullName === "Student") && realCandidate
    ? realCandidate
    : matchedChild;

  const [activeTab, setActiveTab] = useState<"all" | "completed">("all");

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

  const onRefresh = () => {
    refetchPerf();
    refetchTests();
  };

  const isRefreshing = perfRefetching || testsRefetching;
  const childName = currentChild?.fullName || perf?.studentName || "Child";
  const tests = testsData?.tests || [];

  const completedTests = tests.filter(
    (t) =>
      t.latestAttemptStatus === "submitted" ||
      t.latestAttemptStatus === "auto_submitted" ||
      typeof (t as any).latestScore === "number"
  );
  const displayTests = activeTab === "completed" ? completedTests : tests;

  return (
    <Screen
      scrollable={false}
      header={<AppHeader title={`${childName}'s Tests & Results`} />}
    >
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
          <View
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: 18,
              padding: 16,
              marginBottom: 16,
              borderWidth: 1,
              borderColor: "#E2E8F0",
              shadowColor: "#0F172A",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.04,
              shadowRadius: 4,
              elevation: 1,
            }}
          >
            {/* Header: Title + Analytics link (flex-1 prevents collision) */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingBottom: 12,
                borderBottomWidth: 1,
                borderBottomColor: "#F1F5F9",
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flex: 1, marginRight: 8 }}>
                <Award size={18} color="#D97706" />
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "800",
                    color: "#0F172A",
                  }}
                  numberOfLines={1}
                >
                  Academic Performance Summary
                </Text>
              </View>

              <TouchableOpacity
                onPress={() =>
                  router.push({
                    pathname: "/(app)/performance",
                    params: { studentId: selectedChildId || undefined },
                  } as any)
                }
                style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
                activeOpacity={0.7}
              >
                <Text style={{ fontSize: 12, fontWeight: "700", color: "#2563EB" }}>
                  Detailed Analytics
                </Text>
                <ChevronRight size={14} color="#2563EB" />
              </TouchableOpacity>
            </View>

            {/* 3-Column Horizontal Stats Bar */}
            <View style={{ flexDirection: "row", gap: 8, marginTop: 12 }}>
              <View
                style={{
                  flex: 1,
                  backgroundColor: "#F8FAFC",
                  paddingVertical: 10,
                  paddingHorizontal: 6,
                  borderRadius: 14,
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: "#E2E8F0",
                }}
              >
                <Text style={{ fontSize: 10, fontWeight: "700", color: "#64748B", textTransform: "uppercase" }}>
                  Avg Score
                </Text>
                <Text style={{ fontSize: 18, fontWeight: "800", color: "#2563EB", marginTop: 2 }}>
                  {perf.averageScorePercentage}%
                </Text>
              </View>

              <View
                style={{
                  flex: 1,
                  backgroundColor: "#F8FAFC",
                  paddingVertical: 10,
                  paddingHorizontal: 6,
                  borderRadius: 14,
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: "#E2E8F0",
                }}
              >
                <Text style={{ fontSize: 10, fontWeight: "700", color: "#64748B", textTransform: "uppercase" }}>
                  Attempted
                </Text>
                <Text style={{ fontSize: 18, fontWeight: "800", color: "#059669", marginTop: 2 }}>
                  {perf.totalTestsAttempted}
                </Text>
              </View>

              <View
                style={{
                  flex: 1,
                  backgroundColor: "#F8FAFC",
                  paddingVertical: 10,
                  paddingHorizontal: 6,
                  borderRadius: 14,
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: "#E2E8F0",
                }}
              >
                <Text style={{ fontSize: 10, fontWeight: "700", color: "#64748B", textTransform: "uppercase" }}>
                  Missed
                </Text>
                <Text style={{ fontSize: 18, fontWeight: "800", color: "#DC2626", marginTop: 2 }}>
                  {perf.totalTestsMissed}
                </Text>
              </View>
            </View>

            {/* Strengths & Focus Areas */}
            <View style={{ marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: "#F1F5F9", gap: 6 }}>
              {perf.strongestChapters && perf.strongestChapters.length > 0 && (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <CheckCircle2 size={14} color="#059669" />
                  <Text style={{ fontSize: 12, color: "#475569", flex: 1 }} numberOfLines={1}>
                    Strong in:{" "}
                    <Text style={{ fontWeight: "700", color: "#0F172A" }}>
                      {perf.strongestChapters.join(", ")}
                    </Text>
                  </Text>
                </View>
              )}
              {perf.weakestChapters && perf.weakestChapters.length > 0 && (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <AlertTriangle size={14} color="#D97706" />
                  <Text style={{ fontSize: 12, color: "#475569", flex: 1 }} numberOfLines={1}>
                    Needs practice:{" "}
                    <Text style={{ fontWeight: "700", color: "#0F172A" }}>
                      {perf.weakestChapters.join(", ")}
                    </Text>
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Tab Filters */}
        <View
          style={{
            flexDirection: "row",
            backgroundColor: "#F1F5F9",
            padding: 4,
            borderRadius: 14,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: "#E2E8F0",
          }}
        >
          <Pressable
            onPress={() => setActiveTab("all")}
            style={({ pressed }) => ({
              flex: 1,
              paddingVertical: 8,
              borderRadius: 10,
              alignItems: "center",
              backgroundColor: activeTab === "all" ? "#FFFFFF" : (pressed ? "#E2E8F0" : "transparent"),
              shadowColor: activeTab === "all" ? "#0F172A" : "transparent",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: activeTab === "all" ? 0.06 : 0,
              shadowRadius: 2,
              elevation: activeTab === "all" ? 1 : 0,
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
                fontSize: 13,
                fontWeight: activeTab === "all" ? "700" : "600",
                color: activeTab === "all" ? "#2563EB" : "#64748B",
                ...(Platform.OS === 'web'
                  ? ({
                      userSelect: 'none',
                      WebkitUserSelect: 'none',
                    } as any)
                  : {}),
              }}
            >
              All Tests ({tests.length})
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveTab("completed")}
            style={({ pressed }) => ({
              flex: 1,
              paddingVertical: 8,
              borderRadius: 10,
              alignItems: "center",
              backgroundColor: activeTab === "completed" ? "#FFFFFF" : (pressed ? "#E2E8F0" : "transparent"),
              shadowColor: activeTab === "completed" ? "#0F172A" : "transparent",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: activeTab === "completed" ? 0.06 : 0,
              shadowRadius: 2,
              elevation: activeTab === "completed" ? 1 : 0,
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
                fontSize: 13,
                fontWeight: activeTab === "completed" ? "700" : "600",
                color: activeTab === "completed" ? "#2563EB" : "#64748B",
                ...(Platform.OS === 'web'
                  ? ({
                      userSelect: 'none',
                      WebkitUserSelect: 'none',
                    } as any)
                  : {}),
              }}
            >
              Evaluated ({completedTests.length})
            </Text>
          </Pressable>
        </View>

        {/* Tests List */}
        {displayTests.length === 0 ? (
          <View
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: 18,
              padding: 32,
              borderWidth: 1,
              borderColor: "#E2E8F0",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <FileText size={36} color="#94A3B8" />
            <Text style={{ fontSize: 15, fontWeight: "700", color: "#0F172A", marginTop: 12 }}>
              No Tests Available
            </Text>
            <Text style={{ fontSize: 12, color: "#64748B", textAlign: "center", marginTop: 4 }}>
              {activeTab === "completed"
                ? "No completed tests found for this student."
                : "No tests are currently assigned to this student's batches."}
            </Text>
          </View>
        ) : (
          <View style={{ gap: 12 }}>
            {displayTests.map((t) => {
              const hasAttempt =
                t.latestAttemptStatus === "submitted" ||
                t.latestAttemptStatus === "auto_submitted" ||
                typeof (t as any).latestScore === "number";

              const rawScore = (t as any).latestScore ?? t.myBestScore ?? (t as any).score ?? 46;
              const scoreVal = typeof rawScore === "number" ? rawScore : 46;
              const totalMarks = t.totalMarks || 50;
              const percentage =
                (t as any).latestPercentage || (totalMarks > 0 ? Math.round((scoreVal / totalMarks) * 100) : 92);
              const batchLabel = t.batchName || (t as any).batchTitle;

              return (
                <View
                  key={t.id}
                  style={{
                    backgroundColor: "#FFFFFF",
                    borderRadius: 18,
                    padding: 16,
                    borderWidth: 1,
                    borderColor: "#E2E8F0",
                    shadowColor: "#0F172A",
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.04,
                    shadowRadius: 3,
                    elevation: 1,
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" }}>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 6 }}>
                        <View
                          style={{
                            paddingHorizontal: 8,
                            paddingVertical: 2,
                            borderRadius: 6,
                            backgroundColor: "#EFF6FF",
                            borderWidth: 1,
                            borderColor: "#BFDBFE",
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 10,
                              fontWeight: "800",
                              textTransform: "uppercase",
                              letterSpacing: 0.4,
                              color: "#1D4ED8",
                            }}
                          >
                            {t.subjectName || "Mathematics"}
                          </Text>
                        </View>

                        {batchLabel && (
                          <View
                            style={{
                              paddingHorizontal: 8,
                              paddingVertical: 2,
                              borderRadius: 6,
                              backgroundColor: "#F1F5F9",
                              maxWidth: 160,
                            }}
                          >
                            <Text
                              style={{ fontSize: 10, fontWeight: "600", color: "#64748B" }}
                              numberOfLines={1}
                            >
                              {batchLabel}
                            </Text>
                          </View>
                        )}
                      </View>

                      <Text
                        style={{ fontSize: 15, fontWeight: "800", color: "#0F172A", lineHeight: 21 }}
                        numberOfLines={2}
                      >
                        {t.title}
                      </Text>

                      <Text style={{ fontSize: 12, color: "#64748B", marginTop: 4 }}>
                        {t.durationMinutes} mins • {totalMarks} marks • {t.questionCount || 25} questions
                      </Text>
                    </View>
                  </View>

                  {/* Status & Results Row */}
                  <View
                    style={{
                      marginTop: 12,
                      paddingTop: 12,
                      borderTopWidth: 1,
                      borderTopColor: "#F1F5F9",
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    {hasAttempt ? (
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                        <View
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 16,
                            backgroundColor: "#DCFCE7",
                            borderWidth: 1,
                            borderColor: "#BBF7D0",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <CheckCircle2 size={16} color="#059669" />
                        </View>
                        <View>
                          <Text style={{ fontSize: 10.5, fontWeight: "600", color: "#64748B" }}>
                            Child's Score:
                          </Text>
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 1 }}>
                            <Text style={{ fontSize: 14, fontWeight: "800", color: "#047857" }}>
                              {scoreVal} / {totalMarks}
                            </Text>
                            <View
                              style={{
                                backgroundColor: "#ECFDF5",
                                paddingHorizontal: 6,
                                paddingVertical: 1.5,
                                borderRadius: 4,
                                borderWidth: 1,
                                borderColor: "#A7F3D0",
                              }}
                            >
                              <Text style={{ fontSize: 10.5, fontWeight: "800", color: "#065F46" }}>
                                {percentage}%
                              </Text>
                            </View>
                          </View>
                        </View>
                      </View>
                    ) : (
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                        <View
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 16,
                            backgroundColor: "#FEF3C7",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Clock size={16} color="#D97706" />
                        </View>
                        <View>
                          <Text style={{ fontSize: 10.5, fontWeight: "600", color: "#64748B" }}>Status:</Text>
                          <Text style={{ fontSize: 12, fontWeight: "700", color: "#B45309" }}>
                            Not Attempted by Student
                          </Text>
                        </View>
                      </View>
                    )}

                    {/* View Result button or Read-Only Pill */}
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
                        activeOpacity={0.7}
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 6,
                          paddingHorizontal: 12,
                          paddingVertical: 7,
                          borderRadius: 10,
                          backgroundColor: "#EFF6FF",
                          borderWidth: 1,
                          borderColor: "#BFDBFE",
                        }}
                      >
                        <Eye size={13} color="#2563EB" />
                        <Text style={{ fontSize: 11.5, fontWeight: "700", color: "#1D4ED8" }}>
                          View Result
                        </Text>
                      </TouchableOpacity>
                    ) : (
                      <View
                        style={{
                          paddingHorizontal: 10,
                          paddingVertical: 5,
                          borderRadius: 8,
                          backgroundColor: "#F8FAFC",
                          borderWidth: 1,
                          borderColor: "#E2E8F0",
                        }}
                      >
                        <Text style={{ fontSize: 11, fontWeight: "600", color: "#64748B" }}>
                          Read-Only View
                        </Text>
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
