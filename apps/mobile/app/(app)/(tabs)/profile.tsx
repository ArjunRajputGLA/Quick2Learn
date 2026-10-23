import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Share,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  Image,
  Linking,
  Platform,
  Keyboard,
  KeyboardAvoidingView,
  Animated,
} from "react-native";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
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
  X,
  AlertCircle,
  School,
  ShieldCheck,
  Briefcase,
  BookOpen,
} from "lucide-react-native";
import { Screen } from "../../../src/components/ui/Screen";
import { AppHeader } from "../../../src/components/ui/AppHeader";
import { Button } from "../../../src/components/ui/Button";
import { Card } from "../../../src/components/ui/Card";
import { Avatar } from "../../../src/components/ui/Avatar";
import { Badge } from "../../../src/components/ui/Badge";
import { useConfirmDialog } from "../../../src/components/ui/ConfirmModal";
import { KeyboardAwareView } from "../../../src/components/ui/KeyboardAwareView";
import { LegalDocumentModal } from "../../../src/components/ui/LegalDocumentModal";
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
import {
  saveLastKnownStudentProfile,
  registerStudentInviteCode,
  sanitizeLinkedStudents,
} from "../../../src/lib/studentInviteDirectory";
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
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await Promise.all([
        queryClient.refetchQueries({ type: 'active' }),
        new Promise((resolve) => setTimeout(resolve, 350)),
      ]);
    } catch (err) {
      console.warn('[Profile] Refresh error:', err);
    } finally {
      setIsRefreshing(false);
    }
  };
  const [parentModalVisible, setParentModalVisible] = useState(false);
  const [linkChildModalVisible, setLinkChildModalVisible] = useState(false);
  const [claimCodeInput, setClaimCodeInput] = useState("");
  const [claimError, setClaimError] = useState("");
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const keyboardHeightAnim = useRef(new Animated.Value(0)).current;

  // Edit Child Details state
  const [editingChild, setEditingChild] = useState<any | null>(null);
  const [editChildName, setEditChildName] = useState("");
  const [editChildClass, setEditChildClass] = useState<number>(10);
  const [editChildBoard, setEditChildBoard] = useState<string>("cbse");
  const [editChildSchool, setEditChildSchool] = useState("");
  const [editChildError, setEditChildError] = useState("");
  const [isSavingChild, setIsSavingChild] = useState(false);
  const [legalModalType, setLegalModalType] = useState<"privacy" | "terms" | null>(null);

  const insets = useSafeAreaInsets();
  const claimInputRef = useRef<any>(null);

  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showSub = Keyboard.addListener(showEvent, (e) => {
      const height = e?.endCoordinates?.height || 0;
      setIsKeyboardOpen(true);
      setKeyboardHeight(height);
      Animated.timing(keyboardHeightAnim, {
        toValue: height,
        duration: Platform.OS === "ios" ? (e.duration || 250) : 160,
        useNativeDriver: false,
      }).start();
    });

    const hideSub = Keyboard.addListener(hideEvent, (e) => {
      setIsKeyboardOpen(false);
      setKeyboardHeight(0);
      Animated.timing(keyboardHeightAnim, {
        toValue: 0,
        duration: Platform.OS === "ios" ? (e.duration || 200) : 140,
        useNativeDriver: false,
      }).start();
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [keyboardHeightAnim]);

  useEffect(() => {
    if (linkChildModalVisible) {
      const timer = setTimeout(() => {
        claimInputRef.current?.focus();
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [linkChildModalVisible]);

  const { selectedChildId, setSelectedChildId } = useParentStore();
  const claimCodeMutation = useClaimInviteCode();

  const rawLinked = parentStudentsData?.students || me?.linkedStudents || [];
  const linkedStudents = sanitizeLinkedStudents(rawLinked);

  const user = me?.user;
  const profile = me?.profile;
  const role = me?.role || "student";
  const isAdmin = role === "admin";
  const isTeacher = role === "teacher";
  const isStaff = isAdmin || isTeacher;
  const fullName = profile?.fullName || user?.name || (isAdmin ? "Dinesh Sir (Administrator)" : "Student");
  const studentInviteCodeValue =
    inviteCodeData?.code ||
    (profile as any)?.inviteCode ||
    (me as any)?.inviteCode ||
    "Q2L100";

  // Automatically register and persist actual student details for parent syncing
  useEffect(() => {
    if (role === "student" && fullName) {
      saveLastKnownStudentProfile({
        id: profile?.id || user?.id || "student-1",
        userId: user?.id || profile?.userId || "student-1",
        fullName,
        classLevel: profile?.classLevel || 10,
        board: (profile?.board || "cbse") as "cbse" | "icse",
        school: profile?.school || "Quick2Learn High School",
        inviteCode: studentInviteCodeValue,
      });
      if (studentInviteCodeValue) {
        registerStudentInviteCode(studentInviteCodeValue, {
          id: profile?.id || user?.id || "student-1",
          userId: user?.id || profile?.userId || "student-1",
          fullName,
          classLevel: profile?.classLevel || 10,
          board: (profile?.board || "cbse") as "cbse" | "icse",
          school: profile?.school || "Quick2Learn High School",
        });
      }
    }
  }, [role, fullName, studentInviteCodeValue, profile, user]);

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

  const handleOpenPrivacyPolicy = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLegalModalType("privacy");
  };

  const handleOpenTerms = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLegalModalType("terms");
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

  const handleSignOut = () => {
    setLogoutModalVisible(true);
  };

  const handleConfirmSignOut = async () => {
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

      setLogoutModalVisible(false);

      // 3. Reset query cache and immediately redirect to welcome screen
      queryClient.setQueryData(queryKeys.me, null);
      queryClient.clear();
      router.replace("/(auth)/welcome" as any);
    } catch {
      setLogoutModalVisible(false);
      queryClient.setQueryData(queryKeys.me, null);
      queryClient.clear();
      router.replace("/(auth)/welcome" as any);
    } finally {
      setIsSigningOut(false);
    }
  };

  const closeLinkChildModal = () => {
    Keyboard.dismiss();
    setClaimCodeInput("");
    setClaimError("");
    setIsKeyboardOpen(false);
    setKeyboardHeight(0);
    keyboardHeightAnim.setValue(0);
    setLinkChildModalVisible(false);
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
          closeLinkChildModal();
          queryClient.invalidateQueries({ queryKey: queryKeys.me });
          queryClient.invalidateQueries({ queryKey: queryKeys.parentStudents });
          queryClient.invalidateQueries({ queryKey: ["tests"] });
          queryClient.invalidateQueries({ queryKey: ["attendance"] });
          if (data?.student?.userId || data?.student?.id) {
            setSelectedChildId(data.student.userId || data.student.id);
          }
          setTimeout(() => {
            Alert.alert("Success", "Student account linked successfully!");
          }, 150);
        },
        onError: (err: any) => {
          setClaimError(err?.message || "Invalid or expired invite code");
        },
      }
    );
  };

  const openEditChildModal = (child: any) => {
    setEditingChild(child);
    setEditChildName(child.fullName || "");
    setEditChildClass(child.classLevel || 10);
    setEditChildBoard(child.board || "icse");
    setEditChildSchool(child.school || "Sacred Heart School");
    setEditChildError("");
  };

  const closeEditChildModal = () => {
    Keyboard.dismiss();
    setEditingChild(null);
    setEditChildName("");
    setEditChildError("");
  };

  const handleSaveChildDetails = async () => {
    if (!editChildName.trim() || editChildName.trim().length < 2) {
      setEditChildError("Student name must be at least 2 characters.");
      return;
    }
    setIsSavingChild(true);
    setEditChildError("");
    try {
      const activeUserJson = await SecureStore.getItemAsync(ACTIVE_USER_STORAGE_KEY).catch(() => null);
      if (activeUserJson) {
        const parsed = JSON.parse(activeUserJson);
        if (Array.isArray(parsed.linkedStudents)) {
          const targetKey = editingChild.userId || editingChild.id;
          parsed.linkedStudents = parsed.linkedStudents.map((c: any) => {
            const cKey = c.userId || c.id;
            if (cKey === targetKey) {
              return {
                ...c,
                fullName: editChildName.trim(),
                classLevel: editChildClass,
                board: editChildBoard,
                school: editChildSchool.trim() || "Sacred Heart School",
              };
            }
            return c;
          });
          await SecureStore.setItemAsync(ACTIVE_USER_STORAGE_KEY, JSON.stringify(parsed));
          queryClient.setQueryData(queryKeys.me, parsed);
          queryClient.setQueryData(queryKeys.parentStudents, { students: parsed.linkedStudents });
        }
      }

      // Also persist to registered accounts directory if available
      try {
        const rawAccounts = await SecureStore.getItemAsync("q2l_registered_accounts");
        if (rawAccounts) {
          const accounts = JSON.parse(rawAccounts);
          for (const acc of accounts) {
            if (acc.role === "parent" && Array.isArray(acc.linkedStudents)) {
              for (const s of acc.linkedStudents) {
                if (s.userId === (editingChild.userId || editingChild.id)) {
                  s.fullName = editChildName.trim();
                  s.classLevel = editChildClass;
                  s.board = editChildBoard;
                  s.school = editChildSchool.trim() || "Sacred Heart School";
                }
              }
            }
          }
          await SecureStore.setItemAsync("q2l_registered_accounts", JSON.stringify(accounts));
        }
      } catch {}

      queryClient.invalidateQueries({ queryKey: queryKeys.parentStudents });
      queryClient.invalidateQueries({ queryKey: queryKeys.me });
      closeEditChildModal();
      setTimeout(() => {
        Alert.alert("Success", "Child details updated successfully.");
      }, 150);
    } catch {
      setEditChildError("Failed to update child details. Please try again.");
    } finally {
      setIsSavingChild(false);
    }
  };

  return (
    <Screen scrollable={false} header={<AppHeader title={t("profileTitle")} />}>
      <ScrollView
        style={{ flex: 1 }}
        className="flex-1"
        contentContainerStyle={{ padding: 12, paddingBottom: 48 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={['#2563EB']}
            tintColor="#2563EB"
          />
        }
      >
        {/* 1. USER PROFILE CARD */}
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: 20,
            borderWidth: 1,
            borderColor: '#E2E8F0',
            marginBottom: 12,
            overflow: 'hidden',
            shadowColor: '#0F172A',
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: 0.05,
            shadowRadius: 8,
            elevation: 2,
          }}
        >
          {/* Decorative Header Banner */}
          <View
            style={{
              height: 48,
              backgroundColor: role === "parent" ? '#EFF6FF' : isAdmin ? '#EEF2FF' : '#F0FDF4',
              borderBottomWidth: 1,
              borderBottomColor: role === "parent" ? '#DBEAFE' : isAdmin ? '#E0E7FF' : '#DCFCE7',
              paddingHorizontal: 14,
              paddingTop: 10,
              flexDirection: 'row',
              justifyContent: 'flex-end',
              alignItems: 'flex-start',
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 3.5,
                backgroundColor: 'rgba(255, 255, 255, 0.92)',
                paddingHorizontal: 8,
                paddingVertical: 2.5,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: role === "parent" ? '#BFDBFE' : isAdmin ? '#C7D2FE' : '#BBF7D0',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.04,
                shadowRadius: 2,
              }}
            >
              <ShieldCheck size={11} color={role === "parent" ? '#2563EB' : isAdmin ? '#4F46E5' : '#16A34A'} />
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: '700',
                  color: role === "parent" ? '#1E40AF' : isAdmin ? '#3730A3' : '#15803D',
                  letterSpacing: 0.2,
                }}
              >
                {role === "parent" ? "Parent Portal" : isAdmin ? "Admin Portal" : "Student Portal"}
              </Text>
            </View>
          </View>

          {/* Profile Card Body */}
          <View
            style={{
              alignItems: 'center',
              paddingHorizontal: 14,
              paddingBottom: 14,
              paddingTop: 0,
            }}
          >
            {/* Elevated Overlapping Avatar with Role Emblem */}
            <View
              style={{
                marginTop: -28,
                position: 'relative',
                marginBottom: 6,
              }}
            >
              <View
                style={{
                  padding: 4,
                  borderRadius: 999,
                  backgroundColor: '#FFFFFF',
                  borderWidth: 2,
                  borderColor: role === "parent" ? '#BFDBFE' : isAdmin ? '#C7D2FE' : '#BBF7D0',
                  shadowColor: '#0F172A',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.12,
                  shadowRadius: 10,
                  elevation: 5,
                }}
              >
                <Avatar name={fullName} size="xl" />
              </View>

              {/* Status / Role Emblem on Avatar */}
              <View
                style={{
                  position: 'absolute',
                  bottom: 2,
                  right: 2,
                  width: 22,
                  height: 22,
                  borderRadius: 11,
                  backgroundColor: role === "parent" ? '#2563EB' : isAdmin ? '#4F46E5' : '#16A34A',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 2,
                  borderColor: '#FFFFFF',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.2,
                  shadowRadius: 2,
                  elevation: 2,
                }}
              >
                {role === "parent" || isAdmin ? (
                  <ShieldCheck size={11} color="#FFFFFF" strokeWidth={2.6} />
                ) : (
                  <Check size={11} color="#FFFFFF" strokeWidth={3} />
                )}
              </View>
            </View>

            {/* User Full Name */}
            <Text
              style={{
                fontSize: 16,
                fontWeight: '800',
                color: '#0F172A',
                textAlign: 'center',
                marginBottom: 6,
                letterSpacing: -0.2,
              }}
            >
              {fullName}
            </Text>

            {/* Badges Row */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                flexWrap: 'wrap',
                justifyContent: 'center',
                gap: 5,
                marginBottom: 7,
              }}
            >
              <View
                style={{
                  backgroundColor: role === "parent" ? '#2563EB' : isAdmin ? '#4F46E5' : '#16A34A',
                  paddingHorizontal: 8,
                  paddingVertical: 2.5,
                  borderRadius: 8,
                  shadowColor: role === "parent" ? '#2563EB' : isAdmin ? '#4F46E5' : '#16A34A',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.15,
                  shadowRadius: 3,
                  elevation: 1,
                }}
              >
                <Text style={{ fontSize: 9.5, fontWeight: '800', color: '#FFFFFF', letterSpacing: 0.5 }}>
                  {isAdmin ? "ADMINISTRATOR" : role.toUpperCase()}
                </Text>
              </View>

              {isAdmin ? (
                <View
                  style={{
                    backgroundColor: '#F1F5F9',
                    borderWidth: 1,
                    borderColor: '#E2E8F0',
                    paddingHorizontal: 8,
                    paddingVertical: 2.5,
                    borderRadius: 8,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 3.5,
                  }}
                >
                  <Briefcase size={10.5} color="#475569" />
                  <Text style={{ fontSize: 10, fontWeight: '700', color: '#334155' }}>
                    Director & Master Faculty
                  </Text>
                </View>
              ) : null}

              {role === "student" && profile?.classLevel ? (
                <View
                  style={{
                    backgroundColor: '#F1F5F9',
                    borderWidth: 1,
                    borderColor: '#E2E8F0',
                    paddingHorizontal: 8,
                    paddingVertical: 2.5,
                    borderRadius: 8,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 3.5,
                  }}
                >
                  <GraduationCap size={10.5} color="#475569" />
                  <Text style={{ fontSize: 10, fontWeight: '700', color: '#334155' }}>
                    Class {profile.classLevel}{profile.board ? ` • ${profile.board.toUpperCase()}` : ''}
                  </Text>
                </View>
              ) : null}

              {role === "parent" ? (
                <View
                  style={{
                    backgroundColor: '#EFF6FF',
                    borderWidth: 1,
                    borderColor: '#DBEAFE',
                    paddingHorizontal: 8,
                    paddingVertical: 2.5,
                    borderRadius: 8,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 3.5,
                  }}
                >
                  <Users size={10.5} color="#2563EB" />
                  <Text style={{ fontSize: 10, fontWeight: '700', color: '#1E40AF' }}>
                    {linkedStudents.length} {linkedStudents.length === 1 ? "Child" : "Children"}
                  </Text>
                </View>
              ) : null}
            </View>

            {/* School / Institution Pill */}
            {(profile?.school || "Quick2Learn Institute") && (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                  backgroundColor: '#F8FAFC',
                  borderWidth: 1,
                  borderColor: '#E2E8F0',
                  paddingHorizontal: 9,
                  paddingVertical: 3,
                  borderRadius: 12,
                  marginBottom: 8,
                }}
              >
                <School size={10.5} color="#64748B" />
                <Text
                  style={{
                    fontSize: 10.5,
                    color: '#475569',
                    fontWeight: '600',
                  }}
                >
                  {isAdmin ? (profile?.school || "Quick2Learn Institute") : (profile?.school || "Quick2Learn Institute")}
                </Text>
              </View>
            )}

            {/* Edit Profile Action Button */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => router.push("/(app)/profile/edit" as any)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 5,
                backgroundColor: '#FFFFFF',
                paddingVertical: 5.5,
                paddingHorizontal: 14,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: isAdmin ? '#C7D2FE' : '#BFDBFE',
                shadowColor: isAdmin ? '#4F46E5' : '#2563EB',
                shadowOffset: { width: 0, height: 1.5 },
                shadowOpacity: 0.06,
                shadowRadius: 3,
                elevation: 1,
              }}
            >
              <Edit3 size={11.5} color={isAdmin ? "#4F46E5" : "#2563EB"} />
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: '700',
                  color: isAdmin ? "#4F46E5" : "#2563EB",
                }}
              >
                {isAdmin ? "Edit Faculty Profile" : t("editProfileRow")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ADMIN QUICK STATS ROW */}
        {isAdmin && (
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
            {/* Stat 1: Batches */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => router.push("/(app)/(tabs)/batches" as any)}
              style={{
                flex: 1,
                backgroundColor: '#EEF2FF',
                borderRadius: 18,
                paddingVertical: 12,
                paddingHorizontal: 8,
                borderWidth: 1,
                borderColor: '#C7D2FE',
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: '#4F46E5',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 3,
                elevation: 1,
              }}
            >
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: '#E0E7FF',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 6,
                }}
              >
                <GraduationCap size={16} color="#4F46E5" />
              </View>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: '800',
                  color: '#312E81',
                  marginBottom: 2,
                }}
              >
                4 Batches
              </Text>
              <Text
                style={{
                  fontSize: 10.5,
                  fontWeight: '700',
                  color: '#4F46E5',
                  textAlign: 'center',
                }}
              >
                Classes IX–XII
              </Text>
            </TouchableOpacity>

            {/* Stat 2: Students */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => router.push("/(app)/(tabs)/teach" as any)}
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
                shadowColor: '#16A34A',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 3,
                elevation: 1,
              }}
            >
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: '#DCFCE7',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 6,
                }}
              >
                <Users size={16} color="#16A34A" />
              </View>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: '800',
                  color: '#14532D',
                  marginBottom: 2,
                }}
              >
                128 Enrolled
              </Text>
              <Text
                style={{
                  fontSize: 10.5,
                  fontWeight: '700',
                  color: '#16A34A',
                  textAlign: 'center',
                }}
              >
                Active Students
              </Text>
            </TouchableOpacity>

            {/* Stat 3: Experience */}
            <View
              style={{
                flex: 1,
                backgroundColor: '#FFFBEB',
                borderRadius: 18,
                paddingVertical: 12,
                paddingHorizontal: 8,
                borderWidth: 1,
                borderColor: '#FDE68A',
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: '#D97706',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 3,
                elevation: 1,
              }}
            >
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: '#FEF3C7',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 6,
                }}
              >
                <Award size={16} color="#D97706" />
              </View>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: '800',
                  color: '#78350F',
                  marginBottom: 2,
                }}
              >
                25+ Yrs
              </Text>
              <Text
                style={{
                  fontSize: 10.5,
                  fontWeight: '700',
                  color: '#D97706',
                  textAlign: 'center',
                }}
              >
                Master Faculty
              </Text>
            </View>
          </View>
        )}

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
          <View
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 22,
              padding: 16,
              borderWidth: 1,
              borderColor: '#E2E8F0',
              marginBottom: 14,
              shadowColor: '#0F172A',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 8,
              elevation: 2,
            }}
          >
            {/* Section Header */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 14,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 10,
                    backgroundColor: '#EFF6FF',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Users size={17} color="#2563EB" />
                </View>
                <View>
                  <Text style={{ fontSize: 14.5, fontWeight: '800', color: '#0F172A' }}>
                    Linked Children ({linkedStudents.length})
                  </Text>
                  <Text style={{ fontSize: 11, color: '#64748B', fontWeight: '500' }}>
                    Select active child to view dashboard
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setLinkChildModalVisible(true)}
                accessibilityLabel="Add Child"
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: '#2563EB',
                  alignItems: 'center',
                  justifyContent: 'center',
                  shadowColor: '#2563EB',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.25,
                  shadowRadius: 3,
                  elevation: 2,
                }}
              >
                <UserPlus size={16} color="#FFFFFF" strokeWidth={2.3} />
              </TouchableOpacity>
            </View>

            {linkedStudents.length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: 18 }}>
                <Text style={{ fontSize: 13, color: '#64748B', textAlign: 'center', marginBottom: 12 }}>
                  No children linked yet. Enter the student's invite code to view grades & attendance.
                </Text>
                <Button
                  size="sm"
                  variant="primary"
                  onPress={() => setLinkChildModalVisible(true)}
                  icon={<UserPlus size={15} color="#FFFFFF" />}
                >
                  Link Child with Code
                </Button>
              </View>
            ) : (
              <View style={{ gap: 10 }}>
                {linkedStudents.map((child: any) => {
                  const childKey = child.userId || child.id;
                  const isSelected =
                    selectedChildId === child.userId ||
                    selectedChildId === child.id ||
                    (!selectedChildId && childKey === (linkedStudents[0]?.userId || linkedStudents[0]?.id));

                  const nameParts = (child.fullName || "").trim().split(" ");
                  const initials =
                    nameParts.length >= 2
                      ? `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase()
                      : (nameParts[0] || "S").slice(0, 2).toUpperCase();

                  return (
                    <TouchableOpacity
                      key={childKey}
                      activeOpacity={0.7}
                      onPress={() => setSelectedChildId(childKey)}
                      style={{
                        padding: 13,
                        borderRadius: 16,
                        borderWidth: isSelected ? 1.5 : 1,
                        borderColor: isSelected ? '#2563EB' : '#E2E8F0',
                        backgroundColor: isSelected ? '#F8FAFF' : '#FFFFFF',
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        shadowColor: isSelected ? '#2563EB' : '#0F172A',
                        shadowOffset: { width: 0, height: isSelected ? 3 : 1 },
                        shadowOpacity: isSelected ? 0.08 : 0.03,
                        shadowRadius: isSelected ? 6 : 3,
                        elevation: isSelected ? 2 : 1,
                      }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 11, flex: 1, marginRight: 10 }}>
                        {/* Child Initials Avatar */}
                        <View
                          style={{
                            width: 42,
                            height: 42,
                            borderRadius: 21,
                            backgroundColor: isSelected ? '#EFF6FF' : '#F1F5F9',
                            borderWidth: 1.5,
                            borderColor: isSelected ? '#BFDBFE' : '#E2E8F0',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 14,
                              fontWeight: '800',
                              color: isSelected ? '#1D4ED8' : '#475569',
                            }}
                          >
                            {initials}
                          </Text>
                        </View>

                        <View style={{ flex: 1 }}>
                          <Text
                            style={{
                              fontSize: 14.5,
                              fontWeight: '800',
                              color: '#0F172A',
                              marginBottom: 3,
                            }}
                            numberOfLines={1}
                          >
                            {child.fullName}
                          </Text>

                          {/* Chips and School */}
                          <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 5 }}>
                            <View
                              style={{
                                backgroundColor: isSelected ? '#DBEAFE' : '#F1F5F9',
                                paddingHorizontal: 6,
                                paddingVertical: 1.5,
                                borderRadius: 6,
                              }}
                            >
                              <Text
                                style={{
                                  fontSize: 10.5,
                                  fontWeight: '700',
                                  color: isSelected ? '#1E40AF' : '#475569',
                                }}
                              >
                                Class {child.classLevel || 10}
                              </Text>
                            </View>

                            <View
                              style={{
                                backgroundColor: isSelected ? '#DBEAFE' : '#F1F5F9',
                                paddingHorizontal: 6,
                                paddingVertical: 1.5,
                                borderRadius: 6,
                              }}
                            >
                              <Text
                                style={{
                                  fontSize: 10.5,
                                  fontWeight: '700',
                                  color: isSelected ? '#1E40AF' : '#475569',
                                }}
                              >
                                {(child.board || "CBSE").toUpperCase()}
                              </Text>
                            </View>

                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, flexShrink: 1 }}>
                              <School size={11} color="#94A3B8" />
                              <Text
                                style={{
                                  fontSize: 11,
                                  color: '#64748B',
                                  fontWeight: '500',
                                }}
                                numberOfLines={1}
                              >
                                {child.school || "Quick2Learn High School"}
                              </Text>
                            </View>
                          </View>
                        </View>
                      </View>

                      {/* Actions: Edit & Select/Active */}
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <TouchableOpacity
                          activeOpacity={0.7}
                          onPress={(e) => {
                            e.stopPropagation();
                            openEditChildModal(child);
                          }}
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 16,
                            backgroundColor: isSelected ? '#EFF6FF' : '#F1F5F9',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderWidth: 1,
                            borderColor: isSelected ? '#BFDBFE' : '#E2E8F0',
                          }}
                          accessibilityLabel="Edit child details"
                        >
                          <Edit3 size={14} color={isSelected ? '#2563EB' : '#475569'} />
                        </TouchableOpacity>

                        {isSelected ? (
                          <View
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              backgroundColor: '#2563EB',
                              paddingHorizontal: 12,
                              paddingVertical: 5.5,
                              borderRadius: 14,
                              gap: 4,
                              shadowColor: '#2563EB',
                              shadowOffset: { width: 0, height: 2 },
                              shadowOpacity: 0.25,
                              shadowRadius: 3,
                              elevation: 2,
                            }}
                          >
                            <Check size={12} color="#FFFFFF" strokeWidth={3} />
                            <Text style={{ fontSize: 11.5, color: '#FFFFFF', fontWeight: '800' }}>
                              Active
                            </Text>
                          </View>
                        ) : (
                          <View
                            style={{
                              backgroundColor: '#F8FAFC',
                              borderWidth: 1,
                              borderColor: '#CBD5E1',
                              paddingHorizontal: 11,
                              paddingVertical: 5,
                              borderRadius: 14,
                            }}
                          >
                            <Text style={{ fontSize: 11, color: '#475569', fontWeight: '700' }}>
                              Select
                            </Text>
                          </View>
                        )}
                      </View>
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

        {/* ADMIN PORTAL ACCESS CARD */}
        {role === "admin" && (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push("/(app)/admin" as any)}
            style={{
              backgroundColor: '#1E293B',
              borderRadius: 20,
              padding: 16,
              marginBottom: 14,
              borderWidth: 1,
              borderColor: '#334155',
              shadowColor: '#0F172A',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 10,
              elevation: 4,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 12,
                    backgroundColor: '#2563EB',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <ShieldCheck size={20} color="#FFFFFF" />
                </View>
                <View>
                  <Text style={{ fontSize: 16, fontWeight: '800', color: '#FFFFFF' }}>
                    Institute Admin Portal
                  </Text>
                  <Text style={{ fontSize: 11, color: '#94A3B8' }}>
                    Quick2Learn Institute Control
                  </Text>
                </View>
              </View>
              <View
                style={{
                  backgroundColor: '#059669',
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  borderRadius: 10,
                }}
              >
                <Text style={{ fontSize: 10, fontWeight: '800', color: '#FFFFFF' }}>FULL ACCESS</Text>
              </View>
            </View>

            <Text style={{ fontSize: 12.5, color: '#CBD5E1', lineHeight: 18, marginBottom: 12 }}>
              Upload notes & formula sheets, publish video lectures, manage batches, schedule tests, record offline tuition fees, and manage question bank.
            </Text>

            <View
              style={{
                backgroundColor: '#2563EB',
                paddingVertical: 10,
                borderRadius: 12,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              <Text style={{ fontSize: 13, fontWeight: '800', color: '#FFFFFF' }}>Launch Admin Portal</Text>
              <ChevronRight size={16} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
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
            onPress={() => router.push("/(app)/fee-receipts" as any)}
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
            <ChevronRight size={16} color="#94A3B8" />
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
            <ChevronRight size={16} color="#94A3B8" />
          </TouchableOpacity>
        </View>

        {/* Sign Out Button */}
        <View style={{ marginTop: 8, marginBottom: 4 }}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleSignOut}
            disabled={isSigningOut}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              paddingVertical: 12,
              paddingHorizontal: 16,
              borderRadius: 14,
              borderWidth: 1.5,
              borderColor: "rgba(239, 68, 68, 0.35)",
              backgroundColor: "#FEF2F2",
            }}
          >
            {isSigningOut ? (
              <ActivityIndicator size="small" color="#DC2626" />
            ) : (
              <>
                <LogOut size={18} color="#DC2626" strokeWidth={2.2} />
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "700",
                    color: "#DC2626",
                    marginLeft: 8,
                  }}
                >
                  {t("logOut")}
                </Text>
              </>
            )}
          </TouchableOpacity>
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
        statusBarTranslucent
        onRequestClose={closeLinkChildModal}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={closeLinkChildModal}
          style={{
            flex: 1,
            backgroundColor: "rgba(15, 23, 42, 0.65)",
            justifyContent: "flex-end",
          }}
        >
          <Animated.View
            style={{
              width: "100%",
              paddingBottom: keyboardHeightAnim,
            }}
          >
            <TouchableOpacity
              activeOpacity={1}
              onPress={(e) => e.stopPropagation()}
              style={{
                backgroundColor: colors.surface,
                borderTopLeftRadius: 28,
                borderTopRightRadius: 28,
                paddingHorizontal: 22,
                paddingTop: 12,
                paddingBottom: isKeyboardOpen ? 14 : Math.max(insets.bottom + 8, 24),
                borderTopWidth: 1,
                borderColor: "rgba(226, 232, 240, 0.9)",
                shadowColor: "#0F172A",
                shadowOffset: { width: 0, height: -6 },
                shadowOpacity: 0.15,
                shadowRadius: 20,
                elevation: 20,
              }}
            >
              {/* Drag indicator pill */}
              <View
                style={{
                  width: 38,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: "#CBD5E1",
                  alignSelf: "center",
                  marginBottom: 14,
                }}
              />

              {/* Modal Header */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 14,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    flex: 1,
                    marginRight: 10,
                  }}
                >
                  <View
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 14,
                      backgroundColor: "#EFF6FF",
                      borderWidth: 1,
                      borderColor: "#DBEAFE",
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: 12,
                    }}
                  >
                    <UserPlus size={22} color="#2563EB" strokeWidth={2.4} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 18,
                        fontWeight: "800",
                        color: colors.ink,
                        letterSpacing: -0.3,
                      }}
                    >
                      Link Student Account
                    </Text>
                    <Text
                      style={{
                        fontSize: 12,
                        color: colors["ink-muted"],
                        marginTop: 1,
                      }}
                    >
                      Sync attendance, scores & batches
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  onPress={closeLinkChildModal}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 17,
                    backgroundColor: "#F1F5F9",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <X size={18} color="#64748B" strokeWidth={2.4} />
                </TouchableOpacity>
              </View>

              {/* Instructions Banner */}
              <View
                style={{
                  backgroundColor: "#F8FAFC",
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: "#E2E8F0",
                  paddingVertical: 10,
                  paddingHorizontal: 12,
                  marginBottom: 14,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginBottom: 4,
                  }}
                >
                  <KeyRound size={14} color="#2563EB" />
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "700",
                      color: "#1E293B",
                      marginLeft: 6,
                    }}
                  >
                    Where to find the 6-character code?
                  </Text>
                </View>
                <Text
                  style={{
                    fontSize: 11.5,
                    color: "#64748B",
                    lineHeight: 17,
                  }}
                >
                  On your child's phone, open Quick2Learn → go to{" "}
                  <Text style={{ fontWeight: "700", color: "#0F172A" }}>
                    Profile
                  </Text>{" "}
                  → tap{" "}
                  <Text style={{ fontWeight: "700", color: "#2563EB" }}>
                    Parent Access
                  </Text>{" "}
                  to view or share their invite code.
                </Text>
              </View>

              {/* Code Slots Container with Hidden Input */}
              <View style={{ position: "relative", marginBottom: 6 }}>
                <TextInput
                  ref={claimInputRef}
                  value={claimCodeInput}
                  onChangeText={(text) => {
                    const cleaned = text.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
                    setClaimCodeInput(cleaned.slice(0, 6));
                    setClaimError("");
                  }}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  maxLength={6}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: 54,
                    opacity: 0.01,
                    zIndex: 10,
                  }}
                />

                {/* 6 Visual Character Slots */}
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    gap: 8,
                  }}
                >
                  {[0, 1, 2, 3, 4, 5].map((index) => {
                    const char = claimCodeInput[index];
                    const isFilled = Boolean(char);
                    const isFocused = claimCodeInput.length === index;

                    return (
                      <View
                        key={index}
                        style={{
                          flex: 1,
                          height: 54,
                          borderRadius: 14,
                          backgroundColor: isFilled
                            ? "#FFFFFF"
                            : isFocused
                            ? "#EFF6FF"
                            : "#F8FAFC",
                          borderWidth: isFocused ? 2 : isFilled ? 1.5 : 1,
                          borderColor: isFocused
                            ? "#2563EB"
                            : isFilled
                            ? "#93C5FD"
                            : "#E2E8F0",
                          alignItems: "center",
                          justifyContent: "center",
                          shadowColor: isFocused || isFilled ? "#2563EB" : "transparent",
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: isFocused ? 0.15 : isFilled ? 0.08 : 0,
                          shadowRadius: 4,
                          elevation: isFocused ? 2 : 0,
                        }}
                      >
                        {isFilled ? (
                          <Text
                            style={{
                              fontSize: 22,
                              fontWeight: "800",
                              color: "#0F172A",
                              letterSpacing: 0,
                            }}
                          >
                            {char}
                          </Text>
                        ) : isFocused ? (
                          <View
                            style={{
                              width: 2,
                              height: 22,
                              backgroundColor: "#2563EB",
                              borderRadius: 1,
                            }}
                          />
                        ) : (
                          <View
                            style={{
                              width: 6,
                              height: 6,
                              borderRadius: 3,
                              backgroundColor: "#CBD5E1",
                            }}
                          />
                        )}
                      </View>
                    );
                  })}
                </View>
              </View>

              {/* Status and Clear Row */}
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginTop: 6,
                  marginBottom: claimError ? 8 : 14,
                }}
              >
                <Text
                  style={{
                    fontSize: 11.5,
                    fontWeight: "600",
                    color: colors["ink-muted"],
                  }}
                >
                  {claimCodeInput.length}/6 characters
                </Text>
                {claimCodeInput.length > 0 ? (
                  <TouchableOpacity
                    onPress={() => {
                      setClaimCodeInput("");
                      setClaimError("");
                      claimInputRef.current?.focus();
                    }}
                    hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                  >
                    <Text
                      style={{
                        fontSize: 11.5,
                        fontWeight: "700",
                        color: "#2563EB",
                      }}
                    >
                      Clear code
                    </Text>
                  </TouchableOpacity>
                ) : null}
              </View>

              {/* Error Alert Pill */}
              {claimError ? (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: "#FEF2F2",
                    borderRadius: 10,
                    paddingVertical: 7,
                    paddingHorizontal: 12,
                    marginBottom: 14,
                    borderWidth: 1,
                    borderColor: "#FEE2E2",
                  }}
                >
                  <AlertCircle size={15} color="#DC2626" />
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "600",
                      color: "#DC2626",
                      marginLeft: 6,
                      flex: 1,
                    }}
                  >
                    {claimError}
                  </Text>
                </View>
              ) : null}

              {/* Link Account Button */}
              <Button
                variant="primary"
                size="lg"
                fullWidth
                onPress={handleClaimCode}
                loading={claimCodeMutation.isPending}
                disabled={claimCodeInput.trim().length !== 6 || claimCodeMutation.isPending}
                style={{
                  height: 48,
                  borderRadius: 16,
                  backgroundColor:
                    claimCodeInput.trim().length === 6 ? "#2563EB" : "#94A3B8",
                }}
              >
                Link Account
              </Button>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      </Modal>

      {/* EDIT CHILD DETAILS MODAL */}
      <Modal
        visible={!!editingChild}
        transparent={true}
        animationType="fade"
        onRequestClose={closeEditChildModal}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={closeEditChildModal}
          style={{
            flex: 1,
            backgroundColor: "rgba(15, 23, 42, 0.6)",
            justifyContent: "center",
            padding: 16,
          }}
        >
          <Animated.View
            style={{
              paddingBottom: keyboardHeightAnim,
              width: "100%",
              maxWidth: 440,
              alignSelf: "center",
            }}
          >
            <TouchableOpacity
              activeOpacity={1}
              onPress={(e) => e.stopPropagation()}
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: 24,
                padding: 22,
                shadowColor: "#0F172A",
                shadowOffset: { width: 0, height: 12 },
                shadowOpacity: 0.25,
                shadowRadius: 28,
                elevation: 12,
              }}
            >
              {/* Header */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 16,
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 12,
                      backgroundColor: "#EFF6FF",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <User size={20} color="#2563EB" />
                  </View>
                  <View>
                    <Text
                      style={{
                        fontSize: 17,
                        fontWeight: "800",
                        color: "#0F172A",
                      }}
                    >
                      Edit Student Details
                    </Text>
                    <Text
                      style={{
                        fontSize: 12,
                        color: "#64748B",
                        fontWeight: "500",
                      }}
                    >
                      Update name, class, board, and school
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={closeEditChildModal}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: "#F1F5F9",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <X size={16} color="#64748B" />
                </TouchableOpacity>
              </View>

              {/* Student Name */}
              <View style={{ marginBottom: 14 }}>
                <Text style={{ fontSize: 12, fontWeight: "700", color: "#334155", marginBottom: 6 }}>
                  Student Full Name *
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: "#F8FAFC",
                    borderWidth: 1,
                    borderColor: "#E2E8F0",
                    borderRadius: 14,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                  }}
                >
                  <User size={16} color="#64748B" />
                  <TextInput
                    value={editChildName}
                    onChangeText={setEditChildName}
                    placeholder="e.g. Arjun Singh Rajput"
                    placeholderTextColor="#94A3B8"
                    style={{
                      flex: 1,
                      marginLeft: 8,
                      fontSize: 14,
                      fontWeight: "600",
                      color: "#0F172A",
                    }}
                  />
                </View>
              </View>

              {/* Class Level Pills */}
              <View style={{ marginBottom: 14 }}>
                <Text style={{ fontSize: 12, fontWeight: "700", color: "#334155", marginBottom: 6 }}>
                  Class Level *
                </Text>
                <View style={{ flexDirection: "row", gap: 8 }}>
                  {[9, 10, 11, 12].map((lvl) => {
                    const isSelected = editChildClass === lvl;
                    return (
                      <TouchableOpacity
                        key={lvl}
                        activeOpacity={0.7}
                        onPress={() => setEditChildClass(lvl)}
                        style={{
                          flex: 1,
                          paddingVertical: 9,
                          borderRadius: 12,
                          alignItems: "center",
                          justifyContent: "center",
                          backgroundColor: isSelected ? "#2563EB" : "#F8FAFC",
                          borderWidth: 1,
                          borderColor: isSelected ? "#2563EB" : "#E2E8F0",
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 13,
                            fontWeight: "800",
                            color: isSelected ? "#FFFFFF" : "#334155",
                          }}
                        >
                          Class {lvl}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Board Selector Pills */}
              <View style={{ marginBottom: 14 }}>
                <Text style={{ fontSize: 12, fontWeight: "700", color: "#334155", marginBottom: 6 }}>
                  Board *
                </Text>
                <View style={{ flexDirection: "row", gap: 8 }}>
                  {["cbse", "icse", "isc"].map((b) => {
                    const isSelected = editChildBoard.toLowerCase() === b;
                    return (
                      <TouchableOpacity
                        key={b}
                        activeOpacity={0.7}
                        onPress={() => setEditChildBoard(b)}
                        style={{
                          flex: 1,
                          paddingVertical: 9,
                          borderRadius: 12,
                          alignItems: "center",
                          justifyContent: "center",
                          backgroundColor: isSelected ? "#2563EB" : "#F8FAFC",
                          borderWidth: 1,
                          borderColor: isSelected ? "#2563EB" : "#E2E8F0",
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 12.5,
                            fontWeight: "800",
                            color: isSelected ? "#FFFFFF" : "#334155",
                            textTransform: "uppercase",
                          }}
                        >
                          {b}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* School Name */}
              <View style={{ marginBottom: 16 }}>
                <Text style={{ fontSize: 12, fontWeight: "700", color: "#334155", marginBottom: 6 }}>
                  School Name
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: "#F8FAFC",
                    borderWidth: 1,
                    borderColor: "#E2E8F0",
                    borderRadius: 14,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                  }}
                >
                  <School size={16} color="#64748B" />
                  <TextInput
                    value={editChildSchool}
                    onChangeText={setEditChildSchool}
                    placeholder="e.g. Quick2Learn High School"
                    placeholderTextColor="#94A3B8"
                    style={{
                      flex: 1,
                      marginLeft: 8,
                      fontSize: 14,
                      fontWeight: "600",
                      color: "#0F172A",
                    }}
                  />
                </View>
              </View>

              {/* Error Message */}
              {editChildError ? (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: "#FEF2F2",
                    borderRadius: 10,
                    paddingVertical: 7,
                    paddingHorizontal: 12,
                    marginBottom: 14,
                    borderWidth: 1,
                    borderColor: "#FEE2E2",
                  }}
                >
                  <AlertCircle size={15} color="#DC2626" />
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "600",
                      color: "#DC2626",
                      marginLeft: 6,
                      flex: 1,
                    }}
                  >
                    {editChildError}
                  </Text>
                </View>
              ) : null}

              {/* Action Buttons */}
              <View style={{ flexDirection: "row", gap: 10 }}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={closeEditChildModal}
                  style={{
                    flex: 1,
                    paddingVertical: 12,
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: "#E2E8F0",
                    backgroundColor: "#F8FAFC",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ fontSize: 13, fontWeight: "700", color: "#64748B" }}>
                    Cancel
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={handleSaveChildDetails}
                  disabled={isSavingChild}
                  style={{
                    flex: 2,
                    paddingVertical: 12,
                    borderRadius: 14,
                    backgroundColor: "#2563EB",
                    alignItems: "center",
                    justifyContent: "center",
                    shadowColor: "#2563EB",
                    shadowOffset: { width: 0, height: 3 },
                    shadowOpacity: 0.25,
                    shadowRadius: 5,
                    elevation: 3,
                  }}
                >
                  {isSavingChild ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={{ fontSize: 13, fontWeight: "800", color: "#FFFFFF" }}>
                      Save Changes
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      </Modal>

      {/* Logout Confirmation Modal */}
      <Modal
        visible={logoutModalVisible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => {
          if (!isSigningOut) setLogoutModalVisible(false);
        }}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => {
            if (!isSigningOut) setLogoutModalVisible(false);
          }}
          style={{
            flex: 1,
            backgroundColor: "rgba(15, 23, 42, 0.65)",
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: 24,
          }}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: 340,
              backgroundColor: "#FFFFFF",
              borderRadius: 24,
              paddingVertical: 24,
              paddingHorizontal: 22,
              alignItems: "center",
              shadowColor: "#0F172A",
              shadowOffset: { width: 0, height: 12 },
              shadowOpacity: 0.18,
              shadowRadius: 24,
              elevation: 14,
            }}
          >
            {/* Danger Emblem Badge */}
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 32,
                backgroundColor: "#FEE2E2",
                borderWidth: 2,
                borderColor: "#FECACA",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 16,
              }}
            >
              <View
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: 23,
                  backgroundColor: "#EF4444",
                  alignItems: "center",
                  justifyContent: "center",
                  shadowColor: "#EF4444",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.35,
                  shadowRadius: 8,
                  elevation: 4,
                }}
              >
                <LogOut size={22} color="#FFFFFF" strokeWidth={2.4} />
              </View>
            </View>

            {/* Title */}
            <Text
              style={{
                fontSize: 19,
                fontWeight: "800",
                color: "#0F172A",
                textAlign: "center",
                marginBottom: 8,
                letterSpacing: -0.3,
              }}
            >
              {t("logOut")}
            </Text>

            {/* Confirmation Message */}
            <Text
              style={{
                fontSize: 14,
                color: "#64748B",
                textAlign: "center",
                lineHeight: 21,
                marginBottom: 22,
                paddingHorizontal: 6,
              }}
            >
              {t("logOutConfirm")}
            </Text>

            {/* Action Buttons */}
            <View style={{ flexDirection: "row", width: "100%", gap: 10 }}>
              <TouchableOpacity
                activeOpacity={0.7}
                disabled={isSigningOut}
                onPress={() => setLogoutModalVisible(false)}
                style={{
                  flex: 1,
                  height: 44,
                  borderRadius: 14,
                  borderWidth: 1.5,
                  borderColor: "#E2E8F0",
                  backgroundColor: "#F8FAFC",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: "700", color: "#475569" }}>
                  {t("cancel")}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.7}
                disabled={isSigningOut}
                onPress={handleConfirmSignOut}
                style={{
                  flex: 1,
                  height: 44,
                  borderRadius: 14,
                  backgroundColor: "#DC2626",
                  alignItems: "center",
                  justifyContent: "center",
                  shadowColor: "#DC2626",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 4,
                }}
              >
                {isSigningOut ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={{ fontSize: 14, fontWeight: "800", color: "#FFFFFF" }}>
                    {t("logOut")}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Privacy Policy & Terms Modal */}
      <LegalDocumentModal
        visible={legalModalType !== null}
        initialType={legalModalType || "privacy"}
        onClose={() => setLegalModalType(null)}
      />
    </Screen>
  );
}
