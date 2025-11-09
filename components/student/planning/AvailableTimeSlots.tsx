import React, { useMemo } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { Clock } from "lucide-react-native";
import { useWorkingHours, type DayKey } from "@/components/settings/WorkingHoursStore";
import { useSettings } from "@/components/settings/SettingsStore";

interface AvailableTimeSlotsProps {
  date: Date;
  onSlotPress?: (startTime: string, endTime: string) => void;
}

function dutchDayName(d: Date): DayKey {
  const idx = d.getDay();
  switch (idx) {
    case 1: return "Maandag";
    case 2: return "Dinsdag";
    case 3: return "Woensdag";
    case 4: return "Donderdag";
    case 5: return "Vrijdag";
    case 6: return "Zaterdag";
    default: return "Zondag";
  }
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map((v) => parseInt(v, 10));
  return (Number.isFinite(h) ? h : 0) * 60 + (Number.isFinite(m) ? m : 0);
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

interface TimeSlot {
  startTime: string;
  endTime: string;
}

function generateTimeSlots(
  workRanges: Array<{ start: string; end: string }>,
  pauses: Array<{ start: string; end: string }>,
  lessonDuration: number,
  breakDuration: number
): TimeSlot[] {
  const slots: TimeSlot[] = [];

  workRanges.forEach((range) => {
    let currentMinutes = timeToMinutes(range.start);
    const endMinutes = timeToMinutes(range.end);

    while (currentMinutes + lessonDuration <= endMinutes) {
      const slotStart = minutesToTime(currentMinutes);
      const slotEnd = minutesToTime(currentMinutes + lessonDuration);

      const overlapsWithPause = pauses.some((pause) => {
        const pauseStart = timeToMinutes(pause.start);
        const pauseEnd = timeToMinutes(pause.end);
        const currentEnd = currentMinutes + lessonDuration;
        
        return (
          (currentMinutes >= pauseStart && currentMinutes < pauseEnd) ||
          (currentEnd > pauseStart && currentEnd <= pauseEnd) ||
          (currentMinutes <= pauseStart && currentEnd >= pauseEnd)
        );
      });

      if (!overlapsWithPause) {
        slots.push({ startTime: slotStart, endTime: slotEnd });
      }

      currentMinutes += lessonDuration + breakDuration;
    }
  });

  return slots;
}

export function AvailableTimeSlots({ date, onSlotPress }: AvailableTimeSlotsProps) {
  const { workingHours } = useWorkingHours();
  const { lessonConfig } = useSettings();

  const dayKey = dutchDayName(date);
  const dayConfig = workingHours?.[dayKey];

  const timeSlots = useMemo(() => {
    if (!dayConfig?.enabled || !dayConfig.ranges || dayConfig.ranges.length === 0) {
      return [];
    }

    const lessonDuration = lessonConfig.baseLessonDuration || 60;
    const breakDuration = lessonConfig.breakBetweenLessons || 15;

    return generateTimeSlots(
      dayConfig.ranges,
      dayConfig.pauses || [],
      lessonDuration,
      breakDuration
    );
  }, [dayConfig, lessonConfig]);

  if (!dayConfig?.enabled) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <Clock size={48} color="#9ca3af" />
          <Text style={styles.emptyTitle}>Geen beschikbare tijdslots</Text>
          <Text style={styles.emptySubtitle}>
            De instructeur werkt niet op deze dag
          </Text>
        </View>
      </View>
    );
  }

  if (timeSlots.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <Clock size={48} color="#9ca3af" />
          <Text style={styles.emptyTitle}>Geen beschikbare tijdslots</Text>
          <Text style={styles.emptySubtitle}>
            Er zijn geen beschikbare tijdslots voor deze dag
          </Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={true}
    >
      <View style={styles.header}>
        <Clock size={20} color="#6366f1" />
        <Text style={styles.headerText}>
          Beschikbare tijdslots ({timeSlots.length})
        </Text>
      </View>

      <View style={styles.slotsGrid}>
        {timeSlots.map((slot, index) => (
          <TouchableOpacity
            key={`${slot.startTime}-${slot.endTime}-${index}`}
            style={styles.slotCard}
            onPress={() => onSlotPress?.(slot.startTime, slot.endTime)}
            activeOpacity={0.7}
          >
            <View style={styles.slotContent}>
              <Text style={styles.slotTime}>
                {slot.startTime} - {slot.endTime}
              </Text>
              <View style={styles.slotBadge}>
                <Text style={styles.slotBadgeText}>
                  {lessonConfig.baseLessonDuration} min
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  headerText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1f2937",
  },
  slotsGrid: {
    gap: 12,
  },
  slotCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  slotContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  slotTime: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  slotBadge: {
    backgroundColor: "#eef2ff",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  slotBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6366f1",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 64,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#374151",
    marginTop: 16,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 8,
    textAlign: "center",
  },
});
