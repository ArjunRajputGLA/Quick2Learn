"use client";

import * as React from "react";
import NextLink from "next/link";
import { formatClassRoman, formatINR } from "@quick2learn/shared";
import { MathText } from "@/components/ui/math-text";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { EnquiryDialog } from "@/components/marketing/enquiry-dialog";
import { BatchScrollNav } from "./batch-scroll-nav";
import { BatchMobileBar } from "./batch-mobile-bar";
import { BatchSyllabusAccordion } from "./batch-syllabus-accordion";
import { BatchFeesSection } from "./batch-fees-section";
import type { BatchDetailResult } from "@/server/data/batches";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  CheckCircle2,
  Award,
  ArrowRight,
  MessageSquare,
  UserPlus,
  Quote,
  HelpCircle,
  AlertTriangle,
  Sparkles,
  ShieldCheck,
  GraduationCap,
  Building2,
  BookOpen,
  FlaskConical,
  ChevronRight,
  Star,
  Check,
  Flame,
  Bot,
} from "lucide-react";

interface BatchPageContentProps {
  data: BatchDetailResult;
  isLoggedIn: boolean;
}

function formatBatchDuration(startDate: Date, endDate?: Date | null): string {
  const startMonth = new Date(startDate).toLocaleDateString("en-IN", {
    month: "short",
    year: "numeric",
  });
  if (!endDate) return `Starts ${startMonth}`;
  const endMonth = new Date(endDate).toLocaleDateString("en-IN", {
    month: "short",
    year: "numeric",
  });

  const startD = new Date(startDate);
  const endD = new Date(endDate);
  const diffMonths = Math.max(
    1,
    (endD.getFullYear() - startD.getFullYear()) * 12 +
      (endD.getMonth() - startD.getMonth()),
  );

  return `${diffMonths} Months (${startMonth} – ${endMonth})`;
}

