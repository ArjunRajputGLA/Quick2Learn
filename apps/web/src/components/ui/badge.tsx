import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-caption font-medium transition-colors select-none",
  {
    variants: {
      variant: {
        neutral: "bg-surface-subtle text-ink border border-border",
        primary: "bg-primary-soft text-primary border border-primary/20",
        accent: "bg-accent-soft text-warning border border-accent/30 font-semibold",
        success: "bg-emerald-50 text-success border border-success/25 font-semibold",
        critical: "bg-rose-50 text-rose-700 border border-rose-200 font-semibold",
      },
    },
    defaultVariants: {
      variant: "neutral",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
