import { notFound } from "next/navigation";
import Link from "next/link";
import { requireRole } from "@/server/auth/session";
import { getAdminStudentDetails, getAdminAvailableBatchesWithPlans } from "@/server/data/admin";
import { formatINR } from "@quick2learn/shared";
import { StudentDetailClient, WaiveDueButton } from "@/components/admin/student-detail-client";
import { StudentParentsSection } from "@/components/admin/student-parents-section";
import {
  ArrowLeft,
  GraduationCap,
  CreditCard,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Clock,
  CheckCircle2,
  FileText,
} from "lucide-react";

export const metadata = {
  title: "Student Details · Admin · Quick2Learn",
};

interface StudentPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminStudentDetailPage({ params }: StudentPageProps) {
  const current = await requireRole(["admin"]);
  const { id } = await params;

  const data = await getAdminStudentDetails(current.user, id);
  if (!data || !data.user) {
    notFound();
  }

  const { user, profile, enrollments, feeDues, payments, notes, linkedParents } = data;
  const availableBatches = await getAdminAvailableBatchesWithPlans(current.user);

  const duesListForClient = feeDues.map((d) => ({
    id: d.id,
    label: d.label,
    amountPaise: d.amountPaise,
    dueDate: d.dueDate,
    status: d.status,
    batchTitle: d.batchTitle,
  }));

  const pendingDuesPaise = feeDues
    .filter((d) => d.status === "due")
    .reduce((sum, d) => sum + d.amountPaise, 0);

  const studentName = profile?.fullName || user.name || "Student";

