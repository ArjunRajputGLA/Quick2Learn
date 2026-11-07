import { redirect } from "next/navigation";
import { requireOnboardedUser } from "@/server/auth/session";
import { db, schema, eq, desc, asc } from "@quick2learn/db";
import { getDoubtThread } from "@/server/data/doubts";
import { StudentChatClient } from "@/components/student/student-chat-client";
import type { AuthUser } from "@/server/authz";

export const metadata = {
  title: "Faculty Chat & Mentorship | Quick2Learn",
};

export const revalidate = 0;

export default async function StudentChatPage() {
  const current = await requireOnboardedUser();

  // Faculty and Admins must only manage and respond to chats from the Admin CRM
  if (current.role === "admin" || current.role === "teacher") {
    redirect("/admin/chats");
  }

  const authUser: AuthUser = {
    id: current.user.id,
    email: current.user.email,
    name: current.user.name,
    role: current.role,
  };

  // Find or create the student's conversation thread with faculty
  let [doubt] = await db
    .select()
    .from(schema.doubts)
    .where(eq(schema.doubts.studentId, current.user.id))
    .orderBy(desc(schema.doubts.lastActivityAt))
    .limit(1);

  if (!doubt) {
    const [firstSub] = await db
      .select({ id: schema.subjects.id })
      .from(schema.subjects)
      .orderBy(asc(schema.subjects.sortOrder))
      .limit(1);

    if (firstSub) {
      const [created] = await db
        .insert(schema.doubts)
        .values({
          studentId: current.user.id,
          subjectId: firstSub.id,
          sourceType: "general",
          title: `Direct Chat with ${current.user.name || "Student"}`,
          status: "open",
          assignedTeacherId: "usr-admin-dinesh",
          lastActivityAt: new Date(),
        })
        .returning();
      doubt = created;
    }
  }

  let initialThread = null;
  if (doubt) {
    try {
      initialThread = await getDoubtThread(authUser, doubt.id);
    } catch (e) {
      console.error("[StudentChatPage] Error fetching doubt thread:", e);
    }
  }

  return (
    <StudentChatClient
      initialThread={initialThread}
      doubtId={doubt?.id || ""}
      currentStudent={{
        id: current.user.id,
        name: current.user.name || "Student",
        email: current.user.email || "",
      }}
    />
  );
}

