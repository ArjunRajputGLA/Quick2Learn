import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
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
} from "lucide-react-native";
import { Screen } from "../../../src/components/ui/Screen";
import { AppHeader } from "../../../src/components/ui/AppHeader";
import { useAttendance, useMe, useParentStudents } from "../../../src/api/hooks";
import { useParentStore } from "../../../src/lib/parentStore";
import type { AttendanceRecordItem } from "@quick2learn/shared";
import { useTabBarScroll } from "../../../src/lib/tabBarVisibilityStore";

export default function ParentAttendanceTab() {
  const { onScroll: onTabBarScroll } = useTabBarScroll();
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
    totalDays: 22,
    presentDays: 20,
    absentDays: 1,
    lateDays: 1,
    monthPercentage: 95,
    termPercentage: 94,
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

  const calendarCells: ({ day: number; dateStr: string; record?: AttendanceRecordItem } | null)[] = [];
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

  const childName = currentChild?.fullName || data?.studentName || "Child";

  return (
    <Screen
      scrollable={false}
      header={<AppHeader title={`${childName}'s Attendance`} />}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={onTabBarScroll}
        scrollEventThrottle={16}
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
        contentContainerStyle={{ padding: 16, paddingBottom: 130 }}
      >
        {/* Month Selector */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: "#FFFFFF",
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderRadius: 18,
            borderWidth: 1,
            borderColor: "#E2E8F0",
            marginBottom: 14,
            shadowColor: "#0F172A",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.04,
            shadowRadius: 3,
            elevation: 1,
          }}
        >
          <TouchableOpacity
            onPress={goToPrevMonth}
            activeOpacity={0.7}
            style={{
              width: 38,
              height: 38,
              borderRadius: 12,
              backgroundColor: "#F8FAFC",
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 1,
              borderColor: "#E2E8F0",
            }}
          >
            <ChevronLeft size={20} color="#334155" />
          </TouchableOpacity>

          <View style={{ alignItems: "center" }}>
            <Text style={{ fontSize: 15, fontWeight: "800", color: "#0F172A" }}>
              {monthName}
            </Text>
            <Text style={{ fontSize: 11, color: "#64748B", fontWeight: "600", marginTop: 1 }}>
              Official Class Roster
            </Text>
          </View>

          <TouchableOpacity
            onPress={goToNextMonth}
            activeOpacity={0.7}
            style={{
              width: 38,
              height: 38,
              borderRadius: 12,
              backgroundColor: "#F8FAFC",
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 1,
              borderColor: "#E2E8F0",
            }}
          >
            <ChevronRight size={20} color="#334155" />
          </TouchableOpacity>
        </View>

        {/* 3-Column Horizontal Stats Bar */}
        <View style={{ flexDirection: "row", gap: 8, marginBottom: 14 }}>
          <View
            style={{
              flex: 1,
              backgroundColor: "#FFFFFF",
              paddingVertical: 12,
              paddingHorizontal: 6,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: "#E2E8F0",
              alignItems: "center",
              shadowColor: "#0F172A",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.04,
              shadowRadius: 3,
              elevation: 1,
            }}
          >
            <Text style={{ fontSize: 10, fontWeight: "700", color: "#64748B", textTransform: "uppercase" }}>
              Attendance
            </Text>
            <Text style={{ fontSize: 19, fontWeight: "800", color: "#2563EB", marginTop: 2 }}>
              {stats.monthPercentage}%
            </Text>
            <Text style={{ fontSize: 10.5, color: "#64748B", marginTop: 1 }}>
              This Month
            </Text>
          </View>

          <View
            style={{
              flex: 1,
              backgroundColor: "#FFFFFF",
              paddingVertical: 12,
              paddingHorizontal: 6,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: "#E2E8F0",
              alignItems: "center",
              shadowColor: "#0F172A",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.04,
              shadowRadius: 3,
              elevation: 1,
            }}
          >
            <Text style={{ fontSize: 10, fontWeight: "700", color: "#059669", textTransform: "uppercase" }}>
              Present
            </Text>
            <Text style={{ fontSize: 19, fontWeight: "800", color: "#059669", marginTop: 2 }}>
              {stats.presentDays}
            </Text>
            <Text style={{ fontSize: 10.5, color: "#64748B", marginTop: 1 }}>
              Days attended
            </Text>
          </View>

          <View
            style={{
              flex: 1,
              backgroundColor: "#FFFFFF",
              paddingVertical: 12,
              paddingHorizontal: 6,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: "#E2E8F0",
              alignItems: "center",
              shadowColor: "#0F172A",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.04,
              shadowRadius: 3,
              elevation: 1,
            }}
          >
            <Text style={{ fontSize: 10, fontWeight: "700", color: "#DC2626", textTransform: "uppercase" }}>
              Absent
            </Text>
            <Text style={{ fontSize: 19, fontWeight: "800", color: "#DC2626", marginTop: 2 }}>
              {stats.absentDays}
            </Text>
            <Text style={{ fontSize: 10.5, color: "#64748B", marginTop: 1 }}>
              Classes missed
            </Text>
          </View>
        </View>

        {/* Calendar Grid Card */}
        <View
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: 18,
            padding: 16,
            borderWidth: 1,
            borderColor: "#E2E8F0",
            marginBottom: 14,
            shadowColor: "#0F172A",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.04,
            shadowRadius: 3,
            elevation: 1,
          }}
        >
          {/* Day of Week Header */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 10,
              paddingBottom: 8,
              borderBottomWidth: 1,
              borderBottomColor: "#F1F5F9",
            }}
          >
            {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
              <View key={i} style={{ width: "14.28%", alignItems: "center" }}>
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "800",
                    color: i === 0 ? "#EF4444" : "#64748B",
                  }}
                >
                  {d}
                </Text>
              </View>
            ))}
          </View>

          {/* Days Grid */}
          <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
            {calendarCells.map((cell, idx) => {
              if (!cell) {
                return <View key={idx} style={{ width: "14.28%", height: 44 }} />;
              }

              const rec = cell.record;
              const isPresent = rec?.status === "present";
              const isAbsent = rec?.status === "absent";
              const isLate = rec?.status === "late";
              // Explicit null/undefined guard to prevent all days selecting by default!
              const isSelected = !!selectedRecord && !!rec && selectedRecord.id === rec.id;

              return (
                <TouchableOpacity
                  key={idx}
                  disabled={!rec}
                  onPress={() => rec && setSelectedRecord(rec)}
                  activeOpacity={0.7}
                  style={{
                    width: "14.28%",
                    height: 44,
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 2,
                  }}
                >
                  <View
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 17,
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: isSelected
                        ? "#EFF6FF"
                        : isPresent
                        ? "#DCFCE7"
                        : isAbsent
                        ? "#FEE2E2"
                        : isLate
                        ? "#FEF3C7"
                        : "transparent",
                      borderWidth: isSelected
                        ? 2
                        : isPresent
                        ? 1
                        : isAbsent
                        ? 1
                        : isLate
                        ? 1
                        : 0,
                      borderColor: isSelected
                        ? "#2563EB"
                        : isPresent
                        ? "#86EFAC"
                        : isAbsent
                        ? "#FCA5A5"
                        : isLate
                        ? "#FCD34D"
                        : "transparent",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 12.5,
                        fontWeight: isPresent || isAbsent || isLate || isSelected ? "800" : "500",
                        color: isSelected
                          ? "#1D4ED8"
                          : isPresent
                          ? "#15803D"
                          : isAbsent
                          ? "#B91C1C"
                          : isLate
                          ? "#B45309"
                          : "#334155",
                      }}
                    >
                      {cell.day}
                    </Text>

                    {/* Status Dot */}
                    {isPresent && (
                      <View
                        style={{
                          width: 4,
                          height: 4,
                          borderRadius: 2,
                          backgroundColor: "#16A34A",
                          position: "absolute",
                          bottom: 3,
                        }}
                      />
                    )}
                    {isAbsent && (
                      <View
                        style={{
                          width: 4,
                          height: 4,
                          borderRadius: 2,
                          backgroundColor: "#DC2626",
                          position: "absolute",
                          bottom: 3,
                        }}
                      />
                    )}
                    {isLate && (
                      <View
                        style={{
                          width: 4,
                          height: 4,
                          borderRadius: 2,
                          backgroundColor: "#D97706",
                          position: "absolute",
                          bottom: 3,
                        }}
                      />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Legend */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 16,
              marginTop: 14,
              paddingTop: 10,
              borderTopWidth: 1,
              borderTopColor: "#F1F5F9",
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#16A34A" }} />
              <Text style={{ fontSize: 11, fontWeight: "600", color: "#64748B" }}>Present</Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#DC2626" }} />
              <Text style={{ fontSize: 11, fontWeight: "600", color: "#64748B" }}>Absent</Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#D97706" }} />
              <Text style={{ fontSize: 11, fontWeight: "600", color: "#64748B" }}>Late</Text>
            </View>
          </View>
        </View>

        {/* Selected Record Detail */}
        {selectedRecord && (
          <View
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: 18,
              padding: 16,
              borderWidth: 1,
              borderColor: "#E2E8F0",
              marginBottom: 14,
              shadowColor: "#0F172A",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.04,
              shadowRadius: 3,
              elevation: 1,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingBottom: 10,
                borderBottomWidth: 1,
                borderBottomColor: "#F1F5F9",
              }}
            >
              <Text style={{ fontSize: 13.5, fontWeight: "800", color: "#0F172A" }}>
                Class Attendance on {selectedRecord.date}
              </Text>
              <View
                style={{
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  borderRadius: 6,
                  backgroundColor:
                    selectedRecord.status === "present"
                      ? "#DCFCE7"
                      : selectedRecord.status === "absent"
                      ? "#FEE2E2"
                      : "#FEF3C7",
                }}
              >
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: "800",
                    textTransform: "uppercase",
                    color:
                      selectedRecord.status === "present"
                        ? "#15803D"
                        : selectedRecord.status === "absent"
                        ? "#B91C1C"
                        : "#B45309",
                  }}
                >
                  {selectedRecord.status}
                </Text>
              </View>
            </View>

            <View style={{ marginTop: 10, gap: 5 }}>
              {selectedRecord.batchTitle && (
                <Text style={{ fontSize: 12, color: "#64748B" }}>
                  Batch:{" "}
                  <Text style={{ fontWeight: "700", color: "#0F172A" }}>
                    {selectedRecord.batchTitle}
                  </Text>
                </Text>
              )}
              {selectedRecord.note && (
                <Text style={{ fontSize: 12, color: "#64748B" }}>
                  Remarks:{" "}
                  <Text style={{ fontStyle: "italic", color: "#334155" }}>
                    {selectedRecord.note}
                  </Text>
                </Text>
              )}
            </View>
          </View>
        )}

        {/* Absences List */}
        {data?.absences && data.absences.length > 0 && (
          <View
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
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                paddingBottom: 10,
                borderBottomWidth: 1,
                borderBottomColor: "#F1F5F9",
              }}
            >
              <AlertCircle size={16} color="#DC2626" />
              <Text style={{ fontSize: 13.5, fontWeight: "800", color: "#0F172A" }}>
                Recorded Absences ({data.absences.length})
              </Text>
            </View>

            <View style={{ marginTop: 6 }}>
              {data.absences.map((ab) => (
                <View
                  key={ab.id}
                  style={{
                    paddingVertical: 10,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    borderBottomWidth: 1,
                    borderBottomColor: "#F8FAFC",
                  }}
                >
                  <View>
                    <Text style={{ fontSize: 13, fontWeight: "700", color: "#0F172A" }}>
                      {ab.date}
                    </Text>
                    <Text style={{ fontSize: 11, color: "#64748B", marginTop: 1 }}>
                      {ab.batchTitle || "Morning Batch"} • {ab.note || "Class missed"}
                    </Text>
                  </View>
                  <View
                    style={{
                      paddingHorizontal: 8,
                      paddingVertical: 3,
                      borderRadius: 6,
                      backgroundColor: "#FEE2E2",
                      borderWidth: 1,
                      borderColor: "#FECACA",
                    }}
                  >
                    <Text style={{ fontSize: 10.5, fontWeight: "800", color: "#B91C1C" }}>
                      Absent
                    </Text>
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
