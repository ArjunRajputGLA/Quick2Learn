"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  BookOpen,
  MessageSquare,
  BarChart3,
  Video,
  ShieldCheck,
  Download,
  Check,
  ChevronLeft,
  ChevronRight,
  WifiOff,
  BellRing,
  Clock,
  Sparkles,
  ArrowRight,
  GraduationCap,
  Laptop,
  PlayCircle,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { EnquiryDialog } from "./enquiry-dialog";

export interface AppFeature {
  id: string;
  badge: string;
  title: string;
  shortTitle: string;
  description: string;
  highlights: string[];
  screenshot: string;
  icon: React.ComponentType<{ className?: string }>;
}

const APP_FEATURES: AppFeature[] = [
  {
    id: "student-dashboard",
    badge: "Personalized Hub",
    title: "Personalized Student Dashboard & Hall of Fame",
    shortTitle: "Dashboard",
    description:
      "Start every learning day with your personalized mobile dashboard. Discover free foundational video lectures, view top rankers from Mathura, and submit one-tap join requests to your teacher.",
    highlights: [
      "Hall of Fame highlighting 70+ students with 90–99% board scores",
      "Quick access to curated free video lectures & chapter revisions",
      "Instant one-click batch join request system directly to Dinesh Sir",
    ],
    screenshot: "/images/app/home.jpg",
    icon: Sparkles,
  },
  {
    id: "live-batches",
    badge: "1-Click Live Classroom",
    title: "Live Zoom Interactive Classes & Real-Time Broadcasts",
    shortTitle: "Live Classes",
    description:
      "Join scheduled interactive classes directly with a single tap. See active live broadcasting badges, batch start dates, and weekly lecture schedules for Classes 9–12 CBSE & ICSE.",
    highlights: [
      "Real-time 'LIVE' badge indicator with 1-tap class join",
      "Weekly timetable & batch timings (8:00 PM – 9:00 PM)",
      "Classes taught personally by Dinesh Sir & Namita Ma'am",
    ],
    screenshot: "/images/app/live-broadcast.jpg",
    icon: Video,
  },
  {
    id: "video-lectures",
    badge: "HD Lecture Library",
    title: "Chapter-Wise Recorded Video Lectures with Durations",
    shortTitle: "Video Lectures",
    description:
      "Never miss a concept even if you missed class. Browse organized chapter playlists (like Chemical Changes & Reactions, Calculus, Optics) with exact lecture runtimes and re-watch at your own speed.",
    highlights: [
      "Numbered lecture episodes with exact video runtimes",
      "Re-watch complex proofs and numericals at your own pace",
      "Complete subject folders for Maths, Physics, Chemistry & Biology",
    ],
    screenshot: "/images/app/video-lectures.jpg",
    icon: PlayCircle,
  },
  {
    id: "study-material",
    badge: "Comprehensive Library",
    title: "Chapter Notes, Selina Solutions & Formula Books",
    shortTitle: "Study Material",
    description:
      "Mathura's most trusted Selina & NCERT chapter solutions right in your pocket. Access neatly organized subject folders, formula handbooks, and previous years' board papers (PYQs).",
    highlights: [
      "Exercise-wise Selina & NCERT solutions by Dinesh Sir",
      "Dedicated subject folders: Maths, Physics, Chemistry, Biology",
      "Clear, concise revision PDFs for rapid board exam preparation",
    ],
    screenshot: "/images/app/study-material.jpg",
    icon: BookOpen,
  },
  {
    id: "doubt-chat",
    badge: "Faculty Support",
    title: "24/7 Direct 1-on-1 Doubt Clearing with Dinesh Sir",
    shortTitle: "Doubt Chat",
    description:
      "Never stay stuck on a difficult calculus formula or chemical reaction. Chat 1-on-1 directly with Dinesh Sir and Namita Ma'am, upload question snapshots, and receive quick step-by-step guidance.",
    highlights: [
      "Direct personal messaging channel with faculty",
      "Clear tricky calculus, chemical reactions & numericals",
      "Fast turnaround so students never lag behind in syllabus",
    ],
    screenshot: "/images/app/doubt-chat-clean.jpg",
    icon: MessageSquare,
  },
  {
    id: "batch-channels",
    badge: "Classroom Community",
    title: "Dedicated Batch Channels & Real-Time Announcements",
    shortTitle: "Batch Channels",
    description:
      "Stay connected with your specific peer group. Each batch has its own channel where teachers share immediate homework updates, test dates, and syllabus announcements.",
    highlights: [
      "Dedicated group channels for 9th, 10th, 11th & 12th batches",
      "Instant alerts for test schedules, timings & syllabus updates",
      "Focused academic community without social media distractions",
    ],
    screenshot: "/images/app/batch-chats.jpg",
    icon: Users,
  },
  {
    id: "test-series",
    badge: "Performance Analytics",
    title: "Weekly Chapter Tests & Board Score Trend Graphs",
    shortTitle: "Tests & Analytics",
    description:
      "Take timed online chapter tests (like Differentiation, Optics, Chemical Bonding) and track your score progression over time with visual performance graphs and answer breakdowns.",
    highlights: [
      "Chapter-wise online mock tests with automated scoring",
      "Visual performance trend graphs to benchmark board readiness",
      "Detailed question-wise review and teacher remarks",
    ],
    screenshot: "/images/app/tests.jpg",
    icon: BarChart3,
  },
  {
    id: "attendance-tracking",
    badge: "Daily Discipline",
    title: "Class Attendance Percentages & Batch Enrollments",
    shortTitle: "Attendance",
    description:
      "Maintain strict attendance consistency. The app tracks every session attended across your enrolled batches, helping students and parents stay accountable and exam-ready throughout the year.",
    highlights: [
      "Live attendance percentage tracking per enrolled batch",
      "Complete overview of 9th–12th CBSE & ICSE enrollments",
      "Prevents absenteeism and ensures consistent board prep",
    ],
    screenshot: "/images/app/attendance.jpg",
    icon: GraduationCap,
  },
  {
    id: "parent-portal",
    badge: "Parent Peace of Mind",
    title: "Transparent Installment Tracking & Payment Receipts",
    shortTitle: "Fee Portal",
    description:
      "Parents can monitor installments transparently. Review total due amounts, upcoming installment dates, payment statuses (Paid/Unpaid), and download official digital fee receipts instantly.",
    highlights: [
      "Clear breakdown of total due, upcoming & paid installments",
      "Transparent due date reminders for peaceful budgeting",
      "Instant official digital receipts with zero paperwork",
    ],
    screenshot: "/images/app/fees.jpg",
    icon: ShieldCheck,
  },
  {
    id: "offline-downloads",
    badge: "Zero Buffering",
    title: "Offline Downloads & Quick Student Resource Drawer",
    shortTitle: "Offline Mode",
    description:
      "Download lectures and notes to study even with unstable internet or on the road. Access the student side drawer for testimonials, free resources, and seamless offline revision.",
    highlights: [
      "Offline mode for zero buffering during power or internet cuts",
      "One-tap access to free reference materials and guides",
      "Instant synchronization when you reconnect online",
    ],
    screenshot: "/images/app/downloads.jpg",
    icon: Download,
  },
];

