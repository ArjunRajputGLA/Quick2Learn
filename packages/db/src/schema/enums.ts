import { pgEnum } from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", ["student", "teacher", "admin", "parent"]);
export const boardEnum = pgEnum("board", ["cbse", "icse", "isc"]);
export const batchModeEnum = pgEnum("batch_mode", ["offline", "online", "hybrid"]);
export const batchStatusEnum = pgEnum("batch_status", ["draft", "open", "closed", "completed"]);
export const enrollmentStatusEnum = pgEnum("enrollment_status", [
  "pending_payment",
  "active",
  "cancelled",
  "completed",
]);
export const dueStatusEnum = pgEnum("due_status", ["due", "paid", "waived"]);
export const paymentStatusEnum = pgEnum("payment_status", ["created", "paid", "failed", "refunded"]);
export const paymentMethodEnum = pgEnum("payment_method", [
  "razorpay",
  "cash",
  "upi_offline",
  "bank_transfer",
]);
export const resourceTypeEnum = pgEnum("resource_type", [
  "notes",
  "worksheet",
  "pyq",
  "formula_sheet",
]);
export const visibilityEnum = pgEnum("visibility", ["public", "enrolled"]);
export const audienceEnum = pgEnum("audience", ["public", "all_students", "batch"]);
export const enquiryStatusEnum = pgEnum("enquiry_status", [
  "new",
  "contacted",
  "enrolled",
  "closed",
]);
export const storageBucketEnum = pgEnum("storage_bucket", ["public", "private"]);
