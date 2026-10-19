import { db, schema, eq, type DatabaseExecutor } from "@quick2learn/db";
import { assert, isAdmin, type AuthUser } from "../authz";

function stripPlaceholders<T>(val: T): T {
  if (typeof val === "string") {
    return val.replace(/\s*\[PLACEHOLDER\]/gi, "").trim() as unknown as T;
  }
  if (Array.isArray(val)) {
    return val.map((item) => stripPlaceholders(item)) as unknown as T;
  }
  if (val !== null && typeof val === "object") {
    const sanitized: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(val)) {
      sanitized[k] = stripPlaceholders(v);
    }
    return sanitized as unknown as T;
  }
  return val;
}

import { DEFAULT_SITE_SETTINGS } from "./fallbacks";

export async function getSetting<T = unknown>(key: string, tx?: DatabaseExecutor): Promise<T | null> {
  try {
    const d = tx || db;
    const [row] = await d.select().from(schema.siteSettings).where(eq(schema.siteSettings.key, key));
    if (row && row.value !== undefined) {
      return stripPlaceholders(row.value) as T;
    }
  } catch (err) {
    console.warn(`Failed to fetch setting ${key} from database, using static fallback:`, err);
  }
  return (DEFAULT_SITE_SETTINGS[key] as T) ?? null;
}

export async function getAllSettings(tx?: DatabaseExecutor): Promise<Record<string, unknown>> {
  const result: Record<string, unknown> = { ...DEFAULT_SITE_SETTINGS };
  try {
    const d = tx || db;
    const rows = await d.select().from(schema.siteSettings);
    for (const r of rows) {
      result[r.key] = stripPlaceholders(r.value);
    }
  } catch (err) {
    console.warn("Failed to fetch settings from database, using static defaults:", err);
  }
  return result;
}

export async function updateSetting(user: AuthUser, key: string, value: unknown, tx?: DatabaseExecutor) {
  assert(isAdmin(user), "Only administrators can update site configuration.");
  const d = tx || db;
  const [updated] = await d
    .insert(schema.siteSettings)
    .values({ key, value })
    .onConflictDoUpdate({
      target: schema.siteSettings.key,
      set: { value },
    })
    .returning();
  return updated;
}

export async function getAppConfig(tx?: DatabaseExecutor) {
  const customConfig = await getSetting<{
    minSupportedVersion?: string;
    latestVersion?: string;
    maintenance?: boolean;
    featureFlags?: Record<string, boolean>;
  }>("mobile_app_config", tx);

  return {
    minSupportedVersion: customConfig?.minSupportedVersion ?? "1.0.0",
    latestVersion: customConfig?.latestVersion ?? "1.0.0",
    maintenance: customConfig?.maintenance ?? false,
    featureFlags: {
      enablePushNotifications: true,
      enableOfflineDownloads: false,
      enableParentPortal: true,
      enablePhoneLogin:
        process.env.AUTH_PHONE_ENABLED === "true" ||
        process.env.NODE_ENV !== "production",
      inAppPayments: false, // Off by default to comply with Google Play consumption-only policy in India
      ...(customConfig?.featureFlags ?? {}),
    },
  };
}

