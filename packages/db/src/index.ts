import type { InferSelectModel, InferInsertModel } from "drizzle-orm";
import * as schema from "./schema";

export * from "./client";
export * from "./schema";
export { schema };
export { eq, and, or, sql, desc, asc, ilike, inArray, ne } from "drizzle-orm";

// Inferred Models for Better Auth Tables
export type User = InferSelectModel<typeof schema.user>;
export type NewUser = InferInsertModel<typeof schema.user>;
export type Session = InferSelectModel<typeof schema.session>;
export type NewSession = InferInsertModel<typeof schema.session>;
export type Account = InferSelectModel<typeof schema.account>;
export type NewAccount = InferInsertModel<typeof schema.account>;
export type Verification = InferSelectModel<typeof schema.verification>;
export type NewVerification = InferInsertModel<typeof schema.verification>;
export type RateLimit = InferSelectModel<typeof schema.rateLimit>;
export type NewRateLimit = InferInsertModel<typeof schema.rateLimit>;

// Inferred Models for Application Tables
export type Profile = InferSelectModel<typeof schema.profiles>;
export type NewProfile = InferInsertModel<typeof schema.profiles>;

export type Subject = InferSelectModel<typeof schema.subjects>;
export type NewSubject = InferInsertModel<typeof schema.subjects>;

export type Chapter = InferSelectModel<typeof schema.chapters>;
export type NewChapter = InferInsertModel<typeof schema.chapters>;

export type Faculty = InferSelectModel<typeof schema.faculty>;
export type NewFaculty = InferInsertModel<typeof schema.faculty>;

export type YouTubePlaylist = InferSelectModel<typeof schema.youtubePlaylists>;
export type NewYouTubePlaylist = InferInsertModel<typeof schema.youtubePlaylists>;

export type YouTubeVideo = InferSelectModel<typeof schema.youtubeVideos>;
export type NewYouTubeVideo = InferInsertModel<typeof schema.youtubeVideos>;

export type Batch = InferSelectModel<typeof schema.batches>;
export type NewBatch = InferInsertModel<typeof schema.batches>;

export type BatchFeePlan = InferSelectModel<typeof schema.batchFeePlans>;
export type NewBatchFeePlan = InferInsertModel<typeof schema.batchFeePlans>;

export type Enrollment = InferSelectModel<typeof schema.enrollments>;
export type NewEnrollment = InferInsertModel<typeof schema.enrollments>;

export type FeeDue = InferSelectModel<typeof schema.feeDues>;
export type NewFeeDue = InferInsertModel<typeof schema.feeDues>;

export type Payment = InferSelectModel<typeof schema.payments>;
export type NewPayment = InferInsertModel<typeof schema.payments>;

export type Resource = InferSelectModel<typeof schema.resources>;
export type NewResource = InferInsertModel<typeof schema.resources>;

export type WebhookEvent = InferSelectModel<typeof schema.webhookEvents>;
export type NewWebhookEvent = InferInsertModel<typeof schema.webhookEvents>;

export type Announcement = InferSelectModel<typeof schema.announcements>;
export type NewAnnouncement = InferInsertModel<typeof schema.announcements>;

export type Testimonial = InferSelectModel<typeof schema.testimonials>;
export type NewTestimonial = InferInsertModel<typeof schema.testimonials>;

export type Result = InferSelectModel<typeof schema.results>;
export type NewResult = InferInsertModel<typeof schema.results>;

export type Enquiry = InferSelectModel<typeof schema.enquiries>;
export type NewEnquiry = InferInsertModel<typeof schema.enquiries>;

export type SiteSetting = InferSelectModel<typeof schema.siteSettings>;
export type NewSiteSetting = InferInsertModel<typeof schema.siteSettings>;

export type LectureView = InferSelectModel<typeof schema.lectureViews>;
export type NewLectureView = InferInsertModel<typeof schema.lectureViews>;

export type SyncRun = InferSelectModel<typeof schema.syncRuns>;
export type NewSyncRun = InferInsertModel<typeof schema.syncRuns>;

export type AuditLog = InferSelectModel<typeof schema.auditLog>;
export type NewAuditLog = InferInsertModel<typeof schema.auditLog>;

// Enum Types
export type UserRole = (typeof schema.userRoleEnum.enumValues)[number];
export type Board = (typeof schema.boardEnum.enumValues)[number];
export type BatchMode = (typeof schema.batchModeEnum.enumValues)[number];
export type BatchStatus = (typeof schema.batchStatusEnum.enumValues)[number];
export type EnrollmentStatus = (typeof schema.enrollmentStatusEnum.enumValues)[number];
export type DueStatus = (typeof schema.dueStatusEnum.enumValues)[number];
export type PaymentStatus = (typeof schema.paymentStatusEnum.enumValues)[number];
export type PaymentMethod = (typeof schema.paymentMethodEnum.enumValues)[number];
export type ResourceType = (typeof schema.resourceTypeEnum.enumValues)[number];
export type Visibility = (typeof schema.visibilityEnum.enumValues)[number];
export type Audience = (typeof schema.audienceEnum.enumValues)[number];
export type EnquiryStatus = (typeof schema.enquiryStatusEnum.enumValues)[number];
export type StorageBucket = (typeof schema.storageBucketEnum.enumValues)[number];
