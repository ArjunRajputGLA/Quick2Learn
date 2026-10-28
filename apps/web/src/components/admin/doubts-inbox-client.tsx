"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { toast } from "sonner";
import {
  listAdminDoubtsAction,
  getDoubtThreadAction,
  replyDoubtAction,
  closeDoubtAction,
  createCannedReplyAction,
  getPresignedUploadUrlAction,
} from "@/server/admin-actions";
import type {
  DoubtItem,
  DoubtThreadResponse,
  DoubtCannedReplyItem,
} from "@quick2learn/shared";
import {
  MessageSquare,
  Send,
  Image as ImageIcon,
  Video,
  CheckCircle2,
  Plus,
  Search,
  Sparkles,
  HelpCircle,
  Loader2,
  Paperclip,
  X,
} from "lucide-react";

interface SubjectOption {
  id: string;
  name: string;
}

interface BatchOption {
  id: string;
  name: string;
}

interface LectureOption {
  id: string;
  title: string;
  durationSeconds: number;
}

interface DoubtsInboxClientProps {
  initialDoubts: DoubtItem[];
  initialOpenCount: number;
  subjects: SubjectOption[];
  batches: BatchOption[];
  initialCannedReplies: DoubtCannedReplyItem[];
  lectures: LectureOption[];
  initialSelectedDoubtId?: string;
  currentUser: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

export function DoubtsInboxClient({
  initialDoubts,
  initialOpenCount,
  subjects,
  batches,
  initialCannedReplies,
  lectures,
  initialSelectedDoubtId,
  currentUser: _currentUser,
}: DoubtsInboxClientProps) {
  // Inbox list state
  const [doubts, setDoubts] = useState<DoubtItem[]>(initialDoubts);
  const [openCount, setOpenCount] = useState(initialOpenCount);
  const [statusFilter, setStatusFilter] = useState<"unanswered" | "open" | "answered" | "closed" | "all">("unanswered");
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");
  const [selectedBatchId, setSelectedBatchId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isRefreshing, startRefreshTransition] = useTransition();

  // Active thread state
  const [selectedDoubtId, setSelectedDoubtId] = useState<string | null>(
    initialSelectedDoubtId || (initialDoubts.length > 0 ? initialDoubts[0]!.id : null)
  );
  const [activeThread, setActiveThread] = useState<DoubtThreadResponse | null>(null);
  const [isLoadingThread, setIsLoadingThread] = useState(false);

  // Reply form state
  const [replyText, setReplyText] = useState("");
  const [replyAttachments, setReplyAttachments] = useState<Array<{ key: string; previewUrl: string }>>([]);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isSendingReply, setIsSendingReply] = useState(false);

  // Lecture linking state
  const [showLectureLinker, setShowLectureLinker] = useState(false);
  const [linkedLectureId, setLinkedLectureId] = useState<string>("");
  const [linkedMinutes, setLinkedMinutes] = useState<number>(0);
  const [linkedSeconds, setLinkedSeconds] = useState<number>(0);

  // Canned replies state
  const [cannedReplies, setCannedReplies] = useState<DoubtCannedReplyItem[]>(initialCannedReplies);
  const [showNewCannedModal, setShowNewCannedModal] = useState(false);
  const [newCannedTitle, setNewCannedTitle] = useState("");
  const [newCannedBody, setNewCannedBody] = useState("");
  const [newCannedCategory, setNewCannedCategory] = useState("Math");
  const [isCreatingCanned, setIsCreatingCanned] = useState(false);

  // Image lightbox preview
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch thread when selectedDoubtId changes
  useEffect(() => {
    if (!selectedDoubtId) {
      setActiveThread(null);
      return;
    }

    let isMounted = true;
    setIsLoadingThread(true);

    getDoubtThreadAction(selectedDoubtId).then((res) => {
      if (!isMounted) return;
      setIsLoadingThread(false);
      if (res.success && res.data) {
        setActiveThread(res.data);
      } else {
        toast.error(res.error || "Failed to load doubt thread");
      }
    });

    return () => {
      isMounted = false;
    };
  }, [selectedDoubtId]);

