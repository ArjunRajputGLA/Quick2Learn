import { sql } from "drizzle-orm";
import {
  pgTable,
  uuid,
  text,
  varchar,
  smallint,
  integer,
  bigint,
  boolean,
  timestamp,
  date,
  numeric,
  jsonb,
  index,
  unique,
  uniqueIndex,
  primaryKey,
} from "drizzle-orm/pg-core";
import { user } from "./auth";
import {
  userRoleEnum,
  boardEnum,
  batchModeEnum,
  batchStatusEnum,
  enrollmentStatusEnum,
  dueStatusEnum,
  paymentStatusEnum,
  paymentMethodEnum,
  resourceTypeEnum,
  visibilityEnum,
  audienceEnum,
  enquiryStatusEnum,
  storageBucketEnum,
  joinRequestStatusEnum,
  contentItemKindEnum,
  liveSessionProviderEnum,
  liveSessionStatusEnum,
  attendanceStatusEnum,
  attendanceSourceEnum,
  questionTypeEnum,
  questionDifficultyEnum,
  testKindEnum,
  testShowSolutionsEnum,
  testStatusEnum,
  attemptStatusEnum,
  doubtSourceTypeEnum,
  doubtStatusEnum,
} from "./enums";
import { tsvector } from "./custom-types";

// 1. PROFILES
export const profiles = pgTable(
  "profiles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .unique()
      .references(() => user.id, { onDelete: "cascade" }),
    fullName: text("full_name").notNull(),
    phone: text("phone"),
    role: userRoleEnum("role").default("student").notNull(),
    classLevel: smallint("class_level"),
    board: boardEnum("board"),
    school: text("school"),
    parentName: text("parent_name"),
    parentPhone: text("parent_phone"),
    city: text("city"),
    avatarUrl: text("avatar_url"),
    onboardedAt: timestamp("onboarded_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`timezone('utc'::text, now())`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .default(sql`timezone('utc'::text, now())`)
      .notNull(),
  },
);

// 2. SUBJECTS
export const subjects = pgTable("subjects", {
  id: uuid("id").defaultRandom().primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .default(sql`timezone('utc'::text, now())`)
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .default(sql`timezone('utc'::text, now())`)
    .notNull(),
});

// 3. CHAPTERS
export const chapters = pgTable(
  "chapters",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    subjectId: uuid("subject_id")
      .notNull()
      .references(() => subjects.id, { onDelete: "cascade" }),
    classLevel: smallint("class_level").notNull(),
    board: boardEnum("board"),
    number: smallint("number").notNull(),
    title: text("title").notNull(),
    slug: text("slug").notNull(),
    sortOrder: integer("sort_order").default(0).notNull(),
    fts: tsvector("fts").generatedAlwaysAs(
      sql`to_tsvector('simple', coalesce("title", ''))`,
    ),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`timezone('utc'::text, now())`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .default(sql`timezone('utc'::text, now())`)
      .notNull(),
  },
  (table) => [
    index("idx_chapters_fts").using("gin", table.fts),
    index("idx_chapters_lookup").on(table.subjectId, table.classLevel, table.board),
  ],
);

// 4. FACULTY
export const faculty = pgTable("faculty", {
  id: uuid("id").defaultRandom().primaryKey(),
  profileId: text("profile_id").references(() => user.id, {
    onDelete: "set null",
  }),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  designation: text("designation").notNull(),
  bio: text("bio").notNull(),
  photoKey: text("photo_key"),
  subjectIds: uuid("subject_ids")
    .array()
    .default(sql`'{}'`)
    .notNull(),
  achievements: jsonb("achievements")
    .default(sql`'[]'::jsonb`)
    .notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  isPublished: boolean("is_published").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .default(sql`timezone('utc'::text, now())`)
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .default(sql`timezone('utc'::text, now())`)
    .notNull(),
});

// 5. YOUTUBE PLAYLISTS
export const youtubePlaylists = pgTable("youtube_playlists", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  thumbnailUrl: text("thumbnail_url"),
  itemCount: integer("item_count").default(0).notNull(),
  classLevel: smallint("class_level"),
  subjectId: uuid("subject_id").references(() => subjects.id, {
    onDelete: "set null",
  }),
  chapterId: uuid("chapter_id").references(() => chapters.id, {
    onDelete: "set null",
  }),
  syncedAt: timestamp("synced_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .default(sql`timezone('utc'::text, now())`)
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .default(sql`timezone('utc'::text, now())`)
    .notNull(),
});

