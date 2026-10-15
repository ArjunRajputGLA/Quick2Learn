"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import {
  Search,
  Menu,
  X,
  Video,
  Calendar,
  Award,
  GraduationCap,
  Users,
  Phone,
  MessageCircle,
  Bot,
} from "lucide-react";
import { Sheet } from "@/components/ui/sheet";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { SearchTypeahead } from "./search-typeahead";
import { LanguageSwitcher } from "./language-switcher";
import { type MegaMenuData } from "@/server/data/catalog";

interface MobileNavProps {
  data: MegaMenuData;
  onOpenEnquiry?: () => void;
}

export function MobileNav({ data, onOpenEnquiry }: MobileNavProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (searchOpen) {
      document.body.style.overflow = "hidden";
    } else if (!menuOpen) {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [searchOpen, menuOpen]);

  return (
    <div className="flex items-center gap-1.5 lg:hidden">
      {/* 1. Mobile Search Icon Button */}
      <button
        type="button"
        onClick={() => setSearchOpen(true)}
        aria-label="Open search dialog"
        className="p-2 rounded-lg text-ink hover:text-primary hover:bg-surface-subtle transition-colors cursor-pointer"
      >
        <Search className="h-5 w-5" />
      </button>

      {/* 2. Mobile Quick "Inquire" CTA Pill (visible on tablet/large mobile, inside drawer on small phones) */}
      {onOpenEnquiry && (
        <button
          type="button"
          onClick={onOpenEnquiry}
          className="hidden sm:inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full bg-primary/10 text-primary border border-primary/25 hover:bg-primary hover:text-surface transition-colors cursor-pointer select-none"
        >
          <span>Inquire</span>
        </button>
      )}

      {/* 3. Mobile Hamburger Button */}
      <button
        type="button"
        onClick={() => setMenuOpen(true)}
        aria-label="Open navigation menu"
        className="p-2 rounded-lg text-ink hover:text-primary hover:bg-surface-subtle transition-colors cursor-pointer"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* 4. Full-Screen / Modal Search Overlay (Portaled to document.body to prevent containing block trapping) */}
      {searchOpen && mounted && createPortal(
        <div className="fixed inset-0 z-[100] bg-surface/98 backdrop-blur-md flex flex-col p-4 animate-in fade-in-0 duration-150">
          <div className="flex items-center justify-between pb-3 border-b border-border mb-4">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-primary text-white flex items-center justify-center">
                <Search className="h-4 w-4" />
              </div>
              <span className="font-bold text-h3 text-ink">Search Quick2Learn</span>
            </div>
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

            {/* Quick search suggestions */}
            <div className="mt-6 pt-4 border-t border-border">
              <span className="text-caption font-bold uppercase tracking-wider text-ink-muted block mb-2">
                Popular Searches
              </span>
              <div className="flex flex-wrap gap-2">
                {["Class 10 Mathematics", "Class 12 Physics", "Target Boards", "Free Lectures", "Chemistry", "Biology"].map((term) => (
                  <Link
                    key={term}
                    href={`/search?q=${encodeURIComponent(term)}`}
                    onClick={() => setSearchOpen(false)}
                    className="text-small px-3 py-1.5 rounded-full bg-surface-subtle text-ink border border-border hover:border-primary/40 hover:text-primary transition-colors"
                  >
                    {term}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* 5. Hamburger Sheet Drawer */}
      <Sheet open={menuOpen} onOpenChange={setMenuOpen} side="right">
        <div className="flex flex-col h-full overflow-y-auto">
          {/* Drawer Header with Language Switcher */}
          <div className="pb-4 border-b border-border pr-8 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-primary to-blue-500 text-white flex items-center justify-center shadow-xs">
                <GraduationCap className="h-5 w-5" />
              </div>
              <div>
                <div className="font-extrabold text-h3 text-ink tracking-tight">
                  Quick<span className="text-primary">2</span>Learn
                </div>
                <p className="text-[11px] font-semibold text-ink-muted">
                  Mathura Academy &bull; Classes IX&ndash;XII
                </p>
              </div>
            </div>
            <LanguageSwitcher
              compact
              onLanguageChange={() => setMenuOpen(false)}
            />
          </div>

          {/* Quick Direct Links */}
          <div className="py-4 space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-ink-muted px-1">
              Direct Access
            </span>
            <div className="grid grid-cols-1 gap-1 pt-1">
              <Link
                href="/chat"
                onClick={() => setMenuOpen(false)}
                className="flex items-center justify-between px-3 py-2.5 rounded-lg text-small font-semibold text-ink hover:bg-primary-soft hover:text-primary transition-colors w-full text-left cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <Bot className="h-4 w-4 text-primary" />
                  <span>Ask Quick2Learn AI</span>
                </div>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
                  AI TUTOR
                </span>
              </Link>

              <Link
                href="/lectures"
                onClick={() => setMenuOpen(false)}
                className="flex items-center justify-between px-3 py-2.5 rounded-lg text-small font-semibold text-ink hover:bg-primary-soft hover:text-primary transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Video className="h-4 w-4 text-primary" />
                  <span>All Free Lectures</span>
                </div>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800">
                  FREE
                </span>
              </Link>

              <Link
                href="/batches"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-small font-semibold text-ink hover:bg-accent-soft hover:text-accent transition-colors"
              >
                <Calendar className="h-4 w-4 text-accent" />
                <span>All Classroom Batches</span>
              </Link>

              <Link
                href="/results"
                onClick={() => setMenuOpen(false)}
                className="flex items-center justify-between px-3 py-2.5 rounded-lg text-small font-semibold text-ink hover:bg-emerald-50 hover:text-success transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Award className="h-4 w-4 text-success" />
                  <span>Results &amp; Toppers</span>
                </div>
                <span className="text-[11px] font-bold text-success">
                  98.6%
                </span>
              </Link>

              <Link
                href="/faculty"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-small font-semibold text-ink hover:bg-primary-soft hover:text-primary transition-colors"
              >
                <Users className="h-4 w-4 text-primary" />
                <span>Faculty Mentors</span>
              </Link>

              {onOpenEnquiry && (
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onOpenEnquiry();
                  }}
                  className="w-full flex items-center justify-center gap-2 mt-2 px-3 py-2.5 rounded-lg bg-primary text-white text-small font-bold hover:bg-primary-hover shadow-xs transition-colors cursor-pointer"
                >
                  <span>Book Free Demo Class</span>
                </button>
              )}
            </div>
          </div>

          {/* Accordion Version of Mega-Menu */}
          <div className="py-2 border-t border-border">
            <span className="text-[11px] font-bold uppercase tracking-wider text-ink-muted px-1 mb-2 block">
              Academic Curricula (CBSE &bull; ICSE)
            </span>

            <Accordion type="single" className="border-none divide-none">
              {data.classes.map((cls) => (
                <AccordionItem
                  key={cls.classSlug}
                  value={`class-${cls.classSlug}`}
                  className="border-b border-border/60 py-0"
                >
                  <AccordionTrigger className="text-small font-bold py-2.5 hover:no-underline">
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

          {/* Contact Helpline Quick Access */}
          <div className="py-3 border-t border-border">
            <span className="text-[11px] font-bold uppercase tracking-wider text-ink-muted px-1 mb-2 block">
              Contact Centre
            </span>
            <div className="grid grid-cols-2 gap-2">
              <a
                href="tel:+917668875809"
                className="flex items-center gap-1.5 p-2 rounded-lg bg-surface-subtle text-ink hover:text-primary text-xs font-semibold border border-border"
              >
                <Phone className="h-3.5 w-3.5 text-primary" />
                <span>+91 76688 75809</span>
              </a>
              <a
                href="https://wa.me/917668875809"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 p-2 rounded-lg bg-emerald-50 text-emerald-800 hover:bg-emerald-100 text-xs font-semibold border border-emerald-200"
              >
                <MessageCircle className="h-3.5 w-3.5 text-success" />
                <span>WhatsApp</span>
              </a>
            </div>
          </div>

          {/* Admissions / Enquiry CTA at the Bottom */}
          <div className="mt-auto pt-4 border-t border-border">
            {onOpenEnquiry && (
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onOpenEnquiry();
                }}
                className="w-full flex items-center justify-center py-3 px-4 rounded-xl bg-primary text-white text-small font-bold hover:bg-primary-hover shadow-xs transition-all cursor-pointer"
              >
                <span>Inquire for Admissions</span>
              </button>
            )}
          </div>
        </div>
      </Sheet>
    </div>
  );
}
