import type { Metadata } from "next";
import Link from "next/link";
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
      description: "Build strong concepts in Algebra, Geometry, Biology, and Basic Chemistry.",
      badge: "Classes 9th",
      featuredSubject: "mathematics",
    },
    {
      level: 10,
      roman: "X",
      slug: "x",
      title: "Class X Board Prep",
      description: "Master Real Numbers, Trigonometry, Science, and Board Mock PYQs.",
      badge: "Board Year",
      featuredSubject: "mathematics",
    },
    {
      level: 11,
      roman: "XI",
      slug: "xi",
      title: "Class XI Core Curriculum",
      description: "Conic Sections, Trigonometric Identities, Vectors, and Senior Secondary rigor.",
      badge: "Senior Secondary",
      featuredSubject: "mathematics",
    },
    {
      level: 12,
      roman: "XII",
      slug: "xii",
      title: "Class XII Board Booster",
      description: "Matrices, Calculus, Integrals, Probability, and 100/100 Board exam strategy.",
      badge: "Target 100/100",
      featuredSubject: "mathematics",
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

      <div className="container mx-auto px-4 py-8 lg:py-12 space-y-14">
        {/* Header Hero */}
        <div className="max-w-3xl space-y-3">
          <Badge variant="primary" className="mb-1">
            Free Video Library
          </Badge>
          <h1 className="text-display font-extrabold tracking-tight text-ink">
            Maths &amp; Science Video Lessons
          </h1>
          <p className="text-body text-ink-muted leading-relaxed">
            Step-by-step NCERT concepts, formula revision sheets, and board exam
            masterclasses mentored by Mr. Dinesh Singh Rajput (25+ years Mathematics)
            and Mrs. Namita Singh Rajput (ICSE Sciences) in Mathura.
          </p>
        </div>

        {/* 1. Class Tiles */}
        <section className="space-y-6">
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <h2 className="text-h2 font-bold text-ink flex items-center gap-2">
              <GraduationCap className="h-6 w-6 text-primary" />
              <span>Browse by Class</span>
            </h2>
            <span className="text-caption text-ink-muted">CBSE &amp; ICSE / ISC</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {classTiles.map((cls) => (
              <div
                key={cls.slug}
                className="group relative rounded-xl border border-border bg-surface p-6 shadow-card hover:shadow-card-hover hover:border-primary/40 transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-h3 font-black text-primary">
                      Class {cls.roman}
                    </span>
                    <Badge variant="accent" className="text-[11px]">
                      {cls.badge}
                    </Badge>
                  </div>
                  <h3 className="font-bold text-body text-ink group-hover:text-primary transition-colors">
                    {cls.title}
                  </h3>
                  <p className="text-small text-ink-muted leading-relaxed">
                    {cls.description}
                  </p>
                </div>

                <div className="pt-5 mt-4 border-t border-border/60 flex items-center justify-between">
                  <Link
                    href={`/learn/${cls.slug}/${cls.featuredSubject}`}
                    className="inline-flex items-center gap-1.5 text-small font-semibold text-primary group-hover:underline"
                  >
                    <span>Start Learning</span>
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 2. Subject Tiles */}
        <section className="space-y-6">
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <h2 className="text-h2 font-bold text-ink flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-accent" />
              <span>Explore by Subject</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {subjects.map((sub) => {
              const faculty =
                sub.slug === "mathematics"
                  ? "Mr. Dinesh Singh Rajput"
                  : sub.slug === "chemistry" || sub.slug === "biology"
                    ? "Mrs. Namita Singh Rajput"
                    : "Senior Subject Mentor";

              return (
                <Link
                  key={sub.id}
                  href={`/learn/xii/${sub.slug}`}
                  className="rounded-xl border border-border bg-surface-subtle p-5 hover:bg-surface hover:shadow-card transition-all group block"
                >
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="primary" className="text-[11px]">
                      Class IX–XII
                    </Badge>
                    <ArrowRight className="h-4 w-4 text-ink-muted group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                  </div>
                  <h3 className="font-bold text-body text-ink group-hover:text-primary transition-colors mb-1">
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
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <h2 className="text-h2 font-bold text-ink flex items-center gap-2">
                <ListVideo className="h-6 w-6 text-primary" />
                <span>Curated YouTube Playlists</span>
              </h2>
              <span className="text-caption text-ink-muted">
                Official Channel Series
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {playlists.map((pl) => (
                <a
                  key={pl.playlist.id}
                  href={`https://www.youtube.com/playlist?list=${pl.playlist.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group rounded-xl border border-border bg-surface overflow-hidden shadow-xs hover:shadow-card hover:border-primary/40 transition-all flex flex-col justify-between"
                >
                  <div className="p-5 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <Badge variant="neutral" className="text-[10px]">
                        {pl.playlist.itemCount} Videos
                      </Badge>
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
            <div className="flex items-center gap-2 pb-2 border-b border-border">
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