export function AppPromoSection() {
  const [activeIndex, setActiveIndex] = React.useState(0);
  const [notifyDialogOpen, setNotifyDialogOpen] = React.useState(false);

  // Touch swipe support for the phone frame
  const touchStartXRef = React.useRef<number | null>(null);

  // Desktop scroll-spy observer references
  const cardRefs = React.useRef<(HTMLDivElement | null)[]>([]);
  const isManualScrollRef = React.useRef(false);
  const scrollTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const rafIdRef = React.useRef<number | null>(null);

  const currentFeature = APP_FEATURES[activeIndex] ?? APP_FEATURES[0]!;

  const handlePrev = () => {
    setActiveIndex((prev) => (prev - 1 + APP_FEATURES.length) % APP_FEATURES.length);
  };

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % APP_FEATURES.length);
  };

  // Selection with optional smooth scrolling to the target card
  const handleSelectFeature = (idx: number, shouldScroll = false) => {
    isManualScrollRef.current = true;
    setActiveIndex(idx);

    if (shouldScroll && cardRefs.current[idx]) {
      cardRefs.current[idx]?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }

    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    scrollTimeoutRef.current = setTimeout(() => {
      isManualScrollRef.current = false;
    }, 850);
  };

  // Touch swipe handling on the phone mockup
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0]?.clientX ?? null;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null) return;
    const endX = e.changedTouches[0]?.clientX ?? touchStartXRef.current;
    const diff = touchStartXRef.current - endX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        handleNext();
      } else {
        handlePrev();
      }
    }
    touchStartXRef.current = null;
  };

  // Desktop Scroll-Spy: Syncs active feature card with sticky phone as user naturally scrolls down
  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const handleScroll = () => {
      if (isManualScrollRef.current || window.innerWidth < 1024) return;

      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }

      rafIdRef.current = requestAnimationFrame(() => {
        // Focal reading line is at 42% from the top of the viewport
        const targetY = window.innerHeight * 0.42;
        let bestIdx = 0;
        let minDistance = Infinity;

        cardRefs.current.forEach((el, index) => {
          if (!el) return;
          const rect = el.getBoundingClientRect();
          const cardCenter = rect.top + rect.height / 2;
          const distance = Math.abs(cardCenter - targetY);

          // Card must be visible in the viewport
          if (rect.top < window.innerHeight && rect.bottom > 0) {
            if (distance < minDistance) {
              minDistance = distance;
              bestIdx = index;
            }
          }
        });

        // Switch smoothly when within threshold without jitter
        if (minDistance < 280) {
          setActiveIndex((prev) => (prev !== bestIdx ? bestIdx : prev));
        }
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    };
  }, []);

  return (
    <section
      id="app-promotion"
      className="relative bg-gradient-to-b from-surface via-surface-subtle/80 to-surface py-16 md:py-24 border-t border-border scroll-mt-20"
      aria-label="Quick2Learn Mobile App Promotion"
    >
      {/* Background Decorative Glow Circles (clipped inside self-contained layer so parent remains overflow:visible for sticky) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 -right-32 w-96 h-96 bg-accent/15 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 max-w-[1200px] relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-10 md:mb-16">
          <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 border border-amber-500/30 px-4 py-1.5 text-caption font-bold text-amber-700 shadow-2xs hover:scale-105 transition-transform duration-300">
            <Clock className="h-4 w-4 text-amber-600 animate-pulse" />
            <span>COMING SOON TO GOOGLE PLAY</span>
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span className="text-ink-muted font-semibold">Pre-Registration Open</span>
          </div>

          <h2 className="text-h2 md:text-h1 font-black text-ink tracking-tight leading-tight">
            Smart Learning in Your Pocket —{" "}
            <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-primary via-blue-600 to-indigo-700 bg-clip-text text-transparent">
              Anytime, Anywhere in Mathura
            </span>
          </h2>

          <p className="text-body md:text-lg text-ink-muted leading-relaxed">
            We are putting the final touches on the official Quick2Learn Android app. Preview the upcoming features below and pre-register to get notified the moment it launches!
          </p>

          {/* Quick Status Highlights */}
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 pt-2 text-small text-ink-muted font-medium">
            <div className="flex items-center gap-1.5 text-amber-700 font-semibold">
              <Sparkles className="h-4 w-4 text-amber-500" />
              <span>Final Play Store Review Stage</span>
            </div>
            <span className="text-border hidden sm:inline">&bull;</span>
            <div className="flex items-center gap-1.5 text-emerald-700 font-semibold">
              <GraduationCap className="h-4 w-4 text-emerald-600" />
              <span>Classes 9th to 12th CBSE & ICSE</span>
            </div>
            <span className="text-border hidden sm:inline">&bull;</span>
            <div className="flex items-center gap-1.5 text-primary font-semibold">
              <WifiOff className="h-4 w-4 text-primary" />
              <span>Offline Video Mode Included</span>
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* MOBILE / TABLET SHOWCASE VIEW (< 1024px)                        */}
        {/* Unified, touch-swipeable phone showcase + active card underneath */}
        {/* ============================================================== */}
        <div className="block lg:hidden space-y-6">
          {/* Category Tabs Pill Bar */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2 -mx-4 px-4 snap-x">
            {APP_FEATURES.map((feat, idx) => {
              const isCurrent = idx === activeIndex;
              return (
                <button
                  key={feat.id}
                  onClick={() => handleSelectFeature(idx, false)}
                  className={`snap-start shrink-0 px-3.5 py-2 rounded-xl text-caption font-bold transition-all cursor-pointer border ${
                    isCurrent
                      ? "bg-primary text-white border-primary shadow-sm scale-102"
                      : "bg-surface border-border text-ink-muted hover:text-ink hover:border-primary/40"
                  }`}
                >
                  {feat.shortTitle}
                </button>
              );
            })}
          </div>

          {/* Realistic Phone Mockup with Swipe */}
          <div
            className="relative w-full max-w-[320px] sm:max-w-[340px] mx-auto select-none"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {/* Ambient Radial Glow */}
            <div
              className="absolute inset-0 bg-gradient-to-tr from-primary/30 to-accent/25 rounded-[44px] filter blur-2xl transform scale-95 opacity-80 pointer-events-none"
              aria-hidden="true"
            />

            {/* Phone Container: 410x810 Aspect Ratio */}
            <div className="relative w-full aspect-[410/810] select-none">
              {/* Screenshots Track */}
              <div
                className="absolute z-0 overflow-hidden bg-black"
                style={{
                  left: "7.14%",
                  top: "3.01%",
                  width: "85.76%",
                  height: "94.07%",
                  borderRadius: "26px",
                }}
              >
                <div
                  className="flex w-full h-full transition-transform duration-500 ease-out will-change-transform"
                  style={{
                    transform: `translateX(-${activeIndex * 100}%)`,
                  }}
                >
                  {APP_FEATURES.map((feature) => (
                    <div key={feature.id} className="relative w-full h-full shrink-0">
                      <Image
                        src={feature.screenshot}
                        alt={feature.title}
                        fill
                        sizes="340px"
                        priority
                        className="object-cover object-top"
                      />
                    </div>
                  ))}
                </div>

                {/* Glass Glare Highlight */}
                <div
                  className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/12 to-transparent pointer-events-none z-20"
                  aria-hidden="true"
                />
              </div>

              {/* Phone Frame SVG Overlay */}
              <img
                src="/images/phone-frame-cropped.svg?v=final"
                alt="Quick2Learn Phone Mockup Frame"
                className="absolute inset-0 z-10 w-full h-full object-contain pointer-events-none drop-shadow-2xl select-none"
              />
            </div>

            {/* Mobile Navigation Arrows & Dots underneath Phone */}
            <div className="mt-4 flex items-center justify-between px-2">
              <button
                onClick={handlePrev}
                aria-label="Previous screenshot"
                className="w-8 h-8 rounded-full bg-surface border border-border shadow-xs hover:bg-surface-subtle flex items-center justify-center text-ink transition-transform hover:scale-110 cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <div className="flex items-center gap-1.5">
                {APP_FEATURES.map((feat, idx) => (
                  <button
                    key={feat.id}
                    onClick={() => handleSelectFeature(idx, false)}
                    aria-label={`View ${feat.shortTitle}`}
                    className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                      idx === activeIndex
                        ? "w-6 bg-primary"
                        : "w-2 bg-border hover:bg-ink-muted"
                    }`}
                  />
                ))}
              </div>

              <button
                onClick={handleNext}
                aria-label="Next screenshot"
                className="w-8 h-8 rounded-full bg-surface border border-border shadow-xs hover:bg-surface-subtle flex items-center justify-center text-ink transition-transform hover:scale-110 cursor-pointer"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Mobile Active Feature Detail Card */}
          <div className="rounded-2xl p-5 bg-surface border border-primary/40 shadow-card ring-1 ring-primary/20 space-y-3 transition-all duration-300">
            <div className="flex items-center justify-between gap-2">
              <span className="text-caption font-bold px-2.5 py-0.5 rounded-full bg-primary-soft text-primary">
                {currentFeature.badge}
              </span>
              <span className="text-caption font-semibold text-ink-muted">
                {activeIndex + 1} of {APP_FEATURES.length}
              </span>
            </div>

            <h3 className="text-body font-bold text-ink">
              {currentFeature.title}
            </h3>

            <p className="text-small text-ink-muted leading-relaxed">
              {currentFeature.description}
            </p>

            <div className="pt-2 flex flex-col gap-1.5">
              {currentFeature.highlights.map((h, hIdx) => (
                <div key={hIdx} className="flex items-start gap-2 text-caption text-ink font-medium">
                  <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{h}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* DESKTOP SHOWCASE VIEW (>= 1024px)                              */}
        {/* Sticky Phone on Right + Smooth Scrolling Story Cards on Left   */}
        {/* ============================================================== */}
        <div className="hidden lg:grid grid-cols-12 gap-12 xl:gap-16 items-start relative">
          {/* Left Column: Interactive Feature Cards (7 cols) */}
          <div className="col-span-7 space-y-6">
            <div className="space-y-6">
              {APP_FEATURES.map((feature, idx) => {
                const isActive = idx === activeIndex;
                const IconComponent = feature.icon;

                return (
                  <div
                    key={feature.id}
                    ref={(el) => {
                      cardRefs.current[idx] = el;
                    }}
                    onClick={() => handleSelectFeature(idx, true)}
                    role="button"
                    tabIndex={0}
                    aria-pressed={isActive}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleSelectFeature(idx, true);
                      }
                    }}
                    className={`group relative rounded-2xl p-6 xl:p-7 transition-all duration-300 cursor-pointer border text-left ${
                      isActive
                        ? "bg-surface border-primary shadow-card-hover ring-2 ring-primary/20 scale-[1.01] opacity-100"
                        : "bg-surface/70 hover:bg-surface border-border hover:border-primary/40 shadow-xs opacity-60 hover:opacity-100"
                    }`}
                  >
                    {/* Active Accent Left Border Indicator */}
                    {isActive && (
                      <div
                        className="absolute left-0 top-3 bottom-3 w-1.5 bg-primary rounded-r-full shadow-sm"
                        aria-hidden="true"
                      />
                    )}

                    <div className="flex items-start gap-4">
                      {/* Feature Icon */}
                      <div
                        className={`p-3.5 rounded-xl shrink-0 transition-colors duration-300 ${
                          isActive
                            ? "bg-primary text-white shadow-sm"
                            : "bg-primary-soft text-primary group-hover:bg-primary/20"
                        }`}
                      >
                        <IconComponent className="h-5 w-5" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span
                            className={`text-caption font-bold px-2.5 py-0.5 rounded-full ${
                              isActive
                                ? "bg-primary-soft text-primary font-bold"
                                : "bg-surface-subtle text-ink-muted"
                            }`}
                          >
                            {feature.badge}
                          </span>
                          <span className="text-caption font-semibold text-ink-muted">
                            Feature {String(idx + 1).padStart(2, "0")}
                          </span>
                        </div>

                        <h3
                          className={`text-h3 font-bold transition-colors ${
                            isActive ? "text-ink" : "text-ink/80 group-hover:text-ink"
                          }`}
                        >
                          {feature.title}
                        </h3>

                        <p className="text-body text-ink-muted leading-relaxed mt-2">
                          {feature.description}
                        </p>

                        {/* Bullet Highlights */}
                        <div className="mt-4 pt-3.5 border-t border-border/60 flex flex-wrap gap-2">
                          {feature.highlights.map((h, hIdx) => (
                            <span
                              key={hIdx}
                              className={`inline-flex items-center gap-1.5 text-caption font-medium px-2.5 py-1 rounded-lg border transition-colors ${
                                isActive
                                  ? "bg-primary-soft/60 border-primary/25 text-ink font-semibold"
                                  : "bg-surface-subtle border-border text-ink-muted"
                              }`}
                            >
                              <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                              <span>{h}</span>
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Right Indicator Arrow */}
                      <div className="flex self-center pl-2">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                            isActive
                              ? "bg-primary text-white scale-110 shadow-sm"
                              : "text-ink-muted group-hover:text-primary group-hover:translate-x-1"
                          }`}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Sticky Realistic Phone Mockup (5 cols) */}
          <div className="col-span-5 sticky top-24 self-start flex flex-col items-center justify-center py-2">
            <div className="relative w-full max-w-[350px] lg:max-w-[365px] xl:max-w-[385px] mx-auto select-none">
              {/* Radial Ambient Glow */}
              <div
                className="absolute inset-0 bg-gradient-to-tr from-primary/30 to-accent/25 rounded-[44px] filter blur-2xl transform scale-95 opacity-80 pointer-events-none"
                aria-hidden="true"
              />

              {/* Phone Container: 410x810 Aspect Ratio */}
              <div className="relative w-full aspect-[410/810] select-none">
                {/* 1. Screenshots Layer: Placed EXACTLY inside the screen cutout */}
                <div
                  className="absolute z-0 overflow-hidden bg-black"
                  style={{
                    left: "7.14%",
                    top: "3.01%",
                    width: "85.76%",
                    height: "94.07%",
                    borderRadius: "26px",
                  }}
                >
                  {/* Sliding Screen Track */}
                  <div
                    className="flex w-full h-full transition-transform duration-500 ease-out will-change-transform"
                    style={{
                      transform: `translateX(-${activeIndex * 100}%)`,
                    }}
                  >
                    {APP_FEATURES.map((feature) => (
                      <div key={feature.id} className="relative w-full h-full shrink-0">
                        <Image
                          src={feature.screenshot}
                          alt={feature.title}
                          fill
                          sizes="385px"
                          priority
                          className="object-cover object-top"
                        />
                      </div>
                    ))}
                  </div>

                  {/* Glass Reflection Highlight Streak */}
                  <div
                    className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/12 to-transparent pointer-events-none z-20"
                    aria-hidden="true"
                  />
                </div>

                {/* 2. The Phone Frame Overlay */}
                <img
                  src="/images/phone-frame-cropped.svg?v=final"
                  alt="Quick2Learn Phone Mockup Frame"
                  className="absolute inset-0 z-10 w-full h-full object-contain pointer-events-none drop-shadow-2xl select-none"
                />
              </div>

              {/* Carousel Controls & Indicator Dots underneath phone */}
              <div className="mt-5 flex items-center justify-between px-2">
                <button
                  onClick={handlePrev}
                  aria-label="Previous feature screenshot"
                  className="w-8 h-8 rounded-full bg-surface border border-border shadow-xs hover:bg-surface-subtle flex items-center justify-center text-ink transition-transform hover:scale-110 cursor-pointer"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                {/* Feature Indicator Dots */}
                <div className="flex items-center gap-1.5">
                  {APP_FEATURES.map((feat, idx) => (
                    <button
                      key={feat.id}
                      onClick={() => handleSelectFeature(idx, true)}
                      aria-label={`View ${feat.shortTitle} screenshot`}
                      className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                        idx === activeIndex
                          ? "w-6 bg-primary"
                          : "w-2 bg-border hover:bg-ink-muted"
                      }`}
                    />
                  ))}
                </div>

                <button
                  onClick={handleNext}
                  aria-label="Next feature screenshot"
                  className="w-8 h-8 rounded-full bg-surface border border-border shadow-xs hover:bg-surface-subtle flex items-center justify-center text-ink transition-transform hover:scale-110 cursor-pointer"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              {/* Active Screenshot Caption */}
              <div className="text-center mt-2.5">
                <span className="text-caption font-semibold text-ink-muted">
                  Showing:{" "}
                  <strong className="text-ink font-bold">
                    {currentFeature.shortTitle}
                  </strong>{" "}
                  ({activeIndex + 1} of {APP_FEATURES.length})
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* Pre-Register & Web Portal Banner                               */}
        {/* ============================================================== */}
        <div className="mt-12 p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white shadow-xl space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-1.5 max-w-xl">
              <div className="flex items-center gap-2">
                <span className="text-caption font-bold uppercase tracking-wider text-amber-400">
                  Early Access Pre-Registration
                </span>
                <span className="text-xs bg-white/10 px-2 py-0.5 rounded text-white/80">
                  Google Play Release Soon
                </span>
              </div>
              <h4 className="text-body sm:text-h3 font-bold text-white">
                Be the First to Know When the App Goes Live
              </h4>
              <p className="text-small text-white/70 leading-relaxed">
                Get an instant launch alert on WhatsApp or SMS the day we launch on Google Play. Sign in seamlessly with your registered mobile number to access all your enrolled batches and courses.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <Button
                size="md"
                variant="primary"
                onClick={() => setNotifyDialogOpen(true)}
                className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-white font-bold px-5 py-3 rounded-xl shadow-md transition-all hover:scale-105 cursor-pointer text-small"
              >
                <BellRing className="h-4 w-4 animate-bounce" />
                <span>Get Notified on Launch</span>
              </Button>

              <Link
                href="/batches"
                className="inline-flex items-center gap-1.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white px-4 py-3 rounded-xl text-caption font-bold transition-all cursor-pointer"
              >
                <Laptop className="h-4 w-4 text-white/80" />
                <span>Study on Web Now</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Pre-Register Notification Dialog */}
      <EnquiryDialog
        open={notifyDialogOpen}
        onOpenChange={setNotifyDialogOpen}
        batchTitle="Quick2Learn Mobile App Pre-Registration"
      />
    </section>
  );
}
