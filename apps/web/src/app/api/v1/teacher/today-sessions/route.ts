import { NextRequest } from "next/server";
import { db, schema, eq, and, sql, asc } from "@quick2learn/db";
import {
  apiResponse,
  checkApiRateLimits,
  handleApiError,
  requireStaffApi,
} from "../../utils";

function formatIST(date: Date) {
  const dateFormatted = date.toLocaleDateString("en-IN", {
    timeZone: "Asia/Kolkata",
    weekday: "short",
    day: "numeric",
    month: "short",
  });
  const timeFormatted = date.toLocaleTimeString("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  return { dateFormatted, timeFormatted };
}

export async function GET(req: NextRequest) {
  try {
    const { session, errorResponse } = await requireStaffApi(req);
    if (errorResponse) return errorResponse;

    const rateLimitError = await checkApiRateLimits(req, session.user.id);
    if (rateLimitError) return rateLimitError;

    const now = new Date();
    const todayISTStr = now.toLocaleDateString("en-CA", {
      timeZone: "Asia/Kolkata",
    }); // 'YYYY-MM-DD'
    const startOfDay = new Date(`${todayISTStr}T00:00:00+05:30`);
    const endOfDay = new Date(`${todayISTStr}T23:59:59+05:30`);

    const rawSessions = await db
      .select({
        session: schema.liveSessions,
        batchTitle: schema.batches.title,
        subjectName: schema.subjects.name,
        teacherName: schema.faculty.name,
      })
      .from(schema.liveSessions)
      .innerJoin(schema.batches, eq(schema.liveSessions.batchId, schema.batches.id))
      .leftJoin(schema.subjects, eq(schema.liveSessions.subjectId, schema.subjects.id))
      .leftJoin(schema.faculty, eq(schema.liveSessions.teacherId, schema.faculty.id))
      .where(
        and(
          sql`${schema.liveSessions.startsAt} >= ${startOfDay}`,
          sql`${schema.liveSessions.startsAt} <= ${endOfDay}`,
          sql`${schema.liveSessions.status} != 'cancelled'`
        )
      )
      .orderBy(asc(schema.liveSessions.startsAt));

    const sessions = await Promise.all(
      rawSessions.map(async ({ session: s, batchTitle, subjectName, teacherName }) => {
        const startIST = formatIST(s.startsAt);
        const endIST = formatIST(s.endsAt);

        // Fetch attendance count for this session
        const [attCount] = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(schema.attendanceRecords)
          .where(
            s.id
              ? eq(schema.attendanceRecords.sessionId, s.id)
              : and(
                  eq(schema.attendanceRecords.batchId, s.batchId),
                  eq(schema.attendanceRecords.date, todayISTStr)
                )
          );

        // Fetch total active enrollments for batch
        const [enrCount] = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(schema.enrollments)
          .where(
            and(
              eq(schema.enrollments.batchId, s.batchId),
              eq(schema.enrollments.status, "active")
            )
          );

        return {
          id: s.id,
          batchId: s.batchId,
          batchTitle: batchTitle || "Batch Class",
          subjectName: subjectName || null,
          teacherName: teacherName || null,
          title: s.title,
          startsAt: s.startsAt.toISOString(),
          endsAt: s.endsAt.toISOString(),
          startsAtFormatted: startIST.dateFormatted,
          timeFormatted: `${startIST.timeFormatted} - ${endIST.timeFormatted}`,
          status: s.status,
          provider: s.provider,
          joinUrl: s.joinUrl,
          passcode: s.passcode,
          attendanceCount: attCount?.count || 0,
          enrolledCount: enrCount?.count || 0,
        };
      })
    );

    const todayFormatted = now.toLocaleDateString("en-IN", {
      timeZone: "Asia/Kolkata",
      weekday: "short",
      day: "numeric",
      month: "short",
    });

    return apiResponse.success({
      sessions,
      todayDate: todayISTStr,
      todayFormatted,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
