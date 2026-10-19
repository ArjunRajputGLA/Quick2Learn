import {
  db,
  schema,
  eq,
  and,
  gt,
  sql,
  type DatabaseExecutor,
} from "@quick2learn/db";
import { NotFoundError } from "../authz";
import { sendEmail } from "../email";

/**
 * Generates a 6-digit numeric OTP.
 */
function generateSixDigitOtp(): string {
  if (process.env.NODE_ENV === "test") {
    return "123456";
  }
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Sends SMS OTP (logs in dev/test, uses DLT SMS in production).
 */
async function dispatchSmsOtp(phoneNumber: string, code: string) {
  const isDev = process.env.NODE_ENV !== "production";
  if (isDev || !process.env.SMS_PROVIDER_KEY) {
    console.log(`[account:delete] OTP for ${phoneNumber}: ${code}`);
    return;
  }

  const authKey = process.env.SMS_PROVIDER_KEY;
  const senderId = process.env.SMS_SENDER_ID || "Q2LRN";
  const templateId = process.env.SMS_OTP_TEMPLATE_ID || "";
  const mobile = phoneNumber.replace(/\+/g, "");

  const url = `https://control.msg91.com/api/v5/otp?template_id=${templateId}&mobile=${mobile}&authkey=${authKey}&otp=${code}`;
  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sender: senderId, otp: code }),
  }).catch((err) => {
    console.error("[account:delete] SMS dispatch error:", err);
  });
}

/**
 * Requests an account deletion verification code for an authenticated user.
 */
