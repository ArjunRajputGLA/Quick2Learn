import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { emailOTP, phoneNumber } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";
import { expo } from "@better-auth/expo";
import { after } from "next/server";
import { db } from "@quick2learn/db";
import * as schema from "@quick2learn/db/schema";
import { sendEmail } from "../email";

const baseURL = process.env.BETTER_AUTH_URL || "http://localhost:3000";
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

const isDev = process.env.NODE_ENV !== "production";

async function sendSmsOtp({
  phoneNumber,
  code,
}: {
  phoneNumber: string;
  code: string;
}) {
  const isDev = process.env.NODE_ENV !== "production";
  const appHash = process.env.ANDROID_SMS_APP_HASH || "Quick2LearnAppHash";

  // In development/test, log the code to console
  if (isDev || !process.env.SMS_PROVIDER_KEY) {
    console.log(
      `[auth:phone] Verification OTP for ${phoneNumber}: ${code} [APP_HASH: ${appHash}]`
    );
    return;
  }

  // DLT-registered SMS provider (MSG91) using approved template
  const authKey = process.env.SMS_PROVIDER_KEY;
  const senderId = process.env.SMS_SENDER_ID || "Q2LRN";
  const templateId = process.env.SMS_OTP_TEMPLATE_ID || "";
  const mobile = phoneNumber.replace(/\+/g, "");

  const url = `https://control.msg91.com/api/v5/otp?template_id=${templateId}&mobile=${mobile}&authkey=${authKey}&otp=${code}`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sender: senderId,
      otp: code,
      app_hash: appHash,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error("[auth:phone] MSG91 SMS send error:", response.status, errText);
  }
}

const isPhoneAuthEnabled =
  process.env.AUTH_PHONE_ENABLED === "true" ||
  process.env.NODE_ENV === "test" ||
  isDev;

const plugins = [
  emailOTP({
    otpLength: 6,
    expiresIn: 300,
    allowedAttempts: 3,
    storeOTP: "hashed",
    rateLimit: {
      window: 60,
      max: 10,
    },
    sendVerificationOTP: async ({ email, otp }) => {
      const emailPromise = sendEmail({
        to: email,
        subject: `Your Quick2Learn verification code: ${otp}`,
        text: `Your Quick2Learn verification code is ${otp}. It expires in 5 minutes.`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; border: 1px solid #E5E7EB; border-radius: 12px; background: #ffffff;">
            <div style="margin-bottom: 24px; text-align: center;">
              <h1 style="color: #3B82F6; font-size: 24px; font-weight: 700; margin: 0;">Quick2Learn</h1>
              <p style="color: #6B7280; font-size: 14px; margin-top: 4px;">Mathematics & Sciences Excellence</p>
            </div>
            <p style="font-size: 15px; color: #1F2937; margin-bottom: 12px;">Hello,</p>
            <p style="font-size: 15px; color: #1F2937; margin-bottom: 24px;">Use the verification code below to sign in to your Quick2Learn account:</p>
            <div style="background-color: #EFF6FF; color: #3B82F6; font-size: 32px; font-weight: 700; letter-spacing: 8px; text-align: center; padding: 18px 24px; border-radius: 8px; margin-bottom: 24px;">
              ${otp}
            </div>
            <p style="font-size: 13px; color: #6B7280; line-height: 1.5; margin-bottom: 8px;">
              This code expires in 5 minutes. For security, never share this code with anyone.
            </p>
            <p style="font-size: 13px; color: #9CA3AF; margin-top: 24px; border-top: 1px solid #F3F4F6; padding-top: 16px;">
              If you didn't request this code, you can safely ignore this email.
            </p>
          </div>
        `,
      }).catch(() => {
        console.warn("[auth] Notice: SMTP server unreachable in local/test environment. OTP generated:", otp);
      });

      try {
        after(async () => {
          await emailPromise;
        });
      } catch {
        // Fallback for non-request contexts (CLI, tests)
        emailPromise.catch((err) => {
          console.error("[auth] Failed to send verification OTP:", err);
        });
      }
    },
  }),
  ...(isPhoneAuthEnabled
    ? [
        phoneNumber({
          otpLength: 6,
          expiresIn: 300,
          allowedAttempts: 3,
          sendOTP: async ({ phoneNumber: phone, code }) => {
            const sendPromise = sendSmsOtp({ phoneNumber: phone, code }).catch((err) => {
              console.error("[auth:phone] Failed to send SMS OTP:", err);
            });
            try {
              after(async () => {
                await sendPromise;
              });
            } catch {
              sendPromise.catch(() => {});
            }
          },
          phoneNumberValidator: (phone: string) => {
            const cleaned = phone.replace(/[\s\-\(\)]/g, "");
            return /^(\+91|91|0)?[6-9]\d{9}$/.test(cleaned);
          },
          signUpOnVerification: {
            getTempEmail: (phone: string) => {
              const digits = phone.replace(/\D/g, "").slice(-10);
              return `${digits}@phone.quick2learn.invalid`;
            },
            getTempName: () => "Student",
          },
          callbackOnVerification: async ({ phoneNumber: phone, user: verifiedUser }) => {
            try {
              const { linkParentToMatchingStudents } = await import("../data/parent");
              await linkParentToMatchingStudents(verifiedUser.id, phone);
            } catch (err) {
              console.error("[auth:phone] callbackOnVerification error:", err);
            }
          },
        }),
      ]
    : []),
  expo(),
  nextCookies(),
];

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET || "quick2learn_dev_secret_key_at_least_32_characters_long",
  baseURL,
  trustedOrigins: [
    siteUrl,
    baseURL,
    "q2l://",
    ...(isDev ? ["exp://"] : []),
  ],
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      redirectURI: `${baseURL}/api/auth/callback/google`,
    },
  },
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ["google"],
    },
  },
  rateLimit: {
    enabled: true,
    storage: "database",
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30-day expiry
    updateAge: 60 * 60 * 24, // refreshed daily
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5-minute cookie cache
    },
  },
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          try {
            await db
              .insert(schema.profiles)
              .values({
                userId: user.id,
                fullName: user.name || "Student",
                phone: (user as any).phoneNumber || null,
                role: "student",
              })
              .onConflictDoNothing();
          } catch (err) {
            console.error("[databaseHooks.user.create.after] Error creating profile:", err);
          }
        },
      },
    },
  },
  plugins,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
      ...(schema.rateLimit ? { rateLimit: schema.rateLimit } : {}),
    },
  }),
});
