import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { getPopularVideos, getShortVideos, getPlaylistsWithDetails } from "@/server/data/videos";
import { getSubjects } from "@/server/data/catalog";
import { BreadcrumbsPlacement } from "@/components/layout/breadcrumbs-placement";
import { Badge } from "@/components/ui/badge";
import { CardCarousel } from "@/components/ui/card-carousel";
import { LectureCard } from "@/components/ui/lecture-card";
import { YouTubeIcon } from "@/components/ui/icons";
import {
  GraduationCap,
  BookOpen,
  ArrowRight,
  Flame,
  ListVideo,
  CheckCircle2,
  Calculator,
  FlaskConical,
  Sparkles,
  Landmark,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Free Video Library & Study Material — Classes IX–XII | Quick2Learn",
  description:
    "Browse structured CBSE & ICSE syllabus, chapter-wise video lectures in Hindi, formula sheets, and past-year solved papers across Mathematics, Physics, Chemistry, and Biology.",
  alternates: {
    canonical: "/learn",
  },
  openGraph: {
    title: "Free Video Library & Study Material | Quick2Learn",
    description:
      "Browse structured CBSE & ICSE syllabus, chapter-wise video lectures in Hindi, formula sheets, and past-year solved papers.",
    url: "https://quick2learn.in/learn",
  },
  twitter: {
    card: "summary_large_image",
    title: "Free Video Library & Study Material | Quick2Learn",
  },
};

export const revalidate = 3600; // Tag-based and hourly revalidation

