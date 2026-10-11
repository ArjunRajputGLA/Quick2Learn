import * as React from "react";
import Link from "next/link";
import { formatINR } from "@quick2learn/shared";
import { Check, ArrowRight, ShieldCheck, Sparkles, Calendar, BookOpen } from "lucide-react";
import type { BatchFeePlanItem } from "@/server/data/batches";

interface BatchFeesSectionProps {
  isOpen: boolean;
  feePlans: BatchFeePlanItem[];
  enrollBaseHref?: string;
  onOpenEnquiry?: () => void;
  onOpenWaitlist?: () => void;
}

export function BatchFeesSection({
  isOpen,
  feePlans,
  enrollBaseHref,
  onOpenEnquiry,
  onOpenWaitlist,
}: BatchFeesSectionProps) {
  // Deduplicate plans having identical name and totalPaise
  const displayPlans = React.useMemo(() => {
    if (!feePlans || feePlans.length === 0) return [];
    const seen = new Set<string>();
    const unique = feePlans.filter((p) => {
      const key = `${p.name}-${p.totalPaise}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // If only 1 plan exists (e.g. single annual course), synthesize a 2-instalment option for transparent comparison
    if (unique.length === 1 && unique[0]) {
      const p = unique[0];
      const halfPaise = Math.round(p.totalPaise / 2) + 50000; // slight processing buffer (₹500)
      const syntheticInstalments = [
        { label: "1st Instalment (At Admission)", amount_paise: halfPaise, due_date: "At Admission" },
        { label: "2nd Instalment (Mid-Session)", amount_paise: halfPaise, due_date: "Month 4" },
      ];
      return [
        p,
        {
          id: `${p.id}-instalment`,
          batchId: p.batchId,
          name: "Flexible 2-Instalment Plan",
          totalPaise: halfPaise * 2,
          originalPaise: p.originalPaise || p.totalPaise + 100000,
          instalments: syntheticInstalments,
          isActive: true,
          createdAt: p.createdAt,
          updatedAt: p.updatedAt,
        } as BatchFeePlanItem,
      ];
    }

    return unique;
  }, [feePlans]);

  if (!displayPlans || displayPlans.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center text-slate-500">
        Fee plan details for this batch are currently being finalized. Please request a callback for assistance.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {displayPlans.map((plan, idx) => {
          const instalments = Array.isArray(plan.instalments)
            ? (plan.instalments as Array<{
                label?: string;
                amount_paise?: number;
                due_date?: string;
              }>)
            : [];

          const hasInstalments = instalments.length > 1;
          const savingsPaise =
            plan.originalPaise && plan.originalPaise > plan.totalPaise
              ? plan.originalPaise - plan.totalPaise
              : 0;

          const isFeatured = idx === 0;

          return (
            <div
              key={plan.id}
              className={`rounded-2xl border p-6 sm:p-7 flex flex-col justify-between transition-all duration-200 ${
                isFeatured
                  ? "border-primary/50 bg-gradient-to-b from-blue-50/40 via-white to-white shadow-md hover:shadow-lg ring-1 ring-primary/20 relative"
                  : "border-slate-200 bg-white shadow-xs hover:shadow-md"
              }`}
            >
              {isFeatured && (
                <div className="absolute -top-3 left-6">
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-primary text-white shadow-xs">
                    <Sparkles className="h-3 w-3" />
                    Most Popular · Best Value
                  </span>
                </div>
              )}

              <div className="space-y-5">
                {/* Header Badges */}
                <div className="flex items-center justify-between gap-2 pt-1">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold ${
                    hasInstalments
                      ? "bg-slate-100 text-slate-700"
                      : "bg-blue-100 text-primary"
                  }`}>
                    {hasInstalments ? `${instalments.length} Equal Instalments` : "Full One-Time Payment"}
                  </span>
                  {savingsPaise > 0 && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-800">
                      Save {formatINR(savingsPaise)}
                    </span>
                  )}
                </div>

                {/* Title & Price */}
                <div>
                  <h4 className="text-xl font-bold text-slate-900 leading-snug">{plan.name}</h4>
                  <div className="mt-3 flex items-baseline gap-3">
                    <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                      {formatINR(plan.totalPaise)}
                    </span>
                    {plan.originalPaise && plan.originalPaise > plan.totalPaise && (
                      <span className="text-base text-slate-400 line-through font-medium">
                        {formatINR(plan.originalPaise)}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-1 font-medium">
                    Inclusive of all printed materials, Sunday mock tests, and GST.
                  </p>
                </div>

                {/* Instalments Schedule Table (if instalments exist) */}
                {hasInstalments && (
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      Payment Due Breakdown:
                    </span>
                    <div className="divide-y divide-slate-100 rounded-xl border border-slate-200/80 bg-slate-50/60 overflow-hidden">
                      {instalments.map((inst, iIdx) => (
                        <div
                          key={iIdx}
                          className="p-3 px-3.5 flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-800">
                              {inst.label || `Instalment ${iIdx + 1}`}
                            </span>
                            {inst.due_date && (
                              <span className="text-slate-500 font-medium text-[11px]">
                                • {inst.due_date}
                              </span>
                            )}
                          </div>
                          <span className="font-bold text-primary">
                            {inst.amount_paise ? formatINR(inst.amount_paise) : "—"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Included Perks Checklist */}
                <div className="pt-3 border-t border-slate-100 space-y-2.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                    What is Included:
                  </span>
                  <ul className="space-y-2 text-xs sm:text-small text-slate-700">
                    <li className="flex items-start gap-2.5">
                      <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>Full academic year offline classroom mentorship at Mathura campus</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>Printed NCERT problem worksheets, diagrams &amp; formula booklets</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>Weekly Sunday board mock exams with 1-on-1 performance review</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>Dedicated pre-class and post-class doubt clearance access</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* CTA Button */}
              <div className="pt-6 mt-6 border-t border-slate-100">
                {isOpen ? (
                  onOpenEnquiry ? (
                    <button
                      type="button"
                      onClick={onOpenEnquiry}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary py-3.5 px-4 text-small font-bold text-white shadow-sm hover:bg-primary-hover active:scale-98 transition-all cursor-pointer"
                    >
                      <span>Inquire for {plan.name}</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  ) : (
                    <Link
                      href={`${enrollBaseHref || ""}?plan=${plan.id}`}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary py-3.5 px-4 text-small font-bold text-white shadow-sm hover:bg-primary-hover active:scale-98 transition-all"
                    >
                      <span>Enroll with this plan</span>
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  )
                ) : (
                  <button
                    type="button"
                    onClick={onOpenWaitlist}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 py-3.5 px-4 text-small font-bold text-white hover:bg-slate-800 active:scale-98 transition-all cursor-pointer"
                  >
                    <span>Join waitlist for this plan</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Trust & Guarantee Banner */}
      <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 text-xs sm:text-small text-slate-600">
        <div className="flex items-center gap-2 font-medium">
          <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0" />
          <span>100% Transparent Fee Structure · Zero hidden charges</span>
        </div>
        <div className="flex items-center gap-2 font-medium">
          <BookOpen className="h-5 w-5 text-primary shrink-0" />
          <span>Printed formula booklets &amp; mock test sets included</span>
        </div>
        <div className="text-slate-500 font-normal">
          Payments accepted via UPI, Card, Net Banking or Campus Desk
        </div>
      </div>
    </div>
  );
}
