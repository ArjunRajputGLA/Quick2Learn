import type { AcademicBoard, AcademicClass, Subject } from "../constants";

export type UserRole = "student" | "teacher" | "admin" | "parent";
export type Board = "cbse" | "icse" | "isc";
export type BatchMode = "offline" | "online" | "hybrid";
export type BatchStatus = "draft" | "open" | "closed" | "completed";
export type EnrollmentStatus =
  | "pending_payment"
  | "active"
  | "cancelled"
  | "completed";
export type DueStatus = "due" | "paid" | "waived";
export type PaymentStatus = "created" | "paid" | "failed" | "refunded";
export type PaymentMethod =
  | "razorpay"
  | "cash"
  | "upi_offline"
  | "bank_transfer";
export type ResourceType = "notes" | "worksheet" | "pyq" | "formula_sheet";
export type Visibility = "public" | "enrolled";
export type Audience = "public" | "all_students" | "batch";
export type EnquiryStatus = "new" | "contacted" | "enrolled" | "closed";
export type StorageBucket = "public" | "private";

export interface StudentProfile {
  id: string;
  userId?: string;
  fullName: string;
  phone: string | null;
  email?: string;
  grade?: AcademicClass;
  board?: AcademicBoard;
  schoolName?: string | null;
  parentName?: string | null;
  parentPhone?: string | null;
  address?: string | null;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface Batch {
  id: string;
  title: string;
  slug: string;
  description: string;
  grade?: AcademicClass;
  board: Board;
  subject?: Subject;
  facultyId?: string | null;
  facultyName?: string;
  feePaise?: number;
  startDate: string;
  endDate: string | null;
  scheduleText: string;
  capacity?: number;
  enrolledCount?: number;
  status: BatchStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Enrollment {
  id: string;
  studentId: string;
  batchId: string;
  amountPaidPaise?: number;
  status: EnrollmentStatus;
  enrolledAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentTransaction {
  id: string;
  enrollmentId: string | null;
  studentId: string;
  amountPaise: number;
  currency: "INR";
  razorpayOrderId: string | null;
  razorpayPaymentId: string | null;
  receiptNo?: string;
  status: PaymentStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ContactLead {
  id: string;
  studentName: string;
  parentName?: string;
  phone: string;
  email?: string;
  grade: AcademicClass;
  board: AcademicBoard;
  subjectsOfInterest: Subject[];
  message?: string;
  status: EnquiryStatus;
  createdAt: string;
}
