# Quick2Learn Project Context

## CONTEXT
Quick2Learn is the coaching platform of Mr. Dinesh Singh Rajput (Mathematics, 25+ years of teaching) in Mathura, Uttar Pradesh. It covers Classes IX–XII, CBSE and ICSE/ISC. Faculty: Dinesh Singh Rajput (Mathematics) and Namita Singh Rajput (ICSE Chemistry and Biology). It is a single institute: no multi-tenancy, ever. YouTube channel: https://www.youtube.com/@Quick2Learn (channel ID UCy1XY9I1Yeyy59Y5LMgqa8g). A student mobile app (Expo) will be built later and must share types and validation with this website.

## STACK
- **Monorepo**: pnpm workspaces + Turborepo
- **Web App (`apps/web`)**: Next.js 16 (App Router), React 19, TypeScript strict, `src/` directory
- **Styling**: Tailwind CSS v4, shadcn/ui (initialized), Lucide React
- **Database & ORM (`packages/db`)**: PostgreSQL 17 (Docker locally; managed or self-hosted in production), Drizzle ORM + drizzle-kit migrations, node-postgres (`pg`) driver
- **Authentication**: Better Auth with Drizzle adapter and PostgreSQL provider (tables: `user`, `session`, `account`, `verification`, `rate_limit`). Note: Better Auth CLI `generate` must be re-run whenever an auth plugin is added.
- **Storage**: S3-compatible object storage (MinIO locally; Cloudflare R2 or AWS S3 in production) via `@aws-sdk/client-s3` and `@aws-sdk/s3-request-presigner`
- **Email**: Nodemailer SMTP (Mailpit locally: SMTP 1025, Web inbox 8025)
- **Data Layer Authorization**: Application data-access layer authorization in `apps/web/src/server/data` and `apps/web/src/server/authz.ts`, replacing database-level RLS
- **Shared Package (`packages/shared`)**: Zod schemas, TypeScript domain types, constants, integer paise money helpers
- **Config Package (`packages/config`)**: Shared tsconfig, ESLint, and Prettier configurations
- **Forms & Validation**: React Hook Form, Zod
- **Notifications**: Sonner
- **Payments**: Razorpay (amounts stored & computed in integer paise)
- **Analytics**: Vercel Analytics (`@vercel/analytics`) tracking core conversion milestones: `signup_completed`, `enquiry_submitted`, `lecture_played`, `checkout_started`, and `payment_succeeded`.
- **Planned Mobile App (`apps/mobile`)**: Expo React Native app sharing types and validation from `packages/shared`. Note: The Expo app will later use `@better-auth/expo` against these same endpoints; add its URL scheme to `trustedOrigins` at that point.

## FOLDER CONVENTIONS
- `apps/web/src/app/(marketing)`: Public marketing and information pages
- `apps/web/src/app/(auth)`: Authentication routes (login, register, onboarding)
- `apps/web/src/app/(student)`: Student learning dashboard and enrolled courses (guarded by `requireOnboardedUser`)
- `apps/web/src/app/admin`: Institute administration control panel (guarded by `requireRole(['admin', 'teacher'])` with 404 response)
- `apps/web/src/components/auth`: Client authentication forms (`LoginForm`, `OnboardingForm`)
- `apps/web/src/components/ui`: Base UI component primitives (shadcn-compatible)
- `apps/web/src/components/layout`: Header (with `AuthNav` logged-in/logged-out states), Footer, navigation shells
- `apps/web/src/components/marketing`: Hero sections, lead forms, faculty highlights
- `apps/web/src/components/learn`: Learning player, notes viewer, assignments
- `apps/web/src/components/batches`: Batch discovery, batch schedule cards
- `apps/web/src/components/student`: Student portal components
- `apps/web/src/components/admin`: Admin batch and lead management components
- `apps/web/src/lib`: Utilities and client libraries (`auth-client.ts`, `env.ts`)
- `apps/web/src/proxy.ts`: Next.js 16 request interception gateway with fast optimistic `getSessionCookie` checks
- `apps/web/src/server`: Server actions, backend services, authorization policies, email, and storage
- `apps/web/src/server/auth`: Better Auth configuration (`auth.ts`) and session helpers (`session.ts`)
- `apps/web/src/server/authz.ts`: Policy and assertion helpers enforcing permission checks
- `apps/web/src/server/data`: Data-access layer modules (`catalog.ts`, `videos.ts`, `batches.ts`, `enrollments.ts`, `payments.ts`, `resources.ts`, `announcements.ts`, `enquiries.ts`, `settings.ts`). Nothing outside `apps/web/src/server` imports `packages/db`.
- `apps/web/src/server/profile-actions.ts`: Safe profile updates with strict whitelist and audit-logged admin role promotion
- `apps/web/src/server/storage.ts`: S3/MinIO operations (`publicUrl`, `presignedGet`, `presignedPut`, `deleteObject`)
- `apps/web/src/server/email.ts`: Nodemailer SMTP email service (`sendEmail`)
- `apps/web/src/styles`: Global stylesheet (`globals.css`) with Tailwind CSS v4 tokens
- `packages/db`: Server-only package with Drizzle schema, client, migrations, and seed scripts
- `packages/db/src/schema`: Enums (`enums.ts`), Better Auth (`auth.ts`), domain tables (`schema.ts`), and custom types (`custom-types.ts`)
- `packages/shared/src`: Shared constants, domain types, zod schemas, and money utilities

