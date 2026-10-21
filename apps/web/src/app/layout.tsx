import type { Metadata } from "next";
import Script from "next/script";
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
    images: [
      {
        url: "/images/og/quick2learn-og.jpg",
        width: 1200,
        height: 630,
        alt: "Quick2Learn — Mathematics & Science Coaching in Mathura",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Quick2Learn — Excellence in Mathematics & Sciences | Mathura",
    description:
      "Premier coaching for Classes IX–XII (CBSE & ICSE/ISC) in Mathura by veteran educators Dinesh Singh Rajput and Namita Singh Rajput.",
    site: "@Quick2Learn",
    images: ["/images/og/quick2learn-og.jpg"],
  },
  verification: {
    google:
      process.env.GOOGLE_SITE_VERIFICATION ||
      process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION ||
      undefined,
  },
  icons: {
    icon: [
      { url: "/images/assets/app%20logo.png", type: "image/png" },
      { url: "/icon.png", type: "image/png" },
    ],
    apple: [
      { url: "/images/assets/app%20logo.png", type: "image/png" },
      { url: "/apple-icon.png", type: "image/png" },
    ],
    shortcut: "/images/assets/app%20logo.png",
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

        {/* Global Google Translate Off-screen Container (keeps DOM layout active for TranslateElement) */}
        <div
          id="google_translate_element"
          aria-hidden="true"
          style={{
            position: "fixed",
            bottom: "-9999px",
            left: "-9999px",
            width: "1px",
            height: "1px",
            opacity: 0,
            pointerEvents: "none",
            overflow: "hidden",
            zIndex: -1,
          }}
        />
        <Script
          id="google-translate-loader"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                window.googleTranslateElementInit = function() {
                  try {
                    if (window.google && window.google.translate && window.google.translate.TranslateElement) {
                      new window.google.translate.TranslateElement({
                        pageLanguage: 'en',
                        autoDisplay: false
                      }, 'google_translate_element');
                    }
                  } catch (e) {
                    console.error('Google Translate init error:', e);
                  }
                };

                if (window.google && window.google.translate && window.google.translate.TranslateElement) {
                  window.googleTranslateElementInit();
                  return;
                }

                if (!document.getElementById('google-translate-core-script')) {
                  var gt = document.createElement('script');
                  gt.id = 'google-translate-core-script';
                  gt.type = 'text/javascript';
                  gt.async = true;
                  gt.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
                  document.head.appendChild(gt);
                }
              })();
            `,
          }}
        />
      </body>
    </html>
  );
}