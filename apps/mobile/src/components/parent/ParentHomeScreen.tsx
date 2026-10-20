import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Linking,
} from "react-native";
import { useRouter } from "expo-router";
import {
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Award,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertCircle,
  CreditCard,
  Bell,
  MessageCircle,
  ChevronRight,
  Sparkles,
  Radio,
  BookOpen,
} from "lucide-react-native";
import { Screen } from "../ui/Screen";
import { AppHeader } from "../ui/AppHeader";
import { Card } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { ChildSwitcher } from "./ChildSwitcher";
import { useParentHome, useMe, useParentStudents } from "../../api/hooks";
import { useParentStore } from "../../lib/parentStore";
import { formatINR } from "@quick2learn/shared";

export function ParentHomeScreen() {
  const router = useRouter();
  const { selectedChildId } = useParentStore();
  const { data: me } = useMe();
  const { data: parentStudentsData } = useParentStudents();
  const { data, isLoading, isRefetching, refetch, error } = useParentHome(selectedChildId);

  const linkedStudents = parentStudentsData?.students || me?.linkedStudents || [];
  const matchedLinked =
    (selectedChildId && linkedStudents.find((s) => s.id === selectedChildId || s.userId === selectedChildId)) ||
    linkedStudents[0];

  const child = data?.child || matchedLinked;

  const handleOpenWhatsApp = () => {
    if (data?.instituteWhatsApp?.url) {
      Linking.openURL(data.instituteWhatsApp.url).catch(() => {});
    }
  };

  if (isLoading && !data && !child) {
    return (
      <Screen header={<AppHeader title="Parent Portal" />}>
        <View className="flex-1 items-center justify-center p-8">
          <ActivityIndicator size="large" color="#2563EB" />
          <Text className="text-body text-ink-muted mt-3">Loading child records...</Text>
        </View>
      </Screen>
    );
  }

  const attendance = data?.attendanceThisWeek;
  const testScore = data?.latestTestScore;
  const nextClass = data?.nextClass;
  const feeAlert = data?.feeAlert;
  const announcements = data?.announcements || [];
  const parentName = me?.profile?.fullName || me?.user?.name || "Parent";
  const parentFirstName = parentName.split(" ")[0] || parentName;

  return (
    <Screen
      scrollable={false}
      header={
        <AppHeader
          title={`Hi, ${parentFirstName}`}
          subtitle={`Parent Portal • Tracking ${child?.fullName || "Child"}`}
        />
      }
    >
      {/* 1. Child Switcher at the very top */}
      <ChildSwitcher />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={Boolean(isRefetching)}
            onRefresh={() => {
              refetch();
            }}
            colors={["#2563EB"]}
            tintColor="#2563EB"
          />
        }
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      >
        {/* Child greeting info */}
        {child && (
          <View className="mb-4 bg-white p-4.5 rounded-2xl border border-border shadow-xs">
            <View className="flex-row items-center justify-between mb-2">
              <View className="flex-row items-center gap-1.5">
                <BookOpen size={14} color="#2563EB" />
                <Text className="text-body-xs font-semibold text-primary uppercase tracking-wider">
                  Student Overview
                </Text>
              </View>
              <View className="bg-primary/10 px-2.5 py-0.5 rounded-full flex-row items-center gap-1">
                <CheckCircle2 size={11} color="#2563EB" />
                <Text className="text-[11px] font-bold text-primary">Active Profile</Text>
              </View>
            </View>

            <Text className="text-h2 font-bold text-ink">
              {child.fullName}
            </Text>

            <View className="flex-row items-center flex-wrap gap-x-2 gap-y-1 mt-1">
              <View className="bg-surface-subtle px-2 py-0.5 rounded-md border border-border">
                <Text className="text-[11.5px] font-semibold text-ink">
                  {child.classLevel ? `Class ${child.classLevel}` : "Secondary"}
                </Text>
              </View>
              <View className="bg-surface-subtle px-2 py-0.5 rounded-md border border-border">
                <Text className="text-[11.5px] font-semibold text-ink">
                  {child.board?.toUpperCase() || "CBSE"}
                </Text>
              </View>
              <Text className="text-body-xs text-ink-muted">
                {(child as any).school || "Quick2Learn High School"}
              </Text>
            </View>

            {/* Quick Metrics Strip */}
            <View className="flex-row items-center justify-between mt-3.5 pt-3 border-t border-border/50">
              <View className="flex-1 items-center border-r border-border/40 pr-2">
                <Text className="text-[10px] font-bold text-ink-muted uppercase">Attendance</Text>
                <Text className="text-body font-bold text-emerald-600 mt-0.5">
                  {attendance ? `${attendance.percentage}%` : "100%"}
                </Text>
              </View>
              <View className="flex-1 items-center border-r border-border/40 px-2">
                <Text className="text-[10px] font-bold text-ink-muted uppercase">Latest Test</Text>
                <Text className="text-body font-bold text-amber-600 mt-0.5">
                  {testScore ? `${testScore.percentage}%` : "92%"}
                </Text>
              </View>
              <View className="flex-1 items-center pl-2">
                <Text className="text-[10px] font-bold text-ink-muted uppercase">Fee Status</Text>
                <Text className="text-body font-bold text-primary mt-0.5">
                  {feeAlert?.status === "overdue"
                    ? "Overdue"
                    : feeAlert?.status === "due_soon"
                    ? "Due Soon"
                    : "Cleared"}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* 2. Fee Alert Banner */}
        {feeAlert && (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push("/(app)/(tabs)/fees" as any)}
            className={`p-4 rounded-2xl mb-4 border flex-row items-center justify-between ${
              feeAlert.status === "overdue"
                ? "bg-red-50/70 border-red-200"
                : feeAlert.status === "due_soon"
                ? "bg-amber-50/70 border-amber-200"
                : "bg-emerald-50/60 border-emerald-200"
            }`}
          >
            <View className="flex-row items-center gap-3 flex-1 pr-2">
              <View
                className={`w-9 h-9 rounded-xl items-center justify-center ${
                  feeAlert.status === "overdue"
                    ? "bg-red-100"
                    : feeAlert.status === "due_soon"
                    ? "bg-amber-100"
                    : "bg-emerald-100"
                }`}
              >
                <CreditCard
                  size={18}
                  color={
                    feeAlert.status === "overdue"
                      ? "#DC2626"
                      : feeAlert.status === "due_soon"
                      ? "#D97706"
                      : "#059669"
                  }
                />
              </View>
              <View className="flex-1">
                <Text
                  className={`text-body-sm font-bold ${
                    feeAlert.status === "overdue"
                      ? "text-red-900"
                      : feeAlert.status === "due_soon"
                      ? "text-amber-900"
                      : "text-emerald-900"
                  }`}
                >
                  {feeAlert.status === "overdue"
                    ? "Fee Overdue Alert"
                    : feeAlert.status === "due_soon"
                    ? "Upcoming Fee Due"
                    : "Fee Dues Cleared"}
                </Text>
                <Text
                  className={`text-body-xs mt-0.5 ${
                    feeAlert.status === "overdue"
                      ? "text-red-700"
                      : feeAlert.status === "due_soon"
                      ? "text-amber-700"
                      : "text-emerald-700"
                  }`}
                  numberOfLines={2}
                >
                  {feeAlert.message}
                </Text>
              </View>
            </View>
            <ChevronRight size={18} color="#9CA3AF" />
          </TouchableOpacity>
        )}

        {/* 3. This Week's Attendance Card */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => router.push("/(app)/(tabs)/attendance" as any)}
          className="bg-white rounded-2xl p-4.5 mb-4 border border-border shadow-xs"
        >
          <View className="flex-row items-center justify-between pb-3 border-b border-border/60">
            <View className="flex-row items-center gap-2">
              <Calendar size={18} color="#2563EB" />
              <Text className="text-body-sm font-bold text-ink">This Week's Attendance</Text>
            </View>
            <View className="flex-row items-center gap-1">
              <Text className="text-body-xs text-primary font-semibold">View Monthly</Text>
              <ChevronRight size={14} color="#2563EB" />
            </View>
          </View>

          <View className="flex-row items-center justify-between mt-3.5">
            <View>
              <Text className="text-display-xs font-bold text-ink">
                {attendance ? `${attendance.percentage}%` : "100%"}
              </Text>
              <Text className="text-body-xs text-ink-muted mt-0.5">
                {attendance?.summaryText || "All conducted classes attended"}
              </Text>
            </View>

            <View className="flex-row items-center gap-3">
              <View className="items-center px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-100">
                <Text className="text-body-sm font-bold text-emerald-700">
                  {attendance?.presentDays ?? 0}
                </Text>
                <Text className="text-[10px] font-medium text-emerald-600">Present</Text>
              </View>
              <View className="items-center px-3 py-1.5 rounded-xl bg-red-50 border border-red-100">
                <Text className="text-body-sm font-bold text-red-700">
                  {attendance?.absentDays ?? 0}
                </Text>
                <Text className="text-[10px] font-medium text-red-600">Absent</Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>

        {/* 4. Latest Test Score Card */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => router.push("/(app)/(tabs)/tests" as any)}
          className="bg-white rounded-2xl p-4.5 mb-4 border border-border shadow-xs"
        >
          <View className="flex-row items-center justify-between pb-3 border-b border-border/60">
            <View className="flex-row items-center gap-2">
              <Award size={18} color="#D97706" />
              <Text className="text-body-sm font-bold text-ink">Latest Test Performance</Text>
            </View>
            <View className="flex-row items-center gap-1">
              <Text className="text-body-xs text-primary font-semibold">All Tests</Text>
              <ChevronRight size={14} color="#2563EB" />
            </View>
          </View>

          {testScore ? (
            <View className="mt-3.5">
              <View className="flex-row items-start justify-between gap-3">
                <View className="flex-1">
                  <Text className="text-body font-bold text-ink" numberOfLines={1}>
                    {testScore.testTitle}
                  </Text>
                  <Text className="text-body-xs text-ink-muted mt-0.5">
                    Score: {testScore.score} / {testScore.totalMarks} marks
                  </Text>
                </View>

                <View className="items-end">
                  <Text className="text-display-xs font-bold text-ink">
                    {testScore.percentage}%
                  </Text>
                </View>
              </View>

              {/* Trend / Change from previous test */}
              <View className="mt-3 pt-3 border-t border-border/40 flex-row items-center justify-between">
                <Text className="text-body-xs text-ink-muted">Comparison to previous test:</Text>
                <View
                  className={`flex-row items-center gap-1 px-2.5 py-1 rounded-full ${
                    testScore.changePercentage && testScore.changePercentage > 0
                      ? "bg-emerald-50 text-emerald-700"
                      : testScore.changePercentage && testScore.changePercentage < 0
                      ? "bg-red-50 text-red-700"
                      : "bg-surface-subtle text-ink-muted"
                  }`}
                >
                  {testScore.changePercentage && testScore.changePercentage > 0 ? (
                    <TrendingUp size={12} color="#059669" />
                  ) : testScore.changePercentage && testScore.changePercentage < 0 ? (
                    <TrendingDown size={12} color="#DC2626" />
                  ) : (
                    <Minus size={12} color="#6B7280" />
                  )}
                  <Text
                    className={`text-[11px] font-bold ${
                      testScore.changePercentage && testScore.changePercentage > 0
                        ? "text-emerald-700"
                        : testScore.changePercentage && testScore.changePercentage < 0
                        ? "text-red-700"
                        : "text-ink-muted"
                    }`}
                  >
                    {testScore.changeLabel}
                  </Text>
                </View>
              </View>
            </View>
          ) : (
            <View className="py-4 items-center justify-center">
              <Text className="text-body-sm text-ink-muted text-center">
                No evaluated test assessments yet for this student.
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {/* 5. Next Class Schedule */}
        {nextClass && (
          <View className="bg-white rounded-2xl p-4.5 mb-4 border border-border shadow-xs">
            <View className="flex-row items-center justify-between pb-3 border-b border-border/60">
              <View className="flex-row items-center gap-2">
                <Clock size={18} color="#2563EB" />
                <Text className="text-body-sm font-bold text-ink">Next Class</Text>
              </View>
              {nextClass.isLive && (
                <View className="flex-row items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-100">
                  <View className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
                  <Text className="text-[11px] font-bold text-red-700">LIVE NOW</Text>
                </View>
              )}
            </View>

            <View className="mt-3.5 space-y-1">
              <Text className="text-body-md font-bold text-ink">
                {nextClass.batchTitle}
              </Text>
              <Text className="text-body-sm text-ink-muted">
                {nextClass.subjectName} • {nextClass.timeOrCountdown}
              </Text>
              <Text className="text-[11px] text-ink-muted mt-1 italic">
                (Classes are monitored live by faculty Dinesh Singh Rajput)
              </Text>
            </View>
          </View>
        )}

        {/* 6. Batch Announcements */}
        {announcements.length > 0 && (
          <View className="bg-white rounded-2xl p-4.5 mb-5 border border-border shadow-xs">
            <View className="flex-row items-center gap-2 pb-3 border-b border-border/60">
              <Bell size={18} color="#2563EB" />
              <Text className="text-body-sm font-bold text-ink">Recent Notices & Announcements</Text>
            </View>

            <View className="divide-y divide-border/60">
              {announcements.map((a) => (
                <View key={a.id} className="py-3">
                  <View className="flex-row items-center justify-between gap-2">
                    <Text className="text-body-sm font-bold text-ink flex-1" numberOfLines={1}>
                      {a.title}
                    </Text>
                    {a.batchTitle && (
                      <Text className="text-[10px] font-semibold px-2 py-0.5 rounded bg-surface-subtle text-ink-muted">
                        {a.batchTitle}
                      </Text>
                    )}
                  </View>
                  <Text className="text-body-xs text-ink-muted mt-1" numberOfLines={2}>
                    {a.body}
                  </Text>
                  <Text className="text-[10px] text-ink-muted/80 mt-1">
                    {new Date(a.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                    })}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* 7. Message the Institute WhatsApp Button */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleOpenWhatsApp}
          className="bg-emerald-600 active:bg-emerald-700 p-4 rounded-2xl flex-row items-center justify-between shadow-md mb-2"
        >
          <View className="flex-row items-center gap-3.5 flex-1 pr-2">
            <View className="w-11 h-11 rounded-full bg-white/20 items-center justify-center">
              <MessageCircle size={24} color="#FFFFFF" />
            </View>
            <View className="flex-1">
              <Text className="text-body font-bold text-white">
                Message the Institute
              </Text>
              <Text className="text-body-xs text-emerald-100 mt-0.5" numberOfLines={1}>
                WhatsApp Dinesh Sir regarding {child?.fullName || "your child"}
              </Text>
            </View>
          </View>
          <ChevronRight size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </ScrollView>
    </Screen>
  );
}
