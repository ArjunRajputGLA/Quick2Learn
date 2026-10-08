"use client";

import { useState, useEffect, useRef, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, X, Video, Calendar, BookOpen, Loader2, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface SearchResultItem {
  id: string;
  type: "lecture" | "batch" | "chapter";
  title: string;
  subtitle?: string | null;
  href: string;
  badge?: string;
  duration?: string;
}

interface TypeaheadApiResponse {
  lectures: Array<{
    id: string;
    title: string;
    durationSeconds: number;
    thumbnailUrl: string | null;
    classLevel: number | null;
  }>;
  batches: Array<{
    id: string;
    slug: string;
    title: string;
    subtitle: string | null;
    classLevel: number;
    board: string;
    mode: string;
  }>;
  chapters: Array<{
    id: string;
    slug: string;
    title: string;
    number: number;
    classLevel: number;
    board: string | null;
    subjectSlug: string | null;
    subjectName: string | null;
  }>;
  query: string;
}

interface SearchTypeaheadProps {
  className?: string;
  isMobileModal?: boolean;
  onNavigate?: () => void;
  autoFocus?: boolean;
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  return `${mins}m`;
}

function classLevelToSlug(level: number): string {
  switch (level) {
    case 9:
      return "ix";
    case 10:
      return "x";
    case 11:
      return "xi";
    case 12:
      return "xii";
    default:
      return String(level);
  }
}

export function SearchTypeahead({
  className,
  isMobileModal = false,
  onNavigate,
  autoFocus = false,
}: SearchTypeaheadProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState("");
  const [data, setData] = useState<TypeaheadApiResponse | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  // Flatten items for keyboard navigation
  const flatItems: SearchResultItem[] = [];

  if (data) {
    for (const lec of data.lectures) {
      flatItems.push({
        id: `lec-${lec.id}`,
        type: "lecture",
        title: lec.title,
        href: `/lectures`,
        badge: lec.classLevel ? `Class ${lec.classLevel}` : undefined,
        duration: lec.durationSeconds > 0 ? formatDuration(lec.durationSeconds) : undefined,
      });
    }

    for (const b of data.batches) {
      flatItems.push({
        id: `batch-${b.id}`,
        type: "batch",
        title: b.title,
        subtitle: b.subtitle,
        href: `/batches`,
        badge: `Class ${b.classLevel} • ${b.mode.toUpperCase()}`,
      });
    }

    for (const ch of data.chapters) {
      const clsSlug = classLevelToSlug(ch.classLevel);
      const subSlug = ch.subjectSlug || "mathematics";
      flatItems.push({
        id: `chap-${ch.id}`,
        type: "chapter",
        title: ch.title,
        subtitle: ch.subjectName ? `${ch.subjectName} • Ch ${ch.number}` : `Ch ${ch.number}`,
        href: `/learn/${clsSlug}/${subSlug}`,
        badge: `Class ${ch.classLevel}`,
      });
    }
  }

  // Handle outside click to close
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced fetch (250 ms)
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setData(null);
      setIsLoading(false);
      setIsOpen(false);
      setActiveIndex(-1);
      return;
    }

    setIsLoading(true);
    const controller = new AbortController();

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search/typeahead?q=${encodeURIComponent(trimmed)}`, {
          signal: controller.signal,
        });
        if (res.ok) {
          const json = await res.json();
          setData(json);
          setIsOpen(true);
          setActiveIndex(-1);
        }
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          console.error("Typeahead error:", err);
        }
      } finally {
        setIsLoading(false);
      }
    }, 250);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  const executeSearch = useCallback((searchTerm: string) => {
    const term = searchTerm.trim();
    if (!term) return;
    setIsOpen(false);
    onNavigate?.();
    startTransition(() => {
      router.push(`/search?q=${encodeURIComponent(term)}`);
    });
  }, [onNavigate, router]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setIsOpen(false);
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!isOpen && flatItems.length > 0) {
        setIsOpen(true);
      }
      setActiveIndex((prev) => (prev < flatItems.length - 1 ? prev + 1 : 0));
      return;
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : flatItems.length - 1));
      return;
    }

    if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex >= 0 && flatItems[activeIndex]) {
        const item = flatItems[activeIndex];
        setIsOpen(false);
        onNavigate?.();
        startTransition(() => {
          router.push(item.href);
        });
      } else {
        executeSearch(query);
      }
    }
  };

  const hasResults =
    data &&
    (data.lectures.length > 0 || data.batches.length > 0 || data.chapters.length > 0);

  return (
    <div
      ref={containerRef}
      className={cn("relative w-full max-w-lg", className)}
    >
      {/* Pill-shaped search form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          executeSearch(query);
        }}
        className="relative flex items-center w-full"
      >
        <div className="pointer-events-none absolute left-3.5 text-ink-muted">
          <Search className="h-4 w-4" />
        </div>

        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (query.trim().length >= 2 && data) {
              setIsOpen(true);
            }
          }}
          onKeyDown={handleKeyDown}
          autoFocus={autoFocus}
          placeholder="Search lectures, batches, chapters..."
          aria-label="Search Quick2Learn"
          aria-expanded={isOpen}
          aria-autocomplete="list"
          role="combobox"
          className={cn(
            "h-10 w-full rounded-full border border-border bg-surface pl-10 pr-20 text-small text-ink placeholder:text-ink-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all shadow-card hover:shadow-card-hover",
            isMobileModal && "h-12 text-body pl-11 pr-24",
          )}
        />

        <div className="absolute right-1.5 flex items-center gap-1">
          {isLoading && (
            <Loader2 className="h-4 w-4 animate-spin text-primary mr-1" />
          )}

          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setData(null);
                setIsOpen(false);
                inputRef.current?.focus();
              }}
              aria-label="Clear search input"
              className="p-1 rounded-full text-ink-muted hover:text-ink hover:bg-surface-subtle transition-colors cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}

          <button
            type="submit"
            aria-label="Submit search"
            className="h-7 w-7 rounded-full bg-primary text-surface flex items-center justify-center hover:bg-primary-hover transition-colors shadow-xs cursor-pointer"
          >
            <Search className="h-3.5 w-3.5" />
          </button>
        </div>
      </form>

      {/* Typeahead Dropdown */}
      {isOpen && query.trim().length >= 2 && (
        <div
          role="listbox"
          className="absolute left-0 right-0 top-full mt-2 z-50 rounded-lg border border-border bg-surface shadow-xl overflow-hidden max-h-[75vh] overflow-y-auto animate-in fade-in-50 zoom-in-95 duration-150"
        >
          {hasResults ? (
            <div className="divide-y divide-border">
              {/* Group 1: Lectures (up to 5) */}
              {data.lectures.length > 0 && (
                <div className="p-2">
                  <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-ink-muted flex items-center gap-1.5">
                    <Video className="h-3.5 w-3.5 text-primary" />
                    <span>Free Lectures ({data.lectures.length})</span>
                  </div>
                  {data.lectures.map((lec) => {
                    const idx = flatItems.findIndex((it) => it.id === `lec-${lec.id}`);
                    const isSelected = activeIndex === idx;
                    return (
                      <Link
                        key={lec.id}
                        href="/lectures"
                        onClick={() => {
                          setIsOpen(false);
                          onNavigate?.();
                        }}
                        className={cn(
                          "flex items-center justify-between gap-3 px-3 py-2 rounded-md text-small transition-colors",
                          isSelected
                            ? "bg-primary-soft text-primary font-medium"
                            : "text-ink hover:bg-surface-subtle",
                        )}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Video className="h-4 w-4 text-ink-muted shrink-0" />
                          <span className="truncate">{lec.title}</span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {lec.durationSeconds > 0 && (
                            <span className="text-caption text-ink-muted">
                              {formatDuration(lec.durationSeconds)}
                            </span>
                          )}
                          {lec.classLevel && (
                            <Badge variant="neutral" className="text-[10px] py-0 px-1.5">
                              Class {lec.classLevel}
                            </Badge>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}

              {/* Group 2: Batches (up to 3) */}
              {data.batches.length > 0 && (
                <div className="p-2">
                  <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-ink-muted flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-accent" />
                    <span>Batches ({data.batches.length})</span>
                  </div>
                  {data.batches.map((b) => {
                    const idx = flatItems.findIndex((it) => it.id === `batch-${b.id}`);
                    const isSelected = activeIndex === idx;
                    return (
                      <Link
                        key={b.id}
                        href="/batches"
                        onClick={() => {
                          setIsOpen(false);
                          onNavigate?.();
                        }}
                        className={cn(
                          "flex items-center justify-between gap-3 px-3 py-2 rounded-md text-small transition-colors",
                          isSelected
                            ? "bg-primary-soft text-primary font-medium"
                            : "text-ink hover:bg-surface-subtle",
                        )}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Calendar className="h-4 w-4 text-accent shrink-0" />
                          <div className="truncate">
                            <span className="block truncate font-medium">{b.title}</span>
                            {b.subtitle && (
                              <span className="block truncate text-caption text-ink-muted">
                                {b.subtitle}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <Badge variant="primary" className="text-[10px] py-0 px-1.5">
                            Class {b.classLevel}
                          </Badge>
                          <Badge variant="neutral" className="text-[10px] py-0 px-1.5 uppercase">
                            {b.mode}
                          </Badge>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}

              {/* Group 3: Chapters (up to 3) */}
              {data.chapters.length > 0 && (
                <div className="p-2">
                  <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-ink-muted flex items-center gap-1.5">
                    <BookOpen className="h-3.5 w-3.5 text-success" />
                    <span>Chapters ({data.chapters.length})</span>
                  </div>
                  {data.chapters.map((ch) => {
                    const idx = flatItems.findIndex((it) => it.id === `chap-${ch.id}`);
                    const isSelected = activeIndex === idx;
                    const clsSlug = classLevelToSlug(ch.classLevel);
                    const subSlug = ch.subjectSlug || "mathematics";
                    return (
                      <Link
                        key={ch.id}
                        href={`/learn/${clsSlug}/${subSlug}`}
                        onClick={() => {
                          setIsOpen(false);
                          onNavigate?.();
                        }}
                        className={cn(
                          "flex items-center justify-between gap-3 px-3 py-2 rounded-md text-small transition-colors",
                          isSelected
                            ? "bg-primary-soft text-primary font-medium"
                            : "text-ink hover:bg-surface-subtle",
                        )}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <BookOpen className="h-4 w-4 text-success shrink-0" />
                          <div className="truncate">
                            <span className="block truncate font-medium">{ch.title}</span>
                            <span className="block truncate text-caption text-ink-muted">
                              {ch.subjectName || "Subject"} • Chapter {ch.number}
                            </span>
                          </div>
                        </div>
                        <Badge variant="neutral" className="text-[10px] py-0 px-1.5 shrink-0">
                          Class {ch.classLevel}
                        </Badge>
                      </Link>
                    );
                  })}
                </div>
              )}

              {/* Footer: View all results */}
              <div className="p-2 bg-surface-subtle">
                <button
                  type="button"
                  onClick={() => executeSearch(query)}
                  className="w-full flex items-center justify-between px-3 py-2 text-small font-medium text-primary hover:bg-primary-soft/60 rounded-md transition-colors text-left cursor-pointer"
                >
                  <span>View all results for &ldquo;{query}&rdquo;</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="p-6 text-center">
              <p className="text-small text-ink-muted mb-3">
                No matching lectures, batches, or chapters found for &ldquo;{query}&rdquo;.
              </p>
              <button
                type="button"
                onClick={() => executeSearch(query)}
                className="inline-flex items-center gap-1.5 text-small font-medium text-primary hover:underline cursor-pointer"
              >
                <span>Search all courses for &ldquo;{query}&rdquo;</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
