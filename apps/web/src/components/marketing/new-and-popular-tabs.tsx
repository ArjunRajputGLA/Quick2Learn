"use client";

import * as React from "react";
import { CardCarousel } from "@/components/ui/card-carousel";
import { LectureCard } from "@/components/ui/lecture-card";
import type { FormattedLectureCardData } from "@/server/data/videos";

export interface NewAndPopularTabsProps {
  heading?: string;
  latestVideos: FormattedLectureCardData[];
  mostWatchedVideos: FormattedLectureCardData[];
  boardExamVideos: FormattedLectureCardData[];
}

export function NewAndPopularTabs({
  heading = "New and popular",
  latestVideos,
  mostWatchedVideos,
  boardExamVideos,
}: NewAndPopularTabsProps) {
  const [activeTab, setActiveTab] = React.useState<"latest" | "most_watched" | "board_exam">("latest");

  const tabs = [
    { id: "latest", label: "Latest" },
    { id: "most_watched", label: "Most watched" },
    { id: "board_exam", label: "Board exam prep" },
  ];

  const currentVideos =
    activeTab === "latest"
      ? latestVideos
      : activeTab === "most_watched"
      ? mostWatchedVideos
      : boardExamVideos;

  if (
    (!latestVideos || latestVideos.length === 0) &&
    (!mostWatchedVideos || mostWatchedVideos.length === 0) &&
    (!boardExamVideos || boardExamVideos.length === 0)
  ) {
    return null;
  }

  return (
    <section id="lectures" className="bg-surface py-14 md:py-16">
      <div className="container mx-auto px-4 max-w-[1200px]">
        <CardCarousel
          heading={heading}
          tabs={tabs}
          activeTabId={activeTab}
          onTabChange={(tabId) => setActiveTab(tabId as "latest" | "most_watched" | "board_exam")}
          viewAllHref="/lectures"
          viewAllText="View all free lectures"
        >
          {currentVideos.map((video) => (
            <LectureCard
              key={`${activeTab}-${video.id}`}
              id={video.id}
              title={video.title}
              thumbnailUrl={video.thumbnailUrl}
              duration={video.duration}
              gradeAndSubject={video.gradeAndSubject}
              faculty={video.faculty}
              views={video.views}
              publishedAt={video.publishedAt}
              href={video.href}
            />
          ))}
        </CardCarousel>
      </div>
    </section>
  );
}
