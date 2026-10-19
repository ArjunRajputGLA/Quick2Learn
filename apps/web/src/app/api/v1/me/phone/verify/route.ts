import { confirmPhoneChange } from "@/server/data/phone-change";
import { verifyPhoneOtpInputSchema } from "@quick2learn/shared";
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

    const body = await req.json();
    const validated = verifyPhoneOtpInputSchema.parse(body);

    const result = await confirmPhoneChange(
      session.user.id,
      validated.newPhoneNumber,
      validated.code
    );
    return apiResponse.success(result);
  } catch (err) {
    return handleApiError(err);
  }
}
