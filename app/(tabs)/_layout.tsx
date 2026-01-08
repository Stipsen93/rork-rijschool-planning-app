import { Tabs, useRouter, useSegments } from "expo-router";
import { Calendar, LayoutDashboard, Settings, Users } from "lucide-react-native";
import React, { useEffect } from "react";
import { Platform, View, ActivityIndicator, StyleSheet } from "react-native";
import { useAuth } from "@/components/auth/AuthStore";

export default function TabLayout() {
  const router = useRouter();
  const segments = useSegments();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      console.log('[TabLayout] Not authenticated, redirecting to login');
      router.replace('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    console.log('[TabLayout] Loading auth state...');
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  if (!isAuthenticated) {
    console.log('[TabLayout] Not authenticated, showing nothing');
    return null;
  }

  console.log('[TabLayout] Authenticated, showing tabs');

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
        name="agenda"
        options={{
          title: "Agenda",
          tabBarLabel: "Agenda",
          tabBarIcon: ({ color }) => <Calendar color={color} size={25.2} />,
        }}
      />
      <Tabs.Screen
        name="overview"
        options={{
          title: "Dashboard",
          tabBarLabel: "Dashboard",
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

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
});
