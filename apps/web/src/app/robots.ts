import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://quick2learn.vercel.app";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/dashboard", "/checkout", "/api"],
      },
      {
        userAgent: [
          "GPTBot",
          "ChatGPT-User",
          "ClaudeBot",
          "PerplexityBot",
          "Google-Extended",
          "Applebot-Extended",
        ],
        allow: ["/", "/learn", "/lectures", "/batches", "/about", "/results", "/faq"],
        disallow: ["/admin", "/dashboard", "/checkout", "/api"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: "https://quick2learn.vercel.app",
  };
}
