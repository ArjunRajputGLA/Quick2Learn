import { listUserNotifications } from "@/server/data";
import { paginatedNotificationsSchema } from "@quick2learn/shared";
import {
  apiResponse,
  checkApiRateLimits,
  handleApiError,
  requireApiSession,
} from "../utils";

export async function GET(req: Request) {
  try {
    const { session, errorResponse } = await requireApiSession(req);
    if (errorResponse) return errorResponse;

    const rateLimitError = await checkApiRateLimits(req, session.user.id);
    if (rateLimitError) return rateLimitError;

    const { searchParams } = new URL(req.url);
    const cursor = searchParams.get("cursor") || undefined;
    const limitRaw = searchParams.get("limit");
    const limit = limitRaw ? parseInt(limitRaw, 10) : undefined;

    const result = await listUserNotifications(session.user.id, {
      cursor,
      limit,
    });

    const validated = paginatedNotificationsSchema.parse(result);
    return apiResponse.success(validated);
  } catch (err) {
    return handleApiError(err);
  }
}
