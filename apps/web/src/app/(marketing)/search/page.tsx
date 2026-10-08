import type { Metadata } from "next";
import Link from "next/link";
import { searchCatalogAdvanced } from "@/server/data/search";
import { BreadcrumbsPlacement } from "@/components/layout/breadcrumbs-placement";
import { SearchTypeahead } from "@/components/layout/search-typeahead";
import { SearchFilterRail } from "@/components/search/search-filter-rail";
import { SearchHeaderBar } from "@/components/search/search-header-bar";
import { SearchPagination } from "@/components/search/search-pagination";
import { LectureCard } from "@/components/ui/lecture-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { formatClassRoman } from "@quick2learn/shared";
import { Calendar, Search, ArrowRight, FileText } from "lucide-react";

interface SearchPageProps {
  searchParams: Promise<{
    q?: string;
    class?: string;
    board?: string;
    subject?: string;
    type?: string;
    duration?: string;
    sort?: string;
    page?: string;
  }>;
}

export async function generateMetadata({
  searchParams,
}: SearchPageProps): Promise<Metadata> {
  const params = await searchParams;
  const q = params.q?.trim();
  return {
    title: q
      ? `Search results for "${q}" | Quick2Learn`
      : "Search Lectures, Batches & Resources | Quick2Learn",
    description:
      "Search conceptual Mathematics and Science lectures, batches, and NCERT formulas on Quick2Learn.",
  };
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const q = params.q?.trim() || "";
  const classLevel = params.class ? Number(params.class) : undefined;
  const board = params.board?.toLowerCase();
  const subjectSlug = params.subject?.toLowerCase();
  const type = (params.type as "all" | "lecture" | "batch" | "notes") || "all";
  const duration =
    (params.duration as "all" | "under10" | "10to30" | "30plus") || "all";
  const sort = (params.sort as "relevance" | "newest" | "views") || (q ? "relevance" : "newest");
  const currentPage = Math.max(1, Number(params.page) || 1);

  const response = await searchCatalogAdvanced({
    q,
    classLevel: classLevel && !isNaN(classLevel) ? classLevel : undefined,
    board: board && board !== "all" ? board : undefined,
    subjectSlug: subjectSlug && subjectSlug !== "all" ? subjectSlug : undefined,
    type,
    duration,
    sort,
    page: currentPage,
    pageSize: 12,
  });

  const { items, totalCount, totalPages } = response;

  return (
    <div>
      <BreadcrumbsPlacement
        items={[
          { label: "Home", href: "/" },
          { label: "Search", href: "/search" },
          ...(q ? [{ label: `"${q}"` }] : []),
        ]}
      />

      <div className="container mx-auto px-4 py-8 lg:py-12">
        {/* Search Input Bar */}
        <div className="max-w-3xl mb-8 space-y-4">
          <h1 className="text-display font-extrabold tracking-tight text-ink">
            {q ? (
              <>
                Search Results for{" "}
                <span className="text-primary">&ldquo;{q}&rdquo;</span>
              </>
            ) : (
              "Browse Catalog & Video Library"
            )}
          </h1>
          <p className="text-body text-ink-muted">
            Search conceptual YouTube lectures, offline/live coaching batches,
            and NCERT syllabus chapters across Classes IX–XII.
          </p>
          <div className="pt-1">
            <SearchTypeahead className="max-w-xl" />
          </div>
        </div>

        {/* Coursera-style Layout: Filter Rail on Left, Results on Right */}
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Left Filter Rail */}
          <SearchFilterRail
            activeFilters={{
              classLevel: classLevel || null,
              board: board || null,
              subjectSlug: subjectSlug || null,
              type,
              duration,
              sort,
            }}
            totalCount={totalCount}
          />

          {/* Right Results Content */}
          <main className="flex-1 w-full min-w-0">
            {/* Header: Result count + Sort selector */}
            <SearchHeaderBar totalCount={totalCount} currentSort={sort} />

            {/* Results Grid or Empty State */}
            {items.length === 0 ? (
              <EmptyState
                icon={<Search className="h-8 w-8 text-ink-muted" />}
                title="No Results Found"
                description={
                  q
                    ? `We couldn't find any content matching "${q}" with the selected filters. Try adjusting your filter selections or searching for different keywords.`
                    : "No matching lectures or batches found for the selected filter combination."
                }
                actionLabel="Reset Filters"
                actionHref="/search"
                className="my-8"
              />
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                  {items.map((item) => {
                    if (item.type === "lecture") {
                      const classRoman = item.classLevel
                        ? formatClassRoman(item.classLevel)
                        : "XII";
                      return (
                        <LectureCard
                          key={`lecture-${item.id}`}
                          id={item.id}
                          title={item.title}
                          thumbnailUrl={item.thumbnailUrl || undefined}
                          duration={item.duration || "45m"}
                          gradeAndSubject={`Class ${classRoman} · ${
                            item.subjectName || "Maths"
                          }`}
                          faculty="Quick2Learn Mentor"
                          views={item.views || "1.2K views"}
                          publishedAt={item.publishedAt || "Recently"}
                          href={item.href}
                        />
                      );
                    }

                    if (item.type === "batch") {
                      const classRoman = item.classLevel
                        ? formatClassRoman(item.classLevel)
                        : "XII";
                      return (
                        <div
                          key={`batch-${item.id}`}
                          className="rounded-lg border border-border bg-surface p-5 shadow-card hover:shadow-card-hover transition-all flex flex-col justify-between"
                        >
                          <div className="space-y-3">
                            <div className="flex items-center justify-between gap-2">
                              <Badge variant="accent">Class {classRoman}</Badge>
                              {item.badgeText && (
                                <Badge variant="neutral" className="text-[10px]">
                                  {item.badgeText}
                                </Badge>
                              )}
                            </div>

                            <h3 className="font-bold text-body text-ink line-clamp-2">
                              {item.title}
                            </h3>

                            {item.subtitle && (
                              <p className="text-small text-ink-muted line-clamp-2">
                                {item.subtitle}
                              </p>
                            )}

                            <div className="flex items-center gap-2 text-caption text-ink-muted pt-1">
                              <Calendar className="h-3.5 w-3.5 text-accent" />
                              <span>{item.subjectName || "Comprehensive Syllabus"}</span>
                            </div>
                          </div>

                          <div className="pt-4 mt-4 border-t border-border/50">
                            <Link
                              href={item.href}
                              className="text-small font-semibold text-primary inline-flex items-center gap-1.5 hover:underline group"
                            >
                              <span>Explore Batch</span>
                              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                            </Link>
                          </div>
                        </div>
                      );
                    }

                    // item.type === "notes"
                    return (
                      <div
                        key={`notes-${item.id}`}
                        className="rounded-lg border border-border bg-surface p-5 shadow-card hover:shadow-card-hover transition-all flex flex-col justify-between"
                      >
                        <div className="space-y-3">
                          <div className="flex items-center justify-between gap-2">
                            <Badge variant="primary">Study Material</Badge>
                            {item.badgeText && (
                              <Badge variant="neutral" className="text-[10px]">
                                {item.badgeText}
                              </Badge>
                            )}
                          </div>

                          <h3 className="font-bold text-body text-ink line-clamp-2">
                            {item.title}
                          </h3>

                          {item.subtitle && (
                            <p className="text-caption text-ink-muted font-medium">
                              {item.subtitle}
                            </p>
                          )}

                          <div className="flex items-center gap-2 text-caption text-ink-muted pt-1">
                            <FileText className="h-3.5 w-3.5 text-primary" />
                            <span>Free Downloadable PDF</span>
                          </div>
                        </div>

                        <div className="pt-4 mt-4 border-t border-border/50">
                          <Link
                            href={item.href}
                            className="text-small font-semibold text-primary inline-flex items-center gap-1.5 hover:underline group"
                          >
                            <span>Open Chapter</span>
                            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Pagination */}
                <SearchPagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                />
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
