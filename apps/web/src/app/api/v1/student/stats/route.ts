import { getStudentQuickStats } from "@/server/data/fees";
import { studentQuickStatsSchema } from "@quick2learn/shared";
import {
  apiResponse,
  checkApiRateLimits,
  handleApiError,
  requireApiSession,
} from "../../utils";

export async function GET(req: Request) {
  try {
    const { session, errorResponse } = await requireApiSession(req);
    if (errorResponse) return errorResponse;

    const rateLimitError = await checkApiRateLimits(req, session.user.id);
    if (rateLimitError) return rateLimitError;

    const url = new URL(req.url);
    const studentIdParam = url.searchParams.get("studentId");
    const targetStudentId = studentIdParam || session.user.id;

    const stats = await getStudentQuickStats(targetStudentId);
    const validated = studentQuickStatsSchema.parse(stats);

    return apiResponse.success(validated);
  } catch (err) {
    return handleApiError(err);
  }
}
