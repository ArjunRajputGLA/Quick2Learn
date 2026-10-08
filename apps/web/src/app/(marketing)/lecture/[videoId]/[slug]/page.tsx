import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  getVideoDetails,
  getUpNextVideos,
  getPublicChapterResources,
  getRelatedBatchForClass,
  recordLectureView,
  formatDuration,
  formatViews,
  formatRelativeTime,
} from "@/server/data/videos";
import { getCurrentUser } from "@/server/auth/session";
import { BreadcrumbsPlacement } from "@/components/layout/breadcrumbs-placement";
import { Badge } from "@/components/ui/badge";
import { LectureViewClient } from "@/components/learn/lecture-view-client";
import { ShareButtons } from "@/components/learn/share-buttons";
import { ChapterResources } from "@/components/learn/chapter-resources";
import { RelatedBatchCard } from "@/components/learn/related-batch-card";
import { LectureCard } from "@/components/ui/lecture-card";
import { formatClassRoman, classLevelToSlug } from "@quick2learn/shared";
import { Clock, Eye, Calendar, User, ListVideo } from "lucide-react";

interface LecturePageProps {
  params: Promise<{
    videoId: string;
    slug: string;
  }>;
}

export const revalidate = 3600;

function formatIsoDuration(seconds?: number | null): string {
  if (!seconds || seconds <= 0) return "PT0S";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  let str = "PT";
  if (h > 0) str += `${h}H`;
  if (m > 0) str += `${m}M`;
  if (s > 0 || (h === 0 && m === 0)) str += `${s}S`;
  return str;
}

