import { createAuthClient } from "better-auth/react";
import { expoClient } from "@better-auth/expo/client";
import { phoneNumberClient, emailOTPClient, oneTimeTokenClient } from "better-auth/client/plugins";
import * as SecureStore from "expo-secure-store";

function resolveBaseUrl(): string {
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (__DEV__) {
    return envUrl || "http://10.0.2.2:3000";
  }
  // Production releases MUST strictly use HTTPS
  if (envUrl) {
    if (!envUrl.startsWith("https://")) {
      console.warn("[Security] Enforcing HTTPS on production API URL:", envUrl);
      return envUrl.replace(/^http:\/\//, "https://");
    }
    return envUrl;
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
