"use client";

import * as React from "react";
import Image from "next/image";
import {
  Video,
  Clock,
  Eye,
  ThumbsUp,
  Search,
  X,
  Play,
  RotateCcw,
  ArrowRight,
  Calculator,
  FlaskConical,
} from "lucide-react";
import { YouTubeIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

export interface VideoItem {
  id: string;
  title: string;
  description?: string | null;
  thumbnailUrl?: string | null;
  durationSeconds: number;
  classLevel?: number | null;
  subjectId?: string | null;
  viewCount: number;
  likeCount: number;
  publishedAt?: Date | string | null;
}

interface LecturesCatalogProps {
  initialVideos: VideoItem[];
}

function formatCount(num: number): string {
  if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  }
  if (num >= 1_000) {
    return (num / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  }
  return num.toLocaleString();
}

function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return "15:00";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

export function LecturesCatalog({ initialVideos }: LecturesCatalogProps) {
  const [selectedClass, setSelectedClass] = React.useState<number | "all">("all");
  const [selectedSubject, setSelectedSubject] = React.useState<string>("all");
  const [searchQuery, setSearchQuery] = React.useState<string>("");

  const filteredVideos = React.useMemo(() => {
    return initialVideos.filter((v) => {
      // Class filter
      if (selectedClass !== "all" && v.classLevel !== selectedClass) {
        return false;
      }

      // Subject / Faculty filter
      const isMath =
        /math/i.test(v.title) ||
        /calculus|matrices|algebra|vector|integral|trig/i.test(v.title) ||
        /dinesh/i.test(v.title);
      const isScienceOrCivics =
        /science|chemistry|biology|civics|icse/i.test(v.title) ||
        /namita/i.test(v.title);

      if (selectedSubject === "math" && !isMath) return false;
      if (selectedSubject === "science" && !isScienceOrCivics) return false;

      // Text search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const titleMatch = v.title.toLowerCase().includes(q);
        const descMatch = (v.description || "").toLowerCase().includes(q);
        if (!titleMatch && !descMatch) return false;
      }

      return true;
    });
  }, [initialVideos, selectedClass, selectedSubject, searchQuery]);

  const clearFilters = () => {
    setSelectedClass("all");
    setSelectedSubject("all");
    setSearchQuery("");
  };

  const hasActiveFilters =
    selectedClass !== "all" || selectedSubject !== "all" || searchQuery.trim() !== "";

  return (
    <div className="space-y-8">
      {/* Search & Filter Toolbar */}
      <div className="rounded-2xl border border-border/80 bg-surface shadow-xs p-5 md:p-6 space-y-5">
        {/* Search Row */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pb-4 border-b border-border/70">
          <div className="relative flex-1 max-w-lg">
            <Search className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted" />
            <input
              type="text"
              placeholder="Search lectures (e.g. Matrices, Real Numbers, Civics)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-border/80 bg-surface-subtle/50 pl-10 pr-9 py-2.5 text-small text-ink placeholder:text-ink-muted/70 focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-3 text-small">
            <span className="text-ink-muted font-medium">
              Showing <span className="font-bold text-ink">{filteredVideos.length}</span> of{" "}
              {initialVideos.length} lectures
            </span>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-caption font-semibold text-danger hover:bg-danger/10 border border-danger/20 transition-colors"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter Controls Row */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          {/* Class Filters */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-ink-muted">
              Select Class:
            </span>
            <div className="flex flex-wrap gap-2">
              {[
                { label: "All Classes", value: "all" },
                { label: "Class XII", value: 12 },
                { label: "Class XI", value: 11 },
                { label: "Class X", value: 10 },
                { label: "Class IX", value: 9 },
              ].map((c) => {
                const isSelected = selectedClass === c.value;
                return (
                  <button
                    key={String(c.value)}
                    type="button"
                    onClick={() => setSelectedClass(c.value as number | "all")}
                    className={cn(
                      "px-3.5 py-1.5 rounded-xl text-small font-medium transition-all cursor-pointer",
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

          {/* Subject / Faculty Filters */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-ink-muted">
              Subject &amp; Mentor:
            </span>
            <div className="flex flex-wrap gap-2">
              {[
                {
                  label: "All Subjects",
                  value: "all",
                  icon: null,
                },
                {
                  label: "Mathematics (Dinesh Sir)",
                  value: "math",
                  icon: Calculator,
                },
                {
                  label: "Sciences & Civics (Namita Ma'am)",
                  value: "science",
                  icon: FlaskConical,
                },
              ].map((s) => {
                const isSelected = selectedSubject === s.value;
                const IconComponent = s.icon;
                return (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => setSelectedSubject(s.value)}
                    className={cn(
                      "inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-small font-medium transition-all cursor-pointer",
                      isSelected
                        ? "bg-primary text-white font-semibold shadow-xs ring-2 ring-primary/20"
                        : "bg-surface-subtle/70 text-ink border border-border/80 hover:bg-surface hover:border-primary/40",
                    )}
                  >
                    {IconComponent && <IconComponent className="h-3.5 w-3.5 shrink-0" />}
                    <span>{s.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Video Grid or Empty State */}
      {filteredVideos.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center space-y-4">
          <div className="h-12 w-12 rounded-full bg-primary-soft text-primary mx-auto flex items-center justify-center">
            <Video className="h-6 w-6" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-h4 font-bold text-ink">No Lectures Found</h3>
            <p className="text-small text-ink-muted">
              No video lectures match your current filters. Try selecting another class or clearing your search.
            </p>
          </div>
          <button
            type="button"
            onClick={clearFilters}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-small font-semibold shadow-xs hover:bg-primary-hover transition-colors"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Reset Filters</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7 lg:gap-8">
          {filteredVideos.map((v) => {
            const isDineshSir =
              /dinesh/i.test(v.title) ||
              /math/i.test(v.title) ||
              /calculus|matrices|vector|algebra/i.test(v.title);
            const isNamitaMaam =
              /namita/i.test(v.title) ||
              /science|chemistry|biology|civics/i.test(v.title);

            const facultyName = isDineshSir
              ? "Mr. Dinesh Singh Rajput"
              : isNamitaMaam
                ? "Mrs. Namita Singh Rajput"
                : "Quick2Learn Faculty";

            const facultyAvatar = isDineshSir
              ? "/images/assets/Dinesh Singh Rajput.jpeg"
              : isNamitaMaam
                ? "/images/faculty/namita-maam.jpg"
                : "/images/assets/Dinesh Singh Rajput.jpeg";

            const facultyBadge = isDineshSir
              ? "Senior Mathematics"
              : isNamitaMaam
                ? "ICSE Sciences & Civics"
                : "Board Mentor";

            const youtubeUrl = `https://www.youtube.com/watch?v=${v.id}`;

            return (
              <div
                key={v.id}
                className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-border/80 bg-surface shadow-xs hover:shadow-xl hover:border-primary/40 hover:-translate-y-1 transition-all duration-300"
              >
                <div>
                  {/* Video Thumbnail with Hover Play Button */}
                  <a
                    href={youtubeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative aspect-video block w-full bg-slate-950 overflow-hidden"
                  >
                    {v.thumbnailUrl ? (
                      <img
                        src={v.thumbnailUrl}
                        alt={v.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-slate-900 text-white/40">
                        <Video className="h-12 w-12" />
                      </div>
                    )}

                    {/* Dark gradient overlay on hover */}
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors" />

                    {/* Glowing Play Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-90 group-hover:opacity-100 transition-opacity">
                      <div className="h-12 w-12 rounded-full bg-red-600/90 text-white flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:bg-red-600 transition-transform">
                        <Play className="h-5 w-5 ml-0.5 fill-current" />
                      </div>
                    </div>

                    {/* Top Badges: Class pill */}
                    {v.classLevel && (
                      <span className="absolute top-3 left-3 rounded-md bg-black/75 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur-md border border-white/10 shadow-xs">
                        Class {v.classLevel}
                      </span>
                    )}

                    {/* Duration badge */}
                    <span className="absolute bottom-2.5 right-2.5 rounded-md bg-black/85 px-2 py-0.5 text-[11px] font-semibold text-white flex items-center gap-1 backdrop-blur-xs font-mono shadow-xs">
                      <Clock className="h-3 w-3 text-sky-400" />
                      {formatDuration(v.durationSeconds)}
                    </span>
                  </a>

                  {/* Card Content */}
                  <div className="p-5 space-y-3">
                    {/* Faculty Tag Row */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="relative h-6 w-6 rounded-full overflow-hidden border border-border shrink-0">
                          <Image
                            src={facultyAvatar}
                            alt={facultyName}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <span className="text-[12px] font-semibold text-ink truncate">
                          {facultyName}
                        </span>
                        <span className="hidden xl:inline text-[11px] text-ink-muted">
                          • {facultyBadge}
                        </span>
                      </div>

                      {/* Views & Likes */}
                      <div className="flex items-center gap-2.5 text-[11px] text-ink-muted shrink-0">
                        {v.viewCount > 0 && (
                          <span className="inline-flex items-center gap-1 font-medium">
                            <Eye className="h-3 w-3 text-primary" />
                            {formatCount(v.viewCount)}
                          </span>
                        )}
                        {v.likeCount > 0 && (
                          <span className="inline-flex items-center gap-1 font-medium">
                            <ThumbsUp className="h-3 w-3 text-emerald-600" />
                            {formatCount(v.likeCount)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Lecture Title */}
                    <a
                      href={youtubeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block group-hover:text-primary transition-colors"
                    >
                      <h3 className="font-bold text-[16px] text-ink leading-snug line-clamp-2">
                        {v.title}
                      </h3>
                    </a>

                    {/* Description snippet */}
                    {v.description && (
                      <p className="text-[12px] text-ink-muted line-clamp-2 leading-relaxed">
                        {v.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Footer Action: Watch on YouTube */}
                <div className="p-5 pt-0">
                  <a
                    href={youtubeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-surface-subtle border border-border/80 text-ink font-semibold text-small hover:bg-[#FF0000] hover:text-white hover:border-[#FF0000] shadow-2xs hover:shadow-xs transition-all group/btn"
                  >
                    <YouTubeIcon className="h-4 w-4 text-[#FF0000] group-hover/btn:text-white transition-colors" />
                    <span>Watch Free on YouTube</span>
                    <ArrowRight className="h-4 w-4 opacity-70 group-hover/btn:translate-x-1 group-hover/btn:opacity-100 transition-all" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
