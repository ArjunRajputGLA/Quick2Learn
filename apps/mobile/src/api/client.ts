import { createApiClient } from "@quick2learn/shared";
import { authClient, baseURL } from "./auth-client";
import Constants from "expo-constants";

export const apiClient = createApiClient({
  baseUrl: `${baseURL}/api/v1`,
  getHeaders: async () => {
    let cookie = "";
    try {
      cookie = await authClient.getCookie();
    } catch (err) {
      console.warn("[apiClient] Could not retrieve session cookie:", err);
    }

    const appVersion = Constants.expoConfig?.version || "1.0.0";
    return {
      ...(cookie ? { Cookie: cookie } : {}),
      "X-App-Version": appVersion,
    };
  },
  credentials: "omit",
});
