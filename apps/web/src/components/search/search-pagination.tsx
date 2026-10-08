"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface SearchPaginationProps {
  currentPage: number;
  totalPages: number;
}

export function SearchPagination({ currentPage, totalPages }: SearchPaginationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (totalPages <= 1) return null;

  const navigateToPage = (p: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(p));
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <nav
      aria-label="Search results pagination"
      className="flex items-center justify-center gap-2 pt-8 border-t border-border mt-10"
    >
      <button
        type="button"
        disabled={currentPage <= 1}
        onClick={() => navigateToPage(currentPage - 1)}
        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-border bg-surface text-ink text-small font-semibold hover:bg-surface-subtle disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
        <span>Previous</span>
      </button>

      <div className="flex items-center gap-1 mx-2">
        {Array.from({ length: totalPages }).map((_, idx) => {
          const p = idx + 1;
          const isActive = p === currentPage;
          return (
            <button
              key={p}
              type="button"
              onClick={() => navigateToPage(p)}
              className={`h-9 w-9 rounded-md text-small font-semibold transition-colors ${
                isActive
                  ? "bg-primary text-surface shadow-xs"
                  : "bg-surface text-ink hover:bg-surface-subtle border border-border"
              }`}
            >
              {p}
            </button>
          );
        })}
      </div>

      <button
        type="button"
        disabled={currentPage >= totalPages}
        onClick={() => navigateToPage(currentPage + 1)}
        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-border bg-surface text-ink text-small font-semibold hover:bg-surface-subtle disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        <span>Next</span>
        <ChevronRight className="h-4 w-4" />
      </button>
    </nav>
  );
}
