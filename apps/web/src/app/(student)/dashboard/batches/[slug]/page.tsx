import { notFound } from "next/navigation";
import { requireOnboardedUser } from "@/server/auth/session";
import { getBatchBySlug, getChapters } from "@/server/data";
import { getEnrollments } from "@/server/data/enrollments";
import { getAnnouncements } from "@/server/data/announcements";
import { getAccessibleResourcesWithDetails } from "@/server/data/resources";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  Clock,
  MapPin,
  Calendar,
  MessageCircle,
  FileText,
  Download,
  BookOpen,
  ArrowLeft,
  Bell,
  Lock,
  ExternalLink,
  CheckCircle2,
  PlayCircle,
} from "lucide-react";
import { classLevelToSlug, formatClassRoman } from "@quick2learn/shared";
import type { AuthUser } from "@/server/authz";

interface BatchPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export const revalidate = 0;

export default async function StudentBatchClassroomPage({ params }: BatchPageProps) {
  const { slug } = await params;
  const current = await requireOnboardedUser();

  const authUser: AuthUser = {
    id: current.user.id,
    email: current.user.email,
    name: current.user.name,
    role: current.role,
  };

  const batch = await getBatchBySlug(slug, authUser);
  if (!batch) {
    notFound();
  }

  // 1. Verify active enrollment in this batch
  const enrollments = await getEnrollments(authUser);
  const activeEnrollment = enrollments.find(
    (e) => e.batchId === batch.id && e.status === "active",
  );

  // If not actively enrolled, render polite restriction card
  if (!activeEnrollment) {
    return (
      <div className="space-y-6 max-w-2xl mx-auto py-12 text-center">
        <div className="w-16 h-16 rounded-full bg-warning-soft text-warning mx-auto flex items-center justify-center">
          <Lock className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h1 className="text-h2 font-bold text-ink">
            Enrolled Students Only
          </h1>
          <p className="text-body text-ink-muted">
            You do not currently have an active enrollment in{" "}
            <strong>{batch.title}</strong>. Classroom notes, WhatsApp group access, and private study resources are reserved for confirmed students.
          </p>
        </div>
        <div className="pt-4 flex justify-center gap-3">
          <Link
            href="/dashboard/batches"
            className="px-5 py-2.5 rounded-xl border border-border text-ink hover:text-primary font-semibold text-body-sm transition-all"
          >
            ← My Batches
          </Link>
          <Link
            href={`/batches/${batch.slug}`}
            className="px-5 py-2.5 rounded-xl bg-primary text-white hover:bg-primary-hover font-semibold text-body-sm transition-all shadow-xs"
          >
            Join This Batch
          </Link>
        </div>
      </div>
    );
  }

  // 2. Actively enrolled: fetch batch announcements, resources, and chapters
  const [announcements, resources, chapters] = await Promise.all([
    getAnnouncements(authUser, batch.id),
    getAccessibleResourcesWithDetails(authUser, { batchId: batch.id }),
    getChapters({
      subjectId: batch.subjectId,
      classLevel: batch.classLevel,
      board: batch.board,
    }),
  ]);

  const classSlug = classLevelToSlug(batch.classLevel) || "xii";
  const classRoman = formatClassRoman(batch.classLevel);

  return (
    <div className="space-y-8">
      {/* Back button & Breadcrumbs */}
      <div>
        <Link
          href="/dashboard/batches"
          className="inline-flex items-center gap-2 text-body-sm text-ink-muted hover:text-primary font-medium transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to My Batches</span>
        </Link>
      </div>

      {/* Classroom Header Banner */}
      <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-primary-soft/30 via-white to-neutral-subtle border border-primary/20 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="success" className="font-semibold text-xs">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Active Classroom
            </Badge>
            <Badge variant="primary" className="text-xs">
              Class {classRoman} · {batch.board.toUpperCase()}
            </Badge>
            <span className="text-caption font-semibold text-primary uppercase">
              {batch.mode} mode
            </span>
          </div>
          <h1 className="text-h2 font-extrabold text-ink tracking-tight">
            {batch.title}
          </h1>
          <p className="text-body-sm text-ink-muted max-w-2xl">
            {batch.subtitle || "Quick2Learn Offline & Hybrid Classroom Mentorship"}
          </p>
        </div>

        {/* Official WhatsApp Group for Enrolled Students Only */}
        {batch.whatsappGroupUrl && (
          <div className="shrink-0">
            <a
              href={batch.whatsappGroupUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 px-5 py-3 rounded-xl bg-[#25D366] text-white font-bold text-body-sm hover:brightness-105 transition-all shadow-xs"
            >
              <MessageCircle className="w-5 h-5" />
              <span>Join Batch WhatsApp Group</span>
            </a>
          </div>
        )}
      </div>

      {/* Schedule & Timing Info Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border border-border bg-white flex items-center gap-3.5 shadow-xs">
          <div className="p-2.5 rounded-lg bg-primary/10 text-primary shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-ink-muted uppercase block">
              Class Schedule
            </span>
            <span className="text-body-sm font-bold text-ink block mt-0.5">
              {batch.scheduleText}
            </span>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-border bg-white flex items-center gap-3.5 shadow-xs">
          <div className="p-2.5 rounded-lg bg-primary/10 text-primary shrink-0">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-ink-muted uppercase block">
              Location &amp; Center
            </span>
            <span className="text-body-sm font-bold text-ink block mt-0.5">
              {batch.locationText || "Quick2Learn Mathura Center"}
            </span>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-border bg-white flex items-center gap-3.5 shadow-xs">
          <div className="p-2.5 rounded-lg bg-primary/10 text-primary shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-ink-muted uppercase block">
              Batch Timeline
            </span>
            <span className="text-body-sm font-bold text-ink block mt-0.5">
              Started {new Date(batch.startDate).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT COLUMN: Study Material & Syllabus (2 cols) */}
        <div className="lg:col-span-2 space-y-8">
          {/* ENROLLED-ONLY STUDY RESOURCES */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-h3 font-bold text-ink flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  <span>Enrolled Batch Resources</span>
                </h2>
                <p className="text-caption text-ink-muted">
                  Exclusive DPPs, test solutions, and class formula booklets. Links expire in 1 hour.
                </p>
              </div>
              <Badge variant="primary" className="text-xs">
                {resources.length} Notes Available
              </Badge>
            </div>

            {resources.length === 0 ? (
              <div className="p-8 rounded-xl border border-dashed border-border bg-white text-center space-y-2">
                <FileText className="w-8 h-8 text-ink-muted mx-auto opacity-40" />
                <p className="text-body-sm font-medium text-ink">
                  No private batch notes uploaded yet.
                </p>
                <p className="text-caption text-ink-muted">
                  Faculty will upload chapter DPPs and question banks during the next lecture.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {resources.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-xl border border-border bg-white hover:border-primary/40 transition-all shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="p-2.5 rounded-lg bg-primary-soft/50 text-primary shrink-0 mt-0.5">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-body font-bold text-ink">
                            {item.title}
                          </h4>
                          <Badge
                            variant={item.visibility === "enrolled" ? "accent" : "neutral"}
                            className="text-[10px]"
                          >
                            {item.visibility === "enrolled" ? "Enrolled Only" : "Public"}
                          </Badge>
                        </div>
                        <span className="text-[11px] text-ink-muted block mt-1">
                          Type: {item.type.toUpperCase()} · Added{" "}
                          {new Date(item.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                          })}
                        </span>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                      <a
                        href={item.downloadUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white hover:bg-primary-hover font-semibold text-body-sm shadow-xs transition-all"
                      >
                        <Download className="w-4 h-4" />
                        <span>Download Note</span>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* SYLLABUS WITH LINKS TO FREE CONCEPT LECTURES */}
          <section className="space-y-4">
            <div>
              <h2 className="text-h3 font-bold text-ink flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                <span>Classroom Syllabus &amp; Video Theory</span>
              </h2>
              <p className="text-caption text-ink-muted">
                Prepare before classroom lectures or revise topics with our free video lectures.
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-white divide-y divide-border overflow-hidden shadow-xs">
              {chapters.map((chap) => (
                <div
                  key={chap.id}
                  className="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-neutral-subtle/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-full bg-neutral-subtle text-ink font-bold text-xs flex items-center justify-center shrink-0">
                      {chap.number}
                    </span>
                    <div>
                      <h4 className="text-body-sm font-bold text-ink">
                        {chap.title}
                      </h4>
                      <span className="text-caption text-ink-muted">
                        Class {classRoman} · {batch.board.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  <Link
                    href={`/learn/${classSlug}/${chap.slug}`}
                    className="inline-flex items-center gap-1.5 text-body-sm font-semibold text-primary hover:underline shrink-0"
                  >
                    <PlayCircle className="w-4 h-4" />
                    <span>Watch Lectures</span>
                  </Link>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* RIGHT COLUMN: Batch Announcements (1 col) */}
        <div className="space-y-6">
          <section className="space-y-3">
            <h3 className="text-body-lg font-bold text-ink flex items-center gap-2">
              <Bell className="w-4 h-4 text-primary" />
              <span>Batch Announcements</span>
            </h3>

            {announcements.length === 0 ? (
              <div className="p-4 rounded-xl border border-border bg-white text-center text-ink-muted text-body-sm">
                No announcements posted for this batch yet.
              </div>
            ) : (
              <div className="space-y-3">
                {announcements.map((ann) => (
                  <div
                    key={ann.id}
                    className="p-4 rounded-xl border border-border bg-white shadow-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-semibold text-primary">
                        Class Update
                      </span>
                      <span className="text-[11px] text-ink-muted">
                        {ann.publishedAt
                          ? new Date(ann.publishedAt).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                            })
                          : ""}
                      </span>
                    </div>
                    <h4 className="text-body-sm font-bold text-ink">
                      {ann.title}
                    </h4>
                    <p className="text-caption text-ink-muted whitespace-pre-line">
                      {ann.body}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Quick Help Card */}
          <div className="p-5 rounded-2xl bg-neutral-subtle/70 border border-border space-y-3">
            <h4 className="text-body-sm font-bold text-ink">
              Need Help With Classes?
            </h4>
            <p className="text-caption text-ink-muted">
              For batch timetable queries, fee payments, or sick-leave classroom sync, visit the institute office or message Dinesh Sir on WhatsApp.
            </p>
            <a
              href="https://wa.me/917668875809"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-caption font-semibold text-primary hover:underline"
            >
              <span>Contact Institute Desk</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
