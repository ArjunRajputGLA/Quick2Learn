import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap text-body font-medium transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer active:scale-[0.97]",
  {
    variants: {
      variant: {
        primary:
          "bg-primary text-surface hover:bg-primary-hover shadow-card hover:shadow-card-hover hover:-translate-y-0.5",
        outline:
          "border border-border bg-surface text-ink hover:bg-surface-subtle hover:border-primary/50 hover:text-primary hover:-translate-y-0.5 shadow-xs hover:shadow-card",
        ghost:
          "text-ink hover:bg-surface-subtle hover:text-primary hover:scale-[1.02]",
        link:
          "text-primary underline-offset-4 hover:underline p-0 h-auto font-medium hover:opacity-90",
      },
      size: {
        sm: "h-8 px-3 text-small rounded-sm",
        md: "h-10 px-4 text-body rounded-md",
        lg: "h-12 px-6 text-body font-medium rounded-md",
        icon: "h-10 w-10 p-0 rounded-md",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
