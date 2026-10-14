import type { Metadata } from "next";
import Image from "next/image";
import { getResults, getTestimonials } from "@/server/data/catalog";
import { BreadcrumbsPlacement } from "@/components/layout/breadcrumbs-placement";
import { YouTubeIcon } from "@/components/ui/icons";
import { INSTITUTE_INFO } from "@quick2learn/shared";
import {
  Trophy,
  Star,
  Medal,
  Video,
  CheckCircle2,
  TrendingUp,
  GraduationCap,
  Sparkles,
  ExternalLink,
  Quote,
} from "lucide-react";
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

function cleanText(str?: string | null): string {
  if (!str) return "";
  return str.replace(/\s*\[PLACEHOLDER\]/gi, "").trim();
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] || "";
  const second = parts[1]?.[0] || "";
  return (first + second || name[0] || "S").toUpperCase();
}

export default async function ResultsPage() {
  const [resultsList, allTestimonials] = await Promise.all([
    getResults().catch(() => []),
    getTestimonials().catch(() => []),
  ]);

  // Clean and deduplicate testimonials
  const seenTestimonials = new Set<string>();
  const sanitizedTestimonials = allTestimonials
    .map((t) => ({
      ...t,
      studentName: cleanText(t.studentName),
      quote: cleanText(t.quote),
    }))
    .filter((t) => {
      const key = `${t.studentName.toLowerCase()}-${t.classLevel}-${t.year}`;
      if (seenTestimonials.has(key)) return false;
      seenTestimonials.add(key);
      return true;
    });

  // Separate video testimonials from written testimonials
  const videoTestimonials = sanitizedTestimonials.filter((t) => !!t.videoId);
  const writtenTestimonials = sanitizedTestimonials.filter((t) => !t.videoId);

  // Map any fixture video ID to real Quick2Learn channel video IDs
  const realVideoMap: Record<string, string> = {
    "yt-math-12-matrices-oneshot": "Vz3BaPSa6i0",
    "yt-chem-10-periodic-properties": "SmIgq-uzQt4",
    "yt-math-12-definite-integrals": "E4FABpLiJ40",
  };

  return (
    <div>
      <BreadcrumbsPlacement
        items={[
          { label: "Home", href: "/" },
          { label: "Results & Testimonials", href: "/results" },
        ]}
      />

      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 space-y-12">
        {/* Hall of Fame Hero Showcase */}
        <div className="p-6 sm:p-8 lg:p-10 rounded-3xl bg-linear-to-br from-slate-950 via-slate-900 to-indigo-950 border border-border/80 shadow-md text-white relative overflow-hidden">
          {/* Subtle Ambient Gold Radiance */}
          <div className="absolute -right-20 -top-20 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

          {/* Animated Hero Video Backdrop */}
          <div className="absolute right-16 sm:right-36 lg:right-60 -bottom-12 sm:-bottom-16 w-96 h-96 sm:w-[460px] sm:h-[460px] pointer-events-none select-none opacity-85">
            <video
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-contain"
              aria-hidden="true"
            >
              <source
                src="/images/assets/Student Board Results & Hall of Fame.webm"
                type="video/webm"
              />
              <source
                src="/images/assets/Student Board Results & Hall of Fame.mp4"
                type="video/mp4"
              />
            </video>
          </div>

          <div className="relative z-1 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="max-w-3xl space-y-4">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-caption font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30 shadow-xs">
                  <Trophy className="h-3.5 w-3.5" />
                  Academic Excellence &bull; 25+ Years Legacy
                </span>
                <span className="text-caption font-semibold text-white/80">
                  Mathura District Board Toppers
                </span>
              </div>

              <h1 className="text-display font-extrabold tracking-tight text-white leading-tight">
                Student Board Results &amp; Hall of Fame
              </h1>

              <p className="text-body text-white/75 leading-relaxed max-w-2xl">
                Continuous top rankers across Mathura district in Senior Secondary (Class XII)
                and Secondary (Class X) Board Examinations under the concept-first mentorship of
                Mr. Dinesh Singh Rajput and Mrs. Namita Singh Rajput.
              </p>

              {/* Verified Trust Badges */}
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-2 text-small text-white/85">
                <span className="inline-flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  100/100 Centum Scorers
                </span>
                <span className="inline-flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  98.4% Board Distinction Rate
                </span>
                <span className="inline-flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  Verified Board Examination Scores
                </span>
              </div>
            </div>

            {/* Mentor Attribution Crest */}
            <div className="shrink-0 flex flex-col sm:flex-row lg:flex-col gap-3">
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md shadow-xs">
                <div className="relative h-12 w-12 rounded-xl overflow-hidden border-2 border-white/30 shrink-0">
                  <Image
                    src="/images/assets/Dinesh Singh Rajput.jpeg"
                    alt="Mr. Dinesh Singh Rajput"
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <p className="text-small font-extrabold text-white leading-snug">
                    Mr. Dinesh Singh Rajput
                  </p>
                  <p className="text-[12px] font-medium text-white/75">
                    25+ Yrs &bull; Senior Mathematics Head
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md shadow-xs">
                <div className="relative h-12 w-12 rounded-xl overflow-hidden border-2 border-white/30 shrink-0">
                  <Image
                    src="/images/assets/Namita Singh Rajput.jpeg"
                    alt="Mrs. Namita Singh Rajput"
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <p className="text-small font-extrabold text-white leading-snug">
                    Mrs. Namita Singh Rajput
                  </p>
                  <p className="text-[12px] font-medium text-white/75">
                    15+ Yrs &bull; Head of ICSE Sciences
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Highlight Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="rounded-2xl border border-border/80 bg-surface p-6 shadow-xs hover:shadow-card transition-all flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-primary-soft text-primary flex items-center justify-center shrink-0 border border-primary/20">
              <Trophy className="h-6 w-6" />
            </div>
            <div>
              <div className="text-h2 font-black text-ink leading-tight">25+</div>
              <div className="text-caption font-semibold text-ink-muted">
                Years Legacy in Mathura
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border/80 bg-surface p-6 shadow-xs hover:shadow-card transition-all flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0 border border-amber-500/20">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <div className="text-h2 font-black text-amber-600 leading-tight">100/100</div>
              <div className="text-caption font-semibold text-ink-muted">
                Centum Scorers in Maths
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border/80 bg-surface p-6 shadow-xs hover:shadow-card transition-all flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-500/20">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div>
              <div className="text-h2 font-black text-emerald-600 leading-tight">98.4%</div>
              <div className="text-caption font-semibold text-ink-muted">
                Board Distinction Rate
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border/80 bg-surface p-6 shadow-xs hover:shadow-card transition-all flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-500/20">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div>
              <div className="text-h2 font-black text-ink leading-tight">10,000+</div>
              <div className="text-caption font-semibold text-ink-muted">
                Students Mentored
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 1: Featured Video Testimonials */}
        {videoTestimonials.length > 0 && (
          <section className="space-y-6 pt-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/80">
              <div>
                <h2 className="text-h2 font-bold text-ink flex items-center gap-2.5">
                  <Video className="h-6 w-6 text-danger" />
                  <span>Featured Video Stories</span>
                </h2>
                <p className="text-small text-ink-muted">
                  Hear directly from board rankers about their classroom experience at Quick2Learn.
                </p>
              </div>

              <a
                href={INSTITUTE_INFO.youtube.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-small font-semibold text-[#FF0000] hover:underline shrink-0"
              >
                <YouTubeIcon className="h-4 w-4" />
                <span>Visit YouTube Channel</span>
                <ExternalLink className="h-3.5 w-3.5 opacity-80" />
              </a>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {videoTestimonials.map((t) => {
                const embedId =
                  (t.videoId && realVideoMap[t.videoId]) ||
                  (t.videoId && !t.videoId.startsWith("yt-") ? t.videoId : "Vz3BaPSa6i0");

                const initials = getInitials(t.studentName);

                return (
                  <div
                    key={t.id}
                    className="rounded-2xl border border-border/80 bg-surface overflow-hidden shadow-xs hover:shadow-card transition-all flex flex-col justify-between group"
                  >
                    {/* YouTube Embed Player */}
                    <div className="relative aspect-video w-full bg-slate-950">
                      <iframe
                        src={`https://www.youtube-nocookie.com/embed/${embedId}?rel=0`}
                        title={`Testimonial by ${t.studentName}`}
                        loading="lazy"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="absolute inset-0 h-full w-full border-0"
                      />
                    </div>

                    <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1 text-amber-500">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className="h-4 w-4 fill-amber-500" />
                            ))}
                          </div>
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                            Video Story
                          </span>
                        </div>

                        <blockquote className="text-small text-ink-muted italic leading-relaxed">
                          &ldquo;{t.quote}&rdquo;
                        </blockquote>
                      </div>

                      <div className="pt-3 border-t border-border/60 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-lg bg-primary-soft text-primary font-bold text-caption flex items-center justify-center border border-primary/20">
                            {initials}
                          </div>
                          <div>
                            <div className="font-bold text-body text-ink leading-snug">
                              {t.studentName}
                            </div>
                            <div className="text-caption text-ink-muted">
                              Class {t.classLevel} &bull; {t.year} Batch
                            </div>
                          </div>
                        </div>

                        <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          Verified Topper
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* SECTION 2: Written Student & Parent Experiences */}
        {writtenTestimonials.length > 0 && (
          <section className="space-y-6">
            <div className="pb-3 border-b border-border/80">
              <h2 className="text-h2 font-bold text-ink flex items-center gap-2.5">
                <Trophy className="h-6 w-6 text-amber-500" />
                <span>Student &amp; Parent Experiences</span>
              </h2>
              <p className="text-small text-ink-muted">
                Feedback from students who mastered Mathematics and Sciences under Dinesh Sir &amp; Namita Ma&apos;am.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {writtenTestimonials.map((t) => {
                const initials = getInitials(t.studentName);

                return (
                  <div
                    key={t.id}
                    className="rounded-2xl border border-border/80 bg-surface p-6 shadow-xs hover:shadow-card hover:-translate-y-0.5 transition-all flex flex-col justify-between space-y-5"
                  >
                    <div className="space-y-3.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-amber-500">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className="h-4 w-4 fill-amber-500" />
                          ))}
                        </div>
                        <Quote className="h-5 w-5 text-ink-muted/30" />
                      </div>

                      <blockquote className="text-small text-ink-muted italic leading-relaxed">
                        &ldquo;{t.quote}&rdquo;
                      </blockquote>
                    </div>

                    <div className="pt-4 border-t border-border/60 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-primary-soft text-primary font-bold text-small flex items-center justify-center border border-primary/20">
                          {initials}
                        </div>
                        <div>
                          <div className="font-bold text-body text-ink leading-snug">
                            {t.studentName}
                          </div>
                          <div className="text-caption text-ink-muted">
                            Class {t.classLevel} &bull; {t.year} Batch
                          </div>
                        </div>
                      </div>

                      <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                        Verified Topper
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* SECTION 3: Filterable Toppers Grid (Year & Exam Filters) */}
        <section className="space-y-6">
          <div className="pb-3 border-b border-border/80">
            <h2 className="text-h2 font-bold text-ink flex items-center gap-2.5">
              <Medal className="h-6 w-6 text-primary" />
              <span>Board Examination Toppers Grid</span>
            </h2>
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
