import { NextRequest } from "next/server";
import { db, schema, eq, and, asc } from "@quick2learn/db";
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
      .select({ id: schema.batches.id, title: schema.batches.title })
      .from(schema.batches)
      .where(eq(schema.batches.id, batchId))
      .limit(1);

    if (!batch) {
      return apiResponse.notFound("Batch not found");
    }

    const { searchParams } = new URL(req.url);
    const dateParam =
      searchParams.get("date") ||
      new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
    const sessionIdParam = searchParams.get("sessionId") || undefined;

    // Get active enrolled students
    const enrollments = await db
      .select({
        studentId: schema.enrollments.studentId,
        userName: schema.user.name,
        profileFullName: schema.profiles.fullName,
        phone: schema.profiles.phone,
        parentPhone: schema.profiles.parentPhone,
        avatarUrl: schema.profiles.avatarUrl,
      })
      .from(schema.enrollments)
      .innerJoin(schema.user, eq(schema.enrollments.studentId, schema.user.id))
      .leftJoin(schema.profiles, eq(schema.enrollments.studentId, schema.profiles.userId))
      .where(
        and(
          eq(schema.enrollments.batchId, batchId),
          eq(schema.enrollments.status, "active")
        )
      )
      .orderBy(asc(schema.user.name));

    // Get existing attendance records for this date/batch/session
    const existingRecords = await db
      .select()
      .from(schema.attendanceRecords)
      .where(
        and(
          eq(schema.attendanceRecords.batchId, batchId),
          eq(schema.attendanceRecords.date, dateParam),
          sessionIdParam
            ? eq(schema.attendanceRecords.sessionId, sessionIdParam)
            : undefined
        )
      );

    const recordByStudentId = new Map(
      existingRecords.map((r) => [r.studentId, r])
    );

    const students = enrollments.map((e) => {
      const rec = recordByStudentId.get(e.studentId);
      return {
        id: e.studentId,
        name: e.profileFullName || e.userName || "Student",
        phone: e.phone || null,
        parentPhone: e.parentPhone || null,
        avatarUrl: e.avatarUrl || null,
        status: rec ? (rec.status as "present" | "absent" | "late" | "excused") : null,
        note: rec?.note || null,
      };
    });

    return apiResponse.success({
      batchId,
      batchTitle: batch.title,
      date: dateParam,
      sessionId: sessionIdParam || null,
      students,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
