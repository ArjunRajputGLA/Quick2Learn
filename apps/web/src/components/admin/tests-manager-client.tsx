"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
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
    <div className="space-y-3 w-full pb-8">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Tests &amp; Quizzes
            </h1>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200/80 text-slate-700 font-semibold">
              {tests.length} Total
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Build chapter tests, unit tests, and full mock exams with timer controls, automatic ranking, and instant push notifications.
          </p>
        </div>

        <Link
          href="/admin/tests/new"
          className="flex items-center gap-1.5 h-7.5 px-3 rounded-lg bg-blue-600 text-white text-xs font-bold shadow-2xs hover:bg-blue-700 transition-all self-start sm:self-auto shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Create New Test</span>
        </Link>
      </div>

      {/* FILTER BAR */}
      <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-2xs flex flex-wrap items-center gap-2">
        <div className="flex-1 min-w-[180px] relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search tests by title or subject..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-7.5 text-xs pl-8 pr-2.5 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white text-slate-900 placeholder:text-slate-400"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-7.5 text-xs px-2 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white text-slate-800 font-medium"
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
          className="h-7.5 text-xs px-2 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white text-slate-800 font-medium"
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
        <div className="bg-white rounded-xl border border-slate-200/80 p-8 text-center space-y-2">
          <Award className="w-8 h-8 text-slate-300 mx-auto" />
          <h3 className="text-xs font-bold text-slate-900">No tests found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Get started by creating your first test or adjust the active filters above.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredTests.map((test) => (
            <div
              key={test.id}
              className="bg-white rounded-xl border border-slate-200/80 p-3 shadow-2xs flex flex-col justify-between space-y-2.5 hover:border-blue-200 transition-all"
            >
              <div className="space-y-1.5">
                {/* Status chip & Batch */}
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`capitalize font-bold text-[10px] px-2 py-0.2 rounded-full ${
                      test.status === "live"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : test.status === "scheduled"
                        ? "bg-amber-50 text-amber-700 border border-amber-200"
                        : "bg-slate-100 text-slate-600 border border-slate-200"
                    }`}
                  >
                    {test.status}
                  </span>

                  <span className="text-[10px] font-semibold text-slate-500 truncate max-w-[150px]">
                    {test.batchName || "Free Practice"}
                  </span>
                </div>

                {/* Title */}
                <div>
                  <h3 className="font-bold text-xs sm:text-sm text-slate-900 line-clamp-1">{test.title}</h3>
                  <div className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                    <span>{test.subjectName}</span>
                    <span>·</span>
                    <span className="capitalize">{test.kind.replace(/_/g, " ")}</span>
                  </div>
                </div>

                {/* Info pills */}
                <div className="grid grid-cols-3 gap-1.5 py-1.5 border-y border-slate-100 text-center">
                  <div>
                    <div className="text-[9px] uppercase font-bold text-slate-400">Questions</div>
                    <div className="text-xs font-mono font-bold text-slate-900">
                      {test.questionCount ?? 0}
                    </div>
                  </div>
                  <div>
                    <div className="text-[9px] uppercase font-bold text-slate-400">Duration</div>
                    <div className="text-xs font-mono font-bold text-slate-900">
                      {test.durationMinutes}m
                    </div>
                  </div>
                  <div>
                    <div className="text-[9px] uppercase font-bold text-slate-400">Total Marks</div>
                    <div className="text-xs font-mono font-bold text-blue-600">
                      {test.totalMarks}
                    </div>
                  </div>
                </div>

                {/* Schedule info if set */}
                {test.startsAt && (
                  <div className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    <span>Starts: {new Date(test.startsAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
                <Link
                  href={`/admin/tests/${test.id}/results`}
                  className="flex items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-blue-600 px-1.5 py-0.5 rounded hover:bg-slate-50 transition-colors"
                >
                  <BarChart2 className="w-3 h-3" />
                  <span>Results</span>
                </Link>

                <div className="flex items-center gap-1">
                  <Link
                    href={`/admin/tests/${test.id}`}
                    className="p-1 rounded-md text-slate-400 hover:text-slate-800 hover:bg-slate-50 transition-colors"
                    title="Edit Test"
                  >
                    <Edit className="w-3 h-3" />
                  </Link>

                  {test.status === "draft" && (
                    <button
                      type="button"
                      onClick={() => handlePublish(test.id, test.title)}
                      disabled={isPending}
                      className="flex items-center gap-1 h-6.5 px-2 rounded-md bg-blue-600 text-white text-[10px] font-bold shadow-2xs hover:bg-blue-700 transition-all"
                    >
                      <Send className="w-2.5 h-2.5" />
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
