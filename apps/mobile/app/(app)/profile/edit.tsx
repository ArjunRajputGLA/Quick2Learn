import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Pressable,
  Alert,
  ActivityIndicator,
  Modal,
  Platform,
  KeyboardAvoidingView,
  Keyboard,
  Animated,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useQueryClient } from "@tanstack/react-query";
import {
  User,
  GraduationCap,
  School,
  MapPin,
  Shield,
  Phone,
  CheckCircle2,
  Mail,
  KeyRound,
  ChevronDown,
  Briefcase,
  BookOpen,
  Award,
  Clock,
  Sparkles,
  ShieldCheck,
  FileText,
  MessageSquare,
} from "lucide-react-native";
import { Screen } from "../../../src/components/ui/Screen";
import { AppHeader } from "../../../src/components/ui/AppHeader";
import { Button } from "../../../src/components/ui/Button";
import { KeyboardAwareView } from "../../../src/components/ui/KeyboardAwareView";
import { Card } from "../../../src/components/ui/Card";
import { Badge } from "../../../src/components/ui/Badge";
import {
  useMe,
  useUpdateMe,
  useSendPhoneOtp,
  useVerifyPhoneOtp,
  queryKeys,
} from "../../../src/api/hooks";
import { useI18n } from "../../../src/lib/i18n";
import { authClient } from "../../../src/api/auth-client";

