import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getSubjectBySlug, getSubjects } from "@/server/data/catalog";
import {
  getSubjectChaptersWithStats,
  getVideosWithoutChapter,
  getRelatedBatchForClass,
} from "@/server/data/videos";
import { BreadcrumbsPlacement } from "@/components/layout/breadcrumbs-placement";
import { LectureCard } from "@/components/ui/lecture-card";
import { RelatedBatchCard } from "@/components/learn/related-batch-card";
import { slugToClassLevel, formatClassRoman } from "@quick2learn/shared";
import {
  BookOpen,
  Clock,
  ArrowRight,
  Video,
  CheckCircle2,
  Calculator,
  FlaskConical,
  GraduationCap,
} from "lucide-react";

interface LearnSubjectPageProps {
  params: Promise<{
    class: string;
    subject: string;
  }>;
}

export const revalidate = 3600;

export async function generateStaticParams() {
  const classes = ["ix", "x", "xi", "xii"];
  const subjects = await getSubjects();

  const params: Array<{ class: string; subject: string }> = [];
  for (const c of classes) {
    for (const s of subjects) {
      params.push({
        class: c,
        subject: s.slug,
      });
    }
  }
  return params;
}

export async function generateMetadata({
  params,
}: LearnSubjectPageProps): Promise<Metadata> {
  const { class: classParam, subject: subjectParam } = await params;
  const classLevel = slugToClassLevel(classParam);
  if (!classLevel) return { title: "Subject Not Found | Quick2Learn" };

  const subject = await getSubjectBySlug(subjectParam.toLowerCase()).catch(() => null);
  if (!subject) return { title: "Subject Not Found | Quick2Learn" };

  const classRoman = formatClassRoman(classLevel);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://quick2learn.in";
  const title = `Class ${classRoman} ${subject.name} Syllabus, Chapters & Lectures | Quick2Learn`;
  const description = `Master Class ${classRoman} ${subject.name} with chapter-wise video playlists in Hindi, formula sheets, NCERT proofs, and board exam drills by Quick2Learn faculty.`;

  return {
    title,
    description,
    alternates: {
      canonical: `/learn/${classParam}/${subjectParam}`,
    },
    openGraph: {
      title,
      description,
      url: `${baseUrl}/learn/${classParam}/${subjectParam}`,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function LearnSubjectPage({ params }: LearnSubjectPageProps) {
  const { class: classParam, subject: subjectParam } = await params;

  const classLevel = slugToClassLevel(classParam);
  if (!classLevel) {
    notFound();
  }

  const subject = await getSubjectBySlug(subjectParam.toLowerCase());
  if (!subject) {
    notFound();
  }

  const classRoman = formatClassRoman(classLevel);

  // Fetch chapters with lecture count and total duration
  const [chaptersWithStats, unassignedVideos, relatedBatch] = await Promise.all([
    getSubjectChaptersWithStats(classLevel, subject.id),
    getVideosWithoutChapter(subject.id, classLevel),
    getRelatedBatchForClass(classLevel, subject.id),
  ]);

  // Ensure unique chapters by slug / number as fail-safe against database duplicates
  const uniqueChapters = Array.from(
    new Map(chaptersWithStats.map((ch) => [ch.slug, ch])).values(),
  ).sort((a, b) => a.sortOrder - b.sortOrder || a.number - b.number);

  const totalLectures = uniqueChapters.reduce((acc, ch) => acc + ch.lectureCount, 0);

  // Theming & Mentorship
  const isMath = /math/i.test(subject.name);
  const facultyName = isMath ? "Mr. Dinesh Singh Rajput" : "Mrs. Namita Singh Rajput";
  const facultyRole = isMath ? "25+ Yrs Exp • Senior Mathematics Head" : "15+ Yrs Exp • Head of ICSE Sciences";
  const facultyAvatar = isMath ? "/images/faculty/dinesh-sir.jpg" : "/images/faculty/namita-maam.jpg";

  return (
    <div>
      <BreadcrumbsPlacement
        items={[
          { label: "Home", href: "/" },
          { label: "Learn", href: "/learn" },
          { label: `Class ${classRoman}`, href: `/learn/${classParam}/${subjectParam}` },
          { label: subject.name },
        ]}
      />

      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 space-y-10">
        {/* Themed Curriculum Hero Banner */}
        <div
          className={`p-6 sm:p-8 lg:p-10 rounded-3xl border border-border/80 shadow-md text-white relative overflow-hidden ${
            isMath
              ? "bg-linear-to-br from-slate-950 via-indigo-950 to-blue-900"
              : "bg-linear-to-br from-slate-950 via-teal-950 to-emerald-900"
          }`}
        >
          {/* Subtle Ambient Glow */}
          <div className="absolute -right-20 -top-20 w-80 h-80 bg-white/5 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-1 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="max-w-3xl space-y-4">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-caption font-bold bg-white/10 text-white backdrop-blur-md border border-white/15 shadow-xs">
                  {isMath ? <Calculator className="h-3.5 w-3.5 text-sky-400" /> : <FlaskConical className="h-3.5 w-3.5 text-emerald-400" />}
                  Class {classRoman} Curriculum
                </span>
                <span className="text-caption font-semibold text-white/80">
                  CBSE &amp; ICSE / ISC Board Alignment
                </span>
                {totalLectures > 0 && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                    <Video className="h-3 w-3" />
                    {totalLectures} Video Lessons
                  </span>
                )}
              </div>

              <h1 className="text-display font-extrabold tracking-tight text-white leading-tight">
                {subject.name} — Class {classRoman}
              </h1>

              <p className="text-body text-white/75 leading-relaxed max-w-2xl">
                Comprehensive chapter-wise syllabus, concept lectures in Hindi, formula sheet summaries,
                and previous year question walkthroughs mentored by Quick2Learn faculty in Mathura.
              </p>

              {/* Curriculum Trust Highlights */}
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-2 text-small text-white/85">
                <span className="inline-flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  {uniqueChapters.length} Curriculum Chapters
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

            {/* Mentor Badge */}
            <div className="shrink-0 pt-2 lg:pt-0">
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
          {/* Main Column: Chapter List */}
          <div className="lg:col-span-2 space-y-8">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-border/80">
                <h2 className="text-h3 font-bold text-ink flex items-center gap-2.5">
                  <BookOpen className="h-5 w-5 text-primary" />
                  <span>Curriculum Chapters ({uniqueChapters.length})</span>
                </h2>
                <span className="text-caption font-semibold text-ink-muted">
                  Board Approved Order
                </span>
              </div>

              {uniqueChapters.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border bg-surface p-12 text-center text-ink-muted">
                  Chapters for this subject are being updated for the current academic session.
                </div>
              ) : (
                <div className="divide-y divide-border/60 rounded-2xl border border-border/80 bg-surface shadow-xs overflow-hidden">
                  {uniqueChapters.map((ch) => (
                    <Link
                      key={ch.id}
                      href={`/learn/${classParam}/${subjectParam}/${ch.slug}`}
                      className="p-5 sm:p-6 flex items-center justify-between gap-4 hover:bg-surface-subtle transition-all group block cursor-pointer"
                    >
                      <div className="flex items-center gap-4 sm:gap-5 min-w-0">
                        {/* Chapter Number Badge */}
                        <div className="h-12 w-12 rounded-2xl bg-primary-soft text-primary font-black text-[16px] flex items-center justify-center shrink-0 border border-primary/20 shadow-xs group-hover:bg-primary group-hover:text-white group-hover:scale-105 transition-all">
                          {ch.number}
                        </div>

                        <div className="space-y-1.5 min-w-0">
                          <h3 className="font-bold text-[17px] text-ink group-hover:text-primary transition-colors leading-snug truncate sm:whitespace-normal">
                            {ch.title}
                          </h3>

                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-caption text-ink-muted">
                            <span className="font-medium">Chapter {ch.number}</span>
                            {ch.board && (
                              <>
                                <span>•</span>
                                <span className="uppercase font-semibold text-primary">{ch.board}</span>
                              </>
                            )}
                            {ch.lectureCount > 0 ? (
                              <>
                                <span>•</span>
                                <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                                  <Video className="h-3 w-3" />
                                  {ch.lectureCount} {ch.lectureCount === 1 ? "lesson" : "lessons"} ({ch.formattedDuration})
                                </span>
                              </>
                            ) : (
                              <>
                                <span>•</span>
                                <span className="text-ink-muted italic flex items-center gap-1">
                                  <Clock className="h-3 w-3 text-primary/60" />
                                  Study notes ready • Lectures recording
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right Action */}
                      <div className="shrink-0 flex items-center gap-2">
                        <span className="hidden sm:inline-flex text-caption font-semibold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                          Explore Chapter
                        </span>
                        <div className="h-8 w-8 rounded-full bg-surface-subtle group-hover:bg-primary group-hover:text-white flex items-center justify-center transition-all">
                          <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* "More from this subject" section (Videos not in a specific chapter) */}
            {unassignedVideos.length > 0 && (
              <section className="space-y-4 pt-6 border-t border-border">
                <div className="flex items-center justify-between pb-2 border-b border-border">
                  <h2 className="text-h3 font-bold text-ink flex items-center gap-2">
                    <Video className="h-5 w-5 text-accent" />
                    <span>More from this subject ({unassignedVideos.length})</span>
                  </h2>
                  <span className="text-caption text-ink-muted">General &amp; PYQs</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {unassignedVideos.map((v) => (
                    <LectureCard key={v.id} {...v} />
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {relatedBatch && (
              <RelatedBatchCard
                batch={relatedBatch.batch}
                facultyName={relatedBatch.faculty?.name}
                subjectName={relatedBatch.subject?.name}
              />
            )}

            {/* Highlights Box */}
            <div className="rounded-2xl border border-border/80 bg-surface p-6 space-y-4 shadow-xs">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-primary-soft text-primary flex items-center justify-center">
                  <GraduationCap className="h-4 w-4" />
                </div>
                <h3 className="font-bold text-body text-ink">
                  About {subject.name} Preparation
                </h3>
              </div>
              <ul className="space-y-3 text-small text-ink-muted">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Strict alignment with latest CBSE &amp; ICSE marking scheme</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Previous 10 years board examination problems solved</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Free formula and theorem summary revision sheets</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Weekly classroom doubt-clearing sessions in Mathura</span>
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
