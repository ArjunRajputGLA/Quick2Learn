import { requireRole } from "@/server/auth/session";
import { db, schema, asc, desc } from "@quick2learn/db";
import { listAdminDoubts, listCannedReplies } from "@/server/data/doubts";
import { DoubtsInboxClient } from "@/components/admin/doubts-inbox-client";

export const metadata = {
  title: "Doubts Inbox | Quick2Learn Admin",
};

export default async function AdminDoubtsPage({
  searchParams,
}: {
  searchParams: Promise<{ doubtId?: string }>;
}) {
  const current = await requireRole(["admin", "teacher"]);
  const { doubtId } = await searchParams;

  const authUser = {
    id: current.user.id,
    name: current.user.name,
    email: current.user.email,
    role: current.role,
  };

  const [initialDoubts, subjects, batches, cannedReplies, lectures] = await Promise.all([
    listAdminDoubts(authUser, { status: "unanswered", page: 1, limit: 50 }),
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
  ]);

  return (
    <DoubtsInboxClient
      initialDoubts={initialDoubts.doubts}
      initialOpenCount={initialDoubts.openCount}
      subjects={subjects}
      batches={batches}
      initialCannedReplies={cannedReplies}
      lectures={lectures}
      initialSelectedDoubtId={doubtId}
      currentUser={authUser}
    />
  );
}
