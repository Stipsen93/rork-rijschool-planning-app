import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuth } from "@/components/auth/AuthStore";
import { LogOut, User, Settings } from "lucide-react-native";

export default function StudentProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { logout, profile } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState<boolean>(false);

  const handleLogout = async () => {
    Alert.alert(
      "Uitloggen",
      "Weet je zeker dat je wilt uitloggen?",
      [
        {
          text: "Annuleren",
          style: "cancel",
        },
        {
          text: "Uitloggen",
          style: "destructive",
          onPress: async () => {
            try {
              setIsLoggingOut(true);
              const result = await logout();
              
              if (result.success) {
                router.replace("/login");
              } else {
                Alert.alert(
                  "Fout",
                  result.error || "Er is een fout opgetreden bij het uitloggen"
                );
              }
            } catch (error) {
              console.error("Logout error:", error);
              Alert.alert(
                "Fout",
                "Er is een fout opgetreden bij het uitloggen"
              );
            } finally {
              setIsLoggingOut(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerSection}>
          <View style={styles.iconContainer}>
            <User color="#2563EB" size={48} strokeWidth={2} />
          </View>
          <Text style={styles.title}>{profile?.full_name || "Student"}</Text>
          <Text style={styles.subtitle}>{profile?.email}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Instellingen</Text>
          
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => Alert.alert("Info", "Deze functionaliteit komt binnenkort")}
          >
            <View style={styles.menuIconWrap}>
              <Settings color="#0ea5e9" size={22} />
            </View>
            <View style={styles.menuTextWrap}>
              <Text style={styles.menuTitle}>Profiel bewerken</Text>
              <Text style={styles.menuSubtitle}>Pas je gegevens aan</Text>
            </View>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          disabled={isLoggingOut}
        >
          <View style={styles.logoutIconWrap}>
            <LogOut color="#ef4444" size={22} />
          </View>
          <View style={styles.logoutTextWrap}>
            <Text style={styles.logoutTitle}>Uitloggen</Text>
          </View>
          {isLoggingOut && (
            <ActivityIndicator color="#ef4444" size="small" />
          )}
        </TouchableOpacity>

        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>Versie 1.0</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    gap: 24,
  },
  headerSection: {
    alignItems: "center",
    gap: 8,
    paddingVertical: 20,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#dbeafe",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: "#1f2937",
  },
  subtitle: {
    fontSize: 14,
    color: "#6b7280",
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: "#1f2937",
    marginBottom: 4,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    gap: 12,
  },
  menuIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#e0f2fe",
  },
  menuTextWrap: {
    flex: 1,
    gap: 2,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#1f2937",
  },
  menuSubtitle: {
    fontSize: 12,
    color: "#6b7280",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    gap: 12,
    marginTop: 12,
  },
  logoutIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fee2e2",
  },
  logoutTextWrap: {
    flex: 1,
  },
  logoutTitle: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#ef4444",
  },
  versionContainer: {
    marginTop: 24,
    paddingVertical: 16,
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  versionText: {
    fontSize: 12,
    color: "#9ca3af",
    fontWeight: "500" as const,
  },
});
