"use client";

import { useState } from "react";
import { LiteYouTubeEmbed } from "./lite-youtube-embed";
import { VideoDescription } from "./video-description";
import { Bot, Sparkles, Clock } from "lucide-react";

interface LectureViewClientProps {
  videoId: string;
  title: string;
  durationSeconds?: number;
  thumbnailUrl?: string | null;
  description: string;
  subjectName?: string;
  classRoman?: string;
  initialPositionSeconds?: number;
  isLoggedIn?: boolean;
}

export function LectureViewClient({
  videoId,
  title,
  durationSeconds,
  thumbnailUrl,
  description,
  subjectName = "Sciences",
  classRoman = "X",
  initialPositionSeconds = 0,
  isLoggedIn = false,
}: LectureViewClientProps) {
  const [seekTime, setSeekTime] = useState<number | null>(null);

  const handleSeek = (seconds: number) => {
    setSeekTime(seconds);
  };

  const handleAskAITutor = (promptText: string) => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("open-quick2learn-chat", {
          detail: { prompt: promptText },
        }),
      );
    }
  };

  // Structured high-yield video chapters (interactive seeking)
  const chapters = [
    { label: "Overview & Board Weightage", seconds: 0, timeStr: "00:00" },
    {
      label: "Fundamental Concepts & Definitions",
      seconds: Math.floor((durationSeconds || 3000) * 0.15),
      timeStr: `${String(Math.floor(((durationSeconds || 3000) * 0.15) / 60)).padStart(2, "0")}:${String(Math.floor(((durationSeconds || 3000) * 0.15) % 60)).padStart(2, "0")}`,
    },
    {
      label: "Step-by-Step Mechanisms & Diagrams",
      seconds: Math.floor((durationSeconds || 3000) * 0.45),
      timeStr: `${String(Math.floor(((durationSeconds || 3000) * 0.45) / 60)).padStart(2, "0")}:${String(Math.floor(((durationSeconds || 3000) * 0.45) % 60)).padStart(2, "0")}`,
    },
    {
      label: "Board PYQs & Common Mistakes",
      seconds: Math.floor((durationSeconds || 3000) * 0.75),
      timeStr: `${String(Math.floor(((durationSeconds || 3000) * 0.75) / 60)).padStart(2, "0")}:${String(Math.floor(((durationSeconds || 3000) * 0.75) % 60)).padStart(2, "0")}`,
    },
  ];

  return (
    <div className="space-y-6">
      {/* 1. Cinematic Lite Embed Player */}
      <LiteYouTubeEmbed
        videoId={videoId}
        title={title}
        durationSeconds={durationSeconds}
        thumbnailUrl={thumbnailUrl}
        seekTime={seekTime}
        initialPositionSeconds={initialPositionSeconds}
        isLoggedIn={isLoggedIn}
      />

      {/* 2. Interactive Lecture Chapters Strip */}
      <div className="p-4 rounded-2xl border border-slate-200/90 bg-white shadow-2xs space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-primary" />
            Jump to Key Lecture Milestones:
          </span>
          <span className="text-[11px] font-semibold text-slate-400">
            Click to seek video
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {chapters.map((ch, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSeek(ch.seconds)}
              className="flex items-center justify-between p-2.5 px-3 rounded-xl border border-slate-200/70 bg-slate-50/70 hover:bg-primary-soft hover:border-primary/40 hover:text-primary transition-all text-left cursor-pointer group"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="h-5 w-5 rounded bg-white text-slate-700 group-hover:bg-primary group-hover:text-white border border-slate-200 text-[10px] font-bold flex items-center justify-center shrink-0 transition-colors">
                  {idx + 1}
                </span>
                <span className="text-xs font-semibold text-slate-800 group-hover:text-primary truncate">
                  {ch.label}
                </span>
              </div>
              <span className="text-[11px] font-mono font-bold text-primary shrink-0 ml-2">
                {ch.timeStr}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 3. Description with clickable links & timestamps */}
      <VideoDescription description={description} onSeek={handleSeek} />

      {/* 4. Interactive AI Tutor Doubt Assistant Widget */}
      <div className="p-5 sm:p-6 rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/5 via-blue-50/40 to-white shadow-xs space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-primary text-white flex items-center justify-center shadow-2xs">
              <Bot className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-small font-bold text-slate-900 leading-tight">
                Have a Doubt from this Lecture?
              </h3>
              <p className="text-xs text-slate-500">
                Quick2Learn AI Academic Tutor has full context of Class {classRoman} {subjectName}.
              </p>
            </div>
          </div>
          <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary">
            <Sparkles className="h-3 w-3" />
            AI Active
          </span>
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          <button
            type="button"
            onClick={() =>
              handleAskAITutor(
                `Explain the core scientific concepts and mechanisms taught in the lecture "${title}" in simple, step-by-step Class ${classRoman} language.`,
              )
            }
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-primary/20 bg-white text-slate-700 hover:text-primary hover:border-primary text-xs font-semibold shadow-2xs transition-all cursor-pointer"
          >
            <span>💬 Explain core mechanism step-by-step</span>
          </button>

          <button
            type="button"
            onClick={() =>
              handleAskAITutor(
                `Give me 5 expected Class ${classRoman} ${subjectName} board exam practice questions based on "${title}" with detailed model answers.`,
              )
            }
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-primary/20 bg-white text-slate-700 hover:text-primary hover:border-primary text-xs font-semibold shadow-2xs transition-all cursor-pointer"
          >
            <span>📝 Generate 5 board practice questions</span>
          </button>

          <button
            type="button"
            onClick={() =>
              handleAskAITutor(
                `What are the most frequent board exam mistakes and diagram labeling rules for "${title}"?`,
              )
            }
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-primary/20 bg-white text-slate-700 hover:text-primary hover:border-primary text-xs font-semibold shadow-2xs transition-all cursor-pointer"
          >
            <span>🧪 Diagram rules &amp; common pitfalls</span>
          </button>
        </div>
      </div>
    </div>
  );
}