export default function EditProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { t } = useI18n();
  const { data: me, isLoading: isMeLoading } = useMe();
  const updateMeMutation = useUpdateMe();
  const sendPhoneOtpMutation = useSendPhoneOtp();
  const verifyPhoneOtpMutation = useVerifyPhoneOtp();

  const user = me?.user;
  const profile = me?.profile;
  const role = me?.role || "student";
  const isAdmin = role === "admin";
  const isTeacher = role === "teacher";
  const isStaff = isAdmin || isTeacher;

  // Form states - General / Student
  const [fullName, setFullName] = useState(profile?.fullName || user?.name || "");
  const [classLevel, setClassLevel] = useState<number>(profile?.classLevel || 10);
  const [board, setBoard] = useState<"cbse" | "icse" | "isc">(
    profile?.board || "cbse"
  );
  const [school, setSchool] = useState(profile?.school || "");
  const [city, setCity] = useState(profile?.city || "");
  const [parentName, setParentName] = useState(profile?.parentName || "");
  const [parentPhone, setParentPhone] = useState(profile?.parentPhone || "");

  // Form states - Faculty / Administrator
  const [adminDesignation, setAdminDesignation] = useState(
    (profile as any)?.designation || "Institute Director & Master Faculty"
  );
  const [adminSubjects, setAdminSubjects] = useState(
    (profile as any)?.teachingSubjects || "Senior Mathematics (Classes IX–XII & JEE Foundation)"
  );
  const [adminQualifications, setAdminQualifications] = useState(
    (profile as any)?.qualifications || "M.Sc. Mathematics, B.Ed. • 25+ Yrs Teaching"
  );
  const [adminInstitute, setAdminInstitute] = useState(
    profile?.school || "Quick2Learn Institute"
  );
  const [adminCenter, setAdminCenter] = useState(
    profile?.city || "Head Office"
  );
  const [adminConsultationHours, setAdminConsultationHours] = useState(
    (profile as any)?.consultationHours || "4:30 PM – 8:00 PM (Monday – Saturday)"
  );
  const [adminHelpline, setAdminHelpline] = useState(
    (profile as any)?.helpline || "+91 94122 77888"
  );
  const [adminBio, setAdminBio] = useState(
    (profile as any)?.bio ||
      "Guiding students towards conceptual clarity, board exam excellence, and competitive success in Mathematics for over 25 years."
  );

  // Load persisted faculty data if available
  useEffect(() => {
    if (isStaff) {
      SecureStore.getItemAsync("q2l_admin_faculty_profile")
        .then((raw) => {
          if (raw) {
            try {
              const parsed = JSON.parse(raw);
              if (parsed.designation) setAdminDesignation(parsed.designation);
              if (parsed.teachingSubjects) setAdminSubjects(parsed.teachingSubjects);
              if (parsed.qualifications) setAdminQualifications(parsed.qualifications);
              if (parsed.institute) setAdminInstitute(parsed.institute);
              if (parsed.center) setAdminCenter(parsed.center);
              if (parsed.consultationHours) setAdminConsultationHours(parsed.consultationHours);
              if (parsed.helpline) setAdminHelpline(parsed.helpline);
              if (parsed.bio) setAdminBio(parsed.bio);
            } catch {}
          }
        })
        .catch(() => {});
    }
  }, [isStaff]);

  // Change phone modal state
  const [phoneModalOpen, setPhoneModalOpen] = useState(false);
  const [newPhone, setNewPhone] = useState("");
  const [phoneOtp, setPhoneOtp] = useState("");
  const [phoneStep, setPhoneStep] = useState<"phone" | "otp">("phone");
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const keyboardHeightAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showSub = Keyboard.addListener(showEvent, (e) => {
      const height = e?.endCoordinates?.height || 0;
      setIsKeyboardOpen(true);
      Animated.timing(keyboardHeightAnim, {
        toValue: height,
        duration: Platform.OS === "ios" ? (e.duration || 250) : 160,
        useNativeDriver: false,
      }).start();
    });

    const hideSub = Keyboard.addListener(hideEvent, (e) => {
      setIsKeyboardOpen(false);
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

  const handleSaveProfile = async () => {
    if (!fullName.trim() || fullName.trim().length < 2) {
      Alert.alert("Invalid Name", "Full name must be at least 2 characters.");
      return;
    }

    try {
      if (isStaff) {
        const facultyData = {
          fullName: fullName.trim(),
          designation: adminDesignation.trim(),
          teachingSubjects: adminSubjects.trim(),
          qualifications: adminQualifications.trim(),
          institute: adminInstitute.trim(),
          center: adminCenter.trim(),
          consultationHours: adminConsultationHours.trim(),
          helpline: adminHelpline.trim(),
          bio: adminBio.trim(),
        };
        await SecureStore.setItemAsync(
          "q2l_admin_faculty_profile",
          JSON.stringify(facultyData)
        ).catch(() => {});

        await updateMeMutation.mutateAsync({
          fullName: fullName.trim(),
          school: adminInstitute.trim() || "Quick2Learn Institute",
          city: adminCenter.trim() || null,
        });

        // Sync query cache immediately
        queryClient.setQueryData(queryKeys.me, (prev: any) => {
          if (!prev) return prev;
          return {
            ...prev,
            user: { ...prev.user, name: fullName.trim() },
            profile: {
              ...prev.profile,
              fullName: fullName.trim(),
              school: adminInstitute.trim() || "Quick2Learn Institute",
              city: adminCenter.trim() || null,
              designation: adminDesignation.trim(),
              teachingSubjects: adminSubjects.trim(),
              qualifications: adminQualifications.trim(),
              consultationHours: adminConsultationHours.trim(),
              helpline: adminHelpline.trim(),
              bio: adminBio.trim(),
            },
          };
        });

        Alert.alert("Success", "Faculty & Administrator profile updated successfully.", [
          { text: "OK", onPress: () => router.back() },
        ]);
        return;
      }

      await updateMeMutation.mutateAsync({
        fullName: fullName.trim(),
        classLevel,
        board,
        school: school.trim() || null,
        city: city.trim() || null,
        parentName: parentName.trim() || null,
        parentPhone: parentPhone.trim() || null,
      });

      Alert.alert("Success", "Profile details updated successfully.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to update profile.");
    }
  };

  const handleSendPhoneOtp = async () => {
    const cleaned = newPhone.trim();
    if (!/^[6-9]\d{9}$/.test(cleaned)) {
      Alert.alert("Invalid Phone", "Please enter a valid 10-digit Indian mobile number.");
      return;
    }

    try {
      await sendPhoneOtpMutation.mutateAsync({ newPhoneNumber: cleaned });
      setPhoneStep("otp");
    } catch (err: any) {
      Alert.alert("Notice", err.message || "Failed to send verification code.");
    }
  };

  const handleVerifyPhoneOtp = async () => {
    if (phoneOtp.trim().length !== 6) {
      Alert.alert("Invalid Code", "Please enter the 6-digit verification code.");
      return;
    }

    try {
      await verifyPhoneOtpMutation.mutateAsync({
        newPhoneNumber: newPhone.trim(),
        code: phoneOtp.trim(),
      });
      setPhoneModalOpen(false);
      setPhoneStep("phone");
      setNewPhone("");
      setPhoneOtp("");
      Alert.alert("Success", "Registered mobile number updated successfully.");
    } catch (err: any) {
      Alert.alert("Error", err.message || "Verification failed.");
    }
  };

  if (isMeLoading) {
    return (
      <Screen scrollable={false} header={<AppHeader title={isStaff ? "Faculty Profile" : t("editProfileTitle")} showBack />}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      </Screen>
    );
  }

  return (
    <Screen
      scrollable={true}
      header={<AppHeader title={isStaff ? "Faculty Profile" : t("editProfileTitle")} showBack />}
      contentContainerStyle={{ padding: 16, paddingBottom: 60 }}
    >
      {isStaff ? (
        <>
          {/* Executive Faculty Banner */}
          <View
            style={{
              backgroundColor: "#1E293B",
              borderRadius: 20,
              padding: 16,
              marginBottom: 16,
              borderWidth: 1,
              borderColor: "#334155",
              shadowColor: "#0F172A",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 10,
              elevation: 4,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: "#4F46E5",
                    alignItems: "center",
                    justifyContent: "center",
                    borderWidth: 2,
                    borderColor: "#818CF8",
                  }}
                >
                  <ShieldCheck size={24} color="#FFFFFF" />
                </View>
                <View>
                  <Text style={{ fontSize: 16, fontWeight: "800", color: "#FFFFFF", letterSpacing: -0.2 }}>
                    Faculty & Admin Profile
                  </Text>
                  <Text style={{ fontSize: 11.5, color: "#94A3B8", fontWeight: "500" }}>
                    Quick2Learn Institute Director Control
                  </Text>
                </View>
              </View>

              <View
                style={{
                  backgroundColor: "#4F46E5",
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: 12,
                }}
              >
                <Text style={{ fontSize: 10.5, fontWeight: "800", color: "#FFFFFF", letterSpacing: 0.8 }}>
                  ADMINISTRATOR
                </Text>
              </View>
            </View>

            <Text style={{ fontSize: 12.5, color: "#CBD5E1", lineHeight: 18 }}>
              Configure your faculty credentials, teaching specialization, student consultation helpline, and classroom details visible to enrolled students & parents.
            </Text>
          </View>

          {/* 1. Academic & Faculty Information */}
          <View className="bg-surface rounded-2xl p-4 border border-border mb-4 shadow-sm space-y-4">
            <View className="flex-row items-center justify-between">
              <Text className="text-h3 font-semibold text-ink">Academic & Faculty Credentials</Text>
              <Badge label="VERIFIED" variant="primary" size="sm" />
            </View>

            {/* Faculty Full Name */}
            <View>
              <Text className="text-caption font-semibold text-ink-muted mb-1.5">
                Faculty Full Name *
              </Text>
              <View className="flex-row items-center bg-surface-subtle border border-border rounded-xl px-3.5 py-2.5">
                <User size={18} color="#4F46E5" />
                <TextInput
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder="e.g. Dinesh Sir (Administrator)"
                  className="flex-1 text-body text-ink ml-2.5 font-semibold"
                />
              </View>
            </View>

            {/* Designation / Role */}
            <View>
              <Text className="text-caption font-semibold text-ink-muted mb-1.5">
                Designation & Role *
              </Text>
              <View className="flex-row items-center bg-surface-subtle border border-border rounded-xl px-3.5 py-2.5">
                <Briefcase size={18} color="#6B7280" />
                <TextInput
                  value={adminDesignation}
                  onChangeText={setAdminDesignation}
                  placeholder="e.g. Institute Director & Master Faculty"
                  className="flex-1 text-body text-ink ml-2.5"
                />
              </View>
            </View>

            {/* Teaching Subjects */}
            <View>
              <Text className="text-caption font-semibold text-ink-muted mb-1.5">
                Teaching Subjects & Grades *
              </Text>
              <View className="flex-row items-center bg-surface-subtle border border-border rounded-xl px-3.5 py-2.5">
                <BookOpen size={18} color="#6B7280" />
                <TextInput
                  value={adminSubjects}
                  onChangeText={setAdminSubjects}
                  placeholder="e.g. Senior Mathematics (Classes IX–XII & JEE Foundation)"
                  className="flex-1 text-body text-ink ml-2.5"
                />
              </View>
            </View>

            {/* Qualifications & Experience */}
            <View>
              <Text className="text-caption font-semibold text-ink-muted mb-1.5">
                Highest Qualification & Experience
              </Text>
              <View className="flex-row items-center bg-surface-subtle border border-border rounded-xl px-3.5 py-2.5">
                <GraduationCap size={18} color="#6B7280" />
                <TextInput
                  value={adminQualifications}
                  onChangeText={setAdminQualifications}
                  placeholder="e.g. M.Sc. Mathematics, B.Ed. • 25+ Yrs Experience"
                  className="flex-1 text-body text-ink ml-2.5"
                />
              </View>
            </View>

            {/* Institute Name */}
            <View>
              <Text className="text-caption font-semibold text-ink-muted mb-1.5">
                Institute / Coaching Name
              </Text>
              <View className="flex-row items-center bg-surface-subtle border border-border rounded-xl px-3.5 py-2.5">
                <School size={18} color="#6B7280" />
                <TextInput
                  value={adminInstitute}
                  onChangeText={setAdminInstitute}
                  placeholder="Quick2Learn Institute"
                  className="flex-1 text-body text-ink ml-2.5"
                />
              </View>
            </View>

            {/* City / Center */}
            <View>
              <Text className="text-caption font-semibold text-ink-muted mb-1.5">
                Campus / Center Location
              </Text>
              <View className="flex-row items-center bg-surface-subtle border border-border rounded-xl px-3.5 py-2.5">
                <MapPin size={18} color="#6B7280" />
                <TextInput
                  value={adminCenter}
                  onChangeText={setAdminCenter}
                  placeholder="e.g. Head Office / Center"
                  className="flex-1 text-body text-ink ml-2.5"
                />
              </View>
            </View>
          </View>

          {/* 2. Consultation & Parent Helpline */}
          <View className="bg-surface rounded-2xl p-4 border border-border mb-4 shadow-sm space-y-4">
            <Text className="text-h3 font-semibold text-ink">Student & Parent Consultation</Text>

            <View>
              <Text className="text-caption font-semibold text-ink-muted mb-1.5">
                Official Helpline / WhatsApp Number
              </Text>
              <View className="flex-row items-center bg-surface-subtle border border-border rounded-xl px-3.5 py-2.5">
                <Phone size={18} color="#16A34A" />
                <TextInput
                  value={adminHelpline}
                  onChangeText={setAdminHelpline}
                  placeholder="+91 94122 77888"
                  className="flex-1 text-body text-ink ml-2.5 font-medium"
                />
              </View>
            </View>

            <View>
              <Text className="text-caption font-semibold text-ink-muted mb-1.5">
                Consultation & Doubt Clearing Hours
              </Text>
              <View className="flex-row items-center bg-surface-subtle border border-border rounded-xl px-3.5 py-2.5">
                <Clock size={18} color="#6B7280" />
                <TextInput
                  value={adminConsultationHours}
                  onChangeText={setAdminConsultationHours}
                  placeholder="e.g. 4:30 PM – 8:00 PM (Monday – Saturday)"
                  className="flex-1 text-body text-ink ml-2.5"
                />
              </View>
            </View>
          </View>

          {/* 3. Faculty Bio / Welcome Message */}
          <View className="bg-surface rounded-2xl p-4 border border-border mb-4 shadow-sm space-y-3">
            <Text className="text-h3 font-semibold text-ink">Faculty Philosophy & Welcome Note</Text>
            <Text className="text-caption text-ink-muted">
              Displayed in student course overviews and batch announcements.
            </Text>
            <View className="bg-surface-subtle border border-border rounded-xl px-3.5 py-2.5">
              <TextInput
                value={adminBio}
                onChangeText={setAdminBio}
                multiline
                numberOfLines={3}
                placeholder="Write a brief introduction for students and parents..."
                className="text-body text-ink leading-relaxed"
                style={{ minHeight: 70, textAlignVertical: "top" }}
              />
            </View>
          </View>
        </>
      ) : (
        <>
          {/* Basic Information for Students & Parents */}
          <View className="bg-surface rounded-2xl p-4 border border-border mb-4 shadow-sm space-y-4">
            <Text className="text-h3 font-semibold text-ink">Personal Information</Text>

            {/* Full Name */}
            <View>
              <Text className="text-caption font-semibold text-ink-muted mb-1.5">
                {t("fullNameLabel")} *
              </Text>
              <View className="flex-row items-center bg-surface-subtle border border-border rounded-xl px-3.5 py-2.5">
                <User size={18} color="#6B7280" />
                <TextInput
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder="Student Full Name"
                  className="flex-1 text-body text-ink ml-2.5"
                />
              </View>
            </View>

            {/* Class Level Picker */}
            <View>
              <Text className="text-caption font-semibold text-ink-muted mb-1.5">
                {t("classLabel")} *
              </Text>
              <View className="flex-row space-x-2">
                {[9, 10, 11, 12].map((lvl) => (
                  <TouchableOpacity
                    key={lvl}
                    activeOpacity={0.85}
                    onPress={() => setClassLevel(lvl)}
                    style={{
                      flex: 1,
                      paddingVertical: 10,
                      borderRadius: 12,
                      borderWidth: 1,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: classLevel === lvl ? '#2563EB' : '#F1F5F9',
                      borderColor: classLevel === lvl ? '#1D4ED8' : '#E2E8F0',
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: '700',
                        color: classLevel === lvl ? '#FFFFFF' : '#1E293B',
                      }}
                    >
                      Class {lvl}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Board Picker */}
            <View>
              <Text className="text-caption font-semibold text-ink-muted mb-1.5">
                {t("boardLabel")} *
              </Text>
              <View className="flex-row space-x-2">
                {(["cbse", "icse", "isc"] as const).map((b) => (
                  <TouchableOpacity
                    key={b}
                    activeOpacity={0.85}
                    onPress={() => setBoard(b)}
                    style={{
                      flex: 1,
                      paddingVertical: 10,
                      borderRadius: 12,
                      borderWidth: 1,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: board === b ? '#2563EB' : '#F1F5F9',
                      borderColor: board === b ? '#1D4ED8' : '#E2E8F0',
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: '700',
                        textTransform: 'uppercase',
                        color: board === b ? '#FFFFFF' : '#1E293B',
                      }}
                    >
                      {b}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* School Name */}
            <View>
              <Text className="text-caption font-semibold text-ink-muted mb-1.5">
                {t("schoolLabel")}
              </Text>
              <View className="flex-row items-center bg-surface-subtle border border-border rounded-xl px-3.5 py-2.5">
                <School size={18} color="#6B7280" />
                <TextInput
                  value={school}
                  onChangeText={setSchool}
                  placeholder="School / College Name"
                  className="flex-1 text-body text-ink ml-2.5"
                />
              </View>
            </View>

            {/* City */}
            <View>
              <Text className="text-caption font-semibold text-ink-muted mb-1.5">
                {t("cityLabel")}
              </Text>
              <View className="flex-row items-center bg-surface-subtle border border-border rounded-xl px-3.5 py-2.5">
                <MapPin size={18} color="#6B7280" />
                <TextInput
                  value={city}
                  onChangeText={setCity}
                  placeholder="e.g. City Name"
                  className="flex-1 text-body text-ink ml-2.5"
                />
              </View>
            </View>
          </View>

          {/* Parent / Guardian Contact */}
          <View className="bg-surface rounded-2xl p-4 border border-border mb-4 shadow-sm space-y-4">
            <Text className="text-h3 font-semibold text-ink">Parent Information</Text>

            <View>
              <Text className="text-caption font-semibold text-ink-muted mb-1.5">
                {t("parentNameLabel")}
              </Text>
              <View className="flex-row items-center bg-surface-subtle border border-border rounded-xl px-3.5 py-2.5">
                <Shield size={18} color="#6B7280" />
                <TextInput
                  value={parentName}
                  onChangeText={setParentName}
                  placeholder="Mother's or Father's Name"
                  className="flex-1 text-body text-ink ml-2.5"
                />
              </View>
            </View>

            <View>
              <Text className="text-caption font-semibold text-ink-muted mb-1.5">
                {t("parentPhoneLabel")}
              </Text>
              <View className="flex-row items-center bg-surface-subtle border border-border rounded-xl px-3.5 py-2.5">
                <Phone size={18} color="#6B7280" />
                <TextInput
                  value={parentPhone}
                  onChangeText={setParentPhone}
                  keyboardType="phone-pad"
                  maxLength={10}
                  placeholder="10-digit WhatsApp number"
                  className="flex-1 text-body text-ink ml-2.5"
                />
              </View>
            </View>
          </View>
        </>
      )}

      {/* Registered Phone Section & Change Phone */}
      <View className="bg-surface rounded-2xl p-4 border border-border mb-4 shadow-sm space-y-3">
        <Text className="text-h3 font-semibold text-ink">{t("phoneSectionTitle")}</Text>

        <View className="flex-row items-center justify-between bg-surface-subtle p-3.5 rounded-xl border border-border">
          <View className="flex-row items-center flex-1 mr-2">
            <Phone size={18} color={isStaff ? "#4F46E5" : "#2563EB"} />
            <View className="ml-2.5">
              <Text className="text-body font-bold text-ink">
                {user?.phoneNumber || profile?.phone || "No phone linked"}
              </Text>
              <Text className="text-caption text-ink-muted">
                Primary login and verification mobile number
              </Text>
            </View>
          </View>
        </View>

        <Button
          variant="outline"
          size="md"
          onPress={() => {
            setPhoneModalOpen(true);
            setPhoneStep("phone");
            setNewPhone("");
            setPhoneOtp("");
          }}
        >
          {t("changePhoneButton")}
        </Button>
      </View>

      {/* Linked Accounts */}
      <View className="bg-surface rounded-2xl p-4 border border-border mb-6 shadow-sm space-y-3">
        <Text className="text-h3 font-semibold text-ink">{t("linkedAccountsTitle")}</Text>

        <View className="flex-row items-center justify-between py-2 border-b border-border/60">
          <View className="flex-row items-center">
            <Mail size={18} color="#6B7280" />
            <View className="ml-2.5">
              <Text className="text-body font-semibold text-ink">
                Email Account
              </Text>
              <Text className="text-caption text-ink-muted">
                {user?.email || "Not set"}
              </Text>
            </View>
          </View>
          {user?.emailVerified ? (
            <Badge label="VERIFIED" variant="success" size="sm" />
          ) : null}
        </View>
      </View>

      {/* Save Button */}
      <Button
        variant="primary"
        size="lg"
        onPress={handleSaveProfile}
        loading={updateMeMutation.isPending}
      >
        {isStaff ? "Save Faculty Profile" : t("saveChanges")}
      </Button>

      {/* Change Phone Modal */}
      <Modal
        visible={phoneModalOpen}
        animationType="slide"
        transparent
        statusBarTranslucent
        onRequestClose={() => {
          Keyboard.dismiss();
          setPhoneModalOpen(false);
        }}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => {
            Keyboard.dismiss();
            setPhoneModalOpen(false);
          }}
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
                backgroundColor: "#FFFFFF",
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

              <View className="flex-row justify-between items-center mb-3">
                <Text className="text-h2 font-bold text-ink">Change Mobile Number</Text>
                <TouchableOpacity onPress={() => setPhoneModalOpen(false)}>
                  <Text className="text-body font-semibold text-primary">Cancel</Text>
                </TouchableOpacity>
              </View>

              {phoneStep === "phone" ? (
                <View className="space-y-4">
                  <Text className="text-caption text-ink-muted leading-relaxed">
                    Enter your new 10-digit mobile number. We will send an SMS with a 6-digit verification code.
                  </Text>

                  <View className="flex-row items-center bg-surface-subtle border border-border rounded-xl px-3.5 py-3">
                    <Text className="text-body font-bold text-ink mr-2">+91</Text>
                    <TextInput
                      value={newPhone}
                      onChangeText={setNewPhone}
                      keyboardType="phone-pad"
                      maxLength={10}
                      placeholder="9876543210"
                      className="flex-1 text-body text-ink font-semibold"
                      autoFocus
                    />
                  </View>

                  <Button
                    variant="primary"
                    size="lg"
                    onPress={handleSendPhoneOtp}
                    loading={sendPhoneOtpMutation.isPending}
                  >
                    Send OTP Code
                  </Button>
                </View>
              ) : (
                <View className="space-y-4">
                  <Text className="text-caption text-ink-muted leading-relaxed">
                    Enter the 6-digit verification code sent to +91 {newPhone}.
                  </Text>

                  <View className="flex-row items-center bg-surface-subtle border border-border rounded-xl px-3.5 py-3">
                    <KeyRound size={18} color="#6B7280" />
                    <TextInput
                      value={phoneOtp}
                      onChangeText={setPhoneOtp}
                      keyboardType="number-pad"
                      maxLength={6}
                      placeholder="123456"
                      className="flex-1 text-h3 text-ink font-mono font-bold tracking-widest text-center"
                      autoFocus
                    />
                  </View>

                  <View className="flex-row space-x-2">
                    <Button
                      variant="outline"
                      size="md"
                      className="flex-1"
                      onPress={() => setPhoneStep("phone")}
                    >
                      Back
                    </Button>
                    <Button
                      variant="primary"
                      size="md"
                      className="flex-2"
                      onPress={handleVerifyPhoneOtp}
                      loading={verifyPhoneOtpMutation.isPending}
                    >
                      Verify & Update
                    </Button>
                  </View>
                </View>
              )}
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    </Screen>
  );
}
