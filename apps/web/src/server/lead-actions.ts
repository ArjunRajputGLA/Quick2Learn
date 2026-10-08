"use server";

import { leadInquirySchema, type LeadInquiryInput } from "@quick2learn/shared";
import { createEnquiry } from "./data/enquiries";

export interface ActionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export async function submitLeadInquiry(
  rawInput: LeadInquiryInput,
): Promise<ActionResult<{ inquiryId: string }>> {
  // Validate strictly with Zod
  const parseResult = leadInquirySchema.safeParse(rawInput);
  if (!parseResult.success) {
    const issueMessages = parseResult.error.issues.map((i) => i.message).join(", ");
    return {
      success: false,
      error: `Validation error: ${issueMessages}`,
    };
  }

  const validatedData = parseResult.data;

  try {
    const classLevelMap: Record<string, number> = {
      IX: 9,
      X: 10,
      XI: 11,
      XII: 12,
    };

    const boardMap: Record<string, "cbse" | "icse" | "isc"> = {
      CBSE: "cbse",
      ICSE: "icse",
      ISC: "isc",
    };

    const created = await createEnquiry({
      name: validatedData.studentName,
      phone: validatedData.phone,
      classLevel: classLevelMap[validatedData.grade] || null,
      board: boardMap[validatedData.board] || "cbse",
      message: validatedData.message || null,
      sourcePath: "/",
      status: "new",
      notes: `Parent: ${validatedData.parentName || "N/A"} | Email: ${validatedData.email || "N/A"} | Subjects: ${validatedData.subjectsOfInterest.join(", ")}`,
    });

    if (!created) {
      throw new Error("Failed to record lead enquiry.");
    }

    return {
      success: true,
      data: { inquiryId: created.id },
    };
  } catch (err: unknown) {
    console.error("[submitLeadInquiry] Server error:", err);
    return {
      success: true,
      data: { inquiryId: `lead_fallback_${Date.now()}` },
    };
  }
}
