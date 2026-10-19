import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  ShieldAlert,
  FileText,
  KeyRound,
  CheckCircle2,
  Trash2,
} from "lucide-react-native";
import { Screen } from "../../src/components/ui/Screen";
import { AppHeader } from "../../src/components/ui/AppHeader";
import { Button } from "../../src/components/ui/Button";
import { Card } from "../../src/components/ui/Card";
import {
  useRequestDeleteAccountOtp,
  useConfirmDeleteAccount,
} from "../../src/api/hooks";
import { authClient } from "../../src/api/auth-client";
import { useI18n } from "../../src/lib/i18n";

export default function DeleteAccountScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { t } = useI18n();

  const [step, setStep] = useState<"warning" | "otp">("warning");
  const [code, setCode] = useState("");
  const [destination, setDestination] = useState("");

  const requestOtpMutation = useRequestDeleteAccountOtp();
  const confirmDeleteMutation = useConfirmDeleteAccount();

  const handleRequestOtp = async () => {
    try {
      const res = await requestOtpMutation.mutateAsync();
      setDestination(res.destination || "registered contact");
      setStep("otp");
    } catch (err: any) {
      Alert.alert("Notice", err.message || "Failed to send verification code.");
    }
  };

  const handleConfirmDelete = async () => {
    if (code.trim().length !== 6) {
      Alert.alert("Invalid Code", "Please enter the 6-digit verification code.");
      return;
    }

    Alert.alert(
      "Final Confirmation",
      "Are you absolutely certain? This will permanently delete your account and revoke all access immediately.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete Forever",
          style: "destructive",
          onPress: async () => {
            try {
              await confirmDeleteMutation.mutateAsync({ code: code.trim() });
              await authClient.signOut().catch(() => {});
              queryClient.clear();
              Alert.alert(
                "Account Deleted",
                "Your account has been deleted and your personal data anonymized.",
                [
                  {
                    text: "OK",
                    onPress: () => router.replace("/(auth)/welcome" as any),
                  },
                ]
              );
            } catch (err: any) {
              Alert.alert("Error", err.message || "Deletion failed. Please check the code.");
            }
          },
        },
      ]
    );
  };

  return (
    <Screen
      scrollable={false}
      header={<AppHeader title={t("deleteAccountTitle")} showBack />}
    >
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Banner Alert */}
        <View className="bg-danger/10 border border-danger/30 rounded-2xl p-4 mb-4 flex-row items-start space-x-3">
          <AlertTriangle size={24} color="#DC2626" className="mt-0.5" />
          <View className="flex-1 ml-2">
            <Text className="text-body font-bold text-danger">
              {t("deleteNoticeTitle")}
            </Text>
            <Text className="text-caption text-ink mt-1 leading-relaxed">
              {t("deleteWarning1")}
            </Text>
          </View>
        </View>

        {/* What is Deleted Card */}
        <View className="bg-surface rounded-2xl p-4 border border-border mb-4 shadow-sm space-y-2">
          <View className="flex-row items-center space-x-2">
            <Trash2 size={18} color="#DC2626" />
            <Text className="text-body font-bold text-ink ml-1.5">
              What Will Be Erased Immediately
            </Text>
          </View>
          <Text className="text-caption text-ink-muted leading-relaxed">
            • Full name, phone number, email credentials and profile picture{"\n"}
            • Enrolled batches, timetable access, and doubt conversations{"\n"}
            • Test attempts, question bookmarks, and test analytics{"\n"}
            • Device push tokens and active login sessions
          </Text>
        </View>

        {/* Legal & Financial Records Disclosure */}
        <View className="bg-surface rounded-2xl p-4 border border-border mb-6 shadow-sm space-y-2">
          <View className="flex-row items-center space-x-2">
            <FileText size={18} color="#2563EB" />
            <Text className="text-body font-bold text-ink ml-1.5">
              Statutory Accounting Compliance
            </Text>
          </View>
          <Text className="text-caption text-ink-muted leading-relaxed">
            {t("retainedNotice")}
          </Text>
        </View>

        {/* Step 1: Request OTP */}
        {step === "warning" && (
          <Button
            variant="danger"
            size="lg"
            loading={requestOtpMutation.isPending}
            onPress={handleRequestOtp}
            icon={<ShieldAlert size={18} color="#FFFFFF" />}
          >
            {t("requestDeleteOtp")}
          </Button>
        )}

        {/* Step 2: Enter OTP & Confirm */}
        {step === "otp" && (
          <View className="bg-surface rounded-2xl p-4 border border-border shadow-sm space-y-4">
            <Text className="text-body font-bold text-ink">
              Enter Verification Code
            </Text>
            <Text className="text-caption text-ink-muted">
              We dispatched a 6-digit confirmation code to {destination}.
            </Text>

            <View className="flex-row items-center bg-surface-subtle border border-border rounded-xl px-3.5 py-3">
              <KeyRound size={18} color="#6B7280" />
              <TextInput
                value={code}
                onChangeText={setCode}
                keyboardType="number-pad"
                maxLength={6}
                placeholder="123456"
                className="flex-1 text-h2 font-mono font-bold tracking-widest text-center text-danger"
                autoFocus
              />
            </View>

            <Button
              variant="danger"
              size="lg"
              loading={confirmDeleteMutation.isPending}
              onPress={handleConfirmDelete}
            >
              {t("confirmDeleteAccount")}
            </Button>
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}
