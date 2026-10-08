import { requireRole } from "@/server/auth/session";
import { getAdminContentData } from "@/server/data/admin";
import {
  ContentManagerClient,
  type FacultyItem,
  type TestimonialItem,
  type ResultItem,
} from "@/components/admin/content-manager-client";

export const metadata = {
  title: "Website Content & Site Settings · Admin · Quick2Learn",
};

export default async function AdminContentPage() {
  const current = await requireRole(["admin"]);

  const { faculty, testimonials, results, settings } = await getAdminContentData(
    current.user,
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="border-b border-border pb-4">
        <h1 className="text-display-xs font-bold text-ink">Website Content & Settings</h1>
        <p className="text-body-sm text-ink-muted mt-1">
          Manage faculty profiles, student testimonials, board exam results (hall of fame), and site-wide configuration.
        </p>
      </div>

      <ContentManagerClient
        initialFaculty={faculty as FacultyItem[]}
        initialTestimonials={testimonials as TestimonialItem[]}
        initialResults={results as ResultItem[]}
        initialSettings={settings}
      />
    </div>
  );
}
