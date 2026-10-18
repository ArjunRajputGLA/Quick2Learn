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
