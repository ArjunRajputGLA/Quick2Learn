"use client";

import { Toaster as SonnerToaster } from "sonner";

export function Toaster() {
  return (
    <SonnerToaster
      position="top-right"
      toastOptions={{
        classNames: {
          toast:
            "border border-border bg-surface text-ink shadow-card rounded-md font-sans text-small p-4",
          description: "text-ink-muted text-caption",
          actionButton: "bg-primary text-surface rounded-sm text-caption px-3 py-1 font-medium",
          cancelButton: "bg-surface-subtle text-ink rounded-sm text-caption px-3 py-1",
          success: "border-success/30 text-success bg-surface",
          error: "border-danger/30 text-danger bg-surface",
          warning: "border-warning/30 text-warning bg-surface",
          info: "border-primary/30 text-primary bg-surface",
        },
      }}
    />
  );
}
