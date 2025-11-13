import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  TouchableOpacity,
  Modal,
  Animated,
  TouchableWithoutFeedback,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { BookOpen, History, MessageCircle, Settings, LogOut, X, UserPlus } from "lucide-react-native";
import { useStudent } from "@/components/student/StudentStore";
import { useAuth } from "@/components/auth/AuthStore";
import ProgressStats from "@/components/student/overview/ProgressStats";
import RecentActivity from "@/components/student/overview/RecentActivity";
import NextLessonCard from "@/components/student/overview/NextLessonCard";

export default function StudentOverviewScreen() {
  const router = useRouter();
  const { logout } = useAuth();
  const {
    isLoading,
    isRefreshing,
    studentData,
    progressData,
    recentActivity,
    loadData,
    refreshData,
    toggleActivityExpansion,
  } = useStudent();

  const [showSettingsMenu, setShowSettingsMenu] = useState<boolean>(false);
  const slideAnim = useState(new Animated.Value(300))[0];

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = async () => {
    const success = await refreshData();
    if (success) {
      Alert.alert("Gelukt", "Gegevens zijn bijgewerkt");
    }
  };

  const handleCancelLesson = () => {
    Alert.alert(
      "Les annuleren",
      "Weet je zeker dat je je volgende les wilt annuleren?",
      [
        {
          text: "Nee",
          style: "cancel",
        },
        {
          text: "Ja, annuleren",
          style: "destructive",
          onPress: () => {
            Alert.alert("Geannuleerd", "Je les is geannuleerd");
          },
        },
      ]
    );
  };

  const handleRescheduleLesson = () => {
    Alert.alert("Verplaatsen", "Doorverwijzen naar planning...");
    router.push("/(student-tabs)/planning");
  };

  const handleBookLesson = () => {
    router.push("/(student-tabs)/planning");
  };

  const handleViewHistory = () => {
    Alert.alert("Geschiedenis", "Volledige geschiedenis wordt geladen...");
  };

  const handleContactInstructor = () => {
    Alert.alert(
      `Contact ${studentData.nextLesson.instructor.name}`,
      "Kies een contactmethode",
      [
        {
          text: "Annuleren",
          style: "cancel",
        },
        {
          text: "Bellen",
          onPress: () =>
            Alert.alert(
              "Bellen",
              `Bellen ${studentData.nextLesson.instructor.name}...`
            ),
        },
        {
          text: "Berichten",
          onPress: () =>
            Alert.alert(
              "Berichten",
              `Berichten met ${studentData.nextLesson.instructor.name}`
            ),
        },
      ]
    );
  };

  const openMenu = () => {
    setShowSettingsMenu(true);
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 65,
      friction: 10,
    }).start();
  };

  const closeMenu = () => {
    Animated.timing(slideAnim, {
      toValue: 300,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setShowSettingsMenu(false);
    });
  };

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
            closeMenu();
            console.log("Logging out student...");
            const result = await logout();
            if (result.success) {
              console.log("Logout successful, redirecting to login");
              router.replace("/login");
            } else {
              Alert.alert("Fout", "Er is een probleem opgetreden bij het uitloggen");
            }
          },
        },
      ]
    );
  };

  if (isLoading && !isRefreshing) {
    return (
      <View style={styles.loadingContainer}>
        <Stack.Screen
          options={{
            headerShown: true,
            headerTransparent: true,
            headerTitle: "",
            headerRight: () => (
              <TouchableOpacity
                style={styles.settingsButton}
                onPress={openMenu}
              >
                <Settings color="#2563EB" size={24} />
              </TouchableOpacity>
            ),
          }}
        />
        <Text style={styles.loadingText}>Laden...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTransparent: true,
          headerTitle: "",
          headerRight: () => (
            <TouchableOpacity
              style={styles.settingsButton}
              onPress={openMenu}
            >
              <Settings color="#2563EB" size={24} />
            </TouchableOpacity>
          ),
        }}
      />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor="#2563EB"
          />
        }
      >
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>Welkom terug!</Text>
          <Text style={styles.welcomeSubtitle}>Klaar voor je volgende rijles?</Text>
        </View>
        <NextLessonCard
          nextLesson={studentData.nextLesson}
          onCancel={handleCancelLesson}
          onReschedule={handleRescheduleLesson}
        />
        <ProgressStats progressData={progressData} />
        <RecentActivity
          activities={recentActivity}
          onToggleExpansion={toggleActivityExpansion}
        />
      </ScrollView>

      <View style={styles.fab}>
        <TouchableOpacity
          style={styles.fabButton}
          onPress={handleBookLesson}
          activeOpacity={0.8}
        >
          <BookOpen color="#fff" size={24} />
          <Text style={styles.fabText}>Les boeken</Text>
        </TouchableOpacity>
        <View style={styles.fabSecondary}>
          <TouchableOpacity
            style={styles.fabSecondaryButton}
            onPress={handleViewHistory}
            activeOpacity={0.8}
          >
            <History color="#2563EB" size={20} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.fabSecondaryButton}
            onPress={handleContactInstructor}
            activeOpacity={0.8}
          >
            <MessageCircle color="#2563EB" size={20} />
          </TouchableOpacity>
        </View>
      </View>

      <Modal
        visible={showSettingsMenu}
        animationType="none"
        transparent
        onRequestClose={closeMenu}
      >
        <TouchableWithoutFeedback onPress={closeMenu}>
          <View style={styles.drawerOverlay}>
            <TouchableWithoutFeedback>
              <Animated.View
                style={[
                  styles.drawerMenu,
                  {
                    transform: [{ translateX: slideAnim }],
                  },
                ]}
              >
                <View style={styles.drawerHeader}>
                  <Text style={styles.drawerTitle}>Instellingen</Text>
                  <TouchableOpacity onPress={closeMenu} style={styles.closeButton}>
                    <X color="#6b7280" size={24} />
                  </TouchableOpacity>
                </View>

                <View style={styles.drawerBody}>
                  <TouchableOpacity
                    style={styles.menuButton}
                    onPress={() => {
                      closeMenu();
                      router.push("/find-instructor");
                    }}
                    activeOpacity={0.7}
                  >
                    <UserPlus color="#2563EB" size={20} />
                    <Text style={styles.menuButtonText}>Jouw instructeur</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.logoutButton}
                    onPress={handleLogout}
                    activeOpacity={0.7}
                  >
                    <LogOut color="#EF4444" size={20} />
                    <Text style={styles.logoutButtonText}>Uitloggen</Text>
                  </TouchableOpacity>
                </View>
              </Animated.View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f9fafb",
  },
  loadingText: {
    fontSize: 16,
    color: "#6b7280",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  welcomeSection: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: "700" as const,
    color: "#1f2937",
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: "#6b7280",
  },
  fab: {
    position: "absolute",
    bottom: 90,
    right: 16,
    gap: 12,
    alignItems: "flex-end",
  },
  fabButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#2563EB",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 28,
    shadowColor: "#2563EB",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  fabText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600" as const,
  },
  fabSecondary: {
    flexDirection: "row",
    gap: 8,
  },
  fabSecondaryButton: {
    backgroundColor: "#fff",
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  settingsButton: {
    marginRight: 16,
    padding: 8,
  },
  drawerOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-start",
    alignItems: "flex-end",
  },
  drawerMenu: {
    width: 300,
    height: "100%",
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 10,
  },
  drawerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  drawerTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: "#1f2937",
  },
  closeButton: {
    padding: 4,
  },
  drawerBody: {
    paddingHorizontal: 24,
    paddingTop: 24,
    gap: 12,
  },
  menuButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#EFF6FF",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  menuButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#2563EB",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#FEE2E2",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#EF4444",
  },
});
