import { NextRequest } from "next/server";
import {
  apiResponse,
  handleApiError,
  requireApiSession,
  getEffectiveUserRole,
} from "../../../../utils";
import {
  adminLinkParentToStudent,
  adminUnlinkParentFromStudent,
} from "@/server/data/parent";
import {
  adminLinkParentInputSchema,
  adminUnlinkParentInputSchema,
} from "@quick2learn/shared";
import { ForbiddenError } from "@/server/authz";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { session, errorResponse } = await requireApiSession(req);
    if (errorResponse) return errorResponse;

    const role = await getEffectiveUserRole(session.user.id);
    if (role !== "admin") {
      throw new ForbiddenError("Only administrators can manage parent links.");
    }

    const { id: studentUserId } = await params;
    const body = await req.json();
    const parsed = adminLinkParentInputSchema.parse({
      ...body,
      studentUserId,
    });

    const adminUser = {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      role,
    };

    const result = await adminLinkParentToStudent(
      adminUser,
      parsed.studentUserId,
      parsed.parentIdentifier,
      parsed.relation
    );

    return apiResponse.success(result, 201);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { session, errorResponse } = await requireApiSession(req);
    if (errorResponse) return errorResponse;

    const role = await getEffectiveUserRole(session.user.id);
    if (role !== "admin") {
      throw new ForbiddenError("Only administrators can manage parent links.");
    }

    await params; // validate route param
    const body = await req.json();
    const parsed = adminUnlinkParentInputSchema.parse(body);

    const adminUser = {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      role,
    };

    const result = await adminUnlinkParentFromStudent(adminUser, parsed.linkId);

    return apiResponse.success(result);
  } catch (err) {
    return handleApiError(err);
  }
}
