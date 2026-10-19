import { NextRequest } from "next/server";
import {
  requireApiSession,
  getEffectiveUserRole,
  apiResponse,
  handleApiError,
  checkApiRateLimits,
} from "../../../utils";
import { addDoubtMessage } from "@/server/data/doubts";
import { replyDoubtInputSchema } from "@quick2learn/shared";

/**
 * POST /api/v1/doubts/:id/messages
 * Add a reply message to the doubt thread.
 * When teacher replies: updates status to answered, sends push notification to student.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { session, errorResponse } = await requireApiSession(req);
    if (errorResponse) return errorResponse;

    const rateLimitResponse = await checkApiRateLimits(req, session.user.id);
    if (rateLimitResponse) return rateLimitResponse;

    const role = await getEffectiveUserRole(session.user.id);
    const body = await req.json();
    const parsed = replyDoubtInputSchema.parse(body);

    const authUser = {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      role,
    };

    const result = await addDoubtMessage(authUser, id, parsed);
    return apiResponse.success(result, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
