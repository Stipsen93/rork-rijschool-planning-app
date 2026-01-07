import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AgendaProvider } from "@/components/agenda/AgendaStore";
import { WorkingHoursProvider } from "@/components/settings/WorkingHoursStore";
import { SettingsProvider } from "@/components/settings/SettingsStore";
import { StudentsProvider } from "@/components/students/StudentsStore";
import { ProfileProvider } from "@/components/settings/ProfileStore";
import { LessonCardProvider } from "@/components/settings/LessonCardStore";
import { LessonCardDataProvider } from "@/components/lesson-card/LessonCardDataStore";
import { NotificationsProvider } from "@/components/settings/NotificationsStore";
import { AuthProvider } from "@/components/auth/AuthStore";
import { AutoSyncProvider } from "@/components/sync/AutoSyncStore";
import { StudentConfigProvider } from "@/components/settings/StudentConfigStore";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: "Terug" }}>
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="register" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="add-lesson" options={{ presentation: "modal", title: "Les toevoegen" }} />
      <Stack.Screen name="lesson-cancellation-screen" options={{ presentation: "modal", title: "Les annuleren" }} />
      <Stack.Screen name="lesson-card" options={{ presentation: "modal" }} />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
    
    if (Platform.OS === 'web') {
      const style = document.createElement('style');
      style.textContent = `
        input, textarea {
          outline: none !important;
          -webkit-user-select: text !important;
          user-select: text !important;
          cursor: text !important;
        }
        input:focus, textarea:focus {
          outline: none !important;
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <ProfileProvider>
          <SettingsProvider>
            <StudentConfigProvider>
              <NotificationsProvider>
                <LessonCardProvider>
                  <LessonCardDataProvider>
                    <WorkingHoursProvider>
                      <AgendaProvider>
                        <StudentsProvider>
                          <AutoSyncProvider>
                            <RootLayoutNav />
                          </AutoSyncProvider>
                        </StudentsProvider>
                      </AgendaProvider>
                    </WorkingHoursProvider>
                  </LessonCardDataProvider>
                </LessonCardProvider>
              </NotificationsProvider>
            </StudentConfigProvider>
          </SettingsProvider>
        </ProfileProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
