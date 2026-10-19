import { getBatchAnnouncements } from "@/server/data/batches";
import { batchAnnouncementsResponseSchema } from "@quick2learn/shared";
import {
  apiResponse,
  checkApiRateLimits,
  handleApiError,
  requireApiSession,
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
    const data = await getBatchAnnouncements(id);

    const validated = batchAnnouncementsResponseSchema.parse(data);
    return apiResponse.success(validated);
  } catch (err) {
    return handleApiError(err);
  }
}