function formatStartDate(startDate: Date): string {
  return new Date(startDate).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function BatchPageContent({ data, isLoggedIn }: BatchPageContentProps) {
  const {
    batch,
    faculty,
    subject,
    feePlans,
    primaryFeePlan,
    enrolledCount,
    seatsRemaining,
    testimonials,
    enrichedSyllabus,
    isStaffPreview,
  } = data;

  const [enquiryOpen, setEnquiryOpen] = React.useState(false);
  const [isWaitlistMode, setIsWaitlistMode] = React.useState(
    batch.status !== "open",
  );

  const handleOpenEnquiry = () => {
    setIsWaitlistMode(false);
    setEnquiryOpen(true);
  };

  const handleOpenWaitlist = () => {
    setIsWaitlistMode(true);
    setEnquiryOpen(true);
  };

  const handleAskAITutor = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("open-quick2learn-chat", {
          detail: {
            prompt: `Tell me about the ${batch.title} in Mathura: timings, syllabus coverage, fees, and faculty details.`,
          },
        }),
      );
    }
  };

  const classRoman = formatClassRoman(batch.classLevel);
  const isOpen = batch.status === "open";
  const primaryPricePaise = primaryFeePlan?.totalPaise ?? 1400000;
  const originalPricePaise = primaryFeePlan?.originalPaise ?? 1750000;
  const savingsPaise = originalPricePaise > primaryPricePaise ? originalPricePaise - primaryPricePaise : 0;

  // Enrollment link logic
  const checkoutHref = `/checkout/${batch.slug}`;
  const enrollHref = isLoggedIn
    ? checkoutHref
    : `/login?next=${encodeURIComponent(checkoutHref)}`;

  // Teacher avatar & media
  const isDinesh = faculty?.slug?.includes("dinesh") || faculty?.name?.toLowerCase().includes("dinesh");
  const avatarUrl = isDinesh
    ? "/images/faculty/dinesh-sir.jpg"
    : "/images/faculty/namita-maam.jpg";

  const isMath = subject?.name?.toLowerCase().includes("math") || batch.title.toLowerCase().includes("math");
  const coverImageUrl = isMath
    ? "/images/hero/banner-math.jpg"
    : "/images/hero/banner-science.jpg";

  const durationStr = formatBatchDuration(batch.startDate, batch.endDate);
  const startDateStr = formatStartDate(batch.startDate);

  // Default enriched outcomes if limited in database
  const effectiveOutcomes = React.useMemo(() => {
    if (batch.outcomes && batch.outcomes.length >= 4) {
      return batch.outcomes;
    }
    if (isMath) {
      return [
        "Target 100/100 in Board Mathematics through step-by-step NCERT & Exemplar problem drilling",
        "Deep conceptual mastery of Polynomials, Quadratic Equations, Trigonometry & Coordinate Geometry",
        "Rigorous geometric proof & construction techniques with zero mark deduction shortcuts",
        "Past 10 Years Board Previous Year Questions (PYQs) solved with official marking scheme models",
        "Weekly Sunday timed mock board exams replicating real board examination hall pressure",
        "Daily personalized doubt resolution directly with Dinesh Sir before & after scheduled class",
      ];
    }
    return [
      "Target 95%+ in ICSE Sciences with high-scoring presentation techniques for chemistry & biology",
      "Chemical equation balancing, periodic trends & stoichiometry concept drilling for error-free answers",
      "Anatomical diagrams & plant physiology illustrations with labeled precision for full marks",
      "Past 10 Years ICSE Board Question bank practice with model answer evaluations",
      "Weekly Sunday timed board mock exams with detailed 1-on-1 performance review",
      "Daily pre-lecture and post-lecture doubt clearing directly with Namita Ma'am",
    ];
  }, [batch.outcomes, isMath]);

  const sections = [
    { id: "about", label: "About" },
    { id: "outcomes", label: "What you'll learn" },
    { id: "syllabus", label: "Syllabus" },
    { id: "teacher", label: "Faculty Mentor" },
    { id: "fees", label: "Fee Structure" },
    { id: "faqs", label: "FAQs" },
  ];

  // Seats calculation for urgency meter
  const seatsOccupiedPercent = Math.min(
    100,
    Math.round(((batch.seatsTotal - seatsRemaining) / batch.seatsTotal) * 100),
  );

  return (
    <div className="bg-white min-h-screen">
      {/* Staff Preview Notice Banner */}
      {isStaffPreview && (
        <aside
          aria-label="Staff preview notice"
          className="bg-amber-500 text-white py-2 px-4 text-center text-xs sm:text-small font-bold flex items-center justify-center gap-2"
        >
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>
            Staff Draft Preview Mode — This batch is not published to the public catalog.
          </span>
        </aside>
      )}

      {/* 1. HERO SECTION: 2-COLUMN PREMIUM EDTECH LAYOUT */}
      <section className="relative bg-gradient-to-b from-slate-50 via-blue-50/20 to-white border-b border-slate-200/80 pt-6 pb-12 lg:pt-8 lg:pb-16 overflow-hidden">
        {/* Subtle decorative glow element */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="container mx-auto px-4 max-w-[1280px]">
          {/* Integrated Breadcrumbs */}
          <nav
            aria-label="Breadcrumb navigation"
            className="flex items-center flex-wrap gap-1.5 text-xs text-slate-500 mb-6 font-medium"
          >
            <NextLink href="/" className="hover:text-primary transition-colors">
              Home
            </NextLink>
            <ChevronRight className="h-3 w-3 text-slate-400 shrink-0" />
            <NextLink href="/batches" className="hover:text-primary transition-colors">
              Batches
            </NextLink>
            <ChevronRight className="h-3 w-3 text-slate-400 shrink-0" />
            <NextLink
              href={`/batches?class=${batch.classLevel}`}
              className="hover:text-primary transition-colors"
            >
              Class {classRoman}
            </NextLink>
            <ChevronRight className="h-3 w-3 text-slate-400 shrink-0" />
            <span className="text-slate-800 font-semibold truncate max-w-xs sm:max-w-md">
              {batch.title}
            </span>
          </nav>

          {/* 2-Column Desktop Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            {/* LEFT COLUMN: Course Details & Highlights (7 cols on lg) */}
            <div className="lg:col-span-7 xl:col-span-7 space-y-6">
              {/* Badges Row */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
                  <GraduationCap className="h-3.5 w-3.5" />
                  Class {classRoman} · {batch.board.toUpperCase()}
                </span>

                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800 border border-slate-200">
                  <Building2 className="h-3.5 w-3.5 text-slate-600" />
                  <span className="capitalize">{batch.mode} Classroom</span>
                </span>

                {subject && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200">
                    <FlaskConical className="h-3.5 w-3.5 text-amber-700" />
                    {subject.name}
                  </span>
                )}

                {isOpen ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 animate-pulse">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    Admissions Open 2026–27
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-200 text-slate-800">
                    Admissions Closed
                  </span>
                )}

                {enrolledCount > 0 && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                    <Users className="h-3.5 w-3.5" />
                    {enrolledCount} Students Enrolled
                  </span>
                )}
              </div>

              {/* Title & Subtitle */}
              <div className="space-y-3">
                <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-black text-slate-900 tracking-tight leading-[1.18]">
                  {batch.title}
                </h1>
                {batch.subtitle && (
                  <p className="text-base sm:text-lg text-slate-600 font-normal leading-relaxed">
                    {batch.subtitle}
                  </p>
                )}
              </div>

              {/* Faculty Mentor Spotlight Bar */}
              {faculty && (
                <div className="flex items-center gap-3.5 p-3 sm:p-3.5 rounded-xl border border-slate-200 bg-white shadow-2xs">
                  <div className="relative h-12 w-12 sm:h-14 sm:w-14 rounded-full overflow-hidden border-2 border-primary/20 shrink-0">
                    <img
                      src={avatarUrl}
                      alt={faculty.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
                        Mentor &amp; Faculty Lead
                      </span>
                      <span className="inline-flex items-center text-amber-500 text-xs font-bold">
                        ★ 4.9/5 Rating
                      </span>
                    </div>
                    <NextLink
                      href={`/faculty/${faculty.slug}`}
                      className="text-small sm:text-base font-bold text-slate-900 hover:text-primary transition-colors block truncate"
                    >
                      {faculty.name}
                    </NextLink>
                    <span className="text-xs text-slate-500 block truncate">
                      {faculty.designation} · Mathura Campus
                    </span>
                  </div>
                </div>
              )}

              {/* Key Quick Specifications Row */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
                <div className="flex items-center gap-2.5 p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <Calendar className="h-4 w-4 text-primary shrink-0" />
                  <div className="min-w-0">
                    <span className="text-[11px] text-slate-500 font-semibold uppercase block">Starts</span>
                    <span className="text-xs font-bold text-slate-900 truncate block">{startDateStr}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <Clock className="h-4 w-4 text-primary shrink-0" />
                  <div className="min-w-0">
                    <span className="text-[11px] text-slate-500 font-semibold uppercase block">Timings</span>
                    <span className="text-xs font-bold text-slate-900 truncate block">{batch.scheduleText.split("IST")[0]}</span>
                  </div>
                </div>

                <div className="col-span-2 sm:col-span-1 flex items-center gap-2.5 p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <MapPin className="h-4 w-4 text-primary shrink-0" />
                  <div className="min-w-0">
                    <span className="text-[11px] text-slate-500 font-semibold uppercase block">Campus</span>
                    <span className="text-xs font-bold text-slate-900 truncate block">Mathura Centre</span>
                  </div>
                </div>
              </div>

              {/* Hero Action Buttons */}
              <div className="pt-2 flex flex-wrap items-center gap-3">
                {isOpen ? (
                  <button
                    type="button"
                    onClick={handleOpenEnquiry}
                    className="inline-flex items-center gap-2.5 rounded-xl bg-primary px-7 py-3.5 text-small sm:text-base font-bold text-white shadow-md hover:bg-primary-hover active:scale-98 transition-all cursor-pointer"
                  >
                    <span>Inquire for Admission — {formatINR(primaryPricePaise)}</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleOpenWaitlist}
                    className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-7 py-3.5 text-small sm:text-base font-bold text-white shadow-md hover:bg-slate-800 active:scale-98 transition-all cursor-pointer"
                  >
                    <UserPlus className="h-4 w-4" />
                    <span>Admissions closed — join waitlist</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleOpenEnquiry}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3.5 text-small sm:text-base font-semibold text-slate-800 hover:bg-slate-50 active:scale-98 transition-all cursor-pointer shadow-xs"
                >
                  <MessageSquare className="h-4 w-4 text-primary" />
                  <span>Request Callback</span>
                </button>

                <button
                  type="button"
                  onClick={handleAskAITutor}
                  className="inline-flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3.5 text-small font-semibold text-primary hover:bg-primary/10 active:scale-98 transition-all cursor-pointer"
                  title="Ask Quick2Learn AI Tutor about this batch"
                >
                  <Bot className="h-4 w-4" />
                  <span>Ask AI Tutor</span>
                </button>
              </div>

              {/* Trust Micro-Checklist */}
              <div className="pt-2 flex flex-wrap items-center gap-y-2 gap-x-5 text-xs font-medium text-slate-600">
                <span className="flex items-center gap-1.5">
                  <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                  Strict 30-Student Cap
                </span>
                <span className="flex items-center gap-1.5">
                  <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                  Printed Formula &amp; Question Booklets
                </span>
                <span className="flex items-center gap-1.5">
                  <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                  Weekly Sunday Mock Exams
                </span>
              </div>
            </div>

            {/* RIGHT COLUMN: Sticky Course Preview & Enrollment Card (5 cols on lg) */}
            <div className="lg:col-span-5 xl:col-span-5 lg:sticky lg:top-24">
              <div className="rounded-2xl border border-slate-200/90 bg-white shadow-xl overflow-hidden">
                {/* Media Preview Box with Cover Image */}
                <div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-900 group">
                  <img
                    src={coverImageUrl}
                    alt={batch.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-xs font-semibold">
                    <span className="bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-md border border-white/20">
                      Mathura Campus · Classroom Batch
                    </span>
                    <span className="bg-primary/90 text-white px-2.5 py-1 rounded-md">
                      Session 2026–27
                    </span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-6 space-y-5">
                  {/* Price Tag with Savings Badge */}
                  <div>
                    <div className="flex items-baseline gap-2.5">
                      <span className="text-3xl font-black text-slate-900 tracking-tight">
                        {formatINR(primaryPricePaise)}
                      </span>
                      {originalPricePaise > primaryPricePaise && (
                        <span className="text-base text-slate-400 line-through font-medium">
                          {formatINR(originalPricePaise)}
                        </span>
                      )}
                      {savingsPaise > 0 && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-black bg-emerald-100 text-emerald-800">
                          Save {formatINR(savingsPaise)}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-1 font-medium">
                      Inclusive of all study material, test series &amp; GST.
                    </p>
                  </div>

                  {/* Urgency Seats Progress Meter */}
                  <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="flex items-center gap-1 text-slate-700">
                        <Flame className="h-3.5 w-3.5 text-amber-500" />
                        Seats Remaining:
                      </span>
                      <span className={seatsRemaining <= 10 ? "text-amber-600 font-extrabold" : "text-primary"}>
                        {seatsRemaining} of {batch.seatsTotal} seats
                      </span>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary transition-all duration-500"
                        style={{ width: `${Math.max(10, seatsOccupiedPercent)}%` }}
                      />
                    </div>
                    <span className="text-[11px] text-slate-500 block">
                      Strict limit of {batch.seatsTotal} students for individual attention.
                    </span>
                  </div>

                  {/* Primary & Secondary Action CTAs */}
                  <div className="space-y-2.5">
                    {isOpen ? (
                      <button
                        type="button"
                        onClick={handleOpenEnquiry}
                        className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary py-3.5 px-4 text-small font-bold text-white shadow-md hover:bg-primary-hover active:scale-98 transition-all cursor-pointer"
                      >
                        <span>Inquire for Admission</span>
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleOpenWaitlist}
                        className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 py-3.5 px-4 text-small font-bold text-white hover:bg-slate-800 active:scale-98 transition-all cursor-pointer"
                      >
                        <UserPlus className="h-4 w-4" />
                        <span>Join Waitlist for This Batch</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={handleOpenEnquiry}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 py-2.5 px-4 text-small font-semibold text-slate-700 hover:bg-slate-50 active:scale-98 transition-all cursor-pointer"
                    >
                      <MessageSquare className="h-4 w-4 text-primary" />
                      <span>Request Instant Callback</span>
                    </button>
                  </div>

                  {/* Batch Inclusions List */}
                  <div className="pt-3 border-t border-slate-100 space-y-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                      What This Batch Includes:
                    </span>
                    <ul className="space-y-2 text-xs text-slate-700">
                      <li className="flex items-center gap-2">
                        <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                        <span>Direct daily mentorship by {faculty?.name || "faculty lead"}</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                        <span>Offline lecture hall at Highway Plaza, Mathura</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                        <span>Printed question worksheets &amp; formula booklets</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                        <span>Weekly Sunday board mock exams &amp; answer analysis</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                        <span>Daily 1-on-1 doubt clearing before &amp; after lecture</span>
                      </li>
                    </ul>
                  </div>

                  {/* Reassurance Footer */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-center gap-1.5 text-[11px] font-medium text-slate-500 text-center">
                    <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>100% Transparent Fee Structure · No Hidden Charges</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. ELEVATED METRICS / HIGHLIGHTS ROW */}
      <section className="border-b border-slate-200 bg-white py-6">
        <div className="container mx-auto px-4 max-w-[1280px]">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Stat 1: Duration */}
            <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/60 flex items-start gap-3.5 shadow-2xs">
              <div className="p-2.5 rounded-lg bg-blue-100/80 text-primary shrink-0">
                <Clock className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                  Batch Duration
                </span>
                <span className="text-small font-bold text-slate-900 block truncate">
                  {durationStr}
                </span>
              </div>
            </div>

            {/* Stat 2: Schedule */}
            <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/60 flex items-start gap-3.5 shadow-2xs">
              <div className="p-2.5 rounded-lg bg-indigo-100/80 text-indigo-700 shrink-0">
                <Calendar className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                  Weekly Schedule
                </span>
                <span className="text-small font-bold text-slate-900 block truncate">
                  {batch.scheduleText}
                </span>
              </div>
            </div>

            {/* Stat 3: Mode & Location */}
            <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/60 flex items-start gap-3.5 shadow-2xs">
              <div className="p-2.5 rounded-lg bg-amber-100/80 text-amber-800 shrink-0">
                <MapPin className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                  Campus Venue
                </span>
                <span className="text-small font-bold text-slate-900 block truncate">
                  <span className="capitalize">{batch.mode}</span> · Mathura Campus
                </span>
              </div>
            </div>

            {/* Stat 4: Seats Left */}
            <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/60 flex items-start gap-3.5 shadow-2xs">
              <div className="p-2.5 rounded-lg bg-emerald-100/80 text-emerald-800 shrink-0">
                <Users className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                  Batch Capacity
                </span>
                <span className="text-small font-bold text-slate-900 block truncate">
                  {isOpen ? (
                    `${seatsRemaining} of ${batch.seatsTotal} seats open`
                  ) : (
                    <span className="text-red-600">Batch Full</span>
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. STICKY SUB-NAVIGATION TABS */}
      <BatchScrollNav sections={sections} />

      {/* 4. MAIN CONTENT SECTIONS */}
      <main className="container mx-auto px-4 max-w-[1280px] py-12 space-y-16 pb-28 md:pb-16">
        {/* SECTION 1: ABOUT (with MathText support & 3 Feature Cards) */}
        <section id="about" className="space-y-6 scroll-mt-32">
          <div className="border-b border-slate-200 pb-3">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              About This Batch
            </h2>
            <p className="text-small text-slate-500 mt-1">
              Curriculum focus, pedagogical methodology, and classroom environment at Mathura academy.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-8 space-y-8 shadow-xs">
            <div className="text-base sm:text-lg text-slate-700 leading-relaxed whitespace-pre-line font-sans max-w-4xl">
              <MathText content={batch.description} />
            </div>

            {/* 3 Dedicated Feature Spotlight Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-6 border-t border-slate-100">
              <div className="p-5 rounded-xl border border-slate-200/80 bg-slate-50/50 space-y-2.5 hover:border-primary/40 transition-colors">
                <div className="p-2.5 w-fit rounded-lg bg-blue-100 text-primary">
                  <Building2 className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-base text-slate-900">
                  Mathura Institute Campus
                </h3>
                <p className="text-xs sm:text-small text-slate-600 leading-relaxed">
                  Air-conditioned lecture halls near Highway Plaza with comfortable seating and distraction-free audio-visual setup.
                </p>
                <span className="inline-block text-[11px] font-bold text-primary pt-1">
                  Offline Centre · Mathura
                </span>
              </div>

              <div className="p-5 rounded-xl border border-slate-200/80 bg-slate-50/50 space-y-2.5 hover:border-primary/40 transition-colors">
                <div className="p-2.5 w-fit rounded-lg bg-indigo-100 text-indigo-700">
                  <Users className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-base text-slate-900">
                  Small Batch Size (Max {batch.seatsTotal})
                </h3>
                <p className="text-xs sm:text-small text-slate-600 leading-relaxed">
                  Strict cap of {batch.seatsTotal} students so every learner receives personal attention and individualized progress tracking.
                </p>
                <span className="inline-block text-[11px] font-bold text-indigo-700 pt-1">
                  Personalized Attention
                </span>
              </div>

              <div className="p-5 rounded-xl border border-slate-200/80 bg-slate-50/50 space-y-2.5 hover:border-primary/40 transition-colors">
                <div className="p-2.5 w-fit rounded-lg bg-emerald-100 text-emerald-800">
                  <GraduationCap className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-base text-slate-900">
                  Direct Mentor Access
                </h3>
                <p className="text-xs sm:text-small text-slate-600 leading-relaxed">
                  Daily pre-class and post-class doubt solving clearance directly with {faculty?.name || "faculty mentors"}.
                </p>
                <span className="inline-block text-[11px] font-bold text-emerald-700 pt-1">
                  Daily 1-on-1 Doubts
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2: WHAT YOU'LL LEARN (6-Card Rich Outcomes Grid) */}
        <section id="outcomes" className="space-y-6 scroll-mt-32">
          <div className="border-b border-slate-200 pb-3">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-primary" />
              <span>What You&apos;ll Learn</span>
            </h2>
            <p className="text-small text-slate-500 mt-1">
              Measurable academic outcomes and board examination proficiencies developed in this batch.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {effectiveOutcomes.map((outcome, idx) => (
              <div
                key={idx}
                className="p-5 sm:p-6 rounded-2xl border border-slate-200 bg-white hover:border-primary/50 hover:shadow-sm transition-all space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                    0{idx + 1}
                  </div>
                  <h3 className="font-bold text-base text-slate-900 leading-snug">
                    {outcome.split("—")[0] || outcome}
                  </h3>
                  {outcome.includes("—") && (
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {outcome.split("—")[1]}
                    </p>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center gap-2 text-xs font-semibold text-emerald-700">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>Guaranteed Board Drill</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 3: SYLLABUS (Modules & Chapters with Free Previews) */}
        <section id="syllabus" className="space-y-6 scroll-mt-32">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <BookOpen className="h-6 w-6 text-primary" />
                <span>Course Syllabus</span>
              </h2>
              <p className="text-small text-slate-500 mt-1">
                Structured sequential breakdown with board weightage, topics, and concept drilling.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                {enrichedSyllabus.length} Modules Total
              </span>
              <button
                type="button"
                onClick={handleAskAITutor}
                className="text-xs font-bold px-3 py-1 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors flex items-center gap-1.5"
              >
                <Bot className="h-3.5 w-3.5" />
                <span>Ask AI About Topics</span>
              </button>
            </div>
          </div>

          <BatchSyllabusAccordion syllabus={enrichedSyllabus} />
        </section>

        {/* SECTION 4: TEACHER SPOTLIGHT CARD */}
        {faculty && (
          <section id="teacher" className="space-y-6 scroll-mt-32">
            <div className="border-b border-slate-200 pb-3">
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <GraduationCap className="h-6 w-6 text-primary" />
                <span>Faculty Mentor Spotlight</span>
              </h2>
              <p className="text-small text-slate-500 mt-1">
                Learn directly from top senior educators with decades of board topper mentoring experience.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200/90 bg-gradient-to-br from-white via-slate-50/50 to-blue-50/20 p-6 sm:p-8 shadow-sm flex flex-col md:flex-row items-center md:items-start gap-8">
              {/* Photo Box */}
              <div className="relative h-48 w-48 sm:h-56 sm:w-56 shrink-0 overflow-hidden rounded-2xl border-2 border-white shadow-md ring-1 ring-slate-200">
                <img
                  src={avatarUrl}
                  alt={faculty.name}
                  className="h-full w-full object-cover"
                />
                <div className="absolute bottom-2 inset-x-2 bg-black/70 backdrop-blur-xs py-1 px-2 rounded text-center text-[11px] font-bold text-white">
                  Verified Mathura Mentor
                </div>
              </div>

              {/* Bio & Credentials */}
              <div className="space-y-4 text-center md:text-left flex-1">
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                  <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-primary text-white">
                    {isDinesh ? "25+ Years Senior Mathematics" : "15+ Years ICSE Sciences"}
                  </span>
                  <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-slate-100 text-slate-800 border border-slate-200">
                    Mathura Campus Mentor
                  </span>
                  <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-amber-100 text-amber-900 flex items-center gap-1">
                    <Star className="h-3 w-3 fill-current text-amber-600" />
                    ★ 4.9/5 Student Rating
                  </span>
                </div>

                <div>
                  <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                    {faculty.name}
                  </h3>
                  <p className="text-small sm:text-base font-semibold text-primary mt-0.5">
                    {faculty.designation}
                  </p>
                </div>

                <p className="text-small text-slate-600 leading-relaxed max-w-2xl">
                  {faculty.bio}
                </p>

                {/* Achievements */}
                {Boolean(faculty.achievements) && Array.isArray(faculty.achievements) && faculty.achievements.length > 0 && (
                  <div className="pt-2 space-y-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                      Recognitions &amp; Achievements:
                    </span>
                    <ul className="space-y-1.5 text-xs sm:text-small text-slate-800">
                      {(faculty.achievements as Array<{ title?: string; description?: string }>).map((ach, aIdx) => (
                        <li key={aIdx} className="flex items-start gap-2 justify-center md:justify-start">
                          <Award className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                          <span>
                            <strong>{ach.title || "Recognition"}:</strong>{" "}
                            {ach.description}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Actions */}
                <div className="pt-4 flex flex-wrap items-center justify-center md:justify-start gap-3">
                  <NextLink
                    href={`/faculty/${faculty.slug}`}
                    className="inline-flex items-center gap-2 rounded-xl bg-slate-900 text-white px-5 py-2.5 text-xs sm:text-small font-bold hover:bg-slate-800 transition-colors shadow-xs"
                  >
                    <span>View complete mentor profile &amp; free lectures</span>
                    <ArrowRight className="h-4 w-4" />
                  </NextLink>

                  <button
                    type="button"
                    onClick={handleAskAITutor}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs sm:text-small font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <Bot className="h-4 w-4 text-primary" />
                    <span>Ask AI Tutor about {faculty.name}</span>
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* SECTION 5: FEES (Deduplicated Fee Plans & Payment Options) */}
        <section id="fees" className="space-y-6 scroll-mt-32">
          <div className="border-b border-slate-200 pb-3">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <ShieldCheck className="h-6 w-6 text-primary" />
              <span>Fee Structure &amp; Payment Options</span>
            </h2>
            <p className="text-small text-slate-500 mt-1">
              Transparent offline pricing with no surprise charges. Choose full one-time payment or convenient instalments.
            </p>
          </div>

          <BatchFeesSection
            isOpen={isOpen}
            feePlans={feePlans}
            enrollBaseHref={enrollHref}
            onOpenEnquiry={handleOpenEnquiry}
            onOpenWaitlist={handleOpenWaitlist}
          />
        </section>

        {/* SECTION 6: TESTIMONIALS & FAQS */}
        <section id="faqs" className="space-y-12 scroll-mt-32">
          {/* Testimonials */}
          {testimonials && testimonials.length > 0 && (
            <div className="space-y-6">
              <div className="border-b border-slate-200 pb-3">
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <Star className="h-6 w-6 text-amber-500 fill-amber-500" />
                  <span>Student Success Stories</span>
                </h2>
                <p className="text-small text-slate-500 mt-1">
                  Hear directly from past Class {classRoman} students mentored in Mathura.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {testimonials.map((test) => (
                  <div
                    key={test.id}
                    className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4 flex flex-col justify-between hover:shadow-md transition-shadow"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex text-amber-400 text-sm">
                          {"★".repeat(5)}
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                          Top Board Scorer
                        </span>
                      </div>

                      <Quote className="h-6 w-6 text-primary/30" />
                      <p className="text-small text-slate-700 leading-relaxed italic">
                        &ldquo;{test.quote}&rdquo;
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-primary to-indigo-600 text-white font-bold flex items-center justify-center text-small shrink-0">
                        {test.studentName.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-bold text-small text-slate-900">
                          {test.studentName}
                        </h4>
                        <span className="text-xs text-slate-500 font-medium">
                          Class {formatClassRoman(test.classLevel)} · Batch {test.year} · Mathura Campus
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* FAQs Accordion */}
          <div className="space-y-6">
            <div className="border-b border-slate-200 pb-3">
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <HelpCircle className="h-6 w-6 text-primary" />
                <span>Frequently Asked Questions</span>
              </h2>
              <p className="text-small text-slate-500 mt-1">
                Everything you need to know about attendance, doubt solving, study material, and admission tests.
              </p>
            </div>

            {batch.faqs && Array.isArray(batch.faqs) && batch.faqs.length > 0 ? (
              <Accordion type="single" defaultValue="faq-0" className="border border-slate-200 rounded-2xl bg-white divide-y divide-slate-100">
                {(batch.faqs as Array<{ question?: string; answer?: string }>).map((faq, fIdx) => (
                  <AccordionItem key={fIdx} value={`faq-${fIdx}`} className="px-6">
                    <AccordionTrigger className="text-small sm:text-base font-bold text-slate-900 hover:text-primary">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-small text-slate-600 leading-relaxed pb-4">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            ) : (
              <Accordion type="single" defaultValue="faq-0" className="border border-slate-200 rounded-2xl bg-white divide-y divide-slate-100">
                <AccordionItem value="faq-0" className="px-6">
                  <AccordionTrigger className="text-small sm:text-base font-bold text-slate-900 hover:text-primary">
                    What if a student misses a classroom lecture?
                  </AccordionTrigger>
                  <AccordionContent className="text-small text-slate-600 leading-relaxed pb-4">
                    Backup video recordings of conceptual topics and class notes are provided on the Quick2Learn student portal, alongside personal doubt clarification with faculty.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="faq-1" className="px-6">
                  <AccordionTrigger className="text-small sm:text-base font-bold text-slate-900 hover:text-primary">
                    Are mock test series and printed books included in the fee?
                  </AccordionTrigger>
                  <AccordionContent className="text-small text-slate-600 leading-relaxed pb-4">
                    Yes, all weekly Sunday mock tests, ICSE/CBSE board sample papers, formula booklets, and personal evaluation discussions are fully included with zero hidden charges.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="faq-2" className="px-6">
                  <AccordionTrigger className="text-small sm:text-base font-bold text-slate-900 hover:text-primary">
                    How are doubts cleared outside scheduled lecture hours?
                  </AccordionTrigger>
                  <AccordionContent className="text-small text-slate-600 leading-relaxed pb-4">
                    Students can arrive 30 minutes before class or stay after class for dedicated one-on-one doubt resolution sessions with the faculty mentors.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            )}
          </div>
        </section>
      </main>

      {/* 5. MOBILE STICKY BOTTOM BAR */}
      <BatchMobileBar
        pricePaise={primaryPricePaise}
        isOpen={isOpen}
        enrollHref={enrollHref}
        onOpenEnquiry={handleOpenEnquiry}
        onOpenWaitlist={handleOpenWaitlist}
      />

      {/* Interactive Enquiry / Waitlist Modal */}
      <EnquiryDialog
        open={enquiryOpen}
        onOpenChange={setEnquiryOpen}
        batchTitle={isWaitlistMode ? `${batch.title} (Waitlist)` : batch.title}
        defaultClassLevel={batch.classLevel}
      />
    </div>
  );
}
