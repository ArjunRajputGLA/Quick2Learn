"use server";

import { z } from "zod";
import { headers } from "next/headers";
import { createEnquiry } from "./data/enquiries";
import { checkRateLimit } from "./rate-limit";
import type { Board } from "@quick2learn/db";

export const contactEnquirySchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Please enter your full name (minimum 2 characters)")
    .max(100, "Name cannot exceed 100 characters"),
  phone: z
    .string()
    .trim()
    .transform((val) => val.replace(/\D/g, ""))
    .refine(
      (val) => val.length >= 10,
      "Please provide a valid 10-digit mobile number",
    )
    .transform((val) => (val.length > 10 ? val.slice(-10) : val)),
  classLevel: z
    .union([z.string(), z.number()])
    .optional()
    .nullable()
    .transform((val) => {
      if (val === undefined || val === null || val === "") return null;
      const num = Number(val);
      return isNaN(num) ? null : num;
    }),
  board: z
    .enum(["cbse", "icse", "up_board", "other"])
    .optional()
    .nullable(),
  message: z
    .string()
    .trim()
    .max(1000, "Message cannot exceed 1000 characters")
    .optional()
    .nullable(),
  website_hp: z.string().optional().nullable(),
});

export type ContactEnquiryInput = z.infer<typeof contactEnquirySchema>;

export interface ContactActionResult {
  success: boolean;
  message?: string;
  error?: string;
  fieldErrors?: Record<string, string>;
}

export async function submitContactEnquiryAction(
  data: unknown,
  context?: { clientIp?: string }
): Promise<ContactActionResult> {
  // 1. Zod validation
  const parsed = contactEnquirySchema.safeParse(data);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0]?.toString() || "form";
      if (!fieldErrors[field]) {
        fieldErrors[field] = issue.message;
      }
    }
    return {
      success: false,
      error: "Please correct the highlighted errors.",
      fieldErrors,
    };
  }

  const { name, phone, classLevel, board, message, website_hp } = parsed.data;

  // 2. Honeypot check: If the hidden honeypot field is filled, silently succeed without storing to DB
  if (website_hp && website_hp.trim().length > 0) {
    return {
      success: true,
      message: "Thank you! Your enquiry has been received. Our team will contact you shortly.",
    };
  }

  // 3. Extract IP address from request headers or context override
  let clientIp = context?.clientIp;
  if (!clientIp) {
    try {
      const headerList = await headers();
      const forwardedFor = headerList.get("x-forwarded-for");
      const realIp = headerList.get("x-real-ip");
      clientIp = (forwardedFor ? forwardedFor.split(",")[0]?.trim() : null) || realIp || "127.0.0.1";
    } catch {
      clientIp = "127.0.0.1";
    }
  }

  // 4. Rate limit check per IP: max 3 requests per 10 minutes (600,000 ms)
  const ipLimitKey = `contact:ip:${clientIp}`;
  const ipLimitResult = await checkRateLimit(ipLimitKey, 3, 600000);
  if (!ipLimitResult.success) {
    return {
      success: false,
      error: "Too many enquiries submitted from this network. Please wait a few minutes before trying again.",
    };
  }

  // 5. Rate limit check per Phone: max 2 requests per 10 minutes (600,000 ms)
  const phoneLimitKey = `contact:phone:${phone}`;
  const phoneLimitResult = await checkRateLimit(phoneLimitKey, 2, 600000);
  if (!phoneLimitResult.success) {
    return {
      success: false,
      error: "Too many enquiries submitted for this phone number. Please wait a few minutes before trying again.",
    };
  }

  // 6. Store enquiry in PostgreSQL database (status: 'new' automatically appears on /admin/enquiries)
  try {
    await createEnquiry({
      name,
      phone,
      classLevel: classLevel || null,
      board: (board as Board) || null,
      message: message || null,
      sourcePath: "/contact",
      status: "new",
    });

    return {
      success: true,
      message: "Thank you! Your enquiry has been received. Our counseling team will contact you shortly.",
    };
  } catch (err: unknown) {
    console.error("Failed to store contact enquiry:", err);
    return {
      success: false,
      error: "An unexpected error occurred while saving your enquiry. Please try again or call our centre directly.",
    };
  }
}
