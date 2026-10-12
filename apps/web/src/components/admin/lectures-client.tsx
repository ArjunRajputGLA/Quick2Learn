"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { bulkUpdateVideosAction } from "@/server/admin-actions";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import {
  ListFilter,
  CheckSquare,
  Square,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  ExternalLink,
  Loader2,
  FolderPlus,
  Search,
} from "lucide-react";

export interface LectureItem {
  video: {
    id: string;
    title: string;
    isShort: boolean;
    isPublished: boolean;
    needsReview: boolean;
    classLevel: number | null;
    subjectId: string | null;
    chapterId: string | null;
    durationSeconds: number;
    viewCount: number;
    publishedAt: Date | string | null;
  };
  chapterTitle: string | null;
  subjectName: string | null;
  facultyName: string | null;
}

interface LecturesClientProps {
  initialVideos: LectureItem[];
  totalCount: number;
  subjects: Array<{ id: string; name: string }>;
  chapters: Array<{ id: string; title: string; classLevel: number; subjectId: string }>;
}

function LecturesClientContent({
  initialVideos,
  totalCount,
  subjects,
  chapters,
}: LecturesClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Selected videos for bulk updates
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Bulk modification form fields
  const [targetClass, setTargetClass] = useState<number | "">("");
  const [targetSubject, setTargetSubject] = useState<string>("");
  const [targetChapter, setTargetChapter] = useState<string>("");

  // Loading & confirmation
  const [isBulkLoading, setIsBulkLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    action: () => Promise<void>;
  }>({
    isOpen: false,
    title: "",
    description: "",
    action: async () => {},
  });

  // Filter state directly from URL
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");

  const handleFilterChange = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === null || value === "" || value === "all") {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    params.delete("page");
    router.push(`/admin/lectures?${params.toString()}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleFilterChange("search", searchQuery.trim() || null);
  };

  // Toggle selection
  const toggleSelectAll = () => {
    if (selectedIds.length === initialVideos.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(initialVideos.map((v) => v.video.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  // Filter target chapters based on selected class/subject
  const availableTargetChapters = chapters.filter(
    (c) => (!targetClass || c.classLevel === Number(targetClass)) && (!targetSubject || c.subjectId === targetSubject),
  );

  // Execute bulk update
  const executeBulkUpdate = async (payload: {
    classLevel?: number;
    subjectId?: string;
    chapterId?: string;
    isPublished?: boolean;
    isShort?: boolean;
    needsReview?: boolean;
  }) => {
    if (selectedIds.length === 0) return;
    setIsBulkLoading(true);
    setStatusMessage(null);
    setErrorMessage(null);

    try {
      const res = await bulkUpdateVideosAction({
        videoIds: selectedIds,
        ...payload,
      });

      if (!res.success) {
        throw new Error(res.error || "Bulk update failed");
      }

      setStatusMessage(`Successfully updated ${selectedIds.length} video(s).`);
      setSelectedIds([]);
      router.refresh();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to execute bulk action");
    } finally {
      setIsBulkLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search & Filters Header */}
      <div className="rounded-2xl border border-border bg-white p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search bar */}
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 flex-1 max-w-md">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search lectures by title or YouTube ID..."
                className="pl-9 h-9 text-body-sm"
              />
            </div>
            <Button type="submit" size="sm" variant="outline" className="h-9">
              Search
            </Button>
          </form>

          {/* Quick Playlist Map Action Button & Total */}
          <div className="flex items-center gap-2.5">
            <span className="text-body-xs font-semibold px-2 py-1 rounded bg-surface-subtle text-ink-muted">
              {totalCount} videos
            </span>
            <Link href="/admin/lectures/playlist-map">
              <Button size="sm" variant="outline" className="gap-1.5 font-semibold text-primary border-primary/30 hover:bg-primary/5">
                <FolderPlus className="w-4 h-4" />
                <span>Map Entire Playlist</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 flex-wrap text-body-xs pt-1 border-t border-border">
          <span className="font-bold text-ink-muted flex items-center gap-1">
            <ListFilter className="w-3.5 h-3.5" /> Filters:
          </span>

          {/* Needs Review Filter */}
          <button
            type="button"
            onClick={() =>
              handleFilterChange(
                "needsReview",
                searchParams.get("needsReview") === "true" ? null : "true",
              )
            }
            className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
              searchParams.get("needsReview") === "true"
                ? "bg-amber-100 text-amber-800 border border-amber-300"
                : "bg-surface-subtle text-ink-muted hover:text-ink border border-border"
            }`}
          >
            Needs Review
          </button>

          {/* Unmapped Filter */}
          <button
            type="button"
            onClick={() =>
              handleFilterChange(
                "unmapped",
                searchParams.get("unmapped") === "true" ? null : "true",
              )
            }
            className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
              searchParams.get("unmapped") === "true"
                ? "bg-rose-100 text-rose-800 border border-rose-300"
                : "bg-surface-subtle text-ink-muted hover:text-ink border border-border"
            }`}
          >
            Unmapped
          </button>

          {/* Shorts Filter */}
          <button
            type="button"
            onClick={() =>
              handleFilterChange(
                "isShort",
                searchParams.get("isShort") === "true" ? null : "true",
              )
            }
            className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
              searchParams.get("isShort") === "true"
                ? "bg-primary/15 text-primary border border-primary/30"
                : "bg-surface-subtle text-ink-muted hover:text-ink border border-border"
            }`}
          >
            Shorts Only
          </button>

          {/* Publish Filter */}
          <button
            type="button"
            onClick={() =>
              handleFilterChange(
                "isPublished",
                searchParams.get("isPublished") === "false" ? null : "false",
              )
            }
            className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
              searchParams.get("isPublished") === "false"
                ? "bg-slate-200 text-slate-800 border border-slate-300"
                : "bg-surface-subtle text-ink-muted hover:text-ink border border-border"
            }`}
          >
            Unpublished Only
          </button>

          {/* Class Dropdown Filter */}
          <select
            value={searchParams.get("classLevel") || "all"}
            onChange={(e) => handleFilterChange("classLevel", e.target.value)}
            className="px-2 py-1 rounded-md border border-border bg-white text-ink font-semibold"
          >
            <option value="all">All Classes</option>
            <option value="9">Class 9</option>
            <option value="10">Class 10</option>
            <option value="11">Class 11</option>
            <option value="12">Class 12</option>
          </select>

          {/* Clear Filters */}
          {Array.from(searchParams.keys()).length > 0 && (
            <button
              type="button"
              onClick={() => router.push("/admin/lectures")}
              className="text-xs text-primary font-semibold hover:underline ml-auto"
            >
              Reset all filters
            </button>
          )}
        </div>
      </div>

      {/* Notice Banners */}
      {statusMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-body-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span className="font-medium">{statusMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-critical/10 border border-critical/30 text-critical text-body-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="font-medium">{errorMessage}</span>
        </div>
      )}

      {/* Bulk Action Sticky Bar (Appears when >= 1 selected) */}
      {selectedIds.length > 0 && (
        <div className="p-4 rounded-2xl bg-ink text-white shadow-xl border border-white/10 space-y-3 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-primary text-white font-bold text-xs">
                {selectedIds.length} Selected
              </span>
              <span className="text-body-sm font-semibold">Bulk Operations:</span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Publish / Unpublish */}
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() =>
                  setConfirmDialog({
                    isOpen: true,
                    title: "Publish Selected Lectures?",
                    description: `This will make ${selectedIds.length} video(s) publicly viewable on Quick2Learn.`,
                    action: () => executeBulkUpdate({ isPublished: true }),
                  })
                }
                disabled={isBulkLoading}
                className="h-8 text-xs bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                <Eye className="w-3.5 h-3.5 mr-1" /> Publish
              </Button>

              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() =>
                  setConfirmDialog({
                    isOpen: true,
                    title: "Unpublish Selected Lectures?",
                    description: `This will hide ${selectedIds.length} video(s) from the public site and library.`,
                    action: () => executeBulkUpdate({ isPublished: false }),
                  })
                }
                disabled={isBulkLoading}
                className="h-8 text-xs bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                <EyeOff className="w-3.5 h-3.5 mr-1" /> Unpublish
              </Button>

              {/* Mark / Unmark Short */}
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => executeBulkUpdate({ isShort: true })}
                disabled={isBulkLoading}
                className="h-8 text-xs bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                Mark as Short
              </Button>

              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => executeBulkUpdate({ isShort: false })}
                disabled={isBulkLoading}
                className="h-8 text-xs bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                Regular Video
              </Button>

              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setSelectedIds([])}
                className="h-8 text-xs text-white/70 hover:text-white"
              >
                Deselect All
              </Button>
            </div>
          </div>

          {/* Mapping Controls */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-2 border-t border-white/15 text-body-xs">
            <span className="font-semibold text-white/80 shrink-0">Map to Chapter:</span>

            <select
              value={targetClass}
              onChange={(e) => setTargetClass(e.target.value ? Number(e.target.value) : "")}
              className="px-2.5 py-1 rounded bg-white text-ink font-medium"
            >
              <option value="">Select Class...</option>
              {[9, 10, 11, 12].map((lvl) => (
                <option key={lvl} value={lvl}>
                  Class {lvl}
                </option>
              ))}
            </select>

            <select
              value={targetSubject}
              onChange={(e) => setTargetSubject(e.target.value)}
              className="px-2.5 py-1 rounded bg-white text-ink font-medium"
            >
              <option value="">Select Subject...</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>

            <select
              value={targetChapter}
              onChange={(e) => setTargetChapter(e.target.value)}
              className="px-2.5 py-1 rounded bg-white text-ink font-medium flex-1 truncate max-w-xs"
            >
              <option value="">Select Chapter...</option>
              {availableTargetChapters.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>

            <Button
              type="button"
              size="sm"
              disabled={isBulkLoading || !targetClass || !targetSubject || !targetChapter}
              onClick={() =>
                setConfirmDialog({
                  isOpen: true,
                  title: "Apply Chapter Mapping?",
                  description: `Map ${selectedIds.length} video(s) to Class ${targetClass} under selected chapter and mark reviewed.`,
                  action: () =>
                    executeBulkUpdate({
                      classLevel: Number(targetClass),
                      subjectId: targetSubject,
                      chapterId: targetChapter,
                      needsReview: false,
                    }),
                })
              }
              className="h-8 text-xs font-bold bg-primary hover:bg-primary-hover text-white shrink-0"
            >
              {isBulkLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Apply Mapping"}
            </Button>
          </div>
        </div>
      )}

      {/* Videos TanStack/Dense Table */}
      <div className="rounded-2xl border border-border bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-body-sm text-ink border-collapse">
            <thead className="bg-surface-subtle border-b border-border text-[11px] font-bold text-ink-muted uppercase tracking-wider select-none">
              <tr>
                <th className="py-3 px-3.5 w-10 text-center">
                  <button
                    type="button"
                    onClick={toggleSelectAll}
                    className="text-ink-muted hover:text-ink"
                    title="Select all"
                  >
                    {selectedIds.length === initialVideos.length && initialVideos.length > 0 ? (
                      <CheckSquare className="w-4 h-4 text-primary" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="py-3 px-3.5">Video Title & ID</th>
                <th className="py-3 px-3.5">Class / Subject</th>
                <th className="py-3 px-3.5">Mapped Chapter</th>
                <th className="py-3 px-3.5">Duration</th>
                <th className="py-3 px-3.5">Flags</th>
                <th className="py-3 px-3.5 text-right">View</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {initialVideos.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-ink-muted">
                    No videos match the current filters.
                  </td>
                </tr>
              ) : (
                initialVideos.map(({ video, chapterTitle, subjectName }) => {
                  const isSelected = selectedIds.includes(video.id);

                  return (
                    <tr
                      key={video.id}
                      className={`transition-colors ${
                        isSelected ? "bg-primary/5 hover:bg-primary/10" : "hover:bg-surface-subtle/80"
                      }`}
                    >
                      <td className="py-3 px-3.5 text-center">
                        <button
                          type="button"
                          onClick={() => toggleSelectOne(video.id)}
                          className="text-ink-muted hover:text-ink"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-primary" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>

                      <td className="py-3 px-3.5 max-w-md">
                        <div className="font-semibold text-ink line-clamp-2 leading-snug">
                          {video.title}
                        </div>
                        <div className="flex items-center gap-2 text-body-xs font-mono text-ink-muted mt-0.5">
                          <span>ID: {video.id}</span>
                          {video.publishedAt && (
                            <span>
                              · {new Date(video.publishedAt).toLocaleDateString("en-IN")}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-3.5 whitespace-nowrap text-body-xs">
                        {video.classLevel ? (
                          <span className="font-semibold text-ink">
                            Class {video.classLevel}
                          </span>
                        ) : (
                          <span className="text-rose-600 font-semibold italic">Unset</span>
                        )}
                        <span className="text-ink-muted block text-[11px]">
                          {subjectName || "Unassigned"}
                        </span>
                      </td>

                      <td className="py-3 px-3.5 max-w-xs text-body-xs">
                        {chapterTitle ? (
                          <span className="text-ink font-medium truncate block">
                            {chapterTitle}
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            Unmapped
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3.5 whitespace-nowrap font-mono text-body-xs text-ink-muted">
                        {Math.floor(video.durationSeconds / 60)}m {video.durationSeconds % 60}s
                      </td>

                      <td className="py-3 px-3.5 whitespace-nowrap space-x-1">
                        {video.needsReview && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            Review
                          </span>
                        )}
                        {video.isShort && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                            Short
                          </span>
                        )}
                        {!video.isPublished && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-300">
                            Hidden
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3.5 text-right whitespace-nowrap">
                        <a
                          href={`https://youtube.com/watch?v=${video.id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center p-1.5 rounded hover:bg-neutral-subtle text-ink-muted hover:text-ink"
                          title="Open on YouTube"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        description={confirmDialog.description}
        affectedItemName={`${selectedIds.length} lectures`}
        isDestructive={false}
        confirmLabel="Apply Changes"
        onConfirm={async () => {
          await confirmDialog.action();
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        }}
        onCancel={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}

export function LecturesClient(props: LecturesClientProps) {
  return (
    <Suspense fallback={null}>
      <LecturesClientContent {...props} />
    </Suspense>
  );
}
