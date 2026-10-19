import { NextRequest } from "next/server";
import { listAdminDoubts } from "@/server/data/doubts";
import {
  apiResponse,
  checkApiRateLimits,
  handleApiError,
  requireStaffApi,
} from "../../utils";

export async function GET(req: NextRequest) {
  try {
    const { session, role, errorResponse } = await requireStaffApi(req);
    if (errorResponse) return errorResponse;

    const rateLimitError = await checkApiRateLimits(req, session.user.id);
    if (rateLimitError) return rateLimitError;

    const { searchParams } = new URL(req.url);
    const status = (searchParams.get("status") || "open") as
      | "open"
      | "unanswered"
      | "answered"
      | "closed"
      | "all";
    const batchId = searchParams.get("batchId") || undefined;
    const subjectId = searchParams.get("subjectId") || undefined;

    const authUser = {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      role,
    };

    const result = await listAdminDoubts(authUser, {
      status,
      batchId,
      subjectId,
      page: 1,
      limit: 50,
    });

    return apiResponse.success(result);
  } catch (err) {
    return handleApiError(err);
  }
}
