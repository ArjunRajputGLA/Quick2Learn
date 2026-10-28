import { redirect } from "next/navigation";
import { getAdminSession } from "@/server/auth/session";
import { getAdminDashboardKPIs } from "@/server/data/admin";
import { formatINR } from "@quick2learn/shared";
import { DashboardSyncCard } from "@/components/admin/dashboard-sync-card";
import { AdminLoginForm } from "@/components/admin/admin-login-form";
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
  HelpCircle,
  CreditCard,
  ChevronRight,
  TrendingUp,
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

  // Time-based greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";
  const firstName = session.user.name ? session.user.name.split(" ")[0] : "Admin";

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* 1. GREETING HEADER (Matching Inspiration Screenshot 2) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {greeting}, {firstName} Sir
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Overview of student enrollments, fee collections, and active institute operations today.
          </p>
        </div>
      </div>

      {/* 2. STAT KPI CARDS (Matching Inspiration Screenshot 2 with top-right circular icon pills) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Collections this month */}
        <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Monthly Collections</span>
            <div className="w-7 h-7 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
              <IndianRupee className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 tracking-tight truncate">
              {formatINR(kpis.collectionsThisMonthPaise)}
            </div>
            <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-semibold mt-1">
              <TrendingUp className="w-3 h-3" />
              <span>Net tuition fee collected</span>
            </div>
          </div>
        </div>

        {/* Overdue dues */}
        <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Pending Dues</span>
            <div className="w-7 h-7 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-xs">
              <AlertTriangle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-rose-600 tracking-tight truncate">
              {formatINR(kpis.overdueDuesPaise)}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              <span className="font-semibold text-rose-600">{kpis.overdueDuesCount} students</span> with pending fees
            </div>
          </div>
        </div>

        {/* Active Students */}
        <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Active Students</span>
            <div className="w-7 h-7 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs">
              <Users className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 tracking-tight">
              {kpis.activeStudentsCount}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Enrolled in regular batches
            </div>
          </div>
        </div>

        {/* Monthly Enrolments */}
        <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">New Enrolments</span>
            <div className="w-7 h-7 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
              <GraduationCap className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-emerald-600 tracking-tight">
              +{kpis.enrolmentsThisMonth}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              New batch joins this month
            </div>
          </div>
        </div>

        {/* New Enquiries */}
        <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">New Enquiries</span>
            <div className="w-7 h-7 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-xs">
              <MessageSquare className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 tracking-tight">
              {kpis.newEnquiriesCount}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Awaiting follow-up from web
            </div>
          </div>
        </div>
      </div>

      {/* 3. FOUR MODULE NAVIGATION CARDS (Matching Inspiration Row 2) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Students & Admissions */}
        <Link
          href="/admin/students"
          className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs hover:shadow-sm hover:border-blue-200 transition-all group flex flex-col justify-between space-y-3"
        >
          <div className="space-y-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 group-hover:text-blue-600 transition-colors">
                Students &amp; Admissions
              </h3>
              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                Manage student profiles, parent contacts, course batches, and dues status.
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs font-semibold text-slate-600 group-hover:text-blue-600 transition-colors">
            <span>Open Students Directory</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 transition-colors" />
          </div>
        </Link>

        {/* Batches & Timetable */}
        <Link
          href="/admin/batches"
          className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs hover:shadow-sm hover:border-amber-200 transition-all group flex flex-col justify-between space-y-3"
        >
          <div className="space-y-2">
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <GraduationCap className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 group-hover:text-amber-600 transition-colors">
                Batches &amp; Timetable
              </h3>
              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                Configure syllabus, class timings, seat capacities, join codes, and admissions.
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs font-semibold text-slate-600 group-hover:text-amber-600 transition-colors">
            <span>Open Batches</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-600 transition-colors" />
          </div>
        </Link>

        {/* Question Bank & Tests */}
        <Link
          href="/admin/questions"
          className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs hover:shadow-sm hover:border-indigo-200 transition-all group flex flex-col justify-between space-y-3"
        >
          <div className="space-y-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <HelpCircle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 group-hover:text-indigo-600 transition-colors">
                Question Bank &amp; Tests
              </h3>
              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                Build Maths &amp; Science questions with LaTeX, MCQs, and publish chapter tests.
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs font-semibold text-slate-600 group-hover:text-indigo-600 transition-colors">
            <span>Open Question Bank</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 transition-colors" />
          </div>
        </Link>

        {/* Fee Payments & Collections */}
        <Link
          href="/admin/payments"
          className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs hover:shadow-sm hover:border-emerald-200 transition-all group flex flex-col justify-between space-y-3"
        >
          <div className="space-y-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 group-hover:text-emerald-600 transition-colors">
                Fee Payments &amp; Dues
              </h3>
              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                Review verified Razorpay &amp; offline fees, generate receipts, and audit collections.
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs font-semibold text-slate-600 group-hover:text-emerald-600 transition-colors">
            <span>Open Payments Ledger</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 transition-colors" />
          </div>
        </Link>
      </div>

      {/* 4. YOUTUBE CHANNEL SYNC CARD */}
      <DashboardSyncCard lastSync={kpis.lastSyncRun} />

      {/* 5. RECENT ACTIVITY: PAYMENTS & ENQUIRIES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Payments */}
        <div className="p-4 sm:p-5 rounded-xl bg-white border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Recent Fee Payments</h2>
              <p className="text-[11px] text-slate-500">Latest online and offline transactions</p>
            </div>
            <Link
              href="/admin/payments"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1"
            >
              <span>View all</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {kpis.recentPayments.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-400">
              No recent payment transactions recorded.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {kpis.recentPayments.map((p) => {
                const initial = p.studentName ? p.studentName.charAt(0).toUpperCase() : "S";
                return (
                  <div key={p.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-blue-50 text-blue-600 text-[11px] font-bold flex items-center justify-center shrink-0">
                        {initial}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">{p.studentName}</div>
                        <div className="text-[11px] text-slate-500">
                          {p.batchTitle} · <span className="font-mono text-slate-700">{p.receiptNo || "Processing"}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-slate-900">{formatINR(p.amountPaise)}</div>
                      <span className="inline-block text-[10px] font-semibold text-slate-500 capitalize bg-slate-100 px-1.5 py-0.5 rounded">
                        {p.method.replace("_", " ")}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Admission Leads */}
        <div className="p-4 sm:p-5 rounded-xl bg-white border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Recent Admission Leads</h2>
              <p className="text-[11px] text-slate-500">Prospective student queries from website</p>
            </div>
            <Link
              href="/admin/enquiries"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1"
            >
              <span>View all</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {kpis.recentEnquiries.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-400">
              No new inquiries received.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {kpis.recentEnquiries.map((enq) => {
                const initial = enq.name ? enq.name.charAt(0).toUpperCase() : "E";
                return (
                  <div key={enq.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 text-[11px] font-bold flex items-center justify-center shrink-0">
                        {initial}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">{enq.name}</div>
                        <div className="text-[11px] text-slate-500">
                          {enq.classLevel ? `Class ${enq.classLevel}` : "Class IX–XII"} · {enq.board ? enq.board.toUpperCase() : "CBSE"} ·{" "}
                          <span className="font-mono text-slate-700">{enq.phone}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <a
                        href={`tel:${enq.phone}`}
                        className="p-1 rounded-md border border-slate-200 text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        title="Call Student"
                      >
                        <Phone className="w-3 h-3 text-emerald-600" />
                      </a>
                      <a
                        href={`https://wa.me/91${enq.phone}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 rounded-md border border-slate-200 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                        title="WhatsApp Chat"
                      >
                        <MessageCircle className="w-3 h-3 text-emerald-600" />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
