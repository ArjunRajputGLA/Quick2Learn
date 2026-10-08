import { NextResponse } from "next/server";
import { syncYouTubeChannel } from "@/server/youtube/sync";
import { getServerEnv } from "@/lib/env";

export const dynamic = "force-dynamic";

/**
 * Daily cron handler for syncing YouTube videos and playlists.
 * Requires `Authorization: Bearer ${CRON_SECRET}`.
 */
export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    const env = getServerEnv();

    const expectedHeader = `Bearer ${env.CRON_SECRET}`;

    if (!authHeader || authHeader !== expectedHeader) {
      return NextResponse.json(
        { error: "Unauthorized: Invalid or missing bearer token." },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(request.url);
    const forceFull = searchParams.get("full") === "true";

    const result = await syncYouTubeChannel({
      forceFull,
      mode: forceFull ? "full" : "auto",
    });

    return NextResponse.json({
      success: result.errors.length === 0,
      runId: result.runId,
      mode: result.mode,
      added: result.added,
      updated: result.updated,
      errors: result.errors,
      durationMs: result.durationMs,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 },
    );
  }
}
