import { db, schema, eq } from "@quick2learn/db";

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetMs: number;
}

/**
 * Server-side rate limiter using PostgreSQL `rate_limit` table.
 * Enforces `limit` requests per `windowMs` window for a unique `key`.
 */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): Promise<RateLimitResult> {
  const now = Date.now();

  return await db.transaction(async (tx) => {
    const [existing] = await tx
      .select()
      .from(schema.rateLimit)
      .where(eq(schema.rateLimit.key, key))
      .for("update");

    if (!existing) {
      const id = `rl_${Math.random().toString(36).substring(2, 11)}_${now}`;
      await tx.insert(schema.rateLimit).values({
        id,
        key,
        count: 1,
        lastRequest: now,
      });
      return { success: true, remaining: limit - 1, resetMs: windowMs };
    }

    const elapsed = now - existing.lastRequest;
    if (elapsed > windowMs) {
      // Window expired, reset window and count
      await tx
        .update(schema.rateLimit)
        .set({ count: 1, lastRequest: now })
        .where(eq(schema.rateLimit.key, key));
      return { success: true, remaining: limit - 1, resetMs: windowMs };
    }

    if (existing.count >= limit) {
      // Limit exceeded
      const remainingReset = Math.max(0, windowMs - elapsed);
      return { success: false, remaining: 0, resetMs: remainingReset };
    }

    // Increment count
    const nextCount = existing.count + 1;
    await tx
      .update(schema.rateLimit)
      .set({ count: nextCount })
      .where(eq(schema.rateLimit.key, key));

    return {
      success: true,
      remaining: limit - nextCount,
      resetMs: windowMs - elapsed,
    };
  });
}
