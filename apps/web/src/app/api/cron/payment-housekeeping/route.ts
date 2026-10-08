import { NextResponse } from "next/server";
import { getServerEnv } from "@/lib/env";
import { runPaymentHousekeeping } from "@/server/payments";

export const dynamic = "force-dynamic";

async function handleHousekeeping(request: Request) {
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
        { status: 401 },
      );
    }

    const result = await runPaymentHousekeeping();

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      ...result,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Housekeeping cron failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  return handleHousekeeping(request);
}

export async function POST(request: Request) {
  return handleHousekeeping(request);
}
