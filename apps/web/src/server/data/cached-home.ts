import { unstable_cache, revalidateTag, revalidatePath } from "next/cache";
import { getSetting, getAllSettings } from "./settings";
import { getLatestVideo, getPopularVideos } from "./videos";
import { getOpenBatchesWithDetails } from "./batches";
import { getFacultyList, getTestimonials, getResults, getPickYourClassData } from "./catalog";

type AsyncFn<T> = () => Promise<T>;

function safeCache<T>(
  fn: AsyncFn<T>,
  keyParts?: string[],
  options?: { tags?: string[]; revalidate?: number | false },
): AsyncFn<T> {
  if (process.env.NODE_ENV === "test" || !process.env.NEXT_RUNTIME) {
    return fn;
  }
  return unstable_cache(fn, keyParts, options);
}

export const getCachedSiteSettings = safeCache(
  async () => getAllSettings(),
  ["site-settings-all"],
  { tags: ["settings"] },
);

export async function getCachedSetting<T = unknown>(key: string): Promise<T | null> {
  const cachedFn = safeCache(
    async () => getSetting<T>(key),
    [`site-setting-${key}`],
    { tags: ["settings"] },
  );
  return cachedFn();
}

export const getCachedLatestVideo = safeCache(
  async () => getLatestVideo(),
  ["latest-video"],
  { tags: ["videos"] },
);

export async function getCachedPopularVideos(filter: "latest" | "most_watched" | "board_exam", limit = 8) {
  const cachedFn = safeCache(
    async () => getPopularVideos(filter, limit),
    [`popular-videos-${filter}-${limit}`],
    { tags: ["videos"] },
  );
  return cachedFn();
}

export const getCachedOpenBatches = safeCache(
  async () => getOpenBatchesWithDetails(),
  ["open-batches-details"],
  { tags: ["batches"] },
);

export const getCachedFacultyList = safeCache(
  async () => getFacultyList(null),
  ["faculty-list-public"],
  { tags: ["faculty", "settings"] },
);

export const getCachedTestimonials = safeCache(
  async () => getTestimonials(null),
  ["testimonials-public"],
  { tags: ["testimonials"] },
);

export const getCachedResults = safeCache(
  async () => getResults(),
  ["results-public"],
  { tags: ["results"] },
);

export const getCachedPickYourClassData = safeCache(
  async () => getPickYourClassData(),
  ["pick-your-class-data"],
  { tags: ["videos", "settings"] },
);


export function revalidateDataTag(tag: "videos" | "batches" | "settings" | "testimonials" | "faculty" | "results") {
  if (process.env.NODE_ENV === "test" || !process.env.NEXT_RUNTIME) {
    return;
  }
  try {
    revalidateTag(tag, { expire: 0 });
  } catch (err) {
    console.warn(`Could not revalidate tag ${tag}:`, err);
  }
}

export function safeRevalidatePath(path: string) {
  if (process.env.NODE_ENV === "test" || !process.env.NEXT_RUNTIME) {
    return;
  }
  try {
    revalidatePath(path);
  } catch (err) {
    console.warn(`Could not revalidate path ${path}:`, err);
  }
}


