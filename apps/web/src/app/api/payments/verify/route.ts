import { NextRequest, NextResponse } from "next/server";
import { verifyPaymentInputSchema } from "@quick2learn/shared";
import { verifyPaymentSignature, markPaymentPaid } from "@/server/payments";

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const parsed = verifyPaymentInputSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid verification payload", details: parsed.error.issues },
        { status: 400 },
      );
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      parsed.data;

    // 1. Verify HMAC-SHA256 signature using constant-time comparison
    const isValid = verifyPaymentSignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    );

    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid payment signature" },
        { status: 400 },
      );
    }

    // 2. Mark payment paid in database (idempotent, assigns receipt number from sequence)
    const result = await markPaymentPaid(
      razorpay_order_id,
      razorpay_payment_id,
      "client_verify",
    );

    return NextResponse.json({
      success: true,
      paymentId: result.payment.id,
      receiptNo: result.receiptNo,
      redirectUrl: `/dashboard/payments/${result.payment.id}`,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Payment verification failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
