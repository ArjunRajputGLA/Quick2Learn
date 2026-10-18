import { getUnreadNotificationsCount } from "@/server/data";
import { unreadCountResponseSchema } from "@quick2learn/shared";
import {
  apiResponse,
  checkApiRateLimits,
  handleApiError,
  requireApiSession,
} from "../../utils";

export async function GET(req: Request) {
  try {
    const { session, errorResponse } = await requireApiSession(req);
    if (errorResponse) return errorResponse;

    const rateLimitError = await checkApiRateLimits(req, session.user.id);
    if (rateLimitError) return rateLimitError;

    const result = await getUnreadNotificationsCount(session.user.id);
    const validated = unreadCountResponseSchema.parse(result);

    return apiResponse.success(validated);
  } catch (err) {
    return handleApiError(err);
  }
}
