import { NextRequest } from "next/server";
import { db, schema, eq, and, sql } from "@quick2learn/db";
import {
  apiResponse,
  checkApiRateLimits,
  handleApiError,
  requireStaffApi,
} from "../../utils";

export async function GET(req: NextRequest) {
  try {
    const { session, errorResponse } = await requireStaffApi(req);
    if (errorResponse) return errorResponse;

    const rateLimitError = await checkApiRateLimits(req, session.user.id);
    if (rateLimitError) return rateLimitError;

    const rawBatches = await db
      .select({
        id: schema.batches.id,
        title: schema.batches.title,
        subjectId: schema.batches.subjectId,
        subjectName: schema.subjects.name,
        classLevel: schema.batches.classLevel,
        status: schema.batches.status,
      })
      .from(schema.batches)
      .leftJoin(schema.subjects, eq(schema.batches.subjectId, schema.subjects.id))
      .where(sql`${schema.batches.status} != 'archived'`)
      .orderBy(schema.batches.title);

    const batches = await Promise.all(
      rawBatches.map(async (b) => {
        const [enrCount] = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(schema.enrollments)
          .where(
            and(
              eq(schema.enrollments.batchId, b.id),
              eq(schema.enrollments.status, "active")
            )
          );

        return {
          id: b.id,
          title: b.title,
          subjectId: b.subjectId || null,
          subjectName: b.subjectName || null,
          classLevel: b.classLevel || null,
          enrolledCount: enrCount?.count || 0,
        };
      })
    );

    return apiResponse.success({ batches });
  } catch (err) {
    return handleApiError(err);
  }
}
