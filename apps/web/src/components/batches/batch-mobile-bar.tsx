"use client";

import Link from "next/link";
import { formatINR } from "@quick2learn/shared";
import { ArrowRight, UserPlus } from "lucide-react";

interface BatchMobileBarProps {
  pricePaise: number;
  isOpen: boolean;
  enrollHref?: string;
  onOpenEnquiry?: () => void;
  onOpenWaitlist?: () => void;
}

export function BatchMobileBar({
  pricePaise,
  isOpen,
  enrollHref,
  onOpenEnquiry,
  onOpenWaitlist,
}: BatchMobileBarProps) {
  return (
    <aside
      aria-label="Mobile enrollment action bar"
      className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/98 backdrop-blur-md border-t border-slate-200 p-3 px-4 shadow-2xl flex items-center justify-between gap-3"
    >
      <div className="flex flex-col">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
          {isOpen ? "Batch Admission Fee" : "Status"}
        </span>
        <span className="text-xl font-black text-slate-900 tracking-tight">
          {isOpen ? formatINR(pricePaise) : "Cohort Full"}
        </span>
      </div>

      <div className="shrink-0">
        {isOpen ? (
          onOpenEnquiry ? (
            <button
              type="button"
              onClick={onOpenEnquiry}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-small font-bold text-white shadow-md hover:bg-primary-hover active:scale-98 transition-all cursor-pointer"
            >
              <span>Inquire now</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <Link
              href={enrollHref || ""}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-small font-bold text-white shadow-md hover:bg-primary-hover active:scale-98 transition-all"
            >
              <span>Enroll now</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          )
        ) : (
          <button
            type="button"
            onClick={onOpenWaitlist}
            className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2.5 text-small font-bold text-white shadow-md hover:bg-slate-800 active:scale-98 transition-all cursor-pointer"
          >
            <UserPlus className="h-4 w-4" />
            <span>Join waitlist</span>
          </button>
        )}
      </div>
    </aside>
  );
}
