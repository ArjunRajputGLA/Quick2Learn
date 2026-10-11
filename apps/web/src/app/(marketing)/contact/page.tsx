import type { Metadata } from "next";
import { getContactPageData } from "@/server/data/catalog";
import { BreadcrumbsPlacement } from "@/components/layout/breadcrumbs-placement";
import { Badge } from "@/components/ui/badge";
import { ContactEnquiryForm } from "@/components/marketing/contact-enquiry-form";
import {
  MapPin,
  Phone,
  MessageCircle,
  Mail,
  Clock,
  Sparkles,
  ExternalLink,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Contact Us — Campus Admissions & Counseling | Quick2Learn Mathura",
  description:
    "Get in touch with Quick2Learn Coaching Institute in Mathura. Inquire about CBSE & ICSE classroom batches, schedule a campus visit, or call our counseling desk.",
  alternates: {
    canonical: "/contact",
  },
  openGraph: {
    title: "Contact Quick2Learn Mathura — Admissions & Counseling",
    description:
      "Get in touch with Quick2Learn Coaching Institute in Mathura.",
    url: "https://quick2learn.in/contact",
  },
  twitter: {
    card: "summary_large_image",
    title: "Contact Quick2Learn Mathura",
  },
};

export default async function ContactPage() {
  const contact = await getContactPageData();
  const displayAddressLine =
    contact.addressLine &&
    !contact.addressLine.toLowerCase().includes("bsa") &&
    contact.addressLine.toLowerCase() !== "mathura"
      ? contact.addressLine
      : "";
  const displayLandmark =
    contact.landmark && !contact.landmark.toLowerCase().includes("bsa")
      ? contact.landmark
      : "";

  return (
    <div className="bg-surface">
      <BreadcrumbsPlacement
        items={[
          { label: "Home", href: "/" },
          { label: "Contact Us", href: "/contact" },
        ]}
      />

      <div className="container mx-auto px-4 py-8 lg:py-14 max-w-6xl space-y-12">
        {/* Page Header */}
        <div className="max-w-2xl space-y-3">
          <Badge variant="primary" className="mb-1">
            Mathura Campus Admissions Desk
          </Badge>
          <h1 className="text-display font-extrabold tracking-tight text-ink">
            Get in Touch with Quick2Learn
          </h1>
          <p className="text-body text-ink-muted leading-relaxed">
            Have questions about Class IX–XII batch schedules, fee structures, demo lectures, or student foundation counseling? Reach out or visit our Mathura centre.
          </p>
        </div>

        {/* 2-Column Layout: Details + Enquiry Form */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
          {/* Left Column: Contact Details, Hours, Map */}
          <div className="lg:col-span-5 space-y-8">
            <div className="rounded-2xl border border-border bg-surface p-6 sm:p-8 shadow-card space-y-6">
              <h2 className="text-h3 font-bold text-ink flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <span>Institute Contact Details</span>
              </h2>

              <div className="space-y-4 text-small text-ink">
                {/* Address */}
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0 mt-0.5">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-bold text-ink">Institute Campus</div>
                    <div className="text-ink-muted leading-snug mt-0.5">
                      {displayAddressLine ? `${displayAddressLine}, ` : ""}{contact.cityState}
                    </div>
                    {displayLandmark && (
                      <div className="text-[11px] text-ink-muted font-medium mt-0.5">
                        Landmark: {displayLandmark}
                      </div>
                    )}
                  </div>
                </div>

                {/* Phone */}
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0 mt-0.5">
                    <Phone className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-bold text-ink">Phone Helpline</div>
                    <a
                      href={`tel:${contact.phone}`}
                      className="text-primary hover:underline font-semibold block mt-0.5"
                    >
                      {contact.phone}
                    </a>
                  </div>
                </div>

                {/* WhatsApp */}
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 shrink-0 mt-0.5">
                    <MessageCircle className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-bold text-ink">WhatsApp Admissions Desk</div>
                    <a
                      href={`https://wa.me/${contact.cleanWhatsApp}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-600 hover:underline font-semibold inline-flex items-center gap-1 mt-0.5"
                    >
                      <span>{contact.whatsapp}</span>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </div>

                {/* Email */}
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0 mt-0.5">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-bold text-ink">Official Email</div>
                    <a
                      href={`mailto:${contact.email}`}
                      className="text-primary hover:underline font-semibold block mt-0.5"
                    >
                      {contact.email}
                    </a>
                  </div>
                </div>

                {/* Office Hours */}
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-lg bg-accent/10 flex items-center justify-center text-accent shrink-0 mt-0.5">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-bold text-ink">Counseling &amp; Office Hours</div>
                    <div className="text-ink-muted leading-snug mt-0.5">
                      {contact.supportHours}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Lazy-loaded Google Maps Embed */}
            <div className="rounded-2xl border border-border bg-surface overflow-hidden shadow-card">
              <div className="p-4 border-b border-border bg-surface-subtle flex items-center justify-between">
                <div className="flex items-center gap-2 text-small font-bold text-ink">
                  <MapPin className="h-4 w-4 text-primary" />
                  <span>Campus Location on Google Maps</span>
                </div>
                <span className="text-[11px] text-ink-muted">Mathura, UP</span>
              </div>
              <div className="relative aspect-video w-full bg-ink/5">
                <iframe
                  src={contact.mapEmbedUrl}
                  title="Quick2Learn Campus Location"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="absolute inset-0 h-full w-full border-0"
                />
              </div>
            </div>
          </div>

          {/* Right Column: Enquiry Form Card */}
          <div className="lg:col-span-7">
            <div className="rounded-2xl border border-border bg-surface p-6 sm:p-10 shadow-card space-y-6">
              <div className="space-y-1">
                <h2 className="text-h2 font-bold text-ink">
                  Send an Admissions Enquiry
                </h2>
                <p className="text-small text-ink-muted">
                  Fill in your details below and our counseling faculty will call you back within 24 hours.
                </p>
              </div>

              <ContactEnquiryForm />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
