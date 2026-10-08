"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  createAnnouncementAction,
  deleteAnnouncementAction,
} from "@/server/admin-actions";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { MathText } from "@/components/ui/math-text";
import {
  Megaphone,
  Pin,
  Trash2,
  Users,
  Globe,
  GraduationCap,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Plus,
} from "lucide-react";

export interface AnnouncementItem {
  announcement: {
    id: string;
    title: string;
    body: string;
    audience: "public" | "all_students" | "batch";
    batchId: string | null;
    isPinned: boolean;
    publishedAt: Date | string;
    createdAt: Date | string;
  };
  batchTitle: string | null;
}

interface AnnouncementsClientProps {
  announcements: AnnouncementItem[];
  batches: Array<{ id: string; title: string }>;
}

export function AnnouncementsClient({
  announcements,
  batches,
}: AnnouncementsClientProps) {
  const router = useRouter();

  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState<"public" | "all_students" | "batch">(
    "all_students",
  );
  const [batchId, setBatchId] = useState<string>("");
  const [isPinned, setIsPinned] = useState(false);
  const [publishedAt, setPublishedAt] = useState<string>(
    new Date().toISOString().slice(0, 16),
  );
  const [tab, setTab] = useState<"write" | "preview">("write");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Deletion
  const [toDelete, setToDelete] = useState<{ id: string; title: string } | null>(
    null,
  );

  const handleComposeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      setErrorMsg("Title and body are required.");
      return;
    }
    if (audience === "batch" && !batchId) {
      setErrorMsg("Please select the target batch.");
      return;
    }

    setIsSubmitting(true);
    setStatusMsg(null);
    setErrorMsg(null);

    try {
      const res = await createAnnouncementAction({
        title: title.trim(),
        body: body.trim(),
        audience,
        batchId: audience === "batch" ? batchId : null,
        isPinned,
        publishedAt: publishedAt ? new Date(publishedAt).toISOString() : undefined,
      });

      if (!res.success) {
        throw new Error(res.error || "Failed to publish announcement");
      }

      setStatusMsg(`Announcement "${title}" posted successfully.`);
      setIsComposeOpen(false);
      setTitle("");
      setBody("");
      router.refresh();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to post announcement");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    try {
      const res = await deleteAnnouncementAction(toDelete.id);
      if (!res.success) {
        throw new Error(res.error || "Failed to delete");
      }
      setStatusMsg(`Deleted "${toDelete.title}".`);
      router.refresh();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Deletion failed");
    } finally {
      setToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      {statusMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-body-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span className="font-semibold">{statusMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-critical/10 border border-critical/30 text-critical text-body-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="font-semibold">{errorMsg}</span>
        </div>
      )}

      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-display-xs font-bold text-ink">Announcements & Notices</h1>
          <p className="text-body-sm text-ink-muted">
            Post markdown announcements for the whole institute, public visitors, or specific batches.
          </p>
        </div>

        <Button
          onClick={() => setIsComposeOpen(true)}
          size="sm"
          className="gap-1.5 font-bold shadow-xs shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Announcement</span>
        </Button>
      </div>

      {/* Compose Modal */}
      {isComposeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="w-full max-w-2xl rounded-2xl bg-white border border-border p-6 shadow-xl space-y-4 animate-in zoom-in-95 duration-150"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-body-md font-bold text-ink flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-primary" />
                <span>Compose Announcement</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsComposeOpen(false)}
                className="text-ink-muted hover:text-ink text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleComposeSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-body-xs font-semibold text-ink">
                  Title <span className="text-critical">*</span>
                </label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Schedule Update: Physics Special Doubt Session on Sunday"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-body-xs font-semibold text-ink">Audience</label>
                  <select
                    value={audience}
                    onChange={(e) =>
                      setAudience(
                        e.target.value as "public" | "all_students" | "batch",
                      )
                    }
                    className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-white text-body-xs text-ink font-medium"
                  >
                    <option value="all_students">All Students (Dashboard)</option>
                    <option value="public">Public (Homepage Announcement Bar)</option>
                    <option value="batch">One Specific Batch Only</option>
                  </select>
                </div>

                {audience === "batch" && (
                  <div className="space-y-1.5">
                    <label className="text-body-xs font-semibold text-ink">
                      Target Batch <span className="text-critical">*</span>
                    </label>
                    <select
                      value={batchId}
                      onChange={(e) => setBatchId(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-white text-body-xs text-ink font-medium"
                      required
                    >
                      <option value="">Select a Batch...</option>
                      {batches.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.title}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-body-xs font-semibold text-ink">
                    Schedule Publish Time
                  </label>
                  <Input
                    type="datetime-local"
                    value={publishedAt}
                    onChange={(e) => setPublishedAt(e.target.value)}
                    className="text-body-xs"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPinned}
                    onChange={(e) => setIsPinned(e.target.checked)}
                    className="w-4 h-4 rounded text-primary"
                  />
                  <span className="text-body-xs font-semibold text-ink flex items-center gap-1">
                    <Pin className="w-3.5 h-3.5 text-primary" /> Pin to top of feed
                  </span>
                </label>
              </div>

              {/* Markdown Body & Preview */}
              <div className="space-y-2 pt-2 border-t border-border">
                <div className="flex items-center justify-between">
                  <label className="text-body-xs font-semibold text-ink">
                    Content (Markdown & LaTeX supported) <span className="text-critical">*</span>
                  </label>
                  <div className="flex rounded-lg border border-border p-0.5 bg-surface-subtle">
                    <button
                      type="button"
                      onClick={() => setTab("write")}
                      className={`px-2.5 py-0.5 text-xs font-semibold rounded ${
                        tab === "write" ? "bg-white text-ink shadow-xs" : "text-ink-muted"
                      }`}
                    >
                      Write
                    </button>
                    <button
                      type="button"
                      onClick={() => setTab("preview")}
                      className={`px-2.5 py-0.5 text-xs font-semibold rounded ${
                        tab === "preview" ? "bg-white text-ink shadow-xs" : "text-ink-muted"
                      }`}
                    >
                      Preview
                    </button>
                  </div>
                </div>

                {tab === "write" ? (
                  <Textarea
                    rows={6}
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="Write details... E.g. Dear students, please bring your NCERT Volume 1 for the revision test."
                    className="font-mono text-body-sm"
                    required
                  />
                ) : (
                  <div className="p-3.5 rounded-xl border border-border bg-surface-subtle min-h-[140px] text-body-sm text-ink prose max-w-none">
                    <MathText content={body || "*Nothing to preview*"} />
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsComposeOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={isSubmitting} className="font-bold">
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-1" />
                      <span>Publishing...</span>
                    </>
                  ) : (
                    <span>Publish Announcement</span>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Announcements Table */}
      <div className="rounded-2xl border border-border bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-body-sm text-ink border-collapse">
            <thead className="bg-surface-subtle border-b border-border text-[11px] font-bold text-ink-muted uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Title & Details</th>
                <th className="py-3 px-4">Audience</th>
                <th className="py-3 px-4">Pinned</th>
                <th className="py-3 px-4">Publish Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {announcements.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-ink-muted">
                    No announcements posted yet. Use "New Announcement" above.
                  </td>
                </tr>
              ) : (
                announcements.map(({ announcement, batchTitle }) => (
                  <tr key={announcement.id} className="hover:bg-surface-subtle/80 transition-colors">
                    <td className="py-3.5 px-4 max-w-md">
                      <div className="font-bold text-ink">{announcement.title}</div>
                      <p className="text-body-xs text-ink-muted line-clamp-1 mt-0.5">
                        {announcement.body}
                      </p>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {announcement.audience === "public" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <Globe className="w-3 h-3" /> Public
                        </span>
                      ) : announcement.audience === "batch" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                          <GraduationCap className="w-3 h-3" /> {batchTitle || "Batch"}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                          <Users className="w-3 h-3" /> All Students
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {announcement.isPinned ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                          <Pin className="w-3 h-3 text-amber-600" /> Pinned
                        </span>
                      ) : (
                        <span className="text-ink-muted text-body-xs">—</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap text-body-xs text-ink-muted">
                      {new Date(announcement.publishedAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setToDelete({
                            id: announcement.id,
                            title: announcement.title,
                          })
                        }
                        className="text-ink-muted hover:text-critical h-8 w-8 p-0"
                        title="Delete announcement"
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

      <ConfirmDialog
        isOpen={!!toDelete}
        title="Delete Announcement?"
        description="This will remove the notice from all student feeds and public announcements."
        affectedItemName={toDelete?.title}
        confirmLabel="Delete Notice"
        isDestructive={true}
        onConfirm={handleDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