## RULES
- TypeScript strict. No `any`. Every server action validates its input with zod.
- Server Components by default; "use client" only where interaction needs it.
- Money is stored and computed as integer paise and only formatted at display time.
- Timestamps are stored as timestamptz (UTC) and shown in Asia/Kolkata.
- Light theme only. No dark mode.
- Secrets and connection strings never reach the browser.
- Design reference is coursera.org for layout patterns only. Never use Coursera's name, logo, images, illustrations or copy.
- All database access goes through `apps/web/src/server/data`, and authorization is checked there, because the database has no RLS.
- Multi-row writes that must succeed together run inside `db.transaction()`.
- Files live in S3-compatible storage; the database stores keys, never full URLs.
- The future Expo app calls this website's API routes; it never connects to Postgres directly.
- The future Expo app will later use `@better-auth/expo` against these same auth endpoints; add its URL scheme to `trustedOrigins` in `auth.ts` at that point.

## Build log
- 2026-10-08: Monorepo initialized with Turborepo + pnpm; Next.js 16 + React 19 app with Tailwind v4, shadcn/ui, Supabase clients & proxy.ts session refresh, shared types & schemas, and coming-soon homepage.
- 2026-10-08: Design system completed with Tailwind v4 @theme tokens, Inter + Noto Sans Devanagari typography scale, KaTeX MathText server rendering, 17 base UI components, Coursera-inspired composite components (LectureCard, BatchCard, CardCarousel, ChipRow, StatCard, TestimonialCard, SectionHeader, EmptyState, SearchBar), and /dev/ui showcase page (404 in production).
- 2026-10-08: Full Supabase database schema implemented with 21 tables, 12 enums, GIN full-text search, storage buckets (public-media, resources-public, resources-private), rigorous RLS policies on all tables, automated SQL/Node RLS test suite, seed data for CBSE Math chapters & faculty & batches, and pnpm db:reset & db:types.
- 2026-10-08: Ported entire stack from Supabase to PostgreSQL 17 + Drizzle ORM + Better Auth + S3/MinIO + Nodemailer/Mailpit. Removed all Supabase libraries, configs, and migrations. Schema fully ported with exact column parity across 13 enums (`user_role`, `board`, `batch_mode`, `batch_status`, `enrollment_status`, `due_status`, `payment_status`, `payment_method`, `resource_type`, `visibility`, `audience`, `enquiry_status`, `storage_bucket`) and 25 tables (`user`, `session`, `account`, `verification`, `profiles`, `subjects`, `chapters`, `faculty`, `batches`, `batch_faculty`, `batch_fee_plans`, `enrollments`, `fee_dues`, `payments`, `resources`, `announcements`, `enquiries`, `youtube_videos`, `lecture_views`, `testimonials`, `student_results`, `site_settings`, `audit_log`, `batch_resources`, `announcement_batches`). Data-access layer authorization and policy helpers in apps/web/src/server/data and apps/web/src/server/authz.ts verified with 4/4 passing parity tests.
- 2026-10-08: Prompt 4 completed: Better Auth authentication system with Google OAuth, Email OTP (with Mailpit, 5-minute expiry, 3-attempt limit), database rate-limiting table (`rate_limit`), session cookie caching, and `databaseHooks.user.create.after` profile provisioning. Built `/login`, `/onboarding`, `/dashboard`, server session helpers (`getSession`, `getCurrentUser`, `requireUser`, `requireRole`, `requireOnboardedUser`), optimistic cookie route protection in `proxy.ts`, 404 security guard in `apps/web/src/app/admin/layout.tsx`, whitelist-only profile updates in `profile-actions.ts`, audit-logged role promotion, CLI `pnpm admin:promote <email>` script, and responsive Header auth navigation with avatar dropdown menu. All 9 tests passed.
- 2026-10-08: Prompt 5 completed: Coursera-modelled shared public layout in `app/(marketing)/layout.tsx` featuring: (1) Dismissible announcement bar from `site_settings.announcement_bar` with try/catch-wrapped localStorage persistence; (2) Sticky header with Quick2Learn text wordmark, Explore button opening a 4-column mega-menu (Classes IX–XII built from `subjects` and `chapters` tables with links to `/learn/[class]/[subject]` and side panel for lectures, batches, results), pill-shaped search input with 250ms debounced full-text typeahead using `websearch_to_tsquery('simple', q)` ranked by `ts_rank` (< 25ms locally) linking on Enter to `/search?q=...`, desktop quick links & auth state, and mobile drawer Sheet with accordions & search overlay; (3) Comprehensive footer with Classes, Subjects, Institute info, Help/legal links, contact block, official YouTube & socials, two 'App coming soon' badges, and copyright line; (4) Floating WhatsApp button at bottom-right linking to `wa.me` with prefilled batch inquiry; (5) Global `not-found.tsx` and `error.tsx` using `EmptyState` with navigation fallbacks; (6) Seeded 44 chapters across classes IX–XII and 6 YouTube lectures in PostgreSQL. All 14 tests passing.
- 2026-10-08: Prompt 6 completed: Built safe enrol-and-pay flow with Razorpay. (1) `/checkout/[batchSlug]` with full/instalments plan selector, live dues schedule, pre-filled editable profile, mandatory Terms checkbox, and Razorpay modal integration; (2) Server Action `createOrder` inside `db.transaction()` locking batch `FOR UPDATE`, checking 30-min seat reservations, computing amounts in server-side paise, and creating/reusing idempotent Razorpay orders; (3) `markPaymentPaid` shared transaction locking payments row `FOR UPDATE`, activating enrollments, marking dues paid, and assigning sequence receipt `Q2L-YYYY-XXXXXX`; (4) Constant-time HMAC-SHA256 verification in `/api/payments/verify` with redirect to `/dashboard/payments/[id]`; (5) `/api/webhooks/razorpay` with `X-Razorpay-Signature` verification, replay-safe deduplication via `ON CONFLICT (event_id) DO NOTHING`, handling `payment.captured`, `order.paid`, `payment.failed`, `refund.processed`; (6) Later instalments "Pay ₹X" button; (7) Admin offline payment recording (`recordOfflinePayment`) with audit log; (8) Daily housekeeping cron `/api/cron/payment-housekeeping` failing 24h expired created payments and abandoned enrollments. Full unit & integration test suite with 12 tests passed.
- 2026-10-08: Prompt 7 completed (SEO, Mobile Performance, Accessibility & Conversion Analytics): (1) Metadata API across every route with unique branded titles, descriptions, canonicals, Open Graph & Twitter summary cards; (2) Dynamic OpenGraph images using `next/og` `ImageResponse` for lectures, chapters, batches, and faculty; (3) Dynamic `sitemap.ts` generated from database and `robots.ts` disallowing private routes; (4) Schema.org JSON-LD structured data (EducationalOrganization + LocalBusiness in Mathura, Person, Course with Offer in INR, VideoObject with ISO 8601 duration, BreadcrumbList, FAQPage); (5) GSC verification meta tag; (6) 4G performance optimizations: self-hosted next/font, KaTeX SSR with zero client JS, Lite YouTube embeds, next/image with responsive sizes; (7) WCAG AAA accessibility: skip link, focus-visible rings, prefers-reduced-motion reset, landmarks; (8) Vercel Analytics tracking 5 core events.
- 2026-10-08: Prompt 8 completed (Automated Checks, Security Hardening & Production Deployment): (1) Vitest unit tests for money helpers, Razorpay constant-time HMAC-SHA256 signature verification, ISO 8601 duration parser/formatter, YouTube tagger, and fee-due plan generation; (2) Security hardening: strict Content-Security-Policy headers in `next.config.ts`, zero-secret client bundle scanner (`tests/security-bundle-secrets.test.ts`), PostgreSQL-backed sliding window rate limits on enquiries and checkout, Sentry client/server/edge monitoring with automated PII scrubber (`beforeSendScrubber`); (3) Playwright E2E test suite covering 4 core user journeys (browsing, email OTP signup via Mailpit, checkout & receipt, admin batch publishing); (4) GitHub Actions CI workflow with PostgreSQL 17, Mailpit, and MinIO service containers; (5) Production database least-privilege script `scripts/prod-db-setup.sql` (non-superuser `q2l_app`); (6) Production-only seed `pnpm db:seed:prod` (subjects, chapters, site settings); (7) Comprehensive `LAUNCH_CHECKLIST.md` tracking all production go-live gates.

