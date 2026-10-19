import { getStudentFeesData } from "@/server/data/fees";
import { feesResponseSchema } from "@quick2learn/shared";
import {
  apiResponse,
  checkApiRateLimits,
  handleApiError,
  requireApiSession,
} from "../utils";

export async function GET(req: Request) {
  try {
    const { session, errorResponse } = await requireApiSession(req);
    if (errorResponse) return errorResponse;

    const rateLimitError = await checkApiRateLimits(req, session.user.id);
    if (rateLimitError) return rateLimitError;

    const url = new URL(req.url);
    const studentIdParam = url.searchParams.get("studentId");

    const authUser = {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      role: (session.user as any).role || "student",
    };

    const data = await getStudentFeesData(authUser, studentIdParam || undefined);
    const validated = feesResponseSchema.parse(data);

    return apiResponse.success(validated);
  } catch (err) {
    return handleApiError(err);
  }
}
