import { z } from "zod";
import { indianPhoneSchema } from "../schemas";

// Standard Error Response Schema
export const apiErrorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.any().optional(),
  }),
});
export type ApiErrorResponse = z.infer<typeof apiErrorSchema>;

// Generic Cursor Pagination Schema Helper
export function cursorPaginationSchema<T extends z.ZodTypeAny>(itemSchema: T) {
  return z.object({
    items: z.array(itemSchema),
    nextCursor: z.string().nullable(),
  });
}

// 1. App Configuration
export const appConfigSchema = z.object({
  minSupportedVersion: z.string(),
  latestVersion: z.string(),
  maintenance: z.boolean(),
  featureFlags: z.record(z.boolean()),
});
export type AppConfig = z.infer<typeof appConfigSchema>;

// 2. User & Profile (/me)
export const apiUserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
  image: z.string().nullable().optional(),
  phoneNumber: z.string().nullable().optional(),
  phoneNumberVerified: z.boolean().nullable().optional(),
  emailVerified: z.boolean(),
  createdAt: z.string().or(z.date()),
  updatedAt: z.string().or(z.date()),
});
export type ApiUser = z.infer<typeof apiUserSchema>;

export const apiProfileSchema = z.object({
  id: z.string(),
  userId: z.string(),
  fullName: z.string(),
  phone: z.string().nullable().optional(),
  role: z.enum(["student", "teacher", "admin", "parent"]),
  classLevel: z.number().int().nullable().optional(),
  board: z.enum(["cbse", "icse", "isc"]).nullable().optional(),
  school: z.string().nullable().optional(),
  parentName: z.string().nullable().optional(),
  parentPhone: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  avatarUrl: z.string().nullable().optional(),
  onboardedAt: z.string().or(z.date()).nullable().optional(),
  createdAt: z.string().or(z.date()),
  updatedAt: z.string().or(z.date()),
});
export type ApiProfile = z.infer<typeof apiProfileSchema>;

export const linkedStudentSchema = z.object({
  id: z.string(),
  userId: z.string(),
  fullName: z.string(),
  phone: z.string().nullable().optional(),
  classLevel: z.number().int().nullable().optional(),
  board: z.enum(["cbse", "icse", "isc"]).nullable().optional(),
  school: z.string().nullable().optional(),
  avatarUrl: z.string().nullable().optional(),
});
export type LinkedStudent = z.infer<typeof linkedStudentSchema>;

export const meResponseSchema = z.object({
  user: apiUserSchema,
  profile: apiProfileSchema.nullable(),
  role: z.enum(["student", "teacher", "admin", "parent"]),
  linkedStudents: z.array(linkedStudentSchema),
});
export type MeResponse = z.infer<typeof meResponseSchema>;

// Whitelisted fields for PATCH /me
export const updateMeSchema = z
  .object({
    fullName: z.string().trim().min(2, "Full name must be at least 2 characters").max(100).optional(),
    phone: indianPhoneSchema.optional(),
    classLevel: z.number().int().min(9).max(12).optional(),
    board: z.enum(["cbse", "icse", "isc"]).optional(),
    school: z.string().trim().max(150).optional().nullable(),
    parentName: z.string().trim().max(100).optional().nullable(),
    parentPhone: indianPhoneSchema.optional().nullable(),
    city: z.string().trim().max(100).optional().nullable(),
    avatarUrl: z.string().url().max(500).optional().nullable(),
  })
  .strict();
export type UpdateMeInput = z.infer<typeof updateMeSchema>;

// 3. Device Tokens (/devices)
export const registerDeviceSchema = z.object({
  expoPushToken: z.string().min(1, "Expo push token is required"),
  platform: z.enum(["android", "ios"]),
  appVersion: z.string().optional(),
});
export type RegisterDeviceInput = z.infer<typeof registerDeviceSchema>;

export const deviceTokenResponseSchema = z.object({
  id: z.string(),
  userId: z.string(),
  expoPushToken: z.string(),
  platform: z.string(),
  appVersion: z.string().nullable().optional(),
  lastSeenAt: z.string().or(z.date()),
  disabledAt: z.string().or(z.date()).nullable().optional(),
});
export type DeviceTokenResponse = z.infer<typeof deviceTokenResponseSchema>;

// 4. Notifications (/notifications)
export const notificationItemSchema = z.object({
  id: z.string(),
  userId: z.string(),
  type: z.string(),
  title: z.string(),
  body: z.string(),
  data: z.record(z.any()),
  readAt: z.string().or(z.date()).nullable(),
  createdAt: z.string().or(z.date()),
});
export type NotificationItem = z.infer<typeof notificationItemSchema>;

export const paginatedNotificationsSchema = cursorPaginationSchema(notificationItemSchema);
export type PaginatedNotifications = z.infer<typeof paginatedNotificationsSchema>;

export const markNotificationsReadSchema = z.union([
  z.object({
    ids: z.array(z.string().uuid()).min(1),
    all: z.literal(false).optional(),
  }),
  z.object({
    all: z.literal(true),
    ids: z.array(z.string().uuid()).optional(),
  }),
]);
export type MarkNotificationsReadInput = z.infer<typeof markNotificationsReadSchema>;

export const markNotificationsReadResponseSchema = z.object({
  success: z.boolean(),
  count: z.number(),
});
export type MarkNotificationsReadResponse = z.infer<typeof markNotificationsReadResponseSchema>;

export const unreadCountResponseSchema = z.object({
  unreadCount: z.number(),
});
export type UnreadCountResponse = z.infer<typeof unreadCountResponseSchema>;

// 5. Notification Preferences
export const notificationPrefItemSchema = z.object({
  type: z.string(),
  enabled: z.boolean(),
});
export type NotificationPrefItem = z.infer<typeof notificationPrefItemSchema>;

export const updateNotificationPrefSchema = z.object({
  type: z.string().min(1),
  enabled: z.boolean(),
});
export type UpdateNotificationPrefInput = z.infer<typeof updateNotificationPrefSchema>;

// 6. Onboarding & Parent Linking
export const studentOnboardingSchema = z.object({
  role: z.literal("student"),
  fullName: z.string().trim().min(2, "Full name must be at least 2 characters").max(100),
  classLevel: z.number().int().min(9).max(12),
  board: z.enum(["cbse", "icse", "isc"]),
  school: z.string().trim().min(2, "School name is required").max(150),
  parentPhone: z
    .string()
    .trim()
    .regex(/^(\+91|91|0)?[6-9]\d{9}$/, "Please enter a valid 10-digit Indian mobile number")
    .or(z.literal(""))
    .optional(),
});
export type StudentOnboardingInput = z.infer<typeof studentOnboardingSchema>;

export const parentOnboardingSchema = z.object({
  role: z.literal("parent"),
  fullName: z.string().trim().min(2, "Full name must be at least 2 characters").max(100),
  confirmStudentIds: z.array(z.string()).optional(),
  inviteCode: z.string().trim().length(6, "Invite code must be 6 characters").optional().or(z.literal("")),
});
export type ParentOnboardingInput = z.infer<typeof parentOnboardingSchema>;

export const apiOnboardingInputSchema = z.discriminatedUnion("role", [
  studentOnboardingSchema,
  parentOnboardingSchema,
]);
export type ApiOnboardingInput = z.infer<typeof apiOnboardingInputSchema>;

export const parentInviteCodeResponseSchema = z.object({
  code: z.string().length(6),
  expiresAt: z.string().or(z.date()),
});
export type ParentInviteCodeResponse = z.infer<typeof parentInviteCodeResponseSchema>;

export const claimInviteCodeSchema = z.object({
  code: z.string().trim().length(6, "Invite code must be 6 characters"),
});
export type ClaimInviteCodeInput = z.infer<typeof claimInviteCodeSchema>;

export const linkedStudentsResponseSchema = z.object({
  students: z.array(linkedStudentSchema),
});
export type LinkedStudentsResponse = z.infer<typeof linkedStudentsResponseSchema>;

// Parent Home Screen (/parent/home)
export const parentHomeAttendanceSchema = z.object({
  presentDays: z.number().int(),
  absentDays: z.number().int(),
  totalDays: z.number().int(),
  percentage: z.number(),
  summaryText: z.string(),
});

