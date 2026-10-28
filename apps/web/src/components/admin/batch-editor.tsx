"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getPresignedUploadUrlAction, saveBatchAction } from "@/server/admin-actions";
import { MathText } from "@/components/ui/math-text";
import {
  Upload,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Image as ImageIcon,
  BookOpen,
  Layers,
  HelpCircle,
  IndianRupee,
} from "lucide-react";

export interface BatchEditorProps {
  initialBatch?: {
    id: string;
    title: string;
    slug: string;
    subtitle?: string | null;
    description: string;
    classLevel: number;
    board: "cbse" | "icse" | "isc";
    subjectId: string;
    facultyId?: string | null;
    coverKey?: string | null;
    mode: "offline" | "online" | "hybrid";
    scheduleText: string;
    locationText?: string | null;
    startDate: string;
    endDate?: string | null;
    seatsTotal: number;
    status: "draft" | "open" | "closed" | "completed";
    isFeatured: boolean;
    whatsappGroupUrl?: string | null;
    outcomes: string[];
    syllabus: Array<{ module: string; notes?: string; chapters: Array<{ title: string; slug?: string; hasFreePreview?: boolean }> }>;
    faqs: Array<{ question: string; answer: string }>;
    feePlans?: Array<{
      id?: string;
      name: string;
      totalPaise: number;
      originalPaise?: number | null;
      instalments: Array<{ name: string; amountPaise: number; dueDate?: string }>;
      isActive?: boolean;
    }>;
  };
  subjects: Array<{ id: string; name: string }>;
  faculty: Array<{ id: string; name: string }>;
  availableChapters: Array<{ id: string; title: string; classLevel: number; subjectId: string }>;
}

