// DRAFT: This text is a draft to be reviewed before going live.
import type { Metadata } from "next";
import { BreadcrumbsPlacement } from "@/components/layout/breadcrumbs-placement";
import { Badge } from "@/components/ui/badge";
import { Truck, Monitor, MapPin, Mail, Phone } from "lucide-react";

export const metadata: Metadata = {
  title: "Delivery & Shipping Policy — Offline Classes & Digital Access | Quick2Learn",
  description:
    "Delivery policy of Quick2Learn Coaching Institute explaining in-person classroom delivery at our Mathura centre and instant online digital portal access, with no physical shipping.",
  alternates: {
    canonical: "/delivery-policy",
  },
  openGraph: {
    title: "Delivery & Shipping Policy | Quick2Learn",
    description:
      "Delivery policy of Quick2Learn Coaching Institute in Mathura.",
    url: "https://quick2learn.in/delivery-policy",
  },
};

export default function DeliveryPolicyPage() {
  {/* DRAFT: This legal policy is a draft to be reviewed and approved by legal counsel before going live. */}
  return (
    <div className="bg-surface">
      <BreadcrumbsPlacement
        items={[
          { label: "Home", href: "/" },
          { label: "Delivery & Shipping Policy", href: "/delivery-policy" },
        ]}
      />

      <div className="container mx-auto px-4 py-8 lg:py-14 max-w-4xl space-y-10">
        {/* Header */}
        <div className="space-y-3 border-b border-border pb-6">
          <Badge variant="primary">Payment Gateway Compliance • Service Delivery</Badge>
          <h1 className="text-display font-extrabold tracking-tight text-ink">
            Delivery &amp; Shipping Policy
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-caption text-ink-muted">
            <span>Last updated: October 2026</span>
            <span>•</span>
            <span className="text-accent font-semibold">Status: Draft under legal review</span>
          </div>
          <p className="text-small text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3 mt-2">
            <strong>Notice:</strong> This draft delivery policy specifies the fulfillment mechanism for all academic coaching cohorts provided by <strong>[BUSINESS NAME]</strong>. Placeholders in brackets indicate fields to be formalized prior to payment gateway activation.
          </p>
        </div>

        {/* Content Sections */}
        <div className="space-y-8 text-body text-ink-muted leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-h2 font-bold text-ink">1. Nature of Services Provided</h2>
            <p>
              <strong>[BUSINESS NAME]</strong> (&ldquo;Quick2Learn&rdquo;) is an educational coaching institute offering secondary and senior secondary academic coaching in Mathematics and Sciences for Classes IX–XII. We provide professional educational services and digital learning content. <strong>We do not sell, ship, or deliver physical retail merchandise, parcels, or books via postal or courier networks.</strong>
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-h2 font-bold text-ink">2. Delivery Methods</h2>
            <p>
              Educational services are delivered across two synchronized channels:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              {/* Offline Classroom Delivery */}
              <div className="rounded-xl border border-border bg-surface p-6 shadow-xs space-y-3">
                <div className="flex items-center gap-2 text-primary font-bold text-body">
                  <MapPin className="h-5 w-5" />
                  <h3>Offline Classroom Delivery</h3>
                </div>
                <p className="text-small text-ink-muted leading-relaxed">
                  Conducted in person at our coaching campus:
                </p>
                <div className="rounded-lg bg-surface-subtle p-3 text-caption font-semibold text-ink">
                  [ADDRESS]
                </div>
                <ul className="list-disc pl-5 text-small text-ink-muted space-y-1">
                  <li>Lectures commence on the official batch start date.</li>
                  <li>Conducted as per the published weekly timetable (e.g. Mon, Wed, Fri 4:30 PM – 6:00 PM).</li>
                  <li>Sunday board mock examinations held weekly at the centre.</li>
                </ul>
              </div>

              {/* Online Digital Access Delivery */}
              <div className="rounded-xl border border-border bg-surface p-6 shadow-xs space-y-3">
                <div className="flex items-center gap-2 text-primary font-bold text-body">
                  <Monitor className="h-5 w-5" />
                  <h3>Online Digital Portal Access</h3>
                </div>
                <p className="text-small text-ink-muted leading-relaxed">
                  Delivered electronically via this website and student app:
                </p>
                <div className="rounded-lg bg-surface-subtle p-3 text-caption font-semibold text-ink">
                  Instant Activation upon Payment Confirmation
                </div>
                <ul className="list-disc pl-5 text-small text-ink-muted space-y-1">
                  <li>Instant access to recorded video lectures and chapter notes.</li>
                  <li>Downloadable PDF formula sheets and practice question banks.</li>
                  <li>Progress tracking and digital performance scorecards.</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-h2 font-bold text-ink">3. Delivery Timelines &amp; Confirmation</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong className="text-ink">Digital Access Timeline:</strong> Immediate. Upon successful payment authorization through Razorpay, your account is automatically provisioned and digital course modules are unlocked in your Student Dashboard. An automated email confirmation containing your transaction receipt is dispatched within minutes.
              </li>
              <li>
                <strong className="text-ink">Classroom Admission Timeline:</strong> Students may attend the next scheduled classroom session immediately following seat reservation. An in-person orientation is conducted on the student&apos;s first day at the Mathura centre.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <div className="rounded-xl border border-border bg-surface-subtle p-6 space-y-3">
              <div className="flex items-center gap-2 text-ink font-bold text-h3">
                <Truck className="h-5 w-5 text-primary" />
                <h2>4. Explicit &ldquo;No Physical Shipping&rdquo; Policy</h2>
              </div>
              <p className="text-small text-ink-muted leading-relaxed">
                Because all services are delivered in-person at the campus or online via web and mobile application, <strong>no physical items are shipped via third-party couriers or postal delivery</strong>. Consequently:
              </p>
              <ul className="list-disc pl-5 text-small text-ink-muted space-y-1">
                <li>Zero shipping, handling, or courier delivery fees are charged.</li>
                <li>There are no transit delays, lost parcels, or customs duties.</li>
                <li>Any physical study sheets, mock question papers, or booklets are handed to students directly inside the classroom at our Mathura centre.</li>
              </ul>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-h2 font-bold text-ink">5. Access Support &amp; Delivery Disputes</h2>
            <p>
              If your digital portal access is not activated within one (1) hour of successful payment, or if you encounter any technical difficulty accessing video lessons or batch resources, please contact our support desk immediately:
            </p>
            <div className="rounded-xl border border-border bg-surface-subtle p-6 space-y-3 text-small">
              <div>
                <strong className="text-ink font-semibold">Institute:</strong> [BUSINESS NAME]
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary shrink-0" />
                <span><strong>Campus Address:</strong> [ADDRESS]</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary shrink-0" />
                <span><strong>Support Email:</strong> [EMAIL]</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-primary shrink-0" />
                <span><strong>Helpline Phone:</strong> [PHONE] (+91 76688 75809)</span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
