import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  getChapterBySlug,
  getChapterVideos,
  getPublicChapterResources,
  getRelatedBatchForClass,
  getAllChaptersWithSubject,
} from "@/server/data/videos";
import { BreadcrumbsPlacement } from "@/components/layout/breadcrumbs-placement";
import { LectureCard } from "@/components/ui/lecture-card";
import { RelatedBatchCard } from "@/components/learn/related-batch-card";
import { ChapterResources } from "@/components/learn/chapter-resources";
import { YouTubeIcon } from "@/components/ui/icons";
import { INSTITUTE_INFO } from "@quick2learn/shared";
import {
  slugToClassLevel,
  classLevelToSlug,
  formatClassRoman,
} from "@quick2learn/shared";
import {
  Video,
  ArrowLeft,
  CheckCircle2,
  Calculator,
  FlaskConical,
  GraduationCap,
  ArrowRight,
  ExternalLink,
  BookOpen,
  Landmark,
  Atom,
} from "lucide-react";

interface LearnChapterPageProps {
  params: Promise<{
    class: string;
    subject: string;
    chapter: string;
  }>;
}

export const revalidate = 3600;

export async function generateStaticParams() {
  const rows = await getAllChaptersWithSubject();
  return rows.map((r) => ({
    class: classLevelToSlug(r.classLevel) || "xii",
    subject: r.subjectSlug,
    chapter: r.chapterSlug,
  }));
}

