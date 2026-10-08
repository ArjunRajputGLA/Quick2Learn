"use server";

import { z } from "zod";
import { headers } from "next/headers";
import { createEnquiry } from "@/server/data/enquiries";
import { consumePostgresRateLimit } from "@/server/data/rate-limit";

const enquirySchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100, "Name cannot exceed 100 characters"),
  phone: z
    .string()
    .trim()
    .transform((val) => val.replace(/[\s\-\+]/g, "").replace(/^91/, ""))
    .refine((val) => /^[6-9]\d{9}$/.test(val), {
      message: "Please enter a valid 10-digit Indian mobile number",
    }),
  classLevel: z.coerce
    .number()
    .int()
    .min(9, "Class must be between 9 and 12")
    .max(12, "Class must be between 9 and 12")
    .optional(),
  board: z.enum(["cbse", "icse", "isc"]).optional(),
  message: z.string().trim().max(1000, "Message cannot exceed 1000 characters").optional(),
  website_hp: z.string().optional(), // Honeypot field
  sourcePath: z.string().optional(),
});

export type EnquiryActionState = {
  success: boolean;
  message: string;
  fieldErrors?: Record<string, string[]>;
};

export async function submitEnquiryAction(
  _prevState: EnquiryActionState | null,
  formData: FormData,
): Promise<EnquiryActionState> {
  const rawData = {
    name: formData.get("name"),
    phone: formData.get("phone"),
    classLevel: formData.get("classLevel") || undefined,
    board: formData.get("board") || undefined,
    message: formData.get("message") || undefined,
    website_hp: formData.get("website_hp")?.toString() || undefined,
    sourcePath: formData.get("sourcePath")?.toString() || "/",
  };

  const parsed = enquirySchema.safeParse(rawData);

  if (!parsed.success) {
    const errorFormatted = parsed.error.flatten().fieldErrors;
    return {
      success: false,
      message: "Please correct the highlighted errors in the form.",
      fieldErrors: errorFormatted,
    };
  }

  // Honeypot check: If the hidden honeypot is filled, silently succeed without storing bot spam
  if (parsed.data.website_hp && parsed.data.website_hp.trim().length > 0) {
    return {
      success: true,
      message: "Thank you! Your enquiry has been registered successfully. We will reach out shortly.",
    };
  }

  // Rate limiting per IP and per phone stored in PostgreSQL rate_limit table
  let ip = "127.0.0.1";
  try {
    const headerStore = await headers();
    ip = headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
  } catch {
    ip = "127.0.0.1";
  }

  const [phoneLimit, ipLimit] = await Promise.all([
    consumePostgresRateLimit(`enquiry:phone:${parsed.data.phone}`, 3, 10 * 60 * 1000),
    consumePostgresRateLimit(`enquiry:ip:${ip}`, 5, 10 * 60 * 1000),
  ]);

  if (!phoneLimit.success || !ipLimit.success) {
    return {
      success: false,
      message: "Too many enquiries submitted recently. Please try again after 10 minutes or call us directly.",
    };
  }

  try {
    await createEnquiry({
      name: parsed.data.name,
      phone: parsed.data.phone,
      classLevel: parsed.data.classLevel ?? null,
      board: parsed.data.board ?? null,
      message: parsed.data.message || null,
      sourcePath: parsed.data.sourcePath || "/",
      status: "new",
    });

    return {
      success: true,
      message: "Thank you! Your enquiry has been submitted. Our admission counselor will contact you shortly.",
    };
  } catch (error) {
    console.error("Failed to store enquiry:", error);
    return {
      success: false,
      message: "An unexpected error occurred while saving your enquiry. Please try calling us directly.",
    };
  }
}
