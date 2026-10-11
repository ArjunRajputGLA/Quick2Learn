"use client";

import { useState, useRef, useEffect, useCallback, FormEvent } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  X,
  ArrowUp,
  RotateCcw,
  Copy,
  Check,
  ThumbsUp,
  ThumbsDown,
  ChevronLeft,
  ChevronRight,
  ArrowDown,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChatVideoCard, ChatBatchCard } from "@/server/data/chat-retrieval";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  relatedVideos?: ChatVideoCard[];
  relatedBatches?: ChatBatchCard[];
  suggestedQuestions?: string[];
  feedback?: "up" | "down" | null;
}

const GREETING_MESSAGE: Message = {
  id: "greeting",
  role: "assistant",
  content:
    "Namaste! 🙏 You're at **Quick2Learn**, Mathura's premier coaching academy for CBSE & ICSE Classes 9–12.\n\nI can help you find free video lectures by Dinesh Sir & Namita Ma'am, explore our classroom batches in Mathura, or solve academic doubts in Mathematics and Sciences. What are you hoping to learn or explore today?",
  suggestedQuestions: [
    "Help me explore",
    "I want to learn matrices",
    "Show Class 12 board revision lectures",
    "What classroom batches are available in Mathura?",
  ],
};

export function GeminiChatbot() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  const isChatRoute = pathname === "/chat" || searchParams?.get("chat") === "open";
  const [isOpen, setIsOpen] = useState(isChatRoute);
  const [messages, setMessages] = useState<Message[]>([GREETING_MESSAGE]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const sendMessageRef = useRef<(text: string) => void>(() => {});

  // Track whether user navigated from within Quick2Learn before reaching /chat
  const hasInAppNavRef = useRef(false);
  useEffect(() => {
    if (pathname && pathname !== "/chat") {
      hasInAppNavRef.current = true;
    }
  }, [pathname]);

  // Handle explicitly closing chatbot (via X button or Escape)
  const handleClose = useCallback(() => {
    setIsOpen(false);
    if (pathname === "/chat") {
      if (hasInAppNavRef.current && typeof window !== "undefined" && window.history.length > 1) {
        router.back();
      } else {
        router.push("/");
      }
    }
  }, [pathname, router]);

  // On clicking an internal card link (video lecture or batch), smoothly dismiss chat overlay without router.back
  const handleCardNavigate = useCallback(() => {
    setIsOpen(false);
  }, []);

  // Synchronize chat open state with URL/pathname
  // If navigating to ANY page other than /chat (homepage, batches, lectures, etc.), close chat immediately
  useEffect(() => {
    if (isChatRoute) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  }, [pathname, isChatRoute]);

  // Close on Escape key press
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        handleClose();
      }
    };
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [isOpen, handleClose]);

  // Hoverbot animation states
  const [showHoverbot, setShowHoverbot] = useState(false);
  const [isHoverbotFading, setIsHoverbotFading] = useState(false);
  const hoverbotVideoRef = useRef<HTMLVideoElement>(null);

  // Play Hoverbot video and trigger fade animation every time the chatbot is opened
  useEffect(() => {
    let fadeTimer: NodeJS.Timeout;
    let removeTimer: NodeJS.Timeout;

    if (isOpen) {
      setShowHoverbot(true);
      setIsHoverbotFading(false);

      if (hoverbotVideoRef.current) {
        hoverbotVideoRef.current.currentTime = 0;
        hoverbotVideoRef.current.play().catch(() => {});
      }

      // Play for 5 seconds, then smoothly fade out
      fadeTimer = setTimeout(() => {
        setIsHoverbotFading(true);
        removeTimer = setTimeout(() => {
          setShowHoverbot(false);
        }, 700);
      }, 5000);
    } else {
      setShowHoverbot(false);
      setIsHoverbotFading(false);
    }

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, [isOpen]);

  // Synchronize chat open state to Header and other global listeners cleanly after render
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("quick2learn-chat-toggled", {
          detail: { isOpen },
        }),
      );
    }
  }, [isOpen]);

  useEffect(() => {
    const handleOpenEvent = (event: Event) => {
      const customEvent = event as CustomEvent<{ prompt?: string; toggle?: boolean }>;
      if (customEvent.detail?.toggle) {
        if (isOpen || isChatRoute) {
          handleClose();
        } else {
          router.push("/chat");
          setIsOpen(true);
        }
      } else {
        if (!isChatRoute) {
          router.push("/chat");
        }
        setIsOpen(true);
      }

      const promptText = customEvent.detail?.prompt;
      if (promptText) {
        setTimeout(() => {
          sendMessageRef.current?.(promptText);
        }, 150);
      }
    };

    const handleCloseEvent = () => {
      handleClose();
    };

    window.addEventListener("open-quick2learn-chat", handleOpenEvent);
    window.addEventListener("close-quick2learn-chat", handleCloseEvent);
    return () => {
      window.removeEventListener("open-quick2learn-chat", handleOpenEvent);
      window.removeEventListener("close-quick2learn-chat", handleCloseEvent);
    };
  }, [isOpen, isChatRoute, handleClose, router]);

  // Lock body scroll when full-page modal is open below header
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      setTimeout(() => inputRef.current?.focus(), 150);
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Handle scroll listener to show scroll-to-bottom button
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    setShowScrollBottom(distanceFromBottom > 160);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Auto-scroll when messages update while near bottom
  useEffect(() => {
    if (!showScrollBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, showScrollBottom]);

  const copyToClipboard = (messageId: string, text: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 2000);
    }
  };

  const toggleFeedback = (messageId: string, type: "up" | "down") => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === messageId
          ? { ...m, feedback: m.feedback === type ? null : type }
          : m,
      ),
    );
  };

  const resetChat = () => {
    setMessages([GREETING_MESSAGE]);
    setInput("");
  };

  const sendMessage = useCallback(
    async (messageText: string) => {
      const trimmed = messageText.trim();
      if (!trimmed || isStreaming) return;

      const userMessage: Message = {
        id: `user-${Date.now()}`,
        role: "user",
        content: trimmed,
      };

      const updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);
      setInput("");
      setIsStreaming(true);

      const assistantId = `assistant-${Date.now()}`;
      const assistantMessage: Message = {
        id: assistantId,
        role: "assistant",
        content: "",
      };
      setMessages((prev) => [...prev, assistantMessage]);

      try {
        const apiMessages = updatedMessages
          .filter((m) => m.id !== "greeting")
          .map((m) => ({
            role: m.role,
            content: m.content,
          }));

        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: apiMessages }),
        });

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        const reader = res.body?.getReader();
        if (!reader) throw new Error("No response stream");

        const decoder = new TextDecoder();
        let accumulated = "";
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          // Keep whatever incomplete line segment remains at the end in the buffer
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const payload = line.slice(6).trim();
              if (payload === "[DONE]") break;

              try {
                const parsed = JSON.parse(payload);
                if (parsed.text) {
                  accumulated += parsed.text;
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantId
                        ? { ...m, content: accumulated }
                        : m,
                    ),
                  );
                }
                if (parsed.metadata) {
                  const meta = parsed.metadata;
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantId
                        ? {
                            ...m,
                            relatedVideos:
                              meta.relatedVideos !== undefined
                                ? meta.relatedVideos
                                : m.relatedVideos,
                            relatedBatches:
                              meta.relatedBatches !== undefined
                                ? meta.relatedBatches
                                : m.relatedBatches,
                            suggestedQuestions:
                              meta.suggestedQuestions !== undefined
                                ? meta.suggestedQuestions
                                : m.suggestedQuestions,
                          }
                        : m,
                    ),
                  );
                }
                if (parsed.error) {
                  accumulated = parsed.error;
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantId
                        ? { ...m, content: accumulated }
                        : m,
                    ),
                  );
                }
              } catch {
                // skip malformed JSON chunk
              }
            }
          }
        }

        if (!accumulated) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? {
                    ...m,
                    content:
                      "I'm here to help! Feel free to ask about our Class 9–12 Mathematics and Science batches, free lectures, or board preparation tips.",
                  }
                : m,
            ),
          );
        }
      } catch (error) {
        console.error("Chat error:", error);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? {
                  ...m,
                  content:
                    "Sorry, I had trouble processing that request. Please try asking again!",
                }
              : m,
          ),
        );
      } finally {
        setIsStreaming(false);
      }
    },
    [messages, isStreaming],
  );

  sendMessageRef.current = sendMessage;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <>
      {/* Full-Page Chat View: Starts right below the normal header (top-16 = 64px) */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Quick2Learn AI Academic Chatbot"
          className="fixed inset-x-0 bottom-0 top-16 z-40 bg-white text-slate-900 flex flex-col animate-in fade-in-0 duration-200 select-text"
        >
          {/* Top Controls: Right-aligned action buttons with Hoverbot video in the top left */}
          <div className="w-full px-4 sm:px-8 pt-3 pb-1 flex items-center justify-end shrink-0 relative">
            {/* Top Left: Chatbot Video (No text around it, smoothly fades out after playing) */}
            {showHoverbot && (
              <div
                className={cn(
                  "absolute top-8 sm:top-12 md:top-14 left-6 sm:left-10 md:left-14 z-30 w-32 h-32 sm:w-44 sm:h-44 md:w-52 md:h-52 transition-all duration-700 ease-out select-none pointer-events-none",
                  isHoverbotFading
                    ? "opacity-0 -translate-y-3 scale-90"
                    : "opacity-100 translate-y-0 scale-100 animate-in fade-in-0 duration-300",
                )}
              >
                <video
                  ref={hoverbotVideoRef}
                  src="/images/assets/Hoverbot.mp4"
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-contain mix-blend-multiply"
                />
              </div>
            )}

            {/* Top Right: New Chat and Close */}
            <div className="flex items-center gap-2">
              <button
                onClick={resetChat}
                aria-label="New conversation"
                title="Start new conversation"
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-slate-200"
              >
                <RotateCcw className="h-3.5 w-3.5 text-slate-500" />
                <span className="hidden sm:inline">New Chat</span>
              </button>
              <button
                onClick={handleClose}
                aria-label="Close Chat"
                title="Close Chat"
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-red-100"
              >
                <X className="h-4 w-4" />
                <span>Close</span>
              </button>
            </div>
          </div>

          {/* Central Scrollable Chat Stream */}
          <main
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8 scroll-smooth bg-white"
          >
            <div className="max-w-3xl w-full mx-auto space-y-8">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    "flex flex-col w-full",
                    msg.role === "user" ? "items-end" : "items-start",
                  )}
                >
                  {/* Message Bubble */}
                  {msg.role === "user" ? (
                    <div className="bg-slate-100 text-slate-900 rounded-2xl px-4 py-2.5 text-[15px] leading-relaxed max-w-[85%] sm:max-w-xl shadow-2xs font-normal border border-slate-200/60">
                      <span>{msg.content}</span>
                    </div>
                  ) : (
                    <div className="w-full space-y-4">
                      {/* Markdown Assistant Content */}
                      <div className="text-slate-800 text-[15px] leading-relaxed tracking-normal font-normal">
                        {msg.content ? (
                          <MarkdownRenderer content={msg.content} />
                        ) : isStreaming &&
                          msg.id === messages[messages.length - 1]?.id ? (
                          <div className="flex items-center gap-2 py-2">
                            <span className="h-2 w-2 rounded-full bg-primary animate-pulse [animation-delay:0ms]" />
                            <span className="h-2 w-2 rounded-full bg-primary animate-pulse [animation-delay:200ms]" />
                            <span className="h-2 w-2 rounded-full bg-primary animate-pulse [animation-delay:400ms]" />
                            <span className="text-xs text-slate-400 ml-1">Thinking...</span>
                          </div>
                        ) : null}
                      </div>

                      {/* Related Video Lectures Cards Carousel (Coursera Style) */}
                      {msg.relatedVideos && msg.relatedVideos.length > 0 && (
                        <div className="pt-2">
                          <ContentCardsCarousel
                            videos={msg.relatedVideos}
                            onCardClick={handleCardNavigate}
                          />
                        </div>
                      )}

                      {/* Related Batches Cards (if returned) */}
                      {msg.relatedBatches && msg.relatedBatches.length > 0 && (
                        <div className="pt-2 space-y-2">
                          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            Available Classroom Batches:
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {msg.relatedBatches.map((batch) => (
                              <Link
                                key={batch.id}
                                href={batch.href}
                                onClick={handleCardNavigate}
                                className="group p-4 rounded-xl border border-slate-200 bg-white hover:border-primary/50 hover:shadow-sm transition-all flex flex-col justify-between"
                              >
                                <div className="space-y-1.5">
                                  <div className="flex items-center justify-between text-[11px]">
                                    <span className="font-bold text-primary">
                                      {batch.grade} · {batch.board}
                                    </span>
                                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold text-[10px]">
                                      {batch.mode}
                                    </span>
                                  </div>
                                  <h4 className="text-sm font-bold text-slate-900 group-hover:text-primary transition-colors line-clamp-1">
                                    {batch.title}
                                  </h4>
                                  <p className="text-xs text-slate-500">
                                    Mentor: {batch.facultyName}
                                  </p>
                                </div>
                                <div className="pt-2.5 mt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                                  <span className="text-slate-500">{batch.schedule}</span>
                                  <span className="text-primary font-semibold inline-flex items-center gap-0.5">
                                    View Batch <ChevronRight className="h-3 w-3" />
                                  </span>
                                </div>
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Suggested Follow-up Questions (Coursera Style) */}
                      {msg.suggestedQuestions &&
                        msg.suggestedQuestions.length > 0 && (
                          <div className="pt-3 space-y-2.5">
                            <p className="text-[13px] font-medium text-slate-600">
                              And if you want to continue exploring this topic, try one of these follow-up questions:
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {msg.suggestedQuestions.map((q, idx) => (
                                <button
                                  key={idx}
                                  onClick={() => sendMessage(q)}
                                  disabled={isStreaming}
                                  className="text-[13px] px-4 py-2 rounded-full border border-slate-200/90 bg-white hover:bg-primary/5 hover:border-primary/40 hover:text-primary text-slate-800 transition-all cursor-pointer text-left shadow-2xs font-normal active:scale-98"
                                >
                                  {q}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                      {/* Assistant Action Bar: Copy, Thumbs Up, Thumbs Down */}
                      {msg.content && (
                        <div className="flex items-center gap-1.5 pt-1 text-slate-400">
                          <button
                            onClick={() => copyToClipboard(msg.id, msg.content)}
                            aria-label="Copy response"
                            title={
                              copiedMessageId === msg.id
                                ? "Copied!"
                                : "Copy response"
                            }
                            className="p-1.5 rounded-md hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                          >
                            {copiedMessageId === msg.id ? (
                              <Check className="h-4 w-4 text-emerald-600" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </button>
                          <button
                            onClick={() => toggleFeedback(msg.id, "up")}
                            aria-label="Thumbs up"
                            title="Helpful response"
                            className={cn(
                              "p-1.5 rounded-md hover:bg-slate-100 transition-colors cursor-pointer",
                              msg.feedback === "up"
                                ? "text-primary fill-primary/20"
                                : "hover:text-slate-700",
                            )}
                          >
                            <ThumbsUp className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => toggleFeedback(msg.id, "down")}
                            aria-label="Thumbs down"
                            title="Not helpful"
                            className={cn(
                              "p-1.5 rounded-md hover:bg-slate-100 transition-colors cursor-pointer",
                              msg.feedback === "down"
                                ? "text-red-500 fill-red-500/20"
                                : "hover:text-slate-700",
                            )}
                          >
                            <ThumbsDown className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </main>

          {/* Floating Scroll to Bottom Indicator Button */}
          {showScrollBottom && (
            <button
              onClick={scrollToBottom}
              aria-label="Scroll to bottom"
              className="fixed bottom-28 left-1/2 -translate-x-1/2 z-30 h-9 w-9 rounded-full bg-white border border-slate-200 shadow-md flex items-center justify-center text-slate-700 hover:bg-slate-50 transition-all cursor-pointer animate-in fade-in-0 duration-150 hover:text-primary"
            >
              <ArrowDown className="h-4 w-4" />
            </button>
          )}

          {/* Enhanced Pinned Bottom Input Bar (Cohesive Single Pill, No Inner Borders) */}
          <footer className="w-full shrink-0 border-t border-slate-200/90 bg-white/95 backdrop-blur-md pt-3 pb-3.5 px-4 sm:px-6">
            <div className="max-w-3xl w-full mx-auto space-y-1.5">
              <form
                onSubmit={handleSubmit}
                className={cn(
                  "relative flex items-end gap-3 rounded-2xl border bg-white px-4 py-2.5 sm:py-3 transition-all duration-200 ease-out",
                  isInputFocused
                    ? "border-primary ring-4 ring-primary/10 shadow-[0_8px_30px_rgb(0,0,0,0.06),0_2px_8px_rgba(37,99,235,0.08)]"
                    : "border-slate-300 shadow-2xs hover:border-slate-400",
                )}
              >
                {/* Seamless Textarea without Any Browser Outline/Border */}
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onFocus={() => setIsInputFocused(true)}
                  onBlur={() => setIsInputFocused(false)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask anything about Class 9–12 Maths, Science, batches, formulas..."
                  rows={1}
                  disabled={isStreaming}
                  className="w-full flex-1 resize-none bg-transparent text-[15px] text-slate-900 placeholder:text-slate-400 leading-relaxed max-h-36 py-1 disabled:opacity-50 border-0 outline-none ring-0 shadow-none focus:outline-none focus:ring-0 focus:border-none focus-visible:outline-none focus-visible:ring-0 focus-visible:border-none caret-primary"
                  style={{
                    outline: "none",
                    border: "none",
                    boxShadow: "none",
                    WebkitAppearance: "none",
                  }}
                />

                {/* Quick Clear Button when input is present */}
                {input.trim() && !isStreaming && (
                  <button
                    type="button"
                    onClick={() => {
                      setInput("");
                      inputRef.current?.focus();
                    }}
                    aria-label="Clear input"
                    className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors shrink-0 mb-1 cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}

                {/* Send Button: Upward Arrow (Coursera / Claude Style) */}
                <button
                  type="submit"
                  disabled={!input.trim() || isStreaming}
                  aria-label="Send query"
                  title={input.trim() ? "Send (Enter)" : "Type your question"}
                  className={cn(
                    "h-9 w-9 rounded-full flex items-center justify-center transition-all shrink-0 cursor-pointer mb-0.5",
                    input.trim() && !isStreaming
                      ? "bg-primary text-white hover:bg-primary-hover shadow-xs hover:scale-105 active:scale-95"
                      : "bg-slate-100 text-slate-400 cursor-not-allowed",
                  )}
                >
                  {isStreaming ? (
                    <Loader2 className="h-4 w-4 animate-spin text-white" />
                  ) : (
                    <ArrowUp className="h-4 w-4 stroke-[2.5]" />
                  )}
                </button>
              </form>

              {/* Disclaimer Notice & Keyboard Helper */}
              <div className="flex items-center justify-between text-[11px] text-slate-500 px-1 pt-0.5 leading-normal">
                <p>
                  Ask Quick2Learn is powered by AI. Check important academic details with faculty mentors.
                </p>
                <span className="hidden sm:inline text-slate-400 text-[10px]">
                  Shift + Enter for new line · Enter to send
                </span>
              </div>
            </div>
          </footer>
        </div>
      )}
    </>
  );
}

/**
 * Horizontal Carousel Component for Recommended Video Courses
 * Matches Coursera's cards with image thumbnail, institution/faculty row, bold title, and rating/duration meta.
 */
function ContentCardsCarousel({
  videos,
  onCardClick,
}: {
  videos: ChatVideoCard[];
  onCardClick?: () => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(videos.length > 2);

  const checkScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10);
  };

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const offset = direction === "left" ? -320 : 320;
    scrollRef.current.scrollBy({ left: offset, behavior: "smooth" });
  };

  return (
    <div className="relative group/carousel">
      {/* Left Navigation Arrow */}
      {canScrollLeft && (
        <button
          onClick={() => scroll("left")}
          aria-label="Scroll left"
          className="absolute -left-3 top-1/2 -translate-y-1/2 z-20 h-8 w-8 rounded-full bg-white border border-slate-200 shadow-md flex items-center justify-center text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      )}

      {/* Right Navigation Arrow */}
      {canScrollRight && (
        <button
          onClick={() => scroll("right")}
          aria-label="Scroll right"
          className="absolute -right-3 top-1/2 -translate-y-1/2 z-20 h-8 w-8 rounded-full bg-white border border-slate-200 shadow-md flex items-center justify-center text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      )}

      {/* Cards Container */}
      <div
        ref={scrollRef}
        onScroll={checkScroll}
        className="flex gap-4 overflow-x-auto pb-2 scroll-smooth no-scrollbar"
        style={{ scrollSnapType: "x mandatory" }}
      >
        {videos.map((v) => (
          <Link
            key={v.id}
            href={v.href}
            onClick={onCardClick}
            className="w-[280px] sm:w-[310px] shrink-0 border border-slate-200 rounded-2xl bg-white overflow-hidden shadow-xs hover:shadow-md hover:border-slate-300 transition-all flex flex-col group cursor-pointer"
            style={{ scrollSnapAlign: "start" }}
          >
            {/* Thumbnail Header */}
            <div className="aspect-[16/9] w-full bg-slate-100 relative overflow-hidden">
              <Image
                src={v.thumbnailUrl}
                alt={v.title}
                fill
                sizes="(max-width: 768px) 280px, 310px"
                className="object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded text-[11px] font-semibold bg-black/80 text-white backdrop-blur-xs">
                {v.duration}
              </span>
            </div>

            {/* Card Body */}
            <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
              <div className="space-y-1.5">
                {/* Faculty / Institute Badge */}
                <div className="flex items-center gap-1.5 text-xs text-slate-600">
                  <div className="h-4 w-4 rounded-sm bg-primary text-white font-black text-[9px] flex items-center justify-center shrink-0">
                    Q
                  </div>
                  <span className="truncate font-medium">{v.faculty}</span>
                </div>

                {/* Course / Lecture Title */}
                <h3 className="font-semibold text-slate-900 text-sm leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                  {v.title}
                </h3>
              </div>

              {/* Rating & Meta Row (Coursera Style: ★ 4.8 · Class XII · Mathematics · 18K views) */}
              <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5 text-[11px] text-slate-500">
                <span className="inline-flex items-center text-amber-500 font-bold">
                  ★ {v.rating}
                </span>
                <span>·</span>
                <span className="truncate">{v.gradeAndSubject}</span>
                <span>·</span>
                <span>{v.views}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

/**
 * Clean markdown renderer for assistant responses.
 * Formats headings (### and ##), bold text, bulleted lists, numbered items, and links without empty artifacts.
 */
function MarkdownRenderer({ content }: { content: string }) {
  if (!content) return null;

  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let currentList: string[] = [];

  const flushList = (keyPrefix: string) => {
    if (currentList.length > 0) {
      elements.push(
        <ul key={`${keyPrefix}-list`} className="space-y-2 my-2.5 pl-0.5">
          {currentList.map((item, i) => (
            <li key={i} className="flex items-start gap-2.5 text-[15px] text-slate-800 leading-relaxed">
              <span className="h-1.5 w-1.5 rounded-full bg-primary mt-2 shrink-0" />
              <span
                dangerouslySetInnerHTML={{
                  __html: formatInlineMarkdown(item),
                }}
              />
            </li>
          ))}
        </ul>,
      );
      currentList = [];
    }
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    // Ignore lines that are just bullet marks, dashes, asterisks, or whitespace
    if (!trimmed || /^[\-\*•\s]+$/.test(trimmed)) {
      return;
    }

    // Bullet lines: filter empty bullets
    if (trimmed.startsWith("- ") || trimmed.startsWith("* ") || trimmed.startsWith("• ")) {
      const itemText = trimmed.replace(/^[\-\*•]\s*/, "").trim();
      if (itemText && !/^[\-\*•\s]+$/.test(itemText)) {
        currentList.push(itemText);
      }
    } else if (trimmed.startsWith("### ")) {
      flushList(`flush-${index}`);
      const h3Text = trimmed.replace(/^###\s*/, "").trim();
      if (h3Text) {
        elements.push(
          <h3
            key={`h3-${index}`}
            className="text-[15px] font-bold text-slate-900 mt-4 mb-1.5 flex items-center gap-1.5"
            dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(h3Text) }}
          />,
        );
      }
    } else if (trimmed.startsWith("## ")) {
      flushList(`flush-${index}`);
      const h2Text = trimmed.replace(/^##\s*/, "").trim();
      if (h2Text) {
        elements.push(
          <h2
            key={`h2-${index}`}
            className="text-base font-extrabold text-slate-900 mt-5 mb-2"
            dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(h2Text) }}
          />,
        );
      }
    } else if (trimmed.startsWith("# ")) {
      flushList(`flush-${index}`);
      const h1Text = trimmed.replace(/^#\s*/, "").trim();
      if (h1Text) {
        elements.push(
          <h2
            key={`h1-${index}`}
            className="text-lg font-extrabold text-slate-900 mt-5 mb-2"
            dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(h1Text) }}
          />,
        );
      }
    } else {
      flushList(`flush-${index}`);
      elements.push(
        <p
          key={`p-${index}`}
          className="mb-2.5 last:mb-0 text-[15px] leading-relaxed text-slate-800"
          dangerouslySetInnerHTML={{
            __html: formatInlineMarkdown(trimmed),
          }}
        />,
      );
    }
  });

  flushList("final");

  return <div className="space-y-1">{elements}</div>;
}

function formatInlineMarkdown(text: string): string {
  return text
    // Bold: **text**
    .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-slate-900">$1</strong>')
    // Italic: *text*
    .replace(/(?<!\*)\*(?!\*)(.*?)(?<!\*)\*(?!\*)/g, '<em class="italic">$1</em>')
    // Inline code: `code`
    .replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 rounded bg-slate-100 font-mono text-[13px] text-primary">$1</code>')
    // Links: [text](url)
    .replace(
      /\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-primary underline hover:text-primary-hover font-medium">$1</a>',
    );
}