export const parentHomeTestScoreSchema = z.object({
  testId: z.string(),
  testTitle: z.string(),
  attemptId: z.string(),
  score: z.number(),
  totalMarks: z.number(),
  percentage: z.number(),
  previousPercentage: z.number().nullable().optional(),
  changePercentage: z.number().nullable().optional(),
  changeLabel: z.string().nullable().optional(),
  submittedAt: z.string().or(z.date()),
});

export const parentHomeNextClassSchema = z.object({
  batchId: z.string(),
  batchTitle: z.string(),
  subjectName: z.string(),
  isLive: z.boolean(),
  timeOrCountdown: z.string(),
  startsAt: z.string().or(z.date()).nullable().optional(),
});

export const parentHomeFeeAlertSchema = z.object({
  status: z.enum(["all_clear", "due_soon", "overdue"]),
  amountPaise: z.number().int(),
  formattedAmount: z.string(),
  dueDate: z.string().nullable().optional(),
  dueLabel: z.string().nullable().optional(),
  message: z.string(),
});

export const parentHomeAnnouncementSchema = z.object({
  id: z.string(),
  title: z.string(),
  body: z.string(),
  batchTitle: z.string().nullable().optional(),
  createdAt: z.string().or(z.date()),
});

export const parentHomeResponseSchema = z.object({
  child: z.object({
    id: z.string(),
    userId: z.string(),
    fullName: z.string(),
    classLevel: z.number().int().nullable().optional(),
    board: z.enum(["cbse", "icse", "isc"]).nullable().optional(),
    avatarUrl: z.string().nullable().optional(),
  }),
  attendanceThisWeek: parentHomeAttendanceSchema,
  latestTestScore: parentHomeTestScoreSchema.nullable().optional(),
  nextClass: parentHomeNextClassSchema.nullable().optional(),
  feeAlert: parentHomeFeeAlertSchema,
  announcements: z.array(parentHomeAnnouncementSchema),
  instituteWhatsApp: z.object({
    number: z.string(),
    prefilledText: z.string(),
    url: z.string(),
  }),
});
export type ParentHomeResponse = z.infer<typeof parentHomeResponseSchema>;

export const adminLinkParentInputSchema = z.object({
  studentUserId: z.string(),
  parentIdentifier: z.string().min(3, "Please provide parent email or 10-digit mobile number"),
  relation: z.string().default("parent"),
});
export type AdminLinkParentInput = z.infer<typeof adminLinkParentInputSchema>;

export const adminUnlinkParentInputSchema = z.object({
  linkId: z.string().uuid(),
});
export type AdminUnlinkParentInput = z.infer<typeof adminUnlinkParentInputSchema>;

// 7. Home Screen (/home)
export const homeHeaderSchema = z.object({
  firstName: z.string(),
  fullName: z.string(),
  classLevel: z.number().int().nullable().optional(),
  board: z.enum(["cbse", "icse", "isc"]).nullable().optional(),
  chipLabel: z.string().nullable().optional(),
  unreadNotificationsCount: z.number().int(),
});
export type HomeHeader = z.infer<typeof homeHeaderSchema>;

export const liveClassBannerSchema = z.object({
  batchId: z.string(),
  batchTitle: z.string(),
  subjectName: z.string(),
  isLive: z.boolean(),
  timeOrCountdown: z.string(),
  joinUrl: z.string().nullable().optional(),
  route: z.string(),
});
export type LiveClassBanner = z.infer<typeof liveClassBannerSchema>;

export const continueWatchingItemSchema = z.object({
  id: z.string(),
  videoId: z.string(),
  title: z.string(),
  durationFormatted: z.string(),
  thumbnailUrl: z.string().nullable().optional(),
  progressPercent: z.number().min(0).max(100),
  subjectName: z.string().nullable().optional(),
  chapterTitle: z.string().nullable().optional(),
  route: z.string(),
});
export type ContinueWatchingItem = z.infer<typeof continueWatchingItemSchema>;

export const todayClassItemSchema = z.object({
  batchId: z.string(),
  batchTitle: z.string(),
  subjectName: z.string(),
  facultyName: z.string().nullable().optional(),
  timeText: z.string(),
  mode: z.enum(["offline", "online", "hybrid"]),
  locationText: z.string().nullable().optional(),
  route: z.string(),
});
export type TodayClassItem = z.infer<typeof todayClassItemSchema>;

export const upcomingTestItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  batchTitle: z.string(),
  subjectName: z.string(),
  dateText: z.string(),
  totalMarks: z.number().nullable().optional(),
  route: z.string(),
});
export type UpcomingTestItem = z.infer<typeof upcomingTestItemSchema>;

export const recentResultItemSchema = z.object({
  id: z.string(),
  testTitle: z.string(),
  batchTitle: z.string(),
  scoreText: z.string(),
  percentage: z.number().nullable().optional(),
  dateText: z.string(),
  route: z.string(),
});
export type RecentResultItem = z.infer<typeof recentResultItemSchema>;

export const feeAlertSchema = z.object({
  id: z.string(),
  label: z.string(),
  amountPaise: z.number().int(),
  formattedAmount: z.string(),
  dueDate: z.string(),
  daysRemaining: z.number().int(),
  isOverdue: z.boolean(),
  batchTitle: z.string(),
  route: z.string(),
});
export type FeeAlert = z.infer<typeof feeAlertSchema>;

export const homeAnnouncementSchema = z.object({
  id: z.string(),
  title: z.string(),
  body: z.string(),
  isPinned: z.boolean(),
  publishedAt: z.string().or(z.date()),
  dateFormatted: z.string(),
  route: z.string(),
});
export type HomeAnnouncement = z.infer<typeof homeAnnouncementSchema>;

export const appBannerItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  imageUrl: z.string(),
  targetType: z.enum(["batch", "lecture", "url"]),
  targetValue: z.string(),
  order: z.number().int(),
  route: z.string(),
  startDate: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
  isActive: z.boolean().default(true),
});
export type AppBannerItem = z.infer<typeof appBannerItemSchema>;

export const homeFreeLectureSchema = z.object({
  id: z.string(),
  title: z.string(),
  durationFormatted: z.string(),
  thumbnailUrl: z.string().nullable().optional(),
  subjectName: z.string().nullable().optional(),
  classLevel: z.number().int().nullable().optional(),
  route: z.string(),
});
export type HomeFreeLecture = z.infer<typeof homeFreeLectureSchema>;

export const homeResponseSchema = z.object({
  header: homeHeaderSchema,
  liveClass: liveClassBannerSchema.nullable(),
  continueWatching: z.array(continueWatchingItemSchema),
  todayClasses: z.array(todayClassItemSchema),
  upcomingTests: z.array(upcomingTestItemSchema),
  recentResults: z.array(recentResultItemSchema),
  feeAlert: feeAlertSchema.nullable(),
  announcements: z.array(homeAnnouncementSchema),
  banners: z.array(appBannerItemSchema),
  freeLectures: z.array(homeFreeLectureSchema),
  enrolledBatchesCount: z.number().int(),
  shareApp: z.object({
    title: z.string(),
    message: z.string(),
    url: z.string(),
  }),
});
export type HomeResponse = z.infer<typeof homeResponseSchema>;

// 8. Learn Library & Progress
export const learnSubjectSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  lectureCount: z.number().int(),
});
export type LearnSubjectSummary = z.infer<typeof learnSubjectSummarySchema>;

export const learnClassItemSchema = z.object({
  classLevel: z.number().int(),
  label: z.string(),
  slug: z.string(),
  totalLectures: z.number().int(),
  subjects: z.array(learnSubjectSummarySchema),
});
export type LearnClassItem = z.infer<typeof learnClassItemSchema>;

export const learnClassesResponseSchema = z.object({
  classes: z.array(learnClassItemSchema),
});
export type LearnClassesResponse = z.infer<typeof learnClassesResponseSchema>;

