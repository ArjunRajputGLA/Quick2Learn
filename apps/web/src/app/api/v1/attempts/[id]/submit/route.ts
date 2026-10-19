import { NextRequest } from "next/server";
import { requireApiSession, apiResponse, handleApiError, checkApiRateLimits } from "../../../utils";
import { submitTestAttempt } from "@/server/data/tests";

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
    const result = await submitTestAttempt(id, session.user.id, false);

    return apiResponse.success(result);
  } catch (err) {
    return handleApiError(err);
  }
}
