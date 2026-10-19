import { NextRequest } from "next/server";
import { startLiveSession } from "@/server/data/live-sessions";
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

    const updated = await startLiveSession(id, session.user.id);
    return apiResponse.success({ success: true, session: updated });
  } catch (err) {
    return handleApiError(err);
  }
}
