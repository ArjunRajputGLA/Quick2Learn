"use client";

import { useState, useTransition, useMemo, useEffect, useRef } from "react";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { MathText } from "@/components/ui/math-text";
import { Badge } from "@/components/ui/badge";
import {
  createQuestionAdminAction,
  updateQuestionAdminAction,
  deleteQuestionAdminAction,
  checkDuplicateQuestionAction,
  validateQuestionImportAction,
  commitQuestionImportAction,
  getPresignedUploadUrlAction,
} from "@/server/admin-actions";
import {
  Plus,
  Upload,
  Download,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Edit2,
  Trash2,
  Loader2,
  X,
  FileSpreadsheet,
  Image as ImageIcon,
  HelpCircle,
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

interface QuestionItemData {
  id: string;
  subjectId: string;
  subjectName?: string;
  chapterId?: string | null;
  chapterTitle?: string;
  classLevel: number;
  type: string;
  stem: string;
  imageKey?: string | null;
  options?: Array<{ id: string; text: string; imageKey?: string }> | null;
  correct: any;
  solution?: string | null;
  difficulty: "easy" | "medium" | "hard";
  marks: number;
  negativeMarks: number;
  tags: string[];
  source?: string | null;
  competency?: string | null;
  caseGroupId?: string | null;
  caseGroup?: { id: string; passage: string; imageKey?: string | null } | null;
  isActive: boolean;
  createdAt?: string;
}

interface QuestionBankClientProps {
  initialQuestions: QuestionItemData[];
  subjects: SubjectOption[];
  chapters: ChapterOption[];
}

export function QuestionBankClient({
  initialQuestions,
  subjects,
  chapters,
}: QuestionBankClientProps) {
  const [questions, setQuestions] = useState<QuestionItemData[]>(initialQuestions);
  const [isPending, startTransition] = useTransition();

  // Filters
  const [selectedClass, setSelectedClass] = useState<number | "all">("all");
  const [selectedSubject, setSelectedSubject] = useState<string>("all");
  const [selectedChapter, setSelectedChapter] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Editor Modal State
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<QuestionItemData | null>(null);

  // Form State
  const [formClassLevel, setFormClassLevel] = useState<number>(10);
  const [formSubjectId, setFormSubjectId] = useState<string>(subjects[0]?.id || "");
  const [formChapterId, setFormChapterId] = useState<string>("");
  const [formType, setFormType] = useState<string>("mcq_single");
  const [formStem, setFormStem] = useState<string>("");
  const [formImageKey, setFormImageKey] = useState<string>("");
  const [formOptions, setFormOptions] = useState<Array<{ id: string; text: string }>>([
    { id: "a", text: "" },
    { id: "b", text: "" },
    { id: "c", text: "" },
    { id: "d", text: "" },
  ]);
  const [formCorrect, setFormCorrect] = useState<any>("a");
  const [formSolution, setFormSolution] = useState<string>("");
  const [formDifficulty, setFormDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [formMarks, setFormMarks] = useState<number>(1);
  const [formNegativeMarks, setFormNegativeMarks] = useState<number>(0);
  const [formTags, setFormTags] = useState<string>("");
  const [formSource, setFormSource] = useState<string>("");
  const [formCompetency, setFormCompetency] = useState<string>("");
  const [formPassage, setFormPassage] = useState<string>("");

  // Duplicate warning state
  const [duplicateWarning, setDuplicateWarning] = useState<{ isDuplicate: boolean; stem?: string }>({
    isDuplicate: false,
  });

  // Import Modal State
  const [importOpen, setImportOpen] = useState(false);
  const [importRows, setImportRows] = useState<any[]>([]);
  const [isImportValidating, setIsImportValidating] = useState(false);
  const [importSummary, setImportSummary] = useState<{
    validCount: number;
    errorCount: number;
    canImport: boolean;
  } | null>(null);

  // Uploading state
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Available chapters for selected filter subject and class
  const filteredChapters = useMemo(() => {
    return chapters.filter((c) => {
      if (selectedSubject !== "all" && c.subjectId !== selectedSubject) return false;
      if (selectedClass !== "all" && c.classLevel !== selectedClass) return false;
      return true;
    });
  }, [chapters, selectedSubject, selectedClass]);

  // Form chapters
  const formAvailableChapters = useMemo(() => {
    return chapters.filter(
      (c) => c.subjectId === formSubjectId && c.classLevel === formClassLevel
    );
  }, [chapters, formSubjectId, formClassLevel]);

  // Filtered Questions
  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      if (selectedClass !== "all" && q.classLevel !== selectedClass) return false;
      if (selectedSubject !== "all" && q.subjectId !== selectedSubject) return false;
      if (selectedChapter !== "all" && q.chapterId !== selectedChapter) return false;
      if (selectedType !== "all" && q.type !== selectedType) return false;
      if (selectedDifficulty !== "all" && q.difficulty !== selectedDifficulty) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesStem = q.stem.toLowerCase().includes(query);
        const matchesSource = q.source?.toLowerCase().includes(query);
        const matchesTags = q.tags?.some((t) => t.toLowerCase().includes(query));
        if (!matchesStem && !matchesSource && !matchesTags) return false;
      }
      return true;
    });
  }, [questions, selectedClass, selectedSubject, selectedChapter, selectedType, selectedDifficulty, searchQuery]);

  // Debounced duplicate detection
  useEffect(() => {
    if (!editorOpen || !formStem || formStem.length < 15) {
      setDuplicateWarning({ isDuplicate: false });
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await checkDuplicateQuestionAction(
          formSubjectId,
          formClassLevel,
          formStem,
          editingQuestion?.id
        );
        if (res.success && res.data?.isDuplicate) {
          setDuplicateWarning({ isDuplicate: true, stem: res.data.existingStem });
        } else {
          setDuplicateWarning({ isDuplicate: false });
        }
      } catch {
        // ignore
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [formStem, formSubjectId, formClassLevel, editingQuestion, editorOpen]);

  // Open modal for new question
  const handleOpenCreate = () => {
    setEditingQuestion(null);
    setFormClassLevel(selectedClass !== "all" ? selectedClass : 10);
    setFormSubjectId(selectedSubject !== "all" ? selectedSubject : subjects[0]?.id || "");
    setFormChapterId("");
    setFormType("mcq_single");
    setFormStem("");
    setFormImageKey("");
    setFormOptions([
      { id: "a", text: "" },
      { id: "b", text: "" },
      { id: "c", text: "" },
      { id: "d", text: "" },
    ]);
    setFormCorrect("a");
    setFormSolution("");
    setFormDifficulty("medium");
    setFormMarks(1);
    setFormNegativeMarks(0);
    setFormTags("");
    setFormSource("");
    setFormCompetency("");
    setFormPassage("");
    setDuplicateWarning({ isDuplicate: false });
    setEditorOpen(true);
  };

  // Open modal for editing question
  const handleOpenEdit = (q: QuestionItemData) => {
    setEditingQuestion(q);
    setFormClassLevel(q.classLevel);
    setFormSubjectId(q.subjectId);
    setFormChapterId(q.chapterId || "");
    setFormType(q.type);
    setFormStem(q.stem);
    setFormImageKey(q.imageKey || "");
    setFormOptions(
      q.options && q.options.length > 0
        ? q.options.map((o) => ({ id: o.id, text: o.text }))
        : [
            { id: "a", text: "" },
            { id: "b", text: "" },
            { id: "c", text: "" },
            { id: "d", text: "" },
          ]
    );
    setFormCorrect(q.correct);
    setFormSolution(q.solution || "");
    setFormDifficulty(q.difficulty);
    setFormMarks(q.marks);
    setFormNegativeMarks(q.negativeMarks);
    setFormTags(q.tags?.join(", ") || "");
    setFormSource(q.source || "");
    setFormCompetency(q.competency || "");
    setFormPassage(q.caseGroup?.passage || "");
    setDuplicateWarning({ isDuplicate: false });
    setEditorOpen(true);
  };

  // Save question handler
  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formStem.trim()) {
      toast.error("Question stem cannot be empty");
      return;
    }

    const payload = {
      classLevel: formClassLevel,
      subjectId: formSubjectId,
      chapterId: formChapterId || null,
      type: formType,
      stem: formStem.trim(),
      imageKey: formImageKey || null,
      options: formType !== "numeric" && formType !== "true_false" ? formOptions : null,
      correct: formCorrect,
      solution: formSolution.trim() || null,
      difficulty: formDifficulty,
      marks: Number(formMarks) || 1,
      negativeMarks: Number(formNegativeMarks) || 0,
      tags: formTags
        ? formTags.split(",").map((t) => t.trim()).filter(Boolean)
        : [],
      source: formSource.trim() || null,
      competency: formCompetency.trim() || null,
      passageText: formPassage.trim() || null,
    };

    startTransition(async () => {
      try {
        if (editingQuestion) {
          const res = await updateQuestionAdminAction(editingQuestion.id, payload);
          if (res.success && res.data) {
            toast.success("Question updated successfully");
            const updated = res.data as any;
            setQuestions((prev) =>
              prev.map((q) => (q.id === editingQuestion.id ? { ...q, ...updated } : q))
            );
            setEditorOpen(false);
          } else {
            toast.error(res.error || "Failed to update question");
          }
        } else {
          const res = await createQuestionAdminAction(payload);
          if (res.success && res.data) {
            toast.success("Question added to question bank");
            const created = res.data as any;
            const sub = subjects.find((s) => s.id === formSubjectId);
            const ch = chapters.find((c) => c.id === formChapterId);
            setQuestions((prev) => [
              {
                ...created,
                subjectName: sub?.name,
                chapterTitle: ch?.title,
                marks: Number(created.marks),
                negativeMarks: Number(created.negativeMarks),
              },
              ...prev,
            ]);
            setEditorOpen(false);
          } else {
            toast.error(res.error || "Failed to create question");
          }
        }
      } catch (err: any) {
        toast.error(err.message || "An error occurred");
      }
    });
  };

  // Delete question handler
  const handleDeleteQuestion = async (id: string) => {
    if (!confirm("Are you sure you want to remove this question from the question bank?")) {
      return;
    }

    startTransition(async () => {
      try {
        const res = await deleteQuestionAdminAction(id);
        if (res.success) {
          toast.success("Question deleted");
          setQuestions((prev) => prev.filter((q) => q.id !== id));
        } else {
          toast.error(res.error || "Failed to delete question");
        }
      } catch (err: any) {
        toast.error(err.message || "An error occurred");
      }
    });
  };

  // Image Upload handler
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    try {
      const presignedRes = await getPresignedUploadUrlAction({
        filename: file.name,
        contentType: file.type,
        sizeBytes: file.size,
        folder: "questions",
      });
      if (!presignedRes.success || !presignedRes.data) {
        throw new Error(presignedRes.error || "Failed to get upload URL");
      }

      const { uploadUrl, key } = presignedRes.data;
      const uploadHttpRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!uploadHttpRes.ok) {
        throw new Error("Failed to upload image file to storage");
      }

      setFormImageKey(key);
      toast.success("Image attached to question");
    } catch (err: any) {
      toast.error(err.message || "Failed to upload image");
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Download XLSX Template matching the prompt requirement exactly
  const handleDownloadTemplate = () => {
    const templateData = [
      {
        class: 10,
        subject: "Mathematics",
        chapter_no: 6,
        type: "mcq_single",
        stem: "Evaluate the quadratic expression at $x = 2$: $f(x) = 3x^2 - 5x + 7$.",
        option_a: "$9$",
        option_b: "$11$",
        option_c: "$7$",
        option_d: "$15$",
        correct: "a",
        solution: "Substituting $x = 2$: $f(2) = 3(4) - 5(2) + 7 = 12 - 10 + 7 = 9$.",
        difficulty: "easy",
        marks: 1,
        negative_marks: 0,
        tags: "Quadratic Equations, Algebra",
        source: "Dinesh Sir — Ch 6 deck",
        competency: "Procedural",
        case_group: "",
        passage: "",
      },
      {
        class: 10,
        subject: "Mathematics",
        chapter_no: 8,
        type: "mcq_single",
        stem: "If $\\sin\\theta + \\cos\\theta = \\sqrt{2}\\cos\\theta$, then what is the value of $\\cos\\theta - \\sin\\theta$?",
        option_a: "$\\sqrt{2}\\sin\\theta$",
        option_b: "$-\\sqrt{2}\\sin\\theta$",
        option_c: "$\\sqrt{2}\\cos\\theta$",
        option_d: "$\\frac{1}{\\sqrt{2}}\\sin\\theta$",
        correct: "a",
        solution: "Squaring both sides and simplifying yields $\\cos\\theta - \\sin\\theta = \\sqrt{2}\\sin\\theta$.",
        difficulty: "medium",
        marks: 2,
        negative_marks: 0.5,
        tags: "Trigonometry, Identities",
        source: "Dinesh Sir Question Bank",
        competency: "Conceptual",
        case_group: "",
        passage: "",
      },
      {
        class: 10,
        subject: "Science",
        chapter_no: 1,
        type: "assertion_reason",
        stem: "Assertion (A): Rusting of iron is a chemical change.\nReason (R): It results in the formation of a new compound $Fe_2O_3 \\cdot xH_2O$.",
        option_a: "Both A and R are true and R is the correct explanation of A",
        option_b: "Both A and R are true but R is not the correct explanation of A",
        option_c: "A is true but R is false",
        option_d: "A is false but R is true",
        correct: "a",
        solution: "Rusting produces hydrated ferric oxide which has completely new chemical properties.",
        difficulty: "easy",
        marks: 1,
        negative_marks: 0.25,
        tags: "Chemical Reactions, Rusting",
        source: "Namita Ma'am ICSE Bank",
        competency: "Analysis",
        case_group: "",
        passage: "",
      },
      {
        class: 10,
        subject: "Mathematics",
        chapter_no: 12,
        type: "case_study",
        stem: "What is the maximum volume of water that the conical funnel can hold if $r = 7\\text{ cm}$ and $h = 12\\text{ cm}$? (Use $\\pi = \\frac{22}{7}$)",
        option_a: "$616\\text{ cm}^3$",
        option_b: "$462\\text{ cm}^3$",
        option_c: "$308\\text{ cm}^3$",
        option_d: "$154\\text{ cm}^3$",
        correct: "a",
        solution: "Volume $V = \\frac{1}{3}\\pi r^2 h = \\frac{1}{3} \\times \\frac{22}{7} \\times 49 \\times 12 = 616\\text{ cm}^3$.",
        difficulty: "hard",
        marks: 4,
        negative_marks: 1,
        tags: "Surface Areas, Volumes",
        source: "CBSE Case Study 2026",
        competency: "Application",
        case_group: "Case 1: Water Tank Experiment",
        passage: "A conical glass funnel is used in a school laboratory to measure the volume of liquid reagents. Students note its height $h$ and base radius $r$ before performing titrations.",
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Questions Template");
    XLSX.writeFile(workbook, "Quick2Learn_Question_Bank_Template.xlsx");
    toast.success("Template downloaded successfully");
  };

  // Parse XLSX / CSV File
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImportValidating(true);
    setImportSummary(null);

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const buffer = evt.target?.result;
        const workbook = XLSX.read(buffer, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        if (!sheetName) {
          toast.error("Workbook contains no sheets");
          setIsImportValidating(false);
          return;
        }
        const worksheet = workbook.Sheets[sheetName];
        if (!worksheet) {
          toast.error("Worksheet could not be read");
          setIsImportValidating(false);
          return;
        }
        const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet, {
          raw: false, // Ensures LaTeX strings are kept exactly as typed strings!
          defval: "",
        });

        if (rawJson.length === 0) {
          toast.error("The selected file contains no question rows.");
          setIsImportValidating(false);
          return;
        }

        // Validate via server action
        const res = await validateQuestionImportAction(rawJson);
        if (res.success && res.data) {
          const importData = res.data as any;
          setImportRows(importData.previewRows);
          setImportSummary({
            validCount: importData.validCount,
            errorCount: importData.errorCount,
            canImport: importData.canImport,
          });
        } else {
          toast.error(res.error || "Failed to validate imported questions");
        }
      } catch (err: any) {
        toast.error("Error reading file: " + (err.message || "Invalid file"));
      } finally {
        setIsImportValidating(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Commit imported rows
  const handleCommitImport = async () => {
    if (!importSummary?.canImport) return;

    startTransition(async () => {
      try {
        const res = await commitQuestionImportAction(importRows);
        if (res.success && res.data) {
          const commitData = res.data as any;
          toast.success(`Successfully imported ${commitData.importedCount} questions!`);
          setImportOpen(false);
          setImportRows([]);
          setImportSummary(null);
          // Refresh list
          window.location.reload();
        } else {
          toast.error(res.error || "Import failed");
        }
      } catch (err: any) {
        toast.error(err.message || "Import failed");
      }
    });
  };

  return (
    <div className="space-y-3 w-full pb-8">
      {/* HEADER & TOP ACTIONS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Question Bank
            </h1>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200/80 text-slate-700 font-semibold">
              {questions.length} Questions
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Build and manage Maths and Science question banks with LaTeX, MCQs, case-studies, and bulk XLSX imports.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={handleDownloadTemplate}
            className="flex items-center gap-1.5 h-7.5 px-2.5 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-all shadow-2xs"
            title="Download Excel Import Template"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span>Download Template</span>
          </button>

          <button
            type="button"
            onClick={() => setImportOpen(true)}
            className="flex items-center gap-1.5 h-7.5 px-2.5 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-all shadow-2xs"
          >
            <Upload className="w-3.5 h-3.5 text-blue-600" />
            <span>Import XLSX</span>
          </button>

          <button
            type="button"
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 h-7.5 px-3 rounded-lg bg-blue-600 text-white text-xs font-bold shadow-2xs hover:bg-blue-700 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Question</span>
          </button>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-2xs space-y-1.5">
        <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
          <Filter className="w-3 h-3" />
          <span>Filters</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {/* Class Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Class</label>
            <select
              value={selectedClass}
              onChange={(e) =>
                setSelectedClass(e.target.value === "all" ? "all" : parseInt(e.target.value, 10))
              }
              className="w-full h-7 text-xs px-2 py-0.5 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white text-slate-800 font-medium"
            >
              <option value="all">All Classes</option>
              <option value="9">Class 9</option>
              <option value="10">Class 10</option>
              <option value="11">Class 11</option>
              <option value="12">Class 12</option>
            </select>
          </div>

          {/* Subject Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Subject</label>
            <select
              value={selectedSubject}
              onChange={(e) => {
                setSelectedSubject(e.target.value);
                setSelectedChapter("all");
              }}
              className="w-full h-7 text-xs px-2 py-0.5 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white text-slate-800 font-medium"
            >
              <option value="all">All Subjects</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Chapter Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Chapter</label>
            <select
              value={selectedChapter}
              onChange={(e) => setSelectedChapter(e.target.value)}
              className="w-full h-7 text-xs px-2 py-0.5 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white text-slate-800 font-medium"
            >
              <option value="all">All Chapters</option>
              {filteredChapters.map((c) => (
                <option key={c.id} value={c.id}>
                  Ch {c.number}: {c.title}
                </option>
              ))}
            </select>
          </div>

          {/* Type Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Type</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full h-7 text-xs px-2 py-0.5 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white text-slate-800 font-medium"
            >
              <option value="all">All Types</option>
              <option value="mcq_single">Single Choice MCQ</option>
              <option value="mcq_multi">Multiple Choice MCQ</option>
              <option value="assertion_reason">Assertion & Reason</option>
              <option value="case_study">Case Study</option>
              <option value="numeric">Numeric Answer</option>
              <option value="true_false">True / False</option>
            </select>
          </div>

          {/* Difficulty Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Difficulty</label>
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="w-full h-7 text-xs px-2 py-0.5 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white text-slate-800 font-medium"
            >
              <option value="all">All Difficulties</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>

          {/* Search Query */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Search Stem / Tag</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-7 text-xs pl-7 pr-2 py-0.5 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white text-slate-900 placeholder:text-slate-400"
              />
            </div>
          </div>
        </div>
      </div>

      {/* QUESTIONS LIST */}
      <div className="space-y-2">
        {filteredQuestions.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200/80 p-8 text-center space-y-2">
            <HelpCircle className="w-8 h-8 text-slate-300 mx-auto" />
            <h3 className="text-xs font-bold text-slate-900">No questions found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No questions matched your current filter criteria. You can clear filters or add a new question.
            </p>
          </div>
        ) : (
          filteredQuestions.map((q, idx) => (
            <div
              key={q.id}
              className="bg-white rounded-xl border border-slate-200/80 p-3 shadow-2xs space-y-2 hover:border-blue-200 transition-all"
            >
              {/* Question Header Chips */}
              <div className="flex flex-wrap items-center justify-between gap-1.5 border-b border-slate-100 pb-1.5">
                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  <span className="font-mono font-bold text-slate-400 text-[11px]">#{idx + 1}</span>
                  <span className="text-[10px] font-bold uppercase px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 border border-blue-200/60">
                    Class {q.classLevel}
                  </span>
                  <span className="text-slate-700 font-semibold text-[11px]">{q.subjectName}</span>
                  {q.chapterTitle && (
                    <span className="text-slate-400 text-[11px]">· {q.chapterTitle}</span>
                  )}
                  <span
                    className={`capitalize text-[10px] font-bold px-1.5 py-0.2 rounded ${
                      q.difficulty === "easy"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : q.difficulty === "medium"
                        ? "bg-amber-50 text-amber-700 border border-amber-200"
                        : "bg-rose-50 text-rose-700 border border-rose-200"
                    }`}
                  >
                    {q.difficulty}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 font-mono font-medium text-slate-700">
                    +{q.marks} / -{q.negativeMarks} marks
                  </span>
                  <span className="text-[10px] text-slate-500 capitalize">
                    {q.type.replace(/_/g, " ")}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(q)}
                    className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                    title="Edit Question"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteQuestion(q.id)}
                    className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    title="Delete Question"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Case Study Passage (if present) */}
              {q.caseGroup?.passage && (
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-200/60 text-xs text-slate-800 space-y-0.5">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                    Case Study Passage
                  </span>
                  <MathText content={q.caseGroup.passage} className="block text-xs leading-relaxed" />
                </div>
              )}

              {/* Question Stem with KaTeX */}
              <div className="text-xs sm:text-sm text-slate-900 font-medium leading-relaxed">
                <MathText content={q.stem} className="block" />
              </div>

              {/* Options Grid (for MCQs) */}
              {q.options && q.options.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-0.5">
                  {q.options.map((opt, optIndex) => {
                    const isCorrect =
                      q.correct === opt.id ||
                      (Array.isArray(q.correct) && q.correct.includes(opt.id));

                    // Format clean label: A, B, C, D instead of OPT_0
                    const label = String.fromCharCode(65 + optIndex);

                    return (
                      <div
                        key={opt.id}
                        className={`flex items-start gap-2 py-1 px-2.5 rounded-lg border text-xs transition-all ${
                          isCorrect
                            ? "border-emerald-300 bg-emerald-50/60 text-emerald-950 font-semibold"
                            : "border-slate-200/80 bg-white text-slate-800"
                        }`}
                      >
                        <span
                          className={`w-4.5 h-4.5 rounded flex items-center justify-center font-mono text-[10px] font-bold shrink-0 ${
                            isCorrect
                              ? "bg-emerald-600 text-white"
                              : "bg-slate-100 text-slate-600 border border-slate-200/60"
                          }`}
                        >
                          {label}
                        </span>
                        <div className="flex-1 min-w-0">
                          <MathText content={opt.text} />
                        </div>
                        {isCorrect && (
                          <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0 mt-0.5" />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Solution preview if present */}
              {q.solution && (
                <div className="p-2 rounded-lg bg-amber-50/50 border border-amber-200/60 text-[11px] text-amber-950 space-y-0.5">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-amber-800">
                    Solution &amp; Explanation
                  </span>
                  <MathText content={q.solution} className="block text-[11px] leading-relaxed" />
                </div>
              )}

              {/* Footer source & tags */}
              <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-400 pt-0.5">
                <div className="flex flex-wrap items-center gap-1.5">
                  {q.source && (
                    <span className="px-1.5 py-0.2 rounded bg-slate-100 font-medium text-slate-600">
                      Source: {q.source}
                    </span>
                  )}
                  {q.competency && (
                    <span className="px-2 py-0.5 rounded bg-surface-subtle font-medium">
                      Competency: {q.competency}
                    </span>
                  )}
                  {q.tags?.map((t) => (
                    <span key={t} className="px-2 py-0.5 rounded bg-surface font-medium text-ink-muted">
                      #{t}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* QUESTION EDITOR MODAL */}
      {editorOpen && (
        <div
          onClick={() => setEditorOpen(false)}
          className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl border border-slate-200/90 shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
          >
            {/* Modal Header */}
            <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <HelpCircle className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    {editingQuestion ? "Edit Question" : "Add Question to Bank"}
                  </h2>
                  <p className="text-xs text-slate-500">
                    Configure question stems with LaTeX math, diagrams, option choices, and step-by-step solutions.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditorOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveQuestion} className="flex-1 overflow-y-auto p-5 space-y-3.5">
              {/* Duplicate Warning Alert */}
              {duplicateWarning.isDuplicate && (
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-body-sm flex items-start gap-2.5">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Possible Duplicate Detected:</span> A question with a very
                    similar statement already exists in this subject:
                    <div className="font-mono text-xs mt-1 text-amber-800 line-clamp-2">
                      &ldquo;{duplicateWarning.stem}&rdquo;
                    </div>
                  </div>
                </div>
              )}

              {/* Class, Subject, Chapter */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Class</label>
                  <select
                    value={formClassLevel}
                    onChange={(e) => setFormClassLevel(parseInt(e.target.value, 10))}
                    className="w-full h-8 px-2.5 text-xs rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white text-slate-800 font-medium"
                  >
                    <option value={9}>Class 9</option>
                    <option value={10}>Class 10</option>
                    <option value={11}>Class 11</option>
                    <option value={12}>Class 12</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Subject</label>
                  <select
                    value={formSubjectId}
                    onChange={(e) => setFormSubjectId(e.target.value)}
                    className="w-full h-8 px-2.5 text-xs rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white text-slate-800 font-medium"
                  >
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Chapter</label>
                  <select
                    value={formChapterId}
                    onChange={(e) => setFormChapterId(e.target.value)}
                    className="w-full h-8 px-2.5 text-xs rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white text-slate-800 font-medium"
                  >
                    <option value="">General / No Chapter</option>
                    {formAvailableChapters.map((c) => (
                      <option key={c.id} value={c.id}>
                        Ch {c.number}: {c.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Question Type, Difficulty, Marks */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Type</label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value)}
                    className="w-full h-8 px-2 text-xs rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white text-slate-800 font-medium"
                  >
                    <option value="mcq_single">Single Choice MCQ</option>
                    <option value="mcq_multi">Multiple Choice MCQ</option>
                    <option value="assertion_reason">Assertion & Reason</option>
                    <option value="case_study">Case Study</option>
                    <option value="numeric">Numeric Answer</option>
                    <option value="true_false">True / False</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Difficulty</label>
                  <select
                    value={formDifficulty}
                    onChange={(e) => setFormDifficulty(e.target.value as any)}
                    className="w-full h-8 px-2 text-xs rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white text-slate-800 font-medium"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Marks (+)</label>
                  <input
                    type="number"
                    step="0.25"
                    min="0"
                    value={formMarks}
                    onChange={(e) => setFormMarks(parseFloat(e.target.value) || 0)}
                    className="w-full h-8 px-2 text-xs rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white text-slate-800 font-medium text-center"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Negative Marks (-)</label>
                  <input
                    type="number"
                    step="0.25"
                    min="0"
                    value={formNegativeMarks}
                    onChange={(e) => setFormNegativeMarks(parseFloat(e.target.value) || 0)}
                    className="w-full h-8 px-2 text-xs rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white text-slate-800 font-medium text-center"
                  />
                </div>
              </div>

              {/* Case Study Passage (if type === case_study) */}
              {formType === "case_study" && (
                <div className="space-y-2">
                  <label className="block text-caption font-bold text-ink">
                    Case Study Passage (Supports LaTeX)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Enter the case-study passage..."
                    value={formPassage}
                    onChange={(e) => setFormPassage(e.target.value)}
                    className="w-full text-body-sm p-3 rounded-xl border border-border font-mono text-ink"
                  />
                  {formPassage.trim() && (
                    <div className="p-3 rounded-xl bg-surface-subtle border border-border">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-ink-muted">
                        Live Passage Preview
                      </span>
                      <MathText content={formPassage} className="block text-body-sm mt-1" />
                    </div>
                  )}
                </div>
              )}

              {/* Question Stem (Supports LaTeX) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-caption font-bold text-ink">
                    Question Stem (Supports LaTeX via $...$ or $$...$$)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploadingImage}
                      className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                    >
                      <ImageIcon className="w-3.5 h-3.5" />
                      <span>{isUploadingImage ? "Uploading..." : "Attach Diagram"}</span>
                    </button>
                  </div>
                </div>

                <textarea
                  rows={4}
                  placeholder="e.g. Find the roots of the quadratic equation: $ax^2 + bx + c = 0$."
                  value={formStem}
                  onChange={(e) => setFormStem(e.target.value)}
                  className="w-full text-body-sm p-3 rounded-xl border border-border font-mono text-ink"
                />

                {/* Live Stem Preview */}
                {formStem.trim() && (
                  <div className="p-3.5 rounded-xl bg-surface-subtle border border-border space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-ink-muted">
                      Live KaTeX Preview
                    </span>
                    <MathText content={formStem} className="block text-body text-ink" />
                  </div>
                )}
              </div>

              {/* Options Editor (MCQ / Assertion Reason) */}
              {formType !== "numeric" && formType !== "true_false" && (
                <div className="space-y-3">
                  <label className="block text-caption font-bold text-ink">
                    Options & Correct Answer
                  </label>
                  <div className="space-y-2">
                    {formOptions.map((opt, oIdx) => (
                      <div key={opt.id} className="flex items-center gap-2">
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="radio"
                            name="correct_option"
                            checked={formCorrect === opt.id}
                            onChange={() => setFormCorrect(opt.id)}
                            className="w-4 h-4 text-primary"
                          />
                          <span className="w-6 font-mono font-bold uppercase text-xs text-ink-muted">
                            {opt.id}.
                          </span>
                        </label>
                        <input
                          type="text"
                          placeholder={`Option ${opt.id.toUpperCase()} text (supports $LaTeX$)`}
                          value={opt.text}
                          onChange={(e) => {
                            const next = [...formOptions];
                            const target = next[oIdx];
                            if (target) {
                              target.text = e.target.value;
                              setFormOptions(next);
                            }
                          }}
                          className="flex-1 text-body-sm px-3 py-2 rounded-xl border border-border text-ink"
                        />
                        {/* Live mini KaTeX preview of option */}
                        {opt.text.trim() && (
                          <div className="max-w-xs px-2.5 py-1 rounded-lg bg-surface-subtle border border-border text-xs truncate">
                            <MathText content={opt.text} />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Numeric / True-False answer inputs */}
              {formType === "numeric" && (
                <div>
                  <label className="block text-caption font-bold text-ink mb-1">
                    Correct Numeric Value
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 14.5 or -3"
                    value={String(formCorrect || "")}
                    onChange={(e) => setFormCorrect(e.target.value)}
                    className="w-full text-body-sm px-3 py-2 rounded-xl border border-border text-ink"
                  />
                </div>
              )}

              {formType === "true_false" && (
                <div>
                  <label className="block text-caption font-bold text-ink mb-1">Correct State</label>
                  <select
                    value={String(formCorrect)}
                    onChange={(e) => setFormCorrect(e.target.value)}
                    className="w-full text-body-sm px-3 py-2 rounded-xl border border-border text-ink"
                  >
                    <option value="true">True</option>
                    <option value="false">False</option>
                  </select>
                </div>
              )}

              {/* Solution & Explanation */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-semibold text-slate-700">
                  Solution &amp; Explanation (Supports LaTeX)
                </label>
                <textarea
                  rows={2.5}
                  placeholder="Step-by-step mathematical derivation or reason..."
                  value={formSolution}
                  onChange={(e) => setFormSolution(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white font-mono text-slate-800"
                />
                {formSolution.trim() && (
                  <div className="p-2.5 rounded-lg bg-amber-50/60 border border-amber-200">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800">
                      Live Solution Preview
                    </span>
                    <MathText content={formSolution} className="block text-xs text-amber-950 mt-1" />
                  </div>
                )}
              </div>

              {/* Source, Tags, Competency */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Source</label>
                  <input
                    type="text"
                    placeholder="e.g. Dinesh Sir — Ch 6 deck"
                    value={formSource}
                    onChange={(e) => setFormSource(e.target.value)}
                    className="w-full h-8 px-2.5 text-xs rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white text-slate-800 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Tags (Comma-separated)</label>
                  <input
                    type="text"
                    placeholder="Calculus, Integrals, Board 2026"
                    value={formTags}
                    onChange={(e) => setFormTags(e.target.value)}
                    className="w-full h-8 px-2.5 text-xs rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white text-slate-800 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Competency</label>
                  <input
                    type="text"
                    placeholder="Application, Analysis, Recall"
                    value={formCompetency}
                    onChange={(e) => setFormCompetency(e.target.value)}
                    className="w-full h-8 px-2.5 text-xs rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white text-slate-800 font-medium"
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditorOpen(false)}
                  className="h-8 px-3 text-xs rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="h-8 px-3.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-2xs flex items-center gap-1.5 transition-all"
                >
                  {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingQuestion ? "Save Changes" : "Create Question"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* IMPORT XLSX / CSV MODAL */}
      {importOpen && (
        <div
          onClick={() => setImportOpen(false)}
          className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-xl border border-slate-200/90 shadow-2xl max-w-5xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50/70">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Import Questions from XLSX / CSV</h2>
                  <p className="text-xs text-slate-500">
                    Bulk import questions with LaTeX equations, options, difficulty, and solutions.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setImportOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 flex-1">
              {/* File upload dropzone */}
              <div className="border-2 border-dashed border-border rounded-2xl p-6 text-center space-y-3 hover:border-primary/50 transition-colors">
                <FileSpreadsheet className="w-10 h-10 text-primary mx-auto" />
                <div>
                  <span className="font-bold text-ink text-body-sm">
                    Upload your questions Excel (.xlsx) or CSV file
                  </span>
                  <p className="text-caption text-ink-muted mt-0.5">
                    Columns: class, subject, chapter_no, type, stem, option_a..d, correct, solution, difficulty, marks, negative_marks, tags, source, competency, case_group, passage
                  </p>
                </div>
                <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-body-sm font-bold cursor-pointer hover:bg-primary/90 transition-all shadow-xs">
                  <Upload className="w-4 h-4" />
                  <span>Select File</span>
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Validation Status Banner */}
              {isImportValidating && (
                <div className="flex items-center justify-center gap-2 p-6 text-ink-muted text-body-sm">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  <span>Validating question bank rows and LaTeX expressions...</span>
                </div>
              )}

              {importSummary && (
                <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-surface-subtle">
                  <div className="flex items-center gap-3">
                    <span className="text-body-sm font-bold text-ink">
                      {importRows.length} Total Rows Previewed
                    </span>
                    <Badge variant="success" className="font-bold">
                      {importSummary.validCount} Valid
                    </Badge>
                    {importSummary.errorCount > 0 && (
                      <Badge variant="critical" className="font-bold">
                        {importSummary.errorCount} Errors
                      </Badge>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleCommitImport}
                    disabled={!importSummary.canImport || isPending}
                    className="flex items-center gap-2 px-5 py-2 rounded-xl bg-primary text-white text-body-sm font-bold shadow-xs hover:bg-primary/90 disabled:opacity-50"
                  >
                    {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                    <span>Save {importSummary.validCount} Questions</span>
                  </button>
                </div>
              )}

              {/* Rows Preview Table */}
              {importRows.length > 0 && (
                <div className="border border-border rounded-xl overflow-x-auto max-h-96">
                  <table className="w-full text-left border-collapse text-body-sm">
                    <thead className="bg-surface-subtle text-[11px] font-bold text-ink-muted uppercase tracking-wider sticky top-0 border-b border-border">
                      <tr>
                        <th className="p-3">#</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Class/Subject</th>
                        <th className="p-3">Stem (Live KaTeX Preview)</th>
                        <th className="p-3">Options</th>
                        <th className="p-3">Correct</th>
                        <th className="p-3">Marks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {importRows.map((row) => (
                        <tr
                          key={row.rowIndex}
                          className={row.errors.length > 0 ? "bg-red-50/50" : "hover:bg-surface-subtle"}
                        >
                          <td className="p-3 font-mono text-xs text-ink-muted">
                            {row.rowIndex}
                          </td>
                          <td className="p-3">
                            {row.errors.length === 0 ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <div className="space-y-0.5">
                                <XCircle className="w-4 h-4 text-rose-600" />
                                <span className="block text-[10px] text-rose-700 font-medium">
                                  {row.errors[0]}
                                </span>
                              </div>
                            )}
                          </td>
                          <td className="p-3 whitespace-nowrap text-xs">
                            <div className="font-semibold text-ink">Class {row.classLevel}</div>
                            <div className="text-ink-muted">{row.subjectName}</div>
                          </td>
                          <td className="p-3 max-w-md">
                            <MathText content={row.stem} className="line-clamp-2 text-xs" />
                          </td>
                          <td className="p-3 text-xs max-w-xs">
                            {row.options.length > 0 ? (
                              <span className="text-ink-muted">{row.options.length} options</span>
                            ) : (
                              <span className="text-ink-muted capitalize">{row.type}</span>
                            )}
                          </td>
                          <td className="p-3 font-mono font-bold text-xs uppercase text-primary">
                            {String(row.correct)}
                          </td>
                          <td className="p-3 font-mono text-xs">
                            +{row.marks} / -{row.negativeMarks}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-border flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setImportOpen(false)}
                className="px-4 py-2 rounded-xl border border-border text-body-sm font-semibold text-ink hover:bg-surface-subtle"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
