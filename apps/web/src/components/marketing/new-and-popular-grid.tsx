"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Star, Play } from "lucide-react";
import type { FormattedLectureCardData } from "@/server/data/videos";
import type { FormattedBatchCardData } from "@/server/data/batches";
import { MathText } from "@/components/ui/math-text";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface ListItem {
  id: string;
  thumbnailUrl?: string;
  provider: string; // e.g. "Quick2Learn" or faculty name
  title: string;
  type: string; // e.g. "Video Lecture · 32 min" or "Offline Batch"
  rating?: string; // e.g. "4.8"
  href: string;
}

interface CategoryColumn {
  heading: string;
  items: ListItem[];
  viewAllHref: string;
}

export interface NewAndPopularGridProps {
  heading?: string;
  latestVideos: FormattedLectureCardData[];
  mostWatchedVideos: FormattedLectureCardData[];
  boardExamVideos: FormattedLectureCardData[];
  openBatches?: FormattedBatchCardData[];
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function videoToListItem(video: FormattedLectureCardData): ListItem {
  return {
    id: video.id,
    thumbnailUrl: video.thumbnailUrl,
    provider: video.faculty || "Quick2Learn",
    title: video.title?.replace(/\s*\[PLACEHOLDER\]/gi, "") || "",
    type: `${video.gradeAndSubject} · ${video.duration}`,
    rating: "4.8",
    href: video.href || "#",
  };
}

function batchToListItem(batch: FormattedBatchCardData): ListItem {
  return {
    id: batch.id,
    thumbnailUrl: batch.coverImageUrl,
    provider: batch.facultyName || "Quick2Learn",
    title: batch.title?.replace(/\s*\[PLACEHOLDER\]/gi, "") || "",
    type: `${batch.grade} · ${batch.board}`,
    rating: "4.9",
    href: batch.href || "#",
  };
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function CategoryColumnCard({ heading, items, viewAllHref }: CategoryColumn) {
  return (
    <div className="flex flex-col rounded-xl border border-border bg-surface shadow-card overflow-hidden">
      {/* Column heading */}
      <Link
        href={viewAllHref}
        className="group/head flex items-center justify-between px-5 pt-5 pb-3"
      >
        <h4 className="text-body font-bold text-ink group-hover/head:text-primary transition-colors">
          {heading}
        </h4>
        <ArrowRight className="h-4 w-4 text-ink-muted group-hover/head:text-primary group-hover/head:translate-x-0.5 transition-all" />
      </Link>

      {/* List items */}
      <div className="flex flex-col divide-y divide-border">
        {items.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            className="group/item flex items-start gap-3.5 px-5 py-4 hover:bg-surface-subtle transition-colors"
          >
            {/* Thumbnail */}
            <div className="relative h-12 w-12 rounded-md overflow-hidden bg-surface-subtle shrink-0 border border-border/60">
              {item.thumbnailUrl ? (
                <Image
                  src={item.thumbnailUrl}
                  alt={item.title}
                  fill
                  sizes="48px"
                  className="object-cover"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center bg-primary-soft text-primary">
                  <Play className="h-4 w-4 fill-current" />
                </div>
              )}
            </div>

            {/* Text content */}
            <div className="flex-1 min-w-0 space-y-0.5">
              <p className="text-caption font-medium text-ink-muted">
                {item.provider}
              </p>
              <h5 className="text-small font-semibold text-ink leading-snug line-clamp-2 group-hover/item:text-primary transition-colors">
                <MathText>{item.title}</MathText>
              </h5>
              <div className="flex items-center gap-2 pt-0.5">
                <span className="text-caption text-ink-muted">{item.type}</span>
                {item.rating && (
                  <>
                    <span className="text-caption text-ink-muted">·</span>
                    <span className="inline-flex items-center gap-0.5 text-caption font-semibold text-ink">
                      <Star className="h-3 w-3 fill-accent text-accent" />
                      {item.rating}
                    </span>
                  </>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export function NewAndPopularGrid({
  heading = "New and popular",
  latestVideos,
  mostWatchedVideos,
  boardExamVideos,
  openBatches,
}: NewAndPopularGridProps) {
  const hasData =
    (latestVideos && latestVideos.length > 0) ||
    (mostWatchedVideos && mostWatchedVideos.length > 0) ||
    (boardExamVideos && boardExamVideos.length > 0);

  if (!hasData) return null;

  // Build the three columns (Coursera-style: 3 items per column)
  const col1Items: ListItem[] = (mostWatchedVideos || [])
    .slice(0, 3)
    .map(videoToListItem);

  const col2Items: ListItem[] = (latestVideos || [])
    .slice(0, 3)
    .map(videoToListItem);

  // Column 3: "Trending batches" or board exam videos
  const col3Items: ListItem[] =
    openBatches && openBatches.length > 0
      ? openBatches.slice(0, 3).map(batchToListItem)
      : (boardExamVideos || []).slice(0, 3).map(videoToListItem);

  const columns: CategoryColumn[] = [
    {
      heading: "Most popular →",
      items: col1Items,
      viewAllHref: "/lectures?sort=popular",
    },
    {
      heading: "Latest lectures →",
      items: col2Items,
      viewAllHref: "/lectures?sort=latest",
    },
    {
      heading:
        openBatches && openBatches.length > 0
          ? "Trending batches →"
          : "Board exam prep →",
      items: col3Items,
      viewAllHref:
        openBatches && openBatches.length > 0
          ? "/batches"
          : "/lectures?filter=board_exam",
    },
  ];

  return (
    <section id="lectures" className="bg-surface py-10 md:py-14">
      <div className="container mx-auto px-4 max-w-[1200px] space-y-6">
        {/* Section heading */}
        <h3 className="text-h2 font-semibold text-ink">{heading}</h3>

        {/* 3-column grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {columns.map((col) => (
            <CategoryColumnCard
              key={col.heading}
              heading={col.heading}
              items={col.items}
              viewAllHref={col.viewAllHref}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
