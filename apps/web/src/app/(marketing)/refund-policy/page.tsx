import type { Metadata } from "next";
import { BreadcrumbsPlacement } from "@/components/layout/breadcrumbs-placement";
import { Badge } from "@/components/ui/badge";
import { Mail, Phone, MapPin, Clock, ShieldCheck, ArrowRightLeft, AlertCircle, CheckCircle2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Refund & Cancellation Policy — Timelines & Eligibility | Quick2Learn",
  description:
    "Official refund, fee cancellation, and batch transfer policy of Quick2Learn Coaching Institute in Mathura detailing timelines, deductions, demo lectures, and processing via RBI-compliant payment gateways.",
  alternates: {
    canonical: "/refund-policy",
  },
  openGraph: {
    title: "Refund & Cancellation Policy | Quick2Learn Mathura",
    description:
      "Official fee refund and cancellation rules for Quick2Learn Coaching Institute in Mathura, Uttar Pradesh.",
    url: "https://quick2learn.in/refund-policy",
  },
};

export default function RefundPolicyPage() {
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
          <Badge variant="primary" className="gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Payment Gateway Compliance • Student Fee Policy</span>
          </Badge>
          <h1 className="text-display font-extrabold tracking-tight text-ink">
            Refund &amp; Fee Policy
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-caption text-ink-muted">
            <span>Last updated: October 2026</span>
            <span>•</span>
            <span className="text-emerald-600 font-semibold flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" />
              Active &amp; Enforced
            </span>
          </div>
          <p className="text-small text-ink-muted bg-surface-subtle border border-border rounded-xl p-4 mt-2 leading-relaxed">
            Quick2Learn Coaching Institute is committed to complete academic transparency and ethical student welfare. This policy sets out clear guidelines governing demo classes, fee installment structures, batch cancellations, transfer options, and electronic refund processing under Indian consumer protection and payment regulations.
          </p>
        </div>

        {/* Content Sections */}
        <div className="space-y-8 text-body text-ink-muted leading-relaxed">
          {/* 1. Objective & Scope */}
          <section className="space-y-3">
            <h2 className="text-h2 font-bold text-ink">1. Objective &amp; Scope</h2>
            <p>
              This Refund Policy applies to all students enrolling in offline classroom cohorts, hybrid courses, and synchronized digital study subscriptions offered by <strong>Quick2Learn Coaching Institute</strong> (&ldquo;Quick2Learn&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;), located in <strong>Mathura, Uttar Pradesh 281004, India</strong>.
            </p>
            <p>
              Because our classroom batches are strictly limited to <strong>35–40 students per cohort</strong> to guarantee personal doubt clearance and direct faculty mentorship under Dinesh Sir and Namita Ma&apos;am, securing an admission seat commits institute resources and prevents other applicants from occupying that place. This policy balances student flexibility with fair operational planning.
            </p>
          </section>

          {/* 2. Free Demo & Trial Policy */}
          <section className="space-y-3">
            <h2 className="text-h2 font-bold text-ink">2. Complimentary Demo &amp; Trial Classes</h2>
            <div className="rounded-xl border border-border bg-surface-subtle p-5 space-y-2">
              <div className="flex items-center gap-2 text-ink font-bold">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                <span>Zero Financial Commitment Before Trial</span>
              </div>
              <p className="text-small text-ink-muted leading-relaxed">
                To help students and parents evaluate our concept-first pedagogy and classroom environment, prospective students are entitled to attend up to <strong>two (2) complimentary classroom demo lectures</strong> prior to paying any admission fee or registration deposit.
              </p>
              <p className="text-small text-ink-muted leading-relaxed">
                We strongly advise students to attend these trial sessions and schedule an initial academic counseling discussion before finalizing formal enrollment.
              </p>
            </div>
          </section>

          {/* 3. Refund Eligibility & Timelines */}
          <section className="space-y-3">
            <h2 className="text-h2 font-bold text-ink">3. Refund Eligibility &amp; Windows</h2>
            <p>
              Formal refund applications will be accepted and evaluated under the following strict conditions:
            </p>
            <div className="grid sm:grid-cols-2 gap-4 pt-1">
              <div className="rounded-xl border border-border bg-surface p-5 space-y-2 shadow-xs">
                <div className="font-bold text-ink flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary shrink-0" />
                  <span>7-Day Standard Window</span>
                </div>
                <p className="text-small text-ink-muted">
                  Written refund requests submitted within <strong>seven (7) calendar days</strong> of the official batch start date (or before the 2nd attended regular lecture, whichever comes first) qualify for a partial refund subject to statutory and administrative deductions.
                </p>
              </div>

              <div className="rounded-xl border border-border bg-surface p-5 space-y-2 shadow-xs">
                <div className="font-bold text-ink flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>100% Institute Cancellation</span>
                </div>
                <p className="text-small text-ink-muted">
                  If Quick2Learn cancels, discontinues, or postpones a scheduled batch by more than 21 days prior to commencement, a <strong>100% full refund</strong> of all tuition fees, registration fees, and material charges will be credited without any deductions.
                </p>
              </div>
            </div>
          </section>

          {/* 4. Non-Refundable Charges & Itemized Deductions */}
          <section className="space-y-3">
            <h2 className="text-h2 font-bold text-ink">4. Non-Refundable Charges &amp; Deductions</h2>
            <p>
              When a refund is approved within the eligible 7-day period, the following specific deductions apply to the gross amount paid:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong className="text-ink">Administrative &amp; Seat Booking Fee:</strong> A non-refundable charge of <strong>₹1,500</strong> to cover student records generation, ERP portal onboarding, and classroom registration processing.
              </li>
              <li>
                <strong className="text-ink">Printed Study Modules &amp; Formula Kits:</strong> The actual cost price of any physical books, test booklets, chapter workbooks, or question banks handed over to the student (items cannot be returned once handed over for hygiene and intellectual property reasons).
              </li>
              <li>
                <strong className="text-ink">Pro-Rata Classroom Lectures:</strong> Pro-rata tuition fees calculated for each lecture already delivered in the cohort prior to the timestamp of the written withdrawal application.
              </li>
              <li>
                <strong className="text-ink">Payment Gateway Processing Charges:</strong> Any nominal gateway or third-party bank processing charges (typically 1.5% to 2% plus GST) incurred during online payment via Razorpay.
              </li>
            </ul>
          </section>

          {/* 5. Batch Transfer & Course Adjustment */}
          <section className="space-y-3">
            <h2 className="text-h2 font-bold text-ink">5. Batch Transfer &amp; Alternative Adjustments</h2>
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-5 space-y-2">
              <div className="flex items-center gap-2 font-bold text-ink">
                <ArrowRightLeft className="h-5 w-5 text-primary shrink-0" />
                <span>Zero-Loss Cohort Transfer Option</span>
              </div>
              <p className="text-small text-ink-muted leading-relaxed">
                Rather than cancelling an enrollment and incurring administrative deductions, students facing scheduling clashes (e.g. school timing changes or board exam shifts) may apply for a <strong>Batch Transfer</strong> within <strong>14 days of batch launch</strong>.
              </p>
              <p className="text-small text-ink-muted leading-relaxed">
                Subject to available seats in the requested batch (capped at 35–40 learners), 100% of the tuition fee paid is transferred to the new morning or evening cohort or alternate subject module without penalty.
              </p>
            </div>
          </section>

          {/* 6. Non-Refundable Situations */}
          <section className="space-y-3">
            <h2 className="text-h2 font-bold text-ink">6. Situations Where Refunds Do Not Apply</h2>
            <p>
              No refund or fee credit will be entertained in any of the following circumstances:
            </p>
            <div className="space-y-2 rounded-xl border border-red-200 bg-red-50/50 p-5">
              <div className="flex items-start gap-2.5 text-small text-red-900">
                <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                <span>Applications submitted after <strong>seven (7) calendar days</strong> from the official cohort commencement date.</span>
              </div>
              <div className="flex items-start gap-2.5 text-small text-red-900">
                <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                <span>Students voluntarily leaving due to personal relocation, private tuition preferences, or extracurricular scheduling after the 7-day window.</span>
              </div>
              <div className="flex items-start gap-2.5 text-small text-red-900">
                <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                <span>Unsatisfactory academic performance or poor attendance by the student, as weekly Sunday mock assessments and attendance discipline are student responsibilities.</span>
              </div>
              <div className="flex items-start gap-2.5 text-small text-red-900">
                <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                <span>Students expelled, suspended, or debarred due to classroom indiscipline, harassment, ragging, or unauthorized distribution of proprietary notes/videos (violating the Indian Copyright Act, 1957).</span>
              </div>
            </div>
          </section>

          {/* 7. Application Procedure */}
          <section className="space-y-3">
            <h2 className="text-h2 font-bold text-ink">7. How to Apply for a Refund</h2>
            <p>
              To maintain audit accountability and prevent fraudulent claims, refund requests must follow this step-by-step verification process:
            </p>
            <ol className="list-decimal pl-6 space-y-2">
              <li>
                <strong>Submit Formal Application:</strong> The parent or legal guardian must submit a signed physical letter at the Quick2Learn campus office, or send an email from the registered parent email ID to <strong>quick2learn23203@gmail.com</strong> with the subject line <em>&ldquo;Fee Refund Request - [Student Name] - [Roll/Enrolment No.]&rdquo;</em>.
              </li>
              <li>
                <strong>Mandatory Details Required:</strong>
                <ul className="list-disc pl-5 mt-1 space-y-1 text-small">
                  <li>Full Student Name &amp; Registered Mobile Number</li>
                  <li>Batch Name, Class Level (e.g., Class 12 CBSE Mathematics), and Subject</li>
                  <li>Original Serialized Fee Receipt or Razorpay Payment ID</li>
                  <li>Clear explanation for discontinuation</li>
                  <li>Parent Bank Account Details (Account Name, Bank Name, Account Number, and IFSC Code) matching student records</li>
                </ul>
              </li>
              <li>
                <strong>Administrative Verification:</strong> Our admissions office will verify attendance logs, material dispatches, and calculate allowable pro-rata deductions within 3 working days of receipt.
              </li>
            </ol>
          </section>

          {/* 8. Timelines & Gateway Compliance */}
          <section className="space-y-3">
            <h2 className="text-h2 font-bold text-ink">8. Refund Processing Timelines &amp; RBI Compliance</h2>
            <div className="rounded-xl border border-border bg-surface-subtle p-5 flex items-start gap-4">
              <Clock className="h-6 w-6 text-primary shrink-0 mt-0.5" />
              <div className="space-y-1.5">
                <div className="font-bold text-ink text-body">7 to 10 Working Days Direct Bank Settlement</div>
                <p className="text-small text-ink-muted leading-relaxed">
                  Upon formal administrative approval, the net refundable amount will be initiated electronically within <strong>7 to 10 business days</strong>.
                </p>
                <p className="text-small text-ink-muted leading-relaxed">
                  In strict compliance with <strong>Reserve Bank of India (RBI)</strong> payment gateway guidelines and Razorpay processing standards, refunds are credited back directly to the original payment source (the originating bank account, credit/debit card, or UPI VPA) from which the fee was disbursed. Cash refunds are strictly prohibited for electronic transactions.
                </p>
              </div>
            </div>
          </section>

          {/* 9. Contact & Grievance Desk */}
          <section className="space-y-4 pt-4 border-t border-border">
            <h2 className="text-h2 font-bold text-ink">9. Admissions Desk &amp; Fee Support</h2>
            <p>
              For all fee-related inquiries, serialized receipts, installment schedules, or refund status queries, please contact our administrative desk:
            </p>
            <div className="rounded-xl border border-border bg-surface-subtle p-6 space-y-3 text-small">
              <div>
                <strong className="text-ink font-semibold">Institute:</strong> Quick2Learn Coaching Institute
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary shrink-0" />
                <span><strong>Campus Address:</strong> Mathura, Uttar Pradesh 281004, India</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary shrink-0" />
                <span><strong>Email:</strong> quick2learn23203@gmail.com</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-primary shrink-0" />
                <span><strong>Helpline &amp; WhatsApp:</strong> +91 76688 75809</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary shrink-0" />
                <span><strong>Office Hours:</strong> Monday through Saturday, 9:00 AM – 7:00 PM IST</span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
