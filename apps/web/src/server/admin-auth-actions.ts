"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

export interface AdminLoginResult {
  success: boolean;
  error?: string;
  user?: {
    id: string;
    name: string;
    email: string;
    role: "admin" | "teacher";
  };
}

export async function adminLoginAction(
  identifierInput: string,
  passwordInput: string
): Promise<AdminLoginResult> {
  const cleanId = (identifierInput || "").trim().toLowerCase();
  const cleanPassword = (passwordInput || "").trim();

  if (!cleanId || !cleanPassword) {
    return {
      success: false,
      error: "Please enter your administrator email and password.",
    };
  }

  // 1. Check Admin Credentials (same as mobile app)
  const isAdminMatch =
    (cleanId === "admin@quick2learn.in" || cleanId === "admin" || cleanId === "dinesh@quick2learn.in") &&
    (cleanPassword === "AdminPassword123" ||
      cleanPassword === "admin123" ||
      cleanPassword === "Admin@123" ||
      cleanPassword === "quick2learn123");

  // 2. Check Teacher Credentials (same as mobile app)
  const isTeacherMatch =
    (cleanId === "teacher@quick2learn.in" || cleanId === "teacher" || cleanId === "namita@quick2learn.in") &&
    (cleanPassword === "TeacherPassword123" ||
      cleanPassword === "teacher123" ||
      cleanPassword === "Teacher@123");

  if (!isAdminMatch && !isTeacherMatch) {
    return {
      success: false,
      error: "Invalid administrator credentials. Use admin@quick2learn.in / AdminPassword123",
    };
  }

  const role: "admin" | "teacher" = isAdminMatch ? "admin" : "teacher";
  const name = isAdminMatch ? "Dinesh Singh Rajput" : "Mrs. Namita Singh Rajput";
  const email = isAdminMatch ? "admin@quick2learn.in" : "teacher@quick2learn.in";
  const userId = isAdminMatch ? "usr-admin-dinesh" : "usr-teacher-namita";

  const sessionPayload = {
    userId,
    name,
    email,
    role,
    createdAt: Date.now(),
  };

  const encoded = Buffer.from(JSON.stringify(sessionPayload)).toString("base64");

  const cookieStore = await cookies();
  cookieStore.set("q2l_admin_session", encoded, {
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 86400 * 14, // 14 days
  });

  return {
    success: true,
    user: {
      id: userId,
      name,
      email,
      role,
    },
  };
}

export async function adminLogoutAction(): Promise<{ success: boolean }> {
  const cookieStore = await cookies();
  cookieStore.delete("q2l_admin_session");
  revalidatePath("/admin");
  return { success: true };
}
