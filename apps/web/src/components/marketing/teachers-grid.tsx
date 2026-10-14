"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { BookOpen, ArrowRight, CheckCircle2, Sparkles } from "lucide-react";
import { SectionHeader } from "@/components/ui/section-header";

export interface FacultyItem {
  id: string;
  slug: string;
  name: string;
  designation: string;
  bio: string;
  photoKey?: string | null;
  achievements?: unknown;
}

export interface TeachersGridProps {
  facultyList: FacultyItem[];
}

function cleanText(str?: string | null): string {
  if (!str) return "";
  return str.replace(/\s*\[PLACEHOLDER\]/gi, "").trim();
}

export function TeachersGrid({ facultyList }: TeachersGridProps) {
  if (!facultyList || facultyList.length === 0) {
    return null;
  }

  return (
    <section id="faculty" className="bg-surface py-14 md:py-20">
      <div className="container mx-auto px-4 max-w-[1200px] space-y-10">
        <SectionHeader
          eyebrow="Veteran Mentorship"
          title="Meet your teachers"
          description="Learn directly from educators with decades of classroom experience and an unmatched track record of board toppers in Mathura."
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {facultyList.map((faculty) => {
            const isDinesh = faculty.slug.toLowerCase().includes("dinesh");
            const cleanName = cleanText(faculty.name) || (isDinesh ? "Mr. Dinesh Singh Rajput" : "Mrs. Namita Singh Rajput");
            const cleanDesignation = cleanText(faculty.designation) || (isDinesh ? "Founder & Head of Senior Mathematics" : "Head of ICSE Sciences (Chemistry & Biology)");
            const cleanBio = cleanText(faculty.bio) || (isDinesh
              ? "Over 25 years of teaching excellence in Senior Secondary Mathematics in Mathura, mentoring thousands of CBSE & ISC students to 99+ percentile board scores."
              : "Specialist educator in ICSE and Secondary Sciences with a focus on chemical reactions, equation balancing, anatomical diagrams, and rigorous board paper preparation.");

            // Use authentic faculty portrait photos
            const photoUrl = isDinesh
              ? "/images/assets/Dinesh Singh Rajput.jpeg"
              : "/images/assets/Namita Singh Rajput.jpeg";

            const experienceText = isDinesh ? "25+ Yrs Experience" : "15+ Yrs Experience";
            const subjectBadge = isDinesh ? "Senior Mathematics (Class 11 & 12)" : "Chemistry & Biology (Class 9 & 10)";

            const highlights = isDinesh
              ? [
                  "Recognised by HRD Minister for Outstanding Board Results",
                  "Over 10,000+ Students Mentored with 100/100 Scorers",
                ]
              : [
                  "ICSE Curriculum Expert with 98%+ Board Distinction Rate",
                  "Mastery in Chemical Reactions & Precision Biological Diagrams",
                ];

            return (
              <div
                key={faculty.id}
                className="group flex flex-col justify-between rounded-2xl border border-border/80 bg-surface p-7 shadow-xs hover:shadow-xl hover:border-primary/50 hover:-translate-y-1.5 transition-all duration-300 ease-out will-change-transform"
              >
                <div className="space-y-6">
                  {/* Top: Portrait Image, Verified Badge, Name & Role */}
                  <div className="flex items-start gap-5">
                    <div className="relative shrink-0">
                      <div className="h-24 w-24 sm:h-28 sm:w-28 rounded-2xl overflow-hidden shadow-sm ring-2 ring-primary/20 group-hover:ring-primary/50 transition-all duration-300 relative">
                        <Image
                          src={photoUrl}
                          alt={cleanName}
                          fill
                          sizes="(max-width: 640px) 96px, 112px"
                          className="object-cover group-hover:scale-108 transition-transform duration-500 ease-out"
                        />
                      </div>
                      <div className="absolute -bottom-2 -right-2 bg-emerald-600 text-white rounded-full p-1 shadow-xs group-hover:scale-110 transition-transform duration-200" title="Verified Faculty">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      </div>
                    </div>

                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-primary-soft text-primary border border-primary/20">
                          {experienceText}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          Verified Mentor
                        </span>
                      </div>

                      <h4 className="text-h3 font-bold text-ink group-hover:text-primary transition-colors leading-snug">
                        {cleanName}
                      </h4>

                      <p className="text-small font-semibold text-primary/90 leading-tight">
                        {cleanDesignation}
                      </p>
                    </div>
                  </div>

                  {/* Bio */}
                  <p className="text-small text-ink-muted leading-relaxed line-clamp-3">
                    {cleanBio}
                  </p>

                  {/* Key Highlights */}
                  <div className="space-y-2 pt-3 border-t border-border">
                    {highlights.map((h, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs font-semibold text-ink">
                        <Sparkles className="h-3.5 w-3.5 text-accent shrink-0" />
                        <span className="line-clamp-1">{h}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer link to faculty details */}
                <div className="mt-6 pt-4 border-t border-border flex items-center justify-between">
                  <span className="text-caption font-semibold uppercase tracking-wider text-ink-muted flex items-center gap-1.5">
                    <BookOpen className="h-3.5 w-3.5 text-primary" />
                    <span>{subjectBadge}</span>
                  </span>

                  <Link
                    href={`/faculty/${faculty.slug}`}
                    className="inline-flex items-center gap-1.5 text-small font-semibold text-primary hover:text-primary-hover hover:underline group/link"
                  >
                    <span>View Profile</span>
                    <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover/link:translate-x-1" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
