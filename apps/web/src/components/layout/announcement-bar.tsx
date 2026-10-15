"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { X, ArrowRight } from "lucide-react";
import { EnquiryDialog } from "@/components/marketing/enquiry-dialog";

export interface AnnouncementBarData {
  enabled?: boolean;
  text?: string;
  link_text?: string;
  link_url?: string;
}

interface AnnouncementBarProps {
  announcement?: AnnouncementBarData | null;
}

const STORAGE_KEY = "q2l_announcement_dismissed";

export function AnnouncementBar({ announcement }: AnnouncementBarProps) {
  const [dismissed, setDismissed] = useState<boolean>(true); // start hidden to avoid layout shift before checking storage
  const [enquiryOpen, setEnquiryOpen] = useState<boolean>(false);

  useEffect(() => {
    if (!announcement?.enabled || !announcement.text) {
      setDismissed(true);
      return;
    }

    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      // If the stored value matches this announcement text, keep it dismissed
      if (stored === announcement.text) {
        setDismissed(true);
      } else {
        setDismissed(false);
      }
    } catch {
      // If localStorage is unavailable or throws, gracefully show the announcement
      setDismissed(false);
    }
  }, [announcement]);

  // Listen for hash changes like #inquire or #enquiry to auto-open the modal
  useEffect(() => {
    const checkHash = () => {
      if (typeof window !== "undefined") {
        const hash = window.location.hash.toLowerCase();
        if (hash === "#inquire" || hash === "#enquiry") {
          setEnquiryOpen(true);
        }
      }
    };
    checkHash();
    window.addEventListener("hashchange", checkHash);
    return () => window.removeEventListener("hashchange", checkHash);
  }, []);

  const isEnquiryLink =
    !announcement?.link_url ||
    announcement.link_url === "/#inquire" ||
    announcement.link_url === "#inquire" ||
    announcement.link_url.includes("inquire") ||
    announcement.link_url.includes("enquiry");

  const handleLinkClick = (e: React.MouseEvent) => {
    if (isEnquiryLink) {
      e.preventDefault();
      setEnquiryOpen(true);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    try {
      if (announcement?.text) {
        window.localStorage.setItem(STORAGE_KEY, announcement.text);
      }
    } catch {
      // Silently ignore storage errors (e.g. private browsing or disabled storage)
    }
  };

  if (dismissed || !announcement?.enabled || !announcement.text) {
    return (
      <EnquiryDialog
        open={enquiryOpen}
        onOpenChange={setEnquiryOpen}
        batchTitle="Class XII CBSE Mathematics"
        defaultClassLevel={12}
      />
    );
  }

  return (
    <>
      <div
        role="region"
        aria-label="Announcement"
        className="relative z-40 bg-primary text-surface px-4 py-1.5 sm:py-2 text-xs sm:text-small font-medium shadow-xs"
      >
        <div className="container mx-auto flex items-center justify-center gap-2 sm:gap-3 text-center pr-8 pl-2">
          <span className="line-clamp-1">{announcement.text}</span>
          {announcement.link_text && (
            isEnquiryLink ? (
              <button
                type="button"
                onClick={handleLinkClick}
                className="inline-flex items-center gap-1 font-semibold text-accent-soft hover:underline shrink-0 cursor-pointer"
              >
                <span>{announcement.link_text}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            ) : (
              <Link
                href={announcement.link_url || "/"}
                className="inline-flex items-center gap-1 font-semibold text-accent-soft hover:underline shrink-0"
              >
                <span>{announcement.link_text}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            )
          )}
        </div>

        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Dismiss announcement"
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-surface/80 hover:text-surface hover:bg-primary-hover transition-colors cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <EnquiryDialog
        open={enquiryOpen}
        onOpenChange={setEnquiryOpen}
        batchTitle="Class XII CBSE Mathematics"
        defaultClassLevel={12}
      />
    </>
  );
}
