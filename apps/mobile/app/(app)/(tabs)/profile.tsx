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
  Image,
  Linking,
  Platform,
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
import { useConfirmDialog } from "../../../src/components/ui/ConfirmModal";
import { KeyboardAwareView } from "../../../src/components/ui/KeyboardAwareView";
import { colors, radii } from "@quick2learn/shared";
import {
  useMe,
  useStudentQuickStats,
  useStudentInviteCode,
  useGenerateStudentInviteCode,
  useParentStudents,
  useClaimInviteCode,
  DEMO_MODE_STORAGE_KEY,
  ACTIVE_USER_STORAGE_KEY,
  queryKeys,
} from "../../../src/api/hooks";
import {
  clearDeviceActiveSession,
  DEVICE_ACTIVE_ROLE_KEY,
} from "../../../src/lib/deviceSession";
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
  const studentInviteCodeValue =
    inviteCodeData?.code ||
    (profile as any)?.inviteCode ||
    (me as any)?.inviteCode ||
    "Q2L100";

  const handleShareInviteCode = async () => {
    try {
      await Share.share({
        title: "Quick2Learn Parent Link Code",
        message: `Hi Parent! Use this invite code [${studentInviteCodeValue}] in the Quick2Learn app to link with my student account and track my progress. Download app: https://play.google.com/store/apps/details?id=in.quick2learn.app`,
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

  const handleOpenGladStudio = async () => {
    try {
      await WebBrowser.openBrowserAsync("https://gladstudio.net");
    } catch {
      try {
        await Linking.openURL("https://gladstudio.net");
      } catch {
        Alert.alert("Notice", "Visit https://gladstudio.net to learn more about GLAD Studio.");
      }
    }
  };

  const { confirm } = useConfirmDialog();

  const handleSignOut = () => {
    confirm({
      title: t("logOut"),
      message: t("logOutConfirm"),
      confirmText: t("logOut"),
      cancelText: t("cancel"),
      type: "danger",
      onConfirm: async () => {
        try {
          setIsSigningOut(true);

          // 1. Fire-and-forget server sign-out in background without blocking UI transition
          authClient.signOut().catch(() => {});

          // 2. Clear all local session tokens, release child codes, and clear device role
          await Promise.allSettled([
            clearDeviceActiveSession(me?.user?.id),
            SecureStore.deleteItemAsync(DEVICE_ACTIVE_ROLE_KEY),
            SecureStore.deleteItemAsync(DEMO_MODE_STORAGE_KEY),
            SecureStore.deleteItemAsync(ACTIVE_USER_STORAGE_KEY),
            SecureStore.deleteItemAsync("q2l_active_user"),
            SecureStore.deleteItemAsync("q2l_session_token"),
            SecureStore.deleteItemAsync("q2l_session_data"),
            SecureStore.deleteItemAsync("q2l_token"),
            SecureStore.deleteItemAsync("q2l_cookie"),
          ]);

          // 3. Reset query cache and immediately redirect to welcome screen
          queryClient.setQueryData(queryKeys.me, null);
          queryClient.clear();
          router.replace("/(auth)/welcome" as any);
        } catch {
          queryClient.setQueryData(queryKeys.me, null);
          queryClient.clear();
          router.replace("/(auth)/welcome" as any);
        } finally {
          setIsSigningOut(false);
        }
      },
    });
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
        style={{ flex: 1 }}
        className="flex-1"
        contentContainerStyle={{ padding: 12, paddingBottom: 48 }}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. USER PROFILE CARD */}
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: 22,
            paddingVertical: 18,
            paddingHorizontal: 16,
            borderWidth: 1,
            borderColor: colors.border,
            marginBottom: 12,
            alignItems: 'center',
            shadowColor: '#0F172A',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 6,
            elevation: 2,
          }}
          className="bg-surface rounded-2xl p-4 border border-border mb-3 items-center shadow-xs"
        >
          {/* Avatar with accent ring */}
          <View
            style={{
              padding: 4,
              borderRadius: 36,
              backgroundColor: '#EFF6FF',
              borderWidth: 1.5,
              borderColor: '#BFDBFE',
              marginBottom: 10,
            }}
          >
            <Avatar name={fullName} size="xl" />
          </View>

          <Text
            style={{
              fontSize: 18,
              fontWeight: '800',
              color: colors.ink,
              textAlign: 'center',
              marginBottom: 6,
            }}
            className="text-h3 font-bold text-ink text-center mb-1.5"
          >
            {fullName}
          </Text>

          {/* Badges */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              flexWrap: 'wrap',
              justifyContent: 'center',
              gap: 6,
              marginBottom: profile?.school ? 8 : 12,
            }}
            className="flex-row items-center flex-wrap justify-center space-x-1.5 mb-2"
          >
            <View
              style={{
                backgroundColor: colors.primary,
                paddingHorizontal: 10,
                paddingVertical: 3,
                borderRadius: 12,
              }}
            >
              <Text style={{ fontSize: 10.5, fontWeight: '800', color: '#FFFFFF', letterSpacing: 0.5 }}>
                {role.toUpperCase()}
              </Text>
            </View>

            {role === "student" && profile?.classLevel ? (
              <View
                style={{
                  backgroundColor: '#F1F5F9',
                  borderWidth: 1,
                  borderColor: '#E2E8F0',
                  paddingHorizontal: 10,
                  paddingVertical: 3,
                  borderRadius: 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <GraduationCap size={12} color="#475569" />
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#334155' }}>
                  Class {profile.classLevel}{profile.board ? ` • ${profile.board.toUpperCase()}` : ''}
                </Text>
              </View>
            ) : null}

            {role === "parent" ? (
              <View
                style={{
                  backgroundColor: '#F1F5F9',
                  borderWidth: 1,
                  borderColor: '#E2E8F0',
                  paddingHorizontal: 10,
                  paddingVertical: 3,
                  borderRadius: 12,
                }}
              >
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#334155' }}>
                  {linkedStudents.length} {linkedStudents.length === 1 ? "Child" : "Children"}
                </Text>
              </View>
            ) : null}
          </View>

          {profile?.school ? (
            <Text
              style={{
                fontSize: 12,
                color: colors['ink-muted'],
                textAlign: 'center',
                marginBottom: 12,
                fontWeight: '500',
              }}
              className="text-caption text-ink-muted text-center mb-3"
            >
              {profile.school}
            </Text>
          ) : null}

          {/* Edit Profile Action Button */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.push("/(app)/profile/edit" as any)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              backgroundColor: '#EFF6FF',
              paddingVertical: 6,
              paddingHorizontal: 16,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: '#BFDBFE',
            }}
            className="flex-row items-center bg-blue-50 py-1.5 px-4 rounded-full border border-blue-200"
          >
            <Edit3 size={13} color={colors.primary} />
            <Text
              style={{
                fontSize: 12,
                fontWeight: '700',
                color: colors.primary,
              }}
              className="text-caption font-bold text-primary ml-1.5"
            >
              {t("editProfileRow")}
            </Text>
          </TouchableOpacity>
        </View>

        {/* STUDENT'S PARENT INVITE CODE CARD */}
        {role === "student" && (
          <View
            style={{
              backgroundColor: '#F5F3FF',
              borderRadius: 20,
              padding: 16,
              borderWidth: 1.5,
              borderColor: '#DDD6FE',
              marginBottom: 14,
              shadowColor: '#7C3AED',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 6,
              elevation: 2,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 10,
                    backgroundColor: '#EDE9FE',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <KeyRound size={17} color="#7C3AED" />
                </View>
                <View>
                  <Text style={{ fontSize: 13.5, fontWeight: '800', color: '#4C1D95' }}>
                    Parent Invite Code
                  </Text>
                  <Text style={{ fontSize: 11, color: '#6B7280' }}>
                    Share with your parents to link accounts
                  </Text>
                </View>
              </View>
            </View>

            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: '#FFFFFF',
                borderRadius: 14,
                paddingVertical: 10,
                paddingHorizontal: 14,
                borderWidth: 1,
                borderColor: '#E9D5FF',
              }}
            >
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: '800',
                  fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
                  color: '#6D28D9',
                  letterSpacing: 3,
                }}
              >
                {studentInviteCodeValue}
              </Text>

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={handleShareInviteCode}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: '#7C3AED',
                  paddingHorizontal: 12,
                  paddingVertical: 6.5,
                  borderRadius: 10,
                }}
              >
                <Share2 size={13} color="#FFFFFF" />
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#FFFFFF', marginLeft: 4 }}>
                  Share Code
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

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
                  const childKey = child.userId || child.id;
                  const isSelected =
                    selectedChildId === child.userId ||
                    selectedChildId === child.id ||
                    (!selectedChildId && childKey === (linkedStudents[0]?.userId || linkedStudents[0]?.id));
                  return (
                    <TouchableOpacity
                      key={childKey}
                      activeOpacity={0.7}
                      onPress={() => setSelectedChildId(childKey)}
                      className={`p-3.5 rounded-xl border flex-row items-center justify-between ${
                        isSelected
                          ? "bg-primary-soft/40 border-primary"
                          : "bg-surface-elevated/50 border-border"
                      }`}
                    >
                      <View className="flex-row items-center gap-2.5 flex-1 mr-2">
                        <View className="w-9 h-9 rounded-full bg-primary/10 items-center justify-center">
                          <User size={18} color="#2563EB" />
                        </View>
                        <View className="flex-1">
                          <Text className="text-body font-bold text-ink">
                            {child.fullName}
                          </Text>
                          <Text className="text-caption text-ink-muted mt-0.5">
                            {child.classLevel ? `Class ${child.classLevel}` : "Secondary"}
                            {child.board ? ` • ${child.board.toUpperCase()}` : " • CBSE"}
                            {child.school ? ` • ${child.school}` : " • Quick2Learn Center"}
                          </Text>
                        </View>
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
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
            {/* Stat 1: Attendance % */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => router.push("/(app)/attendance" as any)}
              style={{
                flex: 1,
                backgroundColor: '#F0FDF4',
                borderRadius: 18,
                paddingVertical: 12,
                paddingHorizontal: 8,
                borderWidth: 1,
                borderColor: '#BBF7D0',
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: '#059669',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 3,
                elevation: 1,
              }}
            >
              <View
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 15,
                  backgroundColor: '#DCFCE7',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 6,
                }}
              >
                <Calendar size={16} color="#059669" />
              </View>
              <Text
                style={{
                  fontSize: 17,
                  fontWeight: '800',
                  color: '#14532D',
                  marginBottom: 2,
                }}
              >
                {quickStats?.attendancePercentage !== null &&
                quickStats?.attendancePercentage !== undefined
                  ? `${quickStats.attendancePercentage}%`
                  : "--"}
              </Text>
              <Text
                style={{
                  fontSize: 10.5,
                  fontWeight: '700',
                  color: '#16A34A',
                  textAlign: 'center',
                }}
              >
                {t("attendanceStat")}
              </Text>
            </TouchableOpacity>

            {/* Stat 2: Tests Taken */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => router.push("/(app)/performance" as any)}
              style={{
                flex: 1,
                backgroundColor: '#EFF6FF',
                borderRadius: 18,
                paddingVertical: 12,
                paddingHorizontal: 8,
                borderWidth: 1,
                borderColor: '#BFDBFE',
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: '#2563EB',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 3,
                elevation: 1,
              }}
            >
              <View
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 15,
                  backgroundColor: '#DBEAFE',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 6,
                }}
              >
                <Award size={16} color="#2563EB" />
              </View>
              <Text
                style={{
                  fontSize: 17,
                  fontWeight: '800',
                  color: '#1E3A8A',
                  marginBottom: 2,
                }}
              >
                {quickStats?.testsTaken ?? 0}
              </Text>
              <Text
                style={{
                  fontSize: 10.5,
                  fontWeight: '700',
                  color: '#2563EB',
                  textAlign: 'center',
                }}
              >
                {t("testsTakenStat")}
              </Text>
            </TouchableOpacity>

            {/* Stat 3: Lectures Completed */}
            <View
              style={{
                flex: 1,
                backgroundColor: '#FAF5FF',
                borderRadius: 18,
                paddingVertical: 12,
                paddingHorizontal: 8,
                borderWidth: 1,
                borderColor: '#E9D5FF',
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: '#7C3AED',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 3,
                elevation: 1,
              }}
            >
              <View
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 15,
                  backgroundColor: '#F3E8FF',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 6,
                }}
              >
                <Video size={16} color="#7C3AED" />
              </View>
              <Text
                style={{
                  fontSize: 17,
                  fontWeight: '800',
                  color: '#4C1D95',
                  marginBottom: 2,
                }}
              >
                {quickStats?.lecturesCompleted ?? 0}
              </Text>
              <Text
                style={{
                  fontSize: 10.5,
                  fontWeight: '700',
                  color: '#7C3AED',
                  textAlign: 'center',
                }}
              >
                {t("lecturesCompletedStat")}
              </Text>
            </View>
          </View>
        )}

        {/* 3. CORE ACADEMIC MODULES */}
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: 20,
            borderWidth: 1,
            borderColor: colors.border,
            marginBottom: 12,
            shadowColor: '#0F172A',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.04,
            shadowRadius: 6,
            elevation: 2,
            overflow: 'hidden',
          }}
        >
          {role === "student" && (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => router.push("/(app)/performance" as any)}
              style={{
                paddingVertical: 12,
                paddingHorizontal: 14,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottomWidth: 1,
                borderBottomColor: 'rgba(226, 232, 240, 0.7)',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 }}>
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 12,
                    backgroundColor: '#EFF6FF',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <TrendingUp size={18} color="#2563EB" />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={{ fontSize: 14.5, fontWeight: '700', color: colors.ink }}>
                    {t("performanceRow")}
                  </Text>
                  <Text style={{ fontSize: 11.5, color: colors['ink-muted'], marginTop: 1 }}>
                    {t("performanceDesc")}
                  </Text>
                </View>
              </View>
              <ChevronRight size={17} color="#94A3B8" />
            </TouchableOpacity>
          )}

          {/* Attendance */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.push("/(app)/attendance" as any)}
            style={{
              paddingVertical: 12,
              paddingHorizontal: 14,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottomWidth: 1,
              borderBottomColor: 'rgba(226, 232, 240, 0.7)',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 }}>
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 12,
                  backgroundColor: '#ECFDF5',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Calendar size={18} color="#059669" />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={{ fontSize: 14.5, fontWeight: '700', color: colors.ink }}>
                  {t("attendanceRow")}
                </Text>
                <Text style={{ fontSize: 11.5, color: colors['ink-muted'], marginTop: 1 }}>
                  {role === "parent" ? "View daily attendance record" : t("attendanceDesc")}
                </Text>
              </View>
            </View>
            <ChevronRight size={17} color="#94A3B8" />
          </TouchableOpacity>

          {/* Tests & Scores (for parent) */}
          {role === "parent" && (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => router.push("/(app)/tests" as any)}
              style={{
                paddingVertical: 12,
                paddingHorizontal: 14,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottomWidth: 1,
                borderBottomColor: 'rgba(226, 232, 240, 0.7)',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 }}>
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 12,
                    backgroundColor: '#EFF6FF',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Award size={18} color="#2563EB" />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={{ fontSize: 14.5, fontWeight: '700', color: colors.ink }}>
                    Tests & Performance
                  </Text>
                  <Text style={{ fontSize: 11.5, color: colors['ink-muted'], marginTop: 1 }}>
                    Evaluated test marks & performance
                  </Text>
                </View>
              </View>
              <ChevronRight size={17} color="#94A3B8" />
            </TouchableOpacity>
          )}

          {/* Fees & Receipts */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.push("/(app)/fees" as any)}
            style={{
              paddingVertical: 12,
              paddingHorizontal: 14,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottomWidth: 1,
              borderBottomColor: 'rgba(226, 232, 240, 0.7)',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 }}>
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 12,
                  backgroundColor: '#EEF2FF',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <CreditCard size={18} color="#4F46E5" />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={{ fontSize: 14.5, fontWeight: '700', color: colors.ink }}>
                  {t("feesRow")}
                </Text>
                <Text style={{ fontSize: 11.5, color: colors['ink-muted'], marginTop: 1 }}>
                  {t("feesDesc")}
                </Text>
              </View>
            </View>
            <ChevronRight size={17} color="#94A3B8" />
          </TouchableOpacity>

          {/* Downloads (student only) */}
          {role === "student" && (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => router.push("/(app)/downloads" as any)}
              style={{
                paddingVertical: 12,
                paddingHorizontal: 14,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottomWidth: 1,
                borderBottomColor: 'rgba(226, 232, 240, 0.7)',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 }}>
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 12,
                    backgroundColor: '#FFFBEB',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Download size={18} color="#D97706" />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={{ fontSize: 14.5, fontWeight: '700', color: colors.ink }}>
                    {t("downloadsRow")}
                  </Text>
                  <Text style={{ fontSize: 11.5, color: colors['ink-muted'], marginTop: 1 }}>
                    {t("downloadsDesc")}
                  </Text>
                </View>
              </View>
              <ChevronRight size={17} color="#94A3B8" />
            </TouchableOpacity>
          )}

          {/* Notifications */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.push("/(app)/notifications" as any)}
            style={{
              paddingVertical: 12,
              paddingHorizontal: 14,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 }}>
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 12,
                  backgroundColor: '#FFF1F2',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Bell size={18} color="#E11D48" />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={{ fontSize: 14.5, fontWeight: '700', color: colors.ink }}>
                  {t("notificationsRow")}
                </Text>
                <Text style={{ fontSize: 11.5, color: colors['ink-muted'], marginTop: 1 }}>
                  {t("notificationsDesc")}
                </Text>
              </View>
            </View>
            <ChevronRight size={17} color="#94A3B8" />
          </TouchableOpacity>
        </View>

        {/* 4. APP ENGAGEMENT & SETTINGS */}
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: 20,
            borderWidth: 1,
            borderColor: colors.border,
            marginBottom: 12,
            shadowColor: '#0F172A',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.04,
            shadowRadius: 6,
            elevation: 2,
            overflow: 'hidden',
          }}
        >
          {/* Parent Access (Invite Code) for Student */}
          {role === "student" && (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setParentModalVisible(true)}
              style={{
                paddingVertical: 12,
                paddingHorizontal: 14,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottomWidth: 1,
                borderBottomColor: 'rgba(226, 232, 240, 0.7)',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 }}>
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 12,
                    backgroundColor: '#ECFEFF',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <KeyRound size={18} color="#0891B2" />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={{ fontSize: 14.5, fontWeight: '700', color: colors.ink }}>
                    {t("parentAccessRow")}
                  </Text>
                  <Text style={{ fontSize: 11.5, color: colors['ink-muted'], marginTop: 1 }}>
                    {t("parentAccessDesc")}
                  </Text>
                </View>
              </View>
              <ChevronRight size={17} color="#94A3B8" />
            </TouchableOpacity>
          )}

          {/* Link Child with Code for Parent */}
          {role === "parent" && (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setLinkChildModalVisible(true)}
              style={{
                paddingVertical: 12,
                paddingHorizontal: 14,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottomWidth: 1,
                borderBottomColor: 'rgba(226, 232, 240, 0.7)',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 }}>
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 12,
                    backgroundColor: '#ECFEFF',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <KeyRound size={18} color="#0891B2" />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={{ fontSize: 14.5, fontWeight: '700', color: colors.ink }}>
                    Link Student Account
                  </Text>
                  <Text style={{ fontSize: 11.5, color: colors['ink-muted'], marginTop: 1 }}>
                    Enter student invite code to link child
                  </Text>
                </View>
              </View>
              <ChevronRight size={17} color="#94A3B8" />
            </TouchableOpacity>
          )}

          {/* Settings */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.push("/(app)/settings" as any)}
            style={{
              paddingVertical: 12,
              paddingHorizontal: 14,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottomWidth: 1,
              borderBottomColor: 'rgba(226, 232, 240, 0.7)',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 }}>
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 12,
                  backgroundColor: '#F1F5F9',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Settings size={18} color="#475569" />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={{ fontSize: 14.5, fontWeight: '700', color: colors.ink }}>
                  {t("settingsRow")}
                </Text>
                <Text style={{ fontSize: 11.5, color: colors['ink-muted'], marginTop: 1 }}>
                  {t("settingsDesc")}
                </Text>
              </View>
            </View>
            <ChevronRight size={17} color="#94A3B8" />
          </TouchableOpacity>

          {/* Help & Walkthrough */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.push("/(app)/help" as any)}
            style={{
              paddingVertical: 12,
              paddingHorizontal: 14,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottomWidth: 1,
              borderBottomColor: 'rgba(226, 232, 240, 0.7)',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 }}>
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 12,
                  backgroundColor: '#FAF5FF',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <HelpCircle size={18} color="#9333EA" />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={{ fontSize: 14.5, fontWeight: '700', color: colors.ink }}>
                  {t("helpRow")}
                </Text>
                <Text style={{ fontSize: 11.5, color: colors['ink-muted'], marginTop: 1 }}>
                  {t("helpDesc")}
                </Text>
              </View>
            </View>
            <ChevronRight size={17} color="#94A3B8" />
          </TouchableOpacity>

          {/* Results & Testimonials */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.push("/(app)/results" as any)}
            style={{
              paddingVertical: 12,
              paddingHorizontal: 14,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottomWidth: 1,
              borderBottomColor: 'rgba(226, 232, 240, 0.7)',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 }}>
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 12,
                  backgroundColor: '#FFFBEB',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Trophy size={18} color="#D97706" />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={{ fontSize: 14.5, fontWeight: '700', color: colors.ink }}>
                  {t("resultsRow")}
                </Text>
                <Text style={{ fontSize: 11.5, color: colors['ink-muted'], marginTop: 1 }}>
                  {t("resultsDesc")}
                </Text>
              </View>
            </View>
            <ChevronRight size={17} color="#94A3B8" />
          </TouchableOpacity>

          {/* Share App */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleShareApp}
            style={{
              paddingVertical: 12,
              paddingHorizontal: 14,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 }}>
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 12,
                  backgroundColor: '#EFF6FF',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Share2 size={18} color={colors.primary} />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={{ fontSize: 14.5, fontWeight: '700', color: colors.ink }}>
                  {t("shareAppRow")}
                </Text>
                <Text style={{ fontSize: 11.5, color: colors['ink-muted'], marginTop: 1 }}>
                  {t("shareAppDesc")}
                </Text>
              </View>
            </View>
            <ChevronRight size={17} color="#94A3B8" />
          </TouchableOpacity>
        </View>

        {/* 5. LEGAL & LOGOUT */}
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: 20,
            borderWidth: 1,
            borderColor: colors.border,
            marginBottom: 12,
            shadowColor: '#0F172A',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.04,
            shadowRadius: 6,
            elevation: 2,
            overflow: 'hidden',
          }}
        >
          {/* Privacy Policy */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleOpenPrivacyPolicy}
            style={{
              paddingVertical: 12,
              paddingHorizontal: 14,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottomWidth: 1,
              borderBottomColor: 'rgba(226, 232, 240, 0.7)',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Shield size={16} color="#64748B" />
              <Text style={{ fontSize: 13.5, fontWeight: '600', color: colors.ink, marginLeft: 10 }}>
                {t("privacyPolicyRow")}
              </Text>
            </View>
            <ExternalLink size={15} color="#94A3B8" />
          </TouchableOpacity>

          {/* Terms & Conditions */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleOpenTerms}
            style={{
              paddingVertical: 12,
              paddingHorizontal: 14,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <FileText size={16} color="#64748B" />
              <Text style={{ fontSize: 13.5, fontWeight: '600', color: colors.ink, marginLeft: 10 }}>
                {t("termsRow")}
              </Text>
            </View>
            <ExternalLink size={15} color="#94A3B8" />
          </TouchableOpacity>
        </View>

        {/* Sign Out Button */}
        <View className="mt-1">
          <Button
            variant="outline"
            size="md"
            onPress={handleSignOut}
            loading={isSigningOut}
            className="border-danger/40 active:bg-danger/5"
            icon={<LogOut size={16} color="#DC2626" />}
          >
            <Text className="text-caption font-semibold text-danger ml-2">
              {t("logOut")}
            </Text>
          </Button>
        </View>

        {/* Developed by GLAD Studio Tag */}
        <View style={{ alignItems: 'center', marginTop: 18, marginBottom: 6 }}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleOpenGladStudio}
            accessibilityRole="link"
            accessibilityLabel="Developed by GLAD Studio. Opens gladstudio.net"
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: 6,
              paddingHorizontal: 8,
            }}
          >
            <Text
              style={{
                fontSize: 11.5,
                fontWeight: '600',
                color: colors['ink-muted'],
                marginRight: 7,
                letterSpacing: 0.2,
              }}
            >
              Developed by
            </Text>
            <Image
              source={require('../../../assets/website logo(white background compatible).png')}
              style={{ width: 78, height: 21.6 }}
              resizeMode="contain"
            />
          </TouchableOpacity>
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
          <KeyboardAwareView style={{ width: '100%' }}>
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
          </KeyboardAwareView>
        </View>
      </Modal>
    </Screen>
  );
}