export const learnChapterItemSchema = z.object({
  id: z.string(),
  number: z.number().int(),
  title: z.string(),
  slug: z.string(),
  lectureCount: z.number().int(),
  totalDurationSeconds: z.number().int(),
  totalDurationFormatted: z.string(),
  completedLecturesCount: z.number().int(),
  progressPercentage: z.number().min(0).max(100),
});
export type LearnChapterItem = z.infer<typeof learnChapterItemSchema>;

export const learnChaptersResponseSchema = z.object({
  classLevel: z.number().int(),
  subject: z.object({
    id: z.string(),
    name: z.string(),
    slug: z.string(),
  }),
  chapters: z.array(learnChapterItemSchema),
});
export type LearnChaptersResponse = z.infer<typeof learnChaptersResponseSchema>;

export const chapterLectureItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  durationSeconds: z.number().int(),
  durationFormatted: z.string(),
  thumbnailUrl: z.string().nullable().optional(),
  publishedAt: z.string().nullable().optional(),
  positionSeconds: z.number().int().default(0),
  progressPercent: z.number().min(0).max(100).default(0),
  isCompleted: z.boolean().default(false),
  route: z.string(),
});
export type ChapterLectureItem = z.infer<typeof chapterLectureItemSchema>;

export const chapterNoteItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  type: z.string(),
  storageKey: z.string(),
  fileUrl: z.string(),
  fileSize: z.string().nullable().optional(),
});
export type ChapterNoteItem = z.infer<typeof chapterNoteItemSchema>;

export const chapterDetailResponseSchema = z.object({
  id: z.string(),
  number: z.number().int(),
  title: z.string(),
  slug: z.string(),
  classLevel: z.number().int(),
  subjectName: z.string(),
  continueLectureId: z.string().nullable().optional(),
  lectures: z.array(chapterLectureItemSchema),
  notes: z.array(chapterNoteItemSchema),
});
export type ChapterDetailResponse = z.infer<typeof chapterDetailResponseSchema>;

export const lectureTimestampSchema = z.object({
  seconds: z.number().int(),
  timeStr: z.string(),
  label: z.string(),
});
export type LectureTimestamp = z.infer<typeof lectureTimestampSchema>;

export const lectureDetailResponseSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  durationSeconds: z.number().int(),
  durationFormatted: z.string(),
  thumbnailUrl: z.string().nullable().optional(),
  publishedAt: z.string().nullable().optional(),
  classLevel: z.number().int().nullable().optional(),
  subjectName: z.string().nullable().optional(),
  chapterId: z.string().nullable().optional(),
  chapterTitle: z.string().nullable().optional(),
  facultyName: z.string().nullable().optional(),
  positionSeconds: z.number().int().default(0),
  progressPercent: z.number().min(0).max(100).default(0),
  isCompleted: z.boolean().default(false),
  timestamps: z.array(lectureTimestampSchema),
  upNext: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      durationFormatted: z.string(),
      thumbnailUrl: z.string().nullable().optional(),
      isCompleted: z.boolean().default(false),
      route: z.string(),
    })
  ),
  notes: z.array(chapterNoteItemSchema),
  shareUrl: z.string(),
});
export type LectureDetailResponse = z.infer<typeof lectureDetailResponseSchema>;

// Progress Updates
export const progressUpdateItemSchema = z.object({
  itemId: z.string().min(1),
  itemType: z.enum(["youtube_video", "content_item"]).default("youtube_video"),
  positionSeconds: z.number().int().min(0),
  durationSeconds: z.number().int().min(0),
});
export type ProgressUpdateItem = z.infer<typeof progressUpdateItemSchema>;

export const progressBatchInputSchema = z.object({
  updates: z.array(progressUpdateItemSchema).min(1),
});
export type ProgressBatchInput = z.infer<typeof progressBatchInputSchema>;

export const progressBatchResponseSchema = z.object({
  success: z.boolean(),
  syncedCount: z.number().int(),
  completedCount: z.number().int(),
});
export type ProgressBatchResponse = z.infer<typeof progressBatchResponseSchema>;

// Free Resources
export const freeResourcesResponseSchema = z.object({
  resources: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      type: z.string(),
      classLevel: z.number().int().nullable().optional(),
      subjectName: z.string().nullable().optional(),
      chapterTitle: z.string().nullable().optional(),
      fileUrl: z.string(),
      createdAt: z.string(),
    })
  ),
});
export type FreeResourcesResponse = z.infer<typeof freeResourcesResponseSchema>;

// Search Library
export const librarySearchResponseSchema = z.object({
  query: z.string(),
  total: z.number().int(),
  lectures: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      durationFormatted: z.string(),
      thumbnailUrl: z.string().nullable().optional(),
      chapterTitle: z.string().nullable().optional(),
      subjectName: z.string().nullable().optional(),
      classLevel: z.number().int().nullable().optional(),
      route: z.string(),
    })
  ),
  chapters: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      number: z.number().int(),
      classLevel: z.number().int(),
      subjectName: z.string().nullable().optional(),
      lectureCount: z.number().int(),
      route: z.string(),
    })
  ),
  notes: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      type: z.string(),
      chapterTitle: z.string().nullable().optional(),
      subjectName: z.string().nullable().optional(),
      fileUrl: z.string(),
    })
  ),
});
export type LibrarySearchResponse = z.infer<typeof librarySearchResponseSchema>;

// ==========================================
// BATCHES & TIMETABLE SCHEMAS (App Prompt 6)
// ==========================================

export const myBatchItemSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  subtitle: z.string().nullable().optional(),
  classLevel: z.number().int(),
  board: z.string(),
  mode: z.string(),
  teacherName: z.string(),
  teacherAvatarUrl: z.string().nullable().optional(),
  subjectName: z.string(),
  progressPercentage: z.number().int(),
  nextClass: z
    .object({
      title: z.string(),
      timeFormatted: z.string(),
      weekday: z.number().int(),
      roomOrLinkNote: z.string().nullable().optional(),
      isToday: z.boolean(),
      isLive: z.boolean(),
      startsInMinutes: z.number().int().optional(),
    })
    .nullable()
    .optional(),
  enrolledAt: z.string(),
});
export type MyBatchItem = z.infer<typeof myBatchItemSchema>;

export const pendingJoinRequestItemSchema = z.object({
  id: z.string(),
  batchId: z.string(),
  batchTitle: z.string(),
  batchMode: z.string(),
  classLevel: z.number().int(),
  status: z.enum(["pending", "approved", "rejected"]),
  note: z.string().nullable().optional(),
  requestedAt: z.string(),
});
export type PendingJoinRequestItem = z.infer<typeof pendingJoinRequestItemSchema>;

export const batchesMineResponseSchema = z.object({
  enrolled: z.array(myBatchItemSchema),
  pendingRequests: z.array(pendingJoinRequestItemSchema),
});
export type BatchesMineResponse = z.infer<typeof batchesMineResponseSchema>;

export const batchDetailResponseSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  subtitle: z.string().nullable().optional(),
  description: z.string(),
  classLevel: z.number().int(),
  board: z.string(),
  mode: z.string(),
  academicYear: z.string().nullable().optional(),
  joinCode: z.string().nullable().optional(),
  whatsappGroupUrl: z.string().nullable().optional(),
  startDate: z.string(),
  scheduleText: z.string(),
  locationText: z.string().nullable().optional(),
  teachers: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      role: z.string(),
      avatarUrl: z.string().nullable().optional(),
    })
  ),
  subjects: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      slug: z.string(),
    })
  ),
  enrollment: z
    .object({
      status: z.string(),
      enrolledAt: z.string(),
      source: z.string(),
    })
    .nullable()
    .optional(),
  nextClass: z
    .object({
      title: z.string(),
      timeFormatted: z.string(),
      weekday: z.number().int(),
      roomOrLinkNote: z.string().nullable().optional(),
      isToday: z.boolean(),
      isLive: z.boolean(),
      startsInMinutes: z.number().int().optional(),
    })
    .nullable()
    .optional(),
  latestAnnouncements: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      body: z.string(),
      publishedAt: z.string(),
      isPinned: z.boolean(),
      attachmentKeys: z.array(z.string()).default([]),
    })
  ),
});
export type BatchDetailResponse = z.infer<typeof batchDetailResponseSchema>;

