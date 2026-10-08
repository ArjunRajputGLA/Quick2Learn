import Link from "next/link";
import { Badge } from "@/components/ui/badge";
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
      className={`rounded-xl border border-primary/20 bg-gradient-to-br from-primary-soft/50 via-surface to-surface p-6 shadow-sm hover:shadow-md transition-all ${className}`}
    >
      <div className="flex items-center gap-2 mb-3">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-surface text-[11px] font-bold">
          <Sparkles className="h-3.5 w-3.5" />
        </span>
        <span className="text-caption font-bold uppercase tracking-wider text-primary">
          Classroom &amp; Live Batch
        </span>
      </div>

      <h3 className="text-h4 font-bold text-ink leading-tight mb-2">
        Want structured classes? Join the Class {classRoman} batch
      </h3>

      <p className="text-small text-ink-muted leading-relaxed mb-4">
        {batch.subtitle ||
          `Daily practice problem sheets, weekly offline mock tests, and direct doubt mentorship with ${
            facultyName || "our expert faculty"
          }.`}
      </p>

      <div className="space-y-2 mb-6 text-caption text-ink">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-accent shrink-0" />
          <span>{batch.scheduleText}</span>
        </div>
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-primary shrink-0" />
          <span>Small batch size (max {batch.seatsTotal} students in Mathura)</span>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 pt-3 border-t border-border/60">
        <div className="flex items-center gap-1.5">
          <Badge variant="accent" className="text-[10px] uppercase">
            {batch.mode}
          </Badge>
          {subjectName && (
            <Badge variant="neutral" className="text-[10px]">
              {subjectName}
            </Badge>
          )}
        </div>

        <Link
          href={`/batches/${batch.slug}`}
          className="inline-flex items-center gap-1.5 text-small font-semibold text-primary hover:text-primary-hover hover:underline transition-colors"
        >
          <span>Batch Details</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
