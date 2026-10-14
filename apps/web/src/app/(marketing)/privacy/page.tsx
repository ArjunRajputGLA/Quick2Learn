import type { Metadata } from "next";
import { BreadcrumbsPlacement } from "@/components/layout/breadcrumbs-placement";
import { Badge } from "@/components/ui/badge";
import { Mail, Phone, MapPin, ShieldCheck, Lock, UserCheck, FileText } from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy Policy — DPDP Act (2023) Compliant | Quick2Learn",
  description:
    "Privacy policy of Quick2Learn Coaching Institute in Mathura regarding personal data collection, processing, security, retention, and student rights under India's Digital Personal Data Protection Act, 2023.",
  alternates: {
    canonical: "/privacy",
  },
  openGraph: {
    title: "Privacy Policy | Quick2Learn Coaching Institute Mathura",
    description:
      "Official privacy policy of Quick2Learn Coaching Institute governing student data protection under India's DPDP Act, 2023.",
    url: "https://quick2learn.in/privacy",
  },
};

export default function PrivacyPage() {
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
          <Badge variant="primary" className="gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>DPDP Act (India) Compliant • Academic Data Protection</span>
          </Badge>
          <h1 className="text-display font-extrabold tracking-tight text-ink">
            Privacy Policy
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
            Quick2Learn Coaching Institute is committed to upholding the highest standards of data integrity and student privacy. This policy outlines how student and parent personal data is collected, utilized, and safeguarded in accordance with the <strong>Digital Personal Data Protection Act, 2023 (DPDP Act)</strong> and the <strong>Information Technology Act, 2000</strong>.
          </p>
        </div>

        {/* Content Sections */}
        <div className="space-y-8 text-body text-ink-muted leading-relaxed">
          {/* 1. Overview & Data Fiduciary */}
          <section className="space-y-3">
            <h2 className="text-h2 font-bold text-ink">1. Data Fiduciary &amp; Identity</h2>
            <p>
              This Privacy Policy applies to all services provided by <strong>Quick2Learn Coaching Institute</strong> (&ldquo;Quick2Learn&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;), acting as the Data Fiduciary under Indian law, having its primary educational centre and registered campus at <strong>Mathura, Uttar Pradesh 281004, India</strong>.
            </p>
            <p>
              By accessing our website (<a href="https://quick2learn.in" className="text-primary hover:underline">https://quick2learn.in</a>), enrolling in our offline classroom coaching programs, or using our digital student portal, students and their parents or legal guardians consent to the data practices described herein.
            </p>
          </section>

          {/* 2. Personal Data We Collect */}
          <section className="space-y-3">
            <h2 className="text-h2 font-bold text-ink">2. Categories of Personal Data We Collect</h2>
            <p>
              We collect only the minimum personal data strictly necessary to deliver conceptual academic mentoring and fulfill regulatory administrative duties:
            </p>
            <div className="space-y-3 pt-1">
              <div className="rounded-xl border border-border bg-surface-subtle p-4 space-y-1.5">
                <div className="font-bold text-ink flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-primary shrink-0" />
                  <span>Student Academic &amp; Profile Information</span>
                </div>
                <p className="text-small text-ink-muted">
                  Full name, date of birth, enrolled class level (Classes IX, X, XI, or XII), school name, board of examination (CBSE, ICSE, ISC, or UP Board), profile photograph, classroom attendance records, submitted homework assignments, and weekly Sunday mock test scores.
                </p>
              </div>

              <div className="rounded-xl border border-border bg-surface-subtle p-4 space-y-1.5">
                <div className="font-bold text-ink flex items-center gap-2">
                  <Phone className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Parent &amp; Guardian Contact Details</span>
                </div>
                <p className="text-small text-ink-muted">
                  Parent/guardian full name, relationship to the student, primary mobile phone number, WhatsApp contact number for attendance and report alerts, email address, and residential city.
                </p>
              </div>

              <div className="rounded-xl border border-border bg-surface-subtle p-4 space-y-1.5">
                <div className="font-bold text-ink flex items-center gap-2">
                  <Lock className="h-4 w-4 text-indigo-600 shrink-0" />
                  <span>Payment &amp; Billing Transaction Data</span>
                </div>
                <p className="text-small text-ink-muted">
                  Enrolled batch fee plan, transaction dates, fee installment schedules, serialized tax receipts, and Razorpay payment order identifiers. <em>Note: Sensitive payment credentials (debit/credit card numbers, CVVs, and net-banking passwords) are processed directly by our PCI-DSS Level 1 compliant payment gateway and are never stored on Quick2Learn servers.</em>
                </p>
              </div>

              <div className="rounded-xl border border-border bg-surface-subtle p-4 space-y-1.5">
                <div className="font-bold text-ink flex items-center gap-2">
                  <FileText className="h-4 w-4 text-amber-600 shrink-0" />
                  <span>Technical &amp; Digital Portal Usage Logs</span>
                </div>
                <p className="text-small text-ink-muted">
                  IP address, device type, browser metadata, secure authentication cookies, and video progress tracking across online lectures to safeguard student account security and prevent unauthorized access.
                </p>
              </div>
            </div>
          </section>

          {/* 3. Purpose of Processing */}
          <section className="space-y-3">
            <h2 className="text-h2 font-bold text-ink">3. Legitimate Purposes of Data Processing</h2>
            <p>
              We process personal data solely for legitimate educational and institutional purposes:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Conducting classroom, hybrid, and online lectures in Senior Mathematics, ICSE Sciences, Humanities, and Languages.</li>
              <li>Compiling weekly Sunday board-pattern mock examination scorecards, personalized teacher feedback, and subject performance analysis.</li>
              <li>Transmitting critical student attendance notices, batch schedule updates, and fee installment alerts to parents via SMS, WhatsApp, and email.</li>
              <li>Issuing serialized tax receipts and maintaining statutory accounting records in compliance with Indian taxation laws.</li>
              <li>Restricting digital portal access to enrolled students and preventing illegal piracy or account sharing.</li>
            </ul>
            <div className="rounded-lg bg-primary/5 border border-primary/20 p-3.5 text-small text-ink font-medium">
              Commercial Non-Disclosure Guarantee: Quick2Learn maintains a strict policy against selling, renting, trading, or sharing student or parent data with external marketing agencies, advertising networks, or lead aggregators.
            </div>
          </section>

          {/* 4. Protection of Children & Minors */}
          <section className="space-y-3">
            <h2 className="text-h2 font-bold text-ink">4. Special Protections for Minor Students</h2>
            <p>
              Recognizing that secondary school students enrolled in Classes IX–XII are predominantly minors (under the age of 18), Quick2Learn strictly enforces Section 9 of the DPDP Act, 2023:
            </p>
            <ul className="list-disc pl-6 space-y-1.5">
              <li>Admissions and enrollment contracts require verifiable parental or legal guardian consent.</li>
              <li>We do not engage in targeted advertising, behavioral profiling, or tracking of minor students.</li>
              <li>Academic achievements and Hall of Fame board scorecards are featured publicly only with explicit prior parental authorization.</li>
            </ul>
          </section>

          {/* 5. Trusted Data Processors */}
          <section className="space-y-3">
            <h2 className="text-h2 font-bold text-ink">5. Third-Party Service Providers (Data Processors)</h2>
            <p>
              To maintain our operational efficiency, learning portal, and communication channels, certain personal data is processed by trusted technology providers operating under strict security and confidentiality agreements:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="rounded-xl border border-border bg-surface-subtle p-4 space-y-1">
                <div className="font-bold text-ink">PostgreSQL Database Infrastructure</div>
                <div className="text-small text-ink-muted">Encrypted database storage for secure student records and batch enrollment details.</div>
              </div>
              <div className="rounded-xl border border-border bg-surface-subtle p-4 space-y-1">
                <div className="font-bold text-ink">Secure Object Storage (S3 API)</div>
                <div className="text-small text-ink-muted">Encrypted cloud storage for lecture notes, formula sheets, mock tests, and faculty resources.</div>
              </div>
              <div className="rounded-xl border border-border bg-surface-subtle p-4 space-y-1">
                <div className="font-bold text-ink">Razorpay Payment Gateway</div>
                <div className="text-small text-ink-muted">PCI-DSS Level 1 compliant gateway for secure fee payments via UPI, NetBanking, and cards.</div>
              </div>
              <div className="rounded-xl border border-border bg-surface-subtle p-4 space-y-1">
                <div className="font-bold text-ink">Google SMTP &amp; Transactional Mail</div>
                <div className="text-small text-ink-muted">Secure email delivery infrastructure for OTP logins, fee receipts, and admission notices.</div>
              </div>
            </div>
          </section>

          {/* 6. Data Retention Policy */}
          <section className="space-y-3">
            <h2 className="text-h2 font-bold text-ink">6. Data Retention &amp; Secure Disposal</h2>
            <p>
              Personal data is actively retained for the duration of the student&apos;s enrollment with <strong>Quick2Learn Coaching Institute</strong>. Following completion of the enrolled academic session, academic and transactional records are archived for a maximum period of seven (7) years to comply with statutory taxation, accounting, and educational auditing obligations. At the conclusion of this statutory window, all physical records are shredded and digital data is permanently purged from active systems.
            </p>
          </section>

          {/* 7. Student & Parent Rights */}
          <section className="space-y-3">
            <h2 className="text-h2 font-bold text-ink">7. Your Rights as a Data Principal (DPDP Act, 2023)</h2>
            <p>
              Under Chapter III of the Digital Personal Data Protection Act, 2023, students and parents possess the following enforceable rights:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong className="text-ink">Right to Information:</strong> Access a comprehensive summary of personal data held by Quick2Learn and the identities of any data processors involved.</li>
              <li><strong className="text-ink">Right to Correction &amp; Updating:</strong> Rectify incomplete, outdated, or inaccurate personal or academic details.</li>
              <li><strong className="text-ink">Right to Erasure:</strong> Request the deletion of non-essential personal information when educational and statutory purposes have ceased.</li>
              <li><strong className="text-ink">Right of Grievance Redressal:</strong> Direct grievances regarding personal data processing to our dedicated Grievance Redressal Officer.</li>
            </ul>
            <p className="pt-1">
              To exercise any of these rights, email your formal request to <a href="mailto:quick2learn23203@gmail.com" className="text-primary font-semibold hover:underline">quick2learn23203@gmail.com</a> with the subject header &ldquo;DPDP Data Principal Request&rdquo;. Requests are processed within 15 working days.
            </p>
          </section>

          {/* 8. Cookies & Security */}
          <section className="space-y-3">
            <h2 className="text-h2 font-bold text-ink">8. Cookies &amp; Platform Security</h2>
            <p>
              Our website uses strictly essential HTTP session cookies to authenticate logged-in students, prevent cross-site request forgery (CSRF), and maintain secure portal access. We do not use third-party advertising cookies, trackers, or behavioral profiling tools. All data transmission across <a href="https://quick2learn.in" className="text-primary hover:underline">quick2learn.in</a> is enforced via modern HTTPS/TLS 1.3 encryption.
            </p>
          </section>

          {/* 9. Grievance Officer & Contact */}
          <section className="space-y-4 pt-4 border-t border-border">
            <h2 className="text-h2 font-bold text-ink">9. Grievance Officer &amp; Institutional Contact</h2>
            <p>
              In accordance with Section 10 of the Information Technology Act, 2000 and Section 12 of the DPDP Act, 2023, the contact details of our Grievance Redressal Officer are as follows:
            </p>
            <div className="rounded-2xl border border-border bg-surface-subtle p-6 space-y-3 text-small">
              <div>
                <strong className="text-ink font-bold">Officer Designation:</strong> Grievance Redressal Officer, Quick2Learn Coaching Institute
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary shrink-0" />
                <span><strong>Campus Address:</strong> Mathura, Uttar Pradesh 281004, India</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary shrink-0" />
                <span>
                  <strong>Official Email:</strong>{" "}
                  <a href="mailto:quick2learn23203@gmail.com" className="text-primary hover:underline font-semibold">
                    quick2learn23203@gmail.com
                  </a>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-primary shrink-0" />
                <span>
                  <strong>Helpline / WhatsApp:</strong>{" "}
                  <a href="tel:+917668875809" className="text-primary hover:underline font-semibold">
                    +91 76688 75809
                  </a>
                </span>
              </div>
              <p className="text-caption text-ink-muted pt-2 border-t border-border">
                All data grievances are acknowledged within 48 hours and resolved in accordance with statutory guidelines.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
