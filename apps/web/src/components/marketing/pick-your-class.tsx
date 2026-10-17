"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Calculator,
  Atom,
  FlaskConical,
  Dna,
  Landmark,
  BookOpen,
  GraduationCap,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Video,
} from "lucide-react";
import { SectionHeader } from "@/components/ui/section-header";
import type { PickYourClassData } from "@/server/data/catalog";
import { cn } from "@/lib/utils";

export interface PickYourClassProps {
  data: PickYourClassData;
}

// Subject Theme Definition with tailored visual identities
interface SubjectTheme {
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  iconColor: string;
  badgeBg: string;
  badgeColor: string;
  borderHover: string;
  glowGradient: string;
  topGradient: string;
  tagline: string;
  defaultTopics: Record<"IX" | "X" | "XI" | "XII", string[]>;
}

const SUBJECT_THEMES: Record<string, SubjectTheme> = {
  mathematics: {
    icon: Calculator,
    iconBg: "bg-indigo-50 border-indigo-200/80 group-hover:bg-indigo-600 group-hover:border-indigo-600",
    iconColor: "text-indigo-600 group-hover:text-white",
    badgeBg: "bg-indigo-50 border-indigo-200/80",
    badgeColor: "text-indigo-700",
    borderHover: "hover:border-indigo-500/50 hover:shadow-indigo-500/10",
    glowGradient: "from-indigo-500/10 via-indigo-500/2 to-transparent",
    topGradient: "from-indigo-500 via-violet-500 to-indigo-600",
    tagline: "Formulas, Proofs & 100/100 Board Strategy",
    defaultTopics: {
      XII: ["Calculus & Integrals", "Vectors & 3D Geometry", "Matrices & Determinants"],
      XI: ["Trigonometric Functions", "Conic Sections & Circles", "Permutations & Combinations"],
      X: ["Trigonometry & Heights", "Quadratic Equations", "Coordinate Geometry & Triangles"],
      IX: ["Polynomials & Factorization", "Lines, Angles & Triangles", "Surface Areas & Volumes"],
    },
  },
  physics: {
    icon: Atom,
    iconBg: "bg-sky-50 border-sky-200/80 group-hover:bg-sky-600 group-hover:border-sky-600",
    iconColor: "text-sky-600 group-hover:text-white",
    badgeBg: "bg-sky-50 border-sky-200/80",
    badgeColor: "text-sky-700",
    borderHover: "hover:border-sky-500/50 hover:shadow-sky-500/10",
    glowGradient: "from-sky-500/10 via-sky-500/2 to-transparent",
    topGradient: "from-sky-500 via-blue-500 to-cyan-500",
    tagline: "Core Concepts, Ray Optics & Problem Solving",
    defaultTopics: {
      XII: ["Electrostatics & Current", "Ray & Wave Optics", "Electromagnetic Induction"],
      XI: ["Laws of Motion & Friction", "Work, Energy & Power", "Thermodynamics & Waves"],
      X: ["Light: Reflection & Refraction", "Electricity & Circuits", "Magnetic Effects of Current"],
      IX: ["Motion & Speed Laws", "Force & Gravitation", "Work, Energy & Sound"],
    },
  },
  chemistry: {
    icon: FlaskConical,
    iconBg: "bg-emerald-50 border-emerald-200/80 group-hover:bg-emerald-600 group-hover:border-emerald-600",
    iconColor: "text-emerald-600 group-hover:text-white",
    badgeBg: "bg-emerald-50 border-emerald-200/80",
    badgeColor: "text-emerald-700",
    borderHover: "hover:border-emerald-500/50 hover:shadow-emerald-500/10",
    glowGradient: "from-emerald-500/10 via-emerald-500/2 to-transparent",
    topGradient: "from-emerald-500 via-teal-500 to-green-500",
    tagline: "Reaction Mechanisms, Balancing & Formulas",
    defaultTopics: {
      XII: ["Solutions & Electrochemistry", "Coordination Compounds", "Aldehydes, Ketones & Amines"],
      XI: ["Atomic Structure & Orbitals", "Chemical Bonding & VSEPR", "Hydrocarbons & Organic Prep"],
      X: ["Chemical Reactions & Equations", "Acids, Bases & Salts", "Carbon & Its Compounds"],
      IX: ["Matter in Our Surroundings", "Atoms & Molecules", "Structure of the Atom"],
    },
  },
  science: {
    icon: FlaskConical,
    iconBg: "bg-teal-50 border-teal-200/80 group-hover:bg-teal-600 group-hover:border-teal-600",
    iconColor: "text-teal-600 group-hover:text-white",
    badgeBg: "bg-teal-50 border-teal-200/80",
    badgeColor: "text-teal-700",
    borderHover: "hover:border-teal-500/50 hover:shadow-teal-500/10",
    glowGradient: "from-teal-500/10 via-teal-500/2 to-transparent",
    topGradient: "from-teal-500 via-emerald-500 to-cyan-500",
    tagline: "Integrated Physics, Chemistry & Biology",
    defaultTopics: {
      XII: ["Physics & Chemistry Foundations", "Advanced Numericals", "Board Revision"],
      XI: ["Core Science Fundamentals", "Practical Derivations", "Concept Building"],
      X: ["Chemical Reactions & Electricity", "Life Processes & Heredity", "Light Reflection & Human Eye"],
      IX: ["Motion, Force & Gravitation", "Atoms, Molecules & Cells", "Tissues & Natural Resources"],
    },
  },
  biology: {
    icon: Dna,
    iconBg: "bg-rose-50 border-rose-200/80 group-hover:bg-rose-600 group-hover:border-rose-600",
    iconColor: "text-rose-600 group-hover:text-white",
    badgeBg: "bg-rose-50 border-rose-200/80",
    badgeColor: "text-rose-700",
    borderHover: "hover:border-rose-500/50 hover:shadow-rose-500/10",
    glowGradient: "from-rose-500/10 via-rose-500/2 to-transparent",
    topGradient: "from-rose-500 via-pink-500 to-red-500",
    tagline: "Anatomical Diagrams & Cell Physiology",
    defaultTopics: {
      XII: ["Genetics & Evolution", "Human Health & Diseases", "Biotechnology & Ecology"],
      XI: ["Cell: The Unit of Life", "Plant & Human Physiology", "Biological Classification"],
      X: ["Life Processes (Nutrition/Respiration)", "Control & Coordination", "Heredity & Reproduction"],
      IX: ["Cell Structure & Organelles", "Plant & Animal Tissues", "Why Do We Fall Ill"],
    },
  },
  "history-civics": {
    icon: Landmark,
    iconBg: "bg-amber-50 border-amber-200/80 group-hover:bg-amber-600 group-hover:border-amber-600",
    iconColor: "text-amber-600 group-hover:text-white",
    badgeBg: "bg-amber-50 border-amber-200/80",
    badgeColor: "text-amber-700",
    borderHover: "hover:border-amber-500/50 hover:shadow-amber-500/10",
    glowGradient: "from-amber-500/10 via-amber-500/2 to-transparent",
    topGradient: "from-amber-500 via-orange-500 to-yellow-500",
    tagline: "ICSE Constitution & Modern Indian History",
    defaultTopics: {
      XII: ["Indian Constitution", "World History", "Political Theory"],
      XI: ["Early Societies", "Empires & Revolutions", "Democratic Rights"],
      X: ["The Union Parliament & President", "Indian National Movement", "Contemporary World Wars"],
      IX: ["Our Constitution & Preamble", "The Harappan Civilization", "Vedic Period & Sangam Age"],
    },
  },
  hindi: {
    icon: BookOpen,
    iconBg: "bg-purple-50 border-purple-200/80 group-hover:bg-purple-600 group-hover:border-purple-600",
    iconColor: "text-purple-600 group-hover:text-white",
    badgeBg: "bg-purple-50 border-purple-200/80",
    badgeColor: "text-purple-700",
    borderHover: "hover:border-purple-500/50 hover:shadow-purple-500/10",
    glowGradient: "from-purple-500/10 via-purple-500/2 to-transparent",
    topGradient: "from-purple-500 via-fuchsia-500 to-pink-500",
    tagline: "Sahitya Sagar, Ekanki & Vyavaharik Vyakaran",
    defaultTopics: {
      XII: ["Kavya & Gadya Khand", "Nibandh & Patra Lekhan", "Advanced Vyakaran"],
      XI: ["Sahitya Manjusha", "Alankar & Chhand", "Bhasha Gyan"],
      X: ["Sahitya Sagar Stories", "Padya Bhaag Analysis", "Vyakaran & Rachna"],
      IX: ["Sahitya Sagar (Bat Athanni Ki)", "Ekanki Sanchay (Sanskar Aur Bhavna)", "Vyakaran, Nibandh & Patra"],
    },
  },
};

