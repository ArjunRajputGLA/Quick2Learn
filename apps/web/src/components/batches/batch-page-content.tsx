"use client";

import * as React from "react";
import NextLink from "next/link";
import { formatClassRoman, formatINR } from "@quick2learn/shared";
import { BreadcrumbsPlacement } from "@/components/layout/breadcrumbs-placement";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
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

  const classRoman = formatClassRoman(batch.classLevel);
  const isOpen = batch.status === "open";
  const primaryPricePaise = primaryFeePlan?.totalPaise ?? 1800000;

  // Enrollment link logic
  const checkoutHref = `/checkout/${batch.slug}`;
  const enrollHref = isLoggedIn
    ? checkoutHref
    : `/login?next=${encodeURIComponent(checkoutHref)}`;

  // Teacher avatar
  const isDinesh = faculty?.slug?.includes("dinesh");
  const avatarUrl = isDinesh
    ? "https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&auto=format&fit=crop&q=80"
    : "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600&auto=format&fit=crop&q=80";

  const durationStr = formatBatchDuration(batch.startDate, batch.endDate);
  const startDateStr = formatStartDate(batch.startDate);

  const sections = [
    { id: "about", label: "About" },
    { id: "outcomes", label: "What you'll learn" },
    { id: "syllabus", label: "Syllabus" },
    { id: "teacher", label: "Teacher" },
    { id: "fees", label: "Fees" },
    { id: "faqs", label: "FAQs" },
  ];

  return (
    <div>
      {/* Staff Preview Banner */}
      {isStaffPreview && (
        <aside
          aria-label="Staff preview notice"
          className="bg-amber-500 text-ink-on-primary py-2 px-4 text-center text-small font-bold flex items-center justify-center gap-2"
        >
          <AlertTriangle className="h-4 w-4" />
          <span>
            Staff Draft Preview Mode — This batch is not published to the public catalog.
          </span>
        </aside>
      )}

      {/* Breadcrumbs */}
      <BreadcrumbsPlacement
        items={[
          { label: "Home", href: "/" },
          { label: "Batches", href: "/batches" },
          {
            label: `Class ${classRoman}`,
            href: `/batches?class=${batch.classLevel}`,
          },
          { label: batch.title },
        ]}
      />

      {/* 1. COURSERA-STYLE BANNER (primary-soft) */}
      <section className="bg-primary-soft/40 border-b border-border py-8 lg:py-12">
        <div className="container mx-auto px-4 max-w-[1100px] space-y-6">
          {/* Badges row */}
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="primary">Class {classRoman}</Badge>
            <Badge variant="neutral">{batch.board.toUpperCase()}</Badge>
            <Badge variant="accent" className="uppercase">
              {batch.mode}
            </Badge>
            {subject && <Badge variant="neutral">{subject.name}</Badge>}
            {isOpen ? (
              <Badge variant="primary" className="bg-emerald-600 text-surface">
                Admissions Open
              </Badge>
            ) : (
              <Badge variant="neutral" className="bg-neutral-700 text-surface">
                Admissions Closed
              </Badge>
            )}
            {/* Show "N students enrolled" only when N >= 10 */}
            {enrolledCount >= 10 && (
              <Badge variant="accent" className="font-semibold">
                {enrolledCount} students enrolled
              </Badge>
            )}
          </div>

          {/* Title & Subtitle */}
          <div className="space-y-3">
            <h1 className="text-display font-extrabold text-ink tracking-tight leading-tight">
              {batch.title}
            </h1>
            {batch.subtitle && (
              <p className="text-body font-medium text-ink-muted max-w-3xl leading-relaxed">
                {batch.subtitle}
              </p>
            )}
          </div>

          {/* Teacher row */}
          {faculty && (
            <div className="flex items-center gap-3 pt-1">
              <Avatar
                src={avatarUrl}
                fallback={faculty.name}
                size="md"
                className="border border-primary/20 shadow-xs"
              />
              <div>
                <span className="text-caption text-ink-muted block">Taught by</span>
                <NextLink
                  href={`/faculty/${faculty.slug}`}
                  className="font-bold text-body text-ink hover:text-primary transition-colors underline decoration-dotted"
                >
                  {faculty.name}
                </NextLink>
                <span className="text-caption text-ink-muted ml-2 font-medium">
                  ({faculty.designation})
                </span>
              </div>
            </div>
          )}

          {/* Start Date & Actions */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-2 text-small font-semibold text-ink">
              <Calendar className="h-4 w-4 text-primary" />
              <span>Starts {startDateStr}</span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {isOpen ? (
                <NextLink
                  href={enrollHref}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3.5 text-body font-bold text-surface shadow-md hover:bg-primary-hover active:scale-98 transition-all"
                >
                  <span>Enroll now — {formatINR(primaryPricePaise)}</span>
                  <ArrowRight className="h-4 w-4" />
                </NextLink>
              ) : (
                <button
                  type="button"
                  onClick={handleOpenWaitlist}
                  className="inline-flex items-center gap-2 rounded-lg bg-neutral-900 px-6 py-3.5 text-body font-bold text-surface shadow-md hover:bg-neutral-800 active:scale-98 transition-all cursor-pointer"
                >
                  <UserPlus className="h-4 w-4" />
                  <span>Admissions closed — join the waitlist</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleOpenEnquiry}
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-5 py-3.5 text-body font-semibold text-ink hover:bg-surface-subtle active:scale-98 transition-all cursor-pointer shadow-xs"
              >
                <MessageSquare className="h-4 w-4 text-primary" />
                <span>Enquire</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 2. INFO BAR UNDER BANNER (4 CELLS) */}
      <section className="border-b border-border bg-surface">
        <div className="container mx-auto px-4 max-w-[1100px]">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-border">
            {/* Cell 1: Duration */}
            <div className="p-4 sm:p-5 flex items-start gap-3">
              <Clock className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <span className="text-caption font-semibold uppercase tracking-wider text-ink-muted block">
                  Duration
                </span>
                <span className="text-small font-bold text-ink">
                  {durationStr}
                </span>
              </div>
            </div>

            {/* Cell 2: Schedule */}
            <div className="p-4 sm:p-5 flex items-start gap-3">
              <Calendar className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <span className="text-caption font-semibold uppercase tracking-wider text-ink-muted block">
                  Schedule
                </span>
                <span className="text-small font-bold text-ink">
                  {batch.scheduleText}
                </span>
              </div>
            </div>

            {/* Cell 3: Mode & Location */}
            <div className="p-4 sm:p-5 flex items-start gap-3">
              <MapPin className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <span className="text-caption font-semibold uppercase tracking-wider text-ink-muted block">
                  Mode &amp; Location
                </span>
                <span className="text-small font-bold text-ink">
                  <span className="capitalize">{batch.mode}</span>
                  {batch.locationText && ` · ${batch.locationText}`}
                </span>
              </div>
            </div>

            {/* Cell 4: Seats Left */}
            <div className="p-4 sm:p-5 flex items-start gap-3">
              <Users className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <span className="text-caption font-semibold uppercase tracking-wider text-ink-muted block">
                  Seats Left
                </span>
                <span className="text-small font-bold text-ink">
                  {isOpen ? (
                    seatsRemaining <= 10 ? (
                      <span className="text-amber-600 font-extrabold">
                        Only {seatsRemaining} seats left!
                      </span>
                    ) : (
                      `${seatsRemaining} of ${batch.seatsTotal} seats left`
                    )
                  ) : (
                    <span className="text-danger font-semibold">
                      Admissions closed (Full)
                    </span>
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. STICKY SUB-NAVIGATION TABS WITH SCROLL-SPY */}
      <BatchScrollNav sections={sections} />

      {/* 4. MAIN CONTENT SECTIONS */}
      <main className="container mx-auto px-4 max-w-[1100px] py-10 space-y-16 pb-28 md:pb-16">
        {/* SECTION 1: ABOUT (with MathText support) */}
        <section id="about" className="space-y-5 scroll-mt-28">
          <div className="border-b border-border pb-3">
            <h2 className="text-h2 font-bold text-ink">About This Batch</h2>
          </div>

          <div className="rounded-xl border border-border bg-surface p-6 sm:p-8 space-y-4 shadow-xs">
            <div className="text-body text-ink leading-relaxed whitespace-pre-line font-sans">
              <MathText content={batch.description} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-border/60">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-success shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-small text-ink">
                    Mathura Institute Campus
                  </h4>
                  <p className="text-caption text-ink-muted">
                    Classroom facilities with air-conditioned lecture halls.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-success shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-small text-ink">
                    Small Batch Sizes
                  </h4>
                  <p className="text-caption text-ink-muted">
                    Strict cap of {batch.seatsTotal} students for personalized doubt solving.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-success shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-small text-ink">
                    Direct Mentor Access
                  </h4>
                  <p className="text-caption text-ink-muted">
                    Daily doubt clearance before and after scheduled lectures.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2: WHAT YOU'LL LEARN (2-column checklist) */}
        <section id="outcomes" className="space-y-5 scroll-mt-28">
          <div className="border-b border-border pb-3">
            <h2 className="text-h2 font-bold text-ink">What You&apos;ll Learn</h2>
          </div>

          <div className="rounded-xl border border-primary/20 bg-surface p-6 sm:p-8 shadow-xs">
            {batch.outcomes && batch.outcomes.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {batch.outcomes.map((outcome, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-success shrink-0 mt-0.5" />
                    <span className="text-body font-medium text-ink leading-snug">
                      {outcome}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-small text-ink-muted">
                Comprehensive curriculum coverage designed to secure 95%+ marks in board examinations.
              </p>
            )}
          </div>
        </section>

        {/* SECTION 3: SYLLABUS (Modules → Chapters with Free Previews) */}
        <section id="syllabus" className="space-y-5 scroll-mt-28">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
            <div>
              <h2 className="text-h2 font-bold text-ink">Course Syllabus</h2>
              <p className="text-caption text-ink-muted mt-0.5">
                Structured sequential breakdown with board weightage and concept drilling.
              </p>
            </div>
            <span className="text-caption text-ink-muted">
              {enrichedSyllabus.length} Modules
            </span>
          </div>

          <BatchSyllabusAccordion syllabus={enrichedSyllabus} />
        </section>

        {/* SECTION 4: TEACHER CARD */}
        {faculty && (
          <section id="teacher" className="space-y-5 scroll-mt-28">
            <div className="border-b border-border pb-3">
              <h2 className="text-h2 font-bold text-ink">Faculty Mentor</h2>
            </div>

            <div className="rounded-xl border border-border bg-surface p-6 sm:p-8 shadow-card flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-8">
              <div className="relative h-36 w-36 sm:h-44 sm:w-44 shrink-0 overflow-hidden rounded-xl border-2 border-primary/20 shadow-md">
                <img
                  src={avatarUrl}
                  alt={faculty.name}
                  className="h-full w-full object-cover"
                />
              </div>

              <div className="space-y-3 text-center sm:text-left flex-1">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <Badge variant="primary">
                    {isDinesh ? "25+ Years Senior Mathematics" : "15+ Years ICSE Sciences"}
                  </Badge>
                  <Badge variant="neutral">Mathura Campus Mentor</Badge>
                </div>

                <h3 className="text-h2 font-bold text-ink">{faculty.name}</h3>
                <p className="text-body font-semibold text-primary">
                  {faculty.designation}
                </p>
                <p className="text-small text-ink-muted leading-relaxed">
                  {faculty.bio}
                </p>

                {/* Achievements */}
                {Boolean(faculty.achievements) && Array.isArray(faculty.achievements) && faculty.achievements.length > 0 && (
                  <div className="pt-2 space-y-1.5">
                    <span className="text-caption font-bold uppercase tracking-wider text-ink-muted block">
                      Recognitions &amp; Achievements:
                    </span>
                    <ul className="space-y-1 text-small text-ink">
                      {(faculty.achievements as Array<{ title?: string; description?: string }>).map((ach, aIdx) => (
                        <li key={aIdx} className="flex items-start gap-2 justify-center sm:justify-start">
                          <Award className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                          <span>
                            <strong>{ach.title || "Recognition"}:</strong>{" "}
                            {ach.description}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="pt-3">
                  <NextLink
                    href={`/faculty/${faculty.slug}`}
                    className="inline-flex items-center gap-1.5 text-small font-semibold text-primary hover:underline"
                  >
                    <span>View complete mentor profile &amp; lectures</span>
                    <ArrowRight className="h-4 w-4" />
                  </NextLink>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* SECTION 5: FEES (Active fee plans cards with instalments breakdown) */}
        <section id="fees" className="space-y-5 scroll-mt-28">
          <div className="border-b border-border pb-3">
            <h2 className="text-h2 font-bold text-ink">Fee Structure &amp; Payment Options</h2>
            <p className="text-caption text-ink-muted mt-0.5">
              Transparent pricing with no hidden charges. Choose full payment or interest-free instalments.
            </p>
          </div>

          <BatchFeesSection
            isOpen={isOpen}
            feePlans={feePlans}
            enrollBaseHref={enrollHref}
            onOpenWaitlist={handleOpenWaitlist}
          />
        </section>

        {/* SECTION 6: TESTIMONIALS & FAQS */}
        <section id="faqs" className="space-y-10 scroll-mt-28">
          {/* Testimonials (if any for this class level) */}
          {testimonials && testimonials.length > 0 && (
            <div className="space-y-5">
              <div className="border-b border-border pb-3">
                <h2 className="text-h2 font-bold text-ink">Student Success Stories</h2>
                <p className="text-caption text-ink-muted mt-0.5">
                  Hear from past Class {classRoman} students mentored in Mathura.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {testimonials.map((test) => (
                  <div
                    key={test.id}
                    className="rounded-xl border border-border bg-surface p-6 shadow-xs space-y-4 flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <Quote className="h-6 w-6 text-primary/30" />
                      <p className="text-small text-ink leading-relaxed italic">
                        &ldquo;{test.quote}&rdquo;
                      </p>
                    </div>

                    <div className="pt-3 border-t border-border flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-small text-ink">
                          {test.studentName}
                        </h4>
                        <span className="text-caption text-ink-muted">
                          Class {formatClassRoman(test.classLevel)} • {test.year}
                        </span>
                      </div>
                      <Badge variant="accent">Top Scorer</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* FAQs Accordion */}
          <div className="space-y-5">
            <div className="border-b border-border pb-3">
              <h2 className="text-h2 font-bold text-ink flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-primary" />
                <span>Frequently Asked Questions</span>
              </h2>
            </div>

            {batch.faqs && Array.isArray(batch.faqs) && batch.faqs.length > 0 ? (
              <Accordion type="single" defaultValue="faq-0" className="border rounded-xl bg-surface">
                {(batch.faqs as Array<{ question?: string; answer?: string }>).map((faq, fIdx) => (
                  <AccordionItem key={fIdx} value={`faq-${fIdx}`} className="px-5">
                    <AccordionTrigger className="text-body font-semibold text-ink">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-small text-ink-muted leading-relaxed">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            ) : (
              <Accordion type="single" defaultValue="faq-0" className="border rounded-xl bg-surface">
                <AccordionItem value="faq-0" className="px-5">
                  <AccordionTrigger className="text-body font-semibold text-ink">
                    What if a student misses a classroom lecture?
                  </AccordionTrigger>
                  <AccordionContent className="text-small text-ink-muted leading-relaxed">
                    Backup video recordings of conceptual topics and class notes are provided on the Quick2Learn student portal.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="faq-1" className="px-5">
                  <AccordionTrigger className="text-body font-semibold text-ink">
                    Are mock test series included in the fee?
                  </AccordionTrigger>
                  <AccordionContent className="text-small text-ink-muted leading-relaxed">
                    Yes, all weekly Sunday mock tests, board sample papers, and personal evaluation discussions are fully included.
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
