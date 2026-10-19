import { db, schema, eq, and } from "@quick2learn/db";
import { saveBatchAttendance } from "@/server/data/attendance";
import { markBatchAttendanceInputSchema } from "@quick2learn/shared";
import {
  apiResponse,
  handleApiError,
  getApiSession,
} from "../../../utils";

export async function GET(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getApiSession(req);
    const userId = session?.user?.id;

    if (!userId) {
      return apiResponse.unauthorized("Authentication required");
    }

    const { id: batchId } = await props.params;

    const url = new URL(req.url);
    const dateParam =
      url.searchParams.get("date") ||
      new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });

    // Fetch batch enrollments with student profile info
    const enrolledStudents = await db
      .select({
        studentId: schema.enrollments.studentId,
        studentName: schema.profiles.fullName,
        studentPhone: schema.profiles.phone,
        enrolledAt: schema.enrollments.enrolledAt,
      })
      .from(schema.enrollments)
      .leftJoin(schema.profiles, eq(schema.enrollments.studentId, schema.profiles.userId))
      .where(
        and(
          eq(schema.enrollments.batchId, batchId),
          eq(schema.enrollments.status, "active")
        )
      )
      .orderBy(schema.profiles.fullName);

    // Fetch existing attendance records for this batch and date
    const attendanceRecords = await db
      .select()
      .from(schema.attendanceRecords)
      .where(
        and(
          eq(schema.attendanceRecords.batchId, batchId),
          eq(schema.attendanceRecords.date, dateParam)
        )
      );

    const recordMap = new Map<string, (typeof attendanceRecords)[0]>();
    for (const r of attendanceRecords) {
      recordMap.set(r.studentId, r);
    }

    const students = enrolledStudents.map((s) => {
      const record = recordMap.get(s.studentId);
      return {
        studentId: s.studentId,
        studentName: s.studentName || "Student",
        phone: s.studentPhone || null,
        status: record ? record.status : null,
        source: record ? record.source : null,
        note: record ? record.note : null,
        isJoinedOnline: record?.source === "joined_online",
      };
    });

    return apiResponse.success({
      batchId,
      date: dateParam,
      students,
    });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getApiSession(req);
    const userId = session?.user?.id;

    if (!userId) {
      return apiResponse.unauthorized("Authentication required");
    }

    const { id: batchId } = await props.params;
    const body = await req.json();

    const parsed = markBatchAttendanceInputSchema.parse({
      ...body,
      batchId,
    });

    const result = await saveBatchAttendance(
      userId,
      batchId,
      parsed.date,
      parsed.entries,
      parsed.sessionId || null
    );

    return apiResponse.success(result);
  } catch (err) {
    return handleApiError(err);
  }
}
