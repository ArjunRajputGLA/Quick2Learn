import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { db, schema, eq } from "@quick2learn/db";
import { auth } from "@/server/auth/auth";
import { consumePostgresRateLimit } from "@/server/data/rate-limit";
import { ForbiddenError, NotFoundError, UnauthorizedError } from "@/server/authz";

/**
 * Returns the effective role of a user from profiles table.
 */
export async function getEffectiveUserRole(userId: string): Promise<string> {
  const [profile] = await db
    .select({ role: schema.profiles.role })
    .from(schema.profiles)
    .where(eq(schema.profiles.userId, userId))
    .limit(1);

  return profile?.role || "student";
}

export const apiResponse = {
  success<T>(data: T, status = 200) {
    return NextResponse.json(data, { status });
  },

  error(code: string, message: string, status = 400, details?: unknown) {
    return NextResponse.json(
      {
        error: {
          code,
          message,
          ...(details !== undefined ? { details } : {}),
        },
      },
      { status }
    );
  },

  unauthorized(message = "Unauthorized: Authentication required.") {
    return this.error("UNAUTHORIZED", message, 401);
  },

  forbidden(message = "Forbidden: You do not have permission to perform this action.") {
    return this.error("FORBIDDEN", message, 403);
  },

  notFound(message = "Not Found: The requested resource does not exist.") {
    return this.error("NOT_FOUND", message, 404);
  },

  badRequest(message = "Bad Request: Invalid input provided.", details?: unknown) {
    return this.error("BAD_REQUEST", message, 400, details);
  },

  rateLimited(message = "Rate limit exceeded. Please try again later.") {
    return this.error("RATE_LIMIT_EXCEEDED", message, 429);
  },

  serverError(message = "Internal server error. Please try again later.") {
    return this.error("INTERNAL_SERVER_ERROR", message, 500);
  },
};

/**
 * Extracts client IP from request headers.
 */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return req.headers.get("x-real-ip") || "127.0.0.1";
}

/**
 * Validates Better Auth session using request headers.
 */
export async function getApiSession(req: Request) {
  try {
    const res = await auth.api.getSession({
      headers: req.headers,
    });
    return res;
  } catch (err) {
    console.error("[getApiSession] Error reading session:", err);
    return null;
  }
}

/**
 * Requires a valid session, otherwise returns a 401 response.
 */
export async function requireApiSession(req: Request) {
  const session = await getApiSession(req);
  if (!session?.user) {
    return {
      session: null,
      errorResponse: apiResponse.unauthorized(),
    };
  }
  return {
    session,
    errorResponse: null,
  };
}

/**
 * Checks per-IP and per-user Postgres rate limits.
 */
export async function checkApiRateLimits(
  req: Request,
  userId?: string | null
): Promise<NextResponse | null> {
  const ip = getClientIp(req);

  // 1. Per-IP rate limit: 120 requests / 60 seconds
  const ipResult = await consumePostgresRateLimit(`api:ip:${ip}`, 120, 60_000);
  if (!ipResult.success) {
    return apiResponse.rateLimited("Per-IP rate limit exceeded. Please slow down.");
  }

  // 2. Per-User rate limit: 200 requests / 60 seconds (if user is authenticated)
  if (userId) {
    const userResult = await consumePostgresRateLimit(`api:user:${userId}`, 200, 60_000);
    if (!userResult.success) {
      return apiResponse.rateLimited("Per-user rate limit exceeded. Please slow down.");
    }
  }

  return null;
}

/**
 * Unified error handler for API v1 route handlers.
 */
export function handleApiError(err: unknown): NextResponse {
  if (err instanceof UnauthorizedError) {
    return apiResponse.unauthorized(err.message);
  }
  if (err instanceof ForbiddenError) {
    return apiResponse.forbidden(err.message);
  }
  if (err instanceof NotFoundError) {
    return apiResponse.notFound(err.message);
  }
  if (err instanceof ZodError) {
    return apiResponse.badRequest("Validation failed", err.errors);
  }

  console.error("[API v1 Error]:", err);
  return apiResponse.serverError(
    err instanceof Error ? err.message : "An unexpected error occurred"
  );
}
