import { requireRole } from "@/server/auth/session";
import { getAdminEnquiriesList } from "@/server/data/admin";
import { EnquiriesClient, type EnquiryRow } from "@/components/admin/enquiries-client";

export const metadata = {
  title: "Enquiries & Admissions Leads · Admin · Quick2Learn",
};

export default async function AdminEnquiriesPage() {
  const current = await requireRole(["admin"]);

  const enquiries = await getAdminEnquiriesList(current.user);

  return (
    <div className="space-y-6 w-full pb-12">
      <div className="border-b border-border pb-4">
        <h1 className="text-display-xs font-bold text-ink">Admissions Enquiries</h1>
        <p className="text-body-sm text-ink-muted mt-1">
          Review prospect inquiries from the website, initiate phone/WhatsApp follow-ups, and convert prospective students into registered accounts.
        </p>
      </div>

      <EnquiriesClient enquiries={enquiries as EnquiryRow[]} />
    </div>
  );
}
