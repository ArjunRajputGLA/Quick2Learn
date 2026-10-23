"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  ChevronDown,
  Video,
  Calendar,
  Award,
  Sparkles,
  BookOpen,
  ArrowRight,
} from "lucide-react";
import { type MegaMenuData } from "@/server/data/catalog";
import { cn } from "@/lib/utils";

interface MegaMenuProps {
  data: MegaMenuData;
  className?: string;
  onOpenEnquiry?: () => void;
}

export function MegaMenu({ data, className, onOpenEnquiry }: MegaMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
    }
    closeTimeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 150);
  };

  // Close on Escape or click outside
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    }

    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

  const classBadges: Record<string, { label: string; badge: string; color: string }> = {
    ix: { label: "Foundation", badge: "Class 9", color: "bg-sky-50 text-sky-700 border-sky-200" },
    x: { label: "Board Prep", badge: "Class 10", color: "bg-indigo-50 text-indigo-700 border-indigo-200 font-bold" },
    xi: { label: "Senior Sec", badge: "Class 11", color: "bg-purple-50 text-purple-700 border-purple-200" },
    xii: { label: "Target Board", badge: "Class 12", color: "bg-amber-50 text-amber-800 border-amber-200 font-bold" },
  };

  return (
    <div
      ref={containerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={cn("relative inline-block", className)}
    >
      {/* Explore Button (Coursera style: clean text button with chevron) */}
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="Explore courses and classes"
        className={cn(
          "flex items-center gap-1.5 py-1.5 px-2 rounded-md font-semibold text-small transition-colors cursor-pointer select-none",
          isOpen
            ? "text-primary font-bold"
            : "text-ink hover:text-primary",
        )}
      >
        <span>Explore</span>
        <ChevronDown
          className={cn(
            "h-4 w-4 transition-transform duration-200 stroke-[2.2]",
            isOpen && "rotate-180 text-primary",
          )}
        />
      </button>

      {/* Desktop Mega-Menu Dropdown */}
      {isOpen && (
        <div
          role="region"
          aria-label="Explore Mega Menu"
          className="absolute left-0 top-full mt-2.5 z-[1000] w-[880px] max-w-[95vw] rounded-xl border border-border bg-surface shadow-2xl overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150 before:content-[''] before:absolute before:-top-3 before:left-0 before:right-0 before:h-3"
        >
          <div className="grid grid-cols-12 divide-x divide-border">
            {/* Left 8 Columns: Class IX, X, XI, XII */}
            <div className="col-span-8 p-6">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-border">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-primary" />
                  <span className="text-caption font-bold uppercase tracking-wider text-ink">
                    Academic Classes &amp; Curricula
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-surface-subtle text-ink-muted border border-border">
                    CBSE &bull; ICSE &bull; ISC
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4">
                {data.classes.map((cls) => {
                  const meta = classBadges[cls.classSlug] || {
                    label: "Academic",
                    badge: `Class ${cls.classRoman}`,
                    color: "bg-surface-subtle text-ink",
                  };

                  return (
                    <div key={cls.classSlug} className="space-y-3">
                      <div className="pb-2 border-b border-border">
                        <span
                          className={cn(
                            "inline-block text-[11px] px-2 py-0.5 rounded border mb-1",
                            meta.color,
                          )}
                        >
                          {meta.badge}
                        </span>
                        <div className="font-bold text-small text-ink">
                          Class {cls.classRoman}
                        </div>
                      </div>

                      <ul className="space-y-1">
                        {cls.subjects.map((sub) => (
                          <li key={sub.id}>
                            <Link
                              href={sub.href}
                              onClick={() => setIsOpen(false)}
                              className="group flex flex-col text-small text-ink-muted hover:text-primary hover:bg-primary-soft/60 px-2 py-1.5 -mx-2 rounded-md transition-colors"
                            >
                              <span className="font-medium text-ink group-hover:text-primary">
                                {sub.name}
                              </span>
                              {sub.chapterCount !== undefined && sub.chapterCount > 0 && (
                                <span className="text-[11px] text-ink-muted">
                                  {sub.chapterCount} chapters
                                </span>
                              )}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Side Panel: Fast Access & Institute Highlights */}
            <div className="col-span-4 bg-surface-subtle/70 p-6 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-caption font-bold uppercase tracking-wider text-ink-muted">
                    Direct Access
                  </span>
                  <Link
                    href="/batches"
                    onClick={() => setIsOpen(false)}
                    className="text-[11px] font-semibold text-primary hover:underline inline-flex items-center gap-0.5"
                  >
                    <span>View all</span>
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>

                <div className="space-y-2">
                  <Link
                    href="/lectures"
                    onClick={() => setIsOpen(false)}
                    className="flex items-start gap-3 p-2.5 rounded-lg bg-surface hover:bg-primary-soft/40 border border-border/80 hover:border-primary/30 transition-all group shadow-2xs"
                  >
                    <div className="p-2 rounded-md bg-primary-soft text-primary group-hover:bg-primary group-hover:text-surface transition-colors shrink-0">
                      <Video className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-small font-semibold text-ink group-hover:text-primary block">
                          Free Lectures
                        </span>
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800">
                          FREE
                        </span>
                      </div>
                      <span className="text-[11px] text-ink-muted leading-tight block mt-0.5">
                        Recorded chapter lessons by veteran mentors
                      </span>
                    </div>
                  </Link>

                  <Link
                    href="/batches"
                    onClick={() => setIsOpen(false)}
                    className="flex items-start gap-3 p-2.5 rounded-lg bg-surface hover:bg-accent-soft/40 border border-border/80 hover:border-accent/40 transition-all group shadow-2xs"
                  >
                    <div className="p-2 rounded-md bg-accent-soft text-accent group-hover:bg-accent group-hover:text-surface transition-colors shrink-0">
                      <Calendar className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="text-small font-semibold text-ink group-hover:text-accent block">
                        Classroom Batches
                      </span>
                      <span className="text-[11px] text-ink-muted leading-tight block mt-0.5">
                        Offline &amp; online coaching in Mathura
                      </span>
                    </div>
                  </Link>

                  <Link
                    href="/results"
                    onClick={() => setIsOpen(false)}
                    className="flex items-start gap-3 p-2.5 rounded-lg bg-surface hover:bg-emerald-50 border border-border/80 hover:border-success/40 transition-all group shadow-2xs"
                  >
                    <div className="p-2 rounded-md bg-emerald-50 text-success group-hover:bg-success group-hover:text-surface transition-colors shrink-0">
                      <Award className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="text-small font-semibold text-ink group-hover:text-success block">
                        Toppers &amp; Results
                      </span>
                      <span className="text-[11px] text-ink-muted leading-tight block mt-0.5">
                        98.6% Board top score &amp; 99+ percentiles
                      </span>
                    </div>
                  </Link>
                </div>
              </div>

              {/* Institute Mentorship & Demo Callout */}
              <div className="pt-4 border-t border-border mt-4">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5 text-caption font-bold text-primary">
                    <Sparkles className="h-3.5 w-3.5 text-accent" />
                    <span>Expert Faculty Guidance</span>
                  </div>
                </div>
                <p className="text-[11px] text-ink-muted leading-relaxed mb-3">
                  Mr. Dinesh Singh Rajput (Maths) &amp; Mrs. Namita Singh Rajput (Sciences).
                </p>

                {onOpenEnquiry ? (
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      onOpenEnquiry();
                    }}
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-md bg-primary text-surface text-small font-semibold hover:bg-primary-hover transition-colors shadow-2xs cursor-pointer"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-accent" />
                    <span>Book Free Demo Class</span>
                  </button>
                ) : (
                  <Link
                    href="/batches"
                    onClick={() => setIsOpen(false)}
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-md bg-primary text-surface text-small font-semibold hover:bg-primary-hover transition-colors shadow-2xs"
                  >
                    <span>Explore Batches</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