  // Auto-scroll messages to bottom
  useEffect(() => {
    if (activeThread && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [activeThread?.messages]);

  // Refetch doubts list when filters change
  const reloadDoubts = (overrideStatus?: typeof statusFilter) => {
    startRefreshTransition(async () => {
      const res = await listAdminDoubtsAction({
        status: overrideStatus || statusFilter,
        subjectId: selectedSubjectId || undefined,
        batchId: selectedBatchId || undefined,
      });

      if (res.success && res.data) {
        setDoubts(res.data.doubts);
        setOpenCount(res.data.openCount);
        if (res.data.doubts.length > 0 && !res.data.doubts.some((d: DoubtItem) => d.id === selectedDoubtId)) {
          setSelectedDoubtId(res.data.doubts[0].id);
        }
      } else {
        toast.error(res.error || "Failed to load doubts");
      }
    });
  };

  const handleFilterStatus = (status: typeof statusFilter) => {
    setStatusFilter(status);
    reloadDoubts(status);
  };

  // Upload image attachment
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (replyAttachments.length >= 3) {
      toast.error("At most 3 photos allowed per reply");
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Only image files are allowed");
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      toast.error("Image file size must be under 15 MB");
      return;
    }

    setIsUploadingPhoto(true);
    try {
      const presignedRes = await getPresignedUploadUrlAction({
        filename: file.name,
        contentType: file.type,
        sizeBytes: file.size,
        folder: "doubts",
      });

      if (!presignedRes.success || !presignedRes.data) {
        throw new Error(presignedRes.error || "Failed to get upload authorization");
      }

      const putRes = await fetch(presignedRes.data.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!putRes.ok) {
        throw new Error("Failed to upload image file to storage");
      }

      const localPreview = URL.createObjectURL(file);
      setReplyAttachments((prev) => [
        ...prev,
        { key: presignedRes.data!.key, previewUrl: localPreview },
      ]);
      toast.success("Image attached successfully");
    } catch (err: unknown) {
      console.error("Upload error:", err);
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Send reply
  const handleSendReply = async () => {
    if (!selectedDoubtId) return;
    if (!replyText.trim() && replyAttachments.length === 0) {
      toast.error("Please enter a reply or attach a photo");
      return;
    }

    setIsSendingReply(true);

    const payload: {
      body: string;
      attachmentKeys: string[];
      lectureLink?: { lectureId: string; timestampSeconds: number; title?: string };
    } = {
      body: replyText.trim() || "See attached photo explanation.",
      attachmentKeys: replyAttachments.map((a) => a.key),
    };

    if (showLectureLinker && linkedLectureId) {
      const totalSeconds = (linkedMinutes || 0) * 60 + (linkedSeconds || 0);
      const lectureObj = lectures.find((l) => l.id === linkedLectureId);
      payload.lectureLink = {
        lectureId: linkedLectureId,
        timestampSeconds: totalSeconds,
        title: lectureObj?.title,
      };
    }

    const res = await replyDoubtAction(selectedDoubtId, payload);
    setIsSendingReply(false);

    if (res.success && res.data) {
      toast.success("Reply sent! Student notified via push.");
      setReplyText("");
      setReplyAttachments([]);
      setShowLectureLinker(false);
      setLinkedLectureId("");
      setLinkedMinutes(0);
      setLinkedSeconds(0);

      // Refresh thread
      getDoubtThreadAction(selectedDoubtId).then((threadRes) => {
        if (threadRes.success && threadRes.data) {
          setActiveThread(threadRes.data);
        }
      });

      // Update in local list
      setDoubts((prev) =>
        prev.map((d) =>
          d.id === selectedDoubtId
            ? { ...d, status: "answered", lastActivityAt: new Date().toISOString() }
            : d
        )
      );
    } else {
      toast.error(res.error || "Failed to send reply");
    }
  };

  // Close doubt
  const handleCloseDoubt = async () => {
    if (!selectedDoubtId) return;
    const res = await closeDoubtAction(selectedDoubtId);
    if (res.success) {
      toast.success("Doubt closed");
      setActiveThread((prev) => (prev ? { ...prev, doubt: { ...prev.doubt, status: "closed" } } : null));
      setDoubts((prev) =>
        prev.map((d) => (d.id === selectedDoubtId ? { ...d, status: "closed" } : d))
      );
    } else {
      toast.error(res.error || "Failed to close doubt");
    }
  };

  // Create new canned reply
  const handleCreateCannedReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCannedTitle.trim() || !newCannedBody.trim()) {
      toast.error("Title and message are required");
      return;
    }

    setIsCreatingCanned(true);
    const res = await createCannedReplyAction({
      title: newCannedTitle,
      body: newCannedBody,
      category: newCannedCategory,
    });
    setIsCreatingCanned(false);

    if (res.success && res.data) {
      toast.success("Canned reply saved!");
      setCannedReplies((prev) => [...prev, res.data]);
      setShowNewCannedModal(false);
      setNewCannedTitle("");
      setNewCannedBody("");
    } else {
      toast.error(res.error || "Failed to save canned reply");
    }
  };

  // Filter doubts locally for search query
  const filteredDoubts = doubts.filter((d) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      d.title.toLowerCase().includes(q) ||
      (d.studentName && d.studentName.toLowerCase().includes(q)) ||
      (d.subjectName && d.subjectName.toLowerCase().includes(q))
    );
  });

  return (
    <div className="flex flex-col h-[calc(100vh-6.5rem)] w-full overflow-hidden space-y-3">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/80 shrink-0">
        <div>
          <div className="flex items-center space-x-2.5">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Doubts Inbox
            </h1>
            <span className="text-[11px] px-2 py-0.5 rounded-full font-bold bg-amber-50 text-amber-800 border border-amber-200">
              {openCount} Unanswered
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            1-on-1 student doubts sorted oldest first for rapid teacher resolution.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowNewCannedModal(true)}
            className="inline-flex items-center h-8 px-3 text-xs font-semibold rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <Sparkles size={13} className="mr-1.5 text-blue-600" />
            <span>+ New Saved Reply</span>
          </button>
          <button
            onClick={() => reloadDoubts()}
            disabled={isRefreshing}
            className="inline-flex items-center h-8 px-3 text-xs font-semibold rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <Loader2
              size={13}
              className={`mr-1.5 text-blue-600 ${isRefreshing ? "animate-spin" : ""}`}
            />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Main Inbox Layout: Master / Detail */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 flex-1 mt-4 overflow-hidden min-h-0">
        {/* Left Column: Doubts List & Filters (5 cols) */}
        <div className="md:col-span-5 flex flex-col bg-surface rounded-2xl border border-border shadow-xs overflow-hidden h-full">
          {/* Status Tabs */}
          <div className="flex items-center border-b border-border bg-surface-subtle/50 p-1.5 space-x-1 overflow-x-auto">
            {[
              { id: "unanswered" as const, label: "Unanswered", count: openCount },
              { id: "all" as const, label: "All" },
              { id: "answered" as const, label: "Answered" },
              { id: "closed" as const, label: "Closed" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleFilterStatus(tab.id)}
                className={`flex-1 py-1.5 px-2.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap text-center ${
                  statusFilter === tab.id
                    ? "bg-surface text-primary shadow-xs font-bold"
                    : "text-ink-muted hover:text-ink hover:bg-surface/50"
                }`}
              >
                {tab.label}
                {"count" in tab && typeof tab.count === "number" && tab.count > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded-full text-[10px]">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Filters row: Subject, Batch, Search */}
          <div className="p-3 border-b border-border space-y-2 bg-surface">
            <div className="relative">
              <Search
                size={14}
                className="absolute left-2.5 top-2.5 text-ink-muted pointer-events-none"
              />
              <input
                type="text"
                placeholder="Search by title, student..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-border bg-surface text-ink placeholder:text-ink-muted/70 focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <select
                value={selectedSubjectId}
                onChange={(e) => {
                  setSelectedSubjectId(e.target.value);
                  setTimeout(() => reloadDoubts(), 0);
                }}
                className="w-full text-xs py-1.5 px-2 rounded-lg border border-border bg-surface text-ink focus:outline-none"
              >
                <option value="">All Subjects</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>

              <select
                value={selectedBatchId}
                onChange={(e) => {
                  setSelectedBatchId(e.target.value);
                  setTimeout(() => reloadDoubts(), 0);
                }}
                className="w-full text-xs py-1.5 px-2 rounded-lg border border-border bg-surface text-ink focus:outline-none"
              >
                <option value="">All Batches</option>
                {batches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Doubts Scrollable List (Oldest First for Unanswered) */}
          <div className="flex-1 overflow-y-auto divide-y divide-border">
            {filteredDoubts.length === 0 ? (
              <div className="p-8 text-center text-ink-muted">
                <CheckCircle2 size={36} className="mx-auto text-emerald-500 mb-2 opacity-80" />
                <p className="text-sm font-semibold text-ink">No doubts found</p>
                <p className="text-xs text-ink-muted mt-1">
                  {statusFilter === "unanswered"
                    ? "Great job! All doubts have been answered."
                    : "No student doubts match the current filters."}
                </p>
              </div>
            ) : (
              filteredDoubts.map((d) => {
                const isSelected = d.id === selectedDoubtId;
                const dateObj = new Date(d.lastActivityAt);
                const timeString = dateObj.toLocaleDateString("en-IN", {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                });

                return (
                  <button
                    key={d.id}
                    onClick={() => setSelectedDoubtId(d.id)}
                    className={`w-full text-left p-3.5 transition-colors flex flex-col space-y-1.5 ${
                      isSelected
                        ? "bg-primary-soft/40 border-l-4 border-l-primary"
                        : "hover:bg-surface-subtle"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            d.status === "open"
                              ? "bg-amber-500"
                              : d.status === "answered"
                              ? "bg-blue-500"
                              : "bg-emerald-500"
                          }`}
                        />
                        <span className="text-xs font-bold text-ink">
                          {d.studentName || "Student"}
                        </span>
                        {d.subjectName && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface border border-border text-ink-muted font-medium">
                            {d.subjectName}
                          </span>
                        )}
                      </div>

                      <span className="text-[10px] text-ink-muted font-mono">
                        {timeString}
                      </span>
                    </div>

                    <p className="text-xs font-semibold text-ink line-clamp-1">
                      {d.title}
                    </p>

                    {d.firstMessageSnippet && (
                      <p className="text-[11px] text-ink-muted line-clamp-1">
                        {d.firstMessageSnippet}
                      </p>
                    )}

                    <div className="flex items-center space-x-2 text-[10px] text-ink-muted pt-0.5">
                      {d.hasAttachments && (
                        <span className="inline-flex items-center text-primary font-medium">
                          <Paperclip size={11} className="mr-0.5" />
                          Photo
                        </span>
                      )}
                      {d.sourceType === "lecture" && (
                        <span className="inline-flex items-center text-indigo-600 font-medium">
                          <Video size={11} className="mr-0.5" />
                          Lecture
                        </span>
                      )}
                      {d.sourceType === "test_question" && (
                        <span className="inline-flex items-center text-emerald-700 font-medium">
                          <HelpCircle size={11} className="mr-0.5" />
                          Test Q
                        </span>
                      )}
                      {d.batchName && (
                        <span className="text-ink-muted/80">• {d.batchName}</span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Active Thread & Reply Form (7 cols) */}
        <div className="md:col-span-7 flex flex-col bg-surface rounded-2xl border border-border shadow-xs overflow-hidden h-full">
          {isLoadingThread ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 size={32} className="animate-spin text-primary" />
            </div>
          ) : !activeThread ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-ink-muted">
              <MessageSquare size={44} className="text-ink-muted/40 mb-3" />
              <p className="text-base font-bold text-ink">Select a doubt from the inbox</p>
              <p className="text-xs text-ink-muted mt-1 max-w-sm">
                Choose a pending student doubt from the list on the left to inspect student photos, context, and provide step-by-step guidance.
              </p>
            </div>
          ) : (
            <div className="flex flex-col h-full overflow-hidden">
              {/* Thread Header */}
              <div className="p-4 border-b border-border bg-surface flex items-start justify-between">
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                        activeThread.doubt.status === "open"
                          ? "bg-amber-100 text-amber-800 border border-amber-300"
                          : activeThread.doubt.status === "answered"
                          ? "bg-blue-100 text-blue-800 border border-blue-300"
                          : "bg-emerald-100 text-emerald-800 border border-emerald-300"
                      }`}
                    >
                      {activeThread.doubt.status}
                    </span>
                    {activeThread.doubt.isHelpful && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold flex items-center">
                        <Sparkles size={11} className="mr-1 text-emerald-600" />
                        Student: "This Solved It!"
                      </span>
                    )}
                  </div>

                  <h2 className="text-base font-bold text-ink leading-tight">
                    {activeThread.doubt.title}
                  </h2>

                  <div className="flex items-center space-x-3 text-xs text-ink-muted mt-1">
                    <span className="font-semibold text-ink">
                      {activeThread.doubt.studentName || "Student"}
                    </span>
                    {activeThread.doubt.studentPhone && (
                      <span className="text-ink-muted">({activeThread.doubt.studentPhone})</span>
                    )}
                    <span>• {activeThread.doubt.subjectName}</span>
                    {activeThread.doubt.chapterTitle && (
                      <span>• {activeThread.doubt.chapterTitle}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {activeThread.doubt.status !== "closed" && (
                    <button
                      onClick={handleCloseDoubt}
                      className="text-xs font-semibold px-2.5 py-1 rounded-lg border border-border bg-surface hover:bg-surface-subtle text-ink transition-colors"
                    >
                      Close Doubt
                    </button>
                  )}
                </div>
              </div>

              {/* Source Context Banner (Lecture or Test Question) */}
              {activeThread.sourceContext && (
                <div className="bg-surface-subtle px-4 py-2.5 border-b border-border text-xs flex items-center justify-between">
                  {activeThread.sourceContext.lectureId ? (
                    <div className="flex items-center space-x-2">
                      <Video size={16} className="text-indigo-600" />
                      <div>
                        <span className="font-semibold text-ink">Asked from Lecture: </span>
                        <span className="text-ink-muted">{activeThread.sourceContext.lectureTitle}</span>
                        {activeThread.sourceContext.timestampFormatted && (
                          <span className="ml-1 font-mono font-bold text-primary">
                            @{activeThread.sourceContext.timestampFormatted}
                          </span>
                        )}
                      </div>
                    </div>
                  ) : activeThread.sourceContext.questionId ? (
                    <div className="flex items-center space-x-2">
                      <HelpCircle size={16} className="text-emerald-700" />
                      <div>
                        <span className="font-semibold text-ink">Asked from Test Question: </span>
                        <span className="text-ink-muted line-clamp-1">{activeThread.sourceContext.questionStem}</span>
                      </div>
                    </div>
                  ) : null}
                </div>
              )}

              {/* Message Thread Scroll Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-surface-subtle/30">
                {activeThread.messages.map((msg) => {
                  const isStaffMsg = msg.authorRole === "teacher" || msg.authorRole === "admin";
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isStaffMsg ? "items-end" : "items-start"}`}
                    >
                      <div className="flex items-center space-x-2 mb-1 px-1">
                        <span className="text-[11px] font-bold text-ink">
                          {isStaffMsg ? `${msg.authorName} (Teacher)` : msg.authorName}
                        </span>
                        <span className="text-[10px] text-ink-muted">
                          {new Date(msg.createdAt).toLocaleTimeString("en-IN", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>

                      <div
                        className={`max-w-[85%] rounded-2xl p-3.5 shadow-xs ${
                          isStaffMsg
                            ? "bg-primary text-white rounded-br-xs"
                            : "bg-surface border border-border text-ink rounded-bl-xs"
                        }`}
                      >
                        {/* Body markdown */}
                        <div className="text-xs leading-relaxed whitespace-pre-wrap font-sans">
                          {msg.body}
                        </div>

                        {/* Attachments Preview */}
                        {msg.attachmentUrls && msg.attachmentUrls.length > 0 && (
                          <div className="mt-3 grid grid-cols-2 gap-2">
                            {msg.attachmentUrls.map((url, i) => (
                              <button
                                key={i}
                                type="button"
                                onClick={() => setPreviewImage(url)}
                                className="relative rounded-lg overflow-hidden border border-black/10 group bg-black/5 aspect-video"
                              >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={url}
                                  alt={`Attachment ${i + 1}`}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                />
                                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-[10px] font-bold">
                                  Click to zoom
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Reply Form */}
              <div className="p-3 border-t border-border bg-surface">
                {/* Canned Replies Quick Chips */}
                <div className="flex items-center space-x-1.5 overflow-x-auto pb-2 text-xs">
                  <span className="text-[11px] font-bold text-ink-muted uppercase tracking-wider mr-1">
                    Canned:
                  </span>
                  {cannedReplies.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setReplyText((prev) => (prev ? `${prev}\n\n${c.body}` : c.body))}
                      className="px-2.5 py-1 rounded-full bg-surface-subtle hover:bg-primary-soft hover:text-primary text-ink-muted border border-border transition-colors text-[11px] font-medium whitespace-nowrap"
                    >
                      {c.title}
                    </button>
                  ))}
                </div>

                {/* Lecture Link Picker Overlay (if active) */}
                {showLectureLinker && (
                  <div className="mb-2.5 p-2.5 bg-indigo-50/60 border border-indigo-200 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-indigo-900 flex items-center">
                        <Video size={13} className="mr-1.5 text-indigo-600" />
                        Link Lecture at Timestamp
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowLectureLinker(false)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        <X size={14} />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div className="sm:col-span-2">
                        <select
                          value={linkedLectureId}
                          onChange={(e) => setLinkedLectureId(e.target.value)}
                          className="w-full text-xs py-1 px-2 rounded-lg border border-indigo-200 bg-surface text-ink"
                        >
                          <option value="">Select Lecture Video...</option>
                          {lectures.map((l) => (
                            <option key={l.id} value={l.id}>
                              {l.title}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex items-center space-x-1">
                        <input
                          type="number"
                          placeholder="Min"
                          value={linkedMinutes || ""}
                          onChange={(e) => setLinkedMinutes(parseInt(e.target.value, 10) || 0)}
                          className="w-14 text-xs py-1 px-1.5 text-center rounded-lg border border-indigo-200 bg-surface"
                        />
                        <span className="text-xs text-indigo-900 font-bold">:</span>
                        <input
                          type="number"
                          placeholder="Sec"
                          max={59}
                          value={linkedSeconds || ""}
                          onChange={(e) => setLinkedSeconds(parseInt(e.target.value, 10) || 0)}
                          className="w-14 text-xs py-1 px-1.5 text-center rounded-lg border border-indigo-200 bg-surface"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Attachments pending upload */}
                {replyAttachments.length > 0 && (
                  <div className="flex items-center space-x-2 mb-2">
                    {replyAttachments.map((att, i) => (
                      <div
                        key={i}
                        className="relative w-14 h-14 rounded-lg overflow-hidden border border-border group"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={att.previewUrl}
                          alt="preview"
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => setReplyAttachments((prev) => prev.filter((_, idx) => idx !== i))}
                          className="absolute top-0.5 right-0.5 w-4 h-4 bg-black/70 rounded-full text-white flex items-center justify-center text-[10px]"
                        >
                          <X size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Reply Input Box */}
                <div className="relative">
                  <textarea
                    rows={3}
                    placeholder="Write step-by-step guidance for the student..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    className="w-full p-2.5 text-xs rounded-xl border border-border bg-surface text-ink placeholder:text-ink-muted/70 focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                  />

                  <div className="flex items-center justify-between mt-2 pt-1 border-t border-border/40">
                    <div className="flex items-center space-x-2">
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        className="hidden"
                        onChange={handlePhotoUpload}
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploadingPhoto || replyAttachments.length >= 3}
                        className="inline-flex items-center px-2 py-1 text-xs rounded-md text-ink-muted hover:text-ink hover:bg-surface-subtle transition-colors disabled:opacity-50"
                      >
                        {isUploadingPhoto ? (
                          <Loader2 size={13} className="animate-spin mr-1" />
                        ) : (
                          <ImageIcon size={13} className="mr-1 text-primary" />
                        )}
                        Photo ({replyAttachments.length}/3)
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowLectureLinker((prev) => !prev)}
                        className={`inline-flex items-center px-2 py-1 text-xs rounded-md transition-colors ${
                          showLectureLinker
                            ? "bg-indigo-100 text-indigo-900 font-semibold"
                            : "text-ink-muted hover:text-ink hover:bg-surface-subtle"
                        }`}
                      >
                        <Video size={13} className="mr-1 text-indigo-600" />
                        Link Lecture
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={handleSendReply}
                      disabled={isSendingReply || (!replyText.trim() && replyAttachments.length === 0)}
                      className="inline-flex items-center px-3.5 py-1.5 text-xs font-bold rounded-lg bg-primary hover:bg-primary/95 text-white shadow-xs transition-all disabled:opacity-50"
                    >
                      {isSendingReply ? (
                        <Loader2 size={13} className="animate-spin mr-1" />
                      ) : (
                        <Send size={13} className="mr-1.5" />
                      )}
                      Send Reply
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Lightbox Image Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute -top-10 right-0 text-white hover:text-gray-300 font-bold text-sm flex items-center"
            >
              <X size={20} className="mr-1" /> Close
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewImage}
              alt="Enlarged Doubt"
              className="max-h-[85vh] max-w-full rounded-xl object-contain shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}

      {/* New Saved Canned Reply Modal */}
      {showNewCannedModal && (
        <div
          onClick={() => setShowNewCannedModal(false)}
          className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-xl border border-slate-200/90 shadow-2xl max-w-md w-full p-5 animate-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="text-base font-bold text-ink">Create Saved Canned Reply</h3>
              <button
                onClick={() => setShowNewCannedModal(false)}
                className="text-ink-muted hover:text-ink"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateCannedReply} className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-bold text-ink block mb-1">
                  Title / Shortcut Label
                </label>
                <input
                  type="text"
                  placeholder="e.g. Check Formula Step 2"
                  value={newCannedTitle}
                  onChange={(e) => setNewCannedTitle(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg border border-border bg-surface text-ink"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-ink block mb-1">
                  Category
                </label>
                <select
                  value={newCannedCategory}
                  onChange={(e) => setNewCannedCategory(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg border border-border bg-surface text-ink"
                >
                  <option value="Math">Mathematics</option>
                  <option value="Concept">Concept</option>
                  <option value="Format">Working / Steps</option>
                  <option value="General">General</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-ink block mb-1">
                  Reply Text (Markdown Supported)
                </label>
                <textarea
                  rows={4}
                  placeholder="Write the explanation template..."
                  value={newCannedBody}
                  onChange={(e) => setNewCannedBody(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg border border-border bg-surface text-ink resize-none"
                  required
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowNewCannedModal(false)}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-border text-ink hover:bg-surface-subtle"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingCanned}
                  className="px-4 py-1.5 text-xs font-bold rounded-lg bg-primary text-white hover:bg-primary/90 flex items-center"
                >
                  {isCreatingCanned ? (
                    <Loader2 size={13} className="animate-spin mr-1" />
                  ) : (
                    <Plus size={13} className="mr-1" />
                  )}
                  Save Canned Reply
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
