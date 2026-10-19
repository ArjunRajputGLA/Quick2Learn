import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
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
import { LectureViewClient } from "@/components/learn/lecture-view-client";
import { ShareButtons } from "@/components/learn/share-buttons";
import { ChapterResources } from "@/components/learn/chapter-resources";
import { RelatedBatchCard } from "@/components/learn/related-batch-card";
import { LectureCard } from "@/components/ui/lecture-card";
import { db, schema, eq, and } from "@quick2learn/db";
import { formatClassRoman, classLevelToSlug } from "@quick2learn/shared";
import {
  Clock,
  Eye,
  Calendar,
  User,
  ListVideo,
  Sparkles,
  GraduationCap,
  CheckCircle2,
  BookOpen,
  ArrowRight,
  Download,
  Building2,
  FlaskConical,
  FileText,
} from "lucide-react";

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

  // Log lecture view and fetch watch progress if user is logged in
  const currentUser = await getCurrentUser();
  let initialPositionSeconds = 0;
  if (currentUser?.user?.id) {
    await recordLectureView(
      {
        id: currentUser.user.id,
        role: currentUser.role,
        email: currentUser.user.email,
        name: currentUser.user.name,
      },
      video.id,
    ).catch(() => {});

    const [prog] = await db
      .select({
        positionSeconds: schema.contentProgress.positionSeconds,
      })
      .from(schema.contentProgress)
      .where(
        and(
          eq(schema.contentProgress.userId, currentUser.user.id),
          eq(schema.contentProgress.itemType, "youtube_video"),
          eq(schema.contentProgress.itemId, video.id)
        )
      )
      .limit(1);

    if (prog) {
      initialPositionSeconds = prog.positionSeconds;
    }
  }

  const classRoman = video.classLevel
    ? formatClassRoman(video.classLevel)
    : "X";
  const classSlug = video.classLevel
    ? classLevelToSlug(video.classLevel) || "x"
    : "x";

  // Concurrent fetches for related entities
  const [upNextVideos, resources, relatedBatch] = await Promise.all([
    getUpNextVideos(video.id, chapter?.id, subject?.id, 4),
    chapter?.id ? getPublicChapterResources(chapter.id) : Promise.resolve([]),
    video.classLevel
      ? getRelatedBatchForClass(video.classLevel, subject?.id)
      : Promise.resolve(null),
  ]);

  // Construct Breadcrumbs
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
      label: subject.name || "Subject",
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

  // Faculty authentic photo
  const isDinesh = faculty?.slug?.includes("dinesh") || faculty?.name?.toLowerCase().includes("dinesh");
  const avatarUrl = isDinesh
    ? "/images/assets/Dinesh Singh Rajput.jpeg"
    : "/images/assets/Namita Singh Rajput.jpeg";

  const isMath = subject?.name?.toLowerCase().includes("math") || video.title.toLowerCase().includes("math");

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
    <div className="bg-white min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(videoLd) }}
      />
      <BreadcrumbsPlacement items={breadcrumbs} />

      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 xl:gap-10 items-start">
          {/* Main Column: Player, Meta, Milestones, Takeaways, Mentor, Downloads (8 of 12 cols on lg) */}
          <div className="lg:col-span-8 space-y-8">
            {/* 1. Cinematic Video Player + Description + Milestones + AI Tutor Widget */}
            <LectureViewClient
              videoId={video.id}
              title={video.title}
              durationSeconds={video.durationSeconds}
              thumbnailUrl={video.thumbnailUrl}
              description={video.description || ""}
              subjectName={subject?.name || "Sciences"}
              classRoman={classRoman}
              initialPositionSeconds={initialPositionSeconds}
              isLoggedIn={!!currentUser?.user?.id}
            />

            {/* 2. Video Header & Metadata */}
            <div className="space-y-4 pt-2">
              <div className="flex flex-wrap items-center gap-2">
                {video.classLevel && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
                    <GraduationCap className="h-3.5 w-3.5" />
                    Class {classRoman}
                  </span>
                )}
                {subject && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200">
                    <FlaskConical className="h-3.5 w-3.5 text-amber-700" />
                    {subject.name}
                  </span>
                )}
                {chapter && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800 border border-slate-200">
                    Chapter {chapter.number}: {chapter.title}
                  </span>
                )}
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                  Free Board Lecture
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-snug">
                {video.title}
              </h1>

              {/* Stats Bar */}
              <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200 text-xs sm:text-small text-slate-600">
                <div className="flex flex-wrap items-center gap-4 sm:gap-6 font-medium">
                  <div className="flex items-center gap-1.5 text-slate-800 font-bold">
                    <Eye className="h-4 w-4 text-slate-400" />
                    <span>{formatViews(video.viewCount)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    <span>{publishedDateFormatted}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-slate-400" />
                    <span>{formatDuration(video.durationSeconds)}</span>
                  </div>
                  {faculty && (
                    <div className="flex items-center gap-1.5 text-primary font-bold">
                      <User className="h-4 w-4" />
                      <span>{faculty.name}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* 3. Action Buttons: Share, WhatsApp, YouTube External */}
              <div className="pt-1">
                <ShareButtons videoId={video.id} title={video.title} />
              </div>
            </div>

            {/* 4. WHAT YOU'LL MASTER IN THIS LECTURE (Rich Learning Takeaways Grid) */}
            <section className="space-y-4 pt-2">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <span>What You&apos;ll Master in This Lecture</span>
                </h2>
                <span className="text-xs font-semibold text-slate-500">
                  Board Curriculum Focus
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-primary">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Core Theoretical Fundamentals</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed pl-6">
                    {isMath
                      ? "Direct derivation and conceptual proof of key board formulas with step-by-step problem illustrations."
                      : "Clear breakdown of chemical reaction pathways and physiological processes essential for board exams."}
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-primary">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Diagrams &amp; Equation Precision</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed pl-6">
                    {isMath
                      ? "Graph plotting, geometric constructions, and coordinate mapping techniques."
                      : "Step-by-step anatomical diagram drawing and chemical equation balancing guidelines."}
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-primary">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Past 10 Years Board PYQ Insights</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed pl-6">
                    Frequently repeated board question patterns, standard mark distributions, and examiner expectation trends.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-primary">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Examiner Insights &amp; Pitfalls to Avoid</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed pl-6">
                    Key presentation tips, units, diagram labeling rules, and how to avoid losing half-marks in board evaluation.
                  </p>
                </div>
              </div>
            </section>

            {/* 5. FACULTY MENTOR PROFILE CARD */}
            {faculty && (
              <section className="space-y-4 pt-2">
                <div className="border-b border-slate-200 pb-2.5">
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
                    <GraduationCap className="h-5 w-5 text-primary" />
                    <span>Faculty Mentor Profile</span>
                  </h2>
                </div>

                <div className="p-5 sm:p-6 rounded-2xl border border-slate-200 bg-gradient-to-br from-white via-slate-50/60 to-blue-50/20 shadow-xs flex flex-col sm:flex-row items-center sm:items-start gap-5">
                  <div className="relative h-24 w-24 sm:h-28 sm:w-28 rounded-2xl overflow-hidden border-2 border-white shadow-md ring-1 ring-slate-200 shrink-0">
                    <img
                      src={avatarUrl}
                      alt={faculty?.name || "Faculty Mentor"}
                      className="h-full w-full object-cover"
                    />
                  </div>

                  <div className="space-y-2.5 text-center sm:text-left flex-1 min-w-0">
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary">
                        {isDinesh ? "25+ Yrs Senior Mathematics" : "15+ Yrs ICSE Sciences"}
                      </span>
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        Mathura Campus Mentor
                      </span>
                    </div>

                    <div>
                      <h3 className="text-xl font-bold text-slate-900">
                        {faculty.name}
                      </h3>
                      <p className="text-xs font-semibold text-primary mt-0.5">
                        {faculty.designation}
                      </p>
                    </div>

                    <p className="text-xs sm:text-small text-slate-600 leading-relaxed">
                      {faculty.bio}
                    </p>

                    <div className="pt-1 flex flex-wrap items-center justify-center sm:justify-start gap-3">
                      <Link
                        href={`/faculty/${faculty.slug}`}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
                      >
                        <span>View all lectures by {faculty.name}</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* 6. ATTACHED STUDY MATERIALS & REVISION NOTES */}
            <section className="space-y-4 pt-2">
              <div className="border-b border-slate-200 pb-2.5">
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  <span>Attached Notes &amp; Practice Materials</span>
                </h2>
              </div>

              {resources.length > 0 ? (
                <ChapterResources
                  resources={resources.map((r) => ({
                    id: r.id,
                    title: r.title,
                    type: r.type,
                    storageKey: r.storageKey,
                  }))}
                  title="Chapter Resources"
                />
              ) : (
                <div className="p-5 rounded-2xl border border-slate-200 bg-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xs">
                  <div className="flex items-center gap-3.5 text-center sm:text-left">
                    <div className="h-11 w-11 rounded-xl bg-blue-100 text-primary flex items-center justify-center shrink-0">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-small font-bold text-slate-900">
                        Class {classRoman} {subject?.name || "Sciences"} Revision Formula Sheet
                      </h3>
                      <p className="text-xs text-slate-500">
                        High-yield summary notes with diagram guidelines prepared by Quick2Learn faculty.
                      </p>
                    </div>
                  </div>

                  <a
                    href="https://wa.me/917668875809?text=Hi%20Quick2Learn%2C%20please%20share%20the%20Class%2010%20Biology%20formula%20sheet%20and%20notes"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white text-xs font-bold shadow-xs hover:bg-primary-hover transition-colors shrink-0 cursor-pointer"
                  >
                    <Download className="h-4 w-4" />
                    <span>Get Free Revision Notes</span>
                  </a>
                </div>
              )}
            </section>

            {/* 7. MATHURA CLASSROOM COHORT PROMO BANNER */}
            <section className="p-6 rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 via-blue-50/30 to-white flex flex-col sm:flex-row items-center justify-between gap-5 shadow-xs">
              <div className="space-y-1.5 text-center sm:text-left">
                <span className="text-[11px] font-bold uppercase tracking-wider text-primary flex items-center justify-center sm:justify-start gap-1">
                  <Building2 className="h-3.5 w-3.5" />
                  Offline Coaching in Mathura
                </span>
                <h3 className="text-lg font-bold text-slate-900">
                  Want In-Person Classroom Mentorship?
                </h3>
                <p className="text-xs sm:text-small text-slate-600 max-w-xl">
                  Join Dinesh Sir &amp; Namita Ma&apos;am at Highway Plaza, Mathura. Strict 30-student cap with daily personalized doubt solving and weekly Sunday mock tests.
                </p>
              </div>

              <Link
                href="/batches"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-primary text-white text-xs sm:text-small font-bold shadow-sm hover:bg-primary-hover active:scale-98 transition-all shrink-0"
              >
                <span>Explore Classroom Batches</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </section>
          </div>

          {/* Sidebar: Related Batch & Horizontal "Up Next" Playlist (4 of 12 cols on lg) */}
          <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
            {/* Related Batch Card */}
            {relatedBatch && (
              <RelatedBatchCard
                batch={relatedBatch.batch}
                facultyName={relatedBatch.faculty?.name}
                subjectName={relatedBatch.subject?.name}
              />
            )}

            {/* "Up Next" Playlist with Horizontal Video Cards */}
            <div className="space-y-4 rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                <h2 className="text-small font-bold text-slate-900 flex items-center gap-2">
                  <ListVideo className="h-4.5 w-4.5 text-primary" />
                  <span>Up Next in This Series</span>
                </h2>
                <span className="text-[11px] font-semibold text-slate-400">
                  {chapter ? "Same Chapter" : "Recommended"}
                </span>
              </div>

              {upNextVideos.length === 0 ? (
                <p className="text-xs text-slate-500 py-3 text-center">
                  More video lectures will be added soon.
                </p>
              ) : (
                <div className="space-y-2.5">
                  {upNextVideos.map((upNext) => (
                    <LectureCard
                      key={upNext.id}
                      {...upNext}
                      layout="horizontal"
                    />
                  ))}
                </div>
              )}

              <div className="pt-2 border-t border-slate-100">
                <Link
                  href="/lectures"
                  className="flex items-center justify-center gap-1.5 text-xs font-bold text-primary hover:underline text-center py-1"
                >
                  <span>View All Free Lectures</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
