"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  getPresignedUploadUrlAction,
  createResourceAction,
  deleteResourceAction,
} from "@/server/admin-actions";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import {
  Upload,
  FileText,
  Trash2,
  Lock,
  Globe,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Search,
  Filter,
} from "lucide-react";

export interface ResourceRow {
  resource: {
    id: string;
    title: string;
    type: "notes" | "worksheet" | "pyq" | "formula_sheet";
    storageKey: string;
    storageBucket: "public" | "private";
    visibility: "public" | "enrolled";
    chapterId: string | null;
    batchId: string | null;
    videoId: string | null;
    createdAt: Date | string;
  };
  chapterTitle: string | null;
  batchTitle: string | null;
}

interface ResourcesClientProps {
  resources: ResourceRow[];
  chapters: Array<{ id: string; title: string; classLevel: number }>;
  batches: Array<{ id: string; title: string }>;
}

export function ResourcesClient({
  resources,
  chapters,
  batches,
}: ResourcesClientProps) {
  const router = useRouter();

  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterVisibility, setFilterVisibility] = useState<string>("all");

  // Upload Form State
  const [title, setTitle] = useState("");
  const [resourceType, setResourceType] = useState<
    "notes" | "worksheet" | "pyq" | "formula_sheet"
  >("notes");
  const [visibility, setVisibility] = useState<"public" | "enrolled">("public");
  const [attachType, setAttachType] = useState<"chapter" | "batch" | "video">("chapter");
  const [selectedChapterId, setSelectedChapterId] = useState("");
  const [selectedBatchId, setSelectedBatchId] = useState("");
  const [videoId, setVideoId] = useState("");
  const [file, setFile] = useState<File | null>(null);

  // Status & Progress
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Deletion Dialog
  const [resourceToDelete, setResourceToDelete] = useState<{
    id: string;
    title: string;
  } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (selected.type !== "application/pdf" && !selected.name.toLowerCase().endsWith(".pdf")) {
      setErrorMsg("Only PDF documents (.pdf) are allowed.");
      setFile(null);
      return;
    }

    if (selected.size > 26214400) {
      setErrorMsg("File exceeds the maximum limit of 25 MB.");
      setFile(null);
      return;
    }

    setErrorMsg(null);
    setFile(selected);
    if (!title.trim()) {
      // Auto-populate clean title from filename
      const clean = selected.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
      setTitle(clean);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setErrorMsg("Please select a PDF document to upload.");
      return;
    }
    if (!title.trim()) {
      setErrorMsg("Title is required.");
      return;
    }

    setIsUploading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const bucket = visibility === "public" ? "public" : "private";
      const folder = bucket === "public" ? "resources/public" : "resources/private";

      // 1. Get presigned upload URL
      const presignedRes = await getPresignedUploadUrlAction({
        filename: file.name,
        contentType: "application/pdf",
        sizeBytes: file.size,
        folder,
      });

      if (!presignedRes.success || !presignedRes.data) {
        throw new Error(presignedRes.error || "Failed to initiate upload");
      }

      const { uploadUrl, key } = presignedRes.data;

      // 2. Direct PUT to S3 / MinIO
      const putRes = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": "application/pdf",
        },
      });

      if (!putRes.ok) {
        throw new Error(`Direct upload failed with status ${putRes.status}`);
      }

      // 3. Save resource record to database
      const saveRes = await createResourceAction({
        title: title.trim(),
        type: resourceType,
        storageKey: key,
        storageBucket: bucket,
        visibility,
        chapterId: attachType === "chapter" && selectedChapterId ? selectedChapterId : null,
        batchId: attachType === "batch" && selectedBatchId ? selectedBatchId : null,
        videoId: attachType === "video" && videoId.trim() ? videoId.trim() : null,
      });

      if (!saveRes.success) {
        throw new Error(saveRes.error || "Failed to register resource in database");
      }

      setSuccessMsg(`"${title}" uploaded successfully.`);
      setIsUploadOpen(false);
      setTitle("");
      setFile(null);
      router.refresh();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  // Filter list
  const filteredResources = resources.filter((r) => {
    if (filterType !== "all" && r.resource.type !== filterType) return false;
    if (filterVisibility !== "all" && r.resource.visibility !== filterVisibility) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        r.resource.title.toLowerCase().includes(q) ||
        (r.chapterTitle && r.chapterTitle.toLowerCase().includes(q)) ||
        (r.batchTitle && r.batchTitle.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleDelete = async () => {
    if (!resourceToDelete) return;
    try {
      const res = await deleteResourceAction(resourceToDelete.id);
      if (!res.success) {
        throw new Error(res.error || "Failed to delete");
      }
      setSuccessMsg(`Resource "${resourceToDelete.title}" deleted.`);
      router.refresh();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to delete resource");
    } finally {
      setResourceToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Alert Notices */}
      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-body-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span className="font-medium">{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-critical/10 border border-critical/30 text-critical text-body-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="font-medium">{errorMsg}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
        <div>
          <h1 className="text-display-xs font-bold text-ink">Study Materials & Notes</h1>
          <p className="text-body-sm text-ink-muted">
            Upload PDFs directly to S3/MinIO and attach them to chapters, batches, or video lectures.
          </p>
        </div>

        <Button
          onClick={() => setIsUploadOpen(true)}
          size="sm"
          className="gap-1.5 font-bold shadow-xs shrink-0"
        >
          <Upload className="w-4 h-4" />
          <span>Upload PDF Document</span>
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-border bg-white shadow-xs">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search resources by title..."
            className="pl-9 h-9 text-body-xs"
          />
        </div>

        <div className="flex items-center gap-2 text-body-xs flex-wrap">
          <span className="font-semibold text-ink-muted flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Filter:
          </span>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-border bg-white text-ink font-medium"
          >
            <option value="all">All Types</option>
            <option value="notes">Notes</option>
            <option value="worksheet">Worksheet</option>
            <option value="pyq">PYQ</option>
            <option value="formula_sheet">Formula Sheet</option>
          </select>

          <select
            value={filterVisibility}
            onChange={(e) => setFilterVisibility(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-border bg-white text-ink font-medium"
          >
            <option value="all">All Access</option>
            <option value="public">Public Only</option>
            <option value="enrolled">Enrolled Only</option>
          </select>
        </div>
      </div>

      {/* Upload Modal Drawer */}
      {isUploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="w-full max-w-lg rounded-2xl bg-white border border-border p-6 shadow-xl space-y-4 animate-in zoom-in-95 duration-150"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-body-md font-bold text-ink flex items-center gap-2">
                <Upload className="w-4 h-4 text-primary" />
                <span>Upload PDF Study Material</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsUploadOpen(false)}
                className="text-ink-muted hover:text-ink text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-body-xs font-semibold text-ink">
                  Document Title <span className="text-critical">*</span>
                </label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Chapter 1 Electric Charges Handwritten Formula Sheet"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-body-xs font-semibold text-ink">Material Type</label>
                  <select
                    value={resourceType}
                    onChange={(e) =>
                      setResourceType(
                        e.target.value as "notes" | "worksheet" | "pyq" | "formula_sheet",
                      )
                    }
                    className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-white text-body-xs text-ink font-medium"
                  >
                    <option value="notes">Notes</option>
                    <option value="worksheet">Worksheet / DPP</option>
                    <option value="pyq">Past Year Questions (PYQ)</option>
                    <option value="formula_sheet">Formula Sheet</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-body-xs font-semibold text-ink">Access / Visibility</label>
                  <select
                    value={visibility}
                    onChange={(e) => setVisibility(e.target.value as "public" | "enrolled")}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-white text-body-xs text-ink font-medium"
                  >
                    <option value="public">Public (q2l-public)</option>
                    <option value="enrolled">Enrolled Only (q2l-private)</option>
                  </select>
                </div>
              </div>

              {/* Attachment selector */}
              <div className="space-y-2 pt-1 border-t border-border">
                <label className="text-body-xs font-semibold text-ink">Attach To:</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["chapter", "batch", "video"] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setAttachType(t)}
                      className={`py-1.5 text-xs font-semibold rounded-lg border capitalize transition-colors ${
                        attachType === t
                          ? "bg-primary text-white border-primary"
                          : "bg-surface-subtle text-ink-muted border-border hover:bg-neutral-subtle"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>

                {attachType === "chapter" && (
                  <select
                    value={selectedChapterId}
                    onChange={(e) => setSelectedChapterId(e.target.value)}
                    className="w-full mt-2 px-2.5 py-1.5 rounded-lg border border-border bg-white text-body-xs text-ink"
                  >
                    <option value="">Choose a Chapter...</option>
                    {chapters.map((c) => (
                      <option key={c.id} value={c.id}>
                        Class {c.classLevel} · {c.title}
                      </option>
                    ))}
                  </select>
                )}

                {attachType === "batch" && (
                  <select
                    value={selectedBatchId}
                    onChange={(e) => setSelectedBatchId(e.target.value)}
                    className="w-full mt-2 px-2.5 py-1.5 rounded-lg border border-border bg-white text-body-xs text-ink"
                  >
                    <option value="">Choose a Batch...</option>
                    {batches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.title}
                      </option>
                    ))}
                  </select>
                )}

                {attachType === "video" && (
                  <Input
                    value={videoId}
                    onChange={(e) => setVideoId(e.target.value)}
                    placeholder="Enter YouTube Video ID (e.g. dQw4w9WgXcQ)"
                    className="mt-2 text-body-xs font-mono"
                  />
                )}
              </div>

              {/* PDF File Picker */}
              <div className="space-y-1.5 pt-1 border-t border-border">
                <label className="text-body-xs font-semibold text-ink">
                  PDF Document (Max 25 MB) <span className="text-critical">*</span>
                </label>
                <div className="p-4 rounded-xl border-2 border-dashed border-border bg-surface-subtle hover:bg-neutral-subtle/50 text-center cursor-pointer transition-colors relative">
                  <input
                    type="file"
                    accept="application/pdf,.pdf"
                    onChange={handleFileChange}
                    disabled={isUploading}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    required
                  />
                  <FileText className="w-8 h-8 text-primary mx-auto mb-1.5" />
                  <p className="text-body-xs font-semibold text-ink">
                    {file ? file.name : "Click to select or drag PDF file here"}
                  </p>
                  <p className="text-[11px] text-ink-muted mt-0.5">
                    {file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : "Strictly PDF only, up to 25 MB"}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsUploadOpen(false)}
                  disabled={isUploading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isUploading || !file}
                  className="gap-2 font-bold"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Uploading to S3...</span>
                    </>
                  ) : (
                    <span>Upload & Attach</span>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Resources Table */}
      <div className="rounded-2xl border border-border bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-body-sm text-ink border-collapse">
            <thead className="bg-surface-subtle border-b border-border text-[11px] font-bold text-ink-muted uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Title & Key</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Access</th>
                <th className="py-3 px-4">Attached Target</th>
                <th className="py-3 px-4">Created Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredResources.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-ink-muted">
                    No resources match the selected criteria.
                  </td>
                </tr>
              ) : (
                filteredResources.map(({ resource, chapterTitle, batchTitle }) => (
                  <tr key={resource.id} className="hover:bg-surface-subtle/80 transition-colors">
                    <td className="py-3.5 px-4 max-w-sm">
                      <div className="font-bold text-ink truncate">{resource.title}</div>
                      <p className="text-body-xs font-mono text-ink-muted truncate">
                        {resource.storageKey}
                      </p>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold uppercase bg-surface-subtle text-ink-muted border border-border">
                        {resource.type.replace(/_/g, " ")}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {resource.visibility === "public" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <Globe className="w-3 h-3" /> Public
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                          <Lock className="w-3 h-3" /> Enrolled Only
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-body-xs text-ink-muted max-w-xs">
                      {chapterTitle && (
                        <span className="truncate block font-medium text-ink">
                          Chapter: {chapterTitle}
                        </span>
                      )}
                      {batchTitle && (
                        <span className="truncate block font-medium text-ink">
                          Batch: {batchTitle}
                        </span>
                      )}
                      {resource.videoId && (
                        <span className="truncate block font-mono text-primary">
                          Video: {resource.videoId}
                        </span>
                      )}
                      {!chapterTitle && !batchTitle && !resource.videoId && (
                        <span className="italic text-ink-muted">Standalone</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap text-body-xs text-ink-muted">
                      {new Date(resource.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setResourceToDelete({
                            id: resource.id,
                            title: resource.title,
                          })
                        }
                        className="text-ink-muted hover:text-critical h-8 w-8 p-0"
                        title="Delete resource"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!resourceToDelete}
        title="Delete Study Material?"
        description="This will permanently remove the resource record and detach it from all enrolled student notes views."
        affectedItemName={resourceToDelete?.title}
        confirmLabel="Delete Permanently"
        isDestructive={true}
        onConfirm={handleDelete}
        onCancel={() => setResourceToDelete(null)}
      />
    </div>
  );
}
