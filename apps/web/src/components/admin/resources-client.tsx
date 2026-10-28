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
  X,
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-slate-200/80 pb-2.5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Study Materials &amp; Notes</h1>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/60">
              {filteredResources.length} Resources
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Upload PDFs directly to S3/MinIO and attach them to chapters, batches, or video lectures.
          </p>
        </div>

        <Button
          onClick={() => setIsUploadOpen(true)}
          size="sm"
          className="h-7.5 px-3 text-xs gap-1.5 font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-2xs shrink-0 cursor-pointer"
        >
          <Upload className="w-3.5 h-3.5" />
          <span>Upload PDF Document</span>
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-2.5 rounded-xl border border-slate-200/80 bg-white shadow-2xs">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search resources by title..."
            className="pl-8 h-7.5 text-xs bg-slate-50/50 border-slate-200 rounded-lg focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2 text-xs flex-wrap">
          <span className="font-semibold text-slate-500 flex items-center gap-1 text-[11px]">
            <Filter className="w-3 h-3" /> Filter:
          </span>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="h-7.5 px-2 py-0.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
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
            className="h-7.5 px-2 py-0.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">All Access</option>
            <option value="public">Public Only</option>
            <option value="enrolled">Enrolled Only</option>
          </select>
        </div>
      </div>

      {/* Upload Modal Drawer */}
      {isUploadOpen && (
        <div
          onClick={() => !isUploading && setIsUploadOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-xl bg-white border border-slate-200/90 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
            role="dialog"
            aria-modal="true"
          >
            <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <Upload className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Upload PDF Study Material</h3>
                  <p className="text-xs text-slate-500">
                    Upload notes, worksheets, formula sheets, or PYQs for your students.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsUploadOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="p-5 space-y-3.5">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-700">
                  Document Title <span className="text-rose-500">*</span>
                </label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Chapter 1 Electric Charges Handwritten Formula Sheet"
                  className="h-8 text-xs rounded-lg border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white text-slate-800"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-700">Material Type</label>
                  <select
                    value={resourceType}
                    onChange={(e) =>
                      setResourceType(
                        e.target.value as "notes" | "worksheet" | "pyq" | "formula_sheet",
                      )
                    }
                    className="w-full px-2.5 h-8 text-xs rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white text-slate-800 font-medium"
                  >
                    <option value="notes">Notes</option>
                    <option value="worksheet">Worksheet / DPP</option>
                    <option value="pyq">Past Year Questions (PYQ)</option>
                    <option value="formula_sheet">Formula Sheet</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-700">Access / Visibility</label>
                  <select
                    value={visibility}
                    onChange={(e) => setVisibility(e.target.value as "public" | "enrolled")}
                    className="w-full px-2.5 h-8 text-xs rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white text-slate-800 font-medium"
                  >
                    <option value="public">Public (q2l-public)</option>
                    <option value="enrolled">Enrolled Only (q2l-private)</option>
                  </select>
                </div>
              </div>

              {/* Attachment selector */}
              <div className="space-y-1.5 pt-1 border-t border-slate-100">
                <label className="text-[11px] font-semibold text-slate-700">Attach To:</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["chapter", "batch", "video"] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setAttachType(t)}
                      className={`h-7.5 text-xs font-semibold rounded-lg border capitalize transition-colors ${
                        attachType === t
                          ? "bg-blue-600 text-white border-blue-600 shadow-2xs"
                          : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
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
                    className="w-full px-2.5 h-8 text-xs rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white text-slate-800 font-medium"
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
                    className="w-full px-2.5 h-8 text-xs rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white text-slate-800 font-medium"
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
                    className="h-8 text-xs font-mono rounded-lg border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white text-slate-800"
                  />
                )}
              </div>

              {/* PDF File Picker */}
              <div className="space-y-1 pt-1 border-t border-slate-100">
                <label className="text-[11px] font-semibold text-slate-700">
                  PDF Document (Max 25 MB) <span className="text-rose-500">*</span>
                </label>
                <div className="p-4 rounded-xl border-2 border-dashed border-slate-200 hover:border-blue-400 bg-slate-50/50 hover:bg-blue-50/30 text-center cursor-pointer transition-colors relative">
                  <input
                    type="file"
                    accept="application/pdf,.pdf"
                    onChange={handleFileChange}
                    disabled={isUploading}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    required
                  />
                  <FileText className="w-7 h-7 text-blue-600 mx-auto mb-1.5" />
                  <p className="text-xs font-semibold text-slate-800">
                    {file ? file.name : "Click to select or drag PDF file here"}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : "Strictly PDF only, up to 25 MB"}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsUploadOpen(false)}
                  disabled={isUploading}
                  className="h-8 px-3 text-xs rounded-lg border-slate-200 text-slate-700 hover:bg-slate-50 font-medium"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isUploading || !file}
                  className="h-8 px-3.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-2xs gap-1.5 disabled:opacity-50"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                      <span>Uploading to S3...</span>
                    </>
                  ) : (
                    <span>Upload &amp; Attach</span>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Resources Table */}
      <div className="rounded-xl border border-slate-200/80 bg-white shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-800 border-collapse">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="py-2 px-3">Title &amp; Key</th>
                <th className="py-2 px-3">Type</th>
                <th className="py-2 px-3">Access</th>
                <th className="py-2 px-3">Attached Target</th>
                <th className="py-2 px-3">Created Date</th>
                <th className="py-2 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredResources.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-xs text-slate-400">
                    No resources match the selected criteria.
                  </td>
                </tr>
              ) : (
                filteredResources.map(({ resource, chapterTitle, batchTitle }) => (
                  <tr key={resource.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2 px-3 max-w-sm">
                      <div className="font-semibold text-xs text-slate-900 truncate">{resource.title}</div>
                      <p className="text-[11px] font-mono text-slate-400 truncate">
                        {resource.storageKey}
                      </p>
                    </td>

                    <td className="py-2 px-3 whitespace-nowrap">
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase bg-slate-100 text-slate-600 border border-slate-200">
                        {resource.type.replace(/_/g, " ")}
                      </span>
                    </td>

                    <td className="py-2 px-3 whitespace-nowrap">
                      {resource.visibility === "public" ? (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <Globe className="w-2.5 h-2.5" /> Public
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                          <Lock className="w-2.5 h-2.5" /> Enrolled Only
                        </span>
                      )}
                    </td>

                    <td className="py-2 px-3 text-[11px] text-slate-500 max-w-xs">
                      {chapterTitle && (
                        <span className="truncate block font-medium text-slate-800">
                          Chapter: {chapterTitle}
                        </span>
                      )}
                      {batchTitle && (
                        <span className="truncate block font-medium text-slate-800">
                          Batch: {batchTitle}
                        </span>
                      )}
                      {resource.videoId && (
                        <span className="truncate block font-mono text-blue-600">
                          Video: {resource.videoId}
                        </span>
                      )}
                      {!chapterTitle && !batchTitle && !resource.videoId && (
                        <span className="italic text-slate-400">Standalone</span>
                      )}
                    </td>

                    <td className="py-2 px-3 whitespace-nowrap text-[11px] text-slate-500">
                      {new Date(resource.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>

                    <td className="py-2 px-3 text-right whitespace-nowrap">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setResourceToDelete({
                            id: resource.id,
                            title: resource.title,
                          })
                        }
                        className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 h-7 w-7 p-0 cursor-pointer rounded-lg"
                        title="Delete resource"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
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