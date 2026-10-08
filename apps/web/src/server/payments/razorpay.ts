import crypto from "crypto";
import { serverEnv } from "@/lib/env";

export interface CreateOrderParams {
  amountPaise: number;
  currency?: string;
  receipt: string;
  notes?: Record<string, string>;
}

export interface RazorpayOrderResponse {
  id: string;
  entity: "order";
  amount: number;
  amount_paid: number;
  amount_due: number;
  currency: string;
  receipt: string;
  status: "created" | "attempted" | "paid";
  notes?: Record<string, string>;
  created_at: number;
}

/**
 * Creates an order via Razorpay Orders API.
 * Uses HTTP Basic Authentication.
 * When in test/dummy mode (rzp_test_dummy or NODE_ENV=test), generates a simulated order ID.
 */
export async function createRazorpayOrder(
  params: CreateOrderParams,
): Promise<RazorpayOrderResponse> {
  const keyId = serverEnv.RAZORPAY_KEY_ID;
  const keySecret = serverEnv.RAZORPAY_KEY_SECRET;

  // Mock / Offline Test Mode
  if (
    keyId === "rzp_test_dummy" ||
    keyId.startsWith("dummy") ||
    process.env.NODE_ENV === "test" ||
    process.env.MOCK_RAZORPAY === "true"
  ) {
    const mockOrderId = `order_${crypto.randomBytes(8).toString("hex")}`;
    return {
      id: mockOrderId,
      entity: "order",
      amount: params.amountPaise,
      amount_paid: 0,
      amount_due: params.amountPaise,
      currency: params.currency || "INR",
      receipt: params.receipt,
      status: "created",
      notes: params.notes,
      created_at: Math.floor(Date.now() / 1000),
    };
  }

  const basicAuth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
  const response = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${basicAuth}`,
    },
    body: JSON.stringify({
      amount: params.amountPaise,
      currency: params.currency || "INR",
      receipt: params.receipt,
      notes: params.notes || {},
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Razorpay Orders API error (${response.status}): ${errorText}`,
    );
  }

  const data = (await response.json()) as RazorpayOrderResponse;
  return data;
}

/**
 * Verifies Razorpay client payment signature:
 * Expected: HMAC-SHA256(orderId + "|" + paymentId, keySecret)
 * Uses constant-time comparison to prevent timing attacks.
 */
export function verifyPaymentSignature(
  orderId: string,
  paymentId: string,
  signature: string,
  secret?: string,
): boolean {
  if (!orderId || !paymentId || !signature) {
    return false;
  }

  const keySecret = secret || serverEnv.RAZORPAY_KEY_SECRET;
  const payload = `${orderId}|${paymentId}`;

  const expectedSignature = crypto
    .createHmac("sha256", keySecret)
    .update(payload)
    .digest("hex");

  try {
    const sigBuffer = Buffer.from(signature, "hex");
    const expectedBuffer = Buffer.from(expectedSignature, "hex");

    if (sigBuffer.length !== expectedBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(sigBuffer, expectedBuffer);
  } catch {
    return false;
  }
}

/**
 * Verifies Razorpay webhook signature:
 * Expected: HMAC-SHA256(rawBody, webhookSecret)
 * Uses constant-time comparison to prevent timing attacks.
 */
export function verifyWebhookSignature(
  rawBody: string,
  signature: string,
  secret?: string,
): boolean {
  if (!rawBody || !signature) {
    return false;
  }

  const webhookSecret = secret || serverEnv.RAZORPAY_WEBHOOK_SECRET;

  const expectedSignature = crypto
    .createHmac("sha256", webhookSecret)
    .update(rawBody)
    .digest("hex");

  try {
    const sigBuffer = Buffer.from(signature, "hex");
    const expectedBuffer = Buffer.from(expectedSignature, "hex");

    if (sigBuffer.length !== expectedBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(sigBuffer, expectedBuffer);
  } catch {
    return false;
  }
}
