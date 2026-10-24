"use client";

import { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { MathText } from "@/components/ui/math-text";
import { Badge } from "@/components/ui/badge";
import {
  createTestAdminAction,
  updateTestAdminAction,
  publishTestAdminAction,
  autoPickQuestionsAdminAction,
} from "@/server/admin-actions";
import {
  ArrowLeft,
  Save,
  Send,
  Eye,
  Plus,
  Wand2,
  Trash2,
  Clock,
  ShieldCheck,
  X,
  HelpCircle,
  Loader2,
  Check,
  Search,
} from "lucide-react";

interface SubjectOption {
  id: string;
  name: string;
}

interface ChapterOption {
  id: string;
  title: string;
  number: number;
  classLevel: number;
  subjectId: string;
}

interface BatchOption {
  id: string;
  title: string;
}

interface QuestionBankItem {
  id: string;
  subjectId: string;
  chapterId?: string;
  chapterTitle?: string;
  classLevel: number;
  type: string;
  stem: string;
  options?: any;
  difficulty: "easy" | "medium" | "hard";
  marks: number;
  negativeMarks: number;
}

interface TestQuestionEntry {
  questionId: string;
  position: number;
  marksOverride?: number | null;
  stem: string;
  type: string;
  difficulty: string;
  marks: number;
  negativeMarks: number;
  options?: any;
}

interface TestBuilderClientProps {
  initialTest?: {
    id: string;
    title: string;
    batchId?: string | null;
    subjectId: string;
    chapterIds: string[];
    kind: string;
    durationMinutes: number;
    startsAt?: string | null;
    endsAt?: string | null;
    attemptsAllowed: number;
    shuffleQuestions: boolean;
    shuffleOptions: boolean;
    showSolutions: string;
    status: string;
    questions?: TestQuestionEntry[];
  };
  subjects: SubjectOption[];
  chapters: ChapterOption[];
  batches: BatchOption[];
  questionBank: QuestionBankItem[];
  initialBatchId?: string;
}

export function TestBuilderClient({
  initialTest,
  subjects,
  chapters,
  batches,
  questionBank,
  initialBatchId,
}: TestBuilderClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Test Details Form State
  const [title, setTitle] = useState(initialTest?.title || "");
  const [batchId, setBatchId] = useState(initialTest?.batchId || initialBatchId || "");
  const [subjectId, setSubjectId] = useState(initialTest?.subjectId || subjects[0]?.id || "");
  const [selectedChapterIds, setSelectedChapterIds] = useState<string[]>(initialTest?.chapterIds || []);
  const [kind, setKind] = useState<string>(initialTest?.kind || "chapter_test");
  const [durationMinutes, setDurationMinutes] = useState<number>(initialTest?.durationMinutes || 30);
  const [startsAt, setStartsAt] = useState<string>(
    initialTest?.startsAt ? new Date(initialTest.startsAt).toISOString().slice(0, 16) : ""
  );
  const [endsAt, setEndsAt] = useState<string>(
    initialTest?.endsAt ? new Date(initialTest.endsAt).toISOString().slice(0, 16) : ""
  );
  const [attemptsAllowed, setAttemptsAllowed] = useState<number>(initialTest?.attemptsAllowed || 1);
  const [shuffleQuestions, setShuffleQuestions] = useState<boolean>(initialTest?.shuffleQuestions || false);
  const [shuffleOptions, setShuffleOptions] = useState<boolean>(initialTest?.shuffleOptions || false);
  const [showSolutions, setShowSolutions] = useState<string>(initialTest?.showSolutions || "after_submit");

  // Selected Questions List
  const [chosenQuestions, setChosenQuestions] = useState<TestQuestionEntry[]>(
    initialTest?.questions || []
  );

  // Manual Picker Modal State
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerFilterDiff, setPickerFilterDiff] = useState<string>("all");
  const [pickerFilterChapter, setPickerFilterChapter] = useState<string>("all");
  const [pickerSearch, setPickerSearch] = useState<string>("");

  // Auto-pick Modal State
  const [autoPickOpen, setAutoPickOpen] = useState(false);
  const [autoEasy, setAutoEasy] = useState(5);
  const [autoMedium, setAutoMedium] = useState(5);
  const [autoHard, setAutoHard] = useState(2);

  // Preview As Student Modal State
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewActiveIndex, setPreviewActiveIndex] = useState(0);

  // Filtered chapters for selected subject
  const availableChapters = useMemo(() => {
    return chapters.filter((c) => c.subjectId === subjectId);
  }, [chapters, subjectId]);

  // Compute live total marks
  const totalMarks = useMemo(() => {
    return chosenQuestions.reduce((sum, q) => sum + (q.marksOverride ?? q.marks), 0);
  }, [chosenQuestions]);

  // Bank questions for manual picker (matching subject)
  const pickerQuestions = useMemo(() => {
    return questionBank.filter((q) => {
      if (q.subjectId !== subjectId) return false;
      if (pickerFilterDiff !== "all" && q.difficulty !== pickerFilterDiff) return false;
      if (pickerFilterChapter !== "all" && q.chapterId !== pickerFilterChapter) return false;
      if (pickerSearch.trim()) {
        const query = pickerSearch.toLowerCase();
        if (!q.stem.toLowerCase().includes(query)) return false;
      }
      return true;
    });
  }, [questionBank, subjectId, pickerFilterDiff, pickerFilterChapter, pickerSearch]);

  // Toggle question in manual picker
  const handleToggleQuestion = (q: QuestionBankItem) => {
    if (chosenQuestions.some((item) => item.questionId === q.id)) {
      setChosenQuestions((prev) => prev.filter((item) => item.questionId !== q.id));
    } else {
      setChosenQuestions((prev) => [
        ...prev,
        {
          questionId: q.id,
          position: prev.length + 1,
          marksOverride: null,
          stem: q.stem,
          type: q.type,
          difficulty: q.difficulty,
          marks: q.marks,
          negativeMarks: q.negativeMarks,
          options: q.options,
        },
      ]);
    }
  };

  // Auto-pick handler
  const handleExecuteAutoPick = async () => {
    try {
      const res = await autoPickQuestionsAdminAction({
        subjectId,
        classLevel: 10,
        chapterIds: selectedChapterIds.length > 0 ? selectedChapterIds : undefined,
        counts: {
          easy: autoEasy,
          medium: autoMedium,
          hard: autoHard,
        },
      });

      if (res.success && res.data) {
        const existingIds = new Set(chosenQuestions.map((q) => q.questionId));
        const newEntries: TestQuestionEntry[] = [];
        const items = (res.data as any[]) || [];

        for (const item of items) {
          if (!existingIds.has(item.questionId)) {
            newEntries.push({
              questionId: item.questionId,
              position: chosenQuestions.length + newEntries.length + 1,
              marksOverride: null,
              stem: item.stem,
              type: item.type,
              difficulty: item.difficulty,
              marks: item.marks,
              negativeMarks: 0,
            });
          }
        }

        setChosenQuestions((prev) => [...prev, ...newEntries]);
        toast.success(`Added ${newEntries.length} questions from question bank!`);
        setAutoPickOpen(false);
      } else {
        toast.error(res.error || "Failed to auto-pick questions");
      }
    } catch (err: any) {
      toast.error(err.message || "An error occurred");
    }
  };

  // Save Test (Draft)
  const handleSaveTest = (shouldPublish = false) => {
    if (!title.trim()) {
      toast.error("Please enter a test title");
      return;
    }
    if (chosenQuestions.length === 0) {
      toast.error("Please add at least one question to the test");
      return;
    }

    const payload = {
      title: title.trim(),
      batchId: batchId || null,
      subjectId,
      chapterIds: selectedChapterIds,
      kind: kind as any,
      durationMinutes,
      startsAt: startsAt ? new Date(startsAt).toISOString() : null,
      endsAt: endsAt ? new Date(endsAt).toISOString() : null,
      attemptsAllowed,
      shuffleQuestions,
      shuffleOptions,
      showSolutions: showSolutions as any,
      status: shouldPublish ? "live" : (initialTest?.status as any) || "draft",
      questionIds: chosenQuestions.map((q, idx) => ({
        questionId: q.questionId,
        position: idx + 1,
        marksOverride: q.marksOverride ?? null,
      })),
    };

    startTransition(async () => {
      try {
        if (initialTest?.id) {
          const res = await updateTestAdminAction(initialTest.id, payload);
          if (res.success) {
            if (shouldPublish) {
              await publishTestAdminAction(initialTest.id);
              toast.success("Test published and push notification sent!");
            } else {
              toast.success("Test saved successfully");
            }
            router.push("/admin/tests");
          } else {
            toast.error(res.error || "Failed to update test");
          }
        } else {
          const res = await createTestAdminAction(payload);
          if (res.success && res.data) {
            const created = res.data as any;
            if (shouldPublish) {
              await publishTestAdminAction(created.id);
              toast.success("Test created and published to batch!");
            } else {
              toast.success("Test created as draft");
            }
            router.push("/admin/tests");
          } else {
            toast.error(res.error || "Failed to create test");
          }
        }
      } catch (err: any) {
        toast.error(err.message || "An error occurred");
      }
    });
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
            <h1 className="text-xl font-black text-ink tracking-tight">
              {initialTest ? `Edit Test: ${initialTest.title}` : "Build New Test"}
            </h1>
            <p className="text-xs text-ink-muted">
              Configure timing, question set, student solution rules, and publish to enrolled students.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            type="button"
            onClick={() => setPreviewOpen(true)}
            disabled={chosenQuestions.length === 0}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-border bg-white text-ink text-body-sm font-semibold hover:bg-surface-subtle transition-all disabled:opacity-50"
          >
            <Eye className="w-4 h-4 text-primary" />
            <span>Preview as Student</span>
          </button>

          <button
            type="button"
            onClick={() => handleSaveTest(false)}
            disabled={isPending}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-border bg-white text-ink text-body-sm font-semibold hover:bg-surface-subtle transition-all"
          >
            <Save className="w-4 h-4" />
            <span>Save Draft</span>
          </button>

          <button
            type="button"
            onClick={() => handleSaveTest(true)}
            disabled={isPending || chosenQuestions.length === 0}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-white text-body-sm font-bold shadow-xs hover:bg-primary/90 transition-all disabled:opacity-50"
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            <span>Publish & Push</span>
          </button>
        </div>
      </div>

      {/* TWO COLUMN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN: SETTINGS */}
        <div className="lg:col-span-1 space-y-5">
          {/* Basic Info Card */}
          <div className="bg-white p-5 rounded-2xl border border-border shadow-xs space-y-4">
            <h2 className="text-body font-bold text-ink">Test Configuration</h2>

            <div>
              <label className="block text-caption font-bold text-ink mb-1">Test Title</label>
              <input
                type="text"
                placeholder="e.g. Chapter 6: Quadratic Equations Mastery"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full text-body-sm px-3 py-2 rounded-xl border border-border text-ink"
              />
            </div>

            <div>
              <label className="block text-caption font-bold text-ink mb-1">Batch Assignment</label>
              <select
                value={batchId}
                onChange={(e) => setBatchId(e.target.value)}
                className="w-full text-body-sm px-3 py-2 rounded-xl border border-border bg-white text-ink"
              >
                <option value="">Free Practice Test (All Students)</option>
                {batches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-caption font-bold text-ink mb-1">Subject</label>
              <select
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                className="w-full text-body-sm px-3 py-2 rounded-xl border border-border bg-white text-ink"
              >
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-caption font-bold text-ink mb-1">
                Chapters Covered (Optional)
              </label>
              <div className="max-h-36 overflow-y-auto p-2 rounded-xl border border-border bg-surface-subtle/40 space-y-1">
                {chapters
                  .filter((c) => !subjectId || c.subjectId === subjectId)
                  .map((c) => {
                    const isChecked = selectedChapterIds.includes(c.id);
                    return (
                      <label
                        key={c.id}
                        className="flex items-center gap-2 text-xs text-ink cursor-pointer hover:bg-white p-1 rounded"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedChapterIds([...selectedChapterIds, c.id]);
                            } else {
                              setSelectedChapterIds(selectedChapterIds.filter((id) => id !== c.id));
                            }
                          }}
                          className="rounded text-primary focus:ring-primary w-3.5 h-3.5"
                        />
                        <span className="truncate">Ch {c.number}: {c.title}</span>
                      </label>
                    );
                  })}
              </div>
            </div>

            <div>
              <label className="block text-caption font-bold text-ink mb-1">Kind</label>
              <select
                value={kind}
                onChange={(e) => setKind(e.target.value)}
                className="w-full text-body-sm px-3 py-2 rounded-xl border border-border bg-white text-ink"
              >
                <option value="chapter_test">Chapter Test</option>
                <option value="unit_test">Unit Test</option>
                <option value="mock">Full Mock Exam</option>
                <option value="practice">Daily Practice Test</option>
              </select>
            </div>

            <div>
              <label className="block text-caption font-bold text-ink mb-1">Duration (Minutes)</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="5"
                  max="360"
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(parseInt(e.target.value, 10) || 30)}
                  className="w-full text-body-sm px-3 py-2 rounded-xl border border-border text-ink"
                />
                <span className="text-xs text-ink-muted">mins</span>
              </div>
            </div>

            <div>
              <label className="block text-caption font-bold text-ink mb-1">Attempts Allowed</label>
              <input
                type="number"
                min="1"
                max="10"
                value={attemptsAllowed}
                onChange={(e) => setAttemptsAllowed(parseInt(e.target.value, 10) || 1)}
                className="w-full text-body-sm px-3 py-2 rounded-xl border border-border text-ink"
              />
            </div>
          </div>

          {/* Timing & Window Card */}
          <div className="bg-white p-5 rounded-2xl border border-border shadow-xs space-y-4">
            <h2 className="text-body font-bold text-ink flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-ink-muted" />
              <span>Availability Window</span>
            </h2>

            <div>
              <label className="block text-caption font-bold text-ink mb-1">Starts At (Optional)</label>
              <input
                type="datetime-local"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
                className="w-full text-body-sm px-3 py-2 rounded-xl border border-border text-ink"
              />
            </div>

            <div>
              <label className="block text-caption font-bold text-ink mb-1">Ends At (Optional)</label>
              <input
                type="datetime-local"
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
                className="w-full text-body-sm px-3 py-2 rounded-xl border border-border text-ink"
              />
            </div>
          </div>

          {/* Rules Card */}
          <div className="bg-white p-5 rounded-2xl border border-border shadow-xs space-y-4">
            <h2 className="text-body font-bold text-ink flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-ink-muted" />
              <span>Anti-Cheating & Solutions</span>
            </h2>

            <div className="space-y-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={shuffleQuestions}
                  onChange={(e) => setShuffleQuestions(e.target.checked)}
                  className="w-4 h-4 text-primary rounded"
                />
                <span className="text-body-sm text-ink font-medium">Shuffle questions for each student</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={shuffleOptions}
                  onChange={(e) => setShuffleOptions(e.target.checked)}
                  className="w-4 h-4 text-primary rounded"
                />
                <span className="text-body-sm text-ink font-medium">Shuffle option choices (A/B/C/D)</span>
              </label>
            </div>

            <div>
              <label className="block text-caption font-bold text-ink mb-1">Show Solutions & Explanations</label>
              <select
                value={showSolutions}
                onChange={(e) => setShowSolutions(e.target.value)}
                className="w-full text-body-sm px-3 py-2 rounded-xl border border-border bg-white text-ink"
              >
                <option value="after_submit">Immediately after student submits</option>
                <option value="after_end">Only after test window ends (scheduled date)</option>
                <option value="never">Never publish solutions</option>
              </select>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: QUESTIONS SELECTION */}
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-white p-5 rounded-2xl border border-border shadow-xs space-y-4">
            {/* Questions header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
              <div>
                <h2 className="text-body font-bold text-ink flex items-center gap-2">
                  <span>Questions in Test</span>
                  <Badge variant="primary" className="font-bold">
                    {chosenQuestions.length} Selected
                  </Badge>
                  <span className="text-xs font-mono font-bold text-ink-muted">
                    Total Marks: {totalMarks}
                  </span>
                </h2>
                <p className="text-caption text-ink-muted mt-0.5">
                  Pick questions manually from the bank or use the auto-picker to compose by difficulty.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setAutoPickOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-white text-body-sm font-semibold text-ink hover:bg-surface-subtle transition-all"
                >
                  <Wand2 className="w-3.5 h-3.5 text-primary" />
                  <span>Auto-Pick</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPickerOpen(true)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-primary text-white text-body-sm font-bold shadow-xs hover:bg-primary/90 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Pick from Bank</span>
                </button>
              </div>
            </div>

            {/* Questions List */}
            {chosenQuestions.length === 0 ? (
              <div className="py-12 text-center space-y-3">
                <HelpCircle className="w-8 h-8 text-ink-muted mx-auto" />
                <div className="text-body-sm font-bold text-ink">No questions added yet</div>
                <p className="text-caption text-ink-muted max-w-sm mx-auto">
                  Click &ldquo;Pick from Bank&rdquo; to browse existing questions or &ldquo;Auto-Pick&rdquo; to select balanced questions automatically.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {chosenQuestions.map((q, idx) => (
                  <div
                    key={q.questionId}
                    className="p-4 rounded-xl border border-border bg-surface-subtle/50 space-y-2 hover:border-primary/30 transition-all"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-white border border-border flex items-center justify-center font-mono font-bold text-xs text-ink-muted">
                          {idx + 1}
                        </span>
                        <Badge
                          variant={
                            q.difficulty === "easy"
                              ? "success"
                              : q.difficulty === "medium"
                              ? "accent"
                              : "critical"
                          }
                          className="capitalize text-[10px]"
                        >
                          {q.difficulty}
                        </Badge>
                        <span className="text-[11px] text-ink-muted capitalize">
                          {q.type.replace(/_/g, " ")}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <label className="text-[11px] text-ink-muted">Marks:</label>
                          <input
                            type="number"
                            step="0.5"
                            min="0"
                            value={q.marksOverride ?? q.marks}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value);
                              setChosenQuestions((prev) =>
                                prev.map((item, i) =>
                                  i === idx ? { ...item, marksOverride: isNaN(val) ? q.marks : val } : item
                                )
                              );
                            }}
                            className="w-14 text-center text-xs py-1 px-1.5 rounded-lg border border-border bg-white font-mono font-bold"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            setChosenQuestions((prev) => prev.filter((_, i) => i !== idx))
                          }
                          className="p-1 rounded-lg text-ink-muted hover:text-critical hover:bg-critical/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="text-body-sm text-ink pl-8">
                      <MathText content={q.stem} className="line-clamp-2" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MANUAL PICKER MODAL */}
      {pickerOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-border shadow-xl max-w-4xl w-full max-h-[85vh] flex flex-col my-8">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="text-body-lg font-bold text-ink">Pick Questions from Bank</h2>
              <button
                type="button"
                onClick={() => setPickerOpen(false)}
                className="p-1 rounded-lg text-ink-muted hover:text-ink"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Picker Filters */}
            <div className="p-4 border-b border-border bg-surface-subtle flex flex-wrap items-center gap-3">
              <div className="flex-1 min-w-[200px] relative">
                <Search className="w-3.5 h-3.5 text-ink-muted absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search questions..."
                  value={pickerSearch}
                  onChange={(e) => setPickerSearch(e.target.value)}
                  className="w-full text-body-sm pl-8 pr-3 py-1.5 rounded-lg border border-border bg-white text-ink"
                />
              </div>

              <select
                value={pickerFilterDiff}
                onChange={(e) => setPickerFilterDiff(e.target.value)}
                className="text-body-sm px-3 py-1.5 rounded-lg border border-border bg-white text-ink"
              >
                <option value="all">All Difficulties</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>

              <select
                value={pickerFilterChapter}
                onChange={(e) => setPickerFilterChapter(e.target.value)}
                className="text-body-sm px-3 py-1.5 rounded-lg border border-border bg-white text-ink"
              >
                <option value="all">All Chapters</option>
                {availableChapters.map((c) => (
                  <option key={c.id} value={c.id}>
                    Ch {c.number}: {c.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Questions checklist */}
            <div className="p-4 overflow-y-auto flex-1 space-y-2.5">
              {pickerQuestions.map((q) => {
                const isSelected = chosenQuestions.some((item) => item.questionId === q.id);

                return (
                  <div
                    key={q.id}
                    onClick={() => handleToggleQuestion(q)}
                    className={`p-3.5 rounded-xl border text-body-sm flex items-start gap-3 cursor-pointer transition-all ${
                      isSelected
                        ? "border-primary bg-primary/5 text-ink"
                        : "border-border hover:bg-surface-subtle text-ink"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 ${
                        isSelected
                          ? "bg-primary border-primary text-white"
                          : "border-border bg-white"
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5" />}
                    </div>

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            q.difficulty === "easy"
                              ? "success"
                              : q.difficulty === "medium"
                              ? "accent"
                              : "critical"
                          }
                          className="capitalize text-[10px]"
                        >
                          {q.difficulty}
                        </Badge>
                        <span className="text-xs text-ink-muted">+{q.marks} marks</span>
                        {q.chapterTitle && (
                          <span className="text-xs text-ink-muted truncate">· {q.chapterTitle}</span>
                        )}
                      </div>
                      <MathText content={q.stem} className="line-clamp-2 text-body-sm" />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-4 border-t border-border flex items-center justify-between">
              <span className="text-xs text-ink-muted">
                {chosenQuestions.length} question(s) chosen in test
              </span>
              <button
                type="button"
                onClick={() => setPickerOpen(false)}
                className="px-5 py-2 rounded-xl bg-primary text-white text-body-sm font-bold shadow-xs hover:bg-primary/90"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AUTO-PICK MODAL */}
      {autoPickOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-border shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-body font-bold text-ink flex items-center gap-2">
                <Wand2 className="w-4 h-4 text-primary" />
                <span>Auto-Pick Questions</span>
              </h3>
              <button onClick={() => setAutoPickOpen(false)} className="p-1 text-ink-muted">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-caption text-ink-muted">
              Specify the number of questions to randomly pick from the question bank for this subject:
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-caption font-bold text-ink mb-1">Easy Questions</label>
                <input
                  type="number"
                  min="0"
                  value={autoEasy}
                  onChange={(e) => setAutoEasy(parseInt(e.target.value, 10) || 0)}
                  className="w-full text-body-sm px-3 py-2 rounded-xl border border-border text-ink"
                />
              </div>

              <div>
                <label className="block text-caption font-bold text-ink mb-1">Medium Questions</label>
                <input
                  type="number"
                  min="0"
                  value={autoMedium}
                  onChange={(e) => setAutoMedium(parseInt(e.target.value, 10) || 0)}
                  className="w-full text-body-sm px-3 py-2 rounded-xl border border-border text-ink"
                />
              </div>

              <div>
                <label className="block text-caption font-bold text-ink mb-1">Hard Questions</label>
                <input
                  type="number"
                  min="0"
                  value={autoHard}
                  onChange={(e) => setAutoHard(parseInt(e.target.value, 10) || 0)}
                  className="w-full text-body-sm px-3 py-2 rounded-xl border border-border text-ink"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setAutoPickOpen(false)}
                className="px-4 py-2 rounded-xl border border-border text-body-sm font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteAutoPick}
                className="px-5 py-2 rounded-xl bg-primary text-white text-body-sm font-bold shadow-xs hover:bg-primary/90"
              >
                Auto-Pick {autoEasy + autoMedium + autoHard} Questions
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PREVIEW AS STUDENT MODAL */}
      {previewOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-border shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden">
            {/* Student Exam Header */}
            <div className="bg-neutral-900 text-white p-4 sm:p-5 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-400">
                  Student Examination Preview
                </span>
                <h3 className="font-bold text-body sm:text-body-lg text-white line-clamp-1">
                  {title || "Untitled Test"}
                </h3>
              </div>

              <div className="flex items-center gap-4">
                <div className="bg-neutral-800 px-3 py-1.5 rounded-xl border border-neutral-700 flex items-center gap-2 font-mono font-bold text-sm text-amber-400">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span>{durationMinutes}:00</span>
                </div>

                <button
                  onClick={() => setPreviewOpen(false)}
                  className="p-1 rounded-lg text-neutral-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Question Palette Bar */}
            <div className="bg-surface-subtle border-b border-border p-3 overflow-x-auto flex items-center gap-2">
              <span className="text-[11px] font-bold text-ink-muted uppercase mr-1 shrink-0">
                Palette:
              </span>
              {chosenQuestions.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setPreviewActiveIndex(i)}
                  className={`w-8 h-8 rounded-xl font-mono text-xs font-bold transition-all shrink-0 ${
                    previewActiveIndex === i
                      ? "bg-primary text-white shadow-xs"
                      : "bg-white border border-border text-ink hover:bg-surface"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>

            {/* Question Active Screen */}
            {chosenQuestions[previewActiveIndex] && (
              <div className="p-6 overflow-y-auto flex-1 space-y-6">
                <div className="flex items-center justify-between text-caption font-bold text-ink-muted border-b border-border pb-3">
                  <span>
                    Question {previewActiveIndex + 1} of {chosenQuestions.length}
                  </span>
                  <span className="font-mono text-ink">
                    Marks: +{chosenQuestions[previewActiveIndex].marksOverride ?? chosenQuestions[previewActiveIndex].marks} / -{chosenQuestions[previewActiveIndex].negativeMarks}
                  </span>
                </div>

                {/* Question Stem with KaTeX */}
                <div className="text-body text-ink font-medium leading-relaxed">
                  <MathText content={chosenQuestions[previewActiveIndex].stem} className="block" />
                </div>

                {/* Options representation */}
                {chosenQuestions[previewActiveIndex].options &&
                chosenQuestions[previewActiveIndex].options.length > 0 ? (
                  <div className="space-y-3 pt-2">
                    {chosenQuestions[previewActiveIndex].options.map((opt: any) => (
                      <label
                        key={opt.id}
                        className="flex items-start gap-3 p-3.5 rounded-2xl border border-border hover:border-primary/50 cursor-pointer transition-all"
                      >
                        <input
                          type="radio"
                          name={`preview_q_${previewActiveIndex}`}
                          className="w-4 h-4 text-primary mt-1"
                        />
                        <span className="w-6 h-6 rounded-full bg-surface-subtle font-mono text-xs font-bold flex items-center justify-center uppercase shrink-0">
                          {opt.id}
                        </span>
                        <div className="flex-1 min-w-0 text-body-sm text-ink">
                          <MathText content={opt.text} />
                        </div>
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className="pt-2">
                    <input
                      type="text"
                      placeholder="Student enters answer here..."
                      disabled
                      className="w-full max-w-sm text-body-sm px-3.5 py-2.5 rounded-xl border border-border bg-surface-subtle text-ink"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Exam Navigation Footer */}
            <div className="p-4 border-t border-border bg-white flex items-center justify-between">
              <button
                type="button"
                onClick={() => setPreviewActiveIndex((i) => Math.max(0, i - 1))}
                disabled={previewActiveIndex === 0}
                className="px-4 py-2 rounded-xl border border-border text-body-sm font-semibold text-ink disabled:opacity-40"
              >
                Previous
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setPreviewActiveIndex((i) => Math.min(chosenQuestions.length - 1, i + 1))
                  }
                  disabled={previewActiveIndex === chosenQuestions.length - 1}
                  className="px-4 py-2 rounded-xl bg-primary text-white text-body-sm font-bold disabled:opacity-40"
                >
                  Next
                </button>

                <button
                  type="button"
                  onClick={() => setPreviewOpen(false)}
                  className="px-4 py-2 rounded-xl bg-neutral-900 text-white text-body-sm font-bold"
                >
                  Exit Preview
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
