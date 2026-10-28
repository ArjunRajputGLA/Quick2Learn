import Link from "next/link";
import { requireRole } from "@/server/auth/session";
import { getBatchJoinRequests } from "@/server/data/batches";
import { db, schema, eq } from "@quick2learn/db";
import { BatchJoinRequestsInbox } from "@/components/admin/batch-join-requests-inbox";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Batch Join Requests · Admin · Quick2Learn",
};

export default async function AdminBatchJoinRequestsPage() {
  const current = await requireRole(["admin", "teacher"]);

  const requests = await getBatchJoinRequests({
    id: current.user.id,
    email: current.user.email,
    name: current.user.name,
    role: current.role,
  });

  // Fetch all active fee plans mapped by batchId
  const allFeePlans = await db
    .select({
      id: schema.batchFeePlans.id,
      batchId: schema.batchFeePlans.batchId,
      name: schema.batchFeePlans.name,
      totalPaise: schema.batchFeePlans.totalPaise,
    })
    .from(schema.batchFeePlans)
    .where(eq(schema.batchFeePlans.isActive, true));

  const feePlansByBatch: Record<
    string,
    Array<{ id: string; name: string; totalPaise: number }>
  > = {};

  for (const fp of allFeePlans) {
    if (!feePlansByBatch[fp.batchId]) {
      feePlansByBatch[fp.batchId] = [];
    }
    feePlansByBatch[fp.batchId]!.push({
      id: fp.id,
      name: fp.name,
      totalPaise: fp.totalPaise,
    });
  }

  return (
    <div className="space-y-6 w-full pb-12">
      <div className="flex items-center gap-3 border-b border-border pb-4">
        <Link
          href="/admin/batches"
          className="p-2 rounded-lg border border-border bg-white text-ink-muted hover:text-ink hover:bg-surface-subtle transition-colors"
          title="Back to batches"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-display-xs font-bold text-ink">
            Student Join Requests Inbox
          </h1>
          <p className="text-body-xs text-ink-muted">
            Manage incoming join requests across all institute batches.
          </p>
        </div>
      </div>

      <BatchJoinRequestsInbox
        initialRequests={requests as any}
        feePlansByBatch={feePlansByBatch}
      />
    </div>
  );
}
