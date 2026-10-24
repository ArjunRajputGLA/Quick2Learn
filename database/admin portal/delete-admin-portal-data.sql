-- ==============================================================================
-- Quick2Learn - Delete All Admin Portal Dummy Data
-- File: delete-admin-portal-data.sql
-- Description: Safely deletes and wipes all Admin Portal operational data,
--              dummy students, test enrollments, batches, lectures, resources,
--              questions, tests, payments, fee dues, live sessions, attendance,
--              announcements, enquiries, join requests, results, and testimonials
--              while strictly preserving database schemas, enum types, and the
--              real administrator account (dinesh@quick2learn.in).
-- ==============================================================================

BEGIN;

-- Disable constraint triggers temporarily for clean cascade truncation
SET CONSTRAINTS ALL DEFERRED;

DO $$
DECLARE
  tbl_name TEXT;
  target_tables TEXT[] := ARRAY[
    -- 1. Tests, Quizzes & Questions
    'test_attempt_answers',
    'test_attempts',
    'test_questions',
    'tests',
    'questions',
    'case_groups',

    -- 2. Live Sessions & Attendance Records
    'live_join_events',
    'live_session_attendance',
    'live_sessions',
    'attendance_records',

    -- 3. Content Items, Progress & Lectures
    'content_progress',
    'content_items',
    'batch_chapter_links',
    'batch_timetable_slots',
    'batch_join_requests',
    'lecture_views',
    'youtube_videos',
    'youtube_playlists',
    'sync_runs',

    -- 4. Study Materials, PDFs & Downloads
    'resource_downloads',
    'resources',

    -- 5. Announcements & Reads
    'announcement_reads',
    'announcements',

    -- 6. Fees, Dues, Payments & Enrollments
    'payments',
    'fee_dues',
    'enrollments',
    'batch_fee_plans',
    'enquiries',

    -- 7. Batches (Central Table)
    'batches',

    -- 8. Doubts & Student Queries
    'doubt_replies',
    'doubts',

    -- 9. Website Content & Board Results
    'results',
    'testimonials'
  ];
  cleared_count INT := 0;
BEGIN
  FOREACH tbl_name IN ARRAY target_tables LOOP
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = tbl_name) THEN
      EXECUTE format('TRUNCATE TABLE %I CASCADE', tbl_name);
      cleared_count := cleared_count + 1;
    END IF;
  END LOOP;
  
  -- 10. Clean up dummy student test sessions
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'session') THEN
    DELETE FROM "session" 
    WHERE "user_id" LIKE 'user-stud-%' 
       OR "user_id" LIKE 'student_test_%'
       OR "user_id" IN ('user-dinesh-admin', 'user-namita-faculty');
  END IF;

  -- 11. Clean up dummy student profiles (preserves real admin profile)
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles') THEN
    DELETE FROM "profiles" 
    WHERE "role" = 'student' 
       OR "user_id" LIKE 'user-stud-%' 
       OR "user_id" LIKE 'student_test_%'
       OR "user_id" IN ('user-dinesh-admin', 'user-namita-faculty');
  END IF;

  -- 12. Clean up dummy user accounts (preserves real admin account)
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user') THEN
    DELETE FROM "user" 
    WHERE "id" LIKE 'user-stud-%' 
       OR "id" LIKE 'student_test_%'
       OR "id" IN ('user-dinesh-admin', 'user-namita-faculty');
  END IF;

  RAISE NOTICE 'Truncated % operational tables and removed dummy student profiles.', cleared_count;
END $$;

COMMIT;

-- Verification Report
DO $$
DECLARE
  v_batches INT := 0;
  v_content INT := 0;
  v_tests INT := 0;
  v_questions INT := 0;
  v_enrollments INT := 0;
  v_enquiries INT := 0;
  v_students INT := 0;
  v_payments INT := 0;
  v_results INT := 0;
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'batches') THEN
    SELECT COUNT(*) INTO v_batches FROM batches;
  END IF;
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'content_items') THEN
    SELECT COUNT(*) INTO v_content FROM content_items;
  END IF;
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'tests') THEN
    SELECT COUNT(*) INTO v_tests FROM tests;
  END IF;
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'questions') THEN
    SELECT COUNT(*) INTO v_questions FROM questions;
  END IF;
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'enrollments') THEN
    SELECT COUNT(*) INTO v_enrollments FROM enrollments;
  END IF;
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'enquiries') THEN
    SELECT COUNT(*) INTO v_enquiries FROM enquiries;
  END IF;
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles') THEN
    SELECT COUNT(*) INTO v_students FROM profiles WHERE role = 'student';
  END IF;
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'payments') THEN
    SELECT COUNT(*) INTO v_payments FROM payments;
  END IF;
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'results') THEN
    SELECT COUNT(*) INTO v_results FROM results;
  END IF;

  RAISE NOTICE '==================================================';
  RAISE NOTICE 'Quick2Learn Admin Portal Dummy Data Clean Report:';
  RAISE NOTICE '  - Batches remaining: %', v_batches;
  RAISE NOTICE '  - Content items remaining: %', v_content;
  RAISE NOTICE '  - Tests remaining: %', v_tests;
  RAISE NOTICE '  - Questions remaining: %', v_questions;
  RAISE NOTICE '  - Student directory remaining: %', v_students;
  RAISE NOTICE '  - Enrollments remaining: %', v_enrollments;
  RAISE NOTICE '  - Payments remaining: %', v_payments;
  RAISE NOTICE '  - Enquiries remaining: %', v_enquiries;
  RAISE NOTICE '  - Results (Hall of Fame) remaining: %', v_results;
  RAISE NOTICE 'All Admin Portal dummy data successfully deleted!';
  RAISE NOTICE '==================================================';
END $$;
