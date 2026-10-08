"use client";

import * as React from "react";
import Link from "next/link";
import { BookOpen, Video, ArrowRight, UserCheck } from "lucide-react";
import { SectionHeader } from "@/components/ui/section-header";
import { Chip } from "@/components/ui/chip";
import type { PickYourClassData } from "@/server/data/catalog";

export interface PickYourClassProps {
  data: PickYourClassData;
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
    <section id="curriculum" className="bg-surface py-14 md:py-16">
      <div className="container mx-auto px-4 max-w-[1200px]">
        {/* Section Header */}
        <SectionHeader
          eyebrow="Targeted Curriculum"
          title="Pick your class"
          description="Explore board-aligned subject modules, lecture counts, and structured notes for Classes IX through XII."
        />

        {/* Controls row: Class chips and Board Toggle */}
        <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border/70">
          {/* Class Chips */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            <span className="text-small font-semibold text-ink-muted mr-1 shrink-0">
              Class:
            </span>
            {classes.map((cls) => {
              const isSelected = selectedClass === cls;
              return (
                <Chip
                  key={cls}
                  selected={isSelected}
                  onClick={() => setSelectedClass(cls)}
                  className="px-4 py-1.5 font-semibold"
                >
                  Class {cls}
                </Chip>
              );
            })}
          </div>

          {/* Board Segmented Toggle */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-small font-semibold text-ink-muted mr-1">
              Board:
            </span>
            <div className="inline-flex rounded-full border border-border bg-surface-subtle p-1 shadow-xs">
              <button
                type="button"
                onClick={() => setSelectedBoard("cbse")}
                className={`rounded-full px-3.5 py-1 text-caption font-semibold transition-all cursor-pointer ${
                  selectedBoard === "cbse"
                    ? "bg-primary text-surface shadow-xs"
                    : "text-ink-muted hover:text-ink"
                }`}
              >
                CBSE
              </button>
              <button
                type="button"
                onClick={() => setSelectedBoard("icse")}
                className={`rounded-full px-3.5 py-1 text-caption font-semibold transition-all cursor-pointer ${
                  selectedBoard === "icse"
                    ? "bg-primary text-surface shadow-xs"
                    : "text-ink-muted hover:text-ink"
                }`}
              >
                ICSE / ISC
              </button>
            </div>
          </div>
        </div>

        {/* Subjects Grid */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {subjects.map((sub) => (
            <div
              key={sub.id}
              className="group flex flex-col justify-between rounded-lg border border-border bg-surface p-6 shadow-card hover:shadow-card-hover hover:border-primary/40 transition-all"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="h-11 w-11 rounded-md bg-primary-soft text-primary flex items-center justify-center">
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-subtle border border-border/80 px-2.5 py-0.5 text-caption font-semibold text-ink-muted">
                    <Video className="h-3.5 w-3.5 text-primary" />
                    <span>{sub.lectureCount} Lectures</span>
                  </span>
                </div>

                <div>
                  <h4 className="text-h3 font-bold text-ink group-hover:text-primary transition-colors">
                    {sub.name}
                  </h4>
                  <div className="mt-2 flex items-center gap-1.5 text-small text-ink-muted">
                    <UserCheck className="h-4 w-4 text-primary shrink-0" />
                    <span>Mentor: {sub.facultyName}</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-border flex items-center justify-between">
                <span className="text-caption font-medium text-ink-muted">
                  Class {selectedClass} · {selectedBoard.toUpperCase()}
                </span>
                <Link
                  href={sub.href}
                  className="inline-flex items-center gap-1 text-small font-semibold text-primary group-hover:text-primary-hover group-hover:underline"
                >
                  <span>Start free</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
