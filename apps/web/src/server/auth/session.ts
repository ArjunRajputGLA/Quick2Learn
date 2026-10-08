import { cache } from "react";
import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { auth } from "./auth";
import { db, profiles, eq, type Profile, type UserRole } from "@quick2learn/db";

export interface CurrentUser {
  user: {
    id: string;
    email: string;
    name: string;
    image?: string | null;
    emailVerified: boolean;
    createdAt: Date;
    updatedAt: Date;
  };
  profile: Profile | null;
  role: UserRole;
}

/**
 * Retrieves the Better Auth session for the current request.
 * Deduplicated per request using React cache().
 */
export const getSession = cache(async () => {
  const reqHeaders = await headers();
  const session = await auth.api.getSession({
    headers: reqHeaders,
  });
  return session;
});

/**
 * Returns current user, profile, and role.
 * Deduplicated per request using React cache().
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const session = await getSession();
  if (!session?.user) {
    return null;
  }

  // Fetch student/staff profile from DB
  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.userId, session.user.id))
    .limit(1);

  const role: UserRole = profile?.role ?? "student";

  return {
    user: session.user,
    profile: profile || null,
    role,
  };
});

/**
 * Ensures user is authenticated; redirects to /login if not.
 */
export async function requireUser(nextUrl?: string): Promise<CurrentUser> {
  const current = await getCurrentUser();
  if (!current) {
    const loginUrl = nextUrl ? `/login?next=${encodeURIComponent(nextUrl)}` : "/login";
    redirect(loginUrl);
  }
  return current;
}

/**
 * Ensures user is authenticated and onboarded.
 * Redirects to /onboarding if onboarded_at is null.
 */
export async function requireOnboardedUser(nextUrl?: string): Promise<CurrentUser> {
  const current = await requireUser(nextUrl);
  if (!current.profile?.onboardedAt) {
    redirect("/onboarding");
  }
  return current;
}

/**
 * Requires the user to have one of the allowed roles ('admin' | 'teacher').
 * Returns 404 (notFound) if unauthorized, preserving security through obscurity.
 */
export async function requireRole(
  allowedRoles: UserRole | UserRole[]
): Promise<CurrentUser> {
  const current = await requireUser();
  const allowed = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  if (!allowed.includes(current.role)) {
    notFound();
  }

  return current;
}
