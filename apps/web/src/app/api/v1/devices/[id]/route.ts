import { unregisterDeviceToken } from "@/server/data";
import {
  apiResponse,
  checkApiRateLimits,
  handleApiError,
  requireApiSession,
} from "../../utils";

export async function DELETE(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { session, errorResponse } = await requireApiSession(req);
    if (errorResponse) return errorResponse;

    const rateLimitError = await checkApiRateLimits(req, session.user.id);
    if (rateLimitError) return rateLimitError;

    const { id } = await props.params;
    if (!id) {
      return apiResponse.badRequest("Device token ID is required");
    }

    const result = await unregisterDeviceToken(session.user.id, id);
    return apiResponse.success(result);
  } catch (err) {
    return handleApiError(err);
  }
}
