import { requireRole } from "@/server/auth/session";
import { db, schema, asc, desc, eq } from "@quick2learn/db";
import { listAdminDoubts, listCannedReplies } from "@/server/data/doubts";
import { ChatsClient } from "@/components/admin/chats-client";
import type { ChatStudentOption } from "@/server/admin-actions";

export const metadata = {
  title: "Chats & Messages | Quick2Learn Admin",
};

export default async function AdminChatsPage({
  searchParams,
}: {
  searchParams: Promise<{ chatId?: string; studentId?: string }>;
}) {
  const current = await requireRole(["admin", "teacher"]);
  const { chatId, studentId } = await searchParams;

  const authUser = {
    id: current.user.id,
    name: current.user.name,
    email: current.user.email,
    role: current.role,
  };

  const [initialDoubts, subjects, batches, cannedReplies, lectures, rawStudents, rawEnrollments] =
    await Promise.all([
      listAdminDoubts(authUser, { status: "all", page: 1, limit: 50 }),
      db
        .select({ id: schema.subjects.id, name: schema.subjects.name })
        .from(schema.subjects)
        .orderBy(asc(schema.subjects.sortOrder)),
      db
        .select({ id: schema.batches.id, name: schema.batches.title })
        .from(schema.batches)
        .orderBy(desc(schema.batches.startDate)),
      listCannedReplies(authUser),
      db
        .select({
          id: schema.youtubeVideos.id,
          title: schema.youtubeVideos.title,
          durationSeconds: schema.youtubeVideos.durationSeconds,
        })
        .from(schema.youtubeVideos)
        .orderBy(desc(schema.youtubeVideos.createdAt))
        .limit(100),
      db
        .select({
          id: schema.user.id,
          name: schema.user.name,
          email: schema.user.email,
          phone: schema.profiles.phone,
          classLevel: schema.profiles.classLevel,
          board: schema.profiles.board,
        })
        .from(schema.user)
        .innerJoin(schema.profiles, eq(schema.user.id, schema.profiles.userId))
        .where(eq(schema.profiles.role, "student"))
        .orderBy(asc(schema.user.name)),
      db
        .select({
          studentId: schema.enrollments.studentId,
          batchId: schema.batches.id,
          batchTitle: schema.batches.title,
        })
        .from(schema.enrollments)
        .innerJoin(schema.batches, eq(schema.enrollments.batchId, schema.batches.id))
        .where(eq(schema.enrollments.status, "active")),
    ]);

  const batchMap = new Map<string, Array<{ id: string; title: string }>>();
  for (const e of rawEnrollments) {
    const list = batchMap.get(e.studentId) || [];
    list.push({ id: e.batchId, title: e.batchTitle });
    batchMap.set(e.studentId, list);
  }

  const studentsList: ChatStudentOption[] = rawStudents.map((s) => ({
    ...s,
    name: s.name || "Student",
    batches: batchMap.get(s.id) || [],
  }));

  let targetChatId = chatId;
  let doubtsList = initialDoubts.doubts;

  // If studentId was passed, select existing chat or create a fresh one
  if (!targetChatId && studentId) {
    const [existing] = await db
      .select({ id: schema.doubts.id })
      .from(schema.doubts)
      .where(eq(schema.doubts.studentId, studentId))
      .orderBy(desc(schema.doubts.lastActivityAt))
      .limit(1);

    if (existing) {
      targetChatId = existing.id;
    } else {
      const targetSub = subjects[0]?.id;
      const targetStudent = rawStudents.find((s) => s.id === studentId);
      if (targetSub) {
        const [createdDoubt] = await db
          .insert(schema.doubts)
          .values({
            studentId,
            subjectId: targetSub,
            sourceType: "general",
            title: `Direct Chat with ${targetStudent?.name || "Student"}`,
            status: "open",
            assignedTeacherId: current.user.id,
            lastActivityAt: new Date(),
          })
          .returning({ id: schema.doubts.id });
        if (createdDoubt) {
          targetChatId = createdDoubt.id;
          const updated = await listAdminDoubts(authUser, { status: "all", page: 1, limit: 50 });
          doubtsList = updated.doubts;
        }
      }
    }
  }

  return (
    <ChatsClient
      initialDoubts={doubtsList}
      initialOpenCount={initialDoubts.openCount}
      subjects={subjects}
      batches={batches}
      initialCannedReplies={cannedReplies}
      lectures={lectures}
      initialSelectedChatId={targetChatId}
      currentUser={authUser}
      students={studentsList}
    />
  );
}