function getSubjectTheme(slug: string, name: string): SubjectTheme {
  const key = slug.toLowerCase();
  const directMatch = SUBJECT_THEMES[key];
  if (directMatch) return directMatch;
  if (/math/i.test(name) && SUBJECT_THEMES.mathematics) return SUBJECT_THEMES.mathematics;
  if (/physics/i.test(name) && SUBJECT_THEMES.physics) return SUBJECT_THEMES.physics;
  if (/chem/i.test(name) && SUBJECT_THEMES.chemistry) return SUBJECT_THEMES.chemistry;
  if (/bio/i.test(name) && SUBJECT_THEMES.biology) return SUBJECT_THEMES.biology;
  if (/science/i.test(name) && SUBJECT_THEMES.science) return SUBJECT_THEMES.science;
  if (/history|civic/i.test(name) && SUBJECT_THEMES["history-civics"]) return SUBJECT_THEMES["history-civics"];
  if (/hindi/i.test(name) && SUBJECT_THEMES.hindi) return SUBJECT_THEMES.hindi;

  return {
    icon: GraduationCap,
    iconBg: "bg-primary-soft border-primary/20 group-hover:bg-primary group-hover:border-primary",
    iconColor: "text-primary group-hover:text-white",
    badgeBg: "bg-primary-soft border-primary/20",
    badgeColor: "text-primary",
    borderHover: "hover:border-primary/50 hover:shadow-primary/10",
    glowGradient: "from-primary/10 via-primary/2 to-transparent",
    topGradient: "from-primary via-indigo-500 to-primary",
    tagline: "Structured Board Modules & Lecture Notes",
    defaultTopics: {
      XII: ["NCERT Board Theory", "Important Theorems", "Board Exam PYQs"],
      XI: ["Core Subject Fundamentals", "Exercise Solutions", "Concept Clarity"],
      X: ["Board Blueprint Topics", "Chapter Notes", "Target Distinction"],
      IX: ["Foundation Building", "Textbook Solutions", "Practice Problems"],
    },
  };
}

