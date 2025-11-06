import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  TouchableOpacity,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { BookOpen, History, MessageCircle } from "lucide-react-native";
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

  if (isLoading && !isRefreshing) {
    return (
      <View style={styles.loadingContainer}>
        <Stack.Screen options={{ headerShown: false }} />
        <Text style={styles.loadingText}>Laden...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
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
});