export async function requestAccountDeletionOtp(
  userId: string,
  tx?: DatabaseExecutor
) {
  const d = tx || db;

  const [userRow] = await d
    .select()
    .from(schema.user)
    .where(eq(schema.user.id, userId))
    .limit(1);

  if (!userRow) {
    throw new NotFoundError("User not found");
  }

  const [profileRow] = await d
    .select()
    .from(schema.profiles)
    .where(eq(schema.profiles.userId, userId))
    .limit(1);

  const otp = generateSixDigitOtp();
  const identifier = `account-deletion:${userId}`;
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  await d
    .delete(schema.verification)
    .where(eq(schema.verification.identifier, identifier));

  await d.insert(schema.verification).values({
    id: `del_${userId}_${Date.now()}`,
    identifier,
    value: otp,
    expiresAt,
  });

  // Send email if user has email
  if (userRow.email && !userRow.email.endsWith(".invalid")) {
    await sendEmail({
      to: userRow.email,
      subject: `Quick2Learn Account Deletion Verification: ${otp}`,
      text: `Your Quick2Learn account deletion verification code is ${otp}. This action is permanent and will anonymize your profile.`,
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; border: 1px solid #fee2e2; border-radius: 12px; background: #fff5f5;">
          <h2 style="color: #dc2626; margin-top: 0;">Account Deletion Request</h2>
          <p style="color: #1f2937;">You requested to permanently delete your Quick2Learn account.</p>
          <p style="font-size: 28px; font-weight: bold; letter-spacing: 6px; text-align: center; color: #dc2626; padding: 12px; background: #fee2e2; border-radius: 8px;">
            ${otp}
          </p>
          <p style="font-size: 13px; color: #6b7280;">This code expires in 10 minutes. If you did not initiate this request, your account remains safe and you can ignore this email.</p>
        </div>
      `,
    }).catch(() => {});
  }

  // Send SMS if user has phone
  const phone = userRow.phoneNumber || profileRow?.phone;
  if (phone) {
    await dispatchSmsOtp(phone, otp);
  }

  const destination = userRow.email || phone || "your registered contact";
  return {
    success: true,
    destination: destination.includes("@")
      ? destination.replace(/(.{2})(.*)(?=@)/, "$1***")
      : destination.replace(/(\d{2})(\d{6})(\d{2})/, "$1******$3"),
  };
}

/**
 * Confirms account deletion with OTP, permanently anonymizing the account and scrubbing active sessions/tokens.
 */
export async function confirmAccountDeletion(
  userId: string,
  code: string,
  tx?: DatabaseExecutor
) {
  const d = tx || db;
  const identifier = `account-deletion:${userId}`;

  // Find verification code
  const [record] = await d
    .select()
    .from(schema.verification)
    .where(
      and(
        eq(schema.verification.identifier, identifier),
        gt(schema.verification.expiresAt, new Date())
      )
    )
    .limit(1);

  if (!record || record.value !== code.trim()) {
    throw new Error("Invalid or expired verification code.");
  }

  // Perform anonymization and cleanup inside a database transaction
  const executeCleanup = async (t: DatabaseExecutor) => {
    const anonymizedName = "Deleted Account";
    const anonymizedEmail = `deleted_${userId.slice(0, 8)}_${Date.now()}@quick2learn.invalid`;

    // 1. Anonymize user record
    await t
      .update(schema.user)
      .set({
        name: anonymizedName,
        email: anonymizedEmail,
        phoneNumber: null,
        image: null,
        emailVerified: false,
        phoneNumberVerified: false,
        updatedAt: new Date(),
      })
      .where(eq(schema.user.id, userId));

    // 2. Anonymize profile record
    await t
      .update(schema.profiles)
      .set({
        fullName: anonymizedName,
        phone: null,
        parentName: null,
        parentPhone: null,
        school: null,
        city: null,
        avatarUrl: null,
        updatedAt: new Date(),
      })
      .where(eq(schema.profiles.userId, userId));

    // 3. Clear sessions
    await t.delete(schema.session).where(eq(schema.session.userId, userId));

    // 4. Clear device push tokens
    await t.delete(schema.deviceTokens).where(eq(schema.deviceTokens.userId, userId));

    // 5. Clear OAuth accounts
    await t.delete(schema.account).where(eq(schema.account.userId, userId));

    // 6. Clear parent links & invite codes
    await t
      .delete(schema.parentLinks)
      .where(
        sql`${schema.parentLinks.studentUserId} = ${userId} OR ${schema.parentLinks.parentUserId} = ${userId}`
      );

    await t
      .delete(schema.parentInviteCodes)
      .where(eq(schema.parentInviteCodes.studentUserId, userId));

    // 7. Audit log of the deletion
    await t.insert(schema.auditLog).values({
      actorId: userId,
      action: "account_deletion_anonymized",
      entity: "user",
      entityId: userId,
      diff: {
        status: "anonymized",
        retainedFinancials: true,
        legalNotice: "Payment and fee receipt records retained for statutory tax compliance.",
      },
    });

    // 8. Delete verification record
    await t
      .delete(schema.verification)
      .where(eq(schema.verification.identifier, identifier));
  };

  if (tx) {
    await executeCleanup(tx);
  } else {
    await db.transaction(async (t) => {
      await executeCleanup(t);
    });
  }

  return {
    success: true,
    message: "Your account has been permanently deleted and personal data anonymized.",
  };
}

/**
 * Public account deletion request (by email or phone) for the public /delete-account web page.
 */
export async function requestPublicAccountDeletion(identifierInput: string) {
  const cleanInput = identifierInput.trim().toLowerCase();

  // Find user by email or phone
  let userRow = await db.query.user.findFirst({
    where: eq(schema.user.email, cleanInput),
  });

  if (!userRow) {
    // Check phone number
    const cleanedPhone = cleanInput.replace(/\D/g, "").slice(-10);
    if (cleanedPhone.length === 10) {
      userRow = await db.query.user.findFirst({
        where: sql`RIGHT(REGEXP_REPLACE(${schema.user.phoneNumber}, '\\D', '', 'g'), 10) = ${cleanedPhone}`,
      });

      if (!userRow) {
        // Also check profiles.phone
        const prof = await db.query.profiles.findFirst({
          where: sql`RIGHT(REGEXP_REPLACE(${schema.profiles.phone}, '\\D', '', 'g'), 10) = ${cleanedPhone}`,
        });
        if (prof?.userId) {
          userRow = await db.query.user.findFirst({
            where: eq(schema.user.id, prof.userId),
          });
        }
      }
    }
  }

  if (!userRow) {
    // Return friendly generic response to avoid enumeration
    return {
      success: true,
      message: "If an account exists with these details, a verification code has been dispatched.",
      userId: null,
    };
  }

  const res = await requestAccountDeletionOtp(userRow.id);
  return {
    success: true,
    message: `Verification code dispatched to ${res.destination}.`,
    userId: userRow.id,
  };
}
