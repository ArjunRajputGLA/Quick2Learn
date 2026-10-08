"use client";

import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Medal, Filter } from "lucide-react";

export interface TopperResultItem {
  id: string;
  studentName: string;
  exam: string;
  year: number;
  scoreText: string;
  isFeatured: boolean;
}

interface ResultsToppersGridProps {
  initialResults: TopperResultItem[];
}

export function ResultsToppersGrid({ initialResults }: ResultsToppersGridProps) {
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [selectedExam, setSelectedExam] = useState<string>("all");

  // Derive unique years and exams
  const years = useMemo(() => {
    const set = new Set<number>();
    for (const r of initialResults) {
      if (r.year) set.add(r.year);
    }
    return Array.from(set).sort((a, b) => b - a);
  }, [initialResults]);

  const exams = useMemo(() => {
    const set = new Set<string>();
    for (const r of initialResults) {
      if (r.exam) {
        // Clean placeholder tag if present for filter labels
        const cleanExam = r.exam.replace(/\s*\[PLACEHOLDER\]/gi, "").trim();
        set.add(cleanExam);
      }
    }
    return Array.from(set).sort();
  }, [initialResults]);

  // Filtered results
  const filtered = useMemo(() => {
    return initialResults.filter((r) => {
      const matchYear =
        selectedYear === "all" || r.year.toString() === selectedYear;

      const cleanExam = r.exam.replace(/\s*\[PLACEHOLDER\]/gi, "").trim();
      const matchExam = selectedExam === "all" || cleanExam === selectedExam;

      return matchYear && matchExam;
    });
  }, [initialResults, selectedYear, selectedExam]);

  return (
    <div className="space-y-6">
      {/* Filter Controls Bar */}
      <div className="rounded-xl border border-border bg-surface-subtle p-4 sm:p-5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-2 text-ink font-semibold text-small">
          <Filter className="h-4 w-4 text-primary" />
          <span>Filter Board Toppers:</span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Year Filter Chips */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-caption text-ink-muted mr-1 font-medium">Year:</span>
            <button
              type="button"
              onClick={() => setSelectedYear("all")}
              className={`px-3 py-1 rounded-full text-caption font-semibold transition-colors ${
                selectedYear === "all"
                  ? "bg-primary text-surface"
                  : "bg-surface border border-border text-ink-muted hover:border-ink hover:text-ink"
              }`}
            >
              All Years
            </button>
            {years.map((y) => (
              <button
                key={y}
                type="button"
                onClick={() => setSelectedYear(y.toString())}
                className={`px-3 py-1 rounded-full text-caption font-semibold transition-colors ${
                  selectedYear === y.toString()
                    ? "bg-primary text-surface"
                    : "bg-surface border border-border text-ink-muted hover:border-ink hover:text-ink"
                }`}
              >
                {y}
              </button>
            ))}
          </div>

          <div className="hidden md:block h-5 w-px bg-border mx-1" />

          {/* Exam Filter Dropdown / Chips */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-caption text-ink-muted mr-1 font-medium">Exam:</span>
            <button
              type="button"
              onClick={() => setSelectedExam("all")}
              className={`px-3 py-1 rounded-full text-caption font-semibold transition-colors ${
                selectedExam === "all"
                  ? "bg-primary text-surface"
                  : "bg-surface border border-border text-ink-muted hover:border-ink hover:text-ink"
              }`}
            >
              All Exams
            </button>
            {exams.map((exam) => (
              <button
                key={exam}
                type="button"
                onClick={() => setSelectedExam(exam)}
                className={`px-3 py-1 rounded-full text-caption font-semibold transition-colors ${
                  selectedExam === exam
                    ? "bg-primary text-surface"
                    : "bg-surface border border-border text-ink-muted hover:border-ink hover:text-ink"
                }`}
              >
                {exam}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Counter summary */}
      <div className="flex items-center justify-between text-caption text-ink-muted px-1">
        <span>
          Showing <strong className="text-ink font-semibold">{filtered.length}</strong> topper
          {filtered.length === 1 ? "" : "s"}
        </span>
        {(selectedYear !== "all" || selectedExam !== "all") && (
          <button
            type="button"
            onClick={() => {
              setSelectedYear("all");
              setSelectedExam("all");
            }}
            className="text-primary hover:underline font-medium"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Grid of Toppers */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {filtered.map((r) => {
            const isCentum = r.scoreText.includes("100") || r.scoreText.includes("99");
            return (
              <div
                key={r.id}
                className="rounded-xl border border-border bg-surface p-5 shadow-card hover:shadow-card-hover transition-all flex flex-col justify-between space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <h3 className="font-bold text-body text-ink">
                      {r.studentName}
                    </h3>
                    <p className="text-caption text-ink-muted">
                      {r.exam}
                    </p>
                  </div>
                  <Badge
                    variant={isCentum ? "accent" : "primary"}
                    className="shrink-0 text-small font-extrabold px-2.5 py-1"
                  >
                    {r.scoreText}
                  </Badge>
                </div>

                <div className="pt-2 border-t border-border flex items-center justify-between text-caption text-ink-muted">
                  <div className="flex items-center gap-1.5">
                    <Medal className="h-3.5 w-3.5 text-primary" />
                    <span>Batch {r.year}</span>
                  </div>
                  <span className="text-success font-semibold">Verified Score</span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border bg-surface-subtle p-8 text-center space-y-2">
          <p className="text-body text-ink-muted">
            No toppers found matching the selected year and examination filters.
          </p>
          <button
            type="button"
            onClick={() => {
              setSelectedYear("all");
              setSelectedExam("all");
            }}
            className="text-small font-semibold text-primary hover:underline"
          >
            Clear all filters
          </button>
        </div>
      )}
    </div>
  );
}
