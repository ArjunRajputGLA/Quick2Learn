import { joinLiveSession } from "@/server/data/live-sessions";
import { liveJoinResponseSchema } from "@quick2learn/shared";
import {
  apiResponse,
  checkApiRateLimits,
  handleApiError,
  getApiSession,
} from "../../../utils";

export async function POST(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getApiSession(req);
    const userId = session?.user?.id;

    if (!userId) {
      return apiResponse.unauthorized("Authentication required to join live session");
    }

    const rateLimitError = await checkApiRateLimits(req, userId);
    if (rateLimitError) return rateLimitError;

    const { id } = await props.params;
    const result = await joinLiveSession(userId, id);

    const validated = liveJoinResponseSchema.parse(result);
    return apiResponse.success(validated);
  } catch (err) {
    return handleApiError(err);
  }
}