// 6. YOUTUBE VIDEOS
export const youtubeVideos = pgTable(
  "youtube_videos",
  {
    id: text("id").primaryKey(),
    title: text("title").notNull(),
    description: text("description"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    durationSeconds: integer("duration_seconds").default(0).notNull(),
    thumbnailUrl: text("thumbnail_url"),
    viewCount: integer("view_count").default(0).notNull(),
    likeCount: integer("like_count").default(0).notNull(),
    playlistIds: text("playlist_ids")
      .array()
      .default(sql`'{}'`)
      .notNull(),
    isShort: boolean("is_short").default(false).notNull(),
    classLevel: smallint("class_level"),
    subjectId: uuid("subject_id").references(() => subjects.id, {
      onDelete: "set null",
    }),
    chapterId: uuid("chapter_id").references(() => chapters.id, {
      onDelete: "set null",
    }),
    facultyId: uuid("faculty_id").references(() => faculty.id, {
      onDelete: "set null",
    }),
    isPublished: boolean("is_published").default(true).notNull(),
    needsReview: boolean("needs_review").default(true).notNull(),
    syncedAt: timestamp("synced_at", { withTimezone: true }),
    fts: tsvector("fts").generatedAlwaysAs(
      sql`to_tsvector('simple', coalesce("title", '') || ' ' || coalesce("description", ''))`,
    ),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`timezone('utc'::text, now())`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .default(sql`timezone('utc'::text, now())`)
      .notNull(),
  },
  (table) => [
    index("idx_youtube_videos_fts").using("gin", table.fts),
    index("idx_youtube_videos_published").on(
      table.isPublished,
      table.classLevel,
      table.subjectId,
    ),
  ],
);

// 7. BATCHES
export const batches = pgTable(
  "batches",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    subtitle: text("subtitle"),
    description: text("description").notNull(),
    classLevel: smallint("class_level").notNull(),
    board: boardEnum("board").notNull(),
    subjectId: uuid("subject_id")
      .notNull()
      .references(() => subjects.id, { onDelete: "restrict" }),
    facultyId: uuid("faculty_id").references(() => faculty.id, {
      onDelete: "set null",
    }),
    coverKey: text("cover_key"),
    mode: batchModeEnum("mode").default("online").notNull(),
    scheduleText: text("schedule_text").notNull(),
    locationText: text("location_text"),
    startDate: timestamp("start_date", { withTimezone: true }).notNull(),
    endDate: timestamp("end_date", { withTimezone: true }),
    seatsTotal: integer("seats_total").default(40).notNull(),
    status: batchStatusEnum("status").default("draft").notNull(),
    outcomes: text("outcomes")
      .array()
      .default(sql`'{}'`)
      .notNull(),
    syllabus: jsonb("syllabus")
      .default(sql`'[]'::jsonb`)
      .notNull(),
    faqs: jsonb("faqs")
      .default(sql`'[]'::jsonb`)
      .notNull(),
    whatsappGroupUrl: text("whatsapp_group_url"),
    isFeatured: boolean("is_featured").default(false).notNull(),
    joinCode: varchar("join_code", { length: 6 }).unique(),
    academicYear: varchar("academic_year", { length: 16 }),
    fts: tsvector("fts").generatedAlwaysAs(
      sql`to_tsvector('simple', coalesce("title", '') || ' ' || coalesce("subtitle", ''))`,
    ),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`timezone('utc'::text, now())`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .default(sql`timezone('utc'::text, now())`)
      .notNull(),
  },
  (table) => [
    index("idx_batches_fts").using("gin", table.fts),
    index("idx_batches_status").on(table.status, table.isFeatured),
  ],
);

// 8. BATCH FEE PLANS
export const batchFeePlans = pgTable(
  "batch_fee_plans",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    batchId: uuid("batch_id")
      .notNull()
      .references(() => batches.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    totalPaise: bigint("total_paise", { mode: "number" }).notNull(),
    originalPaise: bigint("original_paise", { mode: "number" }),
    instalments: jsonb("instalments")
      .default(sql`'[]'::jsonb`)
      .notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`timezone('utc'::text, now())`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .default(sql`timezone('utc'::text, now())`)
      .notNull(),
  },
  (table) => [
    index("idx_batch_fee_plans_batch").on(table.batchId, table.isActive),
  ],
);

// 9. ENROLLMENTS
export const enrollments = pgTable(
  "enrollments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    batchId: uuid("batch_id")
      .notNull()
      .references(() => batches.id, { onDelete: "restrict" }),
    studentId: text("student_id")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    feePlanId: uuid("fee_plan_id").references(() => batchFeePlans.id, {
      onDelete: "restrict",
    }),
    status: enrollmentStatusEnum("status")
      .default("pending_payment")
      .notNull(),
    source: text("source").default("online").notNull(),
    enrolledAt: timestamp("enrolled_at", { withTimezone: true })
      .default(sql`timezone('utc'::text, now())`)
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`timezone('utc'::text, now())`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .default(sql`timezone('utc'::text, now())`)
      .notNull(),
  },
  (table) => [
    unique("uq_enrollments_batch_student").on(table.batchId, table.studentId),
    index("idx_enrollments_student").on(table.studentId, table.status),
  ],
);

