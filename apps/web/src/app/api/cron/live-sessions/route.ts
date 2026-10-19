import { NextResponse } from "next/server";
import { getServerEnv } from "@/lib/env";
import {
  generateSessionsFromTimetableCron,
  sendLiveClassStartReminders,
} from "@/server/data/live-sessions";

export const dynamic = "force-dynamic";

async function handleLiveSessionsCron(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    const env = getServerEnv();
    const expectedHeader = `Bearer ${env.CRON_SECRET}`;

    const url = new URL(request.url);
    const querySecret = url.searchParams.get("key");

    if (
      (!authHeader || authHeader !== expectedHeader) &&
      (!querySecret || querySecret !== env.CRON_SECRET)
    ) {
      return NextResponse.json(
        { error: "Unauthorized: Invalid or missing bearer token." },
        { status: 401 }
      );
    }

    // 1. Generate next 14 days of sessions from timetable slots
    const genResult = await generateSessionsFromTimetableCron(14);

    // 2. Send 10-minute reminders for sessions about to start
    const reminderResult = await sendLiveClassStartReminders();

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      timetableSessions: genResult,
      reminders: reminderResult,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Live sessions cron failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  return handleLiveSessionsCron(request);
}

export async function POST(request: Request) {
  return handleLiveSessionsCron(request);
}
