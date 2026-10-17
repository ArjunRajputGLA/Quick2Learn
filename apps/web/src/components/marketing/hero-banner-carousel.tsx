"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface HeroBannerSlide {
  id: string;
  /** Heading shown over the image */
  headline: string;
  /** Supporting copy (1–2 lines) */
  description: string;
  /** CTA label */
  ctaText: string;
  /** CTA destination */
  ctaHref: string;
  /** Banner image path or URL */
  imageUrl: string;
  /** Image alt-text */
  imageAlt: string;
}

export interface HeroPromotionalCard {
  /** Small logo or icon-text above title */
  eyebrow: string;
  /** Main heading */
  title: string;
  /** Supporting paragraph */
  description: string;
  /** CTA label */
  ctaText: string;
  /** CTA destination */
  ctaHref: string;
  /** Card image */
  imageUrl: string;
  imageAlt: string;
}

export interface HeroBannerCarouselProps {
  slides: HeroBannerSlide[];
  promoCard?: HeroPromotionalCard | null;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function HeroBannerCarousel({
  slides,
  promoCard,
}: HeroBannerCarouselProps) {
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [isHovered, setIsHovered] = React.useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = React.useState(false);
  const count = slides.length;

  // Detect reduced-motion preference
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Auto-advance (6s), paused on hover / reduced-motion
  React.useEffect(() => {
    if (count <= 1 || isHovered || prefersReducedMotion) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % count);
    }, 6000);
    return () => clearInterval(timer);
  }, [count, isHovered, prefersReducedMotion]);

  const goPrev = () => setCurrentIndex((p) => (p === 0 ? count - 1 : p - 1));
  const goNext = () => setCurrentIndex((p) => (p + 1) % count);

  if (slides.length === 0) return null;

  return (
    <section className="bg-surface-subtle pt-6 pb-8 md:pt-8 md:pb-10">
      <div className="container mx-auto px-4 max-w-[1200px]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* ======== LEFT: Banner carousel (spans 7 cols on desktop) ======== */}
          <div
            className="lg:col-span-7 relative overflow-hidden rounded-xl shadow-card"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            role="region"
            aria-roledescription="carousel"
            aria-label="Featured highlights"
          >
            <div className="relative min-h-[350px] sm:min-h-[380px] lg:min-h-0 lg:aspect-[16/8] w-full">
              {slides.map((slide, idx) => (
                <div
                  key={slide.id}
                  className={`absolute inset-0 transition-opacity duration-500 ${
                    idx === currentIndex
                      ? "opacity-100 z-10 pointer-events-auto"
                      : "opacity-0 z-0 pointer-events-none"
                  }`}
                  aria-hidden={idx !== currentIndex}
                >
                  {/* Background image */}
                  <Image
                    src={slide.imageUrl}
                    alt={slide.imageAlt}
                    fill
                    priority={idx === 0}
                    sizes="(max-width: 768px) 100vw, 700px"
                    className="object-cover"
                  />

                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-r from-ink/90 via-ink/60 to-transparent" />

                  {/* Text content overlaid on the banner */}
                  <div className="absolute inset-0 flex flex-col justify-center p-6 sm:p-10 max-w-lg pb-14 sm:pb-8">
                    <h2 className="text-h2 sm:text-h1 font-extrabold text-surface leading-tight tracking-tight drop-shadow-sm">
                      {slide.headline}
                    </h2>
                    <p className="mt-3 text-small sm:text-body text-surface/90 leading-relaxed line-clamp-3 drop-shadow-sm">
                      {slide.description}
                    </p>
                    <div className="mt-5">
                      <Link href={slide.ctaHref}>
                        <Button
                          size="md"
                          variant="primary"
                          className="gap-2 font-semibold shadow-md w-full sm:w-auto justify-center"
                        >
                          <span>{slide.ctaText}</span>
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Carousel dots at bottom */}
            <div className="absolute bottom-3.5 sm:bottom-4 left-5 sm:left-10 flex items-center gap-2 z-20">
              {slides.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCurrentIndex(idx)}
                  aria-label={`Go to slide ${idx + 1}`}
                  className={`h-2.5 rounded-full transition-all cursor-pointer ${
                    idx === currentIndex
                      ? "w-7 bg-surface"
                      : "w-2.5 bg-surface/50 hover:bg-surface/70"
                  }`}
                />
              ))}
            </div>

            {/* Prev/Next arrows (desktop hover) */}
            {count > 1 && (
              <>
                <button
                  type="button"
                  onClick={goPrev}
                  aria-label="Previous slide"
                  className="absolute left-2 top-1/2 -translate-y-1/2 z-20 h-10 w-10 rounded-full bg-surface/80 text-ink shadow-md flex items-center justify-center opacity-0 hover:opacity-100 lg:group-hover/hero:opacity-100 transition-opacity cursor-pointer backdrop-blur-sm hover:bg-surface"
                  style={{ opacity: isHovered ? 1 : undefined }}
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={goNext}
                  aria-label="Next slide"
                  className="absolute right-2 top-1/2 -translate-y-1/2 z-20 h-10 w-10 rounded-full bg-surface/80 text-ink shadow-md flex items-center justify-center opacity-0 hover:opacity-100 lg:group-hover/hero:opacity-100 transition-opacity cursor-pointer backdrop-blur-sm hover:bg-surface"
                  style={{ opacity: isHovered ? 1 : undefined }}
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </>
            )}
          </div>

          {/* ======== RIGHT: Promotional card (spans 5 cols on desktop) ======== */}
          {promoCard && (
            <div className="lg:col-span-5 flex flex-col">
              <div className="relative flex flex-1 flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-card">
                {/* Top image */}
                <div className="relative h-44 sm:h-52 lg:h-auto lg:flex-1 w-full overflow-hidden">
                  <Image
                    src={promoCard.imageUrl}
                    alt={promoCard.imageAlt}
                    fill
                    sizes="(max-width: 768px) 100vw, 500px"
                    className="object-cover"
                  />
                </div>

                {/* Card body */}
                <div className="flex flex-col justify-between p-6 space-y-3">
                  <div className="space-y-2">
                    <span className="inline-flex items-center gap-1.5 text-caption font-bold uppercase tracking-wider text-primary">
                      {promoCard.eyebrow}
                    </span>
                    <h3 className="text-h3 font-bold text-ink leading-snug">
                      {promoCard.title}
                    </h3>
                    <p className="text-small text-ink-muted leading-relaxed line-clamp-2">
                      {promoCard.description}
                    </p>
                  </div>
                  <Link href={promoCard.ctaHref}>
                    <Button
                      size="md"
                      variant="primary"
                      className="gap-2 font-semibold w-full sm:w-auto justify-center"
                    >
                      <span>{promoCard.ctaText}</span>
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
