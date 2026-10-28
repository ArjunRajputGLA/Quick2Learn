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
  Search,
  X,
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
  const [notifyParents, setNotifyParents] = useState(false);
  const [attachmentKeys] = useState<string[]>([]);
  const [publishedAt, setPublishedAt] = useState<string>(
    new Date().toISOString().slice(0, 16),
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [audienceFilter, setAudienceFilter] = useState("all");
  const [pinnedFilter, setPinnedFilter] = useState("all");
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
        attachmentKeys,
        notifyParents,
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

  const totalAnnouncements = announcements.length;
  const allStudentsCount = announcements.filter((a) => a.announcement.audience === "all_students").length;
  const batchCount = announcements.filter((a) => a.announcement.audience === "batch").length;
  const pinnedCount = announcements.filter((a) => a.announcement.isPinned).length;

  const filteredAnnouncements = announcements.filter(({ announcement, batchTitle }) => {
    if (audienceFilter !== "all" && announcement.audience !== audienceFilter) return false;
    if (pinnedFilter === "pinned" && !announcement.isPinned) return false;
    if (pinnedFilter === "unpinned" && announcement.isPinned) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchTitle = announcement.title.toLowerCase().includes(q);
      const matchBody = announcement.body.toLowerCase().includes(q);
      const matchBatch = batchTitle ? batchTitle.toLowerCase().includes(q) : false;
      if (!matchTitle && !matchBody && !matchBatch) return false;
    }
    return true;
  });

  const hasFilters = searchQuery.trim() !== "" || audienceFilter !== "all" || pinnedFilter !== "all";

  return (
    <div className="space-y-4">
      {statusMsg && (
        <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
          <span className="font-semibold">{statusMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
          <span className="font-semibold">{errorMsg}</span>
        </div>
      )}

      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Announcements &amp; Notices</h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-200/80 text-slate-700">
              {totalAnnouncements}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Post announcements for the whole institute, public visitors, or specific batches.
          </p>
        </div>

        <Button
          onClick={() => setIsComposeOpen(true)}
          size="sm"
          className="h-8 px-3 text-xs gap-1.5 font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-2xs shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Announcement</span>
        </Button>
      </div>

      {/* Summary KPI Tiles Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Notices</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{totalAnnouncements}</div>
        </div>
        <div className="p-3 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">All Students</div>
          <div className="text-2xl font-bold text-blue-600 mt-1">{allStudentsCount}</div>
        </div>
        <div className="p-3 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Batch Notices</div>
          <div className="text-2xl font-bold text-purple-600 mt-1">{batchCount}</div>
        </div>
        <div className="p-3 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Pinned</div>
          <div className="text-2xl font-bold text-amber-600 mt-1">{pinnedCount}</div>
        </div>
      </div>

      {/* Live Search and Filter Bar */}
      <div className="p-3 rounded-xl bg-white border border-slate-200/80 shadow-2xs space-y-2.5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          <div className="relative sm:col-span-2">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notices by title, message, batch... (shows live)"
              className="pl-8 pr-7 h-8 text-xs rounded-lg border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white text-slate-900 placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                title="Clear search"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          <select
            value={audienceFilter}
            onChange={(e) => setAudienceFilter(e.target.value)}
            className="w-full px-2.5 h-8 text-xs rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white text-slate-800 font-medium"
          >
            <option value="all">All Audiences</option>
            <option value="all_students">All Students</option>
            <option value="batch">Specific Batch</option>
            <option value="public">Public</option>
          </select>

          <div className="flex items-center gap-2">
            <select
              value={pinnedFilter}
              onChange={(e) => setPinnedFilter(e.target.value)}
              className="flex-1 px-2.5 h-8 text-xs rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white text-slate-800 font-medium"
            >
              <option value="all">All Pin Statuses</option>
              <option value="pinned">Pinned Only</option>
              <option value="unpinned">Standard</option>
            </select>

            {hasFilters && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setAudienceFilter("all");
                  setPinnedFilter("all");
                }}
                className="h-8 px-2.5 flex items-center justify-center text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors shrink-0"
                title="Reset filters"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        <div className="text-[11px] text-slate-500 font-medium px-0.5">
          Showing <span className="font-bold text-slate-800">{filteredAnnouncements.length}</span> of{" "}
          <span className="font-bold text-slate-800">{totalAnnouncements}</span> notices
        </div>
      </div>

      {/* Compose Modal */}
      {isComposeOpen && (
        <div
          onClick={() => setIsComposeOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xl rounded-xl bg-white border border-slate-200/90 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
            role="dialog"
            aria-modal="true"
          >
            <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <Megaphone className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Compose Announcement</h3>
                  <p className="text-xs text-slate-500">
                    Publish instant notifications to all students, parents, or specific batches.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsComposeOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleComposeSubmit} className="p-5 space-y-3.5">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-700">
                  Title <span className="text-rose-500">*</span>
                </label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Schedule Update: Physics Special Doubt Session on Sunday"
                  className="h-8 text-xs rounded-lg border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white text-slate-800"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-700">Audience</label>
                  <select
                    value={audience}
                    onChange={(e) =>
                      setAudience(
                        e.target.value as "public" | "all_students" | "batch",
                      )
                    }
                    className="w-full px-2.5 h-8 text-xs rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white text-slate-800 font-medium"
                  >
                    <option value="all_students">All Students (Dashboard)</option>
                    <option value="public">Public (Homepage Announcement Bar)</option>
                    <option value="batch">One Specific Batch Only</option>
                  </select>
                </div>

                {audience === "batch" && (
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-700">
                      Target Batch <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={batchId}
                      onChange={(e) => setBatchId(e.target.value)}
                      className="w-full px-2.5 h-8 text-xs rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white text-slate-800 font-medium"
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

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-700">
                    Schedule Publish Time
                  </label>
                  <Input
                    type="datetime-local"
                    value={publishedAt}
                    onChange={(e) => setPublishedAt(e.target.value)}
                    className="h-8 text-xs rounded-lg border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white text-slate-800"
                  />
                </div>
              </div>

              {/* Tabs: Write vs Preview */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-semibold text-slate-700">
                    Message Body <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setTab("write")}
                      className={`px-2.5 py-0.5 rounded-md text-[11px] font-semibold transition-colors ${
                        tab === "write"
                          ? "bg-white text-slate-900 shadow-2xs"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      Write
                    </button>
                    <button
                      type="button"
                      onClick={() => setTab("preview")}
                      className={`px-2.5 py-0.5 rounded-md text-[11px] font-semibold transition-colors ${
                        tab === "preview"
                          ? "bg-white text-slate-900 shadow-2xs"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      Preview
                    </button>
                  </div>
                </div>

                {tab === "write" ? (
                  <Textarea
                    rows={4}
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="Write your announcement message here. Supports LaTeX math like $x^2 + y^2 = r^2$."
                    className="text-xs rounded-lg border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white text-slate-800"
                    required
                  />
                ) : (
                  <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 min-h-[90px] text-xs text-slate-800">
                    {body.trim() ? (
                      <MathText content={body} />
                    ) : (
                      <span className="text-slate-400 italic">No message body to preview.</span>
                    )}
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isPinned}
                      onChange={(e) => setIsPinned(e.target.checked)}
                      className="w-3.5 h-3.5 rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-xs font-medium text-slate-700">Pin to top</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifyParents}
                      onChange={(e) => setNotifyParents(e.target.checked)}
                      className="w-3.5 h-3.5 rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-xs font-medium text-slate-700">Notify Parents</span>
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsComposeOpen(false)}
                    className="h-8 px-3 text-xs rounded-lg border-slate-200 text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={isSubmitting}
                    className="h-8 px-3.5 text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-2xs gap-1.5"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                        Publishing...
                      </>
                    ) : (
                      "Publish Announcement"
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Announcements Table or Clean Empty State */}
      {filteredAnnouncements.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center space-y-2.5">
          <Megaphone className="w-9 h-9 text-slate-400 mx-auto opacity-60" />
          <h3 className="text-sm font-bold text-slate-900">
            {totalAnnouncements === 0 ? "No announcements posted yet" : "No announcements match your search"}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {totalAnnouncements === 0
              ? "Broadcast notices, exam schedules, or holiday alerts to all students or specific course batches."
              : "Try adjusting your search keywords or clear filters to see all announcements."}
          </p>
          {totalAnnouncements === 0 ? (
            <Button
              size="sm"
              onClick={() => setIsComposeOpen(true)}
              className="h-8 px-3 text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-2xs mt-1"
            >
              <Plus className="w-3.5 h-3.5 mr-1" /> Create First Announcement
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchQuery("");
                setAudienceFilter("all");
                setPinnedFilter("all");
              }}
              className="h-7.5 px-3 text-xs rounded-lg font-medium border-slate-200"
            >
              Clear Search &amp; Filters
            </Button>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50/80 border-b border-slate-200/80 text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-3.5">Title &amp; Details</th>
                  <th className="py-2.5 px-3.5">Audience</th>
                  <th className="py-2.5 px-3.5">Pinned</th>
                  <th className="py-2.5 px-3.5">Publish Date</th>
                  <th className="py-2.5 px-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAnnouncements.map(({ announcement, batchTitle }) => (
                  <tr key={announcement.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 px-3.5 max-w-md">
                      <div className="font-bold text-slate-900">{announcement.title}</div>
                      <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                        {announcement.body}
                      </p>
                    </td>

                    <td className="py-2.5 px-3.5 whitespace-nowrap">
                      {announcement.audience === "public" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <Globe className="w-3 h-3" /> Public
                        </span>
                      ) : announcement.audience === "batch" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                          <GraduationCap className="w-3 h-3" /> {batchTitle || "Batch"}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                          <Users className="w-3 h-3" /> All Students
                        </span>
                      )}
                    </td>

                    <td className="py-2.5 px-3.5 whitespace-nowrap">
                      {announcement.isPinned ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                          <Pin className="w-3 h-3 text-amber-600" /> Pinned
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs">—</span>
                      )}
                    </td>

                    <td className="py-2.5 px-3.5 whitespace-nowrap text-xs text-slate-500">
                      {new Date(announcement.publishedAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>

                    <td className="py-2.5 px-3.5 text-right whitespace-nowrap">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setToDelete({
                            id: announcement.id,
                            title: announcement.title,
                          })
                        }
                        className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 h-7 w-7 p-0 rounded-md"
                        title="Delete announcement"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

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