export const batchTimetableSlotSchema = z.object({
  id: z.string(),
  weekday: z.number().int(), // 1..7 (1=Mon, 7=Sun)
  weekdayName: z.string(),  // "Mon", "Tue", etc.
  startTime: z.string(),
  endTime: z.string(),
  subjectName: z.string(),
  teacherName: z.string(),
  mode: z.string(),
  roomOrLinkNote: z.string().nullable().optional(),
});
export type BatchTimetableSlot = z.infer<typeof batchTimetableSlotSchema>;

export const batchTimetableResponseSchema = z.object({
  batchId: z.string(),
  slots: z.array(batchTimetableSlotSchema),
});
export type BatchTimetableResponse = z.infer<typeof batchTimetableResponseSchema>;

export const announcementAttachmentSchema = z.object({
  id: z.string(),
  type: z.enum(["image", "pdf", "document"]),
  storageKey: z.string(),
  fileUrl: z.string(),
  fileName: z.string(),
  fileSize: z.string().optional(),
});
export type AnnouncementAttachment = z.infer<typeof announcementAttachmentSchema>;

export const batchAnnouncementItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  body: z.string(),
  publishedAt: z.string(),
  publishedAtFormatted: z.string(),
  isPinned: z.boolean(),
  notifyParents: z.boolean(),
  attachments: z.array(announcementAttachmentSchema).default([]),
});
export type BatchAnnouncementItem = z.infer<typeof batchAnnouncementItemSchema>;

export const batchAnnouncementsResponseSchema = z.object({
  batchId: z.string(),
  announcements: z.array(batchAnnouncementItemSchema),
});
export type BatchAnnouncementsResponse = z.infer<typeof batchAnnouncementsResponseSchema>;

export const batchJoinInputSchema = z.object({
  code: z.string().trim().min(4).max(10),
});
export type BatchJoinInput = z.infer<typeof batchJoinInputSchema>;

export const batchJoinResponseSchema = z.object({
  status: z.enum([
    "request_created",
    "enrol_online",
    "already_enrolled",
    "already_requested",
  ]),
  message: z.string(),
  batchTitle: z.string(),
  batchSlug: z.string().optional(),
  requestId: z.string().optional(),
  checkoutUrl: z.string().optional(),
});
export type BatchJoinResponse = z.infer<typeof batchJoinResponseSchema>;

export const adminJoinRequestActionSchema = z.object({
  action: z.enum(["approve", "reject"]),
  feePlanId: z.string().uuid().optional(),
  note: z.string().optional(),
});
export type AdminJoinRequestAction = z.infer<typeof adminJoinRequestActionSchema>;

// 12. Batch Content & Materials (/batches/:id/content & /batches/:id/chapters/:chapterId)
export const contentItemKindSchema = z.enum(["youtube", "pdf", "link", "video_hosted"]);
export type ContentItemKind = z.infer<typeof contentItemKindSchema>;

export const batchContentItemSchema = z.object({
  id: z.string(),
  batchId: z.string(),
  subjectId: z.string(),
  chapterId: z.string(),
  section: z.string().nullable().optional(),
  title: z.string(),
  kind: contentItemKindSchema,
  youtubeVideoId: z.string().nullable().optional(),
  storageKey: z.string().nullable().optional(),
  url: z.string().nullable().optional(),
  sizeBytes: z.number().nullable().optional(),
  sizeFormatted: z.string().nullable().optional(),
  pageCount: z.number().nullable().optional(),
  sortOrder: z.number().int().default(0),
  isPublished: z.boolean().default(true),
  publishedAt: z.string(),
  publishedAtFormatted: z.string(),
  isWatched: z.boolean().default(false),
  isCompleted: z.boolean().default(false),
  isNew: z.boolean().default(false), // Published within last 7 days
});
export type BatchContentItem = z.infer<typeof batchContentItemSchema>;

export const batchContentChapterSchema = z.object({
  id: z.string(),
  title: z.string(),
  slug: z.string(),
  chapterNumber: z.number().int().optional(),
  lecturesCount: z.number().int().default(0),
  notesCount: z.number().int().default(0),
  progress: z.number().int().min(0).max(100).default(0),
  completed: z.boolean().default(false),
});
export type BatchContentChapter = z.infer<typeof batchContentChapterSchema>;

export const batchContentSubjectSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  chapters: z.array(batchContentChapterSchema),
});
export type BatchContentSubject = z.infer<typeof batchContentSubjectSchema>;

export const batchContentResponseSchema = z.object({
  batchId: z.string(),
  batchTitle: z.string(),
  subjects: z.array(batchContentSubjectSchema),
});
export type BatchContentResponse = z.infer<typeof batchContentResponseSchema>;

export const batchChapterContentSectionSchema = z.object({
  section: z.string(),
  items: z.array(batchContentItemSchema),
});
export type BatchChapterContentSection = z.infer<typeof batchChapterContentSectionSchema>;

export const batchChapterContentResponseSchema = z.object({
  batchId: z.string(),
  batchTitle: z.string(),
  subjectId: z.string(),
  subjectName: z.string(),
  chapterId: z.string(),
  chapterTitle: z.string(),
  lectures: z.array(batchContentItemSchema),
  notes: z.array(batchContentItemSchema),
  sections: z.array(batchChapterContentSectionSchema),
});
export type BatchChapterContentResponse = z.infer<typeof batchChapterContentResponseSchema>;

export const contentFileUrlResponseSchema = z.object({
  id: z.string(),
  title: z.string(),
  url: z.string().url(),
  expiresInSeconds: z.number().int(),
});
export type ContentFileUrlResponse = z.infer<typeof contentFileUrlResponseSchema>;

// 13. Live Sessions & Attendance (/batches/:id/live, /live/:id/join, /attendance, /attendance/summary)
export const liveSessionProviderSchema = z.enum(["zoom", "google_meet", "youtube_live", "offline"]);
export type LiveSessionProvider = z.infer<typeof liveSessionProviderSchema>;

export const liveSessionStatusSchema = z.enum(["scheduled", "live", "ended", "cancelled"]);
export type LiveSessionStatus = z.infer<typeof liveSessionStatusSchema>;

export const liveSessionItemSchema = z.object({
  id: z.string(),
  batchId: z.string(),
  batchTitle: z.string().optional(),
  subjectId: z.string().nullable().optional(),
  subjectName: z.string().nullable().optional(),
  teacherId: z.string().nullable().optional(),
  teacherName: z.string().nullable().optional(),
  title: z.string(),
  startsAt: z.string(),
  endsAt: z.string(),
  startsAtFormatted: z.string(),
  endsAtFormatted: z.string(),
  timeFormatted: z.string(),
  provider: liveSessionProviderSchema,
  joinUrl: z.string().nullable().optional(),
  passcode: z.string().nullable().optional(),
  status: liveSessionStatusSchema,
  isLive: z.boolean(),
  startsInMinutes: z.number().int().optional(),
  recordingYoutubeId: z.string().nullable().optional(),
  createdAt: z.string(),
});
export type LiveSessionItem = z.infer<typeof liveSessionItemSchema>;

export const batchLiveResponseSchema = z.object({
  batchId: z.string(),
  batchTitle: z.string().optional(),
  liveNow: liveSessionItemSchema.nullable().optional(),
  nextSession: liveSessionItemSchema.nullable().optional(),
  recentRecordings: z.array(liveSessionItemSchema),
  allUpcoming: z.array(liveSessionItemSchema).optional(),
});
export type BatchLiveResponse = z.infer<typeof batchLiveResponseSchema>;

export const liveJoinResponseSchema = z.object({
  sessionId: z.string(),
  joinUrl: z.string(),
  passcode: z.string().nullable().optional(),
  provider: liveSessionProviderSchema,
  attendanceStatus: z.enum(["present", "late"]),
  message: z.string(),
});
export type LiveJoinResponse = z.infer<typeof liveJoinResponseSchema>;

export const attendanceStatusSchema = z.enum(["present", "absent", "late", "excused"]);
export type AttendanceStatus = z.infer<typeof attendanceStatusSchema>;

