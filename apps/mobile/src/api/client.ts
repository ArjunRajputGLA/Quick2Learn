import { createApiClient } from "@quick2learn/shared";
import { authClient, baseURL } from "./auth-client";
import Constants from "expo-constants";

// Fast-failing fetch with 4-second timeout to prevent hanging on cold starts
const timedFetch: typeof fetch = async (input, init) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4000);
  try {
    const res = await fetch(input, {
      ...init,
      signal: init?.signal || controller.signal,
    });
    return res;
  } finally {
    clearTimeout(timeoutId);
  }
};

export const apiClient = createApiClient({
  baseUrl: `${baseURL}/api/v1`,
  customFetch: timedFetch,
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
