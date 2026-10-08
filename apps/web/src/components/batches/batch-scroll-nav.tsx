"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface BatchScrollNavProps {
  sections: Array<{
    id: string;
    label: string;
  }>;
}

export function BatchScrollNav({ sections }: BatchScrollNavProps) {
  const [activeSection, setActiveSection] = React.useState<string>(
    sections[0]?.id || "about",
  );

  React.useEffect(() => {
    const handleScroll = () => {
      // Offset from top of viewport to trigger active section
      const scrollPos = window.scrollY + 120;

      for (let i = sections.length - 1; i >= 0; i--) {
        const sec = sections[i];
        if (!sec) continue;
        const el = document.getElementById(sec.id);
        if (el) {
          const top = el.offsetTop;
          if (scrollPos >= top) {
            setActiveSection(sec.id);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [sections]);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const yOffset = -90; // account for sticky header and nav
      const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: "smooth" });
      setActiveSection(id);
    }
  };

  return (
    <nav
      aria-label="Batch section navigation"
      className="sticky top-16 z-30 bg-surface/95 backdrop-blur-xs border-b border-border shadow-xs"
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center space-x-1 sm:space-x-4 overflow-x-auto scrollbar-none py-1">
          {sections.map((sec) => {
            const isActive = activeSection === sec.id;
            return (
              <a
                key={sec.id}
                href={`#${sec.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  scrollToSection(sec.id);
                }}
                className={cn(
                  "relative py-3.5 px-3 text-small font-semibold whitespace-nowrap transition-colors cursor-pointer",
                  isActive
                    ? "text-primary"
                    : "text-ink-muted hover:text-ink",
                )}
              >
                <span>{sec.label}</span>
                {isActive && (
                  <span className="absolute bottom-0 inset-x-2 h-0.5 bg-primary rounded-full" />
                )}
              </a>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
