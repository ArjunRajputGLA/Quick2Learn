import React from "react";
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  Switch,
  TouchableOpacity,
  Pressable,
  Platform,
  Alert,
} from "react-native";
import * as Haptics from "expo-haptics";
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
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await Promise.all([
        queryClient.refetchQueries({ type: 'active' }),
        new Promise((resolve) => setTimeout(resolve, 350)),
      ]);
    } catch (err) {
      console.warn('[Settings] Refresh error:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

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
        contentContainerStyle={{ padding: 14, paddingBottom: 50 }}
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
        {/* 1. NOTIFICATION PREFERENCES */}
        <View className="bg-surface rounded-xl p-3.5 border border-border mb-3 shadow-xs space-y-2">
          <View className="flex-row items-center space-x-1.5">
            <Bell size={16} color="#2563EB" />
            <Text className="text-sm font-bold text-ink ml-1.5">
              {t("notificationsHeader")}
            </Text>
          </View>

          <View className="divide-y divide-border/50">
            {/* Live classes */}
            <View className="flex-row items-center justify-between py-2">
              <Text className="text-xs font-medium text-ink">
                {t("liveClassesNotif")}
              </Text>
              <Switch
                value={liveClassesNotif}
                onValueChange={toggleLiveClassesNotif}
                trackColor={{ false: "#D1D5DB", true: "#93C5FD" }}
                thumbColor={liveClassesNotif ? "#2563EB" : "#F3F4F6"}
                style={{ transform: [{ scaleX: 0.82 }, { scaleY: 0.82 }] }}
              />
            </View>

            {/* Announcements */}
            <View className="flex-row items-center justify-between py-2">
              <Text className="text-xs font-medium text-ink">
                {t("announcementsNotif")}
              </Text>
              <Switch
                value={announcementsNotif}
                onValueChange={toggleAnnouncementsNotif}
                trackColor={{ false: "#D1D5DB", true: "#93C5FD" }}
                thumbColor={announcementsNotif ? "#2563EB" : "#F3F4F6"}
                style={{ transform: [{ scaleX: 0.82 }, { scaleY: 0.82 }] }}
              />
            </View>

            {/* Tests */}
            <View className="flex-row items-center justify-between py-2">
              <Text className="text-xs font-medium text-ink">
                {t("testsNotif")}
              </Text>
              <Switch
                value={testsNotif}
                onValueChange={toggleTestsNotif}
                trackColor={{ false: "#D1D5DB", true: "#93C5FD" }}
                thumbColor={testsNotif ? "#2563EB" : "#F3F4F6"}
                style={{ transform: [{ scaleX: 0.82 }, { scaleY: 0.82 }] }}
              />
            </View>

            {/* Doubts */}
            <View className="flex-row items-center justify-between py-2">
              <Text className="text-xs font-medium text-ink">
                {t("doubtsNotif")}
              </Text>
              <Switch
                value={doubtsNotif}
                onValueChange={toggleDoubtsNotif}
                trackColor={{ false: "#D1D5DB", true: "#93C5FD" }}
                thumbColor={doubtsNotif ? "#2563EB" : "#F3F4F6"}
                style={{ transform: [{ scaleX: 0.82 }, { scaleY: 0.82 }] }}
              />
            </View>

            {/* Fees */}
            <View className="flex-row items-center justify-between py-2">
              <Text className="text-xs font-medium text-ink">
                {t("feesNotif")}
              </Text>
              <Switch
                value={feesNotif}
                onValueChange={toggleFeesNotif}
                trackColor={{ false: "#D1D5DB", true: "#93C5FD" }}
                thumbColor={feesNotif ? "#2563EB" : "#F3F4F6"}
                style={{ transform: [{ scaleX: 0.82 }, { scaleY: 0.82 }] }}
              />
            </View>
          </View>
        </View>

        {/* 2. DATA SAVER */}
        <View className="bg-surface rounded-xl p-3.5 border border-border mb-3 shadow-xs space-y-2">
          <View className="flex-row items-center space-x-1.5">
            <Wifi size={16} color="#2563EB" />
            <Text className="text-sm font-bold text-ink ml-1.5">
              {t("dataSaverHeader")}
            </Text>
          </View>

          <View className="divide-y divide-border/50">
            <View className="flex-row items-center justify-between py-2">
              <View className="flex-1 mr-3">
                <Text className="text-xs font-medium text-ink">
                  {t("smallerThumbnails")}
                </Text>
                <Text className="text-[11px] text-ink-muted leading-tight mt-0.5">
                  {t("smallerThumbnailsDesc")}
                </Text>
              </View>
              <Switch
                value={smallerThumbnails}
                onValueChange={toggleSmallerThumbnails}
                trackColor={{ false: "#D1D5DB", true: "#93C5FD" }}
                thumbColor={smallerThumbnails ? "#2563EB" : "#F3F4F6"}
                style={{ transform: [{ scaleX: 0.82 }, { scaleY: 0.82 }] }}
              />
            </View>

            <View className="flex-row items-center justify-between py-2">
              <View className="flex-1 mr-3">
                <Text className="text-xs font-medium text-ink">
                  {t("noAutoplay")}
                </Text>
                <Text className="text-[11px] text-ink-muted leading-tight mt-0.5">
                  {t("noAutoplayDesc")}
                </Text>
              </View>
              <Switch
                value={noAutoplay}
                onValueChange={toggleNoAutoplay}
                trackColor={{ false: "#D1D5DB", true: "#93C5FD" }}
                thumbColor={noAutoplay ? "#2563EB" : "#F3F4F6"}
                style={{ transform: [{ scaleX: 0.82 }, { scaleY: 0.82 }] }}
              />
            </View>
          </View>
        </View>

        {/* 3. APP LANGUAGE */}
        <View className="bg-surface rounded-xl p-3.5 border border-border mb-3 shadow-xs space-y-2">
          <View className="flex-row items-center space-x-1.5">
            <Languages size={16} color="#2563EB" />
            <Text className="text-sm font-bold text-ink ml-1.5">
              {t("appLanguageHeader")}
            </Text>
          </View>

          <View className="flex-row space-x-2 pt-0.5">
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setLanguage("en")}
              style={{
                flex: 1,
                paddingVertical: 9,
                paddingHorizontal: 12,
                borderRadius: 10,
                borderWidth: 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: language === 'en' ? '#2563EB' : '#F1F5F9',
                borderColor: language === 'en' ? '#1D4ED8' : '#E2E8F0',
              }}
            >
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: '700',
                  color: language === "en" ? "#FFFFFF" : "#1E293B",
                }}
              >
                English
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setLanguage("hi")}
              style={{
                flex: 1,
                paddingVertical: 9,
                paddingHorizontal: 12,
                borderRadius: 10,
                borderWidth: 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                marginLeft: 8,
                backgroundColor: language === 'hi' ? '#2563EB' : '#F1F5F9',
                borderColor: language === 'hi' ? '#1D4ED8' : '#E2E8F0',
              }}
            >
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: '700',
                  color: language === "hi" ? "#FFFFFF" : "#1E293B",
                }}
              >
                हिंदी (Hindi)
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 4. STORAGE & CACHE */}
        <View className="bg-surface rounded-xl p-3.5 border border-border mb-3 shadow-xs space-y-2">
          <View className="flex-row items-center space-x-1.5">
            <Trash2 size={16} color="#6B7280" />
            <Text className="text-sm font-bold text-ink ml-1.5">
              {t("clearCacheHeader")}
            </Text>
          </View>

          <Button variant="outline" size="sm" onPress={handleClearCache}>
            <Text className="text-xs font-semibold text-ink">
              {t("clearCacheButton")}
            </Text>
          </Button>
        </View>

        {/* 5. APP VERSION */}
        <View className="bg-surface rounded-xl p-3.5 border border-border mb-3 shadow-xs flex-row items-center justify-between">
          <View className="flex-row items-center space-x-1.5">
            <Info size={16} color="#6B7280" />
            <Text className="text-xs font-medium text-ink ml-1.5">
              {t("appVersionHeader")}
            </Text>
          </View>
          <Text className="text-xs font-mono font-bold text-ink-muted">
            v{appVersion}
          </Text>
        </View>

        {/* 6. CRASH & SENTRY DIAGNOSTICS */}
        <View className="bg-surface rounded-xl p-3.5 border border-border mb-3 shadow-xs space-y-2">
          <View className="flex-row items-center space-x-1.5">
            <Bug size={16} color="#D97706" />
            <Text className="text-sm font-bold text-ink ml-1.5">
              Diagnostics & Sentry Reporting
            </Text>
          </View>
          <Text className="text-xs text-ink-muted leading-snug">
            Verify Sentry crash capture and source map symbolication before release. Breadcrumbs are strictly scrubbed of personal details.
          </Text>
          <Button
            variant="outline"
            size="sm"
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
            <Text className="text-xs font-semibold text-amber-700">
              Trigger Sentry Test Crash
            </Text>
          </Button>
        </View>

        {/* 7. DANGER ZONE: DELETE ACCOUNT */}
        <View className="bg-surface rounded-xl p-3.5 border border-danger/30 mb-3 shadow-xs space-y-2">
          <View className="flex-row items-center space-x-1.5">
            <AlertTriangle size={16} color="#DC2626" />
            <Text className="text-sm font-bold text-danger ml-1.5">
              {t("dangerZoneHeader")}
            </Text>
          </View>

          <Text className="text-xs text-ink-muted leading-snug">
            Permanently delete your Quick2Learn account and erase personal student records.
          </Text>

          <Button
            variant="outline"
            size="sm"
            className="border-danger/40"
            onPress={() => router.push("/(app)/delete-account" as any)}
          >
            <Text className="text-xs font-bold text-danger">
              {t("deleteAccountButton")}
            </Text>
          </Button>
        </View>
      </ScrollView>
    </Screen>
  );
}
