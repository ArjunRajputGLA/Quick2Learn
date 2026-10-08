import * as React from "react";
import { cn } from "@/lib/utils";

export interface StatCardProps {
  value: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  trend?: string;
  className?: string;
}

export function StatCard({
  value,
  label,
  description,
  icon,
  trend,
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "flex flex-col justify-between rounded-md border border-border bg-surface p-5 shadow-card transition-all",
        className,
      )}
    >
      <div className="flex items-start justify-between">
        <span className="text-small font-medium text-ink-muted">{label}</span>
        {icon && (
          <div className="h-9 w-9 rounded-md bg-primary-soft text-primary flex items-center justify-center shrink-0">
            {icon}
          </div>
        )}
      </div>

      <div className="mt-3">
        <div className="text-display font-semibold tracking-tight text-ink leading-tight">
          {value}
        </div>
        {description && (
          <p className="mt-1 text-small text-ink-muted leading-relaxed">
            {description}
          </p>
        )}
        {trend && (
          <span className="mt-2 inline-flex items-center text-caption font-semibold text-success">
            {trend}
          </span>
        )}
      </div>
    </div>
  );
}
