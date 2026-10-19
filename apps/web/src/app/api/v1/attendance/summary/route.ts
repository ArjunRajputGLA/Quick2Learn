import { getStudentAttendanceSummary } from "@/server/data/attendance";
import { attendanceSummaryResponseSchema } from "@quick2learn/shared";
import {
  apiResponse,
  checkApiRateLimits,
  handleApiError,
  getApiSession,
} from "../../utils";

export async function GET(req: Request) {
  try {
    const session = await getApiSession(req);
    const userId = session?.user?.id;

    if (!userId) {
      return apiResponse.unauthorized("Authentication required to view attendance summary");
    }

    const rateLimitError = await checkApiRateLimits(req, userId);
    if (rateLimitError) return rateLimitError;

    const url = new URL(req.url);
    const studentIdParam = url.searchParams.get("studentId");
    const batchIdParam = url.searchParams.get("batchId");

    const targetStudentId = studentIdParam || userId;

    const result = await getStudentAttendanceSummary(
      userId,
      targetStudentId,
      batchIdParam || null
    );

    const validated = attendanceSummaryResponseSchema.parse(result);
    return apiResponse.success(validated);
  } catch (err) {
    return handleApiError(err);
  }
}