export const attendanceSourceSchema = z.enum(["joined_online", "marked"]);
export type AttendanceSource = z.infer<typeof attendanceSourceSchema>;

export const attendanceRecordItemSchema = z.object({
  id: z.string(),
  batchId: z.string(),
  batchTitle: z.string().optional(),
  sessionId: z.string().nullable().optional(),
  sessionTitle: z.string().nullable().optional(),
  studentId: z.string(),
  studentName: z.string().optional(),
  date: z.string(), // YYYY-MM-DD
  status: attendanceStatusSchema,
  source: attendanceSourceSchema,
  note: z.string().nullable().optional(),
  markedAt: z.string().optional(),
});
export type AttendanceRecordItem = z.infer<typeof attendanceRecordItemSchema>;

export const attendanceStatsSchema = z.object({
  totalDays: z.number().int(),
  presentDays: z.number().int(),
  absentDays: z.number().int(),
  lateDays: z.number().int(),
  excusedDays: z.number().int(),
  monthPercentage: z.number(),
  termPercentage: z.number(),
});
export type AttendanceStats = z.infer<typeof attendanceStatsSchema>;

export const attendanceMonthResponseSchema = z.object({
  studentId: z.string(),
  studentName: z.string(),
  batchId: z.string().nullable().optional(),
  month: z.string(), // YYYY-MM
  records: z.array(attendanceRecordItemSchema),
  stats: attendanceStatsSchema,
  absences: z.array(attendanceRecordItemSchema),
});
export type AttendanceMonthResponse = z.infer<typeof attendanceMonthResponseSchema>;

export const attendanceSummaryResponseSchema = z.object({
  studentId: z.string(),
  studentName: z.string(),
  monthPercentage: z.number(),
  termPercentage: z.number(),
  totalClasses: z.number().int(),
  attendedClasses: z.number().int(),
  absentClasses: z.number().int(),
  lateClasses: z.number().int(),
  recentAbsences: z.array(attendanceRecordItemSchema),
});
export type AttendanceSummaryResponse = z.infer<typeof attendanceSummaryResponseSchema>;

export const markAttendanceStudentEntrySchema = z.object({
  studentId: z.string(),
  status: attendanceStatusSchema,
  note: z.string().optional(),
});
export type MarkAttendanceStudentEntry = z.infer<typeof markAttendanceStudentEntrySchema>;

export const markBatchAttendanceInputSchema = z.object({
  batchId: z.string().uuid(),
  sessionId: z.string().uuid().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  entries: z.array(markAttendanceStudentEntrySchema),
});
export type MarkBatchAttendanceInput = z.infer<typeof markBatchAttendanceInputSchema>;

export const createLiveSessionInputSchema = z.object({
  batchId: z.string().uuid(),
  subjectId: z.string().uuid().optional().nullable(),
  teacherId: z.string().uuid().optional().nullable(),
  title: z.string().trim().min(3).max(200),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
  provider: liveSessionProviderSchema.default("zoom"),
  joinUrl: z.string().url().optional().nullable().or(z.literal("")),
  passcode: z.string().optional().nullable().or(z.literal("")),
  recordingYoutubeId: z.string().optional().nullable().or(z.literal("")),
});
export type CreateLiveSessionInput = z.infer<typeof createLiveSessionInputSchema>;

// ==========================================
// 12. QUESTIONS & TESTS ENGINE
// ==========================================

export const questionTypeSchema = z.enum([
  "mcq_single",
  "mcq_multi",
  "assertion_reason",
  "case_study",
  "numeric",
  "true_false",
]);
export type QuestionType = z.infer<typeof questionTypeSchema>;

export const questionDifficultySchema = z.enum(["easy", "medium", "hard"]);
export type QuestionDifficulty = z.infer<typeof questionDifficultySchema>;

export const testKindSchema = z.enum(["chapter_test", "unit_test", "mock", "practice"]);
export type TestKind = z.infer<typeof testKindSchema>;

export const testShowSolutionsSchema = z.enum(["after_submit", "after_end", "never"]);
export type TestShowSolutions = z.infer<typeof testShowSolutionsSchema>;

export const testStatusSchema = z.enum(["draft", "scheduled", "live", "closed"]);
export type TestStatus = z.infer<typeof testStatusSchema>;

export const attemptStatusSchema = z.enum(["in_progress", "submitted", "auto_submitted"]);
export type AttemptStatus = z.infer<typeof attemptStatusSchema>;

export const questionOptionSchema = z.object({
  id: z.string(),
  text: z.string(),
  imageKey: z.string().optional().nullable(),
});
export type QuestionOption = z.infer<typeof questionOptionSchema>;

export const caseGroupSchema = z.object({
  id: z.string().uuid(),
  passage: z.string(),
  imageKey: z.string().nullable().optional(),
});
export type CaseGroupItem = z.infer<typeof caseGroupSchema>;

export const questionItemSchema = z.object({
  id: z.string().uuid(),
  subjectId: z.string().uuid(),
  subjectName: z.string().optional(),
  chapterId: z.string().uuid().nullable().optional(),
  chapterTitle: z.string().optional(),
  classLevel: z.number().int(),
  type: questionTypeSchema,
  stem: z.string(),
  imageKey: z.string().nullable().optional(),
  options: z.array(questionOptionSchema).nullable().optional(),
  correct: z.any().optional(),
  solution: z.string().nullable().optional(),
  difficulty: questionDifficultySchema,
  marks: z.number(),
  negativeMarks: z.number(),
  tags: z.array(z.string()),
  source: z.string().nullable().optional(),
  competency: z.string().nullable().optional(),
  caseGroupId: z.string().uuid().nullable().optional(),
  caseGroup: caseGroupSchema.nullable().optional(),
  isActive: z.boolean(),
  createdAt: z.string().or(z.date()).optional(),
});
export type QuestionItem = z.infer<typeof questionItemSchema>;

export const studentTestQuestionSchema = z.object({
  id: z.string().uuid(),
  position: z.number().int(),
  marks: z.number(),
  negativeMarks: z.number(),
  type: questionTypeSchema,
  stem: z.string(),
  imageKey: z.string().nullable().optional(),
  options: z.array(questionOptionSchema).nullable().optional(),
  caseGroup: caseGroupSchema.nullable().optional(),
  // Note: correct and solution are strictly stripped from student view!
});
export type StudentTestQuestion = z.infer<typeof studentTestQuestionSchema>;

export const testListItemSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  batchId: z.string().uuid().nullable().optional(),
  batchName: z.string().optional(),
  subjectId: z.string().uuid(),
  subjectName: z.string().optional(),
  chapterIds: z.array(z.string()),
  kind: testKindSchema,
  durationMinutes: z.number().int(),
  totalMarks: z.number(),
  startsAt: z.string().nullable().optional(),
  endsAt: z.string().nullable().optional(),
  attemptsAllowed: z.number().int(),
  shuffleQuestions: z.boolean(),
  shuffleOptions: z.boolean(),
  showSolutions: testShowSolutionsSchema,
  status: testStatusSchema,
  questionCount: z.number().int().optional(),
  myAttemptsCount: z.number().int().optional(),
  myBestScore: z.number().nullable().optional(),
  latestAttemptStatus: attemptStatusSchema.nullable().optional(),
  latestAttemptId: z.string().uuid().nullable().optional(),
  createdAt: z.string().or(z.date()),
});
export type TestListItem = z.infer<typeof testListItemSchema>;

export const testsListResponseSchema = z.object({
  tests: z.array(testListItemSchema),
});
export type TestsListResponse = z.infer<typeof testsListResponseSchema>;

