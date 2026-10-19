import { getLearnChapters } from "@/server/data/learn";
import { learnChaptersResponseSchema } from "@quick2learn/shared";
import { apiResponse, checkApiRateLimits, handleApiError, getApiSession } from "../../utils";

export async function GET(req: Request) {
  try {
    const rateLimitError = await checkApiRateLimits(req);
    if (rateLimitError) return rateLimitError;

    const { searchParams } = new URL(req.url);
    const classParam = searchParams.get("class");
    const classLevel = classParam ? parseInt(classParam, 10) : 10;
    const subject = searchParams.get("subject") || "mathematics";

    const session = await getApiSession(req);
    const userId = session?.user?.id;

    const data = await getLearnChapters(isNaN(classLevel) ? 10 : classLevel, subject, userId);
    const validated = learnChaptersResponseSchema.parse(data);

    return apiResponse.success(validated);
  } catch (err) {
    return handleApiError(err);
  }
}
