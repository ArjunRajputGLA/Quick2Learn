"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { publishTestAdminAction } from "@/server/admin-actions";
import {
  Plus,
  Award,
  Calendar,
  BarChart2,
  Edit,
  Send,
  Search,
} from "lucide-react";

interface TestItem {
  id: string;
  title: string;
  batchId?: string | null;
  batchName?: string;
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

interface TestsManagerClientProps {
  initialTests: TestItem[];
  batches: Array<{ id: string; title: string }>;
}

export function TestsManagerClient({ initialTests, batches }: TestsManagerClientProps) {
  const [tests, setTests] = useState<TestItem[]>(initialTests);
  const [isPending, startTransition] = useTransition();

  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [batchFilter, setBatchFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTests = tests.filter((t) => {
    if (statusFilter !== "all" && t.status !== statusFilter) return false;
    if (batchFilter !== "all") {
      if (batchFilter === "free" && t.batchId) return false;
      if (batchFilter !== "free" && t.batchId !== batchFilter) return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (!t.title.toLowerCase().includes(q) && !t.subjectName.toLowerCase().includes(q)) {
        return false;
      }
    }
    return true;
  });

  const handlePublish = (id: string, title: string) => {
    if (!confirm(`Publish test "${title}"? This will make it live and notify batch students.`)) {
      return;
    }

    startTransition(async () => {
      try {
        const res = await publishTestAdminAction(id);
        if (res.success && res.data) {
          toast.success("Test published and push notification sent!");
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

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-border shadow-xs">
        <div>
          <h1 className="text-2xl font-black text-ink tracking-tight flex items-center gap-2">
            <span>Tests & Quizzes</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
              {tests.length} Total
            </span>
          </h1>
          <p className="text-body-sm text-ink-muted mt-1">
            Build chapter tests, unit tests, and full mock exams with timer controls, automatic ranking, and instant push notifications.
          </p>
        </div>

        <Link
          href="/admin/tests/new"
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-body-sm font-bold shadow-xs hover:bg-primary/90 transition-all self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Test</span>
        </Link>
      </div>

      {/* FILTER BAR */}
      <div className="bg-white p-4 rounded-2xl border border-border shadow-xs flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="w-4 h-4 text-ink-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search tests by title or subject..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-body-sm pl-9 pr-3 py-1.5 rounded-lg border border-border text-ink bg-white"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-body-sm px-3 py-1.5 rounded-lg border border-border bg-white text-ink"
        >
          <option value="all">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="scheduled">Scheduled</option>
          <option value="live">Live</option>
          <option value="closed">Closed</option>
        </select>

        <select
          value={batchFilter}
          onChange={(e) => setBatchFilter(e.target.value)}
          className="text-body-sm px-3 py-1.5 rounded-lg border border-border bg-white text-ink"
        >
          <option value="all">All Batches</option>
          <option value="free">Free Practice Tests</option>
          {batches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.title}
            </option>
          ))}
        </select>
      </div>

      {/* TESTS GRID */}
      {filteredTests.length === 0 ? (
        <div className="bg-white rounded-2xl border border-border p-12 text-center space-y-3">
          <Award className="w-10 h-10 text-ink-muted mx-auto" />
          <h3 className="text-body font-bold text-ink">No tests found</h3>
          <p className="text-body-sm text-ink-muted max-w-sm mx-auto">
            Get started by creating your first test or adjust the active filters above.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTests.map((test) => (
            <div
              key={test.id}
              className="bg-white rounded-2xl border border-border p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-primary/40 transition-all"
            >
              <div className="space-y-2.5">
                {/* Status chip & Batch */}
                <div className="flex items-center justify-between gap-2">
                  <Badge
                    variant={
                      test.status === "live"
                        ? "success"
                        : test.status === "scheduled"
                        ? "accent"
                        : test.status === "closed"
                        ? "neutral"
                        : "neutral"
                    }
                    className="capitalize font-bold text-[11px]"
                  >
                    {test.status}
                  </Badge>

                  <span className="text-[11px] font-semibold text-ink-muted truncate max-w-[150px]">
                    {test.batchName || "Free Practice"}
                  </span>
                </div>

                {/* Title */}
                <div>
                  <h3 className="font-bold text-body text-ink line-clamp-1">{test.title}</h3>
                  <div className="text-xs text-ink-muted flex items-center gap-1.5 mt-0.5">
                    <span>{test.subjectName}</span>
                    <span>·</span>
                    <span className="capitalize">{test.kind.replace(/_/g, " ")}</span>
                  </div>
                </div>

                {/* Info pills */}
                <div className="grid grid-cols-3 gap-2 py-2 border-y border-border/60 text-center">
                  <div>
                    <div className="text-[10px] uppercase font-bold text-ink-muted">Questions</div>
                    <div className="text-body-sm font-mono font-bold text-ink">
                      {test.questionCount ?? 0}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-bold text-ink-muted">Duration</div>
                    <div className="text-body-sm font-mono font-bold text-ink">
                      {test.durationMinutes}m
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-bold text-ink-muted">Total Marks</div>
                    <div className="text-body-sm font-mono font-bold text-primary">
                      {test.totalMarks}
                    </div>
                  </div>
                </div>

                {/* Schedule info if set */}
                {test.startsAt && (
                  <div className="text-[11px] text-ink-muted flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Starts: {new Date(test.startsAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/60">
                <Link
                  href={`/admin/tests/${test.id}/results`}
                  className="flex items-center gap-1 text-xs font-semibold text-ink-muted hover:text-ink px-2.5 py-1.5 rounded-lg hover:bg-surface-subtle transition-colors"
                >
                  <BarChart2 className="w-3.5 h-3.5" />
                  <span>Results</span>
                </Link>

                <div className="flex items-center gap-1.5">
                  <Link
                    href={`/admin/tests/${test.id}`}
                    className="p-1.5 rounded-lg text-ink-muted hover:text-ink hover:bg-surface-subtle transition-colors"
                    title="Edit Test"
                  >
                    <Edit className="w-4 h-4" />
                  </Link>

                  {test.status === "draft" && (
                    <button
                      type="button"
                      onClick={() => handlePublish(test.id, test.title)}
                      disabled={isPending}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-bold shadow-xs hover:bg-primary/90 transition-all"
                    >
                      <Send className="w-3 h-3" />
                      <span>Publish</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
