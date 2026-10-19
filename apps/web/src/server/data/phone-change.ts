import {
  db,
  schema,
  eq,
  and,
  ne,
  gt,
  type DatabaseExecutor,
} from "@quick2learn/db";

function generateOtp(): string {
  if (process.env.NODE_ENV === "test") {
    return "123456";
  }
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function dispatchSmsOtp(phoneNumber: string, code: string) {
  const isDev = process.env.NODE_ENV !== "production";
  if (isDev || !process.env.SMS_PROVIDER_KEY) {
    console.log(`[phone:change] OTP for ${phoneNumber}: ${code}`);
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
    console.error("[phone:change] SMS dispatch error:", err);
  });
}

/**
 * Requests an OTP to change the user's phone number to a new phone number.
 */
export async function requestPhoneChangeOtp(
  userId: string,
  newPhoneNumber: string,
  tx?: DatabaseExecutor
) {
  const d = tx || db;
  const cleanedPhone = newPhoneNumber.trim();

  // Check if new phone is already in use by another user
  const [existingUser] = await d
    .select({ id: schema.user.id })
    .from(schema.user)
    .where(
      and(
        eq(schema.user.phoneNumber, cleanedPhone),
        ne(schema.user.id, userId)
      )
    )
    .limit(1);

  if (existingUser) {
    throw new Error(
      "This mobile number is already linked to another Quick2Learn account."
    );
  }

  const otp = generateOtp();
  const identifier = `phone-change:${userId}:${cleanedPhone}`;
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

  await d
    .delete(schema.verification)
    .where(eq(schema.verification.identifier, identifier));

  await d.insert(schema.verification).values({
    id: `phone_${userId}_${Date.now()}`,
    identifier,
    value: otp,
    expiresAt,
  });

  await dispatchSmsOtp(cleanedPhone, otp);

  return {
    success: true,
    message: `Verification code sent to ${cleanedPhone}`,
  };
}

/**
 * Verifies OTP and updates the user's phone number in both user and profile tables.
 */
export async function confirmPhoneChange(
  userId: string,
  newPhoneNumber: string,
  code: string,
  tx?: DatabaseExecutor
) {
  const d = tx || db;
  const cleanedPhone = newPhoneNumber.trim();
  const identifier = `phone-change:${userId}:${cleanedPhone}`;

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

  const executeUpdate = async (t: DatabaseExecutor) => {
    // 1. Update user table
    await t
      .update(schema.user)
      .set({
        phoneNumber: cleanedPhone,
        phoneNumberVerified: true,
        updatedAt: new Date(),
      })
      .where(eq(schema.user.id, userId));

    // 2. Update profiles table
    await t
      .update(schema.profiles)
      .set({
        phone: cleanedPhone,
        updatedAt: new Date(),
      })
      .where(eq(schema.profiles.userId, userId));

    // 3. Delete verification record
    await t
      .delete(schema.verification)
      .where(eq(schema.verification.identifier, identifier));
  };

  if (tx) {
    await executeUpdate(tx);
  } else {
    await db.transaction(async (t) => {
      await executeUpdate(t);
    });
  }

  return {
    success: true,
    phoneNumber: cleanedPhone,
    message: "Mobile number updated successfully.",
  };
}
