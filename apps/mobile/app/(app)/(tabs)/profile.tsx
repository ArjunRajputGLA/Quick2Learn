import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Share,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
} from "react-native";
import { useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import * as WebBrowser from "expo-web-browser";
import {
  User,
  GraduationCap,
  TrendingUp,
  Calendar,
  CreditCard,
  Download,
  Bell,
  KeyRound,
  Settings,
  HelpCircle,
  Trophy,
  Share2,
  Shield,
  FileText,
  LogOut,
  ChevronRight,
  Edit3,
  Award,
  Video,
  ExternalLink,
  Users,
  UserPlus,
  Check,
} from "lucide-react-native";
import { Screen } from "../../../src/components/ui/Screen";
import { AppHeader } from "../../../src/components/ui/AppHeader";
import { Button } from "../../../src/components/ui/Button";
import { Card } from "../../../src/components/ui/Card";
import { Avatar } from "../../../src/components/ui/Avatar";
import { Badge } from "../../../src/components/ui/Badge";
import {
  useMe,
  useStudentQuickStats,
  useStudentInviteCode,
  useGenerateStudentInviteCode,
  useParentStudents,
  useClaimInviteCode,
  DEMO_MODE_STORAGE_KEY,
} from "../../../src/api/hooks";
import * as SecureStore from "expo-secure-store";
import { useParentStore } from "../../../src/lib/parentStore";
import { authClient } from "../../../src/api/auth-client";
import { useI18n } from "../../../src/lib/i18n";

export default function ProfileScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { t } = useI18n();

  const { data: me, isLoading } = useMe();
  const { data: quickStats, isLoading: isStatsLoading } = useStudentQuickStats();
  const { data: inviteCodeData, isLoading: isInviteLoading } = useStudentInviteCode();
  const { data: parentStudentsData } = useParentStudents();
  const generateCodeMutation = useGenerateStudentInviteCode();

  const [isSigningOut, setIsSigningOut] = useState(false);
  const [parentModalVisible, setParentModalVisible] = useState(false);
  const [linkChildModalVisible, setLinkChildModalVisible] = useState(false);
  const [claimCodeInput, setClaimCodeInput] = useState("");
  const [claimError, setClaimError] = useState("");

  const { selectedChildId, setSelectedChildId } = useParentStore();
  const claimCodeMutation = useClaimInviteCode();

  const linkedStudents =
    parentStudentsData?.students || me?.linkedStudents || [];

  const user = me?.user;
  const profile = me?.profile;
  const role = me?.role || "student";
  const fullName = profile?.fullName || user?.name || "Student";

  const handleShareInviteCode = async () => {
    if (!inviteCodeData?.code) return;
    try {
      await Share.share({
        title: "Quick2Learn Parent Link Code",
        message: `Hi Parent! Use this invite code [${inviteCodeData.code}] in the Quick2Learn app to link with my student account and track my progress. Download app: https://play.google.com/store/apps/details?id=in.quick2learn.app`,
      });
    } catch (err) {
      console.warn("Share error:", err);
    }
  };

  const handleShareApp = async () => {
    try {
      await Share.share({
        title: "Quick2Learn App",
        message:
          "Study Mathematics & Sciences with Quick2Learn by Dinesh Sir (25+ yrs teaching). Classes IX–XII CBSE & ICSE. Download the app: https://play.google.com/store/apps/details?id=in.quick2learn.app",
      });
    } catch (err) {
      console.warn("Share app error:", err);
    }
  };

  const handleOpenPrivacyPolicy = async () => {
    try {
      await WebBrowser.openBrowserAsync("https://quick2learn.in/privacy");
    } catch {
      Alert.alert("Notice", "Visit https://quick2learn.in/privacy to view our Privacy Policy.");
    }
  };

  const handleOpenTerms = async () => {
    try {
      await WebBrowser.openBrowserAsync("https://quick2learn.in/terms");
    } catch {
      Alert.alert("Notice", "Visit https://quick2learn.in/terms to view our Terms of Service.");
    }
  };

  const handleSignOut = () => {
    Alert.alert(t("logOut"), t("logOutConfirm"), [
      { text: t("cancel"), style: "cancel" },
      {
        text: t("logOut"),
        style: "destructive",
        onPress: async () => {
          try {
            setIsSigningOut(true);
            await SecureStore.deleteItemAsync(DEMO_MODE_STORAGE_KEY).catch(() => {});
            await authClient.signOut().catch(() => {});
            queryClient.clear();
            router.replace("/(auth)/welcome" as any);
          } catch {
            await SecureStore.deleteItemAsync(DEMO_MODE_STORAGE_KEY).catch(() => {});
            queryClient.clear();
            router.replace("/(auth)/welcome" as any);
          } finally {
            setIsSigningOut(false);
          }
        },
      },
    ]);
  };

  const handleClaimCode = () => {
    if (!claimCodeInput.trim()) {
      setClaimError("Please enter an invite code");
      return;
    }
    setClaimError("");
    claimCodeMutation.mutate(
      { code: claimCodeInput.trim().toUpperCase() },
      {
        onSuccess: (data) => {
          Alert.alert("Success", "Student account linked successfully!");
          setClaimCodeInput("");
          setLinkChildModalVisible(false);
          queryClient.invalidateQueries({ queryKey: ["me"] });
          queryClient.invalidateQueries({ queryKey: ["parent-students"] });
          if (data?.student?.id) {
            setSelectedChildId(data.student.id);
          }
        },
        onError: (err: any) => {
          setClaimError(err?.message || "Invalid or expired invite code");
        },
      }
    );
  };

  return (
    <Screen scrollable={false} header={<AppHeader title={t("profileTitle")} />}>
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. USER PROFILE CARD */}
        <View className="bg-surface rounded-2xl p-5 border border-border mb-4 items-center shadow-sm">
          <Avatar name={fullName} size="xl" className="mb-3" />
          <Text className="text-h2 font-bold text-ink text-center mb-1">
            {fullName}
          </Text>

          <View className="flex-row items-center space-x-2 mb-3">
            <Badge label={role.toUpperCase()} variant="primary" size="sm" />
            {role === "student" && profile?.classLevel ? (
              <Badge
                label={`Class ${profile.classLevel}${
                  profile.board ? ` • ${profile.board.toUpperCase()}` : ""
                }`}
                variant="neutral"
                size="sm"
              />
            ) : null}
            {role === "parent" ? (
              <Badge
                label={`${linkedStudents.length} ${linkedStudents.length === 1 ? "Child" : "Children"}`}
                variant="neutral"
                size="sm"
              />
            ) : null}
          </View>

          {profile?.school ? (
            <Text className="text-caption text-ink-muted text-center mb-3">
              {profile.school}
            </Text>
          ) : null}

          {/* Edit Profile Action Pill */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.push("/(app)/profile/edit" as any)}
            className="flex-row items-center bg-primary-soft/80 py-1.5 px-3 rounded-full border border-primary/20"
          >
            <Edit3 size={13} color="#2563EB" />
            <Text className="text-caption font-bold text-primary ml-1.5">
              {t("editProfileRow")}
            </Text>
          </TouchableOpacity>
        </View>

        {/* PARENT LINKED CHILDREN */}
        {role === "parent" && (
          <View className="bg-surface rounded-2xl p-4 border border-border mb-4 shadow-sm">
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center space-x-2">
                <Users size={18} color="#2563EB" />
                <Text className="text-h3 font-bold text-ink ml-2">
                  Linked Children ({linkedStudents.length})
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setLinkChildModalVisible(true)}
                className="flex-row items-center bg-primary/10 px-2.5 py-1 rounded-full"
              >
                <UserPlus size={14} color="#2563EB" />
                <Text className="text-caption font-semibold text-primary ml-1">
                  Add Child
                </Text>
              </TouchableOpacity>
            </View>

            {linkedStudents.length === 0 ? (
              <View className="items-center py-4">
                <Text className="text-body text-ink-muted text-center mb-2">
                  No children linked yet.
                </Text>
                <Button
                  size="sm"
                  variant="primary"
                  onPress={() => setLinkChildModalVisible(true)}
                  icon={<UserPlus size={16} color="#FFFFFF" />}
                >
                  Link Child with Code
                </Button>
              </View>
            ) : (
              <View className="space-y-2">
                {linkedStudents.map((child: any) => {
                  const isSelected = (selectedChildId || linkedStudents[0]?.id) === child.id;
                  return (
                    <TouchableOpacity
                      key={child.id}
                      activeOpacity={0.7}
                      onPress={() => setSelectedChildId(child.id)}
                      className={`p-3 rounded-xl border flex-row items-center justify-between ${
                        isSelected
                          ? "bg-primary-soft/40 border-primary"
                          : "bg-surface-elevated/50 border-border"
                      }`}
                    >
                      <View className="flex-1 mr-2">
                        <Text className="text-body font-bold text-ink">
                          {child.fullName}
                        </Text>
                        <Text className="text-caption text-ink-muted">
                          {child.classLevel ? `Class ${child.classLevel}` : ""}
                          {child.board ? ` • ${child.board.toUpperCase()}` : ""}
                          {child.school ? ` • ${child.school}` : ""}
                        </Text>
                      </View>
                      {isSelected ? (
                        <View className="flex-row items-center bg-primary px-2.5 py-1 rounded-full">
                          <Check size={12} color="#FFFFFF" />
                          <Text className="text-caption text-white font-bold ml-1">
                            Active
                          </Text>
                        </View>
                      ) : (
                        <Text className="text-caption text-ink-muted font-medium">
                          Select
                        </Text>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        )}

        {/* 2. QUICK STATS ROW */}
        {role === "student" && (
          <View className="flex-row space-x-2.5 mb-4">
            {/* Stat 1: Attendance % */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => router.push("/(app)/attendance" as any)}
              className="flex-1 bg-surface rounded-2xl p-3.5 border border-border items-center justify-center shadow-xs"
            >
              <Calendar size={18} color="#059669" className="mb-1" />
              <Text className="text-h3 font-extrabold text-ink">
                {quickStats?.attendancePercentage !== null &&
                quickStats?.attendancePercentage !== undefined
                  ? `${quickStats.attendancePercentage}%`
                  : "--"}
              </Text>
              <Text className="text-caption text-ink-muted text-center mt-0.5">
                {t("attendanceStat")}
              </Text>
            </TouchableOpacity>

            {/* Stat 2: Tests Taken */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => router.push("/(app)/performance" as any)}
              className="flex-1 bg-surface rounded-2xl p-3.5 border border-border items-center justify-center shadow-xs ml-2"
            >
              <Award size={18} color="#2563EB" className="mb-1" />
              <Text className="text-h3 font-extrabold text-ink">
                {quickStats?.testsTaken ?? 0}
              </Text>
              <Text className="text-caption text-ink-muted text-center mt-0.5">
                {t("testsTakenStat")}
              </Text>
            </TouchableOpacity>

            {/* Stat 3: Lectures Completed */}
            <View className="flex-1 bg-surface rounded-2xl p-3.5 border border-border items-center justify-center shadow-xs ml-2">
              <Video size={18} color="#8B5CF6" className="mb-1" />
              <Text className="text-h3 font-extrabold text-ink">
                {quickStats?.lecturesCompleted ?? 0}
              </Text>
              <Text className="text-caption text-ink-muted text-center mt-0.5">
                {t("lecturesCompletedStat")}
              </Text>
            </View>
          </View>
        )}

        {/* 3. CORE ACADEMIC MODULES */}
        <View className="bg-surface rounded-2xl border border-border mb-4 shadow-sm divide-y divide-border/60">
          {role === "student" && (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => router.push("/(app)/performance" as any)}
              className="p-3.5 flex-row items-center justify-between"
            >
              <View className="flex-row items-center space-x-3 flex-1 mr-2">
                <View className="w-9 h-9 rounded-xl bg-blue-50 items-center justify-center">
                  <TrendingUp size={18} color="#2563EB" />
                </View>
                <View className="flex-1 ml-2.5">
                  <Text className="text-body font-bold text-ink">
                    {t("performanceRow")}
                  </Text>
                  <Text className="text-caption text-ink-muted">
                    {t("performanceDesc")}
                  </Text>
                </View>
              </View>
              <ChevronRight size={18} color="#9CA3AF" />
            </TouchableOpacity>
          )}

          {/* Attendance */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.push("/(app)/attendance" as any)}
            className="p-3.5 flex-row items-center justify-between"
          >
            <View className="flex-row items-center space-x-3 flex-1 mr-2">
              <View className="w-9 h-9 rounded-xl bg-emerald-50 items-center justify-center">
                <Calendar size={18} color="#059669" />
              </View>
              <View className="flex-1 ml-2.5">
                <Text className="text-body font-bold text-ink">
                  {t("attendanceRow")}
                </Text>
                <Text className="text-caption text-ink-muted">
                  {role === "parent" ? "View daily attendance record" : t("attendanceDesc")}
                </Text>
              </View>
            </View>
            <ChevronRight size={18} color="#9CA3AF" />
          </TouchableOpacity>

          {/* Tests & Scores (for parent) */}
          {role === "parent" && (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => router.push("/(app)/tests" as any)}
              className="p-3.5 flex-row items-center justify-between"
            >
              <View className="flex-row items-center space-x-3 flex-1 mr-2">
                <View className="w-9 h-9 rounded-xl bg-blue-50 items-center justify-center">
                  <Award size={18} color="#2563EB" />
                </View>
                <View className="flex-1 ml-2.5">
                  <Text className="text-body font-bold text-ink">
                    Tests & Performance
                  </Text>
                  <Text className="text-caption text-ink-muted">
                    Evaluated test marks & performance
                  </Text>
                </View>
              </View>
              <ChevronRight size={18} color="#9CA3AF" />
            </TouchableOpacity>
          )}

          {/* Fees & Receipts */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.push("/(app)/fees" as any)}
            className="p-3.5 flex-row items-center justify-between"
          >
            <View className="flex-row items-center space-x-3 flex-1 mr-2">
              <View className="w-9 h-9 rounded-xl bg-indigo-50 items-center justify-center">
                <CreditCard size={18} color="#4F46E5" />
              </View>
              <View className="flex-1 ml-2.5">
                <Text className="text-body font-bold text-ink">
                  {t("feesRow")}
                </Text>
                <Text className="text-caption text-ink-muted">
                  {t("feesDesc")}
                </Text>
              </View>
            </View>
            <ChevronRight size={18} color="#9CA3AF" />
          </TouchableOpacity>

          {/* Downloads (student only) */}
          {role === "student" && (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => router.push("/(app)/downloads" as any)}
              className="p-3.5 flex-row items-center justify-between"
            >
              <View className="flex-row items-center space-x-3 flex-1 mr-2">
                <View className="w-9 h-9 rounded-xl bg-amber-50 items-center justify-center">
                  <Download size={18} color="#D97706" />
                </View>
                <View className="flex-1 ml-2.5">
                  <Text className="text-body font-bold text-ink">
                    {t("downloadsRow")}
                  </Text>
                  <Text className="text-caption text-ink-muted">
                    {t("downloadsDesc")}
                  </Text>
                </View>
              </View>
              <ChevronRight size={18} color="#9CA3AF" />
            </TouchableOpacity>
          )}

          {/* Notifications */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.push("/(app)/notifications" as any)}
            className="p-3.5 flex-row items-center justify-between"
          >
            <View className="flex-row items-center space-x-3 flex-1 mr-2">
              <View className="w-9 h-9 rounded-xl bg-rose-50 items-center justify-center">
                <Bell size={18} color="#E11D48" />
              </View>
              <View className="flex-1 ml-2.5">
                <Text className="text-body font-bold text-ink">
                  {t("notificationsRow")}
                </Text>
                <Text className="text-caption text-ink-muted">
                  {t("notificationsDesc")}
                </Text>
              </View>
            </View>
            <ChevronRight size={18} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* 4. APP ENGAGEMENT & SETTINGS */}
        <View className="bg-surface rounded-2xl border border-border mb-4 shadow-sm divide-y divide-border/60">
          {/* Parent Access (Invite Code) for Student */}
          {role === "student" && (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setParentModalVisible(true)}
              className="p-3.5 flex-row items-center justify-between"
            >
              <View className="flex-row items-center space-x-3 flex-1 mr-2">
                <View className="w-9 h-9 rounded-xl bg-cyan-50 items-center justify-center">
                  <KeyRound size={18} color="#0891B2" />
                </View>
                <View className="flex-1 ml-2.5">
                  <Text className="text-body font-bold text-ink">
                    {t("parentAccessRow")}
                  </Text>
                  <Text className="text-caption text-ink-muted">
                    {t("parentAccessDesc")}
                  </Text>
                </View>
              </View>
              <ChevronRight size={18} color="#9CA3AF" />
            </TouchableOpacity>
          )}

          {/* Link Child with Code for Parent */}
          {role === "parent" && (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setLinkChildModalVisible(true)}
              className="p-3.5 flex-row items-center justify-between"
            >
              <View className="flex-row items-center space-x-3 flex-1 mr-2">
                <View className="w-9 h-9 rounded-xl bg-cyan-50 items-center justify-center">
                  <KeyRound size={18} color="#0891B2" />
                </View>
                <View className="flex-1 ml-2.5">
                  <Text className="text-body font-bold text-ink">
                    Link Student Account
                  </Text>
                  <Text className="text-caption text-ink-muted">
                    Enter student invite code to link child
                  </Text>
                </View>
              </View>
              <ChevronRight size={18} color="#9CA3AF" />
            </TouchableOpacity>
          )}

          {/* Settings */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.push("/(app)/settings" as any)}
            className="p-3.5 flex-row items-center justify-between"
          >
            <View className="flex-row items-center space-x-3 flex-1 mr-2">
              <View className="w-9 h-9 rounded-xl bg-slate-100 items-center justify-center">
                <Settings size={18} color="#475569" />
              </View>
              <View className="flex-1 ml-2.5">
                <Text className="text-body font-bold text-ink">
                  {t("settingsRow")}
                </Text>
                <Text className="text-caption text-ink-muted">
                  {t("settingsDesc")}
                </Text>
              </View>
            </View>
            <ChevronRight size={18} color="#9CA3AF" />
          </TouchableOpacity>

          {/* Help & Walkthrough */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.push("/(app)/help" as any)}
            className="p-3.5 flex-row items-center justify-between"
          >
            <View className="flex-row items-center space-x-3 flex-1 mr-2">
              <View className="w-9 h-9 rounded-xl bg-purple-50 items-center justify-center">
                <HelpCircle size={18} color="#9333EA" />
              </View>
              <View className="flex-1 ml-2.5">
                <Text className="text-body font-bold text-ink">
                  {t("helpRow")}
                </Text>
                <Text className="text-caption text-ink-muted">
                  {t("helpDesc")}
                </Text>
              </View>
            </View>
            <ChevronRight size={18} color="#9CA3AF" />
          </TouchableOpacity>

          {/* Results & Testimonials */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.push("/(app)/results" as any)}
            className="p-3.5 flex-row items-center justify-between"
          >
            <View className="flex-row items-center space-x-3 flex-1 mr-2">
              <View className="w-9 h-9 rounded-xl bg-amber-50 items-center justify-center">
                <Trophy size={18} color="#D97706" />
              </View>
              <View className="flex-1 ml-2.5">
                <Text className="text-body font-bold text-ink">
                  {t("resultsRow")}
                </Text>
                <Text className="text-caption text-ink-muted">
                  {t("resultsDesc")}
                </Text>
              </View>
            </View>
            <ChevronRight size={18} color="#9CA3AF" />
          </TouchableOpacity>

          {/* Share App */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleShareApp}
            className="p-3.5 flex-row items-center justify-between"
          >
            <View className="flex-row items-center space-x-3 flex-1 mr-2">
              <View className="w-9 h-9 rounded-xl bg-blue-50 items-center justify-center">
                <Share2 size={18} color="#2563EB" />
              </View>
              <View className="flex-1 ml-2.5">
                <Text className="text-body font-bold text-ink">
                  {t("shareAppRow")}
                </Text>
                <Text className="text-caption text-ink-muted">
                  {t("shareAppDesc")}
                </Text>
              </View>
            </View>
            <ChevronRight size={18} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* 5. LEGAL & LOGOUT */}
        <View className="bg-surface rounded-2xl border border-border mb-4 shadow-sm divide-y divide-border/60">
          {/* Privacy Policy */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleOpenPrivacyPolicy}
            className="p-3.5 flex-row items-center justify-between"
          >
            <View className="flex-row items-center space-x-2">
              <Shield size={16} color="#6B7280" />
              <Text className="text-body font-medium text-ink ml-2">
                {t("privacyPolicyRow")}
              </Text>
            </View>
            <ExternalLink size={16} color="#9CA3AF" />
          </TouchableOpacity>

          {/* Terms & Conditions */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleOpenTerms}
            className="p-3.5 flex-row items-center justify-between"
          >
            <View className="flex-row items-center space-x-2">
              <FileText size={16} color="#6B7280" />
              <Text className="text-body font-medium text-ink ml-2">
                {t("termsRow")}
              </Text>
            </View>
            <ExternalLink size={16} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* Sign Out Button */}
        <View className="mt-2">
          <Button
            variant="outline"
            size="lg"
            onPress={handleSignOut}
            loading={isSigningOut}
            className="border-danger/40 active:bg-danger/5"
            icon={<LogOut size={18} color="#DC2626" />}
          >
            <Text className="text-body font-semibold text-danger ml-2">
              {t("logOut")}
            </Text>
          </Button>
        </View>
      </ScrollView>

      {/* Parent Link Code Modal */}
      <Modal
        visible={parentModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setParentModalVisible(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-surface rounded-t-3xl p-6 border-t border-border space-y-4">
            <View className="flex-row justify-between items-center mb-1">
              <View className="flex-row items-center">
                <KeyRound size={20} color="#2563EB" />
                <Text className="text-h2 font-bold text-ink ml-2">
                  Parent Link Code
                </Text>
              </View>
              <TouchableOpacity onPress={() => setParentModalVisible(false)}>
                <Text className="text-body font-semibold text-primary">Done</Text>
              </TouchableOpacity>
            </View>

            <Text className="text-caption text-ink-muted leading-relaxed">
              Share this 6-character code with your parents so they can link to your account and track your attendance and test scores.
            </Text>

            {isInviteLoading ? (
              <ActivityIndicator size="small" color="#2563EB" className="py-4" />
            ) : inviteCodeData?.code ? (
              <View className="flex-row items-center justify-between bg-primary-soft/50 p-4 rounded-xl border border-primary/20">
                <Text className="text-h1 font-mono font-bold text-primary tracking-widest">
                  {inviteCodeData.code}
                </Text>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={handleShareInviteCode}
                  className="bg-primary py-2.5 px-4 rounded-xl flex-row items-center"
                >
                  <Share2 size={16} color="#FFFFFF" />
                  <Text className="text-small font-semibold text-white ml-1.5">
                    Share
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <Button
                variant="outline"
                size="md"
                onPress={() => generateCodeMutation.mutate()}
                loading={generateCodeMutation.isPending}
              >
                Generate Code
              </Button>
            )}

            <TouchableOpacity
              onPress={() => generateCodeMutation.mutate()}
              disabled={generateCodeMutation.isPending}
              className="py-1 items-center"
            >
              <Text className="text-caption text-primary font-semibold">
                {generateCodeMutation.isPending ? "Generating..." : "Generate New Code"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Parent Link Child Modal */}
      <Modal
        visible={linkChildModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setLinkChildModalVisible(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-surface rounded-t-3xl p-6 border-t border-border space-y-4">
            <View className="flex-row justify-between items-center mb-1">
              <View className="flex-row items-center">
                <UserPlus size={20} color="#2563EB" />
                <Text className="text-h2 font-bold text-ink ml-2">
                  Link Student Account
                </Text>
              </View>
              <TouchableOpacity onPress={() => setLinkChildModalVisible(false)}>
                <Text className="text-body font-semibold text-ink-muted">Cancel</Text>
              </TouchableOpacity>
            </View>

            <Text className="text-caption text-ink-muted leading-relaxed">
              Enter the 6-character invite code from your child's Quick2Learn app (found under Profile → Parent Access).
            </Text>

            <View className="bg-surface-elevated rounded-xl p-3 border border-border">
              <TextInput
                value={claimCodeInput}
                onChangeText={(text) => {
                  setClaimCodeInput(text.toUpperCase());
                  setClaimError("");
                }}
                placeholder="e.g. A1B2C3"
                placeholderTextColor="#9CA3AF"
                autoCapitalize="characters"
                maxLength={8}
                className="text-h2 font-mono font-bold text-ink text-center tracking-widest py-2"
              />
            </View>

            {claimError ? (
              <Text className="text-caption text-danger text-center">
                {claimError}
              </Text>
            ) : null}

            <Button
              variant="primary"
              size="lg"
              onPress={handleClaimCode}
              loading={claimCodeMutation.isPending}
            >
              Link Account
            </Button>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}
