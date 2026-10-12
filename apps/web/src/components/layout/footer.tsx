import Link from "next/link";
import { INSTITUTE_INFO } from "@quick2learn/shared";
import {
  MapPin,
  Phone,
  Mail,
  MessageCircle,
  ExternalLink,
  Smartphone,
  Apple,
} from "lucide-react";
import { YouTubeIcon, FacebookIcon, InstagramIcon, TwitterIcon } from "@/components/ui/icons";

export interface FooterSettings {
  contact?: {
    phone?: string;
    whatsapp?: string;
    email?: string;
    support_hours?: string;
  };
  address?: {
    line1?: string;
    city?: string;
    state?: string;
    pincode?: string;
    landmark?: string;
  };
  socials?: {
    youtube?: string;
    youtube_channel_id?: string;
    instagram?: string;
    facebook?: string;
    twitter?: string;
  };
}

interface FooterProps {
  settings?: FooterSettings | null;
}

export function Footer({ settings }: FooterProps) {
  const currentYear = new Date().getFullYear();

  function cleanText(str?: string | null): string {
    if (!str) return "";
    return str.replace(/\s*\[PLACEHOLDER\]/gi, "").trim();
  }

  // Contact details with defaults
  const phone = cleanText(settings?.contact?.phone) || "+91 76688 75809";
  const rawWhatsApp = cleanText(settings?.contact?.whatsapp) || "+91 76688 75809";
  const cleanWhatsApp = rawWhatsApp.replace(/[^0-9]/g, "");
  const email = cleanText(settings?.contact?.email) || "contact@quick2learn.in";

  // Address
  const rawAddressLine = cleanText(settings?.address?.line1);
  const addressLine =
    rawAddressLine && !rawAddressLine.toLowerCase().includes("bsa") && rawAddressLine.toLowerCase() !== "mathura"
      ? rawAddressLine
      : "";
  const rawCity = cleanText(settings?.address?.city) || "Mathura";
  const rawState = cleanText(settings?.address?.state) || "Uttar Pradesh";
  const rawPincode = cleanText(settings?.address?.pincode) || "281004";
  const cityState = `${rawCity}, ${rawState} ${rawPincode}`;

  // Socials
  const youtubeUrl = settings?.socials?.youtube || INSTITUTE_INFO.youtube.url;
  const facebookUrl =
    cleanText(settings?.socials?.facebook) || "https://facebook.com/quick2learn.in";
  const instagramUrl =
    cleanText(settings?.socials?.instagram) || "https://instagram.com/quick2learn.in";
  const twitterUrl =
    cleanText(settings?.socials?.twitter) || "https://twitter.com/Quick2Learn";

  return (
    <footer className="border-t border-border bg-surface-subtle text-ink-muted">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        {/* Main Grid: 4 Link Columns + Contact Block */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 lg:gap-10 mb-12">
          {/* Column 1: Classes */}
          <div className="space-y-3">
            <h3 className="text-caption font-bold uppercase tracking-wider text-ink">
              Classes
            </h3>
            <ul className="space-y-2 text-small">
              <li>
                <Link
                  href="/learn/ix/mathematics"
                  className="hover:text-primary transition-colors hover:underline underline-offset-2"
                >
                  Class IX (CBSE &amp; ICSE)
                </Link>
              </li>
              <li>
                <Link
                  href="/learn/x/mathematics"
                  className="hover:text-primary transition-colors hover:underline underline-offset-2"
                >
                  Class X (CBSE &amp; ICSE)
                </Link>
              </li>
              <li>
                <Link
                  href="/learn/xi/mathematics"
                  className="hover:text-primary transition-colors hover:underline underline-offset-2"
                >
                  Class XI (CBSE &amp; ISC)
                </Link>
              </li>
              <li>
                <Link
                  href="/learn/xii/mathematics"
                  className="hover:text-primary transition-colors hover:underline underline-offset-2"
                >
                  Class XII (CBSE &amp; ISC)
                </Link>
              </li>
              <li>
                <Link
                  href="/batches"
                  className="text-primary font-medium hover:underline underline-offset-2"
                >
                  View All Batches &rarr;
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 2: Subjects */}
          <div className="space-y-3">
            <h3 className="text-caption font-bold uppercase tracking-wider text-ink">
              Subjects
            </h3>
            <ul className="space-y-2 text-small">
              <li>
                <Link
                  href="/learn/xii/mathematics"
                  className="hover:text-primary transition-colors hover:underline underline-offset-2"
                >
                  Senior Mathematics
                </Link>
              </li>
              <li>
                <Link
                  href="/learn/x/chemistry"
                  className="hover:text-primary transition-colors hover:underline underline-offset-2"
                >
                  ICSE Chemistry
                </Link>
              </li>
              <li>
                <Link
                  href="/learn/x/biology"
                  className="hover:text-primary transition-colors hover:underline underline-offset-2"
                >
                  ICSE Biology
                </Link>
              </li>
              <li>
                <Link
                  href="/learn/xi/physics"
                  className="hover:text-primary transition-colors hover:underline underline-offset-2"
                >
                  Physics Foundation
                </Link>
              </li>
              <li>
                <Link
                  href="/lectures"
                  className="text-primary font-medium hover:underline underline-offset-2"
                >
                  Free Video Lessons &rarr;
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Quick2Learn */}
          <div className="space-y-3">
            <h3 className="text-caption font-bold uppercase tracking-wider text-ink">
              Quick2Learn
            </h3>
            <ul className="space-y-2 text-small">
              <li>
                <Link
                  href="/about"
                  className="hover:text-primary transition-colors hover:underline underline-offset-2"
                >
                  About the Institute
                </Link>
              </li>
              <li>
                <Link
                  href="/about#faculty"
                  className="hover:text-primary transition-colors hover:underline underline-offset-2"
                >
                  Faculty Mentors
                </Link>
              </li>
              <li>
                <Link
                  href="/results"
                  className="hover:text-primary transition-colors hover:underline underline-offset-2"
                >
                  Board Results &amp; Toppers
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="hover:text-primary transition-colors hover:underline underline-offset-2"
                >
                  Contact &amp; Campus Visit
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Help */}
          <div className="space-y-3">
            <h3 className="text-caption font-bold uppercase tracking-wider text-ink">
              Help &amp; Legal
            </h3>
            <ul className="space-y-2 text-small">
              <li>
                <Link
                  href="/faq"
                  className="hover:text-primary transition-colors hover:underline underline-offset-2"
                >
                  Frequently Asked Questions
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="hover:text-primary transition-colors hover:underline underline-offset-2"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="hover:text-primary transition-colors hover:underline underline-offset-2"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  href="/refund-policy"
                  className="hover:text-primary transition-colors hover:underline underline-offset-2"
                >
                  Refund &amp; Fee Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 5: Contact Block */}
          <div className="col-span-2 md:col-span-1 space-y-3">
            <h3 className="text-caption font-bold uppercase tracking-wider text-ink">
              Institute Contact
            </h3>
            <div className="space-y-2.5 text-small">
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <span className="leading-snug">
                  {addressLine ? `${addressLine}, ` : ""}{cityState}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-primary shrink-0" />
                <a
                  href={`tel:${phone}`}
                  className="hover:text-primary transition-colors"
                >
                  {phone}
                </a>
              </div>

              <div className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-emerald-600 shrink-0" />
                <a
                  href={`https://wa.me/${cleanWhatsApp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-emerald-600 transition-colors"
                >
                  WhatsApp: {rawWhatsApp}
                </a>
              </div>

              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary shrink-0" />
                <a
                  href={`mailto:${email}`}
                  className="hover:text-primary transition-colors truncate"
                >
                  {email}
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Social Links & Mobile App Badges Section */}
        <div className="border-t border-border pt-8 pb-4 flex flex-col lg:flex-row items-center justify-between gap-6">
          {/* Social Channels */}
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-caption font-bold uppercase tracking-wider text-ink mr-2">
              Follow Us:
            </span>
            <a
              href={youtubeUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Official YouTube Channel"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-surface border border-border text-caption font-medium text-ink hover:text-danger hover:border-danger transition-colors shadow-xs"
            >
              <YouTubeIcon className="h-4 w-4 text-danger" />
              <span>@Quick2Learn YouTube</span>
              <ExternalLink className="h-3 w-3 opacity-60" />
            </a>

            <a
              href={facebookUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook Page"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-surface border border-border text-caption font-medium text-ink hover:text-[#1877F2] hover:border-[#1877F2] transition-colors shadow-xs"
            >
              <FacebookIcon className="h-4 w-4 text-[#1877F2]" />
              <span>Facebook</span>
              <ExternalLink className="h-3 w-3 opacity-60" />
            </a>

            <a
              href={instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram Page"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-surface border border-border text-caption font-medium text-ink hover:text-[#E4405F] hover:border-[#E4405F] transition-colors shadow-xs"
            >
              <InstagramIcon className="h-4 w-4 text-[#E4405F]" />
              <span>Instagram</span>
              <ExternalLink className="h-3 w-3 opacity-60" />
            </a>

            <a
              href={twitterUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="X / Twitter Page"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-surface border border-border text-caption font-medium text-ink hover:text-ink hover:border-ink transition-colors shadow-xs"
            >
              <TwitterIcon className="h-4 w-4 text-ink" />
              <span>Twitter / X</span>
              <ExternalLink className="h-3 w-3 opacity-60" />
            </a>
          </div>

          {/* Two "App coming soon" badges */}
          <div className="flex items-center gap-3">
            {/* Google Play Badge */}
            <div
              className="flex items-center gap-2.5 px-3.5 py-2 rounded-lg bg-ink text-surface border border-ink shadow-sm select-none"
              title="Quick2Learn Android App coming soon"
            >
              <Smartphone className="h-5 w-5 text-accent shrink-0" />
              <div className="flex flex-col text-left">
                <span className="text-[10px] uppercase font-semibold text-surface/70 leading-none">
                  App Coming Soon
                </span>
                <span className="text-small font-bold text-surface leading-tight">
                  Google Play
                </span>
              </div>
            </div>

            {/* Apple App Store Badge */}
            <div
              className="flex items-center gap-2.5 px-3.5 py-2 rounded-lg bg-ink text-surface border border-ink shadow-sm select-none"
              title="Quick2Learn iOS App coming soon"
            >
              <Apple className="h-5 w-5 text-surface shrink-0" />
              <div className="flex flex-col text-left">
                <span className="text-[10px] uppercase font-semibold text-surface/70 leading-none">
                  App Coming Soon
                </span>
                <span className="text-small font-bold text-surface leading-tight">
                  App Store
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Copyright Line */}
        <div className="border-t border-border pt-6 mt-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-caption text-ink-muted">
          <p>© {currentYear} Quick2Learn Coaching Institute. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span>Mathura, Uttar Pradesh</span>
            <span>•</span>
            <span>Founder: Dinesh Singh Rajput</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
