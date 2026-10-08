import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  BookOpen,
  Award,
  CheckCircle2,
  Users,
  Clock,
  ArrowRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { getFacultyProfileWithBatchesAndLectures } from "@/server/data/catalog";
import { LectureCard } from "@/components/ui/lecture-card";
import { formatINR } from "@quick2learn/shared";

interface FacultyPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: FacultyPageProps): Promise<Metadata> {
  const { slug } = await params;
  const data = await getFacultyProfileWithBatchesAndLectures(slug);
  if (!data) return { title: "Faculty Mentor | Quick2Learn" };

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://quick2learn.in";
  return {
    title: `${data.faculty.name} — ${data.faculty.designation} | Quick2Learn Mathura`,
    description: data.faculty.bio.substring(0, 160),
    alternates: {
      canonical: `/faculty/${slug}`,
    },
    openGraph: {
      title: `${data.faculty.name} — ${data.faculty.designation} | Quick2Learn`,
      description: data.faculty.bio.substring(0, 160),
      url: `${baseUrl}/faculty/${slug}`,
      type: "profile",
    },
    twitter: {
      card: "summary_large_image",
      title: `${data.faculty.name} | Quick2Learn`,
      description: data.faculty.bio.substring(0, 160),
    },
  };
}

export default async function FacultyProfilePage({ params }: FacultyPageProps) {
  const { slug } = await params;
  const profileData = await getFacultyProfileWithBatchesAndLectures(slug);

  if (!profileData) {
    notFound();
  }

  const { faculty, batches, lectures } = profileData;
  const isDinesh = faculty.slug.includes("dinesh");
  const avatarUrl = isDinesh
    ? "https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&auto=format&fit=crop&q=80"
    : "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600&auto=format&fit=crop&q=80";

  const personLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: faculty.name,
    jobTitle: faculty.designation,
    description: faculty.bio,
    image: avatarUrl,
    worksFor: {
      "@type": "EducationalOrganization",
      name: "Quick2Learn",
      url: "https://quick2learn.in",
    },
    award: Array.isArray(faculty.achievements) ? (faculty.achievements as string[]) : [],
    knowsAbout: ["Mathematics", "CBSE Mathematics", "Board Exam Preparation"],
  };

  return (
    <div className="bg-surface py-10 md:py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personLd) }}
      />
      <div className="container mx-auto px-4 max-w-5xl space-y-12">
        {/* Back Link */}
        <Link
          href="/about#faculty"
          className="inline-flex items-center gap-1.5 text-small font-semibold text-primary hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Faculty Overview</span>
        </Link>

        {/* Profile Header Card */}
        <div className="rounded-2xl border border-border bg-surface p-6 sm:p-10 shadow-card flex flex-col sm:flex-row items-center sm:items-start gap-8">
          <div className="relative h-44 w-44 sm:h-52 sm:w-52 shrink-0 overflow-hidden rounded-2xl border-2 border-primary/20 shadow-md">
            <Image
              src={avatarUrl}
              alt={faculty.name}
              fill
              priority
              className="object-cover"
            />
          </div>

          <div className="flex-1 space-y-3.5 text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <Badge variant="primary">
                {isDinesh ? "25+ Years Experience" : "15+ Years Experience"}
              </Badge>
              <Badge variant="accent">Mathura Campus Mentor</Badge>
            </div>

            <h1 className="text-display font-bold text-ink">
              {faculty.name}
            </h1>

            <p className="text-h3 font-semibold text-primary">
              {faculty.designation}
            </p>

            <p className="text-body text-ink-muted leading-relaxed">
              {faculty.bio}
            </p>

            <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-3">
              <a href="#batches">
                <Button variant="primary">View Batches ({batches.length})</Button>
              </a>
              <a href="#lectures">
                <Button variant="outline">Watch Latest Lectures</Button>
              </a>
            </div>
          </div>
        </div>

        {/* Highlights, Qualifications & Achievements */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-border shadow-card bg-surface">
            <CardHeader>
              <div className="flex items-center gap-2 text-primary font-semibold text-body">
                <Award className="h-5 w-5" />
                <CardTitle className="text-h3">
                  Honours &amp; Key Achievements
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3.5 text-small text-ink-muted">
              {faculty.achievements && Array.isArray(faculty.achievements) && faculty.achievements.length > 0 ? (
                (faculty.achievements as Array<{ title?: string; description?: string }>).map((ach, idx) => (
                  <div key={idx} className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-success shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-ink font-semibold">{ach.title || "Recognition"}:</strong>{" "}
                      <span>{ach.description || "Outstanding senior secondary academic contribution."}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-success shrink-0 mt-0.5" />
                  <span>25+ years teaching senior secondary students with continuous district &amp; state toppers.</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border shadow-card bg-surface">
            <CardHeader>
              <div className="flex items-center gap-2 text-primary font-semibold text-body">
                <BookOpen className="h-5 w-5" />
                <CardTitle className="text-h3">Specialized Disciplines</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-small text-ink-muted">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <span>
                  {isDinesh
                    ? "Class XI & XII CBSE / ISC Senior Mathematics (Calculus, Vectors, Matrices, Probability)"
                    : "Class IX & X ICSE Chemistry & Biology (Equations, Periodic Trends, Plant Physiology)"}
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <span>PYQ trend analysis and step-by-step board answer presentation training.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <span>Daily practice problem sheets and weekly Sunday board-pattern mock examinations.</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Batches Mentored by this Faculty */}
        <section id="batches" className="space-y-6 pt-6 border-t border-border">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-h2 font-bold text-ink">
                Batches Mentored by {faculty.name}
              </h2>
              <p className="text-small text-ink-muted">
                Classroom and hybrid cohorts with limited batch sizes for personal mentorship.
              </p>
            </div>
            <Link href="/batches" className="text-small font-semibold text-primary hover:underline">
              All Institute Batches →
            </Link>
          </div>

          {batches.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {batches.map((b) => (
                <div
                  key={b.id}
                  className="rounded-xl border border-border bg-surface p-6 shadow-card hover:shadow-card-hover transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="primary">
                        Class {b.classLevel} • {b.board}
                      </Badge>
                      <Badge variant="neutral" className="capitalize">
                        {b.mode}
                      </Badge>
                    </div>

                    <h3 className="text-h3 font-bold text-ink hover:text-primary transition-colors">
                      <Link href={b.href}>{b.title}</Link>
                    </h3>

                    {b.subtitle && (
                      <p className="text-small text-ink-muted leading-snug">
                        {b.subtitle}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2 text-caption text-ink-muted border-t border-border pt-3">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-primary shrink-0" />
                      <span>{b.scheduleText}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-accent shrink-0" />
                      <span>
                        {b.seatsRemaining > 0
                          ? `${b.seatsRemaining} seats left (Total: ${b.seatsTotal})`
                          : "Batch full • Waitlist open"}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between">
                    <div>
                      <div className="text-[11px] text-ink-muted uppercase font-bold tracking-wider">
                        Tuition Fee
                      </div>
                      <div className="text-body font-bold text-ink">
                        {b.startingPricePaise > 0
                          ? `From ${formatINR(b.startingPricePaise)}`
                          : "Standard Institute Plan"}
                      </div>
                    </div>
                    <Link href={b.href}>
                      <Button variant="primary" size="sm" className="gap-1.5">
                        <span>Enroll Now</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border bg-surface-subtle p-8 text-center space-y-3">
              <p className="text-body text-ink-muted">
                New cohorts with {faculty.name} are currently being scheduled for the upcoming term.
              </p>
              <Link href="/batches">
                <Button variant="primary">View All Available Batches</Button>
              </Link>
            </div>
          )}
        </section>

        {/* Latest Lectures by this Faculty */}
        <section id="lectures" className="space-y-6 pt-6 border-t border-border">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-h2 font-bold text-ink">
                Latest Video Lessons by {faculty.name}
              </h2>
              <p className="text-small text-ink-muted">
                Watch conceptual walkthroughs and board PYQ marathons for free.
              </p>
            </div>
            <Link href="/lectures" className="text-small font-semibold text-primary hover:underline">
              All Lectures →
            </Link>
          </div>

          {lectures.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {lectures.map((v) => (
                <LectureCard
                  key={v.id}
                  id={v.id}
                  title={v.title}
                  thumbnailUrl={v.thumbnailUrl}
                  duration={v.duration}
                  gradeAndSubject={v.gradeAndSubject}
                  faculty={v.faculty}
                  views={v.views}
                  publishedAt={v.publishedAt}
                  href={v.href}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border bg-surface-subtle p-8 text-center">
              <p className="text-body text-ink-muted">
                Lectures by {faculty.name} are being synced from YouTube.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
