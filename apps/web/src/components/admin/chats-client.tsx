"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { toast } from "sonner";
import {
  listAdminDoubtsAction,
  getDoubtThreadAction,
  replyDoubtAction,
  closeDoubtAction,
  uploadChatAttachmentAction,
  startStudentChatAction,
  type ChatStudentOption,
} from "@/server/admin-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type {
  DoubtItem,
  DoubtThreadResponse,
  DoubtCannedReplyItem,
  DoubtMessageItem,
} from "@quick2learn/shared";
import {
  MessageSquare,
  Send,
  Search,
  Sparkles,
  Loader2,
  Paperclip,
  X,
  Phone,
  MessageCircle,
  CheckCheck,
  Plus,
  UserPlus,
  Users,
  FileText,
  ExternalLink,
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
  students?: ChatStudentOption[];
}

export function ChatsClient({
  initialDoubts,
  initialOpenCount,
  subjects,
  batches,
  initialCannedReplies,
  initialSelectedChatId,
  currentUser,
  students = [],
}: ChatsClientProps) {
  const [chats, setChats] = useState<DoubtItem[]>(initialDoubts);
  const [statusFilter, setStatusFilter] = useState<"all" | "unanswered" | "answered" | "closed">("all");
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");
  const [selectedBatchId, setSelectedBatchId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isRefreshing, startRefreshTransition] = useTransition();

  // New Chat Modal state
  const [newChatModalOpen, setNewChatModalOpen] = useState(false);
  const [studentSearch, setStudentSearch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<ChatStudentOption | null>(null);
  const [newChatSubjectId, setNewChatSubjectId] = useState<string>(subjects[0]?.id || "");
  const [newChatTitle, setNewChatTitle] = useState("");
  const [newChatOpeningMessage, setNewChatOpeningMessage] = useState("");
  const [isStartingChat, setIsStartingChat] = useState(false);

  // Active chat state
  const [selectedChatId, setSelectedChatId] = useState<string | null>(
    initialSelectedChatId || (initialDoubts.length > 0 ? initialDoubts[0]!.id : null)
  );
  const [activeThread, setActiveThread] = useState<DoubtThreadResponse | null>(null);
  const [isLoadingThread, setIsLoadingThread] = useState(false);

  // Message compose state
  const [replyText, setReplyText] = useState("");
  const [replyAttachments, setReplyAttachments] = useState<
    Array<{ key: string; previewUrl: string; name?: string; isPdf?: boolean }>
  >([]);
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

  // Filter students for New Chat modal
  const filteredStudents = (students || []).filter((s) => {
    if (!studentSearch.trim()) return true;
    const q = studentSearch.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      (s.phone && s.phone.includes(q)) ||
      s.email.toLowerCase().includes(q) ||
      (s.classLevel && `class ${s.classLevel}`.includes(q)) ||
      (s.board && s.board.toLowerCase().includes(q)) ||
      s.batches.some((b) => b.title.toLowerCase().includes(q))
    );
  });

  // Handle starting a new chat with a student
  const handleStartChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;
    setIsStartingChat(true);
    try {
      const res = await startStudentChatAction({
        studentId: selectedStudent.id,
        subjectId: newChatSubjectId || subjects[0]?.id,
        batchId: selectedStudent.batches[0]?.id,
        title: newChatTitle.trim() || `Direct Chat with ${selectedStudent.name}`,
        initialMessage: newChatOpeningMessage.trim() || undefined,
      });

      if (!res.success || !res.data) {
        throw new Error(res.error || "Failed to start chat");
      }

      toast.success(`Chat opened with ${selectedStudent.name}`);
      setNewChatModalOpen(false);
      setSelectedStudent(null);
      setNewChatOpeningMessage("");

      // Select this chat and reload chat list so it appears in inbox
      setSelectedChatId(res.data.doubtId);
      reloadChats();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to start chat");
    } finally {
      setIsStartingChat(false);
    }
  };

  // Upload attachment
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/") && !file.type.includes("pdf")) {
      toast.error("Please upload an image (JPG, PNG, WEBP) or PDF document");
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      toast.error("File size cannot exceed 25MB");
      return;
    }

    setIsUploadingPhoto(true);
    const toastId = toast.loading("Uploading attachment...");
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await uploadChatAttachmentAction(formData);

      if (res.success && res.data) {
        setReplyAttachments((prev) => [
          ...prev,
          {
            key: res.data!.key,
            previewUrl: res.data!.url,
            name: res.data!.filename,
            isPdf: res.data!.isPdf,
          },
        ]);
        toast.success("Attachment ready to send", { id: toastId });
      } else {
        toast.error(res.error || "Failed to upload file", { id: toastId });
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Error uploading file", { id: toastId });
    } finally {
      setIsUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Send message
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedChatId || (!replyText.trim() && replyAttachments.length === 0)) return;

    const messageToSend = replyText.trim() || "See attached document/photo.";
    const attachmentsToSend = [...replyAttachments];

    setIsSendingReply(true);
    try {
      const res = await replyDoubtAction(selectedChatId, {
        body: messageToSend,
        attachmentKeys: attachmentsToSend.map((a) => a.key),
      });

      if (res.success && res.data) {
        toast.success("Message sent");
        setReplyText("");
        setReplyAttachments([]);

        // Extract message properly from { message, doubt } or top-level message object
        const rawMsg = (res.data as any)?.message || res.data;
        const newMsg: DoubtMessageItem = {
          id: rawMsg?.id || `msg-${Date.now()}`,
          doubtId: rawMsg?.doubtId || selectedChatId,
          authorId: rawMsg?.authorId || currentUser?.id || "usr-admin-dinesh",
          authorName: rawMsg?.authorName || currentUser?.name || "Dinesh Singh Rajput",
          authorRole: rawMsg?.authorRole || (currentUser?.role as any) || "admin",
          authorAvatarUrl: rawMsg?.authorAvatarUrl || null,
          body: rawMsg?.body || messageToSend,
          attachmentKeys: rawMsg?.attachmentKeys || attachmentsToSend.map((a) => a.key),
          attachmentUrls: rawMsg?.attachmentUrls || attachmentsToSend.map((a) => a.previewUrl),
          createdAt: rawMsg?.createdAt
            ? (typeof rawMsg.createdAt === "string" ? rawMsg.createdAt : new Date(rawMsg.createdAt).toISOString())
            : new Date().toISOString(),
        };

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
              ? {
                  ...c,
                  status: "answered",
                  lastActivityAt: new Date().toISOString(),
                  firstMessageSnippet: messageToSend.slice(0, 80),
                }
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
    <div className="flex flex-col h-[calc(100vh-6.5rem)] w-full space-y-3">
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

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => reloadChats()}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-slate-200/90 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors whitespace-nowrap"
          >
            <Loader2 className={`w-3.5 h-3.5 text-blue-600 ${isRefreshing ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>

          <Button
            type="button"
            onClick={() => {
              setSelectedStudent(null);
              setStudentSearch("");
              setNewChatTitle("");
              setNewChatOpeningMessage("");
              setNewChatModalOpen(true);
            }}
            size="sm"
            className="h-8 px-3.5 text-xs gap-1.5 font-semibold bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white rounded-lg shadow-2xs whitespace-nowrap shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Chat</span>
          </Button>
        </div>
      </div>

      {/* 2. Main Chat Console (Master / Detail Layout) */}
      <div className="flex flex-col md:flex-row gap-3 flex-1 min-h-0 overflow-hidden">
        {/* Left Column: Conversations List (compact sidebar) */}
        <div className="w-full md:w-80 lg:w-[320px] shrink-0 flex flex-col bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden h-full">
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
              <div className="p-8 text-center text-slate-400 space-y-2.5">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto shadow-2xs">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-900">No chats found</p>
                  <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                    {statusFilter === "unanswered"
                      ? "All student messages have been answered!"
                      : "Start a conversation directly with any registered or enrolled student."}
                  </p>
                </div>
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedStudent(null);
                      setStudentSearch("");
                      setNewChatTitle("");
                      setNewChatOpeningMessage("");
                      setNewChatModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-2xs transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Start Chat with Student</span>
                  </button>
                </div>
              </div>
            ) : (
              filteredChats.map((c, idx) => {
                const isSelected = c.id === selectedChatId;
                const dateObj = new Date(c.lastActivityAt);
                const timeString = dateObj.toLocaleDateString("en-IN", {
                  month: "short",
                  day: "numeric",
                });
                const initial = (c.studentName || "S").trim().charAt(0).toUpperCase() || "S";

                return (
                  <button
                    key={c.id || `chat-${idx}`}
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

        {/* Right Column: Active Conversation Thread */}
        <div className="flex-1 min-w-0 flex flex-col bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden h-full">
          {isLoadingThread ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            </div>
          ) : !activeThread ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-2xs">
                <MessageSquare className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-slate-900">Select a chat to start messaging</p>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Pick a conversation from the inbox on the left, or initiate a new chat directly with any registered or enrolled student.
                </p>
              </div>
              <Button
                type="button"
                onClick={() => {
                  setSelectedStudent(null);
                  setStudentSearch("");
                  setNewChatTitle("");
                  setNewChatOpeningMessage("");
                  setNewChatModalOpen(true);
                }}
                size="sm"
                className="h-8 px-3.5 text-xs gap-1.5 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-semibold rounded-lg shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Start Chat with Registered Student</span>
              </Button>
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

                {activeThread.messages.map((rawM, idx) => {
                  // Normalize in case m is wrapped as { message: ... } or raw DoubtMessageItem
                  const m: any = (rawM as any)?.message ? (rawM as any).message : rawM;
                  const authorRole = m?.authorRole || (rawM as any)?.authorRole || "student";
                  const isStaff = authorRole === "teacher" || authorRole === "admin";
                  const authorName = m?.authorName || (rawM as any)?.authorName || (isStaff ? "Teacher" : "Student");
                  const bodyText = m?.body ?? (rawM as any)?.body ?? "";
                  const attachments = m?.attachmentUrls || (rawM as any)?.attachmentUrls || [];
                  const createdAtVal = m?.createdAt || (rawM as any)?.createdAt;

                  let timeFormatted = "Just now";
                  if (createdAtVal) {
                    const dateObj = new Date(createdAtVal);
                    if (!isNaN(dateObj.getTime())) {
                      timeFormatted = dateObj.toLocaleTimeString("en-IN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      });
                    }
                  }

                  const itemKey = m?.id ? `${m.id}-${idx}` : (rawM as any)?.id ? `${(rawM as any).id}-${idx}` : `msg-${idx}`;

                  return (
                    <div
                      key={itemKey}
                      className={`flex flex-col ${isStaff ? "items-end" : "items-start"}`}
                    >
                      <div className="text-[10px] text-slate-400 mb-0.5 px-1 font-medium">
                        {isStaff ? `${authorName} (You)` : authorName}
                      </div>

                      <div
                        className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs shadow-2xs ${
                          isStaff
                            ? "bg-blue-600 text-white rounded-br-xs"
                            : "bg-white text-slate-800 border border-slate-200/80 rounded-bl-xs"
                        }`}
                      >
                        {bodyText && <p className="whitespace-pre-wrap leading-relaxed">{bodyText}</p>}

                        {/* Attachments */}
                        {attachments.length > 0 && (
                          <div className="mt-2 space-y-1.5">
                            {attachments.map((att: string, attIdx: number) => {
                              const isAttPdf = att.toLowerCase().includes(".pdf");
                              const fileName =
                                att.split("/").pop()?.split("?")[0]?.replace(/^\d+-[a-z0-9]+-/, "") ||
                                "Document.pdf";

                              if (isAttPdf) {
                                return (
                                  <a
                                    key={attIdx}
                                    href={att}
                                    target="_blank"
                                    rel="noreferrer"
                                    className={`flex items-center gap-2 px-2.5 py-2 rounded-xl border text-xs font-medium transition-colors ${
                                      isStaff
                                        ? "bg-blue-700/80 border-blue-400/50 text-white hover:bg-blue-700"
                                        : "bg-slate-50 border-slate-200/90 text-slate-800 hover:bg-slate-100"
                                    }`}
                                  >
                                    <FileText className={`w-4 h-4 shrink-0 ${isStaff ? "text-blue-200" : "text-rose-500"}`} />
                                    <span className="truncate max-w-[200px] font-semibold">{fileName}</span>
                                    <ExternalLink className={`w-3.5 h-3.5 ml-auto shrink-0 ${isStaff ? "text-blue-200" : "text-slate-400"}`} />
                                  </a>
                                );
                              }

                              return (
                                <a
                                  key={attIdx}
                                  href={att}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="block rounded-lg overflow-hidden border border-white/20 hover:opacity-90 transition-opacity"
                                >
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={att}
                                    alt="Attachment"
                                    className="max-h-48 rounded object-cover"
                                  />
                                </a>
                              );
                            })}
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
                  {initialCannedReplies.slice(0, 4).map((canned, idx) => (
                    <button
                      key={canned.id || `canned-${idx}`}
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
                  <div className="flex flex-wrap items-center gap-2 pt-1 pb-0.5">
                    {replyAttachments.map((att, idx) => (
                      <div
                        key={idx}
                        className="relative flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 shadow-2xs group"
                      >
                        {att.isPdf ? (
                          <div className="flex items-center gap-1.5 text-xs text-slate-700 font-medium">
                            <FileText className="w-4 h-4 text-rose-500 shrink-0" />
                            <span className="truncate max-w-[140px] text-[11px] font-semibold">{att.name || "Document.pdf"}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded border border-slate-200 overflow-hidden shrink-0 bg-white">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={att.previewUrl} alt="preview" className="w-full h-full object-cover" />
                            </div>
                            <span className="truncate max-w-[120px] text-[11px] text-slate-600 font-medium">{att.name || "Image"}</span>
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => setReplyAttachments((prev) => prev.filter((_, i) => i !== idx))}
                          className="ml-1 p-0.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                          title="Remove attachment"
                        >
                          <X className="w-3.5 h-3.5" />
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

      {/* 3. Start Chat with Student Modal */}
      {newChatModalOpen && (
        <div
          onClick={() => !isStartingChat && setNewChatModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-2xl bg-white border border-slate-200/90 shadow-2xl p-5 space-y-4 max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Start Chat with Student</h3>
                  <p className="text-xs text-slate-500">
                    Connect directly with registered students across all classes and batches.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => !isStartingChat && setNewChatModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto space-y-3.5 pr-1">
              {!selectedStudent ? (
                <>
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <Input
                      value={studentSearch}
                      onChange={(e) => setStudentSearch(e.target.value)}
                      placeholder="Search student by name, phone, class, board, batch... (instant)"
                      className="pl-8 pr-3 h-8 text-xs rounded-lg border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white text-slate-800"
                      autoFocus
                    />
                  </div>

                  <div className="text-[11px] text-slate-500 font-medium flex items-center justify-between px-0.5">
                    <span>
                      Showing <strong className="text-slate-800">{filteredStudents.length}</strong> of{" "}
                      {students.length} students
                    </span>
                    <span className="text-[10px] text-slate-400">Click a student to start chatting</span>
                  </div>

                  <div className="space-y-1.5 max-h-[50vh] overflow-y-auto">
                    {filteredStudents.length === 0 ? (
                      <div className="py-8 text-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 space-y-1.5">
                        <Users className="w-8 h-8 text-slate-400 mx-auto opacity-60" />
                        <p className="text-xs font-bold text-slate-800">No students found</p>
                        <p className="text-[11px] text-slate-500">
                          {studentSearch.trim()
                            ? "Try searching with a different name or number."
                            : "No registered students found."}
                        </p>
                      </div>
                    ) : (
                      filteredStudents.map((s) => (
                        <div
                          key={s.id}
                          onClick={() => {
                            setSelectedStudent(s);
                            setNewChatTitle(`Direct Chat with ${s.name}`);
                          }}
                          className="p-3 rounded-xl border border-slate-200/80 hover:border-blue-400 hover:bg-blue-50/40 cursor-pointer transition-all flex items-center justify-between gap-3 group"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                              {s.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-xs sm:text-sm text-slate-900 truncate group-hover:text-blue-700">
                                  {s.name}
                                </span>
                                <span className="text-[10px] font-semibold px-2 py-0.2 rounded-full bg-slate-100 text-slate-700 border border-slate-200 shrink-0">
                                  Class {s.classLevel || 12} · {(s.board || "cbse").toUpperCase()}
                                </span>
                              </div>
                              <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[11px] text-slate-500">
                                {s.phone && (
                                  <span className="font-mono text-slate-600 font-medium">📞 {s.phone}</span>
                                )}
                                {s.batches.length > 0 ? (
                                  s.batches.map((b) => (
                                    <span
                                      key={b.id}
                                      className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-purple-50 text-purple-700 border border-purple-200/60 truncate max-w-[180px]"
                                    >
                                      🎓 {b.title}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-[10px] text-slate-400 italic">No batch enrolled yet</span>
                                )}
                              </div>
                            </div>
                          </div>
                          <button
                            type="button"
                            className="h-7.5 px-3 rounded-lg text-xs font-semibold bg-white group-hover:bg-blue-600 group-hover:text-white text-slate-700 border border-slate-200 group-hover:border-blue-600 shadow-2xs transition-all whitespace-nowrap shrink-0 flex items-center gap-1"
                          >
                            <MessageSquare className="w-3 h-3" />
                            <span>Select</span>
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </>
              ) : (
                <form onSubmit={handleStartChatSubmit} className="space-y-3.5">
                  {/* Selected Student Banner */}
                  <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200/80 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                        {selectedStudent.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-xs text-blue-900 truncate">{selectedStudent.name}</div>
                        <div className="text-[11px] text-blue-700 truncate">
                          Class {selectedStudent.classLevel || 12} · {selectedStudent.phone || selectedStudent.email}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedStudent(null)}
                      className="text-xs text-blue-700 font-semibold hover:underline shrink-0"
                    >
                      Change
                    </button>
                  </div>

                  {/* Subject Selection */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-700">Course / Subject</label>
                    <select
                      value={newChatSubjectId}
                      onChange={(e) => setNewChatSubjectId(e.target.value)}
                      className="w-full h-8 text-xs px-2.5 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white text-slate-800 font-medium"
                      required
                    >
                      {subjects.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Topic / Title */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-700">Chat Topic / Title</label>
                    <Input
                      value={newChatTitle}
                      onChange={(e) => setNewChatTitle(e.target.value)}
                      placeholder="e.g. Chapter 4 Test Discussion"
                      className="h-8 text-xs rounded-lg border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white text-slate-800"
                      required
                    />
                  </div>

                  {/* Optional Opening Message */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-700">
                      Opening Message <span className="text-slate-400 font-normal">(Optional)</span>
                    </label>
                    <Textarea
                      rows={3}
                      value={newChatOpeningMessage}
                      onChange={(e) => setNewChatOpeningMessage(e.target.value)}
                      placeholder="Type your message to the student... (e.g. Hi, wanted to check on your preparation for tomorrow's mock test.)"
                      className="text-xs rounded-lg border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white text-slate-800"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setSelectedStudent(null)}
                      className="h-8 px-3 text-xs rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold"
                    >
                      Back
                    </button>
                    <Button
                      type="submit"
                      disabled={isStartingChat}
                      className="h-8 px-3.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-2xs gap-1.5"
                    >
                      {isStartingChat ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Starting Chat...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>Start &amp; Open Chat</span>
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
