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

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-display-xs font-bold text-ink">Batches Management</h1>
            <span className="text-body-xs font-bold px-2.5 py-0.5 rounded-full bg-surface-subtle text-ink border border-border">
              {batches.length} total
            </span>
          </div>
          <p className="text-body-sm text-ink-muted mt-1">
            {current.role === "teacher"
              ? "View and manage batches assigned to you."
              : "Create, configure syllabus, and manage admissions and fee plans for all batches."}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/admin/batches/requests">
            <Button variant="outline" size="sm" className="gap-1.5 font-bold">
              <span>Join Requests Inbox</span>
            </Button>
          </Link>
          {current.role === "admin" && (
            <Link href="/admin/batches/new">
              <Button size="sm" className="gap-1.5 font-bold shadow-xs">
                <Plus className="w-4 h-4" />
                <span>Create Batch</span>
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Batches Table */}
      {batches.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-white p-12 text-center space-y-3">
          <BookOpen className="w-10 h-10 text-ink-muted mx-auto opacity-50" />
          <h3 className="text-body-md font-bold text-ink">No batches found</h3>
          <p className="text-body-sm text-ink-muted max-w-sm mx-auto">
            {current.role === "admin"
              ? "Get started by creating your first course batch with syllabus and fee plans."
              : "No batches currently assigned to your faculty profile."}
          </p>
          {current.role === "admin" && (
            <Link href="/admin/batches/new" className="inline-block pt-2">
              <Button size="sm">Create First Batch</Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-white shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-body-sm text-ink border-collapse">
              <thead className="bg-surface-subtle border-b border-border text-[11px] font-bold text-ink-muted uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Batch Title</th>
                  <th className="py-3 px-4">Class & Board</th>
                  <th className="py-3 px-4">Join Code</th>
                  <th className="py-3 px-4">Mode</th>
                  <th className="py-3 px-4">Faculty</th>
                  <th className="py-3 px-4">Seats</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {batches.map(({ batch, facultyName, subjectName, activeEnrolled }) => (
                  <tr key={batch.id} className="hover:bg-surface-subtle/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-ink hover:text-primary transition-colors">
                          {batch.title}
                        </span>
                        {batch.isFeatured && (
                          <span
                            className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200"
                            title="Featured on homepage"
                          >
                            <Sparkles className="w-3 h-3 text-amber-600" /> Featured
                          </span>
                        )}
                      </div>
                      <p className="text-body-xs font-mono text-ink-muted mt-0.5">
                        /{batch.slug} · {subjectName || "Subject"}
                      </p>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="font-semibold text-ink">
                        Class {formatClassRoman(batch.classLevel)}
                      </span>
                      <span className="text-body-xs text-ink-muted ml-1.5 uppercase font-medium">
                        ({batch.board})
                      </span>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="font-mono text-xs font-black tracking-wider px-2 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-200">
                        {batch.joinCode || "—"}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap capitalize text-body-xs font-medium">
                      {batch.mode}
                    </td>

                    <td className="py-3.5 px-4 text-body-xs text-ink-muted">
                      {facultyName || "—"}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap font-mono text-body-xs">
                      <span className="font-bold text-ink">{activeEnrolled}</span>
                      <span className="text-ink-muted"> / {batch.seatsTotal}</span>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                          batch.status === "open"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : batch.status === "draft"
                            ? "bg-neutral-subtle text-ink-muted border border-border"
                            : batch.status === "closed"
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : "bg-blue-50 text-blue-700 border border-blue-200"
                        }`}
                      >
                        {batch.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/batches/${batch.slug}`}
                          target="_blank"
                          className="p-1.5 rounded-md hover:bg-neutral-subtle text-ink-muted hover:text-ink"
                          title="View public page"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                        {current.role === "admin" && (
                          <Link href={`/admin/batches/${batch.id}`}>
                            <Button variant="outline" size="sm" className="gap-1 text-xs h-7 px-2.5">
                              <Edit className="w-3.5 h-3.5" /> Edit
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
