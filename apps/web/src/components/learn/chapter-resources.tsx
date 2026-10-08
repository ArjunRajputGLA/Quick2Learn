import { FileText, Download, FileSpreadsheet, BookmarkCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ChapterResourceItem {
  id: string;
  title: string;
  type: string;
  storageKey: string;
}

interface ChapterResourcesProps {
  resources: ChapterResourceItem[];
  title?: string;
}

function getResourceIcon(type: string) {
  switch (type.toLowerCase()) {
    case "formula_sheet":
      return <FileSpreadsheet className="h-5 w-5 text-accent" />;
    case "pyq":
      return <BookmarkCheck className="h-5 w-5 text-success" />;
    case "notes":
    case "worksheet":
    default:
      return <FileText className="h-5 w-5 text-primary" />;
  }
}

export function ChapterResources({
  resources,
  title = "Attached Study Material & Notes",
}: ChapterResourcesProps) {
  if (!resources || resources.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-border">
        <h3 className="text-body font-bold text-ink flex items-center gap-2">
          <FileText className="h-4.5 w-4.5 text-primary" />
          <span>{title} ({resources.length})</span>
        </h3>
        <span className="text-caption text-ink-muted">Free Download</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {resources.map((res) => (
          <div
            key={res.id}
            className="flex items-center justify-between p-3.5 rounded-lg border border-border bg-surface hover:bg-surface-subtle transition-all duration-200"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2 rounded-md bg-surface-subtle shrink-0">
                {getResourceIcon(res.type)}
              </div>
              <div className="min-w-0">
                <h4 className="text-small font-semibold text-ink truncate">
                  {res.title}
                </h4>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge variant="neutral" className="text-[10px] uppercase">
                    {res.type.replace("_", " ")}
                  </Badge>
                </div>
              </div>
            </div>

            <a
              href={`#download-${res.id}`}
              className="p-2 rounded-md hover:bg-primary-soft text-primary transition-colors shrink-0 ml-2"
              title={`Download ${res.title}`}
            >
              <Download className="h-4 w-4" />
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
