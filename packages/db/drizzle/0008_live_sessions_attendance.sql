DO $$ BEGIN
 CREATE TYPE "public"."live_session_provider" AS ENUM('zoom', 'google_meet', 'youtube_live', 'offline');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."live_session_status" AS ENUM('scheduled', 'live', 'ended', 'cancelled');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."attendance_status" AS ENUM('present', 'absent', 'late', 'excused');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."attendance_source" AS ENUM('joined_online', 'marked');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "live_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"batch_id" uuid NOT NULL,
	"subject_id" uuid,
	"teacher_id" uuid,
	"title" text NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"provider" "public"."live_session_provider" DEFAULT 'zoom' NOT NULL,
	"join_url" text,
	"passcode" text,
	"status" "public"."live_session_status" DEFAULT 'scheduled' NOT NULL,
	"recording_youtube_id" text,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
	"updated_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "live_sessions" ADD CONSTRAINT "live_sessions_batch_id_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."batches"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "live_sessions" ADD CONSTRAINT "live_sessions_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "live_sessions" ADD CONSTRAINT "live_sessions_teacher_id_faculty_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."faculty"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "live_sessions" ADD CONSTRAINT "live_sessions_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_live_sessions_batch" ON "live_sessions" USING btree ("batch_id", "starts_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_live_sessions_status" ON "live_sessions" USING btree ("status", "starts_at");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "live_join_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"joined_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "live_join_events" ADD CONSTRAINT "live_join_events_session_id_live_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."live_sessions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "live_join_events" ADD CONSTRAINT "live_join_events_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_live_join_events_session" ON "live_join_events" USING btree ("session_id", "joined_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_live_join_events_user" ON "live_join_events" USING btree ("user_id");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "attendance_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"batch_id" uuid NOT NULL,
	"session_id" uuid,
	"student_id" text NOT NULL,
	"date" date NOT NULL,
	"status" "public"."attendance_status" NOT NULL,
	"source" "public"."attendance_source" DEFAULT 'marked' NOT NULL,
	"marked_by" text,
	"note" text,
	"created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
	"updated_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_batch_id_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."batches"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_session_id_live_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."live_sessions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_student_id_user_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_marked_by_user_id_fk" FOREIGN KEY ("marked_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uq_attendance_student_batch_date_session" ON "attendance_records" ("student_id", "batch_id", "date", coalesce("session_id", '00000000-0000-0000-0000-000000000000'::uuid));
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_attendance_batch_date" ON "attendance_records" USING btree ("batch_id", "date");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_attendance_student_date" ON "attendance_records" USING btree ("student_id", "date");
