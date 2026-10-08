import { requireOnboardedUser } from "@/server/auth/session";
import { getVideos, getRecentlyViewedLectures, formatDuration, formatViews, formatRelativeTime } from "@/server/data/videos";
import { getSubjects } from "@/server/data/catalog";
import { formatClassRoman, classLevelToSlug, slugify } from "@quick2learn/shared";
import Link from "next/link";
import {
  PlaySquare,
  Clock,
  BookOpen,
  ArrowRight,
} from "lucide-react";
import type { AuthUser } from "@/server/authz";

interface LecturesPageProps {
  searchParams: Promise<{
    class?: string;
    subject?: string;
    q?: string;
  }>;
}

export const revalidate = 0;

export default async function StudentLecturesPage({ searchParams }: LecturesPageProps) {
  const current = await requireOnboardedUser();
  const sp = await searchParams;

  const authUser: AuthUser = {
    id: current.user.id,
    email: current.user.email,
    name: current.user.name,
    role: current.role,
  };

  const selectedClass = sp.class ? parseInt(sp.class, 10) : (current.profile?.classLevel || 12);
  const selectedSubjectId = sp.subject || undefined;
  const searchQuery = sp.q || undefined;

  const [recentlyViewed, allSubjects, classVideos] = await Promise.all([
    getRecentlyViewedLectures(authUser, 6),
    getSubjects(),
    getVideos(authUser, {
      classLevel: selectedClass,
      subjectId: selectedSubjectId,
      search: searchQuery,
      excludeShorts: true,
    }),
  ]);

  const classRoman = formatClassRoman(selectedClass);
  const classSlug = classLevelToSlug(selectedClass) || "xii";

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-h2 font-extrabold text-ink tracking-tight">
            Video Lectures
          </h1>
          <p className="text-body-sm text-ink-muted">
            High-yield concept lectures, one-shot chapter revisions, and board exam series.
          </p>
        </div>
        <Link
          href={`/learn/${classSlug}`}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white hover:bg-primary-hover text-body-sm font-semibold transition-all shadow-xs shrink-0"
        >
          <BookOpen className="w-4 h-4" />
          <span>Full Class {classRoman} Index</span>
        </Link>
      </div>

      {/* SECTION 1: RECENTLY VIEWED LECTURES */}
      {recentlyViewed.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-h3 font-bold text-ink flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              <span>Continue Watching</span>
            </h2>
            <span className="text-caption text-ink-muted">
              {recentlyViewed.length} recent sessions
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentlyViewed.map((lecture) => (
              <Link
                key={lecture.id}
                href={lecture.href}
                className="p-3.5 rounded-xl border border-border bg-white hover:border-primary/50 transition-all shadow-xs flex flex-col justify-between group"
              >
                <div className="aspect-video w-full rounded-lg bg-black/10 overflow-hidden relative mb-3">
                  <img
                    src={lecture.thumbnailUrl}
                    alt={lecture.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  <span className="absolute bottom-1.5 right-1.5 bg-black/85 text-white text-[11px] px-1.5 py-0.5 rounded font-mono">
                    {lecture.duration}
                  </span>
                </div>
                <div className="space-y-1">
                  <span className="text-[11px] font-semibold text-primary block">
                    {lecture.gradeAndSubject}
                  </span>
                  <h3 className="text-body-sm font-bold text-ink group-hover:text-primary transition-colors line-clamp-2">
                    {lecture.title}
                  </h3>
                </div>
                <div className="pt-3 border-t border-border mt-3 flex items-center justify-between text-caption text-ink-muted">
                  <span>{lecture.faculty}</span>
                  <span className="text-primary font-semibold flex items-center gap-1 group-hover:underline">
                    Resume <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* SECTION 2: CLASS LIBRARY WITH FILTERS */}
      <section className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-h3 font-bold text-ink flex items-center gap-2">
              <PlaySquare className="w-5 h-5 text-primary" />
              <span>Class {classRoman} Lecture Library</span>
            </h2>
            <p className="text-caption text-ink-muted">
              Filtered for your grade curriculum. Switch classes if you want to revise earlier topics.
            </p>
          </div>

          {/* Class Level Switcher Chips */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-neutral-subtle/80 border border-border shrink-0 self-start">
            {[9, 10, 11, 12].map((lvl) => {
              const isSelected = selectedClass === lvl;
              return (
                <Link
                  key={lvl}
                  href={`/dashboard/lectures?class=${lvl}${selectedSubjectId ? `&subject=${selectedSubjectId}` : ""}`}
                  className={`px-3 py-1.5 rounded-lg text-caption font-bold transition-all ${
                    isSelected
                      ? "bg-white text-primary shadow-xs"
                      : "text-ink-muted hover:text-ink"
                  }`}
                >
                  Class {formatClassRoman(lvl)}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Subject Filter Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <Link
            href={`/dashboard/lectures?class=${selectedClass}`}
            className={`px-3.5 py-1.5 rounded-full text-caption font-semibold shrink-0 transition-all ${
              !selectedSubjectId
                ? "bg-primary text-white shadow-xs"
                : "bg-white border border-border text-ink hover:border-primary/40"
            }`}
          >
            All Subjects
          </Link>
          {allSubjects.map((sub) => {
            const isSelected = selectedSubjectId === sub.id;
            return (
              <Link
                key={sub.id}
                href={`/dashboard/lectures?class=${selectedClass}&subject=${sub.id}`}
                className={`px-3.5 py-1.5 rounded-full text-caption font-semibold shrink-0 transition-all ${
                  isSelected
                    ? "bg-primary text-white shadow-xs"
                    : "bg-white border border-border text-ink hover:border-primary/40"
                }`}
              >
                {sub.name}
              </Link>
            );
          })}
        </div>

        {/* Videos Grid */}
        {classVideos.length === 0 ? (
          <div className="p-10 rounded-2xl border border-dashed border-border bg-white text-center space-y-3">
            <BookOpen className="w-10 h-10 text-ink-muted mx-auto opacity-40" />
            <h3 className="text-body font-bold text-ink">
              No video lectures found for this filter
            </h3>
            <p className="text-caption text-ink-muted max-w-sm mx-auto">
              Check out our complete structured video library across all chapters on the public portal.
            </p>
            <Link
              href="/learn"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white hover:bg-primary-hover font-semibold text-body-sm transition-all shadow-xs"
            >
              <span>Explore Public Free Library</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {classVideos.map((video) => {
              const slug = slugify(video.title);
              const durationFormatted = formatDuration(video.durationSeconds);
              const viewsFormatted = formatViews(video.viewCount);

              return (
                <Link
                  key={video.id}
                  href={`/lecture/${video.id}/${slug}`}
                  className="rounded-2xl border border-border bg-white hover:border-primary/40 transition-all shadow-xs overflow-hidden flex flex-col justify-between group"
                >
                  <div>
                    <div className="aspect-video w-full bg-black/10 overflow-hidden relative">
                      <img
                        src={
                          video.thumbnailUrl ||
                          `https://img.youtube.com/vi/${video.id}/hqdefault.jpg`
                        }
                        alt={video.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <span className="absolute bottom-2 right-2 bg-black/85 text-white text-[11px] px-1.5 py-0.5 rounded font-mono">
                        {durationFormatted}
                      </span>
                    </div>

                    <div className="p-4 space-y-1.5">
                      <div className="flex items-center justify-between text-caption text-ink-muted">
                        <span className="font-semibold text-primary">
                          Class {classRoman}
                        </span>
                        <span>{viewsFormatted}</span>
                      </div>
                      <h3 className="text-body-sm font-bold text-ink group-hover:text-primary transition-colors line-clamp-2">
                        {video.title}
                      </h3>
                    </div>
                  </div>

                  <div className="px-4 py-3 bg-neutral-subtle/40 border-t border-border flex items-center justify-between text-caption text-ink-muted">
                    <span>
                      {video.publishedAt
                        ? formatRelativeTime(video.publishedAt)
                        : "Available"}
                    </span>
                    <span className="text-primary font-semibold flex items-center gap-1 group-hover:underline">
                      Watch Lecture <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