export function BatchEditor({
  initialBatch,
  subjects,
  faculty,
  availableChapters,
}: BatchEditorProps) {
  const router = useRouter();

  // Basic Details
  const [title, setTitle] = useState(initialBatch?.title || "");
  const [slug, setSlug] = useState(initialBatch?.slug || "");
  const [subtitle, setSubtitle] = useState(initialBatch?.subtitle || "");
  const [classLevel, setClassLevel] = useState<number>(initialBatch?.classLevel || 12);
  const [board, setBoard] = useState<"cbse" | "icse" | "isc">(initialBatch?.board || "cbse");
  const [subjectId, setSubjectId] = useState(initialBatch?.subjectId || subjects[0]?.id || "");
  const [facultyId, setFacultyId] = useState(initialBatch?.facultyId || "");
  const [mode, setMode] = useState<"offline" | "online" | "hybrid">(initialBatch?.mode || "online");
  const [scheduleText, setScheduleText] = useState(initialBatch?.scheduleText || "Mon, Wed, Fri · 5:00 PM – 7:00 PM");
  const [locationText, setLocationText] = useState(initialBatch?.locationText || "Mathura Main Campus");
  const [startDate, setStartDate] = useState(
    initialBatch?.startDate
      ? new Date(initialBatch.startDate).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0],
  );
  const [endDate, setEndDate] = useState(
    initialBatch?.endDate ? new Date(initialBatch.endDate).toISOString().split("T")[0] : "",
  );
  const [seatsTotal, setSeatsTotal] = useState<number>(initialBatch?.seatsTotal || 40);
  const [status, setStatus] = useState<"draft" | "open" | "closed" | "completed">(
    initialBatch?.status || "draft",
  );
  const [isFeatured, setIsFeatured] = useState<boolean>(initialBatch?.isFeatured ?? false);
  const [whatsappGroupUrl, setWhatsappGroupUrl] = useState(initialBatch?.whatsappGroupUrl || "");

  // Media
  const [coverKey, setCoverKey] = useState(initialBatch?.coverKey || "");
  const [uploadingCover, setUploadingCover] = useState(false);

  // Description & Preview Tab
  const [description, setDescription] = useState(
    initialBatch?.description || "Comprehensive syllabus coverage with test series and daily doubt clearing.",
  );
  const [previewTab, setPreviewTab] = useState<"edit" | "preview">("edit");

  // Outcomes
  const [outcomes, setOutcomes] = useState<string[]>(
    initialBatch?.outcomes && initialBatch.outcomes.length > 0
      ? initialBatch.outcomes
      : [
          "Complete mastery of NCERT & exemplar problems",
          "Weekly full-length timed mock tests with rankings",
          "Formula book & memory maps for rapid revision",
        ],
  );

  // Syllabus Modules
  const [syllabus, setSyllabus] = useState<
    Array<{
      module: string;
      notes?: string;
      chapters: Array<{ title: string; slug?: string; hasFreePreview?: boolean }>;
    }>
  >(
    initialBatch?.syllabus && initialBatch.syllabus.length > 0
      ? initialBatch.syllabus
      : [
          {
            module: "Term 1: Core Fundamentals",
            notes: "Theory lectures, conceptual depth & PYQs",
            chapters: [
              { title: "Electric Charges and Fields", hasFreePreview: true },
              { title: "Electrostatic Potential & Capacitance", hasFreePreview: false },
            ],
          },
        ],
  );

  // FAQs
  const [faqs, setFaqs] = useState<Array<{ question: string; answer: string }>>(
    initialBatch?.faqs && initialBatch.faqs.length > 0
      ? initialBatch.faqs
      : [
          {
            question: "Are study materials and mock tests included?",
            answer: "Yes, printed notes, daily practice problems, and chapter tests are all included.",
          },
          {
            question: "Can I pay in instalments?",
            answer: "Yes, we offer flexible instalment options as listed in the fee schedule below.",
          },
        ],
  );

  // Fee Plans
  const [feePlans, setFeePlans] = useState<
    Array<{
      id?: string;
      name: string;
      totalINR: number;
      originalINR: number;
      instalments: Array<{ name: string; amountINR: number; dueDate?: string }>;
      isActive: boolean;
    }>
  >(
    initialBatch?.feePlans && initialBatch.feePlans.length > 0
      ? initialBatch.feePlans.map((p) => ({
          id: p.id,
          name: p.name,
          totalINR: Math.round(p.totalPaise / 100),
          originalINR: p.originalPaise ? Math.round(p.originalPaise / 100) : 0,
          instalments: (p.instalments || []).map((ins) => ({
            name: ins.name,
            amountINR: Math.round(ins.amountPaise / 100),
            dueDate: ins.dueDate,
          })),
          isActive: p.isActive ?? true,
        }))
      : [
          {
            name: "One-time Full Payment",
            totalINR: 24000,
            originalINR: 30000,
            instalments: [{ name: "Full Payment", amountINR: 24000, dueDate: "" }],
            isActive: true,
          },
          {
            name: "3 Easy Instalments",
            totalINR: 27000,
            originalINR: 32000,
            instalments: [
              { name: "Instalment 1 (At Admission)", amountINR: 9000, dueDate: "" },
              { name: "Instalment 2 (Month 2)", amountINR: 9000, dueDate: "" },
              { name: "Instalment 3 (Month 3)", amountINR: 9000, dueDate: "" },
            ],
            isActive: true,
          },
        ],
  );

  // Form State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Auto-slug generator
  const generateSlug = () => {
    const s = `${title}-class-${classLevel}-${board}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    setSlug(s);
  };

  // Cover image upload handler
  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrorMsg("Cover image must be a valid image file (JPEG, PNG, WEBP).");
      return;
    }

    setUploadingCover(true);
    setErrorMsg(null);
    try {
      const presignedRes = await getPresignedUploadUrlAction({
        filename: file.name,
        contentType: file.type,
        sizeBytes: file.size,
        folder: "covers",
      });

      if (!presignedRes.success || !presignedRes.data) {
        throw new Error(presignedRes.error || "Failed to generate cover upload link");
      }

      const { uploadUrl, key } = presignedRes.data;
      const putRes = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      });

      if (!putRes.ok) {
        throw new Error(`Upload to storage failed (${putRes.status})`);
      }

      setCoverKey(key);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Cover image upload failed");
    } finally {
      setUploadingCover(false);
    }
  };

  // Outcomes Handlers
  const addOutcome = () => setOutcomes([...outcomes, ""]);
  const updateOutcome = (idx: number, val: string) => {
    const next = [...outcomes];
    next[idx] = val;
    setOutcomes(next);
  };
  const removeOutcome = (idx: number) => {
    setOutcomes(outcomes.filter((_, i) => i !== idx));
  };

  // Syllabus Handlers
  const addModule = () => {
    setSyllabus([
      ...syllabus,
      { module: `Module ${syllabus.length + 1}`, notes: "", chapters: [] },
    ]);
  };
  const removeModule = (idx: number) => {
    setSyllabus(syllabus.filter((_, i) => i !== idx));
  };
  const updateModuleName = (idx: number, name: string) => {
    const next = [...syllabus];
    const item = next[idx];
    if (item) {
      item.module = name;
      setSyllabus(next);
    }
  };
  const updateModuleNotes = (idx: number, notes: string) => {
    const next = [...syllabus];
    const item = next[idx];
    if (item) {
      item.notes = notes;
      setSyllabus(next);
    }
  };
  const addChapterToModule = (modIdx: number, chapterTitle: string) => {
    if (!chapterTitle.trim()) return;
    const next = [...syllabus];
    const mod = next[modIdx];
    if (mod) {
      mod.chapters.push({ title: chapterTitle.trim(), hasFreePreview: false });
      setSyllabus(next);
    }
  };
  const removeChapterFromModule = (modIdx: number, chapIdx: number) => {
    const next = [...syllabus];
    const mod = next[modIdx];
    if (mod) {
      mod.chapters.splice(chapIdx, 1);
      setSyllabus(next);
    }
  };
  const toggleChapterPreview = (modIdx: number, chapIdx: number) => {
    const next = [...syllabus];
    const chap = next[modIdx]?.chapters[chapIdx];
    if (chap) {
      chap.hasFreePreview = !chap.hasFreePreview;
      setSyllabus(next);
    }
  };
  const moveChapter = (modIdx: number, chapIdx: number, direction: "up" | "down") => {
    const next = [...syllabus];
    const chaps = next[modIdx]?.chapters;
    if (!chaps) return;
    const targetIdx = direction === "up" ? chapIdx - 1 : chapIdx + 1;
    if (targetIdx < 0 || targetIdx >= chaps.length) return;
    const curr = chaps[chapIdx];
    const target = chaps[targetIdx];
    if (curr && target) {
      chaps[chapIdx] = target;
      chaps[targetIdx] = curr;
      setSyllabus(next);
    }
  };

  // FAQ Handlers
  const addFaq = () => setFaqs([...faqs, { question: "", answer: "" }]);
  const updateFaq = (idx: number, field: "question" | "answer", val: string) => {
    const next = [...faqs];
    const f = next[idx];
    if (f) {
      f[field] = val;
      setFaqs(next);
    }
  };
  const removeFaq = (idx: number) => setFaqs(faqs.filter((_, i) => i !== idx));

  // Fee Plan Handlers
  const addFeePlan = () => {
    setFeePlans([
      ...feePlans,
      {
        name: `Plan ${feePlans.length + 1}`,
        totalINR: 20000,
        originalINR: 25000,
        instalments: [{ name: "Instalment 1", amountINR: 20000, dueDate: "" }],
        isActive: true,
      },
    ]);
  };
  const removeFeePlan = (idx: number) => setFeePlans(feePlans.filter((_, i) => i !== idx));
  const updateFeePlan = (idx: number, field: string, val: unknown) => {
    const next = [...feePlans];
    const p = next[idx];
    if (p) {
      (p as Record<string, unknown>)[field] = val;
      setFeePlans(next);
    }
  };
  const addInstalmentToPlan = (planIdx: number) => {
    const next = [...feePlans];
    const p = next[planIdx];
    if (p) {
      p.instalments.push({
        name: `Instalment ${p.instalments.length + 1}`,
        amountINR: 0,
        dueDate: "",
      });
      setFeePlans(next);
    }
  };
  const removeInstalmentFromPlan = (planIdx: number, insIdx: number) => {
    const next = [...feePlans];
    const p = next[planIdx];
    if (p) {
      p.instalments.splice(insIdx, 1);
      setFeePlans(next);
    }
  };
  const updateInstalment = (planIdx: number, insIdx: number, field: string, val: unknown) => {
    const next = [...feePlans];
    const ins = next[planIdx]?.instalments[insIdx];
    if (ins) {
      (ins as Record<string, unknown>)[field] = val;
      setFeePlans(next);
    }
  };

  // Filter available chapters by selected class and subject
  const filteredChapters = availableChapters.filter(
    (c) => c.classLevel === classLevel && (!subjectId || c.subjectId === subjectId),
  );

  // Form Submit
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    let effectiveSlug = slug.trim();
    if (!effectiveSlug && title.trim()) {
      effectiveSlug = `${title.trim()}-class-${classLevel}-${board}`
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      setSlug(effectiveSlug);
    }

    if (!title.trim() || !effectiveSlug) {
      setErrorMsg("Batch Title is required.");
      return;
    }
    if (!subjectId) {
      setErrorMsg("Subject must be selected.");
      return;
    }

    // Validate fee plans instalment sums
    for (const p of feePlans) {
      const sum = p.instalments.reduce((acc, ins) => acc + (Number(ins.amountINR) || 0), 0);
      if (p.instalments.length > 0 && sum !== p.totalINR) {
        setErrorMsg(
          `Fee plan "${p.name}" has instalments sum ₹${sum} which does not match total ₹${p.totalINR}.`,
        );
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const payload = {
        id: initialBatch?.id,
        title: title.trim(),
        slug: effectiveSlug,
        subtitle: subtitle.trim() || undefined,
        classLevel: Number(classLevel),
        board,
        subjectId,
        facultyId: facultyId || undefined,
        mode,
        scheduleText: scheduleText.trim(),
        locationText: locationText.trim() || undefined,
        startDate: new Date(startDate || Date.now()).toISOString(),
        endDate: endDate ? new Date(endDate).toISOString() : undefined,
        seatsTotal: Number(seatsTotal),
        status,
        isFeatured,
        whatsappGroupUrl: whatsappGroupUrl.trim() || undefined,
        coverKey: coverKey || undefined,
        description: description.trim(),
        outcomes: outcomes.filter((o) => o.trim().length > 0),
        syllabus,
        faqs: faqs.filter((f) => f.question.trim().length > 0),
        feePlans: feePlans.map((p) => ({
          id: p.id,
          name: p.name.trim(),
          totalPaise: Math.round(p.totalINR * 100),
          originalPaise: p.originalINR ? Math.round(p.originalINR * 100) : undefined,
          instalments: p.instalments.map((ins) => ({
            name: ins.name.trim(),
            amountPaise: Math.round(ins.amountINR * 100),
            dueDate: ins.dueDate || undefined,
          })),
          isActive: p.isActive,
        })),
      };

      const res = await saveBatchAction(payload);
      if (!res.success) {
        throw new Error(res.error || "Failed to save batch");
      }

      setSuccessMsg("Batch saved successfully! Redirecting...");
      setTimeout(() => {
        router.push("/admin/batches");
        router.refresh();
      }, 1000);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to save batch");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Top Action Header Bar */}
      <div className="flex items-center justify-between p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-xs">
        <div>
          <span className="text-xs font-semibold text-slate-800 block">
            {initialBatch ? `Editing: ${initialBatch.title}` : "New Batch Configuration"}
          </span>
          <span className="text-[11px] text-slate-500">
            Configure syllabus modules, learning outcomes, and fee plans.
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/admin/batches")}
            disabled={isSubmitting}
            className="h-8 px-3 text-xs rounded-lg border-slate-200 text-slate-700 hover:bg-slate-50 font-medium"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || uploadingCover}
            className="h-8 px-3.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-2xs gap-1.5"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <span>Save & Publish Batch</span>
            )}
          </Button>
        </div>
      </div>

      {/* Alert Notices */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-critical/10 border border-critical/30 text-rose-500 text-body-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="font-medium">{errorMsg}</div>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-body-sm flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="font-semibold">{successMsg}</div>
        </div>
      )}

      {/* 1. Basic Information */}
      <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-5">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <BookOpen className="w-5 h-5 text-blue-600" />
          <h2 className="text-sm font-bold text-slate-900">1. Basic Information</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-[11px] font-semibold text-slate-700">
              Batch Title <span className="text-rose-500">*</span>
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Class 12 Physics Complete Board & JEE Foundation"
              required
            />
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold text-slate-700">
                URL Slug <span className="text-rose-500">*</span>
              </label>
              <button
                type="button"
                onClick={generateSlug}
                className="text-xs text-blue-600 hover:underline font-semibold"
              >
                Auto-generate from title
              </button>
            </div>
            <Input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="e.g. physics-class-12-cbse"
              required
            />
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <label className="text-[11px] font-semibold text-slate-700">Subtitle</label>
            <Input
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="e.g. By Dinesh Sir · 3 Lectures/week · Formula sheets & Test series"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-700">Class Level</label>
            <select
              value={classLevel}
              onChange={(e) => setClassLevel(Number(e.target.value))}
              className="w-full px-2.5 h-8.5 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white text-xs text-slate-800 font-medium"
            >
              {[9, 10, 11, 12].map((lvl) => (
                <option key={lvl} value={lvl}>
                  Class {lvl}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-700">Board</label>
            <select
              value={board}
              onChange={(e) => setBoard(e.target.value as "cbse" | "icse" | "isc")}
              className="w-full px-2.5 h-8.5 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white text-xs text-slate-800 font-medium uppercase"
            >
              <option value="cbse">CBSE</option>
              <option value="icse">ICSE</option>
              <option value="isc">ISC</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-700">
              Subject <span className="text-rose-500">*</span>
            </label>
            <select
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              className="w-full px-2.5 h-8.5 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white text-xs text-slate-800 font-medium"
              required
            >
              {subjects.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-700">Faculty In-charge</label>
            <select
              value={facultyId}
              onChange={(e) => setFacultyId(e.target.value)}
              className="w-full px-2.5 h-8.5 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white text-xs text-slate-800 font-medium"
            >
              <option value="">None / Unassigned</option>
              {faculty.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-700">Delivery Mode</label>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value as "offline" | "online" | "hybrid")}
              className="w-full px-2.5 h-8.5 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white text-xs text-slate-800 font-medium"
            >
              <option value="offline">Offline (In-center)</option>
              <option value="online">Online Live</option>
              <option value="hybrid">Hybrid (Classroom + Online)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-700">Total Seats</label>
            <Input
              type="number"
              min={1}
              value={seatsTotal}
              onChange={(e) => setSeatsTotal(Number(e.target.value))}
            />
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <label className="text-[11px] font-semibold text-slate-700">Schedule Text</label>
            <Input
              value={scheduleText}
              onChange={(e) => setScheduleText(e.target.value)}
              placeholder="e.g. Mon, Wed, Fri · 5:00 PM – 7:00 PM"
              required
            />
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <label className="text-[11px] font-semibold text-slate-700">Location / Classroom</label>
            <Input
              value={locationText}
              onChange={(e) => setLocationText(e.target.value)}
              placeholder="e.g. Mathura Main Campus, Classroom 2"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-700">Start Date</label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-700">End Date (Optional)</label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-700">Status</label>
            <select
              value={status}
              onChange={(e) =>
                setStatus(e.target.value as "draft" | "open" | "closed" | "completed")
              }
              className="w-full px-2.5 h-8.5 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white text-xs text-slate-800 font-medium"
            >
              <option value="draft">Draft (Hidden from public)</option>
              <option value="open">Open (Admissions Active)</option>
              <option value="closed">Closed (Seats Full / Admissions Stopped)</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <div className="space-y-1.5 flex flex-col justify-end">
            <label className="flex items-center gap-2 cursor-pointer pb-2">
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-primary/20"
              />
              <span className="text-xs font-semibold text-slate-800">
                Featured on Homepage
              </span>
            </label>
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <label className="text-[11px] font-semibold text-slate-700">
              WhatsApp Group Link (Students only)
            </label>
            <Input
              type="url"
              value={whatsappGroupUrl}
              onChange={(e) => setWhatsappGroupUrl(e.target.value)}
              placeholder="https://chat.whatsapp.com/..."
            />
          </div>
        </div>
      </div>

      {/* 2. Cover Image Upload */}
      <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-5">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <ImageIcon className="w-5 h-5 text-blue-600" />
          <h2 className="text-sm font-bold text-slate-900">2. Cover Image</h2>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="w-32 h-20 rounded-xl bg-slate-50/70 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
            {coverKey ? (
              <div className="p-2 text-center text-xs text-slate-500">
                <span className="font-semibold text-blue-600 block truncate max-w-[120px]">
                  {coverKey.split("/").pop()}
                </span>
                Uploaded
              </div>
            ) : (
              <ImageIcon className="w-8 h-8 text-ink-muted opacity-40" />
            )}
          </div>

          <div className="space-y-1.5">
            <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50/70 text-[11px] font-semibold text-slate-700 cursor-pointer transition-colors">
              <Upload className="w-4 h-4" />
              <span>{uploadingCover ? "Uploading image..." : "Upload Cover Image"}</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleCoverUpload}
                disabled={uploadingCover}
                className="hidden"
              />
            </label>
            <p className="text-xs text-slate-500">
              JPG, PNG, or WebP. Aspect ratio ~16:9 recommended. Max 25 MB.
            </p>
            {coverKey && (
              <p className="text-body-xs font-mono text-ink-muted truncate max-w-md">
                Storage Key: {coverKey}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 3. Description with Live Math/Markdown Preview */}
      <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-900">3. Description & Syllabus Overview</h2>
          </div>
          <div className="flex rounded-lg border border-slate-200 p-0.5 bg-slate-50/70">
            <button
              type="button"
              onClick={() => setPreviewTab("edit")}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                previewTab === "edit" ? "bg-white text-ink shadow-xs" : "text-ink-muted"
              }`}
            >
              Markdown
            </button>
            <button
              type="button"
              onClick={() => setPreviewTab("preview")}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                previewTab === "preview" ? "bg-white text-ink shadow-xs" : "text-ink-muted"
              }`}
            >
              Live Preview
            </button>
          </div>
        </div>

        {previewTab === "edit" ? (
          <Textarea
            rows={5}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Write description in markdown. Math formulas e.g. $F = ma$ or $\int f(x)dx$ are supported."
            className="text-xs text-slate-800 rounded-lg border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white p-3 leading-relaxed"
          />
        ) : (
          <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50 min-h-[120px] text-xs text-slate-800 prose max-w-none">
            <MathText content={description} />
          </div>
        )}
      </div>

      {/* 4. Learning Outcomes */}
      <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-900">4. Learning Outcomes ({outcomes.length})</h2>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={addOutcome} className="gap-1 text-xs">
            <Plus className="w-3.5 h-3.5" /> Add Outcome
          </Button>
        </div>

        <div className="space-y-2">
          {outcomes.map((outcome, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200/80 text-slate-600 font-mono text-xs font-bold flex items-center justify-center shrink-0">
                {idx + 1}
              </span>
              <Input
                value={outcome}
                onChange={(e) => updateOutcome(idx, e.target.value)}
                placeholder="e.g. Master all 14 chapters with step-by-step numerical solving"
                className="h-8 text-xs rounded-lg border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white text-slate-800 font-medium"
              />
              <button
                type="button"
                onClick={() => removeOutcome(idx)}
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors shrink-0"
                title="Remove outcome"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Syllabus Builder */}
      <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-900">5. Syllabus Builder ({syllabus.length} Modules)</h2>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={addModule} className="gap-1 text-xs">
            <Plus className="w-3.5 h-3.5" /> Add Module
          </Button>
        </div>

        <div className="space-y-5">
          {syllabus.map((mod, modIdx) => (
            <div
              key={modIdx}
              className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3"
            >
              <div className="flex items-center justify-between gap-3">
                <Input
                  value={mod.module}
                  onChange={(e) => updateModuleName(modIdx, e.target.value)}
                  placeholder="Module Name (e.g. Term 1: Electrostatics & Magnetism)"
                  className="h-8 text-xs font-bold rounded-lg border-slate-200 bg-white text-slate-800"
                />
                <button
                  type="button"
                  onClick={() => removeModule(modIdx)}
                  className="p-2 text-ink-muted hover:text-rose-500 shrink-0"
                  title="Remove module"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <Input
                value={mod.notes || ""}
                onChange={(e) => updateModuleNotes(modIdx, e.target.value)}
                placeholder="Module notes (e.g. 8 Weeks · 24 Lectures · 2 Unit Tests)"
                className="h-7.5 text-xs rounded-lg border-slate-200 bg-white text-slate-600"
              />

              {/* Chapters in this module */}
              <div className="space-y-2 pt-2 border-t border-slate-200/50">
                <p className="text-[11px] font-bold text-ink-muted uppercase tracking-wider">
                  Chapters in this Module
                </p>

                {mod.chapters.length === 0 ? (
                  <p className="text-xs text-slate-500 italic py-1">
                    No chapters added yet to this module.
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    {mod.chapters.map((chap, cIdx) => (
                      <div
                        key={cIdx}
                        className="flex items-center justify-between gap-2 p-2 rounded-lg bg-white border border-slate-200 text-body-sm"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-body-xs font-mono text-ink-muted">
                            {cIdx + 1}.
                          </span>
                          <span className="font-medium text-ink truncate">{chap.title}</span>
                          <label className="flex items-center gap-1.5 ml-2 cursor-pointer shrink-0">
                            <input
                              type="checkbox"
                              checked={chap.hasFreePreview || false}
                              onChange={() => toggleChapterPreview(modIdx, cIdx)}
                              className="w-3.5 h-3.5 rounded text-blue-600"
                            />
                            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                              Free Preview
                            </span>
                          </label>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => moveChapter(modIdx, cIdx, "up")}
                            disabled={cIdx === 0}
                            className="p-1 text-ink-muted hover:text-ink disabled:opacity-30"
                            title="Move up"
                          >
                            <ChevronUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveChapter(modIdx, cIdx, "down")}
                            disabled={cIdx === mod.chapters.length - 1}
                            className="p-1 text-ink-muted hover:text-ink disabled:opacity-30"
                            title="Move down"
                          >
                            <ChevronDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeChapterFromModule(modIdx, cIdx)}
                            className="p-1 text-ink-muted hover:text-rose-500"
                            title="Remove chapter"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Quick Add Chapter from database */}
                <div className="flex items-center gap-2 pt-2">
                  <select
                    id={`chap-select-${modIdx}`}
                    defaultValue=""
                    className="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-body-xs text-ink"
                  >
                    <option value="" disabled>
                      Select an existing chapter to attach...
                    </option>
                    {filteredChapters.map((c) => (
                      <option key={c.id} value={c.title}>
                        {c.title}
                      </option>
                    ))}
                  </select>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const sel = document.getElementById(
                        `chap-select-${modIdx}`,
                      ) as HTMLSelectElement | null;
                      if (sel && sel.value) {
                        addChapterToModule(modIdx, sel.value);
                        sel.value = "";
                      }
                    }}
                    className="text-xs"
                  >
                    Add Chapter
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 6. FAQs Editor */}
      <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-900">6. Frequently Asked Questions ({faqs.length})</h2>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={addFaq} className="gap-1 text-xs">
            <Plus className="w-3.5 h-3.5" /> Add FAQ
          </Button>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <div key={idx} className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Input
                  value={faq.question}
                  onChange={(e) => updateFaq(idx, "question", e.target.value)}
                  placeholder="Question (e.g. Can I attend backup classes if I miss a lecture?)"
                  className="h-8 text-xs font-bold rounded-lg border-slate-200 bg-white text-slate-800"
                />
                <button
                  type="button"
                  onClick={() => removeFaq(idx)}
                  className="p-1.5 text-ink-muted hover:text-rose-500 shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <Textarea
                rows={2}
                value={faq.answer}
                onChange={(e) => updateFaq(idx, "answer", e.target.value)}
                placeholder="Answer text..."
                className="text-xs rounded-lg border-slate-200 bg-white text-slate-700 p-2.5"
              />
            </div>
          ))}
        </div>
      </div>

      {/* 7. Fee Plans & Instalment Schedule */}
      <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <IndianRupee className="w-5 h-5 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-900">
              7. Fee Plans & Instalment Schedule ({feePlans.length})
            </h2>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={addFeePlan} className="gap-1 text-xs h-7 px-2.5 rounded-lg border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-semibold shadow-2xs">
            <Plus className="w-3.5 h-3.5" /> Add Fee Plan
          </Button>
        </div>

        <div className="space-y-6">
          {feePlans.map((plan, pIdx) => {
            const instalmentSum = plan.instalments.reduce(
              (acc, ins) => acc + (Number(ins.amountINR) || 0),
              0,
            );
            const isSumValid = instalmentSum === plan.totalINR;

            return (
              <div
                key={pIdx}
                className="p-4.5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3.5"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/60 pb-3">
                  <div className="flex items-center gap-3">
                    <Input
                      value={plan.name}
                      onChange={(e) => updateFeePlan(pIdx, "name", e.target.value)}
                      placeholder="Plan Name (e.g. Full Payment, 3 Instalments)"
                      className="h-8 text-xs font-bold rounded-lg border-slate-200 bg-white text-slate-800 min-w-[200px]"
                    />
                    <label className="flex items-center gap-1.5 cursor-pointer shrink-0">
                      <input
                        type="checkbox"
                        checked={plan.isActive}
                        onChange={(e) => updateFeePlan(pIdx, "isActive", e.target.checked)}
                        className="w-3.5 h-3.5 rounded text-blue-600"
                      />
                      <span className="text-[11px] font-semibold text-slate-700">Active</span>
                    </label>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeFeePlan(pIdx)}
                    className="p-1.5 text-slate-400 hover:text-rose-500 self-end sm:self-center"
                    title="Remove fee plan"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-700">Total Fee (₹)</label>
                    <Input
                      type="number"
                      value={plan.totalINR}
                      onChange={(e) => updateFeePlan(pIdx, "totalINR", Number(e.target.value))}
                      className="h-8 text-xs rounded-lg border-slate-200 bg-white font-mono font-bold text-slate-900"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-700">
                      Original / Strike-through Fee (₹)
                    </label>
                    <Input
                      type="number"
                      value={plan.originalINR || 0}
                      onChange={(e) => updateFeePlan(pIdx, "originalINR", Number(e.target.value))}
                      className="h-8 text-xs rounded-lg border-slate-200 bg-white font-mono text-slate-600"
                    />
                  </div>
                </div>

                {/* Instalments list */}
                <div className="space-y-2.5 pt-1">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Instalment Schedule
                    </p>
                    <button
                      type="button"
                      onClick={() => addInstalmentToPlan(pIdx)}
                      className="text-xs text-blue-600 hover:underline font-semibold"
                    >
                      + Add Instalment
                    </button>
                  </div>

                  <div className="space-y-2">
                    {plan.instalments.map((ins, insIdx) => (
                      <div
                        key={insIdx}
                        className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center p-2 rounded-lg bg-white border border-slate-200/80"
                      >
                        <div className="sm:col-span-5">
                          <Input
                            value={ins.name}
                            onChange={(e) =>
                              updateInstalment(pIdx, insIdx, "name", e.target.value)
                            }
                            placeholder="Instalment Label (e.g. Month 1)"
                            className="h-7.5 text-xs rounded-md border-slate-200 bg-slate-50/50 hover:bg-white text-slate-800 font-medium"
                          />
                        </div>
                        <div className="sm:col-span-3">
                          <Input
                            type="number"
                            value={ins.amountINR}
                            onChange={(e) =>
                              updateInstalment(pIdx, insIdx, "amountINR", Number(e.target.value))
                            }
                            placeholder="Amount ₹"
                            className="h-7.5 text-xs font-mono font-semibold rounded-md border-slate-200 bg-slate-50/50 hover:bg-white text-slate-800"
                          />
                        </div>
                        <div className="sm:col-span-3">
                          <Input
                            type="date"
                            value={ins.dueDate || ""}
                            onChange={(e) =>
                              updateInstalment(pIdx, insIdx, "dueDate", e.target.value)
                            }
                            className="h-7.5 text-xs rounded-md border-slate-200 bg-slate-50/50 hover:bg-white text-slate-800"
                          />
                        </div>
                        <div className="sm:col-span-1 text-right">
                          <button
                            type="button"
                            onClick={() => removeInstalmentFromPlan(pIdx, insIdx)}
                            className="p-1 text-slate-400 hover:text-rose-500"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Instalment total sum status indicator */}
                  <div
                    className={`flex items-center justify-between p-2 rounded-lg text-xs font-semibold ${
                      isSumValid
                        ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                        : "bg-amber-50 text-amber-800 border border-amber-200"
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Sum of instalments: ₹{instalmentSum.toLocaleString("en-IN")} / Total Fee: ₹{plan.totalINR.toLocaleString("en-IN")}
                    </span>
                    {!isSumValid && (
                      <span className="text-amber-700 font-bold">
                        Mismatch: Difference ₹{Math.abs(instalmentSum - plan.totalINR).toLocaleString("en-IN")}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Footer (docked cleanly at end of form, never covers inputs) */}
      <div className="flex items-center justify-between pt-5 border-t border-slate-200/80 mt-8">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/admin/batches")}
          disabled={isSubmitting}
          className="h-8 px-3.5 text-xs rounded-lg border-slate-200 text-slate-700 hover:bg-slate-50 font-medium"
        >
          Cancel
        </Button>

        <div className="flex items-center gap-3">
          <Button
            type="submit"
            disabled={isSubmitting || uploadingCover}
            className="h-8.5 px-5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-2xs gap-1.5"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Saving Batch...</span>
              </>
            ) : (
              <span>Save & Publish Batch</span>
            )}
          </Button>
        </div>
      </div>
    </form>
  );
}
