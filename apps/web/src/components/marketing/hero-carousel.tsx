"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Play, Award, Calendar, Clock, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatINR } from "@quick2learn/shared";
import type { FormattedLectureCardData } from "@/server/data/videos";
import type { FormattedBatchCardData } from "@/server/data/batches";

export interface HeroTilesConfig {
  badge_new_lecture?: string;
  badge_batch?: string;
  featured_batch_slug?: string;
  results_badge?: string;
  results_title?: string;
  results_subtitle?: string;
  results_image_url?: string;
  results_cta_text?: string;
  results_cta_href?: string;
}

export interface HeroCarouselProps {
  latestLecture: FormattedLectureCardData | null;
  featuredBatch: FormattedBatchCardData | null;
  heroTilesSettings?: HeroTilesConfig | null;
}


export function HeroCarousel({
  latestLecture,
  featuredBatch,
  heroTilesSettings,
}: HeroCarouselProps) {
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [isHovered, setIsHovered] = React.useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = React.useState(false);

  // Check for prefers-reduced-motion
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  // Auto-advance timer (5000ms), paused when hovered or prefers-reduced-motion
  React.useEffect(() => {
    if (isHovered || prefersReducedMotion) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % 3);
    }, 5000);

    return () => clearInterval(timer);
  }, [isHovered, prefersReducedMotion]);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? 2 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % 3);
  };

  const badgeNewLecture = heroTilesSettings?.badge_new_lecture || "Newest Lecture";
  const badgeBatch = heroTilesSettings?.badge_batch || "Admissions open";
  const resultsBadge = heroTilesSettings?.results_badge || "Proven Results";
  const resultsTitle = heroTilesSettings?.results_title || "100/100 Top Score & 98.4% Distinction Rate";
  const resultsSubtitle =
    heroTilesSettings?.results_subtitle ||
    "Recognised by the HRD Minister for outstanding CBSE board results.";
  const resultsImage =
    heroTilesSettings?.results_image_url ||
    "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=600&auto=format&fit=crop&q=80";
  const resultsCta = heroTilesSettings?.results_cta_text || "View Hall of Fame";
  const resultsHref = heroTilesSettings?.results_cta_href || "/#results";

  return (
    <div
      className="relative w-full overflow-hidden rounded-xl border border-border bg-surface shadow-card"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="region"
      aria-roledescription="carousel"
      aria-label="Hero Highlights"
    >
      {/* Slides Container */}
      <div className="relative h-[380px] sm:h-[400px] w-full overflow-hidden">
        {/* TILE 1: Newest published lecture (priority = true) */}
        <div
          className={`absolute inset-0 transition-opacity duration-300 flex flex-col justify-between ${
            currentIndex === 0 ? "opacity-100 z-10 pointer-events-auto" : "opacity-0 z-0 pointer-events-none"
          }`}
          aria-hidden={currentIndex !== 0}
        >
          {latestLecture ? (
            <div className="flex h-full flex-col">
              <div className="relative h-56 w-full overflow-hidden bg-surface-subtle">
                <Image
                  src={latestLecture.thumbnailUrl}
                  alt={latestLecture.title}
                  fill
                  priority={true}
                  sizes="(max-width: 768px) 100vw, 500px"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-transparent to-transparent" />
                <div className="absolute top-3 left-3">
                  <Badge variant="accent">{badgeNewLecture}</Badge>
                </div>
                <div className="absolute bottom-3 right-3 rounded-sm bg-ink/90 px-2 py-0.5 text-caption font-semibold text-surface">
                  {latestLecture.duration}
                </div>
              </div>
              <div className="flex flex-1 flex-col justify-between p-5 bg-surface">
                <div className="space-y-1.5">
                  <span className="text-caption font-semibold uppercase tracking-wider text-primary">
                    {latestLecture.gradeAndSubject}
                  </span>
                  <h3 className="line-clamp-2 text-body font-semibold text-ink hover:text-primary transition-colors">
                    <Link href={latestLecture.href}>{latestLecture.title}</Link>
                  </h3>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-border/70 text-small text-ink-muted">
                  <span>{latestLecture.faculty}</span>
                  <Link
                    href={latestLecture.href}
                    className="inline-flex items-center gap-1 font-semibold text-primary hover:underline"
                  >
                    <span>Watch lecture</span>
                    <Play className="h-3.5 w-3.5 fill-current" />
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex h-full items-center justify-center p-8 text-center text-ink-muted">
              Loading latest lecture...
            </div>
          )}
        </div>

        {/* TILE 2: Admissions open for featured batch */}
        <div
          className={`absolute inset-0 transition-opacity duration-300 flex flex-col justify-between ${
            currentIndex === 1 ? "opacity-100 z-10 pointer-events-auto" : "opacity-0 z-0 pointer-events-none"
          }`}
          aria-hidden={currentIndex !== 1}
        >
          {featuredBatch ? (
            <div className="flex h-full flex-col">
              <div className="relative h-44 w-full bg-linear-to-br from-primary-soft via-surface-subtle to-surface p-5 flex flex-col justify-between border-b border-border">
                <div className="flex items-center justify-between">
                  <Badge variant="accent">{badgeBatch}</Badge>
                  <div className="flex items-center gap-1.5">
                    <Badge variant="primary">{featuredBatch.grade}</Badge>
                    <Badge variant="neutral">{featuredBatch.board}</Badge>
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-caption font-semibold uppercase tracking-wider text-primary">
                    Classroom & Hybrid Mentorship
                  </span>
                  <h3 className="text-h3 font-bold text-ink line-clamp-2">
                    <Link href={featuredBatch.href}>{featuredBatch.title}</Link>
                  </h3>
                </div>
              </div>

              <div className="flex flex-1 flex-col justify-between p-5 bg-surface space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-small text-ink">
                    <Clock className="h-4 w-4 text-primary shrink-0" />
                    <span>{featuredBatch.schedule}</span>
                  </div>
                  <div className="flex items-center gap-2 text-small text-ink-muted">
                    <Calendar className="h-4 w-4 text-primary shrink-0" />
                    <span>Faculty: {featuredBatch.facultyName}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <div className="flex items-baseline gap-2">
                    <span className="text-h3 font-bold text-ink">
                      {formatINR(featuredBatch.pricePaise)}
                    </span>
                    {featuredBatch.originalPricePaise && (
                      <span className="text-caption text-ink-muted line-through">
                        {formatINR(featuredBatch.originalPricePaise)}
                      </span>
                    )}
                  </div>
                  <Link
                    href={featuredBatch.href}
                    className="inline-flex items-center gap-1 font-semibold text-small text-primary hover:underline"
                  >
                    <span>Reserve Seat</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex h-full items-center justify-center p-8 text-center text-ink-muted">
              Loading featured batch...
            </div>
          )}
        </div>

        {/* TILE 3: Results & awards */}
        <div
          className={`absolute inset-0 transition-opacity duration-300 flex flex-col justify-between ${
            currentIndex === 2 ? "opacity-100 z-10 pointer-events-auto" : "opacity-0 z-0 pointer-events-none"
          }`}
          aria-hidden={currentIndex !== 2}
        >
          <div className="flex h-full flex-col">
            <div className="relative h-48 w-full overflow-hidden bg-surface-subtle">
              <Image
                src={resultsImage}
                alt={resultsTitle}
                fill
                sizes="(max-width: 768px) 100vw, 500px"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/40 to-transparent" />
              <div className="absolute top-3 left-3">
                <Badge variant="accent">{resultsBadge}</Badge>
              </div>
              <div className="absolute bottom-3 left-3 right-3 text-surface">
                <div className="flex items-center gap-1.5 text-accent font-semibold text-caption mb-0.5">
                  <Award className="h-4 w-4 fill-current" />
                  <span>Excellence in Mathematics</span>
                </div>
                <h3 className="text-body font-bold text-surface line-clamp-1">
                  {resultsTitle}
                </h3>
              </div>
            </div>

            <div className="flex flex-1 flex-col justify-between p-5 bg-surface">
              <p className="text-small text-ink-muted leading-relaxed line-clamp-3">
                {resultsSubtitle}
              </p>
              <div className="pt-3 border-t border-border flex items-center justify-between">
                <span className="text-caption font-medium text-ink-muted">
                  25+ Years Legacy in Mathura
                </span>
                <Link
                  href={resultsHref}
                  className="inline-flex items-center gap-1 font-semibold text-small text-primary hover:underline"
                >
                  <span>{resultsCta}</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom controls: Prev/Next & Dots */}
      <div className="flex items-center justify-between px-4 py-3 bg-surface-subtle border-t border-border">
        {/* Dots */}
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map((idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setCurrentIndex(idx)}
              aria-label={`Go to slide ${idx + 1}`}
              className={`h-2 rounded-full transition-all cursor-pointer ${
                currentIndex === idx ? "w-6 bg-primary" : "w-2 bg-border hover:bg-ink-muted"
              }`}
            />
          ))}
        </div>

        {/* Prev / Next buttons */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handlePrev}
            aria-label="Previous slide"
            className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-border bg-surface text-ink hover:bg-surface-subtle transition-colors cursor-pointer"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={handleNext}
            aria-label="Next slide"
            className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-border bg-surface text-ink hover:bg-surface-subtle transition-colors cursor-pointer"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
