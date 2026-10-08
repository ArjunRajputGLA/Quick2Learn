"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface ChipProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean;
  onSelectedChange?: (selected: boolean) => void;
  icon?: React.ReactNode;
}

export function Chip({
  className,
  children,
  selected = false,
  onSelectedChange,
  onClick,
  icon,
  ...props
}: ChipProps) {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    onSelectedChange?.(!selected);
    onClick?.(e);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-small font-medium transition-all select-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50 disabled:cursor-not-allowed",
        selected
          ? "bg-primary text-surface border border-primary shadow-xs"
          : "bg-surface text-ink border border-border hover:bg-surface-subtle active:scale-[0.98]",
        className,
      )}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </button>
  );
}
