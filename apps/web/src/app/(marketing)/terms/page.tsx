// DRAFT: This text is a draft to be reviewed before going live.
import type { Metadata } from "next";
import { BreadcrumbsPlacement } from "@/components/layout/breadcrumbs-placement";
import { Badge } from "@/components/ui/badge";
import { ShieldAlert, Mail, Phone, MapPin } from "lucide-react";

export const metadata: Metadata = {
  title: "Terms of Service — Enrolment & Anti-Piracy Policy | Quick2Learn",
  description:
    "Terms of Service governing enrolment, student conduct, content usage, anti-piracy prohibitions, and account access at Quick2Learn Coaching Institute.",
  alternates: {
    canonical: "/terms",
  },
  openGraph: {
    title: "Terms of Service | Quick2Learn",
    description:
      "Terms of Service governing enrolment, student conduct, and content usage at Quick2Learn.",
    url: "https://quick2learn.in/terms",
  },
};

export default function TermsPage() {
  {/* DRAFT: This legal policy is a draft to be reviewed and approved by legal counsel before going live. */}
  return (
    <div className="bg-surface">
      <BreadcrumbsPlacement
        items={[
          { label: "Home", href: "/" },
          { label: "Terms of Service", href: "/terms" },
        ]}
      />

      <div className="container mx-auto px-4 py-8 lg:py-14 max-w-4xl space-y-10">
        {/* Header */}
        <div className="space-y-3 border-b border-border pb-6">
          <Badge variant="primary">Legal Documentation • Student Agreement</Badge>
          <h1 className="text-display font-extrabold tracking-tight text-ink">
            Terms of Service
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-caption text-ink-muted">
            <span>Last updated: October 2026</span>
            <span>•</span>
            <span className="text-accent font-semibold">Status: Draft under legal review</span>
          </div>
          <p className="text-small text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3 mt-2">
            <strong>Notice:</strong> This draft terms agreement governs all student enrolments, classroom attendance, and digital platform access for <strong>[BUSINESS NAME]</strong>. Placeholders in brackets indicate fields to be formalized prior to payment gateway activation.
          </p>
        </div>

        {/* Content Sections */}
        <div className="space-y-8 text-body text-ink-muted leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-h2 font-bold text-ink">1. Acceptance of Terms &amp; Scope</h2>
            <p>
              By enrolling in an offline classroom batch, registering for hybrid coaching, or using the digital learning website and portal operated by <strong>[BUSINESS NAME]</strong> (&ldquo;Quick2Learn&rdquo;, &ldquo;Institute&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;), located at <strong>[ADDRESS]</strong>, the student and their parent/legal guardian agree to be legally bound by these Terms of Service.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-h2 font-bold text-ink">2. Enrolment &amp; Admission</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong className="text-ink">Academic Session:</strong> Enrolment in any batch is strictly valid only for the designated academic session (e.g. 2026–27) and for the enrolled student only. Enrolments are non-transferable to any sibling, relative, or acquaintance.
              </li>
              <li>
                <strong className="text-ink">Seat Allocation:</strong> Classroom batches are strictly capped at 35–40 seats to guarantee individual mentorship. Seats are reserved upon receipt of the initial registration or fee instalment payment.
              </li>
              <li>
                <strong className="text-ink">Prerequisites:</strong> Students must satisfy the class eligibility requirements (Classes IX, X, XI, or XII CBSE/ICSE/ISC curriculum) for their selected batch.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-h2 font-bold text-ink">3. Student Conduct &amp; Attendance</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong className="text-ink">Punctuality:</strong> Students must arrive at the classroom or log in to live digital sessions at least five minutes prior to the scheduled lecture start time.
              </li>
              <li>
                <strong className="text-ink">Mandatory Mock Examinations:</strong> Regular weekly Sunday board-pattern mock examinations and homework assignments are mandatory. Continuous unexcused absences may result in parent counseling and disciplinary review.
              </li>
              <li>
                <strong className="text-ink">Classroom Decorum:</strong> Students must maintain respectful, courteous behavior toward faculty mentors, institute administrative staff, and fellow classmates. Disruptive, abusive, or dishonest conduct will result in immediate suspension or expulsion without refund.
              </li>
            </ul>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-6 w-6 text-danger shrink-0" />
              <h2 className="text-h2 font-bold text-ink">
                4. Intellectual Property &amp; Content Usage (Anti-Piracy Policy)
              </h2>
            </div>
            <div className="rounded-xl border border-danger/20 bg-danger/5 p-5 text-small text-ink leading-relaxed space-y-3">
              <p>
                <strong>STRICT PROHIBITION ON RECORDING AND REDISTRIBUTION:</strong> All curriculum material provided by <strong>[BUSINESS NAME]</strong> — including but not limited to classroom video recordings, online video lessons, chapter notes, formula sheets, previous year question compilations, Sunday mock examination question papers, and answer keys — constitutes proprietary intellectual property protected under the Indian Copyright Act, 1957.
              </p>
              <ul className="list-disc pl-6 space-y-1.5 text-danger font-medium">
                <li>Students and parents are strictly prohibited from audio-recording, video-recording, screen-recording, downloading, taking screenshots of, or photocopying paid educational materials.</li>
                <li>Redistribution, uploading, sharing, or resale of any course material via Telegram, WhatsApp, YouTube, Google Drive, torrents, websites, or offline photocopies is strictly illegal.</li>
                <li>Digital watermarking and user-tracking mechanisms are embedded in all digital media to trace any leak to the offending account.</li>
              </ul>
              <p className="text-caption text-ink-muted">
                Any breach of this Anti-Piracy Policy will result in immediate termination of batch enrolment and permanent ban from the digital portal without fee refund, accompanied by civil damages and criminal prosecution under Sections 63 and 65 of the Indian Copyright Act, 1957.
              </p>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-h2 font-bold text-ink">5. Account Security &amp; Single-User Access</h2>
            <p>
              Student accounts on the digital learning portal are strictly for single individual use by the registered student:
            </p>
            <ul className="list-disc pl-6 space-y-1.5">
              <li>You may not share your login credentials, OTP codes, or session tokens with any other person.</li>
              <li>Simultaneous logins from distinct geographical locations will trigger automated security rate-limiting and account locking.</li>
              <li>You are entirely responsible for all activity conducted under your registered credentials.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-h2 font-bold text-ink">6. Fees &amp; Payment Obligations</h2>
            <p>
              Tuition fees must be remitted according to the chosen fee plan (single one-time payment or agreed instalment schedule). Instalments must be cleared on or before the specified due date. Default on fee payments after notice may result in temporary suspension of classroom attendance and digital portal access until outstanding dues are settled.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-h2 font-bold text-ink">7. Governing Law &amp; Jurisdiction</h2>
            <p>
              These Terms of Service shall be governed by and construed in accordance with the laws of the Republic of India. Any disputes arising out of or relating to these terms, student enrolment, or fee payments shall be subject to the exclusive jurisdiction of the competent courts in Mathura, Uttar Pradesh, India.
            </p>
          </section>

          <section className="space-y-4 pt-4 border-t border-border">
            <h2 className="text-h2 font-bold text-ink">8. Institute Contact Information</h2>
            <p>
              For legal inquiries, terms clarification, or administration questions, please contact:
            </p>
            <div className="rounded-xl border border-border bg-surface-subtle p-6 space-y-3 text-small">
              <div>
                <strong className="text-ink font-semibold">Institute:</strong> [BUSINESS NAME]
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
                <span><strong>Phone:</strong> [PHONE] (+91 76688 75809)</span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
