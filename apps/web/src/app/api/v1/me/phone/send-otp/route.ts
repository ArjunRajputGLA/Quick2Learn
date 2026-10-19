import { requestPhoneChangeOtp } from "@/server/data/phone-change";
import { sendPhoneOtpInputSchema } from "@quick2learn/shared";
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
    const validated = sendPhoneOtpInputSchema.parse(body);

    const result = await requestPhoneChangeOtp(session.user.id, validated.newPhoneNumber);
    return apiResponse.success(result);
  } catch (err) {
    return handleApiError(err);
  }
}
