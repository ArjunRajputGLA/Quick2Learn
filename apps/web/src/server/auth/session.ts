import { cache } from "react";
import { headers, cookies } from "next/headers";
import { redirect } from "next/navigation";
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
    role?: UserRole;
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
    user: {
      ...session.user,
      role,
    },
    profile: profile || null,
    role,
  };
});

/**
 * Returns the authenticated Admin/Faculty session.
 * Checks for dedicated q2l_admin_session cookie or Better Auth staff session.
 */
export const getAdminSession = cache(async (): Promise<CurrentUser | null> => {
  // 1. Check dedicated admin session cookie
  try {
    const cookieStore = await cookies();
    const adminCookie = cookieStore.get("q2l_admin_session")?.value;
    if (adminCookie) {
      const decodedJson = Buffer.from(adminCookie, "base64").toString("utf-8");
      const decoded = JSON.parse(decodedJson);
      if (decoded && (decoded.role === "admin" || decoded.role === "teacher")) {
        const role: UserRole = decoded.role;
        const name = decoded.name || (role === "admin" ? "Dinesh Singh Rajput" : "Mrs. Namita Singh Rajput");
        const email = decoded.email || (role === "admin" ? "admin@quick2learn.in" : "teacher@quick2learn.in");
        const userId = decoded.userId || (role === "admin" ? "usr-admin-dinesh" : "usr-teacher-namita");

        return {
          user: {
            id: userId,
            name,
            email,
            emailVerified: true,
            createdAt: new Date(decoded.createdAt || "2026-01-01"),
            updatedAt: new Date(decoded.createdAt || "2026-01-01"),
            role,
          },
          profile: {
            id: role === "admin" ? "a0000000-0000-0000-0000-000000000099" : "a0000000-0000-0000-0000-000000000098",
            userId,
            fullName: name,
            phone: "+91 76688 75809",
            role,
            classLevel: 12,
            board: "cbse",
            school: "Quick2Learn Mathura",
            parentName: null,
            parentPhone: null,
            city: "Mathura",
            avatarUrl: null,
            onboardedAt: new Date("2026-01-01"),
            createdAt: new Date("2026-01-01"),
            updatedAt: new Date("2026-01-01"),
          },
          role,
        };
      }
    }
  } catch (err) {
    console.error("Error reading admin session cookie:", err);
  }

  // 2. Check Better Auth staff session
  try {
    const current = await getCurrentUser();
    if (current && (current.role === "admin" || current.role === "teacher")) {
      return current;
    }
  } catch {}

  return null;
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
 * Redirects to /admin (login form) if not authenticated as admin/teacher.
 */
export async function requireRole(
  allowedRoles: UserRole | UserRole[]
): Promise<CurrentUser> {
  const adminSession = await getAdminSession();
  const allowed = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  if (!adminSession) {
    redirect("/admin");
  }

  if (!allowed.includes(adminSession.role)) {
    redirect("/admin");
  }

  return adminSession;
}

