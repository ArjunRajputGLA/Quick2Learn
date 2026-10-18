import {
  linkedStudentsResponseSchema,
} from "@quick2learn/shared";
import {
  apiResponse,
  checkApiRateLimits,
  handleApiError,
  requireApiSession,
  getEffectiveUserRole,
} from "../../utils";
import { getLinkedStudentsForParent } from "@/server/data/parent";
import { ForbiddenError } from "@/server/authz";

export async function GET(req: Request) {
  try {
    const { session, errorResponse } = await requireApiSession(req);
    if (errorResponse) return errorResponse;

    const rateLimitError = await checkApiRateLimits(req, session.user.id);
    if (rateLimitError) return rateLimitError;

    const role = await getEffectiveUserRole(session.user.id);
    if (role !== "parent" && role !== "admin") {
      throw new ForbiddenError("Only parent accounts can view linked students.");
    }

    const students = await getLinkedStudentsForParent(session.user.id);
    const validated = linkedStudentsResponseSchema.parse({ students });

    return apiResponse.success(validated);
  } catch (err) {
    return handleApiError(err);
  }
}
