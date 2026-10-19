import { notFound } from "next/navigation";
import { requireOnboardedUser } from "@/server/auth/session";
import { db, schema, eq } from "@quick2learn/db";
import { DuePayButton } from "@/components/student/due-pay-button";
import { formatINR } from "@quick2learn/shared";
import { publicEnv } from "@/lib/env";
import { CreditCard, ArrowLeft, ShieldCheck } from "lucide-react";
import Link from "next/link";

interface DueCheckoutPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ returnTo?: string }>;
}

export default async function DueCheckoutPage({
  params,
  searchParams,
}: DueCheckoutPageProps) {
  const { id } = await params;
  const { returnTo } = await searchParams;
  const current = await requireOnboardedUser();

  const [due] = await db
    .select()
    .from(schema.feeDues)
    .where(eq(schema.feeDues.id, id))
    .limit(1);

  if (!due) {
    notFound();
  }

  // Fetch enrollment & batch
  const [enrollment] = await db
    .select()
    .from(schema.enrollments)
    .where(eq(schema.enrollments.id, due.enrollmentId))
    .limit(1);

  if (!enrollment || enrollment.studentId !== current.user.id) {
    notFound();
  }

  const [batch] = await db
    .select()
    .from(schema.batches)
    .where(eq(schema.batches.id, enrollment.batchId))
    .limit(1);

  const isAlreadyPaid = due.status === "paid";

  return (
    <div className="container mx-auto px-4 py-12 max-w-lg space-y-8">
      {returnTo ? (
        <a
          href={returnTo}
          className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Return to Quick2Learn App
        </a>
      ) : (
        <Link
          href="/dashboard/payments"
          className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Payments
        </Link>
      )}

      <div className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
        <div className="border-b border-gray-100 pb-4">
          <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
            <CreditCard className="w-4 h-4" /> Tuition Instalment Checkout
          </div>
          <h1 className="text-xl font-bold text-gray-900">
            {batch?.title || "Enrolled Batch"}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Instalment: {due.label || "Tuition Fee"}
          </p>
        </div>

        <div className="bg-gray-50 rounded-xl p-4 space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">Student:</span>
            <span className="font-semibold text-gray-900">{current.user.name}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">Status:</span>
            <span
              className={`font-semibold ${
                isAlreadyPaid ? "text-emerald-600" : "text-amber-600"
              }`}
            >
              {isAlreadyPaid ? "Already Cleared" : "Pending Due"}
            </span>
          </div>
          <div className="flex justify-between items-center text-base pt-2 border-t border-gray-200">
            <span className="font-bold text-gray-900">Amount to Pay:</span>
            <span className="font-extrabold text-blue-600 text-lg">
              {formatINR(due.amountPaise)}
            </span>
          </div>
        </div>

        {isAlreadyPaid ? (
          <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-center text-sm font-semibold text-emerald-800">
            This instalment has already been paid and cleared.
          </div>
        ) : (
          <div className="space-y-4">
            <DuePayButton
              dueId={due.id}
              dueLabel={due.label || "Instalment"}
              amountPaise={due.amountPaise}
              razorpayKeyId={publicEnv.NEXT_PUBLIC_RAZORPAY_KEY_ID}
              studentEmail={current.user.email}
              studentName={current.user.name}
            />

            <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>256-bit encrypted secure checkout via Razorpay</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
