"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { toast } from "sonner";
import {
  listAdminDoubtsAction,
  getDoubtThreadAction,
  replyDoubtAction,
  closeDoubtAction,
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
  CheckCircle2,
  Search,
  Sparkles,
  Loader2,
  Paperclip,
  X,
  Phone,
  MessageCircle,
  CheckCheck,
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

interface ChatsClientProps {
  initialDoubts: DoubtItem[];
  initialOpenCount: number;
  subjects: SubjectOption[];
  batches: BatchOption[];
  initialCannedReplies: DoubtCannedReplyItem[];
  lectures: LectureOption[];
  initialSelectedChatId?: string;
  currentUser: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

export function ChatsClient({
  initialDoubts,
  initialOpenCount,
  subjects,
  batches,
  initialCannedReplies,
  initialSelectedChatId,
  currentUser: _currentUser,
}: ChatsClientProps) {
  const [chats, setChats] = useState<DoubtItem[]>(initialDoubts);
  const [statusFilter, setStatusFilter] = useState<"all" | "unanswered" | "answered" | "closed">("all");
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");
  const [selectedBatchId, setSelectedBatchId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isRefreshing, startRefreshTransition] = useTransition();

  // Active chat state
  const [selectedChatId, setSelectedChatId] = useState<string | null>(
    initialSelectedChatId || (initialDoubts.length > 0 ? initialDoubts[0]!.id : null)
  );
  const [activeThread, setActiveThread] = useState<DoubtThreadResponse | null>(null);
  const [isLoadingThread, setIsLoadingThread] = useState(false);

  // Message compose state
  const [replyText, setReplyText] = useState("");
  const [replyAttachments, setReplyAttachments] = useState<Array<{ key: string; previewUrl: string }>>([]);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isSendingReply, setIsSendingReply] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of conversation
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeThread?.messages]);

  // Load selected chat thread
  useEffect(() => {
    if (!selectedChatId) {
      setActiveThread(null);
      return;
    }

    let isCancelled = false;
    setIsLoadingThread(true);

    getDoubtThreadAction(selectedChatId)
      .then((res) => {
        if (!isCancelled) {
          if (res.success && res.data) {
            setActiveThread(res.data);
          } else {
            toast.error(res.error || "Failed to load chat thread");
          }
        }
      })
      .catch((err) => {
        if (!isCancelled) {
          toast.error(err.message || "Failed to load chat thread");
        }
      })
      .finally(() => {
        if (!isCancelled) setIsLoadingThread(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [selectedChatId]);

  // Refresh chats list
  const reloadChats = (targetStatus = statusFilter) => {
    startRefreshTransition(async () => {
      const res = await listAdminDoubtsAction({
        status: targetStatus === "all" ? undefined : targetStatus,
        subjectId: selectedSubjectId || undefined,
        batchId: selectedBatchId || undefined,
        page: 1,
        limit: 50,
      });

      if (res.success && res.data) {
        setChats(res.data.doubts);
        if (!selectedChatId && res.data.doubts.length > 0) {
          setSelectedChatId(res.data.doubts[0]!.id);
        }
      }
    });
  };

  // Upload attachment
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/") && !file.type.includes("pdf")) {
      toast.error("Please upload an image (JPG, PNG) or PDF document");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size cannot exceed 10MB");
      return;
    }

    setIsUploadingPhoto(true);
    try {
      const res = await getPresignedUploadUrlAction({
        filename: file.name,
        contentType: file.type,
        sizeBytes: file.size,
        folder: "doubts",
      });

      if (res.success && res.data) {
        const { uploadUrl, key } = res.data;
        const uploadRes = await fetch(uploadUrl, {
          method: "PUT",
          body: file,
          headers: { "Content-Type": file.type },
        });

        if (uploadRes.ok) {
          const previewUrl = URL.createObjectURL(file);
          setReplyAttachments((prev) => [...prev, { key, previewUrl }]);
          toast.success("Attachment ready to send");
        } else {
          toast.error("Failed to upload file to storage");
        }
      } else {
        toast.error(res.error || "Failed to generate upload URL");
      }
    } catch {
      toast.error("Error uploading file");
    } finally {
      setIsUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Send message
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedChatId || (!replyText.trim() && replyAttachments.length === 0)) return;

    setIsSendingReply(true);
    try {
      const res = await replyDoubtAction(selectedChatId, {
        body: replyText.trim() || "See attached document/photo.",
        attachmentKeys: replyAttachments.map((a) => a.key),
      });

      if (res.success && res.data) {
        toast.success("Message sent");
        setReplyText("");
        setReplyAttachments([]);

        // Append to active thread
        const newMsg = res.data;
        setActiveThread((prev) =>
          prev
            ? {
                ...prev,
                messages: [...prev.messages, newMsg],
                doubt: { ...prev.doubt, status: "answered" },
              }
            : null
        );

        setChats((prev) =>
          prev.map((c) =>
            c.id === selectedChatId
              ? { ...c, status: "answered", lastActivityAt: new Date().toISOString() }
              : c
          )
        );
      } else {
        toast.error(res.error || "Failed to send message");
      }
    } catch {
      toast.error("Error sending message");
    } finally {
      setIsSendingReply(false);
    }
  };

  // Resolve chat
  const handleResolveChat = async () => {
    if (!selectedChatId) return;
    const res = await closeDoubtAction(selectedChatId);
    if (res.success) {
      toast.success("Chat marked as resolved");
      setActiveThread((prev) =>
        prev ? { ...prev, doubt: { ...prev.doubt, status: "closed" } } : null
      );
      setChats((prev) =>
        prev.map((c) => (c.id === selectedChatId ? { ...c, status: "closed" } : c))
      );
    } else {
      toast.error(res.error || "Failed to close chat");
    }
  };

  // Local filtered chats
  const filteredChats = chats.filter((c) => {
    if (statusFilter !== "all" && c.status !== statusFilter) return false;
    if (selectedSubjectId && c.subjectId !== selectedSubjectId) return false;
    if (selectedBatchId && c.batchId !== selectedBatchId) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        c.title.toLowerCase().includes(q) ||
        (c.studentName && c.studentName.toLowerCase().includes(q)) ||
        (c.subjectName && c.subjectName.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="flex flex-col h-[calc(100vh-6.5rem)] max-w-7xl mx-auto space-y-3">
      {/* 1. Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-slate-200/80 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Student Chats
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Inbox
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time direct 1-on-1 chats and query discussions with enrolled students.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => reloadChats()}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 h-7.5 px-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors"
          >
            <Loader2 className={`w-3 h-3 text-blue-600 ${isRefreshing ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* 2. Main Chat Console (Master / Detail Layout) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 flex-1 min-h-0 overflow-hidden">
        {/* Left Column: Conversations List (5 cols / ~380px) */}
        <div className="md:col-span-5 flex flex-col bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden h-full">
          {/* Quick Filter Pills Row */}
          <div className="p-2 border-b border-slate-100 flex items-center gap-1 overflow-x-auto bg-slate-50/60">
            {[
              { id: "all" as const, label: "All Chats" },
              { id: "unanswered" as const, label: "Pending", count: initialOpenCount },
              { id: "answered" as const, label: "Answered" },
              { id: "closed" as const, label: "Resolved" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setStatusFilter(tab.id);
                  reloadChats(tab.id);
                }}
                className={`py-1 px-2.5 text-xs font-semibold rounded-lg transition-all shrink-0 ${
                  statusFilter === tab.id
                    ? "bg-white text-blue-600 shadow-2xs border border-slate-200"
                    : "text-slate-500 hover:text-slate-800 hover:bg-slate-100/70"
                }`}
              >
                {tab.label}
                {tab.count !== undefined && tab.count > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] bg-amber-100 text-amber-800 font-bold">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Search & Subject / Batch Filters */}
          <div className="p-2.5 border-b border-slate-100 space-y-2 bg-white">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by student, subject..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-2.5 h-7.5 text-xs rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              <select
                value={selectedSubjectId}
                onChange={(e) => {
                  setSelectedSubjectId(e.target.value);
                  reloadChats();
                }}
                className="w-full h-7 text-xs px-2 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white text-slate-700 font-medium"
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
                  reloadChats();
                }}
                className="w-full h-7 text-xs px-2 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white text-slate-700 font-medium"
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

          {/* Chat List Scroll Area */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {filteredChats.length === 0 ? (
              <div className="p-8 text-center text-slate-400 space-y-1.5">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto opacity-70" />
                <p className="text-xs font-bold text-slate-800">No chats found</p>
                <p className="text-[11px] text-slate-500">
                  {statusFilter === "unanswered"
                    ? "All student messages have been answered!"
                    : "No conversations match your current filters."}
                </p>
              </div>
            ) : (
              filteredChats.map((c) => {
                const isSelected = c.id === selectedChatId;
                const dateObj = new Date(c.lastActivityAt);
                const timeString = dateObj.toLocaleDateString("en-IN", {
                  month: "short",
                  day: "numeric",
                });
                const initial = (c.studentName || "S").trim().charAt(0).toUpperCase() || "S";

                return (
                  <button
                    key={c.id}
                    onClick={() => setSelectedChatId(c.id)}
                    className={`w-full text-left p-2.5 transition-colors flex items-start gap-2.5 ${
                      isSelected
                        ? "bg-blue-50/60 border-l-4 border-l-blue-600"
                        : "hover:bg-slate-50/80"
                    }`}
                  >
                    {/* Student Initial Avatar with Online indicator */}
                    <div className="relative shrink-0">
                      <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center border border-slate-200">
                        {initial}
                      </div>
                      <span
                        className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ${
                          c.status === "open"
                            ? "bg-amber-500"
                            : c.status === "answered"
                            ? "bg-blue-500"
                            : "bg-emerald-500"
                        }`}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-bold text-slate-900 truncate">
                          {c.studentName || "Student"}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono shrink-0">
                          {timeString}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 mt-0.5">
                        {c.subjectName && (
                          <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200/60 truncate">
                            {c.subjectName}
                          </span>
                        )}
                        {c.batchName && (
                          <span className="text-[10px] text-slate-400 truncate">
                            {c.batchName}
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-slate-500 truncate mt-1">
                        {c.firstMessageSnippet || c.title}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Active Conversation Thread (7 cols) */}
        <div className="md:col-span-7 flex flex-col bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden h-full">
          {isLoadingThread ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            </div>
          ) : !activeThread ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
              <MessageSquare className="w-10 h-10 text-slate-300 mb-2" />
              <p className="text-sm font-bold text-slate-800">Select a chat to start messaging</p>
              <p className="text-xs text-slate-500 mt-1 max-w-xs">
                Pick a student from the inbox on the left to read their messages and reply.
              </p>
            </div>
          ) : (
            <div className="flex flex-col h-full overflow-hidden">
              {/* Thread Header */}
              <div className="p-3 border-b border-slate-200/80 bg-slate-50/50 flex items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-800 font-bold text-xs flex items-center justify-center shrink-0">
                    {(activeThread.doubt.studentName || "S").charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                        {activeThread.doubt.studentName || "Student"}
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.2 rounded-full font-bold uppercase tracking-wider ${
                          activeThread.doubt.status === "open"
                            ? "bg-amber-100 text-amber-800 border border-amber-300"
                            : activeThread.doubt.status === "answered"
                            ? "bg-blue-100 text-blue-800 border border-blue-300"
                            : "bg-emerald-100 text-emerald-800 border border-emerald-300"
                        }`}
                      >
                        {activeThread.doubt.status}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 truncate flex items-center gap-1.5">
                      <span>{activeThread.doubt.subjectName}</span>
                      {activeThread.doubt.chapterTitle && (
                        <span>· {activeThread.doubt.chapterTitle}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Contact Shortcuts & Status */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {activeThread.doubt.studentPhone && (
                    <>
                      <a
                        href={`tel:${activeThread.doubt.studentPhone}`}
                        className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-blue-600 hover:bg-slate-50 transition-colors"
                        title="Call Student"
                      >
                        <Phone className="w-3.5 h-3.5" />
                      </a>
                      <a
                        href={`https://wa.me/91${activeThread.doubt.studentPhone}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg border border-slate-200 bg-white text-emerald-600 hover:bg-emerald-50 transition-colors"
                        title="Open WhatsApp"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                      </a>
                    </>
                  )}

                  {activeThread.doubt.status !== "closed" && (
                    <button
                      onClick={handleResolveChat}
                      className="h-7 px-2.5 text-xs font-semibold rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors"
                    >
                      Mark Resolved
                    </button>
                  )}
                </div>
              </div>

              {/* Message Bubble Feed */}
              <div className="flex-1 overflow-y-auto p-3.5 space-y-3 bg-[#f8fafc]/60">
                {/* Topic Banner */}
                <div className="p-2.5 rounded-lg bg-white border border-slate-200/80 text-xs text-slate-800 shadow-2xs space-y-1">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Query Topic
                  </div>
                  <div className="font-semibold text-slate-900">{activeThread.doubt.title}</div>
                </div>

                {activeThread.messages.map((m) => {
                  const isStaff = m.authorRole === "teacher" || m.authorRole === "admin";
                  const dateObj = new Date(m.createdAt);
                  const timeFormatted = dateObj.toLocaleTimeString("en-IN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  });

                  return (
                    <div
                      key={m.id}
                      className={`flex flex-col ${isStaff ? "items-end" : "items-start"}`}
                    >
                      <div className="text-[10px] text-slate-400 mb-0.5 px-1 font-medium">
                        {isStaff ? `${m.authorName || "Teacher"} (You)` : m.authorName || "Student"}
                      </div>

                      <div
                        className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs shadow-2xs ${
                          isStaff
                            ? "bg-blue-600 text-white rounded-br-xs"
                            : "bg-white text-slate-800 border border-slate-200/80 rounded-bl-xs"
                        }`}
                      >
                        <p className="whitespace-pre-wrap leading-relaxed">{m.body}</p>

                        {/* Attachments */}
                        {m.attachmentUrls && m.attachmentUrls.length > 0 && (
                          <div className="mt-2 space-y-1.5">
                            {m.attachmentUrls.map((att: string, attIdx: number) => (
                              <a
                                key={attIdx}
                                href={att}
                                target="_blank"
                                rel="noreferrer"
                                className="block rounded-lg overflow-hidden border border-white/20"
                              >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={att}
                                  alt="Attachment"
                                  className="max-h-48 rounded object-cover"
                                />
                              </a>
                            ))}
                          </div>
                        )}

                        <div
                          className={`text-[9px] mt-1 flex items-center justify-end gap-1 ${
                            isStaff ? "text-blue-100" : "text-slate-400"
                          }`}
                        >
                          <span>{timeFormatted}</span>
                          {isStaff && <CheckCheck className="w-3 h-3 text-blue-200" />}
                        </div>
                      </div>
                    </div>
                  );
                })}

                <div ref={messagesEndRef} />
              </div>

              {/* Quick Saved Replies Pills */}
              {initialCannedReplies.length > 0 && (
                <div className="px-3 py-1.5 border-t border-slate-100 bg-white flex items-center gap-1.5 overflow-x-auto scrollbar-none text-[11px]">
                  <span className="text-slate-400 font-bold shrink-0 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-500" /> Quick:
                  </span>
                  {initialCannedReplies.slice(0, 4).map((canned) => (
                    <button
                      key={canned.id}
                      type="button"
                      onClick={() => setReplyText(canned.body)}
                      className="px-2 py-0.5 rounded-full bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-600 font-medium shrink-0 transition-colors"
                    >
                      {canned.title}
                    </button>
                  ))}
                </div>
              )}

              {/* Message Composer Bar */}
              <div className="p-2.5 border-t border-slate-200/80 bg-white space-y-2">
                {/* Upload Previews */}
                {replyAttachments.length > 0 && (
                  <div className="flex items-center gap-2">
                    {replyAttachments.map((att, idx) => (
                      <div key={idx} className="relative w-12 h-12 rounded-lg border border-slate-200 overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={att.previewUrl} alt="preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setReplyAttachments((prev) => prev.filter((_, i) => i !== idx))}
                          className="absolute top-0 right-0 bg-slate-900/80 text-white p-0.5 rounded-bl"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handlePhotoUpload}
                    accept="image/*,application/pdf"
                    className="hidden"
                  />

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingPhoto}
                    className="p-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-500 transition-colors shrink-0"
                    title="Attach photo or document"
                  >
                    {isUploadingPhoto ? (
                      <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                    ) : (
                      <Paperclip className="w-4 h-4" />
                    )}
                  </button>

                  <input
                    type="text"
                    placeholder="Type your response to the student..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    className="flex-1 h-8 text-xs px-3 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
                  />

                  <button
                    type="submit"
                    disabled={isSendingReply || (!replyText.trim() && replyAttachments.length === 0)}
                    className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold shadow-2xs transition-all shrink-0"
                  >
                    {isSendingReply ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                    <span>Send</span>
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