  return (
    <div className="space-y-6 w-full pb-12">
      {/* Top Bar Navigation & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-5">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/students"
            className="p-2 rounded-lg border border-border bg-white text-ink-muted hover:text-ink hover:bg-surface-subtle transition-colors"
            title="Back to students list"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-display-xs font-bold text-ink">{studentName}</h1>
              {profile?.onboardedAt ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3" /> Onboarded
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                  Pending Onboarding
                </span>
              )}
            </div>
            <p className="text-body-xs text-ink-muted mt-0.5">
              User ID: <span className="font-mono text-ink">{user.id}</span> · Joined{" "}
              {new Date(user.createdAt).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </p>
          </div>
        </div>

        <StudentDetailClient
          studentId={user.id}
          studentName={studentName}
          availableBatches={availableBatches}
          dues={duesListForClient}
        />
      </div>

      {/* Profile & Key Metrics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="rounded-2xl border border-border bg-white p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <h2 className="text-body-sm font-bold text-ink uppercase tracking-wider text-[11px]">
              Profile Details
            </h2>
            <span className="text-body-xs font-semibold px-2 py-0.5 rounded-md bg-surface-subtle text-ink-muted">
              Class {profile?.classLevel || 12} · {profile?.board?.toUpperCase() || "CBSE"}
            </span>
          </div>

          <div className="space-y-3 text-body-sm">
            <div className="flex items-start gap-2.5">
              <Mail className="w-4 h-4 text-ink-muted shrink-0 mt-0.5" />
              <div>
                <p className="text-body-xs text-ink-muted">Email</p>
                <a href={`mailto:${user.email}`} className="text-primary hover:underline font-medium break-all">
                  {user.email}
                </a>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <Phone className="w-4 h-4 text-ink-muted shrink-0 mt-0.5" />
              <div>
                <p className="text-body-xs text-ink-muted">Student Phone</p>
                <p className="font-medium text-ink">{profile?.phone || "Not provided"}</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <MapPin className="w-4 h-4 text-ink-muted shrink-0 mt-0.5" />
              <div>
                <p className="text-body-xs text-ink-muted">City / School</p>
                <p className="font-medium text-ink">{profile?.city || "Mathura"}</p>
                {profile?.school && (
                  <p className="text-body-xs text-ink-muted mt-0.5">{profile.school}</p>
                )}
              </div>
            </div>
          </div>

          {/* Guardian Info */}
          {(profile?.parentName || profile?.parentPhone) && (
            <div className="pt-3 border-t border-border space-y-2">
              <p className="text-body-xs font-bold text-ink-muted uppercase tracking-wider text-[11px]">
                Parent / Guardian
              </p>
              <div className="text-body-sm">
                <p className="font-medium text-ink">
                  {profile.parentName || "Parent"}
                </p>
                {profile.parentPhone && (
                  <p className="text-body-xs text-ink-muted mt-0.5 font-mono">
                    {profile.parentPhone}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Financial & Enrolment Highlights */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-border bg-white p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-ink-muted mb-2">
                <span className="text-body-xs font-semibold">Active Enrolments</span>
                <GraduationCap className="w-4 h-4 text-primary" />
              </div>
              <p className="text-display-sm font-bold text-ink">
                {enrollments.filter((e) => e.enrollment.status === "active").length}
              </p>
            </div>
            <p className="text-body-xs text-ink-muted mt-3">
              Total historical: {enrollments.length} batches
            </p>
          </div>

          <div
            className={`rounded-2xl border p-5 shadow-xs flex flex-col justify-between ${
              pendingDuesPaise > 0
                ? "bg-amber-50/50 border-amber-200"
                : "bg-white border-border"
            }`}
          >
            <div>
              <div className="flex items-center justify-between text-ink-muted mb-2">
                <span className="text-body-xs font-semibold">Outstanding Dues</span>
                <CreditCard
                  className={`w-4 h-4 ${
                    pendingDuesPaise > 0 ? "text-amber-600" : "text-emerald-600"
                  }`}
                />
              </div>
              <p
                className={`text-display-sm font-bold ${
                  pendingDuesPaise > 0 ? "text-amber-700" : "text-emerald-700"
                }`}
              >
                {formatINR(pendingDuesPaise)}
              </p>
            </div>
            <p className="text-body-xs text-ink-muted mt-3">
              {feeDues.filter((d) => d.status === "due").length} pending due records
            </p>
          </div>
        </div>
      </div>

      {/* Linked Parents Section */}
      <StudentParentsSection
        studentId={user.id}
        studentName={studentName}
        linkedParents={linkedParents || []}
      />

      {/* Enrolled Batches */}
      <div className="rounded-2xl border border-border bg-white p-5 shadow-xs space-y-4">
        <h2 className="text-body-md font-bold text-ink flex items-center gap-2">
          <GraduationCap className="w-4 h-4 text-primary" />
          <span>Enrolled Batches ({enrollments.length})</span>
        </h2>

        {enrollments.length === 0 ? (
          <p className="text-body-sm text-ink-muted py-6 text-center">
            Student is not enrolled in any batches yet. Use "Enrol in Batch" above.
          </p>
        ) : (
          <div className="divide-y divide-border border border-border rounded-xl overflow-hidden">
            {enrollments.map(({ enrollment, batch, feePlan }) => (
              <div
                key={enrollment.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white hover:bg-surface-subtle transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/admin/batches/${batch.id}`}
                      className="text-body-sm font-bold text-ink hover:text-primary transition-colors"
                    >
                      {batch.title}
                    </Link>
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-semibold uppercase ${
                        enrollment.status === "active"
                          ? "bg-emerald-50 text-emerald-700"
                          : enrollment.status === "pending_payment"
                          ? "bg-amber-50 text-amber-700"
                          : "bg-neutral-subtle text-ink-muted"
                      }`}
                    >
                      {enrollment.status}
                    </span>
                    <span className="text-body-xs text-ink-muted uppercase">
                      Source: {enrollment.source}
                    </span>
                  </div>
                  <p className="text-body-xs text-ink-muted">
                    Class {batch.classLevel} · {batch.mode} mode · Fee Plan:{" "}
                    <span className="font-semibold text-ink">
                      {feePlan?.name || "Standard"} ({formatINR(feePlan?.totalPaise || 0)})
                    </span>
                  </p>
                </div>

                <div className="text-right sm:shrink-0 text-body-xs text-ink-muted">
                  Enrolled{" "}
                  {enrollment.enrolledAt
                    ? new Date(enrollment.enrolledAt).toLocaleDateString("en-IN")
                    : "—"}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Dues & Fees Section */}
      <div className="rounded-2xl border border-border bg-white p-5 shadow-xs space-y-4">
        <h2 className="text-body-md font-bold text-ink flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-primary" />
          <span>Fee Dues & Instalments ({feeDues.length})</span>
        </h2>

        {feeDues.length === 0 ? (
          <p className="text-body-sm text-ink-muted py-6 text-center">
            No fee dues generated for this student.
          </p>
        ) : (
          <div className="overflow-x-auto border border-border rounded-xl">
            <table className="w-full text-left text-body-sm text-ink">
              <thead className="bg-surface-subtle border-b border-border text-[11px] font-bold text-ink-muted uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-3.5">Batch / Due Label</th>
                  <th className="py-2.5 px-3.5">Due Date</th>
                  <th className="py-2.5 px-3.5">Amount</th>
                  <th className="py-2.5 px-3.5">Status</th>
                  <th className="py-2.5 px-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {feeDues.map((due) => (
                  <tr key={due.id} className="hover:bg-surface-subtle transition-colors">
                    <td className="py-3 px-3.5">
                      <p className="font-semibold text-ink">{due.label}</p>
                      <p className="text-body-xs text-ink-muted">{due.batchTitle}</p>
                    </td>
                    <td className="py-3 px-3.5 whitespace-nowrap text-ink-muted text-body-xs">
                      {due.dueDate}
                    </td>
                    <td className="py-3 px-3.5 font-bold font-mono text-ink">
                      {formatINR(due.amountPaise)}
                    </td>
                    <td className="py-3 px-3.5">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                          due.status === "paid"
                            ? "bg-emerald-50 text-emerald-700"
                            : due.status === "waived"
                            ? "bg-slate-100 text-slate-700"
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {due.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-3.5 text-right">
                      {due.status === "due" && (
                        <WaiveDueButton
                          due={{
                            id: due.id,
                            label: due.label,
                            amountPaise: due.amountPaise,
                          }}
                          studentId={user.id}
                          studentName={studentName}
                        />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payment History Section */}
      <div className="rounded-2xl border border-border bg-white p-5 shadow-xs space-y-4">
        <h2 className="text-body-md font-bold text-ink flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary" />
          <span>Payment History ({payments.length})</span>
        </h2>

        {payments.length === 0 ? (
          <p className="text-body-sm text-ink-muted py-6 text-center">
            No payments recorded yet.
          </p>
        ) : (
          <div className="overflow-x-auto border border-border rounded-xl">
            <table className="w-full text-left text-body-sm text-ink">
              <thead className="bg-surface-subtle border-b border-border text-[11px] font-bold text-ink-muted uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-3.5">Receipt #</th>
                  <th className="py-2.5 px-3.5">Date</th>
                  <th className="py-2.5 px-3.5">Method</th>
                  <th className="py-2.5 px-3.5">Amount</th>
                  <th className="py-2.5 px-3.5">Status</th>
                  <th className="py-2.5 px-3.5 text-right">View</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-surface-subtle transition-colors">
                    <td className="py-3 px-3.5 font-mono text-body-xs font-semibold text-primary">
                      {p.receiptNo || "—"}
                    </td>
                    <td className="py-3 px-3.5 whitespace-nowrap text-body-xs text-ink-muted">
                      {new Date(p.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="py-3 px-3.5 text-body-xs uppercase font-medium text-ink">
                      {p.method}
                    </td>
                    <td className="py-3 px-3.5 font-bold font-mono text-ink">
                      {formatINR(p.amountPaise)}
                    </td>
                    <td className="py-3 px-3.5">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                          p.status === "paid"
                            ? "bg-emerald-50 text-emerald-700"
                            : p.status === "failed"
                            ? "bg-rose-50 text-rose-700"
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {p.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-3.5 text-right">
                      <Link
                        href={`/dashboard/payments/${p.id}`}
                        className="text-xs text-primary hover:underline font-semibold"
                        target="_blank"
                      >
                        Receipt
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Staff Notes & Audit Trail */}
      <div className="rounded-2xl border border-border bg-white p-5 shadow-xs space-y-4">
        <h2 className="text-body-md font-bold text-ink flex items-center gap-2">
          <FileText className="w-4 h-4 text-primary" />
          <span>Staff Notes & Audit History ({notes.length})</span>
        </h2>

        {notes.length === 0 ? (
          <p className="text-body-sm text-ink-muted py-6 text-center">
            No staff notes recorded yet. Use "Add Staff Note" above.
          </p>
        ) : (
          <div className="space-y-3">
            {notes.map((log) => {
              const diffObj = (log.diff || {}) as Record<string, unknown>;
              const isNote = log.action === "add_note";
              const isWaiver = log.action === "waive_fee_due";

              return (
                <div
                  key={log.id}
                  className={`p-3.5 rounded-xl border text-body-sm ${
                    isNote
                      ? "bg-amber-50/40 border-amber-200/60"
                      : isWaiver
                      ? "bg-slate-50 border-slate-200"
                      : "bg-surface-subtle border-border"
                  }`}
                >
                  <div className="flex items-center justify-between text-body-xs text-ink-muted mb-1.5">
                    <span className="font-semibold text-ink uppercase tracking-wide text-[11px]">
                      {log.action.replace(/_/g, " ")}
                    </span>
                    <span className="flex items-center gap-1 font-mono">
                      <Clock className="w-3 h-3" />
                      {new Date(log.createdAt).toLocaleString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  {isNote && (
                    <p className="text-ink font-medium whitespace-pre-wrap">
                      {String(diffObj.note || "")}
                    </p>
                  )}

                  {isWaiver && (
                    <div className="space-y-1 text-body-xs">
                      <p className="font-medium text-ink">
                        Waived Due: {String(diffObj.label || "")} (
                        {formatINR(Number(diffObj.amountPaise || 0))})
                      </p>
                      <p className="text-ink-muted">
                        Reason: <span className="italic">{String(diffObj.reason || "")}</span>
                      </p>
                    </div>
                  )}

                  {!isNote && !isWaiver && (
                    <pre className="text-body-xs font-mono text-ink-muted overflow-x-auto p-2 bg-white rounded border border-border">
                      {JSON.stringify(diffObj, null, 2)}
                    </pre>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
