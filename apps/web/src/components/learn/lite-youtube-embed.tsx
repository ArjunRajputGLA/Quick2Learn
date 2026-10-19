"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import { recordLectureViewAction } from "@/server/lecture-actions";
import { YouTubeIcon } from "@/components/ui/icons";
import { Clock, Play } from "lucide-react";
import { trackEvent } from "@/lib/analytics";

interface LiteYouTubeEmbedProps {
  videoId: string;
  title: string;
  durationSeconds?: number;
  thumbnailUrl?: string | null;
  seekTime?: number | null;
  initialPositionSeconds?: number;
  isLoggedIn?: boolean;
}

export function LiteYouTubeEmbed({
  videoId,
  title,
  durationSeconds,
  thumbnailUrl,
  seekTime,
  initialPositionSeconds = 0,
  isLoggedIn = false,
}: LiteYouTubeEmbedProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const currentPosRef = useRef<number>(initialPositionSeconds);
  const lastSavedPosRef = useRef<number>(initialPositionSeconds);

  // Compute best thumbnail URL
  const posterUrl =
    thumbnailUrl || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

  const handlePlay = () => {
    setIsPlaying(true);
    trackEvent("lecture_played", { videoId, title });
    recordLectureViewAction(videoId).catch(() => {});
  };

  // Helper to persist watch progress to the backend
  const flushProgress = useCallback(
    (pos: number) => {
      if (!isLoggedIn || pos <= 0) return;
      if (Math.abs(pos - lastSavedPosRef.current) < 3) return;

      lastSavedPosRef.current = pos;
      const duration = durationSeconds || 0;

      fetch("/api/v1/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          updates: [
            {
              itemType: "youtube_video",
              itemId: videoId,
              positionSeconds: Math.floor(pos),
              durationSeconds: Math.floor(duration),
            },
          ],
        }),
        keepalive: true,
      }).catch(() => {});
    },
    [isLoggedIn, durationSeconds, videoId]
  );

  // Listen to postMessages from YouTube iframe (enablejsapi=1)
  useEffect(() => {
    if (!isPlaying || !isLoggedIn) return;

    const handleMessage = (e: MessageEvent) => {
      try {
        if (typeof e.data === "string") {
          const parsed = JSON.parse(e.data);
          // YouTube API posts { event: "infoDelivery", info: { currentTime, duration, playerState } }
          if (parsed.event === "infoDelivery" && parsed.info?.currentTime !== undefined) {
            const time = Number(parsed.info.currentTime);
            if (!isNaN(time)) {
              currentPosRef.current = time;
            }
          }
          // Player state changed: 0 = ENDED, 2 = PAUSED
          if (
            parsed.event === "infoDelivery" &&
            (parsed.info?.playerState === 0 || parsed.info?.playerState === 2)
          ) {
            flushProgress(currentPosRef.current);
          }
        }
      } catch {}
    };

    window.addEventListener("message", handleMessage);

    // Tell YouTube iframe to start broadcasting state
    const pingIframe = () => {
      if (iframeRef.current?.contentWindow) {
        iframeRef.current.contentWindow.postMessage(
          JSON.stringify({ event: "listening" }),
          "*"
        );
      }
    };
    const timer = setTimeout(pingIframe, 1500);

    // Save position every 10 seconds while playing
    const interval = setInterval(() => {
      flushProgress(currentPosRef.current);
    }, 10000);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
      window.removeEventListener("message", handleMessage);
      flushProgress(currentPosRef.current);
    };
  }, [isPlaying, isLoggedIn, flushProgress]);

  // If a timestamp is clicked, seek the player or start playing at that timestamp
  useEffect(() => {
    if (seekTime != null && seekTime >= 0) {
      currentPosRef.current = seekTime;
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
          "*"
        );
      }
    }
  }, [seekTime, isPlaying, videoId]);

  // Compute start time parameter: seekTime if clicked, else initialPositionSeconds if resuming
  const effectiveStart =
    seekTime && seekTime > 0
      ? Math.floor(seekTime)
      : initialPositionSeconds && initialPositionSeconds > 0
        ? Math.floor(initialPositionSeconds)
        : 0;

  const embedUrl = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&enablejsapi=1${
    effectiveStart > 0 ? `&start=${effectiveStart}` : ""
  }`;

  const formatSecs = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = Math.floor(s % 60);
    return `${mins}:${String(secs).padStart(2, "0")}`;
  };

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 shadow-xl ring-1 ring-slate-900/10">
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
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
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
            {initialPositionSeconds > 0 && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/80 backdrop-blur-md text-white text-xs font-semibold shadow-md border border-white/20">
                <Play className="h-3 w-3 fill-current text-primary" />
                Resume from {formatSecs(initialPositionSeconds)}
              </span>
            )}
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
                {formatSecs(durationSeconds)}
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
