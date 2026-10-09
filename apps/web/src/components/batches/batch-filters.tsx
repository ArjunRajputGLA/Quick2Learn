"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { RotateCcw, X, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

interface BatchFiltersProps {
  currentFilters: {
    classLevel?: number;
    board?: string;
    subjectSlug?: string;
    mode?: string;
    status?: string;
  };
  totalCount: number;
}

export function BatchFilters({ currentFilters, totalCount }: BatchFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const updateFilter = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "all") {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const clearFilters = () => {
    router.push(pathname, { scroll: false });
  };

  const hasActiveFilters = Boolean(
    currentFilters.classLevel ||
      (currentFilters.board && currentFilters.board !== "all") ||
      (currentFilters.subjectSlug && currentFilters.subjectSlug !== "all") ||
      (currentFilters.mode && currentFilters.mode !== "all") ||
      (currentFilters.status && currentFilters.status !== "all"),
  );

  const classOptions = [
    { label: "All Classes", value: "all" },
    { label: "Class IX", value: "9" },
    { label: "Class X", value: "10" },
    { label: "Class XI", value: "11" },
    { label: "Class XII", value: "12" },
  ];

  const boardOptions = [
    { label: "All Boards", value: "all" },
    { label: "CBSE", value: "cbse" },
    { label: "ICSE / ISC", value: "icse" },
  ];

  const subjectOptions = [
    { label: "All Subjects", value: "all" },
    { label: "Mathematics", value: "mathematics" },
    { label: "Chemistry & Sciences", value: "chemistry" },
  ];

  const modeOptions = [
    { label: "All Modes", value: "all" },
    { label: "Offline (Campus)", value: "offline" },
    { label: "Hybrid", value: "hybrid" },
    { label: "Online Live", value: "online" },
  ];

  return (
    <div className="rounded-2xl border border-border/80 bg-surface shadow-xs p-5 md:p-6 mb-8 space-y-5">
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border/70">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-primary-soft text-primary flex items-center justify-center">
            <SlidersHorizontal className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-small font-bold text-ink">Find Your Ideal Batch</h2>
            <p className="text-[12px] text-ink-muted">
              Showing <span className="font-semibold text-primary">{totalCount}</span> batch{totalCount === 1 ? "" : "es"} for Session 2026–27
            </p>
          </div>
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-caption font-semibold text-ink-muted hover:text-danger hover:bg-danger/10 border border-border/70 transition-colors cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset all filters</span>
          </button>
        )}
      </div>

      {/* Primary Filter: Target Class (Segmented Tabs) */}
      <div className="space-y-2">
        <label className="text-[11px] font-bold uppercase tracking-wider text-ink-muted">
          Select Target Class
        </label>
        <div className="flex flex-wrap gap-2">
          {classOptions.map((c) => {
            const isSelected =
              c.value === "all"
                ? !currentFilters.classLevel
                : String(currentFilters.classLevel) === c.value;
            return (
              <button
                key={c.value}
                type="button"
                onClick={() => updateFilter("class", c.value)}
                className={cn(
                  "px-4 py-2 rounded-xl text-small font-medium transition-all cursor-pointer",
                  isSelected
                    ? "bg-primary text-white font-semibold shadow-xs ring-2 ring-primary/20"
                    : "bg-surface-subtle/70 text-ink border border-border/80 hover:bg-surface hover:border-primary/40",
                )}
              >
                {c.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Secondary Filters Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
        {/* Board Filter */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold uppercase tracking-wider text-ink-muted">
            Board Curriculum
          </label>
          <div className="relative">
            <select
              value={currentFilters.board || "all"}
              onChange={(e) => updateFilter("board", e.target.value)}
              className="w-full appearance-none rounded-xl border border-border/80 bg-surface-subtle/50 px-3.5 py-2 pr-8 text-small font-medium text-ink hover:bg-surface focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer"
            >
              {boardOptions.map((b) => (
                <option key={b.value} value={b.value}>
                  {b.label}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted">
              ▼
            </div>
          </div>
        </div>

        {/* Subject Filter */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold uppercase tracking-wider text-ink-muted">
            Subject
          </label>
          <div className="relative">
            <select
              value={currentFilters.subjectSlug || "all"}
              onChange={(e) => updateFilter("subject", e.target.value)}
              className="w-full appearance-none rounded-xl border border-border/80 bg-surface-subtle/50 px-3.5 py-2 pr-8 text-small font-medium text-ink hover:bg-surface focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer"
            >
              {subjectOptions.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted">
              ▼
            </div>
          </div>
        </div>

        {/* Learning Mode */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold uppercase tracking-wider text-ink-muted">
            Delivery Mode
          </label>
          <div className="relative">
            <select
              value={currentFilters.mode || "all"}
              onChange={(e) => updateFilter("mode", e.target.value)}
              className="w-full appearance-none rounded-xl border border-border/80 bg-surface-subtle/50 px-3.5 py-2 pr-8 text-small font-medium text-ink hover:bg-surface focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer"
            >
              {modeOptions.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted">
              ▼
            </div>
          </div>
        </div>

        {/* Status: Admissions Open Quick Toggle */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold uppercase tracking-wider text-ink-muted">
            Enrollment Status
          </label>
          <button
            type="button"
            onClick={() =>
              updateFilter("status", currentFilters.status === "open" ? "all" : "open")
            }
            className={cn(
              "w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-small font-medium border transition-all cursor-pointer",
              currentFilters.status === "open"
                ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-800 font-semibold"
                : "bg-surface-subtle/50 border-border/80 text-ink hover:bg-surface",
            )}
          >
            <span>Admissions Open Only</span>
            <span
              className={cn(
                "h-4 w-4 rounded-full flex items-center justify-center text-[10px]",
                currentFilters.status === "open"
                  ? "bg-emerald-600 text-white"
                  : "border border-border",
              )}
            >
              {currentFilters.status === "open" ? "✓" : ""}
            </span>
          </button>
        </div>
      </div>

      {/* Active Filter Pills Strip */}
      {hasActiveFilters && (
        <div className="pt-2 flex flex-wrap items-center gap-2 border-t border-border/50 text-[12px]">
          <span className="font-semibold text-ink-muted">Active:</span>
          {currentFilters.classLevel && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-primary-soft text-primary font-medium">
              Class {currentFilters.classLevel}
              <button
                type="button"
                onClick={() => updateFilter("class", "all")}
                className="hover:opacity-75 cursor-pointer"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {currentFilters.board && currentFilters.board !== "all" && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-primary-soft text-primary font-medium">
              Board: {currentFilters.board.toUpperCase()}
              <button
                type="button"
                onClick={() => updateFilter("board", "all")}
                className="hover:opacity-75 cursor-pointer"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {currentFilters.subjectSlug && currentFilters.subjectSlug !== "all" && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-primary-soft text-primary font-medium">
              Subject: {currentFilters.subjectSlug}
              <button
                type="button"
                onClick={() => updateFilter("subject", "all")}
                className="hover:opacity-75 cursor-pointer"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {currentFilters.mode && currentFilters.mode !== "all" && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-primary-soft text-primary font-medium">
              Mode: {currentFilters.mode}
              <button
                type="button"
                onClick={() => updateFilter("mode", "all")}
                className="hover:opacity-75 cursor-pointer"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {currentFilters.status === "open" && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-800 font-medium">
              Admissions Open
              <button
                type="button"
                onClick={() => updateFilter("status", "all")}
                className="hover:opacity-75 cursor-pointer"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
}