function getMentorDetails(facultyName: string) {
  const isDinesh = /dinesh/i.test(facultyName);
  const isNamita = /namita/i.test(facultyName);

  if (isDinesh) {
    return {
      name: "Mr. Dinesh Singh Rajput",
      role: "25+ Yrs Exp • Senior Math Head",
      avatar: "/images/assets/Dinesh Singh Rajput.jpeg",
      badge: "Founder & Master Mentor",
    };
  }
  if (isNamita) {
    return {
      name: "Mrs. Namita Singh Rajput",
      role: "15+ Yrs Exp • Head of ICSE Sciences",
      avatar: "/images/assets/Namita Singh Rajput.jpeg",
      badge: "ICSE Board Specialist",
    };
  }
  return {
    name: facultyName || "Quick2Learn Academic Mentor",
    role: "Senior Coaching Faculty • Mathura",
    avatar: null,
    badge: "Verified Mentor",
  };
}

export function PickYourClass({ data }: PickYourClassProps) {
  const [selectedClass, setSelectedClass] = React.useState<"IX" | "X" | "XI" | "XII">("XII");
  const [selectedBoard, setSelectedBoard] = React.useState<"cbse" | "icse">("cbse");

  const classData = data?.[selectedClass];
  const subjects = classData ? classData[selectedBoard] : [];

  if (!data || Object.keys(data).length === 0) {
    return null;
  }

  const classes: Array<"IX" | "X" | "XI" | "XII"> = ["IX", "X", "XI", "XII"];

  return (
    <section id="curriculum" className="bg-surface py-12 sm:py-16 md:py-20 relative">
      <div className="container mx-auto px-4 max-w-[1240px]">
        {/* Section Header */}
        <SectionHeader
          eyebrow="Targeted Curriculum"
          title="Pick your class"
          description="Explore board-aligned subject modules, lecture counts, and structured notes for Classes IX through XII."
        />

        {/* Dynamic Controls Bar: Class Segmented Tabs + Board Toggle */}
        <div className="mt-8 p-4 sm:p-5 rounded-2xl bg-surface-subtle/80 border border-border/80 shadow-2xs backdrop-blur-xs">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Class Tabs */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs sm:text-small font-bold text-ink mr-1 flex items-center gap-1.5 shrink-0">
                <GraduationCap className="h-4 w-4 text-primary" />
                <span>Target Class:</span>
              </span>
              {classes.map((cls) => {
                const isSelected = selectedClass === cls;
                return (
                  <button
                    key={cls}
                    type="button"
                    onClick={() => setSelectedClass(cls)}
                    className={cn(
                      "relative px-4 py-2 rounded-xl text-xs sm:text-small font-bold transition-all duration-200 cursor-pointer select-none",
                      isSelected
                        ? "bg-primary text-white shadow-md shadow-primary/25 scale-[1.02]"
                        : "bg-surface border border-border/80 text-ink-muted hover:text-ink hover:border-primary/40 hover:bg-surface-subtle"
                    )}
                  >
                    <span>Class {cls}</span>
                  </button>
                );
              })}
            </div>

            {/* Board Toggle */}
            <div className="flex items-center gap-2.5 self-start lg:self-auto">
              <span className="text-xs sm:text-small font-bold text-ink shrink-0">Board:</span>
              <div className="inline-flex rounded-xl border border-border/80 bg-surface p-1 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setSelectedBoard("cbse")}
                  className={cn(
                    "rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all duration-200 cursor-pointer",
                    selectedBoard === "cbse"
                      ? "bg-primary text-white shadow-xs"
                      : "text-ink-muted hover:text-ink hover:bg-surface-subtle"
                  )}
                >
                  CBSE
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedBoard("icse")}
                  className={cn(
                    "rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all duration-200 cursor-pointer",
                    selectedBoard === "icse"
                      ? "bg-primary text-white shadow-xs"
                      : "text-ink-muted hover:text-ink hover:bg-surface-subtle"
                  )}
                >
                  ICSE / ISC
                </button>
              </div>
            </div>
          </div>

          {/* Sub-banner feedback line */}
          <div className="mt-3.5 pt-3 border-t border-border/60 flex flex-wrap items-center justify-between gap-2.5 text-xs text-ink-muted font-medium">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span>
                Showing <strong>{subjects.length}</strong> core subject tracks for{" "}
                <strong className="text-ink">Class {selectedClass}</strong> (
                <strong className="text-primary">{selectedBoard.toUpperCase()} Curriculum</strong>)
              </span>
            </div>

            <div className="hidden sm:flex items-center gap-3 text-[11px] text-ink-muted">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                Zero-Cost Video Proofs
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                NCERT &amp; Selina PYQs
              </span>
            </div>
          </div>
        </div>

        {/* Dynamic Subjects Grid with Smooth Staggered Animation */}
        <div
          key={`${selectedClass}-${selectedBoard}`}
          className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in-50 duration-300"
        >
          {subjects.map((sub, idx) => {
            const theme = getSubjectTheme(sub.slug, sub.name);
            const mentor = getMentorDetails(sub.facultyName);
            const Icon = theme.icon;
            const topics = theme.defaultTopics[selectedClass] || [];

            return (
              <div
                key={sub.id}
                style={{ animationDelay: `${idx * 70}ms` }}
                className={cn(
                  "group relative flex flex-col justify-between rounded-2xl border border-border/80 bg-surface p-6 shadow-card hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 ease-out will-change-transform overflow-hidden",
                  theme.borderHover
                )}
              >
                {/* Decorative Glowing Accent Bar */}
                <div
                  className={cn(
                    "absolute top-0 left-0 right-0 h-1 bg-gradient-to-r opacity-70 group-hover:opacity-100 transition-opacity",
                    theme.topGradient
                  )}
                />
                {/* Radial ambient glow on hover */}
                <div
                  className={cn(
                    "absolute -top-20 -right-20 h-44 w-44 rounded-full bg-gradient-to-br opacity-0 group-hover:opacity-100 blur-2xl transition-opacity duration-500 pointer-events-none",
                    theme.glowGradient
                  )}
                />

                <div>
                  {/* Top: Subject Icon & Video Lecture Badge */}
                  <div className="flex items-start justify-between gap-3">
                    <div
                      className={cn(
                        "h-12 w-12 rounded-xl flex items-center justify-center border shadow-xs transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 shrink-0",
                        theme.iconBg
                      )}
                    >
                      <Icon className={cn("h-6 w-6 transition-colors duration-300", theme.iconColor)} />
                    </div>

                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-caption font-semibold bg-surface-subtle/80 border border-border/80 text-ink shadow-2xs group-hover:border-primary/40 group-hover:bg-surface transition-all">
                      <Video className="h-3.5 w-3.5 text-red-600 shrink-0" />
                      <span className="font-bold text-ink">{sub.lectureCount}</span>
                      <span className="text-ink-muted">
                        {sub.lectureCount === 1 ? "Lecture" : "Lectures"}
                      </span>
                    </div>
                  </div>

                  {/* Subject Name & Tagline */}
                  <div className="mt-4 space-y-1">
                    <h4 className="text-h3 font-bold text-ink group-hover:text-primary transition-colors leading-snug">
                      {sub.name}
                    </h4>
                    <p className="text-caption text-ink-muted line-clamp-1">
                      {theme.tagline}
                    </p>
                  </div>

                  {/* Core Syllabus Focus Chips */}
                  <div className="mt-4 pt-3 border-t border-border/70">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-ink-muted block mb-1.5">
                      Core Syllabus Focus:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {topics.map((topic, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center text-[11px] font-medium px-2.5 py-0.5 rounded-md bg-surface-subtle border border-border/70 text-ink/80 group-hover:border-primary/25 transition-colors"
                        >
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Bottom Segment: Mentor Details & Call to Action */}
                <div className="mt-6 pt-4 border-t border-border/70 space-y-3.5">
                  {/* Mentor Profile Row */}
                  <div className="flex items-center gap-3">
                    {mentor.avatar ? (
                      <div className="relative h-10 w-10 rounded-full overflow-hidden border-2 border-primary/20 shrink-0 shadow-2xs group-hover:border-primary/50 transition-colors">
                        <Image
                          src={mentor.avatar}
                          alt={mentor.name}
                          fill
                          sizes="40px"
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-primary to-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                        QF
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="text-small font-bold text-ink truncate group-hover:text-primary transition-colors">
                          {mentor.name}
                        </p>
                        <span title={mentor.badge} className="inline-flex items-center">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                        </span>
                      </div>
                      <p className="text-[11px] text-ink-muted truncate">
                        {mentor.role}
                      </p>
                    </div>
                  </div>

                  {/* Class Info and Action Button */}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-caption font-semibold text-ink-muted flex items-center gap-1">
                      <Sparkles className="h-3 w-3 text-accent" />
                      <span>
                        Class {selectedClass} • {selectedBoard.toUpperCase()}
                      </span>
                    </span>

                    <Link
                      href={sub.href}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-primary-soft text-primary font-bold text-xs group-hover:bg-primary group-hover:text-white transition-all duration-300 shadow-2xs group-hover:shadow-md cursor-pointer"
                    >
                      <span>Start free</span>
                      <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
