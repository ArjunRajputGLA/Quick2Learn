import { db, schema, eq, sql, type DatabaseExecutor } from "@quick2learn/db";

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
}

/**
 * Enforces sliding window rate limits backed by PostgreSQL `rate_limit` table.
 * @param key Unique rate limiting identifier (e.g. `enquiry:ip:1.2.3.4` or `checkout:user:uuid`)
 * @param limit Maximum allowed requests within the time window
 * @param windowMs Time window in milliseconds
 */
export async function consumePostgresRateLimit(
  key: string,
  limit: number,
  windowMs: number,
  tx?: DatabaseExecutor,
): Promise<RateLimitResult> {
  const d = tx || db;
  const now = Date.now();

  // Run in a quick query/transaction to lock or atomically check
  const [existing] = await d
    .select()
    .from(schema.rateLimit)
    .where(eq(schema.rateLimit.key, key));

  if (!existing) {
    const id = `rl_${Math.random().toString(36).slice(2, 11)}_${now}`;
    await d
      .insert(schema.rateLimit)
      .values({
        id,
        key,
        count: 1,
        lastRequest: now,
      })
      .onConflictDoUpdate({
        target: schema.rateLimit.key,
        set: {
          count: sql`CASE WHEN (${now} - "rate_limit"."last_request") > ${windowMs} THEN 1 ELSE "rate_limit"."count" + 1 END`,
          lastRequest: sql`CASE WHEN (${now} - "rate_limit"."last_request") > ${windowMs} THEN ${now} ELSE "rate_limit"."last_request" END`,
        },
      });

    return {
      success: true,
      limit,
      remaining: Math.max(0, limit - 1),
      resetAt: now + windowMs,
    };
  }

  // If time elapsed exceeds window, reset the counter
  if (now - existing.lastRequest > windowMs) {
    await d
      .update(schema.rateLimit)
      .set({
        count: 1,
        lastRequest: now,
      })
      .where(eq(schema.rateLimit.key, key));

    return {
      success: true,
      limit,
      remaining: Math.max(0, limit - 1),
      resetAt: now + windowMs,
    };
  }

  // If within window and count exceeds limit
  if (existing.count >= limit) {
    return {
      success: false,
      limit,
      remaining: 0,
      resetAt: existing.lastRequest + windowMs,
    };
  }

  // Increment within window
  await d
    .update(schema.rateLimit)
    .set({
      count: existing.count + 1,
    })
    .where(eq(schema.rateLimit.key, key));

  return {
    success: true,
    limit,
    remaining: Math.max(0, limit - (existing.count + 1)),
    resetAt: existing.lastRequest + windowMs,
  };
}
