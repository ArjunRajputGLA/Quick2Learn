import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const cleanId = (body?.identifier || "").trim().toLowerCase();
    const cleanPassword = (body?.password || "").trim();

    if (!cleanId || !cleanPassword) {
      return NextResponse.json(
        {
          success: false,
          error: "Please enter your administrator email and password.",
        },
        { status: 400 }
      );
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
      return NextResponse.json(
        {
          success: false,
          error: "Invalid administrator credentials. Use admin@quick2learn.in / AdminPassword123",
        },
        { status: 401 }
      );
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

    const response = NextResponse.json({
      success: true,
      user: {
        id: userId,
        name,
        email,
        role,
      },
    });

    response.cookies.set("q2l_admin_session", encoded, {
      path: "/",
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 86400 * 14, // 14 days
    });

    return response;
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Internal error" },
      { status: 500 }
    );
  }
}
