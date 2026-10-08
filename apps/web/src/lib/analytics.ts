import { track } from "@vercel/analytics";

export type AnalyticsEvent =
  | "signup_completed"
  | "enquiry_submitted"
  | "lecture_played"
  | "checkout_started"
  | "payment_succeeded";

/**
 * Dispatches an analytics event to Vercel Analytics with fallback logging
 * in local development or test runners.
 */
export function trackEvent(
  name: AnalyticsEvent,
  properties?: Record<string, string | number | boolean | null | undefined>,
) {
  try {
    if (typeof window !== "undefined") {
      track(name, properties);
    }
  } catch {
    // Silently continue if analytics script is blocked or offline
  }

  if (process.env.NODE_ENV !== "production") {
    // Helpful debug logging in development
    console.debug(`[Analytics: ${name}]`, properties);
  }
}
