import * as Sentry from '@sentry/react-native';
import Constants from 'expo-constants';

const SENSITIVE_KEY_PATTERNS = [
  'password',
  'secret',
  'token',
  'otp',
  'code',
  'phone',
  'mobile',
  'signature',
  'razorpay',
  'cookie',
  'authorization',
  'email',
  'name',
  'studentname',
  'parentname',
];

const EMAIL_REGEX = /[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+/g;
const INDIAN_PHONE_REGEX = /(?:\+?91[\s-]?)?[6-9]\d{9}\b/g;

export function scrubString(str: string): string {
  if (!str) return str;
  return str
    .replace(EMAIL_REGEX, '[EMAIL_REDACTED]')
    .replace(INDIAN_PHONE_REGEX, '[PHONE_REDACTED]');
}

export function scrubData(data: unknown): unknown {
  if (!data) return data;
  if (typeof data === 'string') {
    return scrubString(data);
  }
  if (Array.isArray(data)) {
    return data.map((item) => scrubData(item));
  }
  if (typeof data === 'object') {
    const copy: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      const lowerKey = key.toLowerCase();
      const isSensitive = SENSITIVE_KEY_PATTERNS.some((pattern) =>
        lowerKey.includes(pattern)
      );

      if (isSensitive) {
        copy[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null) {
        copy[key] = scrubData(value);
      } else if (typeof value === 'string') {
        copy[key] = scrubString(value);
      } else {
        copy[key] = value;
      }
    }
    return copy;
  }
  return data;
}

export function scrubBreadcrumb(breadcrumb: Sentry.Breadcrumb): Sentry.Breadcrumb | null {
  if (breadcrumb.message) {
    breadcrumb.message = scrubString(breadcrumb.message);
  }
  if (breadcrumb.data) {
    breadcrumb.data = scrubData(breadcrumb.data) as Record<string, unknown>;
  }
  return breadcrumb;
}

export function scrubEvent(event: Sentry.ErrorEvent): Sentry.ErrorEvent {
  // Strip user PII (keep non-identifying user ID only)
  if (event.user) {
    event.user = {
      id: event.user.id || 'anonymous_user',
    };
  }

  // Scrub breadcrumbs
  if (event.breadcrumbs) {
    event.breadcrumbs = event.breadcrumbs.map((b) => scrubBreadcrumb(b) || b);
  }

  // Scrub extra data
  if (event.extra) {
    event.extra = scrubData(event.extra) as Record<string, unknown>;
  }

  // Scrub message / exception values
  if (event.message) {
    event.message = scrubString(event.message);
  }
  if (event.exception?.values) {
    event.exception.values.forEach((v) => {
      if (v.value) v.value = scrubString(v.value);
    });
  }

  return event;
}

const SENTRY_DSN =
  process.env.EXPO_PUBLIC_SENTRY_DSN ||
  'https://00000000000000000000000000000000@o0.ingest.sentry.io/0';

export function initSentry() {
  const appVersion = Constants.expoConfig?.version || '1.0.0';

  Sentry.init({
    dsn: SENTRY_DSN,
    enabled: true,
    release: `in.quick2learn.app@${appVersion}`,
    dist: '1',
    environment: process.env.NODE_ENV || 'production',
    enableAutoSessionTracking: true,
    sessionTrackingIntervalMillis: 30000,
    beforeBreadcrumb: (breadcrumb) => scrubBreadcrumb(breadcrumb),
    beforeSend: (event) => scrubEvent(event),
  });
}

/**
 * Triggers a controlled test crash with a readable stack trace
 * to verify Sentry source map symbolication in dev/test builds.
 */
export function triggerTestCrash() {
  console.log('[Sentry] Deliberately triggering verified test crash for error reporting validation...');
  const error = new Error('Quick2Learn Verification Test Crash: Sentry symbolication and stack trace check');
  error.name = 'TestCrashError';
  Sentry.captureException(error);
  throw error;
}

export { Sentry };
