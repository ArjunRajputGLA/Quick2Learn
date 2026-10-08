import { notFound } from "next/navigation";
import { DevUiClient } from "./dev-ui-client";

export const metadata = {
  title: "Design System Gallery | Quick2Learn Dev",
  description: "Internal design system showcase showing every component and variant.",
};

export default function DevUiPage() {
  // Must return 404 in production
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return (
    <div className="bg-surface-subtle min-h-screen py-10">
      <div className="container-custom">
        <div className="mb-10 pb-6 border-b border-border">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary-soft px-3.5 py-1 text-caption font-semibold text-primary mb-3">
            <span>Quick2Learn Design System</span>
            <span>•</span>
            <span>Dev Only (404 in Production)</span>
          </div>
          <h1 className="text-display text-ink tracking-tight mb-2">
            Component Gallery & Tokens
          </h1>
          <p className="text-body text-ink-muted max-w-3xl">
            Visual reference: coursera.org layout patterns. Clean white pages, one strong indigo brand
            color, generous whitespace, card grids, horizontal card carousels, a
            pill-shaped search bar, calm typography, and server-side KaTeX mathematics.
          </p>
        </div>

        <DevUiClient />
      </div>
    </div>
  );
}