// 10. FEE DUES
export const feeDues = pgTable(
  "fee_dues",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    enrollmentId: uuid("enrollment_id")
      .notNull()
      .references(() => enrollments.id, { onDelete: "cascade" }),
    label: text("label").notNull(),
    amountPaise: bigint("amount_paise", { mode: "number" }).notNull(),
    dueDate: date("due_date", { mode: "string" }).notNull(),
    status: dueStatusEnum("status").default("due").notNull(),
    paymentId: uuid("payment_id"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`timezone('utc'::text, now())`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .default(sql`timezone('utc'::text, now())`)
      .notNull(),
  },
  (table) => [
    index("idx_fee_dues_enrollment").on(table.enrollmentId, table.status),
  ],
);

// 11. PAYMENTS
export const payments = pgTable("payments", {
  id: uuid("id").defaultRandom().primaryKey(),
  studentId: text("student_id")
    .notNull()
    .references(() => user.id, { onDelete: "restrict" }),
  enrollmentId: uuid("enrollment_id").references(() => enrollments.id, {
    onDelete: "set null",
  }),
  feeDueId: uuid("fee_due_id").references(() => feeDues.id, {
    onDelete: "set null",
  }),
  method: paymentMethodEnum("method").notNull(),
  amountPaise: bigint("amount_paise", { mode: "number" }).notNull(),
  currency: text("currency").default("INR").notNull(),
  status: paymentStatusEnum("status").default("created").notNull(),
  razorpayOrderId: text("razorpay_order_id").unique(),
  razorpayPaymentId: text("razorpay_payment_id").unique(),
  receiptNo: text("receipt_no").unique(),
  recordedBy: text("recorded_by").references(() => user.id, {
    onDelete: "set null",
  }),
  raw: jsonb("raw")
    .default(sql`'{}'::jsonb`)
    .notNull(),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .default(sql`timezone('utc'::text, now())`)
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .default(sql`timezone('utc'::text, now())`)
    .notNull(),
});

// 12. RESOURCES
export const resources = pgTable(
  "resources",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    title: text("title").notNull(),
    type: resourceTypeEnum("type").notNull(),
    storageKey: text("storage_key").notNull(),
    storageBucket: storageBucketEnum("storage_bucket")
      .default("public")
      .notNull(),
    visibility: visibilityEnum("visibility").default("enrolled").notNull(),
    chapterId: uuid("chapter_id").references(() => chapters.id, {
      onDelete: "set null",
    }),
    videoId: text("video_id").references(() => youtubeVideos.id, {
      onDelete: "set null",
    }),
    batchId: uuid("batch_id").references(() => batches.id, {
      onDelete: "set null",
    }),
    createdBy: text("created_by").references(() => user.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`timezone('utc'::text, now())`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .default(sql`timezone('utc'::text, now())`)
      .notNull(),
  },
  (table) => [
    index("idx_resources_visibility").on(table.visibility, table.batchId),
  ],
);

// 13. WEBHOOK EVENTS
export const webhookEvents = pgTable("webhook_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  provider: text("provider").notNull(),
  eventId: text("event_id").notNull().unique(),
  payload: jsonb("payload").notNull(),
  processedAt: timestamp("processed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .default(sql`timezone('utc'::text, now())`)
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .default(sql`timezone('utc'::text, now())`)
    .notNull(),
});

// 14. ANNOUNCEMENTS
export const announcements = pgTable(
  "announcements",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    title: text("title").notNull(),
    body: text("body").notNull(),
    audience: audienceEnum("audience").default("public").notNull(),
    batchId: uuid("batch_id").references(() => batches.id, {
      onDelete: "cascade",
    }),
    isPinned: boolean("is_pinned").default(false).notNull(),
    attachmentKeys: text("attachment_keys")
      .array()
      .default(sql`'{}'`)
      .notNull(),
    notifyParents: boolean("notify_parents").default(false).notNull(),
    publishedAt: timestamp("published_at", { withTimezone: true })
      .default(sql`timezone('utc'::text, now())`)
      .notNull(),
    createdBy: text("created_by").references(() => user.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`timezone('utc'::text, now())`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .default(sql`timezone('utc'::text, now())`)
      .notNull(),
  },
  (table) => [
    index("idx_announcements_audience").on(
      table.audience,
      table.batchId,
      table.publishedAt,
    ),
  ],
);

