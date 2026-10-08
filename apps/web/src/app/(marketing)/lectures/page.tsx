import type { Metadata } from "next";
import { getVideos } from "@/server/data/videos";
import { BreadcrumbsPlacement } from "@/components/layout/breadcrumbs-placement";
import { Badge } from "@/components/ui/badge";
import { YouTubeIcon } from "@/components/ui/icons";
import { INSTITUTE_INFO } from "@quick2learn/shared";
import { Video, Clock, Eye, ThumbsUp, ExternalLink } from "lucide-react";

export const metadata: Metadata = {
  title: "Free Video Lectures — CBSE & ICSE Mathematics & Science | Quick2Learn",
  description:
    "Watch free conceptual video lectures in Hindi for CBSE & ICSE Classes 9–12. One-shot chapter revisions, formulas, and board PYQ marathons by Dinesh Sir in Mathura.",
  alternates: {
    canonical: "/lectures",
  },
  openGraph: {
    title: "Free Video Lectures | Quick2Learn",
    description:
      "Watch free conceptual video lectures in Hindi for CBSE & ICSE Classes 9–12.",
    url: "https://quick2learn.in/lectures",
  },
  twitter: {
    card: "summary_large_image",
    title: "Free Video Lectures | Quick2Learn",
  },
};

export default async function LecturesPage() {
  const videoList = await getVideos();

  return (
    <div>
      <BreadcrumbsPlacement
        items={[
          { label: "Home", href: "/" },
          { label: "Free Lectures", href: "/lectures" },
        ]}
      />

      <div className="container mx-auto px-4 py-8 lg:py-12">
        <div className="max-w-3xl mb-8 space-y-3">
          <Badge variant="primary" className="mb-1">
            Free Video Lessons
          </Badge>
          <h1 className="text-display font-extrabold tracking-tight text-ink">
            Official Quick2Learn Lectures
          </h1>
          <p className="text-body text-ink-muted">
            Curated YouTube video lectures by Mr. Dinesh Singh Rajput (Senior Mathematics)
            and Mrs. Namita Singh Rajput (ICSE Sciences) covering NCERT concepts, formulas,
            and board previous year questions.
          </p>
          <div className="pt-1">
            <a
              href={INSTITUTE_INFO.youtube.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-small font-semibold text-danger hover:underline"
            >
              <YouTubeIcon className="h-4 w-4" />
              <span>Subscribe on YouTube (@Quick2Learn)</span>
              <ExternalLink className="h-3.5 w-3.5 opacity-70" />
            </a>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {videoList.map((v) => (
            <div
              key={v.id}
              className="rounded-lg border border-border bg-surface overflow-hidden shadow-card hover:shadow-card-hover transition-all flex flex-col justify-between"
            >
              <div>
                {/* Video Thumbnail Header */}
                <div className="relative aspect-video bg-surface-subtle overflow-hidden border-b border-border">
                  {v.thumbnailUrl ? (
                    <img
                      src={v.thumbnailUrl}
                      alt={v.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-ink-muted">
                      <Video className="h-10 w-10 text-primary/40" />
                    </div>
                  )}
                  {v.durationSeconds > 0 && (
                    <span className="absolute bottom-2 right-2 rounded bg-ink/80 px-1.5 py-0.5 text-[11px] font-semibold text-surface flex items-center gap-1 backdrop-blur-xs">
                      <Clock className="h-3 w-3" />
                      {Math.floor(v.durationSeconds / 60)}:
                      {String(v.durationSeconds % 60).padStart(2, "0")}
                    </span>
                  )}
                </div>

                <div className="p-4 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    {v.classLevel && (
                      <Badge variant="primary" className="text-[10px]">
                        Class {v.classLevel}
                      </Badge>
                    )}
                    <div className="flex items-center gap-3 text-caption text-ink-muted">
                      {v.viewCount > 0 && (
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {v.viewCount.toLocaleString()}
                        </span>
                      )}
                      {v.likeCount > 0 && (
                        <span className="flex items-center gap-1">
                          <ThumbsUp className="h-3 w-3" />
                          {v.likeCount.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>

                  <h2 className="font-semibold text-body text-ink line-clamp-2 leading-snug">
                    {v.title}
                  </h2>

                  {v.description && (
                    <p className="text-caption text-ink-muted line-clamp-2">
                      {v.description}
                    </p>
                  )}
                </div>
              </div>

              <div className="p-4 pt-0">
                <a
                  href={`https://www.youtube.com/watch?v=${v.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-md bg-primary-soft text-primary font-semibold text-small hover:bg-primary hover:text-surface transition-colors"
                >
                  <YouTubeIcon className="h-4 w-4" />
                  <span>Watch on YouTube</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
