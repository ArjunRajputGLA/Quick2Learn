"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { Play, ArrowRight, Target, CheckCircle2 } from "lucide-react";
import { SectionHeader } from "@/components/ui/section-header";
import { BatchCard } from "@/components/ui/batch-card";
import { Badge } from "@/components/ui/badge";
import type { FormattedBatchCardData } from "@/server/data/batches";

export interface GoalConfig {
  id: string;
  label: string;
  description: string;
  playlist_id: string;
  playlist_title: string;
  playlist_subtitle: string;
  playlist_image?: string;
  playlist_count?: number;
  batch_slug: string;
}

export interface CurriculumGoalsProps {
  goals?: GoalConfig[] | null;
  batches: FormattedBatchCardData[];
}

export function CurriculumGoals({ goals, batches }: CurriculumGoalsProps) {
  const defaultGoals: GoalConfig[] = [
    {
      id: "board_prep",
      label: "Board exam prep",
      description: "High-yield PYQs, marking schemes, and step-by-step answer writing strategies for CBSE & ICSE board candidates.",
      playlist_id: "pl-class12-board-prep",
      playlist_title: "Class 12 CBSE Board Exam Booster (PYQ & Marathon)",
      playlist_subtitle: "18 comprehensive marathon lessons covering the highest probability board questions.",
      playlist_image: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=600&auto=format&fit=crop&q=80",
      playlist_count: 18,
      batch_slug: "class-12-cbse-mathematics-masterclass-2026",
    },
    {
      id: "concepts",
      label: "Build strong concepts",
      description: "Deep conceptual understanding from first principles, eliminating rote memorization in Math and Sciences.",
      playlist_id: "pl-class11-strong-concepts",
      playlist_title: "Class 11 Foundations & Core Concepts Marathon",
      playlist_subtitle: "14 conceptual lessons bridging Class 10 to Senior Secondary calculus and trigonometry.",
      playlist_image: "https://images.unsplash.com/photo-1596495578065-6e0763fa1178?w=600&auto=format&fit=crop&q=80",
      playlist_count: 14,
      batch_slug: "class-11-cbse-mathematics-foundation-2026",
    },
    {
      id: "quick_revision",
      label: "Quick revision",
      description: "Rapid one-shot revision sessions, formula sheets, and essential diagrams right before term exams.",
      playlist_id: "pl-class10-quick-revision",
      playlist_title: "Class 10 CBSE & ICSE Fast-Track Revision",
      playlist_subtitle: "12 rapid-fire revision lectures for Class 10 board candidates.",
      playlist_image: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=600&auto=format&fit=crop&q=80",
      playlist_count: 12,
      batch_slug: "class-10-icse-science-mastery-2026",
    },
    {
      id: "doubt_solving",
      label: "Doubt solving",
      description: "Live doubt clearing and walkthroughs of the trickiest textbook and competition problem sets.",
      playlist_id: "pl-class12-doubt-solving",
      playlist_title: "Class 12 Doubt Solving & Tricky Board Problems",
      playlist_subtitle: "15 targeted doubt resolution and proof sessions with Dinesh Sir.",
      playlist_image: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=600&auto=format&fit=crop&q=80",
      playlist_count: 15,
      batch_slug: "class-12-cbse-mathematics-masterclass-2026",
    },
  ];

  const activeGoals = goals && goals.length > 0 ? goals : defaultGoals;
  const [activeGoalId, setActiveGoalId] = React.useState<string>(activeGoals[0]?.id || "board_prep");

  const currentGoal = activeGoals.find((g) => g.id === activeGoalId) || activeGoals[0] || defaultGoals[0]!;
  if (!currentGoal) return null;

  const matchingBatch = batches.find((b) => b.slug === currentGoal.batch_slug) || batches[0];

  const cleanText = (str?: string) => str?.replace(/\s*\[PLACEHOLDER\]/gi, "").trim() || "";

  return (
    <section className="bg-surface py-14 md:py-16">
      <div className="container mx-auto px-4 max-w-[1200px] space-y-8">
        <SectionHeader
          eyebrow="Personalized Path"
          title="What brings you here today?"
          description="Select your learning objective to view our recommended free lecture series and matching classroom batch."
        />

        {/* Goal selector chips */}
        <div className="flex items-center gap-2 sm:gap-2.5 overflow-x-auto no-scrollbar pb-1.5">
          {activeGoals.map((goal) => {
            const isSelected = goal.id === activeGoalId;
            return (
              <button
                key={goal.id}
                type="button"
                onClick={() => setActiveGoalId(goal.id)}
                className={`inline-flex items-center gap-2 rounded-full px-5 py-2 text-small font-semibold transition-all duration-200 cursor-pointer select-none shrink-0 hover:scale-105 active:scale-95 whitespace-nowrap ${
                  isSelected
                    ? "bg-primary text-surface shadow-xs"
                    : "bg-surface-subtle text-ink border border-border hover:bg-surface hover:border-primary/40"
                }`}
              >
                <Target className="h-4 w-4" />
                <span>{cleanText(goal.label)}</span>
              </button>
            );
          })}
        </div>

        {/* Dynamic Recommendation Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-stretch pt-2">
          {/* Left: Recommended Playlist Card */}
          <div className="group lg:col-span-7 flex flex-col justify-between rounded-2xl border border-border bg-surface shadow-card hover:shadow-xl hover:border-primary/50 transition-all duration-300 overflow-hidden">
            <div className="relative h-52 sm:h-64 lg:h-72 w-full overflow-hidden bg-surface-subtle">
              <Image
                src={
                  currentGoal.playlist_image ||
                  "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=600&auto=format&fit=crop&q=80"
                }
                alt={cleanText(currentGoal.playlist_title)}
                fill
                sizes="(max-width: 768px) 100vw, 600px"
                className="object-cover group-hover:scale-106 transition-transform duration-500 ease-out"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-transparent to-transparent" />
              <div className="absolute top-4 left-4">
                <Badge variant="accent">Recommended Free Series</Badge>
              </div>
              <div className="absolute bottom-4 left-4 right-4 text-surface">
                <div className="flex items-center gap-1.5 text-accent font-semibold text-caption mb-1">
                  <Play className="h-4 w-4 fill-current" />
                  <span>{currentGoal.playlist_count || 15} Full Lessons</span>
                </div>
                <h3 className="text-h3 font-bold text-surface line-clamp-2">
                  {cleanText(currentGoal.playlist_title)}
                </h3>
              </div>
            </div>

            <div className="flex flex-1 flex-col justify-between p-6 bg-surface space-y-4">
              <div className="space-y-2">
                <p className="text-small text-ink leading-relaxed">
                  {cleanText(currentGoal.description)}
                </p>
                <p className="text-caption text-ink-muted">
                  {cleanText(currentGoal.playlist_subtitle)}
                </p>
              </div>

              <div className="pt-4 border-t border-border flex items-center justify-between gap-2.5">
                <div className="flex items-center gap-1.5 text-caption text-success font-semibold">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>100% Free on YouTube &amp; Web</span>
                </div>
                <Link
                  href="/lectures"
                  className="inline-flex items-center gap-1.5 text-small font-semibold text-primary hover:text-primary-hover hover:underline group/link"
                >
                  <span>Watch series now</span>
                  <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover/link:translate-x-1" />
                </Link>
              </div>
            </div>
          </div>

          {/* Right: Matching Classroom Batch */}
          <div className="lg:col-span-5 flex flex-col justify-between">
            <div className="mb-2">
              <span className="text-caption font-semibold uppercase tracking-wider text-primary">
                Matching Classroom Coaching Batch
              </span>
            </div>
            {matchingBatch ? (
              <BatchCard
                id={matchingBatch.id}
                title={matchingBatch.title}
                grade={matchingBatch.grade}
                board={matchingBatch.board}
                facultyName={matchingBatch.facultyName}
                facultyAvatar={matchingBatch.facultyAvatar}
                schedule={matchingBatch.schedule}
                pricePaise={matchingBatch.pricePaise}
                originalPricePaise={matchingBatch.originalPricePaise}
                admissionsOpen={matchingBatch.admissionsOpen}
                coverImageUrl={matchingBatch.coverImageUrl}
                href={matchingBatch.href}
                className="h-full"
              />
            ) : (
              <div className="rounded-lg border border-border p-8 text-center text-ink-muted">
                Batch information unavailable
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
