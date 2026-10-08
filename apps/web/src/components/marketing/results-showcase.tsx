import * as React from "react";
import { Trophy, Award } from "lucide-react";
import { SectionHeader } from "@/components/ui/section-header";
import { StatCard } from "@/components/ui/stat-card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";

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


export function ResultsShowcase({ headlineResult, results }: ResultsShowcaseProps) {
  if ((!headlineResult || !headlineResult.value) && (!results || results.length === 0)) {
    return null;
  }

  const stat = headlineResult || {
    value: "98.4%",
    label: "Board Distinction Rate",
    description: "Over 85% of our regular classroom students score above 90 marks in Board Mathematics and Sciences.",
    trend: "+4.2% YoY",
  };

  return (
    <section id="results" className="bg-surface-subtle border-y border-border py-14 md:py-16">
      <div className="container mx-auto px-4 max-w-[1200px] space-y-8">
        <SectionHeader
          eyebrow="Proven Excellence"
          title="Results & Hall of Fame"
          description="Consistent board toppers in Mathura year after year under the mentorship of Dinesh Sir & Namita Ma'am."
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Left: Headline StatCard */}
          <div className="lg:col-span-4 flex flex-col justify-between">
            <StatCard
              value={stat.value}
              label={stat.label}
              description={stat.description}
              trend={stat.trend}
              icon={<Trophy className="h-5 w-5 text-accent" />}
              className="h-full border-primary/20 shadow-card bg-surface"
            />
          </div>

          {/* Right: Featured Student Results Cards */}
          <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {results.map((res) => (
              <div
                key={res.id}
                className="flex items-center justify-between p-5 rounded-lg border border-border bg-surface shadow-card hover:shadow-card-hover transition-all"
              >
                <div className="flex items-center gap-3.5">
                  <Avatar fallback={res.studentName} size="md" />
                  <div>
                    <h4 className="text-body font-bold text-ink leading-tight">
                      {res.studentName}
                    </h4>
                    <p className="text-caption text-ink-muted mt-0.5">
                      {res.exam} · {res.year}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1">
                  <Badge variant="accent" className="font-bold text-caption">
                    {res.scoreText}
                  </Badge>
                  <span className="text-[11px] font-semibold text-primary uppercase tracking-wider flex items-center gap-1">
                    <Award className="h-3 w-3" />
                    Topper
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