export const testDetailSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  batchId: z.string().uuid().nullable().optional(),
  batchName: z.string().nullable().optional(),
  subjectId: z.string().uuid(),
  subjectName: z.string().optional(),
  chapterIds: z.array(z.string()).default([]),
  kind: testKindSchema,
  durationMinutes: z.number().int(),
  totalMarks: z.number(),
  startsAt: z.string().or(z.date()).nullable().optional(),
  endsAt: z.string().or(z.date()).nullable().optional(),
  attemptsAllowed: z.number().int(),
  shuffleQuestions: z.boolean(),
  shuffleOptions: z.boolean(),
  showSolutions: testShowSolutionsSchema,
  status: testStatusSchema,
  questionsCount: z.number().int().optional(),
  createdAt: z.string().or(z.date()),
  questions: z.array(z.any()).optional(),
  myAttemptsCount: z.number().int().optional(),
  myBestScore: z.number().nullable().optional(),
  latestAttemptStatus: attemptStatusSchema.nullable().optional(),
  latestAttemptId: z.string().uuid().nullable().optional(),
});
export type TestDetail = z.infer<typeof testDetailSchema>;

export const testDetailResponseSchema = z.object({
  test: testDetailSchema,
});
export type TestDetailResponse = z.infer<typeof testDetailResponseSchema>;

export const startAttemptResponseSchema = z.object({
  attemptId: z.string().uuid(),
  testId: z.string().uuid(),
  title: z.string(),
  durationMinutes: z.number().int(),
  startedAt: z.string(),
  deadlineAt: z.string(),
  serverNow: z.string(),
  questions: z.array(studentTestQuestionSchema),
  savedAnswers: z.record(
    z.object({
      answer: z.any(),
      timeSpentSeconds: z.number(),
      markedForReview: z.boolean(),
    })
  ).optional(),
});
export type StartAttemptResponse = z.infer<typeof startAttemptResponseSchema>;

export const saveAnswerItemSchema = z.object({
  questionId: z.string().uuid(),
  answer: z.any().nullable().optional(),
  timeSpentSeconds: z.number().int().default(0),
  markedForReview: z.boolean().default(false),
});
export type SaveAnswerItem = z.infer<typeof saveAnswerItemSchema>;

export const batchSaveAnswersInputSchema = z.object({
  answers: z.array(saveAnswerItemSchema),
});
export type BatchSaveAnswersInput = z.infer<typeof batchSaveAnswersInputSchema>;

export const batchSaveAnswersResponseSchema = z.object({
  success: z.boolean(),
  savedCount: z.number().int(),
});
export type BatchSaveAnswersResponse = z.infer<typeof batchSaveAnswersResponseSchema>;

export const submitAttemptResponseSchema = z.object({
  attemptId: z.string().uuid(),
  score: z.number(),
  correct: z.number().int().optional(),
  wrong: z.number().int().optional(),
  skipped: z.number().int().optional(),
  isAutoSubmit: z.boolean().optional(),
  alreadySubmitted: z.boolean().optional(),
});
export type SubmitAttemptResponse = z.infer<typeof submitAttemptResponseSchema>;

export const testQuestionResultSchema = z.object({
  questionId: z.string().uuid(),
  position: z.number().int(),
  type: questionTypeSchema,
  stem: z.string(),
  imageKey: z.string().nullable().optional(),
  options: z.array(questionOptionSchema).nullable().optional(),
  caseGroup: caseGroupSchema.nullable().optional(),
  studentAnswer: z.any().nullable().optional(),
  correctAnswer: z.any().nullable().optional(),
  solution: z.string().nullable().optional(),
  isCorrect: z.boolean().nullable().optional(),
  marksAwarded: z.number(),
  marksPossible: z.number(),
  negativeMarks: z.number(),
  timeSpentSeconds: z.number().int(),
  markedForReview: z.boolean(),
});
export type TestQuestionResult = z.infer<typeof testQuestionResultSchema>;

export const chapterBreakdownItemSchema = z.object({
  chapterId: z.string().nullable(),
  chapterTitle: z.string(),
  totalQuestions: z.number().int(),
  correctQuestions: z.number().int(),
  wrongQuestions: z.number().int(),
  skippedQuestions: z.number().int(),
  marksObtained: z.number(),
  totalMarks: z.number(),
  accuracyPercentage: z.number(),
});
export type ChapterBreakdownItem = z.infer<typeof chapterBreakdownItemSchema>;

export const testResultResponseSchema = z.object({
  attemptId: z.string().uuid(),
  testId: z.string().uuid(),
  title: z.string(),
  status: attemptStatusSchema,
  score: z.number(),
  totalMarks: z.number(),
  percentage: z.number(),
  correct: z.number().int(),
  wrong: z.number().int(),
  skipped: z.number().int(),
  accuracy: z.number(),
  timeSpentSeconds: z.number().int(),
  durationMinutes: z.number().int(),
  rank: z.number().int().nullable().optional(),
  totalParticipants: z.number().int().optional(),
  solutionsAvailable: z.boolean(),
  solutionsNote: z.string().optional(),
  chapterBreakdown: z.array(chapterBreakdownItemSchema),
  questions: z.array(testQuestionResultSchema),
});
export type TestResultResponse = z.infer<typeof testResultResponseSchema>;

export const studentPerformanceResponseSchema = z.object({
  studentId: z.string(),
  studentName: z.string(),
  totalTestsAttempted: z.number().int(),
  totalTestsMissed: z.number().int().optional().default(0),
  averageScorePercentage: z.number(),
  totalTimeSpentMinutes: z.number(),
  recentAttempts: z.array(
    z.object({
      attemptId: z.string().uuid(),
      testId: z.string().uuid(),
      testTitle: z.string(),
      score: z.number(),
      totalMarks: z.number(),
      percentage: z.number(),
      rank: z.number().nullable().optional(),
      submittedAt: z.string().or(z.date()),
    })
  ),
  subjectBreakdown: z.array(
    z.object({
      subjectId: z.string().uuid(),
      subjectName: z.string(),
      testsCount: z.number().int(),
      averageScorePercentage: z.number(),
    })
  ),
  chapterBreakdown: z
    .array(
      z.object({
        chapterId: z.string().nullable().optional(),
        chapterTitle: z.string(),
        averageAccuracyPercentage: z.number(),
        totalQuestions: z.number().int(),
      })
    )
    .optional()
    .default([]),
  strongestChapters: z.array(z.string()).optional().default([]),
  weakestChapters: z.array(z.string()).optional().default([]),
});
export type StudentPerformanceResponse = z.infer<typeof studentPerformanceResponseSchema>;

export const createQuestionInputSchema = z.object({
  subjectId: z.string().uuid(),
  chapterId: z.string().uuid().nullable().optional(),
  classLevel: z.number().int().min(9).max(12),
  type: questionTypeSchema.default("mcq_single"),
  stem: z.string().min(1, "Question stem is required"),
  imageKey: z.string().nullable().optional(),
  options: z.array(questionOptionSchema).optional(),
  correct: z.any(),
  solution: z.string().nullable().optional(),
  difficulty: questionDifficultySchema.default("medium"),
  marks: z.number().min(0).default(1),
  negativeMarks: z.number().min(0).default(0),
  tags: z.array(z.string()).default([]),
  source: z.string().nullable().optional(),
  competency: z.string().nullable().optional(),
  caseGroupId: z.string().uuid().nullable().optional(),
  passageText: z.string().nullable().optional(),
});
export type CreateQuestionInput = z.infer<typeof createQuestionInputSchema>;

export const createTestInputSchema = z.object({
  title: z.string().trim().min(3).max(200),
  batchId: z.string().uuid().nullable().optional(),
  subjectId: z.string().uuid(),
  chapterIds: z.array(z.string().uuid()).default([]),
  kind: testKindSchema.default("chapter_test"),
  durationMinutes: z.number().int().min(1).max(360),
  startsAt: z.string().datetime().nullable().optional(),
  endsAt: z.string().datetime().nullable().optional(),
  attemptsAllowed: z.number().int().min(1).max(10).default(1),
  shuffleQuestions: z.boolean().default(false),
  shuffleOptions: z.boolean().default(false),
  showSolutions: testShowSolutionsSchema.default("after_submit"),
  status: testStatusSchema.default("draft"),
  questionIds: z.array(
    z.object({
      questionId: z.string().uuid(),
      position: z.number().int(),
      marksOverride: z.number().optional().nullable(),
    })
  ),
});
export type CreateTestInput = z.infer<typeof createTestInputSchema>;

// ---------------------------------------------------------------------------
// DOUBTS SYSTEM (Prompt 11)
// ---------------------------------------------------------------------------

