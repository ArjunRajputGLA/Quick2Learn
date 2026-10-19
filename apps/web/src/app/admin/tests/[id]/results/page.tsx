import { requireRole } from "@/server/auth/session";
import { getTestAdminResults } from "@/server/data/tests";
import { TestResultsClient } from "@/components/admin/test-results-client";
import { notFound } from "next/navigation";

export const metadata = {
  title: "Test Results & Analytics | Quick2Learn Admin",
};

export default async function TestResultsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole(["admin", "teacher"]);
  const { id } = await params;

  let data: any;
  try {
    data = await getTestAdminResults(id);
  } catch {
    notFound();
  }

  return (
    <TestResultsClient
      test={data.test}
      totalParticipants={data.totalParticipants}
      stats={data.stats}
      questionStats={data.questionStats}
      attempts={data.attempts}
    />
  );
}