## RAZORPAY CONFIGURATION & TEST CREDENTIALS
- **Payment Capture**: Enable **Auto-capture** in the Razorpay Dashboard (Settings > Payment Capture > Automatically capture all payments), or capture on `payment.authorized`.
- **Server Decision of Amounts**: All monetary values are strictly computed on the server in integer paise from the PostgreSQL `batch_fee_plans` table. Client requests never dictate the amount.
- **Seat Reservations & Atomicity**: Batches are locked with `SELECT ... FOR UPDATE`. Available seats are checked against active enrollments plus pending enrollments under 30 minutes old. Full batches return "Batch full".
- **Webhook Source of Truth**: `/api/webhooks/razorpay` verifies `X-Razorpay-Signature` with `RAZORPAY_WEBHOOK_SECRET` and performs atomic deduplication using `INSERT INTO webhook_events ... ON CONFLICT (event_id) DO NOTHING RETURNING id`. Replayed events return 200 immediately.
- **Shared Payment Processing**: `markPaymentPaid(orderId, paymentId, source)` is shared between `/api/payments/verify` and `/api/webhooks/razorpay`. It locks the payments row `FOR UPDATE`, returns idempotently if already paid, marks payment & due paid, activates the enrollment, and assigns an official receipt number from PostgreSQL sequence `receipt_no_seq` (`Q2L-YYYY-XXXXXX`).
- **Test Credentials for Checkout**:
  - **Test Cards**:
    - Card Number: `4111 1111 1111 1111` (or any valid Visa/Mastercard test card)
    - Expiry: Any future date (e.g., `12/30`)
    - CVV: Any 3 digits (e.g., `123`)
    - OTP: Any 6 digits or Razorpay sandbox emulator "Success" button
  - **Test UPI**:
    - VPA: `success@razorpay` (simulates immediate successful UPI payment)
    - VPA: `failure@razorpay` (simulates UPI payment decline / failure)

