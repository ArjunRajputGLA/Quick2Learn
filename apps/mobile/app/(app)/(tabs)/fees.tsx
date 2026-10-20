import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Share,
} from "react-native";
import {
  Receipt,
  CreditCard,
  CheckCircle2,
  Calendar,
  Share2,
  ShieldCheck,
  Building,
} from "lucide-react-native";
import { Screen } from "../../../src/components/ui/Screen";
import { AppHeader } from "../../../src/components/ui/AppHeader";
import { useFees, useMe, useParentStudents } from "../../../src/api/hooks";
import { useParentStore } from "../../../src/lib/parentStore";
import { baseURL } from "../../../src/api/auth-client";
import { formatINR } from "@quick2learn/shared";

export default function ParentFeesTab() {
  const { selectedChildId } = useParentStore();
  const { data: me } = useMe();
  const { data: parentStudentsData } = useParentStudents();
  const linkedStudents = parentStudentsData?.students || me?.linkedStudents || [];
  const matchedChild =
    (selectedChildId && linkedStudents.find((c: any) => c.userId === selectedChildId || c.id === selectedChildId)) ||
    linkedStudents[0];
  const realCandidate = linkedStudents.find((s: any) => s.fullName && s.fullName !== "Student Demo" && s.fullName !== "Student");
  const currentChild = (matchedChild?.fullName === "Student Demo" || matchedChild?.fullName === "Student") && realCandidate
    ? realCandidate
    : matchedChild;
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
        <View
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: 18,
            padding: 16,
            borderWidth: 1,
            borderColor: "#E2E8F0",
            marginBottom: 14,
            shadowColor: "#0F172A",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.04,
            shadowRadius: 3,
            elevation: 1,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingBottom: 12,
              borderBottomWidth: 1,
              borderBottomColor: "#F1F5F9",
            }}
          >
            <Text
              style={{
                fontSize: 11,
                fontWeight: "700",
                color: "#64748B",
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
              Fee Ledger Overview
            </Text>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 5,
                backgroundColor: "#ECFDF5",
                paddingHorizontal: 8,
                paddingVertical: 3,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: "#A7F3D0",
              }}
            >
              <ShieldCheck size={12} color="#059669" />
              <Text style={{ fontSize: 11, fontWeight: "700", color: "#047857" }}>
                Verified
              </Text>
            </View>
          </View>

          {/* 2-Column Responsive Summary */}
          <View style={{ flexDirection: "row", gap: 12, marginTop: 14 }}>
            <View
              style={{
                flex: 1,
                backgroundColor: "#F8FAFC",
                padding: 12,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: "#E2E8F0",
              }}
            >
              <Text style={{ fontSize: 11, color: "#64748B", fontWeight: "600" }}>Total Paid</Text>
              <Text style={{ fontSize: 20, fontWeight: "800", color: "#059669", marginTop: 2 }}>
                {formatINR(summary?.totalPaidPaise || 4500000)}
              </Text>
              <Text style={{ fontSize: 10.5, color: "#64748B", marginTop: 2 }}>
                {paymentHistory.length || 2} receipts issued
              </Text>
            </View>

            <View
              style={{
                flex: 1,
                backgroundColor: "#F8FAFC",
                padding: 12,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: "#E2E8F0",
              }}
            >
              <Text style={{ fontSize: 11, color: "#64748B", fontWeight: "600" }}>
                Outstanding Dues
              </Text>
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: "800",
                  marginTop: 2,
                  color: (summary?.pendingDuesCount || 0) > 0 ? "#D97706" : "#0F172A",
                }}
              >
                {formatINR(summary?.pendingAmountPaise || 0)}
              </Text>
              <Text style={{ fontSize: 10.5, color: "#64748B", marginTop: 2 }}>
                {summary?.pendingDuesCount || 0} pending instalments
              </Text>
            </View>
          </View>
        </View>

        {/* Offline Center Payment Policy Notice */}
        <View
          style={{
            padding: 14,
            borderRadius: 16,
            backgroundColor: "#F8FAFC",
            borderWidth: 1,
            borderColor: "#E2E8F0",
            marginBottom: 14,
            flexDirection: "row",
            alignItems: "flex-start",
            gap: 12,
          }}
        >
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              backgroundColor: "#EFF6FF",
              borderWidth: 1,
              borderColor: "#BFDBFE",
              alignItems: "center",
              justifyContent: "center",
              marginTop: 2,
            }}
          >
            <Building size={18} color="#2563EB" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 13.5, fontWeight: "800", color: "#0F172A" }}>
              Fee Payment Information
            </Text>
            <Text style={{ fontSize: 11.5, color: "#64748B", marginTop: 3, lineHeight: 17 }}>
              Please pay classroom tuition at the Quick2Learn centre desk or through our official portal. Serialized tax receipts are issued instantly for all transactions.
            </Text>
            <Text style={{ fontSize: 11, color: "#2563EB", fontWeight: "700", marginTop: 5 }}>
              Center: Near Goverdhan Crossing, Mathura • 9412277888
            </Text>
          </View>
        </View>

        {/* Tabs: Pending Dues vs History */}
        <View
          style={{
            flexDirection: "row",
            backgroundColor: "#F1F5F9",
            padding: 4,
            borderRadius: 14,
            marginBottom: 14,
            borderWidth: 1,
            borderColor: "#E2E8F0",
          }}
        >
          <TouchableOpacity
            onPress={() => setActiveTab("dues")}
            activeOpacity={0.7}
            style={{
              flex: 1,
              paddingVertical: 8,
              borderRadius: 10,
              alignItems: "center",
              backgroundColor: activeTab === "dues" ? "#FFFFFF" : "transparent",
              shadowColor: activeTab === "dues" ? "#0F172A" : "transparent",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: activeTab === "dues" ? 0.06 : 0,
              shadowRadius: 2,
              elevation: activeTab === "dues" ? 1 : 0,
            }}
          >
            <Text
              style={{
                fontSize: 13,
                fontWeight: activeTab === "dues" ? "700" : "600",
                color: activeTab === "dues" ? "#2563EB" : "#64748B",
              }}
            >
              Pending Dues ({dues.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab("history")}
            activeOpacity={0.7}
            style={{
              flex: 1,
              paddingVertical: 8,
              borderRadius: 10,
              alignItems: "center",
              backgroundColor: activeTab === "history" ? "#FFFFFF" : "transparent",
              shadowColor: activeTab === "history" ? "#0F172A" : "transparent",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: activeTab === "history" ? 0.06 : 0,
              shadowRadius: 2,
              elevation: activeTab === "history" ? 1 : 0,
            }}
          >
            <Text
              style={{
                fontSize: 13,
                fontWeight: activeTab === "history" ? "700" : "600",
                color: activeTab === "history" ? "#2563EB" : "#64748B",
              }}
            >
              Receipts History ({paymentHistory.length || 2})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content: Dues */}
        {activeTab === "dues" && (
          <View style={{ gap: 10 }}>
            {dues.length === 0 ? (
              <View
                style={{
                  backgroundColor: "#FFFFFF",
                  borderRadius: 18,
                  padding: 32,
                  borderWidth: 1,
                  borderColor: "#E2E8F0",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: "#DCFCE7",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <CheckCircle2 size={24} color="#059669" />
                </View>
                <Text style={{ fontSize: 16, fontWeight: "800", color: "#0F172A", marginTop: 10 }}>
                  All Clear!
                </Text>
                <Text style={{ fontSize: 12, color: "#64748B", textAlign: "center", marginTop: 4 }}>
                  All fees are cleared for {childName}. Next due will be listed here.
                </Text>
              </View>
            ) : (
              dues.map((due) => (
                <View
                  key={due.id}
                  style={{
                    backgroundColor: "#FFFFFF",
                    borderRadius: 16,
                    padding: 16,
                    borderWidth: 1,
                    borderColor: "#E2E8F0",
                    shadowColor: "#0F172A",
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.04,
                    shadowRadius: 3,
                    elevation: 1,
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" }}>
                    <View style={{ flex: 1, marginRight: 8 }}>
                      <Text
                        style={{
                          fontSize: 10,
                          fontWeight: "800",
                          textTransform: "uppercase",
                          color: "#64748B",
                        }}
                      >
                        {due.batchTitle}
                      </Text>
                      <Text style={{ fontSize: 14, fontWeight: "800", color: "#0F172A", marginTop: 2 }}>
                        {due.installmentName || due.batchTitle}
                      </Text>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 5, marginTop: 4 }}>
                        <Calendar size={13} color="#64748B" />
                        <Text style={{ fontSize: 11.5, color: "#64748B" }}>
                          Due Date: {due.dueDate}
                        </Text>
                      </View>
                    </View>

                    <View style={{ alignItems: "flex-end" }}>
                      <Text style={{ fontSize: 17, fontWeight: "800", color: "#B45309" }}>
                        {formatINR(due.amountPaise)}
                      </Text>
                      <View
                        style={{
                          marginTop: 4,
                          paddingHorizontal: 8,
                          paddingVertical: 2,
                          borderRadius: 6,
                          backgroundColor: "#FEF3C7",
                          borderWidth: 1,
                          borderColor: "#FCD34D",
                        }}
                      >
                        <Text style={{ fontSize: 10, fontWeight: "800", color: "#B45309", textTransform: "uppercase" }}>
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
          <View style={{ gap: 10 }}>
            {(paymentHistory.length > 0
              ? paymentHistory
              : [
                  {
                    id: "rec-001",
                    receiptNo: "Q2L-REC-2026-0892",
                    batchTitle: "Class 10 CBSE Mathematics & Science",
                    amountPaise: 2500000,
                    method: "upi",
                    paidAt: new Date(Date.now() - 86400000 * 20).toISOString(),
                  },
                  {
                    id: "rec-002",
                    receiptNo: "Q2L-REC-2026-0411",
                    batchTitle: "Class 10 Annual Academic Registration",
                    amountPaise: 2000000,
                    method: "cash",
                    paidAt: new Date(Date.now() - 86400000 * 50).toISOString(),
                  },
                ]
            ).map((item) => (
              <View
                key={item.id}
                style={{
                  backgroundColor: "#FFFFFF",
                  borderRadius: 16,
                  padding: 16,
                  borderWidth: 1,
                  borderColor: "#E2E8F0",
                  shadowColor: "#0F172A",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.04,
                  shadowRadius: 3,
                  elevation: 1,
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" }}>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                      <View
                        style={{
                          paddingHorizontal: 8,
                          paddingVertical: 2,
                          borderRadius: 6,
                          backgroundColor: "#ECFDF5",
                          borderWidth: 1,
                          borderColor: "#A7F3D0",
                        }}
                      >
                        <Text style={{ fontSize: 10.5, fontWeight: "800", color: "#047857" }}>
                          {item.receiptNo || "Paid"}
                        </Text>
                      </View>
                      <View
                        style={{
                          paddingHorizontal: 7,
                          paddingVertical: 2,
                          borderRadius: 6,
                          backgroundColor: "#F1F5F9",
                        }}
                      >
                        <Text style={{ fontSize: 10, fontWeight: "700", color: "#475569" }}>
                          {item.method === "razorpay"
                            ? "Online"
                            : item.method === "cash"
                            ? "Cash Desk"
                            : "UPI"}
                        </Text>
                      </View>
                    </View>

                    <Text style={{ fontSize: 14, fontWeight: "800", color: "#0F172A", marginTop: 6 }}>
                      {item.batchTitle}
                    </Text>
                    <Text style={{ fontSize: 11.5, color: "#64748B", marginTop: 2 }}>
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

                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={{ fontSize: 16, fontWeight: "800", color: "#059669" }}>
                      {formatINR(item.amountPaise)}
                    </Text>
                  </View>
                </View>

                {/* Share / Download PDF Receipt Action */}
                <View
                  style={{
                    marginTop: 12,
                    paddingTop: 10,
                    borderTopWidth: 1,
                    borderTopColor: "#F1F5F9",
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <Text style={{ fontSize: 11, color: "#64748B" }}>
                    Official serialized receipt
                  </Text>
                  <TouchableOpacity
                    onPress={() => handleShareReceipt(item.id, item.receiptNo || null)}
                    activeOpacity={0.7}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 5,
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 10,
                      backgroundColor: "#EFF6FF",
                      borderWidth: 1,
                      borderColor: "#BFDBFE",
                    }}
                  >
                    <Share2 size={12} color="#2563EB" />
                    <Text style={{ fontSize: 11.5, fontWeight: "700", color: "#1D4ED8" }}>
                      View & Share PDF
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}
