"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PaginationProps extends React.HTMLAttributes<HTMLElement> {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  className,
  ...props
}: PaginationProps) {
  const getPageNumbers = () => {
    const pages: (number | "ellipsis")[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push("ellipsis");
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push("ellipsis");
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <nav
      role="navigation"
      aria-label="pagination"
      className={cn("flex items-center justify-center gap-1.5", className)}
      {...props}
    >
      <button
        type="button"
        disabled={currentPage <= 1}
        onClick={() => onPageChange(currentPage - 1)}
        aria-label="Previous page"
        className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-surface text-ink hover:bg-surface-subtle disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      {getPageNumbers().map((page, index) => {
        if (page === "ellipsis") {
          return (
            <span
              key={`ellipsis-${index}`}
              className="inline-flex h-9 w-9 items-center justify-center text-small text-ink-muted select-none"
            >
              …
            </span>
          );
        }

        const isCurrent = page === currentPage;
        return (
          <button
            key={page}
            type="button"
            aria-current={isCurrent ? "page" : undefined}
            onClick={() => onPageChange(page)}
            className={cn(
              "inline-flex h-9 w-9 items-center justify-center rounded-md text-small font-medium transition-colors select-none cursor-pointer",
              isCurrent
                ? "bg-primary text-surface font-semibold shadow-xs"
                : "border border-border bg-surface text-ink hover:bg-surface-subtle",
            )}
          >
            {page}
          </button>
        );
      })}

      <button
        type="button"
        disabled={currentPage >= totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        aria-label="Next page"
        className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-surface text-ink hover:bg-surface-subtle disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </nav>
  );
}
