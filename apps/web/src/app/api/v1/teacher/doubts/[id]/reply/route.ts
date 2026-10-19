import { NextRequest } from "next/server";
import { addDoubtMessage } from "@/server/data/doubts";
import { replyDoubtInputSchema } from "@quick2learn/shared";
import {
  apiResponse,
  checkApiRateLimits,
  handleApiError,
  requireStaffApi,
} from "../../../../utils";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { session, role, errorResponse } = await requireStaffApi(req);
    if (errorResponse) return errorResponse;

    const rateLimitError = await checkApiRateLimits(req, session.user.id);
    if (rateLimitError) return rateLimitError;

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
