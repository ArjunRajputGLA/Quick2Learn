# Quick2Learn Production Launch Checklist

This checklist tracks every security, infrastructure, database, payment, and deployment step required before launching **quick2learn.in**.

---

### 1. Database Provisioning & Security (PostgreSQL 17)
- [ ] **Postgres 17 Engine**: Hosted on managed provider (Neon, Supabase, AWS RDS, or Render) with SSL required (`sslmode=require`).
- [ ] **Connection Strings**:
  - `DATABASE_URL`: Provider's pooled connection string (PgBouncer/Supavisor, port 6543/5432) for application queries.
  - `DATABASE_URL_DIRECT`: Direct unpooled connection string (port 5432) for running migrations and DDL statements.
- [ ] **Least-Privilege Database Role**: Run `scripts/prod-db-setup.sql` to ensure `q2l_app` owns only the `quick2learn` database and is **NOT** a superuser (`NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT`).
- [ ] **Automated Backups**: Enable automated daily backups with point-in-time recovery (PITR) enabled.
- [ ] **Backup Restore Drill**: Execute one full restore drill from backup into a test schema/instance before taking live traffic.
- [ ] **Production Deploy Step**: Migrations run strictly as a deploy step (`pnpm db:migrate` against `DATABASE_URL_DIRECT`), never on incoming HTTP page requests.
- [ ] **Production Seeding**: Run `pnpm db:seed:prod` to seed only core subjects, curriculum chapters, and site settings without test users or demo batches.

---

### 2. Cloud Storage (Cloudflare R2 or AWS S3)
- [ ] **Bucket Provisioning**: Create two separate buckets:
  - `q2l-public`: Publicly readable bucket for student materials, formulas, syllabus PDFs, and banners.
  - `q2l-private`: Strictly private bucket with zero public read access for internal records, fee receipts, and exports.
- [ ] **Custom Domain**: Map custom domain (e.g., `media.quick2learn.in`) to `q2l-public`.
- [ ] **CORS Configuration**: Configure CORS on `q2l-public` allowing `PUT` from `https://quick2learn.in` for presigned uploads:
  ```json
  [
    {
      "AllowedOrigins": ["https://quick2learn.in"],
      "AllowedMethods": ["GET", "PUT", "HEAD"],
      "AllowedHeaders": ["*"],
      "ExposeHeaders": ["ETag"],
      "MaxAgeSeconds": 3600
    }
  ]
  ```
- [ ] **Private Bucket Isolation**: Verify no IAM policies or public URL endpoints allow unauthorized reading of `q2l-private`.

---

### 3. Email & Domain Authentication (SMTP / Mail Delivery)
- [ ] **Domain Verification**: Verify `quick2learn.in` with your transactional SMTP provider (Resend, Postmark, AWS SES, or Brevo).
- [ ] **SPF Record**: Add TXT record for SPF (`v=spf1 include:... ~all`).
- [ ] **DKIM Record**: Add CNAME/TXT records for DKIM public keys.
- [ ] **DMARC Policy**: Publish DMARC TXT record at `_dmarc.quick2learn.in` (`v=DMARC1; p=reject; rua=mailto:dmarc@quick2learn.in`).
- [ ] **Test Deliverability**: Send test OTP codes to both a `@gmail.com` and an `@outlook.com` address; confirm high inbox placement with zero spam-folder routing.

---

### 4. Authentication (Better Auth)
- [ ] **Production Secrets**: Generate a 32+ character random `BETTER_AUTH_SECRET`.
- [ ] **App URL**: Set `BETTER_AUTH_URL=https://quick2learn.in`.
- [ ] **Google OAuth Live Credentials**:
  - Create OAuth 2.0 Client ID in Google Cloud Console with production branding.
  - Authorized JavaScript origin: `https://quick2learn.in`.
  - Authorized redirect URI: `https://quick2learn.in/api/auth/callback/google`.
- [ ] **Rate Limiting**: Rate limits active in Postgres for OTP requests, login attempts, and student sessions.

