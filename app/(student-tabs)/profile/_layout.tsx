import { Stack } from "expo-router";

export default function ProfileLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: "Profiel",
          headerLargeTitle: true,
        }}
      />
    </Stack>
  );
}
