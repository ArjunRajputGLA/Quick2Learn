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
export const joinRequestStatusEnum = pgEnum("join_request_status", [
  "pending",
  "approved",
  "rejected",
]);
export const contentItemKindEnum = pgEnum("content_item_kind", [
  "youtube",
  "pdf",
  "link",
  "video_hosted",
]);

export const liveSessionProviderEnum = pgEnum("live_session_provider", [
  "zoom",
  "google_meet",
  "youtube_live",
  "offline",
]);

export const liveSessionStatusEnum = pgEnum("live_session_status", [
  "scheduled",
  "live",
  "ended",
  "cancelled",
]);

export const attendanceStatusEnum = pgEnum("attendance_status", [
  "present",
  "absent",
  "late",
  "excused",
]);

export const attendanceSourceEnum = pgEnum("attendance_source", [
  "joined_online",
  "marked",
]);

export const questionTypeEnum = pgEnum("question_type", [
  "mcq_single",
  "mcq_multi",
  "assertion_reason",
  "case_study",
  "numeric",
  "true_false",
]);

export const questionDifficultyEnum = pgEnum("question_difficulty", [
  "easy",
  "medium",
  "hard",
]);

export const testKindEnum = pgEnum("test_kind", [
  "chapter_test",
  "unit_test",
  "mock",
  "practice",
]);

export const testShowSolutionsEnum = pgEnum("test_show_solutions", [
  "after_submit",
  "after_end",
  "never",
]);

export const testStatusEnum = pgEnum("test_status", [
  "draft",
  "scheduled",
  "live",
  "closed",
]);

export const attemptStatusEnum = pgEnum("attempt_status", [
  "in_progress",
  "submitted",
  "auto_submitted",
]);

export const doubtSourceTypeEnum = pgEnum("doubt_source_type", [
  "lecture",
  "test_question",
  "general",
]);

export const doubtStatusEnum = pgEnum("doubt_status", [
  "open",
  "answered",
  "closed",
]);

