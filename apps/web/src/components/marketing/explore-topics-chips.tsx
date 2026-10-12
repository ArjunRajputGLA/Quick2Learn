import * as React from "react";
import Link from "next/link";
import { Sparkles, BookOpen } from "lucide-react";
import { SectionHeader } from "@/components/ui/section-header";

export interface PopularTopicItem {
  label: string;
  query: string;
}

export interface ExploreTopicsChipsProps {
  subjects?: Array<{ id: string; name: string; slug: string }> | null;
  popularTopics?: PopularTopicItem[] | null;
}

export function ExploreTopicsChips({
  subjects,
  popularTopics,
}: ExploreTopicsChipsProps) {
  const defaultSubjects = subjects && subjects.length > 0 ? subjects : [
    { id: "1", name: "Mathematics", slug: "mathematics" },
    { id: "2", name: "Physics", slug: "physics" },
    { id: "3", name: "Chemistry", slug: "chemistry" },
    { id: "4", name: "Biology", slug: "biology" },
  ];

  const topics = popularTopics && popularTopics.length > 0 ? popularTopics : [
    { label: "Definite Integrals", query: "Definite Integrals" },
    { label: "Matrices & Determinants", query: "Matrices" },
    { label: "Trigonometric Functions", query: "Trigonometric Functions" },
    { label: "Probability", query: "Probability" },
    { label: "Periodic Properties", query: "Periodic Properties" },
    { label: "Photosynthesis & Cell", query: "Photosynthesis" },
    { label: "Continuity & Differentiability", query: "Continuity" },
    { label: "Vectors & 3D Geometry", query: "Vectors" },
  ];

  return (
    <section className="bg-surface-subtle border-y border-border py-14 md:py-16">
      <div className="container mx-auto px-4 max-w-[1200px] space-y-8">
        <SectionHeader
          eyebrow="Curated Discovery"
          title="Explore subjects & popular topics"
          description="Quickly navigate into specialized core disciplines and frequently practiced board exam concepts."
        />

        {/* Row 1: Explore Subjects */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-caption font-semibold uppercase tracking-wider text-primary">
            <BookOpen className="h-4 w-4" />
            <span>Explore Subjects</span>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            {defaultSubjects.map((sub) => (
              <Link
                key={sub.id}
                href={`/lectures?subject=${sub.slug}`}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 text-small font-semibold text-ink shadow-xs hover:border-primary hover:text-primary hover:bg-primary-soft hover:-translate-y-0.5 hover:shadow-card hover:scale-[1.03] active:scale-95 transition-all duration-200"
              >
                <span>{sub.name}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Row 2: Popular Topics */}
        <div className="space-y-3 pt-4 border-t border-border/70">
          <div className="flex items-center gap-2 text-caption font-semibold uppercase tracking-wider text-ink-muted">
            <Sparkles className="h-4 w-4 text-accent" />
            <span>High-Yield Popular Topics</span>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            {topics.map((topic, idx) => (
              <Link
                key={idx}
                href={`/search?q=${encodeURIComponent(topic.query)}`}
                className="inline-flex items-center rounded-full border border-border bg-surface px-3.5 py-1.5 text-caption font-semibold text-ink-muted shadow-xs hover:border-primary/60 hover:text-primary hover:bg-primary-soft/50 hover:-translate-y-0.5 hover:scale-[1.03] active:scale-95 transition-all duration-200"
              >
                <span>{topic.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
