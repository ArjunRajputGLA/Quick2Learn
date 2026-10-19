import { NextRequest } from "next/server";
import {
  requireApiSession,
  getEffectiveUserRole,
  apiResponse,
  handleApiError,
  checkApiRateLimits,
} from "../utils";
import {
  createDoubt,
  listStudentDoubts,
} from "@/server/data/doubts";
import { createDoubtInputSchema } from "@quick2learn/shared";
import { ForbiddenError } from "@/server/authz";

/**
 * GET /api/v1/doubts
 * List current student's doubts.
 */
export async function GET(req: NextRequest) {
  try {
    const { session, errorResponse } = await requireApiSession(req);
    if (errorResponse) return errorResponse;

    const rateLimitResponse = await checkApiRateLimits(req, session.user.id);
    if (rateLimitResponse) return rateLimitResponse;

    const role = await getEffectiveUserRole(session.user.id);
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || undefined;

    const authUser = {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      role,
    };

    const result = await listStudentDoubts(authUser, status);
    return apiResponse.success(result);
  } catch (err) {
    return handleApiError(err);
  }
}

/**
 * POST /api/v1/doubts
 * Create a new student doubt with description and up to 3 attachments.
 */
export async function POST(req: NextRequest) {
  try {
    const { session, errorResponse } = await requireApiSession(req);
    if (errorResponse) return errorResponse;

    const rateLimitResponse = await checkApiRateLimits(req, session.user.id);
    if (rateLimitResponse) return rateLimitResponse;

    const role = await getEffectiveUserRole(session.user.id);
    if (role === "parent") {
      throw new ForbiddenError("Parents cannot ask or post doubts.");
    }
    const body = await req.json();
    const parsed = createDoubtInputSchema.parse(body);

    const authUser = {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      role,
    };

    const doubt = await createDoubt(authUser, parsed);
    return apiResponse.success({ doubt }, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
