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
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="border-b border-border pb-4">
        <h1 className="text-display-xs font-bold text-ink">Lectures & YouTube Content</h1>
        <p className="text-body-sm text-ink-muted mt-1">
          Review synced videos, map them to syllabus chapters, manage shorts, and publish status. Total: {total} videos.
        </p>
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
