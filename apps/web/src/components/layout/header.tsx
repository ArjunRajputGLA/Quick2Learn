"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Bot } from "lucide-react";
import { MegaMenu } from "./mega-menu";
import { SearchTypeahead } from "./search-typeahead";
import { MobileNav } from "./mobile-nav";
import { EnquiryDialog } from "@/components/marketing/enquiry-dialog";
import { AiVoicebotDialog } from "./ai-voicebot-dialog";
import { type MegaMenuData } from "@/server/data/catalog";
import { cn } from "@/lib/utils";

interface HeaderProps {
  megaMenuData: MegaMenuData;
}

export function Header({ megaMenuData }: HeaderProps) {
  const [isEnquiryOpen, setIsEnquiryOpen] = useState(false);
  const [isVoicebotOpen, setIsVoicebotOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [headerHidden, setHeaderHidden] = useState(false);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const chatToggleHandler = (e: Event) => {
      const ce = e as CustomEvent<{ isOpen?: boolean }>;
      if (typeof ce.detail?.isOpen === "boolean") {
        setIsChatOpen(ce.detail.isOpen);
        if (ce.detail.isOpen) {
          setHeaderHidden(false);
        }
      }
    };
    window.addEventListener("quick2learn-chat-toggled", chatToggleHandler);
    return () => window.removeEventListener("quick2learn-chat-toggled", chatToggleHandler);
  }, []);

  useEffect(() => {
    const THRESHOLD = 10; // Minimum scroll delta to trigger hide/show

    function handleScroll() {
      if (isChatOpen) {
        setHeaderHidden(false);
        return;
      }

      const currentY = window.scrollY;
      const delta = currentY - lastScrollY.current;

      // Always show header when near the top
      if (currentY < 80) {
        setHeaderHidden(false);
      } else if (delta > THRESHOLD) {
        // Scrolling DOWN → hide
        setHeaderHidden(true);
      } else if (delta < -THRESHOLD) {
        // Scrolling UP → show
        setHeaderHidden(false);
      }

      lastScrollY.current = currentY;
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isChatOpen]);

  return (
    <>
      {/* Main Sticky Navigation Header (Kept visible above AI Chatbot at z-50) */}
      <header
        className="sticky top-0 z-50 w-full border-b border-border/80 bg-surface/98 backdrop-blur-md transition-transform duration-300 ease-in-out"
        style={{ transform: headerHidden && !isChatOpen ? "translateY(-100%)" : "translateY(0)" }}
      >
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-4 xl:gap-8">
            {/* Left: Logo + Explore ⌵ + Batches / Free Lectures */}
            <div className="flex items-center gap-6 xl:gap-8 shrink-0">
              {/* Wordmark Logo */}
              <Link
                href="/"
                className="select-none flex items-center group"
                aria-label="Quick2Learn Home"
              >
                <span className="font-extrabold text-[24px] sm:text-[26px] tracking-tight text-primary transition-opacity group-hover:opacity-90">
                  Quick<span className="text-primary">2</span>Learn
                </span>
              </Link>

              {/* Desktop Explore ⌵ Dropdown */}
              <div className="hidden lg:block">
                <MegaMenu
                  data={megaMenuData}
                  onOpenEnquiry={() => setIsEnquiryOpen(true)}
                />
              </div>

              {/* Desktop Quick Nav Links (Degrees removed, relevant Batches & Free Lectures kept) */}
              <nav className="hidden lg:flex items-center gap-5">
                <Link
                  href="/batches"
                  className="text-small font-medium text-ink hover:text-primary transition-colors"
                >
                  Batches
                </Link>
                <Link
                  href="/lectures"
                  className="text-small font-medium text-ink hover:text-primary transition-colors hidden xl:inline-block"
                >
                  Free Lectures
                </Link>
              </nav>
            </div>

            {/* Centre: Centered Pill Search Input with Solid Blue Circular Button */}
            <div className="hidden lg:flex flex-1 justify-center max-w-xl xl:max-w-2xl mx-2">
              <SearchTypeahead className="w-full" />
            </div>

            {/* Right: AI Chatbot Button + Inquire Now Button + Staff Profile (if authenticated) */}
            <div className="flex items-center gap-3 sm:gap-3.5 shrink-0">
              {/* Minimalist AI Chatbot Icon Button */}
              <button
                type="button"
                onClick={() => {
                  window.dispatchEvent(
                    new CustomEvent("open-quick2learn-chat", {
                      detail: { toggle: true },
                    }),
                  );
                }}
                className={cn(
                  "p-2 rounded-full transition-colors cursor-pointer",
                  isChatOpen
                    ? "bg-primary text-white hover:bg-primary-hover shadow-xs"
                    : "text-ink-muted hover:text-primary hover:bg-surface-subtle",
                )}
                aria-label={isChatOpen ? "Close AI Chatbot" : "Open AI Chatbot"}
                title={isChatOpen ? "Close AI Chatbot" : "Open AI Chatbot"}
              >
                <Bot className="h-5 w-5" />
              </button>

              {/* Prominent Inquire Now CTA Button */}
              <button
                type="button"
                onClick={() => setIsEnquiryOpen(true)}
                className="hidden sm:inline-flex items-center justify-center px-4 py-2 rounded-lg bg-primary text-surface font-semibold text-small hover:bg-primary-hover shadow-xs active:scale-98 transition-all cursor-pointer"
              >
                <span>Inquire Now</span>
              </button>

              {/* Mobile Actions: Search Trigger & Hamburger Sheet */}
              <MobileNav
                data={megaMenuData}
                onOpenEnquiry={() => setIsEnquiryOpen(true)}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Interactive AI Voicebot Dialog */}
      <AiVoicebotDialog
        open={isVoicebotOpen}
        onOpenChange={setIsVoicebotOpen}
        onOpenEnquiry={() => setIsEnquiryOpen(true)}
      />

      {/* Interactive Admissions Enquiry Dialog */}
      <EnquiryDialog open={isEnquiryOpen} onOpenChange={setIsEnquiryOpen} />
    </>
  );
}
