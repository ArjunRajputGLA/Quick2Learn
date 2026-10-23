"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Bot } from "lucide-react";
import { MegaMenu } from "./mega-menu";
import { SearchTypeahead } from "./search-typeahead";
import { MobileNav } from "./mobile-nav";
import { LanguageSwitcher } from "./language-switcher";
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
  const [isVisible, setIsVisible] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);

  const headerRef = useRef<HTMLElement>(null);
  const pathname = usePathname();
  const isChatActive = isChatOpen || pathname === "/chat";

  useEffect(() => {
    const chatToggleHandler = (e: Event) => {
      const ce = e as CustomEvent<{ isOpen?: boolean }>;
      if (typeof ce.detail?.isOpen === "boolean") {
        setIsChatOpen(ce.detail.isOpen);
      }
    };
    window.addEventListener("quick2learn-chat-toggled", chatToggleHandler);
    return () => window.removeEventListener("quick2learn-chat-toggled", chatToggleHandler);
  }, []);

  useEffect(() => {
    if (pathname === "/chat") {
      setIsChatOpen(true);
    }
    // Always make header visible on route change
    setIsVisible(true);
    setIsScrolled(false);
  }, [pathname]);

  // High-performance animated auto-hide header:
  // Glides up out of view on scroll down; instantly glides down into view on scroll up.
  useEffect(() => {
    let lastScrollY = typeof window !== "undefined" ? Math.max(0, window.scrollY) : 0;
    let ticking = false;

    const updateScroll = () => {
      const currentScrollY = Math.max(0, window.scrollY);

      // 1. Always keep header docked and flat at or near top of the page
      if (currentScrollY <= 15) {
        setIsVisible(true);
        setIsScrolled(false);
        lastScrollY = currentScrollY;
        ticking = false;
        return;
      }

      setIsScrolled(true);

      const maxScrollY =
        document.documentElement.scrollHeight - window.innerHeight;

      // Avoid edge bouncing jitter when rubber-banding near bottom of document
      if (currentScrollY >= maxScrollY - 20) {
        lastScrollY = currentScrollY;
        ticking = false;
        return;
      }

      const deltaY = currentScrollY - lastScrollY;

      // Only toggle state once a noticeable scroll delta is reached (prevents micro-jitter)
      if (Math.abs(deltaY) >= 6) {
        if (deltaY > 0 && currentScrollY > 70) {
          // User is scrolling DOWN past header -> glide up smoothly out of view
          setIsVisible(false);
        } else if (deltaY < 0) {
          // User is scrolling UP -> glide down smoothly into view
          setIsVisible(true);
        }
        lastScrollY = currentScrollY;
      }

      ticking = false;
    };

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateScroll);
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      {/* Main Sticky Navigation Header with smooth animated slide-up and slide-down */}
      <header
        ref={headerRef}
        onFocusCapture={() => setIsVisible(true)}
        className={cn(
          "fixed top-0 left-0 right-0 z-[999] w-full transition-transform duration-350 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform",
          isScrolled
            ? "border-b border-border/80 bg-surface/95 backdrop-blur-md shadow-md"
            : "border-b border-border/60 bg-surface/98 backdrop-blur-md shadow-none",
          isVisible || isEnquiryOpen || isVoicebotOpen
            ? "translate-y-0"
            : "-translate-y-full pointer-events-none"
        )}
      >
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-4 xl:gap-8">
            {/* Left: Logo + Explore ⌵ + Batches / Free Lectures */}
            <div className="flex items-center gap-4 sm:gap-6 xl:gap-8 shrink-0">
              {/* Logo */}
              <Link
                href="/"
                className="select-none flex items-center group shrink-0 py-0.5"
                aria-label="Quick2Learn Home"
              >
                <Image
                  src="/images/assets/unnamed-removebg-preview.png"
                  alt="Quick2Learn"
                  width={180}
                  height={40}
                  className="h-8 sm:h-9 lg:h-10 w-auto object-contain transition-transform duration-200 group-hover:scale-[1.02]"
                  priority
                />
              </Link>

              {/* Desktop Explore ⌵ Dropdown */}
              <div className="hidden lg:block">
                <MegaMenu
                  data={megaMenuData}
                  onOpenEnquiry={() => setIsEnquiryOpen(true)}
                />
              </div>

              {/* Desktop Quick Nav Links (Degrees removed, relevant Batches & Free Lectures kept) */}
              <nav className="hidden lg:flex items-center gap-6">
                <Link
                  href="/batches"
                  className="text-small font-semibold text-ink hover:text-primary transition-colors relative py-1 after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-0 hover:after:w-full after:bg-primary after:transition-all after:duration-300"
                >
                  Batches
                </Link>
                <Link
                  href="/lectures"
                  className="text-small font-semibold text-ink hover:text-primary transition-colors relative py-1 after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-0 hover:after:w-full after:bg-primary after:transition-all after:duration-300 hidden xl:inline-block"
                >
                  Free Lectures
                </Link>
              </nav>
            </div>

            {/* Centre: Centered Pill Search Input with Solid Blue Circular Button */}
            <div className="hidden lg:flex flex-1 justify-center max-w-xl xl:max-w-2xl mx-2">
              <SearchTypeahead className="w-full" />
            </div>

            {/* Right: Language Switcher + AI Chatbot Button + Inquire Now Button */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              {/* Language Switcher (Hindi, English & Indian Languages) */}
              <LanguageSwitcher />

              {/* Minimalist AI Chatbot Link Button */}
              {isChatActive ? (
                <button
                  type="button"
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent("close-quick2learn-chat"));
                  }}
                  className="p-2 rounded-full bg-primary text-white hover:bg-primary-hover shadow-xs hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
                  aria-label="Close AI Chatbot"
                  title="Close AI Chatbot"
                >
                  <Bot className="h-5 w-5" />
                </button>
              ) : (
                <Link
                  href="/chat"
                  className="p-2 rounded-full text-ink-muted hover:text-primary hover:bg-surface-subtle hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
                  aria-label="Open AI Chatbot"
                  title="Open AI Chatbot"
                >
                  <Bot className="h-5 w-5" />
                </Link>
              )}

              {/* Prominent Inquire Now CTA Button */}
              <button
                type="button"
                onClick={() => setIsEnquiryOpen(true)}
                className="hidden sm:inline-flex items-center justify-center px-4 py-2 rounded-lg bg-primary text-surface font-semibold text-small hover:bg-primary-hover shadow-xs hover:shadow-card hover:-translate-y-0.5 active:scale-95 transition-all duration-200 cursor-pointer"
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

      {/* Structural Spacer: Preserves exact document height beneath fixed header */}
      <div className="h-16 w-full shrink-0" aria-hidden="true" />

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
