import { requireOnboardedUser } from "@/server/auth/session";
import { getFeeDues } from "@/server/data/payments";
import { getStudentEnrolledBatches } from "@/server/data/enrollments";
import { getAnnouncements } from "@/server/data/announcements";
import { getRecentlyViewedLectures } from "@/server/data/videos";
import { getSubjects } from "@/server/data/catalog";
import { formatINR, classLevelToSlug, formatClassRoman } from "@quick2learn/shared";
import { Badge } from "@/components/ui/badge";
import { DuePayButton } from "@/components/student/due-pay-button";
import { publicEnv } from "@/lib/env";
import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  Bell,
  Pin,
  Clock,
  PlayCircle,
  BookOpen,
  ArrowRight,
  GraduationCap,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import type { AuthUser } from "@/server/authz";

export const revalidate = 0;

export default async function StudentDashboardPage() {
  const current = await requireOnboardedUser();

  const authUser: AuthUser = {
    id: current.user.id,
    email: current.user.email,
    name: current.user.name,
    role: current.role,
  };

  const [dues, enrolledBatches, announcements, recentlyViewed, subjects] =
    await Promise.all([
      getFeeDues(authUser),
      getStudentEnrolledBatches(authUser),
      getAnnouncements(authUser),
      getRecentlyViewedLectures(authUser, 4),
      getSubjects(),
    ]);

  const unpaidDues = dues.filter((d) => d.status === "due");

  // Identify dues that are overdue or due within 7 days
  const nowMs = Date.now();
  const alertDues = unpaidDues.filter((d) => {
    const dueTime = new Date(d.dueDate).getTime();
    const diffDays = Math.ceil((dueTime - nowMs) / (1000 * 60 * 60 * 24));
    return diffDays <= 7;
  });

  const studentClass = current.profile?.classLevel || 12;
  const classSlug = classLevelToSlug(studentClass) || "xii";
  const classRoman = formatClassRoman(studentClass);

  return (
    <div className="space-y-8">
      {/* 1. GREETING & HERO BANNER */}
      <div className="bg-gradient-to-r from-primary-soft/40 via-white to-neutral-subtle p-6 sm:p-8 rounded-2xl border border-primary/20 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-caption font-semibold text-primary uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" /> Student Portal
            </span>
            <Badge variant="primary" className="text-xs">
              Class {classRoman}
            </Badge>
          </div>
          <h1 className="text-h2 font-extrabold text-ink tracking-tight">
            Welcome back, {current.user.name.split(" ")[0]}!
          </h1>
          <p className="text-body-sm text-ink-muted">
            What would you like to accomplish today? Continue lectures, check batch assignments, or review your schedule.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/dashboard/batches"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-border text-ink hover:text-primary hover:border-primary/40 font-semibold text-body-sm shadow-xs transition-all"
          >
            <GraduationCap className="w-4 h-4 text-primary" />
            <span>My Batches ({enrolledBatches.length})</span>
          </Link>
          <Link
            href="/learn"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white hover:bg-primary-hover font-semibold text-body-sm shadow-xs transition-all"
          >
            <BookOpen className="w-4 h-4" />
            <span>Video Library</span>
          </Link>
        </div>
      </div>

      {/* 2. FEE ALERT BANNER (Within 7 days or overdue) */}
      {alertDues.length > 0 && (
        <section aria-label="Fee Payment Alert" className="space-y-3">
          {alertDues.map((due) => {
            const dueTime = new Date(due.dueDate).getTime();
            const diffDays = Math.ceil((dueTime - nowMs) / (1000 * 60 * 60 * 24));
            const isOverdue = diffDays < 0;

            return (
              <div
                key={due.id}
                className={`p-5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all shadow-xs ${
                  isOverdue
                    ? "bg-critical-soft/30 border-critical/40 text-critical"
                    : "bg-warning-soft/30 border-warning/40 text-warning"
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div
                    className={`p-2.5 rounded-lg shrink-0 mt-0.5 ${
                      isOverdue
                        ? "bg-critical text-white"
                        : "bg-warning text-ink"
                    }`}
                  >
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-body text-ink">
                        {due.label}
                      </span>
                      <Badge
                        variant={isOverdue ? "critical" : "accent"}
                        className="text-[11px]"
                      >
                        {isOverdue
                          ? `Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) > 1 ? "s" : ""}`
                          : diffDays === 0
                            ? "Due today"
                            : `Due in ${diffDays} day${diffDays > 1 ? "s" : ""}`}
                      </Badge>
                    </div>
                    <p className="text-body-sm text-ink-muted mt-0.5">
                      Instalment amount:{" "}
                      <strong className="text-ink font-bold">
                        {formatINR(due.amountPaise)}
                      </strong>{" "}
                      · Due Date: {due.dueDate}
                    </p>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-3">
                  <DuePayButton
                    dueId={due.id}
                    dueLabel={due.label}
                    amountPaise={due.amountPaise}
                    razorpayKeyId={publicEnv.NEXT_PUBLIC_RAZORPAY_KEY_ID}
                    studentEmail={current.user.email}
                    studentName={current.user.name}
                  />
                </div>
              </div>
            );
          })}
        </section>
      )}

      {/* NO DUES EMPTY STATE (When all paid up) */}
      {unpaidDues.length === 0 && dues.length > 0 && (
        <div className="p-4 rounded-xl bg-positive-soft/20 border border-positive/30 text-positive flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-positive shrink-0" />
          <p className="text-body-sm font-medium text-ink">
            <strong className="text-positive font-bold">You&apos;re all paid up.</strong>{" "}
            All course fee dues for your enrolled batches are cleared.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT COLUMN: Batches & Recently Viewed (2 cols) */}
        <div className="lg:col-span-2 space-y-8">
          {/* MY BATCHES SECTION */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-h3 font-bold text-ink flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-primary" />
                <span>My Active Batches</span>
              </h2>
              <Link
                href="/dashboard/batches"
                className="text-body-sm text-primary hover:underline font-semibold flex items-center gap-1"
              >
                View all <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {enrolledBatches.length === 0 ? (
              /* EMPTY STATE: NO BATCHES */
              <div className="p-8 rounded-2xl border border-dashed border-border text-center bg-white space-y-4">
                <div className="w-12 h-12 rounded-full bg-primary-soft/50 text-primary mx-auto flex items-center justify-center">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-body-lg font-bold text-ink">
                    You haven&apos;t joined a batch yet
                  </h3>
                  <p className="text-body-sm text-ink-muted max-w-md mx-auto">
                    Join Mr. Dinesh Singh Rajput&apos;s offline or online batches in Mathura for structured concept clarity, DPPs, and board preparation.
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <Link
                    href="/batches"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white hover:bg-primary-hover text-body-sm font-semibold transition-all shadow-xs"
                  >
                    <span>Explore batches</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    href="/learn"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-border text-ink hover:text-primary text-body-sm font-semibold transition-all"
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>Watch free lectures</span>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {enrolledBatches.map((item) => (
                  <div
                    key={item.enrollment.id}
                    className="p-5 rounded-xl border border-border bg-white hover:border-primary/40 transition-all shadow-xs flex flex-col justify-between space-y-4 group"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <Badge
                          variant={
                            item.enrollment.status === "active"
                              ? "success"
                              : "accent"
                          }
                          className="capitalize text-xs"
                        >
                          {item.enrollment.status === "active"
                            ? "Active Classroom"
                            : item.enrollment.status.replace("_", " ")}
                        </Badge>
                        <span className="text-caption text-ink-muted">
                          {item.batch.mode}
                        </span>
                      </div>
                      <h4 className="text-body font-bold text-ink group-hover:text-primary transition-colors line-clamp-1">
                        {item.batch.title}
                      </h4>
                      <p className="text-caption text-ink-muted line-clamp-2">
                        {item.batch.scheduleText}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-border flex items-center justify-between">
                      <span className="text-caption font-medium text-ink-muted">
                        Mentor: {item.faculty?.name || "Dinesh Sir"}
                      </span>
                      <Link
                        href={`/dashboard/batches/${item.batch.slug}`}
                        className="text-body-sm text-primary font-semibold flex items-center gap-1 hover:underline"
                      >
                        Classroom <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* RECENTLY VIEWED LECTURES */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-h3 font-bold text-ink flex items-center gap-2">
                <PlayCircle className="w-5 h-5 text-primary" />
                <span>Recently Viewed Lectures</span>
              </h2>
              <Link
                href="/dashboard/lectures"
                className="text-body-sm text-primary hover:underline font-semibold flex items-center gap-1"
              >
                All Lectures <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {recentlyViewed.length === 0 ? (
              <div className="p-6 rounded-xl border border-dashed border-border bg-neutral-subtle/30 text-center space-y-2">
                <Clock className="w-8 h-8 text-ink-muted mx-auto opacity-40" />
                <p className="text-body-sm text-ink-muted">
                  You haven&apos;t watched any video lectures recently.
                </p>
                <Link
                  href="/learn"
                  className="inline-flex items-center gap-1.5 text-body-sm font-semibold text-primary hover:underline"
                >
                  Browse Free Lectures Library <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {recentlyViewed.map((lecture) => (
                  <Link
                    key={lecture.id}
                    href={lecture.href}
                    className="p-3.5 rounded-xl border border-border bg-white hover:border-primary/40 transition-all shadow-xs flex items-center gap-3.5 group"
                  >
                    <div className="w-24 aspect-video rounded-lg bg-black/10 shrink-0 overflow-hidden relative">
                      <img
                        src={lecture.thumbnailUrl}
                        alt={lecture.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <span className="absolute bottom-1 right-1 bg-black/80 text-white text-[10px] px-1 rounded font-mono">
                        {lecture.duration}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-body-sm font-bold text-ink group-hover:text-primary transition-colors line-clamp-2">
                        {lecture.title}
                      </h4>
                      <p className="text-caption text-ink-muted mt-1">
                        {lecture.gradeAndSubject}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* RIGHT COLUMN: Announcements & Quick Class Links (1 col) */}
        <div className="space-y-8">
          {/* QUICK LINKS: CLASS LIBRARY */}
          <section className="space-y-3">
            <h3 className="text-body-lg font-bold text-ink flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-primary" />
              <span>Class {classRoman} Subjects</span>
            </h3>
            <div className="grid grid-cols-2 gap-2.5">
              {subjects.map((sub) => (
                <Link
                  key={sub.id}
                  href={`/learn/${classSlug}/${sub.slug}`}
                  className="p-3 rounded-xl border border-border bg-white hover:border-primary/50 hover:bg-primary-soft/10 transition-all text-center group"
                >
                  <span className="text-body-sm font-bold text-ink group-hover:text-primary block truncate">
                    {sub.name}
                  </span>
                  <span className="text-[11px] text-ink-muted block mt-0.5">
                    Class {classRoman}
                  </span>
                </Link>
              ))}
            </div>
            <Link
              href="/learn"
              className="w-full flex items-center justify-center gap-1.5 py-2 text-caption text-ink-muted hover:text-primary font-medium"
            >
              <span>Explore all classes (IX–XII)</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </section>

          {/* ANNOUNCEMENTS (Pinned First) */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-body-lg font-bold text-ink flex items-center gap-2">
                <Bell className="w-4 h-4 text-primary" />
                <span>Notice Board</span>
              </h3>
              <Badge variant="neutral" className="text-xs">
                {announcements.length}
              </Badge>
            </div>

            {announcements.length === 0 ? (
              <div className="p-4 rounded-xl border border-border bg-white text-center text-ink-muted text-body-sm">
                No new announcements posted yet.
              </div>
            ) : (
              <div className="space-y-3">
                {announcements.slice(0, 4).map((ann) => (
                  <div
                    key={ann.id}
                    className={`p-4 rounded-xl border transition-all ${
                      ann.isPinned
                        ? "bg-primary-soft/15 border-primary/30"
                        : "bg-white border-border"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      {ann.isPinned ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-primary">
                          <Pin className="w-3 h-3" /> Pinned
                        </span>
                      ) : (
                        <span className="text-[11px] text-ink-muted">
                          Notice
                        </span>
                      )}
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
                    <p className="text-caption text-ink-muted mt-1 line-clamp-3 whitespace-pre-line">
                      {ann.body}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
