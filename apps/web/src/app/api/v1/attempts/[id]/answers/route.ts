import { NextRequest } from "next/server";
import { requireApiSession, apiResponse, handleApiError, checkApiRateLimits } from "../../../utils";
import { saveAttemptAnswers } from "@/server/data/tests";
import { batchSaveAnswersInputSchema } from "@quick2learn/shared";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { session, errorResponse } = await requireApiSession(req);
    if (errorResponse) return errorResponse;

    const rateLimitResponse = await checkApiRateLimits(req, session.user.id);
    if (rateLimitResponse) return rateLimitResponse;

    const { id } = await params;
    const body = await req.json();
    const parsed = batchSaveAnswersInputSchema.parse(body);

    const result = await saveAttemptAnswers(id, session.user.id, parsed.answers);

    return apiResponse.success(result);
  } catch (err) {
    return handleApiError(err);
  }
}
