import React, { useState, useMemo } from "react";
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
  TextInput,
  Modal,
  KeyboardAvoidingView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import * as Haptics from "expo-haptics";
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
  Search,
  Users,
  TrendingUp,
  IndianRupee,
  Clock,
  ChevronRight,
  Filter,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  PieChart,
  UserCheck,
  AlertTriangle,
  X,
  Check,
} from "lucide-react-native";
import { Screen } from "../../src/components/ui/Screen";
import { AppHeader } from "../../src/components/ui/AppHeader";
import { BookLoader } from "../../src/components/ui/BookLoader";
import { Button } from "../../src/components/ui/Button";
import { Card } from "../../src/components/ui/Card";
import { Badge } from "../../src/components/ui/Badge";
import { useFees, useAppConfig, useMe } from "../../src/api/hooks";
import { authClient, baseURL } from "../../src/api/auth-client";
import { useI18n } from "../../src/lib/i18n";
import { formatINR } from "@quick2learn/shared";
import {
  useAdminStore,
  type AdminPaymentItem,
  type AdminFeeDueItem,
  type AdminStudentItem,
  type BatchItem,
} from "../../src/lib/adminDataStore";


/* ─────────────────────────────────────────────
   Admin Fee Management Dashboard
   Uses the same data store as the Admin Portal's
   Fees tab for consistency.
   ───────────────────────────────────────────── */

