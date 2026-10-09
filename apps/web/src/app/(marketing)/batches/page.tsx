import type { Metadata } from "next";
import { getBatchesWithFilters } from "@/server/data/batches";
import { BreadcrumbsPlacement } from "@/components/layout/breadcrumbs-placement";
import { BatchFilters } from "@/components/batches/batch-filters";
import { BatchCard } from "@/components/ui/batch-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Calendar, CheckCircle2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Classroom & Online Batches — Classes IX–XII CBSE & ICSE | Quick2Learn Mathura",
  description:
    "Explore upcoming Mathematics and Science batches in Mathura for CBSE & ICSE/ISC. Small batch sizes, personalized mentorship, Sunday tests, and proven 100/100 results.",
  alternates: {
    canonical: "/batches",
  },
  openGraph: {
    title: "Classroom & Online Batches | Quick2Learn Mathura",
    description:
      "Explore upcoming Mathematics and Science batches in Mathura for CBSE & ICSE/ISC.",
    url: "https://quick2learn.in/batches",
  },
  twitter: {
    card: "summary_large_image",
    title: "Classroom & Online Batches | Quick2Learn",
  },
};

interface BatchesPageProps {
  searchParams: Promise<{
    class?: string;
    board?: string;
    subject?: string;
    mode?: string;
    status?: string;
  }>;
}

export const revalidate = 3600;

export default async function BatchesPage({ searchParams }: BatchesPageProps) {
  const params = await searchParams;
  const classLevel = params.class && !isNaN(Number(params.class)) ? Number(params.class) : undefined;
  const board = params.board?.toLowerCase();
  const subjectSlug = params.subject?.toLowerCase();
  const mode = params.mode?.toLowerCase();
  const status = params.status?.toLowerCase();

  const batches = await getBatchesWithFilters({
    classLevel,
    board,
    subjectSlug,
    mode,
    status,
  });

  return (
    <div>
      <BreadcrumbsPlacement
        items={[
          { label: "Home", href: "/" },
          { label: "Batches", href: "/batches" },
        ]}
      />

      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        {/* Header Hero */}
        <div className="mb-10 p-6 sm:p-8 rounded-3xl bg-linear-to-br from-primary-soft/60 via-surface-subtle to-surface border border-border/80 shadow-xs space-y-5">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-caption font-bold bg-primary text-white shadow-xs">
              <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
              Academic Session 2026–27
            </span>
            <span className="text-caption font-semibold text-ink-muted">
              Enrollments Open for Offline &amp; Hybrid Batches
            </span>
          </div>

          <div className="max-w-3xl space-y-2.5">
            <h1 className="text-display font-extrabold tracking-tight text-ink">
              Coaching Batches in Mathura
            </h1>
            <p className="text-body text-ink-muted leading-relaxed">
              Intensive classroom and hybrid mentorship by Mr. Dinesh Singh Rajput (25+ years Senior Mathematics)
              and Mrs. Namita Singh Rajput (ICSE Sciences). Small batch sizes for individual doubt solving.
            </p>
          </div>

          {/* Key Advantages Strip */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-2 border-t border-border/60 text-small text-ink">
            <span className="inline-flex items-center gap-1.5 font-medium">
              <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
              100/100 Board Track Record
            </span>
            <span className="inline-flex items-center gap-1.5 font-medium">
              <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
              Max 25–30 Students / Batch
            </span>
            <span className="inline-flex items-center gap-1.5 font-medium">
              <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
              Weekly Sunday Board Mock Tests
            </span>
            <span className="inline-flex items-center gap-1.5 font-medium">
              <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
              1-on-1 Dedicated Doubt Clearance
            </span>
          </div>
        </div>

        {/* Filter Chips Bar */}
        <BatchFilters
          currentFilters={{
            classLevel,
            board,
            subjectSlug,
            mode,
            status,
          }}
          totalCount={batches.length}
        />

        {/* Batch Cards Grid or Empty State */}
        {batches.length === 0 ? (
          <EmptyState
            icon={<Calendar className="h-8 w-8 text-ink-muted" />}
            title="No Batches Found"
            description="No active batches match your selected filter criteria. Try resetting filters to explore all available batches."
            actionLabel="Reset Filters"
            actionHref="/batches"
            className="my-12"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7 lg:gap-8">
            {batches.map((b) => (
              <BatchCard
                key={b.id}
                id={b.id}
                title={b.title}
                grade={b.grade}
                board={b.board}
                facultyName={b.facultyName}
                facultyAvatar={b.facultyAvatar}
                schedule={b.schedule}
                pricePaise={b.pricePaise}
                originalPricePaise={b.originalPricePaise}
                admissionsOpen={b.admissionsOpen}
                mode={b.mode}
                href={b.href}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
