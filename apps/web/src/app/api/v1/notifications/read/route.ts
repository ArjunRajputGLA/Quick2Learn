import { markNotificationsRead } from "@/server/data";
import {
  markNotificationsReadSchema,
  markNotificationsReadResponseSchema,
} from "@quick2learn/shared";
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
    const validatedInput = markNotificationsReadSchema.parse(body);

    const result = await markNotificationsRead(session.user.id, validatedInput);
    const validated = markNotificationsReadResponseSchema.parse(result);

    return apiResponse.success(validated);
  } catch (err) {
    return handleApiError(err);
  }
}
