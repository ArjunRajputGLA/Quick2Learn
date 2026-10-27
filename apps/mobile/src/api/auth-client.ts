import { createAuthClient } from "better-auth/react";
import { expoClient } from "@better-auth/expo/client";
import { phoneNumberClient, emailOTPClient, oneTimeTokenClient } from "better-auth/client/plugins";
import * as SecureStore from "expo-secure-store";

import { Platform } from "react-native";
import Constants from "expo-constants";

function resolveBaseUrl(): string {
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl) {
    if (!__DEV__ && !envUrl.startsWith("https://")) {
      console.warn("[Security] Enforcing HTTPS on production API URL:", envUrl);
      return envUrl.replace(/^http:\/\//, "https://");
    }
    return envUrl;
  }

  if (__DEV__) {
    // 1. Web environment
    if (Platform.OS === "web") {
      if (typeof window !== "undefined" && window.location?.hostname) {
        return `http://${window.location.hostname}:3000`;
      }
      return "http://localhost:3000";
    }

    // 2. Physical device or simulator connected via Expo packager
    const hostUri =
      Constants.expoConfig?.hostUri ||
      (Constants as any).manifest?.debuggerHost ||
      (Constants as any).manifest2?.extra?.expoGo?.debuggerHost;

    if (hostUri) {
      const host = hostUri.split(":")[0];
      if (host) {
        return `http://${host}:3000`;
      }
    }

    // 3. Android emulator fallback (10.0.2.2 maps to host 127.0.0.1)
    if (Platform.OS === "android") {
      return "http://10.0.2.2:3000";
    }

    // 4. iOS simulator fallback
    return "http://localhost:3000";
  }

  return "https://quick2learn.in";
}

export const baseURL = resolveBaseUrl();

export const authClient = createAuthClient({
  baseURL,
  plugins: [
    expoClient({
      scheme: "q2l",
      storagePrefix: "q2l",
      storage: SecureStore,
    }),
    phoneNumberClient(),
    emailOTPClient(),
    oneTimeTokenClient(),
  ],
});
