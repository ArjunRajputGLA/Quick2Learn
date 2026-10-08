"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { recordLectureViewAction } from "@/server/lecture-actions";
import { YouTubeIcon } from "@/components/ui/icons";
import { Clock } from "lucide-react";
import { trackEvent } from "@/lib/analytics";

interface LiteYouTubeEmbedProps {
  videoId: string;
  title: string;
  durationSeconds?: number;
  thumbnailUrl?: string | null;
  seekTime?: number | null;
}

export function LiteYouTubeEmbed({
  videoId,
  title,
  durationSeconds,
  thumbnailUrl,
  seekTime,
}: LiteYouTubeEmbedProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  // Compute best thumbnail URL
  const posterUrl =
    thumbnailUrl || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

  const handlePlay = () => {
    setIsPlaying(true);
    trackEvent("lecture_played", { videoId, title });
    // Fire server action to record user view asynchronously
    recordLectureViewAction(videoId).catch(() => {});
  };

  // If a timestamp is clicked, seek the player or start playing at that timestamp
  useEffect(() => {
    if (seekTime != null && seekTime >= 0) {
      if (!isPlaying) {
        setIsPlaying(true);
        recordLectureViewAction(videoId).catch(() => {});
      } else if (iframeRef.current?.contentWindow) {
        iframeRef.current.contentWindow.postMessage(
          JSON.stringify({
            event: "command",
            func: "seekTo",
            args: [seekTime, true],
          }),
          "*",
        );
      }
    }
  }, [seekTime, isPlaying, videoId]);

  const embedUrl = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&enablejsapi=1${
    seekTime && !isPlaying ? `&start=${Math.floor(seekTime)}` : ""
  }`;

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-border bg-ink shadow-lg">
      {!isPlaying ? (
        <button
          type="button"
          onClick={handlePlay}
          aria-label={`Play video: ${title}`}
          className="group relative h-full w-full cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-primary focus:ring-offset-2"
        >
          {/* High-res thumbnail preview */}
          <Image
            src={posterUrl}
            alt={title}
            fill
            sizes="(max-width: 1200px) 100vw, 1200px"
            className="object-cover transition-transform duration-300 group-hover:scale-102"
            priority
          />

          {/* Dark gradient overlay for contrast */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent transition-opacity group-hover:opacity-90" />

          {/* Centered Branded Play Button */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-full bg-danger text-surface shadow-2xl transition-transform duration-200 group-hover:scale-110 group-active:scale-95">
              <div className="ml-1 flex items-center justify-center">
                <svg
                  className="h-8 w-8 sm:h-10 sm:w-10 fill-current"
                  viewBox="0 0 24 24"
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Top Title Overlay */}
          <div className="absolute top-0 inset-x-0 p-4 text-left">
            <h2 className="text-small sm:text-body font-semibold text-surface line-clamp-1 drop-shadow-md">
              {title}
            </h2>
          </div>

          {/* Bottom Indicators */}
          <div className="absolute bottom-3 right-3 flex items-center gap-2">
            {durationSeconds && durationSeconds > 0 && (
              <span className="rounded bg-black/80 px-2 py-0.5 text-[11px] font-semibold text-surface flex items-center gap-1 backdrop-blur-xs">
                <Clock className="h-3 w-3" />
                {Math.floor(durationSeconds / 60)}:
                {String(durationSeconds % 60).padStart(2, "0")}
              </span>
            )}
            <span className="rounded bg-black/80 px-2 py-0.5 text-[11px] font-semibold text-surface flex items-center gap-1 backdrop-blur-xs">
              <YouTubeIcon className="h-3.5 w-3.5 text-danger" />
              YouTube Player
            </span>
          </div>
        </button>
      ) : (
        <iframe
          ref={iframeRef}
          src={embedUrl}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="h-full w-full border-0"
        />
      )}
    </div>
  );
}
