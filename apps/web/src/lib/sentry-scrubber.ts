/**
 * Sanitizes and scrubs all Personally Identifiable Information (PII)
 * before any telemetry or error event is forwarded to Sentry.
 */

const SENSITIVE_KEY_PATTERNS = [
  "password",
  "secret",
  "token",
  "otp",
  "code",
  "phone",
  "mobile",
  "signature",
  "razorpay",
  "cookie",
  "authorization",
  "email",
  "card",
];

const EMAIL_REGEX = /[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+/g;
const INDIAN_PHONE_REGEX = /(?:\+?91[\s-]?)?[6-9]\d{9}\b/g;

export function scrubString(str: string): string {
  if (!str) return str;
  return str
    .replace(EMAIL_REGEX, "[EMAIL_REDACTED]")
    .replace(INDIAN_PHONE_REGEX, "[PHONE_REDACTED]");
}

export function scrubData(data: unknown): unknown {
  if (!data) return data;
  if (typeof data === "string") {
    return scrubString(data);
  }
  if (Array.isArray(data)) {
    return data.map((item) => scrubData(item));
  }
  if (typeof data === "object") {
    const copy: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      const lowerKey = key.toLowerCase();
      const isSensitive = SENSITIVE_KEY_PATTERNS.some((pattern) =>
        lowerKey.includes(pattern),
      );

      if (isSensitive) {
        copy[key] = "[REDACTED]";
      } else if (typeof value === "object" && value !== null) {
        copy[key] = scrubData(value);
      } else if (typeof value === "string") {
        copy[key] = scrubString(value);
      } else {
        copy[key] = value;
      }
    }
    return copy;
  }
  return data;
}

export interface GenericSentryEvent {
  user?: {
    id?: string;
    ip_address?: string;
    email?: string;
    username?: string;
    [key: string]: unknown;
  };
  request?: {
    headers?: Record<string, string>;
    data?: unknown;
    query_string?: unknown;
    [key: string]: unknown;
  };
  breadcrumbs?: Array<{
    message?: string;
    data?: unknown;
    [key: string]: unknown;
  }>;
  message?: string;
  [key: string]: unknown;
}

export function beforeSendScrubber<T extends GenericSentryEvent>(event: T): T {
  // 1. Scrub User identifiers
  if (event.user) {
    event.user.ip_address = "[REDACTED]";
    if (event.user.email) event.user.email = "[REDACTED]";
    if (event.user.username) event.user.username = "[REDACTED]";
  }

  // 2. Scrub Request Headers
  if (event.request?.headers) {
    const sensitiveHeaders = [
      "authorization",
      "cookie",
      "set-cookie",
      "x-razorpay-signature",
      "x-forwarded-for",
      "x-real-ip",
    ];
    for (const header of sensitiveHeaders) {
      if (event.request.headers[header]) {
        event.request.headers[header] = "[REDACTED]";
      }
    }
  }

  // 3. Scrub Request Payload
  if (event.request?.data) {
    event.request.data = scrubData(event.request.data);
  }

  // 4. Scrub Breadcrumbs
  if (Array.isArray(event.breadcrumbs)) {
    for (const bc of event.breadcrumbs) {
      if (bc.message) {
        bc.message = scrubString(bc.message);
      }
      if (bc.data) {
        bc.data = scrubData(bc.data);
      }
    }
  }

  // 5. Scrub message text
  if (event.message) {
    event.message = scrubString(event.message);
  }

  return event;
}
