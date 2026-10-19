import {
  db,
  schema,
  eq,
  and,
  asc,
  sql,
  type LiveSessionProvider,
  type LiveSessionStatus,
} from "@quick2learn/db";
import { ForbiddenError, NotFoundError, UnauthorizedError } from "../authz";
import { notify } from "../notify";

function formatDateTimeIST(date: Date): {
  dateFormatted: string;
  timeFormatted: string;
  combined: string;
} {
  // Format to IST representation
  const dStr = date.toLocaleDateString("en-IN", {
    timeZone: "Asia/Kolkata",
    weekday: "short",
    day: "numeric",
    month: "short",
  });
  const tStr = date.toLocaleTimeString("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
  return {
    dateFormatted: dStr,
    timeFormatted: tStr,
    combined: `${dStr} • ${tStr}`,
  };
}

export interface LiveSessionRow {
  id: string;
  batchId: string;
  batchTitle?: string;
  subjectId: string | null;
  subjectName: string | null;
  teacherId: string | null;
  teacherName: string | null;
  title: string;
  startsAt: string;
  endsAt: string;
  startsAtFormatted: string;
  endsAtFormatted: string;
  timeFormatted: string;
  provider: LiveSessionProvider;
  joinUrl: string | null;
  passcode: string | null;
  status: LiveSessionStatus;
  isLive: boolean;
  startsInMinutes?: number;
  recordingYoutubeId: string | null;
  createdAt: string;
}

export async function getBatchLiveSessions(
  _userId: string | null,
  batchId: string
): Promise<{
  batchId: string;
  batchTitle?: string;
  liveNow: LiveSessionRow | null;
  nextSession: LiveSessionRow | null;
  recentRecordings: LiveSessionRow[];
  allUpcoming: LiveSessionRow[];
}> {
  const batch = await db.query.batches.findFirst({
    where: eq(schema.batches.id, batchId),
    columns: { id: true, title: true },
  });
  if (!batch) {
    throw new NotFoundError("Batch not found");
  }

  const now = new Date();

  // Fetch all sessions for batch that are not cancelled
  const rawSessions = await db
    .select({
      session: schema.liveSessions,
      subjectName: schema.subjects.name,
      teacherName: schema.faculty.name,
    })
    .from(schema.liveSessions)
    .leftJoin(schema.subjects, eq(schema.liveSessions.subjectId, schema.subjects.id))
    .leftJoin(schema.faculty, eq(schema.liveSessions.teacherId, schema.faculty.id))
    .where(
      and(
        eq(schema.liveSessions.batchId, batchId),
        sql`${schema.liveSessions.status} != 'cancelled'`
      )
    )
    .orderBy(asc(schema.liveSessions.startsAt));

  const mapped: LiveSessionRow[] = rawSessions.map(({ session, subjectName, teacherName }) => {
    const startFmt = formatDateTimeIST(session.startsAt);
    const endFmt = formatDateTimeIST(session.endsAt);
    const isLive =
      session.status === "live" ||
      (session.status === "scheduled" &&
        session.startsAt.getTime() <= now.getTime() &&
        session.endsAt.getTime() >= now.getTime());

    const diffMinutes = Math.round((session.startsAt.getTime() - now.getTime()) / (1000 * 60));

    return {
      id: session.id,
      batchId: session.batchId,
      batchTitle: batch.title,
      subjectId: session.subjectId,
      subjectName: subjectName || null,
      teacherId: session.teacherId,
      teacherName: teacherName || null,
      title: session.title,
      startsAt: session.startsAt.toISOString(),
      endsAt: session.endsAt.toISOString(),
      startsAtFormatted: startFmt.combined,
      endsAtFormatted: endFmt.timeFormatted,
      timeFormatted: `${startFmt.timeFormatted} - ${endFmt.timeFormatted}`,
      provider: session.provider,
      joinUrl: session.joinUrl,
      passcode: session.passcode,
      status: session.status,
      isLive,
      startsInMinutes: diffMinutes > 0 ? diffMinutes : undefined,
      recordingYoutubeId: session.recordingYoutubeId,
      createdAt: session.createdAt.toISOString(),
    };
  });

  // 1. Live Now: Status 'live' or currently ongoing scheduled session
  const liveNow = mapped.find((s) => s.isLive) || null;

  // 2. Next Session: Upcoming scheduled session in future
  const nextSession =
    mapped.find(
      (s) =>
        s.status === "scheduled" &&
        new Date(s.startsAt).getTime() > now.getTime() &&
        s.id !== liveNow?.id
    ) || null;

  // 3. Recent recordings: Ended sessions with recordingYoutubeId
  const recentRecordings = mapped
    .filter((s) => s.status === "ended" && !!s.recordingYoutubeId)
    .sort((a, b) => new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime())
    .slice(0, 15);

  // 4. All upcoming: Sessions ending in future
  const allUpcoming = mapped.filter(
    (s) => new Date(s.endsAt).getTime() >= now.getTime() && s.status !== "ended"
  );

  return {
    batchId,
    batchTitle: batch.title,
    liveNow,
    nextSession,
    recentRecordings,
    allUpcoming,
  };
}

export async function joinLiveSession(
  userId: string,
  sessionId: string
): Promise<{
  sessionId: string;
  joinUrl: string;
  passcode: string | null;
  provider: LiveSessionProvider;
  attendanceStatus: "present" | "late";
  message: string;
}> {
  if (!userId) {
    throw new UnauthorizedError("Please log in to join the live session");
  }

  // 1. Fetch live session
  const session = await db.query.liveSessions.findFirst({
    where: eq(schema.liveSessions.id, sessionId),
  });

  if (!session) {
    throw new NotFoundError("Live session not found");
  }

  // 2. Check enrollment or staff status
  const profile = await db.query.profiles.findFirst({
    where: eq(schema.profiles.userId, userId),
  });

  const staff = profile?.role === "admin" || profile?.role === "teacher";

  if (!staff) {
    const enrollment = await db.query.enrollments.findFirst({
      where: and(
        eq(schema.enrollments.batchId, session.batchId),
        eq(schema.enrollments.studentId, userId),
        eq(schema.enrollments.status, "active")
      ),
    });

    if (!enrollment) {
      throw new ForbiddenError("You must be actively enrolled in this batch to join the session.");
    }
  }

  // 3. Record join event
  await db.insert(schema.liveJoinEvents).values({
    sessionId: session.id,
    userId,
    joinedAt: new Date(),
  });

  // 4. Mark attendance automatically
  const now = new Date();
  const sessionStartDate = new Date(session.startsAt);
  const diffMinutes = Math.floor((now.getTime() - sessionStartDate.getTime()) / (1000 * 60));
  // Late after 10 minutes from scheduled start
  const attendanceStatus: "present" | "late" = diffMinutes > 10 ? "late" : "present";

  // Use session start date in IST as the date of attendance (YYYY-MM-DD)
  const sessionDateStr = sessionStartDate.toLocaleDateString("en-CA", {
    timeZone: "Asia/Kolkata",
  }); // returns 'YYYY-MM-DD'

  // Upsert attendance record
  const existingRecord = await db.query.attendanceRecords.findFirst({
    where: and(
      eq(schema.attendanceRecords.studentId, userId),
      eq(schema.attendanceRecords.batchId, session.batchId),
      eq(schema.attendanceRecords.date, sessionDateStr),
      eq(schema.attendanceRecords.sessionId, session.id)
    ),
  });

  if (existingRecord) {
    await db
      .update(schema.attendanceRecords)
      .set({
        status: attendanceStatus,
        source: "joined_online",
        note: diffMinutes > 10 ? `Joined online ${diffMinutes}m late` : "Joined online",
        updatedAt: now,
      })
      .where(eq(schema.attendanceRecords.id, existingRecord.id));
  } else {
    await db.insert(schema.attendanceRecords).values({
      batchId: session.batchId,
      sessionId: session.id,
      studentId: userId,
      date: sessionDateStr,
      status: attendanceStatus,
      source: "joined_online",
      note: diffMinutes > 10 ? `Joined online ${diffMinutes}m late` : "Joined online",
    });
  }

  return {
    sessionId: session.id,
    joinUrl: session.joinUrl || "",
    passcode: session.passcode,
    provider: session.provider,
    attendanceStatus,
    message: `Joined ${session.title}`,
  };
}

export async function startLiveSession(sessionId: string, _userId?: string) {
  const session = await db.query.liveSessions.findFirst({
    where: eq(schema.liveSessions.id, sessionId),
  });
  if (!session) {
    throw new NotFoundError("Live session not found");
  }

  const [updated] = await db
    .update(schema.liveSessions)
    .set({
      status: "live",
      updatedAt: new Date(),
    })
    .where(eq(schema.liveSessions.id, sessionId))
    .returning();

  // Push notification the moment class goes live:
  // "Maths class is live — tap to join"
  try {
    const subject = session.subjectId
      ? await db.query.subjects.findFirst({
          where: eq(schema.subjects.id, session.subjectId),
          columns: { name: true },
        })
      : null;

    const classLabel = subject?.name || session.title || "Class";
    const notificationTitle = `${classLabel} class is live — tap to join`;
    const notificationBody = "Your live class is starting now. Tap to join immediately.";

    await notify(
      { batchId: session.batchId },
      {
        type: "live_class_started",
        title: notificationTitle,
        body: notificationBody,
        data: {
          route: `/batch/${session.batchId}`,
          batchId: session.batchId,
          sessionId: session.id,
          provider: session.provider,
        },
      }
    );
  } catch (err) {
    console.error("[startLiveSession] Error triggering live class push notification:", err);
  }

  return updated;
}

export async function endLiveSession(
  sessionId: string,
  recordingYoutubeId?: string | null,
  _userId?: string
) {
  const session = await db.query.liveSessions.findFirst({
    where: eq(schema.liveSessions.id, sessionId),
  });
  if (!session) {
    throw new NotFoundError("Live session not found");
  }

  const [updated] = await db
    .update(schema.liveSessions)
    .set({
      status: "ended",
      recordingYoutubeId: recordingYoutubeId !== undefined ? recordingYoutubeId : session.recordingYoutubeId,
      updatedAt: new Date(),
    })
    .where(eq(schema.liveSessions.id, sessionId))
    .returning();

  return updated;
}

export async function createLiveSession(data: {
  batchId: string;
  subjectId?: string | null;
  teacherId?: string | null;
  title: string;
  startsAt: string;
  endsAt: string;
  provider: LiveSessionProvider;
  joinUrl?: string | null;
  passcode?: string | null;
  recordingYoutubeId?: string | null;
  createdBy?: string | null;
}) {
  const [created] = await db
    .insert(schema.liveSessions)
    .values({
      batchId: data.batchId,
      subjectId: data.subjectId || null,
      teacherId: data.teacherId || null,
      title: data.title,
      startsAt: new Date(data.startsAt),
      endsAt: new Date(data.endsAt),
      provider: data.provider,
      joinUrl: data.joinUrl || null,
      passcode: data.passcode || null,
      recordingYoutubeId: data.recordingYoutubeId || null,
      createdBy: data.createdBy || null,
      status: "scheduled",
    })
    .returning();

  return created;
}

export async function updateLiveSession(
  sessionId: string,
  data: {
    title?: string;
    startsAt?: string;
    endsAt?: string;
    provider?: LiveSessionProvider;
    joinUrl?: string | null;
    passcode?: string | null;
    status?: LiveSessionStatus;
    recordingYoutubeId?: string | null;
    subjectId?: string | null;
    teacherId?: string | null;
  }
) {
  const updatePayload: Record<string, any> = { updatedAt: new Date() };
  if (data.title !== undefined) updatePayload.title = data.title;
  if (data.startsAt !== undefined) updatePayload.startsAt = new Date(data.startsAt);
  if (data.endsAt !== undefined) updatePayload.endsAt = new Date(data.endsAt);
  if (data.provider !== undefined) updatePayload.provider = data.provider;
  if (data.joinUrl !== undefined) updatePayload.joinUrl = data.joinUrl;
  if (data.passcode !== undefined) updatePayload.passcode = data.passcode;
  if (data.status !== undefined) updatePayload.status = data.status;
  if (data.recordingYoutubeId !== undefined) updatePayload.recordingYoutubeId = data.recordingYoutubeId;
  if (data.subjectId !== undefined) updatePayload.subjectId = data.subjectId;
  if (data.teacherId !== undefined) updatePayload.teacherId = data.teacherId;

  const [updated] = await db
    .update(schema.liveSessions)
    .set(updatePayload)
    .where(eq(schema.liveSessions.id, sessionId))
    .returning();

  return updated;
}

export async function deleteLiveSession(sessionId: string) {
  const [deleted] = await db
    .delete(schema.liveSessions)
    .where(eq(schema.liveSessions.id, sessionId))
    .returning();
  return deleted;
}

/**
 * Daily cron that generates the next 14 days of sessions from batch_timetable_slots.
 */
export async function generateSessionsFromTimetableCron(
  daysAhead = 14,
  batchIdFilter?: string
): Promise<{ generatedCount: number; batchesProcessed: number }> {
  const batches = await db.query.batches.findMany({
    where: batchIdFilter ? eq(schema.batches.id, batchIdFilter) : undefined,
    columns: { id: true, title: true, mode: true },
  });

  let generatedCount = 0;
  const now = new Date();

  for (const batch of batches) {
    const slots = await db
      .select({
        slot: schema.batchTimetableSlots,
        subjectName: schema.subjects.name,
      })
      .from(schema.batchTimetableSlots)
      .leftJoin(schema.subjects, eq(schema.batchTimetableSlots.subjectId, schema.subjects.id))
      .where(eq(schema.batchTimetableSlots.batchId, batch.id));

    if (slots.length === 0) continue;

    for (let dayOffset = 0; dayOffset < daysAhead; dayOffset++) {
      // Target date in IST
      const targetDate = new Date(now.getTime() + dayOffset * 24 * 60 * 60 * 1000);
      const targetDateStr = targetDate.toLocaleDateString("en-CA", {
        timeZone: "Asia/Kolkata",
      }); // 'YYYY-MM-DD'

      // Determine day of week in IST: 1=Mon ... 7=Sun
      const dayOfWeekPart = new Intl.DateTimeFormat("en-US", {
        timeZone: "Asia/Kolkata",
        weekday: "short",
      }).format(targetDate);

      const weekdayMap: Record<string, number> = {
        Mon: 1,
        Tue: 2,
        Wed: 3,
        Thu: 4,
        Fri: 5,
        Sat: 6,
        Sun: 7,
      };
      const currentWeekday = weekdayMap[dayOfWeekPart] || 1;

      const matchingSlots = slots.filter((s) => s.slot.weekday === currentWeekday);

      for (const { slot, subjectName } of matchingSlots) {
        // Construct start and end timestamp in ISO with +05:30 offset
        const startsAt = new Date(`${targetDateStr}T${slot.startTime.length === 5 ? slot.startTime + ":00" : slot.startTime}+05:30`);
        const endsAt = new Date(`${targetDateStr}T${slot.endTime.length === 5 ? slot.endTime + ":00" : slot.endTime}+05:30`);

        // Check if session already exists for this batch and start time
        const existing = await db.query.liveSessions.findFirst({
          where: and(
            eq(schema.liveSessions.batchId, batch.id),
            eq(schema.liveSessions.startsAt, startsAt)
          ),
          columns: { id: true },
        });

        if (!existing) {
          const title = subjectName
            ? `${subjectName} Live Class`
            : `${batch.title} Class`;

          await db.insert(schema.liveSessions).values({
            batchId: batch.id,
            subjectId: slot.subjectId,
            teacherId: slot.teacherId,
            title,
            startsAt,
            endsAt,
            provider: batch.mode === "offline" ? "offline" : "zoom",
            status: "scheduled",
          });
          generatedCount++;
        }
      }
    }
  }

  return { generatedCount, batchesProcessed: batches.length };
}

/**
 * 10-minute before start reminder notification dispatcher
 */
export async function sendLiveClassStartReminders(): Promise<{ remindersSent: number }> {
  const now = new Date();
  const lowerBound = new Date(now.getTime() + 8 * 60 * 1000);
  const upperBound = new Date(now.getTime() + 12 * 60 * 1000);

  const upcomingSessions = await db
    .select({
      session: schema.liveSessions,
      subjectName: schema.subjects.name,
      batchTitle: schema.batches.title,
    })
    .from(schema.liveSessions)
    .leftJoin(schema.subjects, eq(schema.liveSessions.subjectId, schema.subjects.id))
    .leftJoin(schema.batches, eq(schema.liveSessions.batchId, schema.batches.id))
    .where(
      and(
        eq(schema.liveSessions.status, "scheduled"),
        sql`${schema.liveSessions.startsAt} >= ${lowerBound}`,
        sql`${schema.liveSessions.startsAt} <= ${upperBound}`
      )
    );

  let remindersSent = 0;
  for (const { session, subjectName, batchTitle } of upcomingSessions) {
    const classLabel = subjectName || batchTitle || "Class";
    try {
      await notify(
        { batchId: session.batchId },
        {
          type: "live_class_reminder",
          title: `${classLabel} starts in 10 minutes`,
          body: "Get ready! Tap to view live class details and join when live.",
          data: {
            route: `/batch/${session.batchId}`,
            batchId: session.batchId,
            sessionId: session.id,
          },
        }
      );
      remindersSent++;
    } catch (err) {
      console.error(`[sendLiveClassStartReminders] Failed for session ${session.id}:`, err);
    }
  }

  return { remindersSent };
}
