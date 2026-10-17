"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Home,
  GraduationCap,
  PlayCircle,
  Bot,
  PhoneCall,
} from "lucide-react";
import { EnquiryDialog } from "@/components/marketing/enquiry-dialog";
import { cn } from "@/lib/utils";

export function MobileBottomBar() {
  const pathname = usePathname();
  const [isEnquiryOpen, setIsEnquiryOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(pathname === "/chat");

  useEffect(() => {
    setIsChatOpen(pathname === "/chat");
  }, [pathname]);

  useEffect(() => {
    const handleChatToggled = (e: Event) => {
      const customEvent = e as CustomEvent<{ isOpen?: boolean }>;
      if (typeof customEvent.detail?.isOpen === "boolean") {
        setIsChatOpen(customEvent.detail.isOpen);
      }
    };
    window.addEventListener("quick2learn-chat-toggled", handleChatToggled);
    return () => {
      window.removeEventListener("quick2learn-chat-toggled", handleChatToggled);
    };
  }, []);

  // Hide bottom navigation bar when user is inside the full-screen AI chat
  if (isChatOpen || pathname === "/chat") {
    return null;
  }

  const isHomeActive = pathname === "/";
  const isBatchesActive = pathname.startsWith("/batches");
  const isLecturesActive = pathname.startsWith("/lectures");

  const handleOpenAiChat = () => {
    window.dispatchEvent(new CustomEvent("open-quick2learn-chat"));
  };

  return (
    <>
      {/* Native App-Style Bottom Navigation Bar (Visible only on mobile/compact screens) */}
      <nav
        aria-label="Mobile Bottom Navigation"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface/95 backdrop-blur-xl border-t border-border/80 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] pb-[max(env(safe-area-inset-bottom,0px),0.4rem)] pt-1.5 px-2 select-none"
      >
        <div className="grid grid-cols-5 items-center justify-items-center max-w-md mx-auto">
          {/* 1. Home Tab */}
          <Link
            href="/"
            className={cn(
              "flex flex-col items-center justify-center w-full pt-1.5 pb-0.5 text-center relative group transition-all duration-200 active:scale-90",
              isHomeActive
                ? "text-primary font-bold"
                : "text-ink-muted hover:text-ink font-medium"
            )}
          >
            {isHomeActive && (
              <span className="absolute top-0 w-8 h-[2.5px] bg-primary rounded-full shadow-[0_2px_8px_rgba(59,130,246,0.5)]" />
            )}
            <Home
              className={cn(
                "h-5 w-5 transition-transform duration-200",
                isHomeActive ? "scale-105 stroke-[2.25px]" : "stroke-[1.75px]"
              )}
            />
            <span className="text-[10px] sm:text-[11px] leading-tight tracking-tight mt-1">
              Home
            </span>
          </Link>

          {/* 2. Batches Tab */}
          <Link
            href="/batches"
            className={cn(
              "flex flex-col items-center justify-center w-full pt-1.5 pb-0.5 text-center relative group transition-all duration-200 active:scale-90",
              isBatchesActive
                ? "text-primary font-bold"
                : "text-ink-muted hover:text-ink font-medium"
            )}
          >
            {isBatchesActive && (
              <span className="absolute top-0 w-8 h-[2.5px] bg-primary rounded-full shadow-[0_2px_8px_rgba(59,130,246,0.5)]" />
            )}
            <GraduationCap
              className={cn(
                "h-5 w-5 transition-transform duration-200",
                isBatchesActive ? "scale-105 stroke-[2.25px]" : "stroke-[1.75px]"
              )}
            />
            <span className="text-[10px] sm:text-[11px] leading-tight tracking-tight mt-1">
              Batches
            </span>
          </Link>

          {/* 3. Central Featured "Ask AI" Action Button */}
          <button
            type="button"
            onClick={handleOpenAiChat}
            className="flex flex-col items-center justify-center relative -top-3 group active:scale-90 transition-transform duration-200 cursor-pointer"
            aria-label="Open AI Tutor"
          >
            <div className="relative flex items-center justify-center h-12 w-12 rounded-full bg-gradient-to-tr from-primary via-blue-600 to-indigo-600 text-white shadow-[0_6px_20px_rgba(37,99,235,0.45)] ring-4 ring-surface transition-all duration-300 group-hover:scale-105 group-hover:shadow-[0_8px_25px_rgba(37,99,235,0.6)]">
              <Bot className="h-6 w-6 transition-transform duration-300 group-hover:rotate-6" />
              {/* Subtle pulsing beacon pill */}
              <span className="absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full bg-accent text-[9px] font-black text-white uppercase tracking-wider shadow-xs">
                AI
              </span>
            </div>
            <span className="text-[10px] sm:text-[11px] font-bold text-primary mt-1 tracking-tight">
              Ask AI
            </span>
          </button>

          {/* 4. Free Lectures Tab */}
          <Link
            href="/lectures"
            className={cn(
              "flex flex-col items-center justify-center w-full pt-1.5 pb-0.5 text-center relative group transition-all duration-200 active:scale-90",
              isLecturesActive
                ? "text-primary font-bold"
                : "text-ink-muted hover:text-ink font-medium"
            )}
          >
            {isLecturesActive && (
              <span className="absolute top-0 w-8 h-[2.5px] bg-primary rounded-full shadow-[0_2px_8px_rgba(59,130,246,0.5)]" />
            )}
            <PlayCircle
              className={cn(
                "h-5 w-5 transition-transform duration-200",
                isLecturesActive ? "scale-105 stroke-[2.25px]" : "stroke-[1.75px]"
              )}
            />
            <span className="text-[10px] sm:text-[11px] leading-tight tracking-tight mt-1">
              Lectures
            </span>
          </Link>

          {/* 5. Admissions Inquire CTA Tab */}
          <button
            type="button"
            onClick={() => setIsEnquiryOpen(true)}
            className="flex flex-col items-center justify-center w-full pt-1.5 pb-0.5 text-center relative group transition-all duration-200 active:scale-90 cursor-pointer text-ink-muted hover:text-primary font-medium"
            aria-label="Open Admissions Enquiry Dialog"
          >
            <div className="relative">
              <PhoneCall className="h-5 w-5 stroke-[1.75px] group-hover:stroke-[2.25px] transition-all" />
              {/* Live attention dot */}
              <span className="absolute -top-0.5 -right-1 h-2 w-2 rounded-full bg-success ring-2 ring-surface animate-pulse" />
            </div>
            <span className="text-[10px] sm:text-[11px] leading-tight tracking-tight mt-1 group-hover:text-primary">
              Inquire
            </span>
          </button>
        </div>
      </nav>

      {/* Admissions Enquiry Modal launched from the mobile bottom bar */}
      <EnquiryDialog open={isEnquiryOpen} onOpenChange={setIsEnquiryOpen} />
    </>
  );
}
