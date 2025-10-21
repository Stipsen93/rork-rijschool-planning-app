// template
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { trpc, trpcClient } from "@/lib/trpc";
import { AgendaProvider } from "@/components/agenda/AgendaStore";
import { WorkingHoursProvider } from "@/components/settings/WorkingHoursStore";
import { SettingsProvider } from "@/components/settings/SettingsStore";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: "Terug" }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="add-lesson" options={{ presentation: "modal", title: "Les toevoegen" }} />
      <Stack.Screen name="lesson-cancellation-screen" options={{ presentation: "modal", title: "Les annuleren" }} />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <SettingsProvider>
            <WorkingHoursProvider>
              <AgendaProvider>
                <RootLayoutNav />
              </AgendaProvider>
            </WorkingHoursProvider>
          </SettingsProvider>
        </GestureHandlerRootView>
      </QueryClientProvider>
    </trpc.Provider>
  );
}
