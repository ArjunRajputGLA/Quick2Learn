"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Menu, X, Video, Calendar, Award } from "lucide-react";
import { Sheet } from "@/components/ui/sheet";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { SearchTypeahead } from "./search-typeahead";
import { AuthNav } from "./auth-nav";
import { type MegaMenuData } from "@/server/data/catalog";

interface MobileNavProps {
  data: MegaMenuData;
}

export function MobileNav({ data }: MobileNavProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <div className="flex items-center gap-1 lg:hidden">
      {/* 1. Mobile Search Icon Button */}
      <button
        type="button"
        onClick={() => setSearchOpen(true)}
        aria-label="Open search dialog"
        className="p-2 rounded-md text-ink hover:text-primary hover:bg-surface-subtle transition-colors cursor-pointer"
      >
        <Search className="h-5 w-5" />
      </button>

      {/* 2. Mobile Hamburger Button */}
      <button
        type="button"
        onClick={() => setMenuOpen(true)}
        aria-label="Open navigation menu"
        className="p-2 rounded-md text-ink hover:text-primary hover:bg-surface-subtle transition-colors cursor-pointer"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* 3. Full-Screen / Modal Search Overlay */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 bg-surface/98 backdrop-blur-md flex flex-col p-4 animate-in fade-in-0 duration-150">
          <div className="flex items-center justify-between pb-3 border-b border-border mb-4">
            <span className="font-bold text-h3 text-ink">Search Courses</span>
            <button
              type="button"
              onClick={() => setSearchOpen(false)}
              aria-label="Close search"
              className="p-2 rounded-full text-ink-muted hover:text-ink hover:bg-surface-subtle transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="w-full flex-1 max-w-lg mx-auto">
            <SearchTypeahead
              autoFocus
              isMobileModal
              onNavigate={() => setSearchOpen(false)}
            />
          </div>
        </div>
      )}

      {/* 4. Hamburger Sheet Drawer */}
      <Sheet open={menuOpen} onOpenChange={setMenuOpen} side="right">
        <div className="flex flex-col h-full overflow-y-auto">
          {/* Drawer Header */}
          <div className="pb-4 border-b border-border pr-8">
            <div className="font-bold text-h3 text-ink tracking-tight">
              Quick<span className="text-primary">2</span>Learn
            </div>
            <p className="text-caption text-ink-muted mt-0.5">
              Classes IX–XII • CBSE &amp; ICSE/ISC
            </p>
          </div>

          {/* Quick Direct Links */}
          <div className="py-4 space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-ink-muted px-1">
              Direct Access
            </span>
            <div className="grid grid-cols-1 gap-1 pt-1">
              <Link
                href="/lectures"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2.5 px-2.5 py-2 rounded-md text-small font-medium text-ink hover:bg-primary-soft hover:text-primary transition-colors"
              >
                <Video className="h-4 w-4 text-primary" />
                <span>All Free Lectures</span>
              </Link>
              <Link
                href="/batches"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2.5 px-2.5 py-2 rounded-md text-small font-medium text-ink hover:bg-primary-soft hover:text-primary transition-colors"
              >
                <Calendar className="h-4 w-4 text-accent" />
                <span>All Batches</span>
              </Link>
              <Link
                href="/results"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2.5 px-2.5 py-2 rounded-md text-small font-medium text-ink hover:bg-primary-soft hover:text-primary transition-colors"
              >
                <Award className="h-4 w-4 text-success" />
                <span>Results</span>
              </Link>
            </div>
          </div>

          {/* Accordion Version of Mega-Menu */}
          <div className="py-2 border-t border-border">
            <span className="text-[11px] font-bold uppercase tracking-wider text-ink-muted px-1 mb-2 block">
              Academic Curricula
            </span>

            <Accordion type="single" className="border-none divide-none">
              {data.classes.map((cls) => (
                <AccordionItem
                  key={cls.classSlug}
                  value={`class-${cls.classSlug}`}
                  className="border-b border-border/60 py-0"
                >
                  <AccordionTrigger className="text-small font-semibold py-2.5 hover:no-underline">
                    <span>Class {cls.classRoman}</span>
                  </AccordionTrigger>
                  <AccordionContent className="pb-3 pt-0">
                    <ul className="space-y-1.5 pl-3 border-l-2 border-primary/30 ml-1">
                      {cls.subjects.map((sub) => (
                        <li key={sub.id}>
                          <Link
                            href={sub.href}
                            onClick={() => setMenuOpen(false)}
                            className="block text-small text-ink-muted hover:text-primary transition-colors py-1"
                          >
                            <span className="font-medium">{sub.name}</span>
                            {sub.chapterCount !== undefined && sub.chapterCount > 0 && (
                              <span className="text-[11px] text-ink-muted/70 block">
                                {sub.chapterCount} chapters
                              </span>
                            )}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>

          {/* Auth State & Sign In Actions at the Bottom */}
          <div className="mt-auto pt-6 border-t border-border">
            <div className="flex flex-col gap-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-ink-muted px-1">
                Account
              </span>
              <div className="px-1" onClick={() => setMenuOpen(false)}>
                <AuthNav />
              </div>
            </div>
          </div>
        </div>
      </Sheet>
    </div>
  );
}
