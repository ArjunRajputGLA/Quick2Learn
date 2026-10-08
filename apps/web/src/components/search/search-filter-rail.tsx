"use client";

import { useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Sheet, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { SlidersHorizontal, RotateCcw } from "lucide-react";

interface SearchFilterRailProps {
  activeFilters: {
    classLevel?: number | null;
    board?: string | null;
    subjectSlug?: string | null;
    type?: string;
    duration?: string;
    sort?: string;
  };
  totalCount: number;
}

export function SearchFilterRail({ activeFilters, totalCount }: SearchFilterRailProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [mobileOpen, setMobileOpen] = useState(false);

  const updateParam = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "all") {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    // Reset to page 1 on filter change
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  };

  const clearAllFilters = () => {
    const params = new URLSearchParams();
    const currentQ = searchParams.get("q");
    if (currentQ) params.set("q", currentQ);
    router.push(`${pathname}?${params.toString()}`);
  };

  // Count active filters (excluding default sort & query)
  const activeCount = [
    activeFilters.classLevel,
    activeFilters.board,
    activeFilters.subjectSlug,
    activeFilters.type && activeFilters.type !== "all" ? activeFilters.type : null,
    activeFilters.duration && activeFilters.duration !== "all" ? activeFilters.duration : null,
  ].filter(Boolean).length;

  const FilterContent = (
    <div className="space-y-6">
      {/* Header and Reset */}
      <div className="flex items-center justify-between pb-3 border-b border-border">
        <h3 className="font-bold text-body text-ink flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-primary" />
          <span>Filters</span>
          {activeCount > 0 && (
            <Badge variant="primary" className="ml-1 text-[11px] h-5 w-5 p-0 justify-center">
              {activeCount}
            </Badge>
          )}
        </h3>
        {activeCount > 0 && (
          <button
            type="button"
            onClick={clearAllFilters}
            className="flex items-center gap-1 text-caption font-semibold text-primary hover:underline cursor-pointer"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* 1. Class Filter */}
      <div className="space-y-2.5">
        <label className="text-caption font-bold uppercase tracking-wider text-ink-muted">
          Class
        </label>
        <div className="flex flex-wrap gap-1.5">
          {[
            { label: "All", value: "all" },
            { label: "IX", value: "9" },
            { label: "X", value: "10" },
            { label: "XI", value: "11" },
            { label: "XII", value: "12" },
          ].map((item) => {
            const isSelected =
              item.value === "all"
                ? !activeFilters.classLevel
                : String(activeFilters.classLevel) === item.value;
            return (
              <button
                key={item.value}
                type="button"
                onClick={() => updateParam("class", item.value)}
                className={`px-3 py-1 rounded-md text-small font-medium transition-colors cursor-pointer border ${
                  isSelected
                    ? "bg-primary text-surface border-primary font-semibold shadow-xs"
                    : "bg-surface text-ink border-border hover:bg-surface-subtle"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Board Filter */}
      <div className="space-y-2.5">
        <label className="text-caption font-bold uppercase tracking-wider text-ink-muted">
          Board
        </label>
        <div className="flex flex-wrap gap-1.5">
          {[
            { label: "All", value: "all" },
            { label: "CBSE", value: "cbse" },
            { label: "ICSE / ISC", value: "icse" },
          ].map((item) => {
            const isSelected =
              item.value === "all"
                ? !activeFilters.board
                : activeFilters.board === item.value;
            return (
              <button
                key={item.value}
                type="button"
                onClick={() => updateParam("board", item.value)}
                className={`px-3 py-1 rounded-md text-small font-medium transition-colors cursor-pointer border ${
                  isSelected
                    ? "bg-primary text-surface border-primary font-semibold shadow-xs"
                    : "bg-surface text-ink border-border hover:bg-surface-subtle"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Subject Filter */}
      <div className="space-y-2.5">
        <label className="text-caption font-bold uppercase tracking-wider text-ink-muted">
          Subject
        </label>
        <div className="flex flex-wrap gap-1.5">
          {[
            { label: "All", value: "all" },
            { label: "Mathematics", value: "mathematics" },
            { label: "Physics", value: "physics" },
            { label: "Chemistry", value: "chemistry" },
            { label: "Biology", value: "biology" },
          ].map((item) => {
            const isSelected =
              item.value === "all"
                ? !activeFilters.subjectSlug
                : activeFilters.subjectSlug === item.value;
            return (
              <button
                key={item.value}
                type="button"
                onClick={() => updateParam("subject", item.value)}
                className={`px-3 py-1 rounded-md text-small font-medium transition-colors cursor-pointer border ${
                  isSelected
                    ? "bg-primary text-surface border-primary font-semibold shadow-xs"
                    : "bg-surface text-ink border-border hover:bg-surface-subtle"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Type Filter */}
      <div className="space-y-2.5">
        <label className="text-caption font-bold uppercase tracking-wider text-ink-muted">
          Resource Type
        </label>
        <div className="flex flex-col gap-1.5">
          {[
            { label: "All Types", value: "all" },
            { label: "Free Video Lectures", value: "lecture" },
            { label: "Coaching Batches", value: "batch" },
            { label: "Public Notes & PYQs", value: "notes" },
          ].map((item) => {
            const isSelected =
              item.value === "all"
                ? !activeFilters.type || activeFilters.type === "all"
                : activeFilters.type === item.value;
            return (
              <button
                key={item.value}
                type="button"
                onClick={() => updateParam("type", item.value)}
                className={`text-left px-3 py-2 rounded-md text-small font-medium transition-colors cursor-pointer border ${
                  isSelected
                    ? "bg-primary-soft text-primary border-primary font-semibold"
                    : "bg-surface text-ink border-border hover:bg-surface-subtle"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. Duration Filter */}
      <div className="space-y-2.5">
        <label className="text-caption font-bold uppercase tracking-wider text-ink-muted">
          Video Duration
        </label>
        <div className="flex flex-col gap-1.5">
          {[
            { label: "Any Duration", value: "all" },
            { label: "Under 10 mins (Shorts & Concepts)", value: "under10" },
            { label: "10–30 mins (Problem Sessions)", value: "10to30" },
            { label: "30+ mins (Complete Chapters)", value: "30plus" },
          ].map((item) => {
            const isSelected =
              item.value === "all"
                ? !activeFilters.duration || activeFilters.duration === "all"
                : activeFilters.duration === item.value;
            return (
              <button
                key={item.value}
                type="button"
                onClick={() => updateParam("duration", item.value)}
                className={`text-left px-3 py-1.5 rounded-md text-small font-medium transition-colors cursor-pointer border ${
                  isSelected
                    ? "bg-primary-soft text-primary border-primary font-semibold"
                    : "bg-surface text-ink border-border hover:bg-surface-subtle"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Sheet Trigger */}
      <div className="lg:hidden flex items-center justify-between pb-4 border-b border-border mb-6">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-border bg-surface text-ink text-small font-semibold shadow-xs hover:bg-surface-subtle cursor-pointer"
        >
          <SlidersHorizontal className="h-4 w-4 text-primary" />
          <span>Filters &amp; Refine</span>
          {activeCount > 0 && (
            <Badge variant="primary" className="ml-1 text-[11px] h-5 w-5 p-0 justify-center">
              {activeCount}
            </Badge>
          )}
        </button>

        <span className="text-small text-ink-muted font-medium">
          {totalCount} {totalCount === 1 ? "result" : "results"}
        </span>
      </div>

      {/* Mobile Drawer Sheet */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen} side="left">
        <SheetHeader>
          <SheetTitle>Filter Catalog</SheetTitle>
        </SheetHeader>
        <div className="overflow-y-auto flex-1 pr-1">
          {FilterContent}
        </div>
      </Sheet>

      {/* Desktop Left Filter Rail */}
      <aside className="hidden lg:block w-72 shrink-0 p-5 rounded-xl border border-border bg-surface shadow-xs sticky top-20 self-start">
        {FilterContent}
      </aside>
    </>
  );
}