// 15. TESTIMONIALS
export const testimonials = pgTable(
  "testimonials",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    studentName: text("student_name").notNull(),
    classLevel: smallint("class_level").notNull(),
    year: integer("year").notNull(),
    quote: text("quote").notNull(),
    photoKey: text("photo_key"),
    videoId: text("video_id").references(() => youtubeVideos.id, {
      onDelete: "set null",
    }),
    isPublished: boolean("is_published").default(true).notNull(),
    sortOrder: integer("sort_order").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`timezone('utc'::text, now())`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .default(sql`timezone('utc'::text, now())`)
      .notNull(),
  },
  (table) => [
    index("idx_testimonials_published").on(table.isPublished, table.sortOrder),
    uniqueIndex("uq_testimonials_student_class_year").on(
      table.studentName,
      table.classLevel,
      table.year,
    ),
  ],
);

// 16. RESULTS
export const results = pgTable(
  "results",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    studentName: text("student_name").notNull(),
    exam: text("exam").notNull(),
    year: integer("year").notNull(),
    scoreText: text("score_text").notNull(),
    photoKey: text("photo_key"),
    isFeatured: boolean("is_featured").default(false).notNull(),
    sortOrder: integer("sort_order").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`timezone('utc'::text, now())`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .default(sql`timezone('utc'::text, now())`)
      .notNull(),
  },
  (table) => [
    index("idx_results_featured").on(table.isFeatured, table.sortOrder),
    uniqueIndex("uq_results_student_exam_year").on(
      table.studentName,
      table.exam,
      table.year,
    ),
  ],
);

// 17. ENQUIRIES
export const enquiries = pgTable(
  "enquiries",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    phone: text("phone").notNull(),
    classLevel: smallint("class_level"),
    board: boardEnum("board"),
    message: text("message"),
    sourcePath: text("source_path"),
    status: enquiryStatusEnum("status").default("new").notNull(),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`timezone('utc'::text, now())`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .default(sql`timezone('utc'::text, now())`)
      .notNull(),
  },
  (table) => [index("idx_enquiries_status").on(table.status, table.createdAt)],
);

// 18. SITE SETTINGS
export const siteSettings = pgTable("site_settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .default(sql`timezone('utc'::text, now())`)
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .default(sql`timezone('utc'::text, now())`)
    .notNull(),
});

// 19. LECTURE VIEWS
export const lectureViews = pgTable(
  "lecture_views",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    videoId: text("video_id")
      .notNull()
      .references(() => youtubeVideos.id, { onDelete: "cascade" }),
    viewedAt: timestamp("viewed_at", { withTimezone: true })
      .default(sql`timezone('utc'::text, now())`)
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`timezone('utc'::text, now())`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .default(sql`timezone('utc'::text, now())`)
      .notNull(),
  },
  (table) => [
    index("idx_lecture_views_user").on(table.userId, table.viewedAt),
  ],
);

// 20. SYNC RUNS
export const syncRuns = pgTable("sync_runs", {
  id: uuid("id").defaultRandom().primaryKey(),
  kind: text("kind").notNull(),
  startedAt: timestamp("started_at", { withTimezone: true })
    .default(sql`timezone('utc'::text, now())`)
    .notNull(),
  finishedAt: timestamp("finished_at", { withTimezone: true }),
  added: integer("added").default(0).notNull(),
  updated: integer("updated").default(0).notNull(),
  errors: jsonb("errors")
    .default(sql`'[]'::jsonb`)
    .notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .default(sql`timezone('utc'::text, now())`)
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .default(sql`timezone('utc'::text, now())`)
    .notNull(),
});

// 21. AUDIT LOG
export const auditLog = pgTable(
  "audit_log",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    actorId: text("actor_id").references(() => user.id, {
      onDelete: "set null",
    }),
    action: text("action").notNull(),
    entity: text("entity").notNull(),
    entityId: text("entity_id").notNull(),
    diff: jsonb("diff"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`timezone('utc'::text, now())`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .default(sql`timezone('utc'::text, now())`)
      .notNull(),
  },
  (table) => [
    index("idx_audit_log_entity").on(table.entity, table.entityId),
    index("idx_audit_log_actor").on(table.actorId, table.createdAt),
  ],
);

// 22. DEVICE TOKENS
export const deviceTokens = pgTable(
  "device_tokens",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    expoPushToken: text("expo_push_token").notNull().unique(),
    platform: text("platform").notNull(), // 'android' | 'ios'
    appVersion: text("app_version"),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true })
      .default(sql`timezone('utc'::text, now())`)
      .notNull(),
    disabledAt: timestamp("disabled_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`timezone('utc'::text, now())`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .default(sql`timezone('utc'::text, now())`)
      .notNull(),
  },
  (table) => [
    index("idx_device_tokens_user").on(table.userId),
    index("idx_device_tokens_token").on(table.expoPushToken),
  ],
);

