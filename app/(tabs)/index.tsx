import React, { useCallback, useMemo, useState } from "react";
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { NextAppointment, Appointment } from "@/components/overview/NextAppointment";
import { OverviewHeader } from "@/components/overview/OverviewHeader";
import { PerformanceMetricsCard, PerformanceMetrics } from "@/components/overview/PerformanceMetrics";
import { StudentActivityDashboard } from "@/components/overview/StudentActivityDashboard";
import { Settings } from "lucide-react-native";
import { useRouter } from "expo-router";
import { useAgenda } from "@/components/agenda/AgendaStore";
import { useStudents } from "@/components/students/StudentsStore";

function computeNextAppointment(lessonsByDate: Record<string, Array<{id: string, studentName?: string, lessonType?: string, startTime: string, endTime: string, date: Date}>>): Appointment | null {
  const now = new Date();
  let next: Appointment | null = null;
  let nextTime = Infinity;
  Object.values(lessonsByDate).forEach((list) => {
    list.forEach((l) => {
      const [hh, mm] = l.startTime.split(":").map((n) => Number(n));
      const dt = new Date(l.date.getFullYear(), l.date.getMonth(), l.date.getDate(), hh || 0, mm || 0).getTime();
      if (dt > now.getTime() && dt < nextTime) {
        nextTime = dt;
        next = {
          studentName: l.studentName || "Onbekende leerling",
          lessonType: l.lessonType || "Les",
          startTime: l.startTime,
          endTime: l.endTime,
          date: l.date,
        };
      }
    });
  });
  return next;
}



export default function InstructorOverview() {
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const router = useRouter();
  const { lessonsByDate } = useAgenda();
  const { studentActivity } = useStudents();

  const nextAppointment = useMemo(() => computeNextAppointment(lessonsByDate), [lessonsByDate]);
  const metrics: PerformanceMetrics = useMemo(
    () => ({ completionRate: 96.5, studentSatisfaction: 4.8, averageLessonDuration: 52.5 }),
    [],
  );

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

          <OverviewHeader />

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
