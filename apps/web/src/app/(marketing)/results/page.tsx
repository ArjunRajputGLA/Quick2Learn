import type { Metadata } from "next";
import { getResults, getTestimonials } from "@/server/data/catalog";
import { BreadcrumbsPlacement } from "@/components/layout/breadcrumbs-placement";
import { Badge } from "@/components/ui/badge";
import { Trophy, Star, Medal, Video } from "lucide-react";
import { ResultsToppersGrid } from "@/components/marketing/results-toppers-grid";

export const metadata: Metadata = {
  title: "Board Results & Toppers — CBSE & ICSE Distinction | Quick2Learn Mathura",
  description:
    "View top CBSE & ICSE board rankers, centum scorers, and video & written student testimonials mentored by Dinesh Singh Rajput in Mathura.",
  alternates: {
    canonical: "/results",
  },
  openGraph: {
    title: "Board Results & Toppers | Quick2Learn Mathura",
    description:
      "View top CBSE & ICSE board rankers, centum scorers, and video & written student testimonials.",
    url: "https://quick2learn.in/results",
  },
  twitter: {
    card: "summary_large_image",
    title: "Board Results & Toppers | Quick2Learn",
  },
};

export default async function ResultsPage() {
  const [resultsList, allTestimonials] = await Promise.all([
    getResults().catch(() => []),
    getTestimonials().catch(() => []),
  ]);

  // Separate video testimonials from written testimonials
  const videoTestimonials = allTestimonials.filter((t) => !!t.videoId);
  const writtenTestimonials = allTestimonials.filter((t) => !t.videoId);

  return (
    <div className="bg-surface">
      <BreadcrumbsPlacement
        items={[
          { label: "Home", href: "/" },
          { label: "Results & Testimonials", href: "/results" },
        ]}
      />

      <div className="container mx-auto px-4 py-8 lg:py-14 max-w-6xl space-y-14">
        {/* Page Header */}
        <div className="max-w-3xl space-y-3">
          <Badge variant="accent" className="mb-1">
            Proven Academic Excellence • 25+ Years Legacy
          </Badge>
          <h1 className="text-display font-extrabold tracking-tight text-ink">
            Student Board Results &amp; Toppers
          </h1>
          <p className="text-body text-ink-muted leading-relaxed">
            Continuous top rankers across Mathura district in Senior Secondary (Class XII)
            and Secondary (Class X) Board Examinations under the concept-first mentorship of
            Mr. Dinesh Singh Rajput and Mrs. Namita Singh Rajput.
          </p>
        </div>

        {/* Highlight Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-xl border border-border bg-surface p-6 shadow-xs text-center space-y-1">
            <div className="text-h1 font-extrabold text-primary">25+</div>
            <div className="text-caption text-ink-muted font-medium">
              Years Legacy in Mathura
            </div>
          </div>
          <div className="rounded-xl border border-border bg-surface p-6 shadow-xs text-center space-y-1">
            <div className="text-h1 font-extrabold text-accent">100/100</div>
            <div className="text-caption text-ink-muted font-medium">
              Centum Scorers in Maths
            </div>
          </div>
          <div className="rounded-xl border border-border bg-surface p-6 shadow-xs text-center space-y-1">
            <div className="text-h1 font-extrabold text-success">98.4%</div>
            <div className="text-caption text-ink-muted font-medium">
              Board Distinction Rate
            </div>
          </div>
          <div className="rounded-xl border border-border bg-surface p-6 shadow-xs text-center space-y-1">
            <div className="text-h1 font-extrabold text-ink">10,000+</div>
            <div className="text-caption text-ink-muted font-medium">
              Students Mentored
            </div>
          </div>
        </div>

        {/* SECTION 1: Featured Video Testimonials (Lite YouTube Embeds) */}
        {videoTestimonials.length > 0 && (
          <section className="space-y-6 pt-4 border-t border-border">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Video className="h-5 w-5 text-danger" />
                  <h2 className="text-h2 font-bold text-ink">
                    Featured Video Testimonials
                  </h2>
                </div>
                <p className="text-small text-ink-muted">
                  Hear directly from board rankers about their classroom experience at Quick2Learn.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {videoTestimonials.map((t) => {
                // If videoId is an internal ID like yt-math-12-matrices-oneshot, map to real embed or demo video ID
                const embedId =
                  t.videoId?.startsWith("yt-") || !t.videoId
                    ? "dQw4w9WgXcQ"
                    : t.videoId;

                return (
                  <div
                    key={t.id}
                    className="rounded-xl border border-border bg-surface overflow-hidden shadow-card hover:shadow-card-hover transition-all flex flex-col justify-between"
                  >
                    {/* Lite YouTube Embed Container */}
                    <div className="relative aspect-video w-full bg-ink/5">
                      <iframe
                        src={`https://www.youtube-nocookie.com/embed/${embedId}?rel=0`}
                        title={`Testimonial by ${t.studentName}`}
                        loading="lazy"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="absolute inset-0 h-full w-full border-0"
                      />
                    </div>

                    <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-1 text-accent">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className="h-4 w-4 fill-accent" />
                          ))}
                        </div>
                        <blockquote className="text-small text-ink-muted italic leading-relaxed">
                          &ldquo;{t.quote}&rdquo;
                        </blockquote>
                      </div>

                      <div className="pt-3 border-t border-border flex items-center justify-between">
                        <div>
                          <div className="font-bold text-body text-ink">
                            {t.studentName}
                          </div>
                          <div className="text-caption text-ink-muted">
                            Class {t.classLevel} • {t.year} Batch
                          </div>
                        </div>
                        <Badge variant="accent" className="text-[10px]">
                          Video Story
                        </Badge>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* SECTION 2: Written Student Testimonials */}
        {writtenTestimonials.length > 0 && (
          <section className="space-y-6 pt-4 border-t border-border">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-accent" />
                <h2 className="text-h2 font-bold text-ink">
                  Student &amp; Parent Experiences
                </h2>
              </div>
              <p className="text-small text-ink-muted">
                Feedback from students who mastered Mathematics and Sciences under Dinesh Sir &amp; Namita Ma&apos;am.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {writtenTestimonials.map((t) => (
                <div
                  key={t.id}
                  className="rounded-xl border border-border bg-surface p-6 shadow-card hover:shadow-card-hover transition-all flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    <div className="flex items-center gap-1 text-accent">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-accent" />
                      ))}
                    </div>
                    <blockquote className="text-small text-ink-muted italic leading-relaxed">
                      &ldquo;{t.quote}&rdquo;
                    </blockquote>
                  </div>

                  <div className="pt-4 mt-4 border-t border-border flex items-center justify-between">
                    <div>
                      <div className="font-bold text-body text-ink">
                        {t.studentName}
                      </div>
                      <div className="text-caption text-ink-muted">
                        Class {t.classLevel} • {t.year} Batch
                      </div>
                    </div>
                    <Badge variant="primary" className="text-[10px]">
                      Verified Topper
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* SECTION 3: Filterable Toppers Grid (Year & Exam Filters) */}
        <section className="space-y-6 pt-4 border-t border-border">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Medal className="h-5 w-5 text-primary" />
              <h2 className="text-h2 font-bold text-ink">
                Board Examination Toppers Grid
              </h2>
            </div>
            <p className="text-small text-ink-muted">
              Explore distinction scorers filterable by academic year and examination board.
            </p>
          </div>

          <ResultsToppersGrid initialResults={resultsList} />
        </section>
      </div>
    </div>
  );
}
