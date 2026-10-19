import { requireRole } from "@/server/auth/session";
import { db, schema, asc } from "@quick2learn/db";
import { getQuestions } from "@/server/data/questions";
import { TestBuilderClient } from "@/components/admin/test-builder-client";

export const metadata = {
  title: "Create Test | Quick2Learn Admin",
};

export default async function NewTestPage() {
  await requireRole(["admin", "teacher"]);

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
      subjects={subjects}
      chapters={chapters}
      batches={batches}
      questionBank={questions as any}
    />
  );
}