export async function generateMetadata({
  params,
}: LearnChapterPageProps): Promise<Metadata> {
  const { class: classParam, subject: subjectParam, chapter: chapterParam } =
    await params;

  const classLevel = slugToClassLevel(classParam);
  if (!classLevel) {
    return { title: "Chapter Not Found | Quick2Learn" };
  }

  const data = await getChapterBySlug(
    classLevel,
    subjectParam.toLowerCase(),
    chapterParam.toLowerCase(),
  );

  if (!data) {
    return { title: "Chapter Not Found | Quick2Learn" };
  }

  const { chapter, subject } = data;
  const classRoman = formatClassRoman(classLevel);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://quick2learn.in";
  const title = `${chapter.title} — Class ${classRoman} ${subject.name} Lectures & Notes | Quick2Learn`;
  const description = `Watch free conceptual video lectures in Hindi, download NCERT formulas, and solve PYQs for Class ${classRoman} ${subject.name} Chapter ${chapter.number}: ${chapter.title}.`;

  return {
    title,
    description,
    keywords: [
      `${chapter.title} lecture Hindi`,
      `Class ${classLevel} ${chapter.title}`,
      `Class ${classRoman} ${subject.name} Chapter ${chapter.number}`,
      `Quick2Learn ${chapter.title}`,
    ],
    alternates: {
      canonical: `/learn/${classParam}/${subjectParam}/${chapterParam}`,
    },
    openGraph: {
      title,
      description,
      url: `${baseUrl}/learn/${classParam}/${subjectParam}/${chapterParam}`,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function LearnChapterPage({ params }: LearnChapterPageProps) {
  const { class: classParam, subject: subjectParam, chapter: chapterParam } =
    await params;

  const classLevel = slugToClassLevel(classParam);
  if (!classLevel) {
    notFound();
  }

  const data = await getChapterBySlug(
    classLevel,
    subjectParam.toLowerCase(),
    chapterParam.toLowerCase(),
  );

  if (!data) {
    notFound();
  }

  const { chapter, subject } = data;
  const classRoman = formatClassRoman(classLevel);

  const [videos, resources, relatedBatch] = await Promise.all([
    getChapterVideos(chapter.id, { excludeShorts: true }),
    getPublicChapterResources(chapter.id),
    getRelatedBatchForClass(classLevel, subject.id),
  ]);

  // Theming & Mentorship
  const isMath = /math/i.test(subject.name);
  const isPhysics = /physics/i.test(subject.name) || /physics/i.test(subjectParam);
  const isHindi = /hindi/i.test(subject.name) || /hindi/i.test(subjectParam);
  const isHistoryCivics =
    /history/i.test(subject.name) ||
    /civics/i.test(subject.name) ||
    /history/i.test(subjectParam);
  const facultyName = isMath ? "Mr. Dinesh Singh Rajput" : "Mrs. Namita Singh Rajput";
  const facultyRole = isMath
    ? "25+ Yrs Exp • Senior Mathematics Head"
    : isHindi
    ? "15+ Yrs Exp • ICSE Sciences & Hindi Mentor"
    : isHistoryCivics
    ? "15+ Yrs Exp • Head of ICSE Sciences, Humanities & Hindi"
    : "15+ Yrs Exp • Head of ICSE Sciences";
  const facultyAvatar = isMath ? "/images/assets/Dinesh Singh Rajput.jpeg" : "/images/assets/Namita Singh Rajput.jpeg";

  const subjectSlug = subjectParam.toLowerCase();
  let subjectVideo: string | null = null;
  if (/math/i.test(subject.name) || /math/i.test(subjectSlug)) {
    subjectVideo = "Mathematics";
  } else if (/bio/i.test(subject.name) || /bio/i.test(subjectSlug)) {
    subjectVideo = "Biology";
  } else if (/chem/i.test(subject.name) || /chem/i.test(subjectSlug)) {
    subjectVideo = "Chemistry";
  } else if (/hindi/i.test(subject.name) || /hindi/i.test(subjectSlug)) {
    subjectVideo = "Hindi";
  } else if (/history|civics/i.test(subject.name) || /history|civics/i.test(subjectSlug)) {
    subjectVideo = "history&civics";
  } else if (/physics/i.test(subject.name) || /physics/i.test(subjectSlug)) {
    subjectVideo = "physics";
  }

  return (
    <div>
      <BreadcrumbsPlacement
        items={[
          { label: "Home", href: "/" },
          { label: "Learn", href: "/learn" },
          {
            label: `Class ${classRoman}`,
            href: `/learn/${classParam}/${subjectParam}`,
          },
          {
            label: subject.name,
            href: `/learn/${classParam}/${subjectParam}`,
          },
          { label: chapter.title },
        ]}
      />

      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 space-y-8">
        {/* Navigation back to subject */}
        <div>
          <Link
            href={`/learn/${classParam}/${subjectParam}`}
            className="inline-flex items-center gap-2 text-small font-semibold text-primary hover:underline transition-all group"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            <span>Back to all Class {classRoman} {subject.name} chapters</span>
          </Link>
        </div>

        {/* Themed Chapter Hero Showcase */}
        <div
          className={`p-6 sm:p-8 lg:p-10 rounded-3xl border border-border/80 shadow-md text-white relative overflow-hidden ${
            isMath
              ? "bg-linear-to-br from-slate-950 via-indigo-950 to-blue-900"
              : isHindi
              ? "bg-linear-to-br from-slate-950 via-emerald-950 to-teal-950"
              : isHistoryCivics
              ? "bg-linear-to-br from-slate-950 via-amber-950 to-stone-900"
              : "bg-linear-to-br from-slate-950 via-teal-950 to-emerald-900"
          }`}
        >
          {/* Subtle Ambient Glow */}
          <div className="absolute -right-20 -top-20 w-80 h-80 bg-white/5 rounded-full blur-3xl pointer-events-none" />

          {/* Full Background Video for History & Civics */}
          {isHistoryCivics ? (
            <div className="absolute inset-0 w-full h-full pointer-events-none select-none overflow-hidden">
              <video
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover scale-105 filter blur-[1px] opacity-80 brightness-90"
                aria-hidden="true"
              >
                <source
                  src="/images/assets/history&civics.mp4"
                  type="video/mp4"
                />
              </video>
              <div className="absolute inset-0 bg-linear-to-r from-slate-950/85 via-slate-950/45 to-slate-950/20" />
            </div>
          ) : (
            subjectVideo && (
              <div className="absolute right-16 sm:right-36 lg:right-60 -bottom-10 sm:-bottom-14 w-80 h-80 sm:w-[420px] sm:h-[420px] pointer-events-none select-none opacity-85">
                <video
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-contain"
                  aria-hidden="true"
                >
                  <source
                    src={`/images/assets/${subjectVideo}.webm`}
                    type="video/webm"
                  />
                  <source
                    src={`/images/assets/${subjectVideo}.mp4`}
                    type="video/mp4"
                  />
                </video>
              </div>
            )
          )}

          <div className="relative z-1 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="max-w-3xl space-y-4">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-caption font-bold bg-white/10 text-white backdrop-blur-md border border-white/15 shadow-xs">
                  {isMath ? (
                    <Calculator className="h-3.5 w-3.5 text-sky-400" />
                  ) : isPhysics ? (
                    <Atom className="h-3.5 w-3.5 text-teal-300" />
                  ) : isHindi ? (
                    <BookOpen className="h-3.5 w-3.5 text-amber-400" />
                  ) : isHistoryCivics ? (
                    <Landmark className="h-3.5 w-3.5 text-amber-300" />
                  ) : (
                    <FlaskConical className="h-3.5 w-3.5 text-emerald-400" />
                  )}
                  Class {classRoman} • {subject.name}
                </span>

                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-caption font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30">
                  Chapter {chapter.number}
                </span>

                {chapter.board && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-caption font-bold bg-white/10 text-white/90 border border-white/15 uppercase">
                    {chapter.board}
                  </span>
                )}
              </div>

              <h1 className="text-display font-extrabold tracking-tight text-white leading-tight">
                {chapter.title}
              </h1>

              <p className="text-body text-white/75 leading-relaxed max-w-2xl">
                Comprehensive video lectures in Hindi, textbook problem walkthroughs, formula
                breakdowns, and free downloadable study materials for Class {classRoman} {subject.name}.
              </p>

              {/* Study Highlights */}
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-2 text-small text-white/85">
                <span className="inline-flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  NCERT &amp; ICSE Prescribed Syllabus
                </span>
                <span className="inline-flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  Formula Sheets &amp; Mind Maps
                </span>
                <span className="inline-flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  Board Exam PYQ Walkthroughs
                </span>
              </div>
            </div>

            {/* Mentor Attribution */}
            <div className={`shrink-0 pt-2 lg:pt-0 ${isHistoryCivics ? "lg:self-end relative z-10" : ""}`}>
              <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md shadow-xs">
                <div className="relative h-14 w-14 rounded-xl overflow-hidden border-2 border-white/30 shrink-0">
                  <Image
                    src={facultyAvatar}
                    alt={facultyName}
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <span className="text-[11px] uppercase tracking-wider font-bold text-white/60">
                    Lead Mentor
                  </span>
                  <p className="text-body font-extrabold text-white leading-snug">
                    {facultyName}
                  </p>
                  <p className="text-[12px] font-medium text-white/75">
                    {facultyRole}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Column: Ordered Lecture List & Resources */}
          <div className="lg:col-span-2 space-y-10">
            {/* 1. Ordered Lectures */}
            <section className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-border/80">
                <h2 className="text-h3 font-bold text-ink flex items-center gap-2.5">
                  <Video className="h-5 w-5 text-primary" />
                  <span>Concept &amp; Problem Lectures ({videos.length})</span>
                </h2>
                <span className="text-caption font-semibold text-ink-muted">
                  Sequential Order
                </span>
              </div>

              {videos.length === 0 ? (
                /* Production-ready Empty State */
                <div className="rounded-3xl border border-border/80 bg-surface p-8 sm:p-10 text-center space-y-6 shadow-xs">
                  <div className="h-16 w-16 rounded-3xl bg-amber-500/10 text-amber-600 mx-auto flex items-center justify-center border border-amber-500/20">
                    <Video className="h-8 w-8" />
                  </div>
                  <div className="max-w-md mx-auto space-y-2">
                    <h3 className="font-bold text-h3 text-ink">
                      Lectures in Production
                    </h3>
                    <p className="text-small text-ink-muted leading-relaxed">
                      {facultyName} is currently recording high-yield concept breakdowns and NCERT problem
                      walkthroughs for <span className="font-semibold text-ink">{chapter.title}</span>. They will be uploaded directly to our YouTube channel shortly.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                    <a
                      href={INSTITUTE_INFO.youtube.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#FF0000] hover:bg-[#CC0000] text-white font-semibold text-small shadow-xs transition-all"
                    >
                      <YouTubeIcon className="h-4 w-4" />
                      <span>Subscribe on YouTube for Alerts</span>
                      <ExternalLink className="h-3.5 w-3.5 opacity-80" />
                    </a>

                    <Link
                      href="/batches"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-surface-subtle hover:bg-surface border border-border/80 text-ink font-semibold text-small transition-all"
                    >
                      <span>Join Classroom Batch</span>
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  {videos.map((v) => (
                    <LectureCard key={v.id} {...v} />
                  ))}
                </div>
              )}
            </section>

            {/* 2. Public Notes & Resources */}
            {resources.length > 0 && (
              <section className="pt-6 border-t border-border/80">
                <ChapterResources
                  resources={resources.map((r) => ({
                    id: r.id,
                    title: r.title,
                    type: r.type,
                    storageKey: r.storageKey,
                  }))}
                  title={`Public Notes & Worksheets for ${chapter.title}`}
                />
              </section>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Related Batch Card ("Want structured classes? Join the Class XII batch") */}
            {relatedBatch && (
              <RelatedBatchCard
                batch={relatedBatch.batch}
                facultyName={relatedBatch.faculty?.name}
                subjectName={relatedBatch.subject?.name}
              />
            )}

            {/* How to Master This Chapter Card */}
            <div className="rounded-2xl border border-border/80 bg-surface p-6 space-y-4 shadow-xs">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-primary-soft text-primary flex items-center justify-center">
                  <GraduationCap className="h-4 w-4" />
                </div>
                <h3 className="font-bold text-body text-ink">
                  How to master {chapter.title}
                </h3>
              </div>

              <ul className="space-y-3 text-small text-ink-muted">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Watch conceptual lectures sequentially and maintain personal formula notes.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Solve NCERT and exemplar exercises completely before attempting board mock tests.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Practice previous 5 years' board questions with step-by-step marking scheme solutions.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Attend Sunday personalized doubt-clearing sessions at Mathura campus.</span>
                </li>
              </ul>

              <div className="pt-2">
                <Link
                  href="/batches"
                  className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-surface-subtle hover:bg-primary hover:text-white border border-border/80 font-semibold text-small text-ink transition-all group"
                >
                  <span>Explore Coaching Batches</span>
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
