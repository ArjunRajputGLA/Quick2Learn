import { requireRole } from "@/server/auth/session";
import { getAdminLecturesList, getAdminSubjectChapterOptions } from "@/server/data/admin";
import { LecturesClient } from "@/components/admin/lectures-client";

export const metadata = {
  title: "Lectures & YouTube Video Sync · Admin · Quick2Learn",
};

interface AdminLecturesPageProps {
  searchParams: Promise<{
    search?: string;
    needsReview?: string;
    unmapped?: string;
    isShort?: string;
    isPublished?: string;
    classLevel?: string;
    subjectId?: string;
    chapterId?: string;
    page?: string;
  }>;
}

export default async function AdminLecturesPage({ searchParams }: AdminLecturesPageProps) {
  const current = await requireRole(["admin", "teacher"]);
  const params = await searchParams;

  const filters = {
    search: params.search,
    needsReview: params.needsReview === "true" ? true : undefined,
    unmapped: params.unmapped === "true" ? true : undefined,
    isShort: params.isShort === "true" ? true : params.isShort === "false" ? false : undefined,
    isPublished:
      params.isPublished === "true" ? true : params.isPublished === "false" ? false : undefined,
    classLevel: params.classLevel ? Number(params.classLevel) : undefined,
    subjectId: params.subjectId,
    chapterId: params.chapterId,
    limit: 60,
    offset: params.page ? (Number(params.page) - 1) * 60 : 0,
  };

  const { videos, total } = await getAdminLecturesList(current.user, filters);
  const { subjects, chapters } = await getAdminSubjectChapterOptions(current.user);

  return (
    <div className="space-y-3 max-w-7xl mx-auto pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Lectures &amp; YouTube Content
            </h1>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200/80 text-slate-700 font-semibold">
              {total} videos
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Review synced videos, map them to syllabus chapters, manage shorts, and publish status.
          </p>
        </div>
      </div>

      <LecturesClient
        initialVideos={videos}
        totalCount={total}
        subjects={subjects}
        chapters={chapters}
      />
    </div>
  );
}

