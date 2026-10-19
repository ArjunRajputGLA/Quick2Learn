import { getStudentAttendance } from "@/server/data/attendance";
import { attendanceMonthResponseSchema } from "@quick2learn/shared";
import {
  apiResponse,
  checkApiRateLimits,
  handleApiError,
  getApiSession,
} from "../utils";

export async function GET(req: Request) {
  try {
    const session = await getApiSession(req);
    const userId = session?.user?.id;

    if (!userId) {
      return apiResponse.unauthorized("Authentication required to view attendance");
    }

    const rateLimitError = await checkApiRateLimits(req, userId);
    if (rateLimitError) return rateLimitError;

    const url = new URL(req.url);
    const studentIdParam = url.searchParams.get("studentId");
    const batchIdParam = url.searchParams.get("batchId");
    const monthParam = url.searchParams.get("month");

    const targetStudentId = studentIdParam || userId;

    const result = await getStudentAttendance(
      userId,
      targetStudentId,
      batchIdParam || null,
      monthParam || null
    );

    const validated = attendanceMonthResponseSchema.parse(result);
    return apiResponse.success(validated);
  } catch (err) {
    return handleApiError(err);
  }
}
