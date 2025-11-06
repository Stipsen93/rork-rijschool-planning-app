import React from "react";
import { Stack } from "expo-router";

export default function SettingsStackLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: "Instellingen" }} />
      <Stack.Screen name="profile" options={{ title: "Profiel" }} />
      <Stack.Screen name="working-hours" options={{ title: "Werkuren & Vakanties" }} />
      <Stack.Screen name="lesson-configuration" options={{ title: "Les configuratie" }} />
      <Stack.Screen name="packages-hours" options={{ title: "Pakketten/Uren" }} />
      <Stack.Screen name="student-configuration" options={{ title: "Leerling Configuratie" }} />
      <Stack.Screen name="availability-rules" options={{ title: "Beschikbaarheid regels" }} />
      <Stack.Screen name="lesson-card" options={{ title: "Leskaart" }} />
      <Stack.Screen name="notifications" options={{ title: "Meldingen" }} />
    </Stack>
  );
}
