"use client";

import { useState, useMemo } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

interface VideoDescriptionProps {
  description: string;
  onSeek?: (seconds: number) => void;
}

function parseTimestampToSeconds(ts: string): number {
  const parts = ts.split(":").map(Number);
  if (parts.length === 3) {
    const hours = parts[0] ?? 0;
    const minutes = parts[1] ?? 0;
    const seconds = parts[2] ?? 0;
    return hours * 3600 + minutes * 60 + seconds;
  }
  if (parts.length === 2) {
    const minutes = parts[0] ?? 0;
    const seconds = parts[1] ?? 0;
    return minutes * 60 + seconds;
  }
  return 0;
}

export function VideoDescription({ description, onSeek }: VideoDescriptionProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Regex matching URLs or timestamps (e.g. 1:23:45 or 12:34 or 0:45)
  const tokens = useMemo(() => {
    if (!description) return [];

    const urlOrTimeRegex =
      /(https?:\/\/[^\s]+)|(\b(?:[0-9]{1,2}:)?[0-9]{1,2}:[0-9]{2}\b)/g;

    const parts: Array<
      | { type: "text"; value: string }
      | { type: "url"; value: string }
      | { type: "timestamp"; value: string; seconds: number }
    > = [];

    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = urlOrTimeRegex.exec(description)) !== null) {
      if (match.index > lastIndex) {
        parts.push({
          type: "text",
          value: description.substring(lastIndex, match.index),
        });
      }

      if (match[1]) {
        parts.push({
          type: "url",
          value: match[1],
        });
      } else if (match[2]) {
        parts.push({
          type: "timestamp",
          value: match[2],
          seconds: parseTimestampToSeconds(match[2]),
        });
      }

      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < description.length) {
      parts.push({
        type: "text",
        value: description.substring(lastIndex),
      });
    }

    return parts;
  }, [description]);

  if (!description) {
    return (
      <p className="text-small text-ink-muted italic">
        No description provided for this lecture.
      </p>
    );
  }

  const isLong = description.length > 300;

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-slate-50/70 p-5 sm:p-6 shadow-2xs">
      <div
        className={`text-small text-slate-700 leading-relaxed whitespace-pre-line font-sans ${
          !isExpanded && isLong ? "line-clamp-4" : ""
        }`}
      >
        {tokens.map((token, idx) => {
          if (token.type === "url") {
            return (
              <a
                key={idx}
                href={token.value}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline font-semibold break-all"
              >
                {token.value}
              </a>
            );
          }
          if (token.type === "timestamp") {
            return (
              <button
                key={idx}
                type="button"
                onClick={() => onSeek?.(token.seconds)}
                className="inline-flex items-center rounded-md bg-blue-100/90 px-2 py-0.5 text-primary hover:bg-primary hover:text-white font-bold text-xs cursor-pointer transition-colors shadow-2xs mr-1"
                title={`Seek video to ${token.value}`}
              >
                {token.value}
              </button>
            );
          }
          return <span key={idx}>{token.value}</span>;
        })}
      </div>

      {isLong && (
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-3.5 flex items-center gap-1.5 text-xs font-bold text-primary hover:underline cursor-pointer"
        >
          {isExpanded ? (
            <>
              <span>Show less</span>
              <ChevronUp className="h-4 w-4" />
            </>
          ) : (
            <>
              <span>Show full lecture description</span>
              <ChevronDown className="h-4 w-4" />
            </>
          )}
        </button>
      )}
    </div>
  );
}
