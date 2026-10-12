"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface AccordionContextValue {
  openItems: Set<string>;
  toggleItem: (value: string) => void;
}

const AccordionContext = React.createContext<AccordionContextValue | null>(null);

export interface AccordionProps extends React.HTMLAttributes<HTMLDivElement> {
  type?: "single" | "multiple";
  defaultValue?: string | string[];
}

export function Accordion({
  type = "single",
  defaultValue,
  className,
  children,
  ...props
}: AccordionProps) {
  const [openItems, setOpenItems] = React.useState<Set<string>>(() => {
    if (!defaultValue) return new Set();
    return new Set(Array.isArray(defaultValue) ? defaultValue : [defaultValue]);
  });

  const toggleItem = (val: string) => {
    setOpenItems((prev) => {
      const next = new Set(type === "single" ? [] : prev);
      if (prev.has(val)) {
        next.delete(val);
      } else {
        next.add(val);
      }
      return next;
    });
  };

  return (
    <AccordionContext.Provider value={{ openItems, toggleItem }}>
      <div className={cn("divide-y divide-border border-y border-border", className)} {...props}>
        {children}
      </div>
    </AccordionContext.Provider>
  );
}

export interface AccordionItemProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
}

export function AccordionItem({ value, className, children, ...props }: AccordionItemProps) {
  return (
    <div data-value={value} className={cn("py-1", className)} {...props}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, { itemValue: value } as Record<string, unknown>);
        }
        return child;
      })}
    </div>
  );
}

export interface AccordionTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  itemValue?: string;
}

export function AccordionTrigger({
  itemValue,
  className,
  children,
  ...props
}: AccordionTriggerProps) {
  const context = React.useContext(AccordionContext);
  if (!context || !itemValue) {
    throw new Error("AccordionTrigger must be used within AccordionItem");
  }

  const isOpen = context.openItems.has(itemValue);

  return (
    <button
      type="button"
      onClick={() => context.toggleItem(itemValue)}
      aria-expanded={isOpen}
      className={cn(
        "flex w-full items-center justify-between py-3.5 text-left text-body font-medium text-ink transition-all duration-200 hover:text-primary hover:translate-x-0.5 cursor-pointer select-none",
        className,
      )}
      {...props}
    >
      <span>{children}</span>
      <ChevronDown
        className={cn(
          "h-4 w-4 text-ink-muted transition-transform duration-300 shrink-0",
          isOpen && "rotate-180 text-primary",
        )}
      />
    </button>
  );
}

export interface AccordionContentProps extends React.HTMLAttributes<HTMLDivElement> {
  itemValue?: string;
}

export function AccordionContent({
  itemValue,
  className,
  children,
  ...props
}: AccordionContentProps) {
  const context = React.useContext(AccordionContext);
  if (!context || !itemValue) {
    throw new Error("AccordionContent must be used within AccordionItem");
  }

  const isOpen = context.openItems.has(itemValue);
  if (!isOpen) return null;

  return (
    <div
      className={cn("pb-4 pt-1 text-small text-ink-muted leading-relaxed animate-fade-in-up", className)}
      {...props}
    >
      {children}
    </div>
  );
}
