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
    <div className="space-y-4 w-full pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Website Content &amp; Settings
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage faculty profiles, student testimonials, board exam results (hall of fame), and site-wide configuration.
          </p>
        </div>
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
