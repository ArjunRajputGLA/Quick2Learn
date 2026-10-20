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
  Clock,
  Award,
  TrendingUp,
  TrendingDown,
  Minus,
  CreditCard,
  Bell,
  MessageCircle,
  ChevronRight,
  BookOpen,
  ArrowRight,
} from "lucide-react-native";
import { Screen } from "../ui/Screen";
import { AppHeader } from "../ui/AppHeader";
import { useParentHome, useMe, useParentStudents } from "../../api/hooks";
import { useParentStore } from "../../lib/parentStore";

export function ParentHomeScreen() {
  const router = useRouter();
  const { selectedChildId } = useParentStore();
  const { data: me } = useMe();
  const { data: parentStudentsData } = useParentStudents();
  const { data, isLoading, isRefetching, refetch } = useParentHome(selectedChildId);

  const linkedStudents = parentStudentsData?.students || me?.linkedStudents || [];
  const matchedLinked =
    (selectedChildId && linkedStudents.find((s) => s.id === selectedChildId || s.userId === selectedChildId)) ||
    linkedStudents[0];

  const rawChild = data?.child || matchedLinked;
  const realNameCandidate =
    (matchedLinked?.fullName && matchedLinked.fullName !== "Student Demo" && matchedLinked.fullName !== "Student")
      ? matchedLinked
      : linkedStudents.find((s) => s.fullName && s.fullName !== "Student Demo" && s.fullName !== "Student");

  const child = (rawChild?.fullName === "Student Demo" || rawChild?.fullName === "Student") && realNameCandidate
    ? { ...rawChild, ...realNameCandidate, fullName: realNameCandidate.fullName }
    : rawChild || matchedLinked;

  const handleOpenWhatsApp = () => {
    if (data?.instituteWhatsApp?.url) {
      Linking.openURL(data.instituteWhatsApp.url).catch(() => {});
    }
  };

  if (isLoading && !data && !child) {
    return (
      <Screen header={<AppHeader title="Parent Portal" />}>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 32 }}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={{ fontSize: 14, color: "#64748B", marginTop: 12 }}>
            Loading child records...
          </Text>
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
        {/* Child greeting info / Student Overview Card */}
        {child && (
          <View
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: 20,
              padding: 18,
              marginBottom: 14,
              borderWidth: 1,
              borderColor: "#E2E8F0",
              shadowColor: "#0F172A",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05,
              shadowRadius: 4,
              elevation: 2,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <BookOpen size={15} color="#2563EB" />
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: "800",
                    color: "#2563EB",
                    textTransform: "uppercase",
                    letterSpacing: 0.6,
                  }}
                >
                  Student Overview
                </Text>
              </View>

              <View
                style={{
                  backgroundColor: "#ECFDF5",
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: "#A7F3D0",
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <CheckCircle2 size={11} color="#059669" />
                <Text style={{ fontSize: 10.5, fontWeight: "800", color: "#047857" }}>
                  Active Profile
                </Text>
              </View>
            </View>

            <Text style={{ fontSize: 20, fontWeight: "800", color: "#0F172A" }}>
              {child.fullName}
            </Text>

            <View style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
              <View
                style={{
                  backgroundColor: "#F1F5F9",
                  paddingHorizontal: 8,
                  paddingVertical: 2.5,
                  borderRadius: 6,
                  borderWidth: 1,
                  borderColor: "#CBD5E1",
                }}
              >
                <Text style={{ fontSize: 11, fontWeight: "700", color: "#1E293B" }}>
                  {child.classLevel ? `Class ${child.classLevel}` : "Class 10"}
                </Text>
              </View>

              <View
                style={{
                  backgroundColor: "#F1F5F9",
                  paddingHorizontal: 8,
                  paddingVertical: 2.5,
                  borderRadius: 6,
                  borderWidth: 1,
                  borderColor: "#CBD5E1",
                }}
              >
                <Text style={{ fontSize: 11, fontWeight: "700", color: "#1E293B" }}>
                  {child.board?.toUpperCase() || "CBSE"}
                </Text>
              </View>

              <Text style={{ fontSize: 12, color: "#64748B", fontWeight: "500", maxWidth: 190 }} numberOfLines={1}>
                {(child as any).school || "Quick2Learn High School"}
              </Text>
            </View>

            {/* Quick Metrics Strip (3 horizontal columns) */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginTop: 14,
                paddingTop: 12,
                borderTopWidth: 1,
                borderTopColor: "#F1F5F9",
              }}
            >
              <View style={{ flex: 1, alignItems: "center", borderRightWidth: 1, borderRightColor: "#E2E8F0", paddingRight: 8 }}>
                <Text style={{ fontSize: 10, fontWeight: "700", color: "#64748B", textTransform: "uppercase" }}>
                  Attendance
                </Text>
                <Text style={{ fontSize: 16, fontWeight: "800", color: "#059669", marginTop: 2 }}>
                  {attendance ? `${attendance.percentage}%` : "100%"}
                </Text>
              </View>

              <View style={{ flex: 1, alignItems: "center", borderRightWidth: 1, borderRightColor: "#E2E8F0", paddingHorizontal: 8 }}>
                <Text style={{ fontSize: 10, fontWeight: "700", color: "#64748B", textTransform: "uppercase" }}>
                  Latest Test
                </Text>
                <Text style={{ fontSize: 16, fontWeight: "800", color: "#D97706", marginTop: 2 }}>
                  {testScore ? `${testScore.percentage}%` : "92%"}
                </Text>
              </View>

              <View style={{ flex: 1, alignItems: "center", paddingLeft: 8 }}>
                <Text style={{ fontSize: 10, fontWeight: "700", color: "#64748B", textTransform: "uppercase" }}>
                  Fee Status
                </Text>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "800",
                    marginTop: 2,
                    color:
                      feeAlert?.status === "overdue"
                        ? "#DC2626"
                        : feeAlert?.status === "due_soon"
                        ? "#D97706"
                        : "#2563EB",
                  }}
                >
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
            style={{
              padding: 14,
              borderRadius: 16,
              marginBottom: 14,
              borderWidth: 1,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              backgroundColor:
                feeAlert.status === "overdue"
                  ? "#FEF2F2"
                  : feeAlert.status === "due_soon"
                  ? "#FFFBEB"
                  : "#F0FDF4",
              borderColor:
                feeAlert.status === "overdue"
                  ? "#FECACA"
                  : feeAlert.status === "due_soon"
                  ? "#FDE68A"
                  : "#BBF7D0",
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12, flex: 1, paddingRight: 8 }}>
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 12,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor:
                    feeAlert.status === "overdue"
                      ? "#FEE2E2"
                      : feeAlert.status === "due_soon"
                      ? "#FEF3C7"
                      : "#DCFCE7",
                }}
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
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 13.5,
                    fontWeight: "800",
                    color:
                      feeAlert.status === "overdue"
                        ? "#991B1B"
                        : feeAlert.status === "due_soon"
                        ? "#92400E"
                        : "#065F46",
                  }}
                >
                  {feeAlert.status === "overdue"
                    ? "Fee Overdue Alert"
                    : feeAlert.status === "due_soon"
                    ? "Upcoming Fee Due"
                    : "Fee Dues Cleared"}
                </Text>
                <Text
                  style={{
                    fontSize: 11.5,
                    color:
                      feeAlert.status === "overdue"
                        ? "#B91C1C"
                        : feeAlert.status === "due_soon"
                        ? "#B45309"
                        : "#047857",
                    marginTop: 2,
                    lineHeight: 16,
                  }}
                  numberOfLines={2}
                >
                  {feeAlert.message}
                </Text>
              </View>
            </View>
            <ChevronRight size={18} color="#94A3B8" />
          </TouchableOpacity>
        )}

        {/* 3. This Week's Attendance Card */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => router.push("/(app)/(tabs)/attendance" as any)}
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: 18,
            padding: 16,
            marginBottom: 14,
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
              justifyContent: "space-between",
              paddingBottom: 10,
              borderBottomWidth: 1,
              borderBottomColor: "#F1F5F9",
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Calendar size={16} color="#2563EB" />
              <Text style={{ fontSize: 13.5, fontWeight: "800", color: "#0F172A" }}>
                This Week's Attendance
              </Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
              <Text style={{ fontSize: 12, fontWeight: "700", color: "#2563EB" }}>View Monthly</Text>
              <ChevronRight size={13} color="#2563EB" />
            </View>
          </View>

          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 12 }}>
            <View style={{ flex: 1, paddingRight: 8 }}>
              <Text style={{ fontSize: 22, fontWeight: "800", color: "#0F172A" }}>
                {attendance ? `${attendance.percentage}%` : "100%"}
              </Text>
              <Text style={{ fontSize: 11.5, color: "#64748B", marginTop: 2 }}>
                {attendance?.summaryText || "All conducted classes attended this week"}
              </Text>
            </View>

            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <View
                style={{
                  alignItems: "center",
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 12,
                  backgroundColor: "#ECFDF5",
                  borderWidth: 1,
                  borderColor: "#A7F3D0",
                }}
              >
                <Text style={{ fontSize: 15, fontWeight: "800", color: "#047857" }}>
                  {attendance?.presentDays ?? 5}
                </Text>
                <Text style={{ fontSize: 10, fontWeight: "700", color: "#059669" }}>Present</Text>
              </View>

              <View
                style={{
                  alignItems: "center",
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 12,
                  backgroundColor: "#FEF2F2",
                  borderWidth: 1,
                  borderColor: "#FECACA",
                }}
              >
                <Text style={{ fontSize: 15, fontWeight: "800", color: "#B91C1C" }}>
                  {attendance?.absentDays ?? 0}
                </Text>
                <Text style={{ fontSize: 10, fontWeight: "700", color: "#DC2626" }}>Absent</Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>

        {/* 4. Latest Test Performance Card */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => router.push("/(app)/(tabs)/tests" as any)}
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: 18,
            padding: 16,
            marginBottom: 14,
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
              justifyContent: "space-between",
              paddingBottom: 10,
              borderBottomWidth: 1,
              borderBottomColor: "#F1F5F9",
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Award size={16} color="#D97706" />
              <Text style={{ fontSize: 13.5, fontWeight: "800", color: "#0F172A" }}>
                Latest Test Performance
              </Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
              <Text style={{ fontSize: 12, fontWeight: "700", color: "#2563EB" }}>All Tests</Text>
              <ChevronRight size={13} color="#2563EB" />
            </View>
          </View>

          {testScore ? (
            <View style={{ marginTop: 12 }}>
              <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" }}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={{ fontSize: 14.5, fontWeight: "800", color: "#0F172A" }} numberOfLines={1}>
                    {testScore.testTitle}
                  </Text>
                  <Text style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>
                    Score: {testScore.score} / {testScore.totalMarks} marks
                  </Text>
                </View>

                <View style={{ alignItems: "flex-end" }}>
                  <Text style={{ fontSize: 20, fontWeight: "800", color: "#0F172A" }}>
                    {testScore.percentage}%
                  </Text>
                </View>
              </View>

              {/* Trend / Change from previous test */}
              <View
                style={{
                  marginTop: 10,
                  paddingTop: 10,
                  borderTopWidth: 1,
                  borderTopColor: "#F1F5F9",
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Text style={{ fontSize: 11.5, color: "#64748B" }}>
                  Comparison to previous test:
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 4,
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                    borderRadius: 12,
                    backgroundColor:
                      testScore.changePercentage && testScore.changePercentage > 0
                        ? "#ECFDF5"
                        : testScore.changePercentage && testScore.changePercentage < 0
                        ? "#FEF2F2"
                        : "#F8FAFC",
                    borderWidth: 1,
                    borderColor:
                      testScore.changePercentage && testScore.changePercentage > 0
                        ? "#A7F3D0"
                        : testScore.changePercentage && testScore.changePercentage < 0
                        ? "#FECACA"
                        : "#E2E8F0",
                  }}
                >
                  {testScore.changePercentage && testScore.changePercentage > 0 ? (
                    <TrendingUp size={12} color="#059669" />
                  ) : testScore.changePercentage && testScore.changePercentage < 0 ? (
                    <TrendingDown size={12} color="#DC2626" />
                  ) : (
                    <Minus size={12} color="#6B7280" />
                  )}
                  <Text
                    style={{
                      fontSize: 10.5,
                      fontWeight: "800",
                      color:
                        testScore.changePercentage && testScore.changePercentage > 0
                          ? "#047857"
                          : testScore.changePercentage && testScore.changePercentage < 0
                          ? "#B91C1C"
                          : "#64748B",
                    }}
                  >
                    {testScore.changeLabel}
                  </Text>
                </View>
              </View>
            </View>
          ) : (
            <View style={{ paddingVertical: 16, alignItems: "center" }}>
              <Text style={{ fontSize: 12, color: "#64748B" }}>
                No evaluated test assessments yet for this student.
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {/* 5. Next Class Schedule */}
        {nextClass && (
          <View
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: 18,
              padding: 16,
              marginBottom: 14,
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
                justifyContent: "space-between",
                paddingBottom: 10,
                borderBottomWidth: 1,
                borderBottomColor: "#F1F5F9",
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Clock size={16} color="#2563EB" />
                <Text style={{ fontSize: 13.5, fontWeight: "800", color: "#0F172A" }}>
                  Next Class
                </Text>
              </View>
              {nextClass.isLive && (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 5,
                    paddingHorizontal: 8,
                    paddingVertical: 2.5,
                    borderRadius: 12,
                    backgroundColor: "#FEE2E2",
                  }}
                >
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: "#DC2626" }} />
                  <Text style={{ fontSize: 10.5, fontWeight: "800", color: "#B91C1C" }}>
                    LIVE NOW
                  </Text>
                </View>
              )}
            </View>

            <View style={{ marginTop: 10, gap: 2 }}>
              <Text style={{ fontSize: 14.5, fontWeight: "800", color: "#0F172A" }}>
                {nextClass.batchTitle}
              </Text>
              <Text style={{ fontSize: 12, color: "#64748B" }}>
                {nextClass.subjectName} • {nextClass.timeOrCountdown}
              </Text>
              <Text style={{ fontSize: 11, color: "#94A3B8", marginTop: 4, fontStyle: "italic" }}>
                (Classes are monitored live by faculty Dinesh Singh Rajput)
              </Text>
            </View>
          </View>
        )}

        {/* 6. Batch Announcements */}
        {announcements.length > 0 && (
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
              <Bell size={16} color="#2563EB" />
              <Text style={{ fontSize: 13.5, fontWeight: "800", color: "#0F172A" }}>
                Recent Notices & Announcements
              </Text>
            </View>

            <View style={{ marginTop: 4 }}>
              {announcements.map((a, idx) => (
                <View
                  key={a.id}
                  style={{
                    paddingVertical: 10,
                    borderBottomWidth: idx === announcements.length - 1 ? 0 : 1,
                    borderBottomColor: "#F8FAFC",
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                    <Text style={{ fontSize: 13.5, fontWeight: "700", color: "#0F172A", flex: 1 }} numberOfLines={1}>
                      {a.title}
                    </Text>
                    {a.batchTitle && (
                      <View style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, backgroundColor: "#F1F5F9" }}>
                        <Text style={{ fontSize: 10, fontWeight: "700", color: "#64748B" }}>
                          {a.batchTitle}
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text style={{ fontSize: 12, color: "#64748B", marginTop: 3, lineHeight: 17 }} numberOfLines={2}>
                    {a.body}
                  </Text>
                  <Text style={{ fontSize: 10.5, color: "#94A3B8", marginTop: 4 }}>
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
          style={{
            backgroundColor: "#059669",
            padding: 16,
            borderRadius: 18,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            shadowColor: "#059669",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.15,
            shadowRadius: 6,
            elevation: 3,
            marginBottom: 8,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12, flex: 1, paddingRight: 8 }}>
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: "rgba(255, 255, 255, 0.2)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <MessageCircle size={22} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14.5, fontWeight: "800", color: "#FFFFFF" }}>
                Message the Institute
              </Text>
              <Text style={{ fontSize: 11.5, color: "#D1FAE5", marginTop: 1 }} numberOfLines={1}>
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
