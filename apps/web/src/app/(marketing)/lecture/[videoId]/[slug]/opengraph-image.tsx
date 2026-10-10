import { ImageResponse } from "next/og";
import { getVideoDetails } from "@/server/data/videos";
import { formatClassRoman } from "@quick2learn/shared";

export const runtime = "nodejs";
export const alt = "Quick2Learn Video Lecture";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: Promise<{ videoId: string; slug: string }>;
}) {
  const { videoId } = await params;
  const details = await getVideoDetails(videoId).catch(() => null);

  const title = details?.video.title || "Video Lecture · Quick2Learn";
  const classRoman = details?.video.classLevel
    ? `Class ${formatClassRoman(details.video.classLevel)}`
    : "Senior School";
  const subjectName = details?.subject?.name || "Mathematics";
  const facultyName = details?.faculty?.name || "Dinesh Singh Rajput";

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
        {/* Top Bar: Brand + Badges */}
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

        {/* Center: Lecture Title */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px", maxWidth: "1000px" }}>
          <div
            style={{
              fontSize: title.length > 60 ? "46px" : "56px",
              fontWeight: 800,
              lineHeight: 1.18,
              letterSpacing: "-0.02em",
              color: "#FFFFFF",
            }}
          >
            {title}
          </div>
          <div style={{ fontSize: "24px", color: "#FCD34D", fontWeight: 600 }}>
            Mentor: {facultyName} (25+ yrs experience)
          </div>
        </div>

        {/* Bottom Bar: Location & Tagline */}
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
          <span>Mathura Coaching Centre · Offline &amp; Online Classes</span>
          <span style={{ fontWeight: 700, color: "#FFFFFF" }}>quick2learn.in</span>
        </div>
      </div>
    ),
    {
      ...size,
    },
  );
}
