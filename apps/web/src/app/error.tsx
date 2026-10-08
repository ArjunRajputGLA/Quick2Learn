"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, Video, Calendar, Home } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";

export default function GlobalErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Unhandled application error:", error);
  }, [error]);

  return (
    <div className="container mx-auto px-4 py-20 flex items-center justify-center min-h-[60vh]">
      <EmptyState
        icon={<AlertTriangle className="h-8 w-8 text-danger" />}
        title="Something Went Wrong"
        description="An unexpected error occurred while loading this page. You can retry the operation or return to our primary sections."
        actionLabel="Try Again"
        onAction={() => reset()}
        secondaryAction={
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/">
              <Button variant="outline" size="md" className="gap-1.5">
                <Home className="h-4 w-4" />
                <span>Home</span>
              </Button>
            </Link>
            <Link href="/batches">
              <Button variant="ghost" size="md" className="gap-1.5">
                <Calendar className="h-4 w-4" />
                <span>Batches</span>
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
