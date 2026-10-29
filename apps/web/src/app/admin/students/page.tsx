import { requireRole } from "@/server/auth/session";
import { getAdminStudentsList, getAdminAvailableBatchesWithPlans } from "@/server/data/admin";
import { formatINR } from "@quick2learn/shared";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { RegisterStudentModal } from "@/components/admin/register-student-modal";
import { StudentsFilterBar } from "@/components/admin/students-filter-bar";
import {
  ArrowRight,
  UserPlus,
  MessageSquare,
} from "lucide-react";

export const revalidate = 0;

interface StudentsPageProps {
  searchParams: Promise<{
    q?: string;
    class?: string;
    board?: string;
    dues?: string;
    page?: string;
  }>;
}

export default async function AdminStudentsPage({ searchParams }: StudentsPageProps) {
  const current = await requireRole(["admin"]);
  const sp = await searchParams;

  const searchQuery = sp.q || undefined;
  const classLevel = sp.class ? parseInt(sp.class, 10) : undefined;
  const board = sp.board || undefined;
  const hasDues = sp.dues === "true" ? true : sp.dues === "false" ? false : undefined;
  const pageIndex = sp.page ? Math.max(0, parseInt(sp.page, 10) - 1) : 0;
  const pageSize = 25;

  const authUser = {
    id: current.user.id,
    email: current.user.email,
    name: current.user.name,
    role: current.role,
  };

  const [{ students, total }, availableBatches] = await Promise.all([
    getAdminStudentsList(
      authUser,
      {
        search: searchQuery,
        classLevel,
        board,
        hasDues,
        limit: pageSize,
        offset: pageIndex * pageSize,
      },
    ),
    getAdminAvailableBatchesWithPlans(authUser),
  ]);

  return (
    <div className="space-y-4 w-full pb-8">
      {/* 1. Header matching inspiration */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Students Directory
            </h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-200/80 text-slate-700">
              {total}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage student registrations, course batches, and fee status across Classes IX–XII.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <RegisterStudentModal availableBatches={availableBatches} />
        </div>
      </div>

      {/* 2. Quick Filter Pills Row (Matching Screenshot 1) */}
      <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none">
        <Link
          href="/admin/students"
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs transition-colors shrink-0 ${
            !classLevel && hasDues === undefined
              ? "bg-blue-600 text-white font-semibold shadow-2xs"
              : "bg-white border border-slate-200/80 text-slate-700 hover:bg-slate-50 font-medium"
          }`}
        >
          <span>All Students</span>
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded-full ${
              !classLevel && hasDues === undefined
                ? "bg-blue-700/70 text-white"
                : "bg-slate-100 text-slate-600 font-semibold"
            }`}
          >
            {total}
          </span>
        </Link>

        <Link
          href="/admin/students?class=12"
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs transition-colors shrink-0 ${
            classLevel === 12
              ? "bg-blue-600 text-white font-semibold shadow-2xs"
              : "bg-white border border-slate-200/80 text-slate-700 hover:bg-slate-50 font-medium"
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
          <span>Class XII</span>
        </Link>

        <Link
          href="/admin/students?class=11"
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs transition-colors shrink-0 ${
            classLevel === 11
              ? "bg-blue-600 text-white font-semibold shadow-2xs"
              : "bg-white border border-slate-200/80 text-slate-700 hover:bg-slate-50 font-medium"
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
          <span>Class XI</span>
        </Link>

        <Link
          href="/admin/students?class=10"
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs transition-colors shrink-0 ${
            classLevel === 10
              ? "bg-blue-600 text-white font-semibold shadow-2xs"
              : "bg-white border border-slate-200/80 text-slate-700 hover:bg-slate-50 font-medium"
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
          <span>Class X</span>
        </Link>

        <Link
          href="/admin/students?class=9"
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs transition-colors shrink-0 ${
            classLevel === 9
              ? "bg-blue-600 text-white font-semibold shadow-2xs"
              : "bg-white border border-slate-200/80 text-slate-700 hover:bg-slate-50 font-medium"
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
          <span>Class IX</span>
        </Link>

        <Link
          href="/admin/students?dues=true"
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs transition-colors shrink-0 ${
            hasDues === true
              ? "bg-rose-600 text-white font-semibold shadow-2xs"
              : "bg-white border border-slate-200/80 text-slate-700 hover:bg-slate-50 font-medium"
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
          <span>Pending Dues</span>
        </Link>

        <Link
          href="/admin/students?dues=false"
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs transition-colors shrink-0 ${
            hasDues === false
              ? "bg-emerald-600 text-white font-semibold shadow-2xs"
              : "bg-white border border-slate-200/80 text-slate-700 hover:bg-slate-50 font-medium"
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span>All Paid Up</span>
        </Link>
      </div>

      {/* 3. Filter and Search Bar (Real-time live search as you type) */}
      <StudentsFilterBar
        initialSearch={searchQuery}
        initialClass={classLevel}
        initialBoard={board}
        initialDues={hasDues}
      />

      {/* 4. Students Table */}
      <div className="rounded-xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50/80 border-b border-slate-200/80 text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-3.5">Name &amp; Contact</th>
                <th className="py-2.5 px-3.5">Class &amp; Board</th>
                <th className="py-2.5 px-3.5">Active Batches</th>
                <th className="py-2.5 px-3.5">Fee Status</th>
                <th className="py-2.5 px-3.5">Onboarded</th>
                <th className="py-2.5 px-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {students.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center">
                    <div className="max-w-sm mx-auto space-y-2">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 text-slate-400 flex items-center justify-center mx-auto">
                        <UserPlus className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="font-bold text-slate-800 text-sm">
                        {total === 0 ? "No registered students found" : "No students match filter"}
                      </div>
                      <p className="text-xs text-slate-500">
                        {total === 0
                          ? "Get started by registering your first student with profile, parent details, and course batch."
                          : "Try adjusting or clearing your search and filters to view more student records."}
                      </p>
                      <div className="pt-1">
                        <RegisterStudentModal
                          availableBatches={availableBatches}
                          triggerLabel={total === 0 ? "Register First Student" : "Register New Student"}
                        />
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                students.map((st) => {
                  const initial = (st.fullName || "S").trim().charAt(0).toUpperCase() || "S";
                  return (
                    <tr key={st.userId} className="hover:bg-slate-50/70 transition-colors group">
                      <td className="py-2.5 px-3.5">
                        <div className="flex items-center gap-2.5">
                          {/* Avatar Circle */}
                          <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center border border-slate-200 shrink-0">
                            {initial}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                                {st.fullName}
                              </span>
                              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-500 border border-slate-200">
                                #STU-{st.userId.slice(-4).toUpperCase()}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                              {st.email} {st.phone ? `· ${st.phone}` : ""}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 px-3.5 whitespace-nowrap">
                        <span className="inline-block text-[11px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200/80">
                          Class {st.classLevel || 12} · {st.board ? st.board.toUpperCase() : "CBSE"}
                        </span>
                      </td>
                      <td className="py-2.5 px-3.5 whitespace-nowrap">
                        <span className="font-bold text-slate-900">{st.activeBatchesCount}</span>{" "}
                        <span className="text-slate-500">batch{st.activeBatchesCount === 1 ? "" : "es"}</span>
                      </td>
                      <td className="py-2.5 px-3.5 whitespace-nowrap">
                        {st.totalPendingDuesPaise > 0 ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                            Due: {formatINR(st.totalPendingDuesPaise)}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                            All Paid Up
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3.5 text-[11px] text-slate-500 whitespace-nowrap">
                        {st.onboardedAt ? new Date(st.onboardedAt).toLocaleDateString("en-IN") : "Pending"}
                      </td>
                      <td className="py-2.5 px-3.5 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5 justify-end">
                          <Link href={`/admin/chats?studentId=${st.userId}`}>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 px-2.5 gap-1 text-[11px] font-semibold rounded-md border-slate-200 text-blue-600 hover:text-blue-700 hover:bg-blue-50/70 shadow-2xs"
                              title={`Chat with ${st.fullName}`}
                            >
                              <MessageSquare className="w-3 h-3" />
                              <span>Chat</span>
                            </Button>
                          </Link>
                          <Link href={`/admin/students/${st.userId}`}>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 px-2.5 gap-1 text-[11px] font-semibold rounded-md border-slate-200 hover:bg-slate-50 text-slate-700 shadow-2xs"
                            >
                              <span>Manage</span>
                              <ArrowRight className="w-3 h-3 text-slate-400" />
                            </Button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 