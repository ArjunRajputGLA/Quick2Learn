import * as React from "react";
import Link from "next/link";
import { ArrowRight, Play, CheckCircle2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HeroCarousel, type HeroTilesConfig } from "./hero-carousel";
import type { FormattedLectureCardData } from "@/server/data/videos";
import type { FormattedBatchCardData } from "@/server/data/batches";

export interface HeroSectionProps {
  heroSettings?: {
    headline?: string;
    subheadline?: string;
    primary_cta_text?: string;
    primary_cta_href?: string;
    secondary_cta_text?: string;
    secondary_cta_href?: string;
  } | null;
  heroTilesSettings?: HeroTilesConfig | null;
  latestLecture: FormattedLectureCardData | null;
  featuredBatch: FormattedBatchCardData | null;
}


export function HeroSection({
  heroSettings,
  heroTilesSettings,
  latestLecture,
  featuredBatch,
}: HeroSectionProps) {
  const headline = heroSettings?.headline || "Maths made quick and easy";
  const subheadline =
    heroSettings?.subheadline ||
    "Master Class IX–XII Mathematics, Chemistry and Biology with conceptual clarity, Kota-level rigor, and 25+ years of trusted teaching legacy in Mathura.";
  const primaryCtaText = heroSettings?.primary_cta_text || "Join for Free";
  const primaryCtaHref = heroSettings?.primary_cta_href || "/batches";
  const secondaryCtaText = heroSettings?.secondary_cta_text || "Explore free lectures";
  const secondaryCtaHref = heroSettings?.secondary_cta_href || "/#lectures";

  return (
    <section className="relative overflow-hidden bg-surface py-12 md:py-20 border-b border-border">
      {/* Dynamic ambient background glows */}
      <div className="absolute top-1/4 right-10 -z-10 w-96 h-96 rounded-full bg-primary/5 blur-3xl pointer-events-none animate-pulse-subtle" />
      <div className="absolute bottom-0 left-10 -z-10 w-80 h-80 rounded-full bg-amber-500/5 blur-3xl pointer-events-none animate-float" />

      <div className="container mx-auto px-4 max-w-[1200px]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Heading, Supporting Line, CTAs */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary-soft/90 px-3.5 py-1 text-caption font-semibold text-primary animate-float shadow-2xs hover:scale-105 transition-transform duration-300 cursor-default">
              <Sparkles className="h-3.5 w-3.5 text-accent" />
              <span>Mathura’s Premier Coaching Institute</span>
            </div>

            <div className="space-y-4">
              <h1 className="text-display font-extrabold tracking-tight text-ink leading-[1.12] animate-fade-in-up">
                {headline}
              </h1>
              <p className="text-body text-ink-muted max-w-xl leading-relaxed animate-fade-in-up delay-150">
                {subheadline}
              </p>
            </div>

            {/* CTAs */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 animate-fade-in-up delay-200">
              <Link href={primaryCtaHref}>
                <Button size="lg" variant="primary" className="group w-full sm:w-auto gap-2 shadow-sm font-semibold">
                  <span>{primaryCtaText}</span>
                  <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                </Button>
              </Link>
              <Link href={secondaryCtaHref}>
                <Button size="lg" variant="outline" className="group w-full sm:w-auto gap-2 font-semibold">
                  <Play className="h-4 w-4 fill-current text-primary transition-transform duration-300 group-hover:scale-110" />
                  <span>{secondaryCtaText}</span>
                </Button>
              </Link>
            </div>

            {/* Bullet Trust Points */}
            <div className="pt-4 border-t border-border/80 space-y-2 animate-fade-in-up delay-300">
              <div className="flex items-center gap-2.5 text-small text-ink">
                <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                <span>
                  <strong>Classes IX–XII</strong> · CBSE &amp; ICSE / ISC Boards
                </span>
              </div>
              <div className="flex items-center gap-2.5 text-small text-ink">
                <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                <span>
                  <strong>25+ Years Legacy</strong> · Guided by Mr. Dinesh Singh Rajput &amp; Mrs. Namita Singh Rajput
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: 3-Tile Carousel */}
          <div className="lg:col-span-5 w-full animate-scale-in delay-200">
            <HeroCarousel
              latestLecture={latestLecture}
              featuredBatch={featuredBatch}
              heroTilesSettings={heroTilesSettings}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
