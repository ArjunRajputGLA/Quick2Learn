import { getAppConfig } from "@/server/data";
import { appConfigSchema } from "@quick2learn/shared";
import { apiResponse, checkApiRateLimits, handleApiError } from "../../utils";

export async function GET(req: Request) {
  try {
    const rateLimitError = await checkApiRateLimits(req);
    if (rateLimitError) return rateLimitError;

    const config = await getAppConfig();
    const validated = appConfigSchema.parse(config);

    return apiResponse.success(validated);
  } catch (err) {
    return handleApiError(err);
  }
}
