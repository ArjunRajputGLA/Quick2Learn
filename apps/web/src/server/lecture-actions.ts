"use server";

import { getSession } from "./auth/session";
import { recordLectureView } from "./data/videos";
import type { UserRole } from "@quick2learn/shared";

/**
 * Server action invoked when a student clicks play on a video.
 * If the user is logged in, securely records a lecture_views row.
 */
export async function recordLectureViewAction(videoId: string) {
  try {
    if (!videoId) return { success: false, reason: "invalid_id" };

    const session = await getSession();
    if (!session?.user?.id) {
      return { success: false, reason: "unauthenticated" };
    }

    const role = ((session.user as Record<string, unknown>).role as UserRole) || "student";
    const recorded = await recordLectureView(
      {
        id: session.user.id,
        role,
        email: session.user.email,
        name: session.user.name,
      },
      videoId,
    );

    if (!recorded) {
      return { success: false, reason: "record_failed" };
    }

    return {
      success: true,
      id: recorded.id,
      viewedAt: recorded.viewedAt,
    };
  } catch (err) {
    console.warn("Could not record lecture view:", err);
    return { success: false, error: String(err) };
  }
}
