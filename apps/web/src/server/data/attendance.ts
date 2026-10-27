import {
  db,
  schema,
  eq,
  and,
  desc,
  sql,
  isNull,
  type AttendanceStatus,
  type AttendanceSource,
} from "@quick2learn/db";
import { ForbiddenError, NotFoundError, UnauthorizedError } from "../authz";
import { notify } from "../notify";

export interface AttendanceRecordRow {
  id: string;
  batchId: string;
  batchTitle?: string;
  sessionId: string | null;
  sessionTitle: string | null;
  studentId: string;
  studentName?: string;
  date: string;
  status: AttendanceStatus;
  source: AttendanceSource;
  note: string | null;
  markedAt?: string;
}

/**
 * Validates whether the requester is allowed to view the student's attendance.
 * Allowed: The student themselves, staff (teacher/admin), or an active linked parent.
 */
export async function assertCanViewStudentAttendance(
  requesterId: string,
  studentId: string
): Promise<void> {
  if (requesterId === studentId) return;

  const requesterProfile = await db.query.profiles.findFirst({
    where: eq(schema.profiles.userId, requesterId),
    columns: { role: true, phone: true },
  });

  if (requesterProfile?.role === "admin" || requesterProfile?.role === "teacher") {
    return;
  }

  // Check parent link in parentLinks table
  const link = await db.query.parentLinks.findFirst({
    where: and(
      eq(schema.parentLinks.parentUserId, requesterId),
      eq(schema.parentLinks.studentUserId, studentId)
    ),
  });
  if (link) return;

  // Fallback: check phone matching
  if (requesterProfile?.phone) {
    const studentProfile = await db.query.profiles.findFirst({
      where: eq(schema.profiles.userId, studentId),
      columns: { parentPhone: true },
    });
    if (studentProfile?.parentPhone && studentProfile.parentPhone === requesterProfile.phone) {
      return;
    }
  }

  throw new ForbiddenError("You are not authorized to view this student's attendance records.");
}

export async function getStudentAttendance(
  requesterId: string,
  studentId: string,
  batchId?: string | null,
  month?: string | null
): Promise<{
  studentId: string;
  studentName: string;
  batchId?: string | null;
  month: string;
  records: AttendanceRecordRow[];
  stats: {
    totalDays: number;
    presentDays: number;
    absentDays: number;
    lateDays: number;
    excusedDays: number;
    monthPercentage: number;
    termPercentage: number;
  };
  absences: AttendanceRecordRow[];
}> {
  if (!requesterId) {
    throw new UnauthorizedError("Please log in to view attendance");
  }

  await assertCanViewStudentAttendance(requesterId, studentId);

  // Student profile
  const studentProfile = await db.query.profiles.findFirst({
    where: eq(schema.profiles.userId, studentId),
    columns: { fullName: true },
  });
  const studentName = studentProfile?.fullName || "Student";

  // Month format YYYY-MM
  const now = new Date();
  const currentMonthStr = now.toLocaleDateString("en-CA", {
    timeZone: "Asia/Kolkata",
  }).slice(0, 7); // 'YYYY-MM'

  const targetMonth = month && /^\d{4}-\d{2}$/.test(month) ? month : currentMonthStr;
  const startDate = `${targetMonth}-01`;
  const endDate = `${targetMonth}-31`;

  // Fetch month records
  const rawRecords = await db
    .select({
      record: schema.attendanceRecords,
      batchTitle: schema.batches.title,
      sessionTitle: schema.liveSessions.title,
    })
    .from(schema.attendanceRecords)
    .leftJoin(schema.batches, eq(schema.attendanceRecords.batchId, schema.batches.id))
    .leftJoin(schema.liveSessions, eq(schema.attendanceRecords.sessionId, schema.liveSessions.id))
    .where(
      and(
        eq(schema.attendanceRecords.studentId, studentId),
        batchId ? eq(schema.attendanceRecords.batchId, batchId) : undefined,
        sql`${schema.attendanceRecords.date} >= ${startDate}`,
        sql`${schema.attendanceRecords.date} <= ${endDate}`
      )
    )
    .orderBy(desc(schema.attendanceRecords.date));

  const records: AttendanceRecordRow[] = rawRecords.map(({ record, batchTitle, sessionTitle }) => ({
    id: record.id,
    batchId: record.batchId,
    batchTitle: batchTitle || undefined,
    sessionId: record.sessionId,
    sessionTitle: sessionTitle || null,
    studentId: record.studentId,
    studentName,
    date: record.date,
    status: record.status,
    source: record.source,
    note: record.note,
    markedAt: record.createdAt.toISOString(),
  }));

  const totalDays = records.length;
  const presentDays = records.filter((r) => r.status === "present").length;
  const absentDays = records.filter((r) => r.status === "absent").length;
  const lateDays = records.filter((r) => r.status === "late").length;
  const excusedDays = records.filter((r) => r.status === "excused").length;

  const monthPercentage =
    totalDays > 0 ? Math.round(((presentDays + lateDays) / totalDays) * 100) : 0;

  // Term percentage: all-time records for this student and optionally batch
  const allTermRecords = await db
    .select({
      status: schema.attendanceRecords.status,
    })
    .from(schema.attendanceRecords)
    .where(
      and(
        eq(schema.attendanceRecords.studentId, studentId),
        batchId ? eq(schema.attendanceRecords.batchId, batchId) : undefined
      )
    );

  const termTotal = allTermRecords.length;
  const termAttended = allTermRecords.filter(
    (r) => r.status === "present" || r.status === "late"
  ).length;
  const termPercentage = termTotal > 0 ? Math.round((termAttended / termTotal) * 100) : 0;

  const absences = records.filter((r) => r.status === "absent");

  return {
    studentId,
    studentName,
    batchId: batchId || null,
    month: targetMonth,
    records,
    stats: {
      totalDays,
      presentDays,
      absentDays,
      lateDays,
      excusedDays,
      monthPercentage,
      termPercentage,
    },
    absences,
  };
}

