import { NextRequest } from "next/server";
import { endLiveSession } from "@/server/data/live-sessions";
import {
  apiResponse,
  checkApiRateLimits,
  handleApiError,
  requireStaffApi,
} from "../../../../utils";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { session, errorResponse } = await requireStaffApi(req);
    if (errorResponse) return errorResponse;

    const rateLimitError = await checkApiRateLimits(req, session.user.id);
    if (rateLimitError) return rateLimitError;

    let recordingYoutubeId: string | undefined = undefined;
    try {
      const body = await req.json();
      if (body?.recordingYoutubeId) {
        recordingYoutubeId = body.recordingYoutubeId;
      }
    } catch {
      // Body optional
    }

    const updated = await endLiveSession(id, recordingYoutubeId, session.user.id);
    return apiResponse.success({ success: true, session: updated });
  } catch (err) {
    return handleApiError(err);
  }
}
