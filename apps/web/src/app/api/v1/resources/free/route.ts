import { getFreeResources } from "@/server/data/learn";
import { freeResourcesResponseSchema } from "@quick2learn/shared";
import { apiResponse, checkApiRateLimits, handleApiError } from "../../utils";

export async function GET(req: Request) {
  try {
    const rateLimitError = await checkApiRateLimits(req);
    if (rateLimitError) return rateLimitError;

    const { searchParams } = new URL(req.url);
    const classParam = searchParams.get("class");
    const classLevel = classParam ? parseInt(classParam, 10) : undefined;
    const subjectSlug = searchParams.get("subject") || undefined;

    const data = await getFreeResources({
      classLevel: isNaN(classLevel as number) ? undefined : classLevel,
      subjectSlug,
    });
    const validated = freeResourcesResponseSchema.parse(data);

    return apiResponse.success(validated);
  } catch (err) {
    return handleApiError(err);
  }
}
