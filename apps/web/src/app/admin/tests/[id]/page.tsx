import { requireRole } from "@/server/auth/session";
import { db, schema, asc } from "@quick2learn/db";
import { getTestById } from "@/server/data/tests";
import { getQuestions } from "@/server/data/questions";
import { TestBuilderClient } from "@/components/admin/test-builder-client";
import { notFound } from "next/navigation";

export const metadata = {
  title: "Edit Test | Quick2Learn Admin",
};

export default async function EditTestPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const current = await requireRole(["admin", "teacher"]);
  const { id } = await params;

  let test: any;
  try {
    test = await getTestById(id, current.user.id, current.role);
  } catch {
    notFound();
  }

  const [subjects, chapters, batches, questions] = await Promise.all([
    db.select({ id: schema.subjects.id, name: schema.subjects.name }).from(schema.subjects).orderBy(asc(schema.subjects.sortOrder)),
    db
      .select({
        id: schema.chapters.id,
        title: schema.chapters.title,
        number: schema.chapters.number,
        classLevel: schema.chapters.classLevel,
        subjectId: schema.chapters.subjectId,
      })
      .from(schema.chapters)
      .orderBy(asc(schema.chapters.number)),
    db.select({ id: schema.batches.id, title: schema.batches.title }).from(schema.batches).orderBy(asc(schema.batches.title)),
    getQuestions(),
  ]);

  return (
    <TestBuilderClient
      initialTest={test}
      subjects={subjects}
      chapters={chapters}
      batches={batches}
      questionBank={questions as any}
    />
  );
}
