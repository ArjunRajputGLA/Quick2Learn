import { requestAccountDeletionOtp } from "@/server/data/account-deletion";
import {
  apiResponse,
  checkApiRateLimits,
  handleApiError,
  requireApiSession,
} from "../../../utils";

export async function POST(req: Request) {
  try {
    const { session, errorResponse } = await requireApiSession(req);
    if (errorResponse) return errorResponse;

    const rateLimitError = await checkApiRateLimits(req, session.user.id);
    if (rateLimitError) return rateLimitError;

    const result = await requestAccountDeletionOtp(session.user.id);
    return apiResponse.success(result);
  } catch (err) {
    return handleApiError(err);
  }
}
