"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

import {
  Info,
  Sparkles,
  BookOpen,
  GraduationCap,
  CreditCard,
  HelpCircle,
} from "lucide-react";

interface BatchScrollNavProps {
  sections: Array<{
    id: string;
    label: string;
  }>;
}

const sectionIcons: Record<string, React.ElementType> = {
  about: Info,
  outcomes: Sparkles,
  syllabus: BookOpen,
  teacher: GraduationCap,
  fees: CreditCard,
  faqs: HelpCircle,
};

export function BatchScrollNav({ sections }: BatchScrollNavProps) {
  const [activeSection, setActiveSection] = React.useState<string>(
    sections[0]?.id || "about",
  );

  React.useEffect(() => {
    const handleScroll = () => {
      // Offset from top of viewport to trigger active section
      const scrollPos = window.scrollY + 130;

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
      const yOffset = -124; // account for sticky header (64px) + subnav (50px) + 10px breathing room
      const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: "smooth" });
      setActiveSection(id);
    }
  };

  return (
    <nav
      aria-label="Batch section navigation"
      className="sticky top-16 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs"
    >
      <div className="container mx-auto px-4 max-w-[1280px]">
        <div className="flex items-center space-x-1 sm:space-x-3 overflow-x-auto scrollbar-none py-1.5">
          {sections.map((sec) => {
            const isActive = activeSection === sec.id;
            const Icon = sectionIcons[sec.id] || Info;
            return (
              <a
                key={sec.id}
                href={`#${sec.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  scrollToSection(sec.id);
                }}
                className={cn(
                  "relative flex items-center gap-2 py-2.5 px-3.5 rounded-lg text-xs sm:text-small font-semibold whitespace-nowrap transition-all cursor-pointer",
                  isActive
                    ? "bg-primary/10 text-primary font-bold shadow-2xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70",
                )}
              >
                <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-primary" : "text-slate-400")} />
                <span>{sec.label}</span>
                {isActive && (
                  <span className="absolute bottom-0 inset-x-3 h-0.5 bg-primary rounded-full hidden sm:block" />
                )}
              </a>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