## MOBILE APP (`apps/mobile`)
- **Framework**: Expo SDK (New Architecture enabled), Expo Router (file-based routing in `apps/mobile/app`), TypeScript strict.
- **Android Package**: `in.quick2learn.app`
- **URL Scheme**: `q2l`
- **Build Target**: Development build (`expo-dev-client`), not Expo Go.
- **Design & Tokens**: Styled with NativeWind v4 + Tailwind CSS 3.4. Single source of truth is `packages/shared/src/tokens.ts`, imported directly by `apps/mobile/tailwind.config.js` and compiled into web CSS via `pnpm tokens:build`.
- **Target Devices**: Budget Android devices (360 dp width, 2–3 GB RAM), slow 4G, one-handed touch ergonomics.
- **Accessible Touch Targets**: Minimum 48 dp on all interactive elements. Robust under 130% system font scaling without text clipping.
- **Writing & Content Rules**:
  - Sentence case or title case, never ALL CAPS titles.
  - The teacher's name is shown once per batch card, never repeated on every row.
  - No "Uncategorized" labels anywhere in the app.
  - Dates formatted as "Mon, 22 Apr" and times as "8:00 PM" in `Asia/Kolkata` timezone.
  - Every list must have:
    1. Skeleton loading state (subtle pulse, low RAM overhead).
    2. Pull-to-refresh (`RefreshControl` with primary color tint).
    3. Empty state with an illustration, title, one helpful line, and an action (never a dead end).
    4. Offline state with connectivity detection and banner indicator.
