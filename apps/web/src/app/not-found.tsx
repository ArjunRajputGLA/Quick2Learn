import Link from "next/link";
import { FileQuestion, Video, Calendar } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="container mx-auto px-4 py-20 flex items-center justify-center min-h-[60vh]">
      <EmptyState
        icon={<FileQuestion className="h-8 w-8 text-primary" />}
        title="Page Not Found (404)"
        description="The page you requested could not be found or may have been moved. You can head back to the home page or explore our active batches and free video lectures."
        actionLabel="Back to Home"
        actionHref="/"
        secondaryAction={
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/batches">
              <Button variant="outline" size="md" className="gap-1.5">
                <Calendar className="h-4 w-4" />
                <span>All Batches</span>
              </Button>
            </Link>
            <Link href="/lectures">
              <Button variant="ghost" size="md" className="gap-1.5">
                <Video className="h-4 w-4" />
                <span>Free Lectures</span>
              </Button>
            </Link>
          </div>
        }
        className="max-w-xl mx-auto shadow-sm bg-surface"
      />
    </div>
  );
}
