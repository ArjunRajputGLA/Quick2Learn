import { NextRequest, NextResponse } from "next/server";
import { autoSubmitExpiredAttempts } from "@/server/data/tests";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      // In development or local testing without cronSecret, allow invocation
      if (process.env.NODE_ENV === "production") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const result = await autoSubmitExpiredAttempts();

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      ...result,
    });
  } catch (err) {
    console.error("[cron/test-attempts] Error auto-submitting expired attempts:", err);
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
