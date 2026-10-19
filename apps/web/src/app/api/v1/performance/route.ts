import { NextRequest } from "next/server";
import { requireApiSession, getEffectiveUserRole, apiResponse, handleApiError, checkApiRateLimits } from "../utils";
import { getStudentPerformance } from "@/server/data/tests";

export async function GET(req: NextRequest) {
  try {
    const { session, errorResponse } = await requireApiSession(req);
    if (errorResponse) return errorResponse;

    const rateLimitResponse = await checkApiRateLimits(req, session.user.id);
    if (rateLimitResponse) return rateLimitResponse;

    const { searchParams } = new URL(req.url);
    const targetStudentId = searchParams.get("studentId") || session.user.id;

    const role = await getEffectiveUserRole(session.user.id);
    const performance = await getStudentPerformance(targetStudentId, session.user.id, role);

    return apiResponse.success(performance);
  } catch (err) {
    return handleApiError(err);
  }
}
