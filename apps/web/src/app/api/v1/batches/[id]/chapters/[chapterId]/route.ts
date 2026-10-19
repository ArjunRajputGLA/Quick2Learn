import { getBatchChapterContent } from "@/server/data/batch-content";
import { batchChapterContentResponseSchema } from "@quick2learn/shared";
import {
  apiResponse,
  checkApiRateLimits,
  handleApiError,
  getApiSession,
} from "../../../../utils";

export async function GET(
  req: Request,
  props: { params: Promise<{ id: string; chapterId: string }> }
) {
  try {
    const session = await getApiSession(req);
    const userId = session?.user?.id || null;

    const rateLimitError = await checkApiRateLimits(req, userId);
    if (rateLimitError) return rateLimitError;

    const { id, chapterId } = await props.params;
    const data = await getBatchChapterContent(userId, id, chapterId);

    const validated = batchChapterContentResponseSchema.parse(data);
    return apiResponse.success(validated);
  } catch (err) {
    return handleApiError(err);
  }
}
