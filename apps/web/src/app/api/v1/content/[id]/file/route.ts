import { getContentPresignedFileUrl } from "@/server/data/batch-content";
import { contentFileUrlResponseSchema } from "@quick2learn/shared";
import {
  apiResponse,
  checkApiRateLimits,
  handleApiError,
  requireApiSession,
  getEffectiveUserRole,
} from "../../../utils";

export async function GET(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { session, errorResponse } = await requireApiSession(req);
    if (errorResponse) return errorResponse;

    const rateLimitError = await checkApiRateLimits(req, session.user.id);
    if (rateLimitError) return rateLimitError;

    const { id } = await props.params;

    // Get user's effective role
    const role = await getEffectiveUserRole(session.user.id);
    const authUser = {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      role,
    };

    const data = await getContentPresignedFileUrl(authUser, id);
    const validated = contentFileUrlResponseSchema.parse(data);

    return apiResponse.success(validated);
  } catch (err) {
    return handleApiError(err);
  }
}
