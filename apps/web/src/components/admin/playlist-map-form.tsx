"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { mapPlaylistAction } from "@/server/admin-actions";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import {
  FolderPlus,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ExternalLink,
} from "lucide-react";

interface PlaylistMapFormProps {
  playlists: Array<{
    id: string;
    title: string;
    itemCount: number;
    classLevel: number | null;
    chapterTitle: string | null;
    subjectName: string | null;
  }>;
  subjects: Array<{ id: string; name: string }>;
  chapters: Array<{ id: string; title: string; classLevel: number; subjectId: string }>;
}

export function PlaylistMapForm({
  playlists,
  subjects,
  chapters,
}: PlaylistMapFormProps) {
  const router = useRouter();

  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string>("");
  const [classLevel, setClassLevel] = useState<number>(12);
  const [subjectId, setSubjectId] = useState<string>(subjects[0]?.id || "");
  const [chapterId, setChapterId] = useState<string>("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const selectedPlaylist = playlists.find((p) => p.id === selectedPlaylistId);

  // Filter chapters by class and subject
  const availableChapters = chapters.filter(
    (c) => c.classLevel === classLevel && (!subjectId || c.subjectId === subjectId),
  );

  const selectedChapter = chapters.find((c) => c.id === chapterId);

  const handleExecute = async () => {
    if (!selectedPlaylistId || !chapterId || !subjectId) return;

    setIsSubmitting(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const res = await mapPlaylistAction({
        playlistId: selectedPlaylistId,
        classLevel,
        subjectId,
        chapterId,
      });

      if (!res.success || !res.data) {
        throw new Error(res.error || "Playlist mapping failed");
      }

      setSuccessMessage(
        `Successfully mapped playlist "${selectedPlaylist?.title}" and updated ${res.data.updatedVideosCount} video(s) to "${selectedChapter?.title}".`,
      );
      router.refresh();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to map playlist");
    } finally {
      setIsSubmitting(false);
      setShowConfirm(false);
    }
  };

  return (
    <div className="space-y-6">
      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-body-sm flex items-center gap-2.5">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span className="font-semibold">{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-xl bg-critical/10 border border-critical/30 text-critical text-body-sm flex items-center gap-2.5">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span className="font-semibold">{errorMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Step 1: Select Playlist */}
        <div className="rounded-2xl border border-border bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <span className="w-6 h-6 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center">
              1
            </span>
            <h2 className="text-body-md font-bold text-ink">Choose YouTube Playlist</h2>
          </div>

          <div className="space-y-3">
            <label className="text-body-xs font-semibold text-ink">
              Select Synced Playlist
            </label>
            <select
              value={selectedPlaylistId}
              onChange={(e) => setSelectedPlaylistId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-white text-body-sm text-ink font-medium"
            >
              <option value="">Choose a playlist...</option>
              {playlists.map((pl) => (
                <option key={pl.id} value={pl.id}>
                  {pl.title} ({pl.itemCount} videos)
                  {pl.chapterTitle ? ` — Currently: ${pl.chapterTitle}` : " [Unmapped]"}
                </option>
              ))}
            </select>
          </div>

          {selectedPlaylist && (
            <div className="p-4 rounded-xl bg-surface-subtle border border-border space-y-2 text-body-sm">
              <div className="flex items-center justify-between">
                <span className="font-bold text-ink truncate">{selectedPlaylist.title}</span>
                <a
                  href={`https://youtube.com/playlist?list=${selectedPlaylist.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-primary hover:underline flex items-center gap-1 shrink-0 ml-2"
                >
                  Open on YouTube <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <p className="text-body-xs text-ink-muted">
                Playlist ID: <span className="font-mono">{selectedPlaylist.id}</span> ·{" "}
                <span className="font-semibold text-ink">{selectedPlaylist.itemCount}</span> total videos
              </p>
              {selectedPlaylist.chapterTitle ? (
                <p className="text-body-xs text-emerald-700 bg-emerald-50 p-2 rounded border border-emerald-200">
                  Current Mapping: Class {selectedPlaylist.classLevel} · {selectedPlaylist.subjectName} ·{" "}
                  <span className="font-semibold">{selectedPlaylist.chapterTitle}</span>
                </p>
              ) : (
                <p className="text-body-xs text-rose-700 bg-rose-50 p-2 rounded border border-rose-200">
                  Status: Unmapped. Not attached to any chapter yet.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Step 2: Target Mapping */}
        <div className="rounded-2xl border border-border bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <span className="w-6 h-6 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center">
              2
            </span>
            <h2 className="text-body-md font-bold text-ink">Target Chapter Assignment</h2>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-body-xs font-semibold text-ink">Class Level</label>
                <select
                  value={classLevel}
                  onChange={(e) => setClassLevel(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-white text-body-sm text-ink font-medium"
                >
                  {[9, 10, 11, 12].map((lvl) => (
                    <option key={lvl} value={lvl}>
                      Class {lvl}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-body-xs font-semibold text-ink">Subject</label>
                <select
                  value={subjectId}
                  onChange={(e) => setSubjectId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-white text-body-sm text-ink font-medium"
                >
                  {subjects.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-body-xs font-semibold text-ink">Target Chapter</label>
              <select
                value={chapterId}
                onChange={(e) => setChapterId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-white text-body-sm text-ink font-medium"
              >
                <option value="">Select Chapter...</option>
                {availableChapters.map((ch) => (
                  <option key={ch.id} value={ch.id}>
                    {ch.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="pt-2">
              <Button
                type="button"
                disabled={!selectedPlaylistId || !chapterId || isSubmitting}
                onClick={() => setShowConfirm(true)}
                className="w-full gap-2 font-bold py-2.5"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Mapping playlist...</span>
                  </>
                ) : (
                  <>
                    <FolderPlus className="w-4 h-4" />
                    <span>Map Entire Playlist to Chapter</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={showConfirm}
        title="Confirm Playlist Mapping"
        description={`This will attach playlist "${selectedPlaylist?.title}" and bulk-update all ${selectedPlaylist?.itemCount || 0} videos to Class ${classLevel} - ${selectedChapter?.title}.`}
        affectedItemName={`${selectedPlaylist?.title || "Playlist"} → ${selectedChapter?.title || "Chapter"}`}
        confirmLabel="Map Now"
        isDestructive={false}
        onConfirm={handleExecute}
        onCancel={() => setShowConfirm(false)}
      />
    </div>
  );
}