export default async function LearnOverviewPage() {
  const [latestLectures, shortVideos, playlists, subjects] = await Promise.all([
    getPopularVideos("latest", 8),
    getShortVideos(12),
    getPlaylistsWithDetails(8),
    getSubjects(),
  ]);

  const classTiles = [
    {
      level: 9,
      roman: "IX",
      slug: "ix",
      title: "Class IX Foundation",
      description: "Build strong concepts in Algebra, Geometry, Biology, Chemistry, ICSE 9 Hindi, and History & Civics.",
      badge: "Class 9th",
      featuredSubject: "mathematics",
      accentBorder: "hover:border-emerald-500/40",
      accentBg: "from-emerald-500/10 to-transparent",
      badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
    },
    {
      level: 10,
      roman: "X",
      slug: "x",
      title: "Class X Board Prep",
      description: "Master Real Numbers, Trigonometry, Science, and Board Mock PYQs.",
      badge: "Board Year",
      featuredSubject: "mathematics",
      accentBorder: "hover:border-amber-500/40",
      accentBg: "from-amber-500/10 to-transparent",
      badgeColor: "bg-amber-50 text-amber-700 border-amber-200",
    },
    {
      level: 11,
      roman: "XI",
      slug: "xi",
      title: "Class XI Core Curriculum",
      description: "Conic Sections, Trigonometric Identities, Vectors, and Senior Secondary rigor.",
      badge: "Senior Secondary",
      featuredSubject: "mathematics",
      accentBorder: "hover:border-sky-500/40",
      accentBg: "from-sky-500/10 to-transparent",
      badgeColor: "bg-sky-50 text-sky-700 border-sky-200",
    },
    {
      level: 12,
      roman: "XII",
      slug: "xii",
      title: "Class XII Board Booster",
      description: "Matrices, Calculus, Integrals, Probability, and 100/100 Board exam strategy.",
      badge: "Target 100/100",
      featuredSubject: "mathematics",
      accentBorder: "hover:border-indigo-500/40",
      accentBg: "from-indigo-500/10 to-transparent",
      badgeColor: "bg-indigo-50 text-indigo-700 border-indigo-200",
    },
  ];

  return (
    <div>
      <BreadcrumbsPlacement
        items={[
          { label: "Home", href: "/" },
          { label: "Free Library", href: "/learn" },
        ]}
      />

      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 space-y-12">
        {/* Header Hero Showcase */}
        <div className="p-6 sm:p-8 lg:p-10 rounded-3xl bg-linear-to-br from-slate-950 via-slate-900 to-indigo-950 border border-border/80 shadow-md text-white relative overflow-hidden">
          {/* Subtle Ambient Glow */}
          <div className="absolute -right-20 -top-20 w-96 h-96 bg-primary/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-1 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="max-w-3xl space-y-4">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-caption font-bold bg-white/10 text-white backdrop-blur-md border border-white/15 shadow-xs">
                  <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                  Free Video Library &amp; Syllabus
                </span>
                <span className="text-caption font-semibold text-white/80">
                  Classes IX–XII • CBSE &amp; ICSE / ISC
                </span>
              </div>

              <h1 className="text-display font-extrabold tracking-tight text-white leading-tight">
                Maths &amp; Science Video Lessons
              </h1>

              <p className="text-body text-white/75 leading-relaxed max-w-2xl">
                Step-by-step NCERT concepts, formula revision sheets, and board exam
                masterclasses mentored by Mr. Dinesh Singh Rajput (25+ years Mathematics)
                and Mrs. Namita Singh Rajput (ICSE Sciences) in Mathura.
              </p>

              {/* Highlights */}
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-2 text-small text-white/85">
                <span className="inline-flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  Chapter-wise Structured Syllabus
                </span>
                <span className="inline-flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  Free Concept Breakdowns in Hindi
                </span>
                <span className="inline-flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  Board Exam PYQ Solutions
                </span>
              </div>
            </div>

            {/* Faculty Attribution Cards */}
            <div className="shrink-0 flex flex-col sm:flex-row lg:flex-col gap-3">
              {/* Dinesh Sir */}
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
                    25+ Yrs • Senior Mathematics Head
                  </p>
                </div>
              </div>

              {/* Namita Ma'am */}
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
                    15+ Yrs • Head of ICSE Sciences
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 1. Class Tiles */}
        <section className="space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-border/80">
            <h2 className="text-h2 font-bold text-ink flex items-center gap-2.5">
              <GraduationCap className="h-6 w-6 text-primary" />
              <span>Browse by Class</span>
            </h2>
            <span className="text-caption font-semibold text-ink-muted">
              CBSE &amp; ICSE / ISC
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {classTiles.map((cls) => (
              <div
                key={cls.slug}
                className={`group relative rounded-2xl border border-border/80 bg-surface p-6 shadow-xs hover:shadow-card ${cls.accentBorder} transition-all flex flex-col justify-between`}
              >
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between">
                    <span className="h-10 w-10 rounded-xl bg-primary-soft text-primary font-black text-[16px] flex items-center justify-center border border-primary/20 shadow-xs group-hover:bg-primary group-hover:text-white transition-all">
                      {cls.roman}
                    </span>
                    <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${cls.badgeColor}`}>
                      {cls.badge}
                    </span>
                  </div>
                  <h3 className="font-bold text-[17px] text-ink group-hover:text-primary transition-colors leading-snug">
                    {cls.title}
                  </h3>
                  <p className="text-small text-ink-muted leading-relaxed">
                    {cls.description}
                  </p>
                </div>

                <div className="pt-5 mt-5 border-t border-border/60 flex items-center justify-between">
                  <Link
                    href={`/learn/${cls.slug}/${cls.featuredSubject}`}
                    className="inline-flex items-center gap-2 text-small font-semibold text-primary group-hover:underline"
                  >
                    <span>Explore Syllabus</span>
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 2. Subject Tiles */}
        <section className="space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-border/80">
            <h2 className="text-h2 font-bold text-ink flex items-center gap-2.5">
              <BookOpen className="h-6 w-6 text-accent" />
              <span>Explore by Subject</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {subjects.map((sub) => {
              const isMath = /math/i.test(sub.name);
              const isHistoryCivics = sub.slug === "history-civics";
              const isHindi = sub.slug === "hindi";
              const faculty = isMath
                ? "Mr. Dinesh Singh Rajput"
                : sub.slug === "chemistry" || sub.slug === "biology" || isHindi || isHistoryCivics
                  ? "Mrs. Namita Singh Rajput"
                  : "Senior Subject Mentor";

              const hrefClass = isHindi || isHistoryCivics ? "ix" : "xii";
              const badgeClass = isHindi || isHistoryCivics ? "Class IX" : "Classes IX–XII";

              return (
                <Link
                  key={sub.id}
                  href={`/learn/${hrefClass}/${sub.slug}`}
                  className="rounded-2xl border border-border/80 bg-surface p-5 hover:border-primary/40 hover:shadow-card transition-all group block"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="h-9 w-9 rounded-xl bg-primary-soft text-primary flex items-center justify-center border border-primary/10">
                      {isMath ? (
                        <Calculator className="h-4.5 w-4.5" />
                      ) : isHistoryCivics ? (
                        <Landmark className="h-4.5 w-4.5" />
                      ) : isHindi ? (
                        <BookOpen className="h-4.5 w-4.5" />
                      ) : (
                        <FlaskConical className="h-4.5 w-4.5" />
                      )}
                    </div>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-surface-subtle text-ink-muted border border-border">
                      {badgeClass}
                    </span>
                  </div>
                  <h3 className="font-bold text-[16px] text-ink group-hover:text-primary transition-colors mb-1">
                    {sub.name}
                  </h3>
                  <p className="text-caption text-ink-muted">Faculty: {faculty}</p>
                </Link>
              );
            })}
          </div>
        </section>

        {/* 3. Latest Lectures Carousel */}
        {latestLectures.length > 0 && (
          <section className="space-y-4">
            <CardCarousel heading="Latest Published Lectures">
              {latestLectures.map((lec) => (
                <div key={lec.id} className="min-w-[280px] sm:min-w-[320px]">
                  <LectureCard {...lec} />
                </div>
              ))}
            </CardCarousel>
          </section>
        )}

        {/* 4. Featured Playlists */}
        {playlists.length > 0 && (
          <section className="space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-border/80">
              <h2 className="text-h2 font-bold text-ink flex items-center gap-2.5">
                <ListVideo className="h-6 w-6 text-primary" />
                <span>Curated YouTube Playlists</span>
              </h2>
              <span className="text-caption font-semibold text-ink-muted">
                Official Channel Series
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {playlists.map((pl) => (
                <a
                  key={pl.playlist.id}
                  href={`https://www.youtube.com/playlist?list=${pl.playlist.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group rounded-2xl border border-border/80 bg-surface overflow-hidden shadow-xs hover:shadow-card hover:border-primary/40 transition-all flex flex-col justify-between"
                >
                  <div className="p-5 space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-surface-subtle text-ink-muted border border-border">
                        {pl.playlist.itemCount} Videos
                      </span>
                      <YouTubeIcon className="h-4 w-4 text-danger" />
                    </div>
                    <h3 className="font-semibold text-body text-ink line-clamp-2 group-hover:text-primary transition-colors">
                      {pl.playlist.title}
                    </h3>
                    {pl.playlist.description && (
                      <p className="text-caption text-ink-muted line-clamp-2">
                        {pl.playlist.description}
                      </p>
                    )}
                  </div>

                  <div className="p-5 pt-0 flex items-center gap-1.5 text-small font-semibold text-primary">
                    <span>Open Playlist</span>
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                  </div>
                </a>
              ))}
            </div>
          </section>
        )}

        {/* 5. Shorts Row (Short videos < 180s) */}
        {shortVideos.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-border/80">
              <Flame className="h-5 w-5 text-accent" />
              <h2 className="text-h2 font-bold text-ink">
                Quick Revision Shorts &amp; QAs
              </h2>
              <Badge variant="accent" className="ml-2 text-[10px]">
                Under 3 mins
              </Badge>
            </div>

            <CardCarousel heading="Short Concepts">
              {shortVideos.map((s) => (
                <div key={s.id} className="min-w-[240px] sm:min-w-[280px]">
                  <LectureCard {...s} />
                </div>
              ))}
            </CardCarousel>
          </section>
        )}
      </div>
    </div>
  );
}
