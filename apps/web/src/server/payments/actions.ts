"use server";

import { checkoutOrderSchema, type CheckoutOrderInput } from "@quick2learn/shared";
import { getCurrentUser } from "@/server/auth/session";
import { createPaymentOrder, createPaymentOrderForDue } from "./service";
import type { AuthUser } from "../authz";

/**
 * Server Action: createOrderAction
 * Enforces Zod validation, authenticated session, and executes
 * the transactional order creation with batch locking and seat checks.
 */
export async function createOrderAction(rawInput: CheckoutOrderInput) {
  const parsed = checkoutOrderSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      success: false as const,
      error: parsed.error.issues[0]?.message || "Invalid order input parameters.",
    };
  }

  const current = await getCurrentUser();
  if (!current) {
    return {
      success: false as const,
      error: "You must be logged in to enroll and pay.",
    };
  }

  const authUser: AuthUser = {
    id: current.user.id,
    email: current.user.email,
    name: current.user.name,
    role: current.role,
  };

  try {
    const result = await createPaymentOrder(authUser, parsed.data);
    return {
      success: true as const,
      data: result,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create order.";
    return {
      success: false as const,
      error: message,
    };
  }
}

/**
 * Server Action: createDueOrderAction
 * For subsequent instalment payments directly from the dashboard.
 */
export async function createDueOrderAction(dueId: string) {
  if (!dueId || typeof dueId !== "string") {
    return {
      success: false as const,
      error: "Valid Fee Due ID is required.",
    };
  }

  const current = await getCurrentUser();
  if (!current) {
    return {
      success: false as const,
      error: "You must be logged in to pay dues.",
    };
  }

  const authUser: AuthUser = {
    id: current.user.id,
    email: current.user.email,
    name: current.user.name,
    role: current.role,
  };

  try {
    const result = await createPaymentOrderForDue(authUser, dueId);
    return {
      success: true as const,
      data: result,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create due payment order.";
    return {
      success: false as const,
      error: message,
    };
  }
}
