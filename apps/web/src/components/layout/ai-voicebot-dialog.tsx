"use client";

import * as React from "react";
import { useState, useRef, useEffect } from "react";
import {
  Mic,
  MicOff,
  Send,
  Bot,
  User,
  Volume2,
  VolumeX,
  Loader2,
  Calendar,
} from "lucide-react";
import { Dialog } from "@/components/ui/dialog";

interface AiVoicebotDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenEnquiry?: () => void;
}

interface ChatMessage {
  id: string;
  sender: "bot" | "user";
  text: string;
  timestamp: string;
}

const KNOWLEDGE_RESPONSES: Record<string, string> = {
  quadratic:
    "For a quadratic equation ax² + bx + c = 0, the roots are given by the Quadratic Formula: x = (-b ± √(b² - 4ac)) / (2a). The discriminant D = b² - 4ac tells you the nature of roots: D > 0 (two distinct real roots), D = 0 (two equal real roots), and D < 0 (no real roots / complex roots).",
  newton:
    "Newton's 3 Laws of Motion:\n1. Law of Inertia: An object remains at rest or in uniform motion unless acted upon by an external net force.\n2. Law of Force & Acceleration: F = ma (Force equals mass times acceleration).\n3. Action & Reaction: For every action, there is an equal and opposite reaction.",
  ohm:
    "Ohm's Law states that at constant temperature, current (I) flowing through a conductor is directly proportional to the potential difference (V) across its ends: V = I × R. In series, total resistance R_total = R1 + R2 + R3. In parallel, 1/R_total = 1/R1 + 1/R2 + 1/R3.",
  batch:
    "Quick2Learn offers targeted batches for Classes IX to XII (CBSE & ICSE). Top batches include: 1) Class 10 Target Board 2027, 2) Class 12 Boards & Foundation, and 3) Class 9 & 11 Science & Maths Mentorship. Offline batches run at our Mathura centre and live online options are available!",
  formula:
    "Key Class 12 Calculus Formulas:\n• d/dx(xⁿ) = n·xⁿ⁻¹\n• d/dx(sin x) = cos x, d/dx(cos x) = -sin x\n• ∫ xⁿ dx = (xⁿ⁺¹)/(n+1) + C\n• Integration by Parts: ∫ u v dx = u ∫ v dx - ∫ (u' ∫ v dx) dx.",
};

