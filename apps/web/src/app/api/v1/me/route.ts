import { getUserAndProfile, updateUserProfile } from "@/server/data";
import { meResponseSchema, updateMeSchema } from "@quick2learn/shared";
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

    const me = await getUserAndProfile(session.user.id);
    const validated = meResponseSchema.parse(me);

    return apiResponse.success(validated);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(req: Request) {
  try {
    const { session, errorResponse } = await requireApiSession(req);
    if (errorResponse) return errorResponse;

    const rateLimitError = await checkApiRateLimits(req, session.user.id);
    if (rateLimitError) return rateLimitError;

    const body = await req.json();
    const validatedInput = updateMeSchema.parse(body);

    const updated = await updateUserProfile(session.user.id, validatedInput);
    const validated = meResponseSchema.parse(updated);

    return apiResponse.success(validated);
  } catch (err) {
    return handleApiError(err);
  }
}
