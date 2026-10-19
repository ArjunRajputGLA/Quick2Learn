import { NextRequest } from "next/server";
import { requireApiSession, getEffectiveUserRole, apiResponse, handleApiError, checkApiRateLimits } from "../utils";
import { getAvailableTests } from "@/server/data/tests";

export async function GET(req: NextRequest) {
  try {
    const { session, errorResponse } = await requireApiSession(req);
    if (errorResponse) return errorResponse;

    const rateLimitResponse = await checkApiRateLimits(req, session.user.id);
    if (rateLimitResponse) return rateLimitResponse;

    const { searchParams } = new URL(req.url);
    const batchId = searchParams.get("batchId") || undefined;
    const status = searchParams.get("status") || undefined;
    const studentId = searchParams.get("studentId") || undefined;

    const role = await getEffectiveUserRole(session.user.id);
    const tests = await getAvailableTests(session.user.id, role, { batchId, status, studentId });

    return apiResponse.success({ tests });
  } catch (err) {
    return handleApiError(err);
  }
}
