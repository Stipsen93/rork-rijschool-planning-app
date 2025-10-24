import React, { memo } from "react";
import { Platform, StyleSheet, Text, View, Image } from "react-native";
import { Bell, User } from "lucide-react-native";
import { useProfile } from "@/components/settings/ProfileStore";
import { useWorkingHours, DayKey } from "@/components/settings/WorkingHoursStore";
import { useAgenda, AgendaLesson } from "@/components/agenda/AgendaStore";

interface Props {}

const dayKeys: DayKey[] = ["Zondag", "Maandag", "Dinsdag", "Woensdag", "Donderdag", "Vrijdag", "Zaterdag"];

function getWeekDates(date: Date): Date[] {
  const curr = new Date(date);
  const first = curr.getDate() - curr.getDay() + 1;
  const dates: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(curr);
    d.setDate(first + i);
    dates.push(d);
  }
  return dates;
}

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map((v) => parseInt(v, 10));
  return (h || 0) * 60 + (m || 0);
}

function calculateLessonHours(lessons: AgendaLesson[]): number {
  let totalMinutes = 0;
  lessons.forEach((lesson) => {
    const start = toMinutes(lesson.startTime);
    const end = toMinutes(lesson.endTime);
    totalMinutes += end - start;
  });
  return totalMinutes / 60;
}

function calculateScheduledHours(weekDates: Date[], workingHours: any): number {
  let totalMinutes = 0;
  weekDates.forEach((date) => {
    const dayKey = dayKeys[date.getDay()];
    const dayConfig = workingHours[dayKey];
    if (dayConfig?.enabled && dayConfig.ranges) {
      dayConfig.ranges.forEach((range: any) => {
        const start = toMinutes(range.start);
        const end = toMinutes(range.end);
        totalMinutes += end - start;
      });
      if (dayConfig.pauses) {
        dayConfig.pauses.forEach((pause: any) => {
          const start = toMinutes(pause.start);
          const end = toMinutes(pause.end);
          totalMinutes -= end - start;
        });
      }
    }
  });
  return totalMinutes / 60;
}

function getHoursColor(worked: number, scheduled: number): string {
  if (worked < scheduled) return "#22c55e";
  if (Math.abs(worked - scheduled) <= 0.5) return "#000";
  return "#ef4444";
}

function OverviewHeaderComponent({}: Props) {
  const { profile, fullName } = useProfile();
  const { workingHours } = useWorkingHours();
  const { getLessonsForDate } = useAgenda();

  const now = new Date();
  const currentWeekDates = getWeekDates(now);
  const nextWeek = new Date(now);
  nextWeek.setDate(now.getDate() + 7);
  const nextWeekDates = getWeekDates(nextWeek);

  const currentWeekLessons: AgendaLesson[] = [];
  currentWeekDates.forEach((date) => {
    currentWeekLessons.push(...getLessonsForDate(date));
  });
  const hoursWorkedThisWeek = calculateLessonHours(currentWeekLessons);
  const scheduledHoursThisWeek = calculateScheduledHours(currentWeekDates, workingHours);

  const nextWeekLessons: AgendaLesson[] = [];
  nextWeekDates.forEach((date) => {
    nextWeekLessons.push(...getLessonsForDate(date));
  });
  const hoursPlannedNextWeek = calculateLessonHours(nextWeekLessons);
  const scheduledHoursNextWeek = calculateScheduledHours(nextWeekDates, workingHours);

  const thisWeekColor = getHoursColor(hoursWorkedThisWeek, scheduledHoursThisWeek);
  const nextWeekColor = getHoursColor(hoursPlannedNextWeek, scheduledHoursNextWeek);
  return (
    <View style={styles.card} testID="overview-header">
      <View style={styles.row}>
        <View style={styles.avatarBorder}>
          {profile.profileImageUrl ? (
            <Image source={{ uri: profile.profileImageUrl }} style={styles.avatar} resizeMode="cover" />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <User color="#2f95dc" size={28} />
            </View>
          )}
        </View>
        <View style={styles.flex1}>
          <Text style={styles.hello}>Welkom terug,</Text>
          <Text style={styles.name}>{fullName}</Text>
        </View>
        <View style={styles.iconBadge}>
          <Bell size={18} color="#2f95dc" />
        </View>
      </View>

      <View style={styles.hoursContainer}>
        <View style={styles.hoursRow}>
          <Text style={styles.hoursLabel}>Uren gewerkt deze week</Text>
          <View style={styles.hoursValueRow}>
            <Text style={[styles.hoursValue, { color: thisWeekColor }]}>
              {hoursWorkedThisWeek.toFixed(1)}
            </Text>
            <Text style={styles.hoursSeparator}>/</Text>
            <Text style={styles.hoursScheduled}>{scheduledHoursThisWeek.toFixed(1)}</Text>
          </View>
        </View>
        <View style={styles.divider} />
        <View style={styles.hoursRow}>
          <Text style={styles.hoursLabel}>Uren gepland volgende week</Text>
          <View style={styles.hoursValueRow}>
            <Text style={[styles.hoursValue, { color: nextWeekColor }]}>
              {hoursPlannedNextWeek.toFixed(1)}
            </Text>
            <Text style={styles.hoursSeparator}>/</Text>
            <Text style={styles.hoursScheduled}>{scheduledHoursNextWeek.toFixed(1)}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

export const OverviewHeader = memo(OverviewHeaderComponent);

const styles = StyleSheet.create({
  card: {
    width: "100%",
    padding: 16,
    borderRadius: 16,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: Platform.OS === "web" ? 0 : 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  row: { flexDirection: "row", alignItems: "center", gap: 16 },
  avatarBorder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "rgba(47,149,220,0.2)",
  },
  avatar: { width: "100%", height: "100%" },
  avatarPlaceholder: { backgroundColor: "#e5f3ff", alignItems: "center", justifyContent: "center" },
  flex1: { flex: 1 },
  hello: { color: "#6b7280" },
  name: { fontSize: 20, fontWeight: "800" },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(47,149,220,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  hoursContainer: {
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(47,149,220,0.12)",
    backgroundColor: "rgba(47,149,220,0.06)",
    gap: 12,
  },
  hoursRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  hoursLabel: {
    color: "#6b7280",
    fontSize: 13,
    fontWeight: "600",
  },
  hoursValueRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
  },
  hoursValue: {
    fontSize: 20,
    fontWeight: "800",
  },
  hoursSeparator: {
    fontSize: 18,
    color: "#9ca3af",
    fontWeight: "600",
  },
  hoursScheduled: {
    fontSize: 16,
    color: "#6b7280",
    fontWeight: "600",
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(47,149,220,0.12)",
  },
});
