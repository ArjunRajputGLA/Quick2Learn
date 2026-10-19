DO $$ BEGIN
 CREATE TYPE "public"."join_request_status" AS ENUM('pending', 'approved', 'rejected');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "batches" ADD COLUMN IF NOT EXISTS "join_code" varchar(6);
--> statement-breakpoint
ALTER TABLE "batches" ADD COLUMN IF NOT EXISTS "academic_year" varchar(16);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "batches_join_code_unique" ON "batches" ("join_code");
--> statement-breakpoint
ALTER TABLE "announcements" ADD COLUMN IF NOT EXISTS "attachment_keys" text[] DEFAULT '{}'::text[] NOT NULL;
--> statement-breakpoint
ALTER TABLE "announcements" ADD COLUMN IF NOT EXISTS "notify_parents" boolean DEFAULT false NOT NULL;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "batch_join_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"batch_id" uuid NOT NULL,
	"student_id" text NOT NULL,
	"status" "public"."join_request_status" DEFAULT 'pending' NOT NULL,
	"note" text,
	"decided_by" text,
	"decided_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
	"updated_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "batch_join_requests" ADD CONSTRAINT "batch_join_requests_batch_id_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."batches"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "batch_join_requests" ADD CONSTRAINT "batch_join_requests_student_id_user_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "batch_join_requests" ADD CONSTRAINT "batch_join_requests_decided_by_user_id_fk" FOREIGN KEY ("decided_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_batch_join_requests_batch" ON "batch_join_requests" USING btree ("batch_id","status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_batch_join_requests_student" ON "batch_join_requests" USING btree ("student_id","status");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uq_batch_join_pending" ON "batch_join_requests" ("batch_id", "student_id") WHERE "status" = 'pending';
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "batch_timetable_slots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"batch_id" uuid NOT NULL,
	"weekday" smallint NOT NULL,
	"start_time" varchar(8) NOT NULL,
	"end_time" varchar(8) NOT NULL,
	"subject_id" uuid,
	"teacher_id" uuid,
	"mode" text DEFAULT 'offline' NOT NULL,
	"room_or_link_note" text,
	"valid_from" timestamp with time zone,
	"valid_to" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
	"updated_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "batch_timetable_slots" ADD CONSTRAINT "batch_timetable_slots_batch_id_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."batches"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "batch_timetable_slots" ADD CONSTRAINT "batch_timetable_slots_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "batch_timetable_slots" ADD CONSTRAINT "batch_timetable_slots_teacher_id_faculty_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."faculty"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_batch_timetable_batch_day" ON "batch_timetable_slots" USING btree ("batch_id","weekday");
