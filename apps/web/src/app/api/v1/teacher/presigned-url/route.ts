import { NextRequest } from "next/server";
import { presignedPut } from "@/server/storage";
import { teacherPresignedUrlInputSchema } from "@quick2learn/shared";
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
    const parsed = teacherPresignedUrlInputSchema.parse(body);

    const cleanName = parsed.filename.toLowerCase().replace(/[^a-z0-9._-]/g, "_");
    const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    
    // Choose storage path
    let key: string;
    if (parsed.folder === "notes") {
      key = `resources/private/batch-content/${session.user.id}/${uniqueSuffix}-${cleanName}`;
    } else if (parsed.folder === "announcements") {
      key = `resources/private/announcements/${session.user.id}/${uniqueSuffix}-${cleanName}`;
    } else {
      key = `doubts/${session.user.id}/${uniqueSuffix}-${cleanName}`;
    }

    const uploadUrl = await presignedPut(key, parsed.contentType);

    return apiResponse.success({
      key,
      uploadUrl,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