---

### 5. Payments & Webhooks (Razorpay)
- [ ] **KYC & Account Activation**: Complete business KYC and activate Live mode on the Razorpay Dashboard.
- [ ] **Live Keys**: Set live `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`.
- [ ] **Auto-Capture Enabled**: Enable **Automatically capture all payments** under *Settings > Payment Capture* (or capture on authorization).
- [ ] **Production Webhook**:
  - Endpoint URL: `https://quick2learn.in/api/webhooks/razorpay`.
  - Secret: Generate a high-entropy `RAZORPAY_WEBHOOK_SECRET`.
  - Subscribed events: `payment.captured`, `order.paid`, `payment.failed`, `refund.processed`.
- [ ] **Live Transaction Drill**:
  - Run a ₹1 test purchase with a real UPI/card on `https://quick2learn.in/checkout/...`.
  - Confirm instant enrollment activation and official receipt generation (`Q2L-YYYY-XXXXXX`).
  - Process a refund via Razorpay dashboard and confirm status updates cleanly.

---

### 6. Hosting & Environment (Vercel)
- [ ] **Custom Domain & SSL**: Add `quick2learn.in` and `www.quick2learn.in` with automated HTTPS certificates.
- [ ] **Environment Separation**:
  - Production environment has production database, Razorpay live keys, and live S3 buckets.
  - Preview deployments connect to an isolated staging database and Razorpay test mode (never production).
- [ ] **Cron Jobs Verification**: Verify scheduled jobs in `vercel.json`:
  - Daily YouTube Channel Sync: `/api/cron/youtube-sync` (daily at 04:00 UTC).
  - Daily Payment & Order Housekeeping: `/api/cron/payment-housekeeping` (daily at 02:00 UTC).
- [ ] **CRON_SECRET Protection**: Verify both cron endpoints require `Authorization: Bearer <CRON_SECRET>`.

---

### 7. Security Hardening & Observability
- [ ] **Content-Security-Policy**: Enforce strict CSP in `next.config.ts` allowing only:
  - `youtube-nocookie.com` and `i.ytimg.com`
  - `checkout.razorpay.com` and `api.razorpay.com`
  - Storage origin (`S3_PUBLIC_BASE_URL`)
  - Google Maps embed
- [ ] **Client Bundle Cleanliness**: Pass `tests/security-bundle-secrets.test.ts` to guarantee zero secrets in `.next/static`.
- [ ] **Postgres Rate Limiting**:
  - `/contact` enquiry form limited per IP (5 / 10m) and per phone (3 / 10m).
  - `/checkout` order creation limited per student (10 / 15m).
- [ ] **Sentry Error Monitoring**:
  - Configure `SENTRY_DSN` for client and server.
  - Verify `beforeSendScrubber` scrubs user IP, emails, Indian phone numbers, OTPs, and payment tokens.

---

### 8. Content & Initial Import
- [ ] **Initial YouTube Channel Import**: Trigger initial synchronization to import all public playlists and video lectures.
- [ ] **Admin Review Pass**: Audit lectures under `/admin/lectures` to verify class assignments, chapter mappings, and thumbnail rendering.
- [ ] **Faculty Profiles**: Review Dinesh Sir's and Namita Ma'am's profile pages, achievements, and active batches.
- [ ] **Policy Pages**: Ensure `/privacy`, `/terms`, `/refund-policy`, and `/delivery-policy` reflect accurate legal names and contact hours.

---

### 9. Final Done-When Verification Gate
- [ ] **Production URL Live**: `https://quick2learn.in` loads with valid HTTPS.
- [ ] **Full Channel Browsable**: Playlists, chapters, and lectures open seamlessly.
- [ ] **Live Payment & Refund Drill**: ₹1 live payment succeeds, student enrolled, receipt generated, and refund completed.
- [ ] **Backup Restoration Verified**: Tested database restoration from snapshot.
- [ ] **CI Pipeline Green**: All unit, integration, and E2E checks pass on GitHub Actions `main`.
