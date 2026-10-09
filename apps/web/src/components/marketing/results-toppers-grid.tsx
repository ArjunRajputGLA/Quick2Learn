"use client";

import { useState, useMemo } from "react";
import { Filter, Trophy, CheckCircle2, Award } from "lucide-react";

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

function cleanText(str?: string | null): string {
  if (!str) return "";
  return str.replace(/\s*\[PLACEHOLDER\]/gi, "").trim();
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] || "";
  const second = parts[1]?.[0] || "";
  return (first + second || name[0] || "S").toUpperCase();
}

export function ResultsToppersGrid({ initialResults }: ResultsToppersGridProps) {
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [selectedExam, setSelectedExam] = useState<string>("all");

  // Sanitize and deduplicate incoming results in case of duplicates
  const sanitizedResults = useMemo(() => {
    const map = new Map<string, TopperResultItem>();
    for (const r of initialResults) {
      const cleanName = cleanText(r.studentName);
      const cleanExam = cleanText(r.exam);
      const cleanScore = cleanText(r.scoreText);
      const key = `${cleanName.toLowerCase()}-${cleanExam.toLowerCase()}-${r.year}`;

      if (!map.has(key)) {
        map.set(key, {
          ...r,
          studentName: cleanName,
          exam: cleanExam,
          scoreText: cleanScore,
        });
      }
    }
    return Array.from(map.values());
  }, [initialResults]);

  // Derive unique years and exams
  const years = useMemo(() => {
    const set = new Set<number>();
    for (const r of sanitizedResults) {
      if (r.year) set.add(r.year);
    }
    return Array.from(set).sort((a, b) => b - a);
  }, [sanitizedResults]);

  const exams = useMemo(() => {
    const set = new Set<string>();
    for (const r of sanitizedResults) {
      if (r.exam) {
        set.add(r.exam);
      }
    }
    return Array.from(set).sort();
  }, [sanitizedResults]);

  // Filtered results
  const filtered = useMemo(() => {
    return sanitizedResults.filter((r) => {
      const matchYear =
        selectedYear === "all" || r.year.toString() === selectedYear;
      const matchExam = selectedExam === "all" || r.exam === selectedExam;
      return matchYear && matchExam;
    });
  }, [sanitizedResults, selectedYear, selectedExam]);

  return (
    <div className="space-y-6">
      {/* Filter Controls Bar */}
      <div className="rounded-2xl border border-border/80 bg-surface p-4 sm:p-5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 shadow-xs">
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
              className={`px-3 py-1 rounded-full text-caption font-semibold transition-all ${
                selectedYear === "all"
                  ? "bg-primary text-white shadow-xs"
                  : "bg-surface-subtle border border-border/80 text-ink-muted hover:border-ink hover:text-ink"
              }`}
            >
              All Years
            </button>
            {years.map((y) => (
              <button
                key={y}
                type="button"
                onClick={() => setSelectedYear(y.toString())}
                className={`px-3 py-1 rounded-full text-caption font-semibold transition-all ${
                  selectedYear === y.toString()
                    ? "bg-primary text-white shadow-xs"
                    : "bg-surface-subtle border border-border/80 text-ink-muted hover:border-ink hover:text-ink"
                }`}
              >
                {y}
              </button>
            ))}
          </div>

          <div className="hidden md:block h-5 w-px bg-border/80 mx-1" />

          {/* Exam Filter Dropdown / Chips */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-caption text-ink-muted mr-1 font-medium">Exam:</span>
            <button
              type="button"
              onClick={() => setSelectedExam("all")}
              className={`px-3 py-1 rounded-full text-caption font-semibold transition-all ${
                selectedExam === "all"
                  ? "bg-primary text-white shadow-xs"
                  : "bg-surface-subtle border border-border/80 text-ink-muted hover:border-ink hover:text-ink"
              }`}
            >
              All Exams
            </button>
            {exams.map((exam) => (
              <button
                key={exam}
                type="button"
                onClick={() => setSelectedExam(exam)}
                className={`px-3 py-1 rounded-full text-caption font-semibold transition-all ${
                  selectedExam === exam
                    ? "bg-primary text-white shadow-xs"
                    : "bg-surface-subtle border border-border/80 text-ink-muted hover:border-ink hover:text-ink"
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
          Showing <strong className="text-ink font-semibold">{filtered.length}</strong> distinction scorer
          {filtered.length === 1 ? "" : "s"}
        </span>
        {(selectedYear !== "all" || selectedExam !== "all") && (
          <button
            type="button"
            onClick={() => {
              setSelectedYear("all");
              setSelectedExam("all");
            }}
            className="text-primary hover:underline font-semibold text-caption"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Grid of Toppers */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {filtered.map((r) => {
            const is100 = r.scoreText.includes("100");
            const is99 = r.scoreText.includes("99");
            const initials = getInitials(r.studentName);

            return (
              <div
                key={r.id}
                className={`group relative rounded-2xl border transition-all p-5 flex flex-col justify-between space-y-4 shadow-xs hover:shadow-card hover:-translate-y-0.5 ${
                  is100
                    ? "bg-linear-to-b from-amber-500/5 to-surface border-amber-500/30 hover:border-amber-500/50"
                    : is99
                      ? "bg-linear-to-b from-emerald-500/5 to-surface border-emerald-500/30 hover:border-emerald-500/50"
                      : "bg-surface border-border/80 hover:border-primary/40"
                }`}
              >
                <div className="space-y-3.5">
                  {/* Top Bar: Avatar & Score Badge */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`h-10 w-10 rounded-xl font-bold text-small flex items-center justify-center border shadow-xs ${
                          is100
                            ? "bg-amber-100 text-amber-900 border-amber-300"
                            : is99
                              ? "bg-emerald-100 text-emerald-900 border-emerald-300"
                              : "bg-primary-soft text-primary border-primary/20"
                        }`}
                      >
                        {initials}
                      </div>
                      <div>
                        <span className="text-[11px] font-bold text-ink-muted uppercase tracking-wider block">
                          Class {r.exam.includes("XII") || r.exam.includes("12") ? "XII" : "X"}
                        </span>
                        <span className="text-[12px] font-semibold text-primary">
                          Batch {r.year}
                        </span>
                      </div>
                    </div>

                    {/* Score Badge */}
                    <div
                      className={`px-2.5 py-1 rounded-xl text-small font-black tracking-tight flex items-center gap-1 shadow-xs border ${
                        is100
                          ? "bg-linear-to-r from-amber-500 to-amber-400 text-slate-950 border-amber-300"
                          : is99
                            ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                            : "bg-blue-50 text-blue-800 border-blue-200"
                      }`}
                    >
                      {is100 && <Trophy className="h-3.5 w-3.5 text-slate-950 shrink-0" />}
                      <span>{r.scoreText}</span>
                    </div>
                  </div>

                  {/* Student Name & Exam Details */}
                  <div className="space-y-1">
                    <h3 className="font-bold text-[17px] text-ink group-hover:text-primary transition-colors leading-snug">
                      {r.studentName}
                    </h3>
                    <p className="text-small text-ink-muted font-medium">
                      {r.exam}
                    </p>
                  </div>
                </div>

                {/* Footer Strip */}
                <div className="pt-3 border-t border-border/60 flex items-center justify-between text-caption">
                  <div className="flex items-center gap-1.5 text-emerald-700 font-semibold bg-emerald-50/80 px-2 py-0.5 rounded-md border border-emerald-200/60">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    <span>Verified Score</span>
                  </div>

                  {is100 && (
                    <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wide">
                      Centum Scorer
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-border/80 bg-surface-subtle p-10 text-center space-y-3">
          <Award className="h-8 w-8 text-ink-muted mx-auto" />
          <p className="text-body text-ink-muted font-medium">
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
