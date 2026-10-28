"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  saveFacultyMemberAction,
  saveTestimonialAction,
  saveResultAction,
  saveSiteSettingAction,
} from "@/server/admin-actions";
import {
  Users,
  Award,
  MessageSquareQuote,
  Settings,
  Plus,
  Edit,
  CheckCircle2,
  AlertCircle,
  Globe,
  Phone,
} from "lucide-react";

export interface FacultyItem {
  id: string;
  name: string;
  slug: string;
  designation: string;
  bio: string;
  photoKey: string | null;
  sortOrder: number;
  isPublished: boolean;
}

export interface TestimonialItem {
  id: string;
  studentName: string;
  classLevel: number;
  year: number;
  quote: string;
  photoKey: string | null;
  isPublished: boolean;
  sortOrder: number;
}

export interface ResultItem {
  id: string;
  studentName: string;
  exam: string;
  year: number;
  scoreText: string;
  photoKey: string | null;
  isFeatured: boolean;
  sortOrder: number;
}

export interface AnnouncementBarSetting {
  enabled: boolean;
  text: string;
  link_text: string;
  link_url: string;
}

export interface ContactSetting {
  phone: string;
  whatsapp: string;
  email: string;
  support_hours: string;
}

export interface SocialSetting {
  youtube: string;
  instagram: string;
  facebook: string;
  twitter?: string;
}

export interface HeroTilesSetting {
  badge_new_lecture?: string;
  badge_batch?: string;
  results_title: string;
  results_subtitle: string;
}

interface ContentManagerClientProps {
  initialFaculty: FacultyItem[];
  initialTestimonials: TestimonialItem[];
  initialResults: ResultItem[];
  initialSettings: Record<string, unknown>;
}


