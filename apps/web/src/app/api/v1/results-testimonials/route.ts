import { getResults, getTestimonials } from "@/server/data/catalog";
import { resultsAndTestimonialsResponseSchema } from "@quick2learn/shared";
import { apiResponse, checkApiRateLimits, handleApiError } from "../utils";

export async function GET(req: Request) {
  try {
    const rateLimitError = await checkApiRateLimits(req);
    if (rateLimitError) return rateLimitError;

    const [rawResults, rawTestimonials] = await Promise.all([
      getResults(),
      getTestimonials({ id: "public", email: "", name: "Guest", role: "student" }),
    ]);

    const results = rawResults.map((r) => ({
      id: r.id,
      studentName: r.studentName,
      exam: r.exam,
      year: r.year,
      scoreText: r.scoreText,
      photoKey: r.photoKey || null,
      photoUrl: r.photoKey ? `/api/v1/resources/preview?key=${encodeURIComponent(r.photoKey)}` : null,
      isFeatured: r.isFeatured,
    }));

    const testimonials = rawTestimonials.map((t) => ({
      id: t.id,
      studentName: t.studentName,
      classLevel: t.classLevel,
      year: t.year,
      quote: t.quote,
      photoKey: t.photoKey || null,
      photoUrl: t.photoKey ? `/api/v1/resources/preview?key=${encodeURIComponent(t.photoKey)}` : null,
      videoId: t.videoId || null,
    }));

    const validated = resultsAndTestimonialsResponseSchema.parse({
      results,
      testimonials,
    });

    return apiResponse.success(validated);
  } catch (err) {
    return handleApiError(err);
  }
}
