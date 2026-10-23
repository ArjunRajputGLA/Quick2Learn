import { getResults, getTestimonials } from "@/server/data/catalog";
import { resultsAndTestimonialsResponseSchema } from "@quick2learn/shared";
import { db, schema } from "@quick2learn/db";
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

export async function POST(req: Request) {
  try {
    const rateLimitError = await checkApiRateLimits(req);
    if (rateLimitError) return rateLimitError;

    const body = await req.json();
    const { type, studentName, classLevel, year, quote, videoId, exam, scoreText, isFeatured } = body;

    if (!studentName) {
      return apiResponse.badRequest("Student name is required");
    }

    if (type === "result") {
      const [inserted] = await db
        .insert(schema.results)
        .values({
          studentName: String(studentName).trim(),
          exam: String(exam || "CBSE Class XII Maths").trim(),
          year: Number(year) || new Date().getFullYear(),
          scoreText: String(scoreText || "100/100").trim(),
          isFeatured: Boolean(isFeatured),
          sortOrder: 0,
        })
        .returning();

      return apiResponse.success({ result: inserted });
    } else {
      // Default to testimonial
      const [inserted] = await db
        .insert(schema.testimonials)
        .values({
          studentName: String(studentName).trim(),
          classLevel: Number(classLevel) || 12,
          year: Number(year) || new Date().getFullYear(),
          quote: String(quote || "Great learning experience at Quick2Learn!").trim(),
          videoId: videoId ? String(videoId).trim() : null,
          isPublished: true,
          sortOrder: 0,
        })
        .returning();

      return apiResponse.success({ testimonial: inserted });
    }
  } catch (err) {
    return handleApiError(err);
  }
}
