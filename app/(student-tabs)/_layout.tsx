import { Tabs } from "expo-router";
import { Calendar, LayoutDashboard, User } from "lucide-react-native";
import React from "react";
import { Platform } from "react-native";

export default function StudentTabLayout() {
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
          height: 76,
          borderRadius: 0,
          backgroundColor: "#FFFFFF",
          paddingBottom: Platform.OS === "android" ? 12 : 14,
          paddingTop: 12,
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
        name="student-overview"
        options={{
          title: "Dashboard",
          tabBarLabel: "Dashboard",
          tabBarIcon: ({ color }) => <LayoutDashboard color={color} size={25.2} />,
        }}
      />
      <Tabs.Screen
        name="planning"
        options={{
          title: "Agenda",
          tabBarLabel: "Agenda",
          tabBarIcon: ({ color }) => <Calendar color={color} size={25.2} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profiel",
          tabBarLabel: "Profiel",
          tabBarIcon: ({ color }) => <User color={color} size={25.2} />,
        }}
      />
    </Tabs>
  );
}
