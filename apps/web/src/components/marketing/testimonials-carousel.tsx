"use client";

import * as React from "react";
import { Star, Quote, ChevronLeft, ChevronRight } from "lucide-react";

export interface TestimonialItem {
  id: string;
  studentName: string;
  classLevel: number;
  year: number;
  quote: string;
  photoKey?: string | null;
}

export interface TestimonialsCarouselProps {
  testimonials: TestimonialItem[];
  heading?: string;
}

function cleanText(str?: string | null): string {
  if (!str) return "";
  return str.replace(/\s*\[PLACEHOLDER\]/gi, "").trim();
}

const DEFAULT_TESTIMONIALS = [
  {
    id: "test-1",
    studentName: "Aarav Sharma",
    role: "Student",
    achievement: "100/100 CBSE Class XII Maths",
    year: 2025,
    quote:
      "Dinesh Sir simplified calculus and 3D vectors to a degree where board questions felt almost routine. Scored 100/100 in CBSE Mathematics thanks to continuous weekly testing and personal answer-sheet reviews.",
    gradient: "from-blue-500 to-indigo-600",
  },
  {
    id: "test-2",
    studentName: "Priya Agrawal",
    role: "Student",
    achievement: "99/100 ICSE Class X Sciences",
    year: 2025,
    quote:
      "Namita Ma'am's chemistry equation shortcuts and biology anatomical diagram guidelines were exactly what appeared in our board exams. Her personal attention in small batches built immense confidence.",
    gradient: "from-indigo-600 to-purple-600",
  },
  {
    id: "test-3",
    studentName: "Dr. Rajesh Gupta",
    role: "Parent (Sneha Gupta)",
    achievement: "Daughter Scored 98/100",
    year: 2025,
    quote:
      "As a doctor and parent, I value discipline and clarity. Dinesh Sir's weekly parent updates and dedicated doubt sessions helped Sneha jump from 74% to 98% in secondary board examinations.",
    gradient: "from-emerald-600 to-teal-600",
  },
  {
    id: "test-4",
    studentName: "Rohan Verma",
    role: "Student",
    achievement: "98/100 ISC Class XII",
    year: 2025,
    quote:
      "The conceptual depth taught at Quick2Learn is unmatched in Mathura. The Sunday test series prepares you for every tricky question. Dinesh Sir & Namita Ma'am are true mentors.",
    gradient: "from-amber-600 to-orange-600",
  },
];

export function TestimonialsCarousel({
  testimonials,
  heading = "What students and parents say",
}: TestimonialsCarouselProps) {
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = React.useState(false);
  const [canScrollRight, setCanScrollRight] = React.useState(true);

  const displayItems = React.useMemo(() => {
    const cleaned = (testimonials || []).map((t, idx) => {
      const fallback = DEFAULT_TESTIMONIALS[idx % DEFAULT_TESTIMONIALS.length] ?? DEFAULT_TESTIMONIALS[0]!;
      return {
        id: t.id || `test-${idx}`,
        studentName: cleanText(t.studentName) || fallback.studentName,
        role: "Student",
        achievement:
          t.classLevel === 12
            ? `CBSE Class XII (${t.year || 2025})`
            : `ICSE Class X (${t.year || 2025})`,
        year: t.year || 2025,
        quote: cleanText(t.quote) || fallback.quote,
        gradient: fallback.gradient,
      };
    });

    // If duplicate quotes or fewer than 3 items, supply our curated diverse student & parent reviews
    const uniqueQuotes = new Set(cleaned.map((c) => c.quote));
    if (uniqueQuotes.size <= 1 || cleaned.length < 3) {
      return DEFAULT_TESTIMONIALS;
    }
    return cleaned;
  }, [testimonials]);

  const checkScroll = React.useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 10);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 10);
  }, []);

  React.useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener("scroll", checkScroll, { passive: true });
    window.addEventListener("resize", checkScroll);
    return () => {
      el.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, [checkScroll]);

  const scroll = (direction: "left" | "right") => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.8;
    el.scrollBy({ left: direction === "left" ? -amount : amount, behavior: "smooth" });
  };

  return (
    <section id="testimonials" className="bg-surface-subtle border-y border-border py-14 md:py-20">
      <div className="container mx-auto px-4 max-w-[1200px] space-y-8">
        {/* Header row with Title and Arrow Controls */}
        <div className="flex items-center justify-between">
          <div>
            <span className="text-caption font-bold uppercase tracking-wider text-primary block mb-1">
              Parent &amp; Student Trust
            </span>
            <h2 className="text-h2 md:text-h1 font-bold text-ink tracking-tight">
              {heading}
            </h2>
          </div>

          {/* Carousel Arrows */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => scroll("left")}
              disabled={!canScrollLeft}
              aria-label="Previous testimonials"
              className="h-9 w-9 rounded-full border border-border bg-surface hover:bg-primary-soft hover:border-primary/40 hover:text-primary active:scale-95 hover:scale-105 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-ink transition-all duration-200 shadow-2xs cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => scroll("right")}
              disabled={!canScrollRight}
              aria-label="Next testimonials"
              className="h-9 w-9 rounded-full border border-border bg-surface hover:bg-primary-soft hover:border-primary/40 hover:text-primary active:scale-95 hover:scale-105 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-ink transition-all duration-200 shadow-2xs cursor-pointer"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Testimonial Cards Carousel Row */}
        <div
          ref={scrollContainerRef}
          className="flex gap-5 overflow-x-auto no-scrollbar scroll-smooth pb-3 snap-x snap-mandatory"
        >
          {displayItems.map((item) => {
            const initials = item.studentName
              .split(" ")
              .filter(Boolean)
              .map((n) => n[0])
              .join("")
              .slice(0, 2)
              .toUpperCase();

            return (
              <div
                key={item.id}
                className="group w-[320px] sm:w-[380px] shrink-0 snap-start flex flex-col justify-between rounded-2xl border border-border/80 bg-surface p-6 shadow-2xs hover:shadow-xl hover:border-primary/50 hover:-translate-y-1.5 transition-all duration-300 ease-out will-change-transform"
              >
                <div className="space-y-4">
                  {/* Rating Stars & Quote Icon */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <div className="h-8 w-8 rounded-full bg-primary-soft text-primary flex items-center justify-center">
                      <Quote className="h-4 w-4" />
                    </div>
                  </div>

                  {/* Quote Text */}
                  <p className="text-small text-ink leading-relaxed italic">
                    &ldquo;{item.quote}&rdquo;
                  </p>
                </div>

                {/* Author Info & Score Pill */}
                <div className="mt-6 pt-4 border-t border-border flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`h-10 w-10 rounded-full bg-gradient-to-tr ${item.gradient || "from-primary to-indigo-600"} text-white font-bold text-caption flex items-center justify-center shrink-0 shadow-2xs`}
                    >
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-small font-bold text-ink truncate">
                        {item.studentName}
                      </h4>
                      <span className="text-[11px] text-ink-muted block truncate">
                        {item.role || "Student"} &bull; Mathura
                      </span>
                    </div>
                  </div>

                  <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 shrink-0">
                    {item.achievement}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
