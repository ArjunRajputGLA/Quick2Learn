import Link from "next/link";
import { formatClassRoman } from "@quick2learn/shared";
import { Calendar, Users, ArrowRight, Sparkles } from "lucide-react";

interface RelatedBatchCardProps {
  batch: {
    id: string;
    slug: string;
    title: string;
    subtitle?: string | null;
    classLevel: number;
    mode: string;
    scheduleText: string;
    seatsTotal: number;
  };
  facultyName?: string | null;
  subjectName?: string | null;
  className?: string;
}

export function RelatedBatchCard({
  batch,
  facultyName,
  subjectName,
  className = "",
}: RelatedBatchCardProps) {
  const classRoman = formatClassRoman(batch.classLevel);

  return (
    <div
      className={`rounded-2xl border border-primary/30 bg-gradient-to-br from-blue-50/70 via-white to-white p-5 sm:p-6 shadow-sm hover:shadow-md transition-all ${className}`}
    >
      <div className="flex items-center gap-2 mb-3">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white text-[11px] font-bold shadow-2xs">
          <Sparkles className="h-3.5 w-3.5" />
        </span>
        <span className="text-[11px] font-black uppercase tracking-wider text-primary">
          Mathura Classroom Batch · 2026–27
        </span>
      </div>

      <h3 className="text-lg font-bold text-slate-900 leading-snug mb-2">
        Want structured coaching? Join Class {classRoman} Batch
      </h3>

      <p className="text-xs sm:text-small text-slate-600 leading-relaxed mb-4">
        {batch.subtitle ||
          `Daily practice problem sheets, weekly offline Sunday mock exams, and personal doubt mentorship with ${
            facultyName || "expert faculty"
          }.`}
      </p>

      <div className="space-y-2 mb-5 text-xs text-slate-700 bg-slate-50/80 p-3 rounded-xl border border-slate-100">
        <div className="flex items-center gap-2 font-medium">
          <Calendar className="h-4 w-4 text-primary shrink-0" />
          <span>{batch.scheduleText}</span>
        </div>
        <div className="flex items-center gap-2 font-medium">
          <Users className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>Strict limit of {batch.seatsTotal} students in Mathura</span>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-blue-100 text-primary">
            {batch.mode}
          </span>
          {subjectName && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
              {subjectName}
            </span>
          )}
        </div>

        <Link
          href={`/batches/${batch.slug}`}
          className="inline-flex items-center gap-1.5 text-xs sm:text-small font-bold text-primary hover:text-primary-hover transition-colors"
        >
          <span>Batch Details</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
