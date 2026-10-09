import type { Metadata } from "next";
import { Inter, Noto_Sans_Devanagari } from "next/font/google";
import "@/styles/globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Analytics } from "@/components/analytics";
import { SmoothScrollLimiter } from "@/components/layout/smooth-scroll";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const notoSansDevanagari = Noto_Sans_Devanagari({
  subsets: ["devanagari"],
  variable: "--font-devanagari",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://quick2learn.in";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Quick2Learn — Mathematics & Science Coaching | Mathura",
    template: "%s | Quick2Learn",
  },
  description:
    "Official website of Quick2Learn coaching institute in Mathura, UP. Mentorship by Mr. Dinesh Singh Rajput (25+ yrs Mathematics) & Mrs. Namita Singh Rajput (ICSE Science). Classes IX–XII CBSE & ICSE/ISC.",
  keywords: [
    "Quick2Learn",
    "maths coaching Mathura",
    "Class 12 integrals lecture Hindi",
    "Dinesh Singh Rajput",
    "Namita Singh Rajput",
    "Mathematics Coaching Mathura",
    "CBSE Class 10 Math",
    "CBSE Class 12 Math",
    "ICSE Chemistry Biology",
    "Mathura Coaching Institute",
  ],
  authors: [{ name: "Dinesh Singh Rajput" }, { name: "Quick2Learn Faculty" }],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Quick2Learn — Excellence in Mathematics & Sciences | Mathura",
    description:
      "Premier coaching for Classes IX–XII (CBSE & ICSE/ISC) in Mathura by veteran educators Dinesh Singh Rajput and Namita Singh Rajput.",
    url: siteUrl,
    siteName: "Quick2Learn",
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Quick2Learn — Excellence in Mathematics & Sciences | Mathura",
    description:
      "Premier coaching for Classes IX–XII (CBSE & ICSE/ISC) in Mathura by veteran educators Dinesh Singh Rajput and Namita Singh Rajput.",
    site: "@Quick2Learn",
  },
  verification: {
    google:
      process.env.GOOGLE_SITE_VERIFICATION ||
      process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION ||
      undefined,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${notoSansDevanagari.variable} h-full antialiased`}>
      <body className="flex min-h-screen flex-col bg-surface text-ink font-sans antialiased">
        {/* Accessibility: Skip to Content link for keyboard and screen reader navigation */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-white focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-accent"
        >
          Skip to main content
        </a>
        {children}
        <Toaster />
        <Analytics />
        <SmoothScrollLimiter />
      </body>
    </html>
  );
}