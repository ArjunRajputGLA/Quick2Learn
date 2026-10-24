-- ==============================================================================
-- Quick2Learn - Create Admin Portal Schema
-- File: create-admin-portal-schema.sql
-- Description: Creates all database enums, tables, sequences, indexes,
--              and constraints required for the Quick2Learn Admin Portal.
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. ENUMS (IF NOT EXISTS)
DO $$ BEGIN
  CREATE TYPE "user_role" AS ENUM ('student', 'teacher', 'admin', 'parent');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "board" AS ENUM ('cbse', 'icse', 'isc');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "batch_mode" AS ENUM ('offline', 'online', 'hybrid');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "batch_status" AS ENUM ('draft', 'open', 'closed', 'completed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "enrollment_status" AS ENUM ('pending_payment', 'active', 'cancelled', 'completed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "due_status" AS ENUM ('due', 'paid', 'waived');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "payment_status" AS ENUM ('created', 'paid', 'failed', 'refunded');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "payment_method" AS ENUM ('razorpay', 'cash', 'upi_offline', 'bank_transfer');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "resource_type" AS ENUM ('notes', 'worksheet', 'pyq', 'formula_sheet');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "visibility" AS ENUM ('public', 'enrolled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "audience" AS ENUM ('public', 'all_students', 'batch');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "enquiry_status" AS ENUM ('new', 'contacted', 'enrolled', 'closed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "storage_bucket" AS ENUM ('public', 'private');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "join_request_status" AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "content_item_kind" AS ENUM ('youtube', 'pdf', 'link', 'video_hosted');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "live_session_provider" AS ENUM ('zoom', 'google_meet', 'youtube_live', 'offline');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "live_session_status" AS ENUM ('scheduled', 'live', 'ended', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "attendance_status" AS ENUM ('present', 'absent', 'late', 'excused');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "attendance_source" AS ENUM ('joined_online', 'marked');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "question_type" AS ENUM ('mcq_single', 'mcq_multi', 'assertion_reason', 'case_study', 'numeric', 'true_false');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "question_difficulty" AS ENUM ('easy', 'medium', 'hard');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "test_kind" AS ENUM ('chapter_test', 'unit_test', 'mock', 'practice');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "test_show_solutions" AS ENUM ('after_submit', 'after_end', 'never');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "test_status" AS ENUM ('draft', 'scheduled', 'live', 'closed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "attempt_status" AS ENUM ('in_progress', 'submitted', 'auto_submitted');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "doubt_source_type" AS ENUM ('lecture', 'test_question', 'general');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "doubt_status" AS ENUM ('open', 'answered', 'closed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. CORE USERS & PROFILES
CREATE TABLE IF NOT EXISTS "user" (
  "id" text PRIMARY KEY,
  "name" text,
  "email" text UNIQUE,
  "email_verified" boolean DEFAULT false,
  "image" text,
  "created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  "updated_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  "phone_number" text,
  "phone_number_verified" boolean DEFAULT false
);

CREATE TABLE IF NOT EXISTS "profiles" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" text NOT NULL UNIQUE REFERENCES "user"("id") ON DELETE CASCADE,
  "full_name" text NOT NULL,
  "phone" text,
  "role" "user_role" DEFAULT 'student' NOT NULL,
  "class_level" smallint,
  "board" "board",
  "school" text,
  "parent_name" text,
  "parent_phone" text,
  "city" text,
  "avatar_url" text,
  "onboarded_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  "updated_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. ACADEMIC DOMAIN (SUBJECTS & CHAPTERS)
CREATE TABLE IF NOT EXISTS "subjects" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "slug" text NOT NULL UNIQUE,
  "name" text NOT NULL,
  "sort_order" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  "updated_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS "chapters" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "subject_id" uuid NOT NULL REFERENCES "subjects"("id") ON DELETE CASCADE,
  "class_level" smallint NOT NULL,
  "board" "board",
  "number" smallint NOT NULL,
  "title" text NOT NULL,
  "slug" text NOT NULL,
  "sort_order" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  "updated_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. FACULTY
CREATE TABLE IF NOT EXISTS "faculty" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "profile_id" text REFERENCES "user"("id") ON DELETE SET NULL,
  "name" text NOT NULL,
  "slug" text NOT NULL UNIQUE,
  "designation" text NOT NULL,
  "bio" text NOT NULL,
  "photo_key" text,
  "subject_ids" uuid[] DEFAULT '{}' NOT NULL,
  "achievements" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "sort_order" integer DEFAULT 0 NOT NULL,
  "is_published" boolean DEFAULT true NOT NULL,
  "created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  "updated_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. BATCHES & TIMETABLES
CREATE TABLE IF NOT EXISTS "batches" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "slug" text NOT NULL UNIQUE,
  "title" text NOT NULL,
  "subtitle" text,
  "description" text NOT NULL,
  "class_level" smallint NOT NULL,
  "board" "board" NOT NULL,
  "subject_id" uuid NOT NULL REFERENCES "subjects"("id") ON DELETE RESTRICT,
  "faculty_id" uuid REFERENCES "faculty"("id") ON DELETE SET NULL,
  "cover_key" text,
  "mode" "batch_mode" DEFAULT 'online' NOT NULL,
  "schedule_text" text NOT NULL,
  "location_text" text,
  "start_date" timestamp with time zone NOT NULL,
  "end_date" timestamp with time zone,
  "seats_total" integer DEFAULT 40 NOT NULL,
  "status" "batch_status" DEFAULT 'draft' NOT NULL,
  "outcomes" text[] DEFAULT '{}' NOT NULL,
  "syllabus" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "faqs" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "whatsapp_group_url" text,
  "is_featured" boolean DEFAULT false NOT NULL,
  "join_code" varchar(6) UNIQUE,
  "academic_year" varchar(16),
  "created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  "updated_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS "batch_timetable_slots" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "batch_id" uuid NOT NULL REFERENCES "batches"("id") ON DELETE CASCADE,
  "weekday" smallint NOT NULL,
  "start_time" varchar(8) NOT NULL,
  "end_time" varchar(8) NOT NULL,
  "subject_id" uuid REFERENCES "subjects"("id") ON DELETE CASCADE,
  "teacher_id" uuid REFERENCES "faculty"("id") ON DELETE SET NULL,
  "mode" text DEFAULT 'offline' NOT NULL,
  "room_or_link_note" text,
  "valid_from" timestamp with time zone,
  "valid_to" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  "updated_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS "batch_chapter_links" (
  "batch_id" uuid NOT NULL REFERENCES "batches"("id") ON DELETE CASCADE,
  "chapter_id" uuid NOT NULL REFERENCES "chapters"("id") ON DELETE CASCADE,
  "created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY ("batch_id", "chapter_id")
);

CREATE TABLE IF NOT EXISTS "batch_join_requests" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "batch_id" uuid NOT NULL REFERENCES "batches"("id") ON DELETE CASCADE,
  "student_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "status" "join_request_status" DEFAULT 'pending' NOT NULL,
  "note" text,
  "decided_by" text REFERENCES "user"("id") ON DELETE SET NULL,
  "decided_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  "updated_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. CONTENT ITEMS & LECTURES
CREATE TABLE IF NOT EXISTS "youtube_playlists" (
  "id" text PRIMARY KEY,
  "title" text NOT NULL,
  "description" text,
  "thumbnail_url" text,
  "item_count" integer DEFAULT 0 NOT NULL,
  "class_level" smallint,
  "subject_id" uuid REFERENCES "subjects"("id") ON DELETE SET NULL,
  "chapter_id" uuid REFERENCES "chapters"("id") ON DELETE SET NULL,
  "synced_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  "updated_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS "youtube_videos" (
  "id" text PRIMARY KEY,
  "title" text NOT NULL,
  "description" text,
  "published_at" timestamp with time zone,
  "duration_seconds" integer DEFAULT 0 NOT NULL,
  "thumbnail_url" text,
  "view_count" integer DEFAULT 0 NOT NULL,
  "like_count" integer DEFAULT 0 NOT NULL,
  "playlist_ids" text[] DEFAULT '{}' NOT NULL,
  "is_short" boolean DEFAULT false NOT NULL,
  "class_level" smallint,
  "subject_id" uuid REFERENCES "subjects"("id") ON DELETE SET NULL,
  "chapter_id" uuid REFERENCES "chapters"("id") ON DELETE SET NULL,
  "faculty_id" uuid REFERENCES "faculty"("id") ON DELETE SET NULL,
  "is_published" boolean DEFAULT true NOT NULL,
  "needs_review" boolean DEFAULT true NOT NULL,
  "synced_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  "updated_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS "content_items" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "batch_id" uuid NOT NULL REFERENCES "batches"("id") ON DELETE CASCADE,
  "subject_id" uuid NOT NULL REFERENCES "subjects"("id") ON DELETE CASCADE,
  "chapter_id" uuid NOT NULL REFERENCES "chapters"("id") ON DELETE CASCADE,
  "section" text,
  "title" text NOT NULL,
  "kind" "content_item_kind" DEFAULT 'pdf' NOT NULL,
  "youtube_video_id" text,
  "storage_key" text,
  "url" text,
  "size_bytes" bigint,
  "page_count" integer,
  "sort_order" integer DEFAULT 0 NOT NULL,
  "is_published" boolean DEFAULT true NOT NULL,
  "published_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  "created_by" text REFERENCES "user"("id") ON DELETE SET NULL,
  "created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  "updated_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS "content_progress" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "item_type" text NOT NULL,
  "item_id" text NOT NULL,
  "percent" smallint DEFAULT 0 NOT NULL,
  "completed_at" timestamp with time zone,
  "last_position_seconds" integer,
  "created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  "updated_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT "uq_content_progress_user_item" UNIQUE ("user_id", "item_type", "item_id")
);

-- 7. STUDY MATERIALS & RESOURCES
CREATE TABLE IF NOT EXISTS "resources" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "title" text NOT NULL,
  "type" "resource_type" NOT NULL,
  "storage_key" text NOT NULL,
  "storage_bucket" "storage_bucket" DEFAULT 'public' NOT NULL,
  "visibility" "visibility" DEFAULT 'enrolled' NOT NULL,
  "chapter_id" uuid REFERENCES "chapters"("id") ON DELETE SET NULL,
  "video_id" text REFERENCES "youtube_videos"("id") ON DELETE SET NULL,
  "batch_id" uuid REFERENCES "batches"("id") ON DELETE SET NULL,
  "created_by" text REFERENCES "user"("id") ON DELETE SET NULL,
  "created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  "updated_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS "resource_downloads" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "resource_id" uuid NOT NULL REFERENCES "resources"("id") ON DELETE CASCADE,
  "user_id" text REFERENCES "user"("id") ON DELETE SET NULL,
  "ip_address" text,
  "user_agent" text,
  "downloaded_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. LIVE SESSIONS & ATTENDANCE
CREATE TABLE IF NOT EXISTS "live_sessions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "batch_id" uuid NOT NULL REFERENCES "batches"("id") ON DELETE CASCADE,
  "subject_id" uuid REFERENCES "subjects"("id") ON DELETE SET NULL,
  "teacher_id" uuid REFERENCES "faculty"("id") ON DELETE SET NULL,
  "title" text NOT NULL,
  "starts_at" timestamp with time zone NOT NULL,
  "ends_at" timestamp with time zone NOT NULL,
  "provider" "live_session_provider" DEFAULT 'zoom' NOT NULL,
  "join_url" text,
  "passcode" text,
  "status" "live_session_status" DEFAULT 'scheduled' NOT NULL,
  "recording_youtube_id" text,
  "created_by" text REFERENCES "user"("id") ON DELETE SET NULL,
  "created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  "updated_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS "live_join_events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "session_id" uuid NOT NULL REFERENCES "live_sessions"("id") ON DELETE CASCADE,
  "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "joined_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS "attendance_records" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "batch_id" uuid NOT NULL REFERENCES "batches"("id") ON DELETE CASCADE,
  "session_id" uuid REFERENCES "live_sessions"("id") ON DELETE CASCADE,
  "student_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "date" date NOT NULL,
  "status" "attendance_status" NOT NULL,
  "source" "attendance_source" DEFAULT 'marked' NOT NULL,
  "marked_by" text REFERENCES "user"("id") ON DELETE SET NULL,
  "note" text,
  "created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  "updated_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. QUESTIONS & TESTS
CREATE TABLE IF NOT EXISTS "case_groups" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "passage" text NOT NULL,
  "image_key" text,
  "created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  "updated_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS "questions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "subject_id" uuid NOT NULL REFERENCES "subjects"("id") ON DELETE CASCADE,
  "chapter_id" uuid REFERENCES "chapters"("id") ON DELETE SET NULL,
  "class_level" smallint NOT NULL,
  "type" "question_type" DEFAULT 'mcq_single' NOT NULL,
  "stem" text NOT NULL,
  "image_key" text,
  "options" jsonb,
  "correct" jsonb NOT NULL,
  "solution" text,
  "difficulty" "question_difficulty" DEFAULT 'medium' NOT NULL,
  "marks" numeric(5, 2) DEFAULT 1.00 NOT NULL,
  "negative_marks" numeric(5, 2) DEFAULT 0.00 NOT NULL,
  "tags" text[] DEFAULT ARRAY[]::text[] NOT NULL,
  "source" text,
  "competency" text,
  "case_group_id" uuid REFERENCES "case_groups"("id") ON DELETE SET NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "created_by" text REFERENCES "user"("id") ON DELETE SET NULL,
  "created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  "updated_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS "tests" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "title" text NOT NULL,
  "batch_id" uuid REFERENCES "batches"("id") ON DELETE CASCADE,
  "subject_id" uuid NOT NULL REFERENCES "subjects"("id") ON DELETE CASCADE,
  "chapter_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "kind" "test_kind" DEFAULT 'chapter_test' NOT NULL,
  "duration_minutes" integer NOT NULL,
  "total_marks" numeric(6, 2) DEFAULT 0.00 NOT NULL,
  "starts_at" timestamp with time zone,
  "ends_at" timestamp with time zone,
  "attempts_allowed" integer DEFAULT 1 NOT NULL,
  "shuffle_questions" boolean DEFAULT false NOT NULL,
  "shuffle_options" boolean DEFAULT false NOT NULL,
  "show_solutions" "test_show_solutions" DEFAULT 'after_submit' NOT NULL,
  "status" "test_status" DEFAULT 'draft' NOT NULL,
  "created_by" text REFERENCES "user"("id") ON DELETE SET NULL,
  "created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  "updated_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS "test_questions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "test_id" uuid NOT NULL REFERENCES "tests"("id") ON DELETE CASCADE,
  "question_id" uuid NOT NULL REFERENCES "questions"("id") ON DELETE CASCADE,
  "position" integer NOT NULL,
  "marks_override" numeric(5, 2),
  "created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT "uq_test_questions_test_question" UNIQUE ("test_id", "question_id")
);

CREATE TABLE IF NOT EXISTS "test_attempts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "test_id" uuid NOT NULL REFERENCES "tests"("id") ON DELETE CASCADE,
  "student_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "started_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  "deadline_at" timestamp with time zone NOT NULL,
  "submitted_at" timestamp with time zone,
  "status" "attempt_status" DEFAULT 'in_progress' NOT NULL,
  "score" numeric(6, 2) DEFAULT 0.00 NOT NULL,
  "correct" integer DEFAULT 0 NOT NULL,
  "wrong" integer DEFAULT 0 NOT NULL,
  "skipped" integer DEFAULT 0 NOT NULL,
  "time_spent_seconds" integer DEFAULT 0 NOT NULL,
  "rank" integer,
  "created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  "updated_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS "test_attempt_answers" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "attempt_id" uuid NOT NULL REFERENCES "test_attempts"("id") ON DELETE CASCADE,
  "question_id" uuid NOT NULL REFERENCES "questions"("id") ON DELETE CASCADE,
  "selected_option_ids" text[],
  "numeric_response" text,
  "is_correct" boolean,
  "marks_awarded" numeric(5, 2) DEFAULT 0.00 NOT NULL,
  "time_spent_seconds" integer DEFAULT 0 NOT NULL,
  "answered_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT "uq_test_attempt_answers_attempt_q" UNIQUE ("attempt_id", "question_id")
);

-- 10. ENROLLMENTS & FEES
CREATE TABLE IF NOT EXISTS "batch_fee_plans" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "batch_id" uuid NOT NULL REFERENCES "batches"("id") ON DELETE CASCADE,
  "name" text NOT NULL,
  "total_paise" bigint NOT NULL,
  "original_paise" bigint,
  "instalments" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  "updated_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS "enrollments" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "batch_id" uuid NOT NULL REFERENCES "batches"("id") ON DELETE RESTRICT,
  "student_id" text NOT NULL REFERENCES "user"("id") ON DELETE RESTRICT,
  "fee_plan_id" uuid REFERENCES "batch_fee_plans"("id") ON DELETE RESTRICT,
  "status" "enrollment_status" DEFAULT 'active' NOT NULL,
  "source" text DEFAULT 'online' NOT NULL,
  "enrolled_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  "created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  "updated_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT "uq_enrollments_batch_student" UNIQUE ("batch_id", "student_id")
);

CREATE TABLE IF NOT EXISTS "fee_dues" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "enrollment_id" uuid NOT NULL REFERENCES "enrollments"("id") ON DELETE CASCADE,
  "label" text NOT NULL,
  "amount_paise" bigint NOT NULL,
  "due_date" date NOT NULL,
  "status" "due_status" DEFAULT 'due' NOT NULL,
  "payment_id" uuid,
  "created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  "updated_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS "payments" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "student_id" text NOT NULL REFERENCES "user"("id") ON DELETE RESTRICT,
  "enrollment_id" uuid REFERENCES "enrollments"("id") ON DELETE SET NULL,
  "fee_due_id" uuid REFERENCES "fee_dues"("id") ON DELETE SET NULL,
  "method" "payment_method" NOT NULL,
  "amount_paise" bigint NOT NULL,
  "receipt_no" text NOT NULL UNIQUE,
  "notes" text,
  "status" "payment_status" DEFAULT 'paid' NOT NULL,
  "paid_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  "created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  "updated_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 11. ANNOUNCEMENTS & ENQUIRIES
CREATE TABLE IF NOT EXISTS "announcements" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "title" text NOT NULL,
  "body" text NOT NULL,
  "audience" "audience" DEFAULT 'public' NOT NULL,
  "batch_id" uuid REFERENCES "batches"("id") ON DELETE CASCADE,
  "is_pinned" boolean DEFAULT false NOT NULL,
  "is_urgent" boolean DEFAULT false NOT NULL,
  "author_name" text DEFAULT 'Dinesh Singh Rajput' NOT NULL,
  "created_by" text REFERENCES "user"("id") ON DELETE SET NULL,
  "created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  "updated_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS "announcement_reads" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "announcement_id" uuid NOT NULL REFERENCES "announcements"("id") ON DELETE CASCADE,
  "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "read_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT "uq_announcement_reads_user" UNIQUE ("announcement_id", "user_id")
);

CREATE TABLE IF NOT EXISTS "enquiries" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" text NOT NULL,
  "phone" text NOT NULL,
  "class_level" smallint,
  "board" "board",
  "message" text,
  "source_path" text,
  "status" "enquiry_status" DEFAULT 'new' NOT NULL,
  "notes" text,
  "created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  "updated_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

SELECT 'Quick2Learn Admin Portal schema ready!' AS status;
