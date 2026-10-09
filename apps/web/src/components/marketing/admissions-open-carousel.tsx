import * as React from "react";
import { CardCarousel } from "@/components/ui/card-carousel";
import { BatchCard } from "@/components/ui/batch-card";
import type { FormattedBatchCardData } from "@/server/data/batches";

export interface AdmissionsOpenCarouselProps {
  heading?: string;
  batches: FormattedBatchCardData[];
}

export function AdmissionsOpenCarousel({
  heading = "Admissions open",
  batches,
}: AdmissionsOpenCarouselProps) {
  if (!batches || batches.length === 0) {
    return null;
  }

  return (
    <section id="batches" className="bg-surface-subtle border-y border-border py-14 md:py-16">
      <div className="container mx-auto px-4 max-w-[1200px]">
        <CardCarousel
          heading={heading}
          viewAllHref="/batches"
          viewAllText="View all batches"
        >
          {batches.map((batch) => (
            <BatchCard
              key={batch.id}
              id={batch.id}
              title={batch.title?.replace(/\s*\[PLACEHOLDER\]/gi, "")}
              grade={batch.grade}
              board={batch.board}
              facultyName={batch.facultyName}
              facultyAvatar={batch.facultyAvatar}
              schedule={batch.schedule}
              pricePaise={batch.pricePaise}
              originalPricePaise={batch.originalPricePaise}
              admissionsOpen={batch.admissionsOpen}
              coverImageUrl={batch.coverImageUrl}
              href={batch.href}
            />
          ))}
        </CardCarousel>
      </div>
    </section>
  );
}
