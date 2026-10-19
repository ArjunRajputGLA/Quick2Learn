import { NextRequest } from "next/server";
import { saveBatchAttendance } from "@/server/data/attendance";
import { teacherSaveAttendanceInputSchema } from "@quick2learn/shared";
import {
  apiResponse,
  checkApiRateLimits,
  handleApiError,
  requireStaffApi,
} from "../../utils";

export async function POST(req: NextRequest) {
  try {
    const { session, errorResponse } = await requireStaffApi(req);
    if (errorResponse) return errorResponse;

    const rateLimitError = await checkApiRateLimits(req, session.user.id);
    if (rateLimitError) return rateLimitError;

    const body = await req.json();
    const parsed = teacherSaveAttendanceInputSchema.parse(body);

    const result = await saveBatchAttendance(
      session.user.id,
      parsed.batchId,
      parsed.date,
      parsed.entries,
      parsed.sessionId || null
    );

    return apiResponse.success(result, 200);
  } catch (err) {
    return handleApiError(err);
  }
}
