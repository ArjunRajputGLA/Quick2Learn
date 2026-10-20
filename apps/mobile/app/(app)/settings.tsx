import React from "react";
import {
  View,
  Text,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import Constants from "expo-constants";
import {
  Bell,
  Wifi,
  Languages,
  Trash2,
  Info,
  AlertTriangle,
  ChevronRight,
  Sparkles,
  Bug,
} from "lucide-react-native";
import { Screen } from "../../src/components/ui/Screen";
import { AppHeader } from "../../src/components/ui/AppHeader";
import { Button } from "../../src/components/ui/Button";
import { Card } from "../../src/components/ui/Card";
import { useConfirmDialog } from "../../src/components/ui/ConfirmModal";
import { useI18n } from "../../src/lib/i18n";
import { useSettingsStore } from "../../src/lib/settingsStore";
import { triggerTestCrash } from "../../src/lib/sentry";

export default function SettingsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { t, language, setLanguage } = useI18n();

  const {
    liveClassesNotif,
    announcementsNotif,
    testsNotif,
    doubtsNotif,
    feesNotif,
    smallerThumbnails,
    noAutoplay,
    toggleLiveClassesNotif,
    toggleAnnouncementsNotif,
    toggleTestsNotif,
    toggleDoubtsNotif,
    toggleFeesNotif,
    toggleSmallerThumbnails,
    toggleNoAutoplay,
  } = useSettingsStore();

  const { confirm } = useConfirmDialog();

  const handleClearCache = () => {
    confirm({
      title: "Clear Cache",
      message: "Are you sure you want to clear the local temporary data and media cache?",
      confirmText: "Clear Cache",
      cancelText: t("cancel"),
      type: "danger",
      onConfirm: () => {
        queryClient.clear();
      },
    });
  };

  const appVersion =
    Constants.expoConfig?.version ||
    Constants.manifest2?.extra?.expoClient?.version ||
    "1.0.0";

  return (
    <Screen
      scrollable={false}
      header={<AppHeader title={t("settingsTitle")} showBack />}
    >
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. NOTIFICATION PREFERENCES */}
        <View className="bg-surface rounded-2xl p-4 border border-border mb-4 shadow-sm space-y-3">
          <View className="flex-row items-center space-x-2">
            <Bell size={18} color="#2563EB" />
            <Text className="text-h3 font-semibold text-ink ml-2">
              {t("notificationsHeader")}
            </Text>
          </View>

          <View className="divide-y divide-border/60">
            {/* Live classes */}
            <View className="flex-row items-center justify-between py-3">
              <Text className="text-body font-medium text-ink">
                {t("liveClassesNotif")}
              </Text>
              <Switch
                value={liveClassesNotif}
                onValueChange={toggleLiveClassesNotif}
                trackColor={{ false: "#D1D5DB", true: "#93C5FD" }}
                thumbColor={liveClassesNotif ? "#2563EB" : "#F3F4F6"}
              />
            </View>

            {/* Announcements */}
            <View className="flex-row items-center justify-between py-3">
              <Text className="text-body font-medium text-ink">
                {t("announcementsNotif")}
              </Text>
              <Switch
                value={announcementsNotif}
                onValueChange={toggleAnnouncementsNotif}
                trackColor={{ false: "#D1D5DB", true: "#93C5FD" }}
                thumbColor={announcementsNotif ? "#2563EB" : "#F3F4F6"}
              />
            </View>

            {/* Tests */}
            <View className="flex-row items-center justify-between py-3">
              <Text className="text-body font-medium text-ink">
                {t("testsNotif")}
              </Text>
              <Switch
                value={testsNotif}
                onValueChange={toggleTestsNotif}
                trackColor={{ false: "#D1D5DB", true: "#93C5FD" }}
                thumbColor={testsNotif ? "#2563EB" : "#F3F4F6"}
              />
            </View>

            {/* Doubts */}
            <View className="flex-row items-center justify-between py-3">
              <Text className="text-body font-medium text-ink">
                {t("doubtsNotif")}
              </Text>
              <Switch
                value={doubtsNotif}
                onValueChange={toggleDoubtsNotif}
                trackColor={{ false: "#D1D5DB", true: "#93C5FD" }}
                thumbColor={doubtsNotif ? "#2563EB" : "#F3F4F6"}
              />
            </View>

            {/* Fees */}
            <View className="flex-row items-center justify-between py-3">
              <Text className="text-body font-medium text-ink">
                {t("feesNotif")}
              </Text>
              <Switch
                value={feesNotif}
                onValueChange={toggleFeesNotif}
                trackColor={{ false: "#D1D5DB", true: "#93C5FD" }}
                thumbColor={feesNotif ? "#2563EB" : "#F3F4F6"}
              />
            </View>
          </View>
        </View>

        {/* 2. DATA SAVER */}
        <View className="bg-surface rounded-2xl p-4 border border-border mb-4 shadow-sm space-y-3">
          <View className="flex-row items-center space-x-2">
            <Wifi size={18} color="#2563EB" />
            <Text className="text-h3 font-semibold text-ink ml-2">
              {t("dataSaverHeader")}
            </Text>
          </View>

          <View className="divide-y divide-border/60">
            <View className="flex-row items-center justify-between py-3">
              <View className="flex-1 mr-3">
                <Text className="text-body font-medium text-ink">
                  {t("smallerThumbnails")}
                </Text>
                <Text className="text-caption text-ink-muted">
                  {t("smallerThumbnailsDesc")}
                </Text>
              </View>
              <Switch
                value={smallerThumbnails}
                onValueChange={toggleSmallerThumbnails}
                trackColor={{ false: "#D1D5DB", true: "#93C5FD" }}
                thumbColor={smallerThumbnails ? "#2563EB" : "#F3F4F6"}
              />
            </View>

            <View className="flex-row items-center justify-between py-3">
              <View className="flex-1 mr-3">
                <Text className="text-body font-medium text-ink">
                  {t("noAutoplay")}
                </Text>
                <Text className="text-caption text-ink-muted">
                  {t("noAutoplayDesc")}
                </Text>
              </View>
              <Switch
                value={noAutoplay}
                onValueChange={toggleNoAutoplay}
                trackColor={{ false: "#D1D5DB", true: "#93C5FD" }}
                thumbColor={noAutoplay ? "#2563EB" : "#F3F4F6"}
              />
            </View>
          </View>
        </View>

        {/* 3. APP LANGUAGE */}
        <View className="bg-surface rounded-2xl p-4 border border-border mb-4 shadow-sm space-y-3">
          <View className="flex-row items-center space-x-2">
            <Languages size={18} color="#2563EB" />
            <Text className="text-h3 font-semibold text-ink ml-2">
              {t("appLanguageHeader")}
            </Text>
          </View>

          <View className="flex-row space-x-3 pt-1">
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setLanguage("en")}
              className={`flex-1 py-3 px-4 rounded-xl border flex-row items-center justify-center ${
                language === "en"
                  ? "bg-primary border-primary"
                  : "bg-surface-subtle border-border"
              }`}
            >
              <Text
                className={`text-body font-bold ${
                  language === "en" ? "text-white" : "text-ink"
                }`}
              >
                English
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setLanguage("hi")}
              className={`flex-1 py-3 px-4 rounded-xl border flex-row items-center justify-center ml-2 ${
                language === "hi"
                  ? "bg-primary border-primary"
                  : "bg-surface-subtle border-border"
              }`}
            >
              <Text
                className={`text-body font-bold ${
                  language === "hi" ? "text-white" : "text-ink"
                }`}
              >
                हिंदी (Hindi)
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 4. STORAGE & CACHE */}
        <View className="bg-surface rounded-2xl p-4 border border-border mb-4 shadow-sm space-y-3">
          <View className="flex-row items-center space-x-2">
            <Trash2 size={18} color="#6B7280" />
            <Text className="text-h3 font-semibold text-ink ml-2">
              {t("clearCacheHeader")}
            </Text>
          </View>

          <Button variant="outline" size="md" onPress={handleClearCache}>
            {t("clearCacheButton")}
          </Button>
        </View>

        {/* 5. APP VERSION */}
        <View className="bg-surface rounded-2xl p-4 border border-border mb-4 shadow-sm flex-row items-center justify-between">
          <View className="flex-row items-center space-x-2">
            <Info size={18} color="#6B7280" />
            <Text className="text-body font-medium text-ink ml-2">
              {t("appVersionHeader")}
            </Text>
          </View>
          <Text className="text-body font-mono font-bold text-ink-muted">
            v{appVersion}
          </Text>
        </View>

        {/* 6. CRASH & SENTRY DIAGNOSTICS */}
        <View className="bg-surface rounded-2xl p-4 border border-border mb-4 shadow-sm space-y-3">
          <View className="flex-row items-center space-x-2">
            <Bug size={18} color="#D97706" />
            <Text className="text-h3 font-semibold text-ink ml-2">
              Diagnostics & Sentry Reporting
            </Text>
          </View>
          <Text className="text-caption text-ink-muted leading-relaxed">
            Verify Sentry crash capture and source map symbolication before release. Breadcrumbs are strictly scrubbed of personal details.
          </Text>
          <Button
            variant="outline"
            size="md"
            className="border-amber-500/40"
            accessibilityLabel="Trigger Sentry test crash button"
            onPress={() => {
              confirm({
                title: "Trigger Test Crash",
                message: "This will trigger a test exception reported to Sentry to confirm readable stack traces.",
                confirmText: "Trigger Crash",
                cancelText: "Cancel",
                type: "warning",
                onConfirm: () => triggerTestCrash(),
              });
            }}
          >
            <Text className="text-body font-semibold text-amber-700">
              Trigger Sentry Test Crash
            </Text>
          </Button>
        </View>

        {/* 7. DANGER ZONE: DELETE ACCOUNT */}
        <View className="bg-surface rounded-2xl p-4 border border-danger/30 mb-4 shadow-sm space-y-3">
          <View className="flex-row items-center space-x-2">
            <AlertTriangle size={18} color="#DC2626" />
            <Text className="text-h3 font-bold text-danger ml-2">
              {t("dangerZoneHeader")}
            </Text>
          </View>

          <Text className="text-caption text-ink-muted leading-relaxed">
            Permanently delete your Quick2Learn account and erase personal student records.
          </Text>

          <Button
            variant="outline"
            size="md"
            className="border-danger/40"
            onPress={() => router.push("/(app)/delete-account" as any)}
          >
            <Text className="text-body font-bold text-danger">
              {t("deleteAccountButton")}
            </Text>
          </Button>
        </View>
      </ScrollView>
    </Screen>
  );
}
