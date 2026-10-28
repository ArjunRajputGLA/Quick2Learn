import Link from "next/link";
import { requireRole } from "@/server/auth/session";
import { getAdminBatchesList } from "@/server/data/admin";
import { Button } from "@/components/ui/button";
import { BatchesClient } from "@/components/admin/batches-client";
import {
  Plus,
} from "lucide-react";

export const metadata = {
  title: "Batches · Admin · Quick2Learn",
};

export default async function AdminBatchesPage() {
  const current = await requireRole(["admin", "teacher"]);
  const batches = await getAdminBatchesList(current.user);

  const totalBatches = batches.length;
  const totalSeats = batches.reduce((sum, b) => sum + (b.batch.seatsTotal || 0), 0);
  const totalEnrolled = batches.reduce((sum, b) => sum + b.activeEnrolled, 0);
  const openBatches = batches.filter((b) => b.batch.status === "open").length;
  const featuredBatches = batches.filter((b) => b.batch.isFeatured).length;

  return (
    <div className="space-y-4 w-full pb-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Batches Management</h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-200/80 text-slate-700">
              {totalBatches}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {current.role === "teacher"
              ? "View and manage batches assigned to you."
              : "Create, configure syllabus, and manage admissions and fee plans for all batches."}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/admin/batches/requests">
            <Button variant="outline" size="sm" className="h-8 px-3 text-xs font-semibold border-slate-200 bg-white hover:bg-slate-50 rounded-lg">
              <span>Join Requests Inbox</span>
            </Button>
          </Link>
          {current.role === "admin" && (
            <Link href="/admin/batches/new">
              <Button size="sm" className="h-8 px-3 text-xs gap-1.5 font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-2xs">
                <Plus className="w-3.5 h-3.5" />
                <span>Create Batch</span>
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Summary KPI Tiles Row (Matching Screenshot 3) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="p-3 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Batches</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{totalBatches}</div>
        </div>
        <div className="p-3 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Capacity</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{totalSeats}</div>
        </div>
        <div className="p-3 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Enrolled Students</div>
          <div className="text-2xl font-bold text-emerald-600 mt-1">{totalEnrolled}</div>
        </div>
        <div className="p-3 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Open Batches</div>
          <div className="text-2xl font-bold text-blue-600 mt-1">{openBatches}</div>
        </div>
        <div className="p-3 rounded-xl bg-white border border-slate-200/80 shadow-2xs col-span-2 sm:col-span-1">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Featured</div>
          <div className="text-2xl font-bold text-amber-600 mt-1">{featuredBatches}</div>
        </div>
      </div>

      {/* Batches Table with Live Search and Filters */}
      <BatchesClient batches={batches} userRole={current.role} />
    </div>
  );
}
