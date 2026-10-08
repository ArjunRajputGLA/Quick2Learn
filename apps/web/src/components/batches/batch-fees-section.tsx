import Link from "next/link";
import { formatINR } from "@quick2learn/shared";
import { Badge } from "@/components/ui/badge";
import { Check, ArrowRight } from "lucide-react";
import type { BatchFeePlanItem } from "@/server/data/batches";

interface BatchFeesSectionProps {
  isOpen: boolean;
  feePlans: BatchFeePlanItem[];
  enrollBaseHref: string;
  onOpenWaitlist?: () => void;
}

export function BatchFeesSection({
  isOpen,
  feePlans,
  enrollBaseHref,
  onOpenWaitlist,
}: BatchFeesSectionProps) {
  if (!feePlans || feePlans.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-surface p-8 text-center text-ink-muted">
        Fee plan details for this batch are currently being finalized.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {feePlans.map((plan, idx) => {
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
            className={`rounded-xl border p-6 flex flex-col justify-between transition-all ${
              isFeatured
                ? "border-primary/40 bg-gradient-to-b from-primary-soft/30 to-surface shadow-card hover:shadow-card-hover"
                : "border-border bg-surface shadow-xs hover:shadow-card"
            }`}
          >
            <div className="space-y-4">
              {/* Header Badges */}
              <div className="flex items-center justify-between gap-2">
                <Badge variant={hasInstalments ? "neutral" : "primary"}>
                  {hasInstalments ? `${instalments.length} Instalments` : "Full Payment (One-Time)"}
                </Badge>
                {savingsPaise > 0 && (
                  <Badge variant="accent" className="font-bold text-[11px]">
                    Save {formatINR(savingsPaise)}
                  </Badge>
                )}
              </div>

              {/* Title & Price */}
              <div>
                <h4 className="text-h3 font-bold text-ink">{plan.name}</h4>
                <div className="mt-3 flex items-baseline gap-2.5">
                  <span className="text-display font-extrabold text-ink">
                    {formatINR(plan.totalPaise)}
                  </span>
                  {plan.originalPaise && plan.originalPaise > plan.totalPaise && (
                    <span className="text-body text-ink-muted line-through">
                      {formatINR(plan.originalPaise)}
                    </span>
                  )}
                </div>
                <p className="text-caption text-ink-muted mt-1">
                  Inclusive of all study material, test series, and GST.
                </p>
              </div>

              {/* Instalments Schedule Table (if instalments exist) */}
              {hasInstalments && (
                <div className="space-y-2 pt-3 border-t border-border">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-ink-muted">
                    Instalment Due Schedule:
                  </span>
                  <div className="divide-y divide-border/60 rounded-lg border border-border bg-surface-subtle overflow-hidden">
                    {instalments.map((inst, iIdx) => (
                      <div
                        key={iIdx}
                        className="p-2.5 px-3 flex items-center justify-between text-caption"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-ink">
                            {inst.label || `Instalment ${iIdx + 1}`}
                          </span>
                          {inst.due_date && (
                            <span className="text-ink-muted flex items-center gap-1">
                              • Due: {inst.due_date}
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
              <ul className="space-y-2 pt-2 text-small text-ink">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-success shrink-0" />
                  <span>Full academic year classroom / hybrid mentorship</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-success shrink-0" />
                  <span>Printed NCERT problem worksheets &amp; formula booklets</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-success shrink-0" />
                  <span>Weekly Sunday board examination mock test series</span>
                </li>
              </ul>
            </div>

            {/* CTA Button */}
            <div className="pt-6 mt-6 border-t border-border">
              {isOpen ? (
                <Link
                  href={`${enrollBaseHref}?plan=${plan.id}`}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary py-3 text-small font-bold text-surface shadow-xs hover:bg-primary-hover active:scale-98 transition-all"
                >
                  <span>Enroll with this plan</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={onOpenWaitlist}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-neutral-800 py-3 text-small font-bold text-surface hover:bg-neutral-900 active:scale-98 transition-all cursor-pointer"
                >
                  <span>Join waitlist for this plan</span>
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
