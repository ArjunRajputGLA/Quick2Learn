import { Breadcrumbs, type BreadcrumbItem } from "@/components/ui/breadcrumbs";
import { cn } from "@/lib/utils";

interface BreadcrumbsPlacementProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function BreadcrumbsPlacement({ items, className }: BreadcrumbsPlacementProps) {
  if (!items || items.length === 0) return null;

  return (
    <div className={cn("border-b border-border bg-surface-subtle/50 py-3", className)}>
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <Breadcrumbs items={items} />
      </div>
    </div>
  );
}
