"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { ChevronDown, Video, Calendar, Award, Sparkles, LayoutGrid } from "lucide-react";
import { type MegaMenuData } from "@/server/data/catalog";
import { cn } from "@/lib/utils";

interface MegaMenuProps {
  data: MegaMenuData;
  className?: string;
}

export function MegaMenu({ data, className }: MegaMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

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

  return (
    <div ref={containerRef} className={cn("relative inline-block", className)}>
      {/* Explore Button (Coursera style) */}
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="Explore courses and classes"
        className={cn(
          "flex items-center gap-2 px-3.5 py-2 rounded-md font-medium text-small transition-all cursor-pointer border select-none",
          isOpen
            ? "bg-primary text-surface border-primary shadow-xs"
            : "bg-surface text-ink border-border hover:bg-surface-subtle hover:border-ink-muted/40",
        )}
      >
        <LayoutGrid className={cn("h-4 w-4", isOpen ? "text-surface" : "text-primary")} />
        <span>Explore</span>
        <ChevronDown
          className={cn(
            "h-4 w-4 transition-transform duration-200",
            isOpen && "rotate-180",
          )}
        />
      </button>

      {/* Desktop Mega-Menu Dropdown */}
      {isOpen && (
        <div
          role="region"
          aria-label="Explore Mega Menu"
          className="absolute left-0 top-full mt-2 z-50 w-[840px] max-w-[92vw] rounded-lg border border-border bg-surface shadow-2xl overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150"
        >
          <div className="grid grid-cols-12 divide-x divide-border">
            {/* Left 4 Columns: Class IX, X, XI, XII */}
            <div className="col-span-8 p-6">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-border">
                <span className="text-caption font-bold uppercase tracking-wider text-ink-muted">
                  Academic Classes & Curricula
                </span>
                <span className="text-[11px] font-medium text-ink-muted">
                  CBSE • ICSE • ISC
                </span>
              </div>

              <div className="grid grid-cols-4 gap-4">
                {data.classes.map((cls) => (
                  <div key={cls.classSlug} className="space-y-3">
                    <div className="flex items-center gap-1.5 font-bold text-small text-ink border-b border-border pb-1">
                      <span className="h-2 w-2 rounded-full bg-primary" />
                      <span>Class {cls.classRoman}</span>
                    </div>

                    <ul className="space-y-1.5">
                      {cls.subjects.map((sub) => (
                        <li key={sub.id}>
                          <Link
                            href={sub.href}
                            onClick={() => setIsOpen(false)}
                            className="group flex flex-col text-small text-ink-muted hover:text-primary transition-colors py-1"
                          >
                            <span className="font-medium group-hover:underline underline-offset-2">
                              {sub.name}
                            </span>
                            {sub.chapterCount !== undefined && sub.chapterCount > 0 && (
                              <span className="text-[11px] text-ink-muted/70">
                                {sub.chapterCount} chapters
                              </span>
                            )}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Side Panel: Fast Access & Institute Highlights */}
            <div className="col-span-4 bg-surface-subtle p-6 flex flex-col justify-between">
              <div className="space-y-4">
                <span className="text-caption font-bold uppercase tracking-wider text-ink-muted">
                  Direct Access
                </span>

                <div className="space-y-2">
                  <Link
                    href="/lectures"
                    onClick={() => setIsOpen(false)}
                    className="flex items-start gap-3 p-2.5 rounded-md hover:bg-surface border border-transparent hover:border-border transition-all group"
                  >
                    <div className="p-2 rounded-md bg-primary-soft text-primary group-hover:bg-primary group-hover:text-surface transition-colors shrink-0">
                      <Video className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="text-small font-semibold text-ink group-hover:text-primary block">
                        All free lectures
                      </span>
                      <span className="text-[11px] text-ink-muted leading-tight block">
                        YouTube video lessons by veteran mentors
                      </span>
                    </div>
                  </Link>

                  <Link
                    href="/batches"
                    onClick={() => setIsOpen(false)}
                    className="flex items-start gap-3 p-2.5 rounded-md hover:bg-surface border border-transparent hover:border-border transition-all group"
                  >
                    <div className="p-2 rounded-md bg-accent-soft text-accent group-hover:bg-accent group-hover:text-surface transition-colors shrink-0">
                      <Calendar className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="text-small font-semibold text-ink group-hover:text-accent block">
                        All batches
                      </span>
                      <span className="text-[11px] text-ink-muted leading-tight block">
                        Offline & online classroom coaching
                      </span>
                    </div>
                  </Link>

                  <Link
                    href="/results"
                    onClick={() => setIsOpen(false)}
                    className="flex items-start gap-3 p-2.5 rounded-md hover:bg-surface border border-transparent hover:border-border transition-all group"
                  >
                    <div className="p-2 rounded-md bg-emerald-50 text-success group-hover:bg-success group-hover:text-surface transition-colors shrink-0">
                      <Award className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="text-small font-semibold text-ink group-hover:text-success block">
                        Results
                      </span>
                      <span className="text-[11px] text-ink-muted leading-tight block">
                        Board toppers & 99+ percentile records
                      </span>
                    </div>
                  </Link>
                </div>
              </div>

              {/* Institute Mentorship Footer Callout */}
              <div className="pt-4 border-t border-border mt-4">
                <div className="flex items-center gap-1.5 text-caption font-semibold text-primary">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Faculty Mentors</span>
                </div>
                <p className="text-[11px] text-ink-muted mt-1 leading-relaxed">
                  Mr. Dinesh Singh Rajput (Mathematics) &amp; Mrs. Namita Singh Rajput (Sciences).
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
