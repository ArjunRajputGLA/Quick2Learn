import { requireRole } from "@/server/auth/session";
import { db, schema, asc } from "@quick2learn/db";
import { getQuestions } from "@/server/data/questions";
import { QuestionBankClient } from "@/components/admin/question-bank-client";

export const metadata = {
  title: "Question Bank | Quick2Learn Admin",
};

export default async function QuestionBankPage() {
  await requireRole(["admin", "teacher"]);

  const [initialQuestions, subjects, chapters] = await Promise.all([
    getQuestions(),
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
      .orderBy(asc(schema.chapters.classLevel), asc(schema.chapters.number)),
  ]);

  return (
    <QuestionBankClient
      initialQuestions={initialQuestions}
      subjects={subjects}
      chapters={chapters}
    />
  );
}
