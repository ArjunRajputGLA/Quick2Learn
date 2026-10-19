import { NextRequest } from "next/server";
import { db, schema, eq } from "@quick2learn/db";
import { createBatchContentItem } from "@/server/data/batch-content";
import { teacherQuickUploadInputSchema } from "@quick2learn/shared";
import {
  apiResponse,
  checkApiRateLimits,
  handleApiError,
  requireStaffApi,
} from "../../utils";

export async function POST(req: NextRequest) {
  try {
    const { session, role, errorResponse } = await requireStaffApi(req);
    if (errorResponse) return errorResponse;

    const rateLimitError = await checkApiRateLimits(req, session.user.id);
    if (rateLimitError) return rateLimitError;

    const body = await req.json();
    const parsed = teacherQuickUploadInputSchema.parse(body);

    // Resolve subjectId from chapter or batch
    const [chapter] = await db
      .select({ subjectId: schema.chapters.subjectId })
      .from(schema.chapters)
      .where(eq(schema.chapters.id, parsed.chapterId))
      .limit(1);

    let subjectId = chapter?.subjectId;
    if (!subjectId) {
      const [batch] = await db
        .select({ subjectId: schema.batches.subjectId })
        .from(schema.batches)
        .where(eq(schema.batches.id, parsed.batchId))
        .limit(1);
      subjectId = batch?.subjectId || undefined;
    }

    if (!subjectId) {
      return apiResponse.badRequest("Subject could not be resolved for chapter/batch");
    }

    const authUser = {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      role,
    };

    const created = await createBatchContentItem(authUser, {
      batchId: parsed.batchId,
      subjectId,
      chapterId: parsed.chapterId,
      section: parsed.section || "Class Notes",
      title: parsed.title,
      kind: "pdf",
      storageKey: parsed.storageKey,
      pageCount: parsed.pageCount,
      sizeBytes: parsed.sizeBytes,
      notifyBatch: !!parsed.notifyBatch,
    });

    if (!created) {
      return apiResponse.serverError("Failed to create content item");
    }

    return apiResponse.success(
      {
        success: true,
        contentItemId: created.id,
      },
      201
    );
  } catch (err) {
    return handleApiError(err);
  }
}
