"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { publishTestAdminAction } from "@/server/admin-actions";
import {
  Plus,
  Award,
  Calendar,
  Clock,
  BarChart2,
  Edit,
  Send,
  CheckCircle2,
} from "lucide-react";

export interface BatchTestItem {
  id: string;
  title: string;
  batchId?: string | null;
  subjectId: string;
  subjectName: string;
  kind: string;
  durationMinutes: number;
  totalMarks: number;
  startsAt?: string | null;
  endsAt?: string | null;
  attemptsAllowed: number;
  showSolutions: string;
  status: "draft" | "scheduled" | "live" | "closed";
  questionCount?: number;
  totalAttempts?: number;
  createdAt: string;
}

interface BatchTestsManagerProps {
  batchId: string;
  batchTitle: string;
  initialTests: BatchTestItem[];
}

export function BatchTestsManager({
  batchId,
  batchTitle,
  initialTests,
}: BatchTestsManagerProps) {
  const [tests, setTests] = useState<BatchTestItem[]>(initialTests);
  const [isPending, startTransition] = useTransition();

  const handlePublish = (id: string, title: string) => {
    if (!confirm(`Publish test "${title}"? This will make it live and notify all students enrolled in ${batchTitle}.`)) {
      return;
    }

    startTransition(async () => {
      try {
        const res = await publishTestAdminAction(id);
        if (res.success && res.data) {
          toast.success("Test published to batch!");
          const data = res.data as any;
          setTests((prev) =>
            prev.map((t) => (t.id === id ? { ...t, status: data.status } : t))
          );
        } else {
          toast.error(res.error || "Failed to publish test");
        }
      } catch (err: any) {
        toast.error(err.message || "Failed to publish test");
      }
    });
  };

  const getStatusBadge = (status: BatchTestItem["status"]) => {
    switch (status) {
      case "live":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-100 text-rose-700 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
            LIVE NOW
          </span>
        );
      case "scheduled":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
            <Calendar className="w-3 h-3" />
            SCHEDULED
          </span>
        );
      case "closed":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-neutral-100 text-neutral-600">
            <CheckCircle2 className="w-3 h-3" />
            CLOSED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
            DRAFT
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-border shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-ink flex items-center gap-2">
            <span>Tests & Quizzes for {batchTitle}</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
              {tests.length} Total
            </span>
          </h2>
          <p className="text-body-sm text-ink-muted mt-0.5">
            Create and schedule assessments, mock tests, and weekly quizzes specifically assigned to this batch.
          </p>
        </div>

        <Link
          href={`/admin/tests/new?batchId=${batchId}`}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-body-sm font-bold shadow-xs hover:bg-primary/90 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Schedule Test for Batch</span>
        </Link>
      </div>

      {/* Tests List */}
      {tests.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-border p-12 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
            <Award className="w-7 h-7" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-lg font-bold text-ink">No Tests Scheduled Yet</h3>
            <p className="text-body-sm text-ink-muted">
              Schedule your first chapter test, weekly assessment, or mock exam for students enrolled in {batchTitle}.
            </p>
          </div>
          <Link
            href={`/admin/tests/new?batchId=${batchId}`}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-body-sm font-bold shadow-xs hover:bg-primary/90 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule First Test</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tests.map((test) => (
            <div
              key={test.id}
              className="bg-white rounded-2xl border border-border p-5 shadow-xs flex flex-col justify-between hover:border-primary/40 transition-colors gap-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  {getStatusBadge(test.status)}
                  <span className="text-xs font-semibold text-ink-muted">
                    {test.subjectName}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-ink line-clamp-1">
                    {test.title}
                  </h3>
                  <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-caption text-ink-muted mt-1">
                    <span className="flex items-center gap-1 font-mono">
                      <Clock className="w-3.5 h-3.5 text-primary" />
                      {test.durationMinutes} mins
                    </span>
                    <span>•</span>
                    <span className="font-mono">
                      {test.questionCount || 0} questions
                    </span>
                    <span>•</span>
                    <span className="font-bold text-ink">
                      {test.totalMarks} marks
                    </span>
                  </div>
                </div>

                {test.startsAt && (
                  <div className="flex items-center gap-1.5 text-caption text-ink-muted bg-surface-subtle px-3 py-1.5 rounded-lg border border-border/50">
                    <Calendar className="w-3.5 h-3.5 text-primary" />
                    <span>
                      Scheduled:{" "}
                      <strong className="text-ink">
                        {new Date(test.startsAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </strong>
                    </span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-border flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Link
                    href={`/admin/tests/${test.id}`}
                    className="p-2 rounded-lg border border-border hover:bg-surface-subtle text-ink-muted hover:text-ink transition-colors"
                    title="Edit Test"
                  >
                    <Edit className="w-4 h-4" />
                  </Link>

                  <Link
                    href={`/admin/tests/${test.id}/results`}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border hover:bg-surface-subtle text-caption font-bold text-ink-muted hover:text-ink transition-colors"
                  >
                    <BarChart2 className="w-3.5 h-3.5 text-primary" />
                    <span>Submissions ({test.totalAttempts || 0})</span>
                  </Link>
                </div>

                {test.status !== "live" && test.status !== "closed" && (
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => handlePublish(test.id, test.title)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-caption font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50"
                  >
                    <Send className="w-3 h-3" />
                    <span>Publish</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