export function AiVoicebotDialog({
  open,
  onOpenChange,
  onOpenEnquiry,
}: AiVoicebotDialogProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      sender: "bot",
      text: "Namaste! I'm your Quick2Learn AI Chatbot. Ask me any doubt from Class 9–12 Maths, Physics, Chemistry, or ask about our classroom batches!",
      timestamp: "Just now",
    },
  ]);
  const [inputQuery, setInputQuery] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const recognitionRef = useRef<unknown>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking]);

  // Web Speech Recognition setup
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown })
          .SpeechRecognition ||
        (window as unknown as { webkitSpeechRecognition?: unknown })
          .webkitSpeechRecognition;

      if (SpeechRecognition) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const rec = new (SpeechRecognition as any)();
          rec.continuous = false;
          rec.interimResults = false;
          rec.lang = "en-IN";

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          rec.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            if (transcript) {
              setInputQuery(transcript);
              handleSendMessage(transcript);
            }
            setIsListening(false);
          };

          rec.onerror = () => {
            setIsListening(false);
          };

          rec.onend = () => {
            setIsListening(false);
          };

          recognitionRef.current = rec;
        } catch {
          // Graceful fallback if speech recognition fails
        }
      }
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition is not supported in this browser. You can type your question directly!");
      return;
    }

    if (isListening) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (recognitionRef.current as any).stop();
      setIsListening(false);
    } else {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (recognitionRef.current as any).start();
        setIsListening(true);
      } catch {
        setIsListening(false);
      }
    }
  };

  const speakText = (text: string) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      if (isSpeaking) {
        setIsSpeaking(false);
        return;
      }
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      setIsSpeaking(true);
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleSendMessage = (textToSend?: string) => {
    const query = (textToSend || inputQuery).trim();
    if (!query) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: query,
      timestamp: "Just now",
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery("");
    setIsThinking(true);

    // AI answer synthesis
    setTimeout(() => {
      const lower = query.toLowerCase();
      let replyText = "";

      if (lower.includes("quadratic") || lower.includes("root") || lower.includes("discriminant")) {
        replyText = KNOWLEDGE_RESPONSES.quadratic ?? "";
      } else if (lower.includes("newton") || lower.includes("motion") || lower.includes("force")) {
        replyText = KNOWLEDGE_RESPONSES.newton ?? "";
      } else if (lower.includes("ohm") || lower.includes("resistance") || lower.includes("current") || lower.includes("voltage")) {
        replyText = KNOWLEDGE_RESPONSES.ohm ?? "";
      } else if (lower.includes("batch") || lower.includes("class") || lower.includes("admission") || lower.includes("fees") || lower.includes("enroll")) {
        replyText = KNOWLEDGE_RESPONSES.batch ?? "";
      } else if (lower.includes("formula") || lower.includes("calculus") || lower.includes("derivative") || lower.includes("integration")) {
        replyText = KNOWLEDGE_RESPONSES.formula ?? "";
      } else {
        replyText = `Great question regarding "${query}"! In Quick2Learn curriculum, our faculty Dinesh Sir and Namita Ma'am emphasize strong conceptual clarity and step-by-step problem solving. Would you like to schedule a free 1-on-1 demo class or speak with our academic counsellor?`;
      }

      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: "bot",
        text: replyText,
        timestamp: "Just now",
      };

      setMessages((prev) => [...prev, botMsg]);
      setIsThinking(false);
      speakText(replyText);
    }, 600);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <div className="flex flex-col h-[520px] max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-violet-600 via-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-body text-ink">
                  Quick2Learn AI Chatbot
                </span>
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-violet-100 text-violet-800">
                  Online
                </span>
              </div>
              <p className="text-[11px] text-ink-muted">
                Class 9&ndash;12 CBSE &bull; ICSE Academic Assistant
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 mr-6">
            <button
              type="button"
              onClick={() => {
                if (typeof window !== "undefined" && "speechSynthesis" in window) {
                  window.speechSynthesis.cancel();
                  setIsSpeaking(false);
                }
              }}
              title={isSpeaking ? "Mute speech" : "Audio output"}
              className="p-1.5 rounded-md text-ink-muted hover:text-ink hover:bg-surface-subtle transition-colors cursor-pointer"
            >
              {isSpeaking ? (
                <VolumeX className="h-4 w-4 text-violet-600" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {/* Message Log */}
        <div className="flex-1 overflow-y-auto py-3 space-y-3 pr-1">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-2.5 ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.sender === "bot" && (
                <div className="h-7 w-7 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="h-4 w-4" />
                </div>
              )}
              <div
                className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-small leading-relaxed ${
                  msg.sender === "user"
                    ? "bg-primary text-white rounded-br-xs"
                    : "bg-surface-subtle border border-border text-ink rounded-bl-xs whitespace-pre-line"
                }`}
              >
                {msg.text}
              </div>
              {msg.sender === "user" && (
                <div className="h-7 w-7 rounded-full bg-primary-soft text-primary flex items-center justify-center shrink-0 mt-0.5">
                  <User className="h-4 w-4" />
                </div>
              )}
            </div>
          ))}

          {isThinking && (
            <div className="flex gap-2.5 items-center text-ink-muted text-xs">
              <div className="h-7 w-7 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
              <span>AI Tutor is thinking...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Sample Question Chips */}
        <div className="py-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar border-t border-border">
          <span className="text-[10px] uppercase font-bold text-ink-muted shrink-0">
            Try:
          </span>
          {[
            "Quadratic equation formula",
            "Newton's 3 laws",
            "Ohm's Law explained",
            "Best batch for Class 10?",
          ].map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => handleSendMessage(prompt)}
              className="text-[11px] whitespace-nowrap px-2.5 py-1 rounded-full bg-surface-subtle text-ink hover:text-primary hover:bg-primary-soft/60 border border-border/80 transition-colors cursor-pointer"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Voice & Text Input Bar */}
        <div className="pt-2 border-t border-border">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            {/* Mic / Voice Record Button */}
            <button
              type="button"
              onClick={toggleListening}
              className={`h-10 w-10 rounded-full flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                isListening
                  ? "bg-red-500 text-white animate-pulse ring-4 ring-red-200"
                  : "bg-violet-100 text-violet-700 hover:bg-violet-200"
              }`}
              title={isListening ? "Listening... Click to stop" : "Speak to Voicebot"}
            >
              {isListening ? (
                <MicOff className="h-4 w-4" />
              ) : (
                <Mic className="h-4 w-4" />
              )}
            </button>

            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder={isListening ? "Listening to your voice..." : "Ask your doubt or question..."}
              className="flex-1 h-10 px-3.5 rounded-full border border-border bg-surface text-small text-ink placeholder:text-ink-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />

            <button
              type="submit"
              disabled={!inputQuery.trim()}
              className="h-10 w-10 rounded-full bg-primary text-white flex items-center justify-center hover:bg-primary-hover disabled:opacity-40 transition-colors shrink-0 cursor-pointer"
              title="Send question"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>

          {/* Quick Demo CTA link at bottom */}
          {onOpenEnquiry && (
            <div className="pt-2 flex items-center justify-between text-[11px] text-ink-muted">
              <span>Need human guidance?</span>
              <button
                type="button"
                onClick={() => {
                  onOpenChange(false);
                  onOpenEnquiry();
                }}
                className="text-primary font-semibold hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                <Calendar className="h-3 w-3" />
                <span>Book 1-on-1 Session with Faculty</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </Dialog>
  );
}
