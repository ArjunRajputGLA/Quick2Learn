import type { Metadata } from "next";
import { BreadcrumbsPlacement } from "@/components/layout/breadcrumbs-placement";
import { Badge } from "@/components/ui/badge";
import { ShieldAlert, Mail, Phone, MapPin, BookOpen, AlertTriangle } from "lucide-react";

export const metadata: Metadata = {
  title: "Terms of Service — Enrolment & Anti-Piracy Policy | Quick2Learn",
  description:
    "Official Terms of Service governing student admission, classroom conduct, academic policies, anti-piracy prohibitions, and digital portal usage at Quick2Learn Coaching Institute in Mathura.",
  alternates: {
    canonical: "/terms",
  },
  openGraph: {
    title: "Terms of Service | Quick2Learn Coaching Institute Mathura",
    description:
      "Official Terms of Service governing enrolment, academic conduct, and content usage at Quick2Learn Coaching Institute.",
    url: "https://quick2learn.in/terms",
  },
};

export default function TermsPage() {
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
          <Badge variant="primary" className="gap-1.5">
            <BookOpen className="h-3.5 w-3.5" />
            <span>Academic Guidelines • Student &amp; Parent Agreement</span>
          </Badge>
          <h1 className="text-display font-extrabold tracking-tight text-ink">
            Terms of Service
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
            Welcome to Quick2Learn Coaching Institute. These Terms of Service constitute a legally binding agreement between enrolled students, their parents or legal guardians, and <strong>Quick2Learn Coaching Institute</strong>, governing physical classroom coaching, hybrid lectures, and our digital learning portal.
          </p>
        </div>

        {/* Content Sections */}
        <div className="space-y-8 text-body text-ink-muted leading-relaxed">
          {/* 1. Acceptance of Terms */}
          <section className="space-y-3">
            <h2 className="text-h2 font-bold text-ink">1. Acceptance of Terms &amp; Scope</h2>
            <p>
              By enrolling in an offline classroom coaching batch, attending hybrid lectures, or creating an account on the online learning portal operated by <strong>Quick2Learn Coaching Institute</strong> (&ldquo;Quick2Learn&rdquo;, &ldquo;Institute&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;), located in <strong>Mathura, Uttar Pradesh 281004, India</strong>, the student and their parent or legal guardian agree to strictly abide by these Terms of Service.
            </p>
            <p>
              If a student is below 18 years of age, their parent or legal guardian must review, endorse, and accept these terms on the student&apos;s behalf during batch registration.
            </p>
          </section>

          {/* 2. Admission & Batch Allocation */}
          <section className="space-y-3">
            <h2 className="text-h2 font-bold text-ink">2. Admission, Batch Allocation &amp; Session Validity</h2>
            <div className="space-y-3 pt-1">
              <div className="rounded-xl border border-border bg-surface-subtle p-4 space-y-1.5">
                <div className="font-bold text-ink">Academic Session Validity</div>
                <p className="text-small text-ink-muted">
                  Batch enrollments are valid exclusively for the enrolled academic session (e.g. 2026–27 session) and are strictly personal to the registered student. Enrollments cannot be transferred, assigned, or shared with siblings, peers, or other candidates under any circumstances.
                </p>
              </div>

              <div className="rounded-xl border border-border bg-surface-subtle p-4 space-y-1.5">
                <div className="font-bold text-ink">Strict Batch Size Limit (35–40 Students)</div>
                <p className="text-small text-ink-muted">
                  To ensure that senior faculty mentors (Mr. Dinesh Singh Rajput and Mrs. Namita Singh Rajput) provide individual attention, step-by-step marking, and dedicated doubt resolution, every batch is strictly capped at 35 to 40 students. Seats are allocated strictly on a confirmed registration basis.
                </p>
              </div>

              <div className="rounded-xl border border-border bg-surface-subtle p-4 space-y-1.5">
                <div className="font-bold text-ink">Curriculum &amp; Stream Prerequisites</div>
                <p className="text-small text-ink-muted">
                  Students must be enrolled in corresponding recognized school curricula (CBSE, ICSE, or ISC Classes IX, X, XI, or XII). Quick2Learn reserves the right to evaluate foundational aptitude through diagnostic assessments prior to batch placement.
                </p>
              </div>
            </div>
          </section>

          {/* 3. Classroom Conduct & Sunday Mock Tests */}
          <section className="space-y-3">
            <h2 className="text-h2 font-bold text-ink">3. Student Conduct, Attendance &amp; Weekly Mock Exams</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong className="text-ink">Punctuality:</strong> Students must arrive at the Mathura campus classroom at least 5 minutes prior to the scheduled lecture. Late entry disrupts lecture flow and is discouraged.
              </li>
              <li>
                <strong className="text-ink">Mandatory Sunday Board Mock Exams:</strong> Weekly Sunday board-pattern mock examinations and homework practice sets are compulsory. Continued unexcused absence from three consecutive Sunday tests will trigger an automated parent counseling review.
              </li>
              <li>
                <strong className="text-ink">Respectful Conduct &amp; Zero Tolerance:</strong> Students must maintain courtesy toward faculty mentors, administrative staff, and fellow classmates. Indiscipline, bullying, vandalism of campus assets, or academic dishonesty will result in immediate suspension or expulsion without fee reimbursement.
              </li>
            </ul>
          </section>

          {/* 4. Anti-Piracy Policy */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-6 w-6 text-danger shrink-0" />
              <h2 className="text-h2 font-bold text-ink">
                4. Intellectual Property &amp; Content Protection (Anti-Piracy Policy)
              </h2>
            </div>
            <div className="rounded-2xl border border-danger/20 bg-danger/5 p-6 text-small text-ink leading-relaxed space-y-4">
              <div className="font-bold text-danger flex items-center gap-2 text-base">
                <AlertTriangle className="h-5 w-5 shrink-0" />
                <span>Strict Prohibition on Recording, Copying, and Redistribution</span>
              </div>
              <p>
                All course lectures, classroom board notes, video recordings, chapter formula sheets, previous years&apos; question analyses, Sunday mock test papers, and model answer keys provided by <strong>Quick2Learn Coaching Institute</strong> constitute protected intellectual property under the <strong>Indian Copyright Act, 1957</strong>.
              </p>
              <ul className="list-disc pl-6 space-y-2 text-danger font-medium">
                <li>Students and parents are strictly prohibited from audio-recording, video-recording, screen-recording, or capturing unauthorized photos of live or recorded lectures.</li>
                <li>Redistribution, uploading, sharing, broadcasting, or commercial resale of any study material on Telegram, WhatsApp, YouTube, Google Drive, torrent platforms, or offline printing shops is strictly illegal.</li>
                <li>Digital watermarks and session hashes are embedded in all downloadable and streaming materials to immediately identify the source account of any leak.</li>
              </ul>
              <p className="text-caption text-ink-muted pt-2 border-t border-danger/20">
                Any student found violating this Anti-Piracy Policy will face immediate permanent de-enrollment, forfeiture of all fees paid, cancellation of portal access, and potential civil and criminal legal action under Sections 63 and 65 of the Indian Copyright Act, 1957.
              </p>
            </div>
          </section>

          {/* 5. Digital Portal Single-User License */}
          <section className="space-y-3">
            <h2 className="text-h2 font-bold text-ink">5. Digital Portal License &amp; Account Security</h2>
            <p>
              Every enrolled student is granted a limited, personal, non-exclusive, non-transferable, revocable license to access digital resources on <a href="https://quick2learn.in" className="text-primary hover:underline">quick2learn.in</a>:
            </p>
            <ul className="list-disc pl-6 space-y-1.5">
              <li>Account credentials (email, mobile number, OTP session) are for the sole use of the registered student.</li>
              <li>Simultaneous logins from distinct devices or irregular IP locations will automatically flag the account for administrative security verification.</li>
              <li>Students are responsible for safeguarding their login credentials and must immediately notify the institute if they suspect unauthorized account activity.</li>
            </ul>
          </section>

          {/* 6. Fees & Payment Terms */}
          <section className="space-y-3">
            <h2 className="text-h2 font-bold text-ink">6. Fees, Payment Schedules &amp; Invoicing</h2>
            <p>
              Tuition fees must be paid according to the chosen enrollment fee plan:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong className="text-ink">Payment Modes:</strong> We accept online digital payments via Razorpay (UPI, Debit/Credit Cards, NetBanking) and offline payments (Cash, Cheque, or Bank Transfer) at the Mathura campus admissions desk.
              </li>
              <li>
                <strong className="text-ink">Serialized Invoicing:</strong> Official serialized receipts with GST details are issued upon every successful fee transaction and are accessible on the student dashboard.
              </li>
              <li>
                <strong className="text-ink">Installment Deadlines:</strong> For multi-installment plans, each installment must be settled on or before the agreed milestone due date. Defaulting on fee installments after written notice may lead to temporary withholding of classroom attendance and digital notes.
              </li>
            </ul>
          </section>

          {/* 7. Academic Disclaimer */}
          <section className="space-y-3">
            <h2 className="text-h2 font-bold text-ink">7. Academic Standards &amp; Performance Disclaimer</h2>
            <p>
              Quick2Learn Coaching Institute pledges pedagogical excellence, structured syllabus coverage, rigorous test practice, and personalized concept mentoring. However, academic results in CBSE and ICSE/ISC Board Examinations depend fundamentally on individual student effort, regular practice, timely homework completion, and active exam preparation. While we take immense pride in producing top rankers in Mathura every year, enrollment does not guarantee specific percentages or board ranks.
            </p>
          </section>

          {/* 8. Governing Law */}
          <section className="space-y-3">
            <h2 className="text-h2 font-bold text-ink">8. Governing Law &amp; Jurisdiction</h2>
            <p>
              These Terms of Service, student admissions, and all institutional transactions shall be governed by and construed in accordance with the laws of the Republic of India. In the event of any dispute or claim arising out of or related to these terms, the competent courts in <strong>Mathura, Uttar Pradesh, India</strong> shall have exclusive legal jurisdiction.
            </p>
          </section>

          {/* 9. Contact Info */}
          <section className="space-y-4 pt-4 border-t border-border">
            <h2 className="text-h2 font-bold text-ink">9. Institutional Inquiries &amp; Administration</h2>
            <p>
              For legal clarifications, batch transfers, or administrative inquiries regarding these Terms of Service, please reach out to our campus office:
            </p>
            <div className="rounded-2xl border border-border bg-surface-subtle p-6 space-y-3 text-small">
              <div>
                <strong className="text-ink font-bold">Institution:</strong> Quick2Learn Coaching Institute
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
                  <strong>Phone / WhatsApp:</strong>{" "}
                  <a href="tel:+917668875809" className="text-primary hover:underline font-semibold">
                    +91 76688 75809
                  </a>
                </span>
              </div>
              <div className="text-caption text-ink-muted pt-2 border-t border-border">
                Admissions &amp; Administrative Desk Hours: Monday to Saturday, 9:00 AM &ndash; 7:00 PM IST.
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
