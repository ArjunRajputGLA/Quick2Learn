import Link from "next/link";
import { requireRole } from "@/server/auth/session";
import { getAdminBatchEditorData } from "@/server/data/admin";
import { BatchEditor } from "@/components/admin/batch-editor";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Create New Batch · Admin · Quick2Learn",
};

export default async function AdminNewBatchPage() {
  const current = await requireRole(["admin"]);

  const { subjects, faculty, chapters } = await getAdminBatchEditorData(current.user);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div className="flex items-center gap-3 border-b border-border pb-4">
        <Link
          href="/admin/batches"
          className="p-2 rounded-lg border border-border bg-white text-ink-muted hover:text-ink hover:bg-surface-subtle transition-colors"
          title="Back to batches"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-display-xs font-bold text-ink">Create New Batch</h1>
          <p className="text-body-xs text-ink-muted">
            Configure course overview, syllabus modules, outcomes, and fee instalment plans.
          </p>
        </div>
      </div>

      <BatchEditor
        subjects={subjects}
        faculty={faculty}
        availableChapters={chapters}
      />
    </div>
  );
}
