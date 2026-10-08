"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CarouselTab {
  id: string;
  label: string;
}

export interface CardCarouselProps {
  heading: string;
  tabs?: CarouselTab[];
  activeTabId?: string;
  onTabChange?: (tabId: string) => void;
  viewAllHref?: string;
  viewAllText?: string;
  children: React.ReactNode;
  className?: string;
}

export function CardCarousel({
  heading,
  tabs,
  activeTabId,
  onTabChange,
  viewAllHref,
  viewAllText = "View all",
  children,
  className,
}: CardCarouselProps) {
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = React.useState(false);
  const [canScrollRight, setCanScrollRight] = React.useState(true);

  const checkScroll = React.useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 10);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 10);
  }, []);

  React.useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener("scroll", checkScroll, { passive: true });
    window.addEventListener("resize", checkScroll);
    return () => {
      el.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, [checkScroll]);

  const scrollByDistance = (direction: "left" | "right") => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const scrollAmount = el.clientWidth * 0.75;
    el.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      scrollByDistance("left");
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      scrollByDistance("right");
    }
  };

  return (
    <div className={cn("w-full space-y-4", className)}>
      {/* Top Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pb-1 border-b border-border/60">
        <div className="space-y-2">
          <h3 className="text-h2 font-semibold text-ink">{heading}</h3>

          {/* Optional Tabs */}
          {tabs && tabs.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-1">
              {tabs.map((tab) => {
                const isActive = tab.id === activeTabId;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => onTabChange?.(tab.id)}
                    className={cn(
                      "rounded-full px-3 py-1 text-caption font-medium transition-colors select-none cursor-pointer",
                      isActive
                        ? "bg-primary text-surface"
                        : "bg-surface text-ink-muted hover:text-ink hover:bg-surface-subtle border border-border/80",
                    )}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right side controls: view all and desktop arrows */}
        <div className="flex items-center gap-3 self-end sm:self-auto">
          {viewAllHref && (
            <Link
              href={viewAllHref}
              className="inline-flex items-center gap-1 text-small font-semibold text-primary hover:text-primary-hover hover:underline"
            >
              <span>{viewAllText}</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}

          {/* Prev/Next buttons on desktop */}
          <div className="hidden sm:flex items-center gap-1 pl-2">
            <button
              type="button"
              onClick={() => scrollByDistance("left")}
              disabled={!canScrollLeft}
              aria-label="Previous items"
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border bg-surface text-ink shadow-xs hover:bg-surface-subtle disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => scrollByDistance("right")}
              disabled={!canScrollRight}
              aria-label="Next items"
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border bg-surface text-ink shadow-xs hover:bg-surface-subtle disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Horizontally scrolling row */}
      <div
        ref={scrollContainerRef}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        aria-label={`${heading} carousel`}
        className="flex gap-5 overflow-x-auto snap-x snap-mandatory py-2 px-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md no-scrollbar"
      >
        {React.Children.map(children, (child) => (
          <div className="snap-start shrink-0 w-[280px] sm:w-[320px] md:w-[360px]">
            {child}
          </div>
        ))}
      </div>
    </div>
  );
}
