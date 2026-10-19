import { NextRequest } from "next/server";
import {
  apiResponse,
  checkApiRateLimits,
  handleApiError,
  requireApiSession,
  getEffectiveUserRole,
} from "../../utils";
import { getParentHomeData } from "@/server/data/parent";
import { parentHomeResponseSchema } from "@quick2learn/shared";
import { ForbiddenError } from "@/server/authz";

export async function GET(req: NextRequest) {
  try {
    const { session, errorResponse } = await requireApiSession(req);
    if (errorResponse) return errorResponse;

    const rateLimitError = await checkApiRateLimits(req, session.user.id);
    if (rateLimitError) return rateLimitError;

    const role = await getEffectiveUserRole(session.user.id);
    if (role !== "parent" && role !== "admin" && role !== "teacher") {
      throw new ForbiddenError("Only parent accounts can access parent home.");
    }

    const { searchParams } = new URL(req.url);
    const studentIdParam = searchParams.get("studentId") || undefined;

    const authUser = {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      role,
    };

    const data = await getParentHomeData(authUser, studentIdParam);
    const validated = parentHomeResponseSchema.parse(data);

    return apiResponse.success(validated);
  } catch (err) {
    return handleApiError(err);
  }
}
