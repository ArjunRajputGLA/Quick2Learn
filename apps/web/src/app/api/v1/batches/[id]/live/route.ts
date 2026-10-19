import { getBatchLiveSessions } from "@/server/data/live-sessions";
import { batchLiveResponseSchema } from "@quick2learn/shared";
import {
  apiResponse,
  checkApiRateLimits,
  handleApiError,
  getApiSession,
} from "../../../utils";

export async function GET(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getApiSession(req);
    const userId = session?.user?.id || null;

    const rateLimitError = await checkApiRateLimits(req, userId);
    if (rateLimitError) return rateLimitError;

    const { id } = await props.params;
    const data = await getBatchLiveSessions(userId, id);

    const validated = batchLiveResponseSchema.parse(data);
    return apiResponse.success(validated);
  } catch (err) {
    return handleApiError(err);
  }
}
