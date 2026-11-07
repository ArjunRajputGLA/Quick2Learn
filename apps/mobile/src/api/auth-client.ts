import { createAuthClient } from "better-auth/react";
import { expoClient } from "@better-auth/expo/client";
import { phoneNumberClient, emailOTPClient, oneTimeTokenClient } from "better-auth/client/plugins";
import * as SecureStore from "expo-secure-store";

import { Platform } from "react-native";
import Constants from "expo-constants";

function resolveBaseUrl(): string {
  const envUrl = process.env.EXPO_PUBLIC_API_URL;

  // 1. In production, enforce HTTPS
  if (!__DEV__) {
    if (envUrl) {
      return envUrl.startsWith("https://") ? envUrl : envUrl.replace(/^http:\/\//, "https://");
    }
    return "https://quick2learn.in";
  }

  // 2. In development:
  // If running in a web browser
  if (Platform.OS === "web") {
    if (typeof window !== "undefined" && window.location?.hostname) {
      return `http://${window.location.hostname}:3000`;
    }
    return envUrl || "http://localhost:3000";
  }

  // If envUrl is explicitly set to a custom non-localhost IP/URL, use it
  if (envUrl && !envUrl.includes("localhost") && !envUrl.includes("127.0.0.1")) {
    return envUrl;
  }

  // Physical device or simulator connected via Expo Go / Metro packager
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

  // Android emulator fallback (10.0.2.2 maps to host 127.0.0.1)
  if (Platform.OS === "android") {
    return "http://10.0.2.2:3000";
  }

  // iOS simulator fallback
  return "http://localhost:3000";
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
