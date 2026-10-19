import { NextRequest } from "next/server";
import { db, schema, eq } from "@quick2learn/db";
import { teacherPostAnnouncementInputSchema } from "@quick2learn/shared";
import { notify } from "@/server/notify";
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
    const parsed = teacherPostAnnouncementInputSchema.parse(body);

    const [batch] = await db
      .select({ id: schema.batches.id, title: schema.batches.title })
      .from(schema.batches)
      .where(eq(schema.batches.id, parsed.batchId))
      .limit(1);

    if (!batch) {
      return apiResponse.notFound("Batch not found");
    }

    const [created] = await db
      .insert(schema.announcements)
      .values({
        title: parsed.title,
        body: parsed.body,
        audience: "batch",
        batchId: parsed.batchId,
        attachmentKeys: parsed.attachmentKeys || [],
        notifyParents: !!parsed.notifyParents,
        publishedAt: new Date(),
        createdBy: session.user.id,
      })
      .returning();

    if (!created) {
      return apiResponse.serverError("Failed to create announcement");
    }

    // 1. Notify students in batch
    try {
      await notify(
        { batchId: parsed.batchId },
        {
          type: "batch_announcement",
          title: `Announcement: ${parsed.title}`,
          body: parsed.body.length > 140 ? `${parsed.body.slice(0, 140)}...` : parsed.body,
          data: {
            route: `/batch/${parsed.batchId}`,
            batchId: parsed.batchId,
            announcementId: created.id,
          },
        }
      );
    } catch (err) {
      console.warn("[Teacher Announcement] Student push notification failed:", err);
    }

    // 2. Notify parents if requested
    if (parsed.notifyParents) {
      try {
        await notify(
          { parentsOfBatchId: parsed.batchId },
          {
            type: "batch_announcement_parent",
            title: `Announcement for ${batch.title}: ${parsed.title}`,
            body: parsed.body.length > 140 ? `${parsed.body.slice(0, 140)}...` : parsed.body,
            data: {
              route: `/attendance`,
              batchId: parsed.batchId,
              announcementId: created.id,
            },
          }
        );
      } catch (err) {
        console.warn("[Teacher Announcement] Parent push notification failed:", err);
      }
    }

    return apiResponse.success(
      {
        success: true,
        announcementId: created.id,
      },
      201
    );
  } catch (err) {
    return handleApiError(err);
  }
}
