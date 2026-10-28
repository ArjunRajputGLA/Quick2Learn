import { requireRole } from "@/server/auth/session";
import { getAdminResourcesList, getAdminResourceOptions } from "@/server/data/admin";
import { ResourcesClient, type ResourceRow } from "@/components/admin/resources-client";

export const metadata = {
  title: "Resources & Study Materials · Admin · Quick2Learn",
};

export default async function AdminResourcesPage() {
  const current = await requireRole(["admin", "teacher"]);

  const resources = await getAdminResourcesList(current.user);
  const { chapters, batches } = await getAdminResourceOptions(current.user);

  return (
    <div className="space-y-3 max-w-7xl mx-auto pb-8">
      <ResourcesClient
        resources={resources as ResourceRow[]}
        chapters={chapters}
        batches={batches}
      />
    </div>
  );
}
