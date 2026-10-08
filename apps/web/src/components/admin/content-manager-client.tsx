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
      phone: "+91-9897000000",
      whatsapp: "+91-9897000000",
      email: "contact@quick2learn.in",
      support_hours: "Mon–Sat 9:00 AM – 7:00 PM IST",
    },
  );

  const [socialSettings, setSocialSettings] = useState<SocialSetting>(
    (initialSettings.socials as SocialSetting | undefined) || {
      youtube: "https://www.youtube.com/@Quick2Learn",
      instagram: "https://instagram.com/quick2learn",
      facebook: "https://facebook.com/quick2learn",
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
    <div className="space-y-6">
      {/* Alert Notices */}
      {statusMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-body-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span className="font-semibold">{statusMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-critical/10 border border-critical/30 text-critical text-body-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="font-semibold">{errorMessage}</span>
        </div>
      )}

      {/* Navigation Tabs Bar */}
      <div className="flex items-center gap-2 border-b border-border pb-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab("faculty")}
          className={`flex items-center gap-2 px-3.5 py-2 text-body-sm font-semibold rounded-xl transition-colors whitespace-nowrap ${
            activeTab === "faculty"
              ? "bg-primary text-white"
              : "text-ink-muted hover:text-ink hover:bg-surface-subtle"
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Faculty ({initialFaculty.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("testimonials")}
          className={`flex items-center gap-2 px-3.5 py-2 text-body-sm font-semibold rounded-xl transition-colors whitespace-nowrap ${
            activeTab === "testimonials"
              ? "bg-primary text-white"
              : "text-ink-muted hover:text-ink hover:bg-surface-subtle"
          }`}
        >
          <MessageSquareQuote className="w-4 h-4" />
          <span>Testimonials ({initialTestimonials.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("results")}
          className={`flex items-center gap-2 px-3.5 py-2 text-body-sm font-semibold rounded-xl transition-colors whitespace-nowrap ${
            activeTab === "results"
              ? "bg-primary text-white"
              : "text-ink-muted hover:text-ink hover:bg-surface-subtle"
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Hall of Fame ({initialResults.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("settings")}
          className={`flex items-center gap-2 px-3.5 py-2 text-body-sm font-semibold rounded-xl transition-colors whitespace-nowrap ${
            activeTab === "settings"
              ? "bg-primary text-white"
              : "text-ink-muted hover:text-ink hover:bg-surface-subtle"
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Site Settings</span>
        </button>
      </div>

      {/* TAB 1: FACULTY */}
      {activeTab === "faculty" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-body-md font-bold text-ink">Faculty Directory</h2>
            <Button size="sm" onClick={() => openFacultyModal()} className="gap-1.5 font-bold">
              <Plus className="w-4 h-4" /> Add Faculty
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {initialFaculty.map((f) => (
              <div
                key={f.id}
                className="p-5 rounded-2xl border border-border bg-white shadow-xs space-y-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-body-md font-bold text-ink">{f.name}</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openFacultyModal(f)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                  <p className="text-body-xs font-semibold text-primary">{f.designation}</p>
                  <p className="text-body-xs text-ink-muted line-clamp-3 mt-2">{f.bio}</p>
                </div>
                <div className="text-[11px] font-mono text-ink-muted pt-2 border-t border-border flex items-center justify-between">
                  <span>/{f.slug}</span>
                  <span>Order: {f.sortOrder}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Faculty Edit Modal */}
          {facultyModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
              <div className="w-full max-w-lg rounded-2xl bg-white p-6 border border-border shadow-xl space-y-4">
                <h3 className="text-body-md font-bold text-ink">
                  {editingFaculty ? "Edit Faculty Member" : "New Faculty Member"}
                </h3>
                <form onSubmit={handleSaveFaculty} className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-body-xs font-semibold text-ink">Full Name</label>
                    <Input
                      value={facName}
                      onChange={(e) => setFacName(e.target.value)}
                      placeholder="e.g. Dinesh Sir"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-body-xs font-semibold text-ink">Designation</label>
                    <Input
                      value={facDesignation}
                      onChange={(e) => setFacDesignation(e.target.value)}
                      placeholder="e.g. Founder & Lead Mathematics Faculty"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-body-xs font-semibold text-ink">Biography</label>
                    <Textarea
                      rows={3}
                      value={facBio}
                      onChange={(e) => setFacBio(e.target.value)}
                      placeholder="25+ years legacy of training CBSE and board toppers..."
                      required
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setFacultyModalOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
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
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-body-md font-bold text-ink">Student Testimonials</h2>
            <Button size="sm" onClick={() => openTestimonialModal()} className="gap-1.5 font-bold">
              <Plus className="w-4 h-4" /> Add Testimonial
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {initialTestimonials.map((t) => (
              <div
                key={t.id}
                className="p-5 rounded-2xl border border-border bg-white shadow-xs space-y-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-body-md font-bold text-ink">{t.studentName}</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openTestimonialModal(t)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                  <p className="text-body-xs font-semibold text-ink-muted">
                    Class {t.classLevel} · Batch of {t.year}
                  </p>
                  <p className="text-body-xs text-ink italic mt-2">"{t.quote}"</p>
                </div>
              </div>
            ))}
          </div>

          {/* Testimonial Edit Modal */}
          {testModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
              <div className="w-full max-w-lg rounded-2xl bg-white p-6 border border-border shadow-xl space-y-4">
                <h3 className="text-body-md font-bold text-ink">
                  {editingTestimonial ? "Edit Testimonial" : "New Testimonial"}
                </h3>
                <form onSubmit={handleSaveTestimonial} className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-body-xs font-semibold text-ink">Student Name</label>
                    <Input
                      value={testName}
                      onChange={(e) => setTestName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-body-xs font-semibold text-ink">Class Level</label>
                      <Input
                        type="number"
                        value={testClass}
                        onChange={(e) => setTestClass(Number(e.target.value))}
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-body-xs font-semibold text-ink">Year</label>
                      <Input
                        type="number"
                        value={testYear}
                        onChange={(e) => setTestYear(Number(e.target.value))}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-body-xs font-semibold text-ink">Student Quote</label>
                    <Textarea
                      rows={3}
                      value={testQuote}
                      onChange={(e) => setTestQuote(e.target.value)}
                      required
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setTestModalOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
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
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-body-md font-bold text-ink">Hall of Fame & Exam Results</h2>
            <Button size="sm" onClick={() => openResultModal()} className="gap-1.5 font-bold">
              <Plus className="w-4 h-4" /> Add Result
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {initialResults.map((r) => (
              <div
                key={r.id}
                className="p-5 rounded-2xl border border-border bg-white shadow-xs space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-body-md font-bold text-ink">{r.studentName}</h3>
                    <p className="text-body-xs text-ink-muted">
                      {r.exam} ({r.year})
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openResultModal(r)}
                    className="h-8 w-8 p-0"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </Button>
                </div>
                <div className="p-2.5 rounded-xl bg-amber-50 text-amber-900 border border-amber-200 text-body-sm font-bold font-mono">
                  {r.scoreText}
                </div>
              </div>
            ))}
          </div>

          {/* Result Edit Modal */}
          {resultModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
              <div className="w-full max-w-lg rounded-2xl bg-white p-6 border border-border shadow-xl space-y-4">
                <h3 className="text-body-md font-bold text-ink">
                  {editingResult ? "Edit Result Record" : "New Result Record"}
                </h3>
                <form onSubmit={handleSaveResult} className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-body-xs font-semibold text-ink">Student Name</label>
                    <Input
                      value={resName}
                      onChange={(e) => setResName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-body-xs font-semibold text-ink">Exam</label>
                      <Input
                        value={resExam}
                        onChange={(e) => setResExam(e.target.value)}
                        placeholder="CBSE 12th Board"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-body-xs font-semibold text-ink">Year</label>
                      <Input
                        type="number"
                        value={resYear}
                        onChange={(e) => setResYear(Number(e.target.value))}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-body-xs font-semibold text-ink">
                      Score Text (e.g. 100/100 or 98.4%)
                    </label>
                    <Input
                      value={resScore}
                      onChange={(e) => setResScore(e.target.value)}
                      required
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setResultModalOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
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
        <div className="space-y-6 max-w-3xl">
          {/* Announcement Bar */}
          <div className="rounded-2xl border border-border bg-white p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-body-md font-bold text-ink flex items-center gap-2">
                <Globe className="w-4 h-4 text-primary" />
                <span>Global Announcement Bar (Top of Site)</span>
              </h3>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={announcementBar.enabled}
                  onChange={(e) =>
                    setAnnouncementBar({ ...announcementBar, enabled: e.target.checked })
                  }
                  className="w-4 h-4 rounded text-primary"
                />
                <span className="text-body-xs font-semibold text-ink">Show Bar</span>
              </label>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-body-xs font-semibold text-ink">Bar Text</label>
                <Input
                  value={announcementBar.text || ""}
                  onChange={(e) =>
                    setAnnouncementBar({ ...announcementBar, text: e.target.value })
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-body-xs font-semibold text-ink">Link Label</label>
                  <Input
                    value={announcementBar.link_text || ""}
                    onChange={(e) =>
                      setAnnouncementBar({ ...announcementBar, link_text: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-body-xs font-semibold text-ink">Link Destination</label>
                  <Input
                    value={announcementBar.link_url || ""}
                    onChange={(e) =>
                      setAnnouncementBar({ ...announcementBar, link_url: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="pt-2 text-right">
                <Button
                  size="sm"
                  onClick={() => handleSaveSetting("announcement_bar", announcementBar)}
                  disabled={isSubmitting}
                >
                  Save Announcement Bar
                </Button>
              </div>
            </div>
          </div>

          {/* Contact Details */}
          <div className="rounded-2xl border border-border bg-white p-6 shadow-xs space-y-4">
            <h3 className="text-body-md font-bold text-ink flex items-center gap-2 border-b border-border pb-3">
              <Phone className="w-4 h-4 text-primary" />
              <span>Contact & Helpdesk</span>
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-body-xs font-semibold text-ink">Phone</label>
                <Input
                  value={contactSettings.phone || ""}
                  onChange={(e) =>
                    setContactSettings({ ...contactSettings, phone: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1">
                <label className="text-body-xs font-semibold text-ink">WhatsApp</label>
                <Input
                  value={contactSettings.whatsapp || ""}
                  onChange={(e) =>
                    setContactSettings({ ...contactSettings, whatsapp: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1">
                <label className="text-body-xs font-semibold text-ink">Email</label>
                <Input
                  value={contactSettings.email || ""}
                  onChange={(e) =>
                    setContactSettings({ ...contactSettings, email: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1">
                <label className="text-body-xs font-semibold text-ink">Support Hours</label>
                <Input
                  value={contactSettings.support_hours || ""}
                  onChange={(e) =>
                    setContactSettings({ ...contactSettings, support_hours: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="pt-2 text-right">
              <Button
                size="sm"
                onClick={() => handleSaveSetting("contact", contactSettings)}
                disabled={isSubmitting}
              >
                Save Contact Details
              </Button>
            </div>
          </div>

          {/* Social Links */}
          <div className="rounded-2xl border border-border bg-white p-6 shadow-xs space-y-4">
            <h3 className="text-body-md font-bold text-ink flex items-center gap-2 border-b border-border pb-3">
              <Globe className="w-4 h-4 text-primary" />
              <span>Social Channels</span>
            </h3>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-body-xs font-semibold text-ink">YouTube Channel URL</label>
                <Input
                  value={socialSettings.youtube || ""}
                  onChange={(e) =>
                    setSocialSettings({ ...socialSettings, youtube: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1">
                <label className="text-body-xs font-semibold text-ink">Instagram URL</label>
                <Input
                  value={socialSettings.instagram || ""}
                  onChange={(e) =>
                    setSocialSettings({ ...socialSettings, instagram: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="pt-2 text-right">
              <Button
                size="sm"
                onClick={() => handleSaveSetting("socials", socialSettings)}
                disabled={isSubmitting}
              >
                Save Social Links
              </Button>
            </div>
          </div>

          {/* Hero Tiles */}
          <div className="rounded-2xl border border-border bg-white p-6 shadow-xs space-y-4">
            <h3 className="text-body-md font-bold text-ink flex items-center gap-2 border-b border-border pb-3">
              <Globe className="w-4 h-4 text-primary" />
              <span>Hero Tiles & Hall of Fame Banner</span>
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-body-xs font-semibold text-ink">Results Headline</label>
                <Input
                  value={heroTilesSettings.results_title || ""}
                  onChange={(e) =>
                    setHeroTilesSettings({
                      ...heroTilesSettings,
                      results_title: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-1">
                <label className="text-body-xs font-semibold text-ink">Results Subtitle</label>
                <Input
                  value={heroTilesSettings.results_subtitle || ""}
                  onChange={(e) =>
                    setHeroTilesSettings({
                      ...heroTilesSettings,
                      results_subtitle: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <div className="pt-2 text-right">
              <Button
                size="sm"
                onClick={() => handleSaveSetting("hero_tiles", heroTilesSettings)}
                disabled={isSubmitting}
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
