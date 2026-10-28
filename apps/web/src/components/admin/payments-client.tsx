"use client";

import { useState, Suspense } from "react";
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

function PaymentsClientContent({ payments }: PaymentsClientProps) {
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
    <div className="space-y-4">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Payments &amp; Collections</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            View verified payment transactions, generate receipts, and export date-range reconciliation reports.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="h-8 px-3 text-xs gap-1.5 font-semibold border-slate-200 bg-white hover:bg-slate-50 rounded-lg shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <form
        onSubmit={handleFilterSubmit}
        className="p-3.5 rounded-xl border border-slate-200/80 bg-white shadow-xs space-y-2.5"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2.5">
          <div className="relative md:col-span-2">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search receipt #, student name, email..."
              className="pl-8 h-8 text-xs rounded-lg border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white"
            />
          </div>

          <div>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-2.5 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white text-xs text-slate-800 font-medium h-8"
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
              className="w-full px-2.5 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white text-xs text-slate-800 font-medium h-8"
            >
              <option value="all">All Payment Methods</option>
              <option value="razorpay">Razorpay (Online)</option>
              <option value="cash">Cash (Offline)</option>
              <option value="upi_offline">UPI Offline</option>
              <option value="bank_transfer">Bank Transfer</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <Button type="submit" size="sm" className="h-8 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex-1 shadow-2xs">
              Apply
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="h-8 text-xs border-slate-200 rounded-lg hover:bg-slate-50"
            >
              Reset
            </Button>
          </div>
        </div>

        {/* Date range row */}
        <div className="flex items-center gap-2.5 pt-2 border-t border-slate-100 text-xs">
          <span className="font-semibold text-slate-500 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" /> Date Range:
          </span>
          <div className="flex items-center gap-2">
            <Input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="h-7 text-xs py-0.5 px-2 rounded-md"
            />
            <span className="text-slate-400">to</span>
            <Input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="h-7 text-xs py-0.5 px-2 rounded-md"
            />
          </div>
        </div>
      </form>

      {/* Summary Stats Pill */}
      <div className="flex items-center justify-between p-3 rounded-lg bg-white border border-slate-200/80 text-xs shadow-2xs">
        <span className="text-slate-500">
          Showing <span className="font-bold text-slate-900">{payments.length}</span> payment records
        </span>
        <span className="font-semibold text-slate-700">
          Filtered Collections:{" "}
          <span className="font-bold font-mono text-emerald-600">
            {formatINR(totalCollectedPaise)}
          </span>
        </span>
      </div>

      {/* Payments Table */}
      <div className="rounded-xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50/80 border-b border-slate-200/80 text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-3.5">Receipt #</th>
                <th className="py-2.5 px-3.5">Student</th>
                <th className="py-2.5 px-3.5">Batch</th>
                <th className="py-2.5 px-3.5">Amount</th>
                <th className="py-2.5 px-3.5">Method</th>
                <th className="py-2.5 px-3.5">Status</th>
                <th className="py-2.5 px-3.5">Date</th>
                <th className="py-2.5 px-3.5 text-right">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400">
                    No payment records match the query.
                  </td>
                </tr>
              ) : (
                payments.map(({ payment, studentName, studentEmail, studentPhone, batchTitle }) => (
                  <tr key={payment.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 px-3.5 font-mono text-xs font-semibold text-blue-600">
                      {payment.receiptNo || "—"}
                    </td>

                    <td className="py-2.5 px-3.5 whitespace-nowrap">
                      <Link
                        href={`/admin/students/${payment.studentId}`}
                        className="font-bold text-slate-900 hover:text-blue-600 transition-colors block"
                      >
                        {studentName || "Student"}
                      </Link>
                      <p className="text-[11px] text-slate-500 truncate max-w-[180px]">
                        {studentPhone ? `${studentEmail} · ${studentPhone}` : studentEmail}
                      </p>
                    </td>

                    <td className="py-2.5 px-3.5 max-w-xs text-xs text-slate-700 truncate">
                      {batchTitle || "General Course"}
                    </td>

                    <td className="py-2.5 px-3.5 whitespace-nowrap font-bold font-mono text-slate-900">
                      {formatINR(payment.amountPaise)}
                    </td>

                    <td className="py-2.5 px-3.5 whitespace-nowrap text-xs uppercase font-medium text-slate-600">
                      {payment.method.replace(/_/g, " ")}
                    </td>

                    <td className="py-2.5 px-3.5 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          payment.status === "paid"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : payment.status === "failed"
                            ? "bg-rose-50 text-rose-700 border border-rose-200"
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            payment.status === "paid"
                              ? "bg-emerald-500"
                              : payment.status === "failed"
                              ? "bg-rose-500"
                              : "bg-amber-500"
                          }`}
                        />
                        <span className="capitalize">{payment.status}</span>
                      </span>
                    </td>

                    <td className="py-2.5 px-3.5 whitespace-nowrap text-xs text-slate-500">
                      {new Date(payment.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>

                    <td className="py-2.5 px-3.5 text-right whitespace-nowrap">
                      <Link
                        href={`/dashboard/payments/${payment.id}`}
                        target="_blank"
                        className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 hover:underline font-semibold"
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

export function PaymentsClient(props: PaymentsClientProps) {
  return (
    <Suspense fallback={null}>
      <PaymentsClientContent {...props} />
    </Suspense>
  );
}
