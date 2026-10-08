import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getSubjectBySlug, getSubjects } from "@/server/data/catalog";
import {
  getSubjectChaptersWithStats,
  getVideosWithoutChapter,
  getRelatedBatchForClass,
} from "@/server/data/videos";
import { BreadcrumbsPlacement } from "@/components/layout/breadcrumbs-placement";
import { Badge } from "@/components/ui/badge";
import { LectureCard } from "@/components/ui/lecture-card";
import { RelatedBatchCard } from "@/components/learn/related-batch-card";
import { slugToClassLevel, formatClassRoman } from "@quick2learn/shared";
import { BookOpen, Clock, ArrowRight, Video, CheckCircle2 } from "lucide-react";

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

  const totalLectures = chaptersWithStats.reduce((acc, ch) => acc + ch.lectureCount, 0);

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

      <div className="container mx-auto px-4 py-8 lg:py-12">
        {/* Header Section */}
        <div className="max-w-3xl mb-10 space-y-3">
          <div className="flex items-center gap-2">
            <Badge variant="primary">Class {classRoman}</Badge>
            <Badge variant="neutral">CBSE &amp; ICSE/ISC</Badge>
            {totalLectures > 0 && (
              <Badge variant="accent">{totalLectures} Video Lessons</Badge>
            )}
          </div>
          <h1 className="text-display font-extrabold tracking-tight text-ink">
            {subject.name} — Class {classRoman}
          </h1>
          <p className="text-body text-ink-muted">
            Detailed chapter-wise syllabus, concept lectures, formula breakdowns,
            and practice sessions mentored by Quick2Learn faculty in Mathura.
          </p>
        </div>

        {/* Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Column: Chapter List */}
          <div className="lg:col-span-2 space-y-8">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <h2 className="text-h3 font-bold text-ink flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  <span>Curriculum Chapters ({chaptersWithStats.length})</span>
                </h2>
                <span className="text-caption text-ink-muted">
                  Board Approved Order
                </span>
              </div>

              {chaptersWithStats.length === 0 ? (
                <div className="rounded-lg border border-border bg-surface p-8 text-center text-ink-muted">
                  Chapters for this subject are being updated for the current academic session.
                </div>
              ) : (
                <div className="divide-y divide-border rounded-xl border border-border bg-surface shadow-xs overflow-hidden">
                  {chaptersWithStats.map((ch) => (
                    <Link
                      key={ch.id}
                      href={`/learn/${classParam}/${subjectParam}/${ch.slug}`}
                      className="p-5 flex items-center justify-between gap-4 hover:bg-surface-subtle transition-colors group block"
                    >
                      <div className="flex items-start gap-4">
                        <div className="h-9 w-9 rounded-full bg-primary-soft text-primary font-bold text-caption flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-primary group-hover:text-surface transition-colors">
                          {ch.number}
                        </div>
                        <div className="space-y-1">
                          <h3 className="font-semibold text-body text-ink group-hover:text-primary transition-colors">
                            {ch.title}
                          </h3>
                          <div className="flex flex-wrap items-center gap-3 text-caption text-ink-muted">
                            <span>Chapter {ch.number}</span>
                            {ch.board && (
                              <>
                                <span>•</span>
                                <span className="uppercase">{ch.board}</span>
                              </>
                            )}
                            {ch.lectureCount > 0 ? (
                              <>
                                <span>•</span>
                                <span className="font-medium text-ink flex items-center gap-1">
                                  <Video className="h-3 w-3 text-primary" />
                                  {ch.lectureCount} {ch.lectureCount === 1 ? "lecture" : "lectures"}
                                </span>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {ch.formattedDuration}
                                </span>
                              </>
                            ) : (
                              <>
                                <span>•</span>
                                <span className="text-ink-muted italic">Lectures coming soon</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center gap-2">
                        <ArrowRight className="h-4 w-4 text-ink-muted group-hover:text-primary group-hover:translate-x-1 transition-all" />
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
            <div className="rounded-xl border border-border bg-surface p-6 space-y-4">
              <h3 className="font-bold text-body text-ink">
                About {subject.name} Preparation
              </h3>
              <ul className="space-y-2.5 text-small text-ink-muted">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-success shrink-0 mt-0.5" />
                  <span>Strict alignment with latest CBSE &amp; ICSE marking scheme</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-success shrink-0 mt-0.5" />
                  <span>Previous 10 years board examination problems solved</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-success shrink-0 mt-0.5" />
                  <span>Free formula and theorem summary sheets</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
