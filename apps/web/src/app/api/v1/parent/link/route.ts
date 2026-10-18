import {
  claimInviteCodeSchema,
  linkedStudentSchema,
} from "@quick2learn/shared";
import {
  apiResponse,
  checkApiRateLimits,
  handleApiError,
  requireApiSession,
  getEffectiveUserRole,
} from "../../utils";
import { claimParentInviteCode } from "@/server/data/parent";
import { ForbiddenError } from "@/server/authz";

export async function POST(req: Request) {
  try {
    const { session, errorResponse } = await requireApiSession(req);
    if (errorResponse) return errorResponse;

    const rateLimitError = await checkApiRateLimits(req, session.user.id);
    if (rateLimitError) return rateLimitError;

    const role = await getEffectiveUserRole(session.user.id);
    if (role !== "parent" && role !== "admin") {
      throw new ForbiddenError("Only parent accounts can link a student via invite code.");
    }

    const body = await req.json();
    const { code } = claimInviteCodeSchema.parse(body);

    const studentProfile = await claimParentInviteCode(session.user.id, code);
    const validated = linkedStudentSchema.parse(studentProfile);

    return apiResponse.success({ student: validated });
  } catch (err) {
    return handleApiError(err);
  }
}
