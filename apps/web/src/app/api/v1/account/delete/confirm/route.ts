import { confirmAccountDeletion } from "@/server/data/account-deletion";
import { confirmDeleteAccountInputSchema } from "@quick2learn/shared";
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
    const validated = confirmDeleteAccountInputSchema.parse(body);

    const result = await confirmAccountDeletion(session.user.id, validated.code);
    return apiResponse.success(result);
  } catch (err) {
    return handleApiError(err);
  }
}
