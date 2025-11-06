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
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { BookOpen, History, MessageCircle, Settings, LogOut, X } from "lucide-react-native";
import { useStudent } from "@/components/student/StudentStore";
import StudentHeader from "@/components/student/overview/StudentHeader";
import NextLessonCard from "@/components/student/overview/NextLessonCard";
import ProgressStats from "@/components/student/overview/ProgressStats";
import RecentActivity from "@/components/student/overview/RecentActivity";

export default function StudentOverviewScreen() {
  const router = useRouter();
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

  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);

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

  const handleLogout = () => {
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
          onPress: () => {
            setShowSettingsModal(false);
            router.replace("/login");
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
                onPress={() => setShowSettingsModal(true)}
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
              onPress={() => setShowSettingsModal(true)}
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
        <StudentHeader studentData={studentData} />
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
        visible={showSettingsModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowSettingsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Instellingen</Text>
              <TouchableOpacity
                onPress={() => setShowSettingsModal(false)}
                style={styles.closeButton}
              >
                <X color="#6b7280" size={24} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <TouchableOpacity
                style={styles.logoutButton}
                onPress={handleLogout}
                activeOpacity={0.7}
              >
                <LogOut color="#EF4444" size={20} />
                <Text style={styles.logoutButtonText}>Uitloggen</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 32,
    minHeight: 200,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: "#1f2937",
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    paddingHorizontal: 24,
    paddingTop: 24,
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
