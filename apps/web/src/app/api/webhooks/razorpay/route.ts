import { NextRequest, NextResponse } from "next/server";
import { handleRazorpayWebhook } from "@/server/payments";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-razorpay-signature") || "";

    const result = await handleRazorpayWebhook(rawBody, signature);
    return NextResponse.json(result.body, { status: result.statusCode });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Webhook handler failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
