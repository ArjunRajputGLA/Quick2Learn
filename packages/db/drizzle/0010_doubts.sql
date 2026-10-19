DO $$ BEGIN
 CREATE TYPE "public"."doubt_source_type" AS ENUM('lecture', 'test_question', 'general');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."doubt_status" AS ENUM('open', 'answered', 'closed');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "doubts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" text NOT NULL,
	"batch_id" uuid,
	"subject_id" uuid NOT NULL,
	"chapter_id" uuid,
	"source_type" "doubt_source_type" DEFAULT 'general' NOT NULL,
	"source_id" text,
	"timestamp_seconds" integer,
	"title" text NOT NULL,
	"status" "doubt_status" DEFAULT 'open' NOT NULL,
	"assigned_teacher_id" text,
	"last_activity_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
	"is_helpful" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
	"updated_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "doubt_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"doubt_id" uuid NOT NULL,
	"author_id" text NOT NULL,
	"body" text NOT NULL,
	"attachment_keys" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "doubt_canned_replies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"category" text DEFAULT 'general' NOT NULL,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "doubts" ADD CONSTRAINT "doubts_student_id_user_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "doubts" ADD CONSTRAINT "doubts_batch_id_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."batches"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "doubts" ADD CONSTRAINT "doubts_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "doubts" ADD CONSTRAINT "doubts_chapter_id_chapters_id_fk" FOREIGN KEY ("chapter_id") REFERENCES "public"."chapters"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "doubts" ADD CONSTRAINT "doubts_assigned_teacher_id_user_id_fk" FOREIGN KEY ("assigned_teacher_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "doubt_messages" ADD CONSTRAINT "doubt_messages_doubt_id_doubts_id_fk" FOREIGN KEY ("doubt_id") REFERENCES "public"."doubts"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "doubt_messages" ADD CONSTRAINT "doubt_messages_author_id_user_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "doubt_canned_replies" ADD CONSTRAINT "doubt_canned_replies_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_doubts_student_status" ON "doubts" USING btree ("student_id","status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_doubts_status_activity" ON "doubts" USING btree ("status","last_activity_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_doubts_subject" ON "doubts" USING btree ("subject_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_doubts_batch" ON "doubts" USING btree ("batch_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_doubt_messages_doubt_created" ON "doubt_messages" USING btree ("doubt_id","created_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_doubt_canned_replies_category" ON "doubt_canned_replies" USING btree ("category");
