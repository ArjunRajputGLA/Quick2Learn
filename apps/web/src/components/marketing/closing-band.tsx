"use client";

import * as React from "react";
import { MessageCircle, Send, Sparkles, MapPin, Trophy, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EnquiryDialog } from "./enquiry-dialog";

export interface ClosingBandProps {
  title?: string;
  subtitle?: string;
  enquireButtonText?: string;
  whatsappButtonText?: string;
  whatsappPhone?: string;
}

function cleanText(str?: string | null): string {
  if (!str) return "";
  return str.replace(/\s*\[PLACEHOLDER\]/gi, "").trim();
}

export function ClosingBand({
  title,
  subtitle,
  enquireButtonText,
  whatsappButtonText,
  whatsappPhone = "+91 76688 75809",
}: ClosingBandProps) {
  const [dialogOpen, setDialogOpen] = React.useState(false);

  const cleanTitle = cleanText(title) || "Admissions Open for Session 2026–27";
  const cleanSubtitle =
    cleanText(subtitle) ||
    "Small batch sizes to guarantee individual attention, weekly test series, and direct mentorship with Dinesh Sir & Namita Ma'am in Mathura.";
  const cleanEnquireText = cleanText(enquireButtonText) || "Enquire for Admissions";
  const cleanWhatsAppText = cleanText(whatsappButtonText) || "Chat on WhatsApp";

  const rawPhone = cleanText(whatsappPhone) || "+91 76688 75809";
  const cleanPhone = rawPhone.replace(/[^0-9]/g, "");
  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
    "Hello Quick2Learn! I would like to inquire about batch admissions for the 2026–27 academic session.",
  )}`;

  return (
    <section id="inquire" className="bg-surface-subtle border-t border-border py-12 sm:py-16 md:py-24 scroll-mt-20">
      <div className="container mx-auto px-4 max-w-[960px] text-center space-y-5 sm:space-y-7">
        {/* Top Tag Badge */}
        <div className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full bg-primary-soft border border-primary/25 px-3.5 sm:px-4 py-1 sm:py-1.5 text-xs sm:text-caption font-bold text-primary animate-float shadow-2xs hover:scale-105 transition-transform duration-300">
          <Sparkles className="h-3.5 w-3.5 text-accent" />
          <span>Academic Session 2026–27 &bull; Limited Batch Seats</span>
        </div>

        {/* Clean Main Title */}
        <h2 className="text-2xl sm:text-h1 md:text-display font-black text-ink tracking-tight leading-tight">
          {cleanTitle}
        </h2>

        {/* Clean Subtitle */}
        <p className="text-xs sm:text-body md:text-lg text-ink-muted max-w-2xl mx-auto leading-relaxed">
          {cleanSubtitle}
        </p>

        {/* Action Buttons */}
        <div className="pt-2 sm:pt-3 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
          <Button
            size="lg"
            variant="primary"
            onClick={() => setDialogOpen(true)}
            className="group w-full sm:w-auto gap-2.5 px-6 py-3.5 text-small font-bold rounded-xl shadow-md hover:shadow-xl transition-all cursor-pointer justify-center"
          >
            <Send className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
            <span>{cleanEnquireText}</span>
          </Button>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto"
          >
            <Button
              size="lg"
              variant="outline"
              className="group w-full sm:w-auto gap-2.5 px-6 py-3.5 border-emerald-600/40 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-600 rounded-xl font-bold transition-all cursor-pointer justify-center"
            >
              <MessageCircle className="h-4 w-4 fill-emerald-600 transition-transform duration-200 group-hover:scale-115" />
              <span>{cleanWhatsAppText}</span>
            </Button>
          </a>
        </div>

        {/* Trust Badges Bar */}
        <div className="pt-4 sm:pt-6 flex flex-wrap items-center justify-center gap-3.5 sm:gap-6 text-xs sm:text-caption font-semibold text-ink-muted border-t border-border/80 max-w-2xl mx-auto">
          <div className="flex items-center gap-1.5">
            <Trophy className="h-3.5 w-3.5 text-accent shrink-0" />
            <span>98.6% Highest Board Score</span>
          </div>
          <div className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
            <span>Mathura Centre</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
            <span>Verified 25+ Years Legacy</span>
          </div>
        </div>
      </div>

      {/* Interactive Admissions Enquiry Modal Dialog */}
      <EnquiryDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </section>
  );
}
