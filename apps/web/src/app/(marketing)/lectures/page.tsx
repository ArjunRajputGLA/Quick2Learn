import type { Metadata } from "next";
import Image from "next/image";
import { getVideos } from "@/server/data/videos";
import { BreadcrumbsPlacement } from "@/components/layout/breadcrumbs-placement";
import { YouTubeIcon } from "@/components/ui/icons";
import { INSTITUTE_INFO } from "@quick2learn/shared";
import { ExternalLink, CheckCircle2 } from "lucide-react";
import { LecturesCatalog } from "@/components/lectures/lectures-catalog";

export const metadata: Metadata = {
  title: "Free Video Lectures — CBSE & ICSE Mathematics & Science | Quick2Learn",
  description:
    "Watch free conceptual video lectures in Hindi for CBSE & ICSE Classes 9–12. One-shot chapter revisions, formulas, and board PYQ marathons by Dinesh Sir in Mathura.",
  alternates: {
    canonical: "/lectures",
  },
  openGraph: {
    title: "Free Video Lectures | Quick2Learn",
    description:
      "Watch free conceptual video lectures in Hindi for CBSE & ICSE Classes 9–12.",
    url: "https://quick2learn.in/lectures",
  },
  twitter: {
    card: "summary_large_image",
    title: "Free Video Lectures | Quick2Learn",
  },
};

export default async function LecturesPage() {
  const videoList = await getVideos();

  return (
    <div>
      <BreadcrumbsPlacement
        items={[
          { label: "Home", href: "/" },
          { label: "Free Lectures", href: "/lectures" },
        ]}
      />

      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 space-y-8">
        {/* YouTube Channel Hero Showcase Card with Official Channel Banner */}
        <div className="rounded-3xl border border-border/80 shadow-md overflow-hidden bg-slate-950 text-white">
          {/* Official YouTube Channel Panorama Banner */}
          <div className="relative w-full aspect-[1060/175] min-h-[90px] sm:min-h-[140px] md:min-h-[175px] bg-slate-900 border-b border-white/10">
            <Image
              src="/images/assets/channels4_banner.jpg"
              alt="Quick2Learn Official YouTube Channel Banner — Dinesh Singh Rajput & Namita Singh Rajput"
              fill
              priority
              className="object-cover object-center"
              sizes="(max-width: 1440px) 100vw, 1440px"
            />
          </div>

          <div className="p-5 sm:p-8 lg:p-10 bg-linear-to-br from-slate-950 via-slate-900 to-indigo-950 relative overflow-hidden">
            {/* Subtle YouTube Crimson Glow Backdrop */}
            <div className="absolute -right-20 -top-20 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

          {/* Animated Hero Video Backdrop - Perfectly Balanced & Positioned */}
          <div className="absolute right-2 sm:right-6 md:right-12 lg:right-20 xl:right-28 -bottom-6 sm:-bottom-10 md:-bottom-12 lg:-bottom-14 xl:-bottom-16 w-72 h-72 sm:w-[400px] sm:h-[400px] md:w-[460px] md:h-[460px] lg:w-[500px] lg:h-[500px] xl:w-[540px] xl:h-[540px] pointer-events-none select-none opacity-50 sm:opacity-80 lg:opacity-90 transition-all z-0">
            <video
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-contain"
              aria-hidden="true"
            >
              <source
                src="/images/assets/Official Quick2Learn Lectures.webm"
                type="video/webm"
              />
              <source
                src="/images/assets/Official Quick2Learn Lectures.mp4"
                type="video/mp4"
              />
            </video>
          </div>

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div className="max-w-xl xl:max-w-2xl space-y-4">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-caption font-bold bg-red-600 text-white shadow-xs">
                  <YouTubeIcon className="h-3.5 w-3.5" />
                  Free Video Lessons
                </span>
                <span className="text-caption font-semibold text-white/80">
                  YouTube Official Portal • NCERT &amp; Board PYQs
                </span>
              </div>

              <h1 className="text-display font-extrabold tracking-tight text-white leading-tight">
                Official Quick2Learn Lectures
              </h1>

              <p className="text-body text-white/75 leading-relaxed max-w-2xl">
                Curated video lessons taught by Mr. Dinesh Singh Rajput (25+ yrs Senior Mathematics)
                and Mrs. Namita Singh Rajput (ICSE Sciences). Learn complex calculus proofs, trigonometry tricks,
                and board exam questions at zero cost.
              </p>

              {/* Channel Advantages */}
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-2 text-small text-white/85">
                <span className="inline-flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  CBSE &amp; ICSE Classes IX–XII
                </span>
                <span className="inline-flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  Formula &amp; Proof Breakdowns
                </span>
                <span className="inline-flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  Board Exam Marathons
                </span>
                <span className="inline-flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  100% Free on YouTube
                </span>
              </div>
            </div>

            {/* Subscribe Action Button in Lower Right Corner */}
            <div className="shrink-0 pt-4 lg:pt-0 lg:self-end relative z-10 w-full sm:w-auto">
              <a
                href={INSTITUTE_INFO.youtube.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl bg-[#FF0000] hover:bg-[#D90000] text-white font-bold text-small shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 select-none w-full sm:w-auto text-center"
              >
                <YouTubeIcon className="h-5 w-5 shrink-0" />
                <span>Subscribe on YouTube (@Quick2Learn)</span>
                <ExternalLink className="h-4 w-4 opacity-80 shrink-0" />
              </a>
            </div>
          </div>
        </div>
      </div>

        {/* Video Catalog with Live Search & Filtering */}
        <LecturesCatalog initialVideos={videoList} />
      </div>
    </div>
  );
}