export async function getStudentAttendanceSummary(
  requesterId: string,
  targetStudentId?: string | null,
  batchId?: string | null
): Promise<{
  studentId: string;
  studentName: string;
  monthPercentage: number;
  termPercentage: number;
  totalClasses: number;
  attendedClasses: number;
  absentClasses: number;
  lateClasses: number;
  recentAbsences: AttendanceRecordRow[];
}> {
  const studentId = targetStudentId || requesterId;
  const detail = await getStudentAttendance(requesterId, studentId, batchId, null);

  return {
    studentId,
    studentName: detail.studentName,
    monthPercentage: detail.stats.monthPercentage,
    termPercentage: detail.stats.termPercentage,
    totalClasses: detail.stats.totalDays,
    attendedClasses: detail.stats.presentDays + detail.stats.lateDays,
    absentClasses: detail.stats.absentDays,
    lateClasses: detail.stats.lateDays,
    recentAbsences: detail.absences.slice(0, 5),
  };
}

/**
 * Saves or updates attendance for a batch on a given date.
 * If any student is marked absent, dispatches a push notification to their linked parent(s).
 */
export async function saveBatchAttendance(
  teacherId: string,
  batchId: string,
  dateStr: string,
  entries: Array<{
    studentId: string;
    status: AttendanceStatus;
    note?: string;
  }>,
  sessionId?: string | null
): Promise<{ success: boolean; count: number; absencesNotified: number }> {
  const batch = await db.query.batches.findFirst({
    where: eq(schema.batches.id, batchId),
    columns: { id: true, title: true },
  });
  if (!batch) {
    throw new NotFoundError("Batch not found");
  }

  const now = new Date();
  const absentStudentIds: string[] = [];

  for (const entry of entries) {
    if (entry.status === "absent") {
      absentStudentIds.push(entry.studentId);
    }

    const existingRecord = await db.query.attendanceRecords.findFirst({
      where: and(
        eq(schema.attendanceRecords.studentId, entry.studentId),
        eq(schema.attendanceRecords.batchId, batchId),
        eq(schema.attendanceRecords.date, dateStr),
        sessionId
          ? eq(schema.attendanceRecords.sessionId, sessionId)
          : isNull(schema.attendanceRecords.sessionId)
      ),
    });

    if (existingRecord) {
      await db
        .update(schema.attendanceRecords)
        .set({
          status: entry.status,
          source: "marked",
          markedBy: teacherId,
          note: entry.note !== undefined ? entry.note : null,
          updatedAt: now,
        })
        .where(eq(schema.attendanceRecords.id, existingRecord.id));
    } else {
      await db.insert(schema.attendanceRecords).values({
        batchId,
        sessionId: sessionId || null,
        studentId: entry.studentId,
        date: dateStr,
        status: entry.status,
        source: "marked",
        markedBy: teacherId,
        note: entry.note || null,
        updatedAt: now,
      });
    }
  }

  // Dispatch absence push notifications to parents:
  // "for parents, one push on days their child is marked absent."
  let absencesNotified = 0;
  if (absentStudentIds.length > 0) {
    for (const studentId of absentStudentIds) {
      try {
        const studentProfile = await db.query.profiles.findFirst({
          where: eq(schema.profiles.userId, studentId),
          columns: { fullName: true, parentPhone: true },
        });
        const studentName = studentProfile?.fullName || "Your child";

        // Collect parent user IDs
        const parentUserIds: string[] = [];

        // 1. Through parent_links
        const links = await db
          .select({ parentUserId: schema.parentLinks.parentUserId })
          .from(schema.parentLinks)
          .where(eq(schema.parentLinks.studentUserId, studentId));
        for (const l of links) {
          parentUserIds.push(l.parentUserId);
        }

        // 2. Through parentPhone match
        if (studentProfile?.parentPhone && studentProfile.parentPhone.trim().length >= 10) {
          const matchingParents = await db
            .select({ userId: schema.profiles.userId })
            .from(schema.profiles)
            .where(eq(schema.profiles.phone, studentProfile.parentPhone.trim()));
          for (const p of matchingParents) {
            parentUserIds.push(p.userId);
          }
        }

        const uniqueParentIds = Array.from(new Set(parentUserIds)).filter(Boolean);

        if (uniqueParentIds.length > 0) {
          await notify(uniqueParentIds, {
            type: "student_marked_absent",
            title: `Attendance Alert: ${studentName} was absent today`,
            body: `${studentName} was marked absent for ${batch.title} on ${dateStr}.`,
            data: {
              route: `/attendance?studentId=${studentId}&batchId=${batchId}`,
              studentId,
              batchId,
              date: dateStr,
            },
          });
          absencesNotified += uniqueParentIds.length;
        }
      } catch (err) {
        console.error(`[saveBatchAttendance] Error notifying parent of absent student ${studentId}:`, err);
      }
    }
  }

  return { success: true, count: entries.length, absencesNotified };
}
