import { NextRequest } from "next/server";
import {
  requireApiSession,
  getEffectiveUserRole,
  apiResponse,
  handleApiError,
  checkApiRateLimits,
} from "../../utils";
import { generateDoubtPresignedPutUrls } from "@/server/data/doubts";
import { presignedDoubtUploadsInputSchema } from "@quick2learn/shared";

/**
 * POST /api/v1/doubts/presigned-urls
 * Generates presigned PUT URLs for up to 3 doubt image attachments.
 */
export async function POST(req: NextRequest) {
  try {
    const { session, errorResponse } = await requireApiSession(req);
    if (errorResponse) return errorResponse;

    const rateLimitResponse = await checkApiRateLimits(req, session.user.id);
    if (rateLimitResponse) return rateLimitResponse;

    const role = await getEffectiveUserRole(session.user.id);
    const body = await req.json();
    const parsed = presignedDoubtUploadsInputSchema.parse(body);

    const authUser = {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      role,
    };

    const uploads = await generateDoubtPresignedPutUrls(authUser, parsed.files);
    return apiResponse.success({ uploads });
  } catch (err) {
    return handleApiError(err);
  }
}
