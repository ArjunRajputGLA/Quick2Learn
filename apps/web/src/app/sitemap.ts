import type { MetadataRoute } from "next";
import { getFacultyList } from "@/server/data/catalog";
import { getBatches } from "@/server/data/batches";
import { getAllChaptersWithSubject, getVideos } from "@/server/data/videos";
import { classLevelToSlug, slugify } from "@quick2learn/shared";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://quick2learn.in";
  const now = new Date();

  // 1. Static and top-level index routes
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/learn`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    ...["ix", "x", "xi", "xii"].map((c) => ({
      url: `${baseUrl}/learn/${c}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.85,
    })),
    {
      url: `${baseUrl}/about`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/results`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/batches`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/lectures`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.85,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/faq`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/refund-policy`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];

  // 2. Dynamic faculty pages
  let facultyRoutes: MetadataRoute.Sitemap = [];
  try {
    const faculty = await getFacultyList(null);
    facultyRoutes = faculty.map((f) => ({
      url: `${baseUrl}/faculty/${f.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.85,
    }));
  } catch (err) {
    console.warn("Failed to load faculty for sitemap:", err);
  }

  // 3. Dynamic batch pages
  let batchRoutes: MetadataRoute.Sitemap = [];
  try {
    const batches = await getBatches(null);
    batchRoutes = batches.map((b) => ({
      url: `${baseUrl}/batches/${b.slug}`,
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 0.85,
    }));
  } catch (err) {
    console.warn("Failed to load batches for sitemap:", err);
  }

  // 4. Dynamic chapter pages
  let chapterRoutes: MetadataRoute.Sitemap = [];
  try {
    const chapters = await getAllChaptersWithSubject();
    chapterRoutes = chapters.map((c) => {
      const classSlug = classLevelToSlug(c.classLevel) || "xii";
      return {
        url: `${baseUrl}/learn/${classSlug}/${c.subjectSlug}/${c.chapterSlug}`,
        lastModified: now,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      };
    });
  } catch (err) {
    console.warn("Failed to load chapters for sitemap:", err);
  }

  // 5. Dynamic lecture video pages
  let lectureRoutes: MetadataRoute.Sitemap = [];
  try {
    const videos = await getVideos(null);
    lectureRoutes = videos.map((v) => ({
      url: `${baseUrl}/lecture/${v.id}/${slugify(v.title)}`,
      lastModified: v.publishedAt ? new Date(v.publishedAt) : now,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    }));
  } catch (err) {
    console.warn("Failed to load videos for sitemap:", err);
  }

  return [
    ...staticRoutes,
    ...facultyRoutes,
    ...batchRoutes,
    ...chapterRoutes,
    ...lectureRoutes,
  ];
}
