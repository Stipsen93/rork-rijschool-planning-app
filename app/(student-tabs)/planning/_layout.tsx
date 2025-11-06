import { Stack } from "expo-router";

export default function PlanningLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: "Planning",
          headerLargeTitle: true,
        }}
      />
    </Stack>
  );
}
