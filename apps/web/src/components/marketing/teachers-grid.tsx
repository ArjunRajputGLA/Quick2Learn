import * as React from "react";
import Link from "next/link";
import { BookOpen, Award, ArrowRight } from "lucide-react";
import { SectionHeader } from "@/components/ui/section-header";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
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


export function TeachersGrid({ facultyList }: TeachersGridProps) {
  if (!facultyList || facultyList.length === 0) {
    return null;
  }

  return (
    <section id="faculty" className="bg-surface py-14 md:py-16">
      <div className="container mx-auto px-4 max-w-[1200px] space-y-10">
        <SectionHeader
          eyebrow="Veteran Mentorship"
          title="Meet your teachers"
          description="Learn directly from educators with decades of classroom experience and a track record of top board ranks in Mathura."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {facultyList.map((faculty) => {
            const isDinesh = faculty.slug.includes("dinesh");
            const avatarUrl = isDinesh
              ? "https://images.unsplash.com/photo-1544717305-2782549b5136?w=400&auto=format&fit=crop&q=80"
              : "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80";

            return (
              <div
                key={faculty.id}
                className="group flex flex-col justify-between rounded-xl border border-border bg-surface p-6 shadow-card hover:shadow-card-hover hover:border-primary/40 transition-all"
              >
                <div className="space-y-5">
                  {/* Top: Avatar, Name, Designation */}
                  <div className="flex items-start gap-4">
                    <Avatar
                      src={avatarUrl}
                      fallback={faculty.name}
                      size="lg"
                      className="border-2 border-primary/20"
                    />
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-h3 font-bold text-ink group-hover:text-primary transition-colors">
                          {faculty.name}
                        </h4>
                        <Badge variant="primary" className="text-caption shrink-0">
                          {isDinesh ? "25+ Yrs Exp" : "15+ Yrs Exp"}
                        </Badge>
                      </div>
                      <p className="text-small font-semibold text-primary">
                        {faculty.designation}
                      </p>
                    </div>
                  </div>

                  {/* Bio */}
                  <p className="text-small text-ink-muted leading-relaxed line-clamp-3">
                    {faculty.bio}
                  </p>

                  {/* Achievements Pill */}
                  {Array.isArray(faculty.achievements) && faculty.achievements.length > 0 ? (
                    <div className="p-3 rounded-lg bg-surface-subtle border border-border/80 flex items-center gap-2.5 text-caption font-medium text-ink">
                      <Award className="h-4 w-4 text-accent shrink-0" />
                      <span className="line-clamp-1">
                        {String((faculty.achievements[0] as { title?: string })?.title || "Distinguished Board Mentor")}
                      </span>
                    </div>
                  ) : null}

                </div>


                {/* Footer link to faculty details */}
                <div className="mt-6 pt-4 border-t border-border flex items-center justify-between">
                  <span className="text-caption font-semibold uppercase tracking-wider text-ink-muted flex items-center gap-1.5">
                    <BookOpen className="h-3.5 w-3.5 text-primary" />
                    <span>{isDinesh ? "Mathematics Specialist" : "ICSE Chemistry & Biology"}</span>
                  </span>
                  <Link
                    href={`/faculty/${faculty.slug}`}
                    className="inline-flex items-center gap-1 text-small font-semibold text-primary hover:text-primary-hover hover:underline"
                  >
                    <span>View Profile</span>
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
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
