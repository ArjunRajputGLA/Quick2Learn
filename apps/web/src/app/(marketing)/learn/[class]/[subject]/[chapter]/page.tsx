import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getChapterBySlug,
  getChapterVideos,
  getPublicChapterResources,
  getRelatedBatchForClass,
  getAllChaptersWithSubject,
} from "@/server/data/videos";
import { BreadcrumbsPlacement } from "@/components/layout/breadcrumbs-placement";
import { Badge } from "@/components/ui/badge";
import { LectureCard } from "@/components/ui/lecture-card";
import { RelatedBatchCard } from "@/components/learn/related-batch-card";
import { ChapterResources } from "@/components/learn/chapter-resources";
import {
  slugToClassLevel,
  classLevelToSlug,
  formatClassRoman,
} from "@quick2learn/shared";
import { Video, BookOpen, ArrowLeft, CheckCircle2 } from "lucide-react";

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

      <div className="container mx-auto px-4 py-8 lg:py-12">
        {/* Navigation back to subject */}
        <div className="mb-6">
          <Link
            href={`/learn/${classParam}/${subjectParam}`}
            className="inline-flex items-center gap-2 text-small font-medium text-ink-muted hover:text-primary transition-colors group"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            <span>Back to all {subject.name} chapters</span>
          </Link>
        </div>

        {/* Header Section */}
        <div className="max-w-3xl mb-10 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="primary">Class {classRoman}</Badge>
            <Badge variant="neutral">{subject.name}</Badge>
            <Badge variant="accent">Chapter {chapter.number}</Badge>
            {chapter.board && (
              <Badge variant="neutral" className="uppercase">
                {chapter.board}
              </Badge>
            )}
          </div>

          <h1 className="text-display font-extrabold tracking-tight text-ink">
            {chapter.title}
          </h1>

          <p className="text-body text-ink-muted leading-relaxed">
            Comprehensive video lectures, solved textbook questions, formula
            insights, and free downloadable study materials for Class {classRoman}{" "}
            {subject.name}.
          </p>
        </div>

        {/* Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Column: Ordered Lecture List & Resources */}
          <div className="lg:col-span-2 space-y-10">
            {/* 1. Ordered Lectures */}
            <section className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <h2 className="text-h3 font-bold text-ink flex items-center gap-2">
                  <Video className="h-5 w-5 text-primary" />
                  <span>Concept &amp; Problem Lectures ({videos.length})</span>
                </h2>
                <span className="text-caption text-ink-muted">
                  Sequential Order
                </span>
              </div>

              {videos.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border bg-surface p-8 text-center space-y-2">
                  <BookOpen className="h-8 w-8 text-ink-muted mx-auto" />
                  <h3 className="font-semibold text-body text-ink">
                    Lectures being recorded
                  </h3>
                  <p className="text-small text-ink-muted max-w-md mx-auto">
                    Our faculty is currently recording conceptual lectures and
                    problem walkthroughs for {chapter.title}. Check back soon or
                    explore public notes below.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {videos.map((v) => (
                    <LectureCard key={v.id} {...v} />
                  ))}
                </div>
              )}
            </section>

            {/* 2. Public Notes & Resources */}
            {resources.length > 0 && (
              <section className="pt-6 border-t border-border">
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

            {/* Chapter Study Checklist Box */}
            <div className="rounded-xl border border-border bg-surface p-6 space-y-4">
              <h3 className="font-bold text-body text-ink">
                How to master {chapter.title}
              </h3>
              <ul className="space-y-2.5 text-small text-ink-muted">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-success shrink-0 mt-0.5" />
                  <span>
                    Watch conceptual lectures sequentially and maintain formula notes.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-success shrink-0 mt-0.5" />
                  <span>
                    Solve NCERT and exemplar exercises completely before board mock papers.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-success shrink-0 mt-0.5" />
                  <span>
                    Practice previous 5 years' board questions with marking scheme steps.
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
