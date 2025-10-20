import React, { useCallback, useMemo, useState } from "react";
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { NextAppointment, Appointment } from "@/components/overview/NextAppointment";
import { OverviewHeader } from "@/components/overview/OverviewHeader";
import { PerformanceMetricsCard, PerformanceMetrics } from "@/components/overview/PerformanceMetrics";
import { StudentActivityDashboard, StudentActivityData, StudentItem } from "@/components/overview/StudentActivityDashboard";
import { Settings } from "lucide-react-native";
import { useRouter } from "expo-router";

function buildMockLessons(): Record<string, Appointment[]> {
  const today = new Date();
  const day = 24 * 60 * 60 * 1000;
  const d = (offset: number) => new Date(today.getTime() + offset * day);
  return {
    [d(0).toDateString()]: [
      { studentName: "Emma van der Berg", lessonType: "Praktijkles", startTime: "10:00", endTime: "11:00", date: d(0) },
    ],
    [d(1).toDateString()]: [
      { studentName: "Lucas Janssen", lessonType: "Theorieles", startTime: "09:00", endTime: "10:00", date: d(1) },
      { studentName: "Sophie de Wit", lessonType: "Praktijkles", startTime: "13:00", endTime: "14:00", date: d(1) },
    ],
    [d(2).toDateString()]: [
      { studentName: "Daan Bakker", lessonType: "Praktijkles", startTime: "15:00", endTime: "16:00", date: d(2) },
    ],
  };
}

function computeNextAppointment(lessons: Record<string, Appointment[]>): Appointment | null {
  const now = new Date();
  let next: Appointment | null = null;
  let nextTime = Infinity;
  Object.values(lessons).forEach((list) => {
    list.forEach((l) => {
      const [hh, mm] = l.startTime.split(":").map((n) => Number(n));
      const dt = new Date(l.date.getFullYear(), l.date.getMonth(), l.date.getDate(), hh || 0, mm || 0).getTime();
      if (dt > now.getTime() && dt < nextTime) {
        nextTime = dt;
        next = l;
      }
    });
  });
  return next;
}

function buildStudentActivity(): StudentActivityData {
  const now = new Date();
  const mk = (name: string, past: number, fut: number, days: number, img: string): StudentItem => ({
    name,
    pastLessons: past,
    futureLessons: fut,
    daysSinceLastLesson: days,
    profileImage: img,
  });
  const list = [
    mk("Emma van der Berg", 4, 3, 5, "https://images.unsplash.com/photo-1494790108755-2616b2e8c7c3?w=150&h=150&fit=crop&crop=face"),
    mk("Lucas Janssen", 5, 2, 3, "https://images.unsplash.com/photo-1511367461989-f85a21fda167?w=150&h=150&fit=crop&crop=face"),
    mk("Sophie de Wit", 8, 4, 2, "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face"),
    mk("Daan Bakker", 2, 1, 12, "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face"),
    mk("Mila Hendriks", 3, 2, 7, "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=150&h=150&fit=crop&crop=face"),
    mk("Liam de Jong", 1, 0, 45, "https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=150&h=150&fit=crop&crop=face"),
    mk("Zoe Visser", 0, 0, 60, "https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?w=150&h=150&fit=crop&crop=face"),
  ];

  const active: StudentItem[] = [];
  const irregular: StudentItem[] = [];
  const nonActive: StudentItem[] = [];
  list.forEach((s) => {
    if (s.pastLessons >= 3 && s.futureLessons >= 2) active.push(s);
    else if (s.pastLessons <= 2 && s.futureLessons === 1) irregular.push(s);
    else if (s.daysSinceLastLesson >= 30 && s.futureLessons === 0) nonActive.push(s);
    else irregular.push(s);
  });
  return { activeStudents: active, irregularStudents: irregular, nonActiveStudents: nonActive };
}

export default function InstructorOverview() {
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const router = useRouter();

  const lessons = useMemo(() => buildMockLessons(), []);
  const nextAppointment = useMemo(() => computeNextAppointment(lessons), [lessons]);
  const weeklyEarnings: { currentWeek: number; trend: number } = useMemo(() => ({ currentWeek: 1250.0, trend: 8.5 }), []);
  const metrics: PerformanceMetrics = useMemo(
    () => ({ completionRate: 96.5, studentSatisfaction: 4.8, averageLessonDuration: 52.5 }),
    [],
  );
  const studentActivity = useMemo(() => buildStudentActivity(), []);

  const onRefresh = useCallback(() => {
    console.log("Refreshing overview data...");
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 600);
  }, []);

  return (
    <ErrorBoundary>
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <ScrollView
          testID="instructor-overview"
          contentContainerStyle={[styles.container, { paddingBottom: 120 }]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          showsVerticalScrollIndicator
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          alwaysBounceVertical
>
          <View style={styles.headerWrap}>
            <Text style={styles.pageTitle}>Overzicht</Text>
            <Pressable
              testID="settings-button"
              accessibilityRole="button"
              accessibilityLabel="Open instellingen"
              onPress={() => {
                console.log("Navigating to settings from Overview");
                router.push("/(tabs)/settings");
              }}
              style={styles.settingsBtn}
            >
              <Settings color="#111" size={22} />
            </Pressable>
          </View>

          <OverviewHeader
            instructorName="Instructeur Jan"
            profileImage="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop&crop=face"
            weeklyEarnings={weeklyEarnings}
          />

          <NextAppointment appointment={nextAppointment} />

          <StudentActivityDashboard studentActivity={studentActivity} />

          <PerformanceMetricsCard metrics={metrics} />

          <View style={{ height: 32 }} />
        </ScrollView>
      </SafeAreaView>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 16,
  },
  headerWrap: { paddingTop: 8, paddingBottom: 4, flexDirection: "row", alignItems: "center" },
  pageTitle: { fontSize: 22, fontWeight: "800", flex: 1 },
  settingsBtn: {
    padding: 8,
    borderRadius: 10,
  },
});
