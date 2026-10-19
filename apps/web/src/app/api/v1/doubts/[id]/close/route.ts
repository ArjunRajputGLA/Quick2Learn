import { NextRequest } from "next/server";
import {
  requireApiSession,
  getEffectiveUserRole,
  apiResponse,
  handleApiError,
  checkApiRateLimits,
} from "../../../utils";
import { closeDoubt } from "@/server/data/doubts";

/**
 * POST /api/v1/doubts/:id/close
 * Close the doubt.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { session, errorResponse } = await requireApiSession(req);
    if (errorResponse) return errorResponse;

    const rateLimitResponse = await checkApiRateLimits(req, session.user.id);
    if (rateLimitResponse) return rateLimitResponse;

    const role = await getEffectiveUserRole(session.user.id);
    const authUser = {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      role,
    };

    const doubt = await closeDoubt(authUser, id);
    return apiResponse.success({ doubt });
  } catch (err) {
    return handleApiError(err);
  }
}
