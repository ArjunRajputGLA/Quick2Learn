import type { InferSelectModel, InferInsertModel } from "drizzle-orm";
import * as authTables from "./auth";
import * as appTables from "./schema";
import * as enums from "./enums";

export * from "./enums";
export * from "./custom-types";
export * from "./auth";
export * from "./schema";

// Inferred Models for Better Auth Tables
export type User = InferSelectModel<typeof authTables.user>;
export type NewUser = InferInsertModel<typeof authTables.user>;
export type Session = InferSelectModel<typeof authTables.session>;
export type NewSession = InferInsertModel<typeof authTables.session>;
export type Account = InferSelectModel<typeof authTables.account>;
export type NewAccount = InferInsertModel<typeof authTables.account>;
export type Verification = InferSelectModel<typeof authTables.verification>;
export type NewVerification = InferInsertModel<typeof authTables.verification>;

// Inferred Models for Application Tables
export type Profile = InferSelectModel<typeof appTables.profiles>;
export type NewProfile = InferInsertModel<typeof appTables.profiles>;

export type Subject = InferSelectModel<typeof appTables.subjects>;
export type NewSubject = InferInsertModel<typeof appTables.subjects>;

export type Chapter = InferSelectModel<typeof appTables.chapters>;
export type NewChapter = InferInsertModel<typeof appTables.chapters>;

export type Faculty = InferSelectModel<typeof appTables.faculty>;
export type NewFaculty = InferInsertModel<typeof appTables.faculty>;

export type YouTubePlaylist = InferSelectModel<typeof appTables.youtubePlaylists>;
export type NewYouTubePlaylist = InferInsertModel<typeof appTables.youtubePlaylists>;

export type YouTubeVideo = InferSelectModel<typeof appTables.youtubeVideos>;
export type NewYouTubeVideo = InferInsertModel<typeof appTables.youtubeVideos>;

export type Batch = InferSelectModel<typeof appTables.batches>;
export type NewBatch = InferInsertModel<typeof appTables.batches>;

export type BatchFeePlan = InferSelectModel<typeof appTables.batchFeePlans>;
export type NewBatchFeePlan = InferInsertModel<typeof appTables.batchFeePlans>;

export type Enrollment = InferSelectModel<typeof appTables.enrollments>;
export type NewEnrollment = InferInsertModel<typeof appTables.enrollments>;

export type FeeDue = InferSelectModel<typeof appTables.feeDues>;
export type NewFeeDue = InferInsertModel<typeof appTables.feeDues>;

export type Payment = InferSelectModel<typeof appTables.payments>;
export type NewPayment = InferInsertModel<typeof appTables.payments>;

export type Resource = InferSelectModel<typeof appTables.resources>;
export type NewResource = InferInsertModel<typeof appTables.resources>;

export type WebhookEvent = InferSelectModel<typeof appTables.webhookEvents>;
export type NewWebhookEvent = InferInsertModel<typeof appTables.webhookEvents>;

export type Announcement = InferSelectModel<typeof appTables.announcements>;
export type NewAnnouncement = InferInsertModel<typeof appTables.announcements>;

export type Testimonial = InferSelectModel<typeof appTables.testimonials>;
export type NewTestimonial = InferInsertModel<typeof appTables.testimonials>;

export type Result = InferSelectModel<typeof appTables.results>;
export type NewResult = InferInsertModel<typeof appTables.results>;

export type Enquiry = InferSelectModel<typeof appTables.enquiries>;
export type NewEnquiry = InferInsertModel<typeof appTables.enquiries>;

export type SiteSetting = InferSelectModel<typeof appTables.siteSettings>;
export type NewSiteSetting = InferInsertModel<typeof appTables.siteSettings>;

export type LectureView = InferSelectModel<typeof appTables.lectureViews>;
export type NewLectureView = InferInsertModel<typeof appTables.lectureViews>;

export type SyncRun = InferSelectModel<typeof appTables.syncRuns>;
export type NewSyncRun = InferInsertModel<typeof appTables.syncRuns>;

export type AuditLog = InferSelectModel<typeof appTables.auditLog>;
export type NewAuditLog = InferInsertModel<typeof appTables.auditLog>;

// Enum Types
export type UserRole = (typeof enums.userRoleEnum.enumValues)[number];
export type Board = (typeof enums.boardEnum.enumValues)[number];
export type BatchMode = (typeof enums.batchModeEnum.enumValues)[number];
export type BatchStatus = (typeof enums.batchStatusEnum.enumValues)[number];
export type EnrollmentStatus = (typeof enums.enrollmentStatusEnum.enumValues)[number];
export type DueStatus = (typeof enums.dueStatusEnum.enumValues)[number];
export type PaymentStatus = (typeof enums.paymentStatusEnum.enumValues)[number];
export type PaymentMethod = (typeof enums.paymentMethodEnum.enumValues)[number];
export type ResourceType = (typeof enums.resourceTypeEnum.enumValues)[number];
export type Visibility = (typeof enums.visibilityEnum.enumValues)[number];
export type Audience = (typeof enums.audienceEnum.enumValues)[number];
export type EnquiryStatus = (typeof enums.enquiryStatusEnum.enumValues)[number];
export type StorageBucket = (typeof enums.storageBucketEnum.enumValues)[number];
