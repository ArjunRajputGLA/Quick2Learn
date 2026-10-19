import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  AlertCircle,
  Users,
} from "lucide-react-native";
import { Screen } from "../../../src/components/ui/Screen";
import { AppHeader } from "../../../src/components/ui/AppHeader";
import { ChildSwitcher } from "../../../src/components/parent/ChildSwitcher";
import { useAttendance } from "../../../src/api/hooks";
import { useParentStore } from "../../../src/lib/parentStore";
import type { AttendanceRecordItem } from "@quick2learn/shared";

export default function ParentAttendanceTab() {
  const { selectedChildId } = useParentStore();

  const [currentDate, setCurrentDate] = useState(() => new Date());
  const pad = (n: number) => n.toString().padStart(2, "0");
  const monthStr = `${currentDate.getFullYear()}-${pad(currentDate.getMonth() + 1)}`;

  const { data, isLoading, isRefetching, refetch } = useAttendance(
    selectedChildId || undefined,
    undefined,
    monthStr
  );

  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecordItem | null>(null);

  const goToPrevMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    setSelectedRecord(null);
  };

  const goToNextMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    setSelectedRecord(null);
  };

  const monthName = currentDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const stats = data?.stats || {
    totalDays: 0,
    presentDays: 0,
    absentDays: 0,
    lateDays: 0,
    monthPercentage: 0,
    termPercentage: 0,
  };

  const recordsByDate = new Map<string, AttendanceRecordItem>();
  if (data?.records) {
    for (const r of data.records) {
      recordsByDate.set(r.date, r);
    }
  }

  // Generate calendar days
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const calendarCells = [];
  for (let i = 0; i < firstDayIndex; i++) {
    calendarCells.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const dStr = `${year}-${pad(month + 1)}-${pad(day)}`;
    calendarCells.push({
      day,
      dateStr: dStr,
      record: recordsByDate.get(dStr),
    });
  }

  const childName = data?.studentName || "Child";

  return (
    <Screen
      scrollable={false}
      header={<AppHeader title={`${childName}'s Attendance`} />}
    >
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
        {/* Month Selector */}
        <View className="flex-row items-center justify-between bg-white px-4 py-3 rounded-2xl border border-border shadow-xs mb-4">
          <TouchableOpacity
            onPress={goToPrevMonth}
            className="w-10 h-10 rounded-xl bg-surface-subtle items-center justify-center border border-border"
          >
            <ChevronLeft size={20} color="#374151" />
          </TouchableOpacity>
          <View className="items-center">
            <Text className="text-body font-bold text-ink">{monthName}</Text>
            <Text className="text-body-xs text-ink-muted">Official Class Roster</Text>
          </View>
          <TouchableOpacity
            onPress={goToNextMonth}
            className="w-10 h-10 rounded-xl bg-surface-subtle items-center justify-center border border-border"
          >
            <ChevronRight size={20} color="#374151" />
          </TouchableOpacity>
        </View>

        {/* Stats Grid */}
        <View className="grid grid-cols-3 gap-2.5 mb-4">
          <View className="bg-white p-3 rounded-2xl border border-border items-center">
            <Text className="text-body-xs font-semibold text-ink-muted uppercase tracking-wider text-[10px]">
              Attendance
            </Text>
            <Text className="text-display-xs font-bold text-primary mt-1">
              {stats.monthPercentage}%
            </Text>
            <Text className="text-[10px] text-ink-muted mt-0.5">This Month</Text>
          </View>

          <View className="bg-white p-3 rounded-2xl border border-border items-center">
            <Text className="text-body-xs font-semibold text-emerald-700 uppercase tracking-wider text-[10px]">
              Present
            </Text>
            <Text className="text-display-xs font-bold text-emerald-600 mt-1">
              {stats.presentDays}
            </Text>
            <Text className="text-[10px] text-ink-muted mt-0.5">Days attended</Text>
          </View>

          <View className="bg-white p-3 rounded-2xl border border-border items-center">
            <Text className="text-body-xs font-semibold text-red-700 uppercase tracking-wider text-[10px]">
              Absent
            </Text>
            <Text className="text-display-xs font-bold text-red-600 mt-1">
              {stats.absentDays}
            </Text>
            <Text className="text-[10px] text-ink-muted mt-0.5">Classes missed</Text>
          </View>
        </View>

        {/* Calendar Grid */}
        <View className="bg-white p-4 rounded-2xl border border-border shadow-xs mb-4">
          <View className="flex-row items-center justify-between mb-3 border-b border-border pb-2">
            {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
              <Text
                key={i}
                className="w-9 text-center font-bold text-caption text-ink-muted"
              >
                {d}
              </Text>
            ))}
          </View>

          <View className="flex-row flex-wrap">
            {calendarCells.map((cell, idx) => {
              if (!cell) {
                return <View key={idx} className="w-[14.28%] h-12" />;
              }

              const rec = cell.record;
              const isPresent = rec?.status === "present";
              const isAbsent = rec?.status === "absent";
              const isLate = rec?.status === "late";
              const isSelected = selectedRecord?.id === rec?.id;

              return (
                <TouchableOpacity
                  key={idx}
                  disabled={!rec}
                  onPress={() => rec && setSelectedRecord(rec)}
                  className={`w-[14.28%] h-12 items-center justify-center rounded-xl p-0.5 ${
                    isSelected ? "bg-primary/10 border border-primary" : ""
                  }`}
                >
                  <View
                    className={`w-8 h-8 rounded-full items-center justify-center ${
                      isPresent
                        ? "bg-emerald-50 border border-emerald-300"
                        : isAbsent
                        ? "bg-red-50 border border-red-300"
                        : isLate
                        ? "bg-amber-50 border border-amber-300"
                        : ""
                    }`}
                  >
                    <Text
                      className={`text-body-xs font-semibold ${
                        isPresent
                          ? "text-emerald-700 font-bold"
                          : isAbsent
                          ? "text-red-700 font-bold"
                          : isLate
                          ? "text-amber-700 font-bold"
                          : "text-ink"
                      }`}
                    >
                      {cell.day}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Selected Record Detail */}
        {selectedRecord && (
          <View className="bg-white p-4 rounded-2xl border border-border shadow-xs mb-4">
            <View className="flex-row items-center justify-between pb-2 border-b border-border">
              <Text className="text-body-sm font-bold text-ink">
                Class Attendance on {selectedRecord.date}
              </Text>
              <View
                className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase ${
                  selectedRecord.status === "present"
                    ? "bg-emerald-100 text-emerald-800"
                    : selectedRecord.status === "absent"
                    ? "bg-red-100 text-red-800"
                    : "bg-amber-100 text-amber-800"
                }`}
              >
                <Text
                  className={`text-[11px] font-bold uppercase ${
                    selectedRecord.status === "present"
                      ? "text-emerald-700"
                      : selectedRecord.status === "absent"
                      ? "text-red-700"
                      : "text-amber-700"
                  }`}
                >
                  {selectedRecord.status}
                </Text>
              </View>
            </View>

            <View className="mt-2.5 space-y-1">
              {selectedRecord.batchTitle && (
                <Text className="text-body-xs text-ink-muted">
                  Batch: <Text className="font-semibold text-ink">{selectedRecord.batchTitle}</Text>
                </Text>
              )}
              {selectedRecord.sessionTitle && (
                <Text className="text-body-xs text-ink-muted">
                  Lecture: <Text className="font-semibold text-ink">{selectedRecord.sessionTitle}</Text>
                </Text>
              )}
              {selectedRecord.note && (
                <Text className="text-body-xs text-ink-muted">
                  Teacher note: <Text className="italic text-ink">{selectedRecord.note}</Text>
                </Text>
              )}
            </View>
          </View>
        )}

        {/* Absences List */}
        {data?.absences && data.absences.length > 0 && (
          <View className="bg-white p-4 rounded-2xl border border-border shadow-xs">
            <View className="flex-row items-center gap-2 pb-2.5 border-b border-border">
              <AlertCircle size={16} color="#DC2626" />
              <Text className="text-body-sm font-bold text-ink">Recorded Absences ({data.absences.length})</Text>
            </View>

            <View className="divide-y divide-border/60">
              {data.absences.map((ab) => (
                <View key={ab.id} className="py-2.5 flex-row items-center justify-between">
                  <View>
                    <Text className="text-body-sm font-bold text-ink">{ab.date}</Text>
                    <Text className="text-body-xs text-ink-muted">
                      {ab.batchTitle || "Batch Class"} • {ab.sessionTitle || "Regular class"}
                    </Text>
                  </View>
                  <View className="px-2.5 py-1 rounded-full bg-red-50 border border-red-200">
                    <Text className="text-[11px] font-bold text-red-700">Absent</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}
