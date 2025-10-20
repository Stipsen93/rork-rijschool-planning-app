import React from "react";
import { Stack } from "expo-router";

export default function StudentsStackLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: "Leerlingen" }} />
    </Stack>
  );
}
