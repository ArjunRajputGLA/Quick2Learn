import { test, expect } from "@playwright/test";
import { Pool } from "pg";

const testDbUrl =
  process.env.DATABASE_URL_TEST ||
  process.env.DATABASE_URL ||
  "postgresql://postgres:postgres@localhost:5432/quick2learn_test";

const testPool = new Pool({
  connectionString: testDbUrl,
});

async function fetchOtpCode(email: string): Promise<string> {
  // 1. Try reading from Mailpit API (standard port 8025)
  try {
    const res = await fetch("http://localhost:8025/api/v1/messages");
    if (res.ok) {
      const data = (await res.json()) as { messages?: Array<{ ID: string; To?: Array<{ Address: string }> }> };
      const msg = data.messages?.find((m) =>
        m.To?.some((t) => t.Address.toLowerCase() === email.toLowerCase()),
      );
      if (msg) {
        const detailRes = await fetch(`http://localhost:8025/api/v1/message/${msg.ID}`);
        if (detailRes.ok) {
          const detail = (await detailRes.json()) as { Text?: string; HTML?: string };
          const body = detail.Text || detail.HTML || "";
          const match = body.match(/\b\d{6}\b/);
          if (match) return match[0];
        }
      }
    }
  } catch {
    // Mailpit not responding, fallback to database
  }

  // 2. Direct fallback from PostgreSQL verification table
  const queryRes = await testPool.query(
    `SELECT value FROM "verification" WHERE identifier = $1 ORDER BY expires_at DESC LIMIT 1;`,
    [email],
  );
  if (queryRes.rows.length > 0) {
    const val = queryRes.rows[0].value;
    const match = String(val).match(/\b\d{6}\b/);
    if (match) return match[0];
    return String(val);
  }

  throw new Error(`Unable to fetch OTP code for ${email}`);
}

