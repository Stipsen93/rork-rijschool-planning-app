import React from "react";
import { Stack } from "expo-router";

export default function StudentLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: "Leerlingen", headerBackTitle: "Terug" }} />
      <Stack.Screen name="personal-info" options={{ title: "Persoonlijke informatie", headerBackTitle: "Terug" }} />
    </Stack>
  );
}