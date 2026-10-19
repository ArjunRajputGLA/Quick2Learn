import { NextRequest } from "next/server";
import { requireApiSession, getEffectiveUserRole, apiResponse, handleApiError, checkApiRateLimits } from "../../../utils";
import { startTestAttempt } from "@/server/data/tests";
import { ForbiddenError } from "@/server/authz";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { session, errorResponse } = await requireApiSession(req);
    if (errorResponse) return errorResponse;

    const rateLimitResponse = await checkApiRateLimits(req, session.user.id);
    if (rateLimitResponse) return rateLimitResponse;

    const { id } = await params;
    const role = await getEffectiveUserRole(session.user.id);
    if (role === "parent") {
      throw new ForbiddenError("Parents cannot start or attempt tests.");
    }
    const isTeacherPreview = role === "admin" || role === "teacher";

    const attemptData = await startTestAttempt(id, session.user.id, isTeacherPreview);

    return apiResponse.success(attemptData, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
