-- ==============================================================================
-- Quick2Learn - Seed Admin Portal Data
-- File: seed-admin-portal-data.sql
-- Description: Inserts realistic institute seed data for Dinesh Sir's
--              Quick2Learn Admin Portal (Batches, Timetables, Faculty,
--              Lectures, Study Materials, Questions, Tests, Attendance,
--              Announcements, Enquiries, Join Requests, Payments & Dues).
-- ==============================================================================

BEGIN;

-- 1. BASE SYSTEM USERS
INSERT INTO "user" ("id", "name", "email", "email_verified", "phone_number", "phone_number_verified")
VALUES
  ('user-dinesh-admin', 'Dinesh Singh Rajput', 'dinesh.admin.portal@quick2learn.in', true, '+919412278910', true),
  ('user-namita-faculty', 'Namita Singh Rajput', 'namita.faculty.portal@quick2learn.in', true, '+919876543201', true),
  ('user-stud-aarav', 'Aarav Sharma', 'aarav.stud.portal@quick2learn.in', true, '+919876543210', true),
  ('user-stud-arjun', 'Arjun Singh Rajput', 'arjun.stud.portal@quick2learn.in', true, '+919876543211', true),
  ('user-stud-ananya', 'Ananya Gupta', 'ananya.stud.portal@quick2learn.in', true, '+919876543212', true),
  ('user-stud-ayush', 'Ayush Agarwal', 'ayush.stud.portal@quick2learn.in', true, '+919876543299', true),
  ('user-stud-kabir', 'Kabir Sen', 'kabir.stud.portal@quick2learn.in', true, '+919876543555', true)
ON CONFLICT ("email") DO UPDATE SET "name" = EXCLUDED."name";

-- 2. USER PROFILES
INSERT INTO "profiles" ("id", "user_id", "full_name", "phone", "role", "class_level", "board", "school")
VALUES
  ('11111111-0000-0000-0000-000000000001', 'user-dinesh-admin', 'Dinesh Singh Rajput', '+919412278910', 'admin', 12, 'cbse', 'Quick2Learn Institute'),
  ('11111111-0000-0000-0000-000000000002', 'user-namita-faculty', 'Namita Singh Rajput', '+919876543201', 'teacher', 10, 'icse', 'Quick2Learn Institute'),
  ('11111111-0000-0000-0000-000000000003', 'user-stud-aarav', 'Aarav Sharma', '+919876543210', 'student', 9, 'icse', 'St. Joseph Academy'),
  ('11111111-0000-0000-0000-000000000004', 'user-stud-arjun', 'Arjun Singh Rajput', '+919876543211', 'student', 10, 'cbse', 'Delhi Public School'),
  ('11111111-0000-0000-0000-000000000005', 'user-stud-ananya', 'Ananya Gupta', '+919876543212', 'student', 12, 'cbse', 'Modern School'),
  ('11111111-0000-0000-0000-000000000006', 'user-stud-ayush', 'Ayush Agarwal', '+919876543299', 'student', 12, 'cbse', 'Kendriya Vidyalaya'),
  ('11111111-0000-0000-0000-000000000007', 'user-stud-kabir', 'Kabir Sen', '+919876543555', 'student', 10, 'cbse', 'Ryan International')
ON CONFLICT ("user_id") DO UPDATE SET "full_name" = EXCLUDED."full_name";

-- 3. SUBJECTS
INSERT INTO "subjects" ("id", "slug", "name", "sort_order")
VALUES
  ('a0000000-0000-0000-0000-000000000001', 'mathematics', 'Mathematics', 1),
  ('a0000000-0000-0000-0000-000000000002', 'physics', 'Physics', 2),
  ('a0000000-0000-0000-0000-000000000003', 'chemistry', 'Chemistry', 3),
  ('a0000000-0000-0000-0000-000000000004', 'biology', 'Biology', 4)
ON CONFLICT ("slug") DO UPDATE SET "name" = EXCLUDED."name";