export const doubtSourceTypeSchema = z.enum(["lecture", "test_question", "general"]);
export type DoubtSourceType = z.infer<typeof doubtSourceTypeSchema>;

export const doubtStatusSchema = z.enum(["open", "answered", "closed"]);
export type DoubtStatus = z.infer<typeof doubtStatusSchema>;

export const doubtMessageSchema = z.object({
  id: z.string().uuid(),
  doubtId: z.string().uuid(),
  authorId: z.string(),
  authorName: z.string(),
  authorRole: z.string(),
  authorAvatarUrl: z.string().nullable().optional(),
  body: z.string(),
  attachmentKeys: z.array(z.string()).default([]),
  attachmentUrls: z.array(z.string()).default([]),
  createdAt: z.string().or(z.date()),
});
export type DoubtMessageItem = z.infer<typeof doubtMessageSchema>;

export const doubtItemSchema = z.object({
  id: z.string().uuid(),
  studentId: z.string(),
  studentName: z.string().optional(),
  studentPhone: z.string().nullable().optional(),
  batchId: z.string().uuid().nullable().optional(),
  batchName: z.string().nullable().optional(),
  subjectId: z.string().uuid(),
  subjectName: z.string().optional(),
  chapterId: z.string().uuid().nullable().optional(),
  chapterTitle: z.string().nullable().optional(),
  sourceType: doubtSourceTypeSchema,
  sourceId: z.string().nullable().optional(),
  timestampSeconds: z.number().int().nullable().optional(),
  title: z.string(),
  status: doubtStatusSchema,
  assignedTeacherId: z.string().nullable().optional(),
  assignedTeacherName: z.string().nullable().optional(),
  lastActivityAt: z.string().or(z.date()),
  isHelpful: z.boolean().default(false),
  createdAt: z.string().or(z.date()),
  updatedAt: z.string().or(z.date()),
  messagesCount: z.number().int().optional(),
  firstMessageSnippet: z.string().optional(),
  hasAttachments: z.boolean().optional(),
  sourceTitle: z.string().optional(),
});
export type DoubtItem = z.infer<typeof doubtItemSchema>;

export const doubtsListResponseSchema = z.object({
  doubts: z.array(doubtItemSchema),
  openCount: z.number().int().optional(),
});
export type DoubtsListResponse = z.infer<typeof doubtsListResponseSchema>;

export const doubtThreadResponseSchema = z.object({
  doubt: doubtItemSchema,
  messages: z.array(doubtMessageSchema),
  sourceContext: z
    .object({
      lectureId: z.string().optional(),
      lectureTitle: z.string().optional(),
      lectureDurationFormatted: z.string().optional(),
      timestampFormatted: z.string().optional(),
      questionId: z.string().optional(),
      questionStem: z.string().optional(),
      questionType: z.string().optional(),
      questionSolution: z.string().nullable().optional(),
    })
    .nullable()
    .optional(),
});
export type DoubtThreadResponse = z.infer<typeof doubtThreadResponseSchema>;

export const createDoubtInputSchema = z.object({
  subjectId: z.string().uuid("Subject is required"),
  chapterId: z.string().uuid().nullable().optional(),
  batchId: z.string().uuid().nullable().optional(),
  sourceType: doubtSourceTypeSchema.default("general"),
  sourceId: z.string().nullable().optional(),
  timestampSeconds: z.number().int().min(0).nullable().optional(),
  title: z.string().trim().min(3, "Title must be at least 3 characters").max(200),
  body: z.string().trim().min(1, "Question description is required").max(5000),
  attachmentKeys: z.array(z.string()).max(3, "At most 3 photos allowed").default([]),
});
export type CreateDoubtInput = z.infer<typeof createDoubtInputSchema>;

export const replyDoubtInputSchema = z.object({
  body: z.string().trim().min(1, "Reply message cannot be empty").max(5000),
  attachmentKeys: z.array(z.string()).max(3, "At most 3 photos allowed").default([]),
  lectureLink: z
    .object({
      lectureId: z.string(),
      timestampSeconds: z.number().int().min(0),
      title: z.string().optional(),
    })
    .optional(),
});
export type ReplyDoubtInput = z.infer<typeof replyDoubtInputSchema>;

export const presignedDoubtUploadsInputSchema = z.object({
  files: z
    .array(
      z.object({
        filename: z.string(),
        contentType: z.string(),
        sizeBytes: z.number().int().optional(),
      })
    )
    .min(1)
    .max(3, "At most 3 photos allowed"),
});
export type PresignedDoubtUploadsInput = z.infer<typeof presignedDoubtUploadsInputSchema>;

export const presignedDoubtUploadsResponseSchema = z.object({
  uploads: z.array(
    z.object({
      key: z.string(),
      uploadUrl: z.string(),
    })
  ),
});
export type PresignedDoubtUploadsResponse = z.infer<
  typeof presignedDoubtUploadsResponseSchema
>;

export const doubtCannedReplySchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  body: z.string(),
  category: z.string(),
});
export type DoubtCannedReplyItem = z.infer<typeof doubtCannedReplySchema>;

export const doubtCannedRepliesResponseSchema = z.object({
  cannedReplies: z.array(doubtCannedReplySchema),
});
export type DoubtCannedRepliesResponse = z.infer<
  typeof doubtCannedRepliesResponseSchema
>;

export const adminDoubtsQuerySchema = z.object({
  status: z.enum(["all", "unanswered", "open", "answered", "closed"]).default("unanswered"),
  subjectId: z.string().uuid().optional(),
  batchId: z.string().uuid().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});
export type AdminDoubtsQuery = z.infer<typeof adminDoubtsQuerySchema>;

// 17. Fees, Dues & Receipts (/fees)
export const feeDueItemSchema = z.object({
  id: z.string(),
  enrollmentId: z.string(),
  batchId: z.string().nullable().optional(),
  batchTitle: z.string(),
  installmentName: z.string(),
  amountPaise: z.number().int(),
  dueDate: z.string(),
  status: z.enum(["due", "paid", "cancelled"]),
  paymentId: z.string().nullable().optional(),
  receiptNo: z.string().nullable().optional(),
  paidAt: z.string().nullable().optional(),
});
export type FeeDueItem = z.infer<typeof feeDueItemSchema>;

export const paymentHistoryItemSchema = z.object({
  id: z.string(),
  batchTitle: z.string(),
  amountPaise: z.number().int(),
  method: z.string(),
  status: z.string(),
  receiptNo: z.string().nullable().optional(),
  paidAt: z.string().nullable().optional(),
  createdAt: z.string(),
  receiptPdfUrl: z.string().nullable().optional(),
});
export type PaymentHistoryItem = z.infer<typeof paymentHistoryItemSchema>;

export const feesResponseSchema = z.object({
  dues: z.array(feeDueItemSchema),
  paymentHistory: z.array(paymentHistoryItemSchema),
  summary: z.object({
    totalDuesPaise: z.number().int(),
    totalPaidPaise: z.number().int(),
    pendingAmountPaise: z.number().int(),
    pendingDuesCount: z.number().int(),
  }),
});
export type FeesResponse = z.infer<typeof feesResponseSchema>;

// 18. Student Quick Stats (/student/stats)
export const studentQuickStatsSchema = z.object({
  attendancePercentage: z.number().nullable(),
  testsTaken: z.number().int(),
  lecturesCompleted: z.number().int(),
});
export type StudentQuickStats = z.infer<typeof studentQuickStatsSchema>;

// 19. Phone Number Change OTP
export const sendPhoneOtpInputSchema = z.object({
  newPhoneNumber: indianPhoneSchema,
});
export type SendPhoneOtpInput = z.infer<typeof sendPhoneOtpInputSchema>;

export const verifyPhoneOtpInputSchema = z.object({
  newPhoneNumber: indianPhoneSchema,
  code: z.string().trim().length(6, "Verification code must be 6 digits"),
});
export type VerifyPhoneOtpInput = z.infer<typeof verifyPhoneOtpInputSchema>;

