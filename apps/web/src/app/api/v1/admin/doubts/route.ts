import { NextRequest } from "next/server";
import {
  requireApiSession,
  getEffectiveUserRole,
  apiResponse,
  handleApiError,
  checkApiRateLimits,
} from "../../utils";
import { listAdminDoubts } from "@/server/data/doubts";
import { adminDoubtsQuerySchema } from "@quick2learn/shared";

/**
 * GET /api/v1/admin/doubts
 * Admin/Teacher doubts inbox with filters (status, subject, batch), oldest first.
 */
export async function GET(req: NextRequest) {
  try {
    const { session, errorResponse } = await requireApiSession(req);
    if (errorResponse) return errorResponse;

    const rateLimitResponse = await checkApiRateLimits(req, session.user.id);
    if (rateLimitResponse) return rateLimitResponse;

    const role = await getEffectiveUserRole(session.user.id);
    if (role !== "admin" && role !== "teacher") {
      return apiResponse.forbidden("Only teachers and admins can view the doubts inbox.");
    }

    const { searchParams } = new URL(req.url);
    const query = adminDoubtsQuerySchema.parse({
      status: searchParams.get("status") || "unanswered",
      subjectId: searchParams.get("subjectId") || undefined,
      batchId: searchParams.get("batchId") || undefined,
      page: searchParams.get("page") || 1,
      limit: searchParams.get("limit") || 50,
    });

    const authUser = {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      role,
    };

    const result = await listAdminDoubts(authUser, query);
    return apiResponse.success(result);
  } catch (err) {
    return handleApiError(err);
  }
}
