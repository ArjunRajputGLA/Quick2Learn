import type { Metadata } from "next";
import { getGroupedFaqs } from "@/server/data/catalog";
import { BreadcrumbsPlacement } from "@/components/layout/breadcrumbs-placement";
import { Badge } from "@/components/ui/badge";
import { FaqGroupedList } from "@/components/marketing/faq-grouped-list";

export const metadata: Metadata = {
  title: "Frequently Asked Questions — Admissions, Fees & Classes | Quick2Learn",
  description:
    "Find answers to common questions regarding Quick2Learn classroom batches, admissions, fee instalment plans, Sunday mock tests, and online portal access in Mathura.",
  alternates: {
    canonical: "/faq",
  },
  openGraph: {
    title: "Frequently Asked Questions | Quick2Learn Mathura",
    description:
      "Find answers to common questions regarding Quick2Learn classroom batches, admissions, fee instalment plans, and online access.",
    url: "https://quick2learn.in/faq",
  },
  twitter: {
    card: "summary_large_image",
    title: "Frequently Asked Questions | Quick2Learn",
  },
};

export default async function FaqPage() {
  const groupedFaqs = await getGroupedFaqs();

  const allQuestions = Object.values(groupedFaqs).flat();

  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: allQuestions.map((q) => ({
      "@type": "Question",
      name: q.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: q.answer,
      },
    })),
  };

  return (
    <div className="bg-surface">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
      />
      <BreadcrumbsPlacement
        items={[
          { label: "Home", href: "/" },
          { label: "Frequently Asked Questions", href: "/faq" },
        ]}
      />

      <div className="container mx-auto px-4 py-8 lg:py-14 max-w-4xl space-y-10">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <Badge variant="primary" className="mb-1">
            Institute Knowledge Base • Mathura Campus
          </Badge>
          <h1 className="text-display font-extrabold tracking-tight text-ink">
            Frequently Asked Questions
          </h1>
          <p className="text-body text-ink-muted leading-relaxed">
            Everything you need to know about our classroom batches, admission requirements, fee structures, and synchronized digital study portal.
          </p>
        </div>

        <FaqGroupedList groupedFaqs={groupedFaqs} />
      </div>
    </div>
  );
}
