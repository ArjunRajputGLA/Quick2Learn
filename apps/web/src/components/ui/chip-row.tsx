"use client";

import * as React from "react";
import { Chip } from "@/components/ui/chip";
import { cn } from "@/lib/utils";

export interface ChipOption {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

export interface ChipRowProps {
  options: ChipOption[];
  selectedId: string;
  onSelect: (id: string) => void;
  className?: string;
  wrap?: boolean;
}

export function ChipRow({
  options,
  selectedId,
  onSelect,
  className,
  wrap = false,
}: ChipRowProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 py-1",
        wrap ? "flex-wrap" : "overflow-x-auto no-scrollbar",
        className,
      )}
    >
      {options.map((opt) => (
        <Chip
          key={opt.id}
          selected={opt.id === selectedId}
          onClick={() => onSelect(opt.id)}
          icon={opt.icon}
        >
          {opt.label}
        </Chip>
      ))}
    </div>
  );
}