-- 4. FACULTY
INSERT INTO "faculty" ("id", "profile_id", "name", "slug", "designation", "bio", "sort_order", "is_published")
VALUES
  (
    'f0000000-0000-0000-0000-000000000001',
    'user-dinesh-admin',
    'Dinesh Singh Rajput',
    'dinesh-singh-rajput',
    'Founder & Senior Faculty (Mathematics)',
    '15+ years experience in CBSE & ICSE Mathematics. Mentor to hundreds of 100/100 scorers.',
    1,
    true
  ),
  (
    'f0000000-0000-0000-0000-000000000002',
    'user-namita-faculty',
    'Namita Singh Rajput',
    'namita-singh-rajput',
    'Senior Faculty (Chemistry & Biology)',
    'Expert ICSE/CBSE Science educator specializing in conceptual chemistry and diagrammatic biology.',
    2,
    true
  )
ON CONFLICT ("slug") DO UPDATE SET "name" = EXCLUDED."name";

-- 5. CHAPTERS
INSERT INTO "chapters" ("id", "subject_id", "class_level", "board", "number", "title", "slug", "sort_order")
VALUES
  ('44444444-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 9, 'icse', 1, 'Pure Arithmetic & Rational Numbers', 'class-9-icse-maths-ch1', 1),
  ('44444444-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 9, 'icse', 2, 'Compound Interest', 'class-9-icse-maths-ch2', 2),
  ('44444444-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 9, 'icse', 4, 'Expansions (Selina)', 'class-9-icse-maths-ch4', 4),
  ('44444444-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000003', 9, 'icse', 2, 'Chemical Changes & Reactions', 'class-9-icse-chem-ch2', 2),
  ('44444444-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 10, 'cbse', 2, 'Polynomials', 'class-10-cbse-maths-ch2', 2),
  ('44444444-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000001', 10, 'cbse', 4, 'Quadratic Equations', 'class-10-cbse-maths-ch4', 4),
  ('44444444-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000001', 12, 'cbse', 1, 'Relations and Functions', 'class-12-cbse-maths-ch1', 1),
  ('44444444-0000-0000-0000-000000000008', 'a0000000-0000-0000-0000-000000000001', 12, 'cbse', 7, 'Integrals & Calculus', 'class-12-cbse-maths-ch7', 7)
ON CONFLICT ("id") DO NOTHING;

-- 6. BATCHES
INSERT INTO "batches" (
  "id", "slug", "title", "subtitle", "description",
  "class_level", "board", "subject_id", "faculty_id",
  "mode", "schedule_text", "location_text", "start_date", "end_date",
  "seats_total", "status", "join_code", "is_featured", "academic_year"
)
VALUES
  (
    '55555555-0000-0000-0000-000000000001',
    'ix-icse-maths-sci-2026',
    'IX ICSE ( 2026 - 2027 )',
    'Comprehensive Selina Mathematics & Science',
    'Targeted ICSE Class 9 preparation by Dinesh Sir & Namita Maam with Selina exercise walkthroughs.',
    9,
    'icse',
    'a0000000-0000-0000-0000-000000000001',
    'f0000000-0000-0000-0000-000000000001',
    'online',
    'Mon, Wed, Fri 08:00 PM - 09:00 PM',
    'Online Live / Hall 2',
    '2026-04-22 00:00:00+00',
    '2027-02-28 00:00:00+00',
    40,
    'open',
    'iiwbpg',
    true,
    '2026-2027'
  ),
  (
    '55555555-0000-0000-0000-000000000002',
    'class-x-cbse-board-excellence',
    'Class X CBSE Board Excellence',
    'Mathematics & Science Target 100/100',
    'NCERT Exemplar, Board PYQs, weekly Sunday mock exams and dedicated doubt resolutions.',
    10,
    'cbse',
    'a0000000-0000-0000-0000-000000000001',
    'f0000000-0000-0000-0000-000000000001',
    'online',
    'Tue, Thu, Sat 06:30 PM - 08:00 PM',
    'Online Live / Hall 1',
    '2026-04-01 00:00:00+00',
    '2027-02-28 00:00:00+00',
    35,
    'open',
    'M10CBS',
    true,
    '2026-2027'
  ),
  (
    '55555555-0000-0000-0000-000000000003',
    'class-xi-cbse-foundation',
    'Class XI CBSE Foundation & Calculus',
    'Foundation, Coordinate Geometry & Pre-Calculus',
    'Build strong mathematical foundation bridging Class 10 to 11 with rigorous concept drilling.',
    11,
    'cbse',
    'a0000000-0000-0000-0000-000000000001',
    'f0000000-0000-0000-0000-000000000001',
    'online',
    'Mon, Wed, Fri 04:00 PM - 05:30 PM',
    'Online Live',
    '2026-04-15 00:00:00+00',
    '2027-02-20 00:00:00+00',
    30,
    'open',
    'M11CBS',
    false,
    '2026-2027'
  ),
  (
    '55555555-0000-0000-0000-000000000004',
    'class-xii-cbse-maths-target-100',
    'Class XII CBSE Maths Target 100',
    'Complete Calculus, Vectors & 3D Geometry',
    'The premier Class 12 CBSE board preparation program by Dinesh Singh Rajput.',
    12,
    'cbse',
    'a0000000-0000-0000-0000-000000000001',
    'f0000000-0000-0000-0000-000000000001',
    'online',
    'Mon, Wed, Fri 05:00 PM - 06:30 PM',
    'Hall 1 & Live Broadcast',
    '2026-04-10 00:00:00+00',
    '2027-02-28 00:00:00+00',
    35,
    'open',
    'M12MTH',
    true,
    '2026-2027'
  )
ON CONFLICT ("slug") DO UPDATE SET "title" = EXCLUDED."title";

-- 7. BATCH TIMETABLE SLOTS
INSERT INTO "batch_timetable_slots" ("id", "batch_id", "weekday", "start_time", "end_time", "subject_id", "mode", "room_or_link_note")
VALUES
  ('66666666-0000-0000-0000-000000000001', '55555555-0000-0000-0000-000000000001', 1, '20:00', '21:00', 'a0000000-0000-0000-0000-000000000001', 'online', 'Mathematics - Dinesh Sir'),
  ('66666666-0000-0000-0000-000000000002', '55555555-0000-0000-0000-000000000001', 3, '20:00', '21:00', 'a0000000-0000-0000-0000-000000000001', 'online', 'Mathematics - Dinesh Sir'),
  ('66666666-0000-0000-0000-000000000003', '55555555-0000-0000-0000-000000000001', 2, '19:00', '20:00', 'a0000000-0000-0000-0000-000000000003', 'online', 'Chemistry - Namita Maam'),
  ('66666666-0000-0000-0000-000000000004', '55555555-0000-0000-0000-000000000001', 4, '19:00', '20:00', 'a0000000-0000-0000-0000-000000000004', 'online', 'Biology - Namita Maam'),
  ('66666666-0000-0000-0000-000000000005', '55555555-0000-0000-0000-000000000002', 2, '18:30', '20:00', 'a0000000-0000-0000-0000-000000000001', 'online', 'Maths Board Booster'),
  ('66666666-0000-0000-0000-000000000006', '55555555-0000-0000-0000-000000000004', 1, '17:00', '18:30', 'a0000000-0000-0000-0000-000000000001', 'online', 'Calculus Masterclass')
ON CONFLICT ("id") DO NOTHING;

-- 8. CONTENT ITEMS (LECTURES & VIDEOS)
INSERT INTO "content_items" (
  "id", "batch_id", "subject_id", "chapter_id", "section", "title",
  "kind", "youtube_video_id", "sort_order", "is_published"
)
VALUES
  (
    '77777777-0000-0000-0000-000000000001',
    '55555555-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000003',
    '44444444-0000-0000-0000-000000000004',
    'CHEMISTRY SELINA SOLUTIONS',
    'LECTURE-7: EX 2(C) CHEMICAL CHANGES & REACTIONS',
    'youtube',
    'W3s-p-c5q2Q',
    7,
    true
  ),
  (
    '77777777-0000-0000-0000-000000000002',
    '55555555-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    '44444444-0000-0000-0000-000000000003',
    'MATHEMATICS SELINA SOLUTIONS',
    'LECTURE-1: EX 4(A) EXPANSIONS SPECIAL FORMULAE',
    'youtube',
    'b8i_6c1J2e0',
    1,
    true
  ),
  (
    '77777777-0000-0000-0000-000000000003',
    '55555555-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000001',
    '44444444-0000-0000-0000-000000000006',
    'CLASS 10 BOARD MATHEMATICS',
    'QUADRATIC EQUATIONS: DISCRIMINANT & NATURE OF ROOTS',
    'youtube',
    'M7lc1UVf-VE',
    1,
    true
  ),
  (
    '77777777-0000-0000-0000-000000000004',
    '55555555-0000-0000-0000-000000000004',
    'a0000000-0000-0000-0000-000000000001',
    '44444444-0000-0000-0000-000000000008',
    'CLASS 12 CALCULUS TARGET 100',
    'DEFINITE INTEGRALS PROPERTIES & BOARD PYQS MASTERCLASS',
    'youtube',
    'dQw4w9WgXcQ',
    1,
    true
  )
ON CONFLICT ("id") DO NOTHING;

-- 9. STUDY RESOURCES & PDFS
INSERT INTO "resources" (
  "id", "title", "type", "storage_key", "storage_bucket", "visibility", "chapter_id", "batch_id", "created_by"
)
VALUES
  (
    '88888888-0000-0000-0000-000000000001',
    'EX 2(C) SOLUTIONS.pdf',
    'worksheet',
    'resources/icse-9-che-ex2c.pdf',
    'public',
    'enrolled',
    '44444444-0000-0000-0000-000000000004',
    '55555555-0000-0000-0000-000000000001',
    'user-dinesh-admin'
  ),
  (
    '88888888-0000-0000-0000-000000000002',
    'CHAPTER 2 - CELL: THE UNIT OF LIFE.pdf',
    'notes',
    'resources/icse-9-bio-ch2.pdf',
    'public',
    'enrolled',
    NULL,
    '55555555-0000-0000-0000-000000000001',
    'user-namita-faculty'
  ),
  (
    '88888888-0000-0000-0000-000000000003',
    'Class XII Maths - Relations & Functions Complete Chapter Notes',
    'notes',
    'resources/maths-12-ch1-notes.pdf',
    'public',
    'public',
    '44444444-0000-0000-0000-000000000007',
    '55555555-0000-0000-0000-000000000004',
    'user-dinesh-admin'
  ),
  (
    '88888888-0000-0000-0000-000000000004',
    'DPP 01: Equivalence Relations & Board Question Practice',
    'worksheet',
    'resources/dpp-maths-12-01.pdf',
    'public',
    'enrolled',
    '44444444-0000-0000-0000-000000000007',
    '55555555-0000-0000-0000-000000000004',
    'user-dinesh-admin'
  ),
  (
    '88888888-0000-0000-0000-000000000005',
    'Calculus & Algebra Master Formula Sheet (Dinesh Sir Exclusive)',
    'formula_sheet',
    'resources/maths-12-formula-sheet.pdf',
    'public',
    'public',
    NULL,
    '55555555-0000-0000-0000-000000000004',
    'user-dinesh-admin'
  )
ON CONFLICT ("id") DO NOTHING;

-- 10. QUESTIONS & QUESTION BANK
INSERT INTO "questions" (
  "id", "subject_id", "chapter_id", "class_level", "type", "stem",
  "options", "correct", "solution", "difficulty", "marks", "negative_marks"
)
VALUES
  (
    '99999999-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    '44444444-0000-0000-0000-000000000006',
    10,
    'mcq_single',
    'If the quadratic equation 2x^2 - kx + 8 = 0 has equal real roots, find the value of k.',
    '[{"id":"opt-a","text":"±4"},{"id":"opt-b","text":"±8"},{"id":"opt-c","text":"±6"},{"id":"opt-d","text":"±12"}]'::jsonb,
    '"opt-b"'::jsonb,
    'For equal roots, Discriminant D = b^2 - 4ac = 0. Here (-k)^2 - 4(2)(8) = 0 => k^2 = 64 => k = ±8.',
    'medium',
    1.00,
    0.00
  ),
  (
    '99999999-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000001',
    '44444444-0000-0000-0000-000000000005',
    10,
    'mcq_single',
    'If one zero of the quadratic polynomial x^2 + 3x + k is 2, then the value of k is:',
    '[{"id":"opt-a","text":"10"},{"id":"opt-b","text":"-10"},{"id":"opt-c","text":"-7"},{"id":"opt-d","text":"-2"}]'::jsonb,
    '"opt-b"'::jsonb,
    'Since 2 is a zero, (2)^2 + 3(2) + k = 0 => 4 + 6 + k = 0 => k = -10.',
    'easy',
    1.00,
    0.00
  ),
  (
    '99999999-0000-0000-0000-000000000003',
    'a0000000-0000-0000-0000-000000000001',
    '44444444-0000-0000-0000-000000000007',
    12,
    'mcq_single',
    'Let R be the relation in the set N given by R = {(a, b) : a = b - 2, b > 6}. Choose the correct answer:',
    '[{"id":"opt-a","text":"(2, 4) ∈ R"},{"id":"opt-b","text":"(3, 8) ∈ R"},{"id":"opt-c","text":"(6, 8) ∈ R"},{"id":"opt-d","text":"(8, 7) ∈ R"}]'::jsonb,
    '"opt-c"'::jsonb,
    'Since b > 6 and a = b - 2, if b = 8 then a = 6, so (6, 8) ∈ R.',
    'easy',
    1.00,
    0.00
  )
ON CONFLICT ("id") DO NOTHING;

-- 11. TESTS
INSERT INTO "tests" (
  "id", "title", "batch_id", "subject_id", "kind", "duration_minutes",
  "total_marks", "status", "starts_at", "ends_at"
)
VALUES
  (
    'aaaaaaaa-0000-0000-0000-000000000001',
    'Quadratic Equations & Polynomials Test',
    '55555555-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000001',
    'chapter_test',
    60,
    40.00,
    'scheduled',
    timezone('utc'::text, now()) + interval '1 day',
    timezone('utc'::text, now()) + interval '1 day 2 hours'
  ),
  (
    'aaaaaaaa-0000-0000-0000-000000000002',
    'Class 9 Selina Expansions Chapter Test',
    '55555555-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'chapter_test',
    45,
    30.00,
    'closed',
    timezone('utc'::text, now()) - interval '3 days',
    timezone('utc'::text, now()) - interval '3 days' + interval '45 minutes'
  )
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "test_questions" ("id", "test_id", "question_id", "position", "marks_override")
VALUES
  ('bbbbbbbb-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', '99999999-0000-0000-0000-000000000001', 1, 2.00),
  ('bbbbbbbb-0000-0000-0000-000000000002', 'aaaaaaaa-0000-0000-0000-000000000001', '99999999-0000-0000-0000-000000000002', 2, 2.00)
ON CONFLICT ("test_id", "question_id") DO NOTHING;

-- 12. LIVE SESSIONS
INSERT INTO "live_sessions" (
  "id", "batch_id", "subject_id", "teacher_id", "title",
  "starts_at", "ends_at", "provider", "join_url", "passcode", "status"
)
VALUES
  (
    'cccccccc-0000-0000-0000-000000000001',
    '55555555-0000-0000-0000-000000000004',
    'a0000000-0000-0000-0000-000000000001',
    'f0000000-0000-0000-0000-000000000001',
    'Dinesh Sir Special: Definite Integrals Properties Masterclass',
    timezone('utc'::text, now()) + interval '2 hours',
    timezone('utc'::text, now()) + interval '3 hours 15 minutes',
    'zoom',
    'https://zoom.us/j/9876543210?pwd=quick2learnmaths',
    'DINESH12',
    'scheduled'
  ),
  (
    'cccccccc-0000-0000-0000-000000000002',
    '55555555-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000003',
    'f0000000-0000-0000-0000-000000000002',
    'Namita Maam: Chemical Reactions Balancing & Redox Live Session',
    timezone('utc'::text, now()) + interval '1 day',
    timezone('utc'::text, now()) + interval '1 day 1 hour',
    'youtube_live',
    'https://youtube.com/live/q2l_redox_demo',
    NULL,
    'scheduled'
  )
ON CONFLICT ("id") DO NOTHING;

-- 13. ATTENDANCE RECORDS
INSERT INTO "attendance_records" ("id", "batch_id", "student_id", "date", "status", "source", "note")
VALUES
  ('dddddddd-0000-0000-0000-000000000001', '55555555-0000-0000-0000-000000000001', 'user-stud-aarav', current_date, 'present', 'marked', 'Attended on time'),
  ('dddddddd-0000-0000-0000-000000000002', '55555555-0000-0000-0000-000000000002', 'user-stud-arjun', current_date, 'present', 'marked', 'Active participation'),
  ('dddddddd-0000-0000-0000-000000000003', '55555555-0000-0000-0000-000000000004', 'user-stud-ananya', current_date, 'present', 'marked', 'Calculus homework checked')
ON CONFLICT ("id") DO NOTHING;

-- 14. ANNOUNCEMENTS
INSERT INTO "announcements" ("id", "title", "body", "audience", "batch_id", "is_pinned", "created_by")
VALUES
  (
    'eeeeeeee-0000-0000-0000-000000000001',
    'Welcome to Quick2Learn Mobile & Web Portal!',
    'Explore your batch timetable, Selina and CBSE solutions, chapter tests, and live class links in one unified portal.',
    'public',
    NULL,
    true,
    'user-dinesh-admin'
  ),
  (
    'eeeeeeee-0000-0000-0000-000000000002',
    'Special Sunday Doubt Session Announced',
    'Dinesh Sir will take a dedicated doubt clearing session this Sunday from 10:00 AM to 12:00 PM for all Class 10 & 12 students.',
    'all_students',
    NULL,
    false,
    'user-dinesh-admin'
  )
ON CONFLICT ("id") DO NOTHING;

-- 15. ENQUIRIES
INSERT INTO "enquiries" ("id", "name", "phone", "class_level", "board", "message", "status")
VALUES
  ('fabc0001-0000-0000-0000-000000000001', 'Vikram Patel', '+91 98765 43222', 10, 'cbse', 'Interested in joining Class 10 Board Excellence batch. What is the fee structure?', 'new'),
  ('fabc0001-0000-0000-0000-000000000002', 'Sunita Reddy', '+91 98765 43333', 9, 'icse', 'Looking for ICSE Maths and Science Selina coaching for my son.', 'contacted')
ON CONFLICT ("id") DO NOTHING;

-- 16. BATCH JOIN REQUESTS
INSERT INTO "batch_join_requests" ("id", "batch_id", "student_id", "status", "note")
VALUES
  ('fabc0002-0000-0000-0000-000000000001', '55555555-0000-0000-0000-000000000004', 'user-stud-ayush', 'pending', 'Wants to attend online calculus problem sessions'),
  ('fabc0002-0000-0000-0000-000000000002', '55555555-0000-0000-0000-000000000002', 'user-stud-kabir', 'pending', 'Board revision & formula practice'),
  ('fabc0002-0000-0000-0000-000000000003', '55555555-0000-0000-0000-000000000001', 'user-stud-aarav', 'approved', 'Joined via code iiwbpg • Fee confirmed')
ON CONFLICT ("id") DO NOTHING;

-- 17. BATCH FEE PLANS, ENROLLMENTS & PAYMENTS
INSERT INTO "batch_fee_plans" ("id", "batch_id", "name", "total_paise", "original_paise", "is_active")
VALUES
  ('fabc0003-0000-0000-0000-000000000001', '55555555-0000-0000-0000-000000000001', 'Full Year Annual Plan', 1600000, 1800000, true),
  ('fabc0003-0000-0000-0000-000000000002', '55555555-0000-0000-0000-000000000002', 'Class 10 Board Plan', 1800000, 2000000, true)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "enrollments" ("id", "batch_id", "student_id", "fee_plan_id", "status", "source")
VALUES
  ('fabc0004-0000-0000-0000-000000000001', '55555555-0000-0000-0000-000000000001', 'user-stud-aarav', 'fabc0003-0000-0000-0000-000000000001', 'active', 'online'),
  ('fabc0004-0000-0000-0000-000000000002', '55555555-0000-0000-0000-000000000002', 'user-stud-arjun', 'fabc0003-0000-0000-0000-000000000002', 'active', 'offline')
ON CONFLICT ("batch_id", "student_id") DO NOTHING;

INSERT INTO "payments" ("id", "student_id", "enrollment_id", "method", "amount_paise", "receipt_no", "status")
VALUES
  ('fabc0005-0000-0000-0000-000000000001', 'user-stud-aarav', 'fabc0004-0000-0000-0000-000000000001', 'upi_offline', 1600000, 'RCPT-2026-001', 'paid'),
  ('fabc0005-0000-0000-0000-000000000002', 'user-stud-arjun', 'fabc0004-0000-0000-0000-000000000002', 'cash', 1800000, 'RCPT-2026-002', 'paid')
ON CONFLICT ("receipt_no") DO NOTHING;

COMMIT;

SELECT 'Quick2Learn Admin Portal data seeded successfully!' AS status;
