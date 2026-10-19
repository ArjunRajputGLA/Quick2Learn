import { getChapterDetail } from "@/server/data/learn";
import { chapterDetailResponseSchema } from "@quick2learn/shared";
import { apiResponse, checkApiRateLimits, handleApiError, getApiSession } from "../../../utils";

export async function GET(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const rateLimitError = await checkApiRateLimits(req);
    if (rateLimitError) return rateLimitError;

    const { id } = await props.params;
    const session = await getApiSession(req);
    const userId = session?.user?.id;

    const data = await getChapterDetail(id, userId);
    const validated = chapterDetailResponseSchema.parse(data);

    return apiResponse.success(validated);
  } catch (err) {
    return handleApiError(err);
  }
}
