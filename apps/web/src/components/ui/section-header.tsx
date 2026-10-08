import * as React from "react";
import { cn } from "@/lib/utils";

export interface SectionHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  align?: "left" | "center";
  className?: string;
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  action,
  align = "left",
  className,
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 md:flex-row md:items-end justify-between pb-4",
        align === "center" && "text-center md:flex-col md:items-center",
        className,
      )}
    >
      <div className={cn("space-y-1.5", align === "center" && "max-w-2xl mx-auto")}>
        {eyebrow && (
          <p className="text-caption font-semibold uppercase tracking-wider text-primary">
            {eyebrow}
          </p>
        )}
        <h2 className="text-h2 font-semibold text-ink tracking-tight">
          {title}
        </h2>
        {description && (
          <p className="text-body text-ink-muted leading-relaxed">
            {description}
          </p>
        )}
      </div>

      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
