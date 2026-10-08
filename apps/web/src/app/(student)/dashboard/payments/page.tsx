import { requireOnboardedUser } from "@/server/auth/session";
import { getFeeDues, getPayments } from "@/server/data/payments";
import { formatINR } from "@quick2learn/shared";
import { Badge } from "@/components/ui/badge";
import { DuePayButton } from "@/components/student/due-pay-button";
import { publicEnv } from "@/lib/env";
import Link from "next/link";
import {
  CreditCard,
  Receipt,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import type { AuthUser } from "@/server/authz";

export const revalidate = 0;

export default async function StudentPaymentsPage() {
  const current = await requireOnboardedUser();

  const authUser: AuthUser = {
    id: current.user.id,
    email: current.user.email,
    name: current.user.name,
    role: current.role,
  };

  const [dues, payments] = await Promise.all([
    getFeeDues(authUser),
    getPayments(authUser),
  ]);

  const unpaidDues = dues.filter((d) => d.status === "due");
  const nowMs = Date.now();

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-h2 font-extrabold text-ink tracking-tight">
            Fee Dues &amp; Payments
          </h1>
          <p className="text-body-sm text-ink-muted">
            Manage your batch tuition instalments, pay securely via Razorpay, and download official receipts.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="primary" className="text-xs">
            {unpaidDues.length} Pending Dues
          </Badge>
        </div>
      </div>

      {/* SECTION 1: DUES TABLE */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-h3 font-bold text-ink flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-primary" />
            <span>Scheduled Fee Instalments</span>
          </h2>
          {unpaidDues.length === 0 && dues.length > 0 && (
            <span className="text-caption font-semibold text-positive flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" /> All cleared
            </span>
          )}
        </div>

        {/* Empty State: All Paid Up / No Dues */}
        {unpaidDues.length === 0 ? (
          <div className="p-8 rounded-2xl bg-positive-soft/20 border border-positive/30 text-center space-y-2.5">
            <div className="w-12 h-12 rounded-full bg-positive/10 text-positive mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-body-lg font-bold text-ink">
              You&apos;re all paid up.
            </h3>
            <p className="text-caption text-ink-muted max-w-sm mx-auto">
              There are no pending fee instalments for your enrolled batches. Thank you for keeping your dues up to date!
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-body-sm">
                <thead className="bg-neutral-subtle/60 border-b border-border text-ink-muted font-semibold text-caption">
                  <tr>
                    <th className="py-3 px-4 sm:px-6">Instalment Label</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Due Date</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 sm:px-6 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {dues.map((due) => {
                    const dueTime = new Date(due.dueDate).getTime();
                    const isOverdue = due.status === "due" && dueTime < nowMs;

                    let statusBadge;
                    if (due.status === "paid") {
                      statusBadge = (
                        <Badge variant="success" className="text-xs">
                          Paid
                        </Badge>
                      );
                    } else if (due.status === "waived") {
                      statusBadge = (
                        <Badge variant="neutral" className="text-xs">
                          Waived
                        </Badge>
                      );
                    } else if (isOverdue) {
                      statusBadge = (
                        <Badge variant="critical" className="text-xs">
                          Overdue
                        </Badge>
                      );
                    } else {
                      statusBadge = (
                        <Badge variant="accent" className="text-xs">
                          Due
                        </Badge>
                      );
                    }

                    return (
                      <tr key={due.id} className="hover:bg-neutral-subtle/20 transition-colors">
                        <td className="py-4 px-4 sm:px-6 font-bold text-ink">
                          {due.label}
                        </td>
                        <td className="py-4 px-4 font-extrabold text-ink">
                          {formatINR(due.amountPaise)}
                        </td>
                        <td className="py-4 px-4 text-ink-muted text-caption">
                          {due.dueDate}
                        </td>
                        <td className="py-4 px-4">
                          {statusBadge}
                        </td>
                        <td className="py-4 px-4 sm:px-6 text-right">
                          {due.status === "due" ? (
                            <DuePayButton
                              dueId={due.id}
                              dueLabel={due.label}
                              amountPaise={due.amountPaise}
                              razorpayKeyId={publicEnv.NEXT_PUBLIC_RAZORPAY_KEY_ID}
                              studentEmail={current.user.email}
                              studentName={current.user.name}
                            />
                          ) : due.status === "paid" ? (
                            <span className="text-caption font-semibold text-positive flex items-center justify-end gap-1">
                              <CheckCircle2 className="w-4 h-4" /> Cleared
                            </span>
                          ) : (
                            <span className="text-caption text-ink-muted">Waived</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {/* SECTION 2: PAYMENT HISTORY TABLE */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-h3 font-bold text-ink flex items-center gap-2">
            <Receipt className="w-5 h-5 text-primary" />
            <span>Payment History &amp; Receipts</span>
          </h2>
          <span className="text-caption text-ink-muted">
            {payments.length} transactions
          </span>
        </div>

        {payments.length === 0 ? (
          <div className="p-8 rounded-2xl border border-dashed border-border bg-white text-center space-y-2">
            <Receipt className="w-8 h-8 text-ink-muted mx-auto opacity-40" />
            <p className="text-body-sm font-medium text-ink">
              No transactions recorded yet.
            </p>
            <p className="text-caption text-ink-muted">
              Once you pay a batch fee or enrolment instalment, your official receipt will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-body-sm">
                <thead className="bg-neutral-subtle/60 border-b border-border text-ink-muted font-semibold text-caption">
                  <tr>
                    <th className="py-3 px-4 sm:px-6">Date</th>
                    <th className="py-3 px-4">Receipt Number</th>
                    <th className="py-3 px-4">Payment Method</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 sm:px-6 text-right">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {payments.map((p) => {
                    const paidDate = p.paidAt
                      ? new Date(p.paidAt).toLocaleDateString("en-IN", {
                          timeZone: "Asia/Kolkata",
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      : new Date(p.createdAt).toLocaleDateString("en-IN", {
                          timeZone: "Asia/Kolkata",
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        });

                    const methodLabel =
                      p.method === "razorpay"
                        ? "Razorpay Online"
                        : p.method === "cash"
                          ? "Cash (Office Desk)"
                          : p.method === "upi_offline"
                            ? "UPI Transfer"
                            : "Bank Wire";

                    return (
                      <tr key={p.id} className="hover:bg-neutral-subtle/20 transition-colors">
                        <td className="py-4 px-4 sm:px-6 text-ink-muted text-caption whitespace-nowrap">
                          {paidDate}
                        </td>
                        <td className="py-4 px-4 font-mono font-bold text-ink">
                          {p.receiptNo || "Processing"}
                        </td>
                        <td className="py-4 px-4 text-ink-muted">
                          {methodLabel}
                        </td>
                        <td className="py-4 px-4 font-extrabold text-ink">
                          {formatINR(p.amountPaise)}
                        </td>
                        <td className="py-4 px-4">
                          <Badge
                            variant={
                              p.status === "paid"
                                ? "success"
                                : p.status === "failed"
                                  ? "critical"
                                  : "neutral"
                            }
                            className="capitalize text-xs font-semibold"
                          >
                            {p.status}
                          </Badge>
                        </td>
                        <td className="py-4 px-4 sm:px-6 text-right">
                          {p.status === "paid" ? (
                            <Link
                              href={`/dashboard/payments/${p.id}`}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border hover:border-primary/50 text-caption font-semibold text-primary hover:bg-primary-soft/20 transition-colors"
                            >
                              <span>Print Receipt</span>
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Link>
                          ) : (
                            <span className="text-caption text-ink-muted">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
