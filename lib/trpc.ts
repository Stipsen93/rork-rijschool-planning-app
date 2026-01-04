import { createTRPCReact } from "@trpc/react-query";
import { httpLink } from "@trpc/client";
import type { AppRouter } from "@/backend/trpc/app-router";
import superjson from "superjson";
import AsyncStorage from '@react-native-async-storage/async-storage';

export const trpc = createTRPCReact<AppRouter>();

const getBaseUrl = (): string => {
  const envUrl = process.env.EXPO_PUBLIC_RORK_API_BASE_URL;
  if (envUrl) {
    console.log("[trpc] Using EXPO_PUBLIC_RORK_API_BASE_URL:", envUrl);
    return envUrl;
  }

  if (typeof window !== "undefined" && window.location?.origin) {
    console.log("[trpc] Falling back to window.location.origin:", window.location.origin);
    return window.location.origin;
  }

  throw new Error("No base url found, please set EXPO_PUBLIC_RORK_API_BASE_URL");
};

function normalizeBaseUrl(raw: string): string {
  const trimmed = raw.trim().replace(/\/$/, "");
  if (typeof window !== "undefined") {
    const isHttps = window.location?.protocol === "https:";
    if (isHttps && trimmed.startsWith("http://")) return `https://${trimmed.slice("http://".length)}`;
  }
  return trimmed;
}

export const trpcClient = trpc.createClient({
  links: [
    httpLink({
      url: `${normalizeBaseUrl(getBaseUrl())}/api/trpc`,
      transformer: superjson,
      async headers() {
        try {
          const authSession = await AsyncStorage.getItem("auth_session");
          if (authSession) {
            const session = JSON.parse(authSession) as { access_token?: string };
            const token = session?.access_token;
            if (token) {
              return {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              };
            }
          }
        } catch (e) {
          console.log("[trpc] Failed to read auth_session", e);
        }

        return {
          "Content-Type": "application/json",
        };
      },
    }),
  ],
});
