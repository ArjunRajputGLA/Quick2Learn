import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { Play } from "lucide-react";
import { MathText } from "@/components/ui/math-text";
import { cn } from "@/lib/utils";

export interface LectureCardProps {
  id: string;
  title: string;
  thumbnailUrl?: string;
  duration: string;
  gradeAndSubject: string; // e.g. "Class XII · Maths"
  faculty: string; // e.g. "Dinesh Sir"
  views: string; // e.g. "12K views"
  publishedAt: string; // e.g. "3 days ago"
  href?: string;
  className?: string;
}

export function LectureCard({
  title,
  thumbnailUrl,
  duration,
  gradeAndSubject,
  faculty,
  views,
  publishedAt,
  href = "#",
  className,
}: LectureCardProps) {
  return (
    <div
      className={cn(
        "group flex flex-col overflow-hidden rounded-md border border-border bg-surface shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200",
        className,
      )}
    >
      <Link href={href} className="block relative aspect-video w-full overflow-hidden bg-surface-subtle">
        {thumbnailUrl ? (
          <Image
            src={thumbnailUrl}
            alt={title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 360px"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-primary-soft text-primary">
            <div className="h-12 w-12 rounded-full bg-primary text-surface flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
              <Play className="h-6 w-6 ml-0.5 fill-current" />
            </div>
          </div>
        )}

        {/* Duration badge */}
        <span className="absolute bottom-2 right-2 rounded-sm bg-ink/90 px-1.5 py-0.5 text-caption font-semibold text-surface">
          {duration}
        </span>
      </Link>

      <div className="flex flex-1 flex-col p-4 justify-between">
        <div className="space-y-1.5">
          <p className="text-caption font-semibold uppercase tracking-wider text-primary">
            {gradeAndSubject}
          </p>
          <h4 className="line-clamp-2 text-body font-semibold text-ink group-hover:text-primary transition-colors leading-snug">
            <MathText>{title}</MathText>
          </h4>
        </div>

        <p className="mt-3 text-caption text-ink-muted">
          {faculty} · {views} · {publishedAt}
        </p>
      </div>
    </div>
  );
}
