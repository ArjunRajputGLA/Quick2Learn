"use client";

import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import {
  studentReplyChatAction,
  getStudentChatThreadAction,
  uploadChatAttachmentAction,
} from "@/server/admin-actions";
import type { DoubtThreadResponse, DoubtMessageItem } from "@quick2learn/shared";
import {
  Send,
  Loader2,
  Paperclip,
  X,
  FileText,
  ExternalLink,
  ShieldCheck,
  CheckCheck,
  Sparkles,
} from "lucide-react";

interface StudentChatClientProps {
  initialThread: DoubtThreadResponse | null;
  doubtId: string;
  currentStudent: {
    id: string;
    name: string;
    email: string;
  };
}

export function StudentChatClient({
  initialThread,
  doubtId,
  currentStudent,
}: StudentChatClientProps) {
  const [thread, setThread] = useState<DoubtThreadResponse | null>(initialThread);
  const [messageText, setMessageText] = useState("");
  const [attachments, setAttachments] = useState<
    Array<{ key: string; previewUrl: string; name: string; isPdf: boolean }>
  >([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of conversation
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [thread?.messages]);

  // Live polling every 4 seconds to sync messages in real-time with Web CRM & Mobile App
  useEffect(() => {
    if (!doubtId) return;

    const pollTimer = setInterval(() => {
      getStudentChatThreadAction(doubtId)
        .then((res) => {
          if (res.success && res.data) {
            setThread((prev) => {
              if (!prev) return res.data;
              if (
                res.data.messages.length !== prev.messages.length ||
                res.data.doubt.status !== prev.doubt.status
              ) {
                return res.data;
              }
              return prev;
            });
          }
        })
        .catch(() => {});
    }, 4000);

    return () => clearInterval(pollTimer);
  }, [doubtId]);

  // Handle file attachment upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/") && !file.type.includes("pdf")) {
      toast.error("Please upload an image (JPG, PNG, WEBP) or PDF document");
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      toast.error("File size cannot exceed 25 MB");
      return;
    }

    setIsUploading(true);
    const toastId = toast.loading("Uploading attachment...");
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await uploadChatAttachmentAction(formData);

      if (res.success && res.data) {
        setAttachments((prev) => [
          ...prev,
          {
            key: res.data!.key,
            previewUrl: res.data!.url,
            name: res.data!.filename,
            isPdf: res.data!.isPdf,
          },
        ]);
        toast.success("Attachment ready", { id: toastId });
      } else {
        toast.error(res.error || "Failed to upload file", { id: toastId });
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Error uploading file", { id: toastId });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Send message
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!doubtId || (!messageText.trim() && attachments.length === 0)) return;

    const bodyToSend = messageText.trim() || "See attached document/photo.";
    const attachmentKeys = attachments.map((a) => a.key);
    const currentAttachments = [...attachments];

    setIsSending(true);
    try {
      const res = await studentReplyChatAction(doubtId, bodyToSend, attachmentKeys);

      if (res.success && res.data) {
        toast.success("Message sent to faculty");
        setMessageText("");
        setAttachments([]);

        const rawMsg = (res.data as any)?.message || res.data;
        const newMsg: DoubtMessageItem = {
          id: rawMsg?.id || `msg-${Date.now()}`,
          doubtId,
          authorId: currentStudent.id,
          authorName: currentStudent.name,
          authorRole: "student",
          authorAvatarUrl: null,
          body: bodyToSend,
          attachmentKeys,
          attachmentUrls: rawMsg?.attachmentUrls || currentAttachments.map((a) => a.previewUrl),
          createdAt: new Date().toISOString(),
        };

        setThread((prev) =>
          prev
            ? {
                ...prev,
                messages: [...prev.messages, newMsg],
                doubt: { ...prev.doubt, status: "open" },
              }
            : null
        );
      } else {
        toast.error(res.error || "Failed to send message");
      }
    } catch {
      toast.error("Error sending message");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] min-h-[500px] max-h-[820px] bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-3.5 sm:p-4 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-sm shadow-xs">
              DS
            </div>
            <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h2 className="font-bold text-sm sm:text-base text-slate-900 truncate">
                Mr. Dinesh Singh Rajput
              </h2>
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700">
                <ShieldCheck className="w-3 h-3" /> Faculty
              </span>
            </div>
            <p className="text-xs text-slate-500 truncate">
              Founder &amp; Head of Mathematics · 1-on-1 Mentorship &amp; Doubt Clearing
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1.5 bg-emerald-50 border border-emerald-200/60 px-2.5 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live Sync Active
          </span>
        </div>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/30">
        {/* Welcome Banner */}
        <div className="max-w-md mx-auto text-center p-3 rounded-xl bg-blue-50/60 border border-blue-100 text-xs text-blue-900 space-y-1">
          <div className="font-bold flex items-center justify-center gap-1 text-blue-800">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" /> Direct Faculty Channel
          </div>
          <p className="text-[11px] text-blue-700">
            Send your mathematics &amp; science doubts, homework queries, or upload photos of working steps. Messages sync directly with faculty mobile &amp; management portal.
          </p>
        </div>

        {(!thread || thread.messages.length === 0) ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            No messages yet. Ask a question or share a doubt below!
          </div>
        ) : (
          thread.messages.map((rawM, idx) => {
            const m: any = (rawM as any)?.message ? (rawM as any).message : rawM;
            const authorRole = m?.authorRole || (rawM as any)?.authorRole || "student";
            const isStudent = authorRole === "student" || m?.authorId === currentStudent.id;
            const authorName = isStudent ? "You" : (m?.authorName || "Dinesh Sir (Faculty)");
            const bodyText = m?.body ?? (rawM as any)?.body ?? "";
            const attachmentsList = m?.attachmentUrls || (rawM as any)?.attachmentUrls || [];
            const createdAtVal = m?.createdAt || (rawM as any)?.createdAt;

            let timeFormatted = "Just now";
            if (createdAtVal) {
              const d = new Date(createdAtVal);
              if (!isNaN(d.getTime())) {
                timeFormatted = d.toLocaleTimeString("en-IN", {
                  hour: "2-digit",
                  minute: "2-digit",
                });
              }
            }

            return (
              <div
                key={m?.id ? `${m.id}-${idx}` : `msg-${idx}`}
                className={`flex flex-col ${isStudent ? "items-end" : "items-start"}`}
              >
                <div className="text-[10px] text-slate-400 mb-0.5 px-1 font-medium">
                  {authorName}
                </div>

                <div
                  className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-3.5 py-2.5 text-xs shadow-2xs ${
                    isStudent
                      ? "bg-blue-600 text-white rounded-br-xs"
                      : "bg-white text-slate-800 border border-slate-200/90 rounded-bl-xs"
                  }`}
                >
                  {bodyText && <p className="whitespace-pre-wrap leading-relaxed">{bodyText}</p>}

                  {/* Attachments */}
                  {attachmentsList.length > 0 && (
                    <div className="mt-2 space-y-1.5">
                      {attachmentsList.map((att: string, attIdx: number) => {
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
                                isStudent
                                  ? "bg-blue-700/80 border-blue-400/50 text-white hover:bg-blue-700"
                                  : "bg-slate-50 border-slate-200/90 text-slate-800 hover:bg-slate-100"
                              }`}
                            >
                              <FileText className={`w-4 h-4 shrink-0 ${isStudent ? "text-blue-200" : "text-rose-500"}`} />
                              <span className="truncate max-w-[200px] font-semibold">{fileName}</span>
                              <ExternalLink className={`w-3.5 h-3.5 ml-auto shrink-0 ${isStudent ? "text-blue-200" : "text-slate-400"}`} />
                            </a>
                          );
                        }

                        return (
                          <a
                            key={attIdx}
                            href={att}
                            target="_blank"
                            rel="noreferrer"
                            className="block rounded-lg overflow-hidden border border-white/20 hover:opacity-95 transition-opacity"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={att}
                              alt="Attachment"
                              className="max-h-56 rounded object-cover"
                            />
                          </a>
                        );
                      })}
                    </div>
                  )}

                  <div
                    className={`text-[9px] mt-1 flex items-center justify-end gap-1 ${
                      isStudent ? "text-blue-100" : "text-slate-400"
                    }`}
                  >
                    <span>{timeFormatted}</span>
                    {isStudent && <CheckCheck className="w-3 h-3 text-blue-200" />}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Upload Previews */}
      {attachments.length > 0 && (
        <div className="px-3 py-1.5 border-t border-slate-100 bg-white flex flex-wrap items-center gap-2">
          {attachments.map((att, idx) => (
            <div
              key={idx}
              className="relative flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 shadow-2xs group"
            >
              {att.isPdf ? (
                <div className="flex items-center gap-1.5 text-xs text-slate-700 font-medium">
                  <FileText className="w-4 h-4 text-rose-500 shrink-0" />
                  <span className="truncate max-w-[140px] text-[11px] font-semibold">{att.name}</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded border border-slate-200 overflow-hidden shrink-0 bg-white">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={att.previewUrl} alt="preview" className="w-full h-full object-cover" />
                  </div>
                  <span className="truncate max-w-[120px] text-[11px] text-slate-600 font-medium">{att.name}</span>
                </div>
              )}
              <button
                type="button"
                onClick={() => setAttachments((prev) => prev.filter((_, i) => i !== idx))}
                className="ml-1 p-0.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                title="Remove"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Message Composer */}
      <form onSubmit={handleSendMessage} className="p-2.5 sm:p-3 border-t border-slate-200/90 bg-white flex items-center gap-2">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          accept="image/*,application/pdf"
          className="hidden"
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="p-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 transition-colors shrink-0"
          title="Attach photo of question / working steps or PDF"
        >
          {isUploading ? (
            <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
          ) : (
            <Paperclip className="w-4 h-4" />
          )}
        </button>

        <input
          type="text"
          placeholder="Ask a question or reply to Dinesh Sir..."
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          className="flex-1 h-9 text-xs sm:text-sm px-3.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
        />

        <button
          type="submit"
          disabled={isSending || (!messageText.trim() && attachments.length === 0)}
          className="flex items-center gap-1.5 h-9 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs sm:text-sm font-semibold shadow-2xs transition-all shrink-0"
        >
          {isSending ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Send className="w-3.5 h-3.5" />
          )}
          <span>Send</span>
        </button>
      </form>
    </div>
  );
}

