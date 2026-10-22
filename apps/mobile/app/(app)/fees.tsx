import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Pressable,
  Platform,
  RefreshControl,
  Share,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import {
  Receipt,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Share2,
  FileText,
  ExternalLink,
  ShieldCheck,
  Building,
} from "lucide-react-native";
import { Screen } from "../../src/components/ui/Screen";
import { AppHeader } from "../../src/components/ui/AppHeader";
import { Button } from "../../src/components/ui/Button";
import { Card } from "../../src/components/ui/Card";
import { Badge } from "../../src/components/ui/Badge";
import { useFees, useAppConfig } from "../../src/api/hooks";
import { authClient, baseURL } from "../../src/api/auth-client";
import { useI18n } from "../../src/lib/i18n";
import { formatINR } from "@quick2learn/shared";

export default function FeesScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const { data: feesData, isLoading, isRefetching, refetch } = useFees();
  const { data: appConfig } = useAppConfig();
  const [activeTab, setActiveTab] = useState<"dues" | "history">("dues");
  const [processingDueId, setProcessingDueId] = useState<string | null>(null);

  const dues = feesData?.dues || [];
  const paymentHistory = feesData?.paymentHistory || [];
  const summary = feesData?.summary;
  const inAppPaymentsEnabled = Boolean(appConfig?.featureFlags?.inAppPayments);

  const handlePayDue = async (dueId: string, amountPaise: number) => {
    try {
      setProcessingDueId(dueId);

      // Generate a one-time token via Better Auth plugin
      const res = await (authClient as any).oneTimeToken?.generate?.();
      const token = res?.data?.token || res?.token;

      const checkoutUrl = token
        ? `${baseURL}/api/auth/one-time-token/verify?token=${encodeURIComponent(
            token
          )}&callbackURL=${encodeURIComponent(
            `/checkout/due/${dueId}?returnTo=q2l://payments/result`
          )}`
        : `${baseURL}/checkout/due/${dueId}?returnTo=q2l://payments/result`;

      await WebBrowser.openBrowserAsync(checkoutUrl);
    } catch (err) {
      console.error("[Fees] Error initiating due payment:", err);
      Alert.alert(
        "Payment Notice",
        "Could not launch online checkout. Please pay at the center or visit quick2learn.in."
      );
    } finally {
      setProcessingDueId(null);
    }
  };

  const handleOpenReceiptPdf = (paymentId: string, receiptNo?: string | null) => {
    const pdfUrl = `${baseURL}/api/v1/payments/${paymentId}/receipt-pdf`;
    router.push({
      pathname: "/(app)/pdf-viewer",
      params: {
        url: pdfUrl,
        title: receiptNo ? `Receipt_${receiptNo}` : "Official Fee Receipt",
      },
    } as any);
  };

  const handleShareReceipt = async (paymentId: string, receiptNo?: string | null) => {
    try {
      const pdfUrl = `${baseURL}/api/v1/payments/${paymentId}/receipt-pdf`;
      await Share.share({
        title: `Quick2Learn Fee Receipt ${receiptNo || ""}`,
        message: `Official Quick2Learn Tuition Receipt [${receiptNo || paymentId}]: ${pdfUrl}`,
        url: pdfUrl,
      });
    } catch (err) {
      console.warn("[Fees] Share receipt error:", err);
    }
  };

  const pendingDues = dues.filter((d) => d.status === "due");

  return (
    <Screen
      scrollable={false}
      header={<AppHeader title={t("feesTitle")} showBack />}
    >
      {/* Segment Tabs */}
      <View className="flex-row p-3 bg-surface border-b border-border">
        <Pressable
          onPress={() => setActiveTab("dues")}
          style={({ pressed }) => ({
            flex: 1,
            paddingVertical: 10,
            borderRadius: 12,
            alignItems: 'center',
            flexDirection: 'row',
            justifyContent: 'center',
            backgroundColor: activeTab === 'dues'
              ? (pressed ? '#1D4ED8' : '#2563EB')
              : (pressed ? '#E2E8F0' : '#F1F5F9'),
            ...(Platform.OS === 'web'
              ? ({
                  cursor: 'pointer',
                  userSelect: 'none',
                  WebkitUserSelect: 'none',
                  WebkitTapHighlightColor: 'transparent',
                  outline: 'none',
                } as any)
              : {}),
          })}
        >
          <CreditCard
            size={16}
            color={activeTab === "dues" ? "#FFFFFF" : "#6B7280"}
          />
          <Text
            style={{
              fontSize: 13,
              fontWeight: '700',
              marginLeft: 6,
              color: activeTab === "dues" ? "#FFFFFF" : "#475569",
              ...(Platform.OS === 'web'
                ? ({
                    userSelect: 'none',
                    WebkitUserSelect: 'none',
                  } as any)
                : {}),
            }}
          >
            {t("pendingDues")} {pendingDues.length > 0 ? `(${pendingDues.length})` : ""}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setActiveTab("history")}
          style={({ pressed }) => ({
            flex: 1,
            paddingVertical: 10,
            borderRadius: 12,
            alignItems: 'center',
            flexDirection: 'row',
            justifyContent: 'center',
            marginLeft: 8,
            backgroundColor: activeTab === 'history'
              ? (pressed ? '#1D4ED8' : '#2563EB')
              : (pressed ? '#E2E8F0' : '#F1F5F9'),
            ...(Platform.OS === 'web'
              ? ({
                  cursor: 'pointer',
                  userSelect: 'none',
                  WebkitUserSelect: 'none',
                  WebkitTapHighlightColor: 'transparent',
                  outline: 'none',
                } as any)
              : {}),
          })}
        >
          <Receipt
            size={16}
            color={activeTab === "history" ? "#FFFFFF" : "#6B7280"}
          />
          <Text
            style={{
              fontSize: 13,
              fontWeight: '700',
              marginLeft: 6,
              color: activeTab === "history" ? "#FFFFFF" : "#475569",
              ...(Platform.OS === 'web'
                ? ({
                    userSelect: 'none',
                    WebkitUserSelect: 'none',
                  } as any)
                : {}),
            }}
          >
            {t("paymentHistory")} {paymentHistory.length > 0 ? `(${paymentHistory.length})` : ""}
          </Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => {
              refetch();
            }}
            tintColor="#2563EB"
          />
        }
      >
        {/* Quick Financial Summary */}
        {summary ? (
          <View className="bg-surface rounded-2xl p-4 border border-border mb-4 shadow-sm">
            <View className="flex-row items-center justify-between pb-3 border-b border-border/60">
              <View>
                <Text className="text-caption text-ink-muted font-medium">
                  Total Paid Fees
                </Text>
                <Text className="text-h3 font-extrabold text-emerald-600">
                  {formatINR(summary.totalPaidPaise)}
                </Text>
              </View>
              <View className="items-end">
                <Text className="text-caption text-ink-muted font-medium">
                  Pending Dues
                </Text>
                <Text
                  className={`text-h3 font-extrabold ${
                    summary.pendingAmountPaise > 0
                      ? "text-primary"
                      : "text-ink-muted"
                  }`}
                >
                  {formatINR(summary.pendingAmountPaise)}
                </Text>
              </View>
            </View>

            {/* Google Play Consumption-Only Compliance Notice */}
            {!inAppPaymentsEnabled && pendingDues.length > 0 && (
              <View className="mt-3 p-3 bg-blue-50/70 border border-blue-200/60 rounded-xl flex-row items-start space-x-2.5">
                <Building size={18} color="#2563EB" className="mt-0.5" />
                <View className="flex-1 ml-2">
                  <Text className="text-caption font-bold text-ink">
                    Pay at the Centre or on Our Website
                  </Text>
                  <Text className="text-caption text-ink-muted mt-0.5 leading-relaxed">
                    Tuition fees can be deposited directly at our coaching center or online at quick2learn.in.
                  </Text>
                </View>
              </View>
            )}
          </View>
        ) : null}

        {/* Loading State */}
        {isLoading && (
          <View className="py-12 items-center justify-center">
            <ActivityIndicator size="large" color="#2563EB" />
            <Text className="text-caption text-ink-muted mt-3">
              {t("loading")}
            </Text>
          </View>
        )}

        {/* TAB 1: PENDING DUES */}
        {!isLoading && activeTab === "dues" && (
          <View className="space-y-3">
            {pendingDues.length === 0 ? (
              <View className="bg-emerald-50/60 border border-emerald-200/80 rounded-2xl p-6 items-center text-center my-6">
                <View className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 items-center justify-center mb-3">
                  <CheckCircle2 size={26} color="#059669" />
                </View>
                <Text className="text-h3 font-bold text-ink text-center mb-1">
                  {t("allCleared")}
                </Text>
                <Text className="text-caption text-ink-muted text-center max-w-xs leading-relaxed">
                  {t("allClearedDesc")}
                </Text>
              </View>
            ) : (
              pendingDues.map((due) => {
                const dueDateFormatted = new Date(due.dueDate).toLocaleDateString(
                  "en-IN",
                  {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    timeZone: "Asia/Kolkata",
                  }
                );

                return (
                  <View
                    key={due.id}
                    className="bg-surface rounded-2xl p-4 border border-border shadow-sm space-y-3"
                  >
                    <View className="flex-row items-start justify-between">
                      <View className="flex-1 mr-2">
                        <Text className="text-body font-bold text-ink">
                          {due.batchTitle}
                        </Text>
                        <Text className="text-caption text-ink-muted mt-0.5">
                          Instalment: {due.installmentName}
                        </Text>
                      </View>
                      <Badge label="DUE" variant="warning" size="sm" />
                    </View>

                    <View className="flex-row items-center justify-between pt-2 border-t border-border/60">
                      <View className="flex-row items-center">
                        <Calendar size={15} color="#6B7280" />
                        <Text className="text-caption text-ink-muted ml-1.5">
                          Due: {dueDateFormatted}
                        </Text>
                      </View>
                      <Text className="text-h3 font-extrabold text-ink">
                        {formatINR(due.amountPaise)}
                      </Text>
                    </View>

                    {/* Action: Pay button ONLY if inAppPayments feature flag is ON */}
                    {inAppPaymentsEnabled ? (
                      <View className="pt-1">
                        <Button
                          variant="primary"
                          size="md"
                          loading={processingDueId === due.id}
                          onPress={() => handlePayDue(due.id, due.amountPaise)}
                          icon={<CreditCard size={16} color="#FFFFFF" />}
                        >
                          {t("payButton")} {formatINR(due.amountPaise)}
                        </Button>
                      </View>
                    ) : (
                      <View className="bg-surface-subtle p-2.5 rounded-xl border border-border/50 flex-row items-center justify-between">
                        <Text className="text-caption font-semibold text-ink-muted">
                          {t("payAtCentreNotice")}
                        </Text>
                        <ShieldCheck size={16} color="#059669" />
                      </View>
                    )}
                  </View>
                );
              })
            )}
          </View>
        )}

        {/* TAB 2: PAYMENT HISTORY & RECEIPTS */}
        {!isLoading && activeTab === "history" && (
          <View className="space-y-3">
            {paymentHistory.length === 0 ? (
              <View className="bg-surface rounded-2xl p-8 border border-border items-center justify-center my-6">
                <Receipt size={32} color="#9CA3AF" className="mb-2" />
                <Text className="text-body font-semibold text-ink-muted">
                  {t("noPaymentsYet")}
                </Text>
              </View>
            ) : (
              paymentHistory.map((item) => {
                const paidDateFormatted = item.paidAt
                  ? new Date(item.paidAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      timeZone: "Asia/Kolkata",
                    })
                  : new Date(item.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      timeZone: "Asia/Kolkata",
                    });

                const isPaid = item.status === "paid";

                return (
                  <View
                    key={item.id}
                    className="bg-surface rounded-2xl p-4 border border-border shadow-sm space-y-3"
                  >
                    <View className="flex-row items-start justify-between">
                      <View className="flex-1 mr-2">
                        <Text className="text-body font-bold text-ink">
                          {item.batchTitle}
                        </Text>
                        {item.receiptNo ? (
                          <Text className="text-caption font-mono font-semibold text-primary mt-0.5">
                            {item.receiptNo}
                          </Text>
                        ) : null}
                      </View>
                      <Badge
                        label={item.status.toUpperCase()}
                        variant={isPaid ? "success" : "neutral"}
                        size="sm"
                      />
                    </View>

                    <View className="flex-row items-center justify-between pt-2 border-t border-border/60">
                      <Text className="text-caption text-ink-muted">
                        Paid on {paidDateFormatted} • {item.method.replace("_", " ").toUpperCase()}
                      </Text>
                      <Text className="text-body-lg font-bold text-ink">
                        {formatINR(item.amountPaise)}
                      </Text>
                    </View>

                    {/* Official Receipt Buttons */}
                    {isPaid && item.receiptPdfUrl ? (
                      <View className="flex-row items-center space-x-2 pt-1">
                        <TouchableOpacity
                          activeOpacity={0.7}
                          onPress={() =>
                            handleOpenReceiptPdf(item.id, item.receiptNo)
                          }
                          className="flex-1 py-2.5 px-3 rounded-xl bg-primary-soft/60 border border-primary/20 flex-row items-center justify-center min-h-[44px]"
                        >
                          <FileText size={16} color="#2563EB" />
                          <Text className="text-small font-bold text-primary ml-1.5">
                            {t("downloadReceipt")}
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          activeOpacity={0.7}
                          onPress={() =>
                            handleShareReceipt(item.id, item.receiptNo)
                          }
                          className="py-2.5 px-3.5 rounded-xl bg-surface-subtle border border-border items-center justify-center min-h-[44px] ml-2"
                        >
                          <Share2 size={16} color="#4B5563" />
                        </TouchableOpacity>
                      </View>
                    ) : null}
                  </View>
                );
              })
            )}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}
