import { requireRole } from "@/server/auth/session";
import { getAdminPaymentsList } from "@/server/data/admin";
import { PaymentsClient, type PaymentRow } from "@/components/admin/payments-client";

export const metadata = {
  title: "Payments & Collections · Admin · Quick2Learn",
};

interface AdminPaymentsPageProps {
  searchParams: Promise<{
    search?: string;
    status?: string;
    method?: string;
    fromDate?: string;
    toDate?: string;
  }>;
}

export default async function AdminPaymentsPage({ searchParams }: AdminPaymentsPageProps) {
  const current = await requireRole(["admin"]);
  const params = await searchParams;

  const payments = await getAdminPaymentsList(current.user, {
    search: params.search,
    status: params.status,
    method: params.method,
    fromDate: params.fromDate,
    toDate: params.toDate,
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <PaymentsClient payments={payments as PaymentRow[]} />
    </div>
  );
}
