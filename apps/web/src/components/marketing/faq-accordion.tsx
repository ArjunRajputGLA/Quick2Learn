import * as React from "react";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { SectionHeader } from "@/components/ui/section-header";

export interface FaqItem {
  question: string;
  answer: string;
}

export interface FaqAccordionProps {
  faqs?: FaqItem[] | null;
}

export function FaqAccordion({ faqs }: FaqAccordionProps) {
  if (!faqs || faqs.length === 0) {
    return null;
  }

  // FAQPage structured data for Google rich results
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question?.replace(/\s*\[PLACEHOLDER\]/gi, ""),
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer?.replace(/\s*\[PLACEHOLDER\]/gi, ""),
      },
    })),
  };

  return (
    <section id="faqs" className="bg-surface py-14 md:py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
      />
      <div className="container mx-auto px-4 max-w-[800px] space-y-8">
        <SectionHeader
          align="center"
          eyebrow="Common Inquiries"
          title="Frequently asked questions"
          description="Everything you need to know about enrollment, class schedules, study materials, and teaching methodology."
        />

        <Accordion type="single" defaultValue="faq-0" className="mt-6">
          {faqs.map((faq, idx) => (
            <AccordionItem key={idx} value={`faq-${idx}`}>
              <AccordionTrigger itemValue={`faq-${idx}`} className="text-body font-semibold">
                {faq.question?.replace(/\s*\[PLACEHOLDER\]/gi, "")}
              </AccordionTrigger>
              <AccordionContent itemValue={`faq-${idx}`}>
                {faq.answer?.replace(/\s*\[PLACEHOLDER\]/gi, "")}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
