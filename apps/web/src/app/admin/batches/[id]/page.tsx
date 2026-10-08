import { notFound } from "next/navigation";
import Link from "next/link";
import { requireRole } from "@/server/auth/session";
import { getAdminBatchEditorData } from "@/server/data/admin";
import { BatchEditor, type BatchEditorProps } from "@/components/admin/batch-editor";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Edit Batch · Admin · Quick2Learn",
};

interface EditBatchPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminEditBatchPage({ params }: EditBatchPageProps) {
  const current = await requireRole(["admin"]);
  const { id } = await params;

  const data = await getAdminBatchEditorData(current.user, id);
  if (!data.batch) {
    notFound();
  }

  const { batch, feePlans, subjects, faculty, chapters } = data;

  const formattedInitialBatch: NonNullable<BatchEditorProps["initialBatch"]> = {
    id: batch.id,
    title: batch.title,
    slug: batch.slug,
    subtitle: batch.subtitle,
    description: batch.description,
    classLevel: batch.classLevel,
    board: batch.board,
    subjectId: batch.subjectId,
    facultyId: batch.facultyId,
    coverKey: batch.coverKey,
    mode: batch.mode,
    scheduleText: batch.scheduleText,
    locationText: batch.locationText,
    startDate: batch.startDate.toISOString(),
    endDate: batch.endDate ? batch.endDate.toISOString() : null,
    seatsTotal: batch.seatsTotal,
    status: batch.status,
    isFeatured: batch.isFeatured,
    whatsappGroupUrl: batch.whatsappGroupUrl,
    outcomes: batch.outcomes || [],
    syllabus: (batch.syllabus as Array<{
      module: string;
      notes?: string;
      chapters: Array<{ title: string; slug?: string; hasFreePreview?: boolean }>;
    }>) || [],
    faqs: (batch.faqs as Array<{ question: string; answer: string }>) || [],
    feePlans: feePlans.map((p) => ({
      id: p.id,
      name: p.name,
      totalPaise: p.totalPaise,
      originalPaise: p.originalPaise,
      instalments: (p.instalments as Array<{
        name: string;
        amountPaise: number;
        dueDate?: string;
      }>) || [],
      isActive: p.isActive,
    })),
  };

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
          <h1 className="text-display-xs font-bold text-ink">Edit Batch: {batch.title}</h1>
          <p className="text-body-xs text-ink-muted font-mono">
            ID: {batch.id} · Slug: /{batch.slug}
          </p>
        </div>
      </div>

      <BatchEditor
        initialBatch={formattedInitialBatch}
        subjects={subjects}
        faculty={faculty}
        availableChapters={chapters}
      />
    </div>
  );
}
