import { searchLibrary } from "@/server/data/learn";
import { librarySearchResponseSchema } from "@quick2learn/shared";
import { apiResponse, checkApiRateLimits, handleApiError } from "../utils";

export async function GET(req: Request) {
  try {
    const rateLimitError = await checkApiRateLimits(req);
    if (rateLimitError) return rateLimitError;

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") || "";
    const classParam = searchParams.get("class");
    const classLevel = classParam ? parseInt(classParam, 10) : undefined;
    const subjectSlug = searchParams.get("subject") || undefined;
    const type = searchParams.get("type") || "all";

    const data = await searchLibrary(q, {
      classLevel: isNaN(classLevel as number) ? undefined : classLevel,
      subjectSlug,
      type,
    });
    const validated = librarySearchResponseSchema.parse(data);

    return apiResponse.success(validated);
  } catch (err) {
    return handleApiError(err);
  }
}
