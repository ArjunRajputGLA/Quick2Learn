import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  isPill?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, isPill, ...props }, ref) => {
    return (
      <input
        type={type}
        suppressHydrationWarning={props.suppressHydrationWarning ?? true}
        className={cn(
          "flex h-10 w-full border border-border bg-surface px-3.5 py-2 text-body text-ink transition-colors file:border-0 file:bg-transparent file:text-small file:font-medium placeholder:text-ink-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50",
          isPill ? "rounded-full px-5" : "rounded-md",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
