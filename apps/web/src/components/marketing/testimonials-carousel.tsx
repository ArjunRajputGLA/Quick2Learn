import * as React from "react";
import { CardCarousel } from "@/components/ui/card-carousel";
import { TestimonialCard } from "@/components/ui/testimonial-card";
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


export function TestimonialsCarousel({
  testimonials,
  heading = "What students and parents say",
}: TestimonialsCarouselProps) {
  if (!testimonials || testimonials.length === 0) {
    return null;
  }

  return (
    <section id="testimonials" className="bg-surface-subtle border-y border-border py-14 md:py-16">
      <div className="container mx-auto px-4 max-w-[1200px]">
        <CardCarousel heading={heading}>
          {testimonials.map((t) => {
            const achievementStr =
              t.classLevel === 12
                ? `CBSE Class XII Maths (${t.year})`
                : t.classLevel === 10
                ? `ICSE Class X Science (${t.year})`
                : `Class ${t.classLevel} (${t.year})`;

            return (
              <TestimonialCard
                key={t.id}
                quote={t.quote}
                studentName={t.studentName}
                achievement={achievementStr}
                schoolOrCity="Mathura"
                stars={5}
                className="h-full bg-surface"
              />
            );
          })}
        </CardCarousel>
      </div>
    </section>
  );
}
