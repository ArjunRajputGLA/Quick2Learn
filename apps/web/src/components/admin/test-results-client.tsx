"use client";

import { useState } from "react";
import Link from "next/link";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { MathText } from "@/components/ui/math-text";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Download,
  Award,
  Users,
  TrendingUp,
  AlertTriangle,
  Search,
} from "lucide-react";

interface AttemptRow {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  score: number;
  correct: number;
  wrong: number;
  skipped: number;
  timeSpentSeconds: number;
  rank?: number | null;
  status: string;
  submittedAt: string;
}

interface QuestionStat {
  questionId: string;
  position: number;
  stem: string;
  type: string;
  chapterTitle: string;
  totalAnswers: number;
  correctCount: number;
  wrongCount: number;
  skippedCount: number;
  accuracyPercentage: number;
}

interface TestResultsClientProps {
  test: {
    id: string;
    title: string;
    batchName?: string | null;
    totalMarks: number;
    durationMinutes: number;
    status: string;
  };
  totalParticipants: number;
  stats: {
    highestScore: number;
    lowestScore: number;
    averageScore: number;
  };
  questionStats: QuestionStat[];
  attempts: AttemptRow[];
}

export function TestResultsClient({
  test,
  totalParticipants,
  stats,
  questionStats,
  attempts,
}: TestResultsClientProps) {
  const [activeTab, setActiveTab] = useState<"ranking" | "questions">("ranking");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredAttempts = attempts.filter((a) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return a.studentName.toLowerCase().includes(q) || a.studentEmail.toLowerCase().includes(q);
  });

  // Export results as CSV
  const handleExportCsv = () => {
    if (attempts.length === 0) {
      toast.error("No attempts to export yet.");
      return;
    }

    const rows = attempts.map((a) => ({
      Rank: a.rank ?? "N/A",
      "Student Name": a.studentName,
      "Student Email": a.studentEmail,
      "Score Obtained": a.score,
      "Total Marks": test.totalMarks,
      "Percentage (%)": test.totalMarks > 0 ? Number(((a.score / test.totalMarks) * 100).toFixed(1)) : 0,
      Correct: a.correct,
      Wrong: a.wrong,
      Skipped: a.skipped,
      "Time Spent (Minutes)": Math.round(a.timeSpentSeconds / 60),
      Status: a.status,
      "Submitted At": a.submittedAt ? new Date(a.submittedAt).toLocaleString("en-IN") : "",
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Rankings");
    const safeTitle = test.title.replace(/[^a-zA-Z0-9_-]/g, "_");
    XLSX.writeFile(workbook, `Test_Results_${safeTitle}.csv`, { bookType: "csv" });
    toast.success("CSV report downloaded successfully");
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-border shadow-xs">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/tests"
            className="p-2 rounded-xl border border-border hover:bg-surface-subtle transition-colors text-ink-muted hover:text-ink"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-ink tracking-tight">{test.title}</h1>
              <Badge variant="primary" className="capitalize text-xs font-bold">
                {test.batchName || "Free Practice"}
              </Badge>
            </div>
            <p className="text-xs text-ink-muted mt-0.5">
              Comprehensive score distribution, question accuracy analytics, and ranked leaderboard.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportCsv}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-body-sm font-bold shadow-xs hover:bg-primary/90 transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* KPI METRIC CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-border shadow-xs space-y-1">
          <div className="flex items-center justify-between text-ink-muted text-xs font-bold uppercase tracking-wider">
            <span>Participants</span>
            <Users className="w-4 h-4 text-primary" />
          </div>
          <div className="text-2xl font-black text-ink">{totalParticipants}</div>
          <span className="text-[11px] text-ink-muted">Students completed</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-border shadow-xs space-y-1">
          <div className="flex items-center justify-between text-ink-muted text-xs font-bold uppercase tracking-wider">
            <span>Average Score</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-ink">
            {stats.averageScore} <span className="text-xs text-ink-muted">/ {test.totalMarks}</span>
          </div>
          <span className="text-[11px] text-emerald-600 font-semibold">
            {test.totalMarks > 0 ? ((stats.averageScore / test.totalMarks) * 100).toFixed(1) : 0}% Turnout
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-border shadow-xs space-y-1">
          <div className="flex items-center justify-between text-ink-muted text-xs font-bold uppercase tracking-wider">
            <span>Highest Score</span>
            <Award className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-ink">
            {stats.highestScore} <span className="text-xs text-ink-muted">/ {test.totalMarks}</span>
          </div>
          <span className="text-[11px] text-amber-600 font-semibold">Top Performance</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-border shadow-xs space-y-1">
          <div className="flex items-center justify-between text-ink-muted text-xs font-bold uppercase tracking-wider">
            <span>Lowest Score</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-black text-ink">
            {stats.lowestScore} <span className="text-xs text-ink-muted">/ {test.totalMarks}</span>
          </div>
          <span className="text-[11px] text-ink-muted">Range Spread</span>
        </div>
      </div>

      {/* TABS SELECTOR */}
      <div className="flex items-center gap-2 border-b border-border pb-2">
        <button
          type="button"
          onClick={() => setActiveTab("ranking")}
          className={`px-4 py-2 rounded-xl text-body-sm font-bold transition-all ${
            activeTab === "ranking"
              ? "bg-primary text-white shadow-xs"
              : "bg-white text-ink-muted hover:text-ink border border-border"
          }`}
        >
          Leaderboard & Attempts ({attempts.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("questions")}
          className={`px-4 py-2 rounded-xl text-body-sm font-bold transition-all ${
            activeTab === "questions"
              ? "bg-primary text-white shadow-xs"
              : "bg-white text-ink-muted hover:text-ink border border-border"
          }`}
        >
          Question-Wise Accuracy ({questionStats.length})
        </button>
      </div>

      {/* TAB 1: RANKINGS LEADERBOARD */}
      {activeTab === "ranking" && (
        <div className="bg-white rounded-2xl border border-border shadow-xs overflow-hidden space-y-4 p-5">
          <div className="flex items-center justify-between gap-4">
            <h3 className="font-bold text-body text-ink">Student Results</h3>
            <div className="relative max-w-xs w-full">
              <Search className="w-3.5 h-3.5 text-ink-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search student..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-body-sm pl-8 pr-3 py-1.5 rounded-lg border border-border text-ink bg-white"
              />
            </div>
          </div>

          {filteredAttempts.length === 0 ? (
            <div className="p-8 text-center text-ink-muted text-body-sm">
              No student attempts found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-body-sm">
                <thead className="bg-surface-subtle text-[11px] font-bold text-ink-muted uppercase tracking-wider border-b border-border">
                  <tr>
                    <th className="p-3">Rank</th>
                    <th className="p-3">Student</th>
                    <th className="p-3 text-center">Score</th>
                    <th className="p-3 text-center">% Score</th>
                    <th className="p-3 text-center">Correct / Wrong / Skipped</th>
                    <th className="p-3 text-center">Time</th>
                    <th className="p-3 text-right">Submitted</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredAttempts.map((a) => (
                    <tr key={a.id} className="hover:bg-surface-subtle/50 transition-colors">
                      <td className="p-3">
                        <span
                          className={`w-7 h-7 rounded-full inline-flex items-center justify-center font-mono font-bold text-xs ${
                            a.rank === 1
                              ? "bg-amber-400 text-neutral-900"
                              : a.rank === 2
                              ? "bg-slate-300 text-neutral-900"
                              : a.rank === 3
                              ? "bg-amber-700 text-white"
                              : "bg-surface-subtle text-ink-muted"
                          }`}
                        >
                          {a.rank || "-"}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="font-bold text-ink">{a.studentName}</div>
                        <div className="text-[11px] text-ink-muted">{a.studentEmail}</div>
                      </td>
                      <td className="p-3 text-center font-mono font-black text-body text-primary">
                        {a.score}
                      </td>
                      <td className="p-3 text-center font-mono font-bold text-xs">
                        {test.totalMarks > 0 ? ((a.score / test.totalMarks) * 100).toFixed(1) : 0}%
                      </td>
                      <td className="p-3 text-center text-xs">
                        <span className="text-emerald-700 font-semibold">{a.correct}</span>
                        <span className="text-ink-muted"> / </span>
                        <span className="text-rose-700 font-semibold">{a.wrong}</span>
                        <span className="text-ink-muted"> / </span>
                        <span className="text-ink-muted font-semibold">{a.skipped}</span>
                      </td>
                      <td className="p-3 text-center text-xs font-mono text-ink-muted">
                        {Math.round(a.timeSpentSeconds / 60)}m
                      </td>
                      <td className="p-3 text-right text-xs text-ink-muted">
                        {a.submittedAt ? new Date(a.submittedAt).toLocaleDateString("en-IN") : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: QUESTION-WISE ACCURACY */}
      {activeTab === "questions" && (
        <div className="bg-white rounded-2xl border border-border shadow-xs p-5 space-y-4">
          <div>
            <h3 className="font-bold text-body text-ink">Question Accuracy Diagnostics</h3>
            <p className="text-caption text-ink-muted">
              Identifies classroom weak areas and questions where students struggled the most.
            </p>
          </div>

          <div className="space-y-3">
            {questionStats.map((q) => {
              const isLowAccuracy = q.totalAnswers > 0 && q.accuracyPercentage < 50;

              return (
                <div
                  key={q.questionId}
                  className={`p-4 rounded-xl border transition-all ${
                    isLowAccuracy
                      ? "border-rose-300 bg-rose-50/40"
                      : "border-border bg-surface-subtle/40"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/50 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-white border border-border flex items-center justify-center font-mono font-bold text-xs">
                        {q.position}
                      </span>
                      <span className="text-xs font-bold text-ink">{q.chapterTitle}</span>
                      <span className="text-[11px] text-ink-muted capitalize">
                        ({q.type.replace(/_/g, " ")})
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-ink-muted">
                        {q.totalAnswers} response{q.totalAnswers === 1 ? "" : "s"}
                      </span>
                      <div className="flex items-center gap-1.5 font-bold">
                        <span>Accuracy:</span>
                        <span
                          className={`font-mono px-2 py-0.5 rounded ${
                            q.accuracyPercentage >= 70
                              ? "bg-emerald-100 text-emerald-800"
                              : q.accuracyPercentage >= 50
                              ? "bg-amber-100 text-amber-800"
                              : "bg-rose-100 text-rose-800"
                          }`}
                        >
                          {q.accuracyPercentage}%
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 text-body-sm text-ink">
                    <MathText content={q.stem} className="block line-clamp-2" />
                  </div>

                  {isLowAccuracy && (
                    <div className="mt-2.5 flex items-center gap-1.5 text-xs text-rose-700 font-semibold">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>
                        Weak area: {q.wrongCount} of {q.totalAnswers} students got this wrong. Recommended for class revision.
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