export async function generateMetadata({
  params,
}: LecturePageProps): Promise<Metadata> {
  const { videoId, slug } = await params;
  const details = await getVideoDetails(videoId);
  if (!details || !details.video.isPublished) {
    return { title: "Lecture Not Found | Quick2Learn" };
  }

  const classRoman = details.video.classLevel
    ? formatClassRoman(details.video.classLevel)
    : "XII";
  const subjectName = details.subject?.name || "Maths";

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://quick2learn.in";
  const pageTitle = `${details.video.title} — Class ${classRoman} ${subjectName} Lectures | Quick2Learn`;
  const pageDesc =
    details.video.description?.substring(0, 160) ||
    `Watch free ${subjectName} conceptual lecture in Hindi by Quick2Learn faculty. Full NCERT & board exam preparation.`;
  const posterUrl =
    details.video.thumbnailUrl ||
    `https://i.ytimg.com/vi/${details.video.id}/hqdefault.jpg`;

  return {
    title: pageTitle,
    description: pageDesc,
    alternates: {
      canonical: `/lecture/${videoId}/${slug}`,
    },
    openGraph: {
      title: pageTitle,
      description: pageDesc,
      url: `${baseUrl}/lecture/${videoId}/${slug}`,
      type: "video.other",
      images: [
        {
          url: posterUrl,
          width: 1280,
          height: 720,
          alt: details.video.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: pageTitle,
      description: pageDesc,
      images: [posterUrl],
    },
  };
}

export default async function LecturePage({ params }: LecturePageProps) {
  const { videoId } = await params;

  const details = await getVideoDetails(videoId);

  // Unpublished videos or missing videos 404
  if (!details || !details.video.isPublished) {
    notFound();
  }

  const { video, subject, chapter, faculty } = details;

  // Log lecture view if user is logged in
  const currentUser = await getCurrentUser();
  if (currentUser?.user?.id) {
    await recordLectureView(
      { id: currentUser.user.id, role: currentUser.role, email: currentUser.user.email, name: currentUser.user.name },
      video.id,
    ).catch(() => {});
  }

  const classRoman = video.classLevel
    ? formatClassRoman(video.classLevel)
    : "XII";
  const classSlug = video.classLevel
    ? classLevelToSlug(video.classLevel) || "xii"
    : "xii";

  // Concurrent fetches for related entities
  const [upNextVideos, resources, relatedBatch] = await Promise.all([
    getUpNextVideos(video.id, chapter?.id, subject?.id, 4),
    chapter?.id ? getPublicChapterResources(chapter.id) : Promise.resolve([]),
    video.classLevel
      ? getRelatedBatchForClass(video.classLevel, subject?.id)
      : Promise.resolve(null),
  ]);

  // Construct Breadcrumbs: (Learn › Class XII › Maths › Integrals › Video Title)
  const breadcrumbs: Array<{ label: string; href?: string }> = [
    { label: "Home", href: "/" },
    { label: "Learn", href: "/learn" },
  ];

  if (video.classLevel && subject) {
    breadcrumbs.push({
      label: `Class ${classRoman}`,
      href: `/learn/${classSlug}/${subject.slug}`,
    });
    breadcrumbs.push({
      label: subject.name,
      href: `/learn/${classSlug}/${subject.slug}`,
    });
  }

  if (video.classLevel && subject && chapter) {
    breadcrumbs.push({
      label: chapter.title,
      href: `/learn/${classSlug}/${subject.slug}/${chapter.slug}`,
    });
  }

  breadcrumbs.push({ label: video.title });

  const publishedDateFormatted = video.publishedAt
    ? new Date(video.publishedAt).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : formatRelativeTime(video.publishedAt);

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://quick2learn.in";
  const posterUrl =
    video.thumbnailUrl ||
    `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`;

  const videoLd = {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: video.title,
    description:
      video.description ||
      `Watch free conceptual lecture on ${video.title} with Quick2Learn institute faculty.`,
    thumbnailUrl: [posterUrl],
    uploadDate: video.publishedAt
      ? new Date(video.publishedAt).toISOString()
      : new Date("2026-01-01T00:00:00Z").toISOString(),
    duration: formatIsoDuration(video.durationSeconds),
    embedUrl: `https://www.youtube-nocookie.com/embed/${video.id}`,
    contentUrl: `https://www.youtube.com/watch?v=${video.id}`,
    publisher: {
      "@type": "Organization",
      name: "Quick2Learn",
      logo: {
        "@type": "ImageObject",
        url: `${baseUrl}/images/logo.png`,
      },
    },
  };

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(videoLd) }}
      />
      <BreadcrumbsPlacement items={breadcrumbs} />

      <div className="container mx-auto px-4 py-6 lg:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 xl:gap-10">
          {/* Main Column: Player, Meta, Description, Resources */}
          <div className="lg:col-span-2 space-y-6">
            {/* 1. Lite YouTube Player with Interactive Description */}
            <LectureViewClient
              videoId={video.id}
              title={video.title}
              durationSeconds={video.durationSeconds}
              thumbnailUrl={video.thumbnailUrl}
              description={video.description || ""}
            />

            {/* 2. Video Title & Metadata */}
            <div className="space-y-4 pt-2">
              <div className="flex flex-wrap items-center gap-2">
                {video.classLevel && (
                  <Badge variant="primary">Class {classRoman}</Badge>
                )}
                {subject && <Badge variant="neutral">{subject.name}</Badge>}
                {chapter && (
                  <Badge variant="accent">
                    Chapter {chapter.number}: {chapter.title}
                  </Badge>
                )}
                {video.isShort && (
                  <Badge variant="accent" className="bg-amber-500 text-white">
                    Short
                  </Badge>
                )}
              </div>

              <h1 className="text-h2 sm:text-h1 font-extrabold text-ink tracking-tight leading-tight">
                {video.title}
              </h1>

              {/* Stats Bar */}
              <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-border text-small text-ink-muted">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-1.5 font-medium text-ink">
                    <Eye className="h-4 w-4 text-ink-muted" />
                    <span>{formatViews(video.viewCount)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-ink-muted" />
                    <span>{publishedDateFormatted}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-ink-muted" />
                    <span>{formatDuration(video.durationSeconds)}</span>
                  </div>
                  {faculty && (
                    <div className="flex items-center gap-1.5">
                      <User className="h-4 w-4 text-primary" />
                      <span className="font-medium text-ink">{faculty.name}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* 3. Action Buttons: Share, WhatsApp, YouTube External */}
              <div className="pt-2">
                <ShareButtons videoId={video.id} title={video.title} />
              </div>
            </div>

            {/* 4. Attached Chapter Notes & Resources */}
            {resources.length > 0 && (
              <section className="pt-6 border-t border-border">
                <ChapterResources
                  resources={resources.map((r) => ({
                    id: r.id,
                    title: r.title,
                    type: r.type,
                    storageKey: r.storageKey,
                  }))}
                  title="Attached Notes &amp; Formulas for this Chapter"
                />
              </section>
            )}
          </div>

          {/* Sidebar: Up next & Related Batch */}
          <div className="space-y-6">
            {/* Related Batch Card ("Want structured classes? Join the Class XII batch") */}
            {relatedBatch && (
              <RelatedBatchCard
                batch={relatedBatch.batch}
                facultyName={relatedBatch.faculty?.name}
                subjectName={relatedBatch.subject?.name}
              />
            )}

            {/* "Up Next" from the same chapter or subject */}
            <div className="space-y-4 rounded-xl border border-border bg-surface p-5">
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <h2 className="text-body font-bold text-ink flex items-center gap-2">
                  <ListVideo className="h-4.5 w-4.5 text-primary" />
                  <span>Up Next</span>
                </h2>
                <span className="text-caption text-ink-muted">
                  {chapter ? "Same Chapter" : "Recommended"}
                </span>
              </div>

              {upNextVideos.length === 0 ? (
                <p className="text-small text-ink-muted">
                  More video lectures will be added soon.
                </p>
              ) : (
                <div className="space-y-3">
                  {upNextVideos.map((upNext) => (
                    <LectureCard key={upNext.id} {...upNext} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
