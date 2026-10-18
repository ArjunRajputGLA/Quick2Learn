import { registerDeviceToken } from "@/server/data";
import { registerDeviceSchema, deviceTokenResponseSchema } from "@quick2learn/shared";
import {
  apiResponse,
  checkApiRateLimits,
  handleApiError,
  requireApiSession,
} from "../utils";

export async function POST(req: Request) {
  try {
    const { session, errorResponse } = await requireApiSession(req);
    if (errorResponse) return errorResponse;

    const rateLimitError = await checkApiRateLimits(req, session.user.id);
    if (rateLimitError) return rateLimitError;

    const body = await req.json();
    const validatedInput = registerDeviceSchema.parse(body);

    const device = await registerDeviceToken(session.user.id, validatedInput);
    const validated = deviceTokenResponseSchema.parse(device);

    return apiResponse.success(validated, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
