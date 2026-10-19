import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  AlertCircle,
  Wifi,
  ArrowLeft,
} from "lucide-react-native";
import { useAttendance } from "../../src/api/hooks";
import type { AttendanceRecordItem } from "@quick2learn/shared";

export default function AttendanceScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    studentId?: string;
    batchId?: string;
    batchTitle?: string;
  }>();

  // Current month state in "YYYY-MM" format
  const [currentDate, setCurrentDate] = useState(() => new Date());

  const pad = (n: number) => n.toString().padStart(2, "0");
  const monthStr = `${currentDate.getFullYear()}-${pad(currentDate.getMonth() + 1)}`;

  const { data, isLoading, refetch } = useAttendance(
    params.studentId,
    params.batchId,
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

  // Build calendar matrix for target month
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7; // 0=Mon, 6=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Map records by date YYYY-MM-DD
  const recordMap = new Map<string, AttendanceRecordItem>();
  if (data?.records) {
    for (const r of data.records) {
      recordMap.set(r.date, r);
    }
  }

  const renderCalendarDays = () => {
    const days = [];

    // Empty lead cells
    for (let i = 0; i < firstDayIndex; i++) {
      days.push(<View key={`empty-${i}`} className="w-[14.28%] aspect-square p-1" />);
    }

    // Days of the month
    for (let d = 1; d <= daysInMonth; d++) {
      const dateKey = `${year}-${pad(month + 1)}-${pad(d)}`;
      const record = recordMap.get(dateKey);

      let statusColor = "";
      let dotColor = "";

      if (record?.status === "present") {
        statusColor = "bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700";
        dotColor = "bg-emerald-500";
      } else if (record?.status === "late") {
        statusColor = "bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700";
        dotColor = "bg-amber-500";
      } else if (record?.status === "absent") {
        statusColor = "bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-700";
        dotColor = "bg-rose-500";
      } else if (record?.status === "excused") {
        statusColor = "bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-600";
        dotColor = "bg-slate-400";
      }

      const isSelected = selectedRecord?.date === dateKey;

      days.push(
        <TouchableOpacity
          key={`day-${d}`}
          onPress={() => {
            if (record) {
              setSelectedRecord(record);
            }
          }}
          className={`w-[14.28%] aspect-square p-1`}
        >
          <View
            className={`flex-1 rounded-xl items-center justify-center ${
              isSelected ? "ring-2 ring-primary-500 bg-primary-50 dark:bg-primary-950" : statusColor
            }`}
          >
            <Text
              className={`text-xs font-bold ${
                isSelected
                  ? "text-primary-600 dark:text-primary-400 font-black"
                  : record
                  ? "text-slate-900 dark:text-white"
                  : "text-slate-400 dark:text-slate-500"
              }`}
            >
              {d}
            </Text>

            {dotColor ? (
              <View className={`w-1.5 h-1.5 rounded-full ${dotColor} mt-0.5`} />
            ) : null}
          </View>
        </TouchableOpacity>
      );
    }

    return days;
  };

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-950">
      {/* Top Header */}
      <View className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 pt-12 pb-4 px-4 flex-row items-center justify-between">
        <TouchableOpacity
          onPress={() => router.back()}
          className="p-2 -ml-2 rounded-full active:bg-slate-100 dark:active:bg-slate-800"
        >
          <ArrowLeft size={20} color="#64748b" />
        </TouchableOpacity>

        <Text className="text-slate-900 dark:text-white font-black text-base">
          {params.batchTitle ? `${params.batchTitle} Attendance` : "Class Attendance"}
        </Text>

        <View className="w-8" />
      </View>

      <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}>
        {/* Percentage Stats Card */}
        <View className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm mb-4">
          <View className="flex-row items-center justify-between mb-4">
            <View>
              <Text className="text-slate-500 text-xs font-bold uppercase tracking-wider">
                {data?.studentName || "Student"} Attendance Record
              </Text>
              <Text className="text-slate-900 dark:text-white text-lg font-black mt-0.5">
                Attendance Overview
              </Text>
            </View>

            <View className="bg-primary-50 dark:bg-primary-950/60 border border-primary-200 dark:border-primary-800 px-3 py-1.5 rounded-xl">
              <Text className="text-primary-600 dark:text-primary-400 text-xs font-black">
                Active Term
              </Text>
            </View>
          </View>

          {/* Stats circular/pills */}
          <View className="flex-row gap-3 mb-4">
            {/* Month Percentage */}
            <View className="flex-1 bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 items-center">
              <Text className="text-slate-500 dark:text-slate-400 text-[11px] font-bold">
                This Month
              </Text>
              <Text
                className={`text-2xl font-black mt-1 ${
                  (data?.stats.monthPercentage || 0) >= 85
                    ? "text-emerald-600 dark:text-emerald-400"
                    : (data?.stats.monthPercentage || 0) >= 75
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-rose-600 dark:text-rose-400"
                }`}
              >
                {data?.stats.monthPercentage ?? 100}%
              </Text>
              <Text className="text-slate-400 text-[10px] mt-0.5 font-medium">
                {data?.stats.presentDays || 0} / {data?.stats.totalDays || 0} classes
              </Text>
            </View>

            {/* Term Percentage */}
            <View className="flex-1 bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 items-center">
              <Text className="text-slate-500 dark:text-slate-400 text-[11px] font-bold">
                Term Overall
              </Text>
              <Text
                className={`text-2xl font-black mt-1 ${
                  (data?.stats.termPercentage || 0) >= 85
                    ? "text-emerald-600 dark:text-emerald-400"
                    : (data?.stats.termPercentage || 0) >= 75
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-rose-600 dark:text-rose-400"
                }`}
              >
                {data?.stats.termPercentage ?? 100}%
              </Text>
              <Text className="text-slate-400 text-[10px] mt-0.5 font-medium">
                cumulative rate
              </Text>
            </View>
          </View>

          {/* Breakdown Pills */}
          <View className="flex-row items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
            <View className="items-center">
              <Text className="text-emerald-600 dark:text-emerald-400 font-extrabold text-sm">
                {data?.stats.presentDays || 0}
              </Text>
              <Text className="text-slate-400 text-[10px] font-bold">Present</Text>
            </View>
            <View className="items-center">
              <Text className="text-amber-600 dark:text-amber-400 font-extrabold text-sm">
                {data?.stats.lateDays || 0}
              </Text>
              <Text className="text-slate-400 text-[10px] font-bold">Late</Text>
            </View>
            <View className="items-center">
              <Text className="text-rose-600 dark:text-rose-400 font-extrabold text-sm">
                {data?.stats.absentDays || 0}
              </Text>
              <Text className="text-slate-400 text-[10px] font-bold">Absent</Text>
            </View>
            <View className="items-center">
              <Text className="text-slate-500 dark:text-slate-400 font-extrabold text-sm">
                {data?.stats.excusedDays || 0}
              </Text>
              <Text className="text-slate-400 text-[10px] font-bold">Excused</Text>
            </View>
          </View>
        </View>

        {/* Month Calendar Card */}
        <View className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm mb-4">
          {/* Month selector header */}
          <View className="flex-row items-center justify-between mb-4">
            <TouchableOpacity
              onPress={goToPrevMonth}
              className="p-2 rounded-full bg-slate-100 dark:bg-slate-800"
            >
              <ChevronLeft size={18} color="#64748b" />
            </TouchableOpacity>

            <View className="flex-row items-center gap-2">
              <CalendarIcon size={16} color="#6366f1" />
              <Text className="text-slate-900 dark:text-white font-extrabold text-base">
                {monthName}
              </Text>
            </View>

            <TouchableOpacity
              onPress={goToNextMonth}
              className="p-2 rounded-full bg-slate-100 dark:bg-slate-800"
            >
              <ChevronRight size={18} color="#64748b" />
            </TouchableOpacity>
          </View>

          {/* Weekday Labels */}
          <View className="flex-row mb-2">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((w) => (
              <View key={w} className="w-[14.28%] items-center">
                <Text className="text-[11px] font-bold text-slate-400 uppercase">
                  {w}
                </Text>
              </View>
            ))}
          </View>

          {/* Calendar Day Grid */}
          {isLoading ? (
            <View className="py-12 items-center justify-center">
              <ActivityIndicator size="small" color="#6366f1" />
            </View>
          ) : (
            <View className="flex-row flex-wrap">
              {renderCalendarDays()}
            </View>
          )}

          {/* Legend */}
          <View className="flex-row items-center justify-center gap-4 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
            <View className="flex-row items-center gap-1.5">
              <View className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <Text className="text-slate-600 dark:text-slate-400 text-xs font-medium">Present</Text>
            </View>
            <View className="flex-row items-center gap-1.5">
              <View className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <Text className="text-slate-600 dark:text-slate-400 text-xs font-medium">Late</Text>
            </View>
            <View className="flex-row items-center gap-1.5">
              <View className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <Text className="text-slate-600 dark:text-slate-400 text-xs font-medium">Absent</Text>
            </View>
          </View>
        </View>

        {/* Selected Day Info Popup Card */}
        {selectedRecord && (
          <View className="bg-slate-900 rounded-2xl p-4 mb-4 border border-slate-700">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-white font-extrabold text-sm">
                Class on {selectedRecord.date}
              </Text>
              <View
                className={`px-2.5 py-0.5 rounded-md ${
                  selectedRecord.status === "present"
                    ? "bg-emerald-600"
                    : selectedRecord.status === "late"
                    ? "bg-amber-600"
                    : selectedRecord.status === "absent"
                    ? "bg-rose-600"
                    : "bg-slate-700"
                }`}
              >
                <Text className="text-white text-[11px] font-black uppercase">
                  {selectedRecord.status}
                </Text>
              </View>
            </View>

            {selectedRecord.batchTitle && (
              <Text className="text-slate-300 text-xs mb-1">
                Batch: {selectedRecord.batchTitle}
              </Text>
            )}

            {selectedRecord.sessionTitle && (
              <Text className="text-slate-300 text-xs mb-1">
                Session: {selectedRecord.sessionTitle}
              </Text>
            )}

            {selectedRecord.source === "joined_online" && (
              <View className="flex-row items-center gap-1 mt-1">
                <Wifi size={12} color="#10b981" />
                <Text className="text-emerald-400 text-xs font-semibold">
                  Joined Online via App
                </Text>
              </View>
            )}

            {selectedRecord.note && (
              <Text className="text-slate-400 text-xs italic mt-1">
                Note: {selectedRecord.note}
              </Text>
            )}
          </View>
        )}

        {/* Absences Section */}
        <View className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm mb-8">
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center">
              <AlertCircle size={18} color="#e11d48" className="mr-2" />
              <Text className="text-slate-900 dark:text-white font-extrabold text-base">
                Absences This Month
              </Text>
            </View>
            <View className="bg-rose-50 dark:bg-rose-950/60 px-2.5 py-1 rounded-full">
              <Text className="text-rose-600 dark:text-rose-400 text-xs font-black">
                {data?.absences?.length || 0}
              </Text>
            </View>
          </View>

          {(!data?.absences || data.absences.length === 0) ? (
            <View className="py-6 items-center">
              <CheckCircle2 size={32} color="#10b981" className="mb-2" />
              <Text className="text-slate-900 dark:text-white font-bold text-sm">
                No absences this month!
              </Text>
              <Text className="text-slate-400 text-xs mt-0.5">
                Keep up the great consistency and punctuality.
              </Text>
            </View>
          ) : (
            <View className="divide-y divide-slate-100 dark:divide-slate-800">
              {data.absences.map((absence) => (
                <View key={absence.id} className="py-3 flex-row items-center justify-between">
                  <div>
                    <Text className="text-slate-900 dark:text-white font-bold text-sm">
                      {absence.batchTitle || "Batch Class"}
                    </Text>
                    <Text className="text-slate-400 text-xs mt-0.5">
                      {absence.date} • {absence.note || "No note recorded"}
                    </Text>
                  </div>
                  <View className="bg-rose-100 dark:bg-rose-900/60 px-2 py-0.5 rounded-md">
                    <Text className="text-rose-700 dark:text-rose-300 text-[10px] font-black uppercase">
                      Absent
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
