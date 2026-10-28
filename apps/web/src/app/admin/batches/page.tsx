import Link from "next/link";
import { requireRole } from "@/server/auth/session";
import { getAdminBatchesList } from "@/server/data/admin";
import { formatClassRoman } from "@quick2learn/shared";
import { Button } from "@/components/ui/button";
import {
  Plus,
  BookOpen,
  Sparkles,
  ExternalLink,
  Edit,
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
    <div className="space-y-4 max-w-7xl mx-auto pb-8">
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

      {/* Batches Table */}
      {batches.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center space-y-2.5">
          <BookOpen className="w-9 h-9 text-slate-400 mx-auto opacity-60" />
          <h3 className="text-sm font-bold text-slate-900">No batches found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {current.role === "admin"
              ? "Get started by creating your first course batch with syllabus and fee plans."
              : "No batches currently assigned to your faculty profile."}
          </p>
          {current.role === "admin" && (
            <Link href="/admin/batches/new" className="inline-block pt-1">
              <Button size="sm" className="h-8 px-3 text-xs bg-blue-600 text-white rounded-lg">
                Create First Batch
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50/80 border-b border-slate-200/80 text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-3.5">Batch Title</th>
                  <th className="py-2.5 px-3.5">Class &amp; Board</th>
                  <th className="py-2.5 px-3.5">Join Code</th>
                  <th className="py-2.5 px-3.5">Mode</th>
                  <th className="py-2.5 px-3.5">Faculty</th>
                  <th className="py-2.5 px-3.5">Seats</th>
                  <th className="py-2.5 px-3.5">Status</th>
                  <th className="py-2.5 px-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {batches.map(({ batch, facultyName, subjectName, activeEnrolled }) => (
                  <tr key={batch.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 px-3.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 hover:text-blue-600 transition-colors">
                          {batch.title}
                        </span>
                        {batch.isFeatured && (
                          <span
                            className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200"
                            title="Featured on homepage"
                          >
                            <Sparkles className="w-3 h-3 text-amber-600" /> Featured
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                        /{batch.slug} · {subjectName || "Subject"}
                      </p>
                    </td>

                    <td className="py-2.5 px-3.5 whitespace-nowrap">
                      <span className="font-bold text-slate-800">
                        Class {formatClassRoman(batch.classLevel)}
                      </span>
                      <span className="text-[11px] text-slate-500 ml-1.5 uppercase font-medium">
                        ({batch.board})
                      </span>
                    </td>

                    <td className="py-2.5 px-3.5 whitespace-nowrap">
                      <span className="font-mono text-xs font-bold tracking-wider px-2 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-200/80">
                        {batch.joinCode || "—"}
                      </span>
                    </td>

                    <td className="py-2.5 px-3.5 whitespace-nowrap capitalize text-xs text-slate-600 font-medium">
                      {batch.mode}
                    </td>

                    <td className="py-2.5 px-3.5 text-xs text-slate-500">
                      {facultyName || "—"}
                    </td>

                    <td className="py-2.5 px-3.5 whitespace-nowrap font-mono text-xs">
                      <span className="font-bold text-slate-900">{activeEnrolled}</span>
                      <span className="text-slate-400"> / {batch.seatsTotal}</span>
                    </td>

                    <td className="py-2.5 px-3.5 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          batch.status === "open"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : batch.status === "draft"
                            ? "bg-slate-100 text-slate-700 border border-slate-200"
                            : batch.status === "closed"
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : "bg-blue-50 text-blue-700 border border-blue-200"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            batch.status === "open"
                              ? "bg-emerald-500"
                              : batch.status === "draft"
                              ? "bg-slate-400"
                              : batch.status === "closed"
                              ? "bg-amber-500"
                              : "bg-blue-500"
                          }`}
                        />
                        <span className="capitalize">{batch.status}</span>
                      </span>
                    </td>

                    <td className="py-2.5 px-3.5 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/batches/${batch.slug}`}
                          target="_blank"
                          className="p-1 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
                          title="View public page"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                        {current.role === "admin" && (
                          <Link href={`/admin/batches/${batch.id}`}>
                            <Button variant="outline" size="sm" className="gap-1 text-xs h-7 px-2.5 rounded-md border-slate-200 hover:bg-slate-50 font-semibold">
                              <Edit className="w-3 h-3" /> Edit
                            </Button>
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
