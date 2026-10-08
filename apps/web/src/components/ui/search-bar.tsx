"use client";

import * as React from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SearchBarProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onSubmit"> {
  onSearch?: (term: string) => void;
  onClear?: () => void;
  isPill?: boolean;
}

export function SearchBar({
  value,
  defaultValue = "",
  onChange,
  onSearch,
  onClear,
  isPill = true,
  placeholder = "Search lectures, formulas, or batches...",
  className,
  ...props
}: SearchBarProps) {
  const [term, setTerm] = React.useState<string>(
    String(value ?? defaultValue ?? ""),
  );

  React.useEffect(() => {
    if (value !== undefined) {
      setTerm(String(value));
    }
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (value === undefined) {
      setTerm(e.target.value);
    }
    onChange?.(e);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.(term);
  };

  const handleClear = () => {
    setTerm("");
    onClear?.();
  };

  return (
    <form
      onSubmit={handleFormSubmit}
      className={cn("relative flex w-full items-center", className)}
    >
      <div className="pointer-events-none absolute left-4 text-ink-muted">
        <Search className="h-4 w-4" />
      </div>

      <input
        type="search"
        value={term}
        onChange={handleInputChange}
        placeholder={placeholder}
        className={cn(
          "h-11 w-full border border-border bg-surface pl-11 pr-10 text-body text-ink transition-all placeholder:text-ink-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary",
          isPill ? "rounded-full shadow-card hover:shadow-card-hover" : "rounded-md",
        )}
        {...props}
      />

      {term && (
        <button
          type="button"
          onClick={handleClear}
          aria-label="Clear search"
          className="absolute right-3.5 rounded-full p-1 text-ink-muted hover:text-ink hover:bg-surface-subtle transition-colors cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </form>
  );
}
