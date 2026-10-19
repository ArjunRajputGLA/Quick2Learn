import { NextRequest } from "next/server";
import { requireApiSession, getEffectiveUserRole, apiResponse, handleApiError, checkApiRateLimits } from "../../../utils";
import { getAttemptResult } from "@/server/data/tests";

export async function GET(
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
    const result = await getAttemptResult(id, session.user.id, role);

    return apiResponse.success(result);
  } catch (err) {
    return handleApiError(err);
  }
}
