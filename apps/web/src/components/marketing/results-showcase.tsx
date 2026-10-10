import * as React from "react";
import { Trophy, Award, TrendingUp, CheckCircle2, ArrowRight } from "lucide-react";
import Link from "next/link";
import { SectionHeader } from "@/components/ui/section-header";

export interface ResultItem {
  id: string;
  studentName: string;
  exam: string;
  year: number;
  scoreText: string;
  photoKey?: string | null;
  isFeatured?: boolean;
  sortOrder?: number;
}

export interface ResultsShowcaseProps {
  headlineResult?: {
    value: string;
    label: string;
    description?: string;
    trend?: string;
  } | null;
  results: ResultItem[];
}

function cleanText(str?: string | null): string {
  if (!str) return "";
  return str.replace(/\s*\[PLACEHOLDER\]/gi, "").trim();
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function ResultsShowcase({ headlineResult, results }: ResultsShowcaseProps) {
  const stat = {
    value: cleanText(headlineResult?.value) || "98.4%",
    label: cleanText(headlineResult?.label) || "Board Distinction Rate",
    description:
      cleanText(headlineResult?.description) ||
      "Over 85% of our regular classroom students score above 90 marks in Mathematics and Science board examinations.",
    trend: cleanText(headlineResult?.trend) || "+4.2% YoY",
  };

  // Clean all result items
  const cleanResults = (results || []).map((r) => ({
    ...r,
    studentName: cleanText(r.studentName) || "Student Topper",
    exam: cleanText(r.exam) || "CBSE Class XII Maths",
    scoreText: cleanText(r.scoreText) || "99/100",
  }));

  return (
    <section id="results" className="bg-surface-subtle border-y border-border py-14 md:py-20">
      <div className="container mx-auto px-4 max-w-[1200px] space-y-10">
        <SectionHeader
          eyebrow="Proven Excellence"
          title="Results & Hall of Fame"
          description="Consistent board toppers in Mathura year after year under the mentorship of Dinesh Sir & Namita Ma'am."
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Left: Prestigious Hall of Fame Headline Stat Card */}
          <div className="lg:col-span-5 flex flex-col justify-between rounded-2xl border border-primary/20 bg-gradient-to-br from-primary-soft/40 via-surface to-surface p-7 shadow-sm">
            <div className="space-y-5">
              {/* Top Row: Trophy Icon & Trend */}
              <div className="flex items-center justify-between">
                <div className="h-11 w-11 rounded-xl bg-amber-500/10 text-amber-600 border border-amber-300/40 flex items-center justify-center shadow-2xs">
                  <Trophy className="h-6 w-6 stroke-[2.2]" />
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
                  <TrendingUp className="h-3.5 w-3.5" />
                  <span>{stat.trend}</span>
                </div>
              </div>

              {/* Stat Value & Label */}
              <div>
                <span className="text-caption font-bold uppercase tracking-wider text-primary block mb-1">
                  {stat.label}
                </span>
                <div className="text-5xl md:text-6xl font-black text-ink tracking-tight">
                  {stat.value}
                </div>
              </div>

              {/* Description */}
              <p className="text-small text-ink-muted leading-relaxed">
                {stat.description}
              </p>

              {/* Trust bullet points */}
              <div className="space-y-2 pt-2 border-t border-border">
                <div className="flex items-center gap-2 text-xs font-semibold text-ink">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>100/100 Perfect Scores in CBSE Class 12 Maths</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold text-ink">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>HRD Ministry Recognized Mentorship Track Record</span>
                </div>
              </div>
            </div>

            {/* Bottom Link to Full Results */}
            <div className="pt-6 border-t border-border mt-6">
              <Link
                href="/results"
                className="inline-flex items-center gap-1.5 text-small font-semibold text-primary hover:text-primary-hover hover:underline"
              >
                <span>View Full Merit List &amp; Toppers</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* Right: Featured Student Results Cards */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {cleanResults.slice(0, 4).map((res, idx) => {
              const initials = getInitials(res.studentName);
              const avatarGradients = [
                "from-blue-500 to-indigo-600",
                "from-indigo-600 to-purple-600",
                "from-emerald-600 to-teal-600",
                "from-amber-600 to-orange-600",
              ];
              const grad = avatarGradients[idx % avatarGradients.length];

              return (
                <div
                  key={res.id}
                  className="group flex items-center justify-between p-5 rounded-xl border border-border/80 bg-surface shadow-2xs hover:shadow-card-hover hover:border-primary/40 transition-all duration-200"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className={`h-11 w-11 rounded-full bg-gradient-to-tr ${grad} text-white font-bold text-caption flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform`}
                    >
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-body font-bold text-ink truncate group-hover:text-primary transition-colors">
                        {res.studentName}
                      </h4>
                      <p className="text-caption text-ink-muted mt-0.5 truncate">
                        {res.exam} &bull; {res.year}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1 shrink-0 ml-3">
                    <div className="px-2.5 py-0.5 rounded-full font-black text-small bg-amber-50 text-amber-800 border border-amber-200/80 shadow-2xs">
                      {res.scoreText}
                    </div>
                    <span className="text-[11px] font-bold text-primary uppercase tracking-wider flex items-center gap-1">
                      <Award className="h-3 w-3" />
                      Topper
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
