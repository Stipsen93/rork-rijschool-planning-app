import React from "react";
import { Stack } from "expo-router";

export default function AgendaStackLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: "Agenda" }} />
    </Stack>
  );
}
