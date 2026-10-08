import { requireOnboardedUser } from "@/server/auth/session";
import { getStudentEnrolledBatches } from "@/server/data/enrollments";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  GraduationCap,
  Calendar,
  Clock,
  MapPin,
  ArrowRight,
  BookOpen,
  AlertCircle,
} from "lucide-react";
import type { AuthUser } from "@/server/authz";

export const revalidate = 0;

export default async function StudentBatchesPage() {
  const current = await requireOnboardedUser();

  const authUser: AuthUser = {
    id: current.user.id,
    email: current.user.email,
    name: current.user.name,
    role: current.role,
  };

  const enrolledBatches = await getStudentEnrolledBatches(authUser);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-h2 font-extrabold text-ink tracking-tight">
            My Enrolled Batches
          </h1>
          <p className="text-body-sm text-ink-muted">
            Access your classroom schedule, batch discussions, and enrolled-only study material.
          </p>
        </div>
        <Link
          href="/batches"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-border hover:border-primary/50 text-body-sm font-semibold text-ink hover:text-primary transition-all shadow-xs shrink-0"
        >
          <span>Explore All Batches</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Empty State: No Batches */}
      {enrolledBatches.length === 0 ? (
        <div className="p-10 rounded-2xl border border-dashed border-border text-center bg-white space-y-5 my-8">
          <div className="w-14 h-14 rounded-full bg-primary-soft/50 text-primary mx-auto flex items-center justify-center">
            <GraduationCap className="w-7 h-7" />
          </div>
          <div className="space-y-1.5 max-w-md mx-auto">
            <h2 className="text-body-lg font-bold text-ink">
              You haven&apos;t joined a batch yet
            </h2>
            <p className="text-body-sm text-ink-muted">
              Enroll in our offline classroom programs in Mathura or live digital batches to get mentored by Mr. Dinesh Singh Rajput &amp; Mrs. Namita Singh Rajput.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              href="/batches"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white hover:bg-primary-hover font-semibold text-body-sm transition-all shadow-xs"
            >
              <span>Explore batches</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/learn"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white border border-border text-ink hover:text-primary font-semibold text-body-sm transition-all"
            >
              <BookOpen className="w-4 h-4" />
              <span>Watch free lectures</span>
            </Link>
          </div>
        </div>
      ) : (
        /* Batches Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {enrolledBatches.map((item) => {
            const isActive = item.enrollment.status === "active";
            const isPending = item.enrollment.status === "pending_payment";

            return (
              <div
                key={item.enrollment.id}
                className="rounded-2xl border border-border bg-white hover:border-primary/40 transition-all shadow-xs overflow-hidden flex flex-col justify-between"
              >
                <div className="p-6 space-y-4">
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <Badge
                      variant={isActive ? "success" : isPending ? "accent" : "neutral"}
                      className="capitalize font-semibold"
                    >
                      {isActive
                        ? "Active Enrollment"
                        : item.enrollment.status.replace("_", " ")}
                    </Badge>
                    <span className="text-caption font-semibold text-primary uppercase tracking-wide">
                      {item.batch.mode} mode
                    </span>
                  </div>

                  {/* Batch Title */}
                  <div>
                    <h3 className="text-h3 font-bold text-ink line-clamp-2">
                      {item.batch.title}
                    </h3>
                    <p className="text-caption text-ink-muted mt-0.5">
                      Class {item.batch.classLevel} · {item.batch.board.toUpperCase()} ·{" "}
                      {item.subject?.name || "Mathematics"}
                    </p>
                  </div>

                  {/* Schedule & Location */}
                  <div className="space-y-2 py-3 border-y border-border/60 text-caption text-ink">
                    <div className="flex items-center gap-2.5">
                      <Clock className="w-4 h-4 text-ink-muted shrink-0" />
                      <span>{item.batch.scheduleText}</span>
                    </div>
                    {item.batch.locationText && (
                      <div className="flex items-center gap-2.5">
                        <MapPin className="w-4 h-4 text-ink-muted shrink-0" />
                        <span>{item.batch.locationText}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2.5">
                      <Calendar className="w-4 h-4 text-ink-muted shrink-0" />
                      <span>
                        Enrolled on{" "}
                        {new Date(item.enrollment.enrolledAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Faculty */}
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-xs border border-primary/20">
                      {item.faculty?.name?.split(" ")[0]?.[0] || "D"}
                    </div>
                    <div>
                      <span className="text-body-sm font-semibold text-ink block">
                        {item.faculty?.name || "Dinesh Singh Rajput"}
                      </span>
                      <span className="text-[11px] text-ink-muted block">
                        Senior Faculty Mentor
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions Bar */}
                <div className="p-4 bg-neutral-subtle/50 border-t border-border flex items-center justify-between gap-3">
                  {isActive ? (
                    <>
                      <Link
                        href={`/dashboard/batches/${item.batch.slug}`}
                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white hover:bg-primary-hover font-semibold text-body-sm transition-all shadow-xs"
                      >
                        <GraduationCap className="w-4 h-4" />
                        <span>Enter Classroom</span>
                        <ArrowRight className="w-4 h-4 ml-1" />
                      </Link>
                    </>
                  ) : isPending ? (
                    <>
                      <span className="text-caption font-medium text-warning flex items-center gap-1.5">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>Awaiting Fee Payment</span>
                      </span>
                      <Link
                        href="/dashboard/payments"
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-white hover:bg-primary-hover font-semibold text-body-sm transition-all"
                      >
                        <span>Complete Payment</span>
                      </Link>
                    </>
                  ) : (
                    <span className="text-caption text-ink-muted">
                      Status: {item.enrollment.status}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
