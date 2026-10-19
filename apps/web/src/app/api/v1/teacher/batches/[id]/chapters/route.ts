import { NextRequest } from "next/server";
import { db, schema, eq, and, or, inArray, asc } from "@quick2learn/db";
import {
  apiResponse,
  checkApiRateLimits,
  handleApiError,
  requireStaffApi,
} from "../../../../utils";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: batchId } = await params;
    const { session, errorResponse } = await requireStaffApi(req);
    if (errorResponse) return errorResponse;

    const rateLimitError = await checkApiRateLimits(req, session.user.id);
    if (rateLimitError) return rateLimitError;

    const [batch] = await db
      .select({
        id: schema.batches.id,
        title: schema.batches.title,
        subjectId: schema.batches.subjectId,
        classLevel: schema.batches.classLevel,
      })
      .from(schema.batches)
      .where(eq(schema.batches.id, batchId))
      .limit(1);

    if (!batch) {
      return apiResponse.notFound("Batch not found");
    }

    // 1. Linked chapter IDs
    const links = await db
      .select({ chapterId: schema.batchChapterLinks.chapterId })
      .from(schema.batchChapterLinks)
      .where(eq(schema.batchChapterLinks.batchId, batchId));

    const linkedChapterIds = links.map((l) => l.chapterId);

    // 2. Fetch chapters: either linked or matching subject + classLevel
    const conditions = [];
    if (linkedChapterIds.length > 0) {
      conditions.push(inArray(schema.chapters.id, linkedChapterIds));
    }
    if (batch.subjectId) {
      if (batch.classLevel) {
        conditions.push(
          and(
            eq(schema.chapters.subjectId, batch.subjectId),
            eq(schema.chapters.classLevel, batch.classLevel)
          )
        );
      } else {
        conditions.push(eq(schema.chapters.subjectId, batch.subjectId));
      }
    }

    const rawChapters =
      conditions.length > 0
        ? await db
            .select({
              id: schema.chapters.id,
              title: schema.chapters.title,
              chapterNumber: schema.chapters.number,
              subjectId: schema.chapters.subjectId,
              subjectName: schema.subjects.name,
            })
            .from(schema.chapters)
            .leftJoin(schema.subjects, eq(schema.chapters.subjectId, schema.subjects.id))
            .where(or(...conditions))
            .orderBy(asc(schema.chapters.number), asc(schema.chapters.title))
        : [];

    // Deduplicate by ID
    const seen = new Set<string>();
    const chapters = rawChapters.filter((c) => {
      if (seen.has(c.id)) return false;
      seen.add(c.id);
      return true;
    });

    return apiResponse.success({ batchId, chapters });
  } catch (err) {
    return handleApiError(err);
  }
}
