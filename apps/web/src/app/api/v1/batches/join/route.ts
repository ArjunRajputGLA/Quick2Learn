import { requestJoinBatch } from "@/server/data/batches";
import { batchJoinInputSchema, batchJoinResponseSchema } from "@quick2learn/shared";
import {
  apiResponse,
  checkApiRateLimits,
  handleApiError,
  requireApiSession,
} from "../../utils";

export async function POST(req: Request) {
  try {
    const { session, errorResponse } = await requireApiSession(req);
    if (errorResponse) return errorResponse;

    const rateLimitError = await checkApiRateLimits(req, session.user.id);
    if (rateLimitError) return rateLimitError;

    const body = await req.json();
    const { code } = batchJoinInputSchema.parse(body);

    const result = await requestJoinBatch(session.user.id, code);
    const validated = batchJoinResponseSchema.parse(result);

    return apiResponse.success(validated);
  } catch (err) {
    return handleApiError(err);
  }
}
