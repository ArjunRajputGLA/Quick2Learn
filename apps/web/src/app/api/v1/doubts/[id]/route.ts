import { NextRequest } from "next/server";
import {
  requireApiSession,
  getEffectiveUserRole,
  apiResponse,
  handleApiError,
  checkApiRateLimits,
} from "../../utils";
import { getDoubtThread } from "@/server/data/doubts";

/**
 * GET /api/v1/doubts/:id
 * Get full doubt thread with messages, author details, source context and presigned URLs.
 * Strictly forbidden if student tries to access another student's doubt.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { session, errorResponse } = await requireApiSession(req);
    if (errorResponse) return errorResponse;

    const rateLimitResponse = await checkApiRateLimits(req, session.user.id);
    if (rateLimitResponse) return rateLimitResponse;

    const role = await getEffectiveUserRole(session.user.id);
    const authUser = {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      role,
    };

    const thread = await getDoubtThread(authUser, id);
    return apiResponse.success(thread);
  } catch (err) {
    return handleApiError(err);
  }
}
