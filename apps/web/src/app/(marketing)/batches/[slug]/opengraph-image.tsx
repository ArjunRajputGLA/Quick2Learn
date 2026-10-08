import { ImageResponse } from "next/og";
import { getBatchDetailBySlug } from "@/server/data/batches";
import { formatClassRoman } from "@quick2learn/shared";

export const runtime = "nodejs";
export const alt = "Quick2Learn Coaching Batch";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await getBatchDetailBySlug(slug).catch(() => null);

  const title = data?.batch.title || "Coaching Batch · Quick2Learn";
  const classRoman = data?.batch.classLevel
    ? `Class ${formatClassRoman(data.batch.classLevel)}`
    : "Batch";
  const subtitle =
    data?.batch.subtitle ||
    "Structured Classroom Coaching & Board Mentorship in Mathura";
  const modeText =
    data?.batch.mode === "offline"
      ? "Offline Classroom"
      : data?.batch.mode === "online"
        ? "Online Live"
        : "Hybrid Mode";

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#312E81",
          backgroundImage: "linear-gradient(135deg, #1E1B4B 0%, #4338CA 100%)",
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
              {modeText}
            </div>
          </div>
        </div>

        {/* Center: Batch Info */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px", maxWidth: "1000px" }}>
          <div
            style={{
              fontSize: title.length > 40 ? "50px" : "62px",
              fontWeight: 800,
              lineHeight: 1.15,
              letterSpacing: "-0.02em",
              color: "#FFFFFF",
            }}
          >
            {title}
          </div>
          <div style={{ fontSize: "24px", color: "#FCD34D", fontWeight: 600 }}>
            {subtitle}
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
          <span>Mathura Campus · Near BSA College Road · Admissions Open</span>
          <span style={{ fontWeight: 700, color: "#FFFFFF" }}>quick2learn.in</span>
        </div>
      </div>
    ),
    {
      ...size,
    },
  );
}
