import { saveProgressBatch } from "@/server/data/learn";
import {
  progressBatchInputSchema,
  progressBatchResponseSchema,
} from "@quick2learn/shared";
import {
  apiResponse,
  checkApiRateLimits,
  handleApiError,
  requireApiSession,
} from "../utils";

export async function POST(req: Request) {
  try {
    const { session, errorResponse } = await requireApiSession(req);
    if (errorResponse) return errorResponse;

    const rateLimitError = await checkApiRateLimits(req, session.user.id);
    if (rateLimitError) return rateLimitError;

    const body = await req.json();
    const { updates } = progressBatchInputSchema.parse(body);

    const result = await saveProgressBatch(session.user.id, updates);
    const validated = progressBatchResponseSchema.parse(result);

    return apiResponse.success(validated);
  } catch (err) {
    return handleApiError(err);
  }
}
