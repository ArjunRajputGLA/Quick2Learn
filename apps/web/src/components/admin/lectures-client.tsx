"use client";

import { useState, useEffect, Suspense } from "react";
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
  X,
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

  // Sync with URL when external searchParam changes
  useEffect(() => {
    setSearchQuery(searchParams.get("search") || "");
  }, [searchParams]);

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

  // Live real-time search on typing (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      const currentParam = searchParams.get("search") || "";
      const trimmed = searchQuery.trim();
      if (trimmed !== currentParam.trim()) {
        handleFilterChange("search", trimmed || null);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

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
      <div className="rounded-xl border border-slate-200/80 bg-white p-2.5 shadow-2xs space-y-2">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
          {/* Search bar (live search) */}
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-1.5 flex-1 max-w-md">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search lectures by title or YouTube ID... (shows live)"
                className="pl-8 pr-7 h-7.5 text-xs rounded-lg border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    handleFilterChange("search", null);
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                  title="Clear search"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
            <Button type="submit" size="sm" variant="outline" className="h-7.5 text-xs px-2.5 border-slate-200 rounded-lg">
              Search
            </Button>
          </form>

          {/* Quick Playlist Map Action Button & Total */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200/60">
              {totalCount} videos
            </span>
            <Link href="/admin/lectures/playlist-map">
              <Button size="sm" variant="outline" className="h-7.5 px-2.5 text-xs gap-1.5 font-semibold text-blue-600 border-blue-200 hover:bg-blue-50 rounded-lg">
                <FolderPlus className="w-3.5 h-3.5" />
                <span>Map Entire Playlist</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 flex-wrap text-xs pt-1.5 border-t border-slate-100">
          <span className="font-bold text-slate-400 flex items-center gap-1 text-[10px] uppercase tracking-wider">
            <ListFilter className="w-3 h-3" /> Filters:
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
            className={`px-2 py-0.5 rounded-full text-[11px] font-semibold transition-colors ${
              searchParams.get("needsReview") === "true"
                ? "bg-amber-100 text-amber-800 border border-amber-300"
                : "bg-white text-slate-600 hover:text-slate-900 border border-slate-200"
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
            className={`px-2 py-0.5 rounded-full text-[11px] font-semibold transition-colors ${
              searchParams.get("unmapped") === "true"
                ? "bg-rose-100 text-rose-800 border border-rose-300"
                : "bg-white text-slate-600 hover:text-slate-900 border border-slate-200"
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
            className={`px-2 py-0.5 rounded-full text-[11px] font-semibold transition-colors ${
              searchParams.get("isShort") === "true"
                ? "bg-blue-100 text-blue-800 border border-blue-300"
                : "bg-white text-slate-600 hover:text-slate-900 border border-slate-200"
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
            className={`px-2 py-0.5 rounded-full text-[11px] font-semibold transition-colors ${
              searchParams.get("isPublished") === "false"
                ? "bg-slate-200 text-slate-800 border border-slate-300"
                : "bg-white text-slate-600 hover:text-slate-900 border border-slate-200"
            }`}
          >
            Unpublished Only
          </button>

          {/* Class Dropdown Filter */}
          <select
            value={searchParams.get("classLevel") || "all"}
            onChange={(e) => handleFilterChange("classLevel", e.target.value)}
            className="h-6.5 text-[11px] px-2 rounded-lg border border-slate-200 bg-white text-slate-800 font-semibold"
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
              className="text-[11px] text-blue-600 font-semibold hover:underline ml-auto"
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
      <div className="rounded-xl border border-slate-200/80 bg-white shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-800 border-collapse">
            <thead className="bg-slate-50/80 border-b border-slate-200/80 text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider select-none">
              <tr>
                <th className="py-2 px-3 w-8 text-center">
                  <button
                    type="button"
                    onClick={toggleSelectAll}
                    className="text-slate-400 hover:text-slate-700"
                    title="Select all"
                  >
                    {selectedIds.length === initialVideos.length && initialVideos.length > 0 ? (
                      <CheckSquare className="w-3.5 h-3.5 text-blue-600" />
                    ) : (
                      <Square className="w-3.5 h-3.5" />
                    )}
                  </button>
                </th>
                <th className="py-2 px-3">Video Title &amp; ID</th>
                <th className="py-2 px-3">Class / Subject</th>
                <th className="py-2 px-3">Mapped Chapter</th>
                <th className="py-2 px-3">Duration</th>
                <th className="py-2 px-3">Flags</th>
                <th className="py-2 px-3 text-right">View</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {initialVideos.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
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
                        isSelected ? "bg-blue-50/40" : "hover:bg-slate-50/70"
                      }`}
                    >
                      <td className="py-2 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => toggleSelectOne(video.id)}
                          className="text-slate-400 hover:text-slate-700"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-3.5 h-3.5 text-blue-600" />
                          ) : (
                            <Square className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </td>

                      <td className="py-2 px-3 max-w-md">
                        <div className="font-semibold text-slate-900 text-xs line-clamp-1">
                          {video.title}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400 mt-0.5">
                          <span>ID: {video.id}</span>
                          {video.publishedAt && (
                            <span>
                              · {new Date(video.publishedAt).toLocaleDateString("en-IN")}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-2 px-3 whitespace-nowrap text-xs">
                        {video.classLevel ? (
                          <span className="font-semibold text-slate-800">
                            Class {video.classLevel}
                          </span>
                        ) : (
                          <span className="text-rose-600 font-semibold italic text-[11px]">Unset</span>
                        )}
                        <span className="text-slate-400 block text-[10px]">
                          {subjectName || "Unassigned"}
                        </span>
                      </td>

                      <td className="py-2 px-3 max-w-xs text-xs">
                        {chapterTitle ? (
                          <span className="text-slate-700 font-medium truncate block">
                            {chapterTitle}
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            Unmapped
                          </span>
                        )}
                      </td>

                      <td className="py-2 px-3 whitespace-nowrap font-mono text-xs text-slate-500">
                        {Math.floor(video.durationSeconds / 60)}m {video.durationSeconds % 60}s
                      </td>

                      <td className="py-2 px-3 whitespace-nowrap space-x-1">
                        {video.needsReview && (
                          <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            Review
                          </span>
                        )}
                        {video.isShort && (
                          <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                            Short
                          </span>
                        )}
                        {!video.isPublished && (
                          <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                            Hidden
                          </span>
                        )}
                      </td>

                      <td className="py-2 px-3 text-right whitespace-nowrap">
                        <a
                          href={`https://youtube.com/watch?v=${video.id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-800 transition-colors"
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
