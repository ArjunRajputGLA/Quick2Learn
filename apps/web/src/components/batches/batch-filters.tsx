"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Chip } from "@/components/ui/chip";
import { Badge } from "@/components/ui/badge";
import { RotateCcw, Filter } from "lucide-react";

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

  return (
    <div className="space-y-4 mb-8">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-primary" />
          <span className="text-small font-bold text-ink uppercase tracking-wider">
            Filter Batches
          </span>
          <Badge variant="primary" className="text-[11px] h-5 px-1.5 font-bold">
            {totalCount}
          </Badge>
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="inline-flex items-center gap-1.5 text-caption font-semibold text-primary hover:underline cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset all filters</span>
          </button>
        )}
      </div>

      {/* Filter Rows */}
      <div className="space-y-3">
        {/* Class Filter */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-caption font-semibold text-ink-muted w-16 shrink-0">
            Class:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {[
              { label: "All Classes", value: "all" },
              { label: "Class IX", value: "9" },
              { label: "Class X", value: "10" },
              { label: "Class XI", value: "11" },
              { label: "Class XII", value: "12" },
            ].map((c) => {
              const isSelected =
                c.value === "all"
                  ? !currentFilters.classLevel
                  : String(currentFilters.classLevel) === c.value;
              return (
                <Chip
                  key={c.value}
                  selected={isSelected}
                  onClick={() => updateFilter("class", c.value)}
                >
                  {c.label}
                </Chip>
              );
            })}
          </div>
        </div>

        {/* Board Filter */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-caption font-semibold text-ink-muted w-16 shrink-0">
            Board:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {[
              { label: "All Boards", value: "all" },
              { label: "CBSE", value: "cbse" },
              { label: "ICSE / ISC", value: "icse" },
            ].map((b) => {
              const isSelected =
                b.value === "all"
                  ? !currentFilters.board || currentFilters.board === "all"
                  : currentFilters.board === b.value;
              return (
                <Chip
                  key={b.value}
                  selected={isSelected}
                  onClick={() => updateFilter("board", b.value)}
                >
                  {b.label}
                </Chip>
              );
            })}
          </div>
        </div>

        {/* Subject Filter */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-caption font-semibold text-ink-muted w-16 shrink-0">
            Subject:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {[
              { label: "All Subjects", value: "all" },
              { label: "Mathematics", value: "mathematics" },
              { label: "Chemistry & Sciences", value: "chemistry" },
            ].map((s) => {
              const isSelected =
                s.value === "all"
                  ? !currentFilters.subjectSlug || currentFilters.subjectSlug === "all"
                  : currentFilters.subjectSlug === s.value;
              return (
                <Chip
                  key={s.value}
                  selected={isSelected}
                  onClick={() => updateFilter("subject", s.value)}
                >
                  {s.label}
                </Chip>
              );
            })}
          </div>
        </div>

        {/* Mode Filter */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-caption font-semibold text-ink-muted w-16 shrink-0">
            Mode:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {[
              { label: "All Modes", value: "all" },
              { label: "Offline (Campus)", value: "offline" },
              { label: "Hybrid", value: "hybrid" },
              { label: "Online Live", value: "online" },
            ].map((m) => {
              const isSelected =
                m.value === "all"
                  ? !currentFilters.mode || currentFilters.mode === "all"
                  : currentFilters.mode === m.value;
              return (
                <Chip
                  key={m.value}
                  selected={isSelected}
                  onClick={() => updateFilter("mode", m.value)}
                >
                  {m.label}
                </Chip>
              );
            })}
          </div>
        </div>

        {/* Status Filter */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-caption font-semibold text-ink-muted w-16 shrink-0">
            Status:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {[
              { label: "All", value: "all" },
              { label: "Admissions Open", value: "open" },
              { label: "Waitlist / Closed", value: "closed" },
            ].map((st) => {
              const isSelected =
                st.value === "all"
                  ? !currentFilters.status || currentFilters.status === "all"
                  : currentFilters.status === st.value;
              return (
                <Chip
                  key={st.value}
                  selected={isSelected}
                  onClick={() => updateFilter("status", st.value)}
                >
                  {st.label}
                </Chip>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
