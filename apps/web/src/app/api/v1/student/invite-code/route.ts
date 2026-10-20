import {
  parentInviteCodeResponseSchema,
} from "@quick2learn/shared";
import {
  apiResponse,
  checkApiRateLimits,
  handleApiError,
  requireApiSession,
  getEffectiveUserRole,
} from "../../utils";
import {
  getActiveStudentInviteCode,
  generateStudentParentInviteCode,
} from "@/server/data/parent";
import { ForbiddenError } from "@/server/authz";

export async function GET(req: Request) {
  try {
    const { session, errorResponse } = await requireApiSession(req);
    if (errorResponse) return errorResponse;

    const rateLimitError = await checkApiRateLimits(req, session.user.id);
    if (rateLimitError) return rateLimitError;

    const role = await getEffectiveUserRole(session.user.id);
    if (role !== "student" && role !== "admin") {
      throw new ForbiddenError("Only students can view their parent invite code.");
    }

    let codeData = await getActiveStudentInviteCode(session.user.id);
    if (!codeData) {
      codeData = await generateStudentParentInviteCode(session.user.id);
    }

    const validated = parentInviteCodeResponseSchema.parse(codeData);
    return apiResponse.success(validated);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: Request) {
  try {
    const { session, errorResponse } = await requireApiSession(req);
    if (errorResponse) return errorResponse;

    const rateLimitError = await checkApiRateLimits(req, session.user.id);
    if (rateLimitError) return rateLimitError;

    const role = await getEffectiveUserRole(session.user.id);
    if (role !== "student" && role !== "admin") {
      throw new ForbiddenError("Only students can generate a parent invite code.");
    }

    const codeData = await generateStudentParentInviteCode(session.user.id, true);
    const validated = parentInviteCodeResponseSchema.parse(codeData);

    return apiResponse.success(validated);
  } catch (err) {
    return handleApiError(err);
  }
}
