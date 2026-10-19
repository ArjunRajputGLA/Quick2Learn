import { NextRequest } from "next/server";
import {
  requireApiSession,
  getEffectiveUserRole,
  apiResponse,
  handleApiError,
  checkApiRateLimits,
} from "../../../utils";
import { listCannedReplies, createCannedReply } from "@/server/data/doubts";
import { z } from "zod";

const createCannedReplySchema = z.object({
  title: z.string().trim().min(2, "Title is required").max(100),
  body: z.string().trim().min(5, "Reply text is required").max(1000),
  category: z.string().trim().max(50).optional(),
});

/**
 * GET /api/v1/admin/doubts/canned-replies
 * List saved canned replies.
 */
export async function GET(req: NextRequest) {
  try {
    const { session, errorResponse } = await requireApiSession(req);
    if (errorResponse) return errorResponse;

    const rateLimitResponse = await checkApiRateLimits(req, session.user.id);
    if (rateLimitResponse) return rateLimitResponse;

    const role = await getEffectiveUserRole(session.user.id);
    if (role !== "admin" && role !== "teacher") {
      return apiResponse.forbidden("Only teachers and admins can view canned replies.");
    }

    const authUser = {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      role,
    };

    const cannedReplies = await listCannedReplies(authUser);
    return apiResponse.success({ cannedReplies });
  } catch (err) {
    return handleApiError(err);
  }
}

/**
 * POST /api/v1/admin/doubts/canned-replies
 * Add a new canned reply.
 */
export async function POST(req: NextRequest) {
  try {
    const { session, errorResponse } = await requireApiSession(req);
    if (errorResponse) return errorResponse;

    const rateLimitResponse = await checkApiRateLimits(req, session.user.id);
    if (rateLimitResponse) return rateLimitResponse;

    const role = await getEffectiveUserRole(session.user.id);
    if (role !== "admin" && role !== "teacher") {
      return apiResponse.forbidden("Only teachers and admins can create canned replies.");
    }

    const body = await req.json();
    const parsed = createCannedReplySchema.parse(body);

    const authUser = {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      role,
    };

    const created = await createCannedReply(authUser, parsed);
    return apiResponse.success({ cannedReply: created }, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
