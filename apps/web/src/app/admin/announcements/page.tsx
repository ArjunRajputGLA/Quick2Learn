import { requireRole } from "@/server/auth/session";
import { getAdminAnnouncementsList, getAdminBatchOptions } from "@/server/data/admin";
import { AnnouncementsClient, type AnnouncementItem } from "@/components/admin/announcements-client";

export const metadata = {
  title: "Announcements · Admin · Quick2Learn",
};

export default async function AdminAnnouncementsPage() {
  const current = await requireRole(["admin", "teacher"]);

  const announcements = await getAdminAnnouncementsList(current.user);
  const batches = await getAdminBatchOptions(current.user);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <AnnouncementsClient
        announcements={announcements as AnnouncementItem[]}
        batches={batches}
      />
    </div>
  );
}
