"use client";

import { useState } from "react";
import { LiteYouTubeEmbed } from "./lite-youtube-embed";
import { VideoDescription } from "./video-description";

interface LectureViewClientProps {
  videoId: string;
  title: string;
  durationSeconds?: number;
  thumbnailUrl?: string | null;
  description: string;
}

export function LectureViewClient({
  videoId,
  title,
  durationSeconds,
  thumbnailUrl,
  description,
}: LectureViewClientProps) {
  const [seekTime, setSeekTime] = useState<number | null>(null);

  const handleSeek = (seconds: number) => {
    setSeekTime(seconds);
  };

  return (
    <div className="space-y-6">
      {/* Lite Embed Player */}
      <LiteYouTubeEmbed
        videoId={videoId}
        title={title}
        durationSeconds={durationSeconds}
        thumbnailUrl={thumbnailUrl}
        seekTime={seekTime}
      />

      {/* Description with clickable links & timestamps */}
      <VideoDescription description={description} onSeek={handleSeek} />
    </div>
  );
}