// 23. NOTIFICATIONS
export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    title: text("title").notNull(),
    body: text("body").notNull(),
    data: jsonb("data")
      .$type<{ route?: string; [key: string]: any }>()
      .default(sql`'{}'::jsonb`)
      .notNull(),
    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`timezone('utc'::text, now())`)
      .notNull(),
  },
  (table) => [
    index("idx_notifications_user_created").on(table.userId, table.createdAt),
    index("idx_notifications_user_read").on(table.userId, table.readAt),
  ],
);

// 24. NOTIFICATION PREFERENCES
export const notificationPrefs = pgTable(
  "notification_prefs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    enabled: boolean("enabled").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`timezone('utc'::text, now())`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .default(sql`timezone('utc'::text, now())`)
      .notNull(),
  },
  (table) => [
    unique("uq_notification_prefs_user_type").on(table.userId, table.type),
    index("idx_notification_prefs_user").on(table.userId),
  ],
);

// 25. PARENT LINKS
export const parentLinks = pgTable(
  "parent_links",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    parentUserId: text("parent_user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    studentUserId: text("student_user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    relation: text("relation").default("parent").notNull(),
    verifiedAt: timestamp("verified_at", { withTimezone: true })
      .default(sql`timezone('utc'::text, now())`)
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`timezone('utc'::text, now())`)
      .notNull(),
  },
  (table) => [
    unique("uq_parent_student").on(table.parentUserId, table.studentUserId),
    index("idx_parent_links_parent").on(table.parentUserId),
    index("idx_parent_links_student").on(table.studentUserId),
  ],
);

// 26. PARENT INVITE CODES
export const parentInviteCodes = pgTable(
  "parent_invite_codes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    studentUserId: text("student_user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    code: text("code").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    usedByParentId: text("used_by_parent_id").references(() => user.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`timezone('utc'::text, now())`)
      .notNull(),
  },
  (table) => [
    uniqueIndex("uq_parent_invite_codes_code").on(table.code),
    index("idx_parent_invite_codes_student").on(table.studentUserId),
  ],
);

// 27. CONTENT PROGRESS
export const contentProgress = pgTable(
  "content_progress",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    itemType: text("item_type").notNull(), // 'youtube_video' | 'content_item'
    itemId: text("item_id").notNull(),
    positionSeconds: integer("position_seconds").default(0).notNull(),
    durationSeconds: integer("duration_seconds").default(0).notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`timezone('utc'::text, now())`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .default(sql`timezone('utc'::text, now())`)
      .notNull(),
  },
  (table) => [
    unique("uq_content_progress_user_item").on(
      table.userId,
      table.itemType,
      table.itemId,
    ),
    index("idx_content_progress_user_item").on(table.userId, table.itemType),
    index("idx_content_progress_updated").on(table.userId, table.updatedAt),
  ]
);

