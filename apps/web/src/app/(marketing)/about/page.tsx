import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { BreadcrumbsPlacement } from "@/components/layout/breadcrumbs-placement";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getAboutPageData } from "@/server/data/catalog";
import { YouTubeIcon } from "@/components/ui/icons";
import {
  GraduationCap,
  Award,
  MapPin,
  ExternalLink,
  CheckCircle2,
  Video,
  ArrowRight,
  Sparkles,
} from "lucide-react";

export const metadata: Metadata = {
  title: "About Quick2Learn — Dinesh Singh Rajput & Faculty Legacy | Mathura",
  description:
    "Learn about Quick2Learn's 25+ years teaching legacy in Mathura, founder Dinesh Singh Rajput's national awards, our master faculty mentors, and free YouTube lessons.",
  alternates: {
    canonical: "/about",
  },
  openGraph: {
    title: "About Quick2Learn — Dinesh Singh Rajput & Faculty Legacy",
    description:
      "Learn about Quick2Learn's 25+ years teaching legacy in Mathura, founder Dinesh Singh Rajput's national awards, and master faculty mentors.",
    url: "https://quick2learn.in/about",
  },
  twitter: {
    card: "summary_large_image",
    title: "About Quick2Learn | Mathura",
  },
};

export default async function AboutPage() {
  const { story, channelStats, facultyList, dineshProfile } = await getAboutPageData();

  // Photo resolution for Dinesh Sir
  const dineshPhoto =
    dineshProfile?.photoKey === "faculty/faculty-dinesh.webp"
      ? "https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&auto=format&fit=crop&q=80"
      : dineshProfile?.photoKey ||
        "https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&auto=format&fit=crop&q=80";

  // Prestigious honours list
  const dineshHonours = [
    {
      title: "25+ Years Teaching Mathematics",
      detail: "Continuous top rankers & centum scorers in Mathura district across Senior Secondary Board Examinations.",
    },
    {
      title: "Best Teacher Award 2015",
      detail: "Awarded by Sharda Group in 2015 for outstanding pedagogical contributions and concept-first mentoring.",
    },
    {
      title: "Teacher Innovation Award 2019",
      detail: "Conferred by Shri Aurobindo Society for innovative conceptual learning frameworks in Mathematics.",
    },
    {
      title: "Certificate from HRD Minister (July 2015)",
      detail: "Official Certificate of Honour from the Union Minister of Human Resource Development for stellar CBSE Senior School results.",
    },
  ];

  return (
    <div className="bg-surface">
      <BreadcrumbsPlacement
        items={[
          { label: "Home", href: "/" },
          { label: "About Quick2Learn", href: "/about" },
        ]}
      />

      {/* Hero & Story Section */}
      <section className="container mx-auto px-4 py-8 lg:py-14 max-w-5xl space-y-12">
        <div className="space-y-4 max-w-3xl">
          <Badge variant="primary" className="mb-2">
            Mathura Campus • Est. 2000 • Single Institute
          </Badge>
          <h1 className="text-display font-extrabold tracking-tight text-ink">
            {story.title}
          </h1>
          <p className="text-h3 font-medium text-primary">
            {story.subtitle}
          </p>
          <p className="text-body text-ink-muted leading-relaxed">
            {story.story}
          </p>
          {story.mission && (
            <p className="text-body text-ink-muted leading-relaxed">
              <strong className="text-ink font-semibold">Our Mission:</strong> {story.mission}
            </p>
          )}
        </div>

        {/* Founder's Philosophy Banner */}
        {story.founder_quote && (
          <div className="rounded-xl border-l-4 border-l-primary border border-border bg-surface-subtle p-6 lg:p-8 shadow-xs">
            <blockquote className="text-body-lg italic text-ink font-serif leading-relaxed">
              &ldquo;{story.founder_quote}&rdquo;
            </blockquote>
            <p className="text-small font-semibold text-primary mt-3">
              — Mr. Dinesh Singh Rajput, Founder &amp; Head of Mathematics
            </p>
          </div>
        )}

        {/* Institute Values Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {story.values?.map((val, idx) => {
            const Icon = idx === 0 ? GraduationCap : idx === 1 ? Award : MapPin;
            const iconColor = idx === 0 ? "text-primary" : idx === 1 ? "text-accent" : "text-success";
            return (
              <div
                key={idx}
                className="rounded-xl border border-border bg-surface p-6 shadow-xs space-y-3"
              >
                <Icon className={`h-7 w-7 ${iconColor}`} />
                <h3 className="text-h3 font-bold text-ink">{val.title}</h3>
                <p className="text-small text-ink-muted leading-relaxed">
                  {val.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Founder Profile Spotlight: Dinesh Singh Rajput */}
        <div className="rounded-2xl border border-border bg-surface p-6 lg:p-10 shadow-card space-y-8">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
            <div className="relative h-44 w-44 lg:h-52 lg:w-52 shrink-0 overflow-hidden rounded-2xl border-2 border-primary/20 shadow-md">
              <Image
                src={dineshPhoto}
                alt={dineshProfile?.name || "Mr. Dinesh Singh Rajput"}
                fill
                priority
                className="object-cover"
              />
            </div>

            <div className="flex-1 space-y-4 text-center md:text-left">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                <Badge variant="primary">25+ Years Teaching Legacy</Badge>
                <Badge variant="accent">National &amp; State Recognitions</Badge>
              </div>

              <div>
                <h2 className="text-display-xs font-bold text-ink">
                  {dineshProfile?.name || "Mr. Dinesh Singh Rajput"}
                </h2>
                <p className="text-body font-semibold text-primary mt-1">
                  {dineshProfile?.designation || "Founder & Head of Senior Secondary Mathematics"}
                </p>
              </div>

              <p className="text-small text-ink-muted leading-relaxed max-w-2xl">
                {dineshProfile?.bio ||
                  "Veteran educator mentoring Class XI & XII CBSE and ISC students to centum scores and district ranks in Mathura for over 25 years. Renowned for conceptual calculus breakdowns, formula derivation clarity, and personalized student feedback."}
              </p>

              <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-3">
                <Link href="/faculty/dinesh-singh-rajput">
                  <Button variant="primary" className="gap-2">
                    <span>View Dinesh Sir&apos;s Full Profile</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/batches">
                  <Button variant="outline">Browse Classroom Batches</Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Prestigious Honours Grid */}
          <div className="border-t border-border pt-6">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-5 w-5 text-accent" />
              <h3 className="text-h3 font-bold text-ink">
                Honours, Awards &amp; State Recognitions
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {dineshHonours.map((honour, idx) => (
                <div
                  key={idx}
                  className="rounded-lg border border-border bg-surface-subtle p-4 flex items-start gap-3"
                >
                  <CheckCircle2 className="h-5 w-5 text-success shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-body font-bold text-ink">{honour.title}</h4>
                    <p className="text-small text-ink-muted mt-0.5 leading-snug">
                      {honour.detail}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Dynamic Faculty Grid */}
        <div id="faculty" className="space-y-6 pt-4 border-t border-border">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-h2 font-bold text-ink">Our Core Faculty Mentors</h2>
              <p className="text-small text-ink-muted">
                Direct teaching by master educators with zero outsourced classes.
              </p>
            </div>
            <Link
              href="/contact"
              className="text-small font-semibold text-primary hover:underline inline-flex items-center gap-1"
            >
              <span>Schedule a Campus Visit</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {facultyList.map((fac) => {
              const isDinesh = fac.slug.includes("dinesh");
              const avatar = isDinesh
                ? "https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&auto=format&fit=crop&q=80"
                : "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600&auto=format&fit=crop&q=80";

              return (
                <div
                  key={fac.id}
                  className="rounded-xl border border-border bg-surface p-6 shadow-card hover:shadow-card-hover transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="flex items-start gap-4">
                    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-border">
                      <Image
                        src={avatar}
                        alt={fac.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="space-y-1 flex-1">
                      <h3 className="text-h3 font-bold text-ink">{fac.name}</h3>
                      <p className="text-caption font-semibold text-primary">
                        {fac.designation}
                      </p>
                      <Badge variant="neutral" className="text-[11px] mt-1">
                        {isDinesh ? "25+ Years Experience" : "15+ Years Experience"}
                      </Badge>
                    </div>
                  </div>

                  <p className="text-small text-ink-muted leading-relaxed">
                    {fac.bio}
                  </p>

                  <div className="pt-3 border-t border-border flex items-center justify-between">
                    <span className="text-caption text-ink-muted">
                      Mathura Campus Mentor
                    </span>
                    <Link
                      href={`/faculty/${fac.slug}`}
                      className="text-small font-bold text-primary hover:underline inline-flex items-center gap-1"
                    >
                      <span>View Profile &amp; Batches</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* YouTube Channel Call-To-Action Banner */}
        <div className="rounded-2xl border border-danger/20 bg-gradient-to-r from-red-50/50 via-surface to-red-50/30 p-8 lg:p-10 shadow-card">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="space-y-3 text-center lg:text-left max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-100 text-danger text-caption font-bold">
                <YouTubeIcon className="h-4 w-4" />
                <span>Official Channel • {channelStats.handle}</span>
              </div>
              <h2 className="text-display-xs font-bold text-ink">
                {channelStats.title}
              </h2>
              <p className="text-small text-ink-muted leading-relaxed">
                {channelStats.description}
              </p>

              {/* Channel Stats Row */}
              <div className="pt-2 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-caption text-ink font-semibold">
                <div className="flex items-center gap-1.5">
                  <GraduationCap className="h-4 w-4 text-primary" />
                  <span>{channelStats.subscribers}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Video className="h-4 w-4 text-danger" />
                  <span>{channelStats.videos}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Award className="h-4 w-4 text-accent" />
                  <span>{channelStats.views}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0 w-full sm:w-auto">
              <a
                href={channelStats.youtube_url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full"
              >
                <button
                  type="button"
                  className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-4 text-small transition-colors shadow-sm"
                >
                  <YouTubeIcon className="h-4 w-4" />
                  <span>Subscribe on YouTube</span>
                  <ExternalLink className="h-3.5 w-3.5 ml-1 opacity-80" />
                </button>
              </a>
              <Link href="/lectures" className="w-full">
                <Button variant="outline" className="w-full text-small">
                  Browse Free Video Lessons
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
