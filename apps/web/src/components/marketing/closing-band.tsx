"use client";

import * as React from "react";
import { MessageCircle, Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EnquiryDialog } from "./enquiry-dialog";


export interface ClosingBandProps {
  title?: string;
  subtitle?: string;
  enquireButtonText?: string;
  whatsappButtonText?: string;
  whatsappPhone?: string;
}

export function ClosingBand({
  title = "Admissions open for 2026–27",
  subtitle = "Small batch sizes to guarantee individual attention, weekly test series, and direct mentorship with Dinesh Sir & Namita Ma'am in Mathura.",
  enquireButtonText = "Enquire now",
  whatsappButtonText = "Chat on WhatsApp",
  whatsappPhone = "+91-9897000000",
}: ClosingBandProps) {
  const [dialogOpen, setDialogOpen] = React.useState(false);

  const cleanPhone = whatsappPhone.replace(/[^0-9]/g, "");
  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
    "Hello Quick2Learn! I would like to inquire about batch admissions for the 2026–27 academic session.",
  )}`;

  return (
    <section className="bg-surface-subtle border-t border-border py-16 md:py-20">
      <div className="container mx-auto px-4 max-w-[900px] text-center space-y-6">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-primary-soft border border-primary/20 px-3.5 py-1 text-caption font-semibold text-primary">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Session 2026–27 Limited Seats</span>
        </div>

        <h2 className="text-display font-bold text-ink tracking-tight">
          {title}
        </h2>

        <p className="text-body text-ink-muted max-w-2xl mx-auto leading-relaxed">
          {subtitle}
        </p>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button
            size="lg"
            variant="primary"
            onClick={() => setDialogOpen(true)}
            className="w-full sm:w-auto gap-2 text-small font-semibold shadow-md cursor-pointer"
          >
            <Send className="h-4 w-4" />
            <span>{enquireButtonText}</span>
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
              className="w-full sm:w-auto gap-2 border-[#25D366] text-[#128C7E] hover:bg-[#25D366]/10 font-semibold cursor-pointer"
            >
              <MessageCircle className="h-4 w-4 fill-current" />
              <span>{whatsappButtonText}</span>
            </Button>
          </a>
        </div>
      </div>

      {/* Enquiry Modal Dialog */}
      <EnquiryDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </section>
  );
}
