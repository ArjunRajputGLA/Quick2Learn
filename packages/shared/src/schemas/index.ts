import { z } from "zod";
import { ACADEMIC_BOARDS, ACADEMIC_CLASSES, SUBJECTS } from "../constants";
import { paiseSchema } from "../money";

export const academicClassSchema = z.enum(ACADEMIC_CLASSES, {
  errorMap: () => ({ message: "Please select a valid class (IX, X, XI, XII)" }),
});

export const academicBoardSchema = z.enum(ACADEMIC_BOARDS, {
  errorMap: () => ({ message: "Please select a valid board (CBSE, ICSE, ISC)" }),
});

export const subjectSchema = z.enum(SUBJECTS, {
  errorMap: () => ({ message: "Please select a valid subject (Mathematics, Chemistry, Biology)" }),
});

export const indianPhoneSchema = z
  .string()
  .trim()
  .regex(/^[6-9]\d{9}$/, {
    message: "Please enter a valid 10-digit Indian mobile number",
  });

export const leadInquirySchema = z.object({
  studentName: z.string().trim().min(2, "Student name must be at least 2 characters").max(100),
  parentName: z.string().trim().max(100).optional().or(z.literal("")),
  phone: indianPhoneSchema,
  email: z.string().trim().email("Please enter a valid email address").optional().or(z.literal("")),
  grade: academicClassSchema,
  board: academicBoardSchema,
  subjectsOfInterest: z
    .array(subjectSchema)
    .min(1, "Please select at least one subject of interest"),
  message: z.string().trim().max(1000).optional().or(z.literal("")),
});
export type LeadInquiryInput = z.infer<typeof leadInquirySchema>;

export const studentProfileSchema = z.object({
  fullName: z.string().trim().min(2, "Full name must be at least 2 characters").max(100),
  phone: indianPhoneSchema,
  email: z.string().trim().email("Please enter a valid email address"),
  grade: academicClassSchema,
  board: academicBoardSchema,
  schoolName: z.string().trim().max(150).optional().nullable(),
  parentName: z.string().trim().max(100).optional().nullable(),
  parentPhone: indianPhoneSchema.optional().nullable(),
  address: z.string().trim().max(300).optional().nullable(),
});
export type StudentProfileInput = z.infer<typeof studentProfileSchema>;

export const onboardingSchema = z.object({
  fullName: z.string().trim().min(2, "Full name must be at least 2 characters").max(100),
  phone: indianPhoneSchema, // WhatsApp number
  classLevel: z.number().int().min(9).max(12),
  board: z.enum(["cbse", "icse", "isc"]),
  school: z.string().trim().min(2, "School name is required").max(150),
  parentName: z.string().trim().min(2, "Parent name is required").max(100),
  parentPhone: indianPhoneSchema,
  city: z.string().trim().min(2, "City is required").max(100),
});
export type OnboardingInput = z.infer<typeof onboardingSchema>;

export const updateProfileSchema = z.object({
  fullName: z.string().trim().min(2).max(100).optional(),
  phone: indianPhoneSchema.optional(),
  classLevel: z.number().int().min(9).max(12).optional(),
  board: z.enum(["cbse", "icse", "isc"]).optional(),
  school: z.string().trim().max(150).optional().nullable(),
  parentName: z.string().trim().max(100).optional().nullable(),
  parentPhone: indianPhoneSchema.optional().nullable(),
  city: z.string().trim().max(100).optional().nullable(),
});
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export const createBatchSchema = z.object({
  title: z.string().trim().min(3).max(150),
  slug: z.string().trim().min(3).max(100),
  description: z.string().trim().min(10).max(2000),
  grade: academicClassSchema,
  board: academicBoardSchema,
  subject: subjectSchema,
  facultyId: z.string().trim().min(1),
  feePaise: paiseSchema,
  startDate: z.string().datetime({ message: "Start date must be an ISO UTC timestamp" }),
  endDate: z.string().datetime({ message: "End date must be an ISO UTC timestamp" }).nullable().optional(),
  scheduleText: z.string().trim().min(3).max(200),
  capacity: z.number().int().positive().max(500),
});
export type CreateBatchInput = z.infer<typeof createBatchSchema>;

export const createEnrollmentSchema = z.object({
  batchId: z.string().uuid("Invalid batch ID format"),
  notes: z.string().trim().max(500).optional(),
});
export type CreateEnrollmentInput = z.infer<typeof createEnrollmentSchema>;

export const createPaymentOrderSchema = z.object({
  batchId: z.string().uuid("Invalid batch ID format"),
  amountPaise: paiseSchema,
});
export type CreatePaymentOrderInput = z.infer<typeof createPaymentOrderSchema>;

export const checkoutOrderSchema = z.object({
  batchSlug: z.string().min(1, "Batch slug is required"),
  feePlanId: z.string().uuid("Invalid fee plan ID"),
  studentDetails: z
    .object({
      fullName: z.string().trim().min(2).max(100).optional(),
      phone: indianPhoneSchema.optional(),
      parentName: z.string().trim().max(100).optional(),
      parentPhone: indianPhoneSchema.optional(),
    })
    .optional(),
});
export type CheckoutOrderInput = z.infer<typeof checkoutOrderSchema>;

export const verifyPaymentInputSchema = z.object({
  razorpay_order_id: z.string().min(1, "Razorpay Order ID is required"),
  razorpay_payment_id: z.string().min(1, "Razorpay Payment ID is required"),
  razorpay_signature: z.string().min(1, "Razorpay Signature is required"),
});
export type VerifyPaymentInput = z.infer<typeof verifyPaymentInputSchema>;
