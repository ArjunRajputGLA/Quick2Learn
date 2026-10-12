"use client";

import { Suspense } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { ArrowUpDown } from "lucide-react";

interface SearchHeaderBarProps {
  totalCount: number;
  currentSort: string;
}

function SearchHeaderBarContent({ totalCount, currentSort }: SearchHeaderBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleSortChange = (newSort: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", newSort);
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-border mb-6">
      <div className="text-body font-semibold text-ink">
        <span>Showing </span>
        <span className="text-primary font-bold">{totalCount}</span>
        <span> matching {totalCount === 1 ? "result" : "results"}</span>
      </div>

      <div className="flex items-center gap-2 self-end sm:self-auto">
        <label
          htmlFor="search-sort-select"
          className="text-caption font-semibold text-ink-muted flex items-center gap-1"
        >
          <ArrowUpDown className="h-3.5 w-3.5" />
          <span>Sort by:</span>
        </label>
        <select
          id="search-sort-select"
          value={currentSort || "relevance"}
          onChange={(e) => handleSortChange(e.target.value)}
          className="rounded-md border border-border bg-surface px-3 py-1.5 text-small font-medium text-ink shadow-xs focus:border-primary focus:outline-hidden focus:ring-1 focus:ring-primary cursor-pointer"
        >
          <option value="relevance">Relevance</option>
          <option value="newest">Newest First</option>
          <option value="views">Most Viewed</option>
        </select>
      </div>
    </div>
  );
}

export function SearchHeaderBar(props: SearchHeaderBarProps) {
  return (
    <Suspense fallback={null}>
      <SearchHeaderBarContent {...props} />
    </Suspense>
  );
}
