"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  side?: "right" | "left" | "bottom";
  children: React.ReactNode;
}

export function Sheet({
  open,
  onOpenChange,
  side = "right",
  children,
}: SheetProps) {
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        onOpenChange(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onOpenChange]);

  if (!open) return null;

  const sideClasses = {
    right: "inset-y-0 right-0 h-full w-full max-w-sm border-l animate-in slide-in-from-right duration-200",
    left: "inset-y-0 left-0 h-full w-full max-w-sm border-r animate-in slide-in-from-left duration-200",
    bottom: "inset-x-0 bottom-0 max-h-[85vh] w-full border-t rounded-t-lg animate-in slide-in-from-bottom duration-200",
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-ink/40 backdrop-blur-xs transition-opacity animate-in fade-in-0 duration-150"
        onClick={() => onOpenChange(false)}
      />
      {/* Drawer Container */}
      <div
        className={cn(
          "fixed z-50 border-border bg-surface p-6 shadow-xl flex flex-col",
          sideClasses[side],
        )}
      >
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className="absolute right-4 top-4 rounded-sm p-1 text-ink-muted hover:text-ink hover:bg-surface-subtle transition-colors cursor-pointer"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close drawer</span>
        </button>
        {children}
      </div>
    </div>
  );
}

export function SheetHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex flex-col space-y-1.5 text-left mb-4", className)}
      {...props}
    />
  );
}

export function SheetTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      className={cn("text-h3 font-semibold text-ink leading-none", className)}
      {...props}
    />
  );
}

export function SheetDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn("text-small text-ink-muted leading-normal mt-1", className)}
      {...props}
    />
  );
}
