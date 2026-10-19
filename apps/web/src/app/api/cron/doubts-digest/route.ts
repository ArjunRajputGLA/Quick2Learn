import { NextRequest, NextResponse } from "next/server";
import { sendDailyDoubtsDigest } from "@/server/data/doubts";

export const dynamic = "force-dynamic";

async function handleDigest(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      if (process.env.NODE_ENV === "production") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const result = await sendDailyDoubtsDigest();

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      ...result,
    });
  } catch (err) {
    console.error("[cron/doubts-digest] Error sending doubts daily digest:", err);
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  return handleDigest(req);
}

export async function POST(req: NextRequest) {
  return handleDigest(req);
}
