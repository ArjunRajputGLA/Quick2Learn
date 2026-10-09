// DRAFT: This text is a draft to be reviewed before going live.
import type { Metadata } from "next";
import { BreadcrumbsPlacement } from "@/components/layout/breadcrumbs-placement";
import { Badge } from "@/components/ui/badge";
import { Mail, Phone, MapPin } from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy Policy — DPDP Act Compliant | Quick2Learn",
  description:
    "Privacy policy of Quick2Learn Coaching Institute regarding personal data collection, processing, third-party disclosure, retention, and student rights under India's DPDP Act.",
  alternates: {
    canonical: "/privacy",
  },
  openGraph: {
    title: "Privacy Policy | Quick2Learn",
    description:
      "Privacy policy of Quick2Learn Coaching Institute under India's DPDP Act.",
    url: "https://quick2learn.in/privacy",
  },
};

export default function PrivacyPage() {
  {/* DRAFT: This legal policy is a draft to be reviewed and approved by legal counsel before going live. */}
  return (
    <div className="bg-surface">
      <BreadcrumbsPlacement
        items={[
          { label: "Home", href: "/" },
          { label: "Privacy Policy", href: "/privacy" },
        ]}
      />

      <div className="container mx-auto px-4 py-8 lg:py-14 max-w-4xl space-y-10">
        {/* Header */}
        <div className="space-y-3 border-b border-border pb-6">
          <Badge variant="primary">Legal Documentation • DPDP Act (India)</Badge>
          <h1 className="text-display font-extrabold tracking-tight text-ink">
            Privacy Policy
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-caption text-ink-muted">
            <span>Last updated: October 2026</span>
            <span>•</span>
            <span className="text-accent font-semibold">Status: Draft under legal review</span>
          </div>
          <p className="text-small text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3 mt-2">
            <strong>Notice:</strong> This draft policy outlines the data protection principles of <strong>[BUSINESS NAME]</strong> in compliance with the Digital Personal Data Protection Act, 2023 (DPDP Act). Placeholders in brackets indicate fields to be formalized prior to payment gateway activation.
          </p>
        </div>

        {/* Content Sections */}
        <div className="space-y-8 text-body text-ink-muted leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-h2 font-bold text-ink">1. Overview &amp; Data Fiduciary</h2>
            <p>
              This Privacy Policy explains how <strong>[BUSINESS NAME]</strong> (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;), having its primary campus at <strong>[ADDRESS]</strong>, collects, stores, processes, and safeguards personal data obtained from enrolled students, parents/guardians, and website visitors.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-h2 font-bold text-ink">2. What Personal Data We Collect</h2>
            <p>
              We collect only the minimum personal data strictly necessary to provide educational coaching and maintain academic records:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong className="text-ink">Student Details:</strong> Full name, date of birth, class level (Classes IX–XII), school name, board (CBSE, ICSE, ISC, UP Board), profile photograph, attendance logs, homework submissions, and mock examination scores.
              </li>
              <li>
                <strong className="text-ink">Parent / Guardian Details:</strong> Parent or guardian full name, relationship, primary mobile phone number, WhatsApp contact, email address, and residential city.
              </li>
              <li>
                <strong className="text-ink">Payment &amp; Transaction Details:</strong> Fee plan chosen, transaction amounts in Indian Rupees (paise), Razorpay payment IDs, order IDs, payment method category (UPI, Card, NetBanking), and serial numbered receipts. <em>Note: Sensitive card numbers, CVVs, and netbanking credentials are processed directly by our PCI-DSS compliant payment gateway and are never stored on our servers.</em>
              </li>
              <li>
                <strong className="text-ink">Technical &amp; Log Information:</strong> IP address, browser type, device information, session authentication cookies, and video playback progress on our online student portal.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-h2 font-bold text-ink">3. Purpose of Data Processing</h2>
            <p>
              We process personal data for specific and legitimate educational purposes:
            </p>
            <ul className="list-disc pl-6 space-y-1.5">
              <li>Delivering classroom, hybrid, and online academic coaching.</li>
              <li>Generating Sunday mock test scorecards and rank lists.</li>
              <li>Transmitting urgent academic notices, attendance alerts, and fee due reminders to parents via SMS, WhatsApp, and email.</li>
              <li>Issuing GST and statutory fee receipts.</li>
              <li>Preventing unauthorized account sharing and ensuring digital portal security.</li>
            </ul>
            <p className="font-semibold text-ink">
              We never sell, rent, or trade student or parent information to third-party advertisers or lead brokers.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-h2 font-bold text-ink">4. Third-Party Service Providers (Data Processors)</h2>
            <p>
              To maintain our website, digital learning portal, and operational infrastructure, your data may be processed by trusted third-party service providers under strict confidentiality agreements:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="rounded-lg border border-border bg-surface-subtle p-4 space-y-1">
                <div className="font-bold text-ink">Database Host</div>
                <div className="text-small">Managed PostgreSQL server infrastructure for encrypted data storage.</div>
              </div>
              <div className="rounded-lg border border-border bg-surface-subtle p-4 space-y-1">
                <div className="font-bold text-ink">File &amp; Media Storage</div>
                <div className="text-small">S3-compatible secure object storage for PDF notes, worksheets, and avatars.</div>
              </div>
              <div className="rounded-lg border border-border bg-surface-subtle p-4 space-y-1">
                <div className="font-bold text-ink">Email Service Provider</div>
                <div className="text-small">Nodemailer SMTP infrastructure for transactional emails and OTP login codes.</div>
              </div>
              <div className="rounded-lg border border-border bg-surface-subtle p-4 space-y-1">
                <div className="font-bold text-ink">Payment Gateway (Razorpay)</div>
                <div className="text-small">Razorpay Software Private Limited for PCI-DSS compliant payment processing.</div>
              </div>
              <div className="rounded-lg border border-border bg-surface-subtle p-4 space-y-1 md:col-span-2">
                <div className="font-bold text-ink">Hosting &amp; Edge Delivery (Vercel)</div>
                <div className="text-small">Vercel Inc. for secure application deployment, edge proxy routing, and SSL termination.</div>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-h2 font-bold text-ink">5. Data Retention Period</h2>
            <p>
              Personal data is retained for the duration of the student&apos;s active enrollment at <strong>[BUSINESS NAME]</strong> and for a period of up to seven (7) years following completion of the academic program, in accordance with Indian tax, accounting, and legal requirements. Following this statutory period, physical and digital data are securely archived or purged.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-h2 font-bold text-ink">6. Your Rights Under the DPDP Act, 2023</h2>
            <p>
              As a data principal (student or legal guardian), you have rights under India&apos;s Digital Personal Data Protection Act:
            </p>
            <ul className="list-disc pl-6 space-y-1.5">
              <li><strong className="text-ink">Right to Access:</strong> You may request a summary of personal data held about you or your ward.</li>
              <li><strong className="text-ink">Right to Correction:</strong> You may request rectification of inaccurate or outdated contact information.</li>
              <li><strong className="text-ink">Right to Erasure:</strong> You may request deletion of data that is no longer necessary for educational or statutory purposes.</li>
              <li><strong className="text-ink">Right to Grievance Redressal:</strong> You may file a complaint regarding personal data processing with our designated Grievance Officer.</li>
            </ul>
            <p>
              To exercise any of these rights, email your request to <strong>[EMAIL]</strong> with subject line &ldquo;DPDP Data Principal Request&rdquo;.
            </p>
          </section>

          <section className="space-y-4 pt-4 border-t border-border">
            <h2 className="text-h2 font-bold text-ink">7. Grievance Officer &amp; Contact Information</h2>
            <p>
              In accordance with the Information Technology Act, 2000 and the DPDP Act, 2023, the details of our Data Protection &amp; Grievance Redressal Officer are as follows:
            </p>
            <div className="rounded-xl border border-border bg-surface-subtle p-6 space-y-3 text-small">
              <div>
                <strong className="text-ink font-semibold">Designation:</strong> Grievance Redressal Officer
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary shrink-0" />
                <span><strong>Address:</strong> [ADDRESS]</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary shrink-0" />
                <span><strong>Email:</strong> [EMAIL]</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-primary shrink-0" />
                <span><strong>Phone:</strong> +91 76688 75809</span>
              </div>
              <p className="text-caption text-ink-muted pt-2 border-t border-border">
                Grievances are acknowledged within 48 hours and resolved within 30 business days.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
