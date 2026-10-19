import { requireRole } from "@/server/auth/session";
import { db, schema, asc } from "@quick2learn/db";
import { getAvailableTests } from "@/server/data/tests";
import { TestsManagerClient } from "@/components/admin/tests-manager-client";

export const metadata = {
  title: "Tests & Quizzes | Quick2Learn Admin",
};

export default async function AdminTestsPage() {
  const current = await requireRole(["admin", "teacher"]);

  const [tests, batches] = await Promise.all([
    getAvailableTests(current.user.id, current.role),
    db.select({ id: schema.batches.id, title: schema.batches.title }).from(schema.batches).orderBy(asc(schema.batches.title)),
  ]);

  return <TestsManagerClient initialTests={tests as any} batches={batches} />;
}
