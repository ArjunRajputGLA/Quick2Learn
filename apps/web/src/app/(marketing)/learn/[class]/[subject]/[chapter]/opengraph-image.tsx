import { ImageResponse } from "next/og";
import { getChapterBySlug } from "@/server/data/videos";
import { slugToClassLevel, formatClassRoman } from "@quick2learn/shared";

export const runtime = "nodejs";
export const alt = "Quick2Learn Chapter Overview";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: Promise<{ class: string; subject: string; chapter: string }>;
}) {
  const { class: classParam, subject: subjectParam, chapter: chapterParam } =
    await params;

  const classLevel = slugToClassLevel(classParam) || 12;
  const data = await getChapterBySlug(
    classLevel,
    subjectParam.toLowerCase(),
    chapterParam.toLowerCase(),
  ).catch(() => null);

  const chapterTitle = data?.chapter.title || "Chapter Study Materials";
  const chapterNumber = data?.chapter.number ? `Chapter ${data.chapter.number}` : "";
  const classRoman = `Class ${formatClassRoman(classLevel)}`;
  const subjectName = data?.subject.name || subjectParam.toUpperCase();

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#2563EB",
          backgroundImage: "linear-gradient(135deg, #0F172A 0%, #3B82F6 100%)",
          padding: "60px 70px",
          color: "#FFFFFF",
          fontFamily: "sans-serif",
        }}
      >
        {/* Top Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "12px",
                backgroundColor: "#F59E0B",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#1E1B4B",
                fontWeight: 900,
                fontSize: "24px",
              }}
            >
              Q
            </div>
            <span style={{ fontSize: "28px", fontWeight: 800, letterSpacing: "-0.02em" }}>
              Quick2Learn
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                backgroundColor: "#F59E0B",
                color: "#1E1B4B",
                padding: "8px 22px",
                borderRadius: "9999px",
                fontSize: "20px",
                fontWeight: 800,
                letterSpacing: "0.05em",
                textTransform: "uppercase",
              }}
            >
              {classRoman}
            </div>
            <div
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.15)",
                color: "#FFFFFF",
                padding: "8px 20px",
                borderRadius: "9999px",
                fontSize: "20px",
                fontWeight: 600,
              }}
            >
              {subjectName}
            </div>
          </div>
        </div>

        {/* Center: Chapter Info */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px", maxWidth: "1000px" }}>
          {chapterNumber && (
            <div style={{ fontSize: "24px", color: "#FCD34D", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              {chapterNumber}
            </div>
          )}
          <div
            style={{
              fontSize: chapterTitle.length > 40 ? "50px" : "62px",
              fontWeight: 800,
              lineHeight: 1.15,
              letterSpacing: "-0.02em",
              color: "#FFFFFF",
            }}
          >
            {chapterTitle}
          </div>
          <div style={{ fontSize: "22px", color: "rgba(255, 255, 255, 0.85)" }}>
            Complete Video Lectures in Hindi · Hand-curated Notes · Formulas &amp; PYQs
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: "1px solid rgba(255, 255, 255, 0.2)",
            paddingTop: "24px",
            fontSize: "20px",
            color: "rgba(255, 255, 255, 0.85)",
          }}
        >
          <span>Mathura Campus · Mentored by Dinesh Singh Rajput</span>
          <span style={{ fontWeight: 700, color: "#FFFFFF" }}>quick2learn.in</span>
        </div>
      </div>
    ),
    {
      ...size,
    },
  );
}
