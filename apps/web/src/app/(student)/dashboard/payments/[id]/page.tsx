import { notFound } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/server/auth/session";
import { getPaymentReceipt } from "@/server/data/payments";
import { formatINR, formatClassRoman } from "@quick2learn/shared";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  ArrowRight,
  Building,
  User,
  ArrowLeft,
} from "lucide-react";
import type { AuthUser } from "@/server/authz";

import { PrintReceiptButton } from "@/components/student/print-receipt-button";

interface PaymentReceiptPageProps {
  params: Promise<{ id: string }>;
}

export default async function PaymentReceiptPage({
  params,
}: PaymentReceiptPageProps) {
  const { id } = await params;
  const current = await getCurrentUser();

  if (!current) {
    notFound();
  }

  const authUser: AuthUser = {
    id: current.user.id,
    email: current.user.email,
    name: current.user.name,
    role: current.role,
  };

  const data = await getPaymentReceipt(authUser, id);

  if (!data) {
    notFound();
  }

  const { payment, student, profile, batch, due } = data;

  const paidDateFormatted = payment.paidAt
    ? new Date(payment.paidAt).toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : new Date(payment.createdAt).toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
        day: "numeric",
        month: "short",
        year: "numeric",
      });

  const methodLabel =
    payment.method === "razorpay"
      ? "Razorpay (Online UPI / Cards / NetBanking)"
      : payment.method === "upi_offline"
        ? "Direct Institute UPI Transfer"
        : payment.method === "cash"
          ? "Cash at Institute Desk"
          : "Bank Wire Transfer";

  return (
    <div className="container mx-auto px-4 py-8 lg:py-12 max-w-3xl">
      <div className="mb-6 flex items-center justify-between">
        <Link
          href="/dashboard/payments"
          className="inline-flex items-center gap-2 text-small font-semibold text-ink-muted hover:text-primary transition-colors group print:hidden"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          <span>Back to Payments</span>
        </Link>

        <div className="flex items-center gap-3 print:hidden">
          <PrintReceiptButton />
        </div>
      </div>

      {/* RECEIPT PAPER CONTAINER */}
      <div className="rounded-2xl border border-border bg-surface p-6 sm:p-10 shadow-card space-y-8 print:border-none print:shadow-none print:p-0">
        {/* Header Strip */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 pb-6 border-b border-border">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-h2 tracking-tight text-ink">
                Quick<span className="text-primary">2</span>Learn
              </span>
              <Badge variant="primary" className="ml-2">
                Official Receipt
              </Badge>
            </div>
            <p className="text-caption text-ink-muted">
              Senior Secondary Coaching Institute • Mathura, UP, India
            </p>
            <p className="text-caption text-ink-muted">
              Faculty: Mr. Dinesh Singh Rajput &amp; Mrs. Namita Singh Rajput
            </p>
          </div>

          <div className="text-left sm:text-right space-y-1">
            <span className="text-caption font-bold uppercase tracking-wider text-ink-muted block">
              Receipt Number
            </span>
            <span className="font-mono text-body font-bold text-ink block">
              {payment.receiptNo || `Q2L-TEMP-${payment.id.slice(0, 8)}`}
            </span>
            <span className="text-caption text-ink-muted block">
              Issued: {paidDateFormatted} IST
            </span>
          </div>
        </div>

        {/* Status Callout */}
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 sm:p-5 flex items-center gap-3 text-emerald-900">
          <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0" />
          <div>
            <h4 className="font-bold text-body">
              Payment Successfully Confirmed
            </h4>
            <p className="text-caption text-emerald-800">
              Your enrollment has been activated. A copy of this receipt has been recorded on your student profile.
            </p>
          </div>
        </div>

        {/* Student & Course Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
          {/* Student Info */}
          <div className="rounded-xl border border-border bg-surface-subtle p-5 space-y-3">
            <div className="flex items-center gap-2 text-ink font-bold text-small border-b border-border/60 pb-2">
              <User className="h-4 w-4 text-primary" />
              <span>Student &amp; Parent Details</span>
            </div>
            <div className="space-y-1.5 text-small">
              <div>
                <span className="text-ink-muted text-caption block">Student Name:</span>
                <span className="font-semibold text-ink">
                  {profile?.fullName || student.name}
                </span>
              </div>
              <div>
                <span className="text-ink-muted text-caption block">Email:</span>
                <span className="text-ink">{student.email}</span>
              </div>
              {profile?.phone && (
                <div>
                  <span className="text-ink-muted text-caption block">Mobile:</span>
                  <span className="text-ink font-mono">+91 {profile.phone}</span>
                </div>
              )}
              {profile?.parentName && (
                <div>
                  <span className="text-ink-muted text-caption block">Parent / Guardian:</span>
                  <span className="text-ink">
                    {profile.parentName}
                    {profile.parentPhone && ` (+91 ${profile.parentPhone})`}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Batch Info */}
          <div className="rounded-xl border border-border bg-surface-subtle p-5 space-y-3">
            <div className="flex items-center gap-2 text-ink font-bold text-small border-b border-border/60 pb-2">
              <Building className="h-4 w-4 text-primary" />
              <span>Enrolled Batch</span>
            </div>
            {batch ? (
              <div className="space-y-1.5 text-small">
                <div>
                  <span className="text-ink-muted text-caption block">Batch Title:</span>
                  <span className="font-semibold text-ink">{batch.title}</span>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <Badge variant="primary">
                    Class {formatClassRoman(batch.classLevel)}
                  </Badge>
                  <Badge variant="neutral">{batch.board.toUpperCase()}</Badge>
                  <Badge variant="accent" className="uppercase">
                    {batch.mode}
                  </Badge>
                </div>
                {batch.locationText && (
                  <p className="text-caption text-ink-muted pt-1">
                    {batch.locationText}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-small text-ink-muted">General Course Allocation</p>
            )}
          </div>
        </div>

        {/* Payment Line Item Table */}
        <div className="space-y-3 pt-2">
          <span className="text-caption font-bold uppercase tracking-wider text-ink-muted block">
            Payment Breakdown
          </span>
          <div className="overflow-hidden rounded-xl border border-border">
            <table className="w-full text-left text-small">
              <thead className="bg-surface-subtle border-b border-border text-ink-muted font-semibold text-caption">
                <tr>
                  <th className="p-3.5 px-4">Description</th>
                  <th className="p-3.5 px-4">Payment Method</th>
                  <th className="p-3.5 px-4 text-right">Amount Paid</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr>
                  <td className="p-4 font-semibold text-ink">
                    {due?.label || "Course Tuition & Admission Fee"}
                  </td>
                  <td className="p-4 text-ink-muted">{methodLabel}</td>
                  <td className="p-4 text-right font-bold text-h3 text-ink">
                    {formatINR(payment.amountPaise)}
                  </td>
                </tr>
              </tbody>
              <tfoot className="bg-surface-subtle/50 border-t border-border font-bold">
                <tr>
                  <td colSpan={2} className="p-3.5 px-4 text-ink">
                    Total Amount Received
                  </td>
                  <td className="p-3.5 px-4 text-right text-primary text-h3 font-black">
                    {formatINR(payment.amountPaise)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Transaction Reference Footer */}
        <div className="rounded-xl border border-border/80 bg-surface-subtle p-4 text-caption text-ink-muted space-y-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span>
              <strong>Transaction Reference:</strong>{" "}
              <code className="font-mono text-[11px] text-ink">
                {payment.razorpayPaymentId || payment.id}
              </code>
            </span>
            {payment.razorpayOrderId && (
              <span>
                <strong>Razorpay Order ID:</strong>{" "}
                <code className="font-mono text-[11px] text-ink">
                  {payment.razorpayOrderId}
                </code>
              </span>
            )}
          </div>
          <p className="pt-1">
            * This is a computer-generated tax receipt from Quick2Learn Institute, Mathura. Keep this for your academic and fee reconciliation records.
          </p>
        </div>

        {/* Actions Bar (hidden on print) */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Link
              href="/dashboard"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-primary py-3 px-6 text-small font-bold text-surface shadow-xs hover:bg-primary-hover transition-colors"
            >
              <span>Learning Dashboard</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <PrintReceiptButton />
          </div>

          <Link
            href={`/batches/${batch?.slug || ""}`}
            className="w-full sm:w-auto inline-flex items-center justify-center rounded-lg border border-border px-5 py-3 text-small font-semibold text-ink hover:bg-surface-subtle transition-colors"
          >
            <span>View Batch Schedule</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
