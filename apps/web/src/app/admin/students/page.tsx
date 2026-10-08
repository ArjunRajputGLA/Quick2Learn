import { requireRole } from "@/server/auth/session";
import { getAdminStudentsList } from "@/server/data/admin";
import { formatINR } from "@quick2learn/shared";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Search,
  Filter,
  ArrowRight,
  CheckCircle2,
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
  await requireRole(["admin"]);
  const sp = await searchParams;

  const searchQuery = sp.q || undefined;
  const classLevel = sp.class ? parseInt(sp.class, 10) : undefined;
  const board = sp.board || undefined;
  const hasDues = sp.dues === "true" ? true : sp.dues === "false" ? false : undefined;
  const pageIndex = sp.page ? Math.max(0, parseInt(sp.page, 10) - 1) : 0;
  const pageSize = 25;

  const { students, total } = await getAdminStudentsList(
    { id: "admin", role: "admin" },
    {
      search: searchQuery,
      classLevel,
      board,
      hasDues,
      limit: pageSize,
      offset: pageIndex * pageSize,
    },
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-h2 font-extrabold text-ink tracking-tight">Students Directory</h1>
          <p className="text-body-sm text-ink-muted">
            Manage student registrations, course batches, and fee status across Classes IX–XII.
          </p>
        </div>
        <div className="text-caption font-semibold text-ink-muted">
          Total Students: <span className="font-bold text-ink">{total}</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white border border-border shadow-xs space-y-3">
        <form method="GET" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search */}
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 text-ink-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              name="q"
              defaultValue={searchQuery || ""}
              placeholder="Search by name, email, phone..."
              className="w-full pl-9 pr-3 py-2 text-body-sm rounded-xl border border-border bg-white text-ink"
            />
          </div>

          {/* Class Filter */}
          <select
            name="class"
            defaultValue={classLevel ? String(classLevel) : ""}
            className="w-full px-3 py-2 text-body-sm rounded-xl border border-border bg-white text-ink"
          >
            <option value="">All Classes (IX–XII)</option>
            <option value="9">Class IX (9th)</option>
            <option value="10">Class X (10th)</option>
            <option value="11">Class XI (11th)</option>
            <option value="12">Class XII (12th)</option>
          </select>

          {/* Board Filter */}
          <select
            name="board"
            defaultValue={board || ""}
            className="w-full px-3 py-2 text-body-sm rounded-xl border border-border bg-white text-ink"
          >
            <option value="">All Boards</option>
            <option value="cbse">CBSE</option>
            <option value="icse">ICSE</option>
            <option value="isc">ISC</option>
          </select>

          {/* Dues Filter */}
          <select
            name="dues"
            defaultValue={sp.dues || ""}
            className="w-full px-3 py-2 text-body-sm rounded-xl border border-border bg-white text-ink"
          >
            <option value="">All Fee Statuses</option>
            <option value="true">Has Pending Dues</option>
            <option value="false">All Paid Up</option>
          </select>

          <div className="sm:col-span-2 lg:col-span-5 flex items-center justify-end gap-2 pt-1">
            <Link href="/admin/students">
              <Button type="button" variant="outline" size="sm">
                Reset Filters
              </Button>
            </Link>
            <Button type="submit" size="sm" className="gap-1.5 font-semibold">
              <Filter className="w-3.5 h-3.5" />
              Apply Filters
            </Button>
          </div>
        </form>
      </div>

      {/* Students Table */}
      <div className="rounded-2xl border border-border bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-body-sm border-collapse">
            <thead className="bg-surface-subtle border-b border-border text-[11px] font-bold text-ink-muted uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Student</th>
                <th className="py-3.5 px-4">Class &amp; Board</th>
                <th className="py-3.5 px-4">Active Batches</th>
                <th className="py-3.5 px-4">Outstanding Dues</th>
                <th className="py-3.5 px-4">Onboarded</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {students.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-ink-muted">
                    No students match the selected filter criteria.
                  </td>
                </tr>
              ) : (
                students.map((st) => (
                  <tr key={st.userId} className="hover:bg-surface-subtle transition-colors group">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-ink">{st.fullName}</div>
                      <div className="text-[11px] text-ink-muted font-mono">
                        {st.email} {st.phone ? `· ${st.phone}` : ""}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant="neutral" className="text-xs font-semibold">
                        Class {st.classLevel || 12} · {st.board ? st.board.toUpperCase() : "CBSE"}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-ink">{st.activeBatchesCount}</span> batch
                      {st.activeBatchesCount === 1 ? "" : "es"}
                    </td>
                    <td className="py-3.5 px-4">
                      {st.totalPendingDuesPaise > 0 ? (
                        <span className="font-extrabold text-critical">
                          {formatINR(st.totalPendingDuesPaise)}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-success font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5" /> All Paid
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-[11px] text-ink-muted">
                      {st.onboardedAt ? new Date(st.onboardedAt).toLocaleDateString("en-IN") : "Pending"}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link href={`/admin/students/${st.userId}`}>
                        <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs font-semibold">
                          <span>Manage</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Button>
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
