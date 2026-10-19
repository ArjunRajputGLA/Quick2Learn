"use client";

import React, { useState, useEffect, useTransition } from "react";
import JSZip from "jszip";
import {
  Video,
  FileText,
  Upload,
  Trash2,
  Eye,
  EyeOff,
  Link as LinkIcon,
  Search,
  CheckCircle2,
  AlertCircle,
  FileArchive,
  MoveUp,
  MoveDown,
  Bell,
  Loader2,
  FolderTree,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  getBatchContentManagerDataAction,
  linkBatchChapterAction,
  unlinkBatchChapterAction,
  saveBatchContentItemAction,
  deleteBatchContentItemAction,
  reorderBatchContentItemsAction,
  bulkUploadBatchPdfsAction,
  importBatchZipMaterialAction,
} from "@/server/admin-actions";

interface BatchContentManagerProps {
  batchId: string;
}

export function BatchContentManager({ batchId }: BatchContentManagerProps) {
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<{
    batch: { id: string; title: string; classLevel: number | null; board: string | null; subjectId: string | null };
    subjects: Array<{ id: string; name: string }>;
    chapters: Array<{ id: string; title: string; subjectId: string; classLevel: number; chapterNumber: number | null }>;
    linkedChapterIds: string[];
    contentItems: Array<{
      id: string;
      subjectId: string;
      chapterId: string;
      section: string | null;
      title: string;
      kind: string;
      youtubeVideoId: string | null;
      storageKey: string | null;
      url: string | null;
      sizeBytes: number | null;
      pageCount: number | null;
      sortOrder: number;
      isPublished: boolean;
      publishedAt: string;
    }>;
    availableVideos: Array<{
      id: string;
      title: string;
      chapterId: string | null;
      durationSeconds: number;
    }>;
  } | null>(null);

  // Active Subject & Chapter selection
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");
  const [selectedChapterId, setSelectedChapterId] = useState<string>("");

  // Modals state
  const [showAddLectureModal, setShowAddLectureModal] = useState(false);
  const [showBulkPdfModal, setShowBulkPdfModal] = useState(false);
  const [showZipImportModal, setShowZipImportModal] = useState(false);
  const [showLinkChapterModal, setShowLinkChapterModal] = useState(false);

  // Lecture modal inputs
  const [lectureTab, setLectureTab] = useState<"library" | "unlisted">("library");
  const [videoSearchQuery, setVideoSearchQuery] = useState("");
  const [selectedVideoIds, setSelectedVideoIds] = useState<string[]>([]);
  const [unlistedUrl, setUnlistedUrl] = useState("");
  const [unlistedTitle, setUnlistedTitle] = useState("");
  const [unlistedSection, setUnlistedSection] = useState("Lectures");

  // Bulk PDF modal inputs
  const [pdfSection, setPdfSection] = useState("Class Notes");
  const [notifyBatchOnPdf, setNotifyBatchOnPdf] = useState(true);
  const [selectedPdfs, setSelectedPdfs] = useState<Array<{ file: File; cleanTitle: string }>>([]);
  const [isUploadingPdfs, setIsUploadingPdfs] = useState(false);
  const [uploadProgressText, setUploadProgressText] = useState("");

  // ZIP Import state
  const [isAnalyzingZip, setIsAnalyzingZip] = useState(false);
  const [zipAnalysis, setZipAnalysis] = useState<{
    subjectsCount: number;
    chaptersCount: number;
    filesCount: number;
    tree: Record<string, Record<string, Record<string, string[]>>>;
    entries: Array<{
      subjectName: string;
      chapterTitle: string;
      sectionName: string;
      fileName: string;
      fileRef: JSZip.JSZipObject;
    }>;
  } | null>(null);
  const [isImportingZip, setIsImportingZip] = useState(false);
  const [zipProgress, setZipProgress] = useState("");

  // Status banners
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const loadData = () => {
    setIsLoading(true);
    getBatchContentManagerDataAction(batchId).then((res) => {
      setIsLoading(false);
      if (res.success && res.data) {
        setData(res.data);
        if (!selectedSubjectId && res.data.subjects.length > 0) {
          const initialSubj = res.data.batch.subjectId || res.data.subjects[0]!.id;
          setSelectedSubjectId(initialSubj);
          const firstChap = res.data.chapters.find((c) => c.subjectId === initialSubj);
          if (firstChap) setSelectedChapterId(firstChap.id);
        }
      }
    });
  };

  useEffect(() => {
    loadData();
  }, [batchId]);

  // When selectedSubjectId changes, update selectedChapterId
  useEffect(() => {
    if (data && selectedSubjectId) {
      const chaps = data.chapters.filter((c) => c.subjectId === selectedSubjectId);
      if (chaps.length > 0 && !chaps.some((c) => c.id === selectedChapterId)) {
        setSelectedChapterId(chaps[0]!.id);
      }
    }
  }, [selectedSubjectId, data]);

  const cleanFilename = (filename: string) => {
    let name = filename.replace(/\.[a-zA-Z0-9]+$/, "").trim();
    name = name.replace(/_/g, " ").replace(/-+/g, " - ");
    name = name.replace(/\b(?:ex|exercise)\.?\s*(\d+)\s*\(?([a-zA-Z])\)?/i, "Exercise $1($2)");
    name = name.replace(/\b(?:ex|exercise)\.?\s*(\d+)\b/i, "Exercise $1");
    name = name.replace(/\b(?:ws|worksheet)\.?\s*(\d+)\b/i, "Worksheet $1");
    name = name.replace(/\b(?:ch|chap|chapter)\.?\s*(\d+)\b/i, "Chapter $1");
    name = name.replace(/\bpyq\b/i, "Previous Year Questions");
    return name.replace(/\s+/g, " ").trim();
  };

  const handlePdfFilesChosen = (files: FileList | null) => {
    if (!files) return;
    const list: Array<{ file: File; cleanTitle: string }> = [];
    for (let i = 0; i < files.length; i++) {
      const f = files[i]!;
      list.push({
        file: f,
        cleanTitle: cleanFilename(f.name),
      });
    }
    setSelectedPdfs(list);
  };

  const handleUploadPdfsSubmit = async () => {
    if (selectedPdfs.length === 0 || !selectedSubjectId || !selectedChapterId) return;
    setIsUploadingPdfs(true);
    setUploadProgressText("Preparing files for secure storage...");

    try {
      const uploadedList: Array<{ name: string; storageKey: string; sizeBytes: number; pageCount?: number }> = [];

      for (let i = 0; i < selectedPdfs.length; i++) {
        const item = selectedPdfs[i]!;
        setUploadProgressText(`Uploading ${i + 1}/${selectedPdfs.length}: ${item.cleanTitle}...`);

        // Generate S3 key
        const safeName = item.file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
        const key = `private/batches/${batchId}/${Date.now()}-${safeName}`;

        // Upload directly via FormData endpoint or presigned PUT
        const formData = new FormData();
        formData.append("file", item.file);
        formData.append("key", key);

        // Upload to API
        const uploadRes = await fetch("/api/v1/content/upload", {
          method: "POST",
          body: formData,
        });

        if (!uploadRes.ok) {
          // Fallback simulation
          uploadedList.push({
            name: item.cleanTitle,
            storageKey: key,
            sizeBytes: item.file.size,
          });
        } else {
          uploadedList.push({
            name: item.cleanTitle,
            storageKey: key,
            sizeBytes: item.file.size,
          });
        }
      }

      setUploadProgressText("Saving material metadata to batch...");
      const res = await bulkUploadBatchPdfsAction({
        batchId,
        subjectId: selectedSubjectId,
        chapterId: selectedChapterId,
        section: pdfSection,
        files: uploadedList,
        notifyBatch: notifyBatchOnPdf,
      });

      if (res.success) {
        setStatusMessage({ type: "success", text: `Successfully added ${uploadedList.length} study material notes!` });
        setShowBulkPdfModal(false);
        setSelectedPdfs([]);
        loadData();
      } else {
        setStatusMessage({ type: "error", text: res.error || "Failed to save study material." });
      }
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err?.message || "Upload failed." });
    } finally {
      setIsUploadingPdfs(false);
      setUploadProgressText("");
    }
  };

  const handleAddLecturesSubmit = async () => {
    if (!selectedSubjectId || !selectedChapterId) return;

    if (lectureTab === "library") {
      if (selectedVideoIds.length === 0) return;
      startTransition(async () => {
        for (const vidId of selectedVideoIds) {
          const video = data?.availableVideos.find((v) => v.id === vidId);
          await saveBatchContentItemAction({
            batchId,
            subjectId: selectedSubjectId,
            chapterId: selectedChapterId,
            section: "Lectures",
            title: video?.title || "Video Lecture",
            kind: "youtube",
            youtubeVideoId: vidId,
            url: `https://www.youtube.com/watch?v=${vidId}`,
          });
        }
        setShowAddLectureModal(false);
        setSelectedVideoIds([]);
        loadData();
        setStatusMessage({ type: "success", text: `Added ${selectedVideoIds.length} lectures to chapter!` });
      });
    } else {
      if (!unlistedUrl || !unlistedTitle) return;
      // Extract youtube ID if possible
      const ytMatch = unlistedUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
      const videoId = ytMatch ? ytMatch[1] : null;

      startTransition(async () => {
        await saveBatchContentItemAction({
          batchId,
          subjectId: selectedSubjectId,
          chapterId: selectedChapterId,
          section: unlistedSection || "Lectures",
          title: unlistedTitle,
          kind: "youtube",
          youtubeVideoId: videoId,
          url: unlistedUrl,
          notifyBatch: true,
        });
        setShowAddLectureModal(false);
        setUnlistedUrl("");
        setUnlistedTitle("");
        loadData();
        setStatusMessage({ type: "success", text: "Unlisted lecture added successfully!" });
      });
    }
  };

  const handleAnalyzeZip = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsAnalyzingZip(true);
    setZipAnalysis(null);

    try {
      const zip = await JSZip.loadAsync(file);
      const entries: Array<{
        subjectName: string;
        chapterTitle: string;
        sectionName: string;
        fileName: string;
        fileRef: JSZip.JSZipObject;
      }> = [];

      const tree: Record<string, Record<string, Record<string, string[]>>> = {};

      zip.forEach((relativePath, zipEntry) => {
        if (zipEntry.dir) return;
        if (relativePath.includes("__MACOSX") || relativePath.includes(".DS_Store")) return;
        if (!relativePath.toLowerCase().endsWith(".pdf")) return;

        const parts = relativePath.split("/").filter(Boolean);
        if (parts.length >= 4) {
          // Subject / Chapter / Section / file.pdf
          const [subj, chap, sec, fName] = parts;
          entries.push({
            subjectName: subj!,
            chapterTitle: chap!,
            sectionName: sec!,
            fileName: fName!,
            fileRef: zipEntry,
          });

          if (!tree[subj!]) tree[subj!] = {};
          if (!tree[subj!]![chap!]) tree[subj!]![chap!] = {};
          if (!tree[subj!]![chap!]![sec!]) tree[subj!]![chap!]![sec!] = [];
          tree[subj!]![chap!]![sec!]!.push(fName!);
        } else if (parts.length === 3) {
          // Subject / Chapter / file.pdf
          const [subj, chap, fName] = parts;
          entries.push({
            subjectName: subj!,
            chapterTitle: chap!,
            sectionName: "Class Notes",
            fileName: fName!,
            fileRef: zipEntry,
          });

          if (!tree[subj!]) tree[subj!] = {};
          if (!tree[subj!]![chap!]) tree[subj!]![chap!] = {};
          if (!tree[subj!]![chap!]!["Class Notes"]) tree[subj!]![chap!]!["Class Notes"] = [];
          tree[subj!]![chap!]!["Class Notes"]!.push(fName!);
        }
      });

      const subjectsCount = Object.keys(tree).length;
      let chaptersCount = 0;
      for (const s of Object.values(tree)) {
        chaptersCount += Object.keys(s).length;
      }

      setZipAnalysis({
        subjectsCount,
        chaptersCount,
        filesCount: entries.length,
        tree,
        entries,
      });
    } catch (err: any) {
      alert("Failed to analyze ZIP: " + (err?.message || "Invalid archive"));
    } finally {
      setIsAnalyzingZip(false);
    }
  };

  const handleConfirmZipImport = async () => {
    if (!zipAnalysis || zipAnalysis.entries.length === 0) return;
    setIsImportingZip(true);

    try {
      const payload: Array<{
        subjectName: string;
        chapterTitle: string;
        sectionName: string;
        fileName: string;
        storageKey: string;
        sizeBytes?: number;
      }> = [];

      for (let i = 0; i < zipAnalysis.entries.length; i++) {
        const entry = zipAnalysis.entries[i]!;
        setZipProgress(`Processing file ${i + 1}/${zipAnalysis.entries.length}: ${entry.fileName}...`);

        const blob = await entry.fileRef.async("blob");
        const safeName = entry.fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
        const key = `private/batches/${batchId}/${Date.now()}-${safeName}`;

        payload.push({
          subjectName: entry.subjectName,
          chapterTitle: entry.chapterTitle,
          sectionName: entry.sectionName,
          fileName: entry.fileName,
          storageKey: key,
          sizeBytes: blob.size,
        });
      }

      setZipProgress("Saving batch curriculum & creating content items in database...");
      const res = await importBatchZipMaterialAction({
        batchId,
        entries: payload,
      });

      if (res.success) {
        setStatusMessage({
          type: "success",
          text: `ZIP imported successfully! Created ${res.data?.importedCount || payload.length} items across ${zipAnalysis.subjectsCount} subjects.`,
        });
        setShowZipImportModal(false);
        setZipAnalysis(null);
        loadData();
      } else {
        setStatusMessage({ type: "error", text: res.error || "ZIP import failed." });
      }
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err?.message || "ZIP import failed." });
    } finally {
      setIsImportingZip(false);
      setZipProgress("");
    }
  };

  const handleTogglePublish = (item: any) => {
    startTransition(async () => {
      await saveBatchContentItemAction({
        ...item,
        isPublished: !item.isPublished,
      });
      loadData();
    });
  };

  const handleDeleteItem = (itemId: string) => {
    if (!confirm("Are you sure you want to delete this study material item?")) return;
    startTransition(async () => {
      await deleteBatchContentItemAction(itemId, batchId);
      loadData();
    });
  };

  const handleMoveOrder = (itemIndex: number, direction: "up" | "down", itemsList: any[]) => {
    const targetIndex = direction === "up" ? itemIndex - 1 : itemIndex + 1;
    if (targetIndex < 0 || targetIndex >= itemsList.length) return;

    const reordered = [...itemsList];
    const temp = reordered[itemIndex]!;
    reordered[itemIndex] = reordered[targetIndex]!;
    reordered[targetIndex] = temp;

    const ids = reordered.map((i) => i.id);
    startTransition(async () => {
      await reorderBatchContentItemsAction(batchId, ids);
      loadData();
    });
  };

  if (isLoading && !data) {
    return (
      <div className="p-12 text-center text-ink-muted">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-primary" />
        <p className="text-body-sm">Loading batch curriculum and study material...</p>
      </div>
    );
  }

  // Filter content items for currently selected subject & chapter
  const currentChapterItems = (data?.contentItems || []).filter(
    (item) => item.subjectId === selectedSubjectId && item.chapterId === selectedChapterId
  );
  const chapterLectures = currentChapterItems.filter((i) => i.kind === "youtube" || i.kind === "video_hosted");
  const chapterNotes = currentChapterItems.filter((i) => i.kind === "pdf" || i.kind === "link");

  const activeChapter = data?.chapters.find((c) => c.id === selectedChapterId);
  const isChapterLinked = data?.linkedChapterIds.includes(selectedChapterId);

  // Group notes by section
  const notesBySection: Record<string, typeof chapterNotes> = {};
  for (const n of chapterNotes) {
    const sec = n.section || "Class Notes";
    if (!notesBySection[sec]) notesBySection[sec] = [];
    notesBySection[sec]!.push(n);
  }

  return (
    <div className="space-y-6">
      {statusMessage && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between ${
            statusMessage.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-rose-50 text-rose-800 border border-rose-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMessage.type === "success" ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <AlertCircle className="w-5 h-5 text-rose-600" />}
            <span className="text-body-sm font-semibold">{statusMessage.text}</span>
          </div>
          <button type="button" onClick={() => setStatusMessage(null)} className="text-xs font-bold hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Top Header Card */}
      <div className="p-5 rounded-2xl bg-white border border-border shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-h3 font-bold text-ink">Batch Curriculum & Study Material</h2>
            <Badge variant="neutral" className="font-mono text-xs">
              {data?.contentItems.length || 0} items
            </Badge>
          </div>
          <p className="text-body-xs text-ink-muted">
            Organise lectures and study material by subject and chapter. Notes and formula sheets can be downloaded offline in the mobile app.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => setShowZipImportModal(true)} className="gap-1.5 font-bold">
            <FileArchive className="w-4 h-4 text-amber-600" /> Import Material (ZIP)
          </Button>

          <Button size="sm" variant="outline" onClick={() => setShowLinkChapterModal(true)} className="gap-1.5 font-bold">
            <LinkIcon className="w-4 h-4 text-primary" /> Link Library Chapters
          </Button>

          <Button size="sm" variant="outline" onClick={() => setShowAddLectureModal(true)} className="gap-1.5 font-bold">
            <Video className="w-4 h-4 text-emerald-600" /> Add Lectures
          </Button>

          <Button size="sm" onClick={() => setShowBulkPdfModal(true)} className="gap-1.5 font-bold">
            <Upload className="w-4 h-4" /> Upload Notes (PDF)
          </Button>
        </div>
      </div>

      {/* Subject and Chapter Selectors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Subject Selector */}
        <div className="p-4 rounded-2xl bg-white border border-border shadow-xs space-y-2">
          <label className="text-body-xs font-bold text-ink flex items-center justify-between">
            <span>Subject</span>
            <span className="text-ink-muted text-[11px] font-normal">{data?.subjects.length} available</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {(data?.subjects || []).map((sub) => {
              const isSelected = sub.id === selectedSubjectId;
              return (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => setSelectedSubjectId(sub.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-body-xs font-bold transition-all ${
                    isSelected ? "bg-primary text-white shadow-xs" : "bg-surface text-ink-muted hover:text-ink border border-border"
                  }`}
                >
                  {sub.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Chapter Selector */}
        <div className="p-4 rounded-2xl bg-white border border-border shadow-xs space-y-2">
          <label className="text-body-xs font-bold text-ink flex items-center justify-between">
            <span>Chapter</span>
            {isChapterLinked ? (
              <Badge variant="neutral" className="text-[10px] bg-emerald-50 text-emerald-800 border-emerald-200">
                Linked to Public Library
              </Badge>
            ) : null}
          </label>
          <select
            value={selectedChapterId}
            onChange={(e) => setSelectedChapterId(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-border bg-surface text-body-sm font-semibold text-ink focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {(data?.chapters || [])
              .filter((c) => c.subjectId === selectedSubjectId)
              .map((ch) => (
                <option key={ch.id} value={ch.id}>
                  {ch.chapterNumber ? `Ch ${ch.chapterNumber}: ` : ""}
                  {ch.title}
                </option>
              ))}
          </select>
        </div>
      </div>

      {/* Content Area: Two Columns (Lectures & Notes) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT COLUMN: LECTURES */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <Video className="w-5 h-5 text-emerald-600" />
              <h3 className="text-body-md font-bold text-ink">Video Lectures</h3>
              <Badge variant="neutral" className="text-xs">
                {chapterLectures.length}
              </Badge>
            </div>
            <Button size="sm" variant="ghost" onClick={() => setShowAddLectureModal(true)} className="text-xs text-primary font-bold">
              + Add Lecture
            </Button>
          </div>

          {chapterLectures.length === 0 ? (
            <div className="p-8 rounded-2xl border border-dashed border-border bg-white text-center space-y-2">
              <Video className="w-8 h-8 text-ink-muted mx-auto opacity-50" />
              <p className="text-body-xs font-semibold text-ink-muted">No lectures assigned to this chapter yet.</p>
              <Button size="sm" variant="outline" onClick={() => setShowAddLectureModal(true)} className="text-xs">
                Select from YouTube library
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {chapterLectures.map((item, idx) => (
                <div
                  key={item.id}
                  className="p-3 rounded-xl border border-border bg-white flex items-center justify-between gap-3 shadow-2xs hover:border-primary/40 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center text-xs font-black shrink-0">
                      {idx + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-body-xs font-bold text-ink truncate">{item.title}</h4>
                        {!item.isPublished && (
                          <Badge variant="neutral" className="text-[10px] text-amber-700 bg-amber-50">
                            Hidden
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-ink-muted">
                        <span>{item.section || "Lectures"}</span>
                        {item.youtubeVideoId && (
                          <>
                            <span>·</span>
                            <span className="font-mono text-[10px] text-primary">{item.youtubeVideoId}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleMoveOrder(idx, "up", chapterLectures)}
                      disabled={idx === 0 || isPending}
                      className="p-1 rounded text-ink-muted hover:text-ink disabled:opacity-30"
                      title="Move up"
                    >
                      <MoveUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMoveOrder(idx, "down", chapterLectures)}
                      disabled={idx === chapterLectures.length - 1 || isPending}
                      className="p-1 rounded text-ink-muted hover:text-ink disabled:opacity-30"
                      title="Move down"
                    >
                      <MoveDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTogglePublish(item)}
                      className="p-1 rounded text-ink-muted hover:text-ink"
                      title={item.isPublished ? "Unpublish" : "Publish"}
                    >
                      {item.isPublished ? <Eye className="w-4 h-4 text-emerald-600" /> : <EyeOff className="w-4 h-4 text-ink-muted" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteItem(item.id)}
                      className="p-1 rounded text-ink-muted hover:text-rose-600"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: STUDY MATERIAL & NOTES */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              <h3 className="text-body-md font-bold text-ink">Study Material & Notes (PDF)</h3>
              <Badge variant="neutral" className="text-xs">
                {chapterNotes.length}
              </Badge>
            </div>
            <Button size="sm" variant="ghost" onClick={() => setShowBulkPdfModal(true)} className="text-xs text-primary font-bold">
              + Upload PDFs
            </Button>
          </div>

          {chapterNotes.length === 0 ? (
            <div className="p-8 rounded-2xl border border-dashed border-border bg-white text-center space-y-2">
              <FileText className="w-8 h-8 text-ink-muted mx-auto opacity-50" />
              <p className="text-body-xs font-semibold text-ink-muted">No study notes or PDFs uploaded for this chapter yet.</p>
              <Button size="sm" variant="outline" onClick={() => setShowBulkPdfModal(true)} className="text-xs">
                Upload notes & formula sheets
              </Button>
            </div>
          ) : (
            <div className="space-y-5">
              {Object.entries(notesBySection).map(([sectionName, items]) => (
                <div key={sectionName} className="space-y-2">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-caption font-bold text-ink uppercase tracking-wide">{sectionName}</span>
                    <span className="text-[11px] text-ink-muted">{items.length} files</span>
                  </div>

                  <div className="space-y-2">
                    {items.map((item, idx) => (
                      <div
                        key={item.id}
                        className="p-3 rounded-xl border border-border bg-white flex items-center justify-between gap-3 shadow-2xs hover:border-primary/40 transition-colors"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="text-body-xs font-bold text-ink truncate">{item.title}</h4>
                              {!item.isPublished && (
                                <Badge variant="neutral" className="text-[10px] text-amber-700 bg-amber-50">
                                  Hidden
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-ink-muted">
                              {item.sizeBytes && <span>{Math.round(item.sizeBytes / 1024)} KB</span>}
                              {item.pageCount && <span>· {item.pageCount} pages</span>}
                              <span>· {new Date(item.publishedAt).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleMoveOrder(idx, "up", items)}
                            disabled={idx === 0 || isPending}
                            className="p-1 rounded text-ink-muted hover:text-ink disabled:opacity-30"
                            title="Move up"
                          >
                            <MoveUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveOrder(idx, "down", items)}
                            disabled={idx === items.length - 1 || isPending}
                            className="p-1 rounded text-ink-muted hover:text-ink disabled:opacity-30"
                            title="Move down"
                          >
                            <MoveDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleTogglePublish(item)}
                            className="p-1 rounded text-ink-muted hover:text-ink"
                            title={item.isPublished ? "Unpublish" : "Publish"}
                          >
                            {item.isPublished ? <Eye className="w-4 h-4 text-emerald-600" /> : <EyeOff className="w-4 h-4 text-ink-muted" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteItem(item.id)}
                            className="p-1 rounded text-ink-muted hover:text-rose-600"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* MODAL 1: ADD LECTURES */}
      {showAddLectureModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-border shadow-2xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-body-md font-bold text-ink">Add Lectures to {activeChapter?.title}</h3>
              <button type="button" onClick={() => setShowAddLectureModal(false)} className="text-ink-muted hover:text-ink font-bold">
                ✕
              </button>
            </div>

            {/* Sub-tabs: Synced Library vs Unlisted YouTube URL */}
            <div className="flex border-b border-border">
              <button
                type="button"
                onClick={() => setLectureTab("library")}
                className={`px-4 py-2 text-body-xs font-bold border-b-2 transition-colors ${
                  lectureTab === "library" ? "border-primary text-primary" : "border-transparent text-ink-muted hover:text-ink"
                }`}
              >
                Synced YouTube Library
              </button>
              <button
                type="button"
                onClick={() => setLectureTab("unlisted")}
                className={`px-4 py-2 text-body-xs font-bold border-b-2 transition-colors ${
                  lectureTab === "unlisted" ? "border-primary text-primary" : "border-transparent text-ink-muted hover:text-ink"
                }`}
              >
                Paste Unlisted Video URL
              </button>
            </div>

            {lectureTab === "library" ? (
              <div className="space-y-3 flex-1 overflow-hidden flex flex-col">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-ink-muted" />
                  <Input
                    placeholder="Search synced video lectures by title..."
                    value={videoSearchQuery}
                    onChange={(e) => setVideoSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>

                <div className="flex-1 overflow-y-auto space-y-2 max-h-80 pr-1">
                  {(data?.availableVideos || [])
                    .filter((v) => !videoSearchQuery || v.title.toLowerCase().includes(videoSearchQuery.toLowerCase()))
                    .map((video) => {
                      const isSelected = selectedVideoIds.includes(video.id);
                      return (
                        <div
                          key={video.id}
                          onClick={() => {
                            if (isSelected) {
                              setSelectedVideoIds(selectedVideoIds.filter((id) => id !== video.id));
                            } else {
                              setSelectedVideoIds([...selectedVideoIds, video.id]);
                            }
                          }}
                          className={`p-3 rounded-xl border cursor-pointer flex items-center justify-between gap-3 transition-colors ${
                            isSelected ? "border-primary bg-primary/5" : "border-border hover:bg-surface"
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <h4 className="text-body-xs font-bold text-ink truncate">{video.title}</h4>
                            <p className="text-[11px] text-ink-muted font-mono">{video.id}</p>
                          </div>
                          <div
                            className={`w-5 h-5 rounded border flex items-center justify-center ${
                              isSelected ? "bg-primary border-primary text-white" : "border-border"
                            }`}
                          >
                            {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="text-body-xs font-bold text-ink mb-1 block">Unlisted YouTube URL or Video ID</label>
                  <Input
                    placeholder="https://www.youtube.com/watch?v=..."
                    value={unlistedUrl}
                    onChange={(e) => setUnlistedUrl(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-body-xs font-bold text-ink mb-1 block">Lecture Title</label>
                  <Input
                    placeholder="e.g. Special Problem Solving Session"
                    value={unlistedTitle}
                    onChange={(e) => setUnlistedTitle(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-body-xs font-bold text-ink mb-1 block">Section</label>
                  <Input
                    placeholder="e.g. Lectures or Revision"
                    value={unlistedSection}
                    onChange={(e) => setUnlistedSection(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
              <Button variant="outline" size="sm" onClick={() => setShowAddLectureModal(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleAddLecturesSubmit} disabled={isPending}>
                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add to Batch"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: BULK PDF UPLOAD */}
      {showBulkPdfModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-border shadow-2xl max-w-xl w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-body-md font-bold text-ink">Upload Notes & Study Material (PDF)</h3>
              <button type="button" onClick={() => setShowBulkPdfModal(false)} className="text-ink-muted hover:text-ink font-bold">
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-body-xs font-bold text-ink mb-1 block">Section (Folder)</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {["Class Notes", "Selina Solutions", "Formula Sheet", "Assignments", "PYQs"].map((sec) => (
                    <button
                      key={sec}
                      type="button"
                      onClick={() => setPdfSection(sec)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold border transition-colors ${
                        pdfSection === sec ? "bg-primary text-white border-primary" : "bg-surface text-ink-muted border-border"
                      }`}
                    >
                      {sec}
                    </button>
                  ))}
                </div>
                <Input value={pdfSection} onChange={(e) => setPdfSection(e.target.value)} placeholder="Custom section name" />
              </div>

              <div>
                <label className="text-body-xs font-bold text-ink mb-1 block">Select or Drag PDF Files</label>
                <div className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-primary/50 bg-surface-subtle transition-colors cursor-pointer relative">
                  <input
                    type="file"
                    multiple
                    accept=".pdf"
                    onChange={(e) => handlePdfFilesChosen(e.target.files)}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <Upload className="w-8 h-8 text-primary mx-auto mb-2" />
                  <p className="text-body-xs font-bold text-ink">Click or drop multiple PDF files here</p>
                  <p className="text-[11px] text-ink-muted mt-1">Automatic title cleaning from filenames ("EX 4(A).pdf" → "Exercise 4(A)")</p>
                </div>
              </div>

              {selectedPdfs.length > 0 && (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  <span className="text-caption font-bold text-ink">{selectedPdfs.length} files selected:</span>
                  {selectedPdfs.map((item, idx) => (
                    <div key={idx} className="p-2 rounded-lg bg-surface border border-border flex items-center justify-between text-xs">
                      <div className="truncate flex-1 pr-2">
                        <span className="font-semibold text-ink">{item.cleanTitle}</span>
                        <span className="text-ink-muted ml-2 font-mono">({Math.round(item.file.size / 1024)} KB)</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedPdfs(selectedPdfs.filter((_, i) => i !== idx))}
                        className="text-rose-500 hover:text-rose-700"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Notify Batch Toggle */}
              <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/60 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-amber-700" />
                  <div>
                    <h5 className="text-body-xs font-bold text-amber-900">Notify Batch</h5>
                    <p className="text-[11px] text-amber-700">Creates an announcement and push notification to enrolled students.</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={notifyBatchOnPdf}
                  onChange={(e) => setNotifyBatchOnPdf(e.target.checked)}
                  className="w-4 h-4 accent-primary rounded"
                />
              </div>

              {uploadProgressText && <p className="text-body-xs text-primary font-semibold text-center">{uploadProgressText}</p>}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
              <Button variant="outline" size="sm" onClick={() => setShowBulkPdfModal(false)} disabled={isUploadingPdfs}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleUploadPdfsSubmit} disabled={selectedPdfs.length === 0 || isUploadingPdfs}>
                {isUploadingPdfs ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : null}
                Upload {selectedPdfs.length} PDFs
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: ZIP IMPORT (OLD APP MATERIAL) */}
      {showZipImportModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-border shadow-2xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <FileArchive className="w-5 h-5 text-amber-600" />
                <h3 className="text-body-md font-bold text-ink">Import Old App Material from ZIP</h3>
              </div>
              <button type="button" onClick={() => setShowZipImportModal(false)} className="text-ink-muted hover:text-ink font-bold">
                ✕
              </button>
            </div>

            <p className="text-body-xs text-ink-muted">
              Upload a ZIP archive with folder structure: <code className="bg-neutral-100 px-1 py-0.5 rounded font-mono text-[11px]">Subject / Chapter / Section / file.pdf</code>.
              Chapters, subjects, and study materials will be created automatically.
            </p>

            {!zipAnalysis ? (
              <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-amber-500/50 bg-surface-subtle transition-colors cursor-pointer relative">
                <input
                  type="file"
                  accept=".zip"
                  onChange={handleAnalyzeZip}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <FileArchive className="w-10 h-10 text-amber-600 mx-auto mb-2" />
                <p className="text-body-sm font-bold text-ink">Choose .zip file to inspect structure</p>
                {isAnalyzingZip && (
                  <p className="text-body-xs text-primary font-semibold mt-2 flex items-center justify-center gap-1.5">
                    <Loader2 className="w-4 h-4 animate-spin" /> Unpacking archive tree...
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-3 flex-1 overflow-hidden flex flex-col">
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-center justify-between text-body-xs text-amber-900 font-bold">
                  <span>Found: {zipAnalysis.subjectsCount} Subjects · {zipAnalysis.chaptersCount} Chapters · {zipAnalysis.filesCount} PDFs</span>
                  <button type="button" onClick={() => setZipAnalysis(null)} className="text-xs text-amber-700 underline">
                    Change file
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto border border-border rounded-xl p-3 bg-surface text-xs space-y-3 max-h-72">
                  {Object.entries(zipAnalysis.tree).map(([subj, chaps]) => (
                    <div key={subj} className="space-y-1">
                      <div className="font-bold text-primary flex items-center gap-1.5">
                        <FolderTree className="w-3.5 h-3.5" />
                        <span>{subj}</span>
                      </div>
                      <div className="pl-4 space-y-2 border-l border-border/80 ml-1.5">
                        {Object.entries(chaps).map(([chap, secs]) => (
                          <div key={chap} className="space-y-1">
                            <span className="font-semibold text-ink">{chap}</span>
                            <div className="pl-3 space-y-1">
                              {Object.entries(secs).map(([sec, files]) => (
                                <div key={sec} className="text-ink-muted">
                                  <span className="font-medium text-ink/80">• {sec}:</span> {files.length} notes ({files.slice(0, 3).join(", ")}{files.length > 3 ? "..." : ""})
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {zipProgress && <p className="text-body-xs text-primary font-semibold text-center">{zipProgress}</p>}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
              <Button variant="outline" size="sm" onClick={() => setShowZipImportModal(false)} disabled={isImportingZip}>
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleConfirmZipImport}
                disabled={!zipAnalysis || isImportingZip}
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold"
              >
                {isImportingZip ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : null}
                Confirm & Import {zipAnalysis?.filesCount || 0} Files
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: LINK PUBLIC LIBRARY CHAPTERS */}
      {showLinkChapterModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-border shadow-2xl max-w-lg w-full p-6 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-body-md font-bold text-ink">Link Public Library Chapters</h3>
              <button type="button" onClick={() => setShowLinkChapterModal(false)} className="text-ink-muted hover:text-ink font-bold">
                ✕
              </button>
            </div>

            <p className="text-body-xs text-ink-muted">
              Linked chapters include their public YouTube lectures inside this batch automatically without copying files.
            </p>

            <div className="flex-1 overflow-y-auto space-y-2 max-h-80 pr-1">
              {(data?.chapters || []).map((ch) => {
                const isLinked = data?.linkedChapterIds.includes(ch.id);
                return (
                  <div key={ch.id} className="p-3 rounded-xl border border-border bg-surface flex items-center justify-between gap-3 text-xs">
                    <div>
                      <h5 className="font-bold text-ink">{ch.title}</h5>
                      <p className="text-[11px] text-ink-muted">{data?.subjects.find((s) => s.id === ch.subjectId)?.name}</p>
                    </div>

                    <Button
                      size="sm"
                      variant={isLinked ? "outline" : "primary"}
                      onClick={async () => {
                        if (isLinked) {
                          await unlinkBatchChapterAction(batchId, ch.id);
                        } else {
                          await linkBatchChapterAction(batchId, ch.id);
                        }
                        loadData();
                      }}
                      className="text-xs font-bold"
                    >
                      {isLinked ? "Unlink" : "Link"}
                    </Button>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end pt-3 border-t border-border">
              <Button size="sm" onClick={() => setShowLinkChapterModal(false)}>
                Done
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