// 28. BATCH JOIN REQUESTS
export const batchJoinRequests = pgTable(
  "batch_join_requests",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    batchId: uuid("batch_id")
      .notNull()
      .references(() => batches.id, { onDelete: "cascade" }),
    studentId: text("student_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    status: joinRequestStatusEnum("status").default("pending").notNull(),
    note: text("note"),
    decidedBy: text("decided_by").references(() => user.id, {
      onDelete: "set null",
    }),
    decidedAt: timestamp("decided_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`timezone('utc'::text, now())`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .default(sql`timezone('utc'::text, now())`)
      .notNull(),
  },
  (table) => [
    index("idx_batch_join_requests_batch").on(table.batchId, table.status),
    index("idx_batch_join_requests_student").on(table.studentId, table.status),
  ],
);

// 29. BATCH TIMETABLE SLOTS
export const batchTimetableSlots = pgTable(
  "batch_timetable_slots",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    batchId: uuid("batch_id")
      .notNull()
      .references(() => batches.id, { onDelete: "cascade" }),
    weekday: smallint("weekday").notNull(), // 1 = Monday to 7 = Sunday
    startTime: varchar("start_time", { length: 8 }).notNull(),
    endTime: varchar("end_time", { length: 8 }).notNull(),
    subjectId: uuid("subject_id").references(() => subjects.id, {
      onDelete: "cascade",
    }),
    teacherId: uuid("teacher_id").references(() => faculty.id, {
      onDelete: "set null",
    }),
    mode: text("mode").default("offline").notNull(), // 'offline' | 'online'
    roomOrLinkNote: text("room_or_link_note"),
    validFrom: timestamp("valid_from", { withTimezone: true }),
    validTo: timestamp("valid_to", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`timezone('utc'::text, now())`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .default(sql`timezone('utc'::text, now())`)
      .notNull(),
  },
  (table) => [
    index("idx_batch_timetable_batch_day").on(table.batchId, table.weekday),
  ],
);

// 30. BATCH CONTENT ITEMS
export const contentItems = pgTable(
  "content_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    batchId: uuid("batch_id")
      .notNull()
      .references(() => batches.id, { onDelete: "cascade" }),
    subjectId: uuid("subject_id")
      .notNull()
      .references(() => subjects.id, { onDelete: "cascade" }),
    chapterId: uuid("chapter_id")
      .notNull()
      .references(() => chapters.id, { onDelete: "cascade" }),
    section: text("section"), // e.g. "Selina Solutions", "Class notes"
    title: text("title").notNull(),
    kind: contentItemKindEnum("kind").default("pdf").notNull(), // 'youtube' | 'pdf' | 'link' | 'video_hosted'
    youtubeVideoId: text("youtube_video_id"),
    storageKey: text("storage_key"),
    url: text("url"),
    sizeBytes: bigint("size_bytes", { mode: "number" }),
    pageCount: integer("page_count"),
    sortOrder: integer("sort_order").default(0).notNull(),
    isPublished: boolean("is_published").default(true).notNull(),
    publishedAt: timestamp("published_at", { withTimezone: true })
      .default(sql`timezone('utc'::text, now())`)
      .notNull(),
    createdBy: text("created_by").references(() => user.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`timezone('utc'::text, now())`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .default(sql`timezone('utc'::text, now())`)
      .notNull(),
  },
  (table) => [
    index("idx_content_items_batch").on(
      table.batchId,
      table.subjectId,
      table.chapterId,
      table.sortOrder
    ),
    index("idx_content_items_chapter").on(table.chapterId, table.kind),
  ]
);

// 31. BATCH CHAPTER LINKS
export const batchChapterLinks = pgTable(
  "batch_chapter_links",
  {
    batchId: uuid("batch_id")
      .notNull()
      .references(() => batches.id, { onDelete: "cascade" }),
    chapterId: uuid("chapter_id")
      .notNull()
      .references(() => chapters.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`timezone('utc'::text, now())`)
      .notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.batchId, table.chapterId] }),
    index("idx_batch_chapter_links_chapter").on(table.chapterId),
  ]
);

// 32. LIVE SESSIONS
export const liveSessions = pgTable(
  "live_sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    batchId: uuid("batch_id")
      .notNull()
      .references(() => batches.id, { onDelete: "cascade" }),
    subjectId: uuid("subject_id").references(() => subjects.id, {
      onDelete: "set null",
    }),
    teacherId: uuid("teacher_id").references(() => faculty.id, {
      onDelete: "set null",
    }),
    title: text("title").notNull(),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
    provider: liveSessionProviderEnum("provider").default("zoom").notNull(),
    joinUrl: text("join_url"),
    passcode: text("passcode"),
    status: liveSessionStatusEnum("status").default("scheduled").notNull(),
    recordingYoutubeId: text("recording_youtube_id"),
    createdBy: text("created_by").references(() => user.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`timezone('utc'::text, now())`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .default(sql`timezone('utc'::text, now())`)
      .notNull(),
  },
  (table) => [
    index("idx_live_sessions_batch").on(table.batchId, table.startsAt),
    index("idx_live_sessions_status").on(table.status, table.startsAt),
  ]
);

// 33. LIVE JOIN EVENTS
export const liveJoinEvents = pgTable(
  "live_join_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    sessionId: uuid("session_id")
      .notNull()
      .references(() => liveSessions.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    joinedAt: timestamp("joined_at", { withTimezone: true })
      .default(sql`timezone('utc'::text, now())`)
      .notNull(),
  },
  (table) => [
    index("idx_live_join_events_session").on(table.sessionId, table.joinedAt),
    index("idx_live_join_events_user").on(table.userId),
  ]
);

// 34. ATTENDANCE RECORDS
export const attendanceRecords = pgTable(
  "attendance_records",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    batchId: uuid("batch_id")
      .notNull()
      .references(() => batches.id, { onDelete: "cascade" }),
    sessionId: uuid("session_id").references(() => liveSessions.id, {
      onDelete: "cascade",
    }),
    studentId: text("student_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    date: date("date", { mode: "string" }).notNull(), // 'YYYY-MM-DD'
    status: attendanceStatusEnum("status").notNull(), // 'present' | 'absent' | 'late' | 'excused'
    source: attendanceSourceEnum("source").default("marked").notNull(), // 'joined_online' | 'marked'
    markedBy: text("marked_by").references(() => user.id, {
      onDelete: "set null",
    }),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`timezone('utc'::text, now())`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .default(sql`timezone('utc'::text, now())`)
      .notNull(),
  },
  (table) => [
    uniqueIndex("uq_attendance_student_batch_date_session").on(
      table.studentId,
      table.batchId,
      table.date,
      sql`coalesce(${table.sessionId}, '00000000-0000-0000-0000-000000000000'::uuid)`
    ),
    index("idx_attendance_batch_date").on(table.batchId, table.date),
    index("idx_attendance_student_date").on(table.studentId, table.date),
  ]
);