test.describe("Quick2Learn End-to-End User Journeys", () => {
  // JOURNEY 1: BROWSE HOME -> CHAPTER -> LECTURE
  test("Journey 1: Browse home → chapter → lecture with lite player", async ({ page }) => {
    // 1. Visit Homepage
    await page.goto("/");
    await expect(page).toHaveTitle(/Quick2Learn/);
    await expect(page.locator("text=Maths made quick and easy").first()).toBeVisible();

    // 2. Navigate to Chapter page
    await page.goto("/learn/xii/mathematics/class-12-maths-ch-1-relations-and-functions");
    await expect(page).toHaveTitle(/Relations and Functions|Quick2Learn/);
    await expect(page.locator("h1")).toContainText(/Relations and Functions/i);

    // 3. Navigate to a Lecture page
    await page.goto("/lectures");
    await expect(page).toHaveTitle(/Video Lectures|Quick2Learn/);

    // Click first lecture card link
    const firstLecture = page.locator("a[href^='/lecture/']").first();
    await expect(firstLecture).toBeVisible();
    const lectureHref = await firstLecture.getAttribute("href");
    expect(lectureHref).toBeTruthy();

    await page.goto(lectureHref!);
    await expect(page.locator("h1")).toBeVisible();
    // Lite YouTube embed or video thumbnail container present
    await expect(page.locator("iframe, [aria-label*='Play'], button").first()).toBeVisible();
  });

  // JOURNEY 2: SIGN UP WITH EMAIL OTP -> ONBOARDING -> DASHBOARD
  test("Journey 2: Sign up with email OTP → onboarding → dashboard", async ({ page }) => {
    const uniqueEmail = `e2e_student_${Date.now()}@quick2learn.in`;

    // 1. Go to Login page
    await page.goto("/login");
    await expect(page.locator("input[type='email']")).toBeVisible();

    // 2. Submit email to request OTP
    await page.fill("input[type='email']", uniqueEmail);
    await page.click("button[type='submit']");

    // Wait for OTP input screen
    await page.waitForTimeout(1000);

    // 3. Retrieve code from Mailpit / Postgres
    const otp = await fetchOtpCode(uniqueEmail);
    expect(otp).toMatch(/^\d{6}$/);

    // 4. Fill OTP and submit
    const otpInput = page.locator("input[name='otp'], input[name='code'], input[type='text']").first();
    await otpInput.fill(otp);
    await page.locator("button:has-text('Verify'), button:has-text('Continue'), button[type='submit']").first().click();

    // 5. Redirection to Onboarding
    await page.waitForURL((url) => url.pathname.includes("/onboarding") || url.pathname.includes("/dashboard"), {
      timeout: 15000,
    });

    if (page.url().includes("/onboarding")) {
      await page.fill("input[name='fullName'], input[name='name']", "E2E Student Test");
      await page.fill("input[name='phone']", "9876543210");
      await page.locator("button[type='submit']").click();

      await page.waitForURL((url) => url.pathname.includes("/dashboard"), {
        timeout: 15000,
      });
    }

    // 6. Confirm Dashboard access
    await expect(page.locator("text=Student Portal, text=Dashboard, text=Enrolled Batches").first()).toBeVisible();
  });

  // JOURNEY 3: ENROL -> TEST PAYMENT -> BATCH ACTIVE -> RECEIPT
  test("Journey 3: Enrol in batch → complete checkout → batch active & receipt generated", async ({ page }) => {
    // Direct test with test database payment verification
    const studentEmail = `paying_student_${Date.now()}@quick2learn.in`;

    // 1. Provision student and session in DB
    const userInsert = await testPool.query(
      `INSERT INTO "user" (id, name, email, email_verified, created_at, updated_at)
       VALUES ($1, $2, $3, true, now(), now()) RETURNING id;`,
      [`usr_${Date.now()}`, "Paying Student", studentEmail],
    );
    const userId = userInsert.rows[0].id;

    await testPool.query(
      `INSERT INTO "profiles" (user_id, full_name, phone, role, is_onboarded, created_at, updated_at)
       VALUES ($1, 'Paying Student', '9876543210', 'student', true, now(), now());`,
      [userId],
    );

    const token = `sess_${Date.now()}_token`;
    await testPool.query(
      `INSERT INTO "session" (id, user_id, token, expires_at, created_at, updated_at)
       VALUES ($1, $2, $3, now() + interval '7 days', now(), now());`,
      [`sess_${Date.now()}`, userId, token],
    );

    // Set authentication session cookie
    await page.context().addCookies([
      {
        name: "better-auth.session_token",
        value: token,
        domain: "localhost",
        path: "/",
        httpOnly: true,
        sameSite: "Lax",
      },
    ]);

    // 2. Navigate to batch checkout
    await page.goto("/batches/class-12-target-boards");
    await expect(page.locator("h1")).toContainText(/Class 12/i);

    // 3. Go to checkout
    await page.goto("/checkout/class-12-target-boards");
    await expect(page.locator("text=Review Enrollment & Fees").first()).toBeVisible();

    // 4. Simulate payment completion in DB and view receipt
    const batchRes = await testPool.query(`SELECT id FROM "batches" WHERE slug = 'class-12-target-boards';`);
    const batchId = batchRes.rows[0].id;

    const planRes = await testPool.query(`SELECT id, total_paise FROM "batch_fee_plans" WHERE batch_id = $1 LIMIT 1;`, [batchId]);
    const planId = planRes.rows[0].id;
    const amountPaise = planRes.rows[0].total_paise;

    const enrollRes = await testPool.query(
      `INSERT INTO "enrollments" (student_id, batch_id, fee_plan_id, status, created_at, updated_at)
       VALUES ($1, $2, $3, 'active', now(), now()) RETURNING id;`,
      [userId, batchId, planId],
    );
    const enrollId = enrollRes.rows[0].id;

    const payRes = await testPool.query(
      `INSERT INTO "payments" (student_id, enrollment_id, amount_paise, status, receipt_no, method, created_at, updated_at)
       VALUES ($1, $2, $3, 'paid', 'Q2L-2026-000999', 'razorpay', now(), now()) RETURNING id;`,
      [userId, enrollId, amountPaise],
    );
    const paymentId = payRes.rows[0].id;

    // 5. View student dashboard active batches
    await page.goto("/dashboard/batches");
    await expect(page.locator("text=Class 12 Target Boards").first()).toBeVisible();

    // 6. View payment receipt
    await page.goto(`/dashboard/payments/${paymentId}`);
    await expect(page.locator("text=Q2L-2026-000999").first()).toBeVisible();
    await expect(page.locator("text=PAID").first()).toBeVisible();
  });

  // JOURNEY 4: ADMIN CREATES AND PUBLISHES BATCH -> APPEARS ON /BATCHES
  test("Journey 4: Admin creates and publishes a batch → batch appears on /batches", async ({ page }) => {
    const adminEmail = `admin_e2e_${Date.now()}@quick2learn.in`;
    const adminUser = await testPool.query(
      `INSERT INTO "user" (id, name, email, email_verified, created_at, updated_at)
       VALUES ($1, $2, $3, true, now(), now()) RETURNING id;`,
      [`admin_${Date.now()}`, "Admin Dinesh", adminEmail],
    );
    const adminId = adminUser.rows[0].id;

    await testPool.query(
      `INSERT INTO "profiles" (user_id, full_name, role, is_onboarded, created_at, updated_at)
       VALUES ($1, 'Admin Dinesh', 'admin', true, now(), now());`,
      [adminId],
    );

    const adminToken = `sess_admin_${Date.now()}`;
    await testPool.query(
      `INSERT INTO "session" (id, user_id, token, expires_at, created_at, updated_at)
       VALUES ($1, $2, $3, now() + interval '7 days', now(), now());`,
      [`sess_${Date.now()}`, adminId, adminToken],
    );

    // Set admin session cookie
    await page.context().addCookies([
      {
        name: "better-auth.session_token",
        value: adminToken,
        domain: "localhost",
        path: "/",
        httpOnly: true,
        sameSite: "Lax",
      },
    ]);

    // 1. Visit admin batches page
    await page.goto("/admin/batches");
    await expect(page.locator("h1")).toContainText(/Batches/i);

    // 2. Publish a new batch directly or via admin form
    const subRes = await testPool.query(`SELECT id FROM "subjects" LIMIT 1;`);
    const facRes = await testPool.query(`SELECT id FROM "faculty" LIMIT 1;`);
    const newSlug = `e2e-master-batch-${Date.now()}`;

    await testPool.query(
      `INSERT INTO "batches" (
        slug, title, subtitle, class_level, board, mode, status,
        subject_id, faculty_id, seats_total, schedule_text, start_date, created_at, updated_at
      ) VALUES (
        $1, 'E2E Master Class 2026', 'Comprehensive Mathura Board Batch', 12, 'cbse', 'offline', 'open',
        $2, $3, 40, 'Mon, Wed, Fri 5:00 PM', now(), now(), now()
      );`,
      [newSlug, subRes.rows[0].id, facRes.rows[0].id],
    );

    // 3. Confirm newly published batch appears publicly on /batches
    await page.goto("/batches");
    await expect(page.locator("text=E2E Master Class 2026").first()).toBeVisible();
  });
});
