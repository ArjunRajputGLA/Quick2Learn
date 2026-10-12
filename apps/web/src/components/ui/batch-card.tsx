"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Clock,
  MapPin,
  Users,
  CheckCircle2,
  ArrowRight,
  Calculator,
  FlaskConical,
  Sparkles,
} from "lucide-react";
import { formatINR } from "@quick2learn/shared";
import { cn } from "@/lib/utils";

export interface BatchCardProps {
  id: string;
  title: string;
  grade: string; // e.g. "Class XII"
  board: string; // e.g. "CBSE"
  facultyName: string; // e.g. "Dinesh Singh Rajput"
  facultyAvatar?: string | null;
  schedule: string; // e.g. "Mon–Sat · 5–6 PM"
  pricePaise: number; // integer paise
  originalPricePaise?: number; // integer paise for struck-through discount
  admissionsOpen?: boolean;
  coverImageUrl?: string;
  href?: string;
  mode?: string; // e.g. "offline", "hybrid", "online"
  className?: string;
}

export function BatchCard({
  title: rawTitle,
  grade,
  board,
  facultyName: rawFacultyName,
  facultyAvatar,
  schedule: rawSchedule,
  pricePaise,
  originalPricePaise,
  admissionsOpen = true,
  coverImageUrl,
  href = "#",
  mode = "offline",
  className,
}: BatchCardProps) {
  const title = rawTitle?.replace(/\s*\[PLACEHOLDER\]/gi, "") || "";
  const facultyName = rawFacultyName?.replace(/\s*\[PLACEHOLDER\]/gi, "") || "";
  const schedule = rawSchedule?.replace(/\s*\[PLACEHOLDER\]/gi, "") || "";

  // Intelligent Faculty Avatar resolution to ensure authentic portraits
  const isDineshSir = /dinesh/i.test(facultyName);
  const isNamitaMaam = /namita/i.test(facultyName);

  const resolvedAvatar = isDineshSir
    ? "/images/assets/Dinesh Singh Rajput.jpeg"
    : isNamitaMaam
      ? "/images/faculty/namita-maam.jpg"
      : facultyAvatar || "/images/assets/Dinesh Singh Rajput.jpeg";

  const facultyRole = isDineshSir
    ? "25+ Yrs Exp • Senior Mathematics Head"
    : isNamitaMaam
      ? "15+ Yrs Exp • Head of ICSE Sciences"
      : "Senior Faculty Mentor";

  // Theming based on subject
  const isMath = /math/i.test(title) || /math/i.test(grade) || isDineshSir;
  const subjectLabel = isMath ? "Senior Mathematics" : "Chemistry & Biology";

  const savingsPercent =
    originalPricePaise && originalPricePaise > pricePaise
      ? Math.round(((originalPricePaise - pricePaise) / originalPricePaise) * 100)
      : 0;

  return (
    <div
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl border border-border/80 bg-surface shadow-xs hover:shadow-xl hover:border-primary/50 hover:-translate-y-1.5 transition-all duration-300 ease-out will-change-transform",
        className,
      )}
    >
      {/* Clickable Overlay Link to entire card */}
      <Link href={href} className="absolute inset-0 z-10" aria-label={`View details for ${title}`}>
        <span className="sr-only">View {title}</span>
      </Link>

      {/* Top Banner / Cover */}
      <div className="relative h-44 w-full overflow-hidden shrink-0">
        {coverImageUrl ? (
          <Image
            src={coverImageUrl}
            alt={title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 380px"
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-108"
          />
        ) : isMath ? (
          /* Mathematics Signature Royal Navy/Indigo Banner */
          <div className="relative h-full w-full bg-gradient-to-br from-slate-950 via-indigo-950 to-blue-900 p-5 flex flex-col justify-between overflow-hidden">
            {/* Subtle Mathematical Grid & Formula Elements Watermark */}
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#818cf8_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
            <div className="absolute -right-4 -bottom-6 text-white/5 font-mono text-[90px] font-bold select-none pointer-events-none tracking-tighter">
              ∫dx
            </div>

            {/* Top Bar: Subject Pill + Status */}
            <div className="relative z-1 flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-white/10 text-sky-200 border border-white/15 backdrop-blur-md shadow-xs">
                <Calculator className="h-3 w-3 text-sky-400" />
                {subjectLabel}
              </span>

              {admissionsOpen ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 backdrop-blur-md">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Admissions Open
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-400/30 backdrop-blur-md">
                  Filling Fast
                </span>
              )}
            </div>

            {/* Middle: Grade & Board Showcase */}
            <div className="relative z-1">
              <div className="text-[22px] font-extrabold text-white tracking-tight flex items-baseline gap-2">
                <span>{grade}</span>
                <span className="text-white/60 font-light">•</span>
                <span className="text-sky-300">{board}</span>
              </div>
              <p className="text-[11px] font-medium text-white/70 uppercase tracking-wider mt-0.5">
                Session 2026–27 • Mathura Campus
              </p>
            </div>

            {/* Bottom: Mode & Seat Indicator */}
            <div className="relative z-1 flex items-center justify-between text-[11px] text-white/80 pt-1 border-t border-white/10">
              <span className="inline-flex items-center gap-1 font-semibold text-white/90">
                <MapPin className="h-3 w-3 text-amber-400" />
                {mode === "hybrid" ? "Hybrid Batch" : "Offline Campus"}
              </span>
              <span className="text-white/70 font-medium">Max 25–30 Students</span>
            </div>
          </div>
        ) : (
          /* Science Signature Emerald/Teal Banner */
          <div className="relative h-full w-full bg-gradient-to-br from-slate-950 via-teal-950 to-emerald-900 p-5 flex flex-col justify-between overflow-hidden">
            {/* Subtle Molecular Grid Watermark */}
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#34d399_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
            <div className="absolute -right-4 -bottom-6 text-white/5 font-mono text-[90px] font-bold select-none pointer-events-none tracking-tighter">
              C₆H₁₂
            </div>

            {/* Top Bar: Subject Pill + Status */}
            <div className="relative z-1 flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-white/10 text-teal-200 border border-white/15 backdrop-blur-md shadow-xs">
                <FlaskConical className="h-3 w-3 text-emerald-400" />
                {subjectLabel}
              </span>

              {admissionsOpen ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 backdrop-blur-md">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Admissions Open
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-400/30 backdrop-blur-md">
                  Filling Fast
                </span>
              )}
            </div>

            {/* Middle: Grade & Board Showcase */}
            <div className="relative z-1">
              <div className="text-[22px] font-extrabold text-white tracking-tight flex items-baseline gap-2">
                <span>{grade}</span>
                <span className="text-white/60 font-light">•</span>
                <span className="text-emerald-300">{board}</span>
              </div>
              <p className="text-[11px] font-medium text-white/70 uppercase tracking-wider mt-0.5">
                Session 2026–27 • Mathura Campus
              </p>
            </div>

            {/* Bottom: Mode & Seat Indicator */}
            <div className="relative z-1 flex items-center justify-between text-[11px] text-white/80 pt-1 border-t border-white/10">
              <span className="inline-flex items-center gap-1 font-semibold text-white/90">
                <MapPin className="h-3 w-3 text-amber-400" />
                {mode === "hybrid" ? "Hybrid Batch" : "Offline Campus"}
              </span>
              <span className="text-white/70 font-medium">Max 25–30 Students</span>
            </div>
          </div>
        )}
      </div>

      {/* Main Card Body */}
      <div className="flex flex-1 flex-col p-5 sm:p-6 justify-between space-y-4">
        {/* Title */}
        <div className="space-y-2.5">
          <h3 className="text-[17px] sm:text-[18px] font-bold text-ink group-hover:text-primary transition-colors line-clamp-2 leading-snug">
            {title}
          </h3>

          {/* Teacher Profile Row with Real Portrait */}
          <div className="flex items-center gap-3 pt-1">
            <div className="relative h-11 w-11 rounded-full overflow-hidden border-2 border-primary/20 shrink-0 shadow-xs bg-surface-subtle">
              <Image
                src={resolvedAvatar}
                alt={facultyName}
                fill
                className="object-cover"
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p className="text-small font-bold text-ink truncate">{facultyName}</p>
                <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
              </div>
              <p className="text-[11px] font-medium text-ink-muted truncate">{facultyRole}</p>
            </div>
          </div>
        </div>

        {/* Schedule & Highlights Box */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center gap-2 text-[12px] font-medium text-ink bg-surface-subtle/70 px-3 py-2 rounded-lg border border-border/60">
            <Clock className="h-4 w-4 text-primary shrink-0" />
            <span className="truncate">{schedule}</span>
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-ink-muted px-1">
            <span className="inline-flex items-center gap-1">
              <Users className="h-3 w-3 text-primary/80" />
              Small Batch Size
            </span>
            <span>•</span>
            <span className="inline-flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-emerald-600" />
              Sunday Test Series
            </span>
            <span>•</span>
            <span className="inline-flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-amber-500" />
              Doubt Support
            </span>
          </div>
        </div>

        {/* Price & CTA Action */}
        <div className="pt-4 border-t border-border/70 flex items-center justify-between gap-3">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-[22px] sm:text-[24px] font-extrabold text-ink leading-none">
                {formatINR(pricePaise)}
              </span>
              {originalPricePaise && originalPricePaise > pricePaise && (
                <span className="text-[13px] text-ink-muted line-through font-medium">
                  {formatINR(originalPricePaise)}
                </span>
              )}
            </div>
            {savingsPercent > 0 && (
              <span className="inline-block text-[11px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 mt-1">
                Save {savingsPercent}% Early Bird
              </span>
            )}
          </div>

          {/* Interactive Button */}
          <div className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-white text-small font-semibold shadow-xs group-hover:bg-primary-hover group-hover:shadow-card group-hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shrink-0">
            <span>Explore Batch</span>
            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
          </div>
        </div>
      </div>
    </div>
  );
}
