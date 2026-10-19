DO $$ BEGIN
 CREATE TYPE "public"."question_type" AS ENUM('mcq_single', 'mcq_multi', 'assertion_reason', 'case_study', 'numeric', 'true_false');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."question_difficulty" AS ENUM('easy', 'medium', 'hard');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."test_kind" AS ENUM('chapter_test', 'unit_test', 'mock', 'practice');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."test_show_solutions" AS ENUM('after_submit', 'after_end', 'never');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."test_status" AS ENUM('draft', 'scheduled', 'live', 'closed');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."attempt_status" AS ENUM('in_progress', 'submitted', 'auto_submitted');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "case_groups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"passage" text NOT NULL,
	"image_key" text,
	"created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
	"updated_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "questions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"subject_id" uuid NOT NULL,
	"chapter_id" uuid,
	"class_level" smallint NOT NULL,
	"type" "public"."question_type" DEFAULT 'mcq_single' NOT NULL,
	"stem" text NOT NULL,
	"image_key" text,
	"options" jsonb,
	"correct" jsonb NOT NULL,
	"solution" text,
	"difficulty" "public"."question_difficulty" DEFAULT 'medium' NOT NULL,
	"marks" numeric(5, 2) DEFAULT '1.00' NOT NULL,
	"negative_marks" numeric(5, 2) DEFAULT '0.00' NOT NULL,
	"tags" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"source" text,
	"competency" text,
	"case_group_id" uuid,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
	"updated_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"batch_id" uuid,
	"subject_id" uuid NOT NULL,
	"chapter_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"kind" "public"."test_kind" DEFAULT 'chapter_test' NOT NULL,
	"duration_minutes" integer NOT NULL,
	"total_marks" numeric(6, 2) DEFAULT '0.00' NOT NULL,
	"starts_at" timestamp with time zone,
	"ends_at" timestamp with time zone,
	"attempts_allowed" integer DEFAULT 1 NOT NULL,
	"shuffle_questions" boolean DEFAULT false NOT NULL,
	"shuffle_options" boolean DEFAULT false NOT NULL,
	"show_solutions" "public"."test_show_solutions" DEFAULT 'after_submit' NOT NULL,
	"status" "public"."test_status" DEFAULT 'draft' NOT NULL,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
	"updated_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "test_questions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"test_id" uuid NOT NULL,
	"question_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"marks_override" numeric(5, 2),
	"created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "test_attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"test_id" uuid NOT NULL,
	"student_id" text NOT NULL,
	"started_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
	"deadline_at" timestamp with time zone NOT NULL,
	"submitted_at" timestamp with time zone,
	"status" "public"."attempt_status" DEFAULT 'in_progress' NOT NULL,
	"score" numeric(6, 2) DEFAULT '0.00' NOT NULL,
	"correct" integer DEFAULT 0 NOT NULL,
	"wrong" integer DEFAULT 0 NOT NULL,
	"skipped" integer DEFAULT 0 NOT NULL,
	"time_spent_seconds" integer DEFAULT 0 NOT NULL,
	"rank" integer,
	"created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
	"updated_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "attempt_answers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"attempt_id" uuid NOT NULL,
	"question_id" uuid NOT NULL,
	"answer" jsonb,
	"is_correct" boolean,
	"marks_awarded" numeric(5, 2) DEFAULT '0.00',
	"time_spent_seconds" integer DEFAULT 0 NOT NULL,
	"marked_for_review" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
	"updated_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "questions" ADD CONSTRAINT "questions_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "questions" ADD CONSTRAINT "questions_chapter_id_chapters_id_fk" FOREIGN KEY ("chapter_id") REFERENCES "public"."chapters"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "questions" ADD CONSTRAINT "questions_case_group_id_case_groups_id_fk" FOREIGN KEY ("case_group_id") REFERENCES "public"."case_groups"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "questions" ADD CONSTRAINT "questions_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tests" ADD CONSTRAINT "tests_batch_id_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."batches"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tests" ADD CONSTRAINT "tests_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tests" ADD CONSTRAINT "tests_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "test_questions" ADD CONSTRAINT "test_questions_test_id_tests_id_fk" FOREIGN KEY ("test_id") REFERENCES "public"."tests"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "test_questions" ADD CONSTRAINT "test_questions_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "test_attempts" ADD CONSTRAINT "test_attempts_test_id_tests_id_fk" FOREIGN KEY ("test_id") REFERENCES "public"."tests"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "test_attempts" ADD CONSTRAINT "test_attempts_student_id_user_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "attempt_answers" ADD CONSTRAINT "attempt_answers_attempt_id_test_attempts_id_fk" FOREIGN KEY ("attempt_id") REFERENCES "public"."test_attempts"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "attempt_answers" ADD CONSTRAINT "attempt_answers_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_questions_subject_class" ON "questions" USING btree ("subject_id","class_level");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_questions_chapter" ON "questions" USING btree ("chapter_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_questions_type_diff" ON "questions" USING btree ("type","difficulty");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_questions_case_group" ON "questions" USING btree ("case_group_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_tests_batch" ON "tests" USING btree ("batch_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_tests_status_starts" ON "tests" USING btree ("status","starts_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_tests_subject" ON "tests" USING btree ("subject_id");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uq_test_questions_test_question" ON "test_questions" USING btree ("test_id","question_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_test_questions_test_pos" ON "test_questions" USING btree ("test_id","position");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_test_attempts_student_test" ON "test_attempts" USING btree ("student_id","test_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_test_attempts_test_score" ON "test_attempts" USING btree ("test_id","score");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_test_attempts_status_deadline" ON "test_attempts" USING btree ("status","deadline_at");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uq_attempt_answers_attempt_question" ON "attempt_answers" USING btree ("attempt_id","question_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_attempt_answers_attempt" ON "attempt_answers" USING btree ("attempt_id");
