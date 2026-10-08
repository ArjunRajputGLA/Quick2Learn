"use client";

import { useState } from "react";
import { Copy, Check, Share2, ExternalLink } from "lucide-react";
import { YouTubeIcon } from "@/components/ui/icons";

function WhatsAppIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      role="img"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>WhatsApp</title>
      <path d="M17.472 14.382c-.301-.15-1.78-.879-2.056-.98-.275-.1-.476-.15-.677.15-.201.3-.779.98-.955 1.18-.175.2-.351.226-.652.075s-1.272-.469-2.424-1.496c-.896-.799-1.501-1.787-1.677-2.088-.175-.301-.019-.464.132-.614.136-.135.301-.351.452-.527.15-.175.201-.3.301-.501.1-.201.05-.376-.025-.526-.075-.15-.677-1.631-.928-2.233-.244-.587-.492-.507-.677-.517l-.577-.01c-.201 0-.526.075-.802.376s-1.053 1.028-1.053 2.508c0 1.48 1.078 2.909 1.229 3.109.15.201 2.122 3.24 5.141 4.543.718.311 1.279.496 1.716.635.722.23 1.379.197 1.899.12.579-.087 1.78-.727 2.031-1.429.251-.702.251-1.303.176-1.429-.075-.125-.276-.201-.577-.351zM12.04 21.75c-1.733 0-3.432-.455-4.931-1.319l-.353-.203-3.666.961.978-3.573-.231-.368A9.704 9.704 0 0 1 2.308 12.04C2.308 6.67 6.671 2.308 12.04 2.308c2.6 0 5.045 1.013 6.883 2.852A9.68 9.68 0 0 1 21.772 12.04c0 5.37-4.363 9.71-9.732 9.71zm0-18.423c-4.8 0-8.706 3.906-8.706 8.713 0 1.54.402 3.042 1.164 4.356l.18.31-.58 2.119 2.17-.569.298.177a8.673 8.673 0 0 0 4.474 1.22c4.801 0 8.707-3.907 8.707-8.714 0-2.327-.906-4.515-2.552-6.16-1.645-1.646-3.832-2.552-6.155-2.552z" />
    </svg>
  );
}

interface ShareButtonsProps {
  videoId: string;
  title: string;
  url?: string;
}

export function ShareButtons({ videoId, title, url }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);

  const shareUrl =
    url || (typeof window !== "undefined" ? window.location.href : `https://quick2learn.in/lecture/${videoId}`);
  const encodedText = encodeURIComponent(`Watch "${title}" on Quick2Learn: `);
  const encodedUrl = encodeURIComponent(shareUrl);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      {/* WhatsApp Share */}
      <a
        href={`https://wa.me/?text=${encodedText}${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border bg-surface text-ink text-small font-medium hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 transition-colors cursor-pointer"
        title="Share on WhatsApp"
      >
        <WhatsAppIcon className="h-4 w-4 text-emerald-600" />
        <span>WhatsApp</span>
      </a>

      {/* Copy Link */}
      <button
        type="button"
        onClick={handleCopy}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border bg-surface text-ink text-small font-medium hover:bg-surface-subtle transition-colors cursor-pointer"
        title="Copy Link to Clipboard"
      >
        {copied ? (
          <>
            <Check className="h-4 w-4 text-success" />
            <span className="text-success">Copied!</span>
          </>
        ) : (
          <>
            <Copy className="h-4 w-4 text-ink-muted" />
            <span>Copy Link</span>
          </>
        )}
      </button>

      {/* Twitter / X */}
      <a
        href={`https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border bg-surface text-ink text-small font-medium hover:bg-surface-subtle transition-colors cursor-pointer"
        title="Share on X (Twitter)"
      >
        <Share2 className="h-4 w-4 text-ink-muted" />
        <span>Share</span>
      </a>

      {/* Watch on YouTube External */}
      <a
        href={`https://www.youtube.com/watch?v=${videoId}`}
        target="_blank"
        rel="noopener noreferrer"
        className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-danger/10 text-danger border border-danger/20 text-small font-semibold hover:bg-danger hover:text-surface transition-colors cursor-pointer"
      >
        <YouTubeIcon className="h-4 w-4" />
        <span>Watch on YouTube</span>
        <ExternalLink className="h-3.5 w-3.5 opacity-70" />
      </a>
    </div>
  );
}
