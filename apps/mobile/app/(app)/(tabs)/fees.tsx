import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Share,
  ActivityIndicator,
} from "react-native";
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
import { Screen } from "../../../src/components/ui/Screen";
import { AppHeader } from "../../../src/components/ui/AppHeader";
import { Card } from "../../../src/components/ui/Card";
import { Badge } from "../../../src/components/ui/Badge";
import { ChildSwitcher } from "../../../src/components/parent/ChildSwitcher";
import { useFees, useMe, useParentStudents } from "../../../src/api/hooks";
import { useParentStore } from "../../../src/lib/parentStore";
import { baseURL } from "../../../src/api/auth-client";
import { formatINR } from "@quick2learn/shared";

export default function ParentFeesTab() {
  const { selectedChildId } = useParentStore();
  const { data: me } = useMe();
  const { data: parentStudentsData } = useParentStudents();
  const linkedStudents = parentStudentsData?.students || me?.linkedStudents || [];
  const currentChild = linkedStudents.find(
    (c: any) => c.id === (selectedChildId || linkedStudents[0]?.id)
  );
  const childName = currentChild?.fullName || "Child";

  const { data: feesData, isLoading, isRefetching, refetch } = useFees(
    selectedChildId || undefined
  );

  const [activeTab, setActiveTab] = useState<"dues" | "history">("dues");

  const dues = feesData?.dues || [];
  const paymentHistory = feesData?.paymentHistory || [];
  const summary = feesData?.summary;

  const handleShareReceipt = async (paymentId: string, receiptNo: string | null) => {
    try {
      const pdfUrl = `${baseURL}/api/v1/payments/${paymentId}/receipt-pdf`;
      await Share.share({
        title: `Quick2Learn Fee Receipt ${receiptNo || ""}`,
        message: `Official Fee Receipt for ${childName}: ${receiptNo || paymentId}\nDownload PDF: ${pdfUrl}`,
        url: pdfUrl,
      });
    } catch (err) {
      console.error("Error sharing receipt:", err);
    }
  };

  return (
    <Screen
      scrollable={false}
      header={<AppHeader title={`${childName}'s Fees & Receipts`} />}
    >
      <ChildSwitcher />

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
        {/* Financial Summary Card */}
        <View className="bg-white rounded-2xl p-5 border border-border shadow-xs mb-4">
          <View className="flex-row items-center justify-between pb-3 border-b border-border/60">
            <Text className="text-caption font-bold text-ink-muted uppercase tracking-wider">
              Fee Ledger Overview
            </Text>
            <View className="flex-row items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200">
              <ShieldCheck size={12} color="#059669" />
              <Text className="text-[11px] font-bold text-emerald-700">Verified</Text>
            </View>
          </View>

          <View className="grid grid-cols-2 gap-4 mt-3.5">
            <View>
              <Text className="text-body-xs text-ink-muted">Total Paid</Text>
              <Text className="text-display-xs font-bold text-emerald-600 mt-1">
                {formatINR(summary?.totalPaidPaise || 0)}
              </Text>
              <Text className="text-[10px] text-ink-muted mt-0.5">
                {paymentHistory.length} receipts issued
              </Text>
            </View>

            <View>
              <Text className="text-body-xs text-ink-muted">Outstanding Dues</Text>
              <Text
                className={`text-display-xs font-bold mt-1 ${
                  (summary?.pendingDuesCount || 0) > 0 ? "text-amber-600" : "text-ink"
                }`}
              >
                {formatINR(summary?.pendingAmountPaise || 0)}
              </Text>
              <Text className="text-[10px] text-ink-muted mt-0.5">
                {summary?.pendingDuesCount || 0} pending instalments
              </Text>
            </View>
          </View>
        </View>

        {/* Offline Center Payment Policy Notice */}
        <View className="p-4 rounded-2xl bg-surface-subtle border border-border mb-4 flex-row items-start gap-3">
          <Building size={20} color="#2563EB" className="shrink-0 mt-0.5" />
          <View className="flex-1">
            <Text className="text-body-sm font-bold text-ink">
              Fee Payment Information
            </Text>
            <Text className="text-body-xs text-ink-muted mt-1 leading-relaxed">
              Please pay classroom tuition at the Quick2Learn centre desk or through our website portal. Official serialised receipts are issued instantly for all transactions.
            </Text>
            <Text className="text-[11px] text-primary font-semibold mt-1.5">
              Center: Near Goverdhan Crossing, Mathura • 9412277888
            </Text>
          </View>
        </View>

        {/* Tabs: Pending Dues vs History */}
        <View className="flex-row bg-surface-subtle p-1 rounded-xl mb-4 border border-border">
          <TouchableOpacity
            onPress={() => setActiveTab("dues")}
            className={`flex-1 py-2 rounded-lg items-center ${
              activeTab === "dues" ? "bg-white shadow-xs" : ""
            }`}
          >
            <Text
              className={`text-body-sm font-semibold ${
                activeTab === "dues" ? "text-primary" : "text-ink-muted"
              }`}
            >
              Pending Dues ({dues.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab("history")}
            className={`flex-1 py-2 rounded-lg items-center ${
              activeTab === "history" ? "bg-white shadow-xs" : ""
            }`}
          >
            <Text
              className={`text-body-sm font-semibold ${
                activeTab === "history" ? "text-primary" : "text-ink-muted"
              }`}
            >
              Receipts History ({paymentHistory.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content: Dues */}
        {activeTab === "dues" && (
          <View className="space-y-3">
            {dues.length === 0 ? (
              <View className="bg-white rounded-2xl p-8 border border-border items-center justify-center">
                <CheckCircle2 size={36} color="#059669" />
                <Text className="text-body font-bold text-ink mt-3">All Clear!</Text>
                <Text className="text-body-xs text-ink-muted text-center mt-1">
                  No pending fee dues for {childName}.
                </Text>
              </View>
            ) : (
              dues.map((due) => (
                <View
                  key={due.id}
                  className="bg-white rounded-2xl p-4 border border-border shadow-xs"
                >
                  <View className="flex-row items-start justify-between gap-2">
                    <View className="flex-1">
                      <Text className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-surface-subtle text-ink-muted">
                        {due.batchTitle}
                      </Text>
                      <Text className="text-body font-bold text-ink mt-1">
                        {due.installmentName || due.batchTitle}
                      </Text>
                      <View className="flex-row items-center gap-1.5 mt-1">
                        <Calendar size={13} color="#6B7280" />
                        <Text className="text-body-xs text-ink-muted">
                          Due Date: {due.dueDate}
                        </Text>
                      </View>
                    </View>

                    <View className="items-end">
                      <Text className="text-body-lg font-bold text-amber-700 font-mono">
                        {formatINR(due.amountPaise)}
                      </Text>
                      <View className="mt-1 px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200">
                        <Text className="text-[10px] font-bold text-amber-700 uppercase">
                          {due.status}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* Content: History */}
        {activeTab === "history" && (
          <View className="space-y-3">
            {paymentHistory.length === 0 ? (
              <View className="bg-white rounded-2xl p-8 border border-border items-center justify-center">
                <Receipt size={36} color="#9CA3AF" />
                <Text className="text-body font-bold text-ink mt-3">No Payment Receipts</Text>
                <Text className="text-body-xs text-ink-muted text-center mt-1">
                  Payment receipts will appear here as soon as payments are recorded.
                </Text>
              </View>
            ) : (
              paymentHistory.map((item) => (
                <View
                  key={item.id}
                  className="bg-white rounded-2xl p-4 border border-border shadow-xs"
                >
                  <View className="flex-row items-start justify-between gap-2">
                    <View className="flex-1">
                      <View className="flex-row items-center gap-2">
                        <Text className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-50 text-emerald-700">
                          {item.receiptNo || "Paid"}
                        </Text>
                        <Text className="text-[10px] font-medium px-2 py-0.5 rounded bg-surface-subtle text-ink-muted">
                          {item.method === "razorpay"
                            ? "Online"
                            : item.method === "cash"
                            ? "Cash Desk"
                            : "UPI"}
                        </Text>
                      </View>

                      <Text className="text-body font-bold text-ink mt-1.5">
                        {item.batchTitle}
                      </Text>
                      <Text className="text-body-xs text-ink-muted mt-0.5">
                        Paid on{" "}
                        {item.paidAt
                          ? new Date(item.paidAt).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })
                          : "Verified"}
                      </Text>
                    </View>

                    <View className="items-end">
                      <Text className="text-body-md font-bold text-emerald-700 font-mono">
                        {formatINR(item.amountPaise)}
                      </Text>
                    </View>
                  </View>

                  {/* Share / Download PDF Receipt Action */}
                  <View className="mt-3 pt-3 border-t border-border/60 flex-row items-center justify-between">
                    <Text className="text-[11px] text-ink-muted">Official serialized receipt</Text>
                    <TouchableOpacity
                      onPress={() => handleShareReceipt(item.id, item.receiptNo || null)}
                      className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 active:bg-primary/20"
                    >
                      <Share2 size={13} color="#2563EB" />
                      <Text className="text-body-xs font-bold text-primary">
                        View & Share PDF
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}