function RecordOfflinePaymentModal({
  visible,
  onClose,
  prefillDue,
  students,
  batches,
  onRecord,
}: {
  visible: boolean;
  onClose: () => void;
  prefillDue: AdminFeeDueItem | null;
  students: AdminStudentItem[];
  batches: BatchItem[];
  onRecord: (pay: {
    studentId: string;
    batchTitle: string;
    amount: number;
    paymentMethod: "cash" | "upi" | "cheque" | "bank_transfer";
    notes?: string;
  }) => Promise<void>;
}) {
  const insets = useSafeAreaInsets();
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [batchTitle, setBatchTitle] = useState<string>("");
  const [amount, setAmount] = useState<string>("6000");
  const [method, setMethod] = useState<"cash" | "upi" | "cheque" | "bank_transfer">("cash");
  const [notes, setNotes] = useState<string>("Tuition fee instalment received at center desk");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [studentSearch, setStudentSearch] = useState<string>("");
  const [showStudentPicker, setShowStudentPicker] = useState<boolean>(false);

  // Sync state whenever modal opens or prefill changes
  React.useEffect(() => {
    if (visible) {
      if (prefillDue) {
        setSelectedStudentId(prefillDue.studentId);
        setBatchTitle(prefillDue.batchTitle);
        setAmount(String(prefillDue.amount));
        setMethod("cash");
        setNotes(`Tuition fee for ${prefillDue.batchTitle}`);
      } else {
        const firstStudent = students[0];
        setSelectedStudentId(firstStudent?.id || "");
        if (firstStudent?.enrolledBatchIds?.length && batches.length > 0) {
          const matchingBatch = batches.find((b) => firstStudent.enrolledBatchIds.includes(b.id));
          setBatchTitle(matchingBatch?.title || batches[0]?.title || "");
        } else {
          setBatchTitle(batches[0]?.title || "");
        }
        setAmount("6000");
        setMethod("cash");
        setNotes("Tuition fee instalment received at center desk");
      }
      setStudentSearch("");
      setShowStudentPicker(false);
    }
  }, [visible, prefillDue, students, batches]);

  const selectedStudent = useMemo(() => {
    return students.find((s) => s.id === selectedStudentId);
  }, [students, selectedStudentId]);

  const filteredStudents = useMemo(() => {
    if (!studentSearch.trim()) return students.slice(0, 10);
    const q = studentSearch.toLowerCase();
    return students.filter((s) => s.fullName.toLowerCase().includes(q) || s.phone.includes(q));
  }, [students, studentSearch]);

  const handleSelectStudent = (s: AdminStudentItem) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedStudentId(s.id);
    setShowStudentPicker(false);
    if (s.enrolledBatchIds?.length && batches.length > 0) {
      const mb = batches.find((b) => s.enrolledBatchIds.includes(b.id));
      if (mb) setBatchTitle(mb.title);
    }
  };

  const handleRecord = async () => {
    const numAmount = parseInt(amount, 10);
    if (isNaN(numAmount) || numAmount <= 0) {
      Alert.alert("Invalid Amount", "Please enter a valid payment amount greater than 0.");
      return;
    }
    if (!selectedStudentId) {
      Alert.alert("Select Student", "Please select an enrolled student to record fee payment.");
      return;
    }
    try {
      setSubmitting(true);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await onRecord({
        studentId: selectedStudentId,
        batchTitle: batchTitle || batches[0]?.title || "Tuition",
        amount: numAmount,
        paymentMethod: method,
        notes: notes.trim() || `Fee payment via ${method.toUpperCase()}`,
      });
      onClose();
    } catch (err: any) {
      Alert.alert("Error", err?.message || "Failed to record payment");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}
      >
        <View
          style={{
            backgroundColor: "#FFFFFF",
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            maxHeight: "92%",
            paddingTop: 12,
            paddingHorizontal: 18,
            paddingBottom: Math.max(insets.bottom, 16) + 12,
            shadowColor: "#000000",
            shadowOffset: { width: 0, height: -3 },
            shadowOpacity: 0.15,
            shadowRadius: 10,
            elevation: 10,
          }}
        >
          {/* Top Grab Handle */}
          <View
            style={{
              width: 38,
              height: 4,
              borderRadius: 2,
              backgroundColor: "#CBD5E1",
              alignSelf: "center",
              marginBottom: 12,
            }}
          />

          {/* Modal Header */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 14,
              paddingBottom: 10,
              borderBottomWidth: 1,
              borderBottomColor: "#F1F5F9",
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flex: 1 }}>
              <View
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 12,
                  backgroundColor: "#EEF2FF",
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 1,
                  borderColor: "#C7D2FE",
                }}
              >
                <CreditCard size={19} color="#4F46E5" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: "800", color: "#0F172A" }}>
                  Record Offline Fee Payment
                </Text>
                <Text style={{ fontSize: 11, color: "#64748B" }}>
                  Generate official tuition receipt & update ledger
                </Text>
              </View>
            </View>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onClose}
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

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingBottom: 16 }}>
            {/* Student Selector Card */}
            <View style={{ gap: 5 }}>
              <Text style={{ fontSize: 12, fontWeight: "700", color: "#334155" }}>
                Select Enrolled Student *
              </Text>
              {prefillDue ? (
                <View
                  style={{
                    backgroundColor: "#EEF2FF",
                    borderWidth: 1,
                    borderColor: "#C7D2FE",
                    borderRadius: 12,
                    padding: 12,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={{ fontSize: 13.5, fontWeight: "800", color: "#1E1B4B" }}>
                      {prefillDue.studentName}
                    </Text>
                    <Text style={{ fontSize: 11, color: "#4F46E5", marginTop: 2 }}>
                      {prefillDue.batchTitle} • Due: ₹{prefillDue.amount.toLocaleString("en-IN")}
                    </Text>
                  </View>
                  <Badge label="SELECTED" variant="success" size="sm" />
                </View>
              ) : (
                <>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => setShowStudentPicker(!showStudentPicker)}
                    style={{
                      backgroundColor: "#F8FAFC",
                      borderWidth: 1,
                      borderColor: "#CBD5E1",
                      borderRadius: 12,
                      padding: 12,
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <View style={{ flex: 1, marginRight: 8 }}>
                      <Text style={{ fontSize: 13.5, fontWeight: "700", color: selectedStudent ? "#0F172A" : "#94A3B8" }}>
                        {selectedStudent ? selectedStudent.fullName : "Choose a student..."}
                      </Text>
                      {selectedStudent && (
                        <Text style={{ fontSize: 11, color: "#64748B", marginTop: 1 }}>
                          Phone: {selectedStudent.phone} • Class {selectedStudent.classLevel} ({selectedStudent.board.toUpperCase()})
                        </Text>
                      )}
                    </View>
                    <ChevronRight size={16} color="#64748B" />
                  </TouchableOpacity>

                  {showStudentPicker && (
                    <View
                      style={{
                        backgroundColor: "#FFFFFF",
                        borderWidth: 1,
                        borderColor: "#E2E8F0",
                        borderRadius: 12,
                        padding: 10,
                        maxHeight: 180,
                        gap: 6,
                      }}
                    >
                      <TextInput
                        placeholder="Search student by name or phone..."
                        placeholderTextColor="#94A3B8"
                        value={studentSearch}
                        onChangeText={setStudentSearch}
                        style={{
                          backgroundColor: "#F1F5F9",
                          borderRadius: 8,
                          paddingHorizontal: 10,
                          paddingVertical: 6,
                          fontSize: 12,
                          color: "#0F172A",
                        }}
                      />
                      <ScrollView nestedScrollEnabled style={{ maxHeight: 120 }}>
                        {filteredStudents.map((st) => (
                          <TouchableOpacity
                            key={st.id}
                            onPress={() => handleSelectStudent(st)}
                            style={{
                              paddingVertical: 7,
                              paddingHorizontal: 8,
                              borderBottomWidth: 1,
                              borderBottomColor: "#F1F5F9",
                              flexDirection: "row",
                              alignItems: "center",
                              justifyContent: "space-between",
                            }}
                          >
                            <View style={{ flex: 1 }}>
                              <Text style={{ fontSize: 12.5, fontWeight: "700", color: "#0F172A" }}>
                                {st.fullName}
                              </Text>
                              <Text style={{ fontSize: 10.5, color: "#64748B" }}>
                                {st.phone} • Class {st.classLevel} ({st.board.toUpperCase()})
                              </Text>
                            </View>
                            {st.id === selectedStudentId && <Check size={14} color="#4F46E5" />}
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                </>
              )}
            </View>

            {/* Batch Selector */}
            <View style={{ gap: 5 }}>
              <Text style={{ fontSize: 12, fontWeight: "700", color: "#334155" }}>
                Batch for Payment *
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                {batches.map((b) => {
                  const isSelected = batchTitle === b.title;
                  return (
                    <TouchableOpacity
                      key={b.id}
                      activeOpacity={0.7}
                      onPress={() => setBatchTitle(b.title)}
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 7,
                        borderRadius: 10,
                        backgroundColor: isSelected ? "#4F46E5" : "#F1F5F9",
                        borderWidth: 1,
                        borderColor: isSelected ? "#4F46E5" : "#E2E8F0",
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 11.5,
                          fontWeight: "700",
                          color: isSelected ? "#FFFFFF" : "#475569",
                        }}
                      >
                        {b.title}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Amount Input */}
            <View style={{ gap: 5 }}>
              <Text style={{ fontSize: 12, fontWeight: "700", color: "#334155" }}>
                Tuition Amount (₹) *
              </Text>
              <TextInput
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
                style={{
                  backgroundColor: "#F8FAFC",
                  borderWidth: 1,
                  borderColor: "#CBD5E1",
                  borderRadius: 12,
                  paddingHorizontal: 12,
                  paddingVertical: Platform.OS === "ios" ? 11 : 9,
                  fontSize: 15,
                  fontWeight: "700",
                  color: "#0F172A",
                }}
              />
              {/* Quick Amount Chips */}
              <View style={{ flexDirection: "row", gap: 6, marginTop: 2 }}>
                {["2500", "4000", "6000", "8000", "12000"].map((quickAmt) => (
                  <TouchableOpacity
                    key={quickAmt}
                    onPress={() => setAmount(quickAmt)}
                    style={{
                      flex: 1,
                      paddingVertical: 5,
                      borderRadius: 8,
                      backgroundColor: amount === quickAmt ? "#EEF2FF" : "#F1F5F9",
                      borderWidth: 1,
                      borderColor: amount === quickAmt ? "#C7D2FE" : "#E2E8F0",
                      alignItems: "center",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 10.5,
                        fontWeight: "700",
                        color: amount === quickAmt ? "#4F46E5" : "#64748B",
                      }}
                    >
                      ₹{parseInt(quickAmt, 10).toLocaleString("en-IN")}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Payment Method */}
            <View style={{ gap: 5 }}>
              <Text style={{ fontSize: 12, fontWeight: "700", color: "#334155" }}>
                Payment Mode *
              </Text>
              <View style={{ flexDirection: "row", gap: 6 }}>
                {(["cash", "upi", "cheque", "bank_transfer"] as const).map((m) => {
                  const isSelected = method === m;
                  return (
                    <TouchableOpacity
                      key={m}
                      activeOpacity={0.75}
                      onPress={() => {
                        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setMethod(m);
                      }}
                      style={{
                        flex: 1,
                        paddingVertical: 9,
                        borderRadius: 10,
                        backgroundColor: isSelected ? "#4F46E5" : "#FFFFFF",
                        borderWidth: 1.5,
                        borderColor: isSelected ? "#4338CA" : "#E2E8F0",
                        alignItems: "center",
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 11,
                          fontWeight: "800",
                          color: isSelected ? "#FFFFFF" : "#475569",
                        }}
                      >
                        {m === "bank_transfer" ? "NEFT" : m.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Notes Input */}
            <View style={{ gap: 5 }}>
              <Text style={{ fontSize: 12, fontWeight: "700", color: "#334155" }}>
                Notes & Reference
              </Text>
              <TextInput
                value={notes}
                onChangeText={setNotes}
                placeholder="Cash receipt details or reference..."
                placeholderTextColor="#94A3B8"
                style={{
                  backgroundColor: "#F8FAFC",
                  borderWidth: 1,
                  borderColor: "#CBD5E1",
                  borderRadius: 12,
                  paddingHorizontal: 12,
                  paddingVertical: Platform.OS === "ios" ? 11 : 9,
                  fontSize: 13,
                  color: "#0F172A",
                }}
              />
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              activeOpacity={0.8}
              disabled={submitting}
              onPress={handleRecord}
              style={{
                backgroundColor: "#4F46E5",
                paddingVertical: 13,
                borderRadius: 14,
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "row",
                gap: 6,
                elevation: 3,
                marginTop: 6,
              }}
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <CreditCard size={16} color="#FFFFFF" />
                  <Text style={{ fontSize: 14, fontWeight: "800", color: "#FFFFFF" }}>
                    Issue Official Receipt
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function AdminFeesDashboard() {
  const router = useRouter();
  const store = useAdminStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [adminTab, setAdminTab] = useState<"overview" | "transactions" | "pending">("overview");
  const [filterMethod, setFilterMethod] = useState<string | null>(null);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [prefillDue, setPrefillDue] = useState<AdminFeeDueItem | null>(null);

  // Compute real totals from the store — same source as Admin Portal
  const totalCollections = useMemo(
    () => store.payments.reduce((acc: number, p: AdminPaymentItem) => acc + p.amount, 0),
    [store.payments]
  );
  const totalOverdue = useMemo(
    () =>
      store.feeDues
        .filter((d: AdminFeeDueItem) => d.status === "overdue")
        .reduce((acc: number, d: AdminFeeDueItem) => acc + d.amount, 0),
    [store.feeDues]
  );
  const totalPending = useMemo(
    () => store.feeDues.reduce((acc: number, d: AdminFeeDueItem) => acc + d.amount, 0),
    [store.feeDues]
  );
  const overdueDuesCount = useMemo(
    () => store.feeDues.filter((d: AdminFeeDueItem) => d.status === "overdue").length,
    [store.feeDues]
  );
  const collectionRate =
    totalCollections + totalPending > 0
      ? Math.round((totalCollections / (totalCollections + totalPending)) * 100)
      : 100;

  const filteredTransactions = useMemo(() => {
    let items = store.payments as AdminPaymentItem[];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter(
        (t) =>
          t.studentName.toLowerCase().includes(q) ||
          t.receiptNo.toLowerCase().includes(q) ||
          t.batchTitle.toLowerCase().includes(q)
      );
    }
    if (filterMethod) {
      items = items.filter((t) => t.paymentMethod === filterMethod);
    }
    return items;
  }, [searchQuery, filterMethod, store.payments]);

  const filteredPending = useMemo(() => {
    const dues = store.feeDues as AdminFeeDueItem[];
    if (!searchQuery.trim()) return dues;
    const q = searchQuery.toLowerCase();
    return dues.filter(
      (s) => s.studentName.toLowerCase().includes(q) || s.batchTitle.toLowerCase().includes(q)
    );
  }, [searchQuery, store.feeDues]);

  const formatMethod = (method: string) => {
    switch (method) {
      case "upi": return "UPI";
      case "cash": return "Cash";
      case "bank_transfer": return "NEFT";
      case "razorpay": return "Online";
      case "cheque": return "Cheque";
      default: return method.toUpperCase();
    }
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case "upi": return { bg: "#EEF2FF", text: "#4F46E5", border: "#C7D2FE" };
      case "cash": return { bg: "#FEF3C7", text: "#92400E", border: "#FCD34D" };
      case "bank_transfer": return { bg: "#ECFDF5", text: "#065F46", border: "#A7F3D0" };
      case "razorpay": return { bg: "#EFF6FF", text: "#1D4ED8", border: "#BFDBFE" };
      default: return { bg: "#F1F5F9", text: "#475569", border: "#CBD5E1" };
    }
  };

  const handleOpenRecordFee = (due?: AdminFeeDueItem) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPrefillDue(due || null);
    setPaymentModalVisible(true);
  };

  const handleRecordPayment = async (payInput: {
    studentId: string;
    batchTitle: string;
    amount: number;
    paymentMethod: "cash" | "upi" | "cheque" | "bank_transfer";
    notes?: string;
  }) => {
    const rec = await store.recordOfflinePayment(payInput);
    Alert.alert(
      "Receipt Issued",
      `Official receipt #${rec.receiptNo} of ₹${rec.amount.toLocaleString("en-IN")} recorded successfully.`
    );
    setAdminTab("transactions");
  };

  return (
    <Screen
      scrollable={false}
      header={
        <AppHeader
          title="Fee Management"
          showBack
          showNotificationBell={false}
          rightActions={
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => handleOpenRecordFee()}
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: "#4F46E5",
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 10,
                gap: 4,
              }}
            >
              <Plus size={14} color="#FFFFFF" />
              <Text style={{ fontSize: 12, fontWeight: "800", color: "#FFFFFF" }}>Record</Text>
            </TouchableOpacity>
          }
        />
      }
    >
      {/* Admin Tabs — identical indigo accent as Admin Portal */}
      <View
        style={{
          flexDirection: "row",
          paddingHorizontal: 12,
          paddingVertical: 8,
          backgroundColor: "#FFFFFF",
          borderBottomWidth: 1,
          borderBottomColor: "#E2E8F0",
          gap: 6,
        }}
      >
        {(
          [
            { key: "overview", label: "Overview", icon: PieChart },
            { key: "transactions", label: `Receipts (${store.payments.length})`, icon: Receipt },
            { key: "pending", label: `Dues (${store.feeDues.length})`, icon: AlertTriangle },
          ] as const
        ).map((tab) => {
          const isActive = adminTab === tab.key;
          const Icon = tab.icon;
          return (
            <TouchableOpacity
              key={tab.key}
              activeOpacity={0.7}
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setAdminTab(tab.key);
              }}
              style={{
                flex: 1,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                paddingVertical: 9,
                borderRadius: 10,
                backgroundColor: isActive ? "#4F46E5" : "#F1F5F9",
                gap: 5,
              }}
            >
              <Icon size={14} color={isActive ? "#FFFFFF" : "#64748B"} />
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "700",
                  color: isActive ? "#FFFFFF" : "#64748B",
                }}
                numberOfLines={1}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 14, paddingBottom: 40 }}
      >
        {/* ────── OVERVIEW TAB ────── */}
        {adminTab === "overview" && (
          <View style={{ gap: 12 }}>
            {/* Headline Stats Cards */}
            <View style={{ flexDirection: "row", gap: 10 }}>
              <View
                style={{
                  flex: 1,
                  backgroundColor: "#FFFFFF",
                  borderRadius: 16,
                  padding: 14,
                  borderWidth: 1,
                  borderColor: "#E2E8F0",
                }}
              >
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 10,
                    backgroundColor: "#ECFDF5",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 8,
                  }}
                >
                  <TrendingUp size={16} color="#16A34A" />
                </View>
                <Text style={{ fontSize: 10, fontWeight: "600", color: "#64748B", textTransform: "uppercase", letterSpacing: 0.3 }}>
                  Total Collected
                </Text>
                <Text style={{ fontSize: 20, fontWeight: "800", color: "#16A34A", marginTop: 2 }}>
                  ₹{totalCollections.toLocaleString("en-IN")}
                </Text>
                <Text style={{ fontSize: 10, color: "#94A3B8", marginTop: 4 }}>
                  {store.payments.length} receipts issued
                </Text>
              </View>

              <View
                style={{
                  flex: 1,
                  backgroundColor: "#FFFFFF",
                  borderRadius: 16,
                  padding: 14,
                  borderWidth: 1,
                  borderColor: overdueDuesCount > 0 ? "#FEE2E2" : "#E2E8F0",
                }}
              >
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 10,
                    backgroundColor: overdueDuesCount > 0 ? "#FEE2E2" : "#FEF3C7",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 8,
                  }}
                >
                  <AlertTriangle size={16} color={overdueDuesCount > 0 ? "#DC2626" : "#D97706"} />
                </View>
                <Text style={{ fontSize: 10, fontWeight: "600", color: "#64748B", textTransform: "uppercase", letterSpacing: 0.3 }}>
                  {overdueDuesCount > 0 ? "Overdue Dues" : "Pending Dues"}
                </Text>
                <Text style={{ fontSize: 20, fontWeight: "800", color: overdueDuesCount > 0 ? "#DC2626" : "#D97706", marginTop: 2 }}>
                  ₹{(overdueDuesCount > 0 ? totalOverdue : totalPending).toLocaleString("en-IN")}
                </Text>
                <Text style={{ fontSize: 10, color: "#94A3B8", marginTop: 4 }}>
                  {store.feeDues.length} students
                </Text>
              </View>
            </View>

            {/* Collection Rate Progress Bar */}
            <View
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: 16,
                padding: 16,
                borderWidth: 1,
                borderColor: "#E2E8F0",
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <Text style={{ fontSize: 13, fontWeight: "700", color: "#0F172A" }}>
                  Collection Progress
                </Text>
                <Text style={{ fontSize: 12, fontWeight: "800", color: "#4F46E5" }}>
                  {collectionRate}%
                </Text>
              </View>
              <View style={{ height: 8, backgroundColor: "#F1F5F9", borderRadius: 4, overflow: "hidden" }}>
                <View
                  style={{
                    height: "100%",
                    width: `${collectionRate}%`,
                    backgroundColor: "#4F46E5",
                    borderRadius: 4,
                  }}
                />
              </View>
              <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 8 }}>
                <Text style={{ fontSize: 10, color: "#94A3B8" }}>
                  Collected: ₹{totalCollections.toLocaleString("en-IN")}
                </Text>
                <Text style={{ fontSize: 10, color: "#94A3B8" }}>
                  Pending: ₹{totalPending.toLocaleString("en-IN")}
                </Text>
              </View>
            </View>

            {/* Quick Actions */}
            <View
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: 16,
                padding: 14,
                borderWidth: 1,
                borderColor: "#E2E8F0",
              }}
            >
              <Text style={{ fontSize: 11, fontWeight: "700", color: "#64748B", textTransform: "uppercase", letterSpacing: 0.3, marginBottom: 10 }}>
                Quick Actions
              </Text>
              <View style={{ flexDirection: "row", gap: 8 }}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => handleOpenRecordFee()}
                  style={{
                    flex: 1,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    paddingVertical: 11,
                    borderRadius: 12,
                    backgroundColor: "#4F46E5",
                  }}
                >
                  <Plus size={15} color="#FFFFFF" />
                  <Text style={{ fontSize: 12, fontWeight: "700", color: "#FFFFFF" }}>
                    Record Fee
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setAdminTab("transactions")}
                  style={{
                    flex: 1,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    paddingVertical: 11,
                    borderRadius: 12,
                    backgroundColor: "#F1F5F9",
                    borderWidth: 1,
                    borderColor: "#E2E8F0",
                  }}
                >
                  <Receipt size={15} color="#475569" />
                  <Text style={{ fontSize: 12, fontWeight: "700", color: "#475569" }}>
                    Receipts
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setAdminTab("pending")}
                  style={{
                    flex: 1,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    paddingVertical: 11,
                    borderRadius: 12,
                    backgroundColor: "#F1F5F9",
                    borderWidth: 1,
                    borderColor: "#E2E8F0",
                  }}
                >
                  <AlertTriangle size={15} color={overdueDuesCount > 0 ? "#DC2626" : "#D97706"} />
                  <Text style={{ fontSize: 12, fontWeight: "700", color: "#475569" }}>
                    Dues
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Recent Payments Preview */}
            <View
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: 16,
                padding: 14,
                borderWidth: 1,
                borderColor: "#E2E8F0",
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <Text style={{ fontSize: 11, fontWeight: "700", color: "#64748B", textTransform: "uppercase", letterSpacing: 0.3 }}>
                  Recent Payments
                </Text>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setAdminTab("transactions")}
                  style={{ flexDirection: "row", alignItems: "center", gap: 2 }}
                >
                  <Text style={{ fontSize: 11, fontWeight: "700", color: "#4F46E5" }}>
                    View All
                  </Text>
                  <ChevronRight size={13} color="#4F46E5" />
                </TouchableOpacity>
              </View>

              {store.payments.length === 0 ? (
                <Text style={{ fontSize: 12, color: "#94A3B8", textAlign: "center", paddingVertical: 16 }}>
                  No payments recorded yet.
                </Text>
              ) : (
                (store.payments as AdminPaymentItem[]).slice(0, 3).map((txn, index) => {
                  const methodColors = getMethodColor(txn.paymentMethod);
                  return (
                    <View
                      key={txn.id}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        paddingVertical: 10,
                        borderTopWidth: index > 0 ? 1 : 0,
                        borderTopColor: "#F1F5F9",
                        gap: 10,
                      }}
                    >
                      <View
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 10,
                          backgroundColor: "#F0FDF4",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <ArrowDownRight size={16} color="#16A34A" />
                      </View>
                      <View style={{ flex: 1, marginRight: 6 }}>
                        <Text style={{ fontSize: 13, fontWeight: "700", color: "#0F172A" }} numberOfLines={1}>
                          {txn.studentName}
                        </Text>
                        <Text style={{ fontSize: 10.5, color: "#94A3B8", marginTop: 1 }} numberOfLines={1}>
                          {txn.batchTitle}
                        </Text>
                      </View>
                      <View style={{ alignItems: "flex-end" }}>
                        <Text style={{ fontSize: 14, fontWeight: "800", color: "#16A34A" }}>
                          ₹{txn.amount.toLocaleString("en-IN")}
                        </Text>
                        <View
                          style={{
                            marginTop: 3,
                            paddingHorizontal: 6,
                            paddingVertical: 1,
                            borderRadius: 4,
                            backgroundColor: methodColors.bg,
                            borderWidth: 1,
                            borderColor: methodColors.border,
                          }}
                        >
                          <Text style={{ fontSize: 9, fontWeight: "700", color: methodColors.text }}>
                            {formatMethod(txn.paymentMethod)}
                          </Text>
                        </View>
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          </View>
        )}

        {/* ────── TRANSACTIONS TAB ────── */}
        {adminTab === "transactions" && (
          <View style={{ gap: 12 }}>
            {/* Search Bar */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: "#FFFFFF",
                borderRadius: 14,
                borderWidth: 1,
                borderColor: "#E2E8F0",
                paddingHorizontal: 12,
                gap: 8,
              }}
            >
              <Search size={16} color="#94A3B8" />
              <TextInput
                placeholder="Search student, receipt no, batch..."
                placeholderTextColor="#94A3B8"
                value={searchQuery}
                onChangeText={setSearchQuery}
                style={{
                  flex: 1,
                  fontSize: 13,
                  color: "#0F172A",
                  paddingVertical: Platform.OS === "ios" ? 12 : 10,
                }}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery("")} activeOpacity={0.7}>
                  <X size={16} color="#94A3B8" />
                </TouchableOpacity>
              )}
            </View>

            {/* Payment Method Filter Chips */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 6 }}
            >
              {[
                { key: null, label: "All" },
                { key: "upi", label: "UPI" },
                { key: "cash", label: "Cash" },
                { key: "bank_transfer", label: "NEFT" },
                { key: "razorpay", label: "Online" },
                { key: "cheque", label: "Cheque" },
              ].map((chip) => {
                const isActive = filterMethod === chip.key;
                return (
                  <TouchableOpacity
                    key={chip.label}
                    activeOpacity={0.7}
                    onPress={() => setFilterMethod(chip.key)}
                    style={{
                      paddingHorizontal: 14,
                      paddingVertical: 7,
                      borderRadius: 20,
                      backgroundColor: isActive ? "#4F46E5" : "#FFFFFF",
                      borderWidth: 1,
                      borderColor: isActive ? "#4F46E5" : "#E2E8F0",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: "700",
                        color: isActive ? "#FFFFFF" : "#64748B",
                      }}
                    >
                      {chip.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Transaction List — same card design as Admin Portal */}
            {filteredTransactions.length === 0 ? (
              <View
                style={{
                  backgroundColor: "#FFFFFF",
                  borderRadius: 16,
                  padding: 32,
                  borderWidth: 1,
                  borderColor: "#E2E8F0",
                  alignItems: "center",
                }}
              >
                <Receipt size={28} color="#CBD5E1" />
                <Text style={{ fontSize: 14, fontWeight: "700", color: "#64748B", marginTop: 8 }}>
                  No transactions found
                </Text>
                <Text style={{ fontSize: 12, color: "#94A3B8", marginTop: 2 }}>
                  {searchQuery ? "Try a different search or filter" : "Record offline or view online fee payments."}
                </Text>
              </View>
            ) : (
              filteredTransactions.map((txn) => {
                const paidDate = new Date(txn.paidAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                });
                return (
                  <View
                    key={txn.id}
                    style={{
                      backgroundColor: "#FFFFFF",
                      borderRadius: 14,
                      padding: 13,
                      borderWidth: 1,
                      borderColor: "#E2E8F0",
                    }}
                  >
                    <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" }}>
                      <View style={{ flex: 1, marginRight: 8 }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 2 }}>
                          <Text style={{ fontSize: 11, fontWeight: "800", color: "#4F46E5" }}>{txn.receiptNo}</Text>
                          <Badge label={txn.paymentMethod.toUpperCase()} variant="neutral" size="sm" />
                        </View>
                        <Text style={{ fontSize: 14, fontWeight: "700", color: "#0F172A" }} numberOfLines={1}>
                          {txn.studentName}
                        </Text>
                        <Text style={{ fontSize: 11.5, color: "#64748B", marginTop: 1 }} numberOfLines={1}>
                          {txn.batchTitle} • {txn.notes || "Tuition fee"}
                        </Text>
                      </View>
                      <View style={{ alignItems: "flex-end" }}>
                        <Text style={{ fontSize: 16, fontWeight: "800", color: "#16A34A" }}>
                          ₹{txn.amount.toLocaleString("en-IN")}
                        </Text>
                        <Text style={{ fontSize: 10, color: "#94A3B8", marginTop: 2 }}>
                          {paidDate}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        )}

        {/* ────── PENDING / OVERDUE TAB ────── */}
        {adminTab === "pending" && (
          <View style={{ gap: 12 }}>
            {/* Pending Summary */}
            {totalPending > 0 && (
              <View
                style={{
                  backgroundColor: overdueDuesCount > 0 ? "#FEF2F2" : "#FFFBEB",
                  borderRadius: 14,
                  padding: 14,
                  borderWidth: 1,
                  borderColor: overdueDuesCount > 0 ? "#FECACA" : "#FCD34D",
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    backgroundColor: overdueDuesCount > 0 ? "#FEE2E2" : "#FEF3C7",
                    alignItems: "center",
                    justifyContent: "center",
                    borderWidth: 1,
                    borderColor: overdueDuesCount > 0 ? "#FECACA" : "#FCD34D",
                  }}
                >
                  <AlertTriangle size={18} color={overdueDuesCount > 0 ? "#DC2626" : "#D97706"} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: "800", color: overdueDuesCount > 0 ? "#991B1B" : "#92400E" }}>
                    ₹{totalPending.toLocaleString("en-IN")} Total Pending
                  </Text>
                  <Text style={{ fontSize: 11, color: overdueDuesCount > 0 ? "#B91C1C" : "#B45309", marginTop: 2 }}>
                    {store.feeDues.length} students • {overdueDuesCount} overdue
                  </Text>
                </View>
              </View>
            )}

            {/* Search */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: "#FFFFFF",
                borderRadius: 14,
                borderWidth: 1,
                borderColor: "#E2E8F0",
                paddingHorizontal: 12,
                gap: 8,
              }}
            >
              <Search size={16} color="#94A3B8" />
              <TextInput
                placeholder="Search student name or batch..."
                placeholderTextColor="#94A3B8"
                value={searchQuery}
                onChangeText={setSearchQuery}
                style={{
                  flex: 1,
                  fontSize: 13,
                  color: "#0F172A",
                  paddingVertical: Platform.OS === "ios" ? 12 : 10,
                }}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery("")} activeOpacity={0.7}>
                  <X size={16} color="#94A3B8" />
                </TouchableOpacity>
              )}
            </View>

            {/* Pending Students List — same card design with Record Payment action */}
            {filteredPending.length === 0 ? (
              <View
                style={{
                  backgroundColor: "#FFFFFF",
                  borderRadius: 16,
                  padding: 32,
                  borderWidth: 1,
                  borderColor: "#E2E8F0",
                  alignItems: "center",
                }}
              >
                <CheckCircle2 size={28} color="#16A34A" />
                <Text style={{ fontSize: 14, fontWeight: "700", color: "#0F172A", marginTop: 8 }}>
                  {searchQuery ? "No matching dues" : "No Overdue Dues"}
                </Text>
                <Text style={{ fontSize: 12, color: "#94A3B8", marginTop: 2 }}>
                  {searchQuery ? "Try a different search" : "All student tuition fee dues are clear!"}
                </Text>
              </View>
            ) : (
              filteredPending.map((due) => {
                const isOverdue = due.status === "overdue";
                const dueDate = new Date(due.dueDate).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                });
                return (
                  <View
                    key={due.id}
                    style={{
                      backgroundColor: "#FFFFFF",
                      borderRadius: 14,
                      padding: 13,
                      borderWidth: 1,
                      borderColor: isOverdue ? "#FEE2E2" : "#E2E8F0",
                    }}
                  >
                    <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" }}>
                      <View style={{ flex: 1, marginRight: 8 }}>
                        <View style={{ marginBottom: 3 }}>
                          <Badge label={isOverdue ? "OVERDUE" : "DUE"} variant={isOverdue ? "danger" : "warning"} size="sm" />
                        </View>
                        <Text style={{ fontSize: 14, fontWeight: "700", color: "#0F172A" }} numberOfLines={1}>
                          {due.studentName}
                        </Text>
                        <Text style={{ fontSize: 11.5, color: "#64748B" }} numberOfLines={1}>
                          {due.batchTitle} • Due: {dueDate}
                        </Text>
                      </View>

                      <View style={{ alignItems: "flex-end", gap: 6 }}>
                        <Text style={{ fontSize: 16, fontWeight: "800", color: isOverdue ? "#DC2626" : "#D97706" }}>
                          ₹{due.amount.toLocaleString("en-IN")}
                        </Text>
                        <TouchableOpacity
                          activeOpacity={0.8}
                          onPress={() => handleOpenRecordFee(due)}
                          style={{
                            backgroundColor: "#4F46E5",
                            paddingHorizontal: 10,
                            paddingVertical: 5,
                            borderRadius: 8,
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          <CreditCard size={12} color="#FFFFFF" />
                          <Text style={{ fontSize: 11, fontWeight: "700", color: "#FFFFFF" }}>Record Payment</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        )}
      </ScrollView>

      {/* Record Fee Modal */}
      <RecordOfflinePaymentModal
        visible={paymentModalVisible}
        onClose={() => setPaymentModalVisible(false)}
        prefillDue={prefillDue}
        students={store.students}
        batches={store.batches}
        onRecord={handleRecordPayment}
      />
    </Screen>
  );
}

/* ─────────────────────────────────────────────
   Student Fee View (original)
   ───────────────────────────────────────────── */

export default function FeesScreen() {
  const { data: me } = useMe();
  const isAdmin = me?.role === "admin" || me?.role === "teacher";

  // Admin gets the management dashboard
  if (isAdmin) {
    return <AdminFeesDashboard />;
  }

  // Students/Parents get the existing fee view
  return <StudentFeesView />;
}

function StudentFeesView() {
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
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => setActiveTab("dues")}
          style={{
            flex: 1,
            paddingVertical: 10,
            borderRadius: 12,
            alignItems: 'center',
            flexDirection: 'row',
            justifyContent: 'center',
            backgroundColor: activeTab === 'dues' ? '#2563EB' : '#F1F5F9',
          }}
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
            }}
          >
            {t("pendingDues")} {pendingDues.length > 0 ? `(${pendingDues.length})` : ""}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => setActiveTab("history")}
          style={{
            flex: 1,
            paddingVertical: 10,
            borderRadius: 12,
            alignItems: 'center',
            flexDirection: 'row',
            justifyContent: 'center',
            marginLeft: 8,
            backgroundColor: activeTab === 'history' ? '#2563EB' : '#F1F5F9',
          }}
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
            }}
          >
            {t("paymentHistory")} {paymentHistory.length > 0 ? `(${paymentHistory.length})` : ""}
          </Text>
        </TouchableOpacity>
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
          <View className="py-8 items-center justify-center">
            <BookLoader text={t("loading")} size="lg" />
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
