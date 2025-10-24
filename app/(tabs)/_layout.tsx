// template
import { Tabs, useRouter, useSegments } from "expo-router";
import { Calendar, LayoutDashboard, Settings, Users } from "lucide-react-native";
import React from "react";
import { Platform } from "react-native";

export default function TabLayout() {
  const router = useRouter();
  const segments = useSegments();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#2563EB",
        headerShown: false,
        tabBarStyle: {
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: 64,
          borderRadius: 0,
          backgroundColor: "#FFFFFF",
          paddingBottom: Platform.OS === "android" ? 8 : 10,
          paddingTop: 8,
        },
        tabBarItemStyle: {
          paddingVertical: 4,
        },
        tabBarLabelStyle: {
          fontSize: 12.6,
        },
      }}
    >
      <Tabs.Screen
        name="agenda"
        options={{
          title: "Agenda",
          tabBarLabel: "Agenda",
          tabBarIcon: ({ color }) => <Calendar color={color} size={25.2} />,
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: "Overzicht",
          tabBarLabel: "Overzicht",
          tabBarIcon: ({ color }) => <LayoutDashboard color={color} size={25.2} />,
        }}
      />
      <Tabs.Screen
        name="students"
        options={{
          title: "Leerlingen",
          tabBarLabel: "Leerlingen",
          tabBarIcon: ({ color }) => <Users color={color} size={25.2} />,
        }}
        listeners={{
          tabPress: (e) => {
            if (segments.length > 0 && segments[0] === "students" && segments.length > 1) {
              e.preventDefault();
              router.push("/students");
            }
          },
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Instellingen",
          href: null,
          tabBarIcon: ({ color }) => <Settings color={color} size={25.2} />,
        }}
      />
    </Tabs>
  );
}
