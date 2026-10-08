"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatINR } from "@quick2learn/shared";
import {
  Download,
  Search,
  ExternalLink,
  Calendar,
} from "lucide-react";

export interface PaymentRow {
  payment: {
    id: string;
    studentId: string;
    enrollmentId: string | null;
    amountPaise: number;
    currency: string;
    status: "pending" | "paid" | "failed" | "refunded";
    method: "razorpay" | "cash" | "upi_offline" | "bank_transfer";
    razorpayOrderId: string | null;
    razorpayPaymentId: string | null;
    receiptNo: string | null;
    paidAt: Date | string | null;
    createdAt: Date | string;
  };
  studentName: string | null;
  studentEmail: string;
  studentPhone: string | null;
  batchTitle: string | null;
}

interface PaymentsClientProps {
  payments: PaymentRow[];
}

export function PaymentsClient({ payments }: PaymentsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [status, setStatus] = useState(searchParams.get("status") || "all");
  const [method, setMethod] = useState(searchParams.get("method") || "all");
  const [fromDate, setFromDate] = useState(searchParams.get("fromDate") || "");
  const [toDate, setToDate] = useState(searchParams.get("toDate") || "");

  const handleFilterSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const params = new URLSearchParams();
    if (search.trim()) params.set("search", search.trim());
    if (status && status !== "all") params.set("status", status);
    if (method && method !== "all") params.set("method", method);
    if (fromDate) params.set("fromDate", fromDate);
    if (toDate) params.set("toDate", toDate);
    router.push(`/admin/payments?${params.toString()}`);
  };

  const handleReset = () => {
    setSearch("");
    setStatus("all");
    setMethod("all");
    setFromDate("");
    setToDate("");
    router.push("/admin/payments");
  };

  // CSV Export
  const handleExportCSV = () => {
    const headers = [
      "Receipt No",
      "Date",
      "Student Name",
      "Email",
      "Phone",
      "Batch Title",
      "Amount (INR)",
      "Status",
      "Payment Method",
      "Transaction ID",
    ];

    const rows = payments.map((p) => {
      const dateStr = p.payment.paidAt || p.payment.createdAt;
      return [
        `"${p.payment.receiptNo || ""}"`,
        `"${dateStr ? new Date(dateStr).toISOString().split("T")[0] : ""}"`,
        `"${(p.studentName || "").replace(/"/g, '""')}"`,
        `"${p.studentEmail || ""}"`,
        `"${p.studentPhone || ""}"`,
        `"${(p.batchTitle || "").replace(/"/g, '""')}"`,
        (p.payment.amountPaise / 100).toFixed(2),
        `"${p.payment.status.toUpperCase()}"`,
        `"${p.payment.method.toUpperCase()}"`,
        `"${p.payment.razorpayPaymentId || p.payment.razorpayOrderId || ""}"`,
      ];
    });

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `Quick2Learn_Payments_${fromDate || "all"}_to_${toDate || "today"}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalCollectedPaise = payments
    .filter((p) => p.payment.status === "paid")
    .reduce((sum, p) => sum + p.payment.amountPaise, 0);

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-display-xs font-bold text-ink">Payments & Collections</h1>
          <p className="text-body-sm text-ink-muted mt-0.5">
            View verified payment transactions, generate receipts, and export date-range reconciliation reports.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="gap-1.5 font-bold border-border bg-white"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <form
        onSubmit={handleFilterSubmit}
        className="p-4 rounded-2xl border border-border bg-white shadow-xs space-y-3"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          <div className="relative md:col-span-2">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search receipt #, student name, email..."
              className="pl-9 h-9 text-body-xs"
            />
          </div>

          <div>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-white text-body-xs text-ink font-medium h-9"
            >
              <option value="all">All Statuses</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>

          <div>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-white text-body-xs text-ink font-medium h-9"
            >
              <option value="all">All Payment Methods</option>
              <option value="razorpay">Razorpay (Online)</option>
              <option value="cash">Cash (Offline)</option>
              <option value="upi_offline">UPI Offline</option>
              <option value="bank_transfer">Bank Transfer</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Button type="submit" size="sm" className="h-9 font-bold flex-1">
              Apply
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="h-9 text-xs"
            >
              Reset
            </Button>
          </div>
        </div>

        {/* Date range row */}
        <div className="flex items-center gap-3 pt-2 border-t border-border/60 text-body-xs">
          <span className="font-semibold text-ink-muted flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" /> Date Range:
          </span>
          <div className="flex items-center gap-2">
            <Input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="h-8 text-xs py-1"
            />
            <span className="text-ink-muted">to</span>
            <Input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="h-8 text-xs py-1"
            />
          </div>
        </div>
      </form>

      {/* Summary Stats Pill */}
      <div className="flex items-center justify-between p-3.5 rounded-xl bg-surface-subtle border border-border text-body-sm">
        <span className="text-ink-muted">
          Showing <span className="font-bold text-ink">{payments.length}</span> payment records
        </span>
        <span className="font-semibold text-ink">
          Filtered Collections:{" "}
          <span className="font-bold font-mono text-emerald-700">
            {formatINR(totalCollectedPaise)}
          </span>
        </span>
      </div>

      {/* Payments Table */}
      <div className="rounded-2xl border border-border bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-body-sm text-ink border-collapse">
            <thead className="bg-surface-subtle border-b border-border text-[11px] font-bold text-ink-muted uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Receipt #</th>
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4">Batch</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Method</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4 text-right">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-ink-muted">
                    No payment records match the query.
                  </td>
                </tr>
              ) : (
                payments.map(({ payment, studentName, studentEmail, studentPhone, batchTitle }) => (
                  <tr key={payment.id} className="hover:bg-surface-subtle/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-body-xs font-semibold text-primary">
                      {payment.receiptNo || "—"}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <Link
                        href={`/admin/students/${payment.studentId}`}
                        className="font-bold text-ink hover:text-primary transition-colors block"
                      >
                        {studentName || "Student"}
                      </Link>
                      <p className="text-[11px] text-ink-muted truncate max-w-[180px]">
                        {studentPhone ? `${studentEmail} · ${studentPhone}` : studentEmail}
                      </p>
                    </td>

                    <td className="py-3.5 px-4 max-w-xs text-body-xs text-ink truncate">
                      {batchTitle || "General Course"}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap font-bold font-mono text-ink">
                      {formatINR(payment.amountPaise)}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap text-body-xs uppercase font-medium">
                      {payment.method.replace(/_/g, " ")}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold uppercase ${
                          payment.status === "paid"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : payment.status === "failed"
                            ? "bg-rose-50 text-rose-700 border border-rose-200"
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}
                      >
                        {payment.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap text-body-xs text-ink-muted">
                      {new Date(payment.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <Link
                        href={`/dashboard/payments/${payment.id}`}
                        target="_blank"
                        className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-semibold"
                      >
                        <span>View</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
