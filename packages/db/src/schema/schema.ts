import { sql } from "drizzle-orm";
import {
  pgTable,
  uuid,
  text,
  smallint,
  integer,
  bigint,
  boolean,
  timestamp,
  date,
  jsonb,
  index,
  unique,
  uniqueIndex,
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
    mode: batchModeEnum("mode").default("offline").notNull(),
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