export function ContentManagerClient({
  initialFaculty,
  initialTestimonials,
  initialResults,
  initialSettings,
}: ContentManagerClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<
    "faculty" | "testimonials" | "results" | "settings"
  >("faculty");

  // Notifications
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // -------------------------------------------------------------
  // TAB 1: FACULTY STATE
  // -------------------------------------------------------------
  const [facultyModalOpen, setFacultyModalOpen] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState<FacultyItem | null>(null);
  const [facName, setFacName] = useState("");
  const [facSlug, setFacSlug] = useState("");
  const [facDesignation, setFacDesignation] = useState("");
  const [facBio, setFacBio] = useState("");
  const [facPhotoKey, setFacPhotoKey] = useState("");
  const [facOrder, setFacOrder] = useState(0);

  const openFacultyModal = (item?: FacultyItem) => {
    if (item) {
      setEditingFaculty(item);
      setFacName(item.name);
      setFacSlug(item.slug);
      setFacDesignation(item.designation);
      setFacBio(item.bio);
      setFacPhotoKey(item.photoKey || "");
      setFacOrder(item.sortOrder);
    } else {
      setEditingFaculty(null);
      setFacName("");
      setFacSlug("");
      setFacDesignation("Senior Faculty · Mathematics");
      setFacBio("");
      setFacPhotoKey("");
      setFacOrder(initialFaculty.length);
    }
    setFacultyModalOpen(true);
  };

  const handleSaveFaculty = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatusMessage(null);
    setErrorMessage(null);
    try {
      const res = await saveFacultyMemberAction({
        id: editingFaculty?.id,
        name: facName.trim(),
        slug: facSlug.trim() || facName.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        designation: facDesignation.trim(),
        bio: facBio.trim(),
        photoKey: facPhotoKey || undefined,
        sortOrder: facOrder,
        isPublished: true,
      });
      if (!res.success) throw new Error(res.error || "Failed to save faculty");
      setStatusMessage(`Faculty member "${facName}" saved successfully.`);
      setFacultyModalOpen(false);
      router.refresh();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Save failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  // -------------------------------------------------------------
  // TAB 2: TESTIMONIALS STATE
  // -------------------------------------------------------------
  const [testModalOpen, setTestModalOpen] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState<TestimonialItem | null>(null);
  const [testName, setTestName] = useState("");
  const [testClass, setTestClass] = useState(12);
  const [testYear, setTestYear] = useState(2025);
  const [testQuote, setTestQuote] = useState("");
  const [testPhotoKey, setTestPhotoKey] = useState("");
  const [testOrder, setTestOrder] = useState(0);

  const openTestimonialModal = (item?: TestimonialItem) => {
    if (item) {
      setEditingTestimonial(item);
      setTestName(item.studentName);
      setTestClass(item.classLevel);
      setTestYear(item.year);
      setTestQuote(item.quote);
      setTestPhotoKey(item.photoKey || "");
      setTestOrder(item.sortOrder);
    } else {
      setEditingTestimonial(null);
      setTestName("");
      setTestClass(12);
      setTestYear(new Date().getFullYear());
      setTestQuote("");
      setTestPhotoKey("");
      setTestOrder(initialTestimonials.length);
    }
    setTestModalOpen(true);
  };

  const handleSaveTestimonial = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatusMessage(null);
    setErrorMessage(null);
    try {
      const res = await saveTestimonialAction({
        id: editingTestimonial?.id,
        studentName: testName.trim(),
        classLevel: Number(testClass),
        year: Number(testYear),
        quote: testQuote.trim(),
        photoKey: testPhotoKey || undefined,
        sortOrder: testOrder,
        isPublished: true,
      });
      if (!res.success) throw new Error(res.error || "Failed to save testimonial");
      setStatusMessage(`Testimonial from "${testName}" saved successfully.`);
      setTestModalOpen(false);
      router.refresh();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Save failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  // -------------------------------------------------------------
  // TAB 3: RESULTS STATE
  // -------------------------------------------------------------
  const [resultModalOpen, setResultModalOpen] = useState(false);
  const [editingResult, setEditingResult] = useState<ResultItem | null>(null);
  const [resName, setResName] = useState("");
  const [resExam, setResExam] = useState("CBSE Class 12 Board");
  const [resYear, setResYear] = useState(2025);
  const [resScore, setResScore] = useState("98/100 (100% in Math)");
  const [resFeatured, setResFeatured] = useState(true);
  const [resPhotoKey, setResPhotoKey] = useState("");
  const [resOrder, setResOrder] = useState(0);

  const openResultModal = (item?: ResultItem) => {
    if (item) {
      setEditingResult(item);
      setResName(item.studentName);
      setResExam(item.exam);
      setResYear(item.year);
      setResScore(item.scoreText);
      setResFeatured(item.isFeatured);
      setResPhotoKey(item.photoKey || "");
      setResOrder(item.sortOrder);
    } else {
      setEditingResult(null);
      setResName("");
      setResExam("CBSE Class 12 Board");
      setResYear(new Date().getFullYear());
      setResScore("98/100 (100% in Math)");
      setResFeatured(true);
      setResPhotoKey("");
      setResOrder(initialResults.length);
    }
    setResultModalOpen(true);
  };

  const handleSaveResult = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatusMessage(null);
    setErrorMessage(null);
    try {
      const res = await saveResultAction({
        id: editingResult?.id,
        studentName: resName.trim(),
        exam: resExam.trim(),
        year: Number(resYear),
        scoreText: resScore.trim(),
        photoKey: resPhotoKey || undefined,
        isFeatured: resFeatured,
        sortOrder: resOrder,
      });
      if (!res.success) throw new Error(res.error || "Failed to save result");
      setStatusMessage(`Exam result for "${resName}" saved successfully.`);
      setResultModalOpen(false);
      router.refresh();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Save failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  // -------------------------------------------------------------
  // TAB 4: SITE SETTINGS STATE
  // -------------------------------------------------------------
  const [announcementBar, setAnnouncementBar] = useState<AnnouncementBarSetting>(
    (initialSettings.announcement_bar as AnnouncementBarSetting | undefined) || {
      enabled: true,
      text: "New Class XII CBSE Mathematics batch admissions now open!",
      link_text: "Enquire Now",
      link_url: "/#inquire",
    },
  );

  const [contactSettings, setContactSettings] = useState<ContactSetting>(
    (initialSettings.contact as ContactSetting | undefined) || {
      phone: "+91 76688 75809",
      whatsapp: "+91 76688 75809",
      email: "quick2learn23203@gmail.com",
      support_hours: "Mon–Sat 9:00 AM – 7:00 PM IST",
    },
  );

  const [socialSettings, setSocialSettings] = useState<SocialSetting>(
    (initialSettings.socials as SocialSetting | undefined) || {
      youtube: "https://www.youtube.com/@Quick2Learn",
      facebook: "https://facebook.com/quick2learn.in",
      instagram: "https://instagram.com/quick2learn.in",
      twitter: "https://twitter.com/Quick2Learn",
    },
  );

  const [heroTilesSettings, setHeroTilesSettings] = useState<HeroTilesSetting>(
    (initialSettings.hero_tiles as HeroTilesSetting | undefined) || {
      badge_new_lecture: "Newest Lecture",
      badge_batch: "Admissions open",
      results_title: "100/100 Top Score & 98.4% Distinction Rate",
      results_subtitle: "Recognised by the HRD Minister for outstanding CBSE board results.",
    },
  );

  const handleSaveSetting = async (key: string, value: unknown) => {
    setIsSubmitting(true);
    setStatusMessage(null);
    setErrorMessage(null);
    try {
      const res = await saveSiteSettingAction(key, value);
      if (!res.success) throw new Error(res.error || `Failed to update ${key}`);
      setStatusMessage(`Site setting "${key}" updated successfully.`);
      router.refresh();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to save setting");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Alert Notices */}
      {statusMessage && (
        <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span className="font-semibold">{statusMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="font-semibold">{errorMessage}</span>
        </div>
      )}

      {/* Navigation Tabs Bar */}
      <div className="flex items-center gap-1.5 border-b border-slate-200/80 pb-2.5 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab("faculty")}
          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
            activeTab === "faculty"
              ? "bg-blue-600 text-white shadow-2xs font-bold"
              : "bg-white border border-slate-200/80 text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-medium"
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Faculty</span>
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
              activeTab === "faculty"
                ? "bg-blue-700/80 text-white"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            {initialFaculty.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("testimonials")}
          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
            activeTab === "testimonials"
              ? "bg-blue-600 text-white shadow-2xs font-bold"
              : "bg-white border border-slate-200/80 text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-medium"
          }`}
        >
          <MessageSquareQuote className="w-3.5 h-3.5" />
          <span>Testimonials</span>
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
              activeTab === "testimonials"
                ? "bg-blue-700/80 text-white"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            {initialTestimonials.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("results")}
          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
            activeTab === "results"
              ? "bg-blue-600 text-white shadow-2xs font-bold"
              : "bg-white border border-slate-200/80 text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-medium"
          }`}
        >
          <Award className="w-3.5 h-3.5" />
          <span>Hall of Fame</span>
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
              activeTab === "results"
                ? "bg-blue-700/80 text-white"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            {initialResults.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("settings")}
          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
            activeTab === "settings"
              ? "bg-blue-600 text-white shadow-2xs font-bold"
              : "bg-white border border-slate-200/80 text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-medium"
          }`}
        >
          <Settings className="w-3.5 h-3.5" />
          <span>Site Settings</span>
        </button>
      </div>

      {/* TAB 1: FACULTY */}
      {activeTab === "faculty" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xs sm:text-sm font-bold text-slate-900">Faculty Directory</h2>
              <p className="text-[11px] text-slate-500">Manage instructor bios, designations, and public profile routes.</p>
            </div>
            <Button
              size="sm"
              onClick={() => openFacultyModal()}
              className="h-8 px-3 text-xs gap-1.5 font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" /> Add Faculty
            </Button>
          </div>

          {initialFaculty.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center space-y-2">
              <Users className="w-8 h-8 text-slate-400 mx-auto opacity-60" />
              <p className="text-xs text-slate-500">No faculty members found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
              {initialFaculty.map((f) => {
                const initials = f.name
                  .replace(/^(Mr\.|Mrs\.|Ms\.|Dr\.|Prof\.)\s+/i, "")
                  .split(/\s+/)
                  .map((w) => w[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase() || "FC";

                return (
                  <div
                    key={f.id}
                    className="p-4 rounded-xl border border-slate-200/80 bg-white shadow-2xs hover:border-slate-300 hover:shadow-xs transition-all flex flex-col justify-between space-y-3"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-start justify-between gap-2.5">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <h3 className="text-xs sm:text-sm font-bold text-slate-900 truncate">{f.name}</h3>
                            <p className="text-[11px] font-semibold text-blue-600 truncate mt-0.5">{f.designation}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => openFacultyModal(f)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors shrink-0"
                          title="Edit Faculty"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-50/70 border border-slate-100 text-xs text-slate-600 line-clamp-3 leading-relaxed">
                        {f.bio}
                      </div>
                    </div>
                    <div className="text-[10px] font-mono text-slate-500 pt-2 border-t border-slate-100 flex items-center justify-between">
                      <span className="truncate max-w-[150px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">/{f.slug}</span>
                      <span className="shrink-0 font-medium text-slate-500">
                        Order: <strong className="text-slate-800">{f.sortOrder}</strong>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Faculty Edit Modal */}
          {facultyModalOpen && (
            <div
              onClick={() => setFacultyModalOpen(false)}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150"
            >
              <div
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-md rounded-xl bg-white p-5 border border-slate-200/90 shadow-2xl space-y-3.5 animate-in zoom-in-95 duration-150"
              >
                <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
                  {editingFaculty ? "Edit Faculty Member" : "New Faculty Member"}
                </h3>
                <form onSubmit={handleSaveFaculty} className="space-y-2.5">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Full Name</label>
                    <Input
                      value={facName}
                      onChange={(e) => setFacName(e.target.value)}
                      placeholder="e.g. Dinesh Sir"
                      className="h-8 text-xs rounded-lg border-slate-200"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Designation</label>
                    <Input
                      value={facDesignation}
                      onChange={(e) => setFacDesignation(e.target.value)}
                      placeholder="e.g. Founder & Lead Mathematics Faculty"
                      className="h-8 text-xs rounded-lg border-slate-200"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Biography</label>
                    <Textarea
                      rows={3}
                      value={facBio}
                      onChange={(e) => setFacBio(e.target.value)}
                      placeholder="25+ years legacy of training CBSE and board toppers..."
                      className="text-xs rounded-lg border-slate-200"
                      required
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setFacultyModalOpen(false)}
                      className="h-8 px-3 text-xs rounded-lg border-slate-200"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      size="sm"
                      disabled={isSubmitting}
                      className="h-8 px-3 text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-2xs"
                    >
                      Save Faculty
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: TESTIMONIALS */}
      {activeTab === "testimonials" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xs sm:text-sm font-bold text-slate-900">Student Testimonials</h2>
              <p className="text-[11px] text-slate-500">Reviews and feedback showcased on public course pages and landing sections.</p>
            </div>
            <Button
              size="sm"
              onClick={() => openTestimonialModal()}
              className="h-8 px-3 text-xs gap-1.5 font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" /> Add Testimonial
            </Button>
          </div>

          {initialTestimonials.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center space-y-2">
              <MessageSquareQuote className="w-8 h-8 text-slate-400 mx-auto opacity-60" />
              <p className="text-xs text-slate-500">No testimonials found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
              {initialTestimonials.map((t) => {
                const initials = t.studentName
                  .split(/\s+/)
                  .map((w) => w[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase() || "ST";

                return (
                  <div
                    key={t.id}
                    className="p-4 rounded-xl border border-slate-200/80 bg-white shadow-2xs hover:border-slate-300 hover:shadow-xs transition-all flex flex-col justify-between space-y-3"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-start justify-between gap-2.5">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-600 to-teal-700 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <h3 className="text-xs sm:text-sm font-bold text-slate-900 truncate">{t.studentName}</h3>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                                Class {t.classLevel}
                              </span>
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-slate-100 text-slate-600">
                                {t.year}
                              </span>
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => openTestimonialModal(t)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 hover:text-blue-600 transition-colors shrink-0"
                          title="Edit Testimonial"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-50/70 border border-slate-100 text-xs text-slate-600 italic line-clamp-3 leading-relaxed">
                        &ldquo;{t.quote}&rdquo;
                      </div>
                    </div>
                    <div className="text-[10px] font-mono text-slate-400 pt-2 border-t border-slate-100 flex items-center justify-between">
                      <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold font-sans text-[11px]">
                        ✓ Verified Student
                      </span>
                      <span className="font-medium text-slate-500">
                        Order: <strong className="text-slate-800">{t.sortOrder}</strong>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Testimonial Edit Modal */}
          {testModalOpen && (
            <div
              onClick={() => setTestModalOpen(false)}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150"
            >
              <div
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-md rounded-xl bg-white p-5 border border-slate-200/90 shadow-2xl space-y-3.5 animate-in zoom-in-95 duration-150"
              >
                <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
                  {editingTestimonial ? "Edit Testimonial" : "New Testimonial"}
                </h3>
                <form onSubmit={handleSaveTestimonial} className="space-y-2.5">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Student Name</label>
                    <Input
                      value={testName}
                      onChange={(e) => setTestName(e.target.value)}
                      className="h-8 text-xs rounded-lg border-slate-200"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700">Class Level</label>
                      <Input
                        type="number"
                        value={testClass}
                        onChange={(e) => setTestClass(Number(e.target.value))}
                        className="h-8 text-xs rounded-lg border-slate-200"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700">Year</label>
                      <Input
                        type="number"
                        value={testYear}
                        onChange={(e) => setTestYear(Number(e.target.value))}
                        className="h-8 text-xs rounded-lg border-slate-200"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Student Quote</label>
                    <Textarea
                      rows={3}
                      value={testQuote}
                      onChange={(e) => setTestQuote(e.target.value)}
                      className="text-xs rounded-lg border-slate-200"
                      required
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setTestModalOpen(false)}
                      className="h-8 px-3 text-xs rounded-lg border-slate-200"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      size="sm"
                      disabled={isSubmitting}
                      className="h-8 px-3 text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-2xs"
                    >
                      Save Testimonial
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: RESULTS & HALL OF FAME */}
      {activeTab === "results" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xs sm:text-sm font-bold text-slate-900">Hall of Fame &amp; Exam Results</h2>
              <p className="text-[11px] text-slate-500">Board exam high scorers and merit achievers displayed on homepage results banner.</p>
            </div>
            <Button
              size="sm"
              onClick={() => openResultModal()}
              className="h-8 px-3 text-xs gap-1.5 font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" /> Add Result
            </Button>
          </div>

          {initialResults.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center space-y-2">
              <Award className="w-8 h-8 text-slate-400 mx-auto opacity-60" />
              <p className="text-xs text-slate-500">No student results records found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
              {initialResults.map((r) => {
                const initials = r.studentName
                  .split(/\s+/)
                  .map((w) => w[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase() || "ST";

                return (
                  <div
                    key={r.id}
                    className="p-4 rounded-xl border border-slate-200/80 bg-white shadow-2xs hover:border-slate-300 hover:shadow-xs transition-all flex flex-col justify-between space-y-3"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-start justify-between gap-2.5">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <h3 className="text-xs sm:text-sm font-bold text-slate-900 truncate">{r.studentName}</h3>
                            <p className="text-[11px] font-semibold text-slate-500 truncate mt-0.5">
                              {r.exam} ({r.year})
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => openResultModal(r)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 hover:text-blue-600 transition-colors shrink-0"
                          title="Edit Result"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="p-2.5 rounded-lg bg-amber-50/70 border border-amber-200/80 text-center">
                        <span className="text-xs font-bold font-mono text-amber-900 tracking-tight">
                          {r.scoreText}
                        </span>
                      </div>
                    </div>
                    <div className="text-[10px] font-mono text-slate-400 pt-2 border-t border-slate-100 flex items-center justify-between">
                      <span className={`inline-flex items-center gap-1 font-sans text-[11px] ${r.isFeatured ? "text-amber-600 font-bold" : "text-slate-500 font-medium"}`}>
                        {r.isFeatured ? "★ Featured Banner" : "Standard"}
                      </span>
                      <span className="font-medium text-slate-500">
                        Order: <strong className="text-slate-800">{r.sortOrder}</strong>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Result Edit Modal */}
          {resultModalOpen && (
            <div
              onClick={() => setResultModalOpen(false)}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150"
            >
              <div
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-md rounded-xl bg-white p-5 border border-slate-200/90 shadow-2xl space-y-3.5 animate-in zoom-in-95 duration-150"
              >
                <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
                  {editingResult ? "Edit Result Record" : "New Result Record"}
                </h3>
                <form onSubmit={handleSaveResult} className="space-y-2.5">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Student Name</label>
                    <Input
                      value={resName}
                      onChange={(e) => setResName(e.target.value)}
                      className="h-8 text-xs rounded-lg border-slate-200"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700">Exam</label>
                      <Input
                        value={resExam}
                        onChange={(e) => setResExam(e.target.value)}
                        placeholder="CBSE 12th Board"
                        className="h-8 text-xs rounded-lg border-slate-200"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700">Year</label>
                      <Input
                        type="number"
                        value={resYear}
                        onChange={(e) => setResYear(Number(e.target.value))}
                        className="h-8 text-xs rounded-lg border-slate-200"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">
                      Score Text (e.g. 100/100 or 98.4%)
                    </label>
                    <Input
                      value={resScore}
                      onChange={(e) => setResScore(e.target.value)}
                      className="h-8 text-xs rounded-lg border-slate-200"
                      required
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setResultModalOpen(false)}
                      className="h-8 px-3 text-xs rounded-lg border-slate-200"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      size="sm"
                      disabled={isSubmitting}
                      className="h-8 px-3 text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-2xs"
                    >
                      Save Result
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: SITE SETTINGS */}
      {activeTab === "settings" && (
        <div className="space-y-4 max-w-3xl">
          {/* Announcement Bar */}
          <div className="rounded-xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-2xs space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
                <Globe className="w-4 h-4 text-blue-600" />
                <span>Global Announcement Bar (Top of Site)</span>
              </h3>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={announcementBar.enabled}
                  onChange={(e) =>
                    setAnnouncementBar({ ...announcementBar, enabled: e.target.checked })
                  }
                  className="w-3.5 h-3.5 rounded text-blue-600 focus:ring-blue-500"
                />
                <span className="text-[11px] font-semibold text-slate-700">Show Bar</span>
              </label>
            </div>

            <div className="space-y-2.5">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-700">Bar Text</label>
                <Input
                  value={announcementBar.text || ""}
                  onChange={(e) =>
                    setAnnouncementBar({ ...announcementBar, text: e.target.value })
                  }
                  className="h-8 text-xs rounded-lg border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white text-slate-800"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-700">Link Label</label>
                  <Input
                    value={announcementBar.link_text || ""}
                    onChange={(e) =>
                      setAnnouncementBar({ ...announcementBar, link_text: e.target.value })
                    }
                    className="h-8 text-xs rounded-lg border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white text-slate-800"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-700">Link Destination</label>
                  <Input
                    value={announcementBar.link_url || ""}
                    onChange={(e) =>
                      setAnnouncementBar({ ...announcementBar, link_url: e.target.value })
                    }
                    className="h-8 text-xs rounded-lg border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white text-slate-800"
                  />
                </div>
              </div>

              <div className="pt-2 text-right">
                <Button
                  size="sm"
                  onClick={() => handleSaveSetting("announcement_bar", announcementBar)}
                  disabled={isSubmitting}
                  className="h-8 px-3.5 text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-2xs"
                >
                  Save Announcement Bar
                </Button>
              </div>
            </div>
          </div>

          {/* Contact Details */}
          <div className="rounded-xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-2xs space-y-3.5">
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2.5">
              <Phone className="w-4 h-4 text-blue-600" />
              <span>Contact &amp; Helpdesk</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-700">Phone</label>
                <Input
                  value={contactSettings.phone || ""}
                  onChange={(e) =>
                    setContactSettings({ ...contactSettings, phone: e.target.value })
                  }
                  className="h-8 text-xs rounded-lg border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white text-slate-800"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-700">WhatsApp</label>
                <Input
                  value={contactSettings.whatsapp || ""}
                  onChange={(e) =>
                    setContactSettings({ ...contactSettings, whatsapp: e.target.value })
                  }
                  className="h-8 text-xs rounded-lg border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white text-slate-800"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-700">Email</label>
                <Input
                  value={contactSettings.email || ""}
                  onChange={(e) =>
                    setContactSettings({ ...contactSettings, email: e.target.value })
                  }
                  className="h-8 text-xs rounded-lg border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white text-slate-800"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-700">Support Hours</label>
                <Input
                  value={contactSettings.support_hours || ""}
                  onChange={(e) =>
                    setContactSettings({ ...contactSettings, support_hours: e.target.value })
                  }
                  className="h-8 text-xs rounded-lg border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white text-slate-800"
                />
              </div>
            </div>

            <div className="pt-2 text-right">
              <Button
                size="sm"
                onClick={() => handleSaveSetting("contact", contactSettings)}
                disabled={isSubmitting}
                className="h-8 px-3.5 text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-2xs"
              >
                Save Contact Details
              </Button>
            </div>
          </div>

          {/* Social Links */}
          <div className="rounded-xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-2xs space-y-3.5">
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2.5">
              <Globe className="w-4 h-4 text-blue-600" />
              <span>Social Channels</span>
            </h3>

            <div className="space-y-2.5">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-700">YouTube Channel URL</label>
                <Input
                  value={socialSettings.youtube || ""}
                  onChange={(e) =>
                    setSocialSettings({ ...socialSettings, youtube: e.target.value })
                  }
                  className="h-8 text-xs rounded-lg border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white text-slate-800"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-700">Facebook URL</label>
                <Input
                  value={socialSettings.facebook || ""}
                  onChange={(e) =>
                    setSocialSettings({ ...socialSettings, facebook: e.target.value })
                  }
                  className="h-8 text-xs rounded-lg border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white text-slate-800"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-700">Instagram URL</label>
                <Input
                  value={socialSettings.instagram || ""}
                  onChange={(e) =>
                    setSocialSettings({ ...socialSettings, instagram: e.target.value })
                  }
                  className="h-8 text-xs rounded-lg border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white text-slate-800"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-700">Twitter / X URL</label>
                <Input
                  value={socialSettings.twitter || ""}
                  onChange={(e) =>
                    setSocialSettings({ ...socialSettings, twitter: e.target.value })
                  }
                  className="h-8 text-xs rounded-lg border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white text-slate-800"
                />
              </div>
            </div>

            <div className="pt-2 text-right">
              <Button
                size="sm"
                onClick={() => handleSaveSetting("socials", socialSettings)}
                disabled={isSubmitting}
                className="h-8 px-3.5 text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-2xs"
              >
                Save Social Links
              </Button>
            </div>
          </div>

          {/* Hero Tiles */}
          <div className="rounded-xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-2xs space-y-3.5">
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2.5">
              <Globe className="w-4 h-4 text-blue-600" />
              <span>Hero Tiles &amp; Hall of Fame Banner</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-700">Results Headline</label>
                <Input
                  value={heroTilesSettings.results_title || ""}
                  onChange={(e) =>
                    setHeroTilesSettings({
                      ...heroTilesSettings,
                      results_title: e.target.value,
                    })
                  }
                  className="h-8 text-xs rounded-lg border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white text-slate-800"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-700">Results Subtitle</label>
                <Input
                  value={heroTilesSettings.results_subtitle || ""}
                  onChange={(e) =>
                    setHeroTilesSettings({
                      ...heroTilesSettings,
                      results_subtitle: e.target.value,
                    })
                  }
                  className="h-8 text-xs rounded-lg border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white text-slate-800"
                />
              </div>
            </div>

            <div className="pt-2 text-right">
              <Button
                size="sm"
                onClick={() => handleSaveSetting("hero_tiles", heroTilesSettings)}
                disabled={isSubmitting}
                className="h-8 px-3.5 text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-2xs"
              >
                Save Hero Tiles
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
