import { createAuthClient } from "better-auth/react";
import { expoClient } from "@better-auth/expo/client";
import { phoneNumberClient, emailOTPClient } from "better-auth/client/plugins";
import * as SecureStore from "expo-secure-store";

export const baseURL = process.env.EXPO_PUBLIC_API_URL || "http://10.0.2.2:3000";

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
  ],
});
