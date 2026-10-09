"use client";

import * as React from "react";
import Script from "next/script";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatINR } from "@quick2learn/shared";
import { Badge } from "@/components/ui/badge";
import { createOrderAction } from "@/server/payments/actions";
import { toast } from "sonner";
import { trackEvent } from "@/lib/analytics";
import {
  Lock,
  CreditCard,
  Calendar,
  User,
  ShieldCheck,
  CheckCircle2,
  Loader2,
} from "lucide-react";

export interface FeePlanSummary {
  id: string;
  name: string;
  totalPaise: number;
  originalPaise?: number | null;
  instalments: Array<{
    label?: string;
    amount_paise?: number;
    due_date?: string;
  }>;
}

export interface StudentProfileData {
  name: string;
  email: string;
  phone: string;
  parentName: string;
  parentPhone: string;
}

interface CheckoutFormProps {
  batch: {
    id: string;
    slug: string;
    title: string;
    classLevel: number;
    board: string;
    scheduleText?: string | null;
  };
  feePlans: FeePlanSummary[];
  initialPlanId?: string;
  initialProfile: StudentProfileData;
  razorpayKeyId: string;
}

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      open: () => void;
      on: (event: string, handler: (response: unknown) => void) => void;
    };
  }
}

export function CheckoutForm({
  batch,
  feePlans,
  initialPlanId,
  initialProfile,
  razorpayKeyId,
}: CheckoutFormProps) {
  const router = useRouter();

  // Plan Selection
  const [selectedPlanId, setSelectedPlanId] = React.useState<string>(
    initialPlanId || feePlans[0]?.id || "",
  );

  // Profile fields prefilled, editable
  const [fullName, setFullName] = React.useState(initialProfile.name || "");
  const [phone, setPhone] = React.useState(initialProfile.phone || "");
  const [parentName, setParentName] = React.useState(
    initialProfile.parentName || "",
  );
  const [parentPhone, setParentPhone] = React.useState(
    initialProfile.parentPhone || "",
  );

  // Terms and Refund Policy agreement
  const [agreedToTerms, setAgreedToTerms] = React.useState(false);

  // Loading states
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const selectedPlan =
    feePlans.find((p) => p.id === selectedPlanId) || feePlans[0];

  // Compute payable today vs later dues
  const hasInstalments =
    selectedPlan &&
    Array.isArray(selectedPlan.instalments) &&
    selectedPlan.instalments.length > 1;

  const payableNowPaise = hasInstalments
    ? selectedPlan.instalments[0]?.amount_paise ||
      Math.round(selectedPlan.totalPaise / selectedPlan.instalments.length)
    : selectedPlan?.totalPaise ?? 0;

  const laterDues = hasInstalments ? selectedPlan.instalments.slice(1) : [];

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!agreedToTerms) {
      toast.error(
        "Please accept the Terms of Service and Refund Policy to continue.",
      );
      return;
    }

    if (!selectedPlan) {
      toast.error("Please select a valid fee plan.");
      return;
    }

    // Phone format check: 10 digits
    const cleanedPhone = phone.replace(/\D/g, "");
    if (cleanedPhone.length < 10) {
      toast.error("Please enter a valid 10-digit mobile number.");
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Call Server Action to create or reuse order inside database transaction
      const res = await createOrderAction({
        batchSlug: batch.slug,
        feePlanId: selectedPlan.id,
        studentDetails: {
          fullName,
          phone: cleanedPhone.slice(-10),
          parentName,
          parentPhone: parentPhone ? parentPhone.replace(/\D/g, "").slice(-10) : undefined,
        },
      });

      if (!res.success) {
        toast.error(res.error || "Unable to create payment order.");
        setIsSubmitting(false);
        return;
      }

      const orderData = res.data;

      trackEvent("checkout_started", {
        batchSlug: batch.slug,
        feePlanId: selectedPlan.id,
        amountPaise: orderData.amountPaise,
      });

      // 2. Client Checkout with Razorpay
      if (typeof window.Razorpay !== "undefined") {
        const options = {
          key: razorpayKeyId || orderData.keyId,
          amount: orderData.amountPaise,
          currency: orderData.currency || "INR",
          name: "Quick2Learn",
          description: `${batch.title} • ${selectedPlan.name}`,
          order_id: orderData.orderId,
          prefill: {
            name: fullName || initialProfile.name,
            email: initialProfile.email,
            contact: cleanedPhone.slice(-10),
          },
          theme: {
            color: "#2563EB", // primary brand token
          },
          modal: {
            ondismiss: () => {
              setIsSubmitting(false);
              toast.info("Checkout dismissed. You can resume anytime.");
            },
          },
          handler: async (response: {
            razorpay_order_id: string;
            razorpay_payment_id: string;
            razorpay_signature: string;
          }) => {
            try {
              // 3. Post to /api/payments/verify
              const verifyRes = await fetch("/api/payments/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                }),
              });

              const verifyJson = await verifyRes.json();

              if (!verifyRes.ok || !verifyJson.success) {
                toast.error(
                  verifyJson.error || "Payment signature verification failed.",
                );
                setIsSubmitting(false);
                return;
              }

              trackEvent("payment_succeeded", {
                batchSlug: batch.slug,
                orderId: orderData.orderId,
                amountPaise: orderData.amountPaise,
              });

              toast.success("Payment verified! Enrollment is now active.");
              router.push(
                verifyJson.redirectUrl ||
                  `/dashboard/payments/${verifyJson.paymentId}`,
              );
            } catch (err) {
              toast.error("Error communicating with verification gateway.");
              setIsSubmitting(false);
            }
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        // Fallback if Razorpay script is blocked or offline mock
        toast.info(
          "Test environment: Razorpay script simulated. Verifying mock payment...",
        );
        const mockSig = "mock_sig_for_local_dev";
        const verifyRes = await fetch("/api/payments/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            razorpay_order_id: orderData.orderId,
            razorpay_payment_id: `pay_mock_${Date.now()}`,
            razorpay_signature: mockSig,
          }),
        });

        const verifyJson = await verifyRes.json();
        trackEvent("payment_succeeded", {
          batchSlug: batch.slug,
          orderId: orderData.orderId,
          amountPaise: orderData.amountPaise,
        });

        if (verifyJson.redirectUrl) {
          router.push(verifyJson.redirectUrl);
        } else {
          router.push(`/dashboard/payments/${orderData.paymentId}`);
        }
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "An unexpected error occurred.",
      );
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="lazyOnload"
      />

      <form onSubmit={handlePayment} className="space-y-8">
        {/* STEP 1: FEE PLAN SELECTION */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <h3 className="text-h3 font-bold text-ink flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              <span>1. Choose Fee Plan</span>
            </h3>
            <span className="text-caption text-ink-muted">
              Select payment schedule
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {feePlans.map((plan) => {
              const isSelected = plan.id === selectedPlanId;
              const planInstalments = plan.instalments || [];
              const isPlanInstalments = planInstalments.length > 1;

              const planPayableNow = isPlanInstalments
                ? planInstalments[0]?.amount_paise ||
                  Math.round(plan.totalPaise / planInstalments.length)
                : plan.totalPaise;

              return (
                <div
                  key={plan.id}
                  onClick={() => setSelectedPlanId(plan.id)}
                  className={`rounded-xl border p-5 cursor-pointer transition-all flex flex-col justify-between ${
                    isSelected
                      ? "border-primary bg-primary-soft/20 shadow-card ring-2 ring-primary/20"
                      : "border-border bg-surface hover:border-primary/50 shadow-xs"
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-small font-bold text-ink">
                        {plan.name}
                      </span>
                      <Badge variant={isSelected ? "primary" : "neutral"}>
                        {isPlanInstalments
                          ? `${planInstalments.length} Instalments`
                          : "Full Payment"}
                      </Badge>
                    </div>

                    <div className="pt-2 flex items-baseline gap-2">
                      <span className="text-h2 font-extrabold text-ink">
                        {formatINR(plan.totalPaise)}
                      </span>
                      {plan.originalPaise &&
                        plan.originalPaise > plan.totalPaise && (
                          <span className="text-small text-ink-muted line-through">
                            {formatINR(plan.originalPaise)}
                          </span>
                        )}
                    </div>

                    <div className="pt-2 border-t border-border/60 text-small text-ink">
                      <span className="text-caption text-ink-muted block uppercase font-bold tracking-wider">
                        Payable Now:
                      </span>
                      <span className="text-body font-bold text-primary">
                        {formatINR(planPayableNow)}
                      </span>
                      {isPlanInstalments && (
                        <span className="text-caption text-ink-muted ml-1.5">
                          (First instalment)
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="pt-4 flex items-center justify-between text-caption text-ink-muted">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2
                        className={`h-4 w-4 ${
                          isSelected ? "text-primary" : "text-border"
                        }`}
                      />
                      <span>
                        {isSelected ? "Selected plan" : "Click to select"}
                      </span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* DUES SUMMARY BREAKDOWN */}
          {selectedPlan && (
            <div className="rounded-xl border border-primary/20 bg-primary-soft/10 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-caption uppercase tracking-wider font-bold text-primary block">
                    Amount Payable Today
                  </span>
                  <span className="text-display font-black text-ink">
                    {formatINR(payableNowPaise)}
                  </span>
                </div>
                <Badge variant="primary" className="text-small px-3 py-1">
                  Step 1 of Enrollment
                </Badge>
              </div>

              {laterDues.length > 0 && (
                <div className="pt-3 border-t border-primary/20 space-y-2">
                  <span className="text-caption font-bold uppercase tracking-wider text-ink-muted block">
                    Upcoming Instalments Schedule:
                  </span>
                  <div className="divide-y divide-border/60 rounded-lg border border-border bg-surface overflow-hidden text-small">
                    {laterDues.map((inst, iIdx) => (
                      <div
                        key={iIdx}
                        className="p-3 flex items-center justify-between text-caption"
                      >
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-ink-muted" />
                          <span className="font-semibold text-ink">
                            {inst.label || `Instalment ${iIdx + 2}`}
                          </span>
                          {inst.due_date && (
                            <span className="text-ink-muted">
                              • Due on {inst.due_date}
                            </span>
                          )}
                        </div>
                        <span className="font-bold text-ink">
                          {inst.amount_paise
                            ? formatINR(inst.amount_paise)
                            : "—"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* STEP 2: STUDENT & PARENT DETAILS */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <h3 className="text-h3 font-bold text-ink flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              <span>2. Student &amp; Parent Profile</span>
            </h3>
            <span className="text-caption text-ink-muted">
              Pre-filled from your account (editable)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label
                htmlFor="studentName"
                className="text-small font-semibold text-ink"
              >
                Student Full Name
              </label>
              <input
                id="studentName"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-small text-ink focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="studentEmail"
                className="text-small font-semibold text-ink"
              >
                Account Email
              </label>
              <input
                id="studentEmail"
                type="email"
                disabled
                value={initialProfile.email}
                className="w-full rounded-lg border border-border bg-surface-subtle px-3.5 py-2.5 text-small text-ink-muted cursor-not-allowed"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="studentPhone"
                className="text-small font-semibold text-ink"
              >
                Student Mobile (WhatsApp)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-small text-ink-muted font-mono">
                  +91
                </span>
                <input
                  id="studentPhone"
                  type="tel"
                  required
                  placeholder="9897000000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-lg border border-border bg-surface pl-12 pr-3.5 py-2.5 text-small text-ink focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="parentName"
                className="text-small font-semibold text-ink"
              >
                Parent / Guardian Name
              </label>
              <input
                id="parentName"
                type="text"
                placeholder="Parent Name"
                value={parentName}
                onChange={(e) => setParentName(e.target.value)}
                className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-small text-ink focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label
                htmlFor="parentPhone"
                className="text-small font-semibold text-ink"
              >
                Parent Mobile Number
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-small text-ink-muted font-mono">
                  +91
                </span>
                <input
                  id="parentPhone"
                  type="tel"
                  placeholder="9897000000"
                  value={parentPhone}
                  onChange={(e) => setParentPhone(e.target.value)}
                  className="w-full rounded-lg border border-border bg-surface pl-12 pr-3.5 py-2.5 text-small text-ink focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                />
              </div>
            </div>
          </div>
        </div>

        {/* STEP 3: MANDATORY AGREEMENT CHECKBOX */}
        <div className="rounded-xl border border-border bg-surface-subtle p-4 sm:p-5 space-y-3">
          <label className="flex items-start gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              required
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary cursor-pointer shrink-0"
            />
            <span className="text-small text-ink leading-relaxed">
              I agree to the{" "}
              <Link
                href="/terms"
                target="_blank"
                className="font-bold text-primary hover:underline"
              >
                Terms of Service
              </Link>{" "}
              and the{" "}
              <Link
                href="/refund"
                target="_blank"
                className="font-bold text-primary hover:underline"
              >
                Refund Policy
              </Link>
              . I understand that classroom seats are non-transferable and subject to institute discipline rules.
            </span>
          </label>
        </div>

        {/* STEP 4: SUBMIT & PAY BUTTON */}
        <div className="space-y-3 pt-2">
          <button
            type="submit"
            disabled={isSubmitting || !agreedToTerms}
            className="w-full inline-flex items-center justify-center gap-2.5 rounded-lg bg-primary py-3.5 px-6 text-body font-bold text-surface shadow-md hover:bg-primary-hover active:scale-98 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Opening Razorpay Secure Checkout...</span>
              </>
            ) : (
              <>
                <Lock className="h-5 w-5" />
                <span>
                  Pay {formatINR(payableNowPaise)} with Razorpay
                </span>
              </>
            )}
          </button>

          <div className="flex items-center justify-center gap-4 text-caption text-ink-muted">
            <span className="flex items-center gap-1">
              <ShieldCheck className="h-4 w-4 text-success" />
              <span>256-Bit Encrypted Payments</span>
            </span>
            <span>•</span>
            <span>UPI, Cards, NetBanking, EMI</span>
            <span>•</span>
            <span>GST Invoice Generated</span>
          </div>
        </div>
      </form>
    </>
  );
}
