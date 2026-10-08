import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { requireOnboardedUser } from "@/server/auth/session";
import { getBatchDetailBySlug } from "@/server/data/batches";
import { formatClassRoman } from "@quick2learn/shared";
import { BreadcrumbsPlacement } from "@/components/layout/breadcrumbs-placement";
import { Badge } from "@/components/ui/badge";
import { CheckoutForm, type FeePlanSummary } from "@/components/checkout/checkout-form";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { publicEnv } from "@/lib/env";
import type { AuthUser } from "@/server/authz";

interface CheckoutPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ plan?: string }>;
}

export default async function CheckoutPage({
  params,
  searchParams,
}: CheckoutPageProps) {
  const { slug } = await params;
  const { plan: planId } = await searchParams;

  // 1. Enforce authentication and onboarding:
  // - logged out students -> /login?next=/checkout/[slug]
  // - logged in without onboarded_at -> /onboarding
  const current = await requireOnboardedUser(`/checkout/${slug}`);
  const authUser: AuthUser = {
    id: current.user.id,
    email: current.user.email,
    name: current.user.name,
    role: current.role,
  };

  const data = await getBatchDetailBySlug(slug, { user: authUser });

  if (!data) {
    notFound();
  }

  const { batch, feePlans } = data;

  if (batch.status !== "open") {
    redirect(`/batches/${batch.slug}`);
  }

  const classRoman = formatClassRoman(batch.classLevel);

  // Format fee plans for CheckoutForm
  const formattedFeePlans: FeePlanSummary[] = feePlans.map((p) => ({
    id: p.id,
    name: p.name,
    totalPaise: p.totalPaise,
    originalPaise: p.originalPaise,
    instalments: Array.isArray(p.instalments)
      ? (p.instalments as Array<{
          label?: string;
          amount_paise?: number;
          due_date?: string;
        }>)
      : [],
  }));

  const initialProfile = {
    name: current.profile?.fullName || current.user.name || "",
    email: current.user.email,
    phone: current.profile?.phone || "",
    parentName: current.profile?.parentName || "",
    parentPhone: current.profile?.parentPhone || "",
  };

  return (
    <div>
      <BreadcrumbsPlacement
        items={[
          { label: "Home", href: "/" },
          { label: "Batches", href: "/batches" },
          { label: batch.title, href: `/batches/${batch.slug}` },
          { label: "Checkout" },
        ]}
      />

      <div className="container mx-auto px-4 py-8 lg:py-12 max-w-3xl">
        <Link
          href={`/batches/${batch.slug}`}
          className="inline-flex items-center gap-2 text-small font-semibold text-ink-muted hover:text-primary transition-colors mb-6 group"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          <span>Back to batch details</span>
        </Link>

        <div className="rounded-2xl border border-border bg-surface p-6 sm:p-8 md:p-10 shadow-card space-y-8">
          {/* Header Info */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="primary">Class {classRoman}</Badge>
                <Badge variant="neutral">{batch.board.toUpperCase()}</Badge>
                <Badge variant="accent" className="uppercase">
                  {batch.mode}
                </Badge>
              </div>
              <h1 className="text-h2 font-extrabold text-ink">{batch.title}</h1>
              {batch.scheduleText && (
                <p className="text-small text-ink-muted">{batch.scheduleText}</p>
              )}
            </div>

            <div className="shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-caption font-bold self-start sm:self-center">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span>Admissions Open</span>
            </div>
          </div>

          {/* Interactive Checkout Form */}
          <CheckoutForm
            batch={{
              id: batch.id,
              slug: batch.slug,
              title: batch.title,
              classLevel: batch.classLevel,
              board: batch.board,
              scheduleText: batch.scheduleText,
            }}
            feePlans={formattedFeePlans}
            initialPlanId={planId}
            initialProfile={initialProfile}
            razorpayKeyId={publicEnv.NEXT_PUBLIC_RAZORPAY_KEY_ID}
          />
        </div>
      </div>
    </div>
  );
}
