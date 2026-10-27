import { redirect } from "next/navigation";
import { getAdminSession } from "@/server/auth/session";
import { getAdminDashboardKPIs } from "@/server/data/admin";
import { formatINR } from "@quick2learn/shared";
import { DashboardSyncCard } from "@/components/admin/dashboard-sync-card";
import { AdminLoginForm } from "@/components/admin/admin-login-form";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  Users,
  GraduationCap,
  IndianRupee,
  AlertTriangle,
  MessageSquare,
  ArrowRight,
  Phone,
  MessageCircle,
  CheckCircle2,
} from "lucide-react";

export const revalidate = 0;

export default async function AdminDashboardPage() {
  const session = await getAdminSession();

  if (!session) {
    return <AdminLoginForm />;
  }

  // Teachers see only Lectures, Resources, Announcements, and their own batches
  if (session.role === "teacher") {
    redirect("/admin/batches");
  }

  const kpis = await getAdminDashboardKPIs(session.user);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* 1. HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-h2 font-extrabold text-ink tracking-tight">
            Institute Dashboard
          </h1>
          <p className="text-body-sm text-ink-muted">
            Overview of student enrollments, fee collections, and active operations at Quick2Learn Mathura.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="success" className="font-semibold text-xs py-1">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> All Systems Operational
          </Badge>
        </div>
      </div>

      {/* 2. KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Active Students */}
        <div className="p-5 rounded-2xl bg-white border border-border shadow-xs space-y-2">
          <div className="flex items-center justify-between text-ink-muted">
            <span className="text-[11px] font-bold uppercase tracking-wider">Active Students</span>
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-h2 font-extrabold text-ink tracking-tight">
            {kpis.activeStudentsCount}
          </div>
          <p className="text-[11px] text-ink-muted">Currently enrolled in active batches</p>
        </div>

        {/* Enrolments this month */}
        <div className="p-5 rounded-2xl bg-white border border-border shadow-xs space-y-2">
          <div className="flex items-center justify-between text-ink-muted">
            <span className="text-[11px] font-bold uppercase tracking-wider">Monthly Enrolments</span>
            <div className="p-2 rounded-lg bg-emerald-50 text-success">
              <GraduationCap className="w-4 h-4" />
            </div>
          </div>
          <div className="text-h2 font-extrabold text-ink tracking-tight">
            +{kpis.enrolmentsThisMonth}
          </div>
          <p className="text-[11px] text-ink-muted">New batch enrollments this month</p>
        </div>

        {/* Collections this month */}
        <div className="p-5 rounded-2xl bg-white border border-border shadow-xs space-y-2">
          <div className="flex items-center justify-between text-ink-muted">
            <span className="text-[11px] font-bold uppercase tracking-wider">Collections (Month)</span>
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="text-h3 font-extrabold text-ink tracking-tight truncate">
            {formatINR(kpis.collectionsThisMonthPaise)}
          </div>
          <p className="text-[11px] text-ink-muted">Net tuition fees collected in ₹</p>
        </div>

        {/* Overdue dues */}
        <div className="p-5 rounded-2xl bg-white border border-border shadow-xs space-y-2">
          <div className="flex items-center justify-between text-ink-muted">
            <span className="text-[11px] font-bold uppercase tracking-wider">Overdue Dues</span>
            <div className="p-2 rounded-lg bg-rose-50 text-critical">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-h3 font-extrabold text-critical tracking-tight truncate">
            {formatINR(kpis.overdueDuesPaise)}
          </div>
          <p className="text-[11px] text-critical/80 font-medium">
            {kpis.overdueDuesCount} student dues past deadline
          </p>
        </div>

        {/* New Enquiries */}
        <div className="p-5 rounded-2xl bg-white border border-border shadow-xs space-y-2">
          <div className="flex items-center justify-between text-ink-muted">
            <span className="text-[11px] font-bold uppercase tracking-wider">New Enquiries</span>
            <div className="p-2 rounded-lg bg-amber-50 text-warning">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="text-h2 font-extrabold text-ink tracking-tight">
            {kpis.newEnquiriesCount}
          </div>
          <p className="text-[11px] text-ink-muted">Awaiting follow-up from website</p>
        </div>
      </div>

      {/* 3. YOUTUBE SYNC STATUS CARD */}
      <DashboardSyncCard lastSync={kpis.lastSyncRun} />

      {/* 4. RECENT ACTIVITY: PAYMENTS & ENQUIRIES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Payments */}
        <div className="p-6 rounded-2xl bg-white border border-border shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div>
              <h2 className="text-body-lg font-bold text-ink">Recent Fee Payments</h2>
              <p className="text-caption text-ink-muted">Latest online and offline transactions</p>
            </div>
            <Link
              href="/admin/payments"
              className="text-caption font-semibold text-primary hover:underline flex items-center gap-1"
            >
              <span>View all</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {kpis.recentPayments.length === 0 ? (
            <div className="py-8 text-center text-caption text-ink-muted">
              No recent payment transactions recorded.
            </div>
          ) : (
            <div className="divide-y divide-border">
              {kpis.recentPayments.map((p) => (
                <div key={p.id} className="py-3 flex items-center justify-between gap-3 text-body-sm">
                  <div>
                    <div className="font-bold text-ink">{p.studentName}</div>
                    <div className="text-[11px] text-ink-muted">
                      {p.batchTitle} · <span className="font-mono text-ink">{p.receiptNo || "Processing"}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-extrabold text-ink">{formatINR(p.amountPaise)}</div>
                    <Badge
                      variant={p.status === "paid" ? "success" : "neutral"}
                      className="text-[10px] capitalize font-semibold"
                    >
                      {p.method.replace("_", " ")}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Enquiries */}
        <div className="p-6 rounded-2xl bg-white border border-border shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div>
              <h2 className="text-body-lg font-bold text-ink">Recent Admission Leads</h2>
              <p className="text-caption text-ink-muted">Prospective student queries</p>
            </div>
            <Link
              href="/admin/enquiries"
              className="text-caption font-semibold text-primary hover:underline flex items-center gap-1"
            >
              <span>View all</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {kpis.recentEnquiries.length === 0 ? (
            <div className="py-8 text-center text-caption text-ink-muted">
              No new inquiries received.
            </div>
          ) : (
            <div className="divide-y divide-border">
              {kpis.recentEnquiries.map((enq) => (
                <div key={enq.id} className="py-3 flex items-center justify-between gap-3 text-body-sm">
                  <div>
                    <div className="font-bold text-ink">{enq.name}</div>
                    <div className="text-[11px] text-ink-muted">
                      {enq.classLevel ? `Class ${enq.classLevel}` : "Class IX–XII"} · {enq.board ? enq.board.toUpperCase() : "CBSE"} ·{" "}
                      <span className="font-mono">{enq.phone}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <a
                      href={`tel:${enq.phone}`}
                      className="p-1.5 rounded-lg border border-border text-ink-muted hover:text-primary hover:bg-primary-soft/30 transition-colors"
                      title="Call Student"
                    >
                      <Phone className="w-3.5 h-3.5" />
                    </a>
                    <a
                      href={`https://wa.me/91${enq.phone}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg border border-border text-ink-muted hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                      title="WhatsApp Chat"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
