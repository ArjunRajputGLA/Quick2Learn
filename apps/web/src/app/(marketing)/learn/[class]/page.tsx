import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getClassSubjectsWithDetails } from "@/server/data/catalog";
import { BreadcrumbsPlacement } from "@/components/layout/breadcrumbs-placement";
import { ScrollAnimatedList, type ScrollAnimatedItem } from "@/components/learn/scroll-animated-list";
import { slugToClassLevel, formatClassRoman } from "@quick2learn/shared";
import {
  BookOpen,
  CheckCircle2,
  GraduationCap,
  Sparkles,
  ArrowRight,
} from "lucide-react";

interface LearnClassPageProps {
  params: Promise<{
    class: string;
  }>;
}

export const revalidate = 3600;

export async function generateStaticParams() {
  try {
    const subjects = await getClassSubjectsWithDetails(9);
    if (!subjects || subjects.length === 0) return [];
    return [
      { class: "ix" },
      { class: "x" },
      { class: "xi" },
      { class: "xii" },
    ];
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: LearnClassPageProps): Promise<Metadata> {
  const { class: classParam } = await params;
  const classLevel = slugToClassLevel(classParam);
  if (!classLevel) return { title: "Class Not Found | Quick2Learn" };

  const classRoman = formatClassRoman(classLevel);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://quick2learn.in";
  const title = `Class ${classRoman} Curriculum & Subjects — CBSE & ICSE / ISC | Quick2Learn`;
  const description = `Explore Class ${classRoman} subjects, chapter-wise syllabus, concept lectures in Hindi, formula summaries, and board preparation mentored by Quick2Learn faculty in Mathura.`;

  return {
    title,
    description,
    alternates: {
      canonical: `/learn/${classParam}`,
    },
    openGraph: {
      title,
      description,
      url: `${baseUrl}/learn/${classParam}`,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function LearnClassPage({ params }: LearnClassPageProps) {
  const { class: classParam } = await params;
  const classLevel = slugToClassLevel(classParam);

  if (!classLevel) {
    notFound();
  }

  const classRoman = formatClassRoman(classLevel);
  const subjects = await getClassSubjectsWithDetails(classLevel).catch(() => []);

  if (!subjects || subjects.length === 0) {
    notFound();
  }

  const totalChapters = subjects.reduce((sum, s) => sum + s.chapterCount, 0);

  // Map subjects to animated scroll list items
  const animatedItems: ScrollAnimatedItem[] = subjects.map((s, idx) => ({
    id: s.id,
    number: idx + 1,
    title: s.name,
    badge: s.board,
    subtitle: s.sampleChapters.length > 0
      ? `Key Topics: ${s.sampleChapters.map((c) => c.title).join(", ")}${s.chapterCount > s.sampleChapters.length ? "..." : ""}`
      : undefined,
    href: `/learn/${classParam}/${s.slug}`,
    meta: [
      `${s.chapterCount} Curriculum Chapter${s.chapterCount === 1 ? "" : "s"}`,
      `Mentor: ${s.mentor.name}`,
      "Study notes ready",
      "Video lectures recording",
    ],
  }));

  // Theme accents based on class
  const heroGradient =
    classLevel === 9
      ? "bg-linear-to-br from-slate-950 via-indigo-950 to-blue-900"
      : classLevel === 10
      ? "bg-linear-to-br from-slate-950 via-slate-900 to-emerald-950"
      : classLevel === 11
      ? "bg-linear-to-br from-slate-950 via-sky-950 to-indigo-950"
      : "bg-linear-to-br from-slate-950 via-indigo-950 to-violet-950";

  return (
    <div>
      <BreadcrumbsPlacement
        items={[
          { label: "Home", href: "/" },
          { label: "Learn", href: "/learn" },
          { label: `Class ${classRoman}` },
        ]}
      />

      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 space-y-10">
        {/* Themed Curriculum Hero Banner */}
        <div
          className={`p-6 sm:p-8 lg:p-10 rounded-3xl border border-border/80 shadow-md text-white relative overflow-hidden ${heroGradient}`}
        >
          {/* Subtle Ambient Glow */}
          <div className="absolute -right-20 -top-20 w-80 h-80 bg-white/5 rounded-full blur-3xl pointer-events-none" />

          {/* 3D Decorative Asset */}
          <div className="hidden md:block absolute right-6 sm:right-10 lg:right-14 top-1/2 -translate-y-1/2 w-48 h-48 sm:w-56 sm:h-56 lg:w-64 lg:h-64 xl:w-72 xl:h-72 pointer-events-none select-none drop-shadow-[0_20px_35px_rgba(0,0,0,0.45)]">
            <Image
              src="/images/hero/3d-book-isolated.png"
              alt="Class Curriculum Textbooks"
              fill
              sizes="(min-width: 1280px) 288px, (min-width: 1024px) 256px, 224px"
              className="object-contain"
              priority
            />
          </div>

          <div className="relative z-1 flex flex-col lg:flex-row lg:items-center justify-between gap-6 max-w-2xl xl:max-w-3xl">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-caption font-bold bg-white/10 text-white backdrop-blur-md border border-white/15 shadow-xs">
                  <GraduationCap className="h-3.5 w-3.5 text-sky-400" />
                  Class {classRoman} Curriculum
                </span>
                <span className="text-caption font-semibold text-white/80">
                  {classLevel >= 11 ? "CBSE & ISC Board Alignment" : "CBSE & ICSE Board Alignment"}
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  <Sparkles className="h-3 w-3" />
                  {subjects.length} Subjects Active
                </span>
              </div>

              <h1 className="text-display font-extrabold tracking-tight text-white leading-tight">
                Class {classRoman} — Subjects &amp; Curriculum
              </h1>

              <p className="text-body text-white/75 leading-relaxed max-w-2xl">
                Comprehensive chapter-wise syllabus, concept lectures in Hindi, formula sheet summaries,
                and previous year question walkthroughs mentored by Quick2Learn faculty in Mathura.
              </p>

              {/* Curriculum Trust Highlights */}
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-2 text-small text-white/85">
                <span className="inline-flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  {subjects.length} Curriculum Subjects
                </span>
                <span className="inline-flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  {totalChapters} Total Chapters
                </span>
                <span className="inline-flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  NCERT &amp; ICSE Board Syllabus
                </span>
                <span className="inline-flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  Free Formula &amp; Concept Sheets
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Content Layout: Left Subjects List + Right Sticky Card */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Column: Animated Subject List */}
          <div className="lg:col-span-2 space-y-8">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-border/80">
                <h2 className="text-h3 font-bold text-ink flex items-center gap-2.5">
                  <BookOpen className="h-5 w-5 text-primary" />
                  <span>Curriculum Subjects ({subjects.length})</span>
                </h2>
                <span className="text-caption font-semibold text-ink-muted">
                  Board Approved Order
                </span>
              </div>

              {/* Scroll Animated Subjects List */}
              <ScrollAnimatedList
                items={animatedItems}
                emptyMessage={`No subjects found for Class ${classRoman}.`}
              />
            </div>
          </div>

          {/* Right Column: Coaching Details & Mentor Highlights */}
          <div className="space-y-6">
            <div className="rounded-2xl border border-border/80 bg-surface p-6 space-y-5 shadow-xs sticky top-24">
              <div className="flex items-center gap-3 text-ink">
                <div className="h-10 w-10 rounded-xl bg-primary-soft text-primary flex items-center justify-center shrink-0">
                  <GraduationCap className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-body">
                    About Class {classRoman} Preparation
                  </h3>
                  <p className="text-caption text-ink-muted">
                    Quick2Learn Mathura Campus
                  </p>
                </div>
              </div>

              <div className="space-y-3 text-small text-ink-muted pt-2 border-t border-border/60">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Strict alignment with latest CBSE &amp; ICSE marking scheme</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Previous 10 years board examination problems solved</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Free formula and theorem summary revision sheets</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Weekly classroom doubt-clearing sessions in Mathura</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Personal mentoring under Dinesh Sir &amp; Namita Ma&apos;am</span>
                </div>
              </div>

              <div className="pt-2">
                <Link
                  href="/batches"
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-surface-subtle hover:bg-primary-soft text-ink hover:text-primary border border-border text-small font-bold transition-all group"
                >
                  <span>Explore Coaching Batches</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