// 35. CASE GROUPS
export const caseGroups = pgTable("case_groups", {
  id: uuid("id").defaultRandom().primaryKey(),
  passage: text("passage").notNull(),
  imageKey: text("image_key"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .default(sql`timezone('utc'::text, now())`)
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .default(sql`timezone('utc'::text, now())`)
    .notNull(),
});

// 36. QUESTIONS
export const questions = pgTable(
  "questions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    subjectId: uuid("subject_id")
      .notNull()
      .references(() => subjects.id, { onDelete: "cascade" }),
    chapterId: uuid("chapter_id").references(() => chapters.id, {
      onDelete: "set null",
    }),
    classLevel: smallint("class_level").notNull(),
    type: questionTypeEnum("type").default("mcq_single").notNull(),
    stem: text("stem").notNull(),
    imageKey: text("image_key"),
    options: jsonb("options").$type<
      Array<{ id: string; text: string; imageKey?: string }>
    >(),
    correct: jsonb("correct").$type<any>().notNull(),
    solution: text("solution"),
    difficulty: questionDifficultyEnum("difficulty").default("medium").notNull(),
    marks: numeric("marks", { precision: 5, scale: 2 }).default("1.00").notNull(),
    negativeMarks: numeric("negative_marks", { precision: 5, scale: 2 }).default("0.00").notNull(),
    tags: text("tags").array().default(sql`ARRAY[]::text[]`).notNull(),
    source: text("source"),
    competency: text("competency"),
    caseGroupId: uuid("case_group_id").references(() => caseGroups.id, {
      onDelete: "set null",
    }),
    isActive: boolean("is_active").default(true).notNull(),
    createdBy: text("created_by").references(() => user.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`timezone('utc'::text, now())`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .default(sql`timezone('utc'::text, now())`)
      .notNull(),
  },
  (table) => [
    index("idx_questions_subject_class").on(table.subjectId, table.classLevel),
    index("idx_questions_chapter").on(table.chapterId),
    index("idx_questions_type_diff").on(table.type, table.difficulty),
    index("idx_questions_case_group").on(table.caseGroupId),
  ]
);

// 37. TESTS
export const tests = pgTable(
  "tests",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    title: text("title").notNull(),
    batchId: uuid("batch_id").references(() => batches.id, {
      onDelete: "cascade",
    }),
    subjectId: uuid("subject_id")
      .notNull()
      .references(() => subjects.id, { onDelete: "cascade" }),
    chapterIds: jsonb("chapter_ids").$type<string[]>().default(sql`'[]'::jsonb`).notNull(),
    kind: testKindEnum("kind").default("chapter_test").notNull(),
    durationMinutes: integer("duration_minutes").notNull(),
    totalMarks: numeric("total_marks", { precision: 6, scale: 2 }).default("0.00").notNull(),
    startsAt: timestamp("starts_at", { withTimezone: true }),
    endsAt: timestamp("ends_at", { withTimezone: true }),
    attemptsAllowed: integer("attempts_allowed").default(1).notNull(),
    shuffleQuestions: boolean("shuffle_questions").default(false).notNull(),
    shuffleOptions: boolean("shuffle_options").default(false).notNull(),
    showSolutions: testShowSolutionsEnum("show_solutions").default("after_submit").notNull(),
    status: testStatusEnum("status").default("draft").notNull(),
    createdBy: text("created_by").references(() => user.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`timezone('utc'::text, now())`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .default(sql`timezone('utc'::text, now())`)
      .notNull(),
  },
  (table) => [
    index("idx_tests_batch").on(table.batchId),
    index("idx_tests_status_starts").on(table.status, table.startsAt),
    index("idx_tests_subject").on(table.subjectId),
  ]
);

// 38. TEST QUESTIONS
export const testQuestions = pgTable(
  "test_questions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    testId: uuid("test_id")
      .notNull()
      .references(() => tests.id, { onDelete: "cascade" }),
    questionId: uuid("question_id")
      .notNull()
      .references(() => questions.id, { onDelete: "cascade" }),
    position: integer("position").notNull(),
    marksOverride: numeric("marks_override", { precision: 5, scale: 2 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`timezone('utc'::text, now())`)
      .notNull(),
  },
  (table) => [
    uniqueIndex("uq_test_questions_test_question").on(table.testId, table.questionId),
    index("idx_test_questions_test_pos").on(table.testId, table.position),
  ]
);

// 39. TEST ATTEMPTS
export const testAttempts = pgTable(
  "test_attempts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    testId: uuid("test_id")
      .notNull()
      .references(() => tests.id, { onDelete: "cascade" }),
    studentId: text("student_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    startedAt: timestamp("started_at", { withTimezone: true })
      .default(sql`timezone('utc'::text, now())`)
      .notNull(),
    deadlineAt: timestamp("deadline_at", { withTimezone: true }).notNull(),
    submittedAt: timestamp("submitted_at", { withTimezone: true }),
    status: attemptStatusEnum("status").default("in_progress").notNull(),
    score: numeric("score", { precision: 6, scale: 2 }).default("0.00").notNull(),
    correct: integer("correct").default(0).notNull(),
    wrong: integer("wrong").default(0).notNull(),
    skipped: integer("skipped").default(0).notNull(),
    timeSpentSeconds: integer("time_spent_seconds").default(0).notNull(),
    rank: integer("rank"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`timezone('utc'::text, now())`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .default(sql`timezone('utc'::text, now())`)
      .notNull(),
  },
  (table) => [
    index("idx_test_attempts_student_test").on(table.studentId, table.testId),
    index("idx_test_attempts_test_score").on(table.testId, table.score),
    index("idx_test_attempts_status_deadline").on(table.status, table.deadlineAt),
  ]
);

// 40. ATTEMPT ANSWERS
export const attemptAnswers = pgTable(
  "attempt_answers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    attemptId: uuid("attempt_id")
      .notNull()
      .references(() => testAttempts.id, { onDelete: "cascade" }),
    questionId: uuid("question_id")
      .notNull()
      .references(() => questions.id, { onDelete: "cascade" }),
    answer: jsonb("answer"),
    isCorrect: boolean("is_correct"),
    marksAwarded: numeric("marks_awarded", { precision: 5, scale: 2 }).default("0.00"),
    timeSpentSeconds: integer("time_spent_seconds").default(0).notNull(),
    markedForReview: boolean("marked_for_review").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`timezone('utc'::text, now())`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .default(sql`timezone('utc'::text, now())`)
      .notNull(),
  },
  (table) => [
    uniqueIndex("uq_attempt_answers_attempt_question").on(table.attemptId, table.questionId),
    index("idx_attempt_answers_attempt").on(table.attemptId),
  ]
);

// 41. DOUBTS
export const doubts = pgTable(
  "doubts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    studentId: text("student_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    batchId: uuid("batch_id").references(() => batches.id, {
      onDelete: "set null",
    }),
    subjectId: uuid("subject_id")
      .notNull()
      .references(() => subjects.id, { onDelete: "cascade" }),
    chapterId: uuid("chapter_id").references(() => chapters.id, {
      onDelete: "set null",
    }),
    sourceType: doubtSourceTypeEnum("source_type").default("general").notNull(),
    sourceId: text("source_id"),
    timestampSeconds: integer("timestamp_seconds"),
    title: text("title").notNull(),
    status: doubtStatusEnum("status").default("open").notNull(),
    assignedTeacherId: text("assigned_teacher_id").references(() => user.id, {
      onDelete: "set null",
    }),
    lastActivityAt: timestamp("last_activity_at", { withTimezone: true })
      .default(sql`timezone('utc'::text, now())`)
      .notNull(),
    isHelpful: boolean("is_helpful").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`timezone('utc'::text, now())`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .default(sql`timezone('utc'::text, now())`)
      .notNull(),
  },
  (table) => [
    index("idx_doubts_student_status").on(table.studentId, table.status),
    index("idx_doubts_status_activity").on(table.status, table.lastActivityAt),
    index("idx_doubts_subject").on(table.subjectId),
    index("idx_doubts_batch").on(table.batchId),
  ]
);

// 42. DOUBT MESSAGES
export const doubtMessages = pgTable(
  "doubt_messages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    doubtId: uuid("doubt_id")
      .notNull()
      .references(() => doubts.id, { onDelete: "cascade" }),
    authorId: text("author_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    body: text("body").notNull(),
    attachmentKeys: jsonb("attachment_keys").$type<string[]>().default(sql`'[]'::jsonb`).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`timezone('utc'::text, now())`)
      .notNull(),
  },
  (table) => [
    index("idx_doubt_messages_doubt_created").on(table.doubtId, table.createdAt),
  ]
);

// 43. DOUBT CANNED REPLIES
export const doubtCannedReplies = pgTable(
  "doubt_canned_replies",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    title: text("title").notNull(),
    body: text("body").notNull(),
    category: text("category").default("general").notNull(),
    createdBy: text("created_by").references(() => user.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`timezone('utc'::text, now())`)
      .notNull(),
  },
  (table) => [
    index("idx_doubt_canned_replies_category").on(table.category),
  ]
);


