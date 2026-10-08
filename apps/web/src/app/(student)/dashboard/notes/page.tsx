import { requireOnboardedUser } from "@/server/auth/session";
import { getAccessibleResourcesWithDetails } from "@/server/data/resources";
import { getSubjects, getChapters } from "@/server/data/catalog";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  FileText,
  Download,
  Filter,
  ShieldCheck,
} from "lucide-react";
import type { AuthUser } from "@/server/authz";

interface NotesPageProps {
  searchParams: Promise<{
    subject?: string;
    chapter?: string;
    type?: string;
  }>;
}

export const revalidate = 0;

export default async function StudentNotesPage({ searchParams }: NotesPageProps) {
  const current = await requireOnboardedUser();
  const sp = await searchParams;

  const authUser: AuthUser = {
    id: current.user.id,
    email: current.user.email,
    name: current.user.name,
    role: current.role,
  };

  const selectedSubjectId = sp.subject || undefined;
  const selectedChapterId = sp.chapter || undefined;
  const selectedType = sp.type || undefined;

  const [subjects, chapters, resources] = await Promise.all([
    getSubjects(),
    getChapters(selectedSubjectId ? { subjectId: selectedSubjectId } : undefined),
    getAccessibleResourcesWithDetails(authUser, {
      subjectId: selectedSubjectId,
      chapterId: selectedChapterId,
      type: selectedType,
    }),
  ]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-h2 font-extrabold text-ink tracking-tight">
            Study Notes &amp; Resources
          </h1>
          <p className="text-body-sm text-ink-muted">
            Formula booklets, daily practice sheets (DPPs), and chapter summaries with 1-hour secure download links.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="primary" className="text-xs">
            {resources.length} Accessible Notes
          </Badge>
        </div>
      </div>

      {/* FILTERS BAR: Subject & Chapter */}
      <div className="p-5 rounded-2xl bg-white border border-border space-y-4 shadow-xs">
        <div className="flex items-center gap-2 text-body-sm font-bold text-ink">
          <Filter className="w-4 h-4 text-primary" />
          <span>Filter by Subject &amp; Chapter</span>
        </div>

        {/* Subject Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <Link
            href="/dashboard/notes"
            className={`px-3.5 py-1.5 rounded-full text-caption font-semibold shrink-0 transition-all ${
              !selectedSubjectId
                ? "bg-primary text-white shadow-xs"
                : "bg-neutral-subtle text-ink hover:bg-neutral-subtle/80"
            }`}
          >
            All Subjects
          </Link>
          {subjects.map((sub) => {
            const isSelected = selectedSubjectId === sub.id;
            return (
              <Link
                key={sub.id}
                href={`/dashboard/notes?subject=${sub.id}`}
                className={`px-3.5 py-1.5 rounded-full text-caption font-semibold shrink-0 transition-all ${
                  isSelected
                    ? "bg-primary text-white shadow-xs"
                    : "bg-neutral-subtle text-ink hover:bg-neutral-subtle/80"
                }`}
              >
                {sub.name}
              </Link>
            );
          })}
        </div>

        {/* Chapter Chips (if subject selected or available) */}
        {chapters.length > 0 && selectedSubjectId && (
          <div className="pt-2 border-t border-border/60">
            <span className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider block mb-2">
              Select Chapter
            </span>
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              <Link
                href={`/dashboard/notes?subject=${selectedSubjectId}`}
                className={`px-3 py-1 rounded-lg text-caption font-medium shrink-0 transition-all ${
                  !selectedChapterId
                    ? "bg-ink text-white font-semibold"
                    : "bg-neutral-subtle/60 text-ink-muted hover:text-ink"
                }`}
              >
                All Chapters
              </Link>
              {chapters.map((chap) => {
                const isSelected = selectedChapterId === chap.id;
                return (
                  <Link
                    key={chap.id}
                    href={`/dashboard/notes?subject=${selectedSubjectId}&chapter=${chap.id}`}
                    className={`px-3 py-1 rounded-lg text-caption font-medium shrink-0 transition-all ${
                      isSelected
                        ? "bg-ink text-white font-semibold"
                        : "bg-neutral-subtle/60 text-ink-muted hover:text-ink"
                    }`}
                  >
                    Ch {chap.number}: {chap.title}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* RESOURCES LIST */}
      {resources.length === 0 ? (
        <div className="p-10 rounded-2xl border border-dashed border-border bg-white text-center space-y-3">
          <FileText className="w-10 h-10 text-ink-muted mx-auto opacity-40" />
          <h3 className="text-body font-bold text-ink">
            No study notes found matching your filters
          </h3>
          <p className="text-caption text-ink-muted max-w-sm mx-auto">
            Try clearing the filters to see all public notes and enrolled study material.
          </p>
          <div className="pt-2">
            <Link
              href="/dashboard/notes"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white hover:bg-primary-hover font-semibold text-body-sm transition-all shadow-xs"
            >
              <span>Reset Filters</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {resources.map((res) => {
            const isEnrolled = res.visibility === "enrolled";

            return (
              <div
                key={res.id}
                className="p-5 rounded-2xl border border-border bg-white hover:border-primary/40 transition-all shadow-xs flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <Badge
                      variant={isEnrolled ? "accent" : "primary"}
                      className="text-[10px] font-semibold"
                    >
                      {isEnrolled ? (
                        <span className="flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" /> Enrolled Exclusive
                        </span>
                      ) : (
                        "Public Note"
                      )}
                    </Badge>
                    <span className="text-[11px] font-medium text-ink-muted uppercase tracking-wider">
                      {res.type}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-body font-bold text-ink">
                      {res.title}
                    </h3>
                  </div>

                  <div className="text-caption text-ink-muted space-y-0.5 pt-1">
                    {res.subject && (
                      <p>
                        Subject: <strong className="text-ink font-semibold">{res.subject.name}</strong>
                      </p>
                    )}
                    {res.chapter && (
                      <p>
                        Chapter: <span className="text-ink font-medium">{res.chapter.title}</span>
                      </p>
                    )}
                    {res.batch && (
                      <p>
                        Batch: <span className="text-ink font-medium">{res.batch.title}</span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-border flex items-center justify-between gap-3">
                  <span className="text-[11px] text-ink-muted">
                    {isEnrolled ? "1-hour signed link" : "Direct access"}
                  </span>
                  <a
                    href={res.downloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white hover:bg-primary-hover font-semibold text-body-sm transition-all shadow-xs"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Note</span>
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
