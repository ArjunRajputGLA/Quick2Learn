"use client";

import { Printer } from "lucide-react";

export function PrintReceiptButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-white hover:bg-neutral-subtle font-semibold text-body-sm text-ink transition-colors shadow-xs cursor-pointer"
    >
      <Printer className="w-4 h-4 text-primary" />
      <span>Download PDF (Print)</span>
    </button>
  );
}
