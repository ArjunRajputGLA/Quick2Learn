// DRAFT: This text is a draft to be reviewed before going live.
import type { Metadata } from "next";
import { BreadcrumbsPlacement } from "@/components/layout/breadcrumbs-placement";
import { Badge } from "@/components/ui/badge";
import { Mail, Phone, MapPin, Clock } from "lucide-react";

export const metadata: Metadata = {
  title: "Refund & Cancellation Policy — Timelines & Eligibility | Quick2Learn",
  description:
    "Refund and cancellation policy of Quick2Learn Coaching Institute detailing refund conditions, application procedures, processing timelines, and deductions.",
  alternates: {
    canonical: "/refund-policy",
  },
  openGraph: {
    title: "Refund & Cancellation Policy | Quick2Learn",
    description:
      "Refund and cancellation policy of Quick2Learn Coaching Institute in Mathura.",
    url: "https://quick2learn.in/refund-policy",
  },
};

export default function RefundPolicyPage() {
  {/* DRAFT: This legal policy is a draft to be reviewed and approved by legal counsel before going live. */}
  return (
    <div className="bg-surface">
      <BreadcrumbsPlacement
        items={[
          { label: "Home", href: "/" },
          { label: "Refund Policy", href: "/refund-policy" },
        ]}
      />

      <div className="container mx-auto px-4 py-8 lg:py-14 max-w-4xl space-y-10">
        {/* Header */}
        <div className="space-y-3 border-b border-border pb-6">
          <Badge variant="primary">Payment Gateway Compliance • Fee Policy</Badge>
          <h1 className="text-display font-extrabold tracking-tight text-ink">
            Refund &amp; Fee Policy
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-caption text-ink-muted">
            <span>Last updated: October 2026</span>
            <span>•</span>
            <span className="text-accent font-semibold">Status: Draft under legal review</span>
          </div>
          <p className="text-small text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3 mt-2">
            <strong>Notice:</strong> This draft refund policy applies to all batch enrolments and digital access subscriptions offered by <strong>[BUSINESS NAME]</strong>. Placeholders in brackets indicate fields to be formalized prior to payment gateway activation.
          </p>
        </div>

        {/* Content Sections */}
        <div className="space-y-8 text-body text-ink-muted leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-h2 font-bold text-ink">1. Objective &amp; Scope</h2>
            <p>
              <strong>[BUSINESS NAME]</strong> (&ldquo;Quick2Learn&rdquo;) strives to ensure complete satisfaction and academic transparency. We encourage prospective students to attend free demo lectures and counseling sessions before enrolling. This Refund Policy governs the conditions, procedures, and timelines under which fee refunds are issued.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-h2 font-bold text-ink">2. Trial Classes Prior to Enrollment</h2>
            <p>
              To help students and parents evaluate our concept-first teaching methodology, we offer up to two (2) complimentary classroom trial lectures prior to formal enrollment in any regular batch.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-h2 font-bold text-ink">3. When Refunds Apply (Eligibility Criteria)</h2>
            <p>
              A student or parent may request a tuition fee refund under the following strict conditions:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong className="text-ink">7-Day Refund Window:</strong> The written refund application must be submitted within seven (7) calendar days of the formal batch start date, or before the completion of the second (2nd) attended lecture, whichever is earlier.
              </li>
              <li>
                <strong className="text-ink">Batch Cancellation:</strong> If a batch is cancelled by <strong>[BUSINESS NAME]</strong> prior to commencement, a 100% full refund of all amounts paid will be issued without deductions.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-h2 font-bold text-ink">4. Non-Refundable Charges &amp; Deductions</h2>
            <p>
              In the event of an approved refund, the following amounts are non-refundable:
            </p>
            <ul className="list-disc pl-6 space-y-1.5">
              <li>A one-time administrative registration and seat booking charge of ₹1,500 (or equivalent integer paise).</li>
              <li>Cost of any physical textbooks, printed formula books, or study kits that have already been issued to the student.</li>
              <li>Pro-rata charge for any classroom lectures already attended prior to submission of the written refund request.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-h2 font-bold text-ink">5. Situations Where Refunds Do Not Apply</h2>
            <p>
              Refund requests will not be entertained in any of the following circumstances:
            </p>
            <ul className="list-disc pl-6 space-y-1.5 text-danger font-medium">
              <li>Requests submitted after seven (7) calendar days from the batch commencement date.</li>
              <li>Students who voluntarily withdraw due to personal reasons, school scheduling conflicts, or relocation after the 7-day window.</li>
              <li>Students whose admission is suspended or terminated due to misconduct, attendance default, or violation of our Anti-Piracy Content Usage Policy.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-h2 font-bold text-ink">6. How to Submit a Refund Request</h2>
            <p>
              To initiate a refund request, the parent or student must submit a formal written application containing:
            </p>
            <ol className="list-decimal pl-6 space-y-1.5">
              <li>Student Full Name and Registered Phone Number</li>
              <li>Enrolled Batch Name and Class Level</li>
              <li>Payment Transaction ID and Copy of Serialized Fee Receipt</li>
              <li>Clear reason for withdrawal</li>
              <li>Bank account details (for verification purposes)</li>
            </ol>
            <p className="pt-1">
              The application must be delivered in person at our institute campus at <strong>[ADDRESS]</strong> or sent via email from the registered email address to <strong>[EMAIL]</strong> with the subject &ldquo;Refund Request - [Student Name]&rdquo;.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-h2 font-bold text-ink">7. Refund Processing Timelines &amp; Method</h2>
            <div className="rounded-xl border border-border bg-surface-subtle p-5 flex items-start gap-4">
              <Clock className="h-6 w-6 text-primary shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="font-bold text-ink">7 to 10 Working Days Processing Time</div>
                <p className="text-small text-ink-muted leading-relaxed">
                  Once your written application is verified and approved by the institute administration, refunds are processed within <strong>7–10 business days</strong>. The amount is credited directly back to the original source of payment (via Razorpay to the originating bank account, UPI ID, or card) in accordance with RBI regulations.
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-4 pt-4 border-t border-border">
            <h2 className="text-h2 font-bold text-ink">8. Support &amp; Grievances</h2>
            <p>
              For questions regarding fee dues, receipts, or refund status, please contact:
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
                <span><strong>Phone:</strong> [PHONE]</span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
