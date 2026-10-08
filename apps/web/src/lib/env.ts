import { z } from "zod";

const publicEnvSchema = z.object({
  NEXT_PUBLIC_RAZORPAY_KEY_ID: z.string().min(1, "NEXT_PUBLIC_RAZORPAY_KEY_ID is required"),
  NEXT_PUBLIC_SITE_URL: z.string().url("NEXT_PUBLIC_SITE_URL must be a valid URL"),
});

const serverEnvSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  DATABASE_URL_DIRECT: z.string().optional(),
  DATABASE_URL_TEST: z.string().optional(),
  BETTER_AUTH_SECRET: z.string().min(1, "BETTER_AUTH_SECRET is required"),
  BETTER_AUTH_URL: z.string().url("BETTER_AUTH_URL must be a valid URL"),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  AUTH_PHONE_ENABLED: z.string().optional(),
  SMTP_HOST: z.string().min(1, "SMTP_HOST is required"),
  SMTP_PORT: z.coerce.number().default(1025),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  EMAIL_FROM: z.string().min(1, "EMAIL_FROM is required"),
  S3_ENDPOINT: z.string().url("S3_ENDPOINT must be a valid URL"),
  S3_REGION: z.string().default("us-east-1"),
  S3_ACCESS_KEY_ID: z.string().min(1, "S3_ACCESS_KEY_ID is required"),
  S3_SECRET_ACCESS_KEY: z.string().min(1, "S3_SECRET_ACCESS_KEY is required"),
  S3_PUBLIC_BUCKET: z.string().min(1, "S3_PUBLIC_BUCKET is required"),
  S3_PRIVATE_BUCKET: z.string().min(1, "S3_PRIVATE_BUCKET is required"),
  S3_PUBLIC_BASE_URL: z.string().optional(),
  YOUTUBE_API_KEY: z.string().min(1, "YOUTUBE_API_KEY is required"),
  YOUTUBE_CHANNEL_ID: z.string().min(1, "YOUTUBE_CHANNEL_ID is required"),
  RAZORPAY_KEY_ID: z.string().min(1, "RAZORPAY_KEY_ID is required"),
  RAZORPAY_KEY_SECRET: z.string().min(1, "RAZORPAY_KEY_SECRET is required"),
  RAZORPAY_WEBHOOK_SECRET: z.string().min(1, "RAZORPAY_WEBHOOK_SECRET is required"),
  CRON_SECRET: z.string().min(1, "CRON_SECRET is required"),
});

export type PublicEnv = z.infer<typeof publicEnvSchema>;
export type ServerEnv = z.infer<typeof serverEnvSchema>;

export const publicEnv: PublicEnv = publicEnvSchema.parse({
  NEXT_PUBLIC_RAZORPAY_KEY_ID:
    process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_dummy",
  NEXT_PUBLIC_SITE_URL:
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
});

let parsedServerEnv: ServerEnv | null = null;

export function getServerEnv(): ServerEnv {
  if (typeof window !== "undefined") {
    throw new Error(
      "SECURITY VIOLATION: Attempted to access server environment variables from browser/client bundle.",
    );
  }

  if (!parsedServerEnv) {
    parsedServerEnv = serverEnvSchema.parse({
      DATABASE_URL:
        process.env.DATABASE_URL ||
        "postgresql://postgres:postgres@localhost:5432/quick2learn",
      DATABASE_URL_DIRECT: process.env.DATABASE_URL_DIRECT,
      DATABASE_URL_TEST:
        process.env.DATABASE_URL_TEST ||
        "postgresql://postgres:postgres@localhost:5432/quick2learn_test",
      BETTER_AUTH_SECRET:
        process.env.BETTER_AUTH_SECRET || "super_secret_auth_token_at_least_32_characters_long",
      BETTER_AUTH_URL:
        process.env.BETTER_AUTH_URL || "http://localhost:3000",
      GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
      AUTH_PHONE_ENABLED: process.env.AUTH_PHONE_ENABLED || "false",
      SMTP_HOST: process.env.SMTP_HOST || "localhost",
      SMTP_PORT: process.env.SMTP_PORT || 1025,
      SMTP_USER: process.env.SMTP_USER,
      SMTP_PASS: process.env.SMTP_PASS,
      EMAIL_FROM: process.env.EMAIL_FROM || "Quick2Learn <noreply@quick2learn.in>",
      S3_ENDPOINT: process.env.S3_ENDPOINT || "http://localhost:9000",
      S3_REGION: process.env.S3_REGION || "us-east-1",
      S3_ACCESS_KEY_ID: process.env.S3_ACCESS_KEY_ID || "minioadmin",
      S3_SECRET_ACCESS_KEY: process.env.S3_SECRET_ACCESS_KEY || "minioadmin",
      S3_PUBLIC_BUCKET: process.env.S3_PUBLIC_BUCKET || "q2l-public",
      S3_PRIVATE_BUCKET: process.env.S3_PRIVATE_BUCKET || "q2l-private",
      S3_PUBLIC_BASE_URL: process.env.S3_PUBLIC_BASE_URL || "http://localhost:9000/q2l-public",
      YOUTUBE_API_KEY: process.env.YOUTUBE_API_KEY || "dummy_youtube_api_key",
      YOUTUBE_CHANNEL_ID: process.env.YOUTUBE_CHANNEL_ID || "UCy1XY9I1Yeyy59Y5LMgqa8g",
      RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID || "rzp_test_dummy",
      RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET || "dummy_secret",
      RAZORPAY_WEBHOOK_SECRET: process.env.RAZORPAY_WEBHOOK_SECRET || "dummy_webhook_secret",
      CRON_SECRET: process.env.CRON_SECRET || "dummy_cron_secret_1234567890",
    });
  }

  return parsedServerEnv;
}

export const serverEnv: ServerEnv = new Proxy({} as ServerEnv, {
  get(_target, prop: string | symbol) {
    if (typeof prop !== "string") {
      return undefined;
    }
    const env = getServerEnv();
    return env[prop as keyof ServerEnv];
  },
});
