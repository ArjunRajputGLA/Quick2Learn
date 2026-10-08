import type { NextConfig } from "next";

const storageBaseUrl = process.env.S3_PUBLIC_BASE_URL || "";
let storageOrigin = "";
try {
  if (storageBaseUrl) {
    storageOrigin = new URL(storageBaseUrl).origin;
  }
} catch {
  // Ignore malformed env var in dev
}

const cspDirectives = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com",
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: https://i.ytimg.com https://img.youtube.com https://images.unsplash.com ${storageOrigin}`.trim(),
  "font-src 'self' data:",
  "frame-src 'self' https://www.youtube-nocookie.com https://checkout.razorpay.com https://api.razorpay.com https://www.google.com https://maps.google.com",
  `connect-src 'self' https://api.razorpay.com https://checkout.razorpay.com https://vitals.vercel-insights.com ${storageOrigin}`.trim(),
  `media-src 'self' blob: ${storageOrigin}`.trim(),
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
];

const cspHeader = cspDirectives.join("; ");

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@quick2learn/shared"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "i.ytimg.com",
      },
      {
        protocol: "https",
        hostname: "img.youtube.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: cspHeader,
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
