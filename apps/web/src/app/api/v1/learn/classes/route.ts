import { getLearnClasses } from "@/server/data/learn";
import { learnClassesResponseSchema } from "@quick2learn/shared";
import { apiResponse, checkApiRateLimits, handleApiError } from "../../utils";

export async function GET(req: Request) {
  try {
    const rateLimitError = await checkApiRateLimits(req);
    if (rateLimitError) return rateLimitError;

    const data = await getLearnClasses();
    const validated = learnClassesResponseSchema.parse(data);

    return apiResponse.success(validated);
  } catch (err) {
    return handleApiError(err);
  }
}
