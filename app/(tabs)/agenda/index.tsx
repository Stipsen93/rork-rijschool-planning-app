import React, { useCallback, useMemo, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AgendaHeader } from "@/components/agenda/AgendaHeader";
import { DayStrip } from "@/components/agenda/DayStrip";
import { MonthlyView } from "@/components/agenda/MonthlyView";
import { LessonCard } from "@/components/agenda/LessonCard";
import { TimeGrid } from "@/components/agenda/TimeGrid";
import { LessonDetailSheet } from "@/components/agenda/LessonDetailSheet";
import { useRouter, useFocusEffect } from "expo-router";
import { Plus } from "lucide-react-native";
import { useAgenda } from "@/components/agenda/AgendaStore";

export type Lesson = { id?: string | number; studentName?: string; lessonType?: string; startTime: string; endTime: string; date: Date; status?: string; location?: string; notes?: string };

function keyFor(date: Date): string {
  const y = date.getFullYear();
  const m = (date.getMonth() + 1).toString().padStart(2, "0");
  const d = date.getDate().toString().padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function minutesBetween(start: string, end: string): number {
  const [sh, sm] = start.split(":").map((v) => parseInt(v, 10));
  const [eh, em] = end.split(":").map((v) => parseInt(v, 10));
  const s = (Number.isFinite(sh) ? sh : 0) * 60 + (Number.isFinite(sm) ? sm : 0);
  const e = (Number.isFinite(eh) ? eh : 0) * 60 + (Number.isFinite(em) ? em : 0);
  let diff = e - s;
  if (diff < 0) diff += 24 * 60;
  return diff;
}


export default function AgendaScreen() {
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState<Date>(() => {
    const now = new Date();
    const mondayOffset = (now.getDay() || 7) - 1;
    return new Date(now.getFullYear(), now.getMonth(), now.getDate() - mondayOffset);
  });
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showMonthly, setShowMonthly] = useState<boolean>(false);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);

  useFocusEffect(
    useCallback(() => {
      return () => {
        setSelectedLesson(null);
      };
    }, [])
  );

  const { getLessonsForDate: getLessonsForDateFromStore, lessonsByDate } = useAgenda();
  const insets = useSafeAreaInsets();

  const lessonCounts: Record<string, number> = useMemo(() => {
    const map: Record<string, number> = {};
    Object.entries(lessonsByDate).forEach(([k, arr]) => (map[k] = arr.length));
    return map;
  }, [lessonsByDate]);

  const getLessonsForDate = useCallback((date: Date): Lesson[] => {
    return getLessonsForDateFromStore(date) as Lesson[];
  }, [getLessonsForDateFromStore]);

  const onRefresh = useCallback(() => {
    console.log("Refreshing agenda...");
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 600);
  }, []);

  const onPrevWeek = useCallback(() => {
    setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth(), d.getDate() - 7));
  }, []);
  const onNextWeek = useCallback(() => {
    setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + 7));
  }, []);

  const onDateSelected = useCallback((d: Date) => {
    setSelectedDate(d);
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        testID="agenda-screen"
        contentContainerStyle={[styles.container, { paddingTop: 8 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
      >
        <AgendaHeader
          currentDate={currentDate}
          onPreviousWeek={onPrevWeek}
          onNextWeek={onNextWeek}
          onMonthlyView={() => setShowMonthly(true)}
        />

        <DayStrip
          currentWeekStart={currentDate}
          selectedDate={selectedDate}
          onDateSelected={onDateSelected}
          lessonCounts={lessonCounts}
        />

        <TimeGrid
          date={selectedDate}
          onLessonPress={(id) => {
            const l = getLessonsForDate(selectedDate).find((x) => String((x as any).id) === id);
            if (l) setSelectedLesson(l);
          }}
        />

        <View style={{ height: 40 }} />
      </ScrollView>

      {showMonthly && (
        <MonthlyView
          focusedDay={selectedDate}
          selectedDay={selectedDate}
          onDaySelected={(sel) => {
            setSelectedDate(sel);
            setCurrentDate(new Date(sel.getFullYear(), sel.getMonth(), sel.getDate() - ((sel.getDay() || 7) - 1)));
            setShowMonthly(false);
          }}
          lessons={lessonsByDate}
          onClose={() => setShowMonthly(false)}
        />
      )}

      {!!selectedLesson && (
        <LessonDetailSheet
          lesson={{
            ...selectedLesson,
            duration: 60,
            studentProgress: { totalLessons: 24, hoursCompleted: 18, theoryScore: 82, examReady: false },
            lessonHistory: [
              { date: new Date(), notes: "Kijken in spiegels verbeteren" },
              { date: new Date(Date.now() - 7 * 86400000), notes: "Parkeren geoefend" },
            ],
          }}
          onClose={() => setSelectedLesson(null)}
          onEdit={() => {
            if (!selectedLesson) return;
            const y = selectedLesson.date.getFullYear();
            const m = (selectedLesson.date.getMonth() + 1).toString().padStart(2, "0");
            const d = selectedLesson.date.getDate().toString().padStart(2, "0");
            const durationMin = minutesBetween(selectedLesson.startTime, selectedLesson.endTime);
            const id = (selectedLesson as any).id ? String((selectedLesson as any).id) : "";
            setSelectedLesson(null);
            router.push({
              pathname: "/add-lesson",
              params: {
                mode: "edit",
                id,
                date: `${y}-${m}-${d}`,
                time: selectedLesson.startTime,
                durationMinutes: String(durationMin),
                type: selectedLesson.lessonType ?? "Rijles",
                location: selectedLesson.location ?? "",
                notes: selectedLesson.notes ?? "",
              },
            });
          }}
          onCancel={() => {
            const lessonParam = JSON.stringify({
              id: (selectedLesson as any)?.id ?? "",
              studentName: selectedLesson?.studentName,
              lessonType: selectedLesson?.lessonType,
              startTime: selectedLesson?.startTime,
              endTime: selectedLesson?.endTime,
              date: selectedLesson?.date?.toString(),
            });
            setSelectedLesson(null);
            router.push({ pathname: "/lesson-cancellation-screen", params: { lesson: lessonParam } });
          }}
        />
      )}

      {!selectedLesson && (
        <TouchableOpacity
          testID="fab-add-lesson"
          onPress={() => {
            console.log("Open add lesson modal");
            const y = selectedDate.getFullYear();
            const m = (selectedDate.getMonth() + 1).toString().padStart(2, "0");
            const d = selectedDate.getDate().toString().padStart(2, "0");
            router.push({ pathname: "/add-lesson", params: { date: `${y}-${m}-${d}` } });
          }}
          activeOpacity={0.8}
          style={[styles.fab, { bottom: insets.bottom + 56 }]}
          accessibilityRole="button"
          accessibilityLabel="Les toevoegen"
        >
          <Plus color="#fff" size={24} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 120,
    gap: 12,
  },
  sectionHeader: { marginTop: 8 },
  sectionTitle: { fontSize: 16, fontWeight: "700" },
  fab: {
    position: "absolute",
    right: 16,
    bottom: 28,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#2563eb",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
});
