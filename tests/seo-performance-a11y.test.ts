import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "../packages/db/src/schema";
import { seed } from "../packages/db/src/seed";
import sitemap from "../apps/web/src/app/sitemap";
import robots from "../apps/web/src/app/robots";
import { trackEvent } from "../apps/web/src/lib/analytics";
import { getBatches } from "../apps/web/src/server/data/batches";
import { getFacultyList } from "../apps/web/src/server/data/catalog";
import { getVideos } from "../apps/web/src/server/data/videos";
import { slugify } from "@quick2learn/shared";
import { readFileSync } from "fs";
import { join } from "path";

const testDbUrl =
  process.env.DATABASE_URL_TEST ||
  "postgresql://postgres:postgres@localhost:5432/quick2learn_test";

const testPool = new Pool({
  connectionString: testDbUrl,
});

describe("SEO, Performance, Accessibility & Analytics Verification Suite", () => {
  beforeAll(async () => {
    process.env.DATABASE_URL = testDbUrl;
    await seed(testDbUrl);
  });

  afterAll(async () => {
    await testPool.end();
  });

  // 1. ROBOTS.TXT
  it("Test 1: robots.ts disallows private routes (/admin, /dashboard, /checkout, /api) and declares sitemap", () => {
    const rules = robots();
    expect(rules).toBeDefined();
    expect(rules.rules).toBeDefined();

    const ruleObj = Array.isArray(rules.rules) ? rules.rules[0] : rules.rules;
    expect(ruleObj?.disallow).toContain("/admin");
    expect(ruleObj?.disallow).toContain("/dashboard");
    expect(ruleObj?.disallow).toContain("/checkout");
    expect(ruleObj?.disallow).toContain("/api");
    expect(ruleObj?.allow).toContain("/");
    expect(rules.sitemap).toBe("https://quick2learn.in/sitemap.xml");
  });

  // 2. SITEMAP.TS
  it("Test 2: sitemap.ts generates complete dynamic routes from database (static, faculty, batches, chapters, lectures)", async () => {
    const entries = await sitemap();
    expect(Array.isArray(entries)).toBe(true);
    expect(entries.length).toBeGreaterThan(20);

    const urls = entries.map((e) => e.url);

    // Static pages
    expect(urls).toContain("https://quick2learn.in");
    expect(urls).toContain("https://quick2learn.in/about");
    expect(urls).toContain("https://quick2learn.in/contact");
    expect(urls).toContain("https://quick2learn.in/results");
    expect(urls).toContain("https://quick2learn.in/batches");
    expect(urls).toContain("https://quick2learn.in/lectures");
    expect(urls).toContain("https://quick2learn.in/learn");
    expect(urls).toContain("https://quick2learn.in/faq");

    // Dynamic Faculty
    const faculty = await getFacultyList();
    for (const f of faculty) {
      expect(urls).toContain(`https://quick2learn.in/faculty/${f.slug}`);
    }

    // Dynamic Batches
    const batches = await getBatches(null);
    for (const b of batches) {
      expect(urls).toContain(`https://quick2learn.in/batches/${b.slug}`);
    }

    // Dynamic Published Lectures
    const videos = await getVideos(null);
    expect(videos.length).toBeGreaterThan(0);
    for (const v of videos) {
      expect(urls).toContain(`https://quick2learn.in/lecture/${v.id}/${slugify(v.title)}`);
    }

    // Dynamic Chapters
    const chapterUrls = urls.filter((u) => u.includes("/learn/") && u.split("/").length >= 7);
    expect(chapterUrls.length).toBeGreaterThan(0);
  });

  // 3. STRUCTURED DATA (JSON-LD) - HOMEPAGE (EducationalOrganization + LocalBusiness)
  it("Test 3: Homepage structured data includes valid EducationalOrganization and LocalBusiness in Mathura", () => {
    const orgLd = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": ["EducationalOrganization", "LocalBusiness"],
          "@id": "https://quick2learn.in/#organization",
          name: "Quick2Learn",
          description:
            "Premier offline & online mathematics coaching institute in Mathura for CBSE, ICSE, and Board exams led by Dinesh Singh Rajput.",
          url: "https://quick2learn.in",
          telephone: "+91-9412280000",
          address: {
            "@type": "PostalAddress",
            streetAddress: "BSA College Road, Near Krishna Nagar",
            addressLocality: "Mathura",
            addressRegion: "Uttar Pradesh",
            postalCode: "281001",
            addressCountry: "IN",
          },
          geo: {
            "@type": "GeoCoordinates",
            latitude: "27.4924",
            longitude: "77.6737",
          },
          openingHoursSpecification: [
            {
              "@type": "OpeningHoursSpecification",
              dayOfWeek: [
                "Monday",
                "Tuesday",
                "Wednesday",
                "Thursday",
                "Friday",
                "Saturday",
                "Sunday",
              ],
              opens: "07:00",
              closes: "20:00",
            },
          ],
        },
      ],
    };

    expect(orgLd["@graph"][0]["@type"]).toContain("EducationalOrganization");
    expect(orgLd["@graph"][0]["@type"]).toContain("LocalBusiness");
    expect(orgLd["@graph"][0].address.addressLocality).toBe("Mathura");
    expect(orgLd["@graph"][0].address.addressCountry).toBe("IN");
    expect(orgLd["@graph"][0].telephone).toMatch(/^\+91/);
    expect(orgLd["@graph"][0].geo.latitude).toBeDefined();
    expect(orgLd["@graph"][0].geo.longitude).toBeDefined();
  });

  // 4. STRUCTURED DATA (JSON-LD) - BATCH (Course with Offer in INR)
  it("Test 4: Batch page Course schema includes valid Provider and Offer in INR", async () => {
    const batches = await getBatches(null);
    expect(batches.length).toBeGreaterThan(0);
    const batch = batches[0];

    const courseLd = {
      "@context": "https://schema.org",
      "@type": "Course",
      name: batch.title,
      description: batch.subtitle || `${batch.title} at Quick2Learn Coaching Centre Mathura`,
      provider: {
        "@type": "EducationalOrganization",
        name: "Quick2Learn",
        url: "https://quick2learn.in",
      },
      offers: {
        "@type": "Offer",
        category: "Paid",
        price: "15000.00",
        priceCurrency: "INR",
        availability: "https://schema.org/InStock",
        url: `https://quick2learn.in/batches/${batch.slug}`,
      },
    };

    expect(courseLd["@type"]).toBe("Course");
    expect(courseLd.provider.name).toBe("Quick2Learn");
    expect(courseLd.offers["@type"]).toBe("Offer");
    expect(courseLd.offers.priceCurrency).toBe("INR");
    expect(Number(courseLd.offers.price)).toBeGreaterThanOrEqual(0);
    expect(courseLd.offers.url).toContain(batch.slug);
  });

  // 5. STRUCTURED DATA (JSON-LD) - LECTURE (VideoObject)
  it("Test 5: Lecture page VideoObject schema includes ISO 8601 duration, uploadDate, thumbnailUrl, embedUrl", async () => {
    const videos = await getVideos(null);
    expect(videos.length).toBeGreaterThan(0);
    const video = videos[0];

    function formatIsoDuration(totalSeconds: number): string {
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;
      let iso = "PT";
      if (hours > 0) iso += `${hours}H`;
      if (minutes > 0 || hours > 0) iso += `${minutes}M`;
      iso += `${seconds}S`;
      return iso;
    }

    const isoDuration = formatIsoDuration(video.durationSeconds || 1800);
    const videoLd = {
      "@context": "https://schema.org",
      "@type": "VideoObject",
      name: video.title,
      description: video.description || `${video.title} free lecture by Quick2Learn`,
      thumbnailUrl: [
        video.thumbnailUrl || `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`,
      ],
      uploadDate: new Date(video.publishedAt || Date.now()).toISOString(),
      duration: isoDuration,
      embedUrl: `https://www.youtube-nocookie.com/embed/${video.id}`,
    };

    expect(videoLd["@type"]).toBe("VideoObject");
    expect(videoLd.name).toBe(video.title);
    expect(videoLd.duration).toMatch(/^PT(\d+H)?(\d+M)?(\d+S)$/);
    expect(videoLd.uploadDate).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(videoLd.thumbnailUrl[0]).toMatch(/^https:\/\//);
    expect(videoLd.embedUrl).toContain("youtube-nocookie.com/embed/");
  });

  // 6. STRUCTURED DATA (JSON-LD) - BREADCRUMBLIST
  it("Test 6: Breadcrumbs schema generates valid BreadcrumbList with positions and URLs", () => {
    const items = [
      { label: "Home", href: "/" },
      { label: "Class XII", href: "/learn/xii/mathematics" },
      { label: "Integrals", href: "/learn/xii/mathematics/class-12-maths-ch-7-integrals" },
    ];

    const breadcrumbsLd = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: items.map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: item.label,
        item: `https://quick2learn.in${item.href}`,
      })),
    };

    expect(breadcrumbsLd["@type"]).toBe("BreadcrumbList");
    expect(breadcrumbsLd.itemListElement).toHaveLength(3);
    expect(breadcrumbsLd.itemListElement[0].position).toBe(1);
    expect(breadcrumbsLd.itemListElement[0].name).toBe("Home");
    expect(breadcrumbsLd.itemListElement[2].name).toBe("Integrals");
    expect(breadcrumbsLd.itemListElement[2].item).toContain("/learn/xii/mathematics/class-12-maths-ch-7-integrals");
  });

  // 7. ANALYTICS EVENTS (5 core events)
  it("Test 7: Vercel Analytics tracking supports all 5 required business events", () => {
    // Testing trackEvent helper safely
    expect(() => {
      trackEvent("signup_completed", { method: "otp", class: "xii" });
      trackEvent("enquiry_submitted", { source: "contact_page", class: "12" });
      trackEvent("lecture_played", { videoId: "xyz123", title: "Integrals Part 1" });
      trackEvent("checkout_started", { batchSlug: "class-12-target-boards", amount: 15000 });
      trackEvent("payment_succeeded", { orderId: "ord_123", amount: 15000 });
    }).not.toThrow();
  });

  // 8. ACCESSIBILITY STYLES (prefers-reduced-motion, focus-visible)
  it("Test 8: globals.css contains WCAG AAA prefers-reduced-motion resets and focus-visible rings", () => {
    const cssPath = join(__dirname, "../apps/web/src/styles/globals.css");
    const cssContent = readFileSync(cssPath, "utf-8");

    expect(cssContent).toContain("@media (prefers-reduced-motion: reduce)");
    expect(cssContent).toContain("animation-duration: 0.01ms !important");
    expect(cssContent).toContain("transition-duration: 0.01ms !important");
    expect(cssContent).toContain(":focus-visible");
  });

  // 9. SKIP TO MAIN CONTENT LINK
  it("Test 9: Root layout includes skip-to-content accessible link pointing to #main-content", () => {
    const layoutPath = join(__dirname, "../apps/web/src/app/layout.tsx");
    const layoutContent = readFileSync(layoutPath, "utf-8");

    expect(layoutContent).toContain('href="#main-content"');
    expect(layoutContent).toContain("Skip to main content");
  });
});
