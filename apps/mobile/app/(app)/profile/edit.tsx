import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
} from "react-native";
import { useRouter } from "expo-router";
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
} from "../../../src/api/hooks";
import { useI18n } from "../../../src/lib/i18n";
import { authClient } from "../../../src/api/auth-client";

export default function EditProfileScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const { data: me, isLoading: isMeLoading } = useMe();
  const updateMeMutation = useUpdateMe();
  const sendPhoneOtpMutation = useSendPhoneOtp();
  const verifyPhoneOtpMutation = useVerifyPhoneOtp();

  const user = me?.user;
  const profile = me?.profile;

  // Form states
  const [fullName, setFullName] = useState(profile?.fullName || user?.name || "");
  const [classLevel, setClassLevel] = useState<number>(profile?.classLevel || 10);
  const [board, setBoard] = useState<"cbse" | "icse" | "isc">(
    profile?.board || "cbse"
  );
  const [school, setSchool] = useState(profile?.school || "");
  const [city, setCity] = useState(profile?.city || "");
  const [parentName, setParentName] = useState(profile?.parentName || "");
  const [parentPhone, setParentPhone] = useState(profile?.parentPhone || "");

  // Change phone modal state
  const [phoneModalOpen, setPhoneModalOpen] = useState(false);
  const [newPhone, setNewPhone] = useState("");
  const [phoneOtp, setPhoneOtp] = useState("");
  const [phoneStep, setPhoneStep] = useState<"phone" | "otp">("phone");

  const handleSaveProfile = async () => {
    if (!fullName.trim() || fullName.trim().length < 2) {
      Alert.alert("Invalid Name", "Full name must be at least 2 characters.");
      return;
    }

    try {
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
      <Screen scrollable={false} header={<AppHeader title={t("editProfileTitle")} showBack />}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      </Screen>
    );
  }

  return (
    <Screen
      scrollable={true}
      header={<AppHeader title={t("editProfileTitle")} showBack />}
      contentContainerStyle={{ padding: 16, paddingBottom: 60 }}
    >
      {/* Basic Information */}
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
                  activeOpacity={0.8}
                  onPress={() => setClassLevel(lvl)}
                  className={`flex-1 py-2.5 rounded-xl border items-center justify-center ${
                    classLevel === lvl
                      ? "bg-primary border-primary"
                      : "bg-surface-subtle border-border"
                  }`}
                >
                  <Text
                    className={`text-body font-bold ${
                      classLevel === lvl ? "text-white" : "text-ink"
                    }`}
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
                  activeOpacity={0.8}
                  onPress={() => setBoard(b)}
                  className={`flex-1 py-2.5 rounded-xl border items-center justify-center ${
                    board === b
                      ? "bg-primary border-primary"
                      : "bg-surface-subtle border-border"
                  }`}
                >
                  <Text
                    className={`text-body font-bold uppercase ${
                      board === b ? "text-white" : "text-ink"
                    }`}
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
                placeholder="e.g. Mathura, Vrindavan"
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

        {/* Registered Phone Section & Change Phone */}
        <View className="bg-surface rounded-2xl p-4 border border-border mb-4 shadow-sm space-y-3">
          <Text className="text-h3 font-semibold text-ink">{t("phoneSectionTitle")}</Text>

          <View className="flex-row items-center justify-between bg-surface-subtle p-3.5 rounded-xl border border-border">
            <View className="flex-row items-center flex-1 mr-2">
              <Phone size={18} color="#2563EB" />
              <View className="ml-2.5">
                <Text className="text-body font-bold text-ink">
                  {user?.phoneNumber || profile?.phone || "No phone linked"}
                </Text>
                <Text className="text-caption text-ink-muted">
                  Primary login and SMS notification number
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
          {t("saveChanges")}
        </Button>

      {/* Change Phone Modal */}
      <Modal
        visible={phoneModalOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setPhoneModalOpen(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <KeyboardAwareView style={{ width: '100%' }}>
            <View className="bg-surface rounded-t-3xl p-6 border-t border-border space-y-4">
              <View className="flex-row justify-between items-center mb-1">
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
                      Verify &amp; Update
                    </Button>
                  </View>
                </View>
              )}
            </View>
          </KeyboardAwareView>
        </View>
      </Modal>
    </Screen>
  );
}