// 20. Account Deletion
export const requestDeleteAccountOtpInputSchema = z.object({
  confirmText: z.string().optional(),
});
export type RequestDeleteAccountOtpInput = z.infer<
  typeof requestDeleteAccountOtpInputSchema
>;

export const confirmDeleteAccountInputSchema = z.object({
  code: z.string().trim().length(6, "Verification code must be 6 digits"),
});
export type ConfirmDeleteAccountInput = z.infer<
  typeof confirmDeleteAccountInputSchema
>;

export const publicDeleteAccountRequestSchema = z.object({
  identifier: z
    .string()
    .trim()
    .min(3, "Please enter your registered email or 10-digit phone number"),
});
export type PublicDeleteAccountRequestInput = z.infer<
  typeof publicDeleteAccountRequestSchema
>;

export const publicConfirmDeleteAccountSchema = z.object({
  identifier: z.string().trim().min(3),
  code: z.string().trim().length(6, "Verification code must be 6 digits"),
});
export type PublicConfirmDeleteAccountInput = z.infer<
  typeof publicConfirmDeleteAccountSchema
>;

// 21. Results & Testimonials
export const studentResultItemSchema = z.object({
  id: z.string(),
  studentName: z.string(),
  exam: z.string(),
  year: z.number().int(),
  scoreText: z.string(),
  photoKey: z.string().nullable().optional(),
  photoUrl: z.string().nullable().optional(),
  isFeatured: z.boolean(),
});
export type StudentResultItem = z.infer<typeof studentResultItemSchema>;

export const studentTestimonialItemSchema = z.object({
  id: z.string(),
  studentName: z.string(),
  classLevel: z.number().int(),
  year: z.number().int(),
  quote: z.string(),
  photoKey: z.string().nullable().optional(),
  photoUrl: z.string().nullable().optional(),
  videoId: z.string().nullable().optional(),
});
export type StudentTestimonialItem = z.infer<
  typeof studentTestimonialItemSchema
>;

export const resultsAndTestimonialsResponseSchema = z.object({
  results: z.array(studentResultItemSchema),
  testimonials: z.array(studentTestimonialItemSchema),
});
export type ResultsAndTestimonialsResponse = z.infer<
  typeof resultsAndTestimonialsResponseSchema
>;// 22. Teacher Mobile Tasks
export const teacherTodaySessionSchema = z.object({
  id: z.string(),
  batchId: z.string(),
  batchTitle: z.string(),
  subjectName: z.string().nullable().optional(),
  teacherName: z.string().nullable().optional(),
  title: z.string(),
  startsAt: z.string(),
  endsAt: z.string(),
  startsAtFormatted: z.string(),
  timeFormatted: z.string(),
  status: z.enum(["scheduled", "live", "ended", "cancelled"]),
  provider: z.string(),
  joinUrl: z.string().nullable().optional(),
  passcode: z.string().nullable().optional(),
  attendanceCount: z.number().int().default(0),
  enrolledCount: z.number().int().default(0),
});
export type TeacherTodaySession = z.infer<typeof teacherTodaySessionSchema>;

export const teacherTodaySessionsResponseSchema = z.object({
  sessions: z.array(teacherTodaySessionSchema),
  todayDate: z.string(),
  todayFormatted: z.string(),
});
export type TeacherTodaySessionsResponse = z.infer<
  typeof teacherTodaySessionsResponseSchema
>;

export const teacherBatchItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  subjectId: z.string().nullable().optional(),
  subjectName: z.string().nullable().optional(),
  classLevel: z.number().int().nullable().optional(),
  enrolledCount: z.number().int().default(0),
});
export type TeacherBatchItem = z.infer<typeof teacherBatchItemSchema>;

export const teacherBatchesResponseSchema = z.object({
  batches: z.array(teacherBatchItemSchema),
});
export type TeacherBatchesResponse = z.infer<
  typeof teacherBatchesResponseSchema
>;

export const teacherBatchStudentSchema = z.object({
  id: z.string(),
  name: z.string(),
  phone: z.string().nullable().optional(),
  parentPhone: z.string().nullable().optional(),
  avatarUrl: z.string().nullable().optional(),
  status: z.enum(["present", "absent", "late", "excused"]).nullable().optional(),
  note: z.string().nullable().optional(),
});
export type TeacherBatchStudent = z.infer<typeof teacherBatchStudentSchema>;

export const teacherBatchStudentsResponseSchema = z.object({
  batchId: z.string(),
  batchTitle: z.string(),
  date: z.string(),
  sessionId: z.string().nullable().optional(),
  students: z.array(teacherBatchStudentSchema),
});
export type TeacherBatchStudentsResponse = z.infer<
  typeof teacherBatchStudentsResponseSchema
>;

export const teacherAttendanceEntrySchema = z.object({
  studentId: z.string(),
  status: z.enum(["present", "absent", "late", "excused"]),
  note: z.string().optional(),
});
export type TeacherAttendanceEntry = z.infer<typeof teacherAttendanceEntrySchema>;

export const teacherSaveAttendanceInputSchema = z.object({
  batchId: z.string(),
  sessionId: z.string().nullable().optional(),
  date: z.string(),
  entries: z.array(teacherAttendanceEntrySchema),
});
export type TeacherSaveAttendanceInput = z.infer<
  typeof teacherSaveAttendanceInputSchema
>;

export const teacherSaveAttendanceResponseSchema = z.object({
  success: z.boolean(),
  count: z.number().int(),
  absencesNotified: z.number().int(),
});
export type TeacherSaveAttendanceResponse = z.infer<
  typeof teacherSaveAttendanceResponseSchema
>;

export const teacherPostAnnouncementInputSchema = z.object({
  batchId: z.string(),
  title: z.string().trim().min(2, "Title must be at least 2 characters"),
  body: z.string().trim().min(2, "Body must be at least 2 characters"),
  attachmentKeys: z.array(z.string()).default([]),
  notifyParents: z.boolean().default(false),
});
export type TeacherPostAnnouncementInput = z.infer<
  typeof teacherPostAnnouncementInputSchema
>;

export const teacherPostAnnouncementResponseSchema = z.object({
  success: z.boolean(),
  announcementId: z.string(),
});
export type TeacherPostAnnouncementResponse = z.infer<
  typeof teacherPostAnnouncementResponseSchema
>;

export const teacherBatchChapterItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  chapterNumber: z.number().int().nullable().optional(),
  subjectId: z.string(),
  subjectName: z.string().nullable().optional(),
});
export type TeacherBatchChapterItem = z.infer<typeof teacherBatchChapterItemSchema>;

export const teacherBatchChaptersResponseSchema = z.object({
  batchId: z.string(),
  chapters: z.array(teacherBatchChapterItemSchema),
});
export type TeacherBatchChaptersResponse = z.infer<
  typeof teacherBatchChaptersResponseSchema
>;

export const teacherQuickUploadInputSchema = z.object({
  batchId: z.string(),
  chapterId: z.string(),
  section: z.string().optional().default("Class Notes"),
  title: z.string().trim().min(2, "Title must be at least 2 characters"),
  storageKey: z.string().min(1, "Storage key is required"),
  pageCount: z.number().int().optional(),
  sizeBytes: z.number().int().optional(),
  notifyBatch: z.boolean().optional().default(false),
});
export type TeacherQuickUploadInput = z.infer<
  typeof teacherQuickUploadInputSchema
>;

export const teacherQuickUploadResponseSchema = z.object({
  success: z.boolean(),
  contentItemId: z.string(),
});
export type TeacherQuickUploadResponse = z.infer<
  typeof teacherQuickUploadResponseSchema
>;

export const teacherPresignedUrlInputSchema = z.object({
  filename: z.string().min(1),
  contentType: z.string().min(1),
  folder: z.enum(["notes", "announcements", "doubts", "solutions"]).default("notes"),
});
export type TeacherPresignedUrlInput = z.infer<
  typeof teacherPresignedUrlInputSchema
>;

export const teacherPresignedUrlResponseSchema = z.object({
  key: z.string(),
  uploadUrl: z.string().url(),
});
export type TeacherPresignedUrlResponse = z.infer<
  typeof teacherPresignedUrlResponseSchema
>;